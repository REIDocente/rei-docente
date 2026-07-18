const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const docx = require('docx');
const { jsPDF } = require('jspdf');

function parseEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const envContent = fs.readFileSync(envPath, 'utf8');
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

async function run() {
  console.log('[Test] Querying official OA for 6° Básico...');
  const { data: oa } = await supabase
    .from('curriculum_oa')
    .select('*')
    .eq('nivel', '6° Básico')
    .eq('asignatura', 'Lenguaje y Comunicación')
    .limit(1)
    .maybeSingle();

  if (!oa) {
    console.error('[Test] No official OA found in DB for 6° Básico!');
    process.exit(1);
  }
  console.log(`[Test] Found OA: ${oa.codigo_oa}`);

  const formData = new FormData();
  formData.append('subject', 'Lenguaje y Comunicación');
  formData.append('grade', '6° Básico');
  formData.append('unit', 'Unidad de Prueba');
  formData.append('curriculum_mode', 'true');
  formData.append('oa_codigo', oa.codigo_oa);
  formData.append('oa_texto', oa.texto_oa);
  formData.append('oa_eje', oa.eje);
  formData.append('indicadores_json', JSON.stringify([oa.indicadores?.split('\n')[0] || '']));
  formData.append('learningObjective', `${oa.codigo_oa} — ${oa.texto_oa}`);
  formData.append('planning_scope', 'clase');
  formData.append('duracion_bloque_min', '90');

  console.log('\n[Test] Sending POST /api/generate...');
  const generateRes = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    body: formData
  });

  console.log('[Test] /api/generate Status:', generateRes.status);
  const responseText = await generateRes.text();
  let planningContent = null;
  try {
    planningContent = JSON.parse(responseText);
  } catch (parseErr) {
    console.error('[Test] Generate JSON parsing error:', parseErr.message);
    console.error('[Test] Raw Response Content:', responseText);
    process.exit(1);
  }

  if (planningContent.error) {
    console.error('[Test] API generate error:', planningContent.error);
    process.exit(1);
  }

  // Delete reading_level_eval key from planningContent if it is there
  const readingLevel = planningContent.reading_level_eval || {
    estimated_level: '6° Básico (adecuado)',
    warning_alert: 'Sin alertas'
  };
  delete planningContent.reading_level_eval;

  console.log('\n[Test] Sending POST /api/planner/summarize...');
  const summarizeRes = await fetch('http://localhost:3000/api/planner/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      planningId: '00000000-0000-0000-0000-000000000000',
      currentContent: planningContent
    })
  });

  console.log('[Test] /api/planner/summarize Status:', summarizeRes.status);
  const summarizedData = await summarizeRes.json();

  const planning = {
    subject: 'Lenguaje y Comunicación',
    grade: '6° Básico',
    unit: 'Unidad de Prueba',
    created_at: new Date().toISOString(),
    learning_objective: `${oa.codigo_oa} — ${oa.texto_oa}`,
    reading_level: readingLevel,
    content: {
      ...planningContent,
      lirmi_summary: summarizedData.lirmi_summary,
      utp_documentation: summarizedData.utp_documentation
    }
  };

  // Write files
  const artifactDir = 'C:/Users/56940/.gemini/antigravity/brain/f241f1d5-1366-49fe-b98c-b98ca0270324';
  
  console.log('\n--- EXTRACTED QUESTIONS & KEYS FROM NEW PLAN ---');
  console.log('General (Nivel 1):');
  console.log(planning.content.rti_supports.general);
  console.log('Targeted (Nivel 2):');
  console.log(planning.content.rti_supports.targeted);
  console.log('Intensive (Nivel 3):');
  console.log(planning.content.rti_supports.intensive);
  console.log('------------------------------------------------');

  // Save the full planning to a local JSON for reference
  fs.writeFileSync(path.join(artifactDir, 'Didakta_Planificacion_Nueva_6Basico.json'), JSON.stringify(planning, null, 2));

  // Programmatically export complete view Word and PDF
  await exportWord(planning, path.join(artifactDir, 'Didakta_Planificacion_Nueva_6Basico.docx'));
  exportPdf(planning, path.join(artifactDir, 'Didakta_Planificacion_Nueva_6Basico.pdf'));
  
  console.log('\nAll new files generated successfully in', artifactDir);
}

