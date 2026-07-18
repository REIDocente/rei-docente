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
  console.log('Querying curriculum_unidades for 2° Medio Unidad 3...');
  const { data, error } = await supabase
    .from('curriculum_unidades')
    .select('nivel, unidad_numero, titulo_tema, oa_codes')
    .eq('nivel', '2° Medio')
    .eq('unidad_numero', 3)
    .single();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Results:', JSON.stringify(data, null, 2));
  }
}

run();
