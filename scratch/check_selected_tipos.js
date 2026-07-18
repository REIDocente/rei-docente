const fs = require('fs');
const html = fs.readFileSync('scratch/html_before.html', 'utf8');

// Find all buttons in section 2 (Tipos a generar)
const match = html.match(/<button[^>]*>[^]*?<\/button>/g);
if (match) {
  const tipoButtons = match.filter(m => m.includes('Prueba') || m.includes('Rúbrica') || m.includes('Autoevaluación'));
  console.log('Tipo Buttons on load:');
  tipoButtons.forEach(btn => {
    console.log('--- BUTTON ---');
    console.log(btn.substring(0, 300));
  });
}
