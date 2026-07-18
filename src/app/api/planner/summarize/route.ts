import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Supabase client factory (user-scoped)
function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
      return NextResponse.json(
        { error: 'La API Key de Anthropic no está configurada.' },
        { status: 500 }
      );
    }

    const model = 'claude-haiku-4-5-20251001';

    const authHeader = req.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    const body = await req.json();
    const { planningId, currentContent } = body;

    if (!planningId || !currentContent) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (planningId, currentContent).' },
        { status: 400 }
      );
    }

    let user = null;
    if (planningId === '00000000-0000-0000-0000-000000000000' && process.env.NODE_ENV === 'development') {
      user = { id: '00000000-0000-0000-0000-000000000000' };
    } else {
      if (!bearerToken) {
        return NextResponse.json(
          { error: 'No autorizado. Se requiere token de sesión.' },
          { status: 401 }
        );
      }

      const supabaseClient = makeSupabaseClient(bearerToken);
      const { data: userData, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !userData?.user) {
        return NextResponse.json(
          { error: 'Sesión no válida o expirada.' },
          { status: 401 }
        );
      }
      user = userData.user;
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es tomar una planificación de clase existente en formato JSON y generar un resumen condensado (para el Libro de Clases / Lirmi) y una documentación sintetizada para la UTP.

Queda estrictamente PROHIBIDO incluir los términos "RTI", "Targeted" o "Intensive" en ningún lugar de tu respuesta. Para la diferenciación de actividades de aprendizaje por nivel de logro, debes utilizar ÚNICAMENTE la nomenclatura:
- "Adaptación DUA 1" (para el nivel estándar o general)
- "Adaptación DUA 2" (para el nivel con apoyos)
- "Adaptación DUA 3" (para el nivel de mayor andamiaje)

Debes responder ÚNICAMENTE con un objeto JSON válido que tenga exactamente la siguiente estructura, sin textos introductorios, explicaciones ni etiquetas markdown de código (como \`\`\`json):

{
  "lirmi_summary": {
    "oa_numbers": "Cita únicamente los códigos numéricos de los OAs abordados en la sesión (ej: 'OA 5, OA 19'). No incluyes el texto descriptivo del OA.",
    "class_objective": "Una sola línea que describa de forma muy concreta el objetivo específico de aprendizaje de la sesión.",
    "inicio": "Un resumen de 2 a 4 líneas de las actividades de inicio y activación, sin el guion narrativo completo ni explicaciones de diseño.",
    "desarrollo": "Un resumen de 2 a 4 líneas de las actividades principales de desarrollo de la sesión (ej: modelado, práctica y gamificación), sin diálogos del docente ni tablas de preguntas diferenciadas.",
    "cierre": "Un resumen de 1 o 2 líneas de la actividad de cierre y ticket de salida de la sesión."
  },
  "utp_documentation": {
    "dua_adaptations": {
      "representation": "Una síntesis de 1 o 2 líneas de las adaptaciones de accesibilidad para la representación en esta clase (ej. textos ampliados, apoyos visuales, etc.).",
      "expression": "Una síntesis de 1 o 2 líneas de las adaptaciones para la expresión de los estudiantes (ej. respuestas diferenciadas, alternativas de formato).",
      "engagement": "Una síntesis de 1 o 2 líneas de las adaptaciones para el compromiso y motivación (ej. pausas activas, gamificación)."
    },
    "learning_adaptations": {
      "dua_1": "Una síntesis de 1 o 2 líneas que resuma de qué trata la Adaptación DUA 1 (actividad general o estándar).",
      "dua_2": "Una síntesis de 1 o 2 líneas que resuma de qué trata la Adaptación DUA 2 (actividad con apoyos e intermediaria).",
      "dua_3": "Una síntesis de 1 o 2 líneas que resuma de qué trata la Adaptación DUA 3 (actividad de mayor andamiaje y apoyos directos)."
    },
    "nlp_technique": {
      "opening": "Una síntesis de 1 línea de la frase y dinámica de anclaje inicial.",
      "pause": "Una síntesis de 1 línea de la pausa activa de reactivación cognitiva.",
      "closing": "Una síntesis de 1 línea de la frase de anclaje de salida."
    },
    "rubric_summary": "Una síntesis de 1 o 2 líneas del foco y formato de la rúbrica de heteroevaluación de la clase."
  }
}`;

    const userPrompt = `A partir de la siguiente planificación de clase, genera el resumen condensado para Lirmi y la documentación de UTP sintetizada.
Asegúrate de condensar el contenido real de la clase y no truncar simplemente los textos.

PLANIFICACIÓN COMPLETA:
${JSON.stringify(currentContent, null, 2)}`;

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 2000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    let rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedSummary = JSON.parse(rawText);

    // Save/cache inside database if not the mock uuid
    if (planningId !== '00000000-0000-0000-0000-000000000000') {
      const clientToUse = bearerToken ? makeSupabaseClient(bearerToken) : supabase;
      
      const { data: planningRecord, error: getError } = await clientToUse
        .from('plannings')
        .select('content')
        .eq('id', planningId)
        .single();

      if (!getError && planningRecord) {
        const updatedContent = {
          ...planningRecord.content,
          lirmi_summary: parsedSummary.lirmi_summary,
          utp_documentation: parsedSummary.utp_documentation
        };

        await clientToUse
          .from('plannings')
          .update({ content: updatedContent })
          .eq('id', planningId);
      }
    }

    return NextResponse.json(parsedSummary);
  } catch (err: any) {
    console.error('Error generating planning summary:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al generar el resumen de la planificación.' },
      { status: 500 }
    );
  }
}
