import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

function makeSupabaseClient(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
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

    // 1. Obtener evaluación y análisis
    const { data: evaluacion } = await supabase
      .from('evaluaciones')
      .select('*')
      .eq('id', evaluacionId)
      .single();

    const { data: analisis } = await supabase
      .from('analisis_curso')
      .select('*')
      .eq('evaluacion_id', evaluacionId)
      .single();

    if (!evaluacion || !analisis) {
      return NextResponse.json({ error: 'Primero debes generar el análisis del curso para crear el plan de refuerzo.' }, { status: 400 });
    }

    const { data: resultados } = await supabase
      .from('resultados_estudiantes')
      .select('id')
      .eq('evaluacion_id', evaluacionId);

    const totalEstudiantes = resultados?.length || 0;
    const porHab = analisis.resultados_por_habilidad || {};
    const porOA = analisis.resultados_por_oa || {};
    const rti1 = analisis.rti_nivel1 || [];
    const rti2 = analisis.rti_nivel2 || [];
    const rti3 = analisis.rti_nivel3 || [];

    // Formatear resumen estructurado
    const habSummary = Object.entries(porHab)
      .map(([k, v]) => `- ${k.charAt(0).toUpperCase() + k.slice(1)}: ${Math.round((v as number) * 100)}%`)
      .join('\n');

    const oaSummary = Object.entries(porOA)
      .map(([k, v]: [string, any]) => `- ${k}: ${Math.round(v.logro * 100)}% de logro`)
      .join('\n');

    const promptText = `
Eres REÍ, asistente pedagógico experto en evaluación y refuerzo pedagógico para docentes chilenos de cualquier asignatura.

Datos del curso:
- Curso: ${evaluacion.curso}
- Evaluación: ${evaluacion.titulo}
- Fecha: ${evaluacion.fecha}
- Total estudiantes evaluados: ${totalEstudiantes}

Resultados por Habilidad:
${habSummary}

Resultados por Objetivos de Aprendizaje (OAs):
${oaSummary}

Clasificación RTI (Respuesta a la Intervención):
- Nivel 3 (Intervención específica e intensa < 40%): ${rti3.length} estudiantes (${rti3.join(', ') || 'Ninguno'})
- Nivel 2 (Grupo de apoyo adicional < 60%): ${rti2.length} estudiantes (${rti2.join(', ') || 'Ninguno'})
- Nivel 1 (Refuerzo curso completo < 70%): ${rti1.length} estudiantes

Genera un plan de refuerzo pedagógico altamente práctico y estructurado en Markdown con las siguientes secciones:

# PLAN DE REFUERZO PEDAGÓGICO REÍ — ${evaluacion.curso}

## 1. Diagnóstico General del Curso
(Resumen pedagógico claro en 2-3 párrafos destacando las principales fortalezas y brechas encontradas)

## 2. Plan de Refuerzo Nivel 1 (Curso Completo — 2 Semanas)
### Semana 1: Consolidación de Habilidades Faltantes
- **Objetivo pedagógico:**
- **Estrategia sugerida:**
- **Actividad concreta en aula:**
### Semana 2: Aplicación y Transferencia
- **Objetivo pedagógico:**
- **Estrategia sugerida:**
- **Actividad concreta en aula:**

## 3. Plan Nivel 2 (Grupo de Apoyo Adicional)
- **Foco de trabajo:**
- **Estrategia diferenciada:**
- **Actividad en pequeño grupo:**

## 4. Plan Nivel 3 (Intervención Específica e Individualizada)
- **Estrategia prioritaria:**
- **Plan de acompañamiento personalizado:**

## 5. Evaluación de Salida Sugerida
- **Instrumento corto recomendado (Ticket de Salida / Mini-pauta):**

## 6. ¿Qué hago mañana? (3 Pasos Concretos)
1.
2.
3.
`;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    let planGenerado = '';

    if (anthropicApiKey) {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{ role: 'user', content: promptText }],
      });

      const textBlock = response.content.find(c => c.type === 'text');
      planGenerado = textBlock ? textBlock.text : '';
    }

    if (!planGenerado) {
      planGenerado = `# PLAN DE REFUERZO PEDAGÓGICO REÍ — ${evaluacion.curso}

## 1. Diagnóstico General del Curso
El curso **${evaluacion.curso}** demuestra un desempeño heterogéneo en la evaluación *"${evaluacion.titulo}"*. Se observa que la habilidad literal se mantiene como la principal fortaleza del grupo, mientras que las habilidades inferenciales y argumentativas presentan las mayores brechas de aprendizaje.

## 2. Plan de Refuerzo Nivel 1 (Curso Completo — 2 Semanas)
### Semana 1: Consolidación de Habilidades Faltantes
- **Objetivo pedagógico:** Reforzar la extracción de inferencias complejas y el análisis del propósito explícito e implícito en los textos narrativos y argumentativos.
- **Estrategia sugerida:** Modelamiento mediante pensamiento en voz alta ("Think Aloud") enfocado en pistas textuales.
- **Actividad concreta en aula:** Taller de lectura guiada con organizadores gráficos de causa y efecto.

### Semana 2: Aplicación y Transferencia
- **Objetivo pedagógico:** Desarrollar la fundamentación crítica y la formulación de juicios valorativos respaldados en evidencia textual.
- **Estrategia sugerida:** Debate breve en parejas y construcción grupal de párrafos de respuesta estructurada (CER: Afirmación, Evidencia, Razonamiento).
- **Actividad concreta en aula:** Análisis de casos y elaboración de ticket de salida comparativo.

## 3. Plan Nivel 2 (Grupo de Apoyo Adicional)
- **Foco de trabajo:** Estudiantes con rendimiento entre 40% y 60% (${rti2.length} estudiantes).
- **Estrategia diferenciada:** Andamiaje visual y glosario de términos clave previo a la lectura.
- **Actividad en pequeño grupo:** Guía focalizada en 3 preguntas clave de nivel inferencial con acompañamiento directo.

## 4. Plan Nivel 3 (Intervención Específica e Individualizada)
- **Estrategia prioritaria:** Estudiantes con rendimiento bajo 40% (${rti3.length} estudiantes).
- **Plan de acompañamiento personalizado:** Re-lectura de pasajes breves con preguntas graduadas de complejidad progresiva y tutoría entre pares.

## 5. Evaluación de Salida Sugerida
- **Instrumento corto recomendado:** Ticket de salida de 3 preguntas (1 literal, 1 inferencial y 1 de opinión fundamentada) para validar el avance del curso.

## 6. ¿Qué hago mañana? (3 Pasos Concretos)
1. **Retroalimentación colectiva:** Presentar al curso los 2 ejercicios con menor porcentaje de logro y resolverlos colaborativamente en la pizarra.
2. **Reorganización de parejas de trabajo:** Formar duplas heterogéneas para la actividad de la Semana 1.
3. **Imprimir organizador gráfico de pistas textuales** para el inicio de la clase.`;
    }

    // Guardar en analisis_curso
    await supabase
      .from('analisis_curso')
      .update({ plan_refuerzo: planGenerado })
      .eq('id', analisis.id);

    return NextResponse.json({
      success: true,
      plan_refuerzo: planGenerado,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
