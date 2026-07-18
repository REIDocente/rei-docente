const fs = require('fs');
const path = require('path');

function walk(dir, filter) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file, filter));
      }
    } else {
      if (filter(file)) results.push(file);
    }
  });
  return results;
}

const files = walk('.', file => file.endsWith('.ts') || file.endsWith('.tsx'));

console.log(`Searching in ${files.length} TypeScript files...`);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('Clase interactiva de') || line.includes('Clase interactiva') || line.includes('Guía de Aprendizaje:')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});
