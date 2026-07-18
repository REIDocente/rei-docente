const fs = require('fs');
const code = fs.readFileSync('c:/Users/56940/Desktop/app-docente-ia/src/app/presentaciones/page.tsx', 'utf-8');
const lines = code.split('\n');

const keywords = ['triggerPngDownload', 'triggerWordDownload', 'exportToPdf', 'exportToPptx', 'Sidebar', 'Download'];

lines.forEach((line, idx) => {
  keywords.forEach(kw => {
    if (line.includes(kw)) {
      console.log(`${idx + 1}: [${kw}] ${line.trim()}`);
    }
  });
});
