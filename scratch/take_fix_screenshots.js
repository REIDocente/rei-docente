const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Launching browser for fix verification...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Log console messages inside the page to debug
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

  try {
    console.log('Step 0: Navigating to login and enabling mock auth...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Inject mock auth into localStorage
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Reloading to apply mock auth and redirect...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));

    console.log('Step 1: Navigating to /guias...');
    await page.goto('http://localhost:3000/guias', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Filling guias theme...');
    await page.waitForSelector('textarea');
    await page.type('textarea', 'La Leyenda de la Pincoya y la Pesca en Chiloé');

    console.log('Clicking generate guide button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar Guía'));
      if (btn) btn.click();
    });

    console.log('Waiting for guide generation...');
    await new Promise(r => setTimeout(r, 6000));

    await page.screenshot({ path: path.join(outputDir, 'guias_fix.png') });
    console.log('guias_fix.png screenshot saved.');

    console.log('Step 2: Navigating to /visual...');
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

    console.log('Waiting for visual resource generation (or fallback/error)...');
    await new Promise(r => setTimeout(r, 8500));

    await page.screenshot({ path: path.join(outputDir, 'visual_fix.png') });
    console.log('visual_fix.png screenshot saved.');

    console.log('Fix screenshots completed successfully!');
  } catch (error) {
    console.error('Error during fix screenshots:', error);
  } finally {
    await browser.close();
  }
}

run();
