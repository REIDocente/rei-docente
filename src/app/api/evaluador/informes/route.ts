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
    const { action } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const isMock = !apiKey || apiKey === 'tu_anthropic_api_key_aqui' || token === 'mock-access-token';

    // 1. ACTION: suggest_score (Haiku suggests development score)
    if (action === 'suggest_score') {
      const { studentAnswer, modelAnswer, maxScore } = body;
      const maxVal = Number(maxScore) || 3;

      if (isMock) {
        // Return a mock suggested score and rationale
        const score = Math.min(maxVal, Math.max(0, Math.floor(Math.random() * (maxVal + 1))));
        return NextResponse.json({
          score,
          justification: `[Simulación] La respuesta del estudiante aborda parcialmente la pregunta. Se asigna puntaje de ${score}/${maxVal}.`
        });
      }

      const anthropic = new Anthropic({ apiKey });
      const systemPrompt = `Eres un docente evaluador chileno y experto en rúbricas y pautas de corrección.
Tu tarea es evaluar la respuesta escrita de un estudiante y compararla con la respuesta modelo/esperada.
Determina un puntaje entero entre 0 y el puntaje máximo disponible (${maxVal}).
Devuelve tu respuesta únicamente en formato JSON con la siguiente estructura:
{
  "score": 2,
  "justification": "Breve explicación pedagógica de 1 a 2 líneas del porqué de este puntaje."
}
No incluyas explicaciones ni bloques markdown fuera del JSON.`;

      const userPrompt = `Respuesta Esperada/Modelo:
"${modelAnswer}"

Puntaje Máximo: ${maxVal}

Respuesta del Estudiante:
"${studentAnswer || 'Sin respuesta'}"

Por favor evalúa la respuesta y sugiere el puntaje obtenido.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      try {
        const parsed = JSON.parse(sanitizeJson(rawText));
        return NextResponse.json({
          score: Math.min(maxVal, Math.max(0, Math.round(Number(parsed.score) || 0))),
          justification: parsed.justification || 'Evaluado por IA.'
        });
      } catch (err) {
        console.error('Error parsing Haiku score JSON:', rawText, err);
        return NextResponse.json({ error: 'Error al interpretar la puntuación de la IA.' }, { status: 500 });
      }
    }

    // 2. ACTION: batch parent reports
    const { analisisId, estudiantes, asignatura } = body;

    if (!analisisId || !Array.isArray(estudiantes)) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    let informesJson: Record<string, string> = {};

    if (isMock) {
      // Mock generation of reports for all students
      estudiantes.forEach((est: any) => {
        const pass = est.nota >= 4.0;
        informesJson[est.nombre] = pass 
          ? `El estudiante demostró un desempeño satisfactorio en la evaluación de ${asignatura || 'la asignatura'}. Demostró dominio en la mayoría de los contenidos y habilidades evaluadas. Se sugiere seguir fomentando la lectura comprensiva e investigación en el hogar para mantener este excelente ritmo. ¡Felicitaciones por el trabajo y dedicación constante!`
          : `El estudiante presentó algunas dificultades en la evaluación de ${asignatura || 'la asignatura'}, especialmente en habilidades de comprensión profunda y redacción. Requiere repasar los contenidos clave y realizar lecturas complementarias con apoyo en casa. Confiamos en que con constancia y refuerzo logrará mejorar sus resultados. ¡A seguir esforzándose!`;
      });
    } else {
      const anthropic = new Anthropic({ apiKey });

      const systemPrompt = `Eres un docente y orientador de apoyo escolar en Chile.
Tu tarea es escribir un breve informe cualitativo dirigido al apoderado (la familia) para cada estudiante a partir de sus estadísticas de evaluación.
El informe debe ser un párrafo corto (de 3 a 5 líneas), redactado en un lenguaje cálido, constructivo, claro y sin tecnicismos pedagógicos complejos.

Cada informe debe incluir de manera fluida tres elementos:
1. Lo que el estudiante logró bien en la evaluación.
2. Aspectos específicos que debe reforzar o seguir practicando en el hogar.
3. Un mensaje motivacional y de aliento para la familia.

Devuelve tu respuesta únicamente en formato JSON con la siguiente estructura exacta, asociando el nombre de cada estudiante con su informe correspondiente:
{
  "informes": {
    "Nombre del Estudiante 1": "Texto del informe...",
    "Nombre del Estudiante 2": "Texto del informe..."
  }
}
No incluyas comentarios adicionales, código markdown ni explicaciones fuera del JSON.`;

      // Compact student data to avoid token waste
      const studentDataList = estudiantes.map((est: any) => {
        return {
          nombre: est.nombre,
          nota: est.nota.toFixed(1),
          logroPct: est.porcentaje_logro.toFixed(0) + '%',
          correctasSM: `${est.puntaje_sm} correctas`,
          puntajeDesarrollo: est.puntaje_desarrollo
        };
      });

      const userPrompt = `Asignatura: ${asignatura || 'General'}
Detalle de alumnos y rendimientos:
${JSON.stringify(studentDataList, null, 2)}

Por favor genera los informes correspondientes para todos los estudiantes listados.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      try {
        const parsed = JSON.parse(sanitizeJson(rawText));
        informesJson = parsed.informes || parsed;
      } catch (err) {
        console.error('Error parsing Haiku Parent Reports JSON:', rawText, err);
        return NextResponse.json({ error: 'Error al interpretar los informes generados por la IA.' }, { status: 500 });
      }
    }

    // Save generated reports to Supabase results table if not mock
    if (token !== 'mock-access-token') {
      const supabase = makeSupabaseClient(token);

      // We run updates for each student in parallel/sequence
      const updatePromises = estudiantes.map(async (est: any) => {
        const text = informesJson[est.nombre];
        if (text) {
          await supabase
            .from('resultados_estudiantes')
            .update({ informe_apoderado_texto: text })
            .eq('analisis_id', analisisId)
            .eq('nombre_estudiante', est.nombre);
        }
      });

      await Promise.all(updatePromises);
    }

    return NextResponse.json({ informes: informesJson });
  } catch (err: any) {
    console.error('Error in /api/evaluador/informes:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
