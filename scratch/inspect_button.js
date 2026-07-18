const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/guias', { waitUntil: 'networkidle2' });
  
  const buttonsHtml = await page.evaluate(() => {
    const parent = document.querySelector('label')?.parentElement || document.body;
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map((b, i) => `${i}: text="${b.textContent.trim()}" html="${b.outerHTML}"`).join('\n');
  });
  
  console.log('=== BUTTONS HTML ===');
  console.log(buttonsHtml);
  
  await browser.close();
}

run().catch(console.error);
