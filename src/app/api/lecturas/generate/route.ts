import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';

export const maxDuration = 60;

// Import templates
import { PLANNING_TEMPLATE } from '@/lib/templates/reading/planningTemplate';
import { GUIDE_TEMPLATE } from '@/lib/templates/reading/guideTemplate';
import { QUESTION_BANK_TEMPLATE } from '@/lib/templates/reading/questionBankTemplate';
import { ASSESSMENT_TEMPLATES, AssessmentType } from '@/lib/templates/reading/assessmentTemplate';
import { EXPERIENCE_TEMPLATES, ExperienceType } from '@/lib/templates/reading/experienceTemplates';
import { VISUAL_PROMPTS } from '@/lib/templates/reading/visualPromptTemplates';

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

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const isDev = process.env.NODE_ENV === 'development';
  let userId = '';

  const supabase = makeSupabaseClient(token);

  if (token === 'mock-access-token' && isDev) {
    userId = '00000000-0000-0000-0000-000000000000';
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    userId = userData.user.id;
  }

  // ── Guard Check ──
  const guard = await checkTrialLimit(supabase, userId, 'lecturas_generated');
  if (guard.blocked) {
    const isActive = guard.profile?.plan_status === 'active';
    return NextResponse.json(
      {
        error: 'limite_alcanzado',
        reason: guard.reason,
        tipo: 'lecturas_generated',
        limit: isActive ? 999999 : 3,
        current: guard.profile?.lecturas_generated ?? 0,
        plan_status: guard.profile?.plan_status,
        renewal_date: guard.renewalDate,
      },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { libro_id, tipo, subtipo, nivel, oa = [], sesiones = 4 } = body;

  if (!libro_id) return NextResponse.json({ error: 'El campo "libro_id" es obligatorio' }, { status: 400 });
  if (!tipo) return NextResponse.json({ error: 'El campo "tipo" es obligatorio' }, { status: 400 });

  // ── Cargar expediente de biblioteca_libros ──
  const { data: libro, error: libroErr } = await supabase
    .from('biblioteca_libros')
    .select('*')
    .eq('id', libro_id)
    .single();

  if (libroErr || !libro) {
    return NextResponse.json({ error: 'Libro no encontrado en biblioteca compartida' }, { status: 404 });
  }

  // ── Caso especial: Recursos Visuales (local, sin Claude) ──
  if (tipo === 'recursos_visuales') {
    const prompts = {
      mapa_personajes: VISUAL_PROMPTS.mapa_personajes(libro.titulo, libro.personajes || []),
      linea_tiempo: VISUAL_PROMPTS.linea_tiempo(libro.titulo),
      mapa_conceptual: VISUAL_PROMPTS.mapa_conceptual(libro.titulo, libro.temas || []),
      arbol_genealogico: VISUAL_PROMPTS.arbol_genealogico(libro.titulo),
      secuencia_narrativa: VISUAL_PROMPTS.secuencia_narrativa(libro.titulo)
    };

    return NextResponse.json({ content: JSON.stringify(prompts) }, { status: 200 });
  }

  // ── Seleccionar Plantilla ──
  let templateText = '';
  let generationInstruction = '';

  if (tipo === 'planificacion') {
    templateText = PLANNING_TEMPLATE;
    generationInstruction = `Completa la plantilla de sesión de clase adjunta para una lectura domiciliaria.
La sesión tiene 2 bloques de 45 minutos cada uno (90 minutos en total).
- Bloque 1 (45 min): activación, contextualización, vocabulario previo, lectura inicial o actividad de anticipación.
- Bloque 2 (45 min): trabajo con el texto, actividad de desarrollo, cierre con síntesis y metacognición, y tarea domiciliaria.
Asegúrate de que todas las actividades sean concretas, con instrucciones específicas para el docente, y alineadas al libro y nivel indicados.
El objetivo de la sesión debe estar redactado en términos de lo que el estudiante logrará.`;
  } else if (tipo === 'guia') {
    templateText = GUIDE_TEMPLATE;
    generationInstruction = `Completa la plantilla de guía de lectura adjunta.
Incluye preguntas literales, inferenciales y críticas específicas basadas en el libro.
Al final, detalla la "Pauta Docente" con las respuestas sugeridas a cada pregunta.`;
  } else if (tipo === 'banco_preguntas') {
    templateText = QUESTION_BANK_TEMPLATE;
    generationInstruction = `Completa la plantilla de banco de preguntas adjunta.
Genera exactamente:
- 5 preguntas literales
- 5 preguntas inferenciales
- 5 preguntas críticas
- 3 preguntas valorativas
- 2 preguntas creativas
Todas relacionadas directamente con la trama, personajes y temas del libro.
Al final, detalla el solucionario con las respuestas correspondientes en la sección "CLAVE DE RESPUESTAS".`;
  } else if (tipo === 'evaluacion') {
    const sType = (subtipo as AssessmentType) || 'seleccion_multiple';
    templateText = ASSESSMENT_TEMPLATES[sType] || ASSESSMENT_TEMPLATES.seleccion_multiple;
    generationInstruction = `Genera una evaluación de tipo "${subtipo || 'seleccion_multiple'}" basada en la plantilla adjunta.
Incluye preguntas de alta calidad y su correspondiente solucionario o pauta docente al final.`;
  } else if (tipo === 'rubrica') {
    templateText = `
RÚBRICA DE EVALUACIÓN DE LECTURA DOMICILIARIA
{titulo} — {autor}
Nivel: {nivel} | OA: {oa}

MATRIZ DE EVALUACIÓN:
[Tabla de rúbrica con al menos 5 criterios: Comprensión, Análisis de Personajes, Vocabulario, Ortografía/Redacción, Argumentación. Niveles: Excelente (4 pts), Bueno (3 pts), Suficiente (2 pts), Insuficiente (1 pt)]

INSTRUCCIONES DE APLICACIÓN:
{instrucciones_aplicacion}
`;
    generationInstruction = `Genera una rúbrica de evaluación completa para el libro en una tabla clara.`;
  } else if (tipo === 'experiencia') {
    const expType = (subtipo as ExperienceType) || 'podcast';
    const exp = EXPERIENCE_TEMPLATES[expType] || EXPERIENCE_TEMPLATES.podcast;
    templateText = `
EXPERIENCIA CREATIVA: ${exp.nombre} ${exp.emoji}
Descripción: ${exp.descripcion}

FICHA TÉCNICA Y CONTENIDO GENERADO:
${exp.campos_para_claude.map((c: string) => `- ${c}: {${c}}`).join('\n')}
`;
    generationInstruction = `Genera la experiencia creativa lúdica para los alumnos basada en el rol y descripción indicados.
Completa de forma detallada todos los campos de la plantilla.`;
  }

  // ── Llamada a Claude ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
    return NextResponse.json({ error: 'API Key de Anthropic no configurada' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const userPrompt = `
DATOS DEL LIBRO (EXPEDIENTE):
- Título: ${libro.titulo}
- Autor: ${libro.autor || 'Desconocido'}
- Género: ${libro.genero || 'Narrativo'}
- Resumen: ${libro.resumen || ''}
- Personajes: ${JSON.stringify(libro.personajes || [])}
- Temas: ${(libro.temas || []).join(', ')}
- Conflictos: ${(libro.conflictos || []).join(', ')}
- Vocabulario: ${JSON.stringify(libro.vocabulario || [])}
- Estructura Narrativa: ${libro.estructura_narrativa || ''}
- Contexto Histórico: ${libro.contexto_historico || ''}
- Valores y Mensajes: ${(libro.valores_mensajes || []).join(', ')}
- Fragmentos Clave: ${(libro.fragmentos_clave || []).join('\n')}

DATOS DE CONFIGURACIÓN PEDAGÓGICA:
- Nivel de los Alumnos: ${nivel}
- OAs asociados: ${oa.join(', ')}
- Sesiones (si aplica): ${sesiones}

PLANTILLA A COMPLETAR:
${templateText}

INSTRUCCIONES DE GENERACIÓN:
${generationInstruction}
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: `Eres un experto en didáctica de la lengua y literatura chilena (MINEDUC) y Didakta.
Recibirás el expediente completo de un libro y una plantilla de ${tipo}. Tu trabajo es completar la plantilla con contenido pedagógico de alta calidad, alineado al currículum chileno.
NO inventes información que no esté en el expediente del libro.
NO busques información externa.
Responde SIEMPRE con el contenido completo de la plantilla, listo para usar en clases.`,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const generatedContent = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    // Incrementar contador de uso
    await incrementCounter(supabase, userId, 'lecturas_generated');

    return NextResponse.json({ content: generatedContent });

  } catch (err: any) {
    console.error('[generate] AI Error:', err.message);
    return NextResponse.json({ error: 'Error al generar el recurso didáctico: ' + err.message }, { status: 500 });
  }
}
