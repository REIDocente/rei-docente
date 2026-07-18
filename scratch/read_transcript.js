const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = 'C:\\Users\\56940\\.gemini\\antigravity\\brain\\1a0d791b-b4e6-43de-a683-8ec2adb58184\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  if (!fs.existsSync(transcriptPath)) {
    console.log('Transcript file not found.');
    return;
  }
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let stepNum = 0;
  for await (const line of rl) {
    stepNum++;
    if ([335, 337, 339, 341, 353].includes(stepNum)) {
      try {
        const step = JSON.parse(line);
        console.log(`--- Step ${stepNum} (Type: ${step.type}) ---`);
        console.log(step.content);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

run();
