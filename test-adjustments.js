const fs = require('fs');

async function runAdjustmentTest() {
  console.log('Reading initial post-correction planning generated previously...');
  if (!fs.existsSync('generated-chain-planning.json')) {
    console.error('Error: generated-chain-planning.json not found in root. Make sure the generation test ran successfully first.');
    process.exit(1);
  }

  const initialJson = JSON.parse(fs.readFileSync('generated-chain-planning.json', 'utf8'));

  const baseRequestBody = {
    planningId: '00000000-0000-0000-0000-000000000000',
    subject: 'Lengua y Literatura',
    grade: '6° Básico',
    unit: 'Unidad 3: Lo divino y lo humano',
    learningObjective: 'OA 8: Formular una interpretación de textos líricos del Siglo de Oro que sea coherente con su análisis.',
    currentContent: initialJson,
    currentReadingLevel: initialJson.reading_level_eval
  };

  // ─────────────────────────────────────────────────────────────────────────
  // AJUSTE 1: Ajuste menor (NO dispara advertencia curricular)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('AJUSTE 1: Cambio menor (no intrusivo, sin advertencia)');
  console.log('Instrucción: "Agrega una recomendación en la sección de adaptaciones de accesibilidad para usar audífonos antirruido si hay sobreestimulación sensorial en la sala."');
  console.log('Confirmado: false');
  console.log('==================================================');

  let response1 = await fetch('http://localhost:3000/api/planner/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseRequestBody,
      confirmed: false,
      instruction: 'Agrega una recomendación en la sección de adaptaciones de accesibilidad para usar audífonos antirruido si hay sobreestimulación sensorial en la sala.'
    })
  });

  const adjustedJson1 = await response1.json();
  fs.writeFileSync('ajuste1_out.json', JSON.stringify(adjustedJson1, null, 2), 'utf8');
  console.log('\n--- JSON RESULTANTE (AJUSTE 1) ---');
  console.log('Saved to ajuste1_out.json');

  const warning1 = adjustedJson1.reading_level_eval?.warning_alert || '';
  console.log(`\n¿Tiene Advertencia Curricular?: ${warning1.includes('Advertencia Curricular') ? 'SÍ' : 'NO'}`);
  console.log(`Contenido de warning_alert: "${warning1}"`);

  // ─────────────────────────────────────────────────────────────────────────
  // AJUSTE 2: Desalineación curricular (NO CONFIRMADO - Mantiene original + Advertencia)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('AJUSTE 2: Desalineación curricular (NO CONFIRMADO)');
  console.log('Instrucción: "Cambia la sesión para hacer un taller práctico de matemáticas aplicadas y estadística en vez de analizar poemas."');
  console.log('Confirmado: false');
  console.log('==================================================');

  let response2 = await fetch('http://localhost:3000/api/planner/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseRequestBody,
      currentContent: adjustedJson1, // Chaining over Ajuste 1
      currentReadingLevel: adjustedJson1.reading_level_eval,
      confirmed: false,
      instruction: 'Cambia la sesión para hacer un taller práctico de matemáticas aplicadas y estadística en vez de analizar poemas.'
    })
  });

  const adjustedJson2 = await response2.json();
  fs.writeFileSync('ajuste2_unconfirmed_out.json', JSON.stringify(adjustedJson2, null, 2), 'utf8');
  const warning2 = adjustedJson2.reading_level_eval?.warning_alert || '';
  
  console.log('\n--- ADVERTENCIA MOSTRADA EN EL CHAT ---');
  console.log(warning2);

  // Verificamos si la secuencia de actividades cambió o sigue siendo sobre el poema (Quevedo)
  const isActivitiesOriginal = adjustedJson2.backward_design.activities_sequence.includes('Quevedo');
  console.log(`\n¿Mantiene planificación original?: ${isActivitiesOriginal ? 'SÍ (Intacta)' : 'NO'}`);

  // ─────────────────────────────────────────────────────────────────────────
  // AJUSTE 2 CONFIRMADO: Desalineación curricular (CONFIRMADO - Aplica cambio + Registro)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('AJUSTE 2: Desalineación curricular (CONFIRMADO POR EL DOCENTE)');
  console.log('Instrucción: "Cambia la sesión para hacer un taller práctico de matemáticas aplicadas y estadística en vez de analizar poemas."');
  console.log('Confirmado: true');
  console.log('==================================================');

  let response3 = await fetch('http://localhost:3000/api/planner/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseRequestBody,
      currentContent: adjustedJson1, // Chaining over Ajuste 1
      currentReadingLevel: adjustedJson1.reading_level_eval,
      confirmed: true,
      instruction: 'Cambia la sesión para hacer un taller práctico de matemáticas aplicadas y estadística en vez de analizar poemas.'
    })
  });

  const adjustedJson3 = await response3.json();
  fs.writeFileSync('ajuste2_confirmed_out.json', JSON.stringify(adjustedJson3, null, 2), 'utf8');
  console.log('\n--- JSON FINAL CON EL CAMBIO YA APLICADO (AJUSTE 2 CONFIRMADO) ---');
  console.log('Saved to ajuste2_confirmed_out.json');

  const warning3 = adjustedJson3.reading_level_eval?.warning_alert || '';
  console.log(`\n¿Tiene Advertencia Curricular registrada?: ${warning3.includes('Advertencia Curricular') ? 'SÍ' : 'NO'}`);
  console.log(`Contenido final de warning_alert: "${warning3}"`);
  
  const isActivitiesModified = adjustedJson3.backward_design.activities_sequence.toLowerCase().includes('matemática') || adjustedJson3.backward_design.activities_sequence.toLowerCase().includes('estadística');
  console.log(`¿Secuencia de actividades modificada a Matemáticas?: ${isActivitiesModified ? 'SÍ (Aplicado)' : 'NO'}`);
}

runAdjustmentTest();
