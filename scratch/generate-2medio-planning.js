const fs = require('fs');
const path = require('path');
const http = require('http');
const { jsPDF } = require('jspdf');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } = require('docx');
const { createClient } = require('@supabase/supabase-js');

// Custom multipart/form-data POST helper using standard http module to avoid headersTimeout errors
function sendPostFormData(url, fields) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    let body = Buffer.alloc(0);

    for (const [key, value] of Object.entries(fields)) {
      body = Buffer.concat([
        body,
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`)
      ]);
    }
    body = Buffer.concat([body, Buffer.from(`--${boundary}--\r\n`)]);

    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      },
      timeout: 900000 // 15 minutes
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseBody));
          } catch (e) {
            reject(new Error('Failed to parse JSON response: ' + responseBody));
          }
        } else {
          reject(new Error(`HTTP Error ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

const brainDir = 'C:/Users/56940/.gemini/antigravity/brain/f241f1d5-1366-49fe-b98c-b98ca0270324';
const outputJsonPath = path.join(brainDir, 'Didakta_Planificacion_Nueva_2Medio.json');
const outputPdfPath = path.join(brainDir, 'Didakta_Planificacion_Nueva_2Medio.pdf');
const outputDocxPath = path.join(brainDir, 'Didakta_Planificacion_Nueva_2Medio.docx');

const evidenceDir = 'C:/Users/56940/Desktop/REI_DOCENTE_EVIDENCIA';
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

// 1. Env Parsing
function parseEnv() {
  if (!fs.existsSync('.env.local')) return {};
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.trim().match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return env;
}

const env = parseEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Markdown parser helper for PDF/Word
function parseMarkdownText(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks = [];
  let currentTableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      const isSeparator = trimmed.replace(/[\s\-:|]/g, '') === '';
      if (isSeparator) continue;
      
      const cols = line.split('|').map(c => c.trim());
      if (cols.length >= 2) {
        cols.shift();
        cols.pop();
        currentTableRows.push(cols);
      }
    } else {
      if (currentTableRows.length > 0) {
        blocks.push({ type: 'table', rows: currentTableRows });
        currentTableRows = [];
      }
      blocks.push({ type: 'paragraph', text: line });
    }
  }
  
  if (currentTableRows.length > 0) {
    blocks.push({ type: 'table', rows: currentTableRows });
  }
  return blocks;
}

function detectHeader(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('**') || !trimmed.endsWith('**')) {
    return { isHeader: false, type: null };
  }
  const cleanText = trimmed.slice(2, -2).trim();
  const cleanUpper = cleanText.toUpperCase();
  const isSessionHeader = /^SESI[ÓO]N\b/i.test(cleanText);
  const maxLength = isSessionHeader ? 100 : 80;
  if (trimmed.length > maxLength) {
    return { isHeader: false, type: null };
  }
  if (isSessionHeader) return { isHeader: true, type: 'session' };
  if (/^(INICIO|DESARROLLO|CIERRE)\b/i.test(cleanText)) return { isHeader: true, type: 'section' };
  if (/^(ADAPTACI[ÓO]N\s+DUA\s+1|GU[ÍI]A\s+NIVEL\s+1|NIVEL\s+1)\b/i.test(cleanText) || (cleanUpper.includes('NIVEL 1') && cleanUpper.includes('UNIVERSAL'))) {
    return { isHeader: true, type: 'nivel1' };
  }
  if (/^(ADAPTACI[ÓO]N\s+DUA\s+2|GU[ÍI]A\s+NIVEL\s+2|NIVEL\s+2)\b/i.test(cleanText)) return { isHeader: true, type: 'nivel2' };
  if (/^(ADAPTACI[ÓO]N\s+DUA\s+3|GU[ÍI]A\s+NIVEL\s+3|NIVEL\s+3)\b/i.test(cleanText)) return { isHeader: true, type: 'nivel3' };
  return { isHeader: false, type: null };
}

