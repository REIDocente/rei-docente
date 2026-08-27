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
    rubrica_holistica: 'Holística (4 niveles)',
    lista_cotejo: 'Lista de Cotejo (Sí/No)',
    analitica_descriptiva: 'Analítica Descriptiva',
    analitica_cuantitativa: 'Analítica Cuantitativa',
    pauta_correccion: 'Pauta de Corrección',
  };

  // Generar array de preguntas SM en el prompt (más eficiente que comentarios)
  const smItems = Array.from({ length: p.nMC }, (_, i) => {
    const clave = ['A','B','C','D'][i % 4];
    return `{"numero":${i+1},"tipo":"seleccion_multiple","enunciado":"ENUNCIADO_${i+1}","alternativas":["A. ALT_A","B. ALT_B","C. ALT_C","D. ALT_D"],"respuesta_correcta":"${clave}"}`;
  }).join(',');

  const devItems = Array.from({ length: p.nDev }, (_, i) =>
    `{"numero":${p.nMC+i+1},"tipo":"consigna_abierta","enunciado":"CONSIGNA_${i+1}","criterios_evaluacion":"CRITERIOS_${i+1}","puntaje_maximo":6}`
  ).join(',');

  return `Eres experto en evaluación chilena. Reemplaza CADA placeholder con contenido real sobre "${p.oa}" para nivel ${p.nivel}. Devuelve SOLO JSON válido.

RESTRICCIONES DE LONGITUD (crítico para velocidad):
- Textos de lectura: máximo 200 palabras cada uno
- Enunciados SM: máximo 30 palabras
- Alternativas: máximo 12 palabras cada una (misma extensión entre sí)
- Claves: distribuir A/B/C/D equitativamente (no repetir la misma letra)
- Consignas desarrollo: máximo 40 palabras
- Criterios rúbrica: 3 criterios, máximo 20 palabras por descriptor
${p.contexto ? `Contexto del kit de clase: ${p.contexto.slice(0, 200)}` : ''}

JSON A COMPLETAR (reemplaza TODO lo que está en MAYÚSCULAS):
{
  "titulo": "${p.titulo}",
  "curso": "${p.nivel}",
  "duracion_min": 90,
  "oa": "${p.oa}",
  "textos_lectura": [
    {"titulo":"TITULO_TEXTO_1","tipo":"${p.t1}","contenido":"TEXTO_${p.t1.toUpperCase()}_MAX_200_PALABRAS_SOBRE_EL_OA"}${p.nDev > 0 ? `,{"titulo":"TITULO_TEXTO_2","tipo":"${p.t2}","contenido":"TEXTO_${p.t2.toUpperCase()}_MAX_200_PALABRAS_COMPLEMENTARIO"}` : ''}
  ],
  "preguntas": [${smItems}${p.nDev > 0 && p.nMC > 0 ? ',' : ''}${devItems}],
  "rubrica": {
    "tipo": "${p.instrumento}",
    "criterios": [
      {"nombre":"CRITERIO_1","excelente":"DESC_EX_1","bueno":"DESC_B_1","suficiente":"DESC_S_1","insuficiente":"DESC_I_1","ponderacion_pct":40},
      {"nombre":"CRITERIO_2","excelente":"DESC_EX_2","bueno":"DESC_B_2","suficiente":"DESC_S_2","insuficiente":"DESC_I_2","ponderacion_pct":35},
      {"nombre":"CRITERIO_3","excelente":"DESC_EX_3","bueno":"DESC_B_3","suficiente":"DESC_S_3","insuficiente":"DESC_I_3","ponderacion_pct":25}
    ]
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
