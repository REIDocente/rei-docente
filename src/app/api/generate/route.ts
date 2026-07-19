import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';

export const maxDuration = 300;


// pdf-parse doesn't have official types

class SSEParser {
  private state: 'scanning' | 'in_key' | 'after_key' | 'in_value' = 'scanning';
  private currentKey = '';
  private escapeNext = false;
  private onChunk: (key: string, char: string) => void;

  constructor(onChunk: (key: string, char: string) => void) {
    this.onChunk = onChunk;
  }

  write(text: string) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (this.state === 'scanning') {
        if (char === '"') {
          this.state = 'in_key';
          this.currentKey = '';
        }
      } else if (this.state === 'in_key') {
        if (char === '"') {
          this.state = 'after_key';
        } else {
          this.currentKey += char;
        }
      } else if (this.state === 'after_key') {
        if (char === ':') {
          // keep waiting
        } else if (char === '"') {
          this.state = 'in_value';
          this.escapeNext = false;
        } else if (char === '{' || char === '[' || char === 't' || char === 'f' || (char >= '0' && char <= '9')) {
          this.state = 'scanning';
        }
      } else if (this.state === 'in_value') {
        if (this.escapeNext) {
          this.escapeNext = false;
          let out = char;
          if (char === 'n') out = '\n';
          else if (char === 't') out = '\t';
          this.onChunk(this.currentKey, out);
        } else if (char === '\\') {
          this.escapeNext = true;
        } else if (char === '"') {
          this.state = 'scanning';
        } else {
          this.onChunk(this.currentKey, char);
        }
      }
    }
  }
}


// ─── Supabase client factory (user-scoped) ────────────────────────────────────────

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LENGUAJE_GRADES = new Set(['5° Básico', '6° Básico', '7° Básico', '8° Básico', '1° Medio', '2° Medio']);

/**
 * Returns true when the combination of subject + grade activates the enriched
 * Lenguaje y Comunicación / Literatura planning mode (5° Básico a 2° Medio).
 */
function isLenguajeMode(subject: string, grade: string): boolean {
  const s = subject.toLowerCase();
  return (
    (s.includes('lenguaje') || s.includes('lengua') || s.includes('literatura')) &&
    LENGUAJE_GRADES.has(grade)
  );
}

