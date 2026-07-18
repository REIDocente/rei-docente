const fs = require('fs');

const generatePath = 'src/app/api/generate/route.ts';
const adjustPath = 'src/app/api/planner/adjust/route.ts';

if (fs.existsSync(generatePath)) {
  const content = fs.readFileSync(generatePath, 'utf8');
  console.log('--- SEARCHING LENGUAJE_GRADES IN generate/route.ts ---');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('LENGUAJE_GRADES')) {
      console.log(`Line ${idx + 1}: ${line}`);
      // Print surrounding lines
      for (let i = Math.max(0, idx - 5); i < Math.min(lines.length, idx + 10); i++) {
        console.log(`  [${i + 1}] ${lines[i]}`);
      }
    }
  });
} else {
  console.log('generate/route.ts not found');
}

if (fs.existsSync(generatePath)) {
  const content = fs.readFileSync(generatePath, 'utf8');
  console.log('\n--- SEARCHING buildLenguajeEnrichmentInstructions IN generate/route.ts ---');
  const lines = content.split('\n');
  let found = false;
  lines.forEach((line, idx) => {
    if (line.includes('buildLenguajeEnrichmentInstructions') || line.includes('LenguajeEnrichment')) {
      found = true;
      console.log(`Line ${idx + 1}: ${line}`);
      // Print surrounding lines
      for (let i = Math.max(0, idx - 2); i < Math.min(lines.length, idx + 40); i++) {
        console.log(`  [${i + 1}] ${lines[i]}`);
      }
    }
  });
  if (!found) {
    console.log('buildLenguajeEnrichmentInstructions function not found directly by name. Searching for "alternativas" or "selección" instructions...');
    lines.forEach((line, idx) => {
      if (line.includes('alternativa') || line.includes('opción múltiple')) {
        if (line.includes('caracter') || line.includes('letra') || line.includes('longitud') || line.includes('palabra') || line.includes('balance')) {
          console.log(`Line ${idx + 1}: ${line.trim()}`);
        }
      }
    });
  }
}

if (fs.existsSync(adjustPath)) {
  const content = fs.readFileSync(adjustPath, 'utf8');
  console.log('\n--- SEARCHING FOR ALTERNATIVES IN adjust/route.ts ---');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('alternativa') || line.includes('opción') || line.includes('pregunta') || line.includes('selección')) {
      if (line.includes('caracter') || line.includes('letra') || line.includes('longitud') || line.includes('palabra') || line.includes('balance') || line.includes('distractor')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
      }
    }
  });
} else {
  console.log('adjust/route.ts not found');
}
