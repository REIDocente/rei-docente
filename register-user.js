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
  const email = `docente.test.roadmap.${Date.now()}@gmail.com`;
  const password = 'securePassword123!';

  console.log(`[Test] Registering fresh user: ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('[Test] Registration failed:', error.message);
  } else {
    console.log('[Test] SUCCESS! Registered user ID:', data.user?.id);
    console.log('[Test] Session token:', data.session?.access_token);
  }
}

run();
