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

const ARTIFACTS_DIR = 'C:\\Users\\56940\\Desktop\\REI_DOCENTE_EVIDENCIA';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
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
    // 1. Setup mock session in local storage
    console.log('Navigating to root to initialize localStorage...');
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('SUCCESS: Mock session enabled in localStorage.');

    // 2. Capture Dashboard
    console.log('Capturing Dashboard...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await delay(3000); // Allow data to fetch and render
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'dashboard.png') });
    console.log('Captured dashboard.png');

    // 3. Capture Guías (Left Form + Right Preview)
    console.log('Navigating to /guias...');
    await page.goto('http://localhost:3000/guias', { waitUntil: 'networkidle2' });
    await delay(2000);

    // Switch to Biblioteca tab to load a preview
    console.log('Opening Biblioteca tab to load a preview...');
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Biblioteca')) {
        await tab.click();
        break;
      }
    }
    
    console.log('Waiting for library guide items to render...');
    await page.waitForSelector('h4.truncate', { timeout: 10000 });
    const guideItem = await page.$('h4.truncate');
    console.log('Clicking the guide item from history...');
    await guideItem.click();
    await delay(3000); // Wait for preview to render
    
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'guias.png') });
    console.log('Captured guias.png');

    // 4. Capture Evaluaciones (Paso 2 and final preview)
    console.log('Navigating to /evaluaciones...');
    await page.goto('http://localhost:3000/evaluaciones', { waitUntil: 'networkidle2' });
    await delay(2500);

    // Click "Continuar" to go to Step 2
    console.log('Going to Step 2...');
    let buttons = await page.$$('button');
    let foundContinue = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Continuar')) {
        await btn.click();
        foundContinue = true;
        break;
      }
    }
    await delay(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'evaluaciones_step2.png') });
    console.log('Captured evaluaciones_step2.png');

    // Switch to Biblioteca in evaluations to load final preview
    console.log('Switching to Biblioteca in /evaluaciones to load a finished document...');
    await page.goto('http://localhost:3000/evaluaciones', { waitUntil: 'networkidle2' });
    await delay(2000);
    const evTabs = await page.$$('button');
    for (const tab of evTabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text.includes('Biblioteca')) {
        await tab.click();
        break;
      }
    }
    
    console.log('Waiting for library evaluation items to render...');
    await page.waitForSelector('h4.truncate', { timeout: 10000 });
    const evItem = await page.$('h4.truncate');
    console.log('Clicking the evaluation item from history...');
    await evItem.click();
    await delay(3000); // Wait for preview to render

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'evaluaciones.png') });
    console.log('Captured evaluaciones.png');

    // 5. Capture Presentaciones
    console.log('Navigating to /presentaciones...');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await delay(2000);
    
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
    await delay(500);
    await page.type('textarea', 'Las Vanguardias Literarias en Chile: Creacionismo y Vicente Huidobro.');
    await delay(500);
    
    // Click "Generar vista previa"
    const presButtons = await page.$$('button');
    for (const btn of presButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar vista previa')) {
        await btn.click();
        break;
      }
    }
    await delay(4000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'presentaciones.png') });
    console.log('Captured presentaciones.png');

    // 6. Capture Visual Resources
    console.log('Navigating to /visual...');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Choose "Tema"
    await page.type('textarea', 'Infografía del ecosistema marino y la cadena trófica.');
    await delay(500);
    
    // Click "Generar"
    const visButtons = await page.$$('button');
    for (const btn of visButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Generar')) {
        await btn.click();
        break;
      }
    }
    await delay(4500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'visual.png') });
    console.log('Captured visual.png');

  } catch (err) {
    console.error('An error occurred during browser automation:', err);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

run();
