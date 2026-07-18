const fs = require('fs');
const path = require('path');
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

// Helper helper functions for instrument rendering (equivalent to frontend)
function getInstrumentHeaders(tipo) {
  if (tipo === 'lista_cotejo') {
    return ['Criterio / Dimensión / Indicador', 'Logrado (Sí)', 'No Logrado (No)'];
  } else if (tipo === 'escala_apreciacion') {
    return ['Criterio / Dimensión', 'Destacado', 'Logrado', 'En Desarrollo', 'No Logrado'];
  } else if (tipo === 'rubrica_holistica') {
    return ['Nivel / Logro', 'Descripción del Desempeño Global'];
  } else {
    return ['Criterio / Dimensión', 'Excelente (3 ptos)', 'Bueno (2 ptos)', 'Suficiente (1 pto)', 'Insuficiente (0 ptos)'];
  }
}

async function run() {
  console.log('[Test] Triggering real Claude generation for Borges evaluation...');

  const requestBody = {
    nivel: '2° Medio',
    eje: 'Lectura',
    oa_codes: ['OA 8'],
    oa_textos: {
      'OA 8': 'Formular una interpretación de los textos leídos, que sea coherente con su análisis, considerando su relación con otros textos, sus contextos de producción y de recepción.'
    },
    tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
    tipo_evaluacion: 'simce',
    tipo_preguntas: 'mixto',
    n_preguntas_multiple: 25,
    n_preguntas_desarrollo: 5,
    n_preguntas: 30,
    dificultad: 'mixto',
    instrumento: 'rubrica_analitica',
    titulo: 'Ensayo SIMCE de Comprensión Lectora: 2° Medio',
    tema: 'Dos lecturas completas: Texto 1 argumentativo sobre la importancia de la lectura en la era digital y Texto 2 expositivo sobre el contexto histórico. Generar exactamente 25 preguntas de alternativas balanceadas y 5 de desarrollo.'
  };

  console.log('[Test] Requesting API POST /api/evaluaciones...');
  const res = await fetch('http://localhost:3000/api/evaluaciones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-access-token'
    },
    body: JSON.stringify(requestBody)
  });

  console.log('[Test] Response status:', res.status);
  const textRes = await res.text();
  let record;
  try {
    record = JSON.parse(textRes);
  } catch (err) {
    console.error('[Test] JSON Parse Error:', err.message);
    console.error('[Test] Raw Output:', textRes);
    process.exit(1);
  }

  if (record.error) {
    console.error('[Test] Generation Error in response:', record.error);
    process.exit(1);
  }

  const cj = record.contenido_json;
  console.log('[Test] Successfully generated evaluation.');
  console.log('[Test] Title:', record.titulo);
  fs.writeFileSync(path.join(__dirname, 'last_borges_response.json'), JSON.stringify(record, null, 2));
  
  // Alternative lengths validation check
  console.log('\n--- BACKEND COMPLIANCE CHECK (ALTERNATIVE LENGTHS WITHOUT SPACES) ---');
  let totalComply = true;
  const questionsList = cj.prueba?.secciones?.[0]?.preguntas || cj.preguntas || [];
  questionsList.forEach((q, idx) => {
    const alts = q.alternativas || [];
    const lengths = alts.map(a => (a.texto || '').replace(/\s+/g, '').length);
    const minL = Math.min(...lengths);
    const maxL = Math.max(...lengths);
    const diff = maxL - minL;
    const comply = diff <= 12;
    if (!comply) totalComply = false;
    console.log(`Pregunta ${q.numero || (idx + 1)}: alternativas de ${lengths.join(', ')} letras -> diferencia de ${diff} (${comply ? 'CUMPLE' : 'INCUMPLE'})`);
    alts.forEach(a => {
      console.log(`   ${a.letra}) [${a.texto.replace(/\s+/g, '').length} chars]: ${a.texto}`);
    });
  });
  console.log(`Compliance summary: ${totalComply ? 'SUCCESS (All questions comply)' : 'FAILED (Some questions exceed 12 letters diff)'}`);
  console.log('--------------------------------------------------------------------\n');

  // Export Student PDF
  console.log('[Test] Generating Student PDF...');
  await exportPdf(record, 'student', path.join(__dirname, 'evaluacion_real_borges_estudiante.pdf'));
  
  // Export Teacher PDF
  console.log('[Test] Generating Teacher PDF (con Solucionario)...');
  await exportPdf(record, 'teacher', path.join(__dirname, 'evaluacion_real_borges_docente.pdf'));

  console.log('\nDone! PDFs generated successfully:');
  console.log('Student PDF:', path.join(__dirname, 'evaluacion_real_borges_estudiante.pdf'));
  console.log('Teacher PDF:', path.join(__dirname, 'evaluacion_real_borges_docente.pdf'));
}

