const fs = require('fs');
const html = fs.readFileSync('scratch/html_before.html', 'utf8');
const match = html.match(/<button[^>]*>[^]*?<\/button>/g);
if (match) {
  const oaButtons = match.filter(m => m.includes('OA 1.'));
  console.log('OA 1 Button in Before:');
  console.log(oaButtons[0]);
}
