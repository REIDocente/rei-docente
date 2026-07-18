/**
 * POST /api/evaluaciones/simce
 *
 * Genera un Ensayo SIMCE para 6° Básico o 2° Medio.
 *
 * Modos:
 *   modo=nuevo    → genera todas las preguntas con Claude, las guarda en banco_simce
 *   modo=mensual  → mezcla preguntas del banco del usuario + genera N nuevas con Claude
 *
 * SIMCE 6° Básico: Lectura (comprensión literal, inferencial, crítica-valorativa)
 * SIMCE 2° Medio:  Lectura y Escritura (comprensión lectora, producción escrita, manejo del idioma)
 *
 * Comparte el contador evaluations_generated con el módulo general.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';
import { buildEvaluacionMinimalPrompt } from '@/lib/prompts/promptTemplates';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() || null : null;
}

function sanitizeJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

// ─── SIMCE prompts (server-side only) ────────────────────────────────────────

const SIMCE_HABILIDADES: Record<string, string[]> = {
  '6° Básico': ['comprensión_literal', 'inferencial', 'critica_valorativa'],
  '2° Medio':  ['comprensión_lectora', 'producción_escrita', 'manejo_idioma'],
};

const SIMCE_NIVEL_DESC: Record<string, string> = {
  '6° Básico': `
SIMCE 6° BÁSICO — LECTURA
El SIMCE de Lectura 6° Básico evalúa:
- Comprensión literal: extraer información explícita del texto
- Comprensión inferencial: deducir información no explícita, relacionar partes del texto
- Comprensión crítica-valorativa: opinar fundamentada sobre el texto, reconocer propósito del autor
Textos típicos: narrativos (cuentos, fábulas), informativos (artículos, noticias), discontinuos (avisos, tablas).
Formato: 4 alternativas, sin "Todas/Ninguna de las anteriores". Alternativas de largo similar.`,

  '2° Medio': `
SIMCE 2° MEDIO — LECTURA Y ESCRITURA
El SIMCE de 2° Medio evalúa TRES áreas:
1. Comprensión lectora: textos literarios y no literarios, comprensión profunda, inferencia, propósito comunicativo
2. Producción escrita: redacción de textos con propósito claro, cohesión y coherencia, ortografía y puntuación
3. Manejo del idioma: conjugación verbal, concordancia, vocabulario contextual, conectores lógicos
Textos: mayor complejidad léxica y temática que en básica. Incluir textos argumentativos y literarios.
Formato: 4 alternativas para preguntas de comprensión y manejo. Producción escrita como consigna abierta (sin alternativas).`,
};

function buildSimceSystemPrompt(): string {
  return `Eres un experto en la prueba SIMCE del sistema educativo chileno.
Generas preguntas y ensayos SIMCE de alta calidad en español.

REGLAS ABSOLUTAS (nunca las menciones al docente):
1. Alternativas de selección múltiple con extensión similar (±2-3 palabras entre sí).
2. Distractores plausibles que representen errores conceptuales reales de estudiantes.
3. Posición de la respuesta correcta variada (no siempre la misma letra).
4. NUNCA "Todas las anteriores", "Ninguna de las anteriores", ni combinaciones.
5. Cada pregunta indica su habilidad evaluada.
6. El texto de lectura (si aplica) debe ser breve, adecuado al nivel, con fuente ficticia plausible.

Responde SIEMPRE con JSON válido, sin texto fuera del JSON.`;
}

function buildSimcePrompt(nivel: string, n_nuevas: number, habilidades: string[]): string {
  const nivelDesc = SIMCE_NIVEL_DESC[nivel] ?? '';
  const habStr = habilidades.join(', ');

  return `${nivelDesc}

Genera ${n_nuevas} preguntas SIMCE para el nivel ${nivel}.
Habilidades a cubrir (distribuye equitativamente): ${habStr}.

Para cada pregunta incluye un texto de lectura breve (3-6 oraciones) si la pregunta lo requiere.

Responde con este JSON exacto:
{
  "preguntas": [
    {
      "id_temporal": "q1",
      "nivel": "${nivel}",
      "habilidad": "comprensión_literal|inferencial|critica_valorativa|comprensión_lectora|producción_escrita|manejo_idioma",
      "eje": "Lectura|Escritura",
      "texto_base": "string | null — texto breve de lectura si aplica",
      "enunciado": "string — pregunta clara y precisa",
      "tipo": "seleccion_multiple | consigna_abierta",
      "alternativas": [
        { "letra": "A", "texto": "string", "correcta": false },
        { "letra": "B", "texto": "string", "correcta": true },
        { "letra": "C", "texto": "string", "correcta": false },
        { "letra": "D", "texto": "string", "correcta": false }
      ],
      "justificacion": "string — explicación breve de por qué esa es la respuesta correcta (solo para selección múltiple)"
    }
  ]
}
Para "consigna_abierta" (producción escrita), el campo "alternativas" debe ser [] y agrega "criterios_correccion": ["string"].`;
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth OBLIGATORIA ──────────────────────────────────────────────────────
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado — se requiere sesión activa' }, { status: 401 });
  }

  const supabase = makeSupabaseClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const userId = userData.user.id;

  // ── Trial limit ───────────────────────────────────────────────────────────
  const guard = await checkTrialLimit(supabase, userId, 'evaluations_generated');
  if (guard.blocked) {
    const isActive = guard.profile?.plan_status === 'active';
    return NextResponse.json(
      {
        error: 'limite_alcanzado',
        reason: guard.reason,
        tipo: 'evaluations_generated',
        limit: isActive ? 12 : 6,
        current: guard.profile?.evaluations_generated ?? 0,
        plan_status: guard.profile?.plan_status,
        renewal_date: guard.renewalDate,
      },
      { status: 403 }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const nivel      = (body.nivel as string | undefined)?.trim() ?? '';
  const modo       = ((body.modo as string | undefined) ?? 'nuevo') as 'nuevo' | 'mensual';
  const n_total    = Math.min(40, Math.max(5, Number(body.n_preguntas ?? 20)));

  // Validar nivel SIMCE
  const nivelesSimce = Object.keys(SIMCE_HABILIDADES);
  if (!nivel || !nivelesSimce.includes(nivel)) {
    return NextResponse.json(
      { error: `El ensayo SIMCE solo está disponible para: ${nivelesSimce.join(', ')}` },
      { status: 400 }
    );
  }

  const habilidades = SIMCE_HABILIDADES[nivel];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
    return NextResponse.json({ error: 'API Key de Anthropic no configurada.' }, { status: 500 });
  }
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    return NextResponse.json({ error: 'La variable de entorno ANTHROPIC_MODEL no está configurada.' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  // ── Modo mensual: recuperar preguntas del banco ───────────────────────────
  let preguntasBanco: Array<Record<string, unknown>> = [];
  let n_nuevas = n_total;

  if (modo === 'mensual') {
    const { data: bancoRows } = await supabase
      .from('banco_simce')
      .select('id, texto_pregunta, alternativas, habilidad, eje, oa_code')
      .eq('user_id', userId)
      .eq('nivel', nivel)
      .order('veces_usada', { ascending: true })
      .limit(Math.floor(n_total * 0.6)); // 60% del banco, 40% nuevas

    preguntasBanco = (bancoRows ?? []).map((r) => ({
      id_banco: r.id,
      enunciado: r.texto_pregunta,
      alternativas: r.alternativas,
      habilidad: r.habilidad,
      eje: r.eje,
      tipo: 'seleccion_multiple',
      texto_base: null,
    }));

    // Incrementar veces_usada para las preguntas seleccionadas
    if (preguntasBanco.length > 0) {
      const ids = preguntasBanco.map((p) => p.id_banco as string).filter(Boolean);
      await supabase.rpc('increment_banco_simce_uso', { p_ids: ids }).maybeSingle();
      // RPC simple — si falla, no es crítico
    }

    n_nuevas = Math.max(0, n_total - preguntasBanco.length);
  }

  // ── Generar preguntas nuevas con Claude ───────────────────────────────────
  let preguntasNuevas: Array<Record<string, unknown>> = [];

  if (n_nuevas > 0) {
    try {
      const response = await anthropic.messages.create({
        model:      model,
        max_tokens: 8000,
        system:     [
          {
            type: 'text',
            text: buildSimceSystemPrompt(),
            cache_control: { type: 'ephemeral' }
          }
        ] as any,
        messages:   [{ role: 'user', content: buildSimcePrompt(nivel, n_nuevas, habilidades) }],
      });

      const rawText = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : '';

      const parsed = JSON.parse(sanitizeJson(rawText)) as { preguntas: Array<Record<string, unknown>> };
      preguntasNuevas = parsed.preguntas ?? [];
    } catch (err) {
      console.error('[simce] Claude generation failed:', err instanceof Error ? err.message : err);
      return NextResponse.json(
        { error: 'Error al generar preguntas SIMCE. Por favor intenta de nuevo.' },
        { status: 500 }
      );
    }

    // ── Guardar nuevas preguntas en banco_simce ────────────────────────────
    if (preguntasNuevas.length > 0) {
      const insertRows = preguntasNuevas
        .filter((p) => p.tipo === 'seleccion_multiple')
        .map((p) => ({
          user_id:        userId,
          nivel,
          eje:            (p.eje as string | null) ?? null,
          habilidad:      (p.habilidad as string | null) ?? null,
          texto_pregunta: String(p.enunciado ?? ''),
          alternativas:   p.alternativas ?? [],
          oa_code:        null,
          veces_usada:    1,
        }));

      if (insertRows.length > 0) {
        const { error: bankErr } = await supabase.from('banco_simce').insert(insertRows);
        if (bankErr) {
          console.warn('[simce] Could not save to banco_simce:', bankErr.message);
        }
      }
    }
  }

  // ── Combinar y construir contenido del ensayo ─────────────────────────────
  const todasLasPreguntas = [
    ...preguntasBanco.map((p, i) => ({ ...p, numero: i + 1, fuente: 'banco' })),
    ...preguntasNuevas.map((p, i) => ({
      ...p,
      numero: preguntasBanco.length + i + 1,
      fuente: 'nuevo',
    })),
  ];

  const contenidoJson = {
    titulo:          `Ensayo SIMCE ${nivel} — ${new Date().toLocaleDateString('es-CL')}`,
    nivel,
    modo,
    n_banco:         preguntasBanco.length,
    n_nuevas:        preguntasNuevas.length,
    instrucciones:   `Lee cada pregunta con atención y selecciona la alternativa correcta. Tienes ${Math.ceil(n_total * 1.5)} minutos.`,
    preguntas:       todasLasPreguntas,
  };

  // ── Guardar el ensayo en tabla evaluaciones ───────────────────────────────
  const { data: record, error: dbError } = await supabase
    .from('evaluaciones')
    .insert({
      user_id:        userId,
      nivel,
      eje:            nivel === '6° Básico' ? 'Lectura' : 'Lectura y Escritura',
      oa_codes:       [],
      tipos:          ['prueba'],
      titulo:         contenidoJson.titulo,
      n_preguntas:    todasLasPreguntas.length,
      duracion_min:   Math.ceil(todasLasPreguntas.length * 1.5),
      dificultad:     'mixto',
      contenido_json: contenidoJson,
      simce_ensayo:   true,
    })
    .select('id, titulo, nivel, contenido_json, created_at')
    .single();

  if (dbError) {
    console.error('[simce] DB insert error:', dbError);
    return NextResponse.json({ error: 'Error al guardar el ensayo.' }, { status: 500 });
  }

  // ── Incrementar contador ──────────────────────────────────────────────────
  await incrementCounter(supabase, userId, 'evaluations_generated');

  return NextResponse.json(record, { status: 201 });
}
