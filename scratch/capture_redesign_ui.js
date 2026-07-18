const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Locate Google Chrome installation path on Windows
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
    // 1. Capture Landing page
    console.log('Navigating to http://localhost:3000/login (ensure logged out)...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    // Clear localStorage mock auth
    await page.evaluate(() => {
      localStorage.removeItem('use_mock_auth');
    });
    
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await delay(3000); // Allow transitions

    const landingPath = path.join(EVIDENCE_DIR, 'landing_nueva.png');
    await page.screenshot({ path: landingPath });
    console.log('Captured landing_nueva.png');

    // 2. Open login modal
    console.log('Opening login modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Iniciar sesión'));
      if (btn) btn.click();
    });
    await delay(1500);
    const modalPath = path.join(EVIDENCE_DIR, 'landing_login_modal.png');
    await page.screenshot({ path: modalPath });
    console.log('Captured landing_login_modal.png');

    // 3. Inject mock auth and go to dashboard
    console.log('Injecting mock authentication flag...');
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating to dashboard...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await delay(6000); // Allow database fetch and layouts to load

    const dashboardPath = path.join(EVIDENCE_DIR, 'dashboard_nuevo.png');
    await page.screenshot({ path: dashboardPath });
    console.log('Captured dashboard_nuevo.png');

  } catch (err) {
    console.error('An error occurred during browser automation:', err);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
}

run();
