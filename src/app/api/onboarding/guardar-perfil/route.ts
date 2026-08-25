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

// Mock persistence helpers
function getMockProfileFile() {
  const dir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'mock_user_profile.json');
}

function writeMockProfile(data: any) {
  fs.writeFileSync(getMockProfileFile(), JSON.stringify(data, null, 2));
}

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
  return [];
}

function writeMockCursos(data: any[]) {
  fs.writeFileSync(getMockCursosFile(), JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      nombre_completo,
      establecimiento,
      establecimiento_tipo,
      comuna,
      asignatura_principal,
      horario_docente_json,
      perfil_completado,
      cursos // Array of { nombre: string, nivel: string }
    } = body;

    if (!nombre_completo || !establecimiento || !establecimiento_tipo || !comuna || !asignatura_principal) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (token === 'mock-access-token') {
      const mockProfile = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'docente.test@gmail.com',
        nombre_completo,
        establecimiento,
        establecimiento_tipo,
        comuna,
        asignatura_principal,
        horario_docente_json,
        perfil_completado: perfil_completado !== undefined ? perfil_completado : true,
        plan_name: 'premium',
        plan_status: 'active'
      };
      writeMockProfile(mockProfile);

      // Manage mock courses upsert
      if (Array.isArray(cursos)) {
        const existingCursos = readMockCursos();
        const updatedCursos = [...existingCursos];

        cursos.forEach((c: any) => {
          const exists = existingCursos.some(
            (ec) => ec.nombre.toLowerCase().trim() === c.nombre.toLowerCase().trim()
          );

          if (!exists) {
            updatedCursos.push({
              id: 'curso-mock-' + Math.random().toString(36).substring(2),
              nombre: c.nombre,
              nivel: c.nivel,
              estudiantes_json: [],
              created_at: new Date().toISOString()
            });
          }
        });
        writeMockCursos(updatedCursos);
      }

      return NextResponse.json({ ok: true });
    }

    const supabase = makeSupabaseClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = userData.user.id;

    // 1. Upsert profile details
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        nombre_completo,
        establecimiento,
        establecimiento_tipo,
        comuna,
        asignatura_principal,
        horario_docente_json,
        perfil_completado: perfil_completado !== undefined ? perfil_completado : true
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 2. Fetch current courses to avoid overwriting existing student lists
    if (Array.isArray(cursos)) {
      const { data: existingCursos, error: getCursosError } = await supabase
        .from('cursos_docente')
        .select('*')
        .eq('user_id', userId);

      if (getCursosError) throw getCursosError;

      const insertList: any[] = [];
      cursos.forEach((c: any) => {
        const exists = existingCursos?.some(
          (ec) => ec.nombre.toLowerCase().trim() === c.nombre.toLowerCase().trim()
        );

        if (!exists) {
          insertList.push({
            user_id: userId,
            nombre: c.nombre,
            nivel: c.nivel,
            estudiantes_json: []
          });
        }
      });

      if (insertList.length > 0) {
        const { error: insertCursosError } = await supabase
          .from('cursos_docente')
          .insert(insertList);

        if (insertCursosError) throw insertCursosError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error in POST /api/onboarding/guardar-perfil:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
