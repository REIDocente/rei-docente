const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Launching browser for HistoryCard verification...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  const consoleErrors = [];
  
  // Track console messages and page errors
  page.on('console', msg => {
    const text = msg.text();
    console.log('PAGE LOG:', text);
    if (msg.type() === 'error' || text.includes('Invalid src prop') || text.includes('images.unsplash.com')) {
      consoleErrors.push({ source: 'console_error', text });
    }
  });

  page.on('pageerror', err => {
    const text = err.toString();
    console.error('PAGE ERROR:', text);
    consoleErrors.push({ source: 'uncaught_exception', text });
  });

  try {
    console.log('Navigating to login and enabling mock auth...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating to /visual...');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    
    // Wait for the history items to be rendered and the mock images to start loading
    await new Promise(r => setTimeout(r, 4000));

    console.log('Scrolling History list into view...');
    const scrolled = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Historial'));
      if (heading) {
        heading.scrollIntoView({ behavior: 'auto', block: 'center' });
        return true;
      }
      return false;
    });

    if (scrolled) {
      console.log('History section scrolled into view.');
    } else {
      console.warn('Could not find Historial section heading.');
    }

    // Wait extra seconds for image loading
    console.log('Waiting 5 extra seconds for Unsplash images to load...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('Saving screenshot visual_historycard_fix.png...');
    await page.screenshot({ path: path.join(outputDir, 'visual_historycard_fix.png') });
    console.log('Screenshot saved.');

    console.log('\n--- CONSOLE ERROR REPORT ---');
    if (consoleErrors.length === 0) {
      console.log('NO ERRORS FOUND. Next.js image loading is clean.');
    } else {
      console.log(`FOUND ${consoleErrors.length} ERRORS/WARNINGS:`);
      consoleErrors.forEach((e, idx) => {
        console.log(`[${idx + 1}] Source: ${e.source} | Message: ${e.text}`);
      });
    }
    console.log('----------------------------\n');

  } catch (error) {
    console.error('Error during HistoryCard screenshots:', error);
  } finally {
    await browser.close();
  }
}

run();
