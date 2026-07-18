import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiaHorario {
  dia_semana: string;
  n_bloques: number;
  tipo_bloque?: string; // computed server-side; frontend value ignored
  hora_inicio?: string;
  hora_fin?: string;
}

interface PutBody {
  asignatura: string;
  dias: DiaHorario[];
}

// ─── Supabase client factory ──────────────────────────────────────────────────

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

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

// ─── n_bloques → tipo_bloque mapping ─────────────────────────────────────────

const TIPO_BLOQUE_MAP: Record<number, string> = {
  1: 'simple',
  2: 'doble',
  3: 'triple',
};

function computeTipoBloque(nBloques: number): string {
  return TIPO_BLOQUE_MAP[nBloques] ?? 'simple';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS_VALIDOS = new Set(['lunes', 'martes', 'miércoles', 'jueves', 'viernes']);

function validateDia(dia: DiaHorario): string | null {
  if (!DIAS_VALIDOS.has(dia.dia_semana)) {
    return `Día inválido: "${dia.dia_semana}". Use lunes|martes|miércoles|jueves|viernes.`;
  }
  if (
    typeof dia.n_bloques !== 'number' ||
    !Number.isInteger(dia.n_bloques) ||
    dia.n_bloques < 1 ||
    dia.n_bloques > 3
  ) {
    return `n_bloques debe ser un entero entre 1 y 3 (recibido: ${dia.n_bloques}).`;
  }
  return null;
}

// ─── GET /api/horario/[cursoId] ───────────────────────────────────────────────
/**
 * Returns all horario_semanal rows for the given cursoId.
 * Verifies the curso belongs to the authenticated user before returning data.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cursoId: string }> }
) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = makeSupabaseClient(token);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const { cursoId } = await params;

  // Verify ownership
  const { data: curso, error: cursoError } = await supabase
    .from('cursos')
    .select('id')
    .eq('id', cursoId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (cursoError) {
    console.error('[GET /api/horario/[cursoId]] Supabase error:', cursoError);
    return NextResponse.json(
      { error: 'Error al verificar el curso', detail: cursoError.message },
      { status: 500 }
    );
  }
  if (!curso) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  const { data: horario, error: horarioError } = await supabase
    .from('horario_semanal')
    .select('id, asignatura, dia_semana, n_bloques, tipo_bloque, hora_inicio, hora_fin')
    .eq('curso_id', cursoId)
    .order('dia_semana', { ascending: true });

  if (horarioError) {
    console.error('[GET /api/horario/[cursoId]] Supabase error:', horarioError);
    return NextResponse.json(
      { error: 'Error al obtener el horario', detail: horarioError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(horario ?? [], { status: 200 });
}

// ─── PUT /api/horario/[cursoId] ───────────────────────────────────────────────
/**
 * Replaces the entire horario for the given cursoId and asignatura.
 * Deletes existing rows for that curso + asignatura, then inserts new ones.
 * tipo_bloque is computed server-side: 1→'simple', 2→'doble', 3→'triple'.
 *
 * Body: {
 *   asignatura: string,
 *   dias: [{ dia_semana, n_bloques, hora_inicio?, hora_fin? }]
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ cursoId: string }> }
) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = makeSupabaseClient(token);

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const { cursoId } = await params;

  // Verify ownership
  const { data: curso, error: cursoError } = await supabase
    .from('cursos')
    .select('id')
    .eq('id', cursoId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (cursoError) {
    console.error('[PUT /api/horario/[cursoId]] Supabase error:', cursoError);
    return NextResponse.json(
      { error: 'Error al verificar el curso', detail: cursoError.message },
      { status: 500 }
    );
  }
  if (!curso) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
  }

  // Parse body
  let body: PutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { asignatura, dias } = body;

  if (!asignatura?.trim()) {
    return NextResponse.json({ error: 'El campo "asignatura" es obligatorio' }, { status: 400 });
  }
  if (!Array.isArray(dias)) {
    return NextResponse.json({ error: 'El campo "dias" debe ser un array' }, { status: 400 });
  }

  // Validate each día
  for (const dia of dias) {
    const validationError = validateDia(dia);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 422 });
    }
  }

  // Delete existing rows for this curso + asignatura
  const { error: deleteError } = await supabase
    .from('horario_semanal')
    .delete()
    .eq('curso_id', cursoId)
    .eq('asignatura', asignatura.trim());

  if (deleteError) {
    console.error('[PUT /api/horario/[cursoId]] Delete error:', deleteError);
    return NextResponse.json(
      { error: 'Error al actualizar el horario', detail: deleteError.message },
      { status: 500 }
    );
  }

  // Nothing to insert — return empty array
  if (dias.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  // Build insert rows with server-computed tipo_bloque
  const rows = dias.map((dia) => ({
    curso_id: cursoId,
    asignatura: asignatura.trim(),
    dia_semana: dia.dia_semana,
    n_bloques: dia.n_bloques,
    tipo_bloque: computeTipoBloque(dia.n_bloques),
    hora_inicio: dia.hora_inicio ?? null,
    hora_fin: dia.hora_fin ?? null,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('horario_semanal')
    .insert(rows)
    .select('id, asignatura, dia_semana, n_bloques, tipo_bloque, hora_inicio, hora_fin');

  if (insertError) {
    console.error('[PUT /api/horario/[cursoId]] Insert error:', insertError);
    return NextResponse.json(
      { error: 'Error al guardar el horario', detail: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(inserted ?? [], { status: 200 });
}
