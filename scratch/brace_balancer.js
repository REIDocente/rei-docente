const fs = require('fs');

const code = fs.readFileSync('c:/Users/56940/Desktop/app-docente-ia/src/app/presentaciones/page.tsx', 'utf-8');
const lines = code.split('\n');

let stack = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Basic comment stripping
  let cleanLine = line.replace(/\/\/.*$/g, '');
  
  // Strip strings
  cleanLine = cleanLine.replace(/'[^']*'/g, "''");
  cleanLine = cleanLine.replace(/"[^"]*"/g, '""');
  cleanLine = cleanLine.replace(/`[^`]*`/g, '``');

  for (let j = 0; j < cleanLine.length; j++) {
    const char = cleanLine[j];
    if (char === '{') {
      stack.push({ line: i + 1, col: j + 1, type: '{' });
    } else if (char === '}') {
      if (stack.length === 0) {
        console.log(`Extra close brace '}' at line ${i + 1}, col ${j + 1}`);
      } else {
        const last = stack.pop();
        if (i + 1 >= 500 && i + 1 <= 530) {
          console.log(`Popped '{' from line ${last.line} with '}' on line ${i + 1}`);
        }
      }
    } else if (char === '(') {
      stack.push({ line: i + 1, col: j + 1, type: '(' });
    } else if (char === ')') {
      if (stack.length === 0) {
        console.log(`Extra close parenthesis ')' at line ${i + 1}, col ${j + 1}`);
      } else {
        const last = stack.pop();
      }
    } else if (char === '[') {
      stack.push({ line: i + 1, col: j + 1, type: '[' });
    } else if (char === ']') {
      if (stack.length === 0) {
        console.log(`Extra close bracket ']' at line ${i + 1}, col ${j + 1}`);
      } else {
        const last = stack.pop();
      }
    }
  }
  
  if (i + 1 >= 500 && i + 1 <= 530) {
    console.log(`Line ${i + 1}: Stack size = ${stack.length}, top of stack:`, stack[stack.length - 1]);
  }
}
