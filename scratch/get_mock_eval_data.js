const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
];

let executablePath = '';
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    executablePath = p;
    break;
  }
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to origin to read localStorage...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    const rawData = await page.evaluate(() => {
      return localStorage.getItem('mock_eval_data');
    });

    if (!rawData) {
      console.error('Error: mock_eval_data not found in localStorage');
      process.exit(1);
    }

    const record = JSON.parse(rawData);
    fs.writeFileSync('c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual\\evaluacion_real_ui.json', JSON.stringify(record, null, 2), 'utf8');
    console.log('Saved JSON data to c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual\\evaluacion_real_ui.json');

    const cj = record.contenido_json;
    const preguntas = cj.prueba?.secciones?.flatMap(s => s.preguntas) ?? cj.preguntas ?? [];

    console.log(`\n=== ANALYZING ${preguntas.length} QUESTIONS ===`);
    preguntas.forEach((q, idx) => {
      console.log(`\nPregunta ${q.numero || idx + 1}: ${q.enunciado}`);
      
      const alts = q.alternativas || [];
      const counts = [];
      const wordCounts = [];
      
      // alternatives can be array or object
      if (Array.isArray(alts)) {
        alts.forEach(alt => {
          const text = alt.texto || '';
          const lettersOnly = text.replace(/\s+/g, '');
          counts.push({ letra: alt.letra, length: lettersOnly.length, text });
          wordCounts.push(text.split(/\s+/).filter(Boolean).length);
        });
      } else {
        Object.entries(alts).forEach(([letra, text]) => {
          const lettersOnly = text.replace(/\s+/g, '');
          counts.push({ letra, length: lettersOnly.length, text });
          wordCounts.push(text.split(/\s+/).filter(Boolean).length);
        });
      }

      counts.forEach(c => {
        console.log(`  - Alternativa ${c.letra}: ${c.length} letras (sin espacios) | Texto: "${c.text}"`);
      });

      const lengths = counts.map(c => c.length);
      const minLength = Math.min(...lengths);
      const maxLength = Math.max(...lengths);
      const diff = maxLength - minLength;

      const minWords = Math.min(...wordCounts);
      const maxWords = Math.max(...wordCounts);
      const wordDiff = maxWords - minWords;

      console.log(`  --> Diferencia en letras: ${diff} letras (${maxLength} - ${minLength})`);
      console.log(`  --> Diferencia en palabras: ${wordDiff} palabras (${maxWords} - ${minWords})`);
      
      if (diff > 12) {
        console.log(`  ⚠️ INCUMPLIMIENTO: Supera el límite de 12 letras de diferencia!`);
      } else {
        console.log(`  ✓ CUMPLE con la regla de letras (diferencia <= 12)`);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

run();
