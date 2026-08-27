/**
 * POST /api/evaluaciones/generate
 * Genera una evaluación con Claude (prompt compacto para respetar límite 60s Vercel).
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

// Prompt compacto: genera entre 10-15 preguntas máximo para evitar timeout
function buildPrompt(p: {
  nivel: string; oa: string; tipo_evaluacion: string;
  nMC: number; nDev: number; instrumento: string;
  t1: string; t2: string; titulo: string;
  contexto?: string;
}): string {
  const instrLabels: Record<string, string> = {
    rubrica_holistica: 'Holística (4 niveles: Destacado/Logrado/En Desarrollo/No Logrado)',
    lista_cotejo: 'Lista de Cotejo (Indicadores Sí/No)',
    analitica_descriptiva: 'Analítica Descriptiva (criterios con descriptores)',
    analitica_cuantitativa: 'Analítica Cuantitativa (criterios con puntaje)',
    pauta_correccion: 'Pauta de Corrección (respuestas modelo)',
  };

  return `Genera una evaluación chilena de Lenguaje y Literatura en JSON. Responde SOLO JSON válido.

Nivel: ${p.nivel} | Tipo: ${p.tipo_evaluacion} | OA: ${p.oa}
Selección múltiple: ${p.nMC} preguntas | Desarrollo: ${p.nDev} preguntas
Instrumento rúbrica: ${instrLabels[p.instrumento] || p.instrumento}
Texto 1: ${p.t1} | Texto 2: ${p.t2}
${p.contexto ? `Contexto Kit: ${p.contexto.slice(0, 400)}` : ''}

REGLAS: alternativas de extensión similar, claves balanceadas (A/B/C/D equitativos), textos originales 2-3 párrafos.

JSON a devolver:
{
  "titulo": "${p.titulo}",
  "curso": "${p.nivel}",
  "duracion_min": 90,
  "oa": "${p.oa}",
  "textos_lectura": [
    {"titulo":"...","tipo":"${p.t1}","contenido":"Texto ${p.t1} de 2-3 párrafos relacionado al OA."}${p.nDev > 0 ? `,\n    {"titulo":"...","tipo":"${p.t2}","contenido":"Texto ${p.t2} de 2 párrafos."}` : ''}
  ],
  "tabla_especificaciones": {
    "oa_evaluado": "${p.oa}",
    "filas": [/* una fila por pregunta: {"habilidad":"Comprensión|Análisis|Evaluación|Aplicación","indicador":"...","contenido":"...","tipo_item":"Selección múltiple|Desarrollo","n_pregunta":"1","clave":"A|B|C|D|Rúbrica","ptos":2,"ponderacion_pct":10} */]
  },
  "preguntas": [
    ${p.nMC > 0 ? `/* ${p.nMC} preguntas tipo seleccion_multiple: {"numero":1,"tipo":"seleccion_multiple","enunciado":"...","alternativas":["A. ...","B. ...","C. ...","D. ..."],"respuesta_correcta":"A"} */` : ''}
    ${p.nDev > 0 ? `/* ${p.nDev} preguntas tipo consigna_abierta: {"numero":${p.nMC+1},"tipo":"consigna_abierta","enunciado":"...","criterios_evaluacion":"...","puntaje_maximo":6} */` : ''}
  ],
  "rubrica": {
    "tipo": "${p.instrumento}",
    "criterios": [/* 2-4 criterios según instrumento */]
  }
}`;
}

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
      libro_id, kit_textos, eje = 'Evaluación de Aula',
    } = body;

    if (!nivel) {
      return NextResponse.json({ error: 'Falta parámetro nivel' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
      return NextResponse.json({ error: 'API Key de Anthropic no configurada.' }, { status: 500 });
    }

    const oaText = oa_codes.map((c: string) => `${c}: ${oa_textos[c] || ''}`).join('; ');

    // Limitar preguntas para respetar timeout (máx 12 SM + 3 dev)
    const nMC = Math.min(Number(n_preguntas_multiple) || 10, 12);
    const nDev = Math.min(Number(n_preguntas_desarrollo) || 0, 3);

    const contexto = kit_textos?.length
      ? kit_textos.map((t: any) => t.contenido || '').join(' | ')
      : undefined;

    const prompt = buildPrompt({
      nivel, oa: oaText, tipo_evaluacion,
      nMC, nDev, instrumento,
      t1: texto_1_tipo, t2: texto_2_tipo,
      titulo, contexto,
    });

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Haiku: 3-5x más rápido que Sonnet
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    let contenidoJson: any;
    try {
      contenidoJson = JSON.parse(sanitize(rawText));
    } catch {
      return NextResponse.json({ error: 'Error al procesar la respuesta de la IA. Intenta de nuevo.' }, { status: 500 });
    }

    const preguntas = contenidoJson.preguntas || [];
    const totalAlternativas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple').length;
    const totalDesarrollo = preguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo').length;
    const puntajeTotal = preguntas.reduce((sum: number, p: any) =>
      sum + (p.tipo === 'seleccion_multiple' ? 2 : (Number(p.puntaje_maximo) || 6)), 0);

    const { data: evalData, error: evalError } = await supabase
      .from('evaluaciones')
      .insert({
        docente_id: user.id,
        titulo: contenidoJson.titulo || titulo,
        nivel,
        eje,
        oa_codes,
        tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
        fuente,
        libro_id: libro_id || null,
        establecimiento: establecimiento || null,
        docente_nombre: docente || null,
        tipo_evaluacion,
        instrumento,
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
      // Falla el guardado → devuelve contenido de igual forma con id temporal
      return NextResponse.json({
        id: `temp-${Date.now()}`,
        titulo: contenidoJson.titulo || titulo,
        nivel, eje, oa_codes,
        tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
        contenido_json: contenidoJson,
        created_at: new Date().toISOString(),
      });
    }

    await incrementCounter(supabase, user.id, 'evaluations_generated');

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
