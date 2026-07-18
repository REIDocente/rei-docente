import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const titulo = searchParams.get('titulo') || '';

  if (!titulo) {
    return NextResponse.json({ encontrado: false, error: 'El parámetro "titulo" es obligatorio' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { data: libros, error } = await supabase
      .from('biblioteca_libros')
      .select('*')
      .ilike('titulo', `%${titulo.trim()}%`);

    if (error) throw error;

    if (libros && libros.length > 0) {
      return NextResponse.json({ encontrado: true, libro: libros[0] });
    }

    return NextResponse.json({ encontrado: false });
  } catch (err: any) {
    console.error('[buscar] DB Error:', err.message);
    return NextResponse.json({ encontrado: false, error: err.message }, { status: 500 });
  }
}
