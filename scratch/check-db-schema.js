const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\56940\\Desktop\\app-docente-ia\\supabase_full_setup.sql', 'utf8');
const lines = content.split('\n');
for (let i = 229; i < 245; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
