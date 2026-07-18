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
  console.log('[Step 1] Fetching official curriculum OAs for 2° Medio...');
  const { data: oas, error: oasError } = await supabase
    .from('curriculum_oa')
    .select('codigo_oa, texto_oa, eje')
    .eq('nivel', '2° Medio')
    .order('codigo_oa', { ascending: true });

  if (oasError) {
    console.error('Error fetching OAs:', oasError.message);
    process.exit(1);
  }
  console.log(`Found ${oas.length} OAs for 2° Medio.`);

  console.log('\n[Step 2] Fetching official curriculum units for 2° Medio...');
  const { data: curriculumUnidades, error: unidadesError } = await supabase
    .from('curriculum_unidades')
    .select('unidad_numero, titulo_tema, oa_codes')
    .eq('nivel', '2° Medio')
    .order('unidad_numero', { ascending: true });

  if (unidadesError) {
    console.error('Error fetching units:', unidadesError.message);
  }
  console.log(`Found ${curriculumUnidades?.length || 0} units for 2° Medio.`);

  // 1. Generate Roadmap via Claude
  console.log('\n[Step 3] Generating Roadmap via Claude...');
  
  const oasContext = oas.map(oa => `- [${oa.codigo_oa}] Eje: ${oa.eje}. Texto: ${oa.texto_oa}`).join('\n');
  const unitsContext = curriculumUnidades && curriculumUnidades.length > 0
    ? curriculumUnidades.map(u => `- Unidad ${u.unidad_numero}: "${u.titulo_tema}" (OAs sugeridos: ${u.oa_codes.join(', ')})`).join('\n')
    : '(No hay unidades oficiales en la base de datos, sugiere una estructura temática estándar de 4 unidades)';

  const roadmapSystemPrompt = `Eres un experto diseñador curricular y asesor pedagógico del Ministerio de Educación de Chile (MINEDUC).
Tu tarea es diseñar un Mapa de Ruta Curricular estructurado para el año escolar de la asignatura "Lenguaje y Literatura" en el nivel "2° Medio".
El mapa debe proponer una distribución curricular de EXACTAMENTE 4 unidades temáticas. Para cada unidad, debes diseñar exactamente 6 sesiones de clase de 90 minutos de forma lógica y secuencial.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json).

El JSON debe tener exactamente la siguiente estructura:
{
  "unidades": [
    {
      "numero": 1,
      "titulo": "Título temático de la Unidad 1",
      "oa_codes": ["OA 1", "OA 3"],
      "eje_principal": "Lectura",
      "sesiones": [
        {
          "numero": 1,
          "titulo": "Título de la clase 1",
          "eje": "Lectura",
          "oa_codes": ["OA 1"]
        },
        ... (hasta la sesión 6)
      ]
    },
    ... (hasta la unidad 4)
  ]
}`;

  const roadmapUserPrompt = `DISEÑA EL MAPA DE RUTA CURRICULAR ANUAL:
- Nivel: 2° Medio
- Asignatura: Lengua y Literatura
- Año Escolar: 2026
- Matrícula: 32 estudiantes
- Estudiantes RTI: N1 (Universal): 24, N2 (DUA): 6, N3 (PIE): 2

CURRÍCULUM OFICIAL CHILENO DISPONIBLE:
${oasContext}

UNIDADES PEDAGÓGICAS OFICIALES:
${unitsContext}

Instrucciones de diseño:
1. Diseña exactamente 4 unidades temáticas.
2. Cada unidad debe contener exactamente 6 sesiones pedagógicas bien tituladas que sigan un hilo temático claro.
3. Para cada unidad, asigna los OAs que corresponden. Distribuye y balancea de forma inteligente los OAs entre las 6 sesiones, cuidando que cada sesión aborde 1 o máximo 2 OAs coherentes con el tema.
4. Asegúrate de incluir y rotar de forma realista los ejes curriculares de Lenguaje (Lectura, Escritura, Comunicación Oral) a lo largo de las clases de cada unidad para lograr un desarrollo balanceado.
5. Devuelve únicamente el JSON solicitado.`;

  let roadmapJSON;
  if (fs.existsSync('generated-roadmap-2medio.json')) {
    console.log('\n[Step 3] Loading existing Roadmap from generated-roadmap-2medio.json...');
    roadmapJSON = JSON.parse(fs.readFileSync('generated-roadmap-2medio.json', 'utf8'));
  } else {
    let roadmapText = '';
    try {
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 8000,
        system: roadmapSystemPrompt,
        messages: [{ role: 'user', content: roadmapUserPrompt }],
      });
      roadmapText = response.content[0].text.trim();
    } catch (err) {
      console.error('Claude API call for Roadmap failed:', err.message);
      process.exit(1);
    }

    let cleanRoadmap = roadmapText;
    if (cleanRoadmap.startsWith('```json')) cleanRoadmap = cleanRoadmap.substring(7);
    if (cleanRoadmap.endsWith('```')) cleanRoadmap = cleanRoadmap.substring(0, cleanRoadmap.length - 3);
    cleanRoadmap = cleanRoadmap.trim();

    try {
      roadmapJSON = JSON.parse(cleanRoadmap);
      console.log('\n--- MAPA DE RUTA 2° MEDIO GENERADO ---');
      console.log(JSON.stringify(roadmapJSON, null, 2));
      fs.writeFileSync('generated-roadmap-2medio.json', JSON.stringify(roadmapJSON, null, 2), 'utf8');
    } catch (err) {
      console.error('Roadmap response was not valid JSON:', err.message);
      process.exit(1);
    }
  }

  // 2. Identify Unit 3 and Session 3
  const unit3 = roadmapJSON.unidades.find(u => u.numero === 3);
  if (!unit3) {
    console.error('Unit 3 not found in generated roadmap!');
    process.exit(1);
  }
  const session3 = unit3.sesiones.find(s => s.numero === 3);
  if (!session3) {
    console.error('Session 3 not found in Unit 3!');
    process.exit(1);
  }

  console.log(`\nTargeting Unit 3: "${unit3.titulo}"`);
  console.log(`Targeting Session 3: "${session3.titulo}"`);
  console.log(`Eje: ${session3.eje}, OAs: ${session3.oa_codes.join(', ')}`);

  const firstOACode = session3.oa_codes[0];
  const oaInfo = oas.find(o => o.codigo_oa === firstOACode) || { codigo_oa: firstOACode, texto_oa: 'Comprender y analizar textos...', eje: session3.eje };

  console.log(`Selected OA for planning: ${firstOACode} — "${oaInfo.texto_oa}"`);

  // 3. Generate Planning for Session 3 of Unit 3
  console.log('\n[Step 4] Generating Planning for Session 3 / Unit 3 (Reproducing Bug)...');

  const roadmapSessionContext = `
━━━ CONTEXTO DEL MAPA DE RUTA CURRICULAR ━━━
El docente está planificando la clase siguiendo un Mapa de Ruta establecido para este curso:
- Unidad: ${unit3.titulo}
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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  // We use the EXACT same quality guidelines from src/app/api/generate/route.ts
  // before our neutral correction, to check if it reproduces the bug, OR let's check
  // how the actual endpoint generated the planning.
  // Wait! Let's check how the actual generate route behaves. We will read the system prompt in our route and replicate it.
  
  const systemPromptPre = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es generar una planificación de clases completa y estructurada a partir de los datos proporcionados por el docente.
INSTRUCCIÓN DE LONGITUD CRÍTICA: Escribe de forma muy concisa y directa.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json). 
MUY IMPORTANTE: Asegúrate de que todas las comillas dobles dentro de los valores de las cadenas JSON estén correctamente escapadas como \\" o utiliza comillas simples en su lugar para evitar romper el formato JSON.

El JSON debe tener exactamente la siguiente estructura de tipos:
{
  "backward_design": {
    "objective": "Objetivo de aprendizaje del OA oficial y sesión.",
    "assessment_evidence": "Evidencia concreta de evaluación.",
    "activities_sequence": "Secuencia de actividades compacta con tablas de metadatos, inicio (debe incluir el texto literal completo de la Frase anclaje de inicio y la Pregunta detonante en formato de guion), desarrollo (debe incluir las guías diferenciadas Nivel 1, Nivel 2 y Nivel 3 completas en tablas Markdown de preguntas/alternativas/claves, la pausa activa con su frase de reactivación literal, y los detalles del juego de gamificación), y cierre (debe incluir el ticket OREO y la Frase de cierre motivadora de salida literal)."
  },
  "dua_adaptations": "Adaptaciones de accesibilidad organizadas en 3 principios (representación, expresión, compromiso) y apoyos específicos de acceso. Usa el encabezado '**Adaptaciones de accesibilidad**'. NO uses las siglas DUA, RTI, PIE ni Decreto 83.",
  "rti_supports": {
    "general": "Actividad principal universal (Nivel 1): describe la misma tarea y preguntas de la guía Nivel 1 en prosa. No uses siglas RTI en el texto.",
    "targeted": "Actividad con andamiaje (Nivel 2): describe la misma tarea y preguntas de la guía Nivel 2 en prosa. No uses siglas RTI en el texto.",
    "intensive": "Actividad breve (Nivel 3): describe la misma tarea y preguntas de la guía Nivel 3 en prosa. No uses siglas RTI ni PIE en el texto."
  },
  "gamification": "Propuesta gamificada interactiva: describe la misma herramienta Quizizz/insignias con el mismo detalle que en la secuencia de actividades.",
  "nlp_technique": "Tres frases de anclaje/reactivación (inicio, pausa, cierre): escribe las mismas tres frases de anclaje literales que incluiste en la secuencia de actividades. NO uses la sigla PNL.",
  "rubric": "Autoevaluación, coevaluación y heteroevaluación en tabla Markdown con columnas: Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3.",
  "reading_level_eval": {
    "estimated_level": "Nivel de lectura estimado.",
    "warning_alert": "Alerta de complejidad lectora."
  }
}`;

  const systemPromptPost = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es generar una planificación de clases completa y estructurada a partir de los datos proporcionados por el docente.
