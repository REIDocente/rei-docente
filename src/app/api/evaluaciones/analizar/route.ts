import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
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
    const { action } = body;

    // --- Claude API Key check ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620';
    const isMock = !apiKey || apiKey === 'tu_anthropic_api_key_aqui' || token === 'mock-access-token';

    // 1. VISION ACTION
    if (action === 'vision') {
      const { image, n_preguntas_sm } = body;
      if (!image) {
        return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
      }

      const totalSM = Number(n_preguntas_sm) || 20;

      if (isMock) {
        // Return mock OMR results
        const respuestas: Record<string, string> = {};
        const letters = ['A', 'B', 'C', 'D'];
        for (let i = 1; i <= totalSM; i++) {
          respuestas[String(i)] = letters[Math.floor(Math.random() * 4)];
        }
        return NextResponse.json({ respuestas });
      }

      // Call Anthropic API with Vision
      const anthropic = new Anthropic({ apiKey });
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      const systemPrompt = `Eres un experto en lectura óptica de imágenes (OMR) y reconocimiento visual de marcas.
Analiza la imagen provista, que corresponde a una hoja de respuestas de alternativas de un estudiante.
Identifica la opción marcada (A, B, C o D) para cada una de las ${totalSM} preguntas.
Retorna ÚNICAMENTE un objeto JSON con el formato mostrado abajo, sin explicaciones ni código markdown.

Formato de respuesta esperado:
{
  "respuestas": {
    "1": "A",
    "2": "C",
    "3": null,
    "4": "B"
  }
}`;

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `Extrae las respuestas marcadas de la hoja para las preguntas 1 a la ${totalSM}.`
              }
            ]
          }
        ],
        system: systemPrompt
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      try {
        const parsed = JSON.parse(sanitizeJson(rawText));
        return NextResponse.json({ respuestas: parsed.respuestas || parsed });
      } catch (err) {
        console.error('Error parsing Claude Vision JSON:', rawText, err);
        return NextResponse.json({ error: 'Error al interpretar la respuesta de la IA' }, { status: 500 });
      }
    }

    // 2. PLAN MEJORA ACTION
    if (action === 'plan_mejora') {
      const { analisisId, stats } = body;
      if (!analisisId || !stats) {
        return NextResponse.json({ error: 'Faltan parámetros obligatorios (analisisId, stats)' }, { status: 400 });
      }

      let userId = '00000000-0000-0000-0000-000000000000';
      let planStatus = 'trial';

      // Verify trial limit if not in mock
      if (token !== 'mock-access-token') {
        const supabase = makeSupabaseClient(token);
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData?.user) {
          return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
        }
        userId = userData.user.id;

        // Query user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('plan_status')
          .eq('id', userId)
          .maybeSingle();

        planStatus = profile?.plan_status || 'trial';

        if (planStatus === 'trial') {
          // Query usage_counters
          const { data: counter } = await supabase
            .from('usage_counters')
            .select('count')
            .eq('user_id', userId)
            .eq('feature', 'analisis')
            .maybeSingle();

          const currentCount = counter?.count || 0;
          if (currentCount >= 5) {
            return NextResponse.json(
              { error: 'Límite de análisis alcanzado en plan gratuito' },
              { status: 403 }
            );
          }
        }
      }

      let planJson: any;

      if (isMock) {
        // Return mock improvement plan
        const bajoPromedio = stats.estudiantes
          ? stats.estudiantes.filter((e: any) => e.nota < 4.0).map((e: any) => ({
              nombre: e.nombre_estudiante,
              nota: e.nota,
              habilidades_a_reforzar: ['Comprensión Inferencial', 'Vocabulario en Contexto'],
              nivel_rti: 2,
              nivel_rti_explicacion: 'Requiere apoyo y tutoría focalizada en grupos pequeños.'
            }))
          : [
              {
                nombre: 'Estudiante Ejemplo',
                nota: 3.5,
                habilidades_a_reforzar: ['Comprensión Inferencial'],
                nivel_rti: 2,
                nivel_rti_explicacion: 'Apoyo en grupo focalizado.'
              }
            ];

        planJson = {
          top_habilidades_debiles: [
            { habilidad: 'Comprensión Inferencial', porcentaje_logro: 45, descripcion: 'El curso muestra dificultades para relacionar partes del texto y deducir intenciones.' },
            { habilidad: 'Vocabulario en Contexto', porcentaje_logro: 52, descripcion: 'Falta de vocabulario técnico y asimilación de términos según su entorno oracional.' },
            { habilidad: 'Reflexión sobre el Texto', porcentaje_logro: 58, descripcion: 'Limitada capacidad para argumentar posturas críticas respecto al texto.' }
          ],
          estrategias_pedagogicas: [
            'Modelado explícito del proceso de inferencia durante la lectura guiada.',
            'Uso de organizadores gráficos para descomponer los elementos de vocabulario.',
            'Implementación de debates estructurados basados en preguntas abiertas de opinión.'
          ],
          actividades_sugeridas: [
            { habilidad: 'Comprensión Inferencial', actividad: 'Actividad "Detective Lector": buscar pistas textuales para responder preguntas implícitas.' },
            { habilidad: 'Vocabulario en Contexto', actividad: 'Glosario de Contexto: definir palabras infiriendo del texto antes de buscarlas en el diccionario.' },
            { habilidad: 'Reflexión sobre el Texto', actividad: 'Bitácora del Personaje: escribir una opinión justificada acerca de las decisiones tomadas por un personaje.' }
          ],
          seguimiento_estudiantes: bajoPromedio
        };
      } else {
        // Call Claude API
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

Reglas importantes:
- "top_habilidades_debiles": Identifica las 3 habilidades con menor porcentaje de logro en base a la tabla de especificaciones.
- "estrategias_pedagogicas": Define 3 estrategias pedagógicas concretas y aplicables en las próximas 2 semanas.
- "actividades_sugeridas": Sugiere una actividad por cada habilidad prioritaria identificada en "top_habilidades_debiles".
- "seguimiento_estudiantes": Genera un ítem por cada estudiante que tenga una nota inferior a 4.0. El nivel de intervención RTI (Response to Intervention) sugerido debe ser 1 (universal en aula), 2 (grupos pequeños focalizados) o 3 (apoyo intensivo o derivación a PIE/especialista), según corresponda a la gravedad de su rezago escolar.
- No incluyas comentarios, formato markdown ni texto explicativo fuera del JSON. Debe ser un JSON puro y válido.`;

        const userPrompt = `A continuación se presentan las estadísticas de la evaluación:
Curso: ${stats.nivel}
Título del Análisis: ${stats.titulo}
Total estudiantes: ${stats.totalEstudiantes}
Promedio de notas: ${stats.avgGrade}
Porcentaje promedio de logro: ${stats.avgPct}%
Alumnos con nota baja a 4.0: ${stats.belowFour} de ${stats.totalEstudiantes}

Estadísticas por Habilidad:
${JSON.stringify(stats.habilidades, null, 2)}

Listado de estudiantes con bajo desempeño (Nota < 4.0):
${JSON.stringify(stats.estudiantes?.filter((e: any) => e.nota < 4.0).map((e: any) => ({ nombre: e.nombre_estudiante, nota: e.nota })), null, 2)}

Por favor genera el plan de mejora del curso y seguimiento de estudiantes.`;

        const response = await anthropic.messages.create({
          model: model,
          max_tokens: 3000,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt
        });

        const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
        try {
          planJson = JSON.parse(sanitizeJson(rawText));
        } catch (err) {
          console.error('Error parsing Claude Plan Mejora JSON:', rawText, err);
          return NextResponse.json({ error: 'Error al procesar el JSON generado por la IA' }, { status: 500 });
        }
      }

      // Save plan and increment counter if not in mock
      if (token !== 'mock-access-token') {
        const supabase = makeSupabaseClient(token);

        // Update analisis_evaluaciones
        const { error: dbUpdateError } = await supabase
          .from('analisis_evaluaciones')
          .update({ plan_mejora_json: planJson })
          .eq('id', analisisId);

        if (dbUpdateError) {
          console.error('Error updating plan_mejora_json in database:', dbUpdateError);
        }

        // Increment counter in usage_counters
        if (planStatus === 'trial') {
          const { data: counter } = await supabase
            .from('usage_counters')
            .select('count')
            .eq('user_id', userId)
            .eq('feature', 'analisis')
            .maybeSingle();

          if (counter) {
            await supabase
              .from('usage_counters')
              .update({ count: (counter.count || 0) + 1 })
              .eq('user_id', userId)
              .eq('feature', 'analisis');
          } else {
            await supabase
              .from('usage_counters')
              .insert({ user_id: userId, feature: 'analisis', count: 1 });
          }
        }
      }

      return NextResponse.json({ plan: planJson });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    console.error('API Error in /api/evaluaciones/analizar:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
