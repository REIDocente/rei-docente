import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface PreguntaHoja {
  numero: number;
  tipo: 'alternativa' | 'desarrollo';
  puntaje_maximo: number;
}

export interface HojaConfig {
  evaluacionId: string;
  titulo: string;
  curso: string;
  fecha: string;
  preguntas: PreguntaHoja[];
  totalAlternativas: number;
  totalDesarrollo: number;
}

export async function drawHojaPdf(config: HojaConfig): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // 1. MARCADORES DE ESQUINA DE ALTA PRECISIÓN (15x15 mm cuadrados negros en los bordes)
  const markerSize = 15;
  const margin = 10;

  doc.setFillColor(0, 0, 0);
  // Top-Left
  doc.rect(margin, margin, markerSize, markerSize, 'F');
  // Top-Right
  doc.rect(pageWidth - margin - markerSize, margin, markerSize, markerSize, 'F');
  // Bottom-Left
  doc.rect(margin, pageHeight - margin - markerSize, markerSize, markerSize, 'F');
  // Bottom-Right
  doc.rect(pageWidth - margin - markerSize, pageHeight - margin - markerSize, markerSize, markerSize, 'F');

  // 2. ENCABEZADO
  const contentLeft = margin + markerSize + 5;
  const contentRight = pageWidth - margin - markerSize - 5;
  const headerY = margin + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129); // REI Emerald
  doc.text('REÍ · HOJA DE RESPUESTAS', contentLeft, headerY + 5);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Evaluación: ${config.titulo.substring(0, 40)}`, contentLeft, headerY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Curso: ${config.curso}   |   Fecha: ${config.fecha || '____/____/________'}`, contentLeft, headerY + 16);

  // Generar QR Code
  try {
    const qrData = JSON.stringify({
      evaluacion_id: config.evaluacionId,
      curso: config.curso,
      fecha: config.fecha,
    });
    const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 100 });
    doc.addImage(qrDataUrl, 'PNG', contentRight - 20, headerY, 20, 20);
  } catch (err) {
    console.error('Error generando QR:', err);
  }

  // Línea divisora
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin + 5, headerY + 22, pageWidth - margin - 5, headerY + 22);

  // 3. CAMPO DE IDENTIFICACIÓN DEL ESTUDIANTE
  const studentY = headerY + 26;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + 5, studentY, pageWidth - 2 * (margin + 5), 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('Nombre Estudiante: ____________________________________________________', margin + 8, studentY + 6);
  doc.text('N° Lista:', pageWidth - margin - 45, studentY + 6);

  // Cuadro para el N° de Lista escrito por el estudiante
  doc.setDrawColor(71, 85, 105);
  doc.rect(pageWidth - margin - 30, studentY + 2, 18, 10);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('(Escriba aquí)', pageWidth - margin - 29, studentY + 11);

  // 4. SECCIÓN ALTERNATIVAS
  let currentY = studentY + 18;
  const pregAlternativas = config.preguntas.filter(p => p.tipo === 'alternativa');
  const totalAlt = pregAlternativas.length;

  if (totalAlt > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`SECCIÓN 1 — ALTERNATIVAS (${totalAlt} preguntas)`, margin + 5, currentY);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Rellene completamente con lápiz negro la burbuja de la opción elegida.', margin + 80, currentY);

    currentY += 4;

    const useTwoColumns = totalAlt > 15;
    const colWidth = useTwoColumns ? (pageWidth - 2 * margin - 20) / 2 : pageWidth - 2 * margin - 20;
    const halfCount = useTwoColumns ? Math.ceil(totalAlt / 2) : totalAlt;

    const options = ['A', 'B', 'C', 'D'];
    const circleRadius = 2.2;

    for (let i = 0; i < totalAlt; i++) {
      const p = pregAlternativas[i];
      const isCol2 = useTwoColumns && i >= halfCount;
      const indexInCol = isCol2 ? i - halfCount : i;

      const rowX = isCol2 ? margin + 10 + colWidth + 10 : margin + 15;
      const rowY = currentY + indexInCol * 7;

      // Número de pregunta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`${p.numero}.`, rowX, rowY + 3);

      // Círculos A, B, C, D
      options.forEach((opt, optIdx) => {
        const cx = rowX + 14 + optIdx * 13;
        const cy = rowY + 1.8;

        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(0.4);
        doc.circle(cx, cy, circleRadius, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(opt, cx - 1, cy + 1);
      });
    }

    const rowsCount = useTwoColumns ? halfCount : totalAlt;
    currentY += rowsCount * 7 + 4;
  }

  // 5. SECCIÓN DESARROLLO
  const pregDesarrollo = config.preguntas.filter(p => p.tipo === 'desarrollo');
  if (pregDesarrollo.length > 0 && currentY < pageHeight - margin - markerSize - 20) {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 5, currentY, pageWidth - margin - 5, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`SECCIÓN 2 — PREGUNTAS DE DESARROLLO (${pregDesarrollo.length} preguntas)`, margin + 5, currentY);
    currentY += 4;

    const availableHeight = pageHeight - margin - markerSize - 10 - currentY;
    const heightPerQuestion = Math.max(18, Math.min(35, availableHeight / pregDesarrollo.length - 6));

    pregDesarrollo.forEach(p => {
      if (currentY + heightPerQuestion < pageHeight - margin - markerSize - 5) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Pregunta ${p.numero} — Desarrollo (${p.puntaje_maximo} pt${p.puntaje_maximo > 1 ? 's' : ''})`, margin + 5, currentY + 3);

        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin + 5, currentY + 5, pageWidth - 2 * (margin + 5), heightPerQuestion, 1.5, 1.5, 'S');

        // Líneas punteadas interiores para guiar la escritura
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.3);
        const lineSpacing = 7;
        for (let ly = currentY + 12; ly < currentY + 5 + heightPerQuestion - 2; ly += lineSpacing) {
          doc.line(margin + 8, ly, pageWidth - margin - 8, ly);
        }

        currentY += heightPerQuestion + 8;
      }
    });
  }

  return doc;
}
