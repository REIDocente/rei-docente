const fs = require('fs');
const path = require('path');

const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe')
];

console.log('Checking browser paths...');
let found = false;
for (const p of paths) {
  if (fs.existsSync(p)) {
    console.log(`FOUND: ${p}`);
    found = true;
  } else {
    console.log(`NOT FOUND: ${p}`);
  }
}
if (!found) {
  console.log('No standard Chrome/Edge browser found.');
}
