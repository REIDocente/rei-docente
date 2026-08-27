import { jsPDF } from 'jspdf';
import type { EvaluacionData, ExportOptions } from './drawEvaluacionesWord';

// ------------------------------------------------------------------
// Robust Helper Functions matching Word export
// ------------------------------------------------------------------

function getPreguntasList(cj: any): any[] {
  if (!cj) return [];
  const fromPruebaSecciones = cj.prueba?.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromPruebaSecciones) && fromPruebaSecciones.length > 0) return fromPruebaSecciones;
  const fromSecciones = cj.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromSecciones) && fromSecciones.length > 0) return fromSecciones;
  if (Array.isArray(cj.preguntas) && cj.preguntas.length > 0) return cj.preguntas;
  const alts = cj.preguntas_alternativas || [];
  const devs = cj.preguntas_desarrollo || [];
  if (alts.length > 0 || devs.length > 0) return [...alts, ...devs];
  return [];
}

function getCleanAlternatives(raw: any, qObj?: any): Array<{letra: string; texto: string; correcta?: boolean}> {
  if (!raw) return [];
  let strings: string[] = [];
  if (Array.isArray(raw)) {
    strings = raw.map((item: any) => {
      let s = '';
      if (typeof item === 'string') s = item.trim();
      else if (typeof item === 'object' && item !== null) {
        s = String(item.texto || item.text || item.contenido || item.alternativa || item.value || '').trim();
      }
      // Strip leading "A. " / "A) " prefix that Claude sometimes includes in the text itself
      return s.replace(/^[A-Da-d][.)]\s+/, '');
    }).filter(s => s.length > 0);
  } else if (typeof raw === 'object' && raw !== null) {
    strings = Object.values(raw).map((v: any) => {
      if (typeof v === 'string') return v.trim();
      if (typeof v === 'object' && v !== null) return String(v.texto || v.text || '').trim();
      return '';
    }).filter(s => s.length > 0);
  }
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = String(qObj?.clave || qObj?.respuesta_correcta || '').toUpperCase().trim();
  return strings.map((texto, i) => ({
    letra: letters[i] || '',
    texto,
    correcta: letters[i] === correctLetter,
  }));
}

function getTechniqueInstruction(tipoEvaluacion?: string): string {
  const isFormativaOrDiag = !tipoEvaluacion || 
    tipoEvaluacion.toLowerCase().includes('formativa') || 
    tipoEvaluacion.toLowerCase().includes('diagn');
  return isFormativaOrDiag
    ? "Responde usando la técnica OREO: escribe tu Opinión, una Razón que la justifique, un Ejemplo concreto y cierra reafirmando tu Opinión."
    : "Responde usando la técnica RICE: Repite la pregunta con tus palabras, Incluye tu postura, Cita una evidencia del texto y Explica cómo esa cita apoya tu argumento.";
}

// ------------------------------------------------------------------
// Drawing Helpers
// ------------------------------------------------------------------

function drawRect(doc: jsPDF, x: number, y: number, w: number, h: number, fillColor?: string) {
  doc.setDrawColor(203, 213, 225); // #CBD5E1 (slate-300)
  doc.setLineWidth(0.5);
  if (fillColor) {
    // Convert hex to rgb
    const cleanHex = fillColor.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    doc.setFillColor(r, g, b);
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.rect(x, y, w, h, 'S');
  }
}

