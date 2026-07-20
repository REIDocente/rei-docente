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

  // Normalizar: quitar acentos para búsqueda flexible
  function normalize(str: string) {
    return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  try {
    // Traer todos los libros que contengan alguna palabra del título buscado
    const { data: libros, error } = await supabase
      .from('biblioteca_libros')
      .select('*')
      .ilike('titulo', `%${titulo.trim()}%`);

    if (error) throw error;

    if (libros && libros.length > 0) {
      return NextResponse.json({ encontrado: true, libro: libros[0] });
    }

    // Segunda búsqueda: normalizar acentos comparando en memoria
    const { data: todos } = await supabase
      .from('biblioteca_libros')
      .select('*');

    if (todos) {
      const normalInput = normalize(titulo);
      const match = todos.find((l: any) =>
        normalize(l.titulo).includes(normalInput) || normalInput.includes(normalize(l.titulo))
      );
      if (match) return NextResponse.json({ encontrado: true, libro: match });
    }

    return NextResponse.json({ encontrado: false });
  } catch (err: any) {
    console.error('[buscar] DB Error:', err.message);
    return NextResponse.json({ encontrado: false, error: err.message }, { status: 500 });
  }
}
