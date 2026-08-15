/**
 * POST /api/planner/mediano
 * Genera planificación de mediano plazo — estructura profesional completa.
 * SIN Claude — basado en datos curriculares MINEDUC filtrados.
 *
 * Secciones:
 * 1. Datos Generales
 * 2. Objetivo de la Unidad
 * 3. Objetivos de Aprendizaje
 * 4. Indicadores de Evaluación (MINEDUC, solo bullets limpios)
 * 5. Progresión de Aprendizajes (por semana)
 * 6. Secuencia de Clases
 * 7. Plan de Evaluación
 * 8. Recursos
 * 9. Adecuaciones DUA / RTI / PIE
 * 10. Observaciones
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx';

interface OA { codigo: string; texto: string; }
interface Indicador { oaCodigo: string; texto: string; }

// ── Carga de temas desde JSON curricular ─────────────────────────────────────

function gradeToCode(grade: string): string {
  // "5° Básico" → "5B", "1° Medio" → "1M"
  const m = grade.match(/(\d+)[°º]\s*(Básico|Medio)/i);
  if (!m) return '';
  return `${m[1]}${m[2][0].toUpperCase()}`;
}

function loadTemas(grade: string, unitNum: number): string[] {
  try {
    const code = gradeToCode(grade);
    if (!code) return [];
    const filePath = path.join(process.cwd(), 'public', 'curriculum', `curriculum_${code}.json`);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const unidad = (data.unidades as any[])?.find(u => u.numero === unitNum);
    return Array.isArray(unidad?.temas) && unidad.temas.length > 0 ? unidad.temas : [];
  } catch {
    return [];
  }
}

// ── Taxonomía de Bloom ───────────────────────────────────────────────────────
const BLOOM_PHASES = [
  {
    nombre: 'Recordar',
    habilidades: 'Identificar, nombrar, listar, reconocer',
    producto: 'Lista / Respuestas directas',
    evidencia: 'Respuestas orales o escritas sobre lo reconocido',
  },
  {
    nombre: 'Comprender',
    habilidades: 'Explicar, resumir, clasificar, comparar',
    producto: 'Organizador gráfico / Resumen',
    evidencia: 'Organizador gráfico o resumen del contenido',
  },
  {
    nombre: 'Aplicar',
    habilidades: 'Usar, demostrar, resolver, producir',
    producto: 'Texto producido / Actividad práctica',
    evidencia: 'Texto o actividad que aplique el aprendizaje',
  },
  {
    nombre: 'Analizar',
    habilidades: 'Diferenciar, examinar, inferir, comparar',
    producto: 'Cuadro comparativo / Análisis',
    evidencia: 'Análisis o cuadro comparativo fundamentado',
  },
  {
    nombre: 'Evaluar',
    habilidades: 'Juzgar, argumentar, defender, valorar',
    producto: 'Opinión fundamentada / Comentario',
    evidencia: 'Comentario crítico con argumentos del texto',
  },
  {
    nombre: 'Crear',
    habilidades: 'Diseñar, producir, plantear, construir',
    producto: 'Producción original / Proyecto',
    evidencia: 'Producción escrita o proyecto creativo',
  },
] as const;

type BloomPhase = (typeof BLOOM_PHASES)[number];

const TOTAL_CLASES = 27;

function bloomForClass(idx: number): BloomPhase {
  const r = idx / TOTAL_CLASES;
  if (r < 0.15) return BLOOM_PHASES[0];
  if (r < 0.30) return BLOOM_PHASES[1];
  if (r < 0.50) return BLOOM_PHASES[2];
  if (r < 0.68) return BLOOM_PHASES[3];
  if (r < 0.84) return BLOOM_PHASES[4];
  return BLOOM_PHASES[5];
}

// ── Helpers de texto ─────────────────────────────────────────────────────────

/** Fragmentos de texto que delatan que no es un indicador real sino basura del PDF */
const GARBAGE_PATTERNS = [
  /Programa de Estudio/i,
  /Los estudiantes que han alcanzado/i,
  /Unidad \d+ de:/i,
  /Se espera que los estudiantes/i,
  /El docente/i,
  /^\s*\d+\s*$/,           // solo un número
  /isbn/i,
  /ministerio de educación/i,
];

