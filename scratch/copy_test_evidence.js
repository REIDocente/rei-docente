const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/56940/Desktop/app-docente-ia/evidencia_visual';
const destDir = 'C:/Users/56940/.gemini/antigravity/brain/f25f44dd-da7f-42b6-ad59-331334099972';

const filesToCopy = [
  'planner_evidence.png',
  'presentaciones_evidence.png',
  'evaluaciones_evidence.png',
  'guias_evidence.png',
  'reporte_red.md'
];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

filesToCopy.forEach(f => {
  const src = path.join(srcDir, f);
  const dest = path.join(destDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${f} to artifacts directory`);
  } else {
    console.log(`Source file ${f} not found at ${src}`);
  }
});
