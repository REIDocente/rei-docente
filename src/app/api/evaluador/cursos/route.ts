import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  if (process.env.NODE_ENV === 'development') {
    return 'mock-access-token';
  }
  return null;
}

// Mock database file helper
function getMockCursosFile() {
  const dir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'mock_cursos.json');
}

function readMockCursos(): any[] {
  const file = getMockCursosFile();
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  
  // Default mock data
  const defaultData = [
    {
      id: 'curso-mock-1',
      nombre: '8°A',
      nivel: 'Básica',
      estudiantes_json: [
        { nombre: 'Juan Pérez', numero_lista: 1, rut: '12.345.678-9' },
        { nombre: 'María González', numero_lista: 2, rut: '23.456.789-0' },
        { nombre: 'Carlos Muñoz', numero_lista: 3, rut: '9.876.543-2' }
      ],
      created_at: new Date().toISOString()
    }
  ];
  fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  return defaultData;
}

function writeMockCursos(data: any[]) {
  fs.writeFileSync(getMockCursosFile(), JSON.stringify(data, null, 2));
}

// GET - List courses
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (token === 'mock-access-token') {
      const cursos = readMockCursos();
      return NextResponse.json({ cursos });
    }

    const supabase = makeSupabaseClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data: cursos, error } = await supabase
      .from('cursos_docente')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ cursos });
  } catch (err: any) {
    console.error('Error in GET /api/evaluador/cursos:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

// POST - Create or update course
export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, nombre, nivel, estudiantes_json } = body;

    if (!nombre || !nivel || !Array.isArray(estudiantes_json)) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    if (token === 'mock-access-token') {
      const cursos = readMockCursos();
      if (id) {
        // Update
        const idx = cursos.findIndex(c => c.id === id);
        if (idx > -1) {
          cursos[idx] = { ...cursos[idx], nombre, nivel, estudiantes_json };
          writeMockCursos(cursos);
          return NextResponse.json({ success: true, curso: cursos[idx] });
        }
      }
      // Create new
      const nuevo = {
        id: 'curso-mock-' + Math.random().toString(36).substring(2),
        nombre,
        nivel,
        estudiantes_json,
        created_at: new Date().toISOString()
      };
      cursos.push(nuevo);
      writeMockCursos(cursos);
      return NextResponse.json({ success: true, curso: nuevo });
    }

    const supabase = makeSupabaseClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (id) {
      // Update
      const { data, error } = await supabase
        .from('cursos_docente')
        .update({ nombre, nivel, estudiantes_json })
        .eq('id', id)
        .eq('user_id', userData.user.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, curso: data });
    } else {
      // Check maximum limit of 10 courses
      const { count, error: countError } = await supabase
        .from('cursos_docente')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user.id);

      if (countError) throw countError;

      if (count !== null && count >= 10) {
        return NextResponse.json({ error: 'Has alcanzado el límite de 10 cursos creados.' }, { status: 400 });
      }

      // Create
      const { data, error } = await supabase
        .from('cursos_docente')
        .insert({
          user_id: userData.user.id,
          nombre,
          nivel,
          estudiantes_json
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, curso: data });
    }
  } catch (err: any) {
    console.error('Error in POST /api/evaluador/cursos:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}

// DELETE - Delete course
export async function DELETE(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    if (token === 'mock-access-token') {
      const cursos = readMockCursos();
      const filtrados = cursos.filter(c => c.id !== id);
      writeMockCursos(filtrados);
      return NextResponse.json({ success: true });
    }

    const supabase = makeSupabaseClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { error } = await supabase
      .from('cursos_docente')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/evaluador/cursos:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