/** Filtra indicadores reales (bullets breves ≤350 chars, sin basura del PDF). */
function filterIndicadores(inds: Indicador[]): Indicador[] {
  const clean = inds.filter(i => {
    const t = i.texto.trim();
    if (t.length === 0 || t.length > 350) return false;
    if (GARBAGE_PATTERNS.some(re => re.test(t))) return false;
    return true;
  });
  return clean.length > 0 ? clean : inds.filter(i => i.texto.trim().length <= 350);
}

/** Primera cláusula del texto (hasta primer punto, punto y coma o coma larga), máx max chars. */
function extractTheme(text: string, max = 65): string {
  const first = text.split(/[.;]/)[0].trim();
  return first.length > max ? first.slice(0, max - 1) + '…' : first;
}

function truncate(text: string, max = 150): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

// ── Estilos docx ─────────────────────────────────────────────────────────────
const BORDER  = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
const HDR_BG  = '1E3A5F';
const ALT_BG  = 'F1F5F9';

function title(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text, bold: true, size: 32, color: '1E3A5F', font: 'Calibri' })],
  });
}
function subtitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 240 },
    children: [new TextRun({ text, size: 22, color: '64748B', font: 'Calibri' })],
  });
}
function h2(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: '1E3A5F', font: 'Calibri' })],
  });
}
function p(text: string, bold = false, size = 19, color = '1E293B'): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, bold, size, color, font: 'Calibri' })],
  });
}
function spacer(): Paragraph { return p(''); }

function bullet(text: string, size = 18, color = '1E293B'): Paragraph {
  return new Paragraph({
    spacing: { after: 50 },
    bullet: { level: 0 },
    children: [new TextRun({ text, size, color, font: 'Calibri' })],
  });
}

type CellOpts = {
  bold?: boolean;
  color?: string;
  bg?: string;
  size?: number;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
};

function mkCell(text: string, opts: CellOpts = {}): TableCell {
  const { bold = false, color = '1E293B', bg, size = 18, align = AlignmentType.LEFT } = opts;
  return new TableCell({
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
    shading: bg ? { fill: bg, type: ShadingType.SOLID } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, size, color, font: 'Calibri' })],
    })],
  });
}

function hCell(text: string): TableCell {
  return mkCell(text, { bold: true, color: 'FFFFFF', bg: HDR_BG, size: 17, align: AlignmentType.LEFT });
}

