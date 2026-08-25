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

function readMockProfile() {
  const file = getMockProfileFile();
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      return null;
    }
  }
  return {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'docente.test@gmail.com',
    nombre_completo: 'Jacqueline',
    plan_name: 'premium',
    plan_status: 'active',
    perfil_completado: false
  };
}

function getMockCursosFile() {
  const dir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'mock_cursos.json');
}

function readMockCursos() {
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

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (token === 'mock-access-token') {
      const profile = readMockProfile();
      const cursos = readMockCursos();
      return NextResponse.json({ profile, cursos });
    }

    const supabase = makeSupabaseClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = userData.user.id;

    // 1. Get profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    // 2. Get courses
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos_docente')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cursosError) throw cursosError;

    return NextResponse.json({ profile, cursos });
  } catch (err: any) {
    console.error('Error in GET /api/onboarding/perfil:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
