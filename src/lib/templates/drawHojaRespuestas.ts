import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface Estudiante {
  nombre: string;
  numero_lista: number;
  rut?: string;
}

export async function drawHojaRespuestas(config: {
  analisisId: string;
  titulo: string;
  nivel: string;
  establecimiento: string;
  nombreDocente: string;
  fecha: string;
  nPreguntasSM: number;
  nPreguntasDesarrollo: number;
  estudiantes: Estudiante[];
}): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { analisisId, titulo, nivel, establecimiento, nombreDocente, fecha, nPreguntasSM, nPreguntasDesarrollo, estudiantes } = config;

  for (let i = 0; i < estudiantes.length; i++) {
    const est = estudiantes[i];
    if (i > 0) {
      doc.addPage();
    }

    // --- CORNER MARKERS (for visual framing) ---
    doc.setFillColor(0, 0, 0);
    // Top-left
    doc.rect(8, 8, 4, 4, 'F');
    // Top-right
    doc.rect(198, 8, 4, 4, 'F');
    // Bottom-left
    doc.rect(8, 285, 4, 4, 'F');
    // Bottom-right
    doc.rect(198, 285, 4, 4, 'F');

    // --- HEADER ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(190, 18, 60); // Rose-700
    doc.text("REI DOCENTE - EVALUADOR OMR", 15, 20);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.setFont('helvetica', 'normal');
    doc.text(`Establecimiento: ${establecimiento || 'No especificado'}`, 15, 25);
    doc.text(`Docente: ${nombreDocente || 'No especificado'}`, 15, 29);
    doc.text(`Evaluación: ${titulo}`, 15, 33);
    doc.text(`Curso: ${nivel}   |   Fecha: ${fecha}`, 15, 37);

    // --- STUDENT BLOCK ---
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(15, 43, 135, 18, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(est.nombre, 18, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`ESTUDIANTE   |   N° LISTA: ${est.numero_lista} ${est.rut ? `  |   RUT: ${est.rut}` : ''}`, 18, 56);

    // --- QR CODE ---
    const qrData = JSON.stringify({
      analisisId: analisisId,
      numeroLista: est.numero_lista
    });
    try {
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 120 });
      doc.addImage(qrDataUrl, 'PNG', 160, 15, 35, 35);
      
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("QR IDENTIFICADOR", 165, 53);
    } catch (err) {
      console.error('Error generating QR in PDF:', err);
    }

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 66, 195, 66);

    // --- BUBBLES GRID ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text("HOJA DE RESPUESTAS (LLENAR CON LÁPIZ OSCURO COMPLETAMENTE)", 15, 71);

    // Columns coordinates match OMR detector
    const r = 2.1; // Bubble radius

    // Drawing bubbles
    for (let q = 1; q <= nPreguntasSM; q++) {
      const isCol1 = q <= 20;
      const xStart = isCol1 ? 42.0 : 136.5;
      const y = 75.6 + (isCol1 ? q - 1 : q - 21) * 9.72;

      // Question number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(String(q).padStart(2, '0'), xStart - 12, y + 1);

      // Bubbles A, B, C, D
      for (let l = 0; l < 4; l++) {
        const x = xStart + l * 7.35;

        // Draw bubble circle
        doc.setDrawColor(71, 85, 105); // Slate-600
        doc.setFillColor(255, 255, 255);
        doc.circle(x, y, r, 'FD');

        // Draw letter
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        const letter = ['A', 'B', 'C', 'D'][l];
        doc.text(letter, x - 0.8, y + 0.8);
      }
    }

    // --- DEVELOPMENT RESPONSES BLOCK (if applies) ---
    if (nPreguntasDesarrollo > 0) {
      const devStartY = 75.6 + 20 * 9.72 + 10;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("RESPUESTAS DE DESARROLLO (USO EXCLUSIVO DOCENTE)", 15, devStartY);

      let curY = devStartY + 5;
      for (let d = 0; d < nPreguntasDesarrollo; d++) {
        const qNum = nPreguntasSM + d + 1;
        
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(250, 250, 250);
        doc.rect(15, curY, 180, 12, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Pregunta ${qNum}`, 18, curY + 7.5);

        // Teacher grading box
        doc.setDrawColor(148, 163, 184);
        doc.rect(165, curY + 2, 25, 8);
        doc.setFont('helvetica', 'normal');
        doc.text("Puntaje: ____", 168, curY + 7.5);

        curY += 15;
      }
    }
  }

  return doc;
}
