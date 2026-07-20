import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

// ── Límite de caracteres para fallback Haiku ──────────────────────────────────
const HAIKU_INPUT_LIMIT = 20000;

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  if (process.env.NODE_ENV === 'development') return 'mock-access-token';
  return null;
}

// ── Limpia delimitadores Markdown del texto pegado ────────────────────────────
function stripMarkdown(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();
}

// ── Valida que el JSON tiene los campos mínimos para biblioteca_libros ─────────
function isValidExpediente(obj: any): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const requiredStrings = ['titulo', 'autor', 'resumen'];
  const requiredArrays  = ['personajes', 'temas'];
  return (
    requiredStrings.every(k => typeof obj[k] === 'string' && obj[k].trim().length > 0) &&
    requiredArrays.every(k => Array.isArray(obj[k]))
  );
}

// ── Intenta parsear el texto como JSON ────────────────────────────────────────
function tryParseJson(text: string): any | null {
  try {
    return JSON.parse(stripMarkdown(text));
  } catch (_e) {
    return null;
  }
}

// ── Convierte texto libre a JSON usando Haiku (fallback) ──────────────────────
async function convertWithHaiku(analisis_raw: string): Promise<{ parsed: any; truncated: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
    throw new Error('API Key de Anthropic no configurada');
  }

  const truncated = analisis_raw.length > HAIKU_INPUT_LIMIT;
  const input = truncated ? analisis_raw.slice(0, HAIKU_INPUT_LIMIT) : analisis_raw;

  const systemPrompt = `Eres un extractor de información literaria. El usuario te entregará un análisis de un libro en texto libre.
Extrae la información y devuélvela ÚNICAMENTE como un objeto JSON válido con estos campos exactos.
No escribas explicaciones. No uses bloques Markdown. Solo el JSON limpio.

{
  "titulo": "...",
  "autor": "...",
  "genero": "...",
  "resumen": "...",
  "personajes": [{"nombre": "...", "descripcion": "...", "rol": "...", "relaciones": "..."}],
  "temas": ["..."],
  "conflictos": ["..."],
  "simbolos": ["..."],
  "vocabulario": [{"palabra": "...", "definicion": "..."}],
  "estructura_narrativa": "...",
  "contexto_historico": "...",
  "valores_mensajes": ["..."],
  "fragmentos_clave": ["..."]
}`;

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Análisis del libro:\n\n${input}` }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = tryParseJson(text);
  return { parsed, truncated };
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const isDev = process.env.NODE_ENV === 'development';
  let userId = '';

  const supabase = makeSupabaseClient(token);

  if (token === 'mock-access-token' && isDev) {
    userId = '00000000-0000-0000-0000-000000000000';
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    userId = userData.user.id;
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { titulo, analisis_raw, granularidad, rango_inicio, rango_fin, observaciones = '' } = body;

  if (!titulo) return NextResponse.json({ error: 'El campo "titulo" es obligatorio' }, { status: 400 });
  if (!analisis_raw) return NextResponse.json({ error: 'El campo "analisis_raw" es obligatorio' }, { status: 400 });

  try {
    // ── 1. Verificar si el libro ya existe en biblioteca ──────────────────────
    const { data: existente } = await supabase
      .from('biblioteca_libros')
      .select('*')
      .ilike('titulo', `%${titulo.trim()}%`);

    let libroId = '';
    let expedienteCompleto: any = null;

    if (existente && existente.length > 0) {
      libroId = existente[0].id;
      expedienteCompleto = existente[0];
    } else {
      // ── 2. Intentar parsear directamente (0 tokens) ───────────────────────
      let parsedJson = tryParseJson(analisis_raw);
      let usedHaiku = false;
      let inputTruncated = false;

      if (!parsedJson || !isValidExpediente(parsedJson)) {
        // ── 3. Fallback: Haiku convierte texto libre a JSON ───────────────
        const result = await convertWithHaiku(analisis_raw);
        parsedJson = result.parsed;
        usedHaiku = true;
        inputTruncated = result.truncated;

        if (!parsedJson || !isValidExpediente(parsedJson)) {
          return NextResponse.json({
            error: 'No fue posible estructurar el análisis. Verifica que el texto sea legible o usa el formato JSON sugerido en el prompt.'
          }, { status: 422 });
        }
      }

      // ── 4. Guardar en biblioteca_libros ───────────────────────────────────
      const { data: nuevoLibro, error: dbError } = await supabase
        .from('biblioteca_libros')
        .insert({
          titulo:              parsedJson.titulo              || titulo,
          autor:               parsedJson.autor               || '',
          genero:              parsedJson.genero              || '',
          resumen:             parsedJson.resumen             || '',
          personajes:          parsedJson.personajes          || [],
          temas:               parsedJson.temas               || [],
          conflictos:          parsedJson.conflictos          || [],
          simbolos:            parsedJson.simbolos            || [],
          vocabulario:         parsedJson.vocabulario         || [],
          estructura_narrativa: parsedJson.estructura_narrativa || '',
          contexto_historico:  parsedJson.contexto_historico  || '',
          valores_mensajes:    parsedJson.valores_mensajes    || [],
          fragmentos_clave:    parsedJson.fragmentos_clave    || []
        })
        .select('*')
        .single();

      if (dbError) throw dbError;

      libroId = nuevoLibro.id;
      expedienteCompleto = nuevoLibro;

      // Log para diagnóstico (no visible al usuario)
      console.log(`[guardar] Procesado con ${usedHaiku ? 'Haiku (fallback)' : 'JSON directo (0 tokens)'}${inputTruncated ? ' — input truncado a 20.000 chars' : ''}`);
    }

    // ── 5. Crear registro en lecturas_docente ─────────────────────────────────
    const { error: docenteErr } = await supabase
      .from('lecturas_docente')
      .insert({
        user_id:        userId,
        libro_id:       libroId,
        titulo_manual:  titulo,
        granularidad,
        rango_inicio:   rango_inicio || null,
        rango_fin:      rango_fin    || null,
        analisis_raw,
        observaciones
      });

    if (docenteErr) throw docenteErr;

    return NextResponse.json({ libro_id: libroId, expediente: expedienteCompleto }, { status: 201 });

  } catch (err: any) {
    console.error('[guardar] Error:', err.message);
    return NextResponse.json({ error: 'Error al procesar el análisis: ' + err.message }, { status: 500 });
  }
}
