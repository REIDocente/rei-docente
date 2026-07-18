import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (server-side) ───────────────────────────────────────────

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
}

/**
 * Extracts the Bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 */
function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

// ─── GET /api/cursos ─────────────────────────────────────────────────────────
/**
 * Returns all cursos for the authenticated user, with their horario_semanal
 * rows nested inside each curso as the `horario` array.
 *
 * Response shape:
 * [
 *   {
 *     id, nombre, nivel, seccion, created_at,
 *     horario: [{ id, asignatura, dia_semana, n_bloques, tipo_bloque,
 *                 hora_inicio, hora_fin }]
 *   }
 * ]
 */
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = makeSupabaseClient(token);

  // Verify token & get user
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const userId = userData.user.id;

  // Fetch cursos with nested horario_semanal
  const { data: cursos, error: cursosError } = await supabase
    .from('cursos')
    .select(`
      id,
      nombre,
      nivel,
      seccion,
      created_at,
      horario_semanal (
        id,
        asignatura,
        dia_semana,
        n_bloques,
        tipo_bloque,
        hora_inicio,
        hora_fin
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (cursosError) {
    console.error('[GET /api/cursos] Supabase error:', cursosError);
    return NextResponse.json(
      { error: 'Error al obtener los cursos', detail: cursosError.message },
      { status: 500 }
    );
  }

  // Reshape: rename horario_semanal → horario for a cleaner API surface
  const result = (cursos ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    nivel: c.nivel,
    seccion: c.seccion,
    created_at: c.created_at,
    horario: c.horario_semanal ?? [],
  }));

  return NextResponse.json(result, { status: 200 });
}

// ─── POST /api/cursos ────────────────────────────────────────────────────────
/**
 * Creates a new curso for the authenticated user.
 *
 * Request body: { nombre: string, nivel: string, seccion?: string }
 * Response:     { id, nombre, nivel, seccion, created_at, horario: [] }
 */
export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = makeSupabaseClient(token);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const userId = userData.user.id;

  let body: { nombre?: string; nivel?: string; seccion?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { nombre, nivel, seccion } = body;

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El campo "nombre" es obligatorio' }, { status: 400 });
  }
  if (!nivel?.trim()) {
    return NextResponse.json({ error: 'El campo "nivel" es obligatorio' }, { status: 400 });
  }

  const { data: newCurso, error: insertError } = await supabase
    .from('cursos')
    .insert({
      user_id: userId,
      nombre: nombre.trim(),
      nivel: nivel.trim(),
      seccion: seccion?.trim() ?? null,
    })
    .select('id, nombre, nivel, seccion, created_at')
    .single();

  if (insertError) {
    console.error('[POST /api/cursos] Supabase error:', insertError);
    return NextResponse.json(
      { error: 'Error al crear el curso', detail: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...newCurso, horario: [] }, { status: 201 });
}

// ─── DELETE /api/cursos?id=<uuid> ────────────────────────────────────────────
/**
 * Deletes a curso by id (must belong to the authenticated user).
 * Cascades to horario_semanal rows automatically via DB constraint.
 *
 * Query param: ?id=<uuid>
 */
export async function DELETE(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = makeSupabaseClient(token);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const userId = userData.user.id;

  const { searchParams } = new URL(req.url);
  const cursoId = searchParams.get('id');

  if (!cursoId) {
    return NextResponse.json({ error: 'Parámetro "id" requerido' }, { status: 400 });
  }

  // Verify ownership before deleting
  const { data: existing, error: findError } = await supabase
    .from('cursos')
    .select('id')
    .eq('id', cursoId)
    .eq('user_id', userId)
    .maybeSingle();

  if (findError) {
    console.error('[DELETE /api/cursos] Supabase error:', findError);
    return NextResponse.json(
      { error: 'Error al verificar el curso', detail: findError.message },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('cursos')
    .delete()
    .eq('id', cursoId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error('[DELETE /api/cursos] Supabase error:', deleteError);
    return NextResponse.json(
      { error: 'Error al eliminar el curso', detail: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: cursoId }, { status: 200 });
}
