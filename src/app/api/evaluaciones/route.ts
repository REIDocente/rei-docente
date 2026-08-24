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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: evaluaciones, error } = await supabase
      .from('evaluaciones')
      .select('*, preguntas:preguntas_evaluacion(*), resultados:resultados_estudiantes(id, porcentaje, nivel_logro)')
      .eq('docente_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ evaluaciones });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { titulo, curso, fecha, preguntas } = body;

    if (!titulo || !curso || !Array.isArray(preguntas) || preguntas.length === 0) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (titulo, curso, preguntas)' }, { status: 400 });
    }

    const totalAlternativas = preguntas.filter((p: any) => p.tipo === 'alternativa').length;
    const totalDesarrollo = preguntas.filter((p: any) => p.tipo === 'desarrollo').length;
    const puntajeTotal = preguntas.reduce((sum: number, p: any) => sum + (Number(p.puntaje_maximo) || 1), 0);

    // 1. Insertar evaluación
    const { data: evalData, error: evalError } = await supabase
      .from('evaluaciones')
      .insert({
        docente_id: user.id,
        titulo: titulo.trim(),
        curso: curso.trim(),
        fecha: fecha || new Date().toISOString().split('T')[0],
        total_alternativas: totalAlternativas,
        total_desarrollo: totalDesarrollo,
        puntaje_total: puntajeTotal,
        estado: 'activa',
      })
      .select()
      .single();

    if (evalError || !evalData) {
      return NextResponse.json({ error: evalError?.message || 'Error al crear la evaluación' }, { status: 500 });
    }

    // 2. Insertar preguntas
    const preguntasInsert = preguntas.map((p: any, index: number) => ({
      evaluacion_id: evalData.id,
      numero: p.numero || (index + 1),
      tipo: p.tipo || 'alternativa',
      respuesta_correcta: p.tipo === 'alternativa' ? (p.respuesta_correcta || 'A') : null,
      oa_id: p.oa_id || null,
      oa_codigo: p.oa_codigo || null,
      habilidad: p.habilidad || 'literal',
      puntaje_maximo: Number(p.puntaje_maximo) || 1,
      criterios_rubrica: p.criterios_rubrica || null,
    }));

    const { error: pregError } = await supabase
      .from('preguntas_evaluacion')
      .insert(preguntasInsert);

    if (pregError) {
      return NextResponse.json({ error: pregError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      evaluacion_id: evalData.id,
      evaluacion: evalData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
