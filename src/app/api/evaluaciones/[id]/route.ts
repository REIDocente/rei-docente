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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: evaluacionId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Obtener evaluación
    const { data: evaluacion, error: evalError } = await supabase
      .from('evaluaciones')
      .select('*')
      .eq('id', evaluacionId)
      .single();

    if (evalError || !evaluacion) {
      return NextResponse.json({ error: 'Evaluación no encontrada' }, { status: 404 });
    }

    // 2. Obtener preguntas
    const { data: preguntas } = await supabase
      .from('preguntas_evaluacion')
      .select('*')
      .eq('evaluacion_id', evaluacionId)
      .order('numero', { ascending: true });

    // 3. Obtener resultados de estudiantes
    const { data: resultados } = await supabase
      .from('resultados_estudiantes')
      .select('*, estudiante:estudiantes(id, nombre, rut, numero_lista)')
      .eq('evaluacion_id', evaluacionId)
      .order('created_at', { ascending: true });

    // 4. Obtener análisis si existe
    const { data: analisis } = await supabase
      .from('analisis_curso')
      .select('*')
      .eq('evaluacion_id', evaluacionId)
      .single();

    return NextResponse.json({
      evaluacion,
      preguntas: preguntas || [],
      resultados: resultados || [],
      analisis: analisis || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
