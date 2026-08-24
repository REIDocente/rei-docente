const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.trim().match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('--- Diagnóstico completo del piloto ---\n');

  // 1. Contar perfiles via RPC (SECURITY DEFINER, bypasses RLS)
  console.log('1. Contando perfiles via RPC get_user_profile_count()...');
  const { data: count, error: countErr } = await supabase.rpc('get_user_profile_count');
  if (countErr) {
    console.error('   Error al contar perfiles:', countErr.message);
  } else {
    console.log(`   Total de perfiles existentes: ${count}`);
  }

  // 2. Intentar leer los propios datos de perfil (solo muestra lo visible con anon key)
  console.log('\n2. Intentando leer user_profiles (solo datos propios visibles con RLS)...');
  const { data: profiles, error: profilesErr } = await supabase
    .from('user_profiles')
    .select('id, plan_status, trial_started_at, planifications_generated, evaluations_generated, guides_generated, lecturas_generated')
    .order('trial_started_at', { ascending: true });

  if (profilesErr) {
    console.error('   Error:', profilesErr.message);
  } else {
    console.log(`   Filas visibles con anon key: ${profiles.length}`);
    if (profiles.length > 0) {
      profiles.forEach((p, i) => {
        console.log(`   [${i+1}] id=${p.id} | status=${p.plan_status} | started=${p.trial_started_at}`);
      });
    }
  }

  // 3. Verificar que la variable MAX_TRIAL_USERS está cargada
  console.log('\n3. Variable de entorno NEXT_PUBLIC_MAX_TRIAL_USERS:');
  console.log(`   Valor en .env.local: ${env.NEXT_PUBLIC_MAX_TRIAL_USERS || '(no definida)'}`);

  console.log('\n--- Fin del diagnóstico ---');
}

run();
