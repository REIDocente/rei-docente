const fs = require('fs');
const path = require('path');

const jsonFile = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual\\evaluacion_real_ui.json';

if (!fs.existsSync(jsonFile)) {
  console.error(`Error: File not found at ${jsonFile}`);
  process.exit(1);
}

const record = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const cj = record.contenido_json;
const preguntas = cj.prueba?.secciones?.flatMap(s => s.preguntas) ?? cj.preguntas ?? [];

console.log(`=== ANALYZING ${preguntas.length} QUESTIONS ===`);
let violationsCount = 0;

preguntas.forEach((q, idx) => {
  console.log(`\nPregunta ${q.numero || idx + 1}: "${q.enunciado}"`);
  
  const alts = q.alternativas || [];
  const counts = [];
  const wordCounts = [];
  
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
    console.log(`  ⚠️ INCUMPLIMIENTO: La diferencia de ${diff} letras supera el límite de 12!`);
    violationsCount++;
  } else {
    console.log(`  ✓ CUMPLE con la regla de letras (diferencia <= 12)`);
  }
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total questions analyzed: ${preguntas.length}`);
console.log(`Rule violations (diff > 12 letters): ${violationsCount}`);
