const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

function parseEnv() {
  if (!fs.existsSync('.env.local')) return {};
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return env;
}

async function run() {
  console.log('[Listener] Started polling for API key and user profile...');
  
  while (true) {
    const env = parseEnv();
    const apiKey = env.ANTHROPIC_API_KEY;
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const hasApiKey = apiKey && apiKey !== 'tu_anthropic_api_key_aqui' && apiKey.trim() !== '';
    
    if (hasApiKey && url && anonKey) {
      try {
        const supabase = createClient(url, anonKey);
        
        // Check if a profile exists
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1);

        if (!profileError && profiles && profiles.length > 0) {
          const userId = profiles[0].id;
          console.log(`[Listener] Found API Key and user profile (${userId}). Starting generation...`);
          
          await generateRealPlan(supabase, apiKey, userId);
          break; // Exit loop after successful execution
        }
      } catch (err) {
        console.error('[Listener] Error during polling check:', err.message);
      }
    }
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function generateRealPlan(supabase, apiKey, userId) {
  try {
    const env = parseEnv();
    const grade = '6° Básico';
    const subject = 'Lenguaje y Comunicación';
    
    // 1. Fetch real OA for 6° Básico from database
    const { data: oas, error: oaError } = await supabase
      .from('curriculum_oa')
      .select('*')
      .eq('nivel', grade)
      .eq('asignatura', 'Lenguaje y Comunicación')
      .limit(1)
      .maybeSingle();

    if (oaError || !oas) {
      throw new Error('Error fetching OA: ' + (oaError?.message || 'No OA found for 6° Básico'));
    }

    // 2. Fetch attitudes and OATs for 6° Básico
    const { data: oats, error: oatError } = await supabase
      .from('curriculum_oat_actitudes')
      .select('tipo, codigo, texto')
      .eq('nivel', grade)
      .order('codigo', { ascending: true });

    if (oatError) {
      throw new Error('Error fetching OAT/Attitudes: ' + oatError.message);
    }

    // 3. Format indicators
    const parseIndicadores = (raw) => {
      if (!raw) return [];
      return raw.split('\n').map(line => line.trim()).filter(Boolean);
    };
    const indicatorsList = parseIndicadores(oas.indicadores);
    const indicadoresFormatted = indicatorsList.map(ind => `  • ${ind}`).join('\n');

    // 4. Format OAT/Attitudes
    let oatActitudesFormatted = '';
    const actitudes = oats.filter(item => item.tipo === 'Actitud');
    const oatsList = oats.filter(item => item.tipo === 'OAT');

    let actBlock = '';
    if (actitudes.length > 0) {
      actBlock = `  Actitudes oficiales del nivel (selecciona e integra una para la autoevaluación/coevaluación):\n` +
        actitudes.map(item => `    • [${item.codigo}] ${item.texto}`).join('\n') + '\n';
    }

    let oatBlock = '';
    if (oatsList.length > 0) {
      oatBlock = `  Objetivos de Aprendizaje Transversales (OAT) del nivel (integra uno para la autoevaluación/coevaluación):\n` +
        oatsList.map(item => `    • [${item.codigo}] ${item.texto}`).join('\n') + '\n';
    }

    oatActitudesFormatted = `\n  ACTITUDES Y OAT OFICIALES DEL NIVEL:\n${actBlock}${oatBlock}`;

    const officialOABlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  OBJETIVO DE APRENDIZAJE OFICIAL MINEDUC — USO OBLIGATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
El docente ha seleccionado el siguiente OA oficial extraído directamente
del Programa de Estudio del Ministerio de Educación de Chile.

INSTRUCCIÓN CRÍTICA: Usa este OA EXACTAMENTE como está escrito.
NO lo modifiques, NO lo resumas, NO lo reemplaces ni lo inventes.
Toda la planificación debe estar alineada con este OA e indicadores.

  Eje curricular: ${oas.eje}
  Código:         ${oas.codigo_oa}
  Texto oficial:
  "${oas.texto_oa}"

  Indicadores de Evaluación oficiales que deben guiar la planificación:
${indicadoresFormatted}
${oatActitudesFormatted}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // 5. Enrichment instructions
    const enrichmentBlock = `
════════════════════════════════════════════════════════
CRITERIOS DE CALIDAD INTERNOS — LENGUAJE ${grade}
════════════════════════════════════════════════════════
▸ DISEÑO HACIA ATRÁS (Backward Design)
  El campo "objective" del JSON debe citar el código del OA y su texto oficial.
  El campo "assessment_evidence" debe nombrar un producto concreto y medible.

▸ ESTRUCTURA DE CADA SESIÓN
  [INICIO — aprox. 10 min]
  • Guion narrativo breve (2–3 oraciones), frase de anclaje, pregunta detonante.
  [DESARROLLO — aprox. 30 min]
  • Modelado docente (5 min), práctica guiada (10 min), PAUSA ACTIVA (3–4 min), práctica autónoma diferenciada (12–15 min) en 3 versiones (estándar, con apoyo, breve).
  [CIERRE — aprox. 10 min]
  • 4 preguntas (opinión, razón, ejemplo, opinión final) y frase motivadora.

▸ EVALUACIÓN DIFERENCIADA (campo "rubric" del JSON)
  La rúbrica debe incluir los TRES tipos de evaluación:
  — Autoevaluación: reflexionar sobre el proceso, vinculada explícitamente a una actitud/OAT oficial (debes citar el código exacto y el texto de la actitud/OAT seleccionada).
  — Coevaluación: coevaluar con 2-3 criterios, vinculados a colaboración y diálogo (debes citar el código exacto y el texto de la actitud/OAT seleccionada).
  — Heteroevaluación docente: rúbrica de 3 criterios en 3 niveles de logro, con adaptaciones para versión con apoyo y breve.
════════════════════════════════════════════════════════
`;

    const systemPrompt = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es generar una planificación de clases completa y estructurada a partir de los datos proporcionados por el docente.
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código. El JSON debe tener exactamente la siguiente estructura de tipos:

{
  "backward_design": {
    "objective": "Cita el código y texto EXACTO del OA oficial. Describe el objetivo final de aprendizaje de la planificación.",
    "assessment_evidence": "Describe UN producto concreto y observable que evidencia el logro del OA.",
    "activities_sequence": "Secuencia detallada de actividades con inicio, desarrollo (con pausa activa y práctica diferenciada) y cierre."
  },
  "dua_adaptations": "Adaptaciones concretas organizadas en representación, expresión y compromiso.",
  "rti_supports": {
    "general": "Versión estándar de la actividad.",
    "targeted": "Versión con apoyo (andamiajes).",
    "intensive": "Versión breve e de nivel esencial."
  },
  "gamification": "Sugerencia de herramienta digital (Quizizz, Genially, etc.) y cómo usarla.",
  "nlp_technique": "Frases y guiones de anclaje de inicio, pausa activa y cierre.",
  "rubric": "Evaluación diferenciada en tres tipos: (a) Autoevaluación vinculada a actitud/OAT (cita el código exacto y el texto); (b) Coevaluación vinculada a actitud/OAT (cita el código exacto y el texto); (c) Heteroevaluación docente de 3 criterios.",
  "reading_level_eval": {
    "estimated_level": "Nivel de lectura estimado.",
    "warning_alert": "Alerta de vocabulario o complejidad."
  }
}

${enrichmentBlock}`;

    const promptContent = `
${officialOABlock}
DATOS DE LA PLANIFICACIÓN:
- Asignatura: ${subject}
- Curso/Nivel: ${grade}
- Objetivo de Aprendizaje (OA): ${oas.codigo_oa} — ${oas.texto_oa}
- Unidad: Unidad de Prueba
- Alcance de la planificación: semana
- Duración del bloque de clase: 90 minutos.

Genera la planificación pedagógica con todos los elementos de calidad indicados en el system prompt. Cita el OA oficial con su código exacto en el campo "objective" del backward_design.`;

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: promptContent }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    let cleanText = responseText;
    if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
    cleanText = cleanText.trim();

    const jsonOutput = JSON.parse(cleanText);

    // Save to database
    const { data: savedData, error: dbError } = await supabase
      .from('plannings')
      .insert({
        user_id: userId,
        subject,
        grade,
        learning_objective: `${oas.codigo_oa} — ${oas.texto_oa}`,
        unit: 'Unidad de Prueba',
        content: jsonOutput,
        reading_level: jsonOutput.reading_level_eval || {
          estimated_level: 'Adecuado',
          warning_alert: 'Sin alertas'
        }
      })
      .select('id')
      .single();

    if (dbError) {
      throw dbError;
    }

    console.log('[Listener] Real planning successfully generated and inserted!');
    console.log(`[Listener] Planning ID: ${savedData.id}`);
    console.log('[Listener] Rubric content saved:');
    console.log(jsonOutput.rubric);

    fs.writeFileSync('generated_rubric.txt', typeof jsonOutput.rubric === 'string' ? jsonOutput.rubric : JSON.stringify(jsonOutput.rubric, null, 2), 'utf8');

  } catch (err) {
    console.error('[Listener] Error generating planning:', err.message);
  }
}

run();
