const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Launching browser to generate real evaluation...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  // Set download behavior to save files to outputDir
  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: outputDir
  });

  try {
    console.log('Step 0: Logging in with mock auth...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating to /evaluaciones...');
    await page.goto('http://localhost:3000/evaluaciones', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Wizard Step 1: Clicking Continuar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Continuar'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Wizard Step 2: Selecting 2° Medio course...');
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      if (selects.length > 0) {
        selects[0].value = '2° Medio';
        selects[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    console.log('Wizard Step 2: Filling theme with Lenguaje prompt...');
    await page.waitForSelector('textarea');
    await page.type('textarea', 'Lectura comprensiva e interpretación de la obra lírica del Siglo de Oro (Garcilaso de la Vega, Lope de Vega), analizando el concepto de amor y belleza.');

    console.log('Wizard Step 2: Setting slider for questions to 5...');
    await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        slider.value = 5;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 1000));

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

    console.log('Wizard Step 4: Clicking Generar (This will call Claude)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar'));
      if (btn) btn.click();
    });

    console.log('Waiting 35 seconds for Claude to generate real questions and preview...');
    await new Promise(r => setTimeout(r, 35000));

    console.log('Clicking Exportar PDF...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Exportar PDF'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Clicking Exportar Word...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Exportar Word'));
      if (btn) btn.click();
    });

    console.log('Waiting 5 seconds for downloads to finish...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('Generation process finished successfully!');
  } catch (error) {
    console.error('Error during real document generation:', error);
  } finally {
    await browser.close();
  }
}

run();
