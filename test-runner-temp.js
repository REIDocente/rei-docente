const { createClient } = require('@supabase/supabase-js');
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

async function run() {
  console.log('[Test] Querying official OA from database for 6° Básico...');
  const { data: oa } = await supabase
    .from('curriculum_oa')
    .select('*')
    .eq('nivel', '6° Básico')
    .eq('asignatura', 'Lenguaje y Comunicación')
    .limit(1)
    .maybeSingle();

  if (!oa) {
    console.error('[Test] No official OA found in DB for 6° Básico!');
    process.exit(1);
  }
  console.log(`[Test] Found OA: ${oa.codigo_oa}`);

  const formData = new FormData();
  formData.append('subject', 'Lenguaje y Comunicación');
  formData.append('grade', '6° Básico');
  formData.append('unit', 'Unidad de Prueba 1');
  formData.append('curriculum_mode', 'true');
  formData.append('oa_codigo', oa.codigo_oa);
  formData.append('oa_texto', oa.texto_oa);
  formData.append('oa_eje', oa.eje);
  formData.append('indicadores_json', JSON.stringify([oa.indicadores?.split('\n')[0] || '']));
  formData.append('learningObjective', `${oa.codigo_oa} — ${oa.texto_oa}`);
  formData.append('planning_scope', 'clase');
  formData.append('duracion_bloque_min', '90');

  console.log('\n[Test] Sending POST /api/generate...');
  let generateResult = null;
  try {
    const generateRes = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData
    });

    console.log('[Test] /api/generate Status:', generateRes.status);
    const responseText = await generateRes.text();
    try {
      generateResult = JSON.parse(responseText);
      console.log('[Test] /api/generate Output:', JSON.stringify(generateResult, null, 2).substring(0, 1500) + '\n... (truncated for console reading) ...');
    } catch (parseErr) {
      console.error('[Test] Generate JSON parsing error:', parseErr.message);
      console.error('[Test] Raw Response Content:', responseText.substring(0, 2000));
    }
  } catch (err) {
    console.error('[Test] Generate error:', err);
  }

  // Next, call the adjust endpoint
  const dummyContent = (generateResult && !generateResult.error) ? generateResult : {
    backward_design: {
      objective: `${oa.codigo_oa} — ${oa.texto_oa}`,
      assessment_evidence: 'Prueba escrita sobre comprensión del texto.',
      activities_sequence: 'Inicio: activación.\nDesarrollo: lectura guiada.\nCierre: preguntas.'
    },
    dua_adaptations: 'Adaptación de fuentes.',
    rti_supports: {
      general: 'Guía normal.',
      targeted: 'Guía con glosario.',
      intensive: 'Guía reducida.'
    },
    gamification: 'Quizizz.',
    nlp_technique: 'Frase de inicio.',
    rubric: 'Criterios.'
  };

  const dummyReadingLevel = (generateResult && generateResult.reading_level_eval) ? generateResult.reading_level_eval : {
    estimated_level: 'Adecuado para 6° Básico',
    warning_alert: 'Sin alertas'
  };

  // Clean reading_level_eval key from content if it is there
  if (dummyContent.reading_level_eval) {
    delete dummyContent.reading_level_eval;
  }

  console.log('\n[Test] Sending POST /api/planner/adjust (Verificar alineación curricular)...');
  try {
    const adjustRes = await fetch('http://localhost:3000/api/planner/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planningId: '00000000-0000-0000-0000-000000000000',
        subject: 'Lenguaje y Comunicación',
        grade: '6° Básico',
        unit: 'Unidad de Prueba 1',
        learningObjective: `${oa.codigo_oa} — ${oa.texto_oa}`,
        currentContent: dummyContent,
        currentReadingLevel: dummyReadingLevel,
        instruction: 'Verificar alineación curricular'
      })
    });

    const adjustResult = await adjustRes.json();
    console.log('[Test] /api/planner/adjust Status:', adjustRes.status);
    console.log('[Test] /api/planner/adjust Output:', JSON.stringify(adjustResult, null, 2));

  } catch (err) {
    console.error('[Test] Adjust error:', err);
  }
}

run();
