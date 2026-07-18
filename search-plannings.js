const fs = require('fs');
const logPath = 'C:\\\\Users\\\\56940\\\\.gemini\\\\antigravity\\\\brain\\\\c6bce28a-f787-430d-8503-97369a1c8d70\\\\.system_generated\\\\logs\\\\transcript_full.jsonl';

if (!fs.existsSync(logPath)) {
  console.error('Log file not found');
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  try {
    const parsed = JSON.parse(line);
    if (parsed.step_index === 2544) {
      console.log('--- FOUND STEP 2544 ---');
      fs.writeFileSync('extracted-plan-step-2544.txt', parsed.content, 'utf8');
      console.log('Extracted and saved to extracted-plan-step-2544.txt');
      console.log(parsed.content.substring(0, 1000) + '...');
      break;
    }
  } catch (err) {
    // Ignore invalid JSON lines
  }
}
