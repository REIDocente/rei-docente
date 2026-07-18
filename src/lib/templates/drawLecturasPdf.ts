import { jsPDF } from 'jspdf';

interface DrawLecturasPdfParams {
  doc: jsPDF;
  tipo: string;
  subtipo?: string;
  libroTitulo: string;
  libroAutor: string;
  content: string; // texto de Claude
  docenteNombre?: string;
  establecimiento?: string;
}

export function drawLecturasPdf({
  doc,
  tipo,
  subtipo,
  libroTitulo,
  libroAutor,
  content,
  docenteNombre = 'Docente',
  establecimiento = 'RIGOBERTO FONTT IZQUIERDO'
}: DrawLecturasPdfParams) {
  const margin = 15;
  let y = 15;

  const getPageWidth = () => doc.internal.pageSize.getWidth() - 2 * margin;
  const getPageHeight = () => doc.internal.pageSize.getHeight();

  const drawHeader = (title: string, isDocente = false) => {
    const pWidth = getPageWidth();
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(margin, 10, pWidth, 12);
    doc.line(margin + 30, 10, margin + 30, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 101, 52); // verde didakta
    doc.text("DIDAKTA LECTURAS", margin + 5, 17);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`${establecimiento} | ${title.toUpperCase()}`, margin + 33, 17);

    if (isDocente) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text("USO EXCLUSIVO DOCENTE", margin + pWidth - 45, 17);
    }
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const pageHeight = getPageHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const footerText = `Generado con Didakta Lecturas · LICEO ${establecimiento}`;
    doc.text(footerText, margin, pageHeight - 10);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  };

  const addText = (text: string, size: number, style = 'normal', color = [15, 23, 42], xPos = margin) => {
    if (!text) return;
    const pHeight = getPageHeight();
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, getPageWidth() - (xPos - margin));
    lines.forEach((line: string) => {
      if (y > pHeight - 20) {
        doc.addPage();
        drawHeader(tipo);
        y = 35;
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(color[0], color[1], color[2]);
      }
      doc.text(line, xPos, y);
      y += size * 0.4 + 4;
    });
  };

  const drawTitle = (text: string, subtitleText = '') => {
    // Portada
    drawHeader(tipo);
    y = 55;
    addText(text.toUpperCase(), 22, 'bold', [22, 101, 52]);
    y += 5;
    if (subtitleText) {
      addText(subtitleText, 10.5, 'bold', [100, 116, 139]);
      y += 15;
    }

    doc.setDrawColor(22, 101, 52);
    doc.setLineWidth(1);
    doc.rect(margin, y, getPageWidth(), 50);
    let metaY = y + 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(' FICHA TÉCNICA Y METADATOS', margin + 5, metaY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(` Libro: ${libroTitulo}`, margin + 5, metaY + 10);
    doc.text(` Autor: ${libroAutor}`, margin + 5, metaY + 18);
    doc.text(` Docente: ${docenteNombre}`, margin + 5, metaY + 26);
    doc.text(` Establecimiento: LICEO ${establecimiento}`, margin + 5, metaY + 34);
    doc.setFont('helvetica', 'bold');
    doc.text(` Didakta Planificaciones Domiciliarias 2026`, margin + 5, metaY + 42);
    
    doc.addPage();
    drawHeader(tipo);
    y = 35;
  };

  // ── PARSEAR E IMPRIMIR SEGÚN TIPO ──
  if (tipo === 'planificacion') {
    drawTitle(`Planificación de Lectura Domiciliaria`, `${libroTitulo} — ${libroAutor}`);

    // Parsear el texto por párrafos
    const lines = content.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('SESIÓN') || trimmed.startsWith('SESION')) {
        y += 10;
        addText(trimmed, 13, 'bold', [22, 101, 52]); // verde didakta
        y += 2;
      } else if (trimmed.startsWith('OBJETIVOS') || trimmed.startsWith('PLANIFICACIÓN')) {
        y += 10;
        addText(trimmed, 14, 'bold', [30, 41, 59]);
        y += 2;
      } else if (trimmed.startsWith('- ')) {
        addText(trimmed, 10, 'normal', [51, 65, 85], margin + 5);
      } else {
        addText(trimmed, 10, 'normal', [15, 23, 42]);
      }
    });

  } else if (tipo === 'guia') {
    drawTitle(`Guía de Comprensión Lectora`, `${libroTitulo} — ${libroAutor}`);

    const lines = content.split('\n');
    let isDocente = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detectar pauta docente
      if (trimmed.includes('PAUTA DOCENTE') || trimmed.includes('USO EXCLUSIVO DOCENTE')) {
        isDocente = true;
        doc.addPage();
        drawHeader('Pauta de Guía de Lectura', true);
        y = 35;
        // Borde rojo docente
        doc.setDrawColor(220, 38, 38);
        doc.rect(margin - 2, 28, getPageWidth() + 4, getPageHeight() - 40);
        addText(trimmed, 15, 'bold', [220, 38, 38]);
        y += 5;
        return;
      }

      if (trimmed.startsWith('ACTIVACIÓN') || trimmed.includes('Antes de leer')) {
        y += 10;
        addText(trimmed, 13, 'bold', [30, 58, 95]); // azul
        y += 2;
      } else if (trimmed.startsWith('DURANTE') || trimmed.includes('Durante la lectura')) {
        y += 10;
        addText(trimmed, 13, 'bold', [22, 101, 52]); // verde
        y += 2;
      } else if (trimmed.startsWith('DESPUÉS') || trimmed.includes('Después de la lectura')) {
        y += 10;
        addText(trimmed, 13, 'bold', [194, 65, 12]); // naranja
        y += 2;
      } else {
        // Dibujar líneas para respuestas del alumno si no es la pauta docente
        addText(trimmed, 10, 'normal', isDocente ? [51, 65, 85] : [15, 23, 42]);
        if (!isDocente && (trimmed.startsWith('Pregunta') || trimmed.match(/^\d+\./))) {
          y += 2;
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y + 4, margin + getPageWidth(), y + 4);
          doc.line(margin, y + 10, margin + getPageWidth(), y + 10);
          y += 16;
        }
      }
    });

  } else if (tipo === 'banco_preguntas') {
    drawTitle(`Banco de Preguntas Taxonómicas`, `${libroTitulo} — ${libroAutor}`);

    const lines = content.split('\n');
    let isDocente = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.includes('CLAVE DE RESPUESTAS') || trimmed.includes('PAUTA')) {
        isDocente = true;
        doc.addPage();
        drawHeader('Pauta de Respuestas', true);
        y = 35;
        addText(trimmed, 14, 'bold', [220, 38, 38]);
        y += 5;
        return;
      }

      if (trimmed.startsWith('NIVEL LITERAL')) {
        y += 10;
        addText(trimmed, 13, 'bold', [30, 41, 59]); // gris oscuro
        y += 2;
      } else if (trimmed.startsWith('NIVEL INFERENCIAL')) {
        y += 10;
        addText(trimmed, 13, 'bold', [30, 58, 95]); // azul
        y += 2;
      } else if (trimmed.startsWith('NIVEL CRÍTICO')) {
        y += 10;
        addText(trimmed, 13, 'bold', [194, 65, 12]); // naranja
        y += 2;
      } else if (trimmed.startsWith('NIVEL VALORATIVO')) {
        y += 10;
        addText(trimmed, 13, 'bold', [22, 101, 52]); // verde
        y += 2;
      } else if (trimmed.startsWith('NIVEL CREATIVO')) {
        y += 10;
        addText(trimmed, 13, 'bold', [147, 51, 234]); // morado
        y += 2;
      } else {
        addText(trimmed, 9.5, 'normal', [51, 65, 85]);
      }
    });

  } else if (tipo === 'evaluacion') {
    const subLabel = subtipo ? `Evaluación: ${subtipo.replace('_', ' ').toUpperCase()}` : 'Evaluación General';
    drawTitle(subLabel, `${libroTitulo} — ${libroAutor}`);

    const lines = content.split('\n');
    let isDocente = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.includes('CLAVE') || trimmed.includes('PAUTA') || trimmed.includes('USO EXCLUSIVO DOCENTE')) {
        isDocente = true;
        doc.addPage();
        drawHeader('Pauta Evaluación', true);
        y = 35;
        addText(trimmed, 14, 'bold', [220, 38, 38]);
        y += 5;
        return;
      }

      if (trimmed.startsWith('PREGUNTAS') || trimmed.startsWith('PARTE')) {
        y += 10;
        addText(trimmed, 12, 'bold', [22, 101, 52]);
        y += 2;
      } else if (trimmed.startsWith('INSTRUCCIONES')) {
        addText(trimmed, 9.5, 'bold', [100, 116, 139]);
        y += 4;
      } else {
        addText(trimmed, 9.5, 'normal', [15, 23, 42]);
      }
    });

  } else if (tipo === 'rubrica') {
    drawTitle(`Rúbrica Evaluativa`, `${libroTitulo} — ${libroAutor}`);

    const lines = content.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('MATRIZ') || trimmed.startsWith('RÚBRICA')) {
        y += 8;
        addText(trimmed, 13, 'bold', [22, 101, 52]);
        y += 2;
      } else {
        addText(trimmed, 9.5, 'normal', [51, 65, 85]);
      }
    });

  } else if (tipo === 'experiencia') {
    const subLabel = subtipo ? `Experiencia Creativa: ${subtipo.toUpperCase()}` : 'Experiencia Didáctica';
    drawHeader(tipo);
    y = 55;
    addText(subLabel, 20, 'bold', [22, 101, 52]);
    y += 5;
    addText(`Libro: ${libroTitulo} — ${libroAutor}`, 10.5, 'bold', [100, 116, 139]);
    y += 20;

    const lines = content.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('FICHA') || trimmed.startsWith('INSTRUCCIONES') || trimmed.startsWith('PAUTA') || trimmed.startsWith('RÚBRICA')) {
        y += 8;
        addText(trimmed, 12, 'bold', [22, 101, 52]);
        y += 2;
      } else {
        addText(trimmed, 9.5, 'normal', [51, 65, 85]);
      }
    });
  }

  // 2. DIBUJAR NÚMERO DE PÁGINAS Y PIE EN DOS PASADAS
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }
}
