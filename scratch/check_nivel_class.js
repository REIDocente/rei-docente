const fs = require('fs');
const html = fs.readFileSync('scratch/html_after.html', 'utf8');

const match = html.match(/<button[^>]*>[^]*?<\/button>/g);
if (match) {
  const generarBtn = match.find(m => m.includes('Generar'));
  console.log('Generar button in HTML after click:');
  console.log(generarBtn);
}
