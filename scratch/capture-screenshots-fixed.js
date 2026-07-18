const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Locate Google Chrome installation path on Windows
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

if (!executablePath) {
  console.error('Error: Google Chrome was not found in standard paths. Please verify Chrome installation.');
  process.exit(1);
}

console.log('Using Google Chrome executable:', executablePath);

const ARTIFACTS_DIR = 'C:\\Users\\56940\\.gemini\\antigravity\\brain\\f241f1d5-1366-49fe-b98c-b98ca0270324';
const EVIDENCE_DIR = 'C:\\Users\\56940\\Desktop\\REI_DOCENTE_EVIDENCIA';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true, // headless mode
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    // 1. Authenticate using Mock Bypass
    console.log('Navigating to login page to set origin...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    console.log('Injecting mock authentication flag in LocalStorage...');
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating to Dashboard (root) to verify session...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await delay(3000); // Allow dashboard charts and dynamic welcome to fetch and render

    // Take Dashboard Screenshot
    const dashboardArtifactPath = path.join(ARTIFACTS_DIR, 'dashboard.png');
    const dashboardEvidencePath = path.join(EVIDENCE_DIR, 'dashboard.png');
    await page.screenshot({ path: dashboardArtifactPath });
    fs.copyFileSync(dashboardArtifactPath, dashboardEvidencePath);
    console.log('Captured dashboard.png');

    // 2. Capture Guías (Left Form + Right Preview)
    console.log('Navigating to /guias...');
    await page.goto('http://localhost:3000/guias', { waitUntil: 'networkidle2' });
    await delay(2500);

    // Form is already in Generador tab on load, fill it
    console.log('Entering theme to generate guide...');
    await page.type('textarea', 'Los animales del bosque templado chileno y sus adaptaciones al clima.');
    await delay(1000);

    console.log('Clicking Generar Guía de Trabajo...');
    const genButtons = await page.$$('button');
    for (const btn of genButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar Guía de Trabajo')) {
        await btn.click();
        break;
      }
    }
    console.log('Waiting for guide generation...');
    await delay(5000); // Wait for mock generation to complete and show preview

    const guiasArtifactPath = path.join(ARTIFACTS_DIR, 'guias.png');
    const guiasEvidencePath = path.join(EVIDENCE_DIR, 'guias.png');
    await page.screenshot({ path: guiasArtifactPath });
    fs.copyFileSync(guiasArtifactPath, guiasEvidencePath);
    console.log('Captured guias.png');

    // 3. Capture Evaluaciones (Paso 2 and final preview)
    console.log('Navigating to /evaluaciones...');
    await page.goto('http://localhost:3000/evaluaciones', { waitUntil: 'networkidle2' });
    await delay(2500);

    // Click "Continuar" on Step 1 to go to Step 2
    console.log('Going to Step 2...');
    let buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Continuar')) {
        await btn.click();
        break;
      }
    }
    await delay(2000);
    
    // Save Step 2 screenshot
    const evStep2ArtifactPath = path.join(ARTIFACTS_DIR, 'evaluaciones_step2.png');
    const evStep2EvidencePath = path.join(EVIDENCE_DIR, 'evaluaciones_step2.png');
    await page.screenshot({ path: evStep2ArtifactPath });
    fs.copyFileSync(evStep2ArtifactPath, evStep2EvidencePath);
    console.log('Captured evaluaciones_step2.png');

    // Fill the theme textarea in Step 2
    console.log('Entering theme to generate evaluation...');
    await page.type('textarea', 'Evaluación de Comprensión de Textos Narrativos - Mito de Prometeo y el robo del fuego.');
    await delay(1000);

    // Go to Step 3
    console.log('Going to Step 3...');
    buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Continuar')) {
        await btn.click();
        break;
      }
    }
    await delay(1500);

    // Go to Step 4
    console.log('Going to Step 4...');
    buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Continuar')) {
        await btn.click();
        break;
      }
    }
    await delay(1500);

    // Click Generar in Step 4
    console.log('Clicking Generar...');
    buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar')) {
        await btn.click();
        break;
      }
    }
    console.log('Waiting for evaluation generation...');
    await delay(5000); // Wait for mock generation to complete and show preview

    const evaluacionesArtifactPath = path.join(ARTIFACTS_DIR, 'evaluaciones.png');
    const evaluacionesEvidencePath = path.join(EVIDENCE_DIR, 'evaluaciones.png');
    await page.screenshot({ path: evaluacionesArtifactPath });
    fs.copyFileSync(evaluacionesArtifactPath, evaluacionesEvidencePath);
    console.log('Captured evaluaciones.png');

    // 4. Capture Presentaciones
    console.log('Navigating to /presentaciones...');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await delay(2500);
    
    // Choose "Tema" origin so we can type a mock title
    console.log('Selecting Tema origin...');
    const originButtons = await page.$$('button');
    for (const btn of originButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Tema')) {
        await btn.click();
        break;
      }
    }
    await delay(1000);
    await page.type('textarea', 'Las Vanguardias Literarias en Chile: Creacionismo y Vicente Huidobro.');
    await delay(1000);
    
    // Click "Generar vista previa"
    const presButtons = await page.$$('button');
    for (const btn of presButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar vista previa')) {
        await btn.click();
        break;
      }
    }
    console.log('Waiting for presentations generation...');
    await delay(5000);

    const presentacionesArtifactPath = path.join(ARTIFACTS_DIR, 'presentaciones.png');
    const presentacionesEvidencePath = path.join(EVIDENCE_DIR, 'presentaciones.png');
    await page.screenshot({ path: presentacionesArtifactPath });
    fs.copyFileSync(presentacionesArtifactPath, presentacionesEvidencePath);
    console.log('Captured presentaciones.png');

    // 5. Capture Visual Resources
    console.log('Navigating to /visual...');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    await delay(2500);
    
    // Enter theme
    await page.type('textarea', 'Infografía del ecosistema marino y la cadena trófica.');
    await delay(1000);
    
    // Click "Generar"
    const visButtons = await page.$$('button');
    for (const btn of visButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar')) {
        await btn.click();
        break;
      }
    }
    console.log('Waiting for visual generation...');
    await delay(5000);

    const visualArtifactPath = path.join(ARTIFACTS_DIR, 'visual.png');
    const visualEvidencePath = path.join(EVIDENCE_DIR, 'visual.png');
    await page.screenshot({ path: visualArtifactPath });
    fs.copyFileSync(visualArtifactPath, visualEvidencePath);
    console.log('Captured visual.png');

  } catch (err) {
    console.error('An error occurred during browser automation:', err);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

run();