function buildLenguajeEnrichmentInstructions(
  grade: string,
  oaEje: string | null,
  isRealLesson?: boolean,
  oaBasalesJson?: string | null,
  oaComplementariosJson?: string | null,
  unitTitle?: string | null,
  writingTechnique: string = 'oreo'
): string {
  const is6Lectura = grade === '6° Básico' && oaEje === 'Lectura';
  const isResearchLesson = unitTitle ? unitTitle.toLowerCase().includes('investigación') : false;

  let oaClarification = '';
  let oaBasales: string[] = [];
  if (isRealLesson && oaBasalesJson && oaComplementariosJson) {
    try {
      const basales = JSON.parse(oaBasalesJson) as string[];
      oaBasales = basales;
      const complementarios = JSON.parse(oaComplementariosJson) as string[];
      oaClarification = `
▸ CLASIFICACIÓN DE OBJETIVOS OFICIALES MINEDUC PARA ESTA LECCIÓN:
  - OBJETIVOS BASALES (Foco principal de la sesión, del modelado y de la evaluación): ${basales.join(', ') || 'Ninguno'}
  - OBJETIVOS COMPLEMENTARIOS (Objetivos de apoyo integrados en las actividades): ${complementarios.join(', ') || 'Ninguno'}
  * Instrucción: Estructura la sesión y la rúbrica centrándote en lograr los Objetivos Basales. Usa los Objetivos Complementarios como herramientas o contextos secundarios en las actividades de desarrollo o prácticas autónomas.
`;
    } catch (e) {
      console.warn('Error parsing lesson OA categories:', e);
    }
  }

  // Determine lesson type for 1°/2° Medio
  let lessonType: 'literatura' | 'medios' | 'investigación' | 'producción' = 'literatura';
  if (grade === '1° Medio' || grade === '2° Medio') {
    const t = ((unitTitle || '') + ' ' + (oaEje || '')).toLowerCase();
    if (t.includes('investigación') || t.includes('investigando') || oaBasales.includes('OA 24') || oaBasales.includes('24')) {
      lessonType = 'investigación';
    } else if (
      t.includes('producción') || 
      t.includes('escribir') || 
      t.includes('redacción') || 
      t.includes('autobiografía') || 
      t.includes('microensayos') ||
      t.includes('discursos propios') ||
      (t.includes('ensayo') && (oaBasales.includes('OA 14') || oaBasales.includes('14') || oaBasales.includes('OA 15') || oaBasales.includes('15'))) ||
      (t.includes('reportajes') && (oaBasales.includes('OA 15') || oaBasales.includes('15')))
    ) {
      lessonType = 'producción';
    } else if (
      t.includes('medios') || 
      t.includes('noticias') || 
      t.includes('reportajes') || 
      t.includes('entrevista') || 
      t.includes('fake news') || 
      t.includes('urgencia climática') || 
      t.includes('sustentabilidad') || 
      t.includes('robótica') ||
      t.includes('ensayos') ||
      t.includes('discursos') ||
      oaBasales.includes('OA 9') || oaBasales.includes('9') || 
      oaBasales.includes('OA 10') || oaBasales.includes('10')
    ) {
      lessonType = 'medios';
    }
  }

  // Branch pedagogical structure requirements by level
  let pedagogicalStructureInstructions = '';
  if (grade === '5° Básico' || grade === '6° Básico') {
    pedagogicalStructureInstructions = `
▸ ESTRUCTURA PEDAGÓGICA DEL TEXTO DEL ESTUDIANTE (MINEDUC 5°/6° BÁSICO):
  Estructura cada sesión de la siguiente manera dentro del campo "activities_sequence" de forma compacta y sin explicaciones teóricas en prosa:

  1. ENCABEZADO DE SESIÓN Y TABLA DE METADATOS:
     Inicia la sesión con un encabezado descriptivo en negrita: **SESIÓN X · [Día y Fecha] · [Nombre Curso] · [Duración, ej: 90 min]**
     Inmediatamente después, genera una tabla Markdown vertical con el siguiente formato exacto:
     | Campo | Detalle |
     | :--- | :--- |
     | **Curso** | [Grado y sección] |
     | **Fecha** | [Fecha completa de la clase] |
     | **Duración** | [Minutos y bloques de clase] |
     | **Tipo / OA** | [Foco pedagógico / OAs de la sesión] |
     | **Objetivo** | [Objetivo de aprendizaje específico de la sesión] |
     | **Evaluación** | [Método de evaluación, ej: Autoevaluación (rúbrica 3 niveles · OA15)] |

  2. INICIO DE LA LECCIÓN (10–15 min) — ACTIVACIÓN Y METAS:
     Presenta los elementos de anclaje como guiones cortos y líneas directas de 1 o 2 oraciones:
     • **Contexto lúdico y atrayente:** [Breve introducción motivadora que conecte con la vida real del estudiante]
     • **Guion narrativo del docente:** [Breve guion de 2 o 3 oraciones para contextualizar]
     • **Activación de ideas previas:** [Pregunta detonante para recuperar saberes previos o implícitos]
     • **Definición de metas:** [Una oración o instrucción corta para que el estudiante proyecte su trabajo y defina sus estrategias personales de aprendizaje]

  3. DESARROLLO DE LA LECCIÓN (55–65 min) — MOMENTOS DE LECTURA Y CÁPSULAS:
     Diseña las actividades en torno a las lecturas oficiales y la práctica guiada:
     • **Instancias de lectura:** Plantea dos momentos de lectura temáticamente vinculados utilizando textos breves y pertinentes de 150-250 palabras.
     • **Modelado docente (15-20 min):**
       — Texto de modelado: Presenta el texto de la sesión.
       — Modelado en voz alta — Pensamiento visible: Describe brevemente el proceso mental en primera persona ("Yo pienso que... porque el texto dice...").
     • **Pausa activa (3-5 min, a mitad del bloque):**
       — Instrucción brevísima de estiramiento o respiración con su frase de reactivación.
     • **Práctica guiada (15-20 min) — "Lectores en acción" y estrategias:**
       — Actividad: Aplica estrategias de comprensión (mapas conceptuales, esquemas, lectura activa) y guía la reflexión crítica con actividades desafiantes de lectura, escritura y comunicación oral.
       — Guías diferenciadas: (Ver tablas de preguntas y claves en la Sección 3: Apoyos por Nivel).
     • **Práctica autónoma (10-15 min):** Monitoreo y apoyo diferenciado.
     • **Cápsulas de apoyo intercaladas (OBLIGATORIO incluir textualmente estas 3 cápsulas en negrita dentro del desarrollo):**
       — **Cápsula [Ayuda]:** [Tip de estrategia de comprensión lectora aplicable a las actividades]
       — **Cápsula [Vocabulario]:** [Definición de 2 o 3 palabras clave del texto de lectura]
       — **Cápsula [Conexiones]:** [Conexión interdisciplinaria o transversal significativa, ej: Educación Ambiental, Pueblos Originarios o Educación Ciudadana]

  4. CIERRE DE LA LECCIÓN (10–15 min) — EVALUACIÓN Y METACOGNICIÓN:
     • **Ticket de salida ${writingTechnique.toUpperCase()}:** Describe el ticket de salida en 4 líneas breves y directas usando la estructura ${writingTechnique.toUpperCase()}:
       ${writingTechnique === 'rice'
         ? `— **R (Repetir):** [Retomar inicio de la pregunta en la respuesta]
       — **I (Incluir):** [Idea u opinión propia]
       — **C (Citar):** [Evidencia o cita del texto entre comillas]
       — **E (Explicar):** [Explicación de cómo la cita respalda la idea]`
         : `— **O (Opinión):** [Respuesta/Opinión sugerida del estudiante]
       — **R (Razón):** [Razón basada en el texto]
       — **E (Ejemplo):** [Ejemplo o cita de evidencia del texto]
       — **O (Opinión reforzada):** [Conclusión final]`}
     • **Metacognición y síntesis:** Preguntas para evaluar el cumplimiento de las metas iniciales y sintetizar los conceptos centrales aprendidos.
`;
  } else if (grade === '7° Básico') {
    pedagogicalStructureInstructions = `
▸ ESTRUCTURA PEDAGÓGICA DEL TEXTO DEL ESTUDIANTE (MINEDUC 7° BÁSICO):
  Estructura cada sesión de la siguiente manera dentro del campo "activities_sequence" de forma compacta y sin explicaciones teóricas en prosa:

  1. ENCABEZADO DE SESIÓN Y TABLA DE METADATOS:
     Inicia la sesión con un encabezado descriptivo en negrita: **SESIÓN X · [Día y Fecha] · [Nombre Curso] · [Duración, ej: 90 min]**
     Inmediatamente después, genera una tabla Markdown vertical con el siguiente formato exacto:
     | Campo | Detalle |
     | :--- | :--- |
     | **Curso** | [Grado y sección] |
     | **Fecha** | [Fecha completa de la clase] |
     | **Duración** | [Minutos y bloques de clase] |
     | **Tipo / OA** | [Foco pedagógico / OAs de la sesión] |
     | **Objetivo** | [Objetivo de aprendizaje específico de la sesión] |
     | **Evaluación** | [Método de evaluación, ej: Ticket de salida (rúbrica 3 niveles · OA3)] |

  2. INICIO DE LA LECCIÓN (15–20 min) — PREPARACIÓN PARA LA LECTURA:
     Presenta los elementos de anclaje de la lección usando guiones cortos y líneas directas:
     • **"Defino mi estrategia":** [Modelamiento explícito o instrucción corta de la estrategia de comprensión de la sesión (ej. resumir, formular preguntas, inferir) y cómo aplicarla paso a paso].
     • **"Amplío mi vocabulario":** [Introducción atractiva de 2 o 3 palabras clave del texto de lectura explicadas en un contexto oracional, analizando brevemente su etimología o morfología].

  3. DESARROLLO DE LA LECCIÓN (50–60 min) — MOMENTOS DE LECTURA Y PRÁCTICA CRÍTICA:
     Actividades centradas en la comprensión profunda del texto, el análisis crítico y la conexión interdisciplinaria:
     • **Instancias de lectura:** Plantea la lectura de un texto literario o de medios breve y de alta calidad (150-250 palabras) relacionado al tema.
     • **Preguntas de monitoreo lateral (Lateral Questions):** Intercala obligatoriamente 2 o 3 preguntas breves de monitoreo directamente dentro del flujo de lectura o actividades (para que el docente pregunte durante la lectura).
     • **Modelado docente (15 min) — Pensamiento visible:** Describe en primera persona cómo el docente aplica la estrategia elegida ("Yo pienso que...").
     • **Pausa activa (3-5 min, a mitad del bloque):** Brevísimo ejercicio físico o de respiración.
     • **"Trabajo con el texto" (15-20 min):** Actividades guiadas enfocadas en analizar el conflicto, el papel de los personajes, o conceptos literarios y lingüísticos clave de la sesión.
     • **"Y más allá del texto" (10-15 min) — Integración interdisciplinaria:** Una actividad o pregunta de integración con otra asignatura (ej. Artes, Tecnología, o Historia) conectada significativamente al tema.
     • **Producción de textos (cuando corresponda):** Instrucciones de producción breves por pasos (Planificación, Borrador o Revisión) para que los estudiantes elaboren sus propios escritos o preparen diálogos.

  4. CIERRE DE LA LECCIÓN (10–15 min) — "CON QUÉ ME QUEDO":
     • **"Con qué me quedo" (Metacognición):** Preguntas guiadas de autorreflexión y síntesis para que el estudiante evalúe cómo las nuevas ideas y habilidades desarrolladas en la sesión responden a la pregunta esencial de la unidad o temática central.
     • **Evaluación formativa / Ticket de salida (${writingTechnique.toUpperCase()}):** Una actividad brevísima para verificar el logro del Objetivo Basal de la sesión utilizando la estructura ${writingTechnique.toUpperCase()}${writingTechnique === 'rice' ? ' (mostrando las etiquetas R, I, C, E)' : ''}.
`;
  } else if (grade === '8° Básico') {
    pedagogicalStructureInstructions = `
▸ ESTRUCTURA PEDAGÓGICA DEL TEXTO DEL ESTUDIANTE (MINEDUC 8° BÁSICO):
  Estructura cada sesión de la siguiente manera dentro del campo "activities_sequence" de forma compacta and sin explicaciones teóricas en prosa:

  1. ENCABEZADO DE SESIÓN Y TABLA DE METADATOS:
     Inicia la sesión con un encabezado descriptivo en negrita: **SESIÓN X · [Día y Fecha] · [Nombre Curso] · [Duración, ej: 90 min]**
     Inmediatamente después, genera una tabla Markdown vertical con el siguiente formato exacto:
     | Campo | Detalle |
     | :--- | :--- |
     | **Curso** | [Grado y sección] |
     | **Fecha** | [Fecha completa de la clase] |
     | **Duración** | [Minutos y bloques de clase] |
     | **Tipo / OA** | [Foco pedagógico / OAs de la sesión] |
     | **Objetivo** | [Objetivo de aprendizaje específico de la sesión] |
     | **Evaluación** | [Método de evaluación, ej: Ticket de salida (rúbrica 3 niveles · OA2)] |

  2. INICIO DE LA LECCIÓN (15–20 min) — PREPARACIÓN PARA LA LECTURA:
     Presenta los elementos de anclaje de la lección usando guiones cortos y líneas directas:
     • **"Defino mi estrategia":** [Modelamiento explícito o instrucción corta de la estrategia de comprensión de la sesión (ej. imágenes mentales, mapas de la historia, formular preguntas) y cómo aplicarla paso a paso].
     • **"Amplío mi vocabulario":** [Introducción atractiva de 2 o 3 palabras clave del texto de lectura explicadas en contexto].

  3. DESARROLLO DE LA LECCIÓN (50–60 min) — MOMENTOS DE LECTURA Y PRÁCTICA CRÍTICA:
     Actividades centradas en la comprensión profunda del texto, el análisis crítico y la conexión interdisciplinaria:
     • **Instancias de lectura:** Plantea la lectura de un texto literario o de medios breve (150-250 palabras) relacionado al tema.
     • **Preguntas de monitoreo lateral (Durante la lectura):** Intercala obligatoriamente 2 o 3 preguntas breves de monitoreo directamente dentro del flujo de lectura o actividades (para que el docente pregunte durante la lectura).
     • **Modelado docente (15 min) — Pensamiento visible:** Describe en primera persona cómo el docente aplica la estrategia de comprensión elegida.
     • **Pausa activa (3-5 min, a mitad del bloque):** Brevísimo ejercicio físico o de respiración.
     • **"Trabajo con el texto" (o "Trabajo con los textos") (15-20 min):** Actividades guiadas enfocadas en analizar el conflicto, el papel de los personajes, o recursos de estilo y figuras literarias clave.
     • **"Y más allá del texto" (10-15 min) — Integración interdisciplinaria:** Una actividad o pregunta de integración con otra asignatura (ej. Artes Visuales, Ciencias o Música) conectada significativamente al tema.
     ${isResearchLesson ? `• **"Lecciones de investigación" (COMPONENTE OBLIGATORIO PARA ESTA SESIÓN DE INVESTIGACIÓN):** Guía al estudiante paso a paso en tareas de investigación modeladas: delimitar el tema, búsqueda y evaluación de fuentes confiables de información, y citación básica en formato APA.` : `• **"Produzco mis textos" (COMPONENTE OBLIGATORIO PARA ESTA SESIÓN ESTÁNDAR):** Instrucciones breves y guiadas paso a paso para la producción escrita u oral de un texto (ej. informes, entrevistas, debates).`}

  4. CIERRE DE LA LECCIÓN (10–15 min) — "CON QUÉ ME QUEDO":
     • **"Con qué me quedo" (Metacognición):** Preguntas guiadas de autorreflexión y síntesis para que el estudiante evalúe cómo las nuevas ideas y habilidades de la sesión responden a la pregunta esencial de la unidad o temática central.
     • **Evaluación formativa / Ticket de salida (${writingTechnique.toUpperCase()}):** Una actividad brevísima para verificar el logro de los objetivos de la sesión utilizando la estructura ${writingTechnique.toUpperCase()}${writingTechnique === 'rice' ? ' (mostrando las etiquetas R, I, C, E)' : ''}.
`;
  } else if (grade === '1° Medio' || grade === '2° Medio') {
    let focusInstruction = '';
    if (lessonType === 'literatura') {
      focusInstruction = `En el desarrollo, aplica un enfoque de **Lección de literatura**: céntrate en el análisis e interpretación de la obra, sus personajes (relaciones, motivaciones), conflictos narrativos o dramáticos, o figuras de estilo lírico.`;
    } else if (lessonType === 'medios') {
      focusInstruction = `En el desarrollo, aplica un enfoque de **Lección de textos de medios**: céntrate en el análisis crítico del texto no literario, distinguiendo hechos de opiniones y evaluando la confiabilidad de la información.`;
    } else if (lessonType === 'investigación') {
      focusInstruction = `En el desarrollo, aplica un enfoque de **Lección de investigación**: modela y guía a los estudiantes en el proceso de delimitación del tema, búsqueda activa de información, evaluación crítica de fuentes y registro bibliográfico en formato APA.`;
    } else if (lessonType === 'producción') {
      focusInstruction = `En el desarrollo, aplica un enfoque de **Lección de producción**: céntrate en el proceso recursivo de escritura u oralidad, guiando los pasos de planificación, redacción del borrador, revisión cruzada y edición final.`;
    }

    pedagogicalStructureInstructions = `
▸ ESTRUCTURA PEDAGÓGICA DEL TEXTO DEL ESTUDIANTE (MINEDUC 1°/2° MEDIO - PLANTILLA C):
  Estructura cada sesión de la siguiente manera dentro del campo "activities_sequence" de forma compacta y sin explicaciones teóricas en prosa:

  1. ENCABEZADO DE SESIÓN Y TABLA DE METADATOS:
     Inicia la sesión con un encabezado descriptivo en negrita: **SESIÓN X · [Día y Fecha] · [Nombre Curso] · [Duración, ej: 90 min]**
     Inmediatamente después, genera una tabla Markdown vertical con el siguiente formato exacto:
     | Campo | Detalle |
     | :--- | :--- |
     | **Curso** | [Grado y sección] |
     | **Fecha** | [Fecha completa de la clase] |
     | **Duración** | [Minutos y bloques de clase] |
     | **Tipo / OA** | [Foco pedagógico / OAs de la sesión] |
     | **Objetivo** | [Objetivo de aprendizaje específico de la sesión] |
     | **Evaluación** | [Método de evaluación, ej: Coevaluación (lista de cotejo · OA15)] |

  2. INICIO DE LA LECCIÓN (15–20 min) — ENTRADA DE UNIDAD:
     Presenta los elementos de motivación y activación inicial:
     • **Presentación del tópico generativo:** [Breve introducción motivadora que plantee una pregunta de interés].
     • **Activación de conocimientos previos:** [Actividad de conversación o análisis corto de una imagen/frase para recordar saberes].
     • **Aprendizajes esperados:** [Una oración directa compartiendo con los estudiantes lo que aprenderán hoy].

  3. DESARROLLO DE LA LECCIÓN (50–60 min) — PROCESO DE LECTURA Y ENFOQUE:
     Actividades guiadas basadas en el enfoque de la sesión:
     ${focusInstruction}
     Asegura incorporar los siguientes momentos:
     • **"Antes de leer" (10-15 min):** Contextualización de la obra/autor/época, estrategia de anticipación (hipótesis) y aclaración de vocabulario clave.
     • **"Durante la lectura" (20-25 min):** Lectura del texto de la sesión. Intercala obligatoriamente 2 o 3 preguntas de monitoreo lateral (ej: identificar voces narrativas, recursos como flashback, indicios, o recursos persuasivos en negrita) dentro de la secuencia.
     • **Modelado docente (15 min) — Pensamiento visible:** Describe en primera persona cómo el docente aplica la estrategia de comprensión elegida.
     • **Pausa activa (3-5 min, a mitad del bloque):** Ejercicio de respiración o estiramiento para reactivar la atención.
     • **"Después de leer" (15-20 min):** Revisión de los conceptos clave y análisis post-lectura. Incluye una pregunta o mini-actividad de integración interdisciplinaria ("Y más allá del texto").

  4. CIERRE DE LA LECCIÓN (10–15 min) — SISTEMATIZACIÓN Y RECOMENDACIONES:
     • **"Sistematiza lo aprendido":** Síntesis de los aprendizajes clave de la sesión a través de una pregunta metacognitiva compleja o un esquema reflexivo.
     • **"Sigue leyendo y Recomendaciones":** Sugerencias breves de fomento lector o conexiones con otros recursos.
     • **Evaluación formativa / Ticket de salida (${writingTechnique.toUpperCase()}):** Actividad directa y medible vinculada al OA Basal utilizando la estructura ${writingTechnique.toUpperCase()}${writingTechnique === 'rice' ? ' (mostrando las etiquetas R, I, C, E)' : ''}.
`;
  } else {
    // Fallback standard structure for other cases
    pedagogicalStructureInstructions = `
▸ ESTRUCTURA DE CADA SESIÓN (ESTÁNDAR LENGUAJE/LITERATURA):
  Estructura cada sesión de la siguiente manera dentro del campo "activities_sequence" de forma compacta y sin explicaciones teóricas en prosa:

  1. ENCABEZADO DE SESIÓN Y TABLA DE METADATOS:
     Encabezado descriptivo en negrita: **SESIÓN X · [Día y Fecha] · [Nombre Curso] · [Duración, ej: 90 min]**
     Tabla de metadatos (Curso, Fecha, Duración, Tipo/OA, Objetivo, Evaluación).

  2. INICIO (10–15 min) — ACTIVACIÓN:
     Presenta los elementos de anclaje como guiones cortos y líneas directas de 1 o 2 oraciones, sin explicar la teoría de la técnica:
     • **Guion narrativo del docente:** [Breve guion de 2 o 3 oraciones para conectar con la vida real del estudiante]
     • **Frase anclaje:** (Ver Sección 4: Técnicas de Anclaje para la frase exacta en estilo directo)
     • **Pregunta detonante:** [Pregunta abierta para activar conocimientos previos]
     • **Conexión emocional:** [Una oración corta que ancle el tema]

  3. DESARROLLO (55–65 min):
     • **Modelado docente (15-20 min):**
       — Texto de la sesión: Presenta un texto breve (150-250 palabras) adecuado al nivel sobre temas como ciudadanía digital, empleo juvenil, etc.
       — Modelado en voz alta — Pensamiento visible: Describe brevemente el proceso mental en primera persona ("Yo pienso que [inferencia]... porque el texto dice [cita]...").
     • **Pausa activa (3-5 min, a mitad del bloque):**
       — Instrucción brevísima de estiramiento o respiración con su frase de reactivación.
     • **Práctica guiada (15-20 min) — Guías diferenciadas simultáneas:**
       Indica que los estudiantes resuelven las guías diferenciadas correspondientes a su nivel. Menciona: (Ver tablas de preguntas, alternativas y claves de cada nivel en la Sección 3: Apoyos por Nivel).
     • **Práctica autónoma (10-15 min):** Monitoreo y apoyo diferenciado de la tarea principal.

  4. CIERRE (10–15 min) — TICKET DE SALIDA ${writingTechnique.toUpperCase()}:
     • **Ticket de salida ${writingTechnique.toUpperCase()}:** Describe el ticket de salida en 4 líneas breves y directas usando la estructura ${writingTechnique.toUpperCase()}:
       ${writingTechnique === 'rice'
         ? `— **R (Repetir):** [Retomar inicio de la pregunta en la respuesta]
       — **I (Incluir):** [Idea u opinión propia]
       — **C (Citar):** [Evidencia o cita del texto entre comillas]
       — **E (Explicar):** [Explicación de cómo la cita respalda la idea]`
         : `— **O (Opinión):** [Respuesta/Opinión sugerida del estudiante]
       — **R (Razón):** [Razón basada en el texto]
       — **E (Ejemplo):** [Ejemplo o cita de evidencia del texto]
       — **O (Opinión reforzada):** [Conclusión final]`}
     • **Frase de cierre:** (Ver Sección 4: Técnicas de Anclaje para la frase de cierre motivadora exacta)
`;
  }

  const inferenceProcessBlock = `
▸ PROCESO EXPLÍCITO PARA ENSEÑAR A INFERIR (OBLIGATORIO EN COMPRENSIÓN LECTORA)
  Toda actividad de comprensión lectora que incluya preguntas inferenciales debe estar precedida obligatoriamente por un bloque de modelamiento explícito de 4 pasos para enseñar cómo inferir, adaptado al género discursivo del texto de la sesión:
  1. **Identificar el tipo de texto (género discursivo):** ej. cuento, texto informativo, texto argumentativo, etc.
  2. **Identificar la información clave según el género discursivo:**
     - Cuento → acciones, gestos y diálogos que revelan emociones o intenciones.
     - Texto informativo → datos, causas y consecuencias para explicar un fenómeno.
     - Texto argumentativo → tesis, argumentos y respaldos para inferir la postura del autor.
  3. **Identificar la función que cumple esa información** (el rol o peso que juega dentro del texto).
  4. **Construir la inferencia o conclusión** que se sostiene con esa información.
  Este bloque es un modelamiento del docente ("género → información clave → función → inferencia") y debe presentarse de forma explícita en las actividades del desarrollo ANTES de pedir a los estudiantes responder preguntas inferenciales por su cuenta. Las preguntas inferenciales autónomas deben ser el paso final de esta secuencia.
`;

  return `
════════════════════════════════════════════════════════
CRITERIOS DE CALIDAD INTERNOS — LENGUAJE ${grade}
(No los menciones al docente como etiquetas ni secciones separadas.
 Intégralos de forma natural en el documento pedagógico.)
════════════════════════════════════════════════════════
${oaClarification}
${inferenceProcessBlock}
▸ DISEÑO HACIA ATRÁS (Backward Design)
  Parte SIEMPRE del OA oficial (ya indicado). Diseña en este orden:
  1. ¿Cuál es la evidencia concreta de que el estudiante logró el OA?
     (producto observable, no solo "participación")
  2. ¿Qué criterios permiten evaluar esa evidencia en 3 niveles de logro?
  3. ¿Qué secuencia de actividades conduce a esa evidencia de forma eficiente?
  El campo "objective" del JSON: 1-2 oraciones con verbo(s) en infinitivo. PROHIBIDO incluir códigos OA (OA 1, OA 9, OA 21…) ni el texto oficial entre comillas. PROHIBIDO empezar con "El estudiante…" o "El docente…". Solo el objetivo operativo de la sesión.
  El campo "assessment_evidence" debe nombrar un producto concreto y medible.

${pedagogicalStructureInstructions}

▸ APOYOS POR NIVEL (campo "rti_supports" del JSON)
  Estructura cada campo de "rti_supports" de forma sumamente breve (exactamente 2 a 3 líneas de texto por nivel), accionable y sin relleno metodológico ni prosa teórica.
  Describe de forma concisa qué hace el estudiante en esa actividad diferenciada:
  — **general (Nivel 1):** Versión estándar de la actividad principal de la sesión de forma muy compacta (2-3 líneas).
  — **targeted (Nivel 2):** Versión con andamiajes, ayudas y pistas visuales o lingüísticas de forma muy compacta (2-3 líneas).
  — **intensive (Nivel 3):** Versión ultra reducida a lo esencial, con mediación directa o respuestas guiadas de forma muy compacta (2-3 líneas).
  
▸ EVALUACIÓN SUGERIDA SEGÚN ACTIVIDAD (campo "rubric" del JSON)
  Diseña las evaluaciones de forma flexible y sugerida. NO exijas autoevaluación, coevaluación y heteroevaluación de manera obligatoria en todas las clases:
  1. **Heteroevaluación docente (RÚBRICA EN TABLA):** Esta siempre debe incluirse (tabla compacta con columnas: Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3). Máximo 2 criterios esenciales y descripciones cortas de 1 línea.
  2. **Autoevaluación:** Inclúyela (2 viñetas cortas) ÚNICAMENTE si la clase es de trabajo individual complejo o reflexión profunda de cierre. Si la clase es muy corta o meramente expositiva, no la incluyas.
  3. **Coevaluación:** Inclúyela (2 viñetas cortas) ÚNICAMENTE si en el desarrollo de la sesión hay trabajo colaborativo o en parejas. Si no hay trabajo grupal, no la incluyas.
  La rúbrica resultante debe contener sugeridas solo las que apliquen según la sesión descrita, evitando relleno artificial.

▸ FIDELIDAD CURRICULAR
  El OA oficial (código + texto + indicadores) viene ya indicado más arriba. Úsalo EXACTAMENTE.

▸ TONO COMPACTO Y ESTRUCTURAL
  • Elimina por completo las siglas PNL, DUA, RTI, PIE. En su lugar usa términos neutros (ej. Nivel 1/2/3, adaptaciones de accesibilidad, guiones directos, pausa de reactivación, frases de anclaje).
  • Los andamiajes, la diferenciación y la rúbrica deben hablar por sí solos a través de su formato y contenido. No agregues etiquetas como "Adaptaciones DUA" o "RTI". En su lugar usa "Adaptaciones de accesibilidad", "Nivel 2", "Nivel 3".
  • Mantén las oraciones cortas, los guiones concretos y usa el formato de tablas Markdown siempre que sea posible para ahorrar espacio y optimizar lectura.

▸ REGLAS CRÍTICAS PARA PREGUNTAS DE OPCIÓN MÚLTIPLE (OBLIGATORIO)
  1. **Alternativas de extensión pareja (Palabras y Letras):** Las 4 alternativas de cada pregunta deben tener una extensión pareja tanto en cantidad de palabras como en cantidad de letras (caracteres sin contar espacios).
     - La diferencia de palabras entre la opción más larga y la más corta de una misma pregunta debe ser de máximo 2 a 3 palabras.
     - La diferencia de letras entre la opción más larga y la más corta de una misma pregunta debe ser de MÁXIMO 8 a 12 caracteres/letras (sin contar espacios). Queda estrictamente prohibido que la diferencia supere los 12 caracteres.
  2. **Variación de la clave correcta:** La letra correspondiente a la alternativa correcta (A, B, C o D) debe variar de forma aproximadamente uniforme a lo largo del set de preguntas. NO repitas la misma letra consecutivamente.
  3. **Pauta de pre-conteo mental (CRÍTICO):** Antes de generar el JSON, cuenta mentalmente las letras (caracteres sin espacios) de cada alternativa de cada pregunta. Si la diferencia de caracteres entre la más larga y la más corta supera los 12 caracteres, reescribe o ajusta las alternativas de esa pregunta para que queden balanceadas antes de entregar la respuesta final.
════════════════════════════════════════════════════════
`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let bearerToken: string | null = null;
  let supabaseForTrial: any = null;
  let trialUserId: string | null = null;
  let unit: string = '';
  let cursoId: string | null = null;
  let sessionNumber: number | null = null;
  let writingTechnique: string = 'oreo';

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
      return NextResponse.json(
        { error: 'La API Key de Anthropic no está configurada. Por favor, añádela a tu archivo .env.local.' },
        { status: 500 }
      );
    }
    const model = 'claude-sonnet-4-6';

    // ── Trial limit check (requires Bearer token from the frontend) ────────
    // If no token is present we skip the check (backward-compat) rather than blocking.
    const authHeader = req.headers.get('authorization') ?? '';
    bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    supabaseForTrial = bearerToken ? makeSupabaseClient(bearerToken) : null;

    if (supabaseForTrial && bearerToken) {
      const { data: userData } = await supabaseForTrial.auth.getUser(bearerToken);
      trialUserId = userData?.user?.id ?? null;

      if (trialUserId) {
        const guard = await checkTrialLimit(supabaseForTrial, trialUserId, 'planifications_generated');
        if (guard.blocked) {
          const isActive = guard.profile?.plan_status === 'active';
          const errorMsg = guard.reason === 'trial_expired'
            ? 'Tu período de prueba gratuita ha expirado (duración de 1 semana). Contacta a la administradora para renovar tu acceso.'
            : isActive
            ? 'Has alcanzado tu cupo mensual de 24 planificaciones.'
            : 'Has alcanzado el límite de 10 planificaciones de tu período de prueba. Contacta a la administradora si necesitas más.';
          return NextResponse.json(
            {
              error: 'limite_alcanzado',
              message: errorMsg,
              reason: guard.reason,
              tipo: 'planifications_generated',
              limit: isActive ? 24 : 10,
              current: guard.profile?.planifications_generated ?? 0,
              plan_status: guard.profile?.plan_status,
              renewal_date: guard.renewalDate,
            },
            { status: 403 }
          );
        }
      }
    }

    const anthropic = new Anthropic({ apiKey });

    // Parse formData
    const formData = await req.formData();
    const subject = formData.get('subject') as string;
    const grade = formData.get('grade') as string;
    const learningObjective = formData.get('learningObjective') as string;
    unit = formData.get('unit') as string;
    const referenceUrl = formData.get('referenceUrl') as string;
    const file = formData.get('referenceFile') as File | null;

    // Curriculum-mode fields (present when teacher selected an official OA)
    const oaCodigo = formData.get('oa_codigo') as string | null;
    const oaTexto = formData.get('oa_texto') as string | null;
    const oaEje = formData.get('oa_eje') as string | null;
    const indicadoresJson = formData.get('indicadores_json') as string | null;
    const curriculumMode = formData.get('curriculum_mode') === 'true';
    const oatActitudesJson = formData.get('oat_actitudes_json') as string | null;

    // Real lesson fields (for MINEDUC textbook curriculum structure)
    const isRealLesson = formData.get('is_real_lesson') === 'true';
    const oaBasalesJson = formData.get('oa_basales_json') as string | null;
    const oaComplementariosJson = formData.get('oa_complementarios_json') as string | null;

    // Scheduling context fields (optional — present when teacher configured a course schedule)
    const planningScope       = (formData.get('planning_scope') as string | null) ?? 'semana';
    const cursoNombre         = formData.get('curso_nombre') as string | null;
    const sesionesDisp        = formData.get('sesiones_disponibles') as string | null;
    const cursoHorarioJson    = formData.get('curso_horario_json') as string | null;
    const duracionBloqueMin   = formData.get('duracion_bloque_min') as string | null;
    cursoId             = formData.get('curso_id') as string | null;
    const sessionNumberRaw    = formData.get('session_number') as string | null;
    sessionNumber       = sessionNumberRaw ? Number(sessionNumberRaw) : null;
    let roadmapSessionContext = '';
    if (planningScope === 'clase' && cursoId && sessionNumber !== null) {
      try {
        const supabaseForRoadmap = bearerToken
          ? makeSupabaseClient(bearerToken)
          : createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

        const { data: roadmap, error: roadmapError } = await supabaseForRoadmap
          .from('mapas_ruta')
          .select('unidades')
          .eq('curso_id', cursoId)
          .maybeSingle();

        if (!roadmapError && roadmap && roadmap.unidades) {
          const unidades = roadmap.unidades as any[];
          const unitMatch = unit.match(/\d+/);
          const parsedUnitNum = unitMatch ? Number(unitMatch[0]) : null;

          const targetUnit = unidades.find((u) => {
            return (
              u.numero === parsedUnitNum ||
              String(u.numero) === String(unit) ||
              u.titulo?.toLowerCase().includes(unit.toLowerCase())
            );
          });

          if (targetUnit && targetUnit.sesiones) {
            const sesiones = targetUnit.sesiones as any[];
            const targetSession = sesiones.find((s) => s.numero === sessionNumber);

            if (targetSession) {
              console.log(`[generate] Found roadmap session context: Unit ${targetUnit.numero}, Session ${sessionNumber}: "${targetSession.titulo}"`);
              let roadmapBase = `
━━━ CONTEXTO DEL MAPA DE RUTA CURRICULAR ━━━
El docente está planificando la clase siguiendo un Mapa de Ruta establecido para este curso:
- Unidad: ${targetUnit.titulo}
- Sesión a generar: Sesión ${sessionNumber} de ${sesiones.length}
- Título temático/foco de esta sesión: "${targetSession.titulo}"
- Eje curricular de la sesión: ${targetSession.eje}
- OAs asociados específicamente a esta sesión: ${targetSession.oa_codes?.join(', ') || 'No especificados'}
`;

              let previousContext = '';
              try {
                const { data: prevPlannings, error: prevPlanningsError } = await supabaseForRoadmap
                  .from('plannings')
                  .select('content, created_at')
                  .eq('curso_id', cursoId)
                  .eq('unit', unit)
                  .order('created_at', { ascending: false })
                  .limit(2);

                if (!prevPlanningsError && prevPlannings && prevPlannings.length > 0) {
                  previousContext = `\n━━━ CONTEXTO HISTÓRICO DE CLASES ANTERIORES ━━━\n`;
                  const sortedPrev = [...prevPlannings].reverse();
                  sortedPrev.forEach((p: any, idx: number) => {
                    const summary = p.content?.curricular_summary;
                    if (summary) {
                      previousContext += `* Sesión Previa (hace ${sortedPrev.length - idx} clase(s)): "${summary}"\n`;
                    }
                  });
                  previousContext += `\nINSTRUCCIÓN CRÍTICA DE SECUENCIACIÓN: Esta nueva sesión es la continuación directa del contexto histórico anterior. DEBES retomar obligatoriamente el mismo texto/lectura/historia (con su título), personajes principales (usando sus nombres) y conflicto central indicados en los resúmenes anteriores. NO inventes un texto o conflicto diferente; construye la sesión como el siguiente paso de la misma secuencia de aprendizaje.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                }
              } catch (prevErr: any) {
                console.warn('Error reading previous plannings context:', prevErr.message);
              }

              roadmapSessionContext = `
${roadmapBase}
${previousContext}
INSTRUCCIÓN DE ALINEACIÓN TEMÁTICA: 
Debes centrar el tema y las actividades de la sesión en el título/foco temático "${targetSession.titulo}" y enfocar la planificación en el logro de los OAs específicos de la sesión (${targetSession.oa_codes?.join(', ') || 'No especificados'}), manteniendo la coherencia con el OA general de la planificación.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
            }
          }
        }
      } catch (err: any) {
        console.warn('Error reading roadmap context:', err.message);
      }
    }

    let extractedText = '';
    let fileName = '';

    // Extract text from file if uploaded
    if (file && file.size > 0) {
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.name.endsWith('.pdf')) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require('pdf-parse');
          const data = await pdfParse(buffer);
          extractedText = data.text || '';
        } catch (err: any) {
          console.error('Error parsing PDF:', err);
          return NextResponse.json(
            { error: `No se pudo leer el archivo PDF: ${err.message}` },
            { status: 400 }
          );
        }
      } else if (file.name.endsWith('.docx')) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
        } catch (err: any) {
          console.error('Error parsing DOCX:', err);
          return NextResponse.json(
            { error: `No se pudo leer el archivo Word: ${err.message}` },
            { status: 400 }
          );
        }
      } else if (file.name.endsWith('.txt')) {
        extractedText = buffer.toString('utf-8');
      } else {
        extractedText = buffer.toString('utf-8'); // Fallback to raw text
      }
    }

    // Extract text from URL if provided
    if (referenceUrl && referenceUrl.trim() !== '') {
      try {
        const fetchRes = await fetch(referenceUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          next: { revalidate: 3600 },
        });
        if (fetchRes.ok) {
          const html = await fetchRes.text();
          // Extremely basic text extraction: strip html tags
          const textOnly = html
            .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
            .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          extractedText += `\n\n[Contenido de la URL de referencia (${referenceUrl})]:\n${textOnly.substring(0, 8000)}`;
        }
      } catch (err) {
        console.error('Error fetching URL:', err);
        // We do not fail the request, just proceed without the URL content
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Build the Official OA block (only in curriculum mode)
    // ─────────────────────────────────────────────────────────────────────────
    let officialOABlock = '';
    let effectiveLearningObjective = learningObjective;

    if (curriculumMode && oaCodigo && oaTexto) {
      let indicadoresList: string[] = [];
      try {
        if (indicadoresJson) {
          indicadoresList = JSON.parse(indicadoresJson) as string[];
        }
      } catch {
        indicadoresList = [];
      }

      const indicadoresFormatted =
        indicadoresList.length > 0
          ? indicadoresList.map((ind) => `  • ${ind}`).join('\n')
          : '  (Sin indicadores específicos seleccionados)';

      let oatActitudesFormatted = '';
      if (oatActitudesJson) {
        try {
          const list = JSON.parse(oatActitudesJson) as Array<{ tipo: string; codigo: string; texto: string }>;
          if (list && list.length > 0) {
            const actitudes = list.filter(item => item.tipo === 'Actitud');
            const oats = list.filter(item => item.tipo === 'OAT');

            let actBlock = '';
            if (actitudes.length > 0) {
              actBlock = `  Actitudes oficiales del nivel (selecciona e integra una para la autoevaluación/coevaluación):\n` +
                actitudes.map(item => `    • [${item.codigo}] ${item.texto}`).join('\n') + '\n';
            }

            let oatBlock = '';
            if (oats.length > 0) {
              oatBlock = `  Objetivos de Aprendizaje Transversales (OAT) del nivel (integra uno para la autoevaluación/coevaluación):\n` +
                oats.map(item => `    • [${item.codigo}] ${item.texto}`).join('\n') + '\n';
            }

            oatActitudesFormatted = `\n  ACTITUDES Y OAT OFICIALES DEL NIVEL:\n${actBlock}${oatBlock}`;
          }
        } catch (e) {
          console.warn('Error parsing OAT/Actitudes JSON:', e);
        }
      }

      officialOABlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  OBJETIVO DE APRENDIZAJE OFICIAL MINEDUC — USO OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
El docente ha seleccionado el siguiente OA oficial extraído directamente
del Programa de Estudio del Ministerio de Educación de Chile.

INSTRUCCIÓN CRÍTICA: Usa este OA EXACTAMENTE como está escrito.
NO lo modifiques, NO lo resumas, NO lo reemplaces ni lo inventes.
Toda la planificación debe estar alineada con este OA e indicadores.

  Eje curricular: ${oaEje ?? 'No especificado'}
  Código:         ${oaCodigo}
  Texto oficial:
  "${oaTexto}"

  Indicadores de Evaluación oficiales que deben guiar la planificación:
${indicadoresFormatted}
${oatActitudesFormatted}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      // Override the effective learning objective with the official OA text
      effectiveLearningObjective = `${oaCodigo} — ${oaTexto}`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Enrichment instructions for Lenguaje y Comunicación 5° Básico a 2° Medio
    // These are internal quality criteria; they are never labeled or shown
    // to the teacher as separate concepts.
    // ─────────────────────────────────────────────────────────────────────────
    writingTechnique = (formData.get('writing_technique') as string | null) ?? 'oreo';

    const lenguajeMode = isLenguajeMode(subject, grade);
    const enrichmentBlock = lenguajeMode
      ? buildLenguajeEnrichmentInstructions(grade, oaEje, isRealLesson, oaBasalesJson, oaComplementariosJson, unit, writingTechnique)
      : '';

    // ─────────────────────────────────────────────────────────────────────────
    // Validaciones de Schema por Capa (Chaining)
    // ─────────────────────────────────────────────────────────────────────────
    function validateStep0(json: any): boolean {
      return (
        json &&
        (json.tipo === null || typeof json.tipo === 'string') &&
        (json.titulo === null || typeof json.titulo === 'string') &&
        (json.autor === null || typeof json.autor === 'string') &&
        (json.cuerpo === null || typeof json.cuerpo === 'string')
      );
    }

    function validateStep1(json: any): boolean {
      return (
        json &&
        typeof json === 'object' &&
        json.backward_design &&
        typeof json.backward_design === 'object' &&
        typeof json.backward_design.objective === 'string' &&
        json.backward_design.objective.trim() !== '' &&
        typeof json.backward_design.assessment_evidence === 'string' &&
        json.backward_design.assessment_evidence.trim() !== '' &&
        typeof json.backward_design.activities_sequence === 'string' &&
        json.backward_design.activities_sequence.trim() !== ''
      );
    }

    function validateStep2(json: any): boolean {
      return (
        validateStep1(json) &&
        (typeof json.dua_adaptations === 'string' || 
         (json.dua_adaptations && typeof json.dua_adaptations === 'object' &&
          typeof json.dua_adaptations.n1 === 'string' &&
          typeof json.dua_adaptations.n2 === 'string' &&
          typeof json.dua_adaptations.n3 === 'string'))
      );
    }

    function validateStep3(json: any): boolean {
      return (
        validateStep2(json) &&
        json.rti_supports &&
        typeof json.rti_supports === 'object' &&
        ((typeof json.rti_supports.general === 'string' &&
          typeof json.rti_supports.targeted === 'string' &&
          typeof json.rti_supports.intensive === 'string') ||
         (json.rti_supports.n1 && typeof json.rti_supports.n1 === 'object' &&
          typeof json.rti_supports.n1.practice === 'string' &&
          typeof json.rti_supports.n1.ticket === 'string' &&
          json.rti_supports.n2 && typeof json.rti_supports.n2 === 'object' &&
          typeof json.rti_supports.n2.practice === 'string' &&
          typeof json.rti_supports.n2.ticket === 'string' &&
          json.rti_supports.n3 && typeof json.rti_supports.n3 === 'object' &&
          typeof json.rti_supports.n3.practice === 'string' &&
          typeof json.rti_supports.n3.ticket === 'string'))
      );
    }

    function validateStep4(json: any): boolean {
      return (
        validateStep3(json) &&
        typeof json.nlp_technique === 'string' &&
        json.nlp_technique.trim() !== '' &&
        typeof json.rubric === 'string' &&
        json.rubric.trim() !== '' &&
        json.reading_level_eval &&
        typeof json.reading_level_eval === 'object' &&
        typeof json.reading_level_eval.estimated_level === 'string' &&
        json.reading_level_eval.estimated_level.trim() !== '' &&
        typeof json.reading_level_eval.warning_alert === 'string' &&
        json.reading_level_eval.warning_alert.trim() !== '' &&
        typeof json.curricular_summary === 'string' &&
        json.curricular_summary.trim() !== ''
      );
    }

    // Valida SOLO los 4 campos que Paso 4 genera (respuesta parcial de Claude).
    // validateStep4 original se conserva para validar el objeto completo post-merge.
    function validateStep4Partial(json: any): boolean {
      return (
        json &&
        typeof json.nlp_technique === 'string' &&
        json.nlp_technique.trim() !== '' &&
        typeof json.rubric === 'string' &&
        json.rubric.trim() !== '' &&
        json.reading_level_eval &&
        typeof json.reading_level_eval === 'object' &&
        typeof json.reading_level_eval.estimated_level === 'string' &&
        json.reading_level_eval.estimated_level.trim() !== '' &&
        typeof json.reading_level_eval.warning_alert === 'string' &&
        json.reading_level_eval.warning_alert.trim() !== '' &&
        typeof json.curricular_summary === 'string' &&
        json.curricular_summary.trim() !== ''
      );
    }
    // Helper para realizar llamadas con reintentos automáticos
    // Helper to perform calls with stream delta tracking and parsing
    async function callClaudeWithRetryStream(
      systemPrompt: string,
      userPrompt: string,
      validateFn: (json: any) => boolean,
      stepName: string,
      fieldPrefix: string,
      sendEvent: (event: string, data: any) => void,
      forceFailFirstAttempt = false
    ): Promise<any> {
      let attempt = 0;
      const maxAttempts = 3;
      let lastError = '';
      let simulatedFailure = forceFailFirstAttempt;

      while (attempt < maxAttempts) {
        attempt++;
        const _t0 = Date.now();
        console.log(`[generate-chain] ${stepName} — Intento ${attempt}/${maxAttempts}`);
        console.log(`[REI⏱] ${stepName} | Intento ${attempt}/${maxAttempts} | INICIO | sys:~${Math.round(systemPrompt.length/4)}tk | usr:~${Math.round(userPrompt.length/4)}tk`);
        
        sendEvent('status', {
          step: stepName,
          attempt,
          message: `${stepName === 'Paso 0: Texto de la Sesión' ? 'Generando texto de sesión...' : stepName === 'Paso 1: Estructura Base' ? 'Diseñando actividades...' : 'Generando adaptaciones y rúbrica...'} (Intento ${attempt}/${maxAttempts})`
        });

        let currentSystemPrompt = systemPrompt;
        if (lastError) {
          currentSystemPrompt += `\n\n⚠️ NOTA DE REINTENTO: En tu respuesta anterior, el JSON falló la validación con el error: "${lastError}". Por favor, asegúrate de corregir este problema en este intento y devuelve únicamente el objeto JSON con la estructura exacta solicitada.`;
        }

        try {
          let responseText = '';

          if (simulatedFailure && attempt === 1) {
            console.log(`[generate-chain] [TEST RETRY] Simulando respuesta corrompida e inválida para: ${stepName}`);
            responseText = `Este texto es inválido intencionadamente y no representa un JSON válido.`;
            await new Promise(r => setTimeout(r, 1000));
          } else {
            const stream = await anthropic.messages.stream({
              model: model as any,
              max_tokens: 6000,
              system: [
                {
                  type: 'text',
                  text: currentSystemPrompt,
                  cache_control: { type: 'ephemeral' }
                }
              ] as any,
              messages: [{ role: 'user', content: userPrompt }],
            });

            // Feed chunks to sseParser
            const sseParser = new SSEParser((key, char) => {
              const fieldPath = fieldPrefix ? `${fieldPrefix}.${key}` : key;
              sendEvent('chunk', { field: fieldPath, chunk: char });
            });

            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const text = chunk.delta.text;
                responseText += text;
                sseParser.write(text);
              }
            }
          }

          const _dur = ((Date.now() - _t0) / 1000).toFixed(1);
          console.log(`[REI⏱] ${stepName} | Intento ${attempt} | STREAM_FIN | ${_dur}s | resp:~${Math.round(responseText.length/4)}tk`);
          let cleanText = responseText;
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
          }
          if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
          }
          cleanText = cleanText.trim();

          const parsedJson = JSON.parse(cleanText);

          if (validateFn(parsedJson)) {
            console.log(`[generate-chain] ${stepName} completado con éxito en el intento ${attempt}`);
            console.log(`[REI⏱] ${stepName} | ÉXITO | ${((Date.now()-_t0)/1000).toFixed(1)}s total`);
            return parsedJson;
          } else {
            console.log(`[REI⏱] ${stepName} | Intento ${attempt} | VALID_FAIL | ${((Date.now()-_t0)/1000).toFixed(1)}s | campos:${Object.keys(parsedJson||{}).join(',')}`);
            lastError = 'El JSON generado no tiene los campos de estructura obligatorios requeridos para esta fase.';
            console.warn(`[generate-chain] ${stepName} falló validación de esquema en el intento ${attempt}: ${lastError}`);
          }
        } catch (err: any) {
          const _errDur = ((Date.now() - _t0) / 1000).toFixed(1);
          console.log(`[REI⏱] ${stepName} | Intento ${attempt} | EXCEPCIÓN | ${_errDur}s | ${err?.constructor?.name||'?'} | status:${err?.status||'N/A'} | ${(err?.message||'').substring(0,120)}`);
          lastError = err.message || 'Error de comunicación o parseo de JSON.';
          console.warn(`[generate-chain] ${stepName} falló en el intento ${attempt}: ${lastError}`);
        }
      }

      throw new Error(`Error fatal en la capa "${stepName}" tras ${maxAttempts} intentos. Último error: ${lastError}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Paso 0: Generación de Texto de Lectura (Si aplica)
    // ─────────────────────────────────────────────────────────────────────────
    const systemPrompt0 = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es analizar el Objetivo de Aprendizaje (OA) y determinar si requiere comprensión lectora (lectura de textos literarios, no literarios, informativos o de medios).
Si requiere comprensión lectora, debes clasificarlo y generar un texto original ad hoc adaptado para la sesión de clase, con las siguientes reglas:
1. OA de comprensión lectora argumentativa (analizar textos de opinión, argumentativos, publicidad, etc.) -> Genera una columna de opinión original de entre 300 y 400 palabras.
2. OA de comprensión lectora literaria (analizar narraciones, cuentos, mitos, novelas, etc.) -> Genera un cuento o fragmento narrativo original de entre 300 y 500 palabras.
3. OA de comprensión lectora informativa (analizar textos expositivos, artículos informativos, noticias, etc.) -> Genera un artículo o texto expositivo original de entre 300 y 400 palabras.
4. OA de escritura, producción de textos o comunicación oral que NO requiera un texto base de lectura comprensiva -> No generes ningún texto (establece todos los campos en null).

REGLAS PARA EL TEXTO GENERADO:
- Debe ser 100% original, creado por la IA (no copiado de ninguna fuente real).
- Debe ser coherente con el nivel del curso (ej. 2° Medio), la unidad y el tema curricular sugerido.
- Debe contener de manera explícita y clara los elementos que las actividades analizarán (ej. si el tema es individualismo/solidaridad y el foco es tesis/argumentos, el texto debe tener una tesis obvia y argumentos concretos; si es literario, debe tener personajes con nombres propios identificables y un conflicto central claro).
- Debe tener un título y un autor ficticio creíble (ej. "Andrés Valenzuela", "Marta Urrutia", etc. - NUNCA uses "Autor: IA" o nombres artificiales de IA).

Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json).

Estructura del JSON:
{
  "tipo": "Columna de opinión" | "Cuento" | "Artículo informativo" | null,
  "titulo": "título del texto o null",
  "autor": "nombre del autor o null",
  "cuerpo": "cuerpo completo del texto o null"
}`;

    const userPrompt0 = `
DATOS DE LA PLANIFICACIÓN:
- Asignatura: ${subject}
- Curso/Nivel: ${grade}
- Objetivo de Aprendizaje (OA): ${effectiveLearningObjective}
- Unidad: ${unit}
- Alcance de la planificación: ${planningScope}
${cursoNombre ? `- Curso: ${cursoNombre}` : ''}
`;

    const testRetry = formData.get('test_retry') === 'true';

    // ─────────────────────────────────────────────────────────────────────────
    // Paso 1: Estructura Base (backward_design)
    // ─────────────────────────────────────────────────────────────────────────
    const systemPrompt1 = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es generar el diseño hacia atrás (backward_design) y la secuencia de actividades base.
INSTRUCCIÓN DE LONGITUD CRÍTICA: Escribe de forma muy concisa, directa y al grano.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json).
Asegúrate de que todas las comillas dobles dentro de los valores de las cadenas JSON estén correctamente escapadas como \\" o utiliza comillas simples.

