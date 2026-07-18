const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const DOWNLOAD_DIR = path.resolve('evidencia_visual');

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const networkLogs = [];

function logNetwork(pageName, type, url, status, method, postData) {
  const logStr = `[${pageName}] ${type}: ${method} ${url} | Status: ${status} | Payload: ${postData ? JSON.stringify(postData) : 'none'}`;
  console.log(logStr);
  networkLogs.push(logStr);
}

async function run() {
  console.log('[Test] Launching Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();

  // Network listener
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      let postData = null;
      try {
        postData = request.postData();
      } catch (e) {}
      logNetwork(page.url().split('/').pop() || 'root', 'REQUEST', url, 'PENDING', request.method(), postData);
    }
  });

  page.on('response', async response => {
    const request = response.request();
    const url = request.url();
    if (url.includes('/api/')) {
      let responseBody = 'none';
      try {
        responseBody = await response.json();
      } catch (e) {
        try {
          responseBody = await response.text();
        } catch (e2) {}
      }
      logNetwork(
        page.url().split('/').pop() || 'root', 
        'RESPONSE', 
        url, 
        response.status(), 
        request.method(), 
        { response: responseBody }
      );
    }
  });

  page.on('console', msg => console.log('[Console]', msg.text()));
  page.on('pageerror', err => console.error('[Page Error]', err.toString()));

  // 1. TEST PLANNER
  console.log('\n--- 1. Testing Kit de Clase (Planner) ---');
  await page.goto(`http://localhost:${PORT}/planner/new`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Choose "Otra" course to type manually
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = '6° Básico';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Input theme
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    // Select manual mode for theme if available
    const themeButtons = Array.from(document.querySelectorAll('button'));
    const manualBtn = themeButtons.find(b => b.textContent.trim().includes('Ingresar tema manual'));
    if (manualBtn) {
      manualBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    // Fill theme text
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const themeArea = textareas.find(t => t.placeholder && t.placeholder.includes('medieval'));
    if (themeArea) {
      themeArea.value = 'El cantar de gesta medieval y héroes caballerescos';
      themeArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    const inputs = Array.from(document.querySelectorAll('input'));
    const oaInput = inputs.find(i => i.placeholder && i.placeholder.includes('ej. OA 3'));
    if (oaInput) {
      oaInput.value = 'OA 3';
      oaInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('[Test] Triggering Generation in Planner...');
  await page.click('#generate-plan-btn');
  
  // Wait up to 10 seconds for the API response
  console.log('[Test] Waiting for generation API...');
  await new Promise(r => setTimeout(r, 8000));
  
  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'planner_evidence.png') });
  console.log('[Test] Captured planner_evidence.png');


  // 2. TEST PRESENTACIONES
  console.log('\n--- 2. Testing Presentaciones ---');
  await page.goto(`http://localhost:${PORT}/presentaciones`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Fill manual theme
  await page.evaluate(() => {
    // Select Tema origin
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.textContent.trim() === 'Tema libre');
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const input = document.querySelector('input[type="text"]');
    if (input) {
      input.value = 'Los planetas y el sistema solar';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('[Test] Triggering Generation in Presentaciones...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const genBtn = buttons.find(b => b.textContent.trim().includes('Generar Presentación'));
    if (genBtn) genBtn.click();
  });

  console.log('[Test] Waiting for presentation API...');
  await new Promise(r => setTimeout(r, 8000));

  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'presentaciones_evidence.png') });
  console.log('[Test] Captured presentaciones_evidence.png');


  // 3. TEST EVALUACIONES
  console.log('\n--- 3. Testing Evaluaciones ---');
  await page.goto(`http://localhost:${PORT}/evaluaciones`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    // Select Tema libre origin
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.textContent.trim().includes('Tema libre'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const themeArea = textareas.find(t => t.placeholder && t.placeholder.includes('lectura'));
    if (themeArea) {
      themeArea.value = 'Comprensión lectora de fábulas de Esopo';
      themeArea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const inputs = Array.from(document.querySelectorAll('input'));
    const oaInput = inputs.find(i => i.placeholder && i.placeholder.includes('ej. OA 3'));
    if (oaInput) {
      oaInput.value = 'OA 3';
      oaInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('[Test] Triggering Generation in Evaluaciones...');
  await page.click('#btn-generar-evaluacion');

  console.log('[Test] Waiting for evaluations API...');
  await new Promise(r => setTimeout(r, 8000));

  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'evaluaciones_evidence.png') });
  console.log('[Test] Captured evaluaciones_evidence.png');


  // 4. TEST GUIAS
  console.log('\n--- 4. Testing Guías ---');
  await page.goto(`http://localhost:${PORT}/guias`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    // Select Tema libre origin
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(b => b.textContent.trim().includes('Tema libre'));
    if (themeBtn) themeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    const themeArea = textareas.find(t => t.placeholder && t.placeholder.includes('didáctica'));
    if (themeArea) {
      themeArea.value = 'Uso correcto de la ortografía acentual';
      themeArea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const inputs = Array.from(document.querySelectorAll('input'));
    const oaInput = inputs.find(i => i.placeholder && i.placeholder.includes('ej. OA 3'));
    if (oaInput) {
      oaInput.value = 'OA 14';
      oaInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('[Test] Triggering Generation in Guías...');
  await page.click('#btn-generar-guia');

  console.log('[Test] Waiting for guias API...');
  await new Promise(r => setTimeout(r, 8000));

  await page.screenshot({ path: path.join(DOWNLOAD_DIR, 'guias_evidence.png') });
  console.log('[Test] Captured guias_evidence.png');

  await browser.close();
  console.log('\n[Test] Integration Testing Complete!');

  // Save network logs to artifact file
  const reportContent = `
# Reporte de Integración y Pruebas de Red

Este reporte documenta los logs de red y las peticiones enviadas por los 4 asistentes de REI Docente.

## Logs de Red Registrados

${networkLogs.map(l => `- ${l}`).join('\n')}

  `.trim();
  fs.writeFileSync(path.join(DOWNLOAD_DIR, 'reporte_red.md'), reportContent, 'utf8');
  console.log('[Test] Saved network report: reporte_red.md');
}

run().catch(console.error);
