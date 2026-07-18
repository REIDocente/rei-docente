const fs = require('fs');
const code = fs.readFileSync('src/app/planner/new/page.tsx', 'utf-8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('generate') || line.includes('fetch') || line.includes('api/')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
