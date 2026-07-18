import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

/**
 * GET /api/recursos-visuales
 * Returns the authenticated user's generated visual resources.
 * Query params:
 *   - limit (default 10)
 *   - planning_id (optional filter)
 */
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development') {
    const mockVisualsData = [
      {
        id: 'vis-1',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        tema: 'Infografía del Ecosistema Marino',
        tipo: 'infografia',
        imagen_url: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?q=80&w=300&auto=format&fit=crop',
        html_fallback: '<div style="padding: 20px; font-family: sans-serif; background: #e0f2fe; color: #0369a1; border-radius: 12px;"><h3>Infografía Marina</h3><p>Ecosistema marino y la cadena trófica.</p></div>',
        contenido_json: {
          titulo: 'Infografía del Ecosistema Marino',
          secciones: [
            { titulo: 'Productores', puntos: ['Fitoplancton y algas marinas', 'Realizan fotosíntesis y producen oxígeno'] },
            { titulo: 'Consumidores Primarios', puntos: ['Krill y pequeños crustáceos', 'Se alimentan directamente del fitoplancton'] }
          ]
        }
      }
    ];
    return NextResponse.json({ recursos: mockVisualsData });
  }

  const supabase = makeSupabaseClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '10'), 50);
  const planningId = url.searchParams.get('planning_id');

  let query = supabase
    .from('recursos_visuales')
    .select('id, tipo, tema, imagen_url, html_fallback, contenido_json, created_at, planning_id')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (planningId) {
    query = query.eq('planning_id', planningId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[GET /api/recursos-visuales] Supabase error:', error);
    return NextResponse.json({ error: 'Error al obtener los recursos', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ recursos: data ?? [] });
}
