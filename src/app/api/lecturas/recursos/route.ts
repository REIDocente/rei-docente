/**
 * GET  /api/lecturas/recursos?libro_id=...
 *   Retorna los recursos_generados del docente autenticado para un libro.
 *
 * PATCH /api/lecturas/recursos
 *   Body: { libro_id, key, recurso: { content, tipo, subtipo, label } }
 *   Hace upsert del recurso en el array JSONB recursos_generados.
 *   Si no existe fila en lecturas_docente para ese user+libro, la crea.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Helpers ────────────────────────────────────────────────────────────────

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  if (process.env.NODE_ENV === 'development') return 'mock-access-token';
  return null;
}

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUserId(supabase: any, token: string): Promise<string | null> {
  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development') {
    return '00000000-0000-0000-0000-000000000000';
  }
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const libro_id = searchParams.get('libro_id');
  if (!libro_id) return NextResponse.json({ error: 'Falta libro_id' }, { status: 400 });

  const supabase = makeSupabaseClient(token);
  const userId = await resolveUserId(supabase, token);
  if (!userId) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

  try {
    const { data, error } = await supabase
      .from('lecturas_docente')
      .select('recursos_generados')
      .eq('user_id', userId)
      .eq('libro_id', libro_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // recursos_generados es un array de { key, recurso } o un objeto Record<key, recurso>
    const recursos = data?.recursos_generados ?? {};
    return NextResponse.json({ recursos });
  } catch (err: any) {
    console.error('[lecturas/recursos GET]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = makeSupabaseClient(token);
  const userId = await resolveUserId(supabase, token);
  if (!userId) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { libro_id, key, recurso } = body;
  if (!libro_id || !key || !recurso) {
    return NextResponse.json({ error: 'Faltan campos: libro_id, key, recurso' }, { status: 400 });
  }

  try {
    // 1. Buscar fila existente para este user+libro (la más reciente)
    const { data: existente, error: fetchErr } = await supabase
      .from('lecturas_docente')
      .select('id, recursos_generados')
      .eq('user_id', userId)
      .eq('libro_id', libro_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existente) {
      // 2a. Fila existe → merge del nuevo recurso en el objeto JSONB
      const current: Record<string, any> = existente.recursos_generados ?? {};
      const updated = { ...current, [key]: recurso };

      const { error: updateErr } = await supabase
        .from('lecturas_docente')
        .update({ recursos_generados: updated })
        .eq('id', existente.id);

      if (updateErr) throw updateErr;
      return NextResponse.json({ ok: true, recursos: updated });
    } else {
      // 2b. No hay fila → insertar una nueva fila mínima con el recurso
      const nuevosRecursos = { [key]: recurso };
      const { error: insertErr } = await supabase
        .from('lecturas_docente')
        .insert({
          user_id: userId,
          libro_id,
          titulo_manual: recurso.label || 'Lectura domiciliaria',
          recursos_generados: nuevosRecursos,
        });

      if (insertErr) throw insertErr;
      return NextResponse.json({ ok: true, recursos: nuevosRecursos });
    }
  } catch (err: any) {
    console.error('[lecturas/recursos PATCH]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