// 2. jsPDF Exporter
function exportPdf(planning, filename) {
  const doc = new jsPDF();
  let cursorY = 20;
  const marginX = 15;
  const maxLineWidth = 180;
  const pageHeight = 280;

  const sanitizeForPdf = (str) => {
    if (!str) return '';
    return str
      .replace(/⚠️/g, '[Alerta]')
      .replace(/☐/g, '[ ]')
      .replace(/☑/g, '[x]')
      .replace(/🌹/g, '[Rosa]')
      .replace(/⏳/g, '[Tiempo]')
      .replace(/✒️/g, '[Pluma]')
      .replace(/✓/g, '[OK]')
      .replace(/→/g, '->')
      .replace(/←/g, '<-')
      .replace(/⇒/g, '=>')
      .replace(/⇔/g, '<=>')
      .replace(/[^\x00-\xff\u2022\u2014\u2013\u201c\u201d\u2018\u2019]/gu, '');
  };

  const checkPageBreak = (neededSpace) => {
    if (cursorY + neededSpace > pageHeight) {
      doc.addPage();
      cursorY = 20;
    }
  };

  const writeHeader = (title, size = 16, style = 'bold') => {
    const sanitizedTitle = sanitizeForPdf(title);
    checkPageBreak(15);
    doc.setFont('Helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(30, 41, 59);
    doc.text(sanitizedTitle, marginX, cursorY);
    cursorY += 8;
  };

  const writeText = (text, size = 10, style = 'normal', color = [71, 85, 105]) => {
    const sanitizedText = sanitizeForPdf(text);
    doc.setFont('Helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(sanitizedText, maxLineWidth);
    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, marginX, cursorY);
      cursorY += 6;
    }
    cursorY += 2;
  };

  const writeSectionHeaderPdf = (title, bgColor = [241, 245, 249], textColor = [30, 41, 59]) => {
    const sanitizedTitle = sanitizeForPdf(title);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    const bannerPadding = 3;
    const lines = doc.splitTextToSize(sanitizedTitle.replace(/\*\*|__/g, ''), maxLineWidth - bannerPadding * 2);
    const bannerHeight = lines.length * 5 + 3;
    checkPageBreak(bannerHeight + 6);
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(marginX, cursorY, maxLineWidth, bannerHeight, 'F');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    lines.forEach((lineText, idx) => {
      doc.text(lineText, marginX + bannerPadding, cursorY + bannerPadding + 3.5 + (idx * 5));
    });
    cursorY += bannerHeight + 5;
  };

  const writeTablePdf = (rows) => {
    const numCols = rows[0].length;
    let colWidths = Array(numCols).fill(maxLineWidth / numCols);
    if (numCols === 3) colWidths = [35, 130, 15];
    else if (numCols === 2) colWidths = [50, 130];
    const cellMargin = 2;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const colLines = row.map((cellText, colIdx) => {
        doc.setFont('Helvetica', rowIndex === 0 ? 'bold' : 'normal');
        doc.setFontSize(9);
        const sanitizedCell = sanitizeForPdf(cellText);
        const textToSplit = sanitizedCell.replace(/\*\*|__/g, '');
        return doc.splitTextToSize(textToSplit, (colWidths[colIdx] ?? (maxLineWidth / numCols)) - cellMargin * 2);
      });
      const maxLines = Math.max(...colLines.map(lines => lines.length));
      const rowHeight = maxLines * 5 + 4;
      checkPageBreak(rowHeight);
      if (rowIndex === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(marginX, cursorY, maxLineWidth, rowHeight, 'F');
      }
      let colX = marginX;
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const width = colWidths[colIdx] ?? (maxLineWidth / numCols);
        const lines = colLines[colIdx];
        doc.setFont('Helvetica', rowIndex === 0 ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        lines.forEach((lineText, lineIdx) => {
          doc.text(lineText, colX + cellMargin, cursorY + cellMargin + 3 + (lineIdx * 5));
        });
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.1);
        doc.rect(colX, cursorY, width, rowHeight);
        colX += width;
      }
      cursorY += rowHeight;
    }
    cursorY += 4;
  };

  const writeParagraphPdf = (line) => {
    const sanitizedLine = sanitizeForPdf(line);
    const cleanLine = sanitizedLine.replace(/\*\*|__/g, '').trim();
    if (cleanLine === '') {
      cursorY += 4;
      return;
    }
    const headerInfo = detectHeader(sanitizedLine);
    if (headerInfo.isHeader) {
      let bgColor = [241, 245, 249];
      let textColor = [51, 65, 85];
      if (headerInfo.type === 'session') {
        bgColor = [224, 242, 254];
        textColor = [3, 105, 161];
      } else if (headerInfo.type === 'nivel1') {
        bgColor = [226, 240, 217];
        textColor = [56, 87, 35];
      } else if (headerInfo.type === 'nivel2') {
        bgColor = [255, 242, 204];
        textColor = [127, 96, 0];
      } else if (headerInfo.type === 'nivel3') {
        bgColor = [242, 220, 219];
        textColor = [192, 0, 0];
      }
      writeSectionHeaderPdf(cleanLine, bgColor, textColor);
      return;
    }
    const isBullet = sanitizedLine.trim().startsWith('•') || sanitizedLine.trim().startsWith('—') || sanitizedLine.trim().startsWith('*');
    const textToShow = isBullet ? `• ${sanitizedLine.trim().substring(1).trim()}` : sanitizedLine;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(textToShow.replace(/\*\*|__/g, ''), maxLineWidth - (isBullet ? 5 : 0));
    for (const l of lines) {
      checkPageBreak(6);
      doc.text(l, marginX + (isBullet ? 5 : 0), cursorY);
      cursorY += 5.5;
    }
    cursorY += 1.5;
  };

  const parseAndRenderTextPdf = (text) => {
    const blocks = parseMarkdownText(text);
    blocks.forEach(block => {
      if (block.type === 'table' && block.rows) {
        writeTablePdf(block.rows);
      } else {
        writeParagraphPdf(block.text ?? '');
      }
    });
  };

  writeHeader("REI DOCENTE - PLANIFICACIÓN DE CLASE", 18);
  cursorY += 4;
  writeText(`Asignatura: ${planning.subject}  |  Curso: ${planning.grade}`, 10, 'bold', [15, 23, 42]);
  writeText(`Unidad: ${planning.unit}  |  Fecha: ${new Date(planning.created_at).toLocaleDateString('es-CL')}`, 10, 'bold', [15, 23, 42]);
  cursorY += 6;
  writeSectionHeaderPdf("Objetivo de Aprendizaje (OA)", [224, 242, 254], [3, 105, 161]);
  writeText(planning.learning_objective, 10, 'italic');
  cursorY += 4;
  writeSectionHeaderPdf("Evaluación de Nivel Lector", [224, 242, 254], [3, 105, 161]);
  writeText(`Nivel de lectura estimado: ${planning.reading_level?.estimated_level || 'Adecuado'}`);
  writeText(`Alerta pedagógica: ${planning.reading_level?.warning_alert || 'Sin alertas'}`);
  cursorY += 4;
  writeSectionHeaderPdf("1. Diseño Curricular Inverso (Backward Design)", [241, 245, 249], [51, 65, 85]);
  writeText("Objetivo de la sesión:", 10, 'bold', [15, 23, 42]);
  writeText(planning.content.backward_design.objective);
  cursorY += 2;
  writeText("Evidencia de evaluación:", 10, 'bold', [15, 23, 42]);
  writeText(planning.content.backward_design.assessment_evidence);
  cursorY += 2;
  writeText("Secuencia de actividades:", 10, 'bold', [15, 23, 42]);
  parseAndRenderTextPdf(planning.content.backward_design.activities_sequence);
  cursorY += 4;
  writeSectionHeaderPdf("2. Adaptaciones de Accesibilidad", [241, 245, 249], [51, 65, 85]);
  parseAndRenderTextPdf(planning.content.dua_adaptations);
  cursorY += 4;
  writeSectionHeaderPdf("3. Adaptaciones de Aprendizaje", [241, 245, 249], [51, 65, 85]);
  writeSectionHeaderPdf("Adaptación DUA 1 (Universal)", [226, 240, 217], [56, 87, 35]);
  parseAndRenderTextPdf(planning.content.rti_supports.general);
  writeSectionHeaderPdf("Adaptación DUA 2 (Focalizado)", [255, 242, 204], [127, 96, 0]);
  parseAndRenderTextPdf(planning.content.rti_supports.targeted);
  writeSectionHeaderPdf("Adaptación DUA 3 (Intensivo)", [242, 220, 219], [192, 0, 0]);
  cursorY += 4;
  writeSectionHeaderPdf("4. Gamificación", [241, 245, 249], [51, 65, 85]);
  parseAndRenderTextPdf(planning.content.gamification);
  cursorY += 4;
  writeSectionHeaderPdf("5. Técnicas de Anclaje", [241, 245, 249], [51, 65, 85]);
  parseAndRenderTextPdf(planning.content.nlp_technique);
  cursorY += 4;
  writeSectionHeaderPdf("6. Rúbrica de Cierre", [241, 245, 249], [51, 65, 85]);
  parseAndRenderTextPdf(planning.content.rubric);

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(filename, Buffer.from(pdfOutput));
  console.log(`Saved PDF file: ${filename}`);
}

