import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

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
  if (process.env.NODE_ENV === 'development') {
    return 'mock-access-token';
  }
  return null;
}

function sanitizeJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
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
    // 1. Verificar si ya existe en biblioteca_libros
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
      // 2. Claude para parsear el analisis_raw
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
        return NextResponse.json({ error: 'API Key de Anthropic no configurada' }, { status: 500 });
      }

      const anthropic = new Anthropic({ apiKey });
      const systemPrompt = `El siguiente texto es un análisis literario de un libro.
Extrae la información y devuélvela estrictamente como un objeto JSON válido con estos campos exactos:
{
  "titulo": "...",
  "autor": "...",
  "genero": "...",
  "resumen": "...",
  "personajes": [{"nombre": "...", "descripcion": "...", "rol": "...", "relaciones": "..."}],
  "temas": ["tema 1", "tema 2"],
  "conflictos": ["conflicto 1"],
  "simbolos": ["simbolo 1"],
  "vocabulario": [{"palabra": "...", "definicion": "..."}],
  "estructura_narrativa": "...",
  "contexto_historico": "...",
  "valores_mensajes": ["valor 1"],
  "fragmentos_clave": ["cita 1", "cita 2"]
}
No devuelvas explicaciones ni bloques de código markdown, solo el objeto JSON limpio.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Texto del análisis:\n\n${analisis_raw}` }]
      });

      const cleanText = sanitizeJson(response.content[0].type === 'text' ? response.content[0].text : '');
      const parsedJson = JSON.parse(cleanText);

      // 3. Guardar en biblioteca_libros
      const { data: nuevoLibro, error: dbError } = await supabase
        .from('biblioteca_libros')
        .insert({
          titulo: parsedJson.titulo || titulo,
          autor: parsedJson.autor || '',
          genero: parsedJson.genero || '',
          resumen: parsedJson.resumen || '',
          personajes: parsedJson.personajes || [],
          temas: parsedJson.temas || [],
          conflictos: parsedJson.conflictos || [],
          simbolos: parsedJson.simbolos || [],
          vocabulario: parsedJson.vocabulario || [],
          estructura_narrativa: parsedJson.estructura_narrativa || '',
          contexto_historico: parsedJson.contexto_historico || '',
          valores_mensajes: parsedJson.valores_mensajes || [],
          fragmentos_clave: parsedJson.fragmentos_clave || []
        })
        .select('*')
        .single();

      if (dbError) throw dbError;

      libroId = nuevoLibro.id;
      expedienteCompleto = nuevoLibro;
    }

    // 4. Crear registro en lecturas_docente
    const { error: docenteErr } = await supabase
      .from('lecturas_docente')
      .insert({
        user_id: userId,
        libro_id: libroId,
        titulo_manual: titulo,
        granularidad,
        rango_inicio: rango_inicio || null,
        rango_fin: rango_fin || null,
        analisis_raw,
        observaciones
      });

    if (docenteErr) throw docenteErr;

    return NextResponse.json({
      libro_id: libroId,
      expediente: expedienteCompleto
    }, { status: 201 });

  } catch (err: any) {
    console.error('[guardar] Error parsing or saving analysis:', err.message);
    return NextResponse.json({ error: 'Error al procesar el análisis del libro: ' + err.message }, { status: 500 });
  }
}
