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
  console.error('Error: Google Chrome not found.');
  process.exit(1);
}

const evDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';
if (!fs.existsSync(evDir)) {
  fs.mkdirSync(evDir, { recursive: true });
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

  // Forward page console logs to terminal
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    // Enable download path in headless mode
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: evDir
    });

    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(evDir, 'dbg_1_login.png') });

    console.log('Injecting mock authentication flag...');
    await page.evaluate(() => {
      localStorage.setItem('use_mock_auth', 'true');
    });

    console.log('Navigating to /evaluaciones/nueva...');
    await page.goto('http://localhost:3000/evaluaciones/nueva', { waitUntil: 'networkidle2' });
    await delay(3000);
    await page.screenshot({ path: path.join(evDir, 'dbg_2_nueva_loaded.png') });

    console.log('Selecting level "2° Medio"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === '2° Medio');
      if (btn) btn.click();
      else throw new Error('2° Medio button not found');
    });
    await delay(2000);
    await page.screenshot({ path: path.join(evDir, 'dbg_3_nivel_selected.png') });

    console.log('Waiting for curriculum OAs to load...');
    await page.waitForFunction(() => {
      return !document.body.innerText.includes('Cargando OAs del currículum...');
    }, { timeout: 20000 });
    await delay(3000); // Wait extra time for React hydration after loading OAs
    await page.screenshot({ path: path.join(evDir, 'dbg_4_oas_loaded.png') });

    // Retry clicking the OA button until the checkbox is checked in the DOM
    console.log('Selecting the first OA (with retry for hydration)...');
    let oaSelected = false;
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`Click OA attempt ${attempt}...`);
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const oaBtn = buttons.find(b => b.innerText.includes('OA 1.'));
        if (oaBtn) {
          oaBtn.click();
          console.log('Clicked OA 1 button');
        } else {
          console.log('OA 1 button not found on page');
        }
      });
      await delay(1000);

      // Check if it registered (button has active class or has square-check-big icon)
      const isChecked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const oaBtn = buttons.find(b => b.innerText.includes('OA 1.'));
        if (oaBtn) {
          const hasCheckIcon = oaBtn.querySelector('.lucide-square-check-big, .lucide-check-square') !== null;
          const hasBgClass = oaBtn.className.includes('bg-rose-500');
          console.log(`OA 1 button status: hasCheckIcon=${hasCheckIcon}, hasBgClass=${hasBgClass}`);
          return hasCheckIcon || hasBgClass;
        }
        return false;
      });

      if (isChecked) {
        console.log('OA selection successfully registered in the DOM!');
        oaSelected = true;
        break;
      }
    }

    if (!oaSelected) {
      throw new Error('Failed to select OA after 10 attempts');
    }

    await page.screenshot({ path: path.join(evDir, 'dbg_5_oa_selected.png') });

    console.log('Setting range input (nPreguntas) to 8...');
    await page.evaluate(() => {
      const range = document.querySelector('input[type="range"]');
      if (range) {
        range.value = 8;
        range.dispatchEvent(new Event('input', { bubbles: true }));
        range.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        throw new Error('Range input not found');
      }
    });
    await delay(1000);

    // Verify if Generar button is enabled now
    const isBtnDisabled = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar'));
      return btn ? btn.disabled : 'Not found';
    });
    console.log('Is "Generar" button disabled?', isBtnDisabled);

    console.log('Clicking "Generar Evaluación" button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Generar'));
      if (btn) {
        btn.click();
        console.log('Clicked Generar button!');
      } else {
        throw new Error('Generar button not found');
      }
    });
    await delay(1000);
    await page.screenshot({ path: path.join(evDir, 'dbg_6_generar_clicked.png') });

    console.log('Waiting for redirect to evaluation detail page (calling Claude)...');
    await page.waitForFunction(() => {
      return window.location.href.includes('/evaluaciones/mock-ev-');
    }, { timeout: 120000 });
    console.log('Redirected! Current URL:', page.url());
    await delay(5000);

    console.log('Extracting generated JSON from localStorage...');
    const rawData = await page.evaluate(() => {
      return localStorage.getItem('mock_eval_data');
    });
    if (rawData) {
      fs.writeFileSync(path.join(evDir, 'evaluacion_real_ui.json'), rawData, 'utf8');
      console.log('Successfully saved generated JSON data to evaluacion_real_ui.json');
    } else {
      console.warn('Warning: mock_eval_data not found in localStorage on detail page.');
    }

    const detailScreenshotPath = path.join(evDir, 'dbg_7_evaluacion_detail.png');
    await page.screenshot({ path: detailScreenshotPath });
    console.log(`Saved screenshot to: ${detailScreenshotPath}`);

    console.log('Clicking PDF export button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('PDF'));
      if (btn) {
        btn.click();
        console.log('Clicked PDF Export button!');
      } else {
        throw new Error('PDF button not found');
      }
    });

    console.log('Waiting for download to complete...');
    await delay(15000); // 15 seconds for download

    const files = fs.readdirSync(evDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    if (pdfFiles.length > 0) {
      console.log(`Success! Downloaded PDF: ${pdfFiles[0]}`);
      fs.copyFileSync(path.join(evDir, pdfFiles[0]), path.join(evDir, 'evaluacion-completa.pdf'));
    } else {
      console.error('Error: PDF file was not downloaded.');
    }

  } catch (error) {
    console.error('Puppeteer run failed:', error);
    await page.screenshot({ path: path.join(evDir, 'dbg_error.png') });
  } finally {
    await browser.close();
  }
}

run();
