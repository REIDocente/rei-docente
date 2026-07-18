const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'C:/Users/56940/Desktop/Didakta_2Medio.pdf';

if (!fs.existsSync(pdfPath)) {
  console.error('PDF not found at:', pdfPath);
  process.exit(1);
}

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
  console.log('--- PDF TEXT CONTENT ---');
  console.log(data.text);
  console.log('------------------------');
}).catch(err => {
  console.error('Error parsing PDF:', err);
});
