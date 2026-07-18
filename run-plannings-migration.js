const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure 'pg' is installed
try {
  require.resolve('pg');
} catch (e) {
  console.log("Installing 'pg' client module...");
  execSync('npm install pg', { stdio: 'inherit' });
}

const { Client } = require('pg');

// Parse .env.local
const envPath = path.join('c:', 'Users', '56940', 'Desktop', 'app-docente-ia', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const dbUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('ERROR: No DATABASE_URL or SUPABASE_DB_URL found in .env.local.');
  process.exit(1);
}

const sqlContent = `
ALTER TABLE public.plannings ADD COLUMN IF NOT EXISTS curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS plannings_curso_id_idx ON public.plannings (curso_id);
`;

async function run() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log('Connected! Executing migration to add curso_id to plannings...');
    await client.query(sqlContent);
    console.log('SUCCESS! Migration executed successfully.');
    
    // Verify columns of plannings table
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'plannings';
    `);
    console.log('Columns in plannings table:');
    console.log(res.rows);
  } catch (err) {
    console.error('Database query failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
