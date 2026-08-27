/**
 * POST /api/evaluaciones/generate
 * Genera evaluación con Claude Haiku. Tabla de especificaciones se construye en servidor.
 * Soporta hasta 25 SM + 5 desarrollo sin timeout en Vercel Hobby.
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

// Construye tabla de especificaciones en el servidor (no se le pide a Claude)
function buildTablaEspec(preguntas: any[], oa: string, nMC: number): any {
  const habilidades = ['Comprensión', 'Análisis', 'Evaluación', 'Aplicación', 'Síntesis'];
  const claves = ['A', 'B', 'C', 'D'];
  const filas = preguntas.map((p: any, i: number) => {
    const isMC = p.tipo === 'seleccion_multiple';
    return {
      habilidad: habilidades[i % habilidades.length],
      indicador: `Indicador ${i + 1} del ${oa}`,
      contenido: isMC ? 'Comprensión de lectura' : 'Producción escrita',
      tipo_item: isMC ? 'Selección múltiple' : 'Desarrollo',
      n_pregunta: String(p.numero || i + 1),
      clave: isMC ? (p.respuesta_correcta || claves[i % 4]) : 'Rúbrica',
      ptos: isMC ? 2 : (p.puntaje_maximo || 6),
      ponderacion_pct: Math.round(100 / preguntas.length),
    };
  });
  return { oa_evaluado: oa, filas };
}

function buildPrompt(p: {
  nivel: string; oa: string; tipo_evaluacion: string;
  nMC: number; nDev: number; instrumento: string;
  t1: string; t2: string; titulo: string; contexto?: string;
}): string {
  const instrLabel: Record<string, string> = {
    rubrica_holistica: 'Holística (4 niveles: Destacado/Logrado/En Desarrollo/No Logrado)',
    lista_cotejo: 'Lista de Cotejo (indicadores Sí/No, ponderacion_pct)',
    analitica_descriptiva: 'Analítica Descriptiva (excelente/bueno/suficiente/insuficiente, ponderacion_pct)',
    analitica_cuantitativa: 'Analítica Cuantitativa con puntaje (excelente/bueno/suficiente/insuficiente, ponderacion_pct)',
    pauta_correccion: 'Pauta de Corrección (respuesta modelo por criterio)',
  };

  return `Evaluación Lenguaje y Literatura chilena. Devuelve SOLO JSON válido, sin explicaciones.

Nivel: ${p.nivel} | Evaluación: ${p.tipo_evaluacion} | OA: ${p.oa}
SM: ${p.nMC} preguntas | Desarrollo: ${p.nDev} preguntas
Rúbrica: ${instrLabel[p.instrumento] || p.instrumento}
Texto1: ${p.t1} | Texto2: ${p.t2}
${p.contexto ? `Contexto: ${p.contexto.slice(0, 300)}` : ''}

Reglas: alternativas misma extensión (~15 palabras c/u), claves balanceadas (A B C D equitativos), textos 2-3 párrafos.

{
  "titulo": "${p.titulo}",
  "curso": "${p.nivel}",
  "duracion_min": 90,
  "oa": "${p.oa}",
  "textos_lectura": [
    {"titulo":"[título]","tipo":"${p.t1}","contenido":"[texto ${p.t1} 2-3 párrafos]"}${p.nDev > 0 ? `,{"titulo":"[título]","tipo":"${p.t2}","contenido":"[texto ${p.t2} 2 párrafos]"}` : ''}
  ],
  "preguntas": [
    ${p.nMC > 0 ? `{"numero":1,"tipo":"seleccion_multiple","enunciado":"[enunciado]","alternativas":["A. [~15 palabras]","B. [~15 palabras]","C. [~15 palabras]","D. [~15 palabras]"],"respuesta_correcta":"A"}` : ''}
    ${p.nDev > 0 ? `{"numero":${p.nMC + 1},"tipo":"consigna_abierta","enunciado":"[consigna]","criterios_evaluacion":"[criterios]","puntaje_maximo":6}` : ''}
    /* continuar hasta completar ${p.nMC} SM y ${p.nDev} desarrollo */
  ],
  "rubrica": {
    "tipo": "${p.instrumento}",
    "criterios": [/* 3-4 criterios según ${instrLabel[p.instrumento] || p.instrumento} */]
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
    const nMC  = Math.min(Number(n_preguntas_multiple)  || 10, 25);
    const nDev = Math.min(Number(n_preguntas_desarrollo) || 0, 5);

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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5500,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    let contenidoJson: any;
    try {
      contenidoJson = JSON.parse(sanitize(rawText));
    } catch {
      return NextResponse.json({ error: 'Error al procesar la respuesta de la IA. Intenta de nuevo.' }, { status: 500 });
    }

    // Construir tabla de especificaciones en servidor (no gasta tiempo de Claude)
    const preguntas = contenidoJson.preguntas || [];
    contenidoJson.tabla_especificaciones = buildTablaEspec(preguntas, oaText, nMC);

    const totalAlternativas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple').length;
    const totalDesarrollo   = preguntas.filter((p: any) => p.tipo !== 'seleccion_multiple').length;
    const puntajeTotal      = preguntas.reduce((sum: number, p: any) =>
      sum + (p.tipo === 'seleccion_multiple' ? 2 : (Number(p.puntaje_maximo) || 6)), 0);

    const { data: evalData, error: evalError } = await supabase
      .from('evaluaciones')
      .insert({
        docente_id: user.id,
        titulo: contenidoJson.titulo || titulo,
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
        titulo: contenidoJson.titulo || titulo,
        nivel, eje, oa_codes,
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
