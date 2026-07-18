const fs = require('fs');
const path = require('path');

function searchInFile(filePath, term) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.toLowerCase().includes(term.toLowerCase())) {
    console.log(`Found "${term}" in: ${filePath}`);
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        console.log(`  Line ${idx + 1}: ${line.trim().substring(0, 100)}`);
      }
    });
  }
}

function walkDir(dir, term) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, term);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        searchInFile(fullPath, term);
      }
    }
  }
}

walkDir('c:\\Users\\56940\\Desktop\\app-docente-ia\\src\\app\\api', 'guardar');