El JSON debe tener exactamente esta estructura:
{
  "backward_design": {
    "objective": "SOLO el objetivo operativo: 1-2 oraciones con verbo(s) en infinitivo. PROHIBIDO ABSOLUTO: (a) códigos OA como OA 1, OA 9, OA 21; (b) texto oficial del currículo entre comillas; (c) 'El estudiante...', 'El docente...'. CORRECTO: 'Analizar la tesis y los argumentos de una columna de opinión, identificar fallas argumentativas y dialogar fundamentando una postura personal.' INCORRECTO: 'OA 9: Analizar y evaluar textos... El docente conducirá...'",
    "assessment_evidence": "Describe UN producto concreto y observable que evidencia el logro del OA, incluyendo los criterios mínimos de calidad.",
    "activities_sequence": "Secuencia de actividades cronológica y compacta. Debes estructurar la sesión de la siguiente manera:
1. ENCABEZADO DE SESIÓN (OBLIGATORIO): Inicia la secuencia con un encabezado en negrita EXACTAMENTE en este formato: **SESIÓN X · [Nombre Unidad] · [Nombre Lección] · [Curso] · [Duración]**. Inmediatamente después, coloca este bloque de texto:
'Tipo / OA: [Foco pedagógico e indicación de OAs basales y complementarios]\\nEvaluación: [Formato del ticket de salida y técnica, ej: Formativa — Ticket de salida RICE (individual, escrito)]'. Queda estrictamente PROHIBIDO generar cualquier tabla Markdown en este encabezado.
2. Inicio (10-15 min) con guion narrativo y referencias a elementos de anclaje.
3. Desarrollo (55-65 min) con modelado docente y práctica autónoma. Durante el Desarrollo, utiliza el texto de la sesión provisto como material de lectura base y modela sobre él (no inventes un texto nuevo ni uses textos genéricos; todas las actividades y preguntas de monitoreo lateral deben hacer referencia directa y específica a dicho texto).
4. Cierre (10-15 min) con ticket de salida de 4 líneas y referencias a anclajes. El ticket de salida debe usar obligatoriamente la técnica de escritura seleccionada: ${writingTechnique.toUpperCase()}. ${writingTechnique === 'rice' ? 'Estructúralo obligatoriamente con el formato de 4 líneas usando exactamente estas etiquetas literales: R (Repetir), I (Incluir), C (Citar), E (Explicar). Cada etiqueta en su propia línea.' : 'Estructúralo obligatoriamente con el formato de 4 líneas usando exactamente la estructura OREO con estas etiquetas literales: O (Opinión), R (Razón), E (Ejemplo), O (Opinión). Cada etiqueta en su propia línea. No uses otras estructuras como hipótesis o contraargumentación.'} Todo extremadamente conciso, sin prosa teórica y sin siglas metodológicas."
  }
}

