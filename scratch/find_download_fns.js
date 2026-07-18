const fs = require('fs');
const code = fs.readFileSync('c:/Users/56940/Desktop/app-docente-ia/src/app/presentaciones/page.tsx', 'utf-8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('const ') && (
    line.toLowerCase().includes('download') ||
    line.toLowerCase().includes('export') ||
    line.toLowerCase().includes('pdf') ||
    line.toLowerCase().includes('png') ||
    line.toLowerCase().includes('pptx') ||
    line.toLowerCase().includes('word')
  )) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
