import { Document, Paragraph, TextRun, HeadingLevel } from 'docx';

interface ExportLecturasWordParams {
  tipo: string;
  subtipo?: string;
  libroTitulo: string;
  libroAutor: string;
  content: string; // texto de Claude
  docenteNombre?: string;
  establecimiento?: string;
}

export function drawLecturasWord({
  tipo,
  subtipo,
  libroTitulo,
  libroAutor,
  content,
  docenteNombre = 'Docente',
  establecimiento = 'RIGOBERTO FONTT IZQUIERDO'
}: ExportLecturasWordParams): Document {
  const sections: any[] = [];

  const h1 = (text: string, color = '166534') => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color })]
  });

  const h2 = (text: string, color = '475569') => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color })]
  });

  const bodyPara = (text: string, bold = false, color = '0F172A') => new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold, size: 20, color })]
  });

  const gap = () => new Paragraph({ text: '', spacing: { after: 120 } });

  // 1. Cabecera Institucional
  const label = subtipo 
    ? `REI LECTURAS · ${tipo.toUpperCase()} (${subtipo.replace('_', ' ').toUpperCase()})` 
    : `REI LECTURAS · ${tipo.toUpperCase()}`;

  sections.push(h1(label));
  sections.push(bodyPara(`Establecimiento: LICEO ${establecimiento}`));
  sections.push(bodyPara(`Libro: ${libroTitulo} — Autor: ${libroAutor}`, true));
  sections.push(bodyPara(`Docente Responsable: ${docenteNombre}`));
  sections.push(gap());

  // 2. Sección del Estudiante (Default)
  sections.push(h2('=== SECCIÓN DEL ESTUDIANTE ===', '0F766E'));
  sections.push(gap());

  // Dividir el contenido por líneas y agregarlas secuencialmente
  const lines = content.split('\n');
  let isDocente = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detectar sección docente
    if (
      trimmed.includes('PAUTA DOCENTE') ||
      trimmed.includes('CLAVE DE RESPUESTAS') ||
      trimmed.includes('USO EXCLUSIVO DOCENTE') ||
      trimmed.includes('PAUTA DE CORRECCIÓN')
    ) {
      isDocente = true;
      sections.push(gap());
      sections.push(gap());
      sections.push(h1('=== USO EXCLUSIVO DOCENTE ===', 'DC2626'));
      sections.push(gap());
      sections.push(h2(trimmed, 'DC2626'));
      return;
    }

    if (trimmed.startsWith('#') || trimmed.toUpperCase() === trimmed && trimmed.length > 5 && trimmed.length < 50) {
      // Estilo título de sección
      sections.push(h2(trimmed.replace(/^#+\s*/, ''), isDocente ? 'DC2626' : '166534'));
    } else {
      // Párrafo normal
      sections.push(bodyPara(trimmed, false, isDocente ? '1E293B' : '334155'));
    }
  });

  return new Document({
    sections: [
      {
        properties: {},
        children: sections
      }
    ]
  });
}
