import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function makeSupabaseClient(token: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() || null : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursoId = searchParams.get('cursoId');

    if (!cursoId) {
      return NextResponse.json({ error: 'Parámetro "cursoId" requerido' }, { status: 400 });
    }

    const supabase = makeSupabaseClient(token);

    // Verify course ownership
    const { data: curso, error: cursoError } = await supabase
      .from('cursos')
      .select('id, nombre, nivel, asignatura')
      .eq('id', cursoId)
      .maybeSingle();

    if (cursoError) {
      return NextResponse.json({ error: 'Error al buscar el curso', details: cursoError.message }, { status: 500 });
    }
    if (!curso) {
      return NextResponse.json({ error: 'Curso no encontrado o no autorizado' }, { status: 404 });
    }

    // Fetch the roadmap row if it exists
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas_ruta')
      .select('*')
      .eq('curso_id', cursoId)
      .maybeSingle();

    if (mapaError) {
      return NextResponse.json({ error: 'Error al buscar el mapa de ruta', details: mapaError.message }, { status: 500 });
    }

    return NextResponse.json({ curso, mapa }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/cursos/mapa-ruta error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON de cuerpo no válido' }, { status: 400 });
    }

    const { cursoId, asignatura, año, n_estudiantes, distribucion_rti, unidades } = body;

    if (!cursoId || !unidades) {
      return NextResponse.json({ error: 'Campos cursoId y unidades son requeridos' }, { status: 400 });
    }

    const supabase = makeSupabaseClient(token);

    // Verify course ownership
    const { data: curso, error: cursoError } = await supabase
      .from('cursos')
      .select('id')
      .eq('id', cursoId)
      .maybeSingle();

    if (cursoError || !curso) {
      return NextResponse.json({ error: 'Curso no encontrado o no autorizado' }, { status: 404 });
    }

    // Upsert the roadmap row
    const { data: upsertedMapa, error: upsertError } = await supabase
      .from('mapas_ruta')
      .upsert({
        curso_id: cursoId,
        asignatura: asignatura || 'Lenguaje y Comunicación',
        año: String(año || '2026'),
        n_estudiantes: n_estudiantes !== undefined ? Number(n_estudiantes) : null,
        distribucion_rti: distribucion_rti || null,
        unidades,
        updated_at: new Date().toISOString()
      }, { onConflict: 'curso_id' })
      .select('*')
      .single();

    if (upsertError) {
      console.error('[POST /api/cursos/mapa-ruta] Upsert error:', upsertError);
      return NextResponse.json({ error: 'Error al guardar el mapa de ruta', details: upsertError.message }, { status: 500 });
    }

    return NextResponse.json(upsertedMapa, { status: 200 });
  } catch (err: any) {
    console.error('POST /api/cursos/mapa-ruta error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