${enrichmentBlock}`;

    let userPrompt1 = `
${roadmapSessionContext}
${officialOABlock}
DATOS DE LA PLANIFICACIÓN:
- Asignatura: ${subject}
- Curso/Nivel: ${grade}
- Objetivo de Aprendizaje (OA): ${effectiveLearningObjective}
- Unidad: ${unit}
- Alcance de la planificación: ${planningScope}
${cursoNombre ? `- Curso: ${cursoNombre}` : ''}
${fileName ? `- Archivo de referencia adjunto: ${fileName}` : ''}
${extractedText ? `\n[MATERIAL DE REFERENCIA EXTRAÍDO]:\n${extractedText.substring(0, 15000)}` : ''}
${sesionesDisp || duracionBloqueMin ? `
━━━ CONTEXTO DE HORARIO REAL ━━━
${sesionesDisp
  ? `Sesiones disponibles: ${sesionesDisp} sesiones. Distribuye en EXACTAMENTE ${sesionesDisp} sesión(es).`
  : `Duración del bloque: ${duracionBloqueMin} minutos.`
}
` : ''}`;

    // ─────────────────────────────────────────────────────────────────────────
    // Paso 2: Adaptaciones de Accesibilidad (dua_adaptations)
    // ─────────────────────────────────────────────────────────────────────────
    const systemPrompt2 = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es tomar una planificación existente y agregar las adaptaciones de accesibilidad organizadas en un objeto JSON con tres niveles de accesibilidad (n1, n2, n3).
INSTRUCCIÓN DE LONGITUD CRÍTICA: Escribe de forma muy concisa y directa.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código.
Asegúrate de copiar exactamente todos los campos de "backward_design" generados en el paso anterior sin alterarlos, y añadir la clave "dua_adaptations" estructurada exactamente como se muestra a continuación:

El JSON resultante debe tener exactamente esta estructura:
{
  "backward_design": {
    "objective": "...",
    "assessment_evidence": "...",
    "activities_sequence": "..."
  },
  "dua_adaptations": {
    "n1": "Detalle de los textos y materiales adaptados para el Nivel 1 (Universal), ej. lectura autónoma del texto completo y vocabulario clave en pizarra de forma muy breve (máximo 15 palabras).",
    "n2": "Detalle de los textos y materiales adaptados para el Nivel 2 (Con apoyos), ej. lectura del texto con párrafos numerados y tarjeta de vocabulario personal de forma muy breve (máximo 15 palabras).",
    "n3": "Detalle de los textos y materiales adaptados para el Nivel 3 (Intensivo), ej. lectura simplificada, párrafos clave subrayados o apoyo del docente de forma muy breve (máximo 15 palabras)."
  }
}

${enrichmentBlock}`;

    // ─────────────────────────────────────────────────────────────────────────
    // Paso 3: Apoyos y Guías por Nivel (rti_supports)
    // ─────────────────────────────────────────────────────────────────────────
    const systemPrompt3 = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es tomar la planificación existente y añadir las guías diferenciadas por nivel tanto para la práctica autónoma como para el ticket de salida.
