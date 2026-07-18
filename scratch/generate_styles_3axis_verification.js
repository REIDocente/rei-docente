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

if (!executablePath) {
  console.error('Error: Google Chrome was not found in standard paths.');
  process.exit(1);
}

const EVIDENCE_DIR = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function selectStep3Options(page, styleLabel, paletteLabel, formatLabel) {
  console.log(`Selecting step 3 options: Style='${styleLabel}', Palette='${paletteLabel}', Format='${formatLabel}'`);
  
  // Select Estilo
  const styleClicked = await page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes(label));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, styleLabel);
  console.log(`Clicked Style '${styleLabel}':`, styleClicked);
  await delay(500);

  // Select Paleta
  const paletteClicked = await page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes(label));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, paletteLabel);
  console.log(`Clicked Palette '${paletteLabel}':`, paletteClicked);
  await delay(500);

  // Select Formato
  const formatClicked = await page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes(label));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, formatLabel);
  console.log(`Clicked Format '${formatLabel}':`, formatClicked);
  await delay(500);

  // Click Continuar
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
    if (contBtn) contBtn.click();
  });
  await delay(1000);
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    // Navigate to login and set mock auth token
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await delay(1500);

    console.log('Injecting mock auth token...');
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await delay(2000);

    // =========================================================================
    // PRESENTACIÓN 1: NotebookLM Docente + Elegante Institucional + 16:9
    // =========================================================================
    console.log('\n--- Test 1: Presentación (NotebookLM + Elegante + 16:9) ---');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await delay(2000);

    // Step 1: Origin
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (btn) btn.click();
    });
    await delay(500);
    await page.type('textarea', 'La estructura de los textos argumentativos: tesis, argumentos y conclusión');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 2: Duration
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 3: Style selection (3 axes)
    await selectStep3Options(page, 'NotebookLM Docente', 'Elegante Institucional', '16:9 Estándar');

    // Step 4: Generate
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Generar vista previa');
      if (btn) btn.click();
    });
    await delay(4000);

    const path1 = path.join(EVIDENCE_DIR, 'estilo_notebooklm_elegante_16_9.png');
    await page.screenshot({ path: path1 });
    console.log(`Saved screenshot 1 to: ${path1}`);

    // =========================================================================
    // PRESENTACIÓN 2: Para pequeños + Humana Suave + Vertical
    // =========================================================================
    console.log('\n--- Test 2: Presentación (Para pequeños + Humana Suave + Vertical) ---');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await delay(2000);

    // Step 1: Origin
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (btn) btn.click();
    });
    await delay(500);
    await page.type('textarea', 'Cuentos infantiles tradicionales y las moralejas que nos enseñan');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 2: Duration
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 3: Style selection (3 axes)
    await selectStep3Options(page, 'Para pequeños', 'Humana Suave', 'Vertical');

    // Step 4: Generate
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Generar vista previa');
      if (btn) btn.click();
    });
    await delay(4000);

    const path2 = path.join(EVIDENCE_DIR, 'estilo_parapequenos_humanasuave_vertical.png');
    await page.screenshot({ path: path2 });
    console.log(`Saved screenshot 2 to: ${path2}`);

    // =========================================================================
    // RECURSO VISUAL 3: Futuro Tech / Dark Mode + Dark Tech + Infografía vertical
    // =========================================================================
    console.log('\n--- Test 3: Recurso Visual (Futuro Tech + Dark Tech + Infografía vertical) ---');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    await delay(2000);

    // Step 1: Origin & Theme
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (btn) btn.click();
    });
    await delay(500);
    await page.type('textarea', 'Los avances recientes en inteligencia artificial y machine learning');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 2: Formato base (Infografía)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Infografía') && b.tagName === 'BUTTON');
      if (btn) btn.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 3: Style selection (3 axes)
    await selectStep3Options(page, 'Futuro Tech', 'Dark Tech', 'Infografía Vertical');

    // Step 4: Generate
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Generar recurso');
      if (btn) btn.click();
    });
    await delay(5000);

    const path3 = path.join(EVIDENCE_DIR, 'estilo_futurotech_darktech_vertical.png');
    await page.screenshot({ path: path3 });
    console.log(`Saved screenshot 3 to: ${path3}`);

    // =========================================================================
    // RECURSO VISUAL 4: Canva Educativo + Canva Educativo + Cuadrado
    // =========================================================================
    console.log('\n--- Test 4: Recurso Visual (Canva Educativo + Canva Educativo + Cuadrado) ---');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    await delay(2000);

    // Step 1: Origin & Theme
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (btn) btn.click();
    });
    await delay(500);
    await page.type('textarea', 'Las capas de la Tierra y sus características composicionales');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 2: Formato base (Infografía)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Infografía') && b.tagName === 'BUTTON');
      if (btn) btn.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 3: Style selection (3 axes)
    await selectStep3Options(page, 'Canva Educativo', 'Canva Educativo', 'Cuadrado');

    // Step 4: Generate
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Generar recurso');
      if (btn) btn.click();
    });
    await delay(5000);

    const path4 = path.join(EVIDENCE_DIR, 'estilo_canva_canva_cuadrado.png');
    await page.screenshot({ path: path4 });
    console.log(`Saved screenshot 4 to: ${path4}`);

  } catch (err) {
    console.error('An error occurred during browser automation:', err);
    const errPath = path.join(EVIDENCE_DIR, 'error_state_3axis.png');
    await page.screenshot({ path: errPath });
    console.log('Saved error screenshot to error_state_3axis.png');
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

run();
