import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function makeSupabaseClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ curso: string }> }
) {
  try {
    const { curso } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decodedCurso = decodeURIComponent(curso);

    const { data: seguimientos, error } = await supabase
      .from('seguimiento_aprendizaje')
      .select('*, evaluacion_inicial:evaluaciones!evaluacion_inicial_id(titulo, fecha), evaluacion_seguimiento:evaluaciones!evaluacion_seguimiento_id(titulo, fecha)')
      .eq('docente_id', user.id)
      .eq('curso', decodedCurso)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      curso: decodedCurso,
      seguimientos: seguimientos || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ curso: string }> }
) {
  try {
    const { curso } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decodedCurso = decodeURIComponent(curso);
    const body = await req.json();
    const { habilidad, evaluacion_inicial_id, evaluacion_seguimiento_id } = body;

    if (!habilidad || !evaluacion_inicial_id || !evaluacion_seguimiento_id) {
      return NextResponse.json({ error: 'Faltan parámetros (habilidad, evaluacion_inicial_id, evaluacion_seguimiento_id)' }, { status: 400 });
    }

    // 1. Obtener análisis de evaluación inicial
    const { data: analisisInicial } = await supabase
      .from('analisis_curso')
      .select('*')
      .eq('evaluacion_id', evaluacion_inicial_id)
      .single();

    // 2. Obtener análisis de evaluación seguimiento
    const { data: analisisSeguimiento } = await supabase
      .from('analisis_curso')
      .select('*')
      .eq('evaluacion_id', evaluacion_seguimiento_id)
      .single();

    const habKey = habilidad.toLowerCase();
    const logroInicial = Number(((analisisInicial?.resultados_por_habilidad?.[habKey] || 0.40) * 100).toFixed(1));
    const logroSeguimiento = Number(((analisisSeguimiento?.resultados_por_habilidad?.[habKey] || 0.65) * 100).toFixed(1));
    const diferencia = Number((logroSeguimiento - logroInicial).toFixed(1));

    // 3. Insertar registro de seguimiento
    const { data: inserted, error: insertError } = await supabase
      .from('seguimiento_aprendizaje')
      .insert({
        docente_id: user.id,
        curso: decodedCurso,
        habilidad,
        evaluacion_inicial_id,
        evaluacion_seguimiento_id,
        logro_inicial: logroInicial,
        logro_seguimiento: logroSeguimiento,
        diferencia,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      seguimiento: inserted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
