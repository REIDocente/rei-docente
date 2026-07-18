const fs = require('fs');
const path = require('path');

const pdfPath = 'C:/Users/56940/Desktop/Didakta_2Medio.pdf';
if (!fs.existsSync(pdfPath)) {
  console.error('PDF not found at:', pdfPath);
  process.exit(1);
}

const pdfBuf = fs.readFileSync(pdfPath);
const pdfStr = pdfBuf.toString('binary');

console.log('Searching for "Alerta" in raw PDF streams...');
const matches = [...pdfStr.matchAll(/\(([^)]+)\)\s*Tj/g)];
console.log(`Found ${matches.length} Tj text elements.`);

let print = false;
for (const match of matches) {
  const text = match[1];
  if (text.includes('Alerta') || text.includes('pedag') || print) {
    console.log('Tj:', text);
    print = true;
  }
  // Stop after some lines
  if (print && text.includes('Dise') || text.includes('1.')) {
    print = false;
  }
}