function addFooter(doc: jsPDF, pageNum: number, estName: string) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${estName} | Página ${pageNum}`, 105, 290, { align: "center" });
}

function checkPageBreak(doc: jsPDF, state: { y: number, pageNum: number }, requiredSpace: number = 20, estName: string) {
  if (state.y + requiredSpace > 275) {
    addFooter(doc, state.pageNum, estName);
    state.pageNum++;
    doc.addPage();
    state.y = 20;
  }
}

function writeWrappedText(doc: jsPDF, text: string, x: number, state: { y: number, pageNum: number }, maxWidth: number, lineHeight: number, estName: string): void {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    checkPageBreak(doc, state, lineHeight, estName);
    doc.text(line, x, state.y);
    state.y += lineHeight;
  }
}

function drawTable(doc: jsPDF, headers: string[], rows: string[][], startX: number, state: { y: number, pageNum: number }, colWidths: number[], estName: string, baseRowHeight: number = 8): void {
  const rowHeight = baseRowHeight;
  
  // Header Row
  checkPageBreak(doc, state, rowHeight, estName);
  let currentX = startX;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  
  for (let i = 0; i < headers.length; i++) {
    doc.setFillColor(241, 245, 249); // #F1F5F9 (slate-100)
    doc.rect(currentX, state.y, colWidths[i], rowHeight, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(headers[i], currentX + 2, state.y + 5);
    currentX += colWidths[i];
  }
  state.y += rowHeight;

  // Data Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85); // slate-700
  
  for (const row of rows) {
    let maxLines = 1;
    const cellLines: string[][] = [];
    
    for (let i = 0; i < row.length; i++) {
      const lines = doc.splitTextToSize(row[i] || '', colWidths[i] - 4);
      cellLines.push(lines);
      if (lines.length > maxLines) maxLines = lines.length;
    }
    
    const cellHeight = Math.max(rowHeight, maxLines * 4.5 + 3.5);
    checkPageBreak(doc, state, cellHeight, estName);
    
    currentX = startX;
    for (let i = 0; i < row.length; i++) {
      doc.rect(currentX, state.y, colWidths[i], cellHeight, 'S');
      const lines = cellLines[i];
      let txtY = state.y + 4.5;
      for (const line of lines) {
        doc.text(line, currentX + 2, txtY);
        txtY += 4.5;
      }
      currentX += colWidths[i];
    }
    state.y += cellHeight;
  }
}

// ------------------------------------------------------------------
// Main Export Function
// ------------------------------------------------------------------

export default async function drawEvaluacionesPdf(ev: EvaluacionData, options?: ExportOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const state = { y: 15, pageNum: 1 };
  const marginX = 15;
  const contentWidth = 180; // 210 - 15 - 15
  
  const cj = typeof ev.contenido_json === 'string' ? JSON.parse(ev.contenido_json || '{}') : (ev.contenido_json || {});
  
  const establecimiento = options?.establecimiento || cj.establecimiento || '___________________';
  const docente = options?.docente || cj.docente || '___________________';
  const fecha = options?.fecha || '___________________';
  const asignatura = ev.eje || '___________________';

  // Calculate Total Points (Puntaje Ideal)
  let totalPoints = 0;
  const filasSpec = cj.tabla_especificaciones?.filas || [];
  if (Array.isArray(filasSpec) && filasSpec.length > 0) {
    totalPoints = filasSpec.reduce((sum: number, f: any) => sum + (Number(f.ptos) || 0), 0);
  } else {
    const preguntas = getPreguntasList(cj);
    totalPoints = preguntas.reduce((sum: number, p: any) => sum + (p.tipo === 'seleccion_multiple' ? 1 : 3), 0);
  }
  if (totalPoints === 0) totalPoints = 30;

  // 1. Header (institutional)
  const headerHeight = 32;
  drawRect(doc, marginX, state.y, contentWidth, headerHeight);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(109, 40, 245); // #6D28F5
  doc.text("REÍ Docente", marginX + 5, state.y + 8);
  
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Establecimiento: ${establecimiento}`, marginX + 5, state.y + 15);
  doc.setFont("helvetica", "normal");
  doc.text(`Docente: ${docente}`, marginX + 5, state.y + 21);
  doc.text(`Asignatura: ${asignatura}`, marginX + 5, state.y + 27);
  
  doc.text(`Fecha: ${fecha}`, marginX + 110, state.y + 15);
  doc.text(`Curso: ${ev.nivel}`, marginX + 110, state.y + 21);
  
  const oasStr = ev.oa_codes?.join(', ') || '';
  const oaLines = doc.splitTextToSize(`OA: ${oasStr}`, 60);
  doc.text(oaLines, marginX + 110, state.y + 27);
  
  state.y += headerHeight + 5;

  // 2. Student data box
  const studentBoxHeight = 16;
  drawRect(doc, marginX, state.y, contentWidth, studentBoxHeight);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Nombre: _________________________________________________`, marginX + 5, state.y + 6);
  doc.text(`Curso: ${ev.nivel}`, marginX + 120, state.y + 6);
  
  doc.text(`Fecha: _________________`, marginX + 5, state.y + 12);
  doc.text(`Puntaje Ideal: ${totalPoints}`, marginX + 60, state.y + 12);
  doc.text(`Puntaje Obtenido: _______`, marginX + 105, state.y + 12);
  doc.text(`Nota: _______`, marginX + 150, state.y + 12);
  
  state.y += studentBoxHeight + 8;

  // 3. Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(ev.titulo || 'Evaluación', 105, state.y, { align: 'center' });
  state.y += 8;

  // 4. Instrucciones Generales
  const instrucciones = cj.instrucciones_generales || cj.instrucciones;
  if (instrucciones) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    writeWrappedText(doc, instrucciones, marginX, state, contentWidth, 4.5, establecimiento);
    state.y += 4;
  }

  // 5. Tabla de Especificaciones (if tipos includes tabla_especificaciones)
  if (ev.tipos?.includes('tabla_especificaciones') && filasSpec.length > 0) {
    checkPageBreak(doc, state, 20, establecimiento);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Tabla de Especificaciones", marginX, state.y);
    state.y += 6;
    
    // Group spec rows by habilidad
    const groupedSpec: Record<string, {
      habilidad: string;
      num_items: number[];
      ptos: number;
    }> = {};

    filasSpec.forEach((f: any) => {
      const hab = f.habilidad || 'General';
      if (!groupedSpec[hab]) {
        groupedSpec[hab] = { habilidad: hab, num_items: [], ptos: 0 };
      }
      if (f.n_pregunta) {
        String(f.n_pregunta).split(',').forEach(n => {
          const num = parseInt(n.trim(), 10);
          if (!isNaN(num)) groupedSpec[hab].num_items.push(num);
        });
      }
      groupedSpec[hab].ptos += (Number(f.ptos) || 0);
    });

    const headers = ["Habilidad Cognitiva", "N° Pregunta(s)", "Puntaje", "% del Total"];
    const colWidths = [70, 40, 35, 35];
    
    const rows = Object.values(groupedSpec).map(g => {
      const pct = totalPoints > 0 ? `${Math.round((g.ptos / totalPoints) * 100)}%` : '0%';
      return [
        g.habilidad,
        g.num_items.sort((a,b)=>a-b).join(', '),
        `${g.ptos} pts`,
        pct
      ];
    });

    // Add totals row
    rows.push([
      "TOTAL",
      "-",
      `${totalPoints} pts`,
      "100%"
    ]);
    
    drawTable(doc, headers, rows, marginX, state, colWidths, establecimiento);
    state.y += 6;
  }

  // 6. Textos de Lectura
  const textos = cj.textos_lectura || cj.textos;
  if (textos && Array.isArray(textos) && textos.length > 0) {
    for (const t of textos) {
      checkPageBreak(doc, state, 15, establecimiento);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      const titulo = t.titulo || 'Texto de Lectura';
      const tipo = t.tipo ? ` [${t.tipo}]` : '';
      doc.text(`${titulo}${tipo}`, marginX, state.y);
      state.y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      writeWrappedText(doc, t.contenido || '', marginX, state, contentWidth, 4.5, establecimiento);
      state.y += 6;
    }
  }

  const preguntas = getPreguntasList(cj);

  // 7. Preguntas de Selección Múltiple
  const smPreguntas = preguntas.filter(p => p.tipo === 'seleccion_multiple' || p.alternativas);
  if (smPreguntas.length > 0) {
    checkPageBreak(doc, state, 15, establecimiento);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(109, 40, 245);
    doc.text("I. Ítem de Selección Múltiple", marginX, state.y);
    state.y += 6;
    
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    let idx = 1;
    for (const p of smPreguntas) {
      checkPageBreak(doc, state, 15, establecimiento);
      doc.setFont("helvetica", "bold");
      writeWrappedText(doc, `${idx}. ${p.enunciado || p.pregunta || ''}`, marginX, state, contentWidth, 4.5, establecimiento);
      
      doc.setFont("helvetica", "normal");
      const alts = getCleanAlternatives(p.alternativas, p);
      for (const alt of alts) {
        checkPageBreak(doc, state, 5, establecimiento);
        doc.text(`${alt.letra}) ${alt.texto}`, marginX + 6, state.y);
        state.y += 4.5;
      }
      state.y += 3;
      idx++;
    }
    state.y += 3;
  }

  // 8. Preguntas de Desarrollo
  const devPreguntas = preguntas.filter(p => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');
  if (devPreguntas.length > 0) {
    checkPageBreak(doc, state, 15, establecimiento);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(109, 40, 245);
    doc.text("II. Ítem de Desarrollo / Respuestas Abiertas", marginX, state.y);
    state.y += 6;
    
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    let idx = 1;
    for (const p of devPreguntas) {
      checkPageBreak(doc, state, 30, establecimiento);
      doc.setFont("helvetica", "bold");
      writeWrappedText(doc, `${idx}. ${p.enunciado || p.pregunta || ''}`, marginX, state, contentWidth, 4.5, establecimiento);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const instruction = getTechniqueInstruction(ev.tipos?.join(',') || '');
      writeWrappedText(doc, instruction, marginX, state, contentWidth, 4, establecimiento);
      state.y += 2;
      
      // Draw blank response lines
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      for (let j = 0; j < 6; j++) {
        doc.line(marginX, state.y, marginX + contentWidth, state.y);
        state.y += 7;
      }
      state.y += 3;
      idx++;
    }
    state.y += 3;
  }

  // 9. Rúbrica de Evaluación (if exists)
  const rubrica = cj.rubrica || cj.rubrica_evaluacion;
  if (rubrica && rubrica.criterios && Array.isArray(rubrica.criterios) && rubrica.criterios.length > 0) {
    checkPageBreak(doc, state, 20, establecimiento);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Rúbrica de Evaluación", marginX, state.y);
    state.y += 6;

    const tipo = rubrica.tipo || '';

    if (tipo === 'rubrica_holistica') {
      // Holística: 2 columnas — Nivel | Descripción
      const headers = ["Nivel de Desempeño", "Descriptor"];
      const colWidths = [55, 125];
      const rows = rubrica.criterios.map((c: any) => [
        c.nombre || c.nivel || 'Nivel',
        c.descripcion || c.descriptor || '',
      ]);
      drawTable(doc, headers, rows, marginX, state, colWidths, establecimiento);
    } else if (tipo === 'lista_cotejo') {
      // Lista de cotejo: Indicador | Logrado | No logrado
      const headers = ["Indicador", "Logrado", "No logrado"];
      const colWidths = [120, 30, 30];
      const rows = rubrica.criterios.map((c: any) => [
        c.nombre || c.indicador || 'Indicador',
        c.logrado || 'Sí',
        c.no_logrado || 'No',
      ]);
      drawTable(doc, headers, rows, marginX, state, colWidths, establecimiento);
    } else {
      // Analítica (descriptiva o cuantitativa) / Pauta: 4 columnas
      const headers = ["Criterio", "Excelente / Logrado", "Bueno / En proceso", "Insuficiente / Por lograr"];
      const colWidths = [45, 45, 45, 45];
      const rows = rubrica.criterios.map((c: any) => [
        c.nombre || c.criterio || 'Criterio',
        c.excelente || c.logrado || c.si || c.respuesta_modelo || '',
        c.bueno || c.en_proceso || c.logrado_parcial || '',
        c.insuficiente || c.por_lograr || c.no_logrado || '',
      ]);
      drawTable(doc, headers, rows, marginX, state, colWidths, establecimiento);
    }
    state.y += 6;
  }

  // 10. Autoevaluación / Coevaluación / Heteroevaluación
  const evaluations = [
    { key: 'autoevaluacion', label: 'Autoevaluación' },
    { key: 'coevaluacion', label: 'Coevaluación' },
    { key: 'heteroevaluacion', label: 'Heteroevaluación' }
  ];

  for (const item of evaluations) {
    const sectionData = cj[item.key];
    if (sectionData && sectionData.indicadores && Array.isArray(sectionData.indicadores)) {
      checkPageBreak(doc, state, 25, establecimiento);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(item.label, marginX, state.y);
      state.y += 6;

      const headers = ["Indicador de Evaluación", "Siempre", "A veces", "Nunca"];
      const colWidths = [105, 25, 25, 25];
      const rows = sectionData.indicadores.map((ind: string) => [ind, '', '', '']);
      
      drawTable(doc, headers, rows, marginX, state, colWidths, establecimiento);
      state.y += 6;
    }
  }

  // Finalize student page footer
  addFooter(doc, state.pageNum, establecimiento);

  // ------------------------------------------------------------------
  // PAUTA DEL DOCENTE (New Page)
  // ------------------------------------------------------------------
  state.pageNum++;
  doc.addPage();
  state.y = 20;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(109, 40, 245);
  doc.text("PAUTA DE CORRECCIÓN — USO EXCLUSIVO DEL DOCENTE", 105, state.y, { align: 'center' });
  state.y += 10;

  // Claves de alternativas
  if (smPreguntas.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Solucionario: Selección Múltiple", marginX, state.y);
    state.y += 6;

    const headers = ["N°", "Clave", "Objetivo (OA)", "Justificación Pedagógica"];
    const colWidths = [12, 15, 33, 120];
    
    const oaCodes = ev.oa_codes || ['General'];
    const rows = smPreguntas.map((p, idx) => {
      const correctOpt = getCleanAlternatives(p.alternativas, p).find(a => a.correcta);
      const oaLabel = p.oa || oaCodes[idx % oaCodes.length] || 'General';
      const justif = p.justificacion && p.justificacion !== 'Respuesta correcta según el texto/foco.'
        ? p.justificacion
        : `Evalúa comprensión del ${oaLabel} mediante selección de la opción correcta.`;
      return [
        String(idx + 1),
        correctOpt?.letra || p.clave || p.respuesta_correcta || 'A',
        oaLabel,
        justif,
      ];
    });

    drawTable(doc, headers, rows, marginX, state, colWidths, establecimiento);
    state.y += 8;
  }

  // Respuestas modelo de desarrollo
  if (devPreguntas.length > 0) {
    checkPageBreak(doc, state, 20, establecimiento);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Criterios de Corrección: Ítem de Desarrollo", marginX, state.y);
    state.y += 6;

    let idx = 1;
    for (const p of devPreguntas) {
      checkPageBreak(doc, state, 20, establecimiento);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Pregunta ${idx}: ${p.enunciado || p.pregunta || ''}`, marginX, state.y);
      state.y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      writeWrappedText(
        doc,
        `Respuesta esperada: ${p.respuesta_esperada || p.respuesta || 'Desarrollo de la opinión/análisis.'}`,
        marginX,
        state,
        contentWidth,
        4,
        establecimiento
      );

      const criterios = p.criterios_correccion || p.criterios_evaluacion;
      if (criterios && Array.isArray(criterios) && criterios.length > 0) {
        state.y += 1.5;
        doc.setFont("helvetica", "bold");
        doc.text("Criterios de evaluación:", marginX, state.y);
        state.y += 4;
        doc.setFont("helvetica", "normal");
        for (const crit of criterios) {
          writeWrappedText(doc, `• ${crit}`, marginX + 4, state, contentWidth - 4, 4, establecimiento);
        }
      }
      state.y += 5;
      idx++;
    }
  }

  // Escala de notas
  checkPageBreak(doc, state, 40, establecimiento);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Escala de Conversión de Puntajes (Exigencia 60%)`, marginX, state.y);
  state.y += 5;

  const notesHeaders = ["Pts", "Nota", "Pts", "Nota", "Pts", "Nota"];
  const notesColWidths = [30, 30, 30, 30, 30, 30];
  const notesRows: string[][] = [];

  const getGradesScale = (total: number, exigencia = 0.6) => {
    const scale: Array<{ puntos: number; nota: number }> = [];
    for (let p = 0; p <= total; p++) {
      let nota = 1.0;
      if (total > 0) {
        const approvalPoints = total * exigencia;
        if (p < approvalPoints) {
          nota = 1.0 + 3.0 * (p / approvalPoints);
        } else {
          nota = 4.0 + 3.0 * ((p - approvalPoints) / (total * (1 - exigencia)));
        }
      }
      scale.push({ puntos: p, nota: Math.round(nota * 10) / 10 });
    }
    return scale;
  };

  const scale = getGradesScale(totalPoints);
  const rowsCount = Math.ceil(scale.length / 3);
  
  for (let i = 0; i < rowsCount; i++) {
    const row: string[] = [];
    for (let c = 0; c < 3; c++) {
      const idx = i + c * rowsCount;
      if (idx < scale.length) {
        row.push(String(scale[idx].puntos));
        row.push(scale[idx].nota.toFixed(1));
      } else {
        row.push('');
        row.push('');
      }
    }
    notesRows.push(row);
  }

  drawTable(doc, notesHeaders, notesRows, marginX, state, notesColWidths, establecimiento, 5.5);

  // Final footer of teacher page
  addFooter(doc, state.pageNum, establecimiento);

  return doc;
}
