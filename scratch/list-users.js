const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function parseEnv() {
  const envPath = 'c:/Users/56940/Desktop/app-docente-ia/.env.local';
  if (!fs.existsSync(envPath)) return {};
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

async function run() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');

  if (error) {
    console.error('Error fetching user_profiles:', error.message);
    return;
  }

  console.log(`Found ${data.length} user profiles:`);
  data.forEach((p, idx) => {
    console.log(`[${idx + 1}] ID: ${p.id} | Email: ${p.email} | Plan: ${p.plan_name} (${p.plan_status}) | Name: ${p.full_name}`);
  });
}

run();
