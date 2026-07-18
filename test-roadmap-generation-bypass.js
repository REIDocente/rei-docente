const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

function parseEnv() {
  if (!fs.existsSync('.env.local')) return {};
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.trim().match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return env;
}

const env = parseEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const model = env.ANTHROPIC_MODEL || process.env.ANTHROPIC_MODEL;

async function run() {
  console.log('[Step 1] Loading generated-roadmap.json...');
  if (!fs.existsSync('generated-roadmap.json')) {
    console.error('generated-roadmap.json not found!');
    process.exit(1);
  }
  const roadmapJSON = JSON.parse(fs.readFileSync('generated-roadmap.json', 'utf8'));

  // Fetch official curriculum OAs for 6° Básico to get the exact text
  const { data: oas, error: oasError } = await supabase
    .from('curriculum_oa')
    .select('codigo_oa, texto_oa, eje')
    .eq('nivel', '6° Básico')
    .eq('asignatura', 'Lenguaje y Comunicación');

  if (oasError) {
    console.error('Error fetching OAs:', oasError.message);
    process.exit(1);
  }

  // 2. Identify Unit 2 and Session 3
  const unit2 = roadmapJSON.unidades.find(u => u.numero === 2);
  if (!unit2) {
    console.error('Unit 2 not found in generated roadmap!');
    process.exit(1);
  }
  const session3 = unit2.sesiones.find(s => s.numero === 3);
  if (!session3) {
    console.error('Session 3 not found in Unit 2!');
    process.exit(1);
  }

  console.log(`\nTargeting Unit 2: "${unit2.titulo}"`);
  console.log(`Targeting Session 3: "${session3.titulo}"`);
  console.log(`Eje: ${session3.eje}, OAs: ${session3.oa_codes.join(', ')}`);

  const firstOACode = session3.oa_codes[0];
  const oaInfo = oas.find(o => o.codigo_oa === firstOACode) || { codigo_oa: firstOACode, texto_oa: 'Comprender y analizar textos...', eje: session3.eje };

  console.log(`Selected OA for planning: ${firstOACode} — "${oaInfo.texto_oa}"`);

  // 3. Generate Planning for Session 3 of Unit 2
  console.log('\n[Step 2] Generating Planning for Session 3 / Unit 2...');

  const roadmapSessionContext = `
━━━ CONTEXTO DEL MAPA DE RUTA CURRICULAR ━━━
El docente está planificando la clase siguiendo un Mapa de Ruta establecido para este curso:
- Unidad: ${unit2.titulo}
- Sesión a generar: Sesión 3 de 6
- Título temático/foco de esta sesión: "${session3.titulo}"
- Eje curricular de la sesión: ${session3.eje}
- OAs asociados específicamente a esta sesión: ${session3.oa_codes.join(', ')}

INSTRUCCIÓN DE ALINEACIÓN TEMÁTICA: 
Debes centrar el tema y las actividades de la sesión en el título/foco temático "${session3.titulo}" y enfocar la planificación en el logro de los OAs específicos de la sesión (${session3.oa_codes.join(', ')}), manteniendo la coherencia con el OA general de la planificación.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  const officialOABlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  OBJETIVO DE APRENDIZAJE OFICIAL MINEDUC — USO OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
El docente ha seleccionado el siguiente OA oficial extraído directamente
del Programa de Estudio del Ministerio de Educación de Chile.

INSTRUCCIÓN CRÍTICA: Usa este OA EXACTAMENTE como está escrito.
NO lo modifiques, NO lo resumas, NO lo reemplaces ni lo inventes.
Toda la planificación debe estar alineada con este OA e indicadores.

  Eje curricular: ${oaInfo.eje ?? 'Lectura'}
  Código:         ${firstOACode}
  Texto oficial:
  "${oaInfo.texto_oa}"

  Indicadores de Evaluación oficiales que deben guiar la planificación:
  • Localizan información en textos narrativos o de opinión.
  • Explican el propósito del autor.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  const enrichmentBlock = `
════════════════════════════════════════════════════════
CRITERIOS DE CALIDAD INTERNOS — LENGUAJE 6° Básico
(No los menciones al docente como etiquetas ni secciones separadas.
 Intégralos de forma natural en el documento pedagógico.)
════════════════════════════════════════════════════════

▸ DISEÑO HACIA ATRÁS (Backward Design)
  Parte SIEMPRE del OA oficial. Diseña en este orden:
  1. ¿Cuál es la evidencia concreta de que el estudiante logró el OA? (producto observable, no solo "participación")
  2. ¿Qué criterios permiten evaluar esa evidencia en 3 niveles de logro?
  3. ¿Qué secuencia de actividades conduce a esa evidencia de forma eficiente?
  El campo "objective" del JSON debe citar el código del OA y su texto oficial.
  El campo "assessment_evidence" debe nombrar un producto concreto y medible.

▸ ESTRUCTURA DE CADA SESIÓN (aplícala a CADA sesión si son varias)
  Estructura cada sesión de la siguiente manera dentro del campo "activities_sequence" de forma compacta y sin explicaciones teóricas en prosa:

  1. ENCABEZADO DE SESIÓN Y TABLA DE METADATOS:
     Inicia la sesión con un encabezado descriptivo en negrita: **SESIÓN 3 · [Fecha Clase] · 6° Básico · 90 min**
     Inmediatamente después, genera una tabla Markdown vertical con el siguiente formato exacto:
     | Campo | Detalle |
     | :--- | :--- |
     | **Curso** | 6° Básico |
     | **Fecha** | A definir |
     | **Duración** | 90 minutos / 2 bloques |
     | **Tipo / OA** | [Tipo de inferencia o foco pedagógico / OAs de la sesión] |
     | **Objetivo** | [Objetivo de aprendizaje específico de la sesión] |
     | **Gamificación** | [Herramienta digital sugerida, ej: Quizizz] |
     | **Evaluación** | [Método de evaluación, ej: Autoevaluación (rúbrica 3 niveles · OA15)] |

  2. INICIO (10–15 min) — ACTIVACIÓN:
     Presenta los elementos de anclaje como guiones cortos y líneas directas de 1 o 2 oraciones, sin explicar la teoría de la técnica:
     • **Guion narrativo del docente:** [Breve guion de 2 o 3 oraciones para conectar con la vida real del estudiante]
     • **Frase anclaje:** "[Frase corta, positiva y visual para decir en voz alta]"
     • **Pregunta detonante:** [Pregunta abierta para activar conocimientos previos]
     • **Conexión emocional:** [Una oración corta que ancle el tema]

  3. DESARROLLO (55–65 min):
     • **Modelado docente (15-20 min):**
       — Texto de la sesión: Presenta un texto breve (150-250 palabras) adecuado al nivel y totalmente relacionado con el tema del mapa de ruta "${session3.titulo}".
       — Modelado en voz alta — Pensamiento visible: Describe brevemente el proceso mental en primera persona ("Yo pienso que [inferencia]... porque el texto dice [cita]...").
     • **Pausa activa (3-5 min, a mitad del bloque):**
       — Instrucción brevísima de estiramiento o respiración.
       — Frase de reactivación: "[Frase corta de refocalización en negrita]"
     • **Práctica guiada (15-20 min) — Guías diferenciadas simultáneas:**
       Genera las guías para cada nivel utilizando tablas Markdown compactas (una tabla por nivel) con las columnas: | Pregunta / Tipo | Enunciado y alternativas | Clave |
       — **GUIA NIVEL 1 — Universal SIMCE (aprox. 30 estudiantes):** Tabla con 3 preguntas de alternativas (literal, léxica, inferencial) con sus claves.
       — **GUIA NIVEL 2 — Adaptación nivel 2 (aprox. 10 estudiantes con rezago):** Tabla con 2 preguntas simplificadas con sus claves.
       — **GUIA NIVEL 3 — Adaptación nivel 3 (aprox. 5 estudiantes):** Tabla con 2 preguntas muy breves y directas.
     • **Práctica autónoma (10-15 min):**
       Monitoreo y apoyo diferenciado de la tarea principal.
     • **Gamificación:**
       Indica brevemente la plataforma digital y cómo se implementa en 1-2 oraciones directas.

  4. CIERRE (10–15 min) — TICKET DE SALIDA OREO:
     • **Ticket de salida OREO:** Describe el ticket de salida en 4 líneas breves usando la estructura OREO:
       — **O (Opinión):** [Opinión]
       — **R (Razón):** [Razón]
       — **E (Ejemplo):** [Ejemplo o cita]
       — **O (Opinión reforzada):** [Conclusión]
     • **Frase de cierre:** "[Frase de anclaje de salida]"

▸ EVALUACIÓN DIFERENCIADA (campo "rubric" del JSON)
  La rúbrica debe ser sumamente compacta y estructurada en tablas y viñetas sin prosa explicativa:
  1. **Autoevaluación:** 2 o 3 preguntas de reflexión en viñetas cortas.
  2. **Coevaluación:** 2 o 3 criterios de trabajo colaborativo.
  3. **Heteroevaluación docente (RÚBRICA EN TABLA):** Diseña una tabla Markdown con las columnas:
     | Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3 |
     Mantén las descripciones dentro de las celdas extremadamente breves y cortas (máximo 8 palabras por celda) para evitar que la salida se trunque.

▸ TONO COMPACTO Y ESTRUCTURAL
  • Elimina por completo las siglas PNL, DUA, RTI, PIE. En su lugar usa términos neutros (ej. Nivel 1/2/3, adaptaciones de accesibilidad, guiones directos, pausa de reactivación, frases de anclaje).
  • Los andamiajes, la diferenciación y la rúbrica deben hablar por sí solos a través de su formato y contenido. No agregues etiquetas como "Adaptaciones DUA" o "RTI". En su lugar usa "Adaptaciones de accesibilidad", "Nivel 2", "Nivel 3".
  • Mantén las oraciones cortas, los guiones concretos y usa el formato de tablas Markdown.
════════════════════════════════════════════════════════
`;

  const planningSystemPrompt = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es generar una planificación de clases completa y estructurada a partir de los datos proporcionados por el docente.
INSTRUCCIÓN DE LONGITUD CRÍTICA: Escribe de forma muy concisa y directa.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json). 
MUY IMPORTANTE: Asegúrate de que todas las comillas dobles dentro de los valores de las cadenas JSON estén correctamente escapadas como \\" o utiliza comillas simples en su lugar para evitar romper el formato JSON.

El JSON debe tener exactamente la siguiente estructura de tipos:
{
  "backward_design": {
    "objective": "Objetivo de aprendizaje del OA oficial y sesión.",
    "assessment_evidence": "Evidencia concreta de evaluación.",
    "activities_sequence": "Secuencia de actividades compacta con tablas de metadatos, inicio, desarrollo con texto, modelado, pausa activa, guías diferenciadas en tablas y cierre OREO. Sin siglas metodológicas."
  },
  "dua_adaptations": "Adaptaciones de accesibilidad organizadas en 3 principios (representación, expresión, compromiso) y apoyos específicos de acceso. Usa el encabezado '**Adaptaciones de accesibilidad**'. NO uses las siglas DUA, RTI, PIE ni Decreto 83.",
  "rti_supports": {
    "general": "Actividad principal universal (Nivel 1). No uses siglas RTI en el texto.",
    "targeted": "Actividad con andamiaje (Nivel 2). No uses siglas RTI en el texto.",
    "intensive": "Actividad breve (Nivel 3). No uses siglas RTI ni PIE en el texto."
  },
  "gamification": "Propuesta gamificada interactiva.",
  "nlp_technique": "Tres frases de anclaje/reactivación (inicio, pausa, cierre). NO uses la sigla PNL.",
  "rubric": "Autoevaluación, coevaluación y heteroevaluación en tabla Markdown con columnas: Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3.",
  "reading_level_eval": {
    "estimated_level": "Nivel de lectura estimado.",
    "warning_alert": "Alerta de complejidad lectora."
  }
}

${enrichmentBlock}`;

  const planningUserPrompt = `
${roadmapSessionContext}
${officialOABlock}
DATOS DE LA PLANIFICACIÓN:
- Asignatura: Lenguaje y Comunicación
- Curso/Nivel: 6° Básico
- Objetivo de Aprendizaje (OA): ${firstOACode} — ${oaInfo.texto_oa}
- Unidad: ${unit2.titulo}
- Alcance de la planificación: clase
- Curso: 6° Básico Piloto
- Duración del bloque de clase: 90 minutos.
`;

  let planningText = '';
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 5000,
      system: planningSystemPrompt,
      messages: [{ role: 'user', content: planningUserPrompt }],
    });
    planningText = response.content[0].text.trim();
  } catch (err) {
    console.error('Claude API call for Planning failed:', err.message);
    process.exit(1);
  }

  let cleanPlanning = planningText;
  if (cleanPlanning.startsWith('```json')) cleanPlanning = cleanPlanning.substring(7);
  if (cleanPlanning.endsWith('```')) cleanPlanning = cleanPlanning.substring(0, cleanPlanning.length - 3);
  cleanPlanning = cleanPlanning.trim();

  let planningJSON;
  try {
    planningJSON = JSON.parse(cleanPlanning);
    console.log('\n--- PLANIFICACIÓN DE LA SESIÓN 3 / UNIDAD 2 GENERADA EXITOSAMENTE ---');
    console.log(JSON.stringify(planningJSON, null, 2));
    fs.writeFileSync('generated-planning-s3-u2.json', JSON.stringify(planningJSON, null, 2), 'utf8');
    console.log('Saved to generated-planning-s3-u2.json');
  } catch (err) {
    console.error('Planning response was not valid JSON:', err.message);
    console.log('Raw output:', planningText);
    process.exit(1);
  }

  console.log('\n[All Done]');
}

run();
