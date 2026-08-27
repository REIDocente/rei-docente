/**
 * POST /api/evaluaciones/generate
 * Genera una evaluación completa con Claude y la guarda en Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';

export const maxDuration = 60;

function makeSupabase(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: token ? { Authorization: `Bearer ${token}` } : {} } }
  );
}

function sanitize(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function buildPrompt(params: {
  nivel: string;
  oa_codes: string[];
  oa_textos: Record<string, string>;
  tipo_evaluacion: string;
  tipo_preguntas: string;
  n_preguntas_multiple: number;
  n_preguntas_desarrollo: number;
  dificultad: string;
  instrumento: string;
  texto_1_tipo: string;
  texto_2_tipo: string;
  titulo: string;
  kit_textos?: Array<{ titulo?: string; tipo?: string; contenido?: string }> | null;
}): string {
  const {
    nivel, oa_codes, oa_textos, tipo_evaluacion, tipo_preguntas,
    n_preguntas_multiple, n_preguntas_desarrollo, dificultad,
    instrumento, texto_1_tipo, texto_2_tipo, titulo, kit_textos
  } = params;

  const oaList = oa_codes.map(c => `${c}: ${oa_textos[c] || ''}`).join('\n');

  const tieneMultiple = n_preguntas_multiple > 0;
  const tieneDesarrollo = n_preguntas_desarrollo > 0;

  const textoContexto = kit_textos && kit_textos.length > 0
    ? `\nCONTEXTO DEL KIT DE CLASE (usa estos textos como fuente para las preguntas):\n${kit_textos.map((t, i) => `Texto ${i + 1} (${t.tipo || 'general'}): ${t.contenido || ''}`).join('\n\n')}`
    : '';

  const instrumentoLabels: Record<string, string> = {
    rubrica_holistica: 'Holística',
    lista_cotejo: 'Lista de Cotejo',
    analitica_descriptiva: 'Analítica Descriptiva',
    analitica_cuantitativa: 'Analítica Cuantitativa',
    pauta_correccion: 'Pauta de Corrección',
  };

  return `Eres un experto en evaluación educativa chilena. Genera una evaluación completa para Lenguaje y Literatura.

PARÁMETROS:
- Título: ${titulo}
- Nivel: ${nivel}
- Tipo de evaluación: ${tipo_evaluacion}
- OA(s): ${oaList}
- Preguntas selección múltiple: ${n_preguntas_multiple}
- Preguntas de desarrollo: ${n_preguntas_desarrollo}
- Dificultad: ${dificultad}
- Instrumento de evaluación: ${instrumentoLabels[instrumento] || instrumento}
- Texto 1 tipo: ${texto_1_tipo}
- Texto 2 tipo: ${texto_2_tipo}${textoContexto}

INSTRUCCIONES OBLIGATORIAS:
1. Genera ${n_preguntas_multiple > 0 ? `${n_preguntas_multiple} preguntas de selección múltiple (tipo "seleccion_multiple")` : ''} ${n_preguntas_desarrollo > 0 ? `${n_preguntas_desarrollo} preguntas de desarrollo (tipo "consigna_abierta")` : ''}.
2. Todas las alternativas de selección múltiple deben tener extensión similar (evitar que la más larga sea siempre la correcta).
3. Las claves (A/B/C/D) deben estar balanceadas — no concentrar todas las respuestas en una sola letra.
4. Los textos de lectura deben ser originales, adecuados al nivel y relacionados al OA.
5. La tabla de especificaciones debe tener una fila por pregunta con habilidades variadas (Comprensión, Análisis, Evaluación, Aplicación, Síntesis).
6. La rúbrica debe corresponder exactamente al instrumento solicitado (${instrumentoLabels[instrumento] || instrumento}).
7. Responde SOLO con el JSON, sin texto adicional.

ESTRUCTURA JSON EXACTA A DEVOLVER:
{
  "titulo": "${titulo}",
  "curso": "${nivel}",
  "duracion_min": 90,
  "oa": "${oa_codes.join(', ')}",
  "tipo_evaluacion": "${tipo_evaluacion}",
  "instrumento": "${instrumento}",
  "textos_lectura": [
    {
      "titulo": "Título descriptivo del Texto 1",
      "tipo": "${texto_1_tipo}",
      "contenido": "Texto completo de lectura de tipo ${texto_1_tipo}, 3-5 párrafos, adecuado al nivel ${nivel}, relacionado al OA."
    }${tieneMultiple && tieneDesarrollo ? `,
    {
      "titulo": "Título descriptivo del Texto 2",
      "tipo": "${texto_2_tipo}",
      "contenido": "Texto complementario de tipo ${texto_2_tipo}, 2-3 párrafos, adecuado al nivel ${nivel}."
    }` : ''}
  ],
  "tabla_especificaciones": {
    "oa_evaluado": "${oa_codes.join(', ')}",
    "filas": [
      ${Array.from({ length: n_preguntas_multiple + n_preguntas_desarrollo }, (_, i) => {
        const isMc = i < n_preguntas_multiple;
        return `{ "habilidad": "Comprensión", "indicador": "Indicador específico del OA para pregunta ${i + 1}", "contenido": "Contenido evaluado", "tipo_item": "${isMc ? 'Selección múltiple' : 'Desarrollo'}", "n_pregunta": "${i + 1}", "clave": "${isMc ? ['A','B','C','D'][i % 4] : 'Rúbrica'}", "ptos": ${isMc ? 2 : 6}, "ponderacion_pct": ${Math.round(100 / (n_preguntas_multiple + n_preguntas_desarrollo))} }`;
      }).join(',\n      ')}
    ]
  },
  "preguntas": [
    ${tieneMultiple ? `// ${n_preguntas_multiple} preguntas selección múltiple:
    {
      "numero": 1,
      "tipo": "seleccion_multiple",
      "enunciado": "Enunciado completo de la pregunta 1...",
      "alternativas": ["A. Alternativa A con extensión similar a las otras.", "B. Alternativa B con extensión similar a las otras.", "C. Alternativa C con extensión similar a las otras.", "D. Alternativa D con extensión similar a las otras."],
      "respuesta_correcta": "A"
    }` : ''}
    ${tieneDesarrollo ? `// ${n_preguntas_desarrollo} preguntas de desarrollo:
    {
      "numero": ${n_preguntas_multiple + 1},
      "tipo": "consigna_abierta",
      "enunciado": "Pregunta de desarrollo: [Consigna completa y clara]...",
      "criterios_evaluacion": "Descripción de los criterios de evaluación para esta pregunta.",
      "puntaje_maximo": 6
    }` : ''}
  ],
  "rubrica": {
    "tipo": "${instrumento}",
    "criterios": [
      ${instrumento === 'analitica_cuantitativa' ? `
      { "nombre": "Criterio 1 (X pts)", "excelente": "Descripción nivel excelente.", "bueno": "Descripción nivel bueno.", "suficiente": "Descripción nivel suficiente.", "insuficiente": "Descripción nivel insuficiente.", "ponderacion_pct": 50 },
      { "nombre": "Criterio 2 (X pts)", "excelente": "Descripción nivel excelente.", "bueno": "Descripción nivel bueno.", "suficiente": "Descripción nivel suficiente.", "insuficiente": "Descripción nivel insuficiente.", "ponderacion_pct": 50 }` :
      instrumento === 'analitica_descriptiva' ? `
      { "nombre": "Criterio 1", "excelente": "Desc. excelente.", "bueno": "Desc. bueno.", "suficiente": "Desc. suficiente.", "insuficiente": "Desc. insuficiente.", "ponderacion_pct": 50 },
      { "nombre": "Criterio 2", "excelente": "Desc. excelente.", "bueno": "Desc. bueno.", "suficiente": "Desc. suficiente.", "insuficiente": "Desc. insuficiente.", "ponderacion_pct": 50 }` :
      instrumento === 'rubrica_holistica' ? `
      { "nombre": "Destacado", "descripcion": "Desempeño excelente, comprende y aplica la totalidad de los aprendizajes con precisión." },
      { "nombre": "Logrado", "descripcion": "Desempeño adecuado, comprende la mayoría de los aprendizajes con mínimos errores." },
      { "nombre": "En Desarrollo", "descripcion": "Desempeño en proceso, comprende parcialmente los aprendizajes evaluados." },
      { "nombre": "No Logrado", "descripcion": "Desempeño insuficiente, no logra demostrar los aprendizajes mínimos." }` :
      instrumento === 'lista_cotejo' ? `
      { "nombre": "Indicador 1", "logrado": "Descripción del indicador logrado.", "no_logrado": "No demuestra el indicador.", "ponderacion_pct": 50 },
      { "nombre": "Indicador 2", "logrado": "Descripción del indicador logrado.", "no_logrado": "No demuestra el indicador.", "ponderacion_pct": 50 }` :
      `{ "nombre": "Criterio 1", "descripcion": "Criterios de corrección detallados." }`}
    ]
  }
}

Genera el JSON completo con TODOS los ${n_preguntas_multiple + n_preguntas_desarrollo} preguntas reales (no ejemplos). Devuelve SOLO el JSON válido.`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const supabase = makeSupabase(token);

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Trial limit
    const limitCheck = await checkTrialLimit(supabase, user.id, 'evaluations_generated');
    if (limitCheck.blocked) {
      return NextResponse.json({
        error: 'limite_alcanzado',
        reason: limitCheck.reason,
        plan_status: limitCheck.profile?.plan_status,
        renewal_date: limitCheck.renewalDate,
        limit: limitCheck.reason === 'trial_expired' ? 7 : 12,
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      nivel, oa_codes, oa_textos, tipo_evaluacion, tipo_preguntas,
      n_preguntas_multiple = 20, n_preguntas_desarrollo = 0,
      dificultad = 'media', instrumento = 'analitica_cuantitativa',
      titulo, texto_1_tipo = 'argumentativo', texto_2_tipo = 'expositivo',
      establecimiento, docente, fuente = 'tema_libre',
      libro_id, kit_textos, eje = 'Evaluación de Aula',
    } = body;

    if (!nivel || !titulo) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (nivel, titulo)' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
      return NextResponse.json({ error: 'API Key de Anthropic no configurada.' }, { status: 500 });
    }

    const prompt = buildPrompt({
      nivel,
      oa_codes: oa_codes || ['OA_EVAL'],
      oa_textos: oa_textos || {},
      tipo_evaluacion: tipo_evaluacion || 'formativa',
      tipo_preguntas: tipo_preguntas || 'seleccion_multiple',
      n_preguntas_multiple,
      n_preguntas_desarrollo,
      dificultad,
      instrumento,
      texto_1_tipo,
      texto_2_tipo,
      titulo,
      kit_textos,
    });

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 7000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    let contenidoJson: any;
    try {
      contenidoJson = JSON.parse(sanitize(rawText));
    } catch {
      return NextResponse.json({ error: 'Error al procesar la respuesta de la IA. Intenta de nuevo.' }, { status: 500 });
    }

    // Calcular totales para Supabase
    const preguntas = contenidoJson.preguntas || [];
    const totalAlternativas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple').length;
    const totalDesarrollo = preguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo').length;
    const puntajeTotal = preguntas.reduce((sum: number, p: any) => {
      if (p.tipo === 'seleccion_multiple') return sum + 2;
      return sum + (Number(p.puntaje_maximo) || 6);
    }, 0);

    // Guardar en Supabase
    const { data: evalData, error: evalError } = await supabase
      .from('evaluaciones')
      .insert({
        docente_id: user.id,
        titulo: contenidoJson.titulo || titulo,
        nivel: nivel,
        eje: eje,
        oa_codes: oa_codes || [],
        tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
        fuente: fuente,
        libro_id: libro_id || null,
        establecimiento: establecimiento || null,
        docente_nombre: docente || null,
        tipo_evaluacion: tipo_evaluacion || 'formativa',
        instrumento: instrumento,
        contenido_json: contenidoJson,
        total_alternativas: totalAlternativas,
        total_desarrollo: totalDesarrollo,
        puntaje_total: puntajeTotal,
        n_preguntas: preguntas.length,
        estado: 'activa',
      })
      .select()
      .single();

    if (evalError || !evalData) {
      // Si falla el guardado, igual devolvemos el contenido generado con id temporal
      return NextResponse.json({
        id: `temp-${Date.now()}`,
        titulo: contenidoJson.titulo || titulo,
        nivel: nivel,
        eje: eje,
        oa_codes: oa_codes || [],
        tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
        contenido_json: contenidoJson,
        created_at: new Date().toISOString(),
      });
    }

    // Incrementar contador
    await incrementCounter(supabase, user.id, 'evaluations_generated');

    // Guardar preguntas en preguntas_evaluacion
    if (preguntas.length > 0) {
      const preguntasInsert = preguntas.map((p: any, idx: number) => ({
        evaluacion_id: evalData.id,
        numero: p.numero || (idx + 1),
        tipo: p.tipo === 'seleccion_multiple' ? 'alternativa' : 'desarrollo',
        enunciado: p.enunciado || null,
        alternativas: p.alternativas || null,
        respuesta_correcta: p.respuesta_correcta || null,
        habilidad: 'comprension',
        puntaje_maximo: p.tipo === 'seleccion_multiple' ? 2 : (Number(p.puntaje_maximo) || 6),
      }));

      await supabase.from('preguntas_evaluacion').insert(preguntasInsert);
    }

    return NextResponse.json(evalData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
