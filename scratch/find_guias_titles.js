const fs = require('fs');
const code = fs.readFileSync('src/app/guias/page.tsx', 'utf-8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Guía de Aprendizaje') || line.includes('Clase interactiva de') || line.includes('titulo:') || line.includes('subtitulo:')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
