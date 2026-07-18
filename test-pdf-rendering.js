const fs = require('fs');
const { jsPDF } = require('jspdf');

const text = "⚠️ Alerta: El léxico ('efímero', 'ser', 'ostentación') y la inversión sintáctica pueden bloquear la comprensión en lectores bajo Nivel 2. Se recomienda el glosario visual y la lectura modelada en voz alta como precondición obligatoria antes de la práctica guiada.";

const doc = new jsPDF();
let cursorY = 20;
const marginX = 15;
const maxLineWidth = 180;

const sanitizeForPdf = (str) => {
  if (!str) return '';
  return str
    .replace(/⚠️/g, '[Alerta]')
    .replace(/☐/g, '[ ]')
    .replace(/☑/g, '[x]')
    .replace(/🌹/g, '[Rosa]')
    .replace(/⏳/g, '[Tiempo]')
    .replace(/✒️/g, '[Pluma]')
    .replace(/✓/g, '[OK]')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/⇒/g, '=>')
    .replace(/⇔/g, '<=>')
    .replace(/[^\x00-\xff\u2022\u2014\u2013\u201c\u201d\u2018\u2019]/gu, '');
};

const writeText = (text, size = 10, style = 'normal', color = [71, 85, 105]) => {
  const sanitizedText = sanitizeForPdf(text);
  doc.setFont('Helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  
  console.log('Sanitized text:', sanitizedText);
  try {
    const lines = doc.splitTextToSize(sanitizedText, maxLineWidth);
    console.log('Split into lines:', lines);
    for (const line of lines) {
      doc.text(line, marginX, cursorY);
      cursorY += 6;
    }
  } catch (err) {
    console.error('Error during split or text write:', err.message);
  }
};

writeText(text);

const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync('C:/Users/56940/Desktop/test_rendering.pdf', Buffer.from(pdfOutput));
console.log('Saved test rendering PDF');
