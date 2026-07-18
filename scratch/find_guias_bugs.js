const fs = require('fs');
const code = fs.readFileSync('src/app/guias/page.tsx', 'utf-8');
const lines = code.split('\n');

console.log('=== Searching "Clase interactiva de" ===');
lines.forEach((line, idx) => {
  if (line.includes('Clase interactiva de') || line.includes('Clase interactiva')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

console.log('=== Searching buttons in step 1 ===');
lines.forEach((line, idx) => {
  if (line.includes('origen ===') || line.includes('setOrigen(') || line.includes('Desde Kit')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
