const fs = require('fs');

const files = [
  'src/app/planner/new/page.tsx',
  'src/app/presentaciones/page.tsx',
  'src/app/evaluaciones/page.tsx',
  'src/app/guias/page.tsx'
];

files.forEach(file => {
  console.log(`=== Endpoints in ${file} ===`);
  const code = fs.readFileSync(file, 'utf-8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('fetch(') || line.includes('fetch (')) {
      console.log(`  Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
