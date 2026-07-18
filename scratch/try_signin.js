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

const users = [
  'docente.test@gmail.com',
  'docente.test1@gmail.com',
  'docente.test2@gmail.com',
  'docente.testrunner@gmail.com'
];

async function tryAll() {
  for (const email of users) {
    console.log(`Trying ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'securePassword123!'
    });
    if (error) {
      console.log(`  Failed: ${error.message}`);
    } else {
      console.log(`  SUCCESS! User ID: ${data.user.id}`);
      console.log(`  JWT: ${data.session.access_token}`);
      return;
    }
  }
}

tryAll();
