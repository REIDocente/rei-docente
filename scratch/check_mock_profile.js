const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function parseEnv() {
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
  const userId = 'a06a2e45-d28c-4f7f-8d96-e2a27b87fcf9';
  console.log(`Querying profile for userId: ${userId} using RPC...`);
  const { data: profile, error } = await supabase
    .rpc('get_or_create_profile', { p_user_id: userId })
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
  } else {
    console.log('Profile details:');
    console.log(JSON.stringify(profile, null, 2));
  }
}

run();
