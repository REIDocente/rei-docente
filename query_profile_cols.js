const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

supabase.from('user_profiles').select('*').limit(1).then(({ data, error }) => {
  if (error) {
    console.error(error);
  } else {
    console.log("Columns:", data && data[0] ? Object.keys(data[0]) : "No data");
  }
});
