import { jsPDF } from 'jspdf';

interface InformeEstudiante {
  nombre: string;
  nota: number;
  logros: string;
  reforzar: string;
  mensaje: string;
}

export function drawInformeApoderado(config: {
  establecimiento: string;
  nombreDocente: string;
  fecha: string;
  curso: string;
  evaluacionTitulo: string;
  informes: InformeEstudiante[];
}): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { establecimiento, nombreDocente, fecha, curso, evaluacionTitulo, informes } = config;

  for (let i = 0; i < informes.length; i++) {
    const inf = informes[i];
    if (i > 0) {
      doc.addPage();
    }

    // --- BORDER FRAME ---
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // --- HEADER ---
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(10, 10, 190, 35, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(190, 18, 60); // Rose-700
    doc.text("INFORME DE RENDIMIENTO PARA EL APODERADO", 15, 20);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.setFont('helvetica', 'normal');
    doc.text(`Establecimiento: ${establecimiento || 'No especificado'}`, 15, 27);
    doc.text(`Docente: ${nombreDocente || 'No especificado'}`, 15, 32);
    doc.text(`Curso: ${curso}      |      Fecha: ${fecha}`, 15, 37);
    doc.text(`Evaluación: ${evaluacionTitulo}`, 15, 42);

    // --- STUDENT BLOCK ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(inf.nombre, 15, 56);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("ESTUDIANTE", 15, 61);

    // --- GRADE BLOCK (BIG BADGE) ---
    const isPass = inf.nota >= 4.0;
    const badgeColor = isPass ? [236, 253, 245] : [254, 242, 242]; // Emerald-50 vs Rose-50
    const badgeBorder = isPass ? [16, 185, 129] : [239, 68, 68]; // Emerald-500 vs Rose-500
    const badgeText = isPass ? [6, 95, 70] : [153, 27, 27]; // Emerald-800 vs Rose-800

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2]);
    doc.setLineWidth(0.8);
    doc.rect(145, 50, 45, 18, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
    doc.text(inf.nota.toFixed(1), 167.5, 62, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
    doc.text("NOTA OBTENIDA", 167.5, 55, { align: 'center' });

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 73, 195, 73);

    // --- BOX 1: LO QUE LOGRÓ BIEN (GREEN BACKGROUND) ---
    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.setDrawColor(16, 185, 129); // Emerald-500
    doc.rect(15, 79, 180, 52, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70); // Emerald-800
    doc.text("✓ LO QUE LOGRÓ BIEN EN ESTA EVALUACIÓN:", 20, 86);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70);
    const logrosTextLines = doc.splitTextToSize(inf.logros || 'Rendimiento general satisfactorio.', 170);
    doc.text(logrosTextLines, 20, 92);

    // --- BOX 2: A SEGUIR TRABAJANDO (YELLOW BACKGROUND) ---
    doc.setFillColor(254, 243, 199); // Amber-50
    doc.setDrawColor(245, 158, 11); // Amber-500
    doc.rect(15, 137, 180, 52, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(146, 64, 14); // Amber-800
    doc.text("⚠ ASPECTOS QUE DEBE REFORZAR Y TRABAJAR:", 20, 144);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(146, 64, 14);
    const reforzarTextLines = doc.splitTextToSize(inf.reforzar || 'No registra puntos críticos por reforzar.', 170);
    doc.text(reforzarTextLines, 20, 150);

    // --- BOX 3: MENSAJE MOTIVACIONAL (SLATE BACKGROUND) ---
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.setDrawColor(148, 163, 184); // Slate-400
    doc.rect(15, 195, 180, 48, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("✉ MENSAJE PARA LA FAMILIA:", 20, 202);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    const mensajeLines = doc.splitTextToSize(inf.mensaje || 'Se sugiere continuar con el hábito de lectura diaria en el hogar.', 170);
    doc.text(mensajeLines, 20, 208);

    // --- SIGNATURE SECTION ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.line(135, 268, 185, 268);
    doc.text("Firma del Docente", 160, 273, { align: 'center' });
  }

  return doc;
}
