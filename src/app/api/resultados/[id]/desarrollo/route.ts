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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resultadoId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { puntajes_desarrollo, estudiante_id } = body;

    if (!puntajes_desarrollo || typeof puntajes_desarrollo !== 'object') {
      return NextResponse.json({ error: 'Formato de puntajes_desarrollo no válido' }, { status: 400 });
    }

    // 1. Obtener resultado actual y evaluación
    const { data: resultadoActual, error: fetchError } = await supabase
      .from('resultados_estudiantes')
      .select('*, evaluacion:evaluaciones(*)')
      .eq('id', resultadoId)
      .single();

    if (fetchError || !resultadoActual) {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 });
    }

    // 2. Sumar puntajes de desarrollo
    const puntajeDesarrolloTotal = Object.values(puntajes_desarrollo).reduce(
      (sum: number, val: any) => sum + (Number(val) || 0),
      0
    );

    const puntajeAlternativas = resultadoActual.puntaje_alternativas || 0;
    const puntajeTotalObtenido = puntajeAlternativas + puntajeDesarrolloTotal;
    const puntajeMaximoEvaluacion = resultadoActual.evaluacion?.puntaje_total || 100;

    const porcentaje = Number(((puntajeTotalObtenido / puntajeMaximoEvaluacion) * 100).toFixed(1));
    const nivelLogro = porcentaje >= 70 ? 'Logrado' : porcentaje >= 50 ? 'En proceso' : 'Inicio';

    const updatePayload: any = {
      puntajes_desarrollo,
      puntaje_desarrollo: puntajeDesarrolloTotal,
      puntaje_total: puntajeTotalObtenido,
      porcentaje,
      nivel_logro: nivelLogro,
    };

    if (estudiante_id) {
      updatePayload.estudiante_id = estudiante_id;
    }

    // 3. Actualizar en Supabase
    const { data: updated, error: updateError } = await supabase
      .from('resultados_estudiantes')
      .update(updatePayload)
      .eq('id', resultadoId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resultado: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
