const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('No .env.local found at:', envPath);
    return {};
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
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

const grades = ['5° Básico', '6° Básico', '7° Básico', '8° Básico', '1° Medio', '2° Medio'];

async function run() {
  console.log('--- CURRICULUM DB VERIFICATION ---');
  for (const grade of grades) {
    // 1. Check OAs
    const { data: oas, error: oaError } = await supabase
      .from('curriculum_oa')
      .select('codigo_oa, eje')
      .eq('nivel', grade)
      .or('asignatura.ilike.%lenguaje%,asignatura.ilike.%lengua%');

    if (oaError) {
      console.error(`Error querying OAs for ${grade}:`, oaError.message);
      continue;
    }

    // 2. Check Units
    const { data: units, error: unitError } = await supabase
      .from('curriculum_unidades')
      .select('unidad_numero, titulo_tema')
      .eq('nivel', grade);

    if (unitError) {
      console.error(`Error querying Units for ${grade}:`, unitError.message);
      continue;
    }

    console.log(`Grade: ${grade}`);
    console.log(`  - OAs found: ${oas.length} (${oas.slice(0, 5).map(o => o.codigo_oa).join(', ')}${oas.length > 5 ? '...' : ''})`);
    console.log(`  - Units found: ${units.length} (${units.map(u => `U${u.unidad_numero}: ${(u.titulo_tema || '').substring(0, 20)}...`).join(', ')})`);
  }
}

run().catch(console.error);
