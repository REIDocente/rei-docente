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
    const { curso, estudiantes, anno_escolar } = body;

    if (!curso || !Array.isArray(estudiantes) || estudiantes.length === 0) {
      return NextResponse.json({ error: 'Faltan datos obligatorios (curso, lista de estudiantes)' }, { status: 400 });
    }

    const anno = anno_escolar || new Date().getFullYear();

    // Eliminar lista previa del curso para este docente en el mismo año si se está reimportando
    await supabase
      .from('estudiantes')
      .delete()
      .eq('docente_id', user.id)
      .eq('curso', curso.trim())
      .eq('anno_escolar', anno);

    const insertData = estudiantes.map((e: any, index: number) => ({
      docente_id: user.id,
      nombre: e.nombre?.trim() || `Estudiante ${index + 1}`,
      rut: e.rut?.trim() || null,
      numero_lista: Number(e.numero_lista) || (index + 1),
      curso: curso.trim(),
      anno_escolar: anno,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('estudiantes')
      .insert(insertData)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      curso,
      totalImportados: inserted.length,
      estudiantes: inserted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
