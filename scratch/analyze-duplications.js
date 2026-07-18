const fs = require('fs');

const data = JSON.parse(fs.readFileSync('generated-planning-s3-u3-pre.json', 'utf8'));

// Helper to find duplicate paragraphs/lines across the JSON values
const lines = [];
const lineToKey = {};

function traverse(obj, keyPath) {
  if (typeof obj === 'string') {
    const splitLines = obj.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    splitLines.forEach(line => {
      lines.push({ line, keyPath });
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      traverse(obj[key], keyPath ? `${keyPath}.${key}` : key);
    }
  }
}

traverse(data, '');

console.log(`Total analyzed text blocks (length > 5): ${lines.length}`);

const seen = new Map();
const duplicates = [];

for (const item of lines) {
  if (seen.has(item.line)) {
    duplicates.push({
      text: item.line,
      firstSeenIn: seen.get(item.line),
      nowSeenIn: item.keyPath
    });
  } else {
    seen.set(item.line, item.keyPath);
  }
}

if (duplicates.length === 0) {
  console.log('No exact duplicate text blocks found in JSON values!');
} else {
  console.log(`Found ${duplicates.length} duplicate text blocks:`);
  duplicates.forEach((dup, i) => {
    console.log(`\nDuplicate #${i + 1}:`);
    console.log(`Text: "${dup.text}"`);
    console.log(`First key: ${dup.firstSeenIn}`);
    console.log(`Second key: ${dup.nowSeenIn}`);
  });
}