// Markdown parser
function parseMarkdownText(text) {
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

async function exportWord(planning, filename) {
  const { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, Packer } = docx;

  const createSectionHeaderWord = (title, bgColor = "F1F5F9", textColor = "1E293B") => {
    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      borders: {
        top: { style: docx.BorderStyle.NONE },
        bottom: { style: docx.BorderStyle.NONE },
        left: { style: docx.BorderStyle.NONE },
        right: { style: docx.BorderStyle.NONE },
        insideHorizontal: { style: docx.BorderStyle.NONE },
        insideVertical: { style: docx.BorderStyle.NONE }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 9360, type: WidthType.DXA },
              shading: { fill: bgColor },
              margins: { top: 120, bottom: 120, left: 180, right: 180 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: title, bold: true, color: textColor, size: 22 })],
                  spacing: { before: 40, after: 40 }
                })
              ]
            })
          ]
        })
      ]
    });
  };

  const renderWordTable = (rows) => {
    const numCols = rows[0].length;
    let colWidths = Array(numCols).fill(Math.floor(9360 / numCols));
    if (numCols === 3) colWidths = [1872, 6552, 936];
    else if (numCols === 2) colWidths = [2808, 6552];

    return new Table({
      width: { size: 9360, type: WidthType.DXA },
      borders: {
        top: { style: docx.BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        bottom: { style: docx.BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        left: { style: docx.BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        right: { style: docx.BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        insideVertical: { style: docx.BorderStyle.SINGLE, size: 4, color: "CBD5E1" }
      },
      rows: rows.map((row, rowIndex) => {
        return new TableRow({
          children: row.map((cellText, colIdx) => {
            return new TableCell({
              width: { size: colWidths[colIdx] ?? Math.floor(9360 / numCols), type: WidthType.DXA },
              shading: rowIndex === 0 ? { fill: "F1F5F9" } : undefined,
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cellText.replace(/\*\*|__/g, ''), bold: rowIndex === 0 || cellText.startsWith('**'), size: 19 })],
                  spacing: { before: 40, after: 40 }
                })
              ]
            });
          })
        });
      })
    });
  };

  const renderParagraphInWord = (line) => {
    const cleanLine = line.replace(/\*\*|__/g, '').trim();
    if (cleanLine === '') return new Paragraph({ spacing: { after: 50 } });
    const headerInfo = detectHeader(line);
    if (headerInfo.isHeader) {
      let bgColor = "F1F5F9";
      let textColor = "334155";
      if (headerInfo.type === 'session') {
        bgColor = "E0F2FE";
        textColor = "0369A1";
      } else if (headerInfo.type === 'nivel1') {
        bgColor = "E2F0D9";
        textColor = "385723";
      } else if (headerInfo.type === 'nivel2') {
        bgColor = "FFF2CC";
        textColor = "7F6000";
      } else if (headerInfo.type === 'nivel3') {
        bgColor = "F2DCDB";
        textColor = "C00000";
      }
      return createSectionHeaderWord(cleanLine, bgColor, textColor);
    }
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('—') || line.trim().startsWith('*');
    const textToShow = isBullet ? line.trim().substring(1).trim() : line;
    return new Paragraph({
      bullet: isBullet ? { level: 0 } : undefined,
      children: [
        new TextRun({ text: textToShow.replace(/\*\*|__/g, ''), bold: line.startsWith('**') && line.endsWith('**'), size: 20 })
      ],
      spacing: { after: 60 }
    });
  };

  const parseAndRenderTextWord = (text) => {
    const blocks = parseMarkdownText(text);
    const rendered = [];
    blocks.forEach(block => {
      if (block.type === 'table' && block.rows) {
        rendered.push(renderWordTable(block.rows));
        rendered.push(new Paragraph({ spacing: { before: 100 } }));
      } else {
        rendered.push(renderParagraphInWord(block.text ?? ''));
      }
    });
    return rendered;
  };

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "DIDAKTA - PLANIFICACIÓN DE CLASE", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: docx.BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            bottom: { style: docx.BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            left: { style: docx.BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            right: { style: docx.BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            insideVertical: { style: docx.BorderStyle.SINGLE, size: 4, color: "E2E8F0" }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Asignatura: ", bold: true }), new TextRun({ text: planning.subject })] }),
                    new Paragraph({ children: [new TextRun({ text: "Curso/Nivel: ", bold: true }), new TextRun({ text: planning.grade })] })
                  ]
                }),
                new TableCell({
                  width: { size: 4680, type: WidthType.DXA },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Unidad: ", bold: true }), new TextRun({ text: planning.unit })] }),
                    new Paragraph({ children: [new TextRun({ text: "Fecha: ", bold: true }), new TextRun({ text: new Date(planning.created_at).toLocaleDateString('es-CL') })] })
                  ]
                })
              ]
            })
          ]
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),
        createSectionHeaderWord("Objetivo de Aprendizaje (OA)", "E0F2FE", "0369A1"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        new Paragraph({ children: [new TextRun({ text: planning.learning_objective, italics: true })] }),
        new Paragraph({ text: "", spacing: { after: 150 } }),
        createSectionHeaderWord("Evaluación del Nivel Lector", "E0F2FE", "0369A1"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        new Paragraph({ children: [new TextRun({ text: "Nivel lector estimado: ", bold: true }), new TextRun({ text: planning.reading_level.estimated_level })] }),
        new Paragraph({ children: [new TextRun({ text: "Alerta pedagógica: ", bold: true }), new TextRun({ text: planning.reading_level.warning_alert })] }),
        new Paragraph({ text: "", spacing: { after: 150 } }),
        createSectionHeaderWord("1. Diseño Curricular Inverso (Backward Design)", "F1F5F9", "334155"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        new Paragraph({ children: [new TextRun({ text: "Objetivo de la sesión:", bold: true })] }),
        new Paragraph({ text: planning.content.backward_design.objective }),
        new Paragraph({ children: [new TextRun({ text: "Evidencia de evaluación:", bold: true })], spacing: { before: 100, after: 50 } }),
        new Paragraph({ text: planning.content.backward_design.assessment_evidence }),
        new Paragraph({ children: [new TextRun({ text: "Secuencia de actividades:", bold: true })], spacing: { before: 100, after: 50 } }),
        ...parseAndRenderTextWord(planning.content.backward_design.activities_sequence),
        new Paragraph({ text: "", spacing: { after: 150 } }),
        createSectionHeaderWord("2. Adaptaciones de Accesibilidad", "F1F5F9", "334155"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        ...parseAndRenderTextWord(planning.content.dua_adaptations),
        new Paragraph({ text: "", spacing: { after: 150 } }),
        createSectionHeaderWord("3. Adaptaciones de Aprendizaje", "F1F5F9", "334155"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        createSectionHeaderWord("Adaptación DUA 1", "E2F0D9", "385723"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        ...parseAndRenderTextWord(planning.content.rti_supports.general),
        new Paragraph({ text: "", spacing: { after: 100 } }),
        createSectionHeaderWord("Adaptación DUA 2", "FFF2CC", "7F6000"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        ...parseAndRenderTextWord(planning.content.rti_supports.targeted),
        new Paragraph({ text: "", spacing: { after: 100 } }),
        createSectionHeaderWord("Adaptación DUA 3", "F2DCDB", "C00000"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        ...parseAndRenderTextWord(planning.content.rti_supports.intensive),
        new Paragraph({ text: "", spacing: { after: 150 } }),
        createSectionHeaderWord("4. Gamificación", "F1F5F9", "334155"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        ...parseAndRenderTextWord(planning.content.gamification),
        new Paragraph({ text: "", spacing: { after: 150 } }),
        createSectionHeaderWord("5. Técnicas de Anclaje", "F1F5F9", "334155"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        ...parseAndRenderTextWord(planning.content.nlp_technique),
        new Paragraph({ text: "", spacing: { after: 150 } }),
        createSectionHeaderWord("6. Rúbrica de Cierre", "F1F5F9", "334155"),
        new Paragraph({ text: "", spacing: { after: 50 } }),
        ...parseAndRenderTextWord(planning.content.rubric)
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filename, buffer);
  console.log(`Saved Word file: ${filename}`);
}

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

  writeHeader("DIDAKTA - PLANIFICACIÓN DE CLASE", 18);
  cursorY += 4;
  writeText(`Asignatura: ${planning.subject}  |  Curso: ${planning.grade}`, 10, 'bold', [15, 23, 42]);
  writeText(`Unidad: ${planning.unit}  |  Fecha: ${new Date(planning.created_at).toLocaleDateString('es-CL')}`, 10, 'bold', [15, 23, 42]);
  cursorY += 6;
  writeSectionHeaderPdf("Objetivo de Aprendizaje (OA)", [224, 242, 254], [3, 105, 161]);
  writeText(planning.learning_objective, 10, 'italic');
  cursorY += 4;
  writeSectionHeaderPdf("Evaluación de Nivel Lector", [224, 242, 254], [3, 105, 161]);
  writeText(`Nivel de lectura estimado: ${planning.reading_level.estimated_level}`);
  writeText(`Alerta pedagógica: ${planning.reading_level.warning_alert}`);
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
  writeSectionHeaderPdf("Adaptación DUA 1", [226, 240, 217], [56, 87, 35]);
  parseAndRenderTextPdf(planning.content.rti_supports.general);
  writeSectionHeaderPdf("Adaptación DUA 2", [255, 242, 204], [127, 96, 0]);
  parseAndRenderTextPdf(planning.content.rti_supports.targeted);
  writeSectionHeaderPdf("Adaptación DUA 3", [242, 220, 219], [192, 0, 0]);
  parseAndRenderTextPdf(planning.content.rti_supports.intensive);
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

run().catch(console.error);
