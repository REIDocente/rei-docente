const fs = require('fs');

const before = fs.readFileSync('scratch/html_before.html', 'utf8');
const after = fs.readFileSync('scratch/html_after.html', 'utf8');

console.log('--- Before Click ---');
console.log('Includes bg-rose-500/8?', before.includes('bg-rose-500/8') || before.includes('bg-rose-500'));
console.log('Includes text-rose-400?', before.includes('text-rose-400'));
console.log('Has Lucide LucideCheckSquare?', before.includes('lucide-check-square'));

console.log('\n--- After Click ---');
console.log('Includes bg-rose-500/8?', after.includes('bg-rose-500/8') || after.includes('bg-rose-500'));
console.log('Includes text-rose-400?', after.includes('text-rose-400'));
console.log('Has Lucide LucideCheckSquare?', after.includes('lucide-check-square'));

// Let's print the first button in after
const match = after.match(/<button[^>]*>[^]*?<\/button>/g);
if (match) {
  const oaButtons = match.filter(m => m.includes('OA 1.'));
  console.log('\n--- OA 1 Button in After: ---');
  console.log(oaButtons[0]);
}
