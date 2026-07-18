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

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    // Navigate to login
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await delay(2000);

    console.log('Injecting mock auth use_mock_auth = true...');
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating to dashboard first to confirm session...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await delay(3000);
    console.log('Dashboard URL:', page.url());

    // ────────────────────────────────────────────────────────────────────────
    // PART 1: Presentaciones IA
    // ────────────────────────────────────────────────────────────────────────

    console.log('Navigating to Presentaciones IA...');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await delay(3000);
    console.log('Presentaciones URL:', page.url());

    // Step 1: Input Theme
    console.log('Step 1: Selecting Tema origin...');
    const clickedTema = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const temaBtn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (temaBtn) {
        temaBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Tema button:', clickedTema);
    await delay(1000);

    console.log('Typing theme description...');
    await page.waitForSelector('textarea', { timeout: 5000 });
    await page.type('textarea', 'Los planetas del sistema solar y sus principales características');
    
    console.log('Clicking Continuar in Step 1...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    // Step 2: Duration, click Continuar
    console.log('Step 2: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    // Step 3: Choose Style "Para pequeños"
    console.log('Step 3: Selecting style "Para pequeños"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const styleBtn = buttons.find(b => b.textContent.includes('Para pequeños'));
      if (styleBtn) styleBtn.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    // Step 4: Generate
    console.log('Step 4: Generating preview...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genBtn = buttons.find(b => b.textContent.trim() === 'Generar vista previa');
      if (genBtn) genBtn.click();
    });

    await delay(4000);

    const pPequenosPath = path.join(EVIDENCE_DIR, 'estilo_para_pequenos.png');
    await page.screenshot({ path: pPequenosPath });
    console.log('Captured estilo_para_pequenos.png');


    // Style 2: Tipo Gamma
    console.log('Generating Presentation: Tipo Gamma...');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await delay(3000);

    console.log('Step 1: Selecting Tema origin...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const temaBtn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (temaBtn) temaBtn.click();
    });
    await delay(1000);

    await page.type('textarea', 'Los planetas del sistema solar y sus principales características');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 2: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 3: Selecting style "Tipo Gamma"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const styleBtn = buttons.find(b => b.textContent.includes('Tipo Gamma'));
      if (styleBtn) styleBtn.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 4: Generating preview...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genBtn = buttons.find(b => b.textContent.trim() === 'Generar vista previa');
      if (genBtn) genBtn.click();
    });

    await delay(4000);

    const pGammaPath = path.join(EVIDENCE_DIR, 'estilo_tipo_gamma.png');
    await page.screenshot({ path: pGammaPath });
    console.log('Captured estilo_tipo_gamma.png');


    // ────────────────────────────────────────────────────────────────────────
    // PART 2: Recursos Visuales IA
    // ────────────────────────────────────────────────────────────────────────

    // Style 1: Colorido
    console.log('Generating Visual Resource: Colorido...');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    await delay(3000);
    console.log('Visual URL:', page.url());

    console.log('Step 1: Selecting Tema origin...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const temaBtn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (temaBtn) temaBtn.click();
    });
    await delay(1000);

    await page.type('textarea', 'Los planetas del sistema solar y sus principales características');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 2: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 3: Selecting style "Colorido"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const styleBtn = buttons.find(b => b.textContent.includes('Colorido'));
      if (styleBtn) styleBtn.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 4: Generating resource...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genBtn = buttons.find(b => b.textContent.trim() === 'Generar recurso');
      if (genBtn) genBtn.click();
    });

    await delay(10000);

    const vColoridoPath = path.join(EVIDENCE_DIR, 'estilo_colorido.png');
    await page.screenshot({ path: vColoridoPath });
    console.log('Captured estilo_colorido.png');


    // Style 2: Minimalista
    console.log('Generating Visual Resource: Minimalista...');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    await delay(3000);

    console.log('Step 1: Selecting Tema origin...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const temaBtn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (temaBtn) temaBtn.click();
    });
    await delay(1000);

    await page.type('textarea', 'Los planetas del sistema solar y sus principales características');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 2: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 3: Selecting style "Minimalista"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const styleBtn = buttons.find(b => b.textContent.includes('Minimalista'));
      if (styleBtn) styleBtn.click();
    });
    await delay(500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const contBtn = buttons.find(b => b.textContent.trim() === 'Continuar');
      if (contBtn) contBtn.click();
    });
    await delay(1000);

    console.log('Step 4: Generating resource...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genBtn = buttons.find(b => b.textContent.trim() === 'Generar recurso');
      if (genBtn) genBtn.click();
    });

    await delay(10000);

    const vMinimalistaPath = path.join(EVIDENCE_DIR, 'estilo_minimalista.png');
    await page.screenshot({ path: vMinimalistaPath });
    console.log('Captured estilo_minimalista.png');

  } catch (err) {
    console.error('An error occurred during browser automation:', err);
    const errPath = path.join(EVIDENCE_DIR, 'error_state.png');
    await page.screenshot({ path: errPath });
    console.log('Saved error screenshot to error_state.png');
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

run();
