const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.sql')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('docente.test')) {
        console.log(`Found in: ${fullPath}`);
        // print lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('docente.test')) {
            console.log(`  Line ${idx+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('.');