INSTRUCCIÓN DE LONGITUD CRÍTICA: Escribe de forma muy concisa y directa.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json). 
MUY IMPORTANTE: Asegúrate de que todas las comillas dobles dentro de los valores de las cadenas JSON estén correctamente escapadas como \\" o utiliza comillas simples en su lugar para evitar romper el formato JSON.

El JSON debe tener exactamente la siguiente estructura de tipos:
{
  "backward_design": {
    "objective": "Objetivo de aprendizaje del OA oficial y sesión.",
    "assessment_evidence": "Evidencia concreta de evaluación.",
    "activities_sequence": "Secuencia de actividades cronológica y compacta con tablas de metadatos, inicio, desarrollo (texto base, modelado, pausa activa, práctica autónoma) y cierre OREO. Para evitar duplicación, no incluyas el texto completo de las frases de anclaje, los detalles de gamificación ni las tablas de guías diferenciadas aquí; en su lugar, haz referencias breves a ellos (ej. '[Frase Ancla - Ver Sección 5]', '[Guías Diferenciadas - Ver Sección 3]', '[Detalle Gamificación - Ver Sección 4]') y genera los detalles correspondientes únicamente en sus respectivas secciones del JSON."
  },
  "dua_adaptations": "Adaptaciones de accesibilidad organizadas en 3 principios (representación, expresión, compromiso) y apoyos específicos de acceso. Usa el encabezado '**Adaptaciones de accesibilidad**'. NO uses las siglas DUA, RTI, PIE ni Decreto 83.",
  "rti_supports": {
    "general": "Tabla Markdown de la Guía Nivel 1 (Universal) con columnas: | Pregunta / Tipo | Enunciado y alternativas | Clave |, seguida de una breve indicación sobre cómo el docente monitorea. No uses siglas RTI en el texto.",
    "targeted": "Tabla Markdown de la Guía Nivel 2 (Con andamiaje) con la misma estructura de columnas. No uses siglas RTI en el texto.",
    "intensive": "Tabla Markdown de la Guía Nivel 3 (Focalizada/Apoyo individual) con la misma estructura de columnas. No uses siglas RTI ni PIE en el texto."
  },
  "gamification": "Propuesta gamificada interactiva (dinámica de insignias/retos en formato tabla/viñeta).",
  "nlp_technique": "Tres frases de anclaje/reactivación (inicio, pausa, cierre) escritas en estilo directo para el docente. NO uses la sigla PNL.",
  "rubric": "Autoevaluación, coevaluación y heteroevaluación en tabla Markdown con columnas: Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3.",
  "reading_level_eval": {
    "estimated_level": "Nivel de lectura estimado.",
    "warning_alert": "Alerta de complejidad lectora."
  }
}`;

  const planningUserPrompt = `
