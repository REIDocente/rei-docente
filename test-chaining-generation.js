const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = 'C:\\Users\\56940\\.gemini\\antigravity\\brain\\c6bce28a-f787-430d-8503-97369a1c8d70\\.system_generated\\tasks\\task-2094.log';

async function runTest(testRetry) {
  console.log(`\n==================================================`);
  console.log(`INICIANDO PRUEBA: test_retry = ${testRetry}`);
  console.log(`==================================================`);

  // Remember the length of the log file before calling the API
  let initialLogLength = 0;
  if (fs.existsSync(LOG_FILE_PATH)) {
    initialLogLength = fs.readFileSync(LOG_FILE_PATH).length;
  }

  const formData = new FormData();
  formData.append('subject', 'Lengua y Literatura');
  formData.append('grade', '6° Básico');
  formData.append('unit', 'Unidad 3: Lo divino y lo humano');
  formData.append('learningObjective', 'OA 8: Formular una interpretación de textos líricos del Siglo de Oro que sea coherente con su análisis.');
  formData.append('curriculum_mode', 'false');
  formData.append('planning_scope', 'clase');
  formData.append('test_retry', testRetry ? 'true' : 'false');

  try {
    const start = Date.now();
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      body: formData
    });

    const status = res.status;
    const data = await res.json();
    const duration = Date.now() - start;

    console.log(`HTTP Status: ${status}`);
    console.log(`Duration: ${duration}ms`);

    if (status !== 200) {
      console.error('API Error:', data);
    } else {
      console.log('API Response JSON structure is valid!');
      if (!testRetry) {
        fs.writeFileSync('generated-chain-planning.json', JSON.stringify(data, null, 2), 'utf8');
        console.log('Saved generated JSON to "generated-chain-planning.json".');
      }
    }

    // Wait a brief moment for the dev server to flush its logs
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Print the new logs from the dev server
    if (fs.existsSync(LOG_FILE_PATH)) {
      const currentLog = fs.readFileSync(LOG_FILE_PATH, 'utf8');
      const newLogs = currentLog.substring(initialLogLength);
      console.log('\n--- DEV SERVER CONSOLE LOGS ---');
      console.log(newLogs.trim());
      console.log('-------------------------------\n');
    } else {
      console.warn('Dev server log file not found at:', LOG_FILE_PATH);
    }

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

async function main() {
  // 1. Run normal test
  await runTest(false);

  // 2. Run test forcing a validation failure and retry
  await runTest(true);
}

main();
