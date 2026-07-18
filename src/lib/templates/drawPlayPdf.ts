import { jsPDF } from 'jspdf';

interface DrawPlayPdfParams {
  doc: jsPDF;
  motorId: string;
  juego: any; // contenido_json
  docenteNombre?: string;
  establecimiento?: string;
}

export function drawPlayPdf({
  doc,
  motorId,
  juego,
  docenteNombre = 'Docente',
  establecimiento = 'RIGOBERTO FONTT IZQUIERDO'
}: DrawPlayPdfParams) {
  const margin = 15;
  let y = 15;

  // Color de acento por motor
  const accentColors: Record<string, string> = {
    detective: '#1e3a5f',
    escape_room: '#7f1d1d',
    bingo: '#166534',
    trivia: '#4c1d95',
    cartas: '#92400e',
    memoria: '#0c4a6e',
    clue: '#14532d',
    serpiente_escaleras: '#0891b2',
    ludo: '#b91c1c'
  };

  const colorHex = accentColors[motorId] || '#1e3a5f';
  const rAccent = parseInt(colorHex.slice(1, 3), 16);
  const gAccent = parseInt(colorHex.slice(3, 5), 16);
  const bAccent = parseInt(colorHex.slice(5, 7), 16);

  const drawHeader = (title: string, isDocente = false) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const currentWidth = pageWidth - 2 * margin;

    // Encabezado institucional pequeño
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(margin, 10, currentWidth, 12);
    doc.line(margin + 30, 10, margin + 30, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("DIDAKTA PLAY", margin + 5, 17);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`${establecimiento} | ${title.toUpperCase()}`, margin + 33, 17);

    if (isDocente) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // rojo
      doc.text("USO EXCLUSIVO DOCENTE", margin + currentWidth - 45, 17);
    }
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    const footerText = `Generado con Didakta · LICEO ${establecimiento}`;
    doc.text(footerText, margin, pageHeight - 10);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  };

  const addText = (text: string, size: number, style = 'normal', colorHexValue = '#1e293b', xPos = margin) => {
    if (!text) return;
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const r = parseInt(colorHexValue.slice(1, 3), 16);
    const g = parseInt(colorHexValue.slice(3, 5), 16);
    const b = parseInt(colorHexValue.slice(5, 7), 16);
    doc.setTextColor(r, g, b);

    const pageWidth = doc.internal.pageSize.getWidth();
    const currentWidth = pageWidth - 2 * margin;
    const lines = doc.splitTextToSize(text, currentWidth - (xPos - margin));
    lines.forEach((line: string) => {
      doc.text(line, xPos, y);
      y += size * 0.4 + 4;
    });
  };

  const drawDottedRect = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(x, y, w, h, 'S');
    doc.setLineDashPattern([], 0); // reset
  };

  const getPageWidth = () => doc.internal.pageSize.getWidth() - 2 * margin;

  // 1. GENERACIÓN SEGÚN MOTOR
  if (motorId === 'detective') {
    const width = getPageWidth();
    // ---- PÁGINA 1: Portada ----
    drawHeader('Detective - Portada');
    y = 50;
    addText(juego.nombre_caso || 'Caso sin Título', 24, 'bold', colorHex);
    y += 10;
    addText('REI PLAY · JUEGO DE MESA PEDAGÓGICO', 10, 'bold', '#64748b');
    y += 40;

    // Caja de metadatos del investigador
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(1);
    doc.rect(margin, y, width, 45);
    y += 8;
    addText(' FICHA DE INVESTIGACIÓN PEDAGÓGICA', 11, 'bold', colorHex, margin + 5);
    y += 6;
    addText(` Asignatura: Lenguaje y Comunicación`, 10, 'normal', '#334155', margin + 5);
    addText(` Nivel: ${juego.nivel || 'General'}`, 10, 'normal', '#334155', margin + 5);
    addText(` Investigador(a): ____________________________________________________`, 10, 'bold', '#1e293b', margin + 5);
    addText(` Fecha de la Investigación: _____ / _____ / 2026`, 10, 'normal', '#334155', margin + 5);

    // ---- PÁGINA 2: Mapa de la Escena (Landscape) ----
    doc.addPage('a4', 'landscape');
    const lWidth = getPageWidth();
    drawHeader('Detective - Mapa');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("MAPA DE LA ESCENA DEL CRIMEN", lWidth / 2 + margin, 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(juego.nombre_caso || 'Caso sin Título', lWidth / 2 + margin, 41, { align: 'center' });

    // Pasillos de conexión
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(4);
    doc.line(margin + 90, 95, margin + 177, 95);
    doc.line(margin + 90, 155, margin + 177, 155);
    doc.line(margin + 133, 95, margin + 133, 155);

    // Habitaciones (rectángulos de 80x45)
    doc.setLineWidth(0.8);
    doc.setDrawColor(rAccent, gAccent, bAccent);

    // Biblioteca (Arriba Izquierda)
    doc.rect(margin + 10, 60, 80, 45);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("📚 Biblioteca", margin + 15, 72);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Colocar PISTA 1 aquí:", margin + 15, 83);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin + 15, 93, margin + 85, 93);
    doc.setLineDashPattern([], 0);

    // Salón Principal (Arriba Derecha)
    doc.rect(margin + lWidth - 90, 60, 80, 45);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("🛋️ Salón Principal", margin + lWidth - 85, 72);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Colocar PISTA 2 aquí:", margin + lWidth - 85, 83);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin + lWidth - 85, 93, margin + lWidth - 15, 93);
    doc.setLineDashPattern([], 0);

    // Jardín (Abajo Izquierda)
    doc.rect(margin + 10, 130, 80, 45);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("🌿 Jardín", margin + 15, 142);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Colocar PISTA 3 aquí:", margin + 15, 153);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin + 15, 163, margin + 85, 163);
    doc.setLineDashPattern([], 0);

    // Cocina (Abajo Derecha)
    doc.rect(margin + lWidth - 90, 130, 80, 45);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("🍴 Cocina", margin + lWidth - 85, 142);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Colocar EVIDENCIA aquí:", margin + lWidth - 85, 153);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin + lWidth - 85, 163, margin + lWidth - 15, 163);
    doc.setLineDashPattern([], 0);

    // Pie
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text("Instrucciones: Coloca las tarjetas de pistas en la habitación correspondiente antes de comenzar.", margin + 10, 185);

    // ---- PÁGINA 3: Historia + Misión (Portrait) ----
    doc.addPage('a4', 'portrait');
    const pWidth = getPageWidth();
    drawHeader('Detective - Contexto');
    y = 35;
    addText('HISTORIA DEL MISTERIO', 14, 'bold', colorHex);
    y += 5;
    addText(juego.historia || 'Buscando el misterio...', 10, 'normal', '#334155');
    y += 15;
    addText('MISIÓN DEL INVESTIGADOR', 14, 'bold', colorHex);
    y += 5;
    addText(juego.mision || 'Resolver el caso.', 10, 'bold', '#1e293b');

    // ---- PÁGINA 4: Tarjetas de Pistas (Pistas 1 y 2) ----
    doc.addPage();
    drawHeader('Detective - Pistas');
    y = 35;
    addText('TARJETAS DE PISTAS (Recortables)', 14, 'bold', colorHex);
    y += 10;

    const pistasList = Array.isArray(juego.pistas) ? juego.pistas : ['Pista A', 'Pista B', 'Pista C'];
    
    // Dibujar Pista 1
    const p1Y = y;
    drawDottedRect(margin, p1Y, pWidth, 55);
    y = p1Y + 8;
    addText('PISTA 1', 11, 'bold', colorHex, margin + 10);
    y += 4;
    addText(pistasList[0] || '', 9.5, 'normal', '#334155', margin + 10);

    // Dibujar Pista 2
    const p2Y = p1Y + 65;
    drawDottedRect(margin, p2Y, pWidth, 55);
    y = p2Y + 8;
    addText('PISTA 2', 11, 'bold', colorHex, margin + 10);
    y += 4;
    addText(pistasList[1] || '', 9.5, 'normal', '#334155', margin + 10);

    // ---- PÁGINA 5: Tarjetas de Pistas (Pista 3) ----
    doc.addPage();
    drawHeader('Detective - Pistas');
    y = 35;
    addText('TARJETAS DE PISTAS (Recortables)', 14, 'bold', colorHex);
    y += 10;

    // Dibujar Pista 3
    const p3Y = y;
    drawDottedRect(margin, p3Y, pWidth, 55);
    y = p3Y + 8;
    addText('PISTA 3', 11, 'bold', colorHex, margin + 10);
    y += 4;
    addText(pistasList[2] || '', 9.5, 'normal', '#334155', margin + 10);

    // ---- PÁGINA 6: Preguntas de Investigación ----
    doc.addPage();
    drawHeader('Detective - Interrogatorio');
    y = 35;
    addText('PREGUNTAS DE INVESTIGACIÓN', 14, 'bold', colorHex);
    y += 8;

    const preguntasList = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    preguntasList.forEach((preg: any, idx: number) => {
      const enunciado = typeof preg === 'object' ? (preg.enunciado || preg.pregunta) : preg;
      addText(`${idx + 1}. ${enunciado}`, 10, 'bold', '#1e293b');
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 4, margin + pWidth, y + 4);
      doc.line(margin, y + 10, margin + pWidth, y + 10);
      y += 16;
    });

    // ---- PÁGINA 7: Evidencia Final ----
    doc.addPage();
    drawHeader('Detective - Evidencia');
    y = 35;
    addText('REGISTRO DE EVIDENCIA FINAL', 14, 'bold', colorHex);
    y += 5;
    addText(juego.evidencia || 'Detalle del hallazgo clave.', 10.5, 'normal', '#1e293b');
    y += 15;
    addText('Conclusiones del Investigador:', 10, 'bold', colorHex);
    y += 10;
    doc.line(margin, y, margin + pWidth, y);
    doc.line(margin, y + 8, margin + pWidth, y + 8);
    doc.line(margin, y + 16, margin + pWidth, y + 16);
    doc.line(margin, y + 24, margin + pWidth, y + 24);

    // ---- PÁGINA 8: Ticket de Salida ----
    doc.addPage();
    drawHeader('Detective - Cierre');
    y = 35;
    addText('TICKET DE SALIDA: AUTOEVALUACIÓN NARRATIVA', 14, 'bold', colorHex);
    y += 8;
    
    const ticketList = Array.isArray(juego.ticket) ? juego.ticket : ['¿Qué pista te costó más interpretar?', '¿Cómo te sirvió el texto para resolver el caso?'];
    ticketList.forEach((q: string, idx: number) => {
      addText(`${idx + 1}. ${q}`, 10, 'bold', '#1e293b');
      y += 2;
      doc.line(margin, y + 4, margin + pWidth, y + 4);
      doc.line(margin, y + 10, margin + pWidth, y + 10);
      y += 18;
    });

    // ---- PÁGINA 9: Solución (Docente) ----
    doc.addPage();
    drawHeader('Detective - Solución', true);
    y = 35;
    addText('RESOLUCIÓN DEL CASO', 14, 'bold', '#dc2626');
    y += 8;
    
    if (typeof juego.solucion === 'object') {
      Object.keys(juego.solucion).forEach((key) => {
        addText(`${key.toUpperCase()}:`, 10, 'bold', '#1e293b');
        addText(String(juego.solucion[key]), 9.5, 'normal', '#334155');
        y += 4;
      });
    } else {
      addText(juego.solucion || 'Respuestas correctas de la pauta.', 10, 'normal', '#334155');
    }

  } else if (motorId === 'escape_room') {
    const width = getPageWidth();
    // ---- PÁGINA 1: Misión ----
    drawHeader('Escape Room - Misión');
    y = 45;
    addText('🔐 INSTRUCCIONES DE ESCAPE ROOM', 16, 'bold', colorHex);
    y += 10;
    addText(juego.mision || 'Resolver las pruebas antes de que se agote el tiempo.', 10.5, 'normal', '#1e293b');
    y += 30;
    drawDottedRect(margin, y, width, 50);
    y += 8;
    addText(' CÓDIGO DE DESBLOQUEO DEL EQUIPO', 11, 'bold', colorHex, margin + 5);
    y += 8;
    addText('  Clave Prueba 1: [ _____ ]', 10, 'normal', '#334155', margin + 5);
    addText('  Clave Prueba 2: [ _____ ]', 10, 'normal', '#334155', margin + 5);
    addText('  Clave Prueba 3 (FINAL): [ _____ ]', 10, 'bold', '#1e293b', margin + 5);

    // ---- PÁGINA 2: Mapa de Escape (Landscape) ----
    doc.addPage('a4', 'landscape');
    const elWidth = getPageWidth();
    drawHeader('Escape Room - Mapa');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("MAPA DE LA MISIÓN DE ESCAPE", elWidth / 2 + margin, 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const duracionText = `⏱ Tiempo estimado: ${juego.duracion || 45} minutos`;
    doc.text(duracionText, elWidth / 2 + margin, 41, { align: 'center' });

    const roomW = 55;
    const roomH = 65;
    const startY = 65;

    // Sala 1
    const r1X = margin + 15;
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.8);
    doc.rect(r1X, startY, roomW, roomH);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("SALA 1", r1X + roomW/2, startY + 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("El Inicio", r1X + roomW/2, startY + 25, { align: 'center' });
    doc.text("Prueba 1", r1X + roomW/2, startY + 35, { align: 'center' });

    // Flecha 1 -> 2
    doc.setLineWidth(0.5);
    doc.line(r1X + roomW, startY + roomH/2, r1X + roomW + 25, startY + roomH/2);
    doc.line(r1X + roomW + 20, startY + roomH/2 - 3, r1X + roomW + 25, startY + roomH/2);
    doc.line(r1X + roomW + 20, startY + roomH/2 + 3, r1X + roomW + 25, startY + roomH/2);

    // Candado 1
    const d1X = r1X + roomW + 7;
    const d1Y = startY + roomH/2 - 12;
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.rect(d1X, d1Y, 10, 10);
    doc.circle(d1X + 5, d1Y - 2, 3, 'S');
    doc.setFontSize(6.5);
    doc.text("CÓDIGO", d1X - 3, d1Y + 16);
    doc.text("_ _ _ _", d1X - 1, d1Y + 22);

    // Sala 2
    const r2X = r1X + roomW + 25;
    doc.rect(r2X, startY, roomW, roomH);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("SALA 2", r2X + roomW/2, startY + 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("El Desafío", r2X + roomW/2, startY + 25, { align: 'center' });
    doc.text("Prueba 2", r2X + roomW/2, startY + 35, { align: 'center' });

    // Flecha 2 -> 3
    doc.line(r2X + roomW, startY + roomH/2, r2X + roomW + 25, startY + roomH/2);
    doc.line(r2X + roomW + 20, startY + roomH/2 - 3, r2X + roomW + 25, startY + roomH/2);
    doc.line(r2X + roomW + 20, startY + roomH/2 + 3, r2X + roomW + 25, startY + roomH/2);

    // Candado 2
    const d2X = r2X + roomW + 7;
    const d2Y = startY + roomH/2 - 12;
    doc.rect(d2X, d2Y, 10, 10);
    doc.circle(d2X + 5, d2Y - 2, 3, 'S');
    doc.setFontSize(6.5);
    doc.text("CÓDIGO", d2X - 3, d2Y + 16);
    doc.text("_ _ _ _", d2X - 1, d2Y + 22);

    // Sala 3
    const r3X = r2X + roomW + 25;
    doc.rect(r3X, startY, roomW, roomH);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("SALA 3", r3X + roomW/2, startY + 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("La Salida", r3X + roomW/2, startY + 25, { align: 'center' });
    doc.text("Prueba 3", r3X + roomW/2, startY + 35, { align: 'center' });

    // ---- PÁGINAS 3-5: Pruebas ----
    doc.addPage('a4', 'portrait');
    const pWidth = getPageWidth();

    const pruebas = [
      { id: 1, text: juego.prueba1 || 'Prueba 1', code: juego.clave1 || 'Clave 1' },
      { id: 2, text: juego.prueba2 || 'Prueba 2', code: juego.clave2 || 'Clave 2' },
      { id: 3, text: juego.prueba3 || 'Prueba 3', code: juego.clave_final || 'Clave Final' }
    ];

    pruebas.forEach((p) => {
      if (p.id > 1) {
        doc.addPage();
      }
      drawHeader(`Escape Room - Prueba ${p.id}`);
      y = 35;
      addText(`DESAFÍO / PRUEBA ${p.id}`, 14, 'bold', colorHex);
      y += 5;
      addText(p.text, 10, 'normal', '#334155');
      y += 40;

      // Dibujar caja de candado
      drawDottedRect(margin + 50, y, 80, 25);
      const prevY = y;
      y += 8;
      addText(`🔑 CÓDIGO DE ACCESO PRUEBA ${p.id}`, 8, 'bold', '#64748b', margin + 55);
      addText('   [   _   _   _   _   _   ]', 11, 'bold', '#0f172a', margin + 55);
      y = prevY + 35;
    });

    // ---- PÁGINA 6: Ticket de Salida ----
    doc.addPage();
    drawHeader('Escape Room - Cierre');
    y = 35;
    addText('REGISTRO DE ESCAPE - REFLEXIÓN', 14, 'bold', colorHex);
    y += 10;
    addText(juego.ticket || '¿Qué conceptos aplicaste hoy para resolver el escape?', 10.5, 'bold', '#1e293b');
    y += 15;
    doc.line(margin, y, margin + pWidth, y);
    doc.line(margin, y + 8, margin + pWidth, y + 8);
    doc.line(margin, y + 16, margin + pWidth, y + 16);

    // ---- PÁGINA 7: Solución (Docente) ----
    doc.addPage();
    drawHeader('Escape Room - Pauta', true);
    y = 35;
    addText('PAUTA DOCENTE - CLAVES DE ESCAPE', 14, 'bold', '#dc2626');
    y += 10;
    addText(`Clave Prueba 1: ${juego.clave1 || 'A'}`, 10, 'bold', '#1e293b');
    y += 4;
    addText(`Clave Prueba 2: ${juego.clave2 || 'B'}`, 10, 'bold', '#1e293b');
    y += 4;
    addText(`Clave Prueba 3 (FINAL): ${juego.clave_final || 'C'}`, 10, 'bold', '#1e293b');
    y += 15;
    addText('Solución Detallada:', 10, 'bold', '#dc2626');
    addText(juego.solucion || 'Detalle de la resolución pedagógica.', 9.5, 'normal', '#334155');

  } else if (motorId === 'bingo') {
    const width = getPageWidth();
    const conceptosList = Array.isArray(juego.conceptos) ? juego.conceptos : ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16'];
    
    // Generar 6 cartones (2 por página, en total 3 páginas)
    let isFirstPage = true;
    for (let cNum = 0; cNum < 6; cNum += 2) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      drawHeader(`Bingo - Cartones ${cNum + 1} y ${cNum + 2}`);
      y = 35;

      // Cartón Superior
      drawDottedRect(margin, y, width, 105);
      let gridY = y + 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(`CARTÓN DE BINGO PEDAGÓGICO N° ${cNum + 1}`, margin + 5, gridY + 5);

      const colW = width / 4;
      const rowH = 18;
      doc.setLineDashPattern([1, 1], 0);
      for (let i = 0; i <= 4; i++) {
        doc.line(margin, gridY + 12 + i * rowH, margin + width, gridY + 12 + i * rowH);
        doc.line(margin + i * colW, gridY + 12, margin + i * colW, gridY + 12 + 4 * rowH);
      }
      doc.setLineDashPattern([], 0);

      let cIndex = cNum * 4;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const concept = conceptosList[(cIndex + r * 4 + c) % conceptosList.length] || 'Didakta';
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          const lines = doc.splitTextToSize(concept, colW - 2);
          lines.forEach((l: string, idx: number) => {
            doc.text(l, margin + c * colW + 2, gridY + 18 + r * rowH + idx * 3.5);
          });
          // Empty circle for marking (Bingo)
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.circle(margin + c * colW + colW - 4.5, gridY + 12 + r * rowH + rowH - 4.5, 2.5);
        }
      }

      // Cartón Inferior
      y += 115;
      drawDottedRect(margin, y, width, 105);
      gridY = y + 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(`CARTÓN DE BINGO PEDAGÓGICO N° ${cNum + 2}`, margin + 5, gridY + 5);

      doc.setLineDashPattern([1, 1], 0);
      for (let i = 0; i <= 4; i++) {
        doc.line(margin, gridY + 12 + i * rowH, margin + width, gridY + 12 + i * rowH);
        doc.line(margin + i * colW, gridY + 12, margin + i * colW, gridY + 12 + 4 * rowH);
      }
      doc.setLineDashPattern([], 0);

      cIndex = (cNum + 1) * 4;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const concept = conceptosList[(cIndex + r * 4 + c) % conceptosList.length] || 'Didakta';
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          const lines = doc.splitTextToSize(concept, colW - 2);
          lines.forEach((l: string, idx: number) => {
            doc.text(l, margin + c * colW + 2, gridY + 18 + r * rowH + idx * 3.5);
          });
          // Empty circle for marking (Bingo)
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.circle(margin + c * colW + colW - 4.5, gridY + 12 + r * rowH + rowH - 4.5, 2.5);
        }
      }
    }

    // ---- PÁGINA 4: Tarjetas de Llamada (Docente) ----
    doc.addPage();
    drawHeader('Bingo - Tarjetas de Llamada', true);
    y = 35;
    addText('TARJETAS DE LLAMADA PARA BINGO', 14, 'bold', '#dc2626');
    y += 10;

    const defsList = Array.isArray(juego.definiciones) ? juego.definiciones : [];
    defsList.forEach((def: any, idx: number) => {
      const cLabel = typeof def === 'object' ? (def.concepto || `Concepto ${idx+1}`) : `Definición ${idx+1}`;
      const dText = typeof def === 'object' ? (def.definicion || '') : def;
      addText(`Definición ${idx + 1}: ${dText}`, 9, 'normal', '#334155');
      addText(`[ Concepto clave: ${cLabel} ]`, 9, 'bold', colorHex);
      y += 4;
    });

  } else if (motorId === 'trivia') {
    const width = getPageWidth();
    const preguntasList = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const respuestasList = Array.isArray(juego.respuestas) ? juego.respuestas : [];
    const categoriasList = Array.isArray(juego.categorias) ? juego.categorias : [];

    const numCards = Math.min(preguntasList.length, 20);
    let isFirstPage = true;
    for (let cIdx = 0; cIdx < numCards; cIdx += 4) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      drawHeader(`Trivia - Tarjetas ${cIdx + 1} a ${Math.min(cIdx + 4, numCards)}`);
      y = 35;

      for (let offsetIdx = 0; offsetIdx < 4; offsetIdx++) {
        const cardNum = cIdx + offsetIdx;
        if (cardNum >= numCards) break;

        const cardY = y;
        drawDottedRect(margin, cardY, width, 55);

        y = cardY + 5;
        const category = categoriasList[cardNum] || 'General';
        addText(`PREGUNTA N° ${cardNum + 1} · Categoría: ${category}`, 9, 'bold', colorHex, margin + 5);
        y += 2;
        addText(`Pregunta: ${preguntasList[cardNum]}`, 9.5, 'normal', '#0f172a', margin + 5);

        // Big "?" in light gray in background of card
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(226, 232, 240);
        doc.text("?", margin + width - 20, cardY + 22);
        
        doc.setDrawColor(226, 232, 240);
        doc.line(margin + 5, cardY + 36, margin + width - 5, cardY + 36);

        y = cardY + 39;
        addText(`Respuesta (al dorso): ${respuestasList[cardNum] || '________________'}`, 9, 'bold', '#475569', margin + 5);

        y = cardY + 60;
      }
    }

    doc.addPage();
    drawHeader('Trivia - Tabla y Clave', true);
    y = 35;
    addText('TABLA DE PUNTUACIÓN DE TRIVIA', 14, 'bold', colorHex);
    y += 6;

    const colW = width / 5;
    doc.rect(margin, y, width, 40);
    doc.line(margin, y + 10, margin + width, y + 10);
    for (let i = 1; i < 5; i++) {
      doc.line(margin + i * colW, y, margin + i * colW, y + 40);
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipo 1', margin + 5, y + 6);
    doc.text('Equipo 2', margin + colW + 5, y + 6);
    doc.text('Equipo 3', margin + 2 * colW + 5, y + 6);
    doc.text('Equipo 4', margin + 3 * colW + 5, y + 6);
    doc.text('Equipo 5', margin + 4 * colW + 5, y + 6);

    y += 55;
    addText('CLAVE DOCENTE DE RESPUESTAS', 12, 'bold', '#dc2626');
    y += 4;
    preguntasList.forEach((preg: string, idx: number) => {
      addText(`Pregunta ${idx + 1}: ${preg}`, 8.5, 'bold', '#1e293b');
      addText(`  Respuesta: ${respuestasList[idx] || 'Sin definir.'}`, 8.5, 'normal', '#16a34a');
      y += 2;
    });

  } else if (motorId === 'cartas') {
    const width = getPageWidth();
    // ---- PÁGINA 1: Portada (BUG 1 FIX) ----
    drawHeader('Cartas - Portada');
    y = 50;
    addText('MAZO DE CARTAS PEDAGÓGICAS', 24, 'bold', colorHex);
    y += 10;
    addText('REI PLAY · JUEGO DE MESA DIDÁCTICO', 10, 'bold', '#64748b');
    y += 30;

    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(1);
    doc.rect(margin, y, width, 55);
    let metaY = y + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(' FICHA TÉCNICA DEL MAZO', margin + 5, metaY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(` Asignatura: Lenguaje y Comunicación`, margin + 5, metaY + 10);
    doc.text(` Nivel / Curso: ${juego.nivel || 'General'}`, margin + 5, metaY + 18);
    doc.text(` Temática / Unidad: ${juego.tema || 'Didáctica'}`, margin + 5, metaY + 26);
    doc.text(` Objetivos de Aprendizaje: ${Array.isArray(juego.oa_codes) ? juego.oa_codes.join(', ') : 'OA'}`, margin + 5, metaY + 34);
    doc.setFont('helvetica', 'bold');
    doc.text(` Establecimiento: LICEO ${establecimiento}`, margin + 5, metaY + 42);

    // ---- PÁGINAS 2-5: Cartas (4 por página, total 16) ----
    const cartas = Array.isArray(juego.cartas) ? juego.cartas : [];
    const numCartas = Math.min(cartas.length, 16);

    for (let pageIdx = 0; pageIdx < numCartas; pageIdx += 4) {
      doc.addPage(); // Se crea la página para las cartas (las cartas empiezan en página 2, evitando la página vacía)
      drawHeader(`Cartas - Mazo de Cartas ${pageIdx + 1} a ${Math.min(pageIdx + 4, numCartas)}`);
      y = 35;

      const cardW = width / 2 - 5;
      const cardH = 110;

      for (let offset = 0; offset < 4; offset++) {
        const itemIdx = pageIdx + offset;
        if (itemIdx >= numCartas) break;

        const cX = margin + (offset % 2) * (cardW + 10);
        const cY = 35 + Math.floor(offset / 2) * (cardH + 10);

        drawDottedRect(cX, cY, cardW, cardH);
        doc.setDrawColor(rAccent, gAccent, bAccent);
        doc.rect(cX + 2, cY + 2, cardW - 4, cardH - 4);

        const activeCard = cartas[itemIdx];

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rAccent, gAccent, bAccent);
        doc.text(activeCard.nombre || 'Personaje', cX + 6, cY + 10);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const attrText = activeCard.atributos || 'Fuerza: 5 | Sabiduría: 8';
        doc.text(attrText, cX + 6, cY + 16);

        doc.setDrawColor(180, 190, 205);
        doc.setFillColor(252, 253, 254);
        doc.setLineDashPattern([3, 3], 0);
        doc.rect(cX + 6, cY + 20, cardW - 12, 35, 'FD');
        doc.setLineDashPattern([], 0); // Restore dash pattern
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text("✏️ Dibuja y colorea", cX + 16, cY + 34);
        doc.text("al personaje aquí", cX + 17, cY + 41);

        // BUG 2 FIX: Evitar overflow de texto y letter-spacing forzado
        let fontSize = 7.5;
        let textToWrap = activeCard.descripcion || activeCard.cita_habilidad || 'Habilidad de la carta descriptiva.';
        doc.setFontSize(fontSize);
        let wrapped = doc.splitTextToSize(textToWrap, cardW - 12);

        if (wrapped.length > 9) {
          fontSize = 6;
          doc.setFontSize(fontSize);
          wrapped = doc.splitTextToSize(textToWrap, cardW - 12);
        }

        if (wrapped.length > 9) {
          wrapped = wrapped.slice(0, 8);
          wrapped[7] = wrapped[7] + '...';
        }

        doc.setFontSize(fontSize);
        doc.setTextColor(30, 41, 59);
        wrapped.forEach((line: string, lineIdx: number) => {
          const lineY = cY + 60 + lineIdx * (fontSize * 0.4 + 2);
          doc.text(line, cX + 6, lineY);
        });
      }
    }

    doc.addPage();
    drawHeader('Cartas - Reglas de Juego');
    y = 35;
    addText('REGLAS DEL MAZO PEDAGÓGICO', 14, 'bold', colorHex);
    y += 5;
    addText(juego.reglas || 'Instrucciones para jugar con el mazo de cartas.', 10, 'normal', '#334155');
    y += 20;

    addText('TABLA DE PUNTUACIÓN DE COMBATES', 12, 'bold', colorHex);
    y += 5;
    doc.rect(margin, y, width, 40);
    doc.line(margin, y + 10, margin + width, y + 10);
    doc.line(margin + width / 2, y, margin + width / 2, y + 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Jugador A', margin + 5, y + 6);
    doc.text('Jugador B', margin + width / 2 + 5, y + 6);

  } else if (motorId === 'memoria') {
    const width = getPageWidth();
    const pares = Array.isArray(juego.pares) ? juego.pares : [];
    const numPares = Math.min(pares.length, 24);

    let isFirstPage = true;
    for (let pageIdx = 0; pageIdx < numPares; pageIdx += 8) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      drawHeader(`Memoria - Tarjetas de Parejas ${pageIdx + 1} a ${Math.min(pageIdx + 8, numPares)}`);
      y = 35;

      const cardW = width / 2 - 5;
      const cardH = 50;

      for (let offset = 0; offset < 8; offset++) {
        const itemIdx = pageIdx + offset;
        if (itemIdx >= numPares) break;

        const cX = margin + (offset % 2) * (cardW + 10);
        const cY = 35 + Math.floor(offset / 2) * (cardH + 10);

        drawDottedRect(cX, cY, cardW, cardH);
        
        const activePar = pares[itemIdx];

        const isConcept = offset % 2 === 0;
        const titleText = isConcept ? `CONCEPTO ${itemIdx + 1}` : `DEFINICIÓN ${itemIdx + 1}`;
        const mainText = isConcept ? (activePar.concepto || '') : (activePar.definicion || '');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rAccent, gAccent, bAccent);
        doc.text(titleText, cX + 6, cY + 10);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        
        const lines = doc.splitTextToSize(mainText, cardW - 12);
        lines.forEach((l: string, idx: number) => {
          doc.text(l, cX + 6, cY + 18 + idx * 4);
        });
      }
    }

    doc.addPage();
    drawHeader('Memoria - Pauta de Pares', true);
    y = 35;
    addText('PAUTA DOCENTE DE EMPAREJAMIENTOS', 14, 'bold', '#dc2626');
    y += 10;

    pares.forEach((p: any, idx: number) => {
      addText(`PAR N° ${idx + 1}:`, 9.5, 'bold', colorHex);
      addText(`  Concepto: ${p.concepto}`, 9, 'bold', '#1e293b');
      addText(`  Definición: ${p.definicion}`, 9, 'normal', '#334155');
      y += 2;
    });

  } else if (motorId === 'clue') {
    const width = getPageWidth();
    // ---- PÁGINA 1: Tablero de la Mansión ----
    drawHeader('CLUE - Tablero');
    y = 35;
    addText(`TABLERO DE LA MANSIÓN: ${juego.nombre_caso || 'Caso sin Título'}`, 14, 'bold', colorHex);
    y += 5;

    // Dibujar 6 habitaciones en cuadrícula 3x2
    const roomW = 54;
    const roomH = 65;
    const startX = margin + 5;
    const startY = y + 10;

    const rooms = juego.distribucion_habitaciones || ["Biblioteca", "Salón", "Comedor", "Jardín", "Cocina", "Bodega"];
    
    // Corredores
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(3);
    doc.line(startX + 10, startY + roomH + 10, startX + 3 * roomW - 10, startY + roomH + 10); // horizontal corridor
    doc.line(startX + roomW + roomW/2, startY + 10, startX + roomW + roomW/2, startY + 2 * roomH + 15); // vertical corridor

    // Dibujar habitaciones
    doc.setLineWidth(0.8);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const roomName = rooms[r * 3 + c] || `Habitación ${r * 3 + c + 1}`;
        const rx = startX + c * (roomW + 5);
        const ry = startY + r * (roomH + 20);

        doc.setDrawColor(rAccent, gAccent, bAccent);
        doc.rect(rx, ry, roomW, roomH);

        // Nombre de habitación
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rAccent, gAccent, bAccent);
        doc.text(roomName, rx + 4, ry + 10);

        // Línea para colocar carta
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text("Evidencia: ________________", rx + 4, ry + 35);
        
        // Simular círculos de sospechosos si corresponde
        if (r === 0 && c === 0) {
          doc.setFillColor(239, 68, 68); // Rojo
          doc.circle(rx + 8, ry + roomH - 8, 3, 'F');
        } else if (r === 0 && c === 2) {
          doc.setFillColor(59, 130, 246); // Azul
          doc.circle(rx + 8, ry + roomH - 8, 3, 'F');
        } else if (r === 1 && c === 0) {
          doc.setFillColor(16, 185, 129); // Verde
          doc.circle(rx + 8, ry + roomH - 8, 3, 'F');
        } else if (r === 1 && c === 2) {
          doc.setFillColor(245, 158, 11); // Naranja
          doc.circle(rx + 8, ry + roomH - 8, 3, 'F');
        }
      }
    }

    // ---- PÁGINA 2: Sospechosos ----
    doc.addPage();
    drawHeader('CLUE - Sospechosos');
    y = 35;
    addText('TARJETAS DE SOSPECHOSOS (Recortables)', 14, 'bold', colorHex);
    y += 10;

    const personajes = Array.isArray(juego.personajes) ? juego.personajes : [];
    const cardW = width / 2 - 5;
    const cardH = 80;

    personajes.forEach((p: any, idx: number) => {
      const cX = margin + (idx % 2) * (cardW + 10);
      const cY = y + Math.floor(idx / 2) * (cardH + 10);

      drawDottedRect(cX, cY, cardW, cardH);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.rect(cX + 2, cY + 2, cardW - 4, cardH - 4);

      // Dibujar etiqueta de sospechoso
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(p.nombre || 'Sospechoso', cX + 6, cY + 12);
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Inicia en: ${p.habitacion_inicial || 'Bodega'}`, cX + 6, cY + 18);

      // Descripción
      doc.setTextColor(51, 65, 85);
      let descLines = doc.splitTextToSize(`Motivo: ${p.motivacion || ''}`, cardW - 12);
      descLines.forEach((l: string, lIdx: number) => {
        doc.text(l, cX + 6, cY + 28 + lIdx * 4);
      });

      // Sospechoso dibuja y colorea
      doc.setDrawColor(180, 190, 205);
      doc.setFillColor(252, 253, 254);
      doc.setLineDashPattern([3, 3], 0);
      doc.rect(cX + 6, cY + 38, cardW - 12, 24, 'FD');
      doc.setLineDashPattern([], 0);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text("✏️ Dibuja al sospechoso aquí", cX + 16, cY + 51);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(p.descripcion || '', cX + 6, cY + 68);
    });

    // ---- PÁGINA 3: Evidencias ----
    doc.addPage();
    drawHeader('CLUE - Evidencias');
    y = 35;
    addText('TARJETAS DE EVIDENCIA (Recortables)', 14, 'bold', colorHex);
    y += 10;

    const evidencias = Array.isArray(juego.evidencias) ? juego.evidencias : [];
    const evW = width / 3 - 4;
    const evH = 65;

    evidencias.forEach((ev: any, idx: number) => {
      const cX = margin + (idx % 3) * (evW + 6);
      const cY = y + Math.floor(idx / 3) * (evH + 10);

      drawDottedRect(cX, cY, evW, evH);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.rect(cX + 2, cY + 2, evW - 4, evH - 4);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(ev.nombre || 'Objeto', cX + 5, cY + 10);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Habitación: ${ev.habitacion || ''}`, cX + 5, cY + 16);

      doc.setTextColor(51, 65, 85);
      const evDesc = doc.splitTextToSize(ev.descripcion || '', evW - 10);
      evDesc.forEach((l: string, lIdx: number) => {
        doc.text(l, cX + 5, cY + 24 + lIdx * 3.5);
      });

      // Determine type of evidence and draw geometric shape in top-right corner
      let shapeType = 'objeto'; // default (square)
      const evName = (ev.nombre || '').toLowerCase();
      const evDescText = (ev.descripcion || '').toLowerCase();
      if (
        evName.includes('habitacion') || evName.includes('habitación') ||
        evName.includes('salon') || evName.includes('salón') ||
        evName.includes('biblioteca') || evName.includes('cocina') ||
        evName.includes('jardin') || evName.includes('jardín') ||
        evName.includes('bodega') || evName.includes('comedor') ||
        evDescText.includes('lugar') || evDescText.includes('habitación')
      ) {
        shapeType = 'lugar'; // circle
      } else if (
        evName.includes('persona') || evName.includes('sospechoso') ||
        evName.includes('testigo') || evName.includes('acusado') ||
        evName.includes('autor') || evName.includes('amigo') ||
        evDescText.includes('persona') || evDescText.includes('testigo')
      ) {
        shapeType = 'persona'; // triangle
      } else {
        // Fallback using index
        if (idx === 2 || idx === 3) shapeType = 'lugar';
        else if (idx === 4 || idx === 5) shapeType = 'persona';
      }

      if (shapeType === 'objeto') {
        doc.setDrawColor(rAccent, gAccent, bAccent);
        doc.setFillColor(255, 255, 255);
        doc.rect(cX + evW - 12, cY + 4, 8, 8);
      } else if (shapeType === 'lugar') {
        doc.setDrawColor(rAccent, gAccent, bAccent);
        doc.setFillColor(255, 255, 255);
        doc.circle(cX + evW - 8, cY + 8, 4);
      } else if (shapeType === 'persona') {
        doc.setDrawColor(rAccent, gAccent, bAccent);
        doc.setFillColor(255, 255, 255);
        const tx1 = cX + evW - 8;
        const ty1 = cY + 4;
        const tx2 = cX + evW - 12;
        const ty2 = cY + 12;
        const tx3 = cX + evW - 4;
        const ty3 = cY + 12;
        doc.triangle(tx1, ty1, tx2, ty2, tx3, ty3);
      }
    });

    // ---- PÁGINA 4: Hoja de Investigación ----
    doc.addPage();
    drawHeader('CLUE - Investigación');
    y = 35;
    addText('HOJA DE INVESTIGACIÓN DEL ALUMNO', 14, 'bold', colorHex);
    y += 5;
    addText('Usa esta tabla para descartar los sospechosos y evidencias mientras juegas.', 9, 'normal', '#64748b');
    y += 5;

    // Tabla
    const rowH = 10;
    const colW = width / 3;
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.rect(margin, y, width, 120);

    // Headers
    doc.line(margin, y + rowH, margin + width, y + rowH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("SOSPECHOSOS", margin + 5, y + 7);
    doc.text("EVIDENCIAS", margin + colW + 5, y + 7);
    doc.text("HABITACIONES", margin + 2 * colW + 5, y + 7);

    // Dividers verticales
    doc.line(margin + colW, y, margin + colW, y + 120);
    doc.line(margin + 2 * colW, y, margin + 2 * colW, y + 120);

    // Rellenar filas vacías de descarte
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    for (let i = 1; i < 11; i++) {
      doc.line(margin, y + i * rowH + rowH, margin + width, y + i * rowH + rowH);
      // Escribir datos
      const sName = personajes[i - 1]?.nombre || '';
      const eName = evidencias[i - 1]?.nombre || '';
      const rName = rooms[i - 1] || '';

      doc.text(sName ? `[  ] ${sName}` : '', margin + 5, y + i * rowH + 7);
      doc.text(eName ? `[  ] ${eName}` : '', margin + colW + 5, y + i * rowH + 7);
      doc.text(rName ? `[  ] ${rName}` : '', margin + 2 * colW + 5, y + i * rowH + 7);
    }

    y += 130;
    addText('🕵️ ACUSACIÓN FINAL:', 11, 'bold', colorHex);
    y += 2;
    addText('Culpable: __________________  Evidencia: __________________  Lugar: __________________', 10, 'normal', '#334155');

    // ---- PÁGINA 5: Reglas ----
    doc.addPage();
    drawHeader('CLUE - Reglas');
    y = 35;
    addText('INSTRUCCIONES DE JUEGO', 14, 'bold', colorHex);
    y += 8;
    addText('1. Preparación: El docente recorta el Sobre de Solución e introduce en él el Culpable, Lugar y Evidencia correctos. Las demás cartas se reparten entre los equipos.', 9.5, 'normal', '#334155');
    addText('2. Cómo jugar: Los alumnos lanzan el dado para moverse entre las habitaciones de la mansión.', 9.5, 'normal', '#334155');
    addText('3. Sugerencia/Acusación: Al entrar a una habitación, el equipo hace una hipótesis pedagógica (ej. "Yo acuso al sospechoso X con la evidencia Y en esta sala").', 9.5, 'normal', '#334155');
    addText('4. Descarte: El equipo a la izquierda debe refutar mostrando en secreto una de las cartas nombradas si la tiene.', 9.5, 'normal', '#334155');
    addText('5. Victoria: El primer equipo en deducir las 3 cartas ocultas en el sobre docente gana.', 9.5, 'normal', '#334155');

    // ---- PÁGINA 6: Solución (Docente) ----
    doc.addPage();
    drawHeader('CLUE - Solución', true);
    y = 35;
    addText('SOBRE DE SOLUCIÓN (CONFIDENCIAL)', 14, 'bold', '#dc2626');
    y += 10;

    const sol = juego.solucion || {};
    addText(`Culpable del Misterio: ${sol.culpable || 'Sin definir'}`, 11, 'bold', '#1e293b');
    addText(`Lugar del Crimen: ${sol.habitacion || 'Sin definir'}`, 11, 'bold', '#1e293b');
    addText(`Evidencia Clave: ${sol.evidencia || 'Sin definir'}`, 11, 'bold', '#1e293b');
    y += 10;
    addText('Explicación y Pauta del Docente:', 10.5, 'bold', '#dc2626');
    addText(sol.explicacion_docente || 'Explicación detallada.', 9.5, 'normal', '#334155');

  } else if (motorId === 'serpiente_escaleras') {
    const width = getPageWidth();
    // ---- PÁGINA 1: Tablero 8x8 ----
    drawHeader('Serpiente y Escaleras - Tablero');
    y = 35;
    addText('TABLERO DE JUEGO: SERPIENTES Y ESCALERAS', 14, 'bold', colorHex);
    y += 4;

    // Centrar tablero de 150x150
    const boardSize = 144;
    const sqSize = boardSize / 8; // 18mm por casilla
    const bx = margin + (width - boardSize) / 2;
    const by = y + 5;

    // Dibujar 8x8
    doc.setLineWidth(0.4);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Mapeo boustrophedon (alternancia de dirección por fila)
        const isRowEven = row % 2 === 0;
        const colIndex = isRowEven ? col : 7 - col;
        const cellNum = (7 - row) * 8 + colIndex + 1;

        const cx = bx + col * sqSize;
        const cy = by + row * sqSize;

        // Alternancia de color
        const isCellBlue = (row + col) % 2 === 0;
        if (isCellBlue) {
          doc.setFillColor(224, 242, 254); // celeste claro
          doc.rect(cx, cy, sqSize, sqSize, 'F');
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(cx, cy, sqSize, sqSize, 'S');

        // Número
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(String(cellNum), cx + 2, cy + 8);

        // Mensaje especial en casillas críticas
        if (cellNum === 1) doc.text("INICIO", cx + 2, cy + 14);
        if (cellNum === 64) doc.text("🌟 META", cx + 1, cy + 14);

        // Pequeño indicador dentro de la celda
        if (cellNum === 4 || cellNum === 20 || cellNum === 45) {
          doc.setFontSize(6);
          doc.setTextColor(16, 185, 129);
          doc.text("▲ ESC", cx + sqSize - 8, cy + sqSize - 2);
        } else if (cellNum === 17 || cellNum === 35 || cellNum === 55) {
          doc.setFontSize(6);
          doc.setTextColor(239, 68, 68);
          doc.text("▼ SERP", cx + sqSize - 9, cy + sqSize - 2);
        }
      }
    }

    // Dibujar Escaleras (Líneas verdes con flecha)
    // Escaleras: 4->14, 20->38, 45->60
    doc.setDrawColor(16, 185, 129); // verde
    doc.setLineWidth(2.5);

    // Función auxiliar para obtener X, Y de la casilla
    const getCellCoords = (num: number) => {
      const index0 = num - 1;
      const row = 7 - Math.floor(index0 / 8);
      const colIndex = Math.floor(index0 / 8) % 2 === 0 ? (index0 % 8) : 7 - (index0 % 8);
      return {
        x: bx + colIndex * sqSize + sqSize / 2,
        y: by + row * sqSize + sqSize / 2
      };
    };

    const escaleras = [
      { from: 4, to: 14 },
      { from: 20, to: 38 },
      { from: 45, to: 60 }
    ];
    escaleras.forEach((esc) => {
      const pFrom = getCellCoords(esc.from);
      const pTo = getCellCoords(esc.to);
      doc.line(pFrom.x, pFrom.y, pTo.x, pTo.y);
      doc.circle(pTo.x, pTo.y, 1.5, 'FD'); // punto de llegada
      
      // Indicador
      doc.setFontSize(6.5);
      doc.setTextColor(16, 185, 129);
      doc.text(`⬆️${esc.to}`, pFrom.x - 4, pFrom.y + 6);
    });

    // Dibujar Serpientes (Líneas rojas onduladas)
    // Serpientes: 17->7, 35->15, 55->30
    doc.setDrawColor(239, 68, 68); // rojo
    doc.setLineWidth(2);
    const serpientes = [
      { from: 17, to: 7 },
      { from: 35, to: 15 },
      { from: 55, to: 30 }
    ];
    serpientes.forEach((serp) => {
      const pFrom = getCellCoords(serp.from); // Cabeza
      const pTo = getCellCoords(serp.to);     // Cola
      // Dibujar línea serpenteante (curva Bezier)
      doc.line(pFrom.x, pFrom.y, pTo.x, pTo.y);
      doc.circle(pFrom.x, pFrom.y, 2, 'FD'); // cabeza

      doc.setFontSize(6.5);
      doc.setTextColor(239, 68, 68);
      doc.text(`⬇️${serp.to}`, pFrom.x - 4, pFrom.y + 6);
    });

    y = by + boardSize + 8;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Instrucciones: Lanza un dado para avanzar. Si caes en casilla con ⬆️ subes. Si es ⬇️ bajas.", margin, y);

    // ---- PÁGINAS 2-3: Tarjetas de Preguntas (20 tarjetas, 6 por página) ----
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const respuestas = Array.isArray(juego.respuestas) ? juego.respuestas : [];
    
    let isFirstPage = true;
    for (let i = 0; i < 20; i += 6) {
      doc.addPage();
      drawHeader(`Trivia - Preguntas ${i + 1} a ${Math.min(i + 6, 20)}`);
      y = 35;

      const cardW = width / 2 - 5;
      const cardH = 65;

      for (let offset = 0; offset < 6; offset++) {
        const idx = i + offset;
        if (idx >= 20) break;

        const cX = margin + (offset % 2) * (cardW + 10);
        const cY = y + Math.floor(offset / 2) * (cardH + 10);

        drawDottedRect(cX, cY, cardW, cardH);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rAccent, gAccent, bAccent);
        doc.text(`PREGUNTA N° ${idx + 1}`, cX + 6, cY + 10);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const wrapped = doc.splitTextToSize(preguntas[idx] || '', cardW - 12);
        wrapped.forEach((l: string, lIdx: number) => {
          doc.text(l, cX + 6, cY + 18 + lIdx * 4);
        });

        doc.setDrawColor(226, 232, 240);
        doc.line(cX + 5, cY + 45, cX + cardW - 5, cY + 45);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);
        doc.text(`Respuesta: ${respuestas[idx] || ''}`, cX + 6, cY + 53);
      }
    }

    // ---- PÁGINA 4: Clave Docente ----
    doc.addPage();
    drawHeader('Serpiente y Escaleras - Pauta', true);
    y = 35;
    addText('SOLUCIONARIO Y CLAVE DOCENTE', 14, 'bold', '#dc2626');
    y += 10;

    preguntas.forEach((p: string, idx: number) => {
      addText(`Pregunta ${idx + 1}: ${p}`, 8.5, 'bold', '#1e293b');
      addText(`  R: ${respuestas[idx]}`, 8.5, 'normal', '#16a34a');
      y += 2;
    });

  } else if (motorId === 'ludo') {
    // ---- PÁGINA 1: Tablero Ludo (Landscape) ----
    doc.addPage('a4', 'landscape');
    const lWidth = getPageWidth();
    drawHeader('Ludo - Tablero');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text("LUDO PEDAGÓGICO", lWidth / 2 + margin, 35, { align: 'center' });
    y = 40;

    // Dibujar Ludo de 135x135 en el centro
    const boardSize = 130;
    const bx = margin + (lWidth - boardSize) / 2;
    const by = y + 5;

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.8);
    doc.rect(bx, by, boardSize, boardSize, 'S');

    // 4 Zonas de las esquinas (patios de salida)
    const yardSize = 50;

    // Rojo (Arriba Izquierda)
    doc.setFillColor(254, 226, 226);
    doc.rect(bx, by, yardSize, yardSize, 'F');
    doc.setFillColor(239, 68, 68);
    doc.rect(bx + 15, by + 15, 20, 20, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("ROJO", bx + 21, by + 27);

    // Azul (Arriba Derecha)
    doc.setFillColor(219, 234, 254);
    doc.rect(bx + boardSize - yardSize, by, yardSize, yardSize, 'F');
    doc.setFillColor(59, 130, 246);
    doc.rect(bx + boardSize - yardSize + 15, by + 15, 20, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("AZUL", bx + boardSize - yardSize + 22, by + 27);

    // Verde (Abajo Izquierda)
    doc.setFillColor(209, 250, 229);
    doc.rect(bx, by + boardSize - yardSize, yardSize, yardSize, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(bx + 15, by + boardSize - yardSize + 15, 20, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("VERDE", bx + 19, by + boardSize - yardSize + 27);

    // Amarillo (Abajo Derecha)
    doc.setFillColor(254, 243, 199);
    doc.rect(bx + boardSize - yardSize, by + boardSize - yardSize, yardSize, yardSize, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect(bx + boardSize - yardSize + 15, by + boardSize - yardSize + 15, 20, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("AMAR", bx + boardSize - yardSize + 21, by + boardSize - yardSize + 27);

    // Centro (Meta)
    doc.setFillColor(241, 245, 249);
    doc.rect(bx + yardSize, by + yardSize, boardSize - 2 * yardSize, boardSize - 2 * yardSize, 'F');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("META", bx + yardSize + 7, by + yardSize + 17);

    // Caminos y casillas
    doc.setLineWidth(0.4);
    doc.setDrawColor(148, 163, 184);

    // Eje horizontal de casillas
    const pathSq = (boardSize - 2 * yardSize) / 3;
    doc.rect(bx + yardSize, by, pathSq, yardSize);
    doc.rect(bx + yardSize + pathSq, by, pathSq, yardSize);
    doc.rect(bx + yardSize + 2 * pathSq, by, pathSq, yardSize);
    
    // Dibujar algunas casillas "❓"
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("❓", bx + yardSize + 12, by + 15);
    doc.text("❓", bx + yardSize + 12, by + 120);

    // ---- PÁGINAS 2-3: Tarjetas (24 en total, 8 por nivel) ----
    doc.addPage('a4', 'portrait');
    const pWidth = getPageWidth();
    
    const faciles = Array.isArray(juego.preguntas_faciles) ? juego.preguntas_faciles : [];
    const medias = Array.isArray(juego.preguntas_medias) ? juego.preguntas_medias : [];
    const dificiles = Array.isArray(juego.preguntas_dificiles) ? juego.preguntas_dificiles : [];
    const respuestas = juego.respuestas || {};

    const allCards = [
      ...faciles.map((p: any, idx: number) => ({ p, r: (respuestas.faciles && respuestas.faciles[idx]) || '', diff: 'FÁCIL', color: '#16a34a' })),
      ...medias.map((p: any, idx: number) => ({ p, r: (respuestas.medias && respuestas.medias[idx]) || '', diff: 'MEDIA', color: '#eab308' })),
      ...dificiles.map((p: any, idx: number) => ({ p, r: (respuestas.dificiles && respuestas.dificiles[idx]) || '', diff: 'DIFÍCIL', color: '#dc2626' }))
    ];

    let isFirstPage = true;
    for (let cIdx = 0; cIdx < allCards.length; cIdx += 8) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      drawHeader(`Ludo - Tarjetas ${cIdx + 1} a ${Math.min(cIdx + 8, allCards.length)}`);
      y = 35;

      const cardW = pWidth / 2 - 5;
      const cardH = 50;

      for (let offset = 0; offset < 8; offset++) {
        const idx = cIdx + offset;
        if (idx >= allCards.length) break;

        const item = allCards[idx];
        const cX = margin + (offset % 2) * (cardW + 10);
        const cY = y + Math.floor(offset / 2) * (cardH + 10);

        drawDottedRect(cX, cY, cardW, cardH);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        const cr = parseInt(item.color.slice(1, 3), 16);
        const cg = parseInt(item.color.slice(3, 5), 16);
        const cb = parseInt(item.color.slice(5, 7), 16);
        doc.setTextColor(cr, cg, cb);
        doc.text(`${item.diff} - Tarjeta N° ${idx + 1}`, cX + 6, cY + 10);

        // Ludo team color indicator in the top-right corner of the card
        doc.setFillColor(cr, cg, cb);
        doc.setDrawColor(cr, cg, cb);
        doc.rect(cX + cardW - 12, cY + 4, 8, 8, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const wrapped = doc.splitTextToSize(item.p || '', cardW - 12);
        wrapped.forEach((l: string, lIdx: number) => {
          doc.text(l, cX + 6, cY + 18 + lIdx * 4);
        });

        doc.setDrawColor(226, 232, 240);
        doc.line(cX + 5, cY + 36, cX + cardW - 5, cY + 36);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);
        doc.text(`R: ${item.r}`, cX + 6, cY + 44);
      }
    }

    // ---- PÁGINA 4: Clave Docente ----
    doc.addPage();
    drawHeader('Ludo - Pauta Docente', true);
    y = 35;
    addText('SOLUCIONARIO DE PREGUNTAS (LUDO)', 14, 'bold', '#dc2626');
    y += 10;

    addText('FÁCILES:', 10.5, 'bold', '#16a34a');
    faciles.forEach((p: any, idx: number) => {
      addText(`  ${idx + 1}. ${p} (R: ${respuestas.faciles ? respuestas.faciles[idx] : ''})`, 8.5, 'normal', '#334155');
    });
    y += 4;

    addText('MEDIAS:', 10.5, 'bold', '#eab308');
    medias.forEach((p: any, idx: number) => {
      addText(`  ${idx + 1}. ${p} (R: ${respuestas.medias ? respuestas.medias[idx] : ''})`, 8.5, 'normal', '#334155');
    });
    y += 4;

    addText('DIFÍCILES:', 10.5, 'bold', '#dc2626');
    dificiles.forEach((p: any, idx: number) => {
      addText(`  ${idx + 1}. ${p} (R: ${respuestas.dificiles ? respuestas.dificiles[idx] : ''})`, 8.5, 'normal', '#334155');
    });
  }

  // 2. DIBUJAR NÚMERO DE PÁGINAS Y PIE EN DOS PASADAS
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }
}
