const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const docx = require('docx');
const { jsPDF } = require('jspdf');

// 1. Read local environment variables
function parseEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('No .env.local found at:', envPath);
    return {};
  }
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

const grades = [
  '5° Básico',
  '6° Básico',
  '7° Básico',
  '8° Básico',
  '1° Medio',
  '2° Medio'
];

const outputDir = path.join(__dirname, '..', 'validation_outputs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper: Markdown parser
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

// Helper: detect headers
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

// exportPdf replicates page.tsx exportToPdf
function exportPdf(planning, activeTab, filename) {
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

  if (activeTab === 'complete') {
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
  } else if (activeTab === 'brief') {
    const lirmi = planning.content.lirmi_summary ?? {
      oa_numbers: planning.learning_objective.match(/OA\s*\d+/gi)?.join(', ') || 'No especificados',
      class_objective: 'Objetivo de clase no generado.',
      inicio: 'Inicio no generado.',
      desarrollo: 'Desarrollo no generado.',
      cierre: 'Cierre no generado.'
    };
    writeHeader("DIDAKTA - SESIÓN BREVE (LIRMI)", 18);
    cursorY += 4;
    writeText(`Asignatura: ${planning.subject}  |  Curso: ${planning.grade}`, 10, 'bold', [15, 23, 42]);
    writeText(`Unidad: ${planning.unit}  |  Fecha: ${new Date(planning.created_at).toLocaleDateString('es-CL')}`, 10, 'bold', [15, 23, 42]);
    cursorY += 6;
    writeSectionHeaderPdf("Resumen de Sesión para Lirmi", [224, 242, 254], [3, 105, 161]);
    writeText("OA:", 10, 'bold', [15, 23, 42]);
    writeText(lirmi.oa_numbers);
    cursorY += 2;
    writeText("Objetivo de clase:", 10, 'bold', [15, 23, 42]);
    writeText(lirmi.class_objective);
    cursorY += 2;
    writeText("Inicio:", 10, 'bold', [15, 23, 42]);
    writeText(lirmi.inicio);
    cursorY += 2;
    writeText("Desarrollo:", 10, 'bold', [15, 23, 42]);
    writeText(lirmi.desarrollo);
    cursorY += 2;
    writeText("Cierre:", 10, 'bold', [15, 23, 42]);
    writeText(lirmi.cierre);
  } else if (activeTab === 'utp') {
    const utp = planning.content.utp_documentation ?? {
      dua_adaptations: { representation: '', expression: '', engagement: '' },
      learning_adaptations: { dua_1: '', dua_2: '', dua_3: '' },
      nlp_technique: { opening: '', pause: '', closing: '' },
      rubric_summary: ''
    };
    writeHeader("DIDAKTA - DOCUMENTACIÓN UTP", 18);
    cursorY += 4;
    writeText(`Asignatura: ${planning.subject}  |  Curso: ${planning.grade}`, 10, 'bold', [15, 23, 42]);
    writeText(`Unidad: ${planning.unit}  |  Fecha: ${new Date(planning.created_at).toLocaleDateString('es-CL')}`, 10, 'bold', [15, 23, 42]);
    cursorY += 6;
    writeSectionHeaderPdf("Adaptaciones de Accesibilidad (Decreto 83 / DUA)", [241, 245, 249], [51, 65, 85]);
    writeText("• Representación: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.dua_adaptations.representation);
    cursorY += 2;
    writeText("• Expresión: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.dua_adaptations.expression);
    cursorY += 2;
    writeText("• Compromiso: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.dua_adaptations.engagement);
    cursorY += 4;
    writeSectionHeaderPdf("Adaptaciones de Aprendizaje", [241, 245, 249], [51, 65, 85]);
    writeText("• Adaptación DUA 1: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.learning_adaptations.dua_1);
    cursorY += 2;
    writeText("• Adaptación DUA 2: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.learning_adaptations.dua_2);
    cursorY += 2;
    writeText("• Adaptación DUA 3: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.learning_adaptations.dua_3);
    cursorY += 4;
    writeSectionHeaderPdf("Técnicas de Anclaje", [241, 245, 249], [51, 65, 85]);
    writeText("• Apertura: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.nlp_technique.opening);
    cursorY += 2;
    writeText("• Pausa: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.nlp_technique.pause);
    cursorY += 2;
    writeText("• Cierre: ", 10, 'bold', [15, 23, 42]);
    writeText(utp.nlp_technique.closing);
    cursorY += 4;
    writeSectionHeaderPdf("Rúbrica de Cierre", [241, 245, 249], [51, 65, 85]);
    writeText(utp.rubric_summary);
  }

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(filename, Buffer.from(pdfOutput));
}

// exportWord replicates page.tsx exportToWord
async function exportWord(planning, activeTab, filename) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;

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

  let documentChildren = [];

  if (activeTab === 'complete') {
    documentChildren = [
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
      new Paragraph({ children: [new TextRun({ text: "Objetivo de la sesión:", bold: true })], spacing: { after: 50 } }),
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
    ];
  } else if (activeTab === 'brief') {
    const lirmi = planning.content.lirmi_summary ?? {
      oa_numbers: planning.learning_objective.match(/OA\s*\d+/gi)?.join(', ') || 'No especificados',
      class_objective: 'Objetivo de clase no generado.',
      inicio: 'Inicio no generado.',
      desarrollo: 'Desarrollo no generado.',
      cierre: 'Cierre no generado.'
    };
    documentChildren = [
      new Paragraph({ text: "DIDAKTA - SESIÓN BREVE (LIRMI)", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
      createSectionHeaderWord("Resumen de Sesión para Lirmi", "E0F2FE", "0369A1"),
      new Paragraph({ text: "", spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: "OA: ", bold: true }), new TextRun({ text: lirmi.oa_numbers })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: "Objetivo de clase: ", bold: true }), new TextRun({ text: lirmi.class_objective })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: "Inicio: ", bold: true }), new TextRun({ text: lirmi.inicio })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: "Desarrollo: ", bold: true }), new TextRun({ text: lirmi.desarrollo })], spacing: { after: 100 } }),
      new Paragraph({ children: [new TextRun({ text: "Cierre: ", bold: true }), new TextRun({ text: lirmi.cierre })], spacing: { after: 100 } })
    ];
  } else if (activeTab === 'utp') {
    const utp = planning.content.utp_documentation ?? {
      dua_adaptations: { representation: '', expression: '', engagement: '' },
      learning_adaptations: { dua_1: '', dua_2: '', dua_3: '' },
      nlp_technique: { opening: '', pause: '', closing: '' },
      rubric_summary: ''
    };
    documentChildren = [
      new Paragraph({ text: "DIDAKTA - DOCUMENTACIÓN UTP", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
      createSectionHeaderWord("Adaptaciones de Accesibilidad (Decreto 83 / DUA)", "F1F5F9", "334155"),
      new Paragraph({ text: "", spacing: { after: 50 } }),
      new Paragraph({ children: [new TextRun({ text: "• Representación: ", bold: true }), new TextRun({ text: utp.dua_adaptations.representation })] }),
      new Paragraph({ children: [new TextRun({ text: "• Expresión: ", bold: true }), new TextRun({ text: utp.dua_adaptations.expression })] }),
      new Paragraph({ children: [new TextRun({ text: "• Compromiso: ", bold: true }), new TextRun({ text: utp.dua_adaptations.engagement })], spacing: { after: 150 } }),
      createSectionHeaderWord("Adaptaciones de Aprendizaje", "F1F5F9", "334155"),
      new Paragraph({ text: "", spacing: { after: 50 } }),
      new Paragraph({ children: [new TextRun({ text: "• Adaptación DUA 1: ", bold: true }), new TextRun({ text: utp.learning_adaptations.dua_1 })] }),
      new Paragraph({ children: [new TextRun({ text: "• Adaptación DUA 2: ", bold: true }), new TextRun({ text: utp.learning_adaptations.dua_2 })] }),
      new Paragraph({ children: [new TextRun({ text: "• Adaptación DUA 3: ", bold: true }), new TextRun({ text: utp.learning_adaptations.dua_3 })], spacing: { after: 150 } }),
      createSectionHeaderWord("Técnicas de Anclaje", "F1F5F9", "334155"),
      new Paragraph({ text: "", spacing: { after: 50 } }),
      new Paragraph({ children: [new TextRun({ text: "• Apertura: ", bold: true }), new TextRun({ text: utp.nlp_technique.opening })] }),
      new Paragraph({ children: [new TextRun({ text: "• Pausa: ", bold: true }), new TextRun({ text: utp.nlp_technique.pause })] }),
      new Paragraph({ children: [new TextRun({ text: "• Cierre: ", bold: true }), new TextRun({ text: utp.nlp_technique.closing })], spacing: { after: 150 } }),
      createSectionHeaderWord("Rúbrica de Cierre", "F1F5F9", "334155"),
      new Paragraph({ text: "", spacing: { after: 50 } }),
      new Paragraph({ children: [new TextRun({ text: utp.rubric_summary })] })
    ];
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: documentChildren
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filename, buffer);
}

// 2. Main Validation Loop
async function validateAll() {
  console.log('=== STARTING AUTOMATED VALIDATION PIPELINE ===');
  console.log(`Outputs will be saved in: ${outputDir}\n`);

  const results = [];

  for (const grade of grades) {
    console.log(`\n--------------------------------------------------`);
    console.log(`[GRADE: ${grade}]`);
    console.log(`--------------------------------------------------`);

    // A. Query database for official OA
    console.log(`[${grade}] Fetching official OA...`);
    const { data: oa, error: oaError } = await supabase
      .from('curriculum_oa')
      .select('*')
      .eq('nivel', grade)
      .or('asignatura.ilike.%lenguaje%,asignatura.ilike.%lengua%')
      .limit(1)
      .maybeSingle();

    if (oaError || !oa) {
      console.error(`[${grade}] ERROR: Failed to fetch official OA!`, oaError?.message);
      results.push({ grade, status: 'FAILED', reason: 'No OA found in DB' });
      continue;
    }
    console.log(`[${grade}] Found OA: ${oa.codigo_oa} - ${oa.texto_oa.substring(0, 60)}...`);

    // B. Call /api/generate
    console.log(`[${grade}] Calling /api/generate...`);
    const formData = new URLSearchParams();
    formData.append('subject', oa.asignatura);
    formData.append('grade', grade);
    formData.append('unit', 'Unidad de Prueba');
    formData.append('curriculum_mode', 'true');
    formData.append('oa_codigo', oa.codigo_oa);
    formData.append('oa_texto', oa.texto_oa);
    formData.append('oa_eje', oa.eje);
    formData.append('indicadores_json', JSON.stringify([oa.indicadores?.split('\n')[0] || '']));
    formData.append('learningObjective', `${oa.codigo_oa} — ${oa.texto_oa}`);
    formData.append('planning_scope', 'clase');
    formData.append('duracion_bloque_min', '90');

    let planningContent = null;
    try {
      const res = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      planningContent = await res.json();
    } catch (err) {
      console.error(`[${grade}] ERROR calling /api/generate:`, err.message);
      results.push({ grade, status: 'FAILED', reason: `Generate API failed: ${err.message}` });
      continue;
    }

    console.log(`[${grade}] /api/generate succeeded!`);

    // C. Validate internal rules (Apoyos por Nivel, MCQs, balance)
    let ruleValidation = { passed: true, issues: [] };
    const rti = planningContent.rti_supports || {};
    const guides = [
      { name: 'general (Nivel 1)', text: rti.general },
      { name: 'targeted (Nivel 2)', text: rti.targeted },
      { name: 'intensive (Nivel 3)', text: rti.intensive }
    ];

    console.log(`[${grade}] Validating MCQ rules (extension and correct keys)...`);
    
    // Simple helper to parse MCQ alternatives and their lengths
    guides.forEach(g => {
      if (!g.text) {
        ruleValidation.passed = false;
        ruleValidation.issues.push(`Falta guía ${g.name}`);
        return;
      }

      // Find alternatives on each line
      const lines = g.text.split('\n');
      let currentQuestion = null;
      let options = [];

      lines.forEach((line, lIdx) => {
        // Simple regex to find option line, e.g. A) ... or B) ...
        const match = line.match(/^\s*([A-D])\)\s*(.+)$/i) || line.match(/<br>([A-D])\)\s*(.+)$/i);
        if (match) {
          const letter = match[1].toUpperCase();
          const optionText = match[2].trim();
          options.push({ letter, text: optionText, length: optionText.length });
        }

        // If line contains key/clave (e.g. Clave: A or row end)
        const isKeyLine = line.match(/^([A-D])\s*$/) || line.includes('| A |') || line.includes('| B |') || line.includes('| C |') || line.includes('| D |');
        
        // When we have options and we hit a new question or key
        if (options.length === 4 || (options.length > 0 && isKeyLine)) {
          // Validate character length differences
          const lengths = options.map(o => o.length);
          const maxL = Math.max(...lengths);
          const minL = Math.min(...lengths);
          const diff = maxL - minL;

          if (diff > 10) {
            ruleValidation.issues.push(`Guía ${g.name}: Pregunta con diferencia de extensión de ${diff} caracteres (${lengths.join(', ')})`);
          }
          options = [];
        }
      });
    });

    if (ruleValidation.issues.length > 0) {
      console.log(`[${grade}] MCQ Rule Warnings:`, ruleValidation.issues);
    } else {
      console.log(`[${grade}] MCQ Rules validation PASSED successfully!`);
    }

    // D. Call /api/planner/summarize
    console.log(`[${grade}] Calling /api/planner/summarize...`);
    let summaryContent = null;
    try {
      const res = await fetch('http://localhost:3000/api/planner/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planningId: '00000000-0000-0000-0000-000000000000', // Mock UUID to skip DB writing
          currentContent: planningContent
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      summaryContent = await res.json();
    } catch (err) {
      console.error(`[${grade}] ERROR calling /api/planner/summarize:`, err.message);
      results.push({ grade, status: 'FAILED', reason: `Summarize API failed: ${err.message}` });
      continue;
    }

    console.log(`[${grade}] /api/planner/summarize succeeded!`);

    // E. Assemble complete planning object
    const planning = {
      subject: oa.asignatura,
      grade: grade,
      unit: 'Unidad de Prueba',
      created_at: new Date().toISOString(),
      learning_objective: `${oa.codigo_oa} — ${oa.texto_oa}`,
      reading_level: {
        estimated_level: planningContent.reading_level_eval?.estimated_level || 'No evaluado',
        warning_alert: planningContent.reading_level_eval?.warning_alert || 'Sin alertas'
      },
      content: {
        ...planningContent,
        lirmi_summary: summaryContent.lirmi_summary,
        utp_documentation: summaryContent.utp_documentation
      }
    };

    // F. Export to PDF and Word for all 3 views
    console.log(`[${grade}] Exporting documents to PDF and Word for all 3 views...`);
    const gradeSafe = grade.replace(/\s+/g, '_').replace(/°/g, '');

    try {
      // 1. Complete view
      const completePdfPath = path.join(outputDir, `Didakta_${gradeSafe}_Completa.pdf`);
      const completeWordPath = path.join(outputDir, `Didakta_${gradeSafe}_Completa.docx`);
      exportPdf(planning, 'complete', completePdfPath);
      await exportWord(planning, 'complete', completeWordPath);

      // 2. Brief view
      const briefPdfPath = path.join(outputDir, `Didakta_${gradeSafe}_Breve.pdf`);
      const briefWordPath = path.join(outputDir, `Didakta_${gradeSafe}_Breve.docx`);
      exportPdf(planning, 'brief', briefPdfPath);
      await exportWord(planning, 'brief', briefWordPath);

      // 3. UTP view
      const utpPdfPath = path.join(outputDir, `Didakta_${gradeSafe}_UTP.pdf`);
      const utpWordPath = path.join(outputDir, `Didakta_${gradeSafe}_UTP.docx`);
      exportPdf(planning, 'utp', utpPdfPath);
      await exportWord(planning, 'utp', utpWordPath);

      console.log(`[${grade}] Successfully exported all 6 files to validation_outputs/`);
      results.push({
        grade,
        status: 'SUCCESS',
        mcqIssues: ruleValidation.issues.length,
        files: [
          `Didakta_${gradeSafe}_Completa.pdf`,
          `Didakta_${gradeSafe}_Completa.docx`,
          `Didakta_${gradeSafe}_Breve.pdf`,
          `Didakta_${gradeSafe}_Breve.docx`,
          `Didakta_${gradeSafe}_UTP.pdf`,
          `Didakta_${gradeSafe}_UTP.docx`
        ]
      });
    } catch (exportErr) {
      console.error(`[${grade}] ERROR exporting documents:`, exportErr.message);
      results.push({ grade, status: 'FAILED', reason: `Export failed: ${exportErr.message}` });
    }
  }

  console.log('\n==================================================');
  console.log('=== VALIDATION SUMMARY ===');
  console.log('==================================================');
  console.table(results);
}

validateAll().catch(console.error);
