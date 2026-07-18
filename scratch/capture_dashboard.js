module.paths.push('c:\\\\Users\\\\56940\\\\Desktop\\\\app-docente-ia\\\\node_modules');
const puppeteer = require('puppeteer-core');
const path = require('path');

const BROWSER_PATH = 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
const PORT = 3000;
const ARTIFACT_DIR = 'C:\\\\Users\\\\56940\\\\.gemini\\\\antigravity\\\\brain\\\\f25f44dd-da7f-42b6-ad59-331334099972';

async function main() {
  console.log('Launching browser to capture dashboard screenshot...');
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 1000 }
  });

  try {
    const page = await browser.newPage();
    
    // Sign-in or use mock auth logic (enable mock auth in localStorage)
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Enable mock auth
    await page.evaluate(() => {
      window.localStorage.setItem('use_mock_auth', 'true');
    });
    
    // Reload page to apply mock auth
    console.log('Reloading with mock auth active...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000)); // wait for images to load

    const outputFilename = 'dashboard_integrated.png';
    await page.screenshot({ path: path.join(ARTIFACT_DIR, outputFilename) });
    console.log(`Saved dashboard screenshot to: ${path.join(ARTIFACT_DIR, outputFilename)}`);

  } catch (err) {
    console.error('Error capturing dashboard:', err);
  } finally {
    await browser.close();
  }
}

main();
