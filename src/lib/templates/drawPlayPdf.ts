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
    doc.text("REI PLAY", margin + 5, 17);

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
    const footerText = `Generado con REI Docente · LICEO ${establecimiento}`;
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
    const estaciones = Array.isArray(juego.estaciones) ? juego.estaciones : [];
    const oaListDet = Array.isArray(juego.objetivos_aprendizaje) ? juego.objetivos_aprendizaje : [];

    // ---- PÁGINA 1: Portada ----
    drawHeader('Detective REI - Portada');
    y = 45;
    addText(juego.nombre_caso || 'Expediente sin Titulo', 22, 'bold', colorHex);
    y += 6;
    addText('DETECTIVE REI · EXPEDIENTE DE INVESTIGACION POR ESTACIONES', 9, 'bold', '#64748b');
    y += 14;

    // Nota metodologica
    if (juego.nota_metodologica) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const nmLines = doc.splitTextToSize(`Nota: ${juego.nota_metodologica}`, width);
      nmLines.forEach((l: string) => { doc.text(l, margin, y); y += 4; });
      y += 4;
    }

    // Ficha de investigador
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.8);
    doc.rect(margin, y, width, 68);
    y += 8;
    addText('EXPEDIENTE DE INVESTIGACION PEDAGOGICA', 10, 'bold', colorHex, margin + 5);
    y += 2;
    addText(`Asignatura: Lengua y Literatura`, 9.5, 'normal', '#334155', margin + 5);
    addText(`Nivel: ${juego.nivel || (oaListDet.length > 0 ? '' : 'General')}`, 9.5, 'normal', '#334155', margin + 5);
    addText(`Investigador(a): ________________________________________`, 9.5, 'bold', '#1e293b', margin + 5);
    addText(`Equipo N°: _______`, 9.5, 'normal', '#334155', margin + 5);
    addText(`Fecha: _____ / _____ / 2026`, 9.5, 'normal', '#334155', margin + 5);
    y += 4;
    addText('Roles: Lector/a  |  Analista  |  Secretario/a  |  Encargado/a de pistas  |  Portavoz', 8.5, 'bold', colorHex, margin + 5);

    // Objetivo
    y += 14;
    addText('OBJETIVO DE LA INVESTIGACION:', 10, 'bold', colorHex);
    y += 2;
    addText(juego.objetivo_investigacion || 'El equipo debe construir una hipotesis fundamentada sobre el tema central.', 9.5, 'normal', '#334155');

    // Codigo final tracker
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text('REGISTRO DE CODIGOS:', margin, y);
    y += 6;
    const codigoFinalLetras = juego.codigo_final ? juego.codigo_final.split('') : ['_', '_', '_', '_', '_', '_'];
    for (let ci = 0; ci < 6; ci++) {
      const bx = margin + ci * 22;
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.6);
      doc.rect(bx, y, 18, 10);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Est. ${ci + 1}`, bx + 1, y + 4);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(bx + 2, y + 8, bx + 16, y + 8);
      doc.setLineDashPattern([], 0);
    }

    // ---- PÁGINA 2: Mapa de Estaciones (Landscape) ----
    doc.addPage('a4', 'landscape');
    const lWidth = getPageWidth();
    drawHeader('Detective REI - Mapa de Estaciones');
    y = 30;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text('CIRCUITO DE ESTACIONES', lWidth / 2 + margin, y, { align: 'center' });
    y += 6;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(juego.nombre_caso || '', lWidth / 2 + margin, y, { align: 'center' });
    y += 4;

    // 6 estaciones: 3 columnas × 2 filas
    const stW = (lWidth - 20) / 3;
    const stH = 65;
    const stGap = 10;
    const stStartX = margin;
    const stStartY = 42;

    for (let si = 0; si < 6; si++) {
      const col = si % 3;
      const row = Math.floor(si / 3);
      const sx = stStartX + col * (stW + stGap / 3);
      const sy = stStartY + row * (stH + stGap);
      const est = estaciones[si] || {};

      // Fondo de estacion
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.7);
      doc.rect(sx, sy, stW, stH, 'FD');

      // Cabecera coloreada
      doc.setFillColor(rAccent, gAccent, bAccent);
      doc.rect(sx, sy, stW, 13, 'F');

      // Numero y nombre
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`ESTACION ${si + 1}`, sx + 4, sy + 6);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      const stNombreLines = doc.splitTextToSize(est.nombre || `Estacion ${si + 1}`, stW - 8);
      doc.text(stNombreLines[0] || '', sx + 4, sy + 11);

      // OA vinculado
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`OA: ${est.oa_vinculado || ''}`, sx + 4, sy + 20);

      // Duracion
      doc.text('Duracion: 6-8 min', sx + 4, sy + 27);

      // Codigo
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('Codigo desbloqueado:', sx + 4, sy + 36);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.4);
      doc.rect(sx + 4, sy + 39, 14, 10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('_', sx + 9, sy + 46);

      // Flecha de rotacion (entre estaciones horizontales)
      if (col < 2) {
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.5);
        const arrowX = sx + stW + 1;
        const arrowY = sy + stH / 2;
        doc.line(arrowX, arrowY, arrowX + stGap / 3 - 1, arrowY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);
        doc.text('>', arrowX + stGap / 3 - 3, arrowY + 1.5);
      }
    }

    // Flecha de rotacion entre filas
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Los equipos rotan en orden cada 6-8 minutos al toque de senal del docente.', margin, stStartY + 2 * stH + stGap + 8);

    // OA block en mapa
    if (oaListDet.length > 0) {
      const oaBlockY = stStartY + 2 * stH + stGap + 14;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('OBJETIVOS DE APRENDIZAJE:', margin, oaBlockY);
      let oaY2 = oaBlockY + 5;
      oaListDet.forEach((oa: any) => {
        const origenLbl = oa.origen === 'sugerido_ia' ? ' [sugerido]' : oa.origen === 'planificacion' ? ' [planificacion]' : ' [seleccionado]';
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rAccent, gAccent, bAccent);
        doc.text(`${oa.codigo}${origenLbl}`, margin, oaY2);
        oaY2 += 4;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const oaDescLines = doc.splitTextToSize(oa.descripcion || '', lWidth - 20);
        oaDescLines.slice(0, 2).forEach((l: string) => { doc.text(l, margin + 4, oaY2); oaY2 += 4; });
      });
    }

    // ---- PÁGINA 3: Reglas del Expediente ----
    doc.addPage('a4', 'portrait');
    const pWidth = getPageWidth();
    drawHeader('Detective REI - Reglas');
    y = 35;
    addText('REGLAS DEL EXPEDIENTE DE INVESTIGACION', 13, 'bold', colorHex);
    y += 6;

    addText('MATERIALES NECESARIOS', 10, 'bold', colorHex);
    y += 2;
    addText('Tarjetas de estacion (una por puesto), hoja de Expediente Final por equipo, lapiz o boligrafo.', 9.5, 'normal', '#334155');
    y += 6;

    addText('ORGANIZACION DEL CURSO', 10, 'bold', colorHex);
    y += 2;
    addText('6 equipos de 4 a 6 integrantes. Cada equipo comienza en una estacion diferente.', 9.5, 'normal', '#334155');
    y += 6;

    addText('ROLES DENTRO DE CADA EQUIPO', 10, 'bold', colorHex);
    y += 2;
    const roles = [
      ['Lector/a', 'Lee en voz alta la pista de la estacion.'],
      ['Analista', 'Propone la respuesta al desafio pedagogico.'],
      ['Secretario/a', 'Registra la respuesta y el codigo desbloqueado.'],
      ['Encargado/a de pistas', 'Verifica que la pista fue revisada antes de responder.'],
      ['Portavoz', 'Presenta el Expediente Final al curso al terminar.'],
    ];
    roles.forEach(([rol, desc]) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(`${rol}:`, margin + 4, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(desc, margin + 38, y);
      y += 6;
    });

    y += 4;
    addText('MECANICA DE ROTACION', 10, 'bold', colorHex);
    y += 2;
    addText('1. El docente da la senal de inicio. Cada equipo tiene 6 a 8 minutos por estacion.', 9.5, 'normal', '#334155');
    addText('2. El equipo lee la pista, discute y responde el desafio pedagogico.', 9.5, 'normal', '#334155');
    addText('3. Al resolver el desafio, el equipo desbloquea una letra-codigo y la anota.', 9.5, 'normal', '#334155');
    addText('4. Al toque de senal, todos los equipos rotan a la siguiente estacion.', 9.5, 'normal', '#334155');
    addText('5. Al completar las 6 estaciones, cada equipo construye su Expediente Final.', 9.5, 'normal', '#334155');
    y += 6;

    addText('CONTEXTO DEL CASO', 10, 'bold', colorHex);
    y += 2;
    addText(juego.contexto_narrativo || '', 9.5, 'normal', '#334155');
    y += 6;

    addText('OBJETIVO DE LA INVESTIGACION', 10, 'bold', colorHex);
    y += 2;
    addText(juego.objetivo_investigacion || '', 9.5, 'bold', '#1e293b');

    // ---- PÁGINAS 4-9: Estaciones 1-6 ----
    estaciones.forEach((est: any, idx: number) => {
      doc.addPage('a4', 'portrait');
      drawHeader(`Detective REI - Estacion ${idx + 1}`);
      y = 35;

      // Cabecera de estacion
      doc.setFillColor(rAccent, gAccent, bAccent);
      doc.rect(margin, y, pWidth, 14, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`ESTACION ${idx + 1}: ${(est.nombre || '').toUpperCase()}`, margin + 6, y + 10);
      y += 20;

      // OA vinculado
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(`OA trabajado: ${est.oa_vinculado || ''}`, margin, y);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Duracion: 6-8 minutos  |  Roles: todos activos', margin + 80, y);
      y += 8;

      // PISTA
      const pista = est.pista || {};
      const tipoEv = pista.tipo_evidencia || 'recreacion_pedagogica';
      const contenido = pista.contenido || '';
      const fuente = pista.fuente || {};

      // Etiqueta tipo evidencia
      const tipoLabel = tipoEv === 'cita_textual' ? 'CITA TEXTUAL' : tipoEv === 'parafrasis' ? 'PARAFRASIS' : 'RECREACION PEDAGOGICA';
      const tipoColor = tipoEv === 'cita_textual' ? '#166534' : tipoEv === 'parafrasis' ? '#1e3a5f' : '#92400e';
      const [tr, tg, tb] = [parseInt(tipoColor.slice(1,3),16), parseInt(tipoColor.slice(3,5),16), parseInt(tipoColor.slice(5,7),16)];

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(tr, tg, tb);
      doc.text(`PISTA [${tipoLabel}]`, margin, y);
      y += 5;

      // Caja de pista
      const pistaBoxH = 38;
      doc.setFillColor(250, 252, 255);
      doc.setDrawColor(tr, tg, tb);
      doc.setLineWidth(0.6);
      doc.rect(margin, y, pWidth, pistaBoxH, 'FD');
      y += 6;

      const textoPista = tipoEv === 'cita_textual' ? `"${contenido}"` : contenido;
      const pistaStyle = tipoEv === 'cita_textual' ? 'italic' : 'normal';
      doc.setFontSize(9.5);
      doc.setFont('helvetica', pistaStyle);
      doc.setTextColor(30, 41, 59);
      const pistaLines = doc.splitTextToSize(textoPista, pWidth - 10);
      pistaLines.slice(0, 4).forEach((l: string) => { doc.text(l, margin + 5, y); y += 5; });

      // Fuente (solo cita_textual)
      if (tipoEv === 'cita_textual' && (fuente.obra || fuente.capitulo || fuente.pagina)) {
        const fuenteStr = [fuente.obra, fuente.autor, fuente.capitulo ? `Cap. ${fuente.capitulo}` : '', fuente.pagina ? `p. ${fuente.pagina}` : '', fuente.ubicacion].filter(Boolean).join(' - ');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text(`Fuente: ${fuenteStr}`, margin + 5, y);
        y += 4;
      }

      // Advertencia recreacion
      if (tipoEv === 'recreacion_pedagogica') {
        y = margin + 35 + pistaBoxH + 8;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(146, 64, 14);
        const advLines = doc.splitTextToSize('Advertencia: Esta pista es una recreacion pedagogica inspirada en el material de estudio. No corresponde a una cita textual de la obra o fuente original.', pWidth);
        advLines.forEach((l: string) => { doc.text(l, margin, y); y += 3.5; });
      } else {
        y = margin + 35 + pistaBoxH + 6;
      }
      y += 6;

      // DESAFIO
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('DESAFIO PEDAGOGICO:', margin, y);
      y += 6;
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const desafioLines = doc.splitTextToSize(est.desafio || '', pWidth);
      desafioLines.forEach((l: string) => { doc.text(l, margin, y); y += 5.5; });
      y += 4;

      // Espacio de respuesta
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('Respuesta del equipo:', margin, y);
      y += 5;
      doc.setDrawColor(180, 190, 210);
      doc.setLineWidth(0.3);
      for (let li = 0; li < 4; li++) {
        doc.line(margin, y + li * 8, margin + pWidth, y + li * 8);
      }
      y += 38;

      // Codigo desbloqueado
      doc.setFillColor(rAccent, gAccent, bAccent);
      doc.rect(margin, y, pWidth, 16, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('CODIGO DESBLOQUEADO AL RESOLVER:', margin + 6, y + 7);
      doc.setFontSize(10);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.rect(margin + pWidth - 20, y + 2, 14, 12);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 220, 255);
      doc.text('letra aqui', margin + pWidth - 19, y + 10);
    });

    // ---- PÁGINA 10: Expediente Final ----
    doc.addPage('a4', 'portrait');
    drawHeader('Detective REI - Expediente Final');
    y = 35;
    addText('EXPEDIENTE FINAL DEL EQUIPO', 13, 'bold', colorHex);
    y += 4;

    const ef = juego.expediente_final || {};
    if (ef.instruccion) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      const instrLines = doc.splitTextToSize(ef.instruccion, pWidth);
      instrLines.forEach((l: string) => { doc.text(l, margin, y); y += 4.5; });
      y += 4;
    }

    // Codigo final
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text('CODIGO FINAL  (6 letras en orden):', margin, y);
    y += 6;
    for (let ci2 = 0; ci2 < 6; ci2++) {
      const bx2 = margin + ci2 * 22;
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.7);
      doc.rect(bx2, y, 18, 14);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Est.${ci2 + 1}`, bx2 + 1, y + 4);
    }
    y += 20;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Palabra formada: ________________________', margin + 138, y - 7);
    y += 4;

    // Hipotesis
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.5);
    const hipBoxY = y;
    doc.rect(margin, hipBoxY, pWidth, 50, 'FD');
    y += 7;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text(ef.hipotesis_guia || 'Hipotesis del equipo:', margin + 4, y);
    y += 6;
    for (let li = 0; li < 3; li++) {
      doc.setDrawColor(180, 190, 210);
      doc.setLineWidth(0.25);
      doc.line(margin + 4, y + li * 9, margin + pWidth - 4, y + li * 9);
    }
    y = hipBoxY + 55;

    // Fundamentos
    for (let fi = 1; fi <= 2; fi++) {
      const fBoxY = y;
      doc.setFillColor(250, 252, 255);
      doc.setDrawColor(180, 190, 210);
      doc.setLineWidth(0.4);
      doc.rect(margin, fBoxY, pWidth, 32, 'FD');
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text(fi === 1 ? (ef.fundamento_guia || `Fundamento ${fi} (cita, dato o episodio del material):`) : `Fundamento 2:`, margin + 4, y);
      y += 5;
      for (let li = 0; li < 2; li++) {
        doc.setDrawColor(180, 190, 210);
        doc.setLineWidth(0.25);
        doc.line(margin + 4, y + li * 8, margin + pWidth - 4, y + li * 8);
      }
      y = fBoxY + 36;
    }

    // Conclusion
    const conBoxY = y;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.5);
    doc.rect(margin, conBoxY, pWidth, 32, 'FD');
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text(ef.conclusion_guia || 'Conclusion: ¿como conecta tu hipotesis con los temas del material?', margin + 4, y);
    y += 5;
    for (let li = 0; li < 2; li++) {
      doc.setDrawColor(180, 190, 210);
      doc.setLineWidth(0.25);
      doc.line(margin + 4, y + li * 8, margin + pWidth - 4, y + li * 8);
    }

    // ---- PÁGINA 11: Ticket de Salida ----
    doc.addPage('a4', 'portrait');
    drawHeader('Detective REI - Ticket de Salida');
    y = 35;
    addText('TICKET DE SALIDA: METACOGNICION DEL EQUIPO', 13, 'bold', colorHex);
    y += 6;
    const ticketListDet = Array.isArray(juego.ticket) ? juego.ticket : [];
    ticketListDet.forEach((q: any, idx: number) => {
      const qText = typeof q === 'string' ? q : (q.pregunta || String(q));
      addText(`${idx + 1}. ${qText}`, 10, 'bold', '#1e293b');
      y += 2;
      doc.setDrawColor(200, 210, 230);
      doc.setLineWidth(0.25);
      for (let li = 0; li < 3; li++) {
        doc.line(margin, y + li * 9, margin + pWidth, y + li * 9);
      }
      y += 30;
    });

    // Autoevaluacion colaborativa
    y += 4;
    addText('AUTOEVALUACION DEL TRABAJO EN EQUIPO', 10, 'bold', colorHex);
    y += 2;
    addText('¿Todos los integrantes participaron activamente? ¿Que rol fue mas desafiante y por que?', 9.5, 'normal', '#334155');
    y += 6;
    doc.setDrawColor(200, 210, 230);
    doc.setLineWidth(0.25);
    for (let li = 0; li < 3; li++) {
      doc.line(margin, y + li * 9, margin + pWidth, y + li * 9);
    }

    // ---- PÁGINA 12: Guia Docente (Confidencial) ----
    doc.addPage('a4', 'portrait');
    drawHeader('Detective REI - Guia Docente', true);
    y = 35;

    const addDocText = (text: string, size: number, style = 'normal', colorHexD = '#334155') => {
      if (!text) return;
      doc.setFontSize(size);
      doc.setFont('helvetica', style);
      const [rd, gd, bd] = [parseInt(colorHexD.slice(1,3),16), parseInt(colorHexD.slice(3,5),16), parseInt(colorHexD.slice(5,7),16)];
      doc.setTextColor(rd, gd, bd);
      const dLines = doc.splitTextToSize(text, pWidth);
      dLines.forEach((l: string) => { doc.text(l, margin, y); y += size * 0.38 + 3.5; });
    };

    addDocText('GUIA DOCENTE - USO EXCLUSIVO', 13, 'bold', '#dc2626');
    y += 4;

    // OA section
    if (oaListDet.length > 0) {
      addDocText('OBJETIVOS DE APRENDIZAJE VINCULADOS', 10, 'bold', colorHex);
      oaListDet.forEach((oa: any) => {
        const origenLblDoc = oa.origen === 'sugerido_ia' ? ' [OA sugerido - verificar]' : oa.origen === 'planificacion' ? ' [de planificacion]' : ' [seleccionado]';
        addDocText(`${oa.codigo}${origenLblDoc}:`, 9, 'bold', '#dc2626');
        addDocText(oa.descripcion || '', 9, 'normal', '#334155');
        y += 2;
      });
      y += 4;
    }

    // Respuestas por estacion
    const sol = juego.solucion || {};
    const respEstaciones = Array.isArray(sol.respuestas_estaciones) ? sol.respuestas_estaciones : [];

    addDocText('RESPUESTAS ESPERADAS POR ESTACION', 10, 'bold', colorHex);
    y += 2;
    respEstaciones.forEach((re: any) => {
      addDocText(`ESTACION ${re.estacion} - Codigo: [${re.codigo_letra || '_'}]`, 9, 'bold', '#1e293b');
      addDocText(`Respuesta esperada: ${re.respuesta_esperada || ''}`, 9, 'normal', '#334155');
      addDocText(`Criterio de aceptacion: ${re.criterio_aceptacion || ''}`, 8.5, 'italic', '#64748b');
      y += 3;
    });

    y += 2;
    if (sol.codigo_final_verificado) {
      addDocText(`CODIGO FINAL VERIFICADO: ${sol.codigo_final_verificado}`, 10, 'bold', '#dc2626');
      y += 2;
    }

    addDocText('HIPOTESIS CENTRAL (referencia)', 10, 'bold', colorHex);
    addDocText(sol.hipotesis_central || '', 9.5, 'normal', '#334155');
    y += 2;

    addDocText('HIPOTESIS ALTERNATIVAS VALIDAS', 10, 'bold', colorHex);
    addDocText(sol.hipotesis_alternativas || '', 9.5, 'normal', '#334155');
    y += 2;

    addDocText('EXPLICACION PEDAGOGICA (segun OA seleccionados)', 10, 'bold', colorHex);
    addDocText(sol.explicacion_pedagogica || '', 9.5, 'normal', '#334155');
    y += 2;

    if (sol.nota_responsabilidad) {
      addDocText('NOTA SOBRE RESPONSABILIDAD', 9, 'bold', '#dc2626');
      addDocText(sol.nota_responsabilidad, 9, 'normal', '#334155');
      y += 2;
    }

    addDocText('RUBRICA DE EVALUACION DEL EXPEDIENTE FINAL', 10, 'bold', colorHex);
    y += 2;
    if (sol.rubrica) {
      addDocText('NIVEL 3 - Logrado:', 9, 'bold', '#166534');
      addDocText(sol.rubrica.nivel3 || '', 9, 'normal', '#334155');
      y += 2;
      addDocText('NIVEL 2 - En proceso:', 9, 'bold', '#92400e');
      addDocText(sol.rubrica.nivel2 || '', 9, 'normal', '#334155');
      y += 2;
      addDocText('NIVEL 1 - Inicial:', 9, 'bold', '#dc2626');
      addDocText(sol.rubrica.nivel1 || '', 9, 'normal', '#334155');
    }

  } else if (motorId === 'escape_room') {
    const width = getPageWidth();
    // ---- PÁGINA 1: Misión ----
    drawHeader('Escape Room - Misión');
    y = 45;
    addText('INSTRUCCIONES DE ESCAPE ROOM', 16, 'bold', colorHex);
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
    const duracionText = `Tiempo estimado: ${juego.duracion || 45} minutos`;
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
      addText(`CÓDIGO DE ACCESO PRUEBA ${p.id}`, 8, 'bold', '#64748b', margin + 55);
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
        doc.text("Dibuja y colorea", cX + 16, cY + 34);
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
    const rooms: string[] = Array.isArray(juego.habitaciones)
      ? juego.habitaciones.map((h: any) => h.nombre || '')
      : (Array.isArray(juego.distribucion_habitaciones) ? juego.distribucion_habitaciones : ['Biblioteca', 'Salon', 'Comedor', 'Jardin', 'Cocina', 'Bodega']);
    const personajes = Array.isArray(juego.personajes) ? juego.personajes : [];
    const evidencias = Array.isArray(juego.evidencias) ? juego.evidencias : [];
    const habitacionesData = Array.isArray(juego.habitaciones) ? juego.habitaciones : [];
    const sol = juego.solucion || {};

    // Colores de ficha por sospechoso (sin emojis)
    const fichaColors: [number, number, number][] = [
      [239, 68, 68],   // rojo
      [59, 130, 246],  // azul
      [16, 185, 129],  // verde
      [245, 158, 11],  // naranja
    ];
    const fichaLabels = ['ROJO', 'AZUL', 'VERDE', 'NARANJA'];

    // ---- PÁGINA 1: Tablero de la Mansión ----
    drawHeader('CLUE - Tablero');
    y = 35;
    addText(`TABLERO: ${juego.nombre_caso || 'Caso sin Titulo'}`, 13, 'bold', colorHex);
    y += 3;

    const roomW = 54;
    const roomH = 62;
    const startX = margin + 2;
    const startY = y + 6;
    const corridorW = 5;

    // Fondo del tablero
    doc.setFillColor(248, 250, 252);
    doc.rect(startX - 2, startY - 2, 3 * roomW + 2 * corridorW + 4, 2 * roomH + corridorW + 4, 'F');

    // Corredor horizontal central
    doc.setFillColor(220, 230, 220);
    doc.rect(startX, startY + roomH, 3 * roomW + 2 * corridorW, corridorW, 'F');
    // Corredor vertical central
    doc.rect(startX + roomW, startY, corridorW, 2 * roomH + corridorW, 'F');
    doc.rect(startX + 2 * roomW + corridorW, startY, corridorW, 2 * roomH + corridorW, 'F');

    // Dibuja flechas de corredor
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(rAccent, gAccent, bAccent);

    // Habitaciones
    doc.setLineWidth(0.7);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const roomIdx = r * 3 + c;
        const roomName = rooms[roomIdx] || `Habitacion ${roomIdx + 1}`;
        const rx = startX + c * (roomW + corridorW);
        const ry = startY + r * (roomH + corridorW);
        const [fr, fg, fb] = fichaColors[roomIdx % fichaColors.length];

        // Fondo de habitación
        doc.setFillColor(240, 248, 240);
        doc.setDrawColor(rAccent, gAccent, bAccent);
        doc.rect(rx, ry, roomW, roomH, 'FD');

        // Cabecera coloreada
        doc.setFillColor(rAccent, gAccent, bAccent);
        doc.rect(rx, ry, roomW, 11, 'F');

        // Nombre de habitación
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(roomName, rx + 4, ry + 8);

        // Numero de habitacion
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 220, 200);
        doc.text(String(roomIdx + 1), rx + roomW - 14, ry + roomH - 5);

        // Linea "Evidencia aqui"
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('Carta evidencia:', rx + 4, ry + 22);
        doc.setDrawColor(180, 200, 180);
        doc.setLineWidth(0.3);
        doc.line(rx + 4, ry + 26, rx + roomW - 4, ry + 26);
        doc.line(rx + 4, ry + 32, rx + roomW - 4, ry + 32);

        // Puerta (indicador de entrada)
        doc.setFillColor(fr, fg, fb);
        doc.setLineWidth(0.5);
        if (r === 0) {
          // puerta abajo
          doc.rect(rx + roomW / 2 - 4, ry + roomH - 2, 8, 2, 'F');
        } else {
          // puerta arriba
          doc.rect(rx + roomW / 2 - 4, ry, 8, 2, 'F');
        }

        // Posicion inicial de ficha del sospechoso con ese indice
        const susIdx = personajes.findIndex((p: any) =>
          (p.habitacion_inicial || '').toLowerCase() === roomName.toLowerCase()
        );
        if (susIdx >= 0) {
          const [cr, cg, cb] = fichaColors[susIdx % fichaColors.length];
          doc.setFillColor(cr, cg, cb);
          doc.circle(rx + roomW - 8, ry + 18, 3.5, 'F');
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(fichaLabels[susIdx % fichaLabels.length].slice(0, 1), rx + roomW - 9.5, ry + 19.5);
        }
      }
    }

    // Leyenda
    const legX = startX;
    const legY = startY + 2 * roomH + corridorW + 10;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text('LEYENDA:', legX, legY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    const leyendaItems = [
      'Las puertas de color indican por donde se entra a cada habitacion.',
      'El circulo de color muestra la posicion inicial del sospechoso de ese color.',
      'Los pasillos grises conectan las habitaciones. Para moverse: lanza el dado y avanza ese numero de pasos.',
      'Un paso = cruzar un pasillo o entrar/salir de una habitacion.',
    ];
    leyendaItems.forEach((item, i) => {
      doc.text(`- ${item}`, legX, legY + 6 + i * 5);
    });

    // Nota ficcion
    y = legY + 36;
    if (juego.nota_ficcion) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      const notaLines = doc.splitTextToSize(`Nota: ${juego.nota_ficcion}`, width);
      notaLines.forEach((l: string, li: number) => {
        doc.text(l, startX, y + li * 4);
      });
      y += notaLines.length * 4 + 3;
    }

    // Bloque de Objetivos de Aprendizaje
    const oaList = Array.isArray(juego.objetivos_aprendizaje) ? juego.objetivos_aprendizaje : [];
    if (oaList.length > 0) {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.4);
      const oaBlockY = y;
      // Calcular alto del bloque
      let oaBlockH = 10;
      oaList.forEach((oa: any) => {
        const lines = doc.splitTextToSize(`${oa.codigo}: ${oa.descripcion || ''}`, width - 14);
        oaBlockH += lines.length * 3.8 + 3;
      });
      doc.rect(startX, oaBlockY, width + 2, oaBlockH, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('OBJETIVOS DE APRENDIZAJE VINCULADOS:', startX + 4, oaBlockY + 7);

      let oaY = oaBlockY + 13;
      oaList.forEach((oa: any) => {
        const origenLabel = oa.origen === 'sugerido_ia' ? ' [sugerido]'
          : oa.origen === 'planificacion' ? ' [planificacion]'
          : oa.origen === 'seleccion_docente' ? ' [seleccionado]'
          : '';
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rAccent, gAccent, bAccent);
        doc.text(`${oa.codigo}${origenLabel}:`, startX + 4, oaY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const descLines = doc.splitTextToSize(oa.descripcion || '', width - 14);
        descLines.forEach((l: string, li: number) => {
          doc.text(l, startX + 4, oaY + 4 + li * 3.8);
        });
        oaY += 4 + descLines.length * 3.8 + 3;
      });
    }

    // ---- PÁGINA 2: Sospechosos ----
    doc.addPage();
    drawHeader('CLUE - Sospechosos');
    y = 35;
    addText('TARJETAS DE SOSPECHOSOS  (recorta por la linea punteada)', 13, 'bold', colorHex);
    y += 6;

    const cardW = width / 2 - 6;
    const cardH = 88;

    personajes.forEach((p: any, idx: number) => {
      const cX = margin + (idx % 2) * (cardW + 12);
      const cY = y + Math.floor(idx / 2) * (cardH + 8);
      const [cr, cg, cb] = fichaColors[idx % fichaColors.length];

      drawDottedRect(cX, cY, cardW, cardH);
      doc.setFillColor(248, 252, 248);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.6);
      doc.rect(cX + 1.5, cY + 1.5, cardW - 3, cardH - 3, 'FD');

      // Cabecera de color
      doc.setFillColor(cr, cg, cb);
      doc.rect(cX + 1.5, cY + 1.5, cardW - 3, 13, 'F');
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(p.nombre || 'Sospechoso', cX + 6, cY + 11);

      // Etiqueta color (ficha)
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`FICHA ${fichaLabels[idx % fichaLabels.length]}`, cX + cardW - 22, cY + 11);

      // Habitacion inicial
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Inicia en: ${p.habitacion_inicial || 'Biblioteca'}`, cX + 6, cY + 20);

      // Rol en obra
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      const rolLines = doc.splitTextToSize(`Rol: ${p.rol_en_contenido || p.rol_en_obra || p.descripcion || ''}`, cardW - 12);
      rolLines.slice(0, 2).forEach((l: string, li: number) => {
        doc.text(l, cX + 6, cY + 27 + li * 4);
      });

      // Motivacion / influencia
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const motivLines = doc.splitTextToSize(`Influencia: ${p.motivacion || ''}`, cardW - 12);
      motivLines.slice(0, 3).forEach((l: string, li: number) => {
        doc.text(l, cX + 6, cY + 39 + li * 4.2);
      });

      // Campo "Indicio textual" (reemplaza el espacio de dibujo)
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('Indicio textual encontrado:', cX + 6, cY + 57);
      doc.setDrawColor(180, 200, 180);
      doc.setLineWidth(0.3);
      doc.line(cX + 6, cY + 63, cX + cardW - 6, cY + 63);
      doc.line(cX + 6, cY + 69, cX + cardW - 6, cY + 69);
      doc.line(cX + 6, cY + 75, cX + cardW - 6, cY + 75);

      // Descripcion en cursiva al fondo
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      const descLines = doc.splitTextToSize(p.descripcion || '', cardW - 12);
      descLines.slice(0, 1).forEach((l: string, li: number) => {
        doc.text(l, cX + 6, cY + cardH - 7 + li * 4);
      });
    });

    // ---- PÁGINA 3: Evidencias ----
    doc.addPage();
    drawHeader('CLUE - Evidencias');
    y = 35;
    addText('TARJETAS DE EVIDENCIA  (recorta por la linea punteada)', 13, 'bold', colorHex);
    y += 3;
    if (juego.nota_ficcion) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      const nfLines = doc.splitTextToSize(`Nota: ${juego.nota_ficcion}`, width);
      nfLines.forEach((l: string, li: number) => {
        doc.text(l, margin, y + li * 3.8);
      });
      y += 7;
    }
    y += 3;

    const evW = width / 3 - 4;
    const evH = 68;

    evidencias.forEach((ev: any, idx: number) => {
      const cX = margin + (idx % 3) * (evW + 6);
      const cY = y + Math.floor(idx / 3) * (evH + 8);

      drawDottedRect(cX, cY, evW, evH);
      doc.setFillColor(248, 252, 248);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.6);
      doc.rect(cX + 1.5, cY + 1.5, evW - 3, evH - 3, 'FD');

      // Cabecera
      doc.setFillColor(rAccent, gAccent, bAccent);
      doc.rect(cX + 1.5, cY + 1.5, evW - 3, 11, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const nombreLines = doc.splitTextToSize(ev.nombre || 'Objeto', evW - 10);
      nombreLines.slice(0, 2).forEach((l: string, li: number) => {
        doc.text(l, cX + 5, cY + 8 + li * 4);
      });

      // Habitacion
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Hab.: ${ev.habitacion || ''}`, cX + 5, cY + 18);

      // Descripcion
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const evDesc = doc.splitTextToSize(ev.descripcion || '', evW - 10);
      evDesc.slice(0, 3).forEach((l: string, li: number) => {
        doc.text(l, cX + 5, cY + 26 + li * 4);
      });

      // Relevancia pedagogica
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(rAccent, gAccent, bAccent);
      const relLines = doc.splitTextToSize(ev.relevancia_pedagogica || '', evW - 10);
      relLines.slice(0, 2).forEach((l: string, li: number) => {
        doc.text(l, cX + 5, cY + evH - 12 + li * 3.5);
      });
    });

    // ---- PÁGINA 4: Tarjetas de Habitaciones (con desafíos) ----
    doc.addPage();
    drawHeader('CLUE - Habitaciones');
    y = 35;
    addText('TARJETAS DE HABITACIONES  (recorta por la linea punteada)', 13, 'bold', colorHex);
    y += 3;
    addText('El docente coloca una tarjeta de evidencia boca abajo en cada habitacion. Antes de plantear su hipotesis, el equipo debe responder el desafio de la tarjeta.', 8, 'normal', '#64748b');
    y += 6;

    const habW = width / 2 - 6;
    const habH = 95;

    habitacionesData.forEach((hab: any, idx: number) => {
      const cX = margin + (idx % 2) * (habW + 12);
      const cY = y + Math.floor(idx / 2) * (habH + 6);

      drawDottedRect(cX, cY, habW, habH);
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(rAccent, gAccent, bAccent);
      doc.setLineWidth(0.6);
      doc.rect(cX + 1.5, cY + 1.5, habW - 3, habH - 3, 'FD');

      // Cabecera
      doc.setFillColor(rAccent, gAccent, bAccent);
      doc.rect(cX + 1.5, cY + 1.5, habW - 3, 14, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(hab.nombre || `Habitacion ${idx + 1}`, cX + 6, cY + 11);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`HAB. N${idx + 1}`, cX + habW - 20, cY + 11);

      // Etiqueta desafio
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('DESAFIO LITERARIO:', cX + 6, cY + 23);

      // Texto del desafio
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const desafioLines = doc.splitTextToSize(hab.desafio || 'Responde la pregunta del docente.', habW - 12);
      desafioLines.slice(0, 6).forEach((l: string, li: number) => {
        doc.text(l, cX + 6, cY + 30 + li * 4.5);
      });

      // Espacio de respuesta
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('Respuesta del equipo:', cX + 6, cY + 61);
      doc.setDrawColor(180, 200, 180);
      doc.setLineWidth(0.3);
      doc.line(cX + 6, cY + 66, cX + habW - 6, cY + 66);
      doc.line(cX + 6, cY + 72, cX + habW - 6, cY + 72);

      // Pista
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(rAccent, gAccent, bAccent);
      doc.text('PISTA (si responde bien):', cX + 6, cY + 80);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(51, 65, 85);
      const pistaLines = doc.splitTextToSize(hab.pista || '', habW - 12);
      pistaLines.slice(0, 2).forEach((l: string, li: number) => {
        doc.text(l, cX + 6, cY + 86 + li * 4);
      });
    });

    // ---- PÁGINA 5: Hoja de Investigación ----
    doc.addPage();
    drawHeader('CLUE - Investigacion');
    y = 35;
    addText('HOJA DE INVESTIGACION  (una por equipo)', 13, 'bold', colorHex);
    y += 3;
    addText('Marca con X las cartas que has visto o que te mostraron. La solucion es la carta que NADIE puede mostrar.', 8.5, 'normal', '#64748b');
    y += 6;

    // Tabla de descarte - 4 columnas: Sospechosos, Evidencias, Habitaciones, Quien mostro
    const rowHInv = 9;
    const col4W = [width * 0.28, width * 0.25, width * 0.23, width * 0.24];
    const col4X = [margin, margin + col4W[0], margin + col4W[0] + col4W[1], margin + col4W[0] + col4W[1] + col4W[2]];
    const tableH = 12 * rowHInv + rowHInv;

    // Fondo tabla
    doc.setFillColor(248, 252, 248);
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, width, tableH, 'FD');

    // Header row
    doc.setFillColor(rAccent, gAccent, bAccent);
    doc.rect(margin, y, width, rowHInv, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    ['SOSPECHOSOS', 'EVIDENCIAS', 'HABITACIONES', 'QUIEN LO MOSTRO?'].forEach((h, hi) => {
      doc.text(h, col4X[hi] + 3, y + 6.5);
    });

    // Divisores verticales
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.3);
    col4X.slice(1).forEach(cx => {
      doc.line(cx, y, cx, y + tableH);
    });

    // Filas de datos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const maxRows = Math.max(personajes.length, evidencias.length, rooms.length, 6);
    for (let i = 0; i < maxRows; i++) {
      const rowY = y + rowHInv + i * rowHInv;
      doc.setDrawColor(200, 220, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, rowY + rowHInv, margin + width, rowY + rowHInv);

      doc.setTextColor(71, 85, 105);
      const sName = personajes[i]?.nombre || '';
      const eName = evidencias[i]?.nombre || '';
      const rName = rooms[i] || '';

      if (sName) doc.text(`[ ] ${sName}`, col4X[0] + 3, rowY + 6.5);
      if (eName) {
        const eLines = doc.splitTextToSize(`[ ] ${eName}`, col4W[1] - 6);
        doc.text(eLines[0], col4X[1] + 3, rowY + 6.5);
      }
      if (rName) doc.text(`[ ] ${rName}`, col4X[2] + 3, rowY + 6.5);
      // Linea para quien mostro
      doc.setDrawColor(180, 200, 180);
      doc.setLineWidth(0.2);
      doc.line(col4X[3] + 3, rowY + 7, col4X[3] + col4W[3] - 4, rowY + 7);
    }

    y += tableH + 10;

    // Acusación final mejorada
    addText('ACUSACION FINAL  (completa cuando estes listo/a para acusar)', 10, 'bold', colorHex);
    y += 3;

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, width, 50, 'FD');

    doc.setFontSize(8);
    // Etiqueta dinámica según tipo_misterio del juego
    const etiquetaHip = juego.etiqueta_hipotesis || 'Hipotesis:';
    const etiquetaSos = juego.etiqueta_sospechosos || 'El elemento';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text(`${etiquetaHip}:`, margin + 5, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(etiquetaSos, margin + 5, y + 17);
    doc.line(margin + 5 + doc.getTextWidth(etiquetaSos) + 2, y + 18, margin + 90, y + 18);
    doc.text(', evidencia:', margin + 91, y + 17);
    doc.line(margin + 115, y + 18, margin + width - 5, y + 18);

    doc.text('Habitacion:', margin + 5, y + 25);
    doc.line(margin + 32, y + 26, margin + 90, y + 26);
    doc.text('¿Como se relaciona?', margin + 91, y + 25);
    doc.line(margin + 130, y + 26, margin + width - 5, y + 26);

    doc.line(margin + 5, y + 33, margin + width - 5, y + 33);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text('Fundamento 1 (cita, dato o episodio del material):', margin + 5, y + 40);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.line(margin + 5, y + 47, margin + width - 5, y + 47);

    y += 55;
    doc.setFillColor(248, 252, 248);
    doc.rect(margin, y, width, 25, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text('Fundamento 2:', margin + 5, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.line(margin + 5, y + 14, margin + width - 5, y + 14);
    doc.text('¿Como el material revisado apoya tu conclusion?', margin + 5, y + 21);
    doc.line(margin + 100, y + 21, margin + width - 5, y + 21);

    // ---- PÁGINA 6: Reglas ----
    doc.addPage();
    drawHeader('CLUE - Reglas del Juego');
    y = 35;
    addText('INSTRUCCIONES COMPLETAS', 13, 'bold', colorHex);
    y += 5;

    // Materiales
    addText('MATERIALES NECESARIOS', 10, 'bold', colorHex);
    y += 2;
    const materiales = [
      '1 dado de 6 caras (no incluido, aportado por el docente)',
      '1 ficha de color por equipo: rojo, azul, verde y naranja (monedas, botones u objetos similares)',
      '1 sobre de papel para guardar la solucion docente (sellado antes de la partida)',
      'Hojas de investigacion impresas (1 por equipo)',
      'Tijeras para recortar las tarjetas de sospechosos, evidencias y habitaciones',
    ];
    materiales.forEach(m => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const mLines = doc.splitTextToSize(`- ${m}`, width - 5);
      mLines.forEach((l: string) => {
        doc.text(l, margin + 3, y);
        y += 4.5;
      });
    });

    y += 4;
    addText('CUANTOS JUGADORES: 2 a 4 equipos de 2 a 3 alumnos cada uno.', 9, 'normal', '#334155');
    addText('DURACION: 45 o 90 minutos segun la configuracion elegida.', 9, 'normal', '#334155');

    y += 4;
    addText('PREPARACION (hace el docente antes de clase)', 10, 'bold', colorHex);
    y += 2;
    const prepSteps = [
      'Imprime y recorta todas las tarjetas: 4 sospechosos, 6 evidencias y 6 habitaciones.',
      'Escoge al azar 1 tarjeta de sospechoso, 1 de evidencia y 1 de habitacion. Colocalas dentro del sobre sellado sin que nadie las vea. Esa es la solucion.',
      'Coloca las tarjetas de habitaciones sobre el tablero, una por habitacion, boca arriba (lado desafio visible).',
      'Reparte TODAS las tarjetas restantes (sospechosos + evidencias) de forma equitativa entre los equipos. Cada equipo las guarda en secreto.',
      'Cada equipo coloca su ficha en la habitacion inicial indicada en la tarjeta del sospechoso que mas tiene.',
    ];
    prepSteps.forEach((s, si) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const sLines = doc.splitTextToSize(`${si + 1}. ${s}`, width - 5);
      sLines.forEach((l: string) => {
        doc.text(l, margin + 3, y);
        y += 4.5;
      });
    });

    y += 4;
    addText('DESARROLLO DE UN TURNO', 10, 'bold', colorHex);
    y += 2;
    const turnSteps = [
      'El equipo en turno lanza el dado y mueve su ficha ese numero de pasos (pasillos o entradas).',
      'Si el equipo entra a una habitacion, DEBE responder el desafio literario de esa tarjeta.',
      'Si responde correctamente, recibe la pista de la habitacion y puede hacer una sugerencia: nombra un sospechoso, una evidencia y esa habitacion.',
      'El equipo a la izquierda revisa si tiene alguna de las 3 cartas nombradas. Si tiene alguna, muestra en secreto UNA sola al equipo que pregunta. El equipo que pregunta marca esa carta como descartada en su hoja.',
      'Si nadie puede mostrar ninguna carta, todos lo saben y eso es informacion valiosa.',
      'El turno pasa al siguiente equipo a la izquierda.',
    ];
    turnSteps.forEach((s, si) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const sLines = doc.splitTextToSize(`${si + 1}. ${s}`, width - 5);
      sLines.forEach((l: string) => {
        doc.text(l, margin + 3, y);
        y += 4.5;
      });
    });

    y += 4;
    addText('ACUSACION FINAL Y VICTORIA', 10, 'bold', colorHex);
    y += 2;
    const victSteps = [
      'Cuando un equipo cree saber la solucion, puede hacer una acusacion final EN CUALQUIER TURNO (no necesita estar en una habitacion).',
      'La acusacion final incluye: sospechoso + evidencia + habitacion + una hipotesis escrita en la hoja de investigacion (con 2 fundamentos textuales).',
      'El docente abre el sobre en secreto y verifica. Si es correcta: ese equipo gana.',
      'Si la acusacion es incorrecta: ese equipo ya no puede acusar de nuevo, pero sigue jugando y mostrando cartas a otros equipos. El juego continua.',
      'Si ningún equipo acierta, el docente revela la solucion y se discute en plenario.',
    ];
    victSteps.forEach((s, si) => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const sLines = doc.splitTextToSize(`${si + 1}. ${s}`, width - 5);
      sLines.forEach((l: string) => {
        doc.text(l, margin + 3, y);
        y += 4.5;
      });
    });

    // Ejemplo de turno
    y += 4;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(rAccent, gAccent, bAccent);
    doc.setLineWidth(0.4);
    const ejY = y;
    doc.rect(margin, ejY, width, 28, 'FD');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rAccent, gAccent, bAccent);
    doc.text('EJEMPLO DE TURNO:', margin + 5, ejY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const ejHab = rooms[0] || 'Habitacion 1';
    const ejSos = personajes[0]?.nombre || 'Sospechoso 1';
    const ejEv = evidencias[2]?.nombre || 'Evidencia 3';
    const ejTexto = `El Equipo Rojo lanza el dado y saca 4. Mueve su ficha 4 pasos y entra a ${ejHab}. Lee el desafio de la tarjeta y el equipo debate la respuesta. Recibe la pista. Luego dice: "Sugerimos a ${ejSos}, con ${ejEv}, en ${ejHab}". El equipo a la izquierda revisa sus cartas: tiene "${ejEv}", la muestra en secreto al Equipo Rojo. El Equipo Rojo marca "${ejEv}" como descartada en su hoja de investigacion.`;
    const ejLines = doc.splitTextToSize(ejTexto, width - 12);
    ejLines.forEach((l: string, li: number) => {
      doc.text(l, margin + 5, ejY + 14 + li * 4.5);
    });

    // ---- PÁGINA 7: Guía Docente / Sobre de Solución ----
    doc.addPage();
    drawHeader('CLUE - Guia Docente', true);
    y = 35;
    addText('GUIA DOCENTE  (USO EXCLUSIVO - NO DISTRIBUIR)', 13, 'bold', '#dc2626');
    y += 5;

    // Sobre de solucion
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.7);
    doc.rect(margin, y, width, 35, 'FD');
    addText('SOBRE DE SOLUCION', 11, 'bold', '#dc2626');
    y += 4;
    addText(`Hipotesis pedagogica central: ${sol.hipotesis_central || sol.culpable || 'Sin definir'}`, 10, 'bold', '#1e293b');
    addText(`Habitacion: ${sol.habitacion || 'Sin definir'}`, 10, 'bold', '#1e293b');
    addText(`Evidencia: ${sol.evidencia || 'Sin definir'}`, 10, 'bold', '#1e293b');
    y += 4;

    // Rol del personaje
    addText('ROL DEL SOSPECHOSO EN LA LECTURA DE CASTEL:', 9.5, 'bold', '#dc2626');
    addText(sol.justificacion_hipotesis || sol.rol_del_personaje || sol.explicacion_docente || '', 9, 'normal', '#334155');
    y += 3;

    // Hipotesis alternativas
    if (sol.hipotesis_alternativas) {
      addText('HIPOTESIS ALTERNATIVAS VALIDAS:', 9.5, 'bold', '#dc2626');
      addText(sol.hipotesis_alternativas, 9, 'normal', '#334155');
      y += 3;
    }

    // Explicacion pedagogica
    addText('EXPLICACION PEDAGOGICA (segun OA seleccionados):', 9.5, 'bold', '#dc2626');
    addText(sol.explicacion_docente || '', 9, 'normal', '#334155');
    y += 5;

    // Rubrica
    // OA en guía docente (antes de la rúbrica)
    const oaListDoc = Array.isArray(juego.objetivos_aprendizaje) ? juego.objetivos_aprendizaje : [];
    if (oaListDoc.length > 0) {
      addText('OBJETIVOS DE APRENDIZAJE VINCULADOS:', 9.5, 'bold', '#dc2626');
      y += 2;
      oaListDoc.forEach((oa: any) => {
        const origenLabel = oa.origen === 'sugerido_ia' ? ' [OA sugerido por IA - verificar]'
          : oa.origen === 'planificacion' ? ' [de planificacion]'
          : oa.origen === 'seleccion_docente' ? ' [seleccionado por docente]'
          : '';
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${oa.codigo}${origenLabel}`, margin + 5, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const dLines = doc.splitTextToSize(oa.descripcion || '', width - 10);
        dLines.forEach((l: string) => { doc.text(l, margin + 8, y); y += 4.2; });
        y += 2;
      });
      y += 4;
    }

    if (sol.rubrica) {
      addText('RUBRICA DE EVALUACION', 10, 'bold', colorHex);
      y += 2;

      const rubRects: Array<{ nivel: string; desc: string; color: [number, number, number] }> = [
        { nivel: 'NIVEL 3 - Logrado', desc: sol.rubrica.nivel3 || '', color: [22, 101, 52] },
        { nivel: 'NIVEL 2 - En proceso', desc: sol.rubrica.nivel2 || '', color: [146, 64, 14] },
        { nivel: 'NIVEL 1 - Inicial', desc: sol.rubrica.nivel1 || '', color: [185, 28, 28] },
      ];

      rubRects.forEach(rr => {
        const rrY = y;
        doc.setFillColor(248, 252, 248);
        doc.setDrawColor(rr.color[0], rr.color[1], rr.color[2]);
        doc.setLineWidth(0.4);
        const descLines2 = doc.splitTextToSize(rr.desc, width - 40);
        const rrH = 10 + descLines2.length * 4.5;
        doc.rect(margin, rrY, width, rrH, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rr.color[0], rr.color[1], rr.color[2]);
        doc.text(rr.nivel, margin + 5, rrY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        descLines2.forEach((l: string, li: number) => {
          doc.text(l, margin + 38, rrY + 8 + li * 4.5);
        });
        y += rrH + 3;
      });
    }

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
        if (cellNum === 64) doc.text("META", cx + 1, cy + 14);

        // Pequeño indicador dentro de la celda
        if (cellNum === 4 || cellNum === 20 || cellNum === 45) {
          doc.setFontSize(6);
          doc.setTextColor(16, 185, 129);
          doc.text("^ ESC", cx + sqSize - 8, cy + sqSize - 2);
        } else if (cellNum === 17 || cellNum === 35 || cellNum === 55) {
          doc.setFontSize(6);
          doc.setTextColor(239, 68, 68);
          doc.text("v SERP", cx + sqSize - 9, cy + sqSize - 2);
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
      doc.text(`^${esc.to}`, pFrom.x - 4, pFrom.y + 6);
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
      doc.text(`v${serp.to}`, pFrom.x - 4, pFrom.y + 6);
    });

    y = by + boardSize + 8;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text("Instrucciones: Lanza un dado para avanzar. Si caes en casilla con (^) subes por escalera. Si es (v) bajas por serpiente.", margin, y);

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
    // ---- PÁGINA 1: Tablero Ludo ----
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
    
    // Dibujar algunas casillas "?"
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("?", bx + yardSize + 12, by + 15);
    doc.text("?", bx + yardSize + 12, by + 120);

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