INSTRUCCIÓN DE LONGITUD CRÍTICA: Escribe de forma muy concisa y directa.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código.
Asegúrate de copiar exactamente todos los campos anteriores ("backward_design", "dua_adaptations") sin alterarlos, y añadir la clave "rti_supports" estructurada como se detalla a continuación.

El JSON resultante debe tener exactamente esta estructura:
{
  "backward_design": { ... },
  "dua_adaptations": { ... },
  "rti_supports": {
    "n1": {
      "practice": "Descripción breve (máximo 15 palabras) de la versión estándar de la práctica autónoma.",
      "ticket": "Descripción breve (máximo 15 palabras) del ticket de salida completo sin andamios."
    },
    "n2": {
      "practice": "Descripción breve (máximo 15 palabras) del apoyo/guía diferenciada (ej. frases de inicio, pistas) para la práctica autónoma de Nivel 2.",
      "ticket": "Descripción breve (máximo 15 palabras) del ticket de salida con andamios o líneas de inicio."
    },
    "n3": {
      "practice": "Descripción breve (máximo 15 palabras) de la práctica autónoma simplificada a lo esencial para Nivel 3.",
      "ticket": "Descripción breve (máximo 15 palabras) del ticket de salida simplificado (ej. oral, o completación)."
    }
  }
}

