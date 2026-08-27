/**
 * POST /api/evaluaciones/generate
 * 3 llamadas Haiku enfocadas: textos → preguntas → rúbrica.
 * Cada call < 20s → total < 55s → sin timeout en Vercel Hobby.
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

function buildTablaEspec(preguntas: any[], oa: string): any {
  const habs = ['Comprensión','Análisis','Evaluación','Aplicación','Síntesis'];
  // Solo preguntas SM — las de desarrollo van en sección aparte numerada 1-N
  const smPreguntas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple');
  return {
    oa_evaluado: oa,
    filas: smPreguntas.map((p: any, i: number) => ({
      habilidad: habs[i % habs.length],
      indicador: `Pregunta ${i+1}: Evaluación del ${oa}`,
      contenido: 'Comprensión lectora',
      tipo_item: 'Selección múltiple',
      n_pregunta: String(p.numero || i+1),
      clave: p.respuesta_correcta || ['A','B','C','D'][i%4],
      ptos: 2,
      ponderacion_pct: Math.round(100 / smPreguntas.length),
    })),
  };
}

async function callHaiku(anthropic: Anthropic, prompt: string, maxTokens: number): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.content[0]?.type === 'text' ? res.content[0].text : '';
}

// ─── CALL A: Textos de lectura ────────────────────────────────────────────────
async function generateTextos(anthropic: Anthropic, params: {
  nivel: string; oa: string; t1: string; t2: string; conDosTextos: boolean; contexto?: string;
}): Promise<any[]> {
  const prompt = `Devuelve SOLO un array JSON con ${params.conDosTextos ? '2 textos' : '1 texto'} de lectura para una evaluación de Lenguaje, nivel ${params.nivel}, sobre: ${params.oa}.
${params.contexto ? `Contexto: ${params.contexto.slice(0, 200)}` : ''}
Texto 1: tipo ${params.t1}, máximo 180 palabras.
${params.conDosTextos ? `Texto 2: tipo ${params.t2}, máximo 120 palabras.` : ''}
Formato JSON:
[{"titulo":"...","tipo":"${params.t1}","contenido":"..."}${params.conDosTextos ? `,{"titulo":"...","tipo":"${params.t2}","contenido":"..."}` : ''}]
Solo el array JSON, sin explicaciones.`;

  const raw = await callHaiku(anthropic, prompt, 900);
  try { return JSON.parse(sanitize(raw)); } catch { return []; }
}

// ─── CALL B: Preguntas ────────────────────────────────────────────────────────
async function generatePreguntas(anthropic: Anthropic, params: {
  nivel: string; oa: string; nMC: number; nDev: number; textos: any[];
}): Promise<any[]> {
  const textosResumen = params.textos.map((t,i) =>
    `Texto ${i+1} (${t.tipo}): ${(t.contenido||'').slice(0, 300)}`
  ).join('\n');

  const clavesDist = ['A','B','C','D'];
  const clavesHint = Array.from({length: params.nMC}, (_,i) => clavesDist[i % 4]).join('');

  const prompt = `Devuelve SOLO un array JSON con preguntas de evaluación para nivel ${params.nivel}, OA: ${params.oa}.

${textosResumen ? `Textos de lectura:\n${textosResumen}` : ''}

Genera:
- ${params.nMC} preguntas de tipo "seleccion_multiple" (enunciado máx 25 palabras, alternativas máx 10 palabras c/u, misma extensión entre sí)
- ${params.nDev} preguntas de tipo "consigna_abierta" (consigna máx 35 palabras)
- Claves distribuidas así (en ese orden exacto): ${clavesHint}

Array JSON, empezando en número 1:
[
  {"numero":1,"tipo":"seleccion_multiple","enunciado":"...","alternativas":["Texto opción A","Texto opción B","Texto opción C","Texto opción D"],"respuesta_correcta":"A","justificacion":"Breve razón pedagógica de por qué A es correcta (máx 12 palabras)."},
  ...
  {"numero":${params.nMC+1},"tipo":"consigna_abierta","enunciado":"...","respuesta_esperada":"Descripción de la respuesta esperada del estudiante en 2-3 oraciones específicas.","criterios_evaluacion":["Criterio pedagógico 1 específico y observable","Criterio pedagógico 2 específico y observable","Criterio pedagógico 3 específico y observable"],"puntaje_maximo":6}
]
IMPORTANTE: En "alternativas", NO incluir la letra (A, B, C, D) dentro del texto. Solo el texto de la opción.
Solo el array, sin texto adicional.`;

  const raw = await callHaiku(anthropic, prompt, 4500);
  try { return JSON.parse(sanitize(raw)); } catch { return []; }
}

// ─── CALL C: Rúbrica ──────────────────────────────────────────────────────────
async function generateRubrica(anthropic: Anthropic, params: {
  nivel: string; oa: string; instrumento: string;
}): Promise<any> {
  const instrDesc: Record<string, string> = {
    rubrica_holistica: `4 niveles: Destacado, Logrado, En Desarrollo, No Logrado.
Cada nivel: {"nombre":"Destacado","descripcion":"[descriptor pedagógico real de 10-15 palabras que describa qué hace el estudiante en este nivel]"}
IMPORTANTE: "descripcion" debe ser texto pedagógico específico, NO simplemente el nombre del nivel.`,
    lista_cotejo: `3 indicadores observables.
Cada uno: {"nombre":"[indicador concreto]","logrado":"Sí","no_logrado":"No","ponderacion_pct":33}`,
    analitica_descriptiva: `3 criterios con 4 niveles descriptivos.
Cada uno: {"nombre":"[criterio]","excelente":"[descriptor 10-15 palabras]","bueno":"[descriptor 10-15 palabras]","suficiente":"[descriptor 10-15 palabras]","insuficiente":"[descriptor 10-15 palabras]","ponderacion_pct":33}
IMPORTANTE: cada descriptor debe describir concretamente el desempeño, no solo decir "Logrado/No logrado".`,
    analitica_cuantitativa: `3 criterios con 4 niveles descriptivos.
Cada uno: {"nombre":"[criterio]","excelente":"[descriptor 10-15 palabras]","bueno":"[descriptor 10-15 palabras]","suficiente":"[descriptor 10-15 palabras]","insuficiente":"[descriptor 10-15 palabras]","ponderacion_pct":33}
IMPORTANTE: cada descriptor debe ser texto pedagógico específico que describa el desempeño del estudiante.`,
    pauta_correccion: `3 criterios de corrección.
Cada uno: {"nombre":"[criterio]","respuesta_modelo":"[respuesta esperada en 15-20 palabras]","puntaje_maximo":2}`,
  };

  const prompt = `Devuelve SOLO el objeto JSON de una rúbrica para evaluación de Lenguaje, nivel ${params.nivel}, OA: ${params.oa}.

${instrDesc[params.instrumento] || params.instrumento}

Formato de respuesta:
{"tipo":"${params.instrumento}","criterios":[...]}

REGLA CRÍTICA: Los descriptores deben ser texto pedagógico REAL y ESPECÍFICO. Nunca uses como descriptor las palabras "Logrado", "En proceso" o "Por lograr" — esas son etiquetas de columna, no descriptores.
Solo el objeto JSON, sin texto adicional.`;

  const raw = await callHaiku(anthropic, prompt, 800);
  try { return JSON.parse(sanitize(raw)); } catch {
    return { tipo: params.instrumento, criterios: [] };
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const supabase = makeSupabase(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      nivel, oa_codes = ['OA_EVAL'], oa_textos = {},
      tipo_evaluacion = 'formativa',
      n_preguntas_multiple = 10, n_preguntas_desarrollo = 0,
      instrumento = 'analitica_cuantitativa',
      titulo = 'Evaluación de Aprendizaje',
      texto_1_tipo = 'argumentativo', texto_2_tipo = 'expositivo',
      establecimiento, docente, fuente = 'tema_libre',
      libro_id, kit_textos, eje = 'Lenguaje y Literatura',
    } = body;

    if (!nivel) {
      return NextResponse.json({ error: 'Falta parámetro nivel' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
      return NextResponse.json({ error: 'API Key de Anthropic no configurada.' }, { status: 500 });
    }

    const oaText = oa_codes.map((c: string) => `${c}: ${oa_textos[c] || c}`).join('; ');
    const nMC  = Math.min(Number(n_preguntas_multiple)  || 10, 25);
    const nDev = Math.min(Number(n_preguntas_desarrollo) || 0, 5);
    const contexto = kit_textos?.length
      ? kit_textos.map((t: any) => t.contenido || '').join(' | ')
      : undefined;

    const anthropic = new Anthropic({ apiKey });

    // 3 llamadas secuenciales y rápidas
    const [textos, preguntas, rubrica] = await Promise.all([
      generateTextos(anthropic, {
        nivel, oa: oaText, t1: texto_1_tipo, t2: texto_2_tipo,
        conDosTextos: nDev > 0, contexto,
      }),
      generatePreguntas(anthropic, { nivel, oa: oaText, nMC, nDev, textos: [] }),
      generateRubrica(anthropic, { nivel, oa: oaText, instrumento }),
    ]);

    const contenidoJson = {
      titulo,
      curso: nivel,
      duracion_min: 90,
      oa: oaText,
      tipo_evaluacion,
      instrumento,
      textos_lectura: textos,
      tabla_especificaciones: buildTablaEspec(preguntas, oaText),
      preguntas,
      rubrica,
    };

    const totalAlternativas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple').length;
    const totalDesarrollo   = preguntas.filter((p: any) => p.tipo !== 'seleccion_multiple').length;
    const puntajeTotal      = preguntas.reduce((sum: number, p: any) =>
      sum + (p.tipo === 'seleccion_multiple' ? 2 : (Number(p.puntaje_maximo) || 6)), 0);

    const { data: evalData, error: evalError } = await supabase
      .from('evaluaciones')
      .insert({
        docente_id: user.id,
        titulo: contenidoJson.titulo,
        nivel, eje, oa_codes,
        tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
        fuente, libro_id: libro_id || null,
        establecimiento: establecimiento || null,
        docente_nombre: docente || null,
        tipo_evaluacion, instrumento,
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
      return NextResponse.json({
        id: `temp-${Date.now()}`,
        titulo, nivel, eje, oa_codes,
        tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
        contenido_json: contenidoJson,
        created_at: new Date().toISOString(),
      });
    }

    await incrementCounter(supabase, user.id, 'evaluations_generated');

    if (preguntas.length > 0) {
      await supabase.from('preguntas_evaluacion').insert(
        preguntas.map((p: any, idx: number) => ({
          evaluacion_id: evalData.id,
          numero: p.numero || (idx + 1),
          tipo: p.tipo === 'seleccion_multiple' ? 'alternativa' : 'desarrollo',
          enunciado: p.enunciado || null,
          alternativas: p.alternativas || null,
          respuesta_correcta: p.respuesta_correcta || null,
          habilidad: 'comprension',
          puntaje_maximo: p.tipo === 'seleccion_multiple' ? 2 : (Number(p.puntaje_maximo) || 6),
        }))
      );
    }

    return NextResponse.json(evalData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
