import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

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

    const authHeader = req.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

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

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Falta el contenido de la planificación (content).' },
        { status: 400 }
      );
    }

    const model = 'claude-haiku-4-5-20251001';
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `Eres un asesor pedagógico experto en diseño curricular de colegios chilenos.
Tu tarea es tomar una planificación de clases y generar una versión reducida pensada para el registro rápido en el libro de clases (el libro de firmas de los profesores).
El registro debe ser extremadamente breve (máximo 5 líneas en total) y seguir estrictamente la siguiente estructura:

Objetivo: [objetivo específico redactado en 1-2 líneas]
Actividad principal: [la actividad central del desarrollo en 1-2 líneas]
Evaluación: [el instrumento o tipo de evaluación formativa en 1 línea]

No incluyas explicaciones, introducciones ni saludos. Responde únicamente con el registro formateado.`;

    const userPrompt = `A partir de la siguiente planificación, genera el registro de libro de clases de máximo 5 líneas:

PLANIFICACIÓN:
${JSON.stringify(content, null, 2)}`;

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 400,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    return NextResponse.json({ briefText: rawText });
  } catch (err: any) {
    console.error('Error generating brief log text:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al generar el registro de libro de clases.' },
      { status: 500 }
    );
  }
}
