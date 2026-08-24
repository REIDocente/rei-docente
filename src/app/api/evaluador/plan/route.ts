import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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

function sanitizeJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { analisisId, stats } = body;

    if (!analisisId || !stats) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (analisisId, stats)' }, { status: 400 });
    }

    let userId = '00000000-0000-0000-0000-000000000000';
    let planStatus = 'trial';
    let remediationCount = 0;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620';
    const isMock = !apiKey || apiKey === 'tu_anthropic_api_key_aqui' || token === 'mock-access-token';

    if (token !== 'mock-access-token') {
      const supabase = makeSupabaseClient(token);
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
      }
      userId = userData.user.id;

      // 1. Get user profile status
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan_status')
        .eq('id', userId)
        .maybeSingle();

      planStatus = profile?.plan_status || 'trial';

      // 2. If trial, check usage counter for 'plan_mejora'
      if (planStatus === 'trial') {
        const { data: counter } = await supabase
          .from('usage_counters')
          .select('count')
          .eq('user_id', userId)
          .eq('feature', 'plan_mejora')
          .maybeSingle();

        const currentCount = counter?.count || 0;
        if (currentCount >= 5) {
          return NextResponse.json(
            { error: 'Límite de análisis alcanzado en plan gratuito' },
            { status: 403 }
          );
        }
      }

      // 3. Get existing remediation_count from DB
      const { data: currentAnalisis } = await supabase
        .from('analisis_evaluaciones')
        .select('remediation_count')
        .eq('id', analisisId)
        .maybeSingle();

      remediationCount = currentAnalisis?.remediation_count || 0;
    }

    // Adapt activity parameters based on remediation count
    // 0 or 1 -> 1ra vez: actividad individual con texto nuevo.
    // 2 -> 2da vez: actividad colaborativa (parejas o grupos).
    // >=3 -> 3ra vez: sugerir REI Play (juego gamificado para ese OA).
    const remediationType = remediationCount <= 1 
      ? 'individual con texto nuevo (NUNCA repetir páginas de texto escolar)' 
      : remediationCount === 2 
        ? 'colaborativa en parejas o grupos pequeños (NUNCA repetir páginas de texto escolar)' 
        : 'sugerencia de usar REI Play (actividad de juego gamificado interactivo para el OA)';

    let planJson: any;

    if (isMock) {
      // Mock plan JSON response
      const lowStudents = stats.estudiantes?.filter((e: any) => e.nota < 4.0) || [];
      const rtiStudents = lowStudents.map((s: any) => {
        let level = 1;
        let exp = 'Refuerzo universal en aula (Nota entre 3.5 y 3.9).';
        if (s.nota < 2.5) {
          level = 3;
          exp = 'Derivación o apoyo intensivo PIE (Nota inferior a 2.5).';
        } else if (s.nota < 3.5) {
          level = 2;
          exp = 'Refuerzo en grupos pequeños focalizados (Nota entre 2.5 y 3.4).';
        }
        return {
          nombre: s.nombre_estudiante,
          nota: s.nota,
          habilidades_a_reforzar: ['Comprensión Inferencial', 'Vocabulario Contextual'],
          nivel_rti: level,
          nivel_rti_explicacion: exp
        };
      });

      planJson = {
        top_habilidades_debiles: [
          { habilidad: 'Comprensión Inferencial', porcentaje_logro: 40, descripcion: 'Falta de conexión entre ideas implícitas del texto.' },
          { habilidad: 'Vocabulario en Contexto', porcentaje_logro: 48, descripcion: 'Dificultad para descifrar términos usando pistas del texto.' },
          { habilidad: 'Reflexión y Evaluación', porcentaje_logro: 55, descripcion: 'Falta de argumentación crítica.' }
        ],
        estrategias_pedagogicas: [
          'Modelar el pensamiento inferencial resolviendo preguntas implícitas en voz alta.',
          'Crear paneles de vocabulario contextual semanales en el aula.',
          'Realizar foros de opinión literaria guiados por andamios de escritura.'
        ],
        actividades_sugeridas: [
          {
            habilidad: 'Comprensión Inferencial',
            actividad: `Actividad adaptada (${remediationType}): Diseñar fichas de inferencia con microrrelatos inéditos.`
          },
          {
            habilidad: 'Vocabulario en Contexto',
            actividad: `Actividad adaptada (${remediationType}): Rompecabezas de palabras usando textos no vistos en clases.`
          },
          {
            habilidad: 'Reflexión y Evaluación',
            actividad: `Actividad adaptada (${remediationType}): Ejercicios guiados de opinión personal sobre dilemas de personajes.`
          }
        ],
        seguimiento_estudiantes: rtiStudents
      };
    } else {
      const anthropic = new Anthropic({ apiKey });

      const systemPrompt = `Eres un experto en pedagogía, evaluación educativa y mejora continua en el sistema escolar chileno.
Analizarás las estadísticas de rendimiento de un curso para una evaluación determinada y propondrás un Plan de Mejora del Curso y un Plan de Seguimiento Individual.

Devuelve tu respuesta únicamente en formato JSON con la siguiente estructura exacta:
{
  "top_habilidades_debiles": [
    {
      "habilidad": "nombre de la habilidad",
      "porcentaje_logro": 45,
      "descripcion": "descripción de la debilidad basada en los datos"
    }
  ],
  "estrategias_pedagogicas": [
    "Estrategia 1...",
    "Estrategia 2...",
    "Estrategia 3..."
  ],
  "actividades_sugeridas": [
    {
      "habilidad": "nombre de la habilidad",
      "actividad": "descripción de la actividad sugerida"
    }
  ],
  "seguimiento_estudiantes": [
    {
      "nombre": "Nombre del alumno",
      "nota": 3.5,
      "habilidades_a_reforzar": ["Habilidad A", "Habilidad B"],
      "nivel_rti": 1,
      "nivel_rti_explicacion": "Explicación del nivel de apoyo"
    }
  ]
}

Reglas importantes para las actividades sugeridas (Remediación adaptada a la repetición de la habilidad):
- NUNCA repitas páginas del texto escolar oficial o lecturas ya aplicadas.
- Adapta las actividades sugeridas según el tipo de remediación solicitado:
  * El docente está aplicando esta remediación por el número de vez correspondiente a: ${remediationCount + 1}.
  * Consecuentemente, el tipo de actividad obligatoria a sugerir es: "${remediationType}".
- Clasificación de Estudiantes RTI (Response to Intervention):
  * Nota de 3.5 a 3.9 -> Nivel 1 (apoyo universal en el aula).
  * Nota de 2.5 a 3.4 -> Nivel 2 (apoyo en grupos pequeños).
  * Nota inferior a 2.5 -> Nivel 3 (apoyo intensivo / derivación a PIE/especialista).
- No incluyas comentarios, formato markdown ni texto explicativo fuera del JSON. Debe ser un JSON puro y válido.`;

      const userPrompt = `A continuación se presentan las estadísticas de la evaluación:
Curso: ${stats.nivel}
Título: ${stats.titulo}
Estudiantes totales: ${stats.totalEstudiantes}
Promedio notas curso: ${stats.avgGrade}
Logro promedio curso: ${stats.avgPct}%
Alumnos con nota < 4.0: ${stats.belowFour}

Estadísticas por Habilidad:
${JSON.stringify(stats.habilidades, null, 2)}

Listado de estudiantes bajo 4.0:
${JSON.stringify(stats.estudiantes?.filter((e: any) => e.nota < 4.0).map((e: any) => ({ nombre: e.nombre_estudiante, nota: e.nota })), null, 2)}

Por favor genera el plan de mejora adaptado a la vez N° ${remediationCount + 1}.`;

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 3500,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      try {
        planJson = JSON.parse(sanitizeJson(rawText));
      } catch (err) {
        console.error('Error parsing Sonnet Plan JSON:', rawText, err);
        return NextResponse.json({ error: 'Error al interpretar la respuesta estructurada de la IA' }, { status: 500 });
      }
    }

    // Save and increment states if not in mock
    if (token !== 'mock-access-token') {
      const supabase = makeSupabaseClient(token);

      // 1. Update plan_mejora_json and increment remediation_count
      const { error: dbUpdateError } = await supabase
        .from('analisis_evaluaciones')
        .update({
          plan_mejora_json: planJson,
          remediation_count: remediationCount + 1
        })
        .eq('id', analisisId);

      if (dbUpdateError) {
        console.error('Error updating plan_mejora_json in DB:', dbUpdateError);
      }

      // 2. Increment usage counter
      if (planStatus === 'trial') {
        const { data: counter } = await supabase
          .from('usage_counters')
          .select('count')
          .eq('user_id', userId)
          .eq('feature', 'plan_mejora')
          .maybeSingle();

        if (counter) {
          await supabase
            .from('usage_counters')
            .update({ count: (counter.count || 0) + 1 })
            .eq('user_id', userId)
            .eq('feature', 'plan_mejora');
        } else {
          await supabase
            .from('usage_counters')
            .insert({ user_id: userId, feature: 'plan_mejora', count: 1 });
        }
      }
    }

    return NextResponse.json({ plan: planJson, nextRemediationCount: remediationCount + 1 });
  } catch (err: any) {
    console.error('API Error in /api/evaluador/plan:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
