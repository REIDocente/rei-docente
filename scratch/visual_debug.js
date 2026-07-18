const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';

async function run() {
  console.log('Launching browser for /visual debug...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Log console messages inside the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

  try {
    console.log('Navigating to login and enabling mock auth...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating directly to /visual...');
    await page.goto('http://localhost:3000/visual', { waitUntil: 'networkidle2' });
    
    console.log('Waiting 10 seconds to observe logs...');
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('Taking visual_debug.png...');
    await page.screenshot({ path: path.join(outputDir, 'visual_debug.png') });
    console.log('Screenshot taken.');

  } catch (error) {
    console.error('Error during debug run:', error);
  } finally {
    await browser.close();
  }
}

run();
