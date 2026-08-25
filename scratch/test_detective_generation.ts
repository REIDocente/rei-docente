import { jsPDF } from 'jspdf';
import { Packer } from 'docx';
import fs from 'fs';
import path from 'path';
import { drawPlayPdf } from '../src/lib/templates/drawPlayPdf';
import { drawPlayWord } from '../src/lib/templates/drawPlayWord';

async function run() {
  const body = {
    motor: 'detective',
    fuente: 'lectura_domiciliaria',
    tema: 'El Túnel de Ernesto Sabato',
    nivel: '2° Medio',
    oa_codes: ['OA 2'],
    duracion: 45,
    modalidad: 'grupal',
    dificultad: 'medio'
  };

  console.log('Sending request to /api/play (calling Claude)...');
  const res = await fetch('http://localhost:3000/api/play', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-access-token'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API failed: ${res.status} | ${errText}`);
  }

  const record = await res.json();
  const juego = record.contenido_json;
  console.log('API response received successfully!');
  console.log('--- VALIDATION DATA ---');
  console.log('Código Final:', juego.codigo_final);
  console.log('Estaciones y sus letras:');
  juego.estaciones.forEach((est: any) => {
    console.log(`  Estación ${est.numero}: "${est.nombre}" -> Letra: "${est.codigo_letra}"`);
  });
  console.log('Hipótesis Central:', juego.solucion?.hipotesis_central);
  console.log('-----------------------');

  // Create output directories
  const destDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\scratch\\downloads';
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Generate PDF
  console.log('Generating PDF...');
  const docPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawPlayPdf({
    doc: docPdf,
    motorId: 'detective',
    juego,
    docenteNombre: 'Profesor Carlos Valenzuela',
    establecimiento: 'LICEO RIGOBERTO FONTT'
  });
  const pdfBuffer = Buffer.from(docPdf.output('arraybuffer'));
  const pdfPath = path.join(destDir, 'detective_el_tunel.pdf');
  fs.writeFileSync(pdfPath, pdfBuffer);
  console.log(`PDF saved to: ${pdfPath}`);

  // Generate Word
  console.log('Generating Word...');
  const docWord = drawPlayWord({
    motorId: 'detective',
    juego,
    docenteNombre: 'Profesor Carlos Valenzuela',
    establecimiento: 'LICEO RIGOBERTO FONTT',
    nivel: '2° Medio'
  });
  const wordBuffer = await Packer.toBuffer(docWord);
  const wordPath = path.join(destDir, 'detective_el_tunel.docx');
  fs.writeFileSync(wordPath, wordBuffer);
  console.log(`Word saved to: ${wordPath}`);
}

run().catch(console.error);
