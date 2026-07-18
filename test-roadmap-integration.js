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
  const email = 'docente.testrunner.1782079628740@gmail.com';
  const password = 'securePassword123!';

  console.log(`[Test] Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.session) {
    console.error('[Test] SignIn failed:', authError?.message || 'No session data');
    process.exit(1);
  }

  const token = authData.session.access_token;
  const userId = authData.user.id;
  console.log('[Test] Signed in successfully. User ID:', userId);

  // 1. Check or Create a Course for 6° Básico
  console.log('\n[Test] Checking for existing course...');
  let { data: curso } = await supabase
    .from('cursos')
    .select('*')
    .eq('user_id', userId)
    .eq('nivel', '6° Básico')
    .eq('asignatura', 'Lenguaje y Comunicación')
    .limit(1)
    .maybeSingle();

  if (!curso) {
    console.log('[Test] Creating a new test course...');
    const { data: newCurso, error: createError } = await supabase
      .from('cursos')
      .insert({
        user_id: userId,
        nombre: '6° Básico Piloto',
        nivel: '6° Básico',
        seccion: 'P',
        asignatura: 'Lenguaje y Comunicación'
      })
      .select('*')
      .single();

    if (createError) {
      console.error('[Test] Error creating course:', createError.message);
      process.exit(1);
    }
    curso = newCurso;
  }
  console.log(`[Test] Using Course ID: ${curso.id} (${curso.nombre})`);

  // 2. Generate Roadmap
  console.log('\n[Test] Sending request to generate Roadmap (POST /api/cursos/mapa-ruta/generate)...');
  let roadmap = null;
  try {
    const res = await fetch('http://localhost:3000/api/cursos/mapa-ruta/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cursoId: curso.id,
        año: '2026',
        n_estudiantes: 32,
        distribucion_rti: { n1: 24, n2: 6, n3: 2 }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error');
    }

    roadmap = await res.json();
    console.log('[Test] SUCCESS! Roadmap generated and saved in DB.');
    console.log('\n--- MAPA DE RUTA JSON COMPLETO ---');
    console.log(JSON.stringify(roadmap, null, 2));
    console.log('----------------------------------\n');
  } catch (err) {
    console.error('[Test] Generate roadmap failed:', err.message);
    process.exit(1);
  }

  // 3. Find Unit 2 and Session 3 from the generated roadmap
  const unidades = roadmap.unidades;
  const unit2 = unidades.find(u => u.numero === 2);
  if (!unit2) {
    console.error('[Test] Unit 2 not found in generated roadmap!');
    process.exit(1);
  }

  const session3 = unit2.sesiones.find(s => s.numero === 3);
  if (!session3) {
    console.error('[Test] Session 3 not found in Unit 2!');
    process.exit(1);
  }

  console.log(`\n[Test] Found Unit 2: "${unit2.titulo}"`);
  console.log(`[Test] Target Session 3: "${session3.titulo}"`);
  console.log(`[Test] Session 3 OAs: ${session3.oa_codes.join(', ')}`);

  // 4. Fetch the text of the first OA of Session 3 from curriculum_oa
  const firstOACode = session3.oa_codes[0];
  console.log(`\n[Test] Fetching text for OA: ${firstOACode}`);
  const { data: oaInfo } = await supabase
    .from('curriculum_oa')
    .select('*')
    .eq('nivel', '6° Básico')
    .eq('codigo_oa', firstOACode)
    .maybeSingle();

  if (!oaInfo) {
    console.error(`[Test] OA ${firstOACode} not found in curriculum_oa database!`);
    process.exit(1);
  }
  console.log(`[Test] OA Text: "${oaInfo.texto_oa}"`);

  // 5. Generate Planning for Unit 2, Session 3
  console.log('\n[Test] Generating planning for Session 3 of Unit 2 (POST /api/generate)...');
  
  const formData = new FormData();
  formData.append('subject', 'Lenguaje y Comunicación');
  formData.append('grade', '6° Básico');
  formData.append('unit', unit2.titulo); // Use the exact unit title from roadmap
  formData.append('curriculum_mode', 'true');
  formData.append('oa_codigo', firstOACode);
  formData.append('oa_texto', oaInfo.texto_oa);
  formData.append('oa_eje', session3.eje);
  formData.append('indicadores_json', JSON.stringify([oaInfo.indicadores?.split('\n')[0] || '']));
  formData.append('learningObjective', `${firstOACode} — ${oaInfo.texto_oa}`);
  
  // Connect with course context to trigger the roadmap integration
  formData.append('planning_scope', 'clase');
  formData.append('curso_id', curso.id);
  formData.append('curso_nombre', curso.nombre);
  formData.append('session_number', '3'); // Request Session 3
  formData.append('curso_horario_json', JSON.stringify({}));

  try {
    const generateRes = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log('[Test] /api/generate Status:', generateRes.status);
    const text = await generateRes.text();
    let jsonPlan;
    try {
      jsonPlan = JSON.parse(text);
    } catch {
      console.error('[Test] JSON Parse Error. Raw output:');
      console.log(text);
      process.exit(1);
    }

    if (jsonPlan.error) {
      throw new Error(jsonPlan.error);
    }

    console.log('\n--- PLANIFICACIÓN GENERADA EXPLICITAMENTE CON MAPA DE RUTA ---');
    console.log(JSON.stringify(jsonPlan, null, 2));
    console.log('-------------------------------------------------------------\n');
    console.log('[Test] Completed successfully!');
  } catch (err) {
    console.error('[Test] Generate planning failed:', err.message);
  }
}

run();