// 3. docx Exporter
async function exportDocx(planning, filename) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "REI DOCENTE - PLANIFICACIÓN DE CLASE",
          bold: true,
          size: 32,
          color: "7C3AED"
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: `Asignatura: ${planning.subject}  |  Curso: ${planning.grade}\nUnidad: ${planning.unit}`,
          bold: true,
          size: 20,
          color: "475569"
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: "Objetivo de Aprendizaje (OA):", bold: true, size: 22, color: "1E293B" })
      ]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: planning.learning_objective, italic: true, size: 20 })
      ]
    }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: "1. Diseño Curricular Inverso (Backward Design):", bold: true, size: 24, color: "7C3AED" })
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Objetivo: ", bold: true, size: 20 }),
        new TextRun({ text: planning.content.backward_design.objective, size: 20 })
      ]
    }),
    new Paragraph({
      spacing: { before: 100 },
      children: [
        new TextRun({ text: "Evidencia: ", bold: true, size: 20 }),
        new TextRun({ text: planning.content.backward_design.assessment_evidence, size: 20 })
      ]
    }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: "Secuencia de Actividades:", bold: true, size: 22 })
      ]
    })
  ];

  // Activities
  const actLines = planning.content.backward_design.activities_sequence.split('\n');
  actLines.forEach(l => {
    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: l.replace(/\*\*|__/g, ''), size: 20 })
      ]
    }));
  });

  // Adaptations
  children.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text: "2. Adaptaciones de Accesibilidad:", bold: true, size: 24, color: "7C3AED" })
    ]
  }));
  planning.content.dua_adaptations.split('\n').forEach(l => {
    children.push(new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: l.replace(/\*\*|__/g, ''), size: 20 })
      ]
    }));
  });

  // RTI
  children.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text: "3. Adaptaciones de Aprendizaje (RTI):", bold: true, size: 24, color: "7C3AED" })
    ]
  }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Nivel 1 (Universal):", bold: true, size: 22 })] }));
  planning.content.rti_supports.general.split('\n').forEach(l => {
    children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: l.replace(/\*\*|__/g, ''), size: 20 })] }));
  });
  
  children.push(new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "Nivel 2 (Focalizado):", bold: true, size: 22 })] }));
  planning.content.rti_supports.targeted.split('\n').forEach(l => {
    children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: l.replace(/\*\*|__/g, ''), size: 20 })] }));
  });

  children.push(new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "Nivel 3 (Intensivo):", bold: true, size: 22 })] }));
  planning.content.rti_supports.intensive.split('\n').forEach(l => {
    children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: l.replace(/\*\*|__/g, ''), size: 20 })] }));
  });

  // Gamification & NLP & Rubric
  children.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text: "4. Gamificación:", bold: true, size: 24, color: "7C3AED" })
    ]
  }));
  children.push(new Paragraph({ children: [new TextRun({ text: planning.content.gamification.replace(/\*\*|__/g, ''), size: 20 })] }));

  children.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text: "5. Técnicas de Anclaje (Apertura, Pausa, Cierre):", bold: true, size: 24, color: "7C3AED" })
    ]
  }));
  children.push(new Paragraph({ children: [new TextRun({ text: planning.content.nlp_technique.replace(/\*\*|__/g, ''), size: 20 })] }));

  children.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({ text: "6. Rúbrica de Cierre:", bold: true, size: 24, color: "7C3AED" })
    ]
  }));
  planning.content.rubric.split('\n').forEach(l => {
    children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: l.replace(/\*\*|__/g, ''), size: 20 })] }));
  });

  const doc = new Document({
    sections: [{ children }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filename, buffer);
  console.log(`Saved WORD file: ${filename}`);
}

async function run() {
  try {
    console.log('[Test] Calling API generate anonymously using http module...');

    const fields = {
      subject: 'Lenguaje y Literatura',
      grade: '2° Medio',
      learningObjective: 'OA 2: Proponer interpretaciones de textos de diversos géneros o épocas, fundamentadas en análisis e hipótesis sobre los sentidos de la obra.',
      unit: 'Unidad 1: Desafíos y búsquedas',
      curriculum_mode: 'true',
      oa_codigo: 'OA 2',
      oa_texto: 'Proponer interpretaciones de textos de diversos géneros o épocas, fundamentadas en análisis e hipótesis sobre los sentidos de la obra.',
      oa_eje: 'Lectura'
    };

    const planningData = await sendPostFormData('http://localhost:3000/api/generate', fields);
    console.log('[Test] Successfully generated planning JSON.');

    // Save JSON output
    fs.writeFileSync(outputJsonPath, JSON.stringify(planningData, null, 2), 'utf8');
    fs.writeFileSync(path.join(evidenceDir, 'Didakta_Planificacion_Nueva_2Medio.json'), JSON.stringify(planningData, null, 2), 'utf8');
    console.log('Saved JSON planning to both brain and evidence folder.');

    // Export PDF
    console.log('[Test] Exporting to PDF...');
    exportPdf(planningData, outputPdfPath);
    exportPdf(planningData, path.join(evidenceDir, 'Didakta_Planificacion_Nueva_2Medio.pdf'));

    // Export DOCX
    console.log('[Test] Exporting to Word (DOCX)...');
    await exportDocx(planningData, outputDocxPath);
    await exportDocx(planningData, path.join(evidenceDir, 'Didakta_Planificacion_Nueva_2Medio.docx'));

    console.log('SUCCESS: All files generated and copied to Desktop folder: ' + evidenceDir);

  } catch (err) {
    console.error('An error occurred during planning generation:', err);
    process.exit(1);
  }
}

run();
