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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ evaluacion_id: string }> }
) {
  try {
    const { evaluacion_id: evaluacionId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: analisis } = await supabase
      .from('analisis_curso')
      .select('*')
      .eq('evaluacion_id', evaluacionId)
      .single();

    return NextResponse.json({ analisis: analisis || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ evaluacion_id: string }> }
) {
  try {
    const { evaluacion_id: evaluacionId } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const supabase = makeSupabaseClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 1. Obtener preguntas
    const { data: preguntas } = await supabase
      .from('preguntas_evaluacion')
      .select('*')
      .eq('evaluacion_id', evaluacionId);

    // 2. Obtener resultados de todos los estudiantes del curso
    const { data: resultados } = await supabase
      .from('resultados_estudiantes')
      .select('*, estudiante:estudiantes(*)')
      .eq('evaluacion_id', evaluacionId);

    if (!preguntas || preguntas.length === 0 || !resultados || resultados.length === 0) {
      return NextResponse.json({ error: 'No hay preguntas o resultados suficientes para calcular el análisis' }, { status: 400 });
    }

    // 3. Logro por habilidad ('literal', 'inferencial', 'interpretativo', 'argumentativo')
    const habilidades = ['literal', 'inferencial', 'interpretativo', 'argumentativo'];
    const porHabilidad: Record<string, number> = {};

    for (const hab of habilidades) {
      const preguntasHab = preguntas.filter((p: any) => p.habilidad === hab);
      if (preguntasHab.length === 0) {
        porHabilidad[hab] = 0.70;
        continue;
      }

      let totalMaxPuntos = 0;
      let totalObtenido = 0;

      for (const res of resultados) {
        const respAlt = res.respuestas_alternativas || {};
        const puntDes = res.puntajes_desarrollo || {};

        for (const p of preguntasHab) {
          totalMaxPuntos += (p.puntaje_maximo || 1);
          if (p.tipo === 'alternativa') {
            if (respAlt[p.numero.toString()]?.respuesta === p.respuesta_correcta) {
              totalObtenido += (p.puntaje_maximo || 1);
            }
          } else {
            totalObtenido += (Number(puntDes[p.numero.toString()]) || 0);
          }
        }
      }

      porHabilidad[hab] = totalMaxPuntos > 0 ? Number((totalObtenido / totalMaxPuntos).toFixed(2)) : 0;
    }

    // 4. Logro por OA
    const porOA: Record<string, { codigo: string; logro: number; n_correctas: number; n_total: number }> = {};
    const oasUnicos = Array.from(new Set(preguntas.map((p: any) => p.oa_codigo || 'OA General')));

    for (const oaCod of oasUnicos) {
      const preguntasOA = preguntas.filter((p: any) => (p.oa_codigo || 'OA General') === oaCod);
      let totalMax = 0;
      let totalObt = 0;

      for (const res of resultados) {
        const respAlt = res.respuestas_alternativas || {};
        const puntDes = res.puntajes_desarrollo || {};

        for (const p of preguntasOA) {
          totalMax += (p.puntaje_maximo || 1);
          if (p.tipo === 'alternativa') {
            if (respAlt[p.numero.toString()]?.respuesta === p.respuesta_correcta) {
              totalObt += (p.puntaje_maximo || 1);
            }
          } else {
            totalObt += (Number(puntDes[p.numero.toString()]) || 0);
          }
        }
      }

      const logroRate = totalMax > 0 ? Number((totalObt / totalMax).toFixed(2)) : 0;
      porOA[oaCod] = {
        codigo: oaCod,
        logro: logroRate,
        n_correctas: totalObt,
        n_total: totalMax,
      };
    }

    // 5. Clasificación RTI
    const rti1: string[] = [];
    const rti2: string[] = [];
    const rti3: string[] = [];

    for (const res of resultados) {
      const pct = res.porcentaje || 0;
      const estNombre = res.estudiante?.nombre || `Estudiante N° ${res.estudiante?.numero_lista || 'S/N'}`;

      if (pct < 40) {
        rti3.push(estNombre);
      } else if (pct < 60) {
        rti2.push(estNombre);
      } else if (pct < 70) {
        rti1.push(estNombre);
      }
    }

    // 6. Guardar o actualizar en `analisis_curso`
    const { data: existingAnalisis } = await supabase
      .from('analisis_curso')
      .select('id')
      .eq('evaluacion_id', evaluacionId)
      .single();

    let analisisResult;

    if (existingAnalisis) {
      const { data: updated } = await supabase
        .from('analisis_curso')
        .update({
          resultados_por_habilidad: porHabilidad,
          resultados_por_oa: porOA,
          rti_nivel1: rti1,
          rti_nivel2: rti2,
          rti_nivel3: rti3,
        })
        .eq('id', existingAnalisis.id)
        .select()
        .single();
      analisisResult = updated;
    } else {
      const { data: inserted } = await supabase
        .from('analisis_curso')
        .insert({
          evaluacion_id: evaluacionId,
          resultados_por_habilidad: porHabilidad,
          resultados_por_oa: porOA,
          rti_nivel1: rti1,
          rti_nivel2: rti2,
          rti_nivel3: rti3,
        })
        .select()
        .single();
      analisisResult = inserted;
    }

    return NextResponse.json({
      success: true,
      analisis: analisisResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