async function exportPdf(record, mode, outputPath) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const cj = record.contenido_json;
  const margin = 20;
  const usable = 170;
  let y = margin;

  const fillBackground = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');
  };
  fillBackground();

  const addText = (text, size = 10, bold = false, color = '#1e293b') => {
    doc.setFontSize(size);
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      doc.setTextColor(r, g, b);
    } else {
      doc.setTextColor(30, 41, 59);
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text ?? '', usable);
    lines.forEach((line) => {
      if (y > 272) {
        doc.addPage();
        fillBackground();
        y = margin;
      }
      doc.text(line, margin, y);
      y += size * 0.45;
    });
    y += 2;
  };

  const addLine = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, 210 - margin, y);
    y += 4;
  };

  const addSection = (label) => {
    y += 4;
    addText(label, 12, true, '#be123c');
    addLine();
  };

  const getTextoAsociado = (q, idx, total) => {
    const txt = String(q.texto_asociado || q.texto || '').toLowerCase();
    if (txt.includes('texto_1') || txt.includes('texto 1') || txt.includes('1')) return 'texto_1';
    if (txt.includes('texto_2') || txt.includes('texto 2') || txt.includes('2')) return 'texto_2';
    if (txt.includes('ambos') || txt.includes('integra') || txt.includes('ambas')) return 'ambos';
    
    const enunc = String(q.enunciado || '').toLowerCase();
    if (enunc.includes('texto 1') || enunc.includes('primer texto')) return 'texto_1';
    if (enunc.includes('texto 2') || enunc.includes('segundo texto')) return 'texto_2';
    if (enunc.includes('ambos textos') || enunc.includes('ambas lecturas')) return 'ambos';
    
    if (idx < total * 0.45) return 'texto_1';
    if (idx < total * 0.9) return 'texto_2';
    return 'ambos';
  };

  const drawSingleText = (txt, index) => {
    if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
    y += 2;
    const cleanTxtTitle = (txt.titulo || '').replace(/^Texto\s*\d+\s*:\s*/i, '').trim() || 'Sin Título';
    addText(`Texto ${index + 1}: ${cleanTxtTitle} — Tipo: ${txt.tipo || 'Lectura'} — Fuente: Texto adaptado con fines pedagógicos.`, 10, true, '#be123c');
    y += 2;

    const paragraphs = (txt.contenido || '').split('\n');
    paragraphs.forEach((p) => {
      const trimmed = p.trim();
      if (trimmed) {
        addText(trimmed, 9, false, '#334155');
        y += 1.5;
      }
    });
    y += 4;
  };

  const drawQuestionsGroup = (qGroup, groupTitle) => {
    if (qGroup.length === 0) return;
    if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
    addSection(groupTitle);

    const mcQ = qGroup.filter((p) => p.tipo === 'seleccion_multiple' || (p.alternativas && p.alternativas.length > 0));
    const devQ = qGroup.filter((p) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo' || !(p.alternativas && p.alternativas.length > 0));

    if (mcQ.length > 0) {
      const colWidth = 80;
      const gap = 10;
      let colY = [y, y];
      let currentCol = 0;
      const yLimit = 265;

      const printTextInCol = (text, size = 9, bold = false, color = '#1e293b', isTestOnly = false) => {
        doc.setFontSize(size);
        if (color.startsWith('#')) {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          if (!isTestOnly) doc.setTextColor(r, g, b);
        } else {
          if (!isTestOnly) doc.setTextColor(30, 41, 59);
        }
        if (!isTestOnly) doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text ?? '', colWidth);
        let localY = 0;
        lines.forEach(() => {
          localY += size * 0.45;
        });
        return localY + 1.2;
      };

      const getQuestionHeight = (p) => {
        let h = 0;
        if (p.texto_base) {
          h += printTextInCol(p.texto_base, 8, false, '#475569', true);
        }
        h += printTextInCol(`${p.numero_original || p.numero}. ${p.enunciado}`, 9.5, true, '#1e293b', true);
        (p.alternativas ?? []).forEach((alt) => {
          const isCorrect = mode === 'teacher' && alt.correcta;
          const optText = `   ${alt.letra}) ${alt.texto}${isCorrect ? ' (✓ CORRECTA)' : ''}`;
          h += printTextInCol(optText, 8.5, isCorrect, isCorrect ? '#16a34a' : '#475569', true);
        });
        h += 2;
        return h;
      };

      const drawQuestionInCol = (p, colX, colIndex) => {
        if (p.texto_base) {
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(p.texto_base, colWidth);
          lines.forEach((line) => {
            doc.text(line, colX, colY[colIndex]);
            colY[colIndex] += 8 * 0.45;
          });
          colY[colIndex] += 1.2;
        }

        // Enunciado
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        const linesEnunc = doc.splitTextToSize(`${p.numero_original || p.numero}. ${p.enunciado}`, colWidth);
        linesEnunc.forEach((line) => {
          doc.text(line, colX, colY[colIndex]);
          colY[colIndex] += 9.5 * 0.45;
        });
        colY[colIndex] += 1.2;

        // Alternativas
        (p.alternativas ?? []).forEach((alt) => {
          const isCorrect = mode === 'teacher' && alt.correcta;
          doc.setFontSize(8.5);
          if (isCorrect) {
            doc.setTextColor(22, 163, 74); // green-600
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setTextColor(71, 85, 105); // slate-600
            doc.setFont('helvetica', 'normal');
          }
          const optText = `   ${alt.letra}) ${alt.texto}${isCorrect ? ' (✓ CORRECTA)' : ''}`;
          const linesAlt = doc.splitTextToSize(optText, colWidth);
          linesAlt.forEach((line) => {
            doc.text(line, colX, colY[colIndex]);
            colY[colIndex] += 8.5 * 0.45;
          });
          colY[colIndex] += 1.2;
        });
        colY[colIndex] += 2;
      };

      mcQ.forEach((p) => {
        const qHeight = getQuestionHeight(p);
        if (colY[currentCol] + qHeight > yLimit) {
          if (currentCol === 0) {
            const isLeftColumnEmpty = (colY[0] === y || colY[0] === margin);
            if (isLeftColumnEmpty && y > margin) {
              doc.addPage();
              fillBackground();
              colY = [margin, margin];
              currentCol = 0;
            } else {
              currentCol = 1;
            }
          } else {
            doc.addPage();
            fillBackground();
            colY = [margin, margin];
            currentCol = 0;
          }
        }
        const colX = margin + currentCol * (colWidth + gap);
        drawQuestionInCol(p, colX, currentCol);
      });

      y = Math.max(colY[0], colY[1]) + 4;
    }

    if (devQ.length > 0) {
      if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
      devQ.forEach((p) => {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        addText(`${p.numero_original || p.numero}. ${p.enunciado}`, 9.5, true, '#1e293b');
        y += 2;

        // Draw writing lines
        doc.setDrawColor(203, 213, 225);
        doc.line(margin + 5, y, 210 - margin, y); y += 6;
        doc.line(margin + 5, y, 210 - margin, y); y += 6;
        doc.line(margin + 5, y, 210 - margin, y); y += 4;
        
        if (p.criterios_correccion?.length) {
          addText('   Criterios de evaluación:', 8.5, true, '#64748b');
          p.criterios_correccion.forEach((cr) => addText(`   • ${cr}`, 8.5, false, '#64748b'));
        }
      });
    }
  };

  const drawHeaderCell = (x, yCell, w, h, header, value) => {
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.35);
    doc.rect(x, yCell, w, h, 'S');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(header, x + 2, yCell + 4.5);

    // Value text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(value, x + 2, yCell + 9.5);
  };

  const drawTwoColumnInstructionsTable = (yStart) => {
    const w1 = 85;
    const w2 = 85;
    const x = margin;

    // Extract instructions
    let rawInst = 'Lee atentamente las instrucciones antes de responder.';
    if (typeof cj.instrucciones_generales === 'string') {
      rawInst = cj.instrucciones_generales;
    } else if (typeof cj.instrucciones === 'string') {
      rawInst = cj.instrucciones;
    } else if (cj.instrucciones_generales && typeof cj.instrucciones_generales.texto === 'string') {
      rawInst = cj.instrucciones_generales.texto;
    }
    
    // Extract objectives (OA) - Only the codes
    let rawObj = 'Evaluar comprensión lectora y análisis de textos.';
    if (Array.isArray(cj.oa_codes) && cj.oa_codes.length > 0 && cj.oa_codes[0] !== 'OA_EVAL') {
      rawObj = cj.oa_codes.map((c) => c.replace(/^OA\s*:/i, 'OA ')).join(', ');
    } else if (Array.isArray(record.oa_codes) && record.oa_codes.length > 0 && record.oa_codes[0] !== 'OA_EVAL') {
      rawObj = record.oa_codes.map((c) => c.replace(/^OA\s*:/i, 'OA ')).join(', ');
    } else if (typeof cj.tabla_especificaciones?.oa_evaluado === 'string' && cj.tabla_especificaciones.oa_evaluado) {
      const matches = cj.tabla_especificaciones.oa_evaluado.match(/OA\s*\d+/gi);
      if (matches && matches.length > 0) {
        rawObj = matches.map(m => m.toUpperCase().replace(/\s+/g, ' ')).join(', ');
      } else {
        rawObj = cj.tabla_especificaciones.oa_evaluado;
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Split text for each column
    const col1Lines = doc.splitTextToSize(rawInst, w1 - 6);
    const col2Lines = doc.splitTextToSize(rawObj, w2 - 6);

    const lineHeight = 4;
    const headerHeight = 7;
    const height1 = headerHeight + col1Lines.length * lineHeight + 4;
    const height2 = headerHeight + col2Lines.length * lineHeight + 4;
    const maxHeight = Math.max(height1, height2);

    // Draw outer borders
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.35);
    doc.rect(x, yStart, w1, maxHeight, 'S');
    doc.rect(x + w1, yStart, w2, maxHeight, 'S');

    // Column 1 header background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(x + 0.1, yStart + 0.1, w1 - 0.2, headerHeight - 0.1, 'F');
    
    // Column 2 header background
    doc.rect(x + w1 + 0.1, yStart + 0.1, w2 - 0.2, headerHeight - 0.1, 'F');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("Instrucciones", x + 3, yStart + 4.5);
    doc.text("Objetivos", x + w1 + 3, yStart + 4.5);

    // Draw content for Column 1
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    let currY1 = yStart + headerHeight + 3;
    col1Lines.forEach((line) => {
      doc.text(line, x + 3, currY1);
      currY1 += lineHeight;
    });

    // Draw content for Column 2
    let currY2 = yStart + headerHeight + 3;
    col2Lines.forEach((line) => {
      doc.text(line, x + w1 + 3, currY2);
      currY2 += lineHeight;
    });

    return maxHeight;
  };

  const preguntas = cj.prueba?.secciones?.flatMap(s => s.preguntas) ?? cj.preguntas ?? [];
  const MC_Preguntas = preguntas.filter((p) => p.tipo === 'seleccion_multiple' || (p.alternativas && p.alternativas.length > 0));
  const Dev_Preguntas = preguntas.filter((p) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo' || !(p.alternativas && p.alternativas.length > 0));

  let mcPoints = MC_Preguntas.length * 2;
  let devPoints = Dev_Preguntas.length * 4;

  const filasSpec = cj.tabla_especificaciones?.filas || [];
  if (filasSpec.length) {
    let sumMc = 0;
    let sumDev = 0;
    filasSpec.forEach((f) => {
      const ptosVal = Number(f.ptos) || 0;
      const isMc = f.tipo_item === 'Selección múltiple' || String(f.tipo_item).toLowerCase().includes('alternativa');
      if (isMc) sumMc += ptosVal;
      else sumDev += ptosVal;
    });
    if (sumMc > 0) mcPoints = sumMc;
    if (sumDev > 0) devPoints = sumDev;
  }
  const totalPtos = mcPoints + devPoints;

  const courseName = record.nivel || 'General';
  const teacherName = cj.docente || '___________________________';
  const subjectName = cj.asignatura || 'Lenguaje y Comunicación';

  // Fila 1:
  drawHeaderCell(margin, y, 45, 12, "Instrumento", "PRUEBA ESCRITA");
  drawHeaderCell(margin + 45, y, 65, 12, "Asignatura/Especialidad", subjectName);
  drawHeaderCell(margin + 110, y, 30, 12, "Curso", courseName);
  drawHeaderCell(margin + 140, y, 30, 12, "Letra", "");

  y += 12;

  // Fila 2:
  drawHeaderCell(margin, y, 60, 12, "Docente Responsable", teacherName);
  drawHeaderCell(margin + 60, y, 22, 12, "Pje. Ideal", `${totalPtos} pts`);
  drawHeaderCell(margin + 82, y, 22, 12, "Pje. Corte", `${Math.round(totalPtos * 0.6)} pts`);
  drawHeaderCell(margin + 104, y, 22, 12, "Prema/Ex.", "60%");
  drawHeaderCell(margin + 126, y, 22, 12, "Tiempo", `${cj.duracion_min || 90} min`);
  drawHeaderCell(margin + 148, y, 22, 12, "Coef.", "1");

  y += 12;

  // Fila 3:
  drawHeaderCell(margin, y, 90, 12, "Nombre del Estudiante", "");
  drawHeaderCell(margin + 90, y, 30, 12, "Fecha", "");
  drawHeaderCell(margin + 120, y, 25, 12, "Pje. Obtenido", "");
  drawHeaderCell(margin + 145, y, 25, 12, "Calificación", "");

  y += 18;

  // Título en negrita y subrayado
  const getEvaluationTitle = () => {
    const tipo = String(cj.tipo_evaluacion || record.tipo_evaluacion || '').toLowerCase();
    const isSimce = record.simce_ensayo || tipo.includes('simce');
    if (isSimce) return 'ENSAYO SIMCE';
    if (tipo.includes('diagnostica')) return 'EVALUACIÓN DIAGNÓSTICA';
    if (tipo.includes('formativa')) return 'EVALUACIÓN FORMATIVA';
    if (tipo.includes('sumativa')) return 'EVALUACIÓN SUMATIVA';
    return 'EVALUACIÓN FORMATIVA';
  };

  const titleText = getEvaluationTitle();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  const textWidth = doc.getTextWidth(titleText);
  const startX = margin + (usable - textWidth) / 2;
  doc.text(titleText, startX, y);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.45);
  doc.line(startX, y + 1.2, startX + textWidth, y + 1.2);

  y += 8;

  // Tabla de dos columnas: Instrucciones | Objetivos
  const tableHeight = drawTwoColumnInstructionsTable(y);
  y += tableHeight + 6;

  // ── 3. TEXTOS Y PREGUNTAS INTERCALADOS ──
  const questionsWithTextGroup = preguntas.map((q, idx) => ({
    ...q,
    _tempGroup: getTextoAsociado(q, idx, preguntas.length)
  }));

  const pT1 = questionsWithTextGroup.filter((q) => q._tempGroup === 'texto_1');
  const pT2 = questionsWithTextGroup.filter((q) => q._tempGroup === 'texto_2');
  const pAmbos = questionsWithTextGroup.filter((q) => q._tempGroup === 'ambos');

  const sortedPreguntas = [...pT1, ...pT2, ...pAmbos];
  const finalPreguntas = sortedPreguntas.map((q, idx) => ({
    ...q,
    numero_original: idx + 1
  }));

  const preguntasT1 = finalPreguntas.filter((q) => q._tempGroup === 'texto_1');
  const preguntasT2 = finalPreguntas.filter((q) => q._tempGroup === 'texto_2');
  const preguntasAmbos = finalPreguntas.filter((q) => q._tempGroup === 'ambos');

  const texts = cj.textos_lectura || [];
  if (texts.length >= 2) {
    // Texto 1
    addSection('TEXTO DE LECTURA 1');
    drawSingleText(texts[0], 0);
    
    // Preguntas Texto 1
    drawQuestionsGroup(preguntasT1, 'PREGUNTAS DEL TEXTO 1');

    // Texto 2
    addSection('TEXTO DE LECTURA 2');
    drawSingleText(texts[1], 1);

    // Preguntas Texto 2
    drawQuestionsGroup(preguntasT2, 'PREGUNTAS DEL TEXTO 2');

    // Preguntas Integradas
    if (preguntasAmbos.length > 0) {
      drawQuestionsGroup(preguntasAmbos, 'PREGUNTAS DE INTEGRACIÓN (AMBOS TEXTOS)');
    }
  } else {
    // Fallback
    if (texts.length > 0) {
      addSection('TEXTOS DE LECTURA');
      texts.forEach((txt, idx) => {
        drawSingleText(txt, idx);
      });
    }
    drawQuestionsGroup(questionsWithNum, 'PREGUNTAS DE COMPRENSIÓN');
  }

  // ── 4. TABLA DE ESPECIFICACIONES ──
  if (cj.tabla_especificaciones?.filas?.length) {
    addSection('TABLA DE ESPECIFICACIONES');
    const specColW = [30, 45, 30, 22, 15, 12, 16];
    const specHeaders = ['Habilidades', 'Indicadores', 'Contenido', 'Tipo Ítem', 'N° Ítem', 'Claves', 'Ponderación'];
    
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y - 4, usable, 6, 'F');
    doc.rect(margin, y - 4, usable, 6, 'S');

    let sx = margin;
    specHeaders.forEach((h, idx) => {
      doc.text(h, sx + 1, y);
      sx += specColW[idx];
    });
    y += 4;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
    cj.tabla_especificaciones.filas.forEach((f, idx) => {
      if (y > 250) { doc.addPage(); fillBackground(); y = margin; }
      
      const numItemsText = f.n_pregunta || String(idx + 1);
      const ponderacionText = `${f.ponderacion_pct || 0}%`;

      const rowCells = [
        f.habilidad || 'General',
        f.indicador || 'Comprender e integrar información.',
        f.contenido || 'Comprensión lectora',
        f.tipo_item || 'Ítem',
        numItemsText,
        f.clave || 'A',
        ponderacionText
      ];

      const cellLines = rowCells.map((text, idx) => doc.splitTextToSize(String(text), specColW[idx] - 2));
      const maxLines = Math.max(...cellLines.map(lines => lines.length));
      const rowHeight = maxLines * 4 + 2;

      doc.setDrawColor(226, 232, 240);
      sx = margin;
      
      rowCells.forEach((cellText, cellIdx) => {
        const lines = cellLines[cellIdx];
        lines.forEach((line, lineIdx) => {
          doc.text(line, sx + 1, y + lineIdx * 4 + 3);
        });
        doc.rect(sx, y, specColW[cellIdx], rowHeight, 'S');
        sx += specColW[cellIdx];
      });
      y += rowHeight;
    });
    y += 4;
  }

  // ── 5. RÚBRICA (solo en versión docente) ──
  const rub = cj.rubrica;
  if (mode === 'teacher' && rub?.criterios?.length) {
    const instTipo = rub.tipo_instrumento || 'rubrica_analitica';
    addSection(rub.titulo || 'INSTRUMENTO DE EVALUACIÓN');
    if (rub.instruccion) addText(rub.instruccion, 8.5, false, '#64748b');
    
    let rColW = [38, 33, 33, 33, 33];
    let rHeaders = getInstrumentHeaders(instTipo);
    
    if (instTipo === 'lista_cotejo') {
      rColW = [80, 45, 45];
    } else if (instTipo === 'rubrica_holistica') {
      rColW = [40, 130];
    } else if (instTipo === 'escala_apreciacion') {
      rColW = [50, 30, 30, 30, 30];
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    let rx = margin;
    rHeaders.forEach((h, i) => { doc.text(h, rx, y); rx += rColW[i]; });
    y += 6;
    
    rub.criterios.forEach((c) => {
      if (y > 265) { doc.addPage(); fillBackground(); y = margin; }
      rx = margin;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 41, 59);
      
      let vals = [c.nombre || c.dimension || ''];
      if (instTipo === 'lista_cotejo') {
        vals.push(c.logrado || c.si || '', c.no_logrado || c.no || '');
      } else if (instTipo === 'escala_apreciacion') {
        vals.push(c.destacado || '', c.logrado || '', c.en_desarrollo || '', c.no_logrado || '');
      } else if (instTipo === 'rubrica_holistica') {
        vals.push(c.descripcion || c.excelente || c.logrado || '');
      } else {
        vals.push(c.excelente || c.logrado || '', c.bueno || c.logrado_parcial || '', c.suficiente || c.en_desarrollo || '', c.insuficiente || c.no_logrado || '');
      }

      let rowH = 5;
      vals.forEach((v, i) => {
        const ls = doc.splitTextToSize(v ?? '', rColW[i] - 2);
        rowH = Math.max(rowH, ls.length * 4);
      });
      
      vals.forEach((v, i) => {
        const ls = doc.splitTextToSize(v ?? '', rColW[i] - 2);
        ls.forEach((l, li) => doc.text(l, rx, y + li * 4));
        rx += rColW[i];
      });
      y += rowH + 2;
    });
  }

  // 4. Solutions (only for teacher)
  if (mode === 'teacher') {
    addSection('SOLUCIONARIO Y PAUTA DE CORRECCIÓN');
    
    const rawRespList = cj.respuestas_esperadas || [];
    const respList = finalPreguntas.map((q) => {
      const resp = rawRespList.find((r) => String(r.pregunta) === String(q.numero || q.n_pregunta));
      return {
        pregunta: q.numero_original,
        tipo: q.tipo,
        clave: resp?.clave || (q.alternativas ? Object.entries(q.alternativas).find(([_, alt]) => alt.correcta)?.[0] : 'A'),
        explicacion: resp?.explicacion || 'Justificación basada en el análisis e información extraída de los textos.',
        respuesta_esperada: resp?.respuesta_esperada || q.respuesta_esperada || 'Respuesta esperada.',
        criterios_correccion: resp?.criterios_correccion
      };
    });

    if (respList.length) {
      respList.forEach((resp) => {
        if (y > 260) { doc.addPage(); fillBackground(); y = margin; }
        const num = resp.pregunta;
        const esDes = resp.tipo === 'consigna_abierta' || resp.tipo === 'desarrollo' || resp.respuesta_esperada;
        
        if (esDes) {
          addText(`Pregunta ${num} (Desarrollo)`, 9.5, true, '#1e293b');
          addText(`Respuesta esperada: ${resp.respuesta_esperada}`, 9, false, '#16a34a');
        } else {
          addText(`Pregunta ${num} (Alternativas) — Clave: ${resp.clave}`, 9.5, true, '#16a34a');
          if (resp.explicacion) {
            addText(`Explicación: ${resp.explicacion}`, 9, false, '#64748b');
          }
        }
        y += 2;
      });
    }

    if (cj.pauta_correccion) {
      if (y > 265) { doc.addPage(); fillBackground(); y = margin; }
      y += 2;
      addText('Pauta de Calificación:', 9.5, true, '#1e293b');
      addText(`Puntaje Total: ${cj.pauta_correccion.puntaje_total} Ptos | Exigencia: ${cj.pauta_correccion.exigencia} | Aprobación (Nota 4.0): ${cj.pauta_correccion.puntaje_aprobacion} Ptos`, 9, false, '#475569');
    }
  }

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfOutput));
}

run().catch(err => {
  console.error('[Test] Exec Error:', err);
});
