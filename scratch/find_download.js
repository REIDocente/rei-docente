const fs = require('fs');
const path = require('path');

const paths = [
  path.join(process.env.USERPROFILE, 'Downloads'),
  'c:\\Users\\56940\\Downloads',
  'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual',
  'c:\\Users\\56940\\Desktop\\app-docente-ia'
];

paths.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Checking directory: ${dir}`);
    try {
      const files = fs.readdirSync(dir);
      const filtered = files.filter(f => f.includes('evaluacion') || f.endsWith('.pdf') || f.endsWith('.docx'));
      filtered.forEach(f => {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        console.log(`  File: ${f} | Size: ${stat.size} | Created: ${stat.birthtime}`);
      });
    } catch (e) {
      console.log(`  Error reading: ${e.message}`);
    }
  }
});
