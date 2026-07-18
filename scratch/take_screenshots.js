const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    console.log('Step 0: Navigating to login and enabling mock auth...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Inject mock auth into localStorage
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Reloading to apply mock auth and trigger redirect...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    
    // Additional wait to ensure dashboard animations and loads are finished
    await new Promise(r => setTimeout(r, 6000));

    console.log('Step 1: Capturing dashboard...');
    await page.screenshot({ path: path.join(outputDir, 'dashboard.png') });
    console.log('Dashboard screenshot saved.');

    console.log('Step 2: Navigating to /guias...');
    await page.goto('http://localhost:3000/guias', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Filling guias theme...');
    await page.waitForSelector('textarea');
    await page.type('textarea', 'La Leyenda de la Pincoya y la Pesca en Chiloé');

    console.log('Clicking generate guide button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar Guía'));
      if (btn) btn.click();
    });

    console.log('Waiting for guide generation to finish (mock fallback should trigger in ~2-3 seconds)...');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(outputDir, 'guias.png') });
    console.log('Guias screenshot saved.');

    console.log('Step 3: Navigating to /evaluaciones...');
    await page.goto('http://localhost:3000/evaluaciones', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Wizard Step 1: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Continuar'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Wizard Step 2: Capturing Paso 2...');
    await page.screenshot({ path: path.join(outputDir, 'evaluaciones_paso2.png') });
    console.log('Evaluaciones Paso 2 screenshot saved.');

    console.log('Wizard Step 2: Filling theme...');
    await page.waitForSelector('textarea');
    await page.type('textarea', 'El Mito de Prometeo y el Robo del Fuego');

    console.log('Wizard Step 2: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Continuar'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Wizard Step 3: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Continuar'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Wizard Step 4: Clicking Generar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar'));
      if (btn) btn.click();
    });

    console.log('Waiting for evaluation generation to finish...');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(outputDir, 'evaluaciones.png') });
    console.log('Evaluaciones final preview screenshot saved.');

    console.log('Step 4: Navigating to /presentaciones...');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Selecting Tema origin...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('Filling presentations theme...');
    await page.waitForSelector('textarea');
    await page.type('textarea', 'El cantar de gesta y el Poema de Mio Cid');

    console.log('Clicking generate presentation button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar vista previa'));
      if (btn) btn.click();
    });

    console.log('Waiting for presentation generation to finish...');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(outputDir, 'presentaciones.png') });
    console.log('Presentaciones screenshot saved.');

    console.log('Step 5: Navigating to /visual...');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Filling visual resource theme...');
    await page.waitForSelector('textarea');
    await page.type('textarea', 'Cadenas alimenticias en el desierto de Atacama');

    console.log('Clicking generate visual resource button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar recurso'));
      if (btn) btn.click();
    });

    console.log('Waiting for visual resource generation (or error)...');
    await new Promise(r => setTimeout(r, 8500));

    await page.screenshot({ path: path.join(outputDir, 'visual.png') });
    console.log('Visual resource screenshot saved.');

    console.log('All screenshots taken successfully!');
  } catch (error) {
    console.error('Error during screenshot execution:', error);
  } finally {
    await browser.close();
  }
}

run();
