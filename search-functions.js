const fs = require('fs');
const path = require('path');

function searchSQL() {
  const files = fs.readdirSync('c:/Users/56940/Desktop/app-docente-ia');
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const fullPath = path.join('c:/Users/56940/Desktop/app-docente-ia', file);
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('create function') || content.toLowerCase().includes('create or replace function')) {
        console.log(`Found function in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes('function')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchSQL();