// ── Ruta principal ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }

  const { grade, unit, unitNum: unitNumRaw, unidadNombre, oas, indicadores } = body as {
    grade: string; unit: string; unitNum?: number; unidadNombre: string;
    oas: OA[]; indicadores: Indicador[];
  };

  if (!grade || !oas?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const unitNum     = unitNumRaw ?? (parseInt((unit || '1').replace(/\D+/g, '')) || 1);
  const temas       = loadTemas(grade, unitNum);
  const cleanInds   = filterIndicadores(indicadores || []);
  const año         = new Date().getFullYear();
  const unidadLabel = unidadNombre || unit;
  const oaCodes     = oas.map(o => o.codigo).join(', ');

  // ── Objetivo de la unidad ─────────────────────────────────────────────────
  const verbosOA = oas.slice(0, 3).map(o => extractTheme(o.texto, 55).toLowerCase());
  const objetivoTexto =
    `En esta unidad de ${grade}, los estudiantes desarrollarán competencias para ` +
    verbosOA.join('; ') +
    `. La progresión avanza desde habilidades cognitivas básicas de reconocimiento y comprensión ` +
    `hasta niveles de análisis, evaluación y creación, en coherencia con la Taxonomía de Bloom ` +
    `y el Programa de Estudio MINEDUC (${oaCodes}).`;

  // ── Distribución de temas entre clases ───────────────────────────────────
  // Cada tema ocupa un bloque de clases; dentro del bloque se aplica Bloom
  const temaCount = temas.length || 1;
  function temaForClass(idx: number): string {
    if (temas.length === 0) {
      const ind = cleanInds[idx % (cleanInds.length || 1)]
        ?? { texto: 'Contenido de la unidad' };
      return extractTheme(ind.texto, 65);
    }
    const block = Math.floor(idx / (TOTAL_CLASES / temaCount));
    return temas[Math.min(block, temas.length - 1)];
  }

  // ── Secuencia de 27 clases ────────────────────────────────────────────────
  interface ClaseData {
    numero: number; semana: number;
    bloom: BloomPhase;
    tema: string; oaCodigo: string;
    objetivo: string; producto: string;
  }
  const n = cleanInds.length || 1;
  const clases: ClaseData[] = [];
  for (let i = 0; i < TOTAL_CLASES; i++) {
    const ind   = cleanInds[i % n] ?? { oaCodigo: oas[0]?.codigo ?? '', texto: '' };
    const bloom = bloomForClass(i);
    const tema  = temaForClass(i);
    clases.push({
      numero:   i + 1,
      semana:   Math.ceil((i + 1) / 2),
      bloom,
      tema,
      oaCodigo: ind.oaCodigo || oas[Math.floor(i / Math.ceil(TOTAL_CLASES / oas.length))]?.codigo || '',
      objetivo: `${bloom.habilidades.split(',')[0].trim()}: ${tema.toLowerCase()}`,
      producto: bloom.producto,
    });
  }

  // ── Progresión semanal (primera clase de cada semana) ────────────────────
  const semanasMap = new Map<number, ClaseData>();
  for (const c of clases) {
    if (!semanasMap.has(c.semana)) semanasMap.set(c.semana, c);
  }
  const semanas = Array.from(semanasMap.values());

  // ── Construir documento ───────────────────────────────────────────────────
  const children: (Paragraph | Table)[] = [];

  // ═══════════════════════════════════════
  // TÍTULO
  // ═══════════════════════════════════════
  children.push(
    title('PLANIFICACIÓN DE MEDIANO PLAZO'),
    subtitle('Lengua y Literatura  ·  Programa de Estudio MINEDUC'),
  );

  // ═══════════════════════════════════════
  // 1. DATOS GENERALES
  // ═══════════════════════════════════════
  children.push(h2('1. Datos Generales'));
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2500, 7000],
    rows: [
      new TableRow({ tableHeader: true, children: [hCell('Campo'), hCell('Detalle')] }),
      new TableRow({ children: [mkCell('Asignatura', { bold: true }), mkCell('Lengua y Literatura')] }),
      new TableRow({ children: [mkCell('Nivel / Curso', { bold: true, bg: ALT_BG }), mkCell(grade, { bg: ALT_BG })] }),
      new TableRow({ children: [mkCell('Unidad', { bold: true }), mkCell(unidadLabel)] }),
      new TableRow({ children: [mkCell('Año', { bold: true, bg: ALT_BG }), mkCell(String(año), { bg: ALT_BG })] }),
      new TableRow({ children: [mkCell('N° sesiones', { bold: true }), mkCell(`${TOTAL_CLASES} clases de 90 minutos`)] }),
      new TableRow({ children: [mkCell('OA de la unidad', { bold: true, bg: ALT_BG }), mkCell(oaCodes, { bg: ALT_BG })] }),
    ],
  }));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 2. OBJETIVO DE LA UNIDAD
  // ═══════════════════════════════════════
  children.push(h2('2. Objetivo de la Unidad'));
  children.push(p(objetivoTexto));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 3. OBJETIVOS DE APRENDIZAJE
  // ═══════════════════════════════════════
  children.push(h2('3. Objetivos de Aprendizaje (OA)'));
  for (const oa of oas) {
    children.push(new Paragraph({
      spacing: { before: 60, after: 70 },
      children: [
        new TextRun({ text: `${oa.codigo}:  `, bold: true, size: 19, color: '4C1D95', font: 'Calibri' }),
        new TextRun({ text: oa.texto, size: 18, color: '1E293B', font: 'Calibri' }),
      ],
    }));
  }
  children.push(spacer());

  // ═══════════════════════════════════════
  // 4. TEMAS DE LA UNIDAD (MINEDUC)
  // ═══════════════════════════════════════
  if (temas.length > 0) {
    children.push(h2('4. Temas de la Unidad'));
    temas.forEach((t, i) => children.push(
      new Paragraph({
        spacing: { after: 60 },
        bullet: { level: 0 },
        children: [
          new TextRun({ text: `Bloque ${i + 1}: `, bold: true, size: 18, color: '1E3A5F', font: 'Calibri' }),
          new TextRun({ text: t, size: 18, color: '1E293B', font: 'Calibri' }),
        ],
      })
    ));
    children.push(spacer());
  }

  // ═══════════════════════════════════════
  // 5. INDICADORES DE EVALUACIÓN
  // ═══════════════════════════════════════
  children.push(h2('5. Indicadores de Evaluación (MINEDUC)'));
  if (cleanInds.length === 0) {
    children.push(p('No se registraron indicadores para los OA seleccionados.', false, 18, '94A3B8'));
  } else {
    let lastOa = '';
    for (const ind of cleanInds) {
      if (ind.oaCodigo !== lastOa) {
        children.push(p(ind.oaCodigo, true, 18, '4C1D95'));
        lastOa = ind.oaCodigo;
      }
      children.push(bullet(ind.texto));
    }
  }
  children.push(spacer());

  // ═══════════════════════════════════════
  // 5. PROGRESIÓN DE APRENDIZAJES (semanal)
  // ═══════════════════════════════════════
  children.push(h2('6. Progresión de Aprendizajes (por semana)'));
  children.push(p(
    'Avance de menor a mayor complejidad cognitiva según Taxonomía de Bloom.',
    false, 17, '64748B',
  ));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [600, 3200, 800, 1200, 3700],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          hCell('Sem.'), hCell('Foco de la semana'), hCell('OA'),
          hCell('Nivel Bloom'), hCell('Evidencia de aprendizaje'),
        ],
      }),
      ...semanas.map((s, i) => new TableRow({
        children: [
          mkCell(String(s.semana), { align: AlignmentType.CENTER, bg: i % 2 ? undefined : ALT_BG }),
          mkCell(s.tema, { bg: i % 2 ? undefined : ALT_BG }),
          mkCell(s.oaCodigo, { bold: true, color: '4C1D95', align: AlignmentType.CENTER, bg: i % 2 ? undefined : ALT_BG }),
          mkCell(s.bloom.nombre, { bold: true, align: AlignmentType.CENTER, bg: i % 2 ? undefined : ALT_BG }),
          mkCell(s.bloom.evidencia, { bg: i % 2 ? undefined : ALT_BG }),
        ],
      })),
    ],
  }));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 6. SECUENCIA DE CLASES
  // ═══════════════════════════════════════
  children.push(h2('7. Secuencia de Clases (90 min c/u)'));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [600, 600, 800, 4000, 3500],
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          hCell('Clase'), hCell('Sem.'), hCell('OA'),
          hCell('Objetivo de la clase'), hCell('Producto esperado'),
        ],
      }),
      ...clases.map((c, i) => new TableRow({
        children: [
          mkCell(String(c.numero), { align: AlignmentType.CENTER, bg: i % 2 ? undefined : ALT_BG }),
          mkCell(String(c.semana), { align: AlignmentType.CENTER, bg: i % 2 ? undefined : ALT_BG }),
          mkCell(c.oaCodigo, { bold: true, color: '4C1D95', align: AlignmentType.CENTER, bg: i % 2 ? undefined : ALT_BG }),
          mkCell(c.objetivo, { bg: i % 2 ? undefined : ALT_BG }),
          mkCell(c.producto, { bg: i % 2 ? undefined : ALT_BG }),
        ],
      })),

    ],
  }));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 7. PLAN DE EVALUACIÓN
  // ═══════════════════════════════════════
  children.push(h2('8. Plan de Evaluación'));

  const claseFormativa = Math.round(TOTAL_CLASES / 2);
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [1600, 700, 3200, 4000],
    rows: [
      new TableRow({ tableHeader: true, children: [hCell('Tipo'), hCell('Clase'), hCell('Instrumento'), hCell('Propósito')] }),
      new TableRow({ children: [
        mkCell('Diagnóstica', { bold: true }),
        mkCell('1', { align: AlignmentType.CENTER }),
        mkCell('Actividad exploratoria / Preguntas orales'),
        mkCell('Identificar saberes previos de los estudiantes'),
      ]}),
      new TableRow({ children: [
        mkCell('Formativa', { bold: true, bg: ALT_BG }),
        mkCell(String(claseFormativa), { align: AlignmentType.CENTER, bg: ALT_BG }),
        mkCell('Lista de cotejo / Rúbrica de proceso', { bg: ALT_BG }),
        mkCell('Monitorear el avance y ajustar la enseñanza', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('Sumativa', { bold: true }),
        mkCell(String(TOTAL_CLASES), { align: AlignmentType.CENTER }),
        mkCell('Prueba / Rúbrica de producción'),
        mkCell('Verificar el logro de los OA de la unidad'),
      ]}),
    ],
  }));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 8. RECURSOS
  // ═══════════════════════════════════════
  children.push(h2('9. Recursos'));
  for (const r of [
    'Programa de Estudio MINEDUC — Lengua y Literatura',
    'Texto del Estudiante (si aplica)',
    'Guías de trabajo generadas con REÍ',
    'Presentaciones de clases',
    'Recursos audiovisuales seleccionados por el docente',
    'Diccionarios y fuentes de consulta',
  ]) children.push(bullet(r));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 9. ADECUACIONES DUA / RTI / PIE
  // ═══════════════════════════════════════
  children.push(h2('10. Adecuaciones y Apoyo'));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2200, 7300],
    rows: [
      new TableRow({ tableHeader: true, children: [hCell('Enfoque'), hCell('Estrategia')] }),
      new TableRow({ children: [
        mkCell('DUA — Representación', { bold: true }),
        mkCell('Ofrecer el contenido en formatos variados: texto, imagen, audio y video.'),
      ]}),
      new TableRow({ children: [
        mkCell('DUA — Expresión', { bold: true, bg: ALT_BG }),
        mkCell('Permitir que los estudiantes demuestren aprendizaje de forma escrita, oral o gráfica.', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('DUA — Motivación', { bold: true }),
        mkCell('Conectar los contenidos con experiencias e intereses de los estudiantes.'),
      ]}),
      new TableRow({ children: [
        mkCell('RTI — Nivel 1', { bold: true, bg: ALT_BG }),
        mkCell('Enseñanza universal para todo el grupo; estrategias diferenciadas en el aula.', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('RTI — Nivel 2', { bold: true }),
        mkCell('Apoyo focalizado en pequeños grupos para estudiantes con dificultades detectadas.'),
      ]}),
      new TableRow({ children: [
        mkCell('RTI — Nivel 3', { bold: true, bg: ALT_BG }),
        mkCell('Intervención intensiva e individualizada coordinada con el equipo PIE.', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('PIE', { bold: true }),
        mkCell('Adecuaciones curriculares según Plan de Apoyo Individual (PAI) de cada estudiante.'),
      ]}),
    ],
  }));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 10. OBSERVACIONES
  // ═══════════════════════════════════════
  children.push(h2('11. Observaciones del Docente'));
  for (let i = 0; i < 4; i++) {
    children.push(p('____________________________________________________________________________________________________________'));
  }
  children.push(spacer());
  children.push(p(
    'Nota: Esta planificación es una hoja de ruta orientadora. El docente puede ajustar el número de ' +
    'sesiones, el orden de los indicadores y las estrategias según el ritmo real del grupo curso.',
    false, 16, '94A3B8',
  ));

  // ── Ensamblar y retornar ──────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {},
      children: children as Paragraph[],
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
