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
  console.log('Querying user_profiles table directly...');
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Profiles currently in user_profiles:');
    console.log(JSON.stringify(profiles, null, 2));
  }
}

run();
