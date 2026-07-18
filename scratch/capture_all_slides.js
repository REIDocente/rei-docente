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
  console.error('Error: Google Chrome was not found.');
  process.exit(1);
}

const EVIDENCE_DIR = 'C:\\Users\\56940\\Desktop\\evidencia_visual_temp';
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('[Puppeteer] Launching browser...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1200, height: 800 }
  });

  const page = await browser.newPage();
  
  try {
    console.log('[Puppeteer] Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('[Puppeteer] Navigating to /presentaciones...');
    await page.goto('http://localhost:3000/presentaciones', { waitUntil: 'networkidle2' });
    await delay(2000);

    console.log('[Puppeteer] Selecting Tema tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Tema');
      if (btn) btn.click();
    });
    await delay(500);

    await page.type('textarea', 'Los viajes de Cristóbal Colón');
    await delay(500);

    // Continuar Step 1
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continuar'));
      if (btn) btn.click();
    });
    await delay(1000);

    // Continuar Step 2
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continuar'));
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 3: Select "Expediente REI" style, and let's keep Paleta as default (Elegante)
    console.log('[Puppeteer] Selecting Expediente REI style...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Expediente REI'));
      if (btn) btn.click();
    });
    await delay(500);

    // Continuar Step 3
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continuar'));
      if (btn) btn.click();
    });
    await delay(1000);

    // Step 4: Click Generar
    console.log('[Puppeteer] Clicking Generar...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Generar'));
      if (btn) btn.click();
    });

    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Descargar PPTX'));
    }, { timeout: 30000 });
    await delay(2000);

    // Capture each of the 6 slides
    for (let i = 1; i <= 6; i++) {
      console.log(`[Puppeteer] Clicking Slide ${i}...`);
      await page.evaluate((slideNum) => {
        const divs = Array.from(document.querySelectorAll('div'));
        const slideBtn = divs.find(d => d.textContent.trim().startsWith(`SLIDE ${slideNum}`) || d.textContent.trim().includes(`Misión del Día`) && slideNum === 2);
        // Find clickable item that contains SLIDE i
        const clickable = Array.from(document.querySelectorAll('p, div, button')).find(el => {
          return el.textContent.trim() === `SLIDE ${slideNum}` || (el.tagName === 'DIV' && el.querySelector('div')?.textContent.trim() === `SLIDE ${slideNum}`);
        });
        if (clickable) {
          clickable.click();
        } else {
          // Alternative selector: find elements by text
          const allDivs = Array.from(document.querySelectorAll('div'));
          const target = allDivs.find(d => d.textContent.includes(`SLIDE ${slideNum}`));
          if (target) target.click();
        }
      }, i);
      await delay(800);

      const screenshotPath = path.join(EVIDENCE_DIR, `slide_${i}.png`);
      // Capture only the slide container element
      const element = await page.$('.aspect-\\[16\\/9\\]');
      if (element) {
        await element.screenshot({ path: screenshotPath });
        console.log(`[Puppeteer] Saved slide screenshot: ${screenshotPath}`);
      } else {
        await page.screenshot({ path: screenshotPath });
        console.log(`[Puppeteer] Saved full page screenshot (fallback): ${screenshotPath}`);
      }
    }

    console.log('[Puppeteer] Completed slide captures successfully.');
  } catch (err) {
    console.error('[Puppeteer] Error:', err);
  } finally {
    await browser.close();
  }
}

run();