${roadmapSessionContext}
${officialOABlock}
DATOS DE LA PLANIFICACIÓN:
- Asignatura: Lengua y Literatura
- Curso/Nivel: 2° Medio
- Objetivo de Aprendizaje (OA): ${firstOACode} — ${oaInfo.texto_oa}
- Unidad: ${unit3.titulo}
- Alcance de la planificación: clase
- Curso: 2° Medio Piloto
- Duración del bloque de clase: 90 minutos.
`;

  // 1. Generate PRE-Correction (with bug)
  console.log('\nGenerating Planning (PRE-CORRECCIÓN)...');
  let planningTextPre = '';
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 8000,
      system: systemPromptPre,
      messages: [{ role: 'user', content: planningUserPrompt }],
    });
    planningTextPre = response.content[0].text.trim();
  } catch (err) {
    console.error('Claude API call failed for Pre-correction:', err.message);
    process.exit(1);
  }

  let cleanPlanningPre = planningTextPre;
  if (cleanPlanningPre.startsWith('```json')) cleanPlanningPre = cleanPlanningPre.substring(7);
  if (cleanPlanningPre.endsWith('```')) cleanPlanningPre = cleanPlanningPre.substring(0, cleanPlanningPre.length - 3);
  cleanPlanningPre = cleanPlanningPre.trim();

  try {
    const planningJSONPre = JSON.parse(cleanPlanningPre);
    console.log('\n--- PLANIFICACIÓN PRE-CORRECCIÓN GENERADA ---');
    fs.writeFileSync('generated-planning-s3-u3-pre.json', JSON.stringify(planningJSONPre, null, 2), 'utf8');
  } catch (err) {
    console.error('Planning Pre-correction response was not valid JSON:', err.message);
    console.log('Raw output:', planningTextPre);
  }

  // 2. Generate POST-Correction (bug fixed)
  console.log('\nGenerating Planning (POST-CORRECCIÓN)...');
  let planningTextPost = '';
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 8000,
      system: systemPromptPost,
      messages: [{ role: 'user', content: planningUserPrompt }],
    });
    planningTextPost = response.content[0].text.trim();
  } catch (err) {
    console.error('Claude API call failed for Post-correction:', err.message);
    process.exit(1);
  }

  let cleanPlanningPost = planningTextPost;
  if (cleanPlanningPost.startsWith('```json')) cleanPlanningPost = cleanPlanningPost.substring(7);
  if (cleanPlanningPost.endsWith('```')) cleanPlanningPost = cleanPlanningPost.substring(0, cleanPlanningPost.length - 3);
  cleanPlanningPost = cleanPlanningPost.trim();

  try {
    const planningJSONPost = JSON.parse(cleanPlanningPost);
    console.log('\n--- PLANIFICACIÓN POST-CORRECCIÓN GENERADA ---');
    fs.writeFileSync('generated-planning-s3-u3-post.json', JSON.stringify(planningJSONPost, null, 2), 'utf8');
  } catch (err) {
    console.error('Planning Post-correction response was not valid JSON:', err.message);
    console.log('Raw output:', planningTextPost);
  }
}

run();
