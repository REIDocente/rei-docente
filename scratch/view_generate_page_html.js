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

async function run() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    await page.goto('http://localhost:3000/evaluaciones/nueva', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click 2° Medio
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '2° Medio');
      btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Wait for load
    await page.waitForFunction(() => {
      return !document.body.innerText.includes('Cargando OAs del currículum...');
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get HTML before selection
    const htmlBefore = await page.evaluate(() => {
      return document.querySelector('main').innerHTML;
    });
    fs.writeFileSync('scratch/html_before.html', htmlBefore, 'utf8');
    console.log('Saved html_before.html');

    // Click first OA
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const oaBtn = buttons.find(b => b.innerText.includes('OA 1.'));
      if (oaBtn) {
        oaBtn.click();
        console.log('Clicked OA button');
      } else {
        console.log('OA button not found!');
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get HTML after selection
    const htmlAfter = await page.evaluate(() => {
      return document.querySelector('main').innerHTML;
    });
    fs.writeFileSync('scratch/html_after.html', htmlAfter, 'utf8');
    console.log('Saved html_after.html');

  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

run();