${enrichmentBlock}`;

    // ─────────────────────────────────────────────────────────────────────────
    // Paso 4: Anclajes, Rúbrica y Evaluación Lectora
    // ─────────────────────────────────────────────────────────────────────────
    const systemPrompt4 = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es completar la planificación agregando las frases de anclaje, la rúbrica de evaluación, la evaluación de nivel de lectura y el resumen curricular compacto.
INSTRUCCIÓN DE LONGITUD CRÍTICA: Sé extremadamente breve y conciso en los campos nuevos para asegurar que el JSON quepa en el límite de tokens y no se corte. La rúbrica debe ser sumamente compacta (criterios cortos en la tabla de heteroevaluación). El resumen curricular debe ser de un máximo de 2 líneas.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código.
Asegúrate de que todas las comillas dobles dentro de los valores de las cadenas JSON estén correctamente escapadas como \\" y que TODOS los saltos de línea dentro de los valores estén escapados como \\n. Queda estrictamente PROHIBIDO incluir saltos de línea físicos/reales (retornos de carro reales) dentro de los strings del JSON.

El JSON resultante debe tener exactamente esta estructura:
{
  "nlp_technique": "Tres frases de anclaje/reactivación...",
  "rubric": "Evaluación diferenciada...",
  "reading_level_eval": {
    "estimated_level": "...",
    "warning_alert": "..."
  },
  "curricular_summary": "Resumen curricular compacto..."
}

REGLAS DE DISEÑO DE LOS NUEVOS CAMPOS:
1. TÉCNICAS DE ANCLAJE (nlp_technique):
   Escribe tres frases de anclaje emocional-cognitivo literales en estilo directo para el docente: (1) frase de apertura, (2) frase de reactivación en la pausa activa, (3) frase de cierre motivadora. NO uses la sigla PNL en el texto.
2. RÚBRICA DE EVALUACIÓN SUGERIDA (rubric):
   Incluye heteroevaluación docente en tabla Markdown (Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3). Incluye autoevaluación y coevaluación (en viñetas) únicamente de forma sugerida si corresponden según la actividad (autoevaluación para trabajo individual/reflexión, coevaluación para trabajo grupal/pares). No las forces si no aplican.
3. EVALUACIÓN LECTORA (reading_level_eval):
   Nivel de lectura estimado y alerta de complejidad.
4. RESUMEN CURRICULAR COMPACTO (curricular_summary):
   Genera un resumen de la sesión de 3 a 5 líneas. Debe contener de forma muy concreta y literal: el texto/historia usado (con su título), el personaje o personajes principales (con sus nombres), el conflicto o tema central, y cualquier dato concreto que una sesión futura necesite saber para no inventar algo distinto (ej. nombres propios, lugares clave, objetos mágicos o metas específicas). Sé muy breve y directo.

${enrichmentBlock}`;

    // Mock sessions for fallback simulation
    const mockSession1 = {
      "backward_design": {
        "objective": "Analizar el inicio del cuento 'El Guardián del Faro de las Estrellas' identificando al protagonista Bernardo, el faro titilante y el conflicto de la estrella apagándose.",
        "assessment_evidence": "Ficha de análisis del personaje de Bernardo y esquema del conflicto central (la estrella moribunda), evaluada con escala de apreciación.",
        "activities_sequence": `**SESIÓN 1 · Unidad 3 · Lección 1: El faro de Bernardo · 2° Medio · 90 min**
Tipo / OA: Lectura Comprensiva / OA 3 (basal)
Objetivo: Analizar el inicio del cuento 'El Guardián del Faro de las Estrellas' identificando al protagonista Bernardo
Evaluación: Formativa — Ticket de salida ${writingTechnique.toUpperCase()} (individual, escrito)

Inicio: Activación con la frase '¿Alguna vez han sentido que una pequeña luz en la distancia los mantiene a salvo?' y la pregunta detonante '¿Qué harían si esa luz comenzara a parpadear y apagarse?'.
Desarrollo: Lectura en voz alta del capítulo 1 del texto de la sesión. El docente realiza modelado en voz alta sobre las motivaciones de Bernardo y cómo se siente solo en el faro. Práctica autónoma completando la ficha de personaje y respondiendo preguntas en el cuaderno.
Cierre: Reflexión en parejas y Ticket de salida ${writingTechnique.toUpperCase()} (${writingTechnique === 'rice' ? 'R (Repetir): La estrella del faro se está apagando, I (Incluir): Creo que Bernardo se siente asustado, C (Citar): El texto dice \"la estrella comenzó a apagarse\", E (Explicar): Esto explica que su vida y la seguridad del puerto dependen de que la luz vuelva.' : 'O (Opinión): Bernardo debe viajar a buscar ayuda, R (Razón): Porque la luz está fallando, E (Ejemplo): El texto relata que titiló tres veces, O (Opinión): Por eso apoyo su partida.'}) sobre el peligro que corre el puerto, y frase final 'Cada palabra leída nos acerca a la luz'.`
      },
      "dua_adaptations": {
        "n1": "Universal: Apoyo visual con imágenes del faro y la estrella en pizarra.",
        "n2": "Con apoyos: Texto con párrafos numerados y glosario en el escritorio.",
        "n3": "Intensivo: Párrafos clave subrayados y lectura compartida."
      },
      "rti_supports": {
        "n1": {
          "practice": "Completar la ficha de personaje de Bernardo de forma autónoma.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} completo.`
        },
        "n2": {
          "practice": "Completar la ficha usando organizador gráfico con palabras de inicio.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} con líneas de inicio.`
        },
        "n3": {
          "practice": "Completar la ficha seleccionando opciones de una lista prediseñada.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} simplificado de 1 oración.`
        }
      },
      "gamification": "",
      "nlp_technique": "1. Frase de apertura: Bienvenidos, futuros guardianes de la palabra, hoy encenderemos la luz de la lectura.\n2. Frase de reactivación: Respiremos profundo, tomemos la energía de la estrella titilante y sigamos adelante.\n3. Frase de cierre: Felicitaciones, han mantenido la llama encendida con sus ideas.",
      "rubric": "Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3\nIdentificación de Bernardo | Nombra a Bernardo y describe su rol en el faro | Nombra a Bernardo pero no describe su rol | No identifica a Bernardo | Ficha visual | Ficha con opciones múltiples\nDescripción del conflicto | Explica que la estrella del faro se está apagando y el puerto corre peligro | Describe solo uno de los aspectos | No describe el conflicto | Preguntas guiadas | Selección de alternativas",
      "reading_level_eval": {
        "estimated_level": "Segundo básico (adecuado)",
        "warning_alert": "Sin alertas de complejidad crítica."
      },
      "curricular_summary": "Texto: 'El Guardián del Faro de las Estrellas'. Personaje: Bernardo. Conflicto: La estrella del faro se apaga y el puerto corre peligro.",
      "writing_technique": writingTechnique,
      "texto_sesion": {
        "tipo": "Cuento",
        "titulo": "El Guardián del Faro de las Estrellas",
        "autor": "Gabriel Mistral",
        "cuerpo": "Bernardo vivía en el faro desde hacía más de cincuenta años. Todas las tardes, al ponerse el sol, subía los setenta y dos escalones de caracol para encender la gran lámpara de cristal. La marea siempre cantaba a lo lejos una vieja canción que Bernardo conocía de memoria. Pero esa noche, algo era diferente. La luz titiló tres veces de forma temblorosa, como si estuviera cansada de brillar, y la estrella en la cima comenzó a apagarse lentamente."
      }
    };

    const mockSession2 = {
      "backward_design": {
        "objective": "Participar activamente en conversaciones grupales sobre textos leídos. Debate oral: Bernardo (buscar ayuda) vs. Alcaldesa (evacuar puerto).",
        "assessment_evidence": "Debate oral estructurado sobre la decisión de Bernardo, evaluado mediante rúbrica de participación oral.",
        "activities_sequence": `**SESIÓN 2 · Unidad 3 · Lección 2: El consejo del puerto · 2° Medio · 90 min**
Tipo / OA: Expresión Oral / OA 1 (basal)
Objetivo: Exponer argumentos en un debate estructurado sobre la decisión de Bernardo
Evaluación: Formativa — Rúbrica de participación (parejas)

Inicio: Activación con la frase 'Nuestra voz es el faro que guía a los demás en la tormenta'.
Desarrollo: Debate grupal dividiendo el curso entre Bernardo (quiere viajar a buscar ayuda) y la alcaldesa (quiere evacuar el puerto). Práctica autónoma elaborando argumentos breves en parejas utilizando citas de la lectura anterior.
Cierre: Ticket de salida ${writingTechnique.toUpperCase()} (${writingTechnique === 'rice' ? 'R (Repetir): La postura de Bernardo, I (Incluir): Es más valiente, C (Citar): El texto dice \"la marea cantaba\", E (Explicar): Porque prefiere salvar el faro.' : 'O (Opinión): Bernardo tiene la razón, R (Razón): Porque evacuar no soluciona el problema, E (Ejemplo): Como señala Bernardo, O (Opinión): Por eso su plan es mejor.'}) sobre qué postura es más convincente.`
      },
      "dua_adaptations": {
        "n1": "Universal: Tarjetas con roles claros y conectores argumentativos.",
        "n2": "Con apoyos: Plantilla de argumentos estructurada con conectores lógicos destacados.",
        "n3": "Intensivo: Apoyo directo en la formulación de ideas y vocabulario clave."
      },
      "rti_supports": {
        "n1": {
          "practice": "Modelado docente de cómo argumentar con respeto.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} completo.`
        },
        "n2": {
          "practice": "Guía focalizada para explicar ideas con el conector 'porque'.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} con organizador.`
        },
        "n3": {
          "practice": "Apoyo individualizado para expresar oralmente una opinión corta.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} de completación guiada.`
        }
      },
      "gamification": "",
      "nlp_technique": "1. Frase de apertura: Bienvenidos al consejo de la bahía, donde las palabras decidirán nuestro destino.\n2. Frase de reactivación: Escuchemos el susurro del viento y la marea antes de dar nuestro mejor argumento.\n3. Frase de cierre: Hoy hemos demostrado que la razón brilla más que la misma estrella del faro.",
      "rubric": "Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3\nArgumentación en el debate | Expone un argumento claro usando datos de la historia de Bernardo y la estrella | Expone una opinión sin respaldar | No participa en el debate | Apoyo con tarjetas de inicio | Expresión con sí/no guiada\nRespeto de turnos | Escucha activamente a sus compañeros y espera su turno | Interrumpe ocasionalmente | No respeta los turnos de habla | Uso de objeto de habla | Moderación directa del docente",
      "reading_level_eval": {
        "estimated_level": "Segundo básico (adecuado)",
        "warning_alert": "Sin alertas de complejidad crítica."
      },
      "curricular_summary": "Texto: 'El Guardián del Faro de las Estrellas'. Personajes: Bernardo y la alcaldesa del puerto. Conflicto central: Debate oral entre Bernardo y la alcaldesa.",
      "writing_technique": writingTechnique,
      "texto_sesion": {
        "tipo": "Cuento",
        "titulo": "El Guardián del Faro de las Estrellas",
        "autor": "Gabriel Mistral",
        "cuerpo": "Bernardo vivía en el faro desde hacía más de cincuenta años. Todas las tardes, al ponerse el sol, subía los setenta y dos escalones de caracol para encender la gran lámpara de cristal. La marea siempre cantaba a lo lejos una vieja canción que Bernardo conocía de memoria. Pero esa noche, algo era diferente. La luz titiló tres veces de forma temblorosa, como si estuviera cansada de brillar, y la estrella en la cima comenzó a apagarse lentamente."
      }
    };

    const mockSession3 = {
      "backward_design": {
        "objective": "Escribir una página del diario íntimo de Bernardo en la víspera de su partida al Templo de las Palabras, expresando sus miedos y esperanzas frente a la estrella moribunda.",
        "assessment_evidence": "Texto escrito individual: una entrada de diario desde la perspectiva de Bernardo, evaluada según coherencia narrativa y uso de vocabulario clave.",
        "activities_sequence": `**SESIÓN 3 · Unidad 3 · Lección 3: El diario de Bernardo · 2° Medio · 90 min**
Tipo / OA: Escritura Creativa / OA 12 (basal)
Objetivo: Escribir una página del diario íntimo de Bernardo expresando miedos y esperanzas
Evaluación: Formativa — Autoevaluación del diario escrito

Inicio: Activación con la frase 'La pluma escribe el camino que el corazón teme recorrer' y la pregunta '¿Qué siente Bernardo en su última noche en el faro antes de partir?'.
Desarrollo: Escritura de la entrada del diario de Bernardo. Modelado docente escribiendo un ejemplo expresando el temor a la oscuridad creciente en el faro. Práctica autónoma escribiendo el borrador en el diario de clase.
Cierre: Compartir fragmentos en parejas y ticket de salida ${writingTechnique.toUpperCase()} (${writingTechnique === 'rice' ? 'R (Repetir): Escribir los sentimientos ayuda, I (Incluir): Creo que calma el miedo, C (Citar): El faro titilaba, E (Explicar): Por eso Bernardo escribe.' : 'O (Opinión): Es útil llevar un diario, R (Razón): Porque guarda nuestras memorias, E (Ejemplo): Como el diario de Bernardo, O (Opinión): Por eso debemos escribir.'}) sobre la importancia de escribir los sentimientos.`
      },
      "dua_adaptations": {
        "n1": "Universal: Organizador gráfico en forma de diario con estructura cronológica.",
        "n2": "Con apoyos: Lista de vocabulario clave (faro, estrella, oscuridad, viaje, miedo, esperanza) integrada.",
        "n3": "Intensivo: Plantilla con oraciones de inicio prediseñadas para completar."
      },
      "rti_supports": {
        "n1": {
          "practice": "Explicación paso a paso de la estructura de un diario.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} completo.`
        },
        "n2": {
          "practice": "Apoyo grupal para expandir oraciones cortas y aplicar adjetivos.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} con glosario.`
        },
        "n3": {
          "practice": "Escritura al dictado del docente o completación de oraciones.",
          "ticket": `Ticket de salida ${writingTechnique.toUpperCase()} de 1 palabra/oración oral.`
        }
      },
      "gamification": "",
      "nlp_technique": "1. Frase de apertura: Hoy seremos la mano de Bernardo, trazando sus pensamientos más profundos.\n2. Frase de reactivación: Hagamos una pausa, miremos el horizonte imaginario del mar y dejemos fluir las palabras.\n3. Frase de cierre: Vuestros textos han encendido una nueva luz en el faro de la creatividad.",
      "rubric": "Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3\nCoherencia del diario | Escribe en primera persona (Bernardo) describiendo el viaje y el temor a la oscuridad | Escribe sobre Bernardo pero no en primera persona | No escribe el diario | Organizador visual | Frases guiadas para completar\nUso de vocabulario | Emplea al menos 4 palabras clave relacionadas con el faro y la estrella | Emplea 2 o 3 palabras clave | No emplea palabras clave | Glosario de apoyo | Selección de palabras",
      "reading_level_eval": {
        "estimated_level": "Segundo básico (adecuado)",
        "warning_alert": "Sin alertas de complejidad crítica."
      },
      "curricular_summary": "Texto: 'El Guardián del Faro de las Estrellas'. Personaje: Bernardo. Conflicto: Escritura del diario íntimo de Bernardo.",
      "writing_technique": writingTechnique,
      "texto_sesion": {
        "tipo": "Cuento",
        "titulo": "El Guardián del Faro de las Estrellas",
        "autor": "Gabriel Mistral",
        "cuerpo": "Bernardo vivía en el faro desde hacía más de cincuenta años. Todas las tardes, al ponerse el sol, subía los setenta y dos escalones de caracol para encender la gran lámpara de cristal. La marea siempre cantaba a lo lejos una vieja canción que Bernardo conocía de memoria. Pero esa noche, algo era diferente. La luz titiló tres veces de forma temblorosa, como si estuviera cansada de brillar, y la estrella en la cima comenzó a apagarse lentamente."
      }
    };

    // ─── Setup SSE readable stream response ──────────────────────────────────
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch (e) {
            console.warn('Error enqueuing SSE event:', e);
          }
        };

        const handleBillingError = async (err: any) => {
          console.log('[generate-stream] Running simulation fallback due to API error:', err.message);
          let computedSessionNumber = sessionNumber;
          if (computedSessionNumber === null && cursoId) {
            try {
              const supabaseForCount = bearerToken
                ? makeSupabaseClient(bearerToken)
                : createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                  );
              const { data: existingPlannings, error: countError } = await supabaseForCount
                .from('plannings')
                .select('id')
                .eq('curso_id', cursoId)
                .eq('unit', unit);
              if (!countError && existingPlannings) {
                computedSessionNumber = existingPlannings.length + 1;
              }
            } catch (countErr) {
              console.warn('Error counting plannings for simulation:', countErr);
            }
          }

          let mockSessionSelected = mockSession1;
          if (computedSessionNumber === 2) {
            mockSessionSelected = mockSession2;
          } else if (computedSessionNumber === 3) {
            mockSessionSelected = mockSession3;
          }

          await streamMockSession(sendEvent, mockSessionSelected);
        };

        async function streamMockSession(sendEvent: (event: string, data: any) => void, mockSession: any) {
          // Step 0
          sendEvent('status', { step: 'Paso 0: Texto de la Sesión', attempt: 1, message: 'Generando texto de sesión...' });
          if (mockSession.texto_sesion) {
            sendEvent('chunk', { field: 'texto_sesion.tipo', chunk: mockSession.texto_sesion.tipo });
            sendEvent('chunk', { field: 'texto_sesion.titulo', chunk: mockSession.texto_sesion.titulo });
            sendEvent('chunk', { field: 'texto_sesion.autor', chunk: mockSession.texto_sesion.autor });
            const cuerpo = mockSession.texto_sesion.cuerpo || '';
            for (let i = 0; i < cuerpo.length; i += 20) {
              sendEvent('chunk', { field: 'texto_sesion.cuerpo', chunk: cuerpo.substring(i, i + 20) });
              await new Promise(r => setTimeout(r, 20));
            }
          }
          sendEvent('step_complete', { step: 'Paso 0: Texto de la Sesión', json: { texto_sesion: mockSession.texto_sesion } });

          // Step 1
          sendEvent('status', { step: 'Paso 1: Estructura Base', attempt: 1, message: 'Diseñando actividades...' });
          sendEvent('chunk', { field: 'backward_design.objective', chunk: mockSession.backward_design.objective });
          sendEvent('chunk', { field: 'backward_design.assessment_evidence', chunk: mockSession.backward_design.assessment_evidence });
          const actSeq = mockSession.backward_design.activities_sequence || '';
          for (let i = 0; i < actSeq.length; i += 30) {
            sendEvent('chunk', { field: 'backward_design.activities_sequence', chunk: actSeq.substring(i, i + 30) });
            await new Promise(r => setTimeout(r, 20));
          }
          sendEvent('step_complete', { step: 'Paso 1: Estructura Base', json: { backward_design: mockSession.backward_design } });

          // Step 2
          sendEvent('status', { step: 'Paso 2: Adaptaciones de Accesibilidad', attempt: 1, message: 'Generando adaptaciones DUA...' });
          sendEvent('chunk', { field: 'dua_adaptations.n1', chunk: mockSession.dua_adaptations.n1 });
          sendEvent('chunk', { field: 'dua_adaptations.n2', chunk: mockSession.dua_adaptations.n2 });
          sendEvent('chunk', { field: 'dua_adaptations.n3', chunk: mockSession.dua_adaptations.n3 });
          sendEvent('step_complete', { step: 'Paso 2: Adaptaciones de Accesibilidad', json: { dua_adaptations: mockSession.dua_adaptations } });

          // Step 3
          sendEvent('status', { step: 'Paso 3: Apoyos por Nivel', attempt: 1, message: 'Estructurando apoyos RTI...' });
          sendEvent('chunk', { field: 'rti_supports.n1.practice', chunk: mockSession.rti_supports.n1.practice });
          sendEvent('chunk', { field: 'rti_supports.n1.ticket', chunk: mockSession.rti_supports.n1.ticket });
          sendEvent('chunk', { field: 'rti_supports.n2.practice', chunk: mockSession.rti_supports.n2.practice });
          sendEvent('chunk', { field: 'rti_supports.n2.ticket', chunk: mockSession.rti_supports.n2.ticket });
          sendEvent('chunk', { field: 'rti_supports.n3.practice', chunk: mockSession.rti_supports.n3.practice });
          sendEvent('chunk', { field: 'rti_supports.n3.ticket', chunk: mockSession.rti_supports.n3.ticket });
          sendEvent('step_complete', { step: 'Paso 3: Apoyos por Nivel', json: { rti_supports: mockSession.rti_supports } });

          // Step 4
          sendEvent('status', { step: 'Paso 4: Cierre y Rúbrica', attempt: 1, message: 'Generando rúbrica...' });
          sendEvent('chunk', { field: 'nlp_technique', chunk: mockSession.nlp_technique });
          sendEvent('chunk', { field: 'rubric', chunk: mockSession.rubric });
          sendEvent('chunk', { field: 'reading_level_eval.estimated_level', chunk: mockSession.reading_level_eval.estimated_level });
          sendEvent('chunk', { field: 'reading_level_eval.warning_alert', chunk: mockSession.reading_level_eval.warning_alert });
          sendEvent('chunk', { field: 'curricular_summary', chunk: mockSession.curricular_summary });
          sendEvent('step_complete', { step: 'Paso 4: Cierre y Rúbrica', json: {
            nlp_technique: mockSession.nlp_technique,
            rubric: mockSession.rubric,
            reading_level_eval: mockSession.reading_level_eval,
            curricular_summary: mockSession.curricular_summary
          }});

          // Save counter
          if (supabaseForTrial && trialUserId) {
            try {
              await incrementCounter(supabaseForTrial, trialUserId, 'planifications_generated');
            } catch (e) {
              console.warn('Error incrementing counter during mock session stream:', e);
            }
          }

          // Complete
          sendEvent('complete', { json: mockSession });
        }

        try {
          // Paso 0: Texto de la sesión
          const step0Json = await callClaudeWithRetryStream(
            systemPrompt0,
            userPrompt0,
            validateStep0,
            'Paso 0: Texto de la Sesión',
            'texto_sesion',
            sendEvent,
            testRetry
          );
          sendEvent('step_complete', { step: 'Paso 0: Texto de la Sesión', json: { texto_sesion: step0Json } });

          // Prepare userPrompt1 with step0 text
          let finalUserPrompt1 = userPrompt1;
          if (step0Json && step0Json.cuerpo) {
            finalUserPrompt1 += `\n\n━━━ TEXTO DE LECTURA GENERADO PARA LA SESIÓN ━━━\nTipo: ${step0Json.tipo}\nTítulo: ${step0Json.titulo}\nAutor: ${step0Json.autor}\nCuerpo:\n${step0Json.cuerpo}\n\nINSTRUCCIÓN CRÍTICA DE COHERENCIA: La secuencia de actividades (Inicio, preguntas de monitoreo lateral en Desarrollo, Práctica autónoma y Cierre) DEBE hacer referencia directa, concreta y explícita a este texto generado (usa sus argumentos, personajes, ideas o citas específicas). No crees actividades genéricas ni menciones otros textos.`;
          } else {
            finalUserPrompt1 += `\n\nGenera la estructura base de la sesión (backward_design) alineada al OA y contexto. No agregues adaptaciones de accesibilidad, guías diferenciadas por nivel ni gamificación en la secuencia de actividades; NO uses referencias entre corchetes ni placeholders para marcarlos. El diseño debe enfocarse únicamente en el flujo estándar para el grupo completo, ya que las adaptaciones correspondientes se estructurarán de forma independiente en las secciones posteriores.`;
          }

          // Paso 1: Estructura Base
          const step1Json = await callClaudeWithRetryStream(
            systemPrompt1,
            finalUserPrompt1,
            validateStep1,
            'Paso 1: Estructura Base',
            '',
            sendEvent,
            testRetry
          );
          step1Json.texto_sesion = step0Json;
          sendEvent('step_complete', { step: 'Paso 1: Estructura Base', json: step1Json });

          // Paso 2: Adaptaciones DUA
          const userPrompt2 = `Tomando como base la estructura generada en el paso anterior, añade el campo "dua_adaptations" estructurado por niveles. Asegúrate de mantener intacto todo el contenido de "backward_design" sin cambiar ni una sola palabra.\n\nPLANIFICACIÓN ANTERIOR:\n${JSON.stringify(step1Json, null, 2)}`;
          const step2Json = await callClaudeWithRetryStream(
            systemPrompt2,
            userPrompt2,
            validateStep2,
            'Paso 2: Adaptaciones de Accesibilidad',
            '',
            sendEvent
          );
          step2Json.texto_sesion = step0Json;
          sendEvent('step_complete', { step: 'Paso 2: Adaptaciones de Accesibilidad', json: step2Json });

          // Paso 3: Apoyos RTI
          const userPrompt3 = `Tomando como base la planificación del paso anterior, añade el campo "rti_supports" estructurado con las claves "practice" y "ticket" para los tres niveles. Asegúrate de mantener intactos todos los campos existentes de "backward_design" y "dua_adaptations".\n\nPLANIFICACIÓN ANTERIOR:\n${JSON.stringify(step2Json, null, 2)}`;
          const step3Json = await callClaudeWithRetryStream(
            systemPrompt3,
            userPrompt3,
            validateStep3,
            'Paso 3: Apoyos por Nivel',
            '',
            sendEvent
          );
          step3Json.texto_sesion = step0Json;
          sendEvent('step_complete', { step: 'Paso 3: Apoyos por Nivel', json: step3Json });

          // Paso 4: Cierre y Rúbrica
          // Paso 4 — Nuevo contrato: Claude genera SOLO los 4 campos nuevos.
          // texto_sesion y backward_design se envían como contexto mínimo.
          // dua_adaptations y rti_supports los aporta step3Json en el merge (no se envían a Claude).
          const step4Input = {
            texto_sesion: step3Json.texto_sesion,
            backward_design: step3Json.backward_design,
          };
          const userPrompt4 = `Basándote en la planificación anterior, genera ÚNICAMENTE los cuatro campos nuevos: "nlp_technique", "rubric", "reading_level_eval" y "curricular_summary". Responde SOLO con un objeto JSON que contenga exactamente esas 4 claves, sin incluir ningún otro campo.\n\nPLANIFICACIÓN BASE:\n${JSON.stringify(step4Input, null, 2)}`;
          const step4Json = await callClaudeWithRetryStream(
            systemPrompt4,
            userPrompt4,
            validateStep4Partial,
            'Paso 4: Cierre y Rúbrica',
            '',
            sendEvent
          );
          // Selección explícita: solo los 4 campos autorizados de Claude.
          // Cualquier campo extra que Claude pudiera generar queda excluido.
          const step4Fields = {
            nlp_technique: step4Json.nlp_technique,
            rubric: step4Json.rubric,
            reading_level_eval: step4Json.reading_level_eval,
            curricular_summary: step4Json.curricular_summary,
          };
          // Fusión: step3Json aporta backward_design, dua_adaptations, rti_supports.
          // step4Fields aporta únicamente los 4 campos autorizados. Nada más entra.
          const finalJson = {
            ...step3Json,
            ...step4Fields,
          };
          // Validación post-merge: encadena validateStep3 → validateStep2 → validateStep1 + 4 nuevos.
          if (!validateStep4(finalJson)) {
            throw new Error('Validación post-fusión falló: finalJson no cumple validateStep4.');
          }
          finalJson.texto_sesion = step0Json;
          finalJson.gamification = "";
          finalJson.writing_technique = writingTechnique;

          // Save counter
          if (supabaseForTrial && trialUserId) {
            await incrementCounter(supabaseForTrial, trialUserId, 'planifications_generated');
          }

          // Complete
          sendEvent('complete', { json: finalJson });

        } catch (err: any) {
          console.error('Error generating stream:', err);
          const isBillingError = 
            err.message?.includes('credit balance') || 
            err.message?.includes('billing') || 
            err.message?.includes('Anthropic') || 
            err.status === 400 || 
            err.status === 403;

          if (isBillingError) {
            await handleBillingError(err);
          } else {
            sendEvent('error', { message: err.message || 'Ocurrió un error inesperado al generar la planificación.' });
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error in generate API root POST:', error);
    return NextResponse.json(
      { error: error.message || 'Ocurrió un error inesperado.' },
      { status: 500 }
    );
  }
}