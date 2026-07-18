const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
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
    .from('plannings')
    .select('id, subject, grade, unit, learning_objective, content, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching plannings:', error.message);
    return;
  }

  console.log(`Found ${data.length} plannings:`);
  data.forEach((p, idx) => {
    console.log(`\n[${idx + 1}] ID: ${p.id}`);
    console.log(`Subject: ${p.subject} | Grade: ${p.grade}`);
    console.log(`Unit: ${p.unit}`);
    console.log(`Has lirmi_summary: ${!!p.content.lirmi_summary}`);
    console.log(`Has utp_documentation: ${!!p.content.utp_documentation}`);
  });
}

run();
