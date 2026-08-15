/**
 * POST /api/planner/mediano
 * Genera planificación de mediano plazo (unidad completa, ~27 clases)
 * SIN llamado a Claude — usa datos MINEDUC del JSON + distribución Bloom automática.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, HeadingLevel, ShadingType,
} from 'docx';

interface OA {
  codigo: string;
  texto: string;
}
interface Indicador {
  oaCodigo: string;
  texto: string;
}

const BLOOM_PHASES = [
  { nombre: 'Recordar',    color: '6366F1', habilidades: 'Identificar, nombrar, listar, reconocer, describir' },
  { nombre: 'Comprender',  color: '8B5CF6', habilidades: 'Explicar, resumir, clasificar, comparar, interpretar' },
  { nombre: 'Aplicar',     color: '0EA5E9', habilidades: 'Usar, demostrar, resolver, ejecutar, producir' },
  { nombre: 'Analizar',    color: '10B981', habilidades: 'Diferenciar, organizar, examinar, inferir, atribuir' },
  { nombre: 'Evaluar',     color: 'F59E0B', habilidades: 'Juzgar, argumentar, defender, valorar, criticar' },
  { nombre: 'Crear',       color: 'EF4444', habilidades: 'Diseñar, producir, plantear, construir, elaborar' },
];

const TOTAL_CLASES = 27;

function bloomForClass(idx: number) {
  const ratio = idx / TOTAL_CLASES;
  if (ratio < 0.15) return BLOOM_PHASES[0];
  if (ratio < 0.30) return BLOOM_PHASES[1];
  if (ratio < 0.50) return BLOOM_PHASES[2];
  if (ratio < 0.68) return BLOOM_PHASES[3];
  if (ratio < 0.84) return BLOOM_PHASES[4];
  return BLOOM_PHASES[5];
}

function buildDistribucion(indicadores: Indicador[], oas: OA[]) {
  const clases: Array<{ numero: number; semana: number; bloom: typeof BLOOM_PHASES[0]; indicador: string; oaCodigo: string }> = [];
  const n = indicadores.length || 1;
  for (let i = 0; i < TOTAL_CLASES; i++) {
    const ind = indicadores[i % n] || { oaCodigo: oas[0]?.codigo || 'OA', texto: 'Indicador general de la unidad' };
    clases.push({
      numero: i + 1,
      semana: Math.ceil((i + 1) / 2),
      bloom: bloomForClass(i),
      indicador: ind.texto,
      oaCodigo: ind.oaCodigo,
    });
  }
  return clases;
}

// ── helpers docx ────────────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' };
const noBorder = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' };

function h(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2, size = 24, color = '1E3A5F') {
  return new Paragraph({
    heading: level,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size, color, font: 'Calibri' })],
  });
}
function p(text: string, bold = false, size = 20, color = '0F172A') {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, bold, size, color, font: 'Calibri' })],
  });
}
function cell(text: string, bold = false, color = '0F172A', bg?: string, size = 18) {
  return new TableCell({
    borders: { top: border, bottom: border, left: border, right: border },
    shading: bg ? { fill: bg, type: ShadingType.SOLID } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold, size, color, font: 'Calibri' })],
    })],
  });
}
function headerCell(text: string) {
  return cell(text, true, 'FFFFFF', '4C1D95', 18);
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const { grade, unit, unidadNombre, oas, indicadores } = body as {
    grade: string; unit: string; unidadNombre: string;
    oas: OA[]; indicadores: Indicador[];
  };

  if (!grade || !oas?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const distribucion = buildDistribucion(indicadores || [], oas);
  const año = new Date().getFullYear();

  // ── Sección 1: Encabezado ────────────────────────────────────────────────
  const encabezado: Paragraph[] = [
    h('PLANIFICACIÓN DE MEDIANO PLAZO', HeadingLevel.HEADING_1, 28, '1E3A5F'),
    h('Lengua y Literatura — Programa MINEDUC', HeadingLevel.HEADING_2, 22, '475569'),
    p(''),
    p(`Asignatura:  Lengua y Literatura`, false, 20),
    p(`Nivel / Curso:  ${grade}`, false, 20),
    p(`${unidadNombre || unit}`, false, 20),
    p(`Año:  ${año}`, false, 20),
    p(`N° clases proyectadas:  ${TOTAL_CLASES} bloques de 90 minutos`, false, 20),
    p(''),
  ];

  // ── Sección 2: OAs seleccionados ─────────────────────────────────────────
  const oasSection: (Paragraph | Table)[] = [
    h('Objetivos de Aprendizaje (OA) de la Unidad', HeadingLevel.HEADING_2, 22, '1E3A5F'),
  ];
  for (const oa of oas) {
    oasSection.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({ text: `${oa.codigo}:  `, bold: true, size: 20, color: '4C1D95', font: 'Calibri' }),
          new TextRun({ text: oa.texto, size: 20, color: '0F172A', font: 'Calibri' }),
        ],
      })
    );
  }
  oasSection.push(p(''));

  // ── Sección 3: Todos los indicadores ─────────────────────────────────────
  const indSection: (Paragraph | Table)[] = [
    h('Indicadores de Logro (MINEDUC)', HeadingLevel.HEADING_2, 22, '1E3A5F'),
  ];
  if (!indicadores || indicadores.length === 0) {
    indSection.push(p('No se registraron indicadores para los OA seleccionados.', false, 20, '94A3B8'));
  } else {
    let lastOa = '';
    for (const ind of indicadores) {
      if (ind.oaCodigo !== lastOa) {
        indSection.push(p(`${ind.oaCodigo}`, true, 19, '4C1D95'));
        lastOa = ind.oaCodigo;
      }
      indSection.push(
        new Paragraph({
          spacing: { after: 60 },
          bullet: { level: 0 },
          children: [new TextRun({ text: ind.texto, size: 18, color: '1E293B', font: 'Calibri' })],
        })
      );
    }
  }
  indSection.push(p(''));

  // ── Sección 4: Tabla de distribución ─────────────────────────────────────
  const tablaSection: (Paragraph | Table)[] = [
    h('Distribución de Clases — Progresión Taxonómica (Bloom)', HeadingLevel.HEADING_2, 22, '1E3A5F'),
    p('Las clases avanzan progresivamente de habilidades de menor a mayor complejidad cognitiva.', false, 18, '475569'),
    p(''),
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell('Sem.'),
      headerCell('Clase'),
      headerCell('OA'),
      headerCell('Indicador de logro'),
      headerCell('Nivel Bloom'),
      headerCell('Habilidades cognitivas'),
    ],
  });

  const dataRows = distribucion.map(c =>
    new TableRow({
      children: [
        cell(String(c.semana)),
        cell(String(c.numero)),
        cell(c.oaCodigo, true, '4C1D95'),
        cell(c.indicador, false, '1E293B'),
        cell(c.bloom.nombre, true, `#${c.bloom.color}`.replace('#', '')),
        cell(c.bloom.habilidades, false, '475569'),
      ],
    })
  );

  const tabla = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    columnWidths: [600, 600, 700, 4000, 1200, 2900],
  });

  tablaSection.push(tabla);
  tablaSection.push(p(''));
  tablaSection.push(p('Nota: Esta distribución es orientadora. El docente puede ajustar el orden y cantidad de clases según el ritmo real del grupo curso.', false, 16, '94A3B8'));

  // ── Ensamblar documento ───────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        ...encabezado,
        ...oasSection,
        ...(indSection as Paragraph[]),
        ...(tablaSection as Paragraph[]),
      ],
    }],
  });

  const buffer = Buffer.from(await Packer.toBuffer(doc));

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Planificacion_Mediano_${grade.replace(/[°\s]/g, '')}_${unit.replace(/\s/g, '')}.docx"`,
    },
  });
}
