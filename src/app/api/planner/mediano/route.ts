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
import { staticCurriculum } from '@/lib/curriculum/index';
import { TEXTBOOK_STRUCTURE, type TextbookUnit } from '@/data/textbook_structure';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx';

interface OA { codigo: string; texto: string; eje?: string; }
interface Indicador { oaCodigo: string; texto: string; }

// ── Carga de temas desde JSON curricular ─────────────────────────────────────

function gradeToCode(grade: string): string {
  // "5° Básico" → "5B", "1° Medio" → "1M"
  const m = grade.match(/(\d+)[°º]\s*(Básico|Medio)/i);
  if (!m) return '';
  return `${m[1]}${m[2][0].toUpperCase()}`;
}

interface CurriculumData {
  temas: string[];
  oaTexts: Record<string, string>;
  oaIndicadores: Record<string, string[]>; // codigo → indicadores limpios
}

/** Fragmentos que delatan basura del PDF en lugar de un indicador real */
const GARBAGE_PATTERNS = [
  // ── Artefactos de extracción PDF ──────────────────────────────────────────
  /Programa de Estudio/i,
  /Los estudiantes que han alcanzado/i,
  /Unidad \d+ de/i,
  /\bU\d+\b/,
  /Se espera que los estudiantes/i,
  /isbn/i,
  /ministerio de educación/i,
  /objetivo de aprendizaje oficial/i,
  /logrado\s+MedianaMente/i,
  /recortes recorten/i,
  /\([^)]+,[^)]+\)/,
  /medio e identidad/i,
  /a todas las unidades/i,
  /^A\s+t[Oo]d[Aa]s/,
  /^\s*\d+\s*$/,

  // ── Referencias al docente ─────────────────────────────────────────────────
  /^El docente/i,
  /^La docente/i,
  /^El profesor/i,
  /^La profesora/i,
  /^Les señala/i,
  /^Les pide/i,
  /^Les indica/i,
  /^Les explica/i,

  // ── Instrucciones de actividad (no son indicadores de logro) ──────────────
  /^Para terminar/i,
  /^Para esto/i,
  /^Para ello/i,
  /^Para comenzar/i,
  /^A partir de\b/i,
  /^A modo de sugerencia/i,
  /^A continuación/i,
  /^Por esto,/i,
  /^Luego de\b/i,
  /^Antes de leer/i,
  /^Después de leer/i,
  /^Durante la lectura/i,
  /^En grupos/i,
  /^En parejas/i,
  /^Se lee\b/i,
  /^Se pide\b/i,
  /^Se solicita/i,
  /^Noticia sobre/i,
  /^Construir conocimientos/i,

  // ── Fragmentos de actividades narradas con "Los estudiantes" ──────────────
  /^Los estudiantes\b/i,

  // ── Fragmentos sueltos de escenarios / contextos de actividad ─────────────
  /^Una de ellas\b/i,
  /^Es de noche\b/i,
  /^Es de día\b/i,
];

/** Patrones de basura que aparecen PEGADOS al final de un indicador real */
const INLINE_GARBAGE = [
  /\s+medio\s+e\s+identidad\b.*/i,
  /\.\s+medio\b.*/i,                    // ". medio e identidad..."
  /\s+[Aa]\s+t[Oo]d[Aa]s\s+l[Aa]s\s+[Uu]nidades.*/i,
  /\s+\([Aa]\s+t[Oo]d[Aa]s.*/i,
];

/** Limpia basura PDF que queda pegada al final de un indicador real */
function cleanIndicatorText(text: string): string {
  let out = text;
  for (const re of INLINE_GARBAGE) {
    out = out.replace(re, '');
  }
  out = out.trim();
  if (out && !out.endsWith('.')) out += '.';
  return out;
}

const IMPERATIVE_STARTS = /^(Describa|Explique|Comente|Comenta|Compare|Analice|Discuta|Reflexione|Señale|Mencione|Identifique|Busca|Lee|Escribe|Observa|Responde|Piensa|Investiga|Describe|Cuenta|Muestra|Comparte|Escucha|Presenta|Trabaja|Crea|Revisa|Conversa|Pide|Indica|Selecciona|Elige|Elabora)\b/i;

/** Extrae el texto real de un OA quitando la basura del PDF */
function cleanOAText(raw: string): string {
  const GARBAGE_OA = /\b(recortes|peguen|logrado|alumnos\s+Leer|tiempo para|vide|mientras|MedianaMente|Observaciones|Escribir\s+hechos|Construir|Durante\s+ú)\b/i;
  const parts = raw.split(/\.\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (GARBAGE_OA.test(parts[i])) break;
    if (i === 0) {
      let s = parts[i].trim();
      // Capitalizar primera letra si viene en minúscula
      if (s[0] && s[0] === s[0].toLowerCase()) s = s[0].toUpperCase() + s.slice(1);
      return s + '.';
    }
  }
  const firstPeriod = raw.indexOf('.');
  let out = firstPeriod > 20 ? raw.slice(0, firstPeriod + 1).trim() : raw.trim();
  if (out[0] && out[0] === out[0].toLowerCase()) out = out[0].toUpperCase() + out.slice(1);
  return out;
}

/** Divide el string de indicadores de staticCurriculum en bullets individuales */
function splitIndicadores(raw: string | null): string[] {
  if (!raw) return [];
  // Separar por salto de línea o por ". " seguido de mayúscula
  const parts = raw
    .split(/\n|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  // Limpiar basura inline y asegurar que cada parte termina en punto
  return parts.map(s => cleanIndicatorText(s.endsWith('.') ? s : s + '.'));
}

function loadCurriculumData(grade: string, unitNum: number): CurriculumData {
  // ── Mapa completo de indicadores limpios del nivel (desde staticCurriculum) ─
  const allGradeInds: Record<string, string[]> = {};
  for (const oa of staticCurriculum.oas) {
    if (oa.nivel === grade && oa.indicadores) {
      const bullets = splitIndicadores(oa.indicadores);
      if (bullets.length > 0) allGradeInds[oa.codigo_oa] = bullets;
    }
  }

  // ── Temas, textos OA y códigos de la unidad desde JSON ──────────────────────
  try {
    const code = gradeToCode(grade);
    if (!code) return { temas: [], oaTexts: {}, oaIndicadores: allGradeInds };
    const filePath = path.join(process.cwd(), 'public', 'curriculum', `curriculum_${code}.json`);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const unidad = (data.unidades as any[])?.find(u => u.numero === unitNum);
    const temas = Array.isArray(unidad?.temas) && unidad.temas.length > 0 ? unidad.temas : [];
    const oaTexts: Record<string, string> = {};
    // Solo incluir indicadores de OAs que pertenecen a esta unidad
    const oaIndicadores: Record<string, string[]> = {};
    for (const oa of (unidad?.oas ?? []) as any[]) {
      if (oa.codigo && oa.texto && oa.texto.length > 10) {
        oaTexts[oa.codigo] = cleanOAText(oa.texto);
      }
      if (oa.codigo) {
        if (allGradeInds[oa.codigo]) {
          // Prioridad 1: staticCurriculum (datos limpios de Supabase)
          oaIndicadores[oa.codigo] = allGradeInds[oa.codigo];
        } else if (Array.isArray(oa.indicadores) && oa.indicadores.length > 0) {
          // Prioridad 2: JSON ya limpiado por clean_indicators.py
          const bullets = (oa.indicadores as string[])
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 10);
          if (bullets.length > 0) oaIndicadores[oa.codigo] = bullets;
        }
      }
    }
    return { temas, oaTexts, oaIndicadores };
  } catch {
    // Si no hay JSON, devolver todos los indicadores del nivel
    return { temas: [], oaTexts: {}, oaIndicadores: allGradeInds };
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

/**
 * Bloom según la posición del OA en la lista (no la clase absoluta).
 * Así OA5 (fluidez lectora) no sube a "Analizar" aunque sus clases caigan
 * en la segunda mitad del bloque de 27.
 */
function bloomForOA(oaIndex: number, totalOAs: number): BloomPhase {
  const r = totalOAs <= 1 ? 0 : oaIndex / (totalOAs - 1);
  if (r < 0.15) return BLOOM_PHASES[0]; // Recordar
  if (r < 0.32) return BLOOM_PHASES[1]; // Comprender
  if (r < 0.55) return BLOOM_PHASES[2]; // Aplicar
  if (r < 0.72) return BLOOM_PHASES[3]; // Analizar
  if (r < 0.88) return BLOOM_PHASES[4]; // Evaluar
  return BLOOM_PHASES[5];               // Crear
}

// ── Helpers de texto ─────────────────────────────────────────────────────────

/** Filtra indicadores reales:
 *  - máx 350 chars
 *  - no contiene patrones de basura
 *  - no es pregunta (¿...? ni texto que termina en ?)
 *  - no empieza con minúscula (instrucciones de actividad)
 *  - no empieza con verbo imperativo singular (preguntas de guía al docente)
 */

function filterIndicadores(inds: Indicador[]): Indicador[] {
  const isReal = (t: string): boolean => {
    if (t.length === 0 || t.length > 350) return false;
    if (GARBAGE_PATTERNS.some(re => re.test(t))) return false;
    // Preguntas (de discusión/actividad) — no son indicadores
    if (t.startsWith('¿') || t.endsWith('?')) return false;
    // Empieza con minúscula → instrucción de actividad
    if (t[0] && t[0] === t[0].toLowerCase() && t[0] !== t[0].toUpperCase()) return false;
    // Imperativo singular → pregunta guía al docente
    if (IMPERATIVE_STARTS.test(t)) return false;
    return true;
  };
  const clean = inds.filter(i => isReal(i.texto.trim()));
  return clean.length > 0 ? clean : inds.filter(i => i.texto.trim().length <= 350 && !i.texto.startsWith('¿'));
}

/** Primera cláusula del texto (hasta primer punto o punto y coma), sin truncar. */
function extractTheme(text: string, max = 65): string {
  const first = text.split(/[.;]/)[0].trim();
  // Sin elipsis: si la cláusula es larga se corta limpiamente en espacio
  if (first.length <= max) return first;
  const cut = first.slice(0, max).lastIndexOf(' ');
  return first.slice(0, cut > 20 ? cut : max);
}

/** Determina el eje curricular — thresholds oficiales MINEDUC por grado (fallback cuando oa.eje no está disponible) */
function getEjeDoc(codigo: string, nivel: string): 'Lectura' | 'Escritura' | 'Comunicación oral' | 'Investigación' {
  const num = parseInt(codigo.replace(/\D/g, '') || '0');
  if (nivel.includes('Medio')) {
    // 1°M–2°M: Lectura OA1–11, Escritura OA12–18, Comunicación oral OA19–23, Investigación OA24+
    if (num <= 11) return 'Lectura';
    if (num <= 18) return 'Escritura';
    if (num <= 23) return 'Comunicación oral';
    return 'Investigación';
  }
  const grade = parseInt(nivel.match(/(\d+)/)?.[1] ?? '5');
  if (grade === 1) {
    // 1°B: Lectura OA1–12, Escritura OA13–16, Comunicación oral OA17+
    if (num <= 12) return 'Lectura';
    if (num <= 16) return 'Escritura';
    return 'Comunicación oral';
  }
  if (grade === 2) {
    // 2°B: Lectura OA1–11, Escritura OA12–21, Comunicación oral OA22+
    if (num <= 11) return 'Lectura';
    if (num <= 21) return 'Escritura';
    return 'Comunicación oral';
  }
  if (grade === 3) {
    // 3°B: Lectura OA1–11, Escritura OA12–22, Comunicación oral OA23+
    if (num <= 11) return 'Lectura';
    if (num <= 22) return 'Escritura';
    return 'Comunicación oral';
  }
  if (grade === 4) {
    // 4°B: Lectura OA1–10, Escritura OA11–21, Comunicación oral OA22+
    if (num <= 10) return 'Lectura';
    if (num <= 21) return 'Escritura';
    return 'Comunicación oral';
  }
  if (grade === 5 || grade === 6) {
    // 5°B–6°B: Lectura OA1–12, Escritura OA13–22, Comunicación oral OA23+
    if (num <= 12) return 'Lectura';
    if (num <= 22) return 'Escritura';
    return 'Comunicación oral';
  }
  // 7°B–8°B: Lectura OA1–11, Escritura OA12–19, Comunicación oral OA20–23, Investigación OA24+
  if (num <= 11) return 'Lectura';
  if (num <= 19) return 'Escritura';
  if (num <= 23) return 'Comunicación oral';
  return 'Investigación';
}

function truncate(text: string, max = 150): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

// ── Estilos docx ─────────────────────────────────────────────────────────────
const BORDER  = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
const HDR_BG  = '1E3A5F';
const ALT_BG  = 'E0F2FE';  // celeste claro
const ROW_BG  = 'FFFFFF';  // blanco explícito (evita negro por defecto en Word)

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
    shading: bg ? { fill: bg, color: 'auto', type: ShadingType.CLEAR } : undefined,
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

  const unitNum    = unitNumRaw ?? (parseInt((unit || '1').replace(/\D+/g, '')) || 1);
  const currData   = loadCurriculumData(grade, unitNum);
  const temas      = currData.temas;

  // Sustituir textos placeholder con la versión del JSON curricular
  const PLACEHOLDER = 'Objetivo de aprendizaje oficial.';
  const resolvedOAs: OA[] = oas.map(oa => ({
    ...oa,
    texto: oa.texto === PLACEHOLDER
      ? (currData.oaTexts[oa.codigo] || oa.texto)
      : oa.texto,
  }));
  const cleanInds   = filterIndicadores(indicadores || []);
  const año         = new Date().getFullYear();
  const unidadLabel = unidadNombre || unit;
  const oaCodes     = resolvedOAs.map(o => o.codigo).join(', ');

  // ── Objetivo de la unidad ─────────────────────────────────────────────────
  const verbosOA = resolvedOAs.slice(0, 3).map(o => extractTheme(o.texto, 120).toLowerCase());
  const objetivoTexto =
    `En esta unidad de ${grade}, los estudiantes desarrollarán competencias para ` +
    verbosOA.join('; ') +
    `. La progresión avanza desde habilidades cognitivas básicas de reconocimiento y comprensión ` +
    `hasta niveles de análisis, evaluación y creación, en coherencia con la Taxonomía de Bloom ` +
    `y el Programa de Estudio MINEDUC (${oaCodes}).`;

  // ── Tema desde el texto del OA (no desde posición en temas[]) ───────────
  // Cada OA tiene su propio foco: se extrae la primera cláusula de su texto oficial.
  // Esto evita que OAs de Lectura reciban temas de Escritura/Comunicación oral.
  function temaForOACodigo(codigo: string): string {
    const oa = resolvedOAs.find(o => o.codigo === codigo);
    if (oa?.texto && oa.texto.length > 10) {
      return extractTheme(oa.texto, 65);
    }
    // Fallback a temas[] si el OA no tiene texto
    const oaIdx = oaList.indexOf(codigo);
    if (temas.length > 0) {
      const t = Math.round(oaIdx * (temas.length - 1) / Math.max(oaList.length - 1, 1));
      return temas[Math.min(Math.max(t, 0), temas.length - 1)];
    }
    return 'Contenido de la unidad';
  }

  // ── Secuencia de 27 clases ────────────────────────────────────────────────
  interface ClaseData {
    numero: number; semana: number;
    bloom: BloomPhase;
    tema: string; oaCodigo: string;
    objetivo: string; producto: string;
  }
  const n = cleanInds.length || 1;
  // Distribuir OAs equitativamente: cada OA cubre el mismo número de clases
  const oaList = resolvedOAs.map(o => o.codigo);
  function oaForClass(idx: number): string {
    const block = Math.floor(idx / (TOTAL_CLASES / oaList.length));
    return oaList[Math.min(block, oaList.length - 1)] ?? oaList[0] ?? '';
  }

  const clases: ClaseData[] = [];
  for (let i = 0; i < TOTAL_CLASES; i++) {
    const oaCodigo  = oaForClass(i);
    const oaIndex   = oaList.indexOf(oaCodigo);
    const bloom     = bloomForOA(oaIndex >= 0 ? oaIndex : i, oaList.length || 1);
    const tema      = temaForOACodigo(oaCodigo);
    clases.push({
      numero:   i + 1,
      semana:   Math.ceil((i + 1) / 2),
      bloom,
      tema,
      oaCodigo,
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
  children.push(h2('3. Objetivos de Aprendizaje por Eje Curricular'));
  const EJE_COLORS: Record<string, { label: string; code: string; bg: string }> = {
    'Lectura':           { label: 'LECTURA',           code: '4C1D95', bg: 'EDE9FE' },
    'Escritura':         { label: 'ESCRITURA',         code: '065F46', bg: 'D1FAE5' },
    'Comunicación oral': { label: 'COMUNICACIÓN ORAL', code: '92400E', bg: 'FEF3C7' },
    'Investigación':     { label: 'INVESTIGACIÓN',     code: '1E40AF', bg: 'DBEAFE' },
  };
  const EJES_ORDEN = ['Lectura', 'Escritura', 'Comunicación oral', 'Investigación'] as const;
  for (const eje of EJES_ORDEN) {
    const ejeOAs = resolvedOAs.filter(oa => (oa.eje || getEjeDoc(oa.codigo, grade)) === eje);
    if (ejeOAs.length === 0) continue;
    const ec = EJE_COLORS[eje];
    // Encabezado de eje
    children.push(new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [new TextRun({ text: `  ${ec.label}  `, bold: true, size: 17, color: ec.code, font: 'Calibri',
        shading: { fill: ec.bg, color: 'auto', type: ShadingType.CLEAR } as any })],
    }));
    for (const oa of ejeOAs) {
      children.push(new Paragraph({
        spacing: { before: 50, after: 70 },
        children: [
          new TextRun({ text: `${oa.codigo}:  `, bold: true, size: 19, color: ec.code, font: 'Calibri' }),
          new TextRun({ text: oa.texto, size: 18, color: '1E293B', font: 'Calibri' }),
        ],
      }));
    }
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
  // Agrupar indicadores del frontend por OA
  const indsMapFrontend: Record<string, string[]> = {};
  for (const ind of cleanInds) {
    if (!indsMapFrontend[ind.oaCodigo]) indsMapFrontend[ind.oaCodigo] = [];
    indsMapFrontend[ind.oaCodigo].push(ind.texto);
  }
  // Solo mostrar indicadores de los OAs seleccionados por el docente
  const allIndCodes: string[] = resolvedOAs.map(o => o.codigo);
  let anyIndicators = false;
  for (const codigo of allIndCodes) {
    // Priorizar frontend; caer a JSON si no hay
    const inds = indsMapFrontend[codigo]?.length
      ? indsMapFrontend[codigo]
      : (currData.oaIndicadores[codigo] ?? []);
    if (inds.length === 0) continue;
    anyIndicators = true;
    children.push(p(codigo, true, 18, '4C1D95'));
    for (const t of inds) children.push(bullet(t));
  }
  if (!anyIndicators) {
    children.push(p('No se encontraron indicadores para los OA de esta unidad.', false, 18, '94A3B8'));
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
      ...semanas.map((s, idx) => {
        // OA de la semana: basado en la primera clase de esa semana
        const claseIdx = (s.semana - 1) * 2; // índice 0-based
        const oaSemana = oaForClass(claseIdx);
        const alt = idx % 2 ? ROW_BG : ALT_BG;
        return new TableRow({ children: [
          mkCell(String(s.semana), { align: AlignmentType.CENTER, bg: alt }),
          mkCell(s.tema, { bg: alt }),
          mkCell(oaSemana, { bold: true, color: '4C1D95', align: AlignmentType.CENTER, bg: alt }),
          mkCell(s.bloom.nombre, { bold: true, align: AlignmentType.CENTER, bg: alt }),
          mkCell(s.bloom.evidencia, { bg: alt }),
        ]});
      }),
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
          mkCell(String(c.numero), { align: AlignmentType.CENTER, bg: i % 2 ? ROW_BG : ALT_BG }),
          mkCell(String(c.semana), { align: AlignmentType.CENTER, bg: i % 2 ? ROW_BG : ALT_BG }),
          mkCell(c.oaCodigo, { bold: true, color: '4C1D95', align: AlignmentType.CENTER, bg: i % 2 ? ROW_BG : ALT_BG }),
          mkCell(c.objetivo, { bg: i % 2 ? ROW_BG : ALT_BG }),
          mkCell(c.producto, { bg: i % 2 ? ROW_BG : ALT_BG }),
        ],
      })),

    ],
  }));
  children.push(spacer());

  // ═══════════════════════════════════════
  // 7. PLAN DE EVALUACIÓN
  // ═══════════════════════════════════════
  children.push(h2('8. Plan de Evaluación'));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [1600, 700, 3200, 4000],
    rows: [
      new TableRow({ tableHeader: true, children: [hCell('Tipo'), hCell('Clase'), hCell('Instrumento'), hCell('Propósito')] }),
      new TableRow({ children: [
        mkCell('Diagnóstica', { bold: true, bg: ROW_BG }),
        mkCell('1', { align: AlignmentType.CENTER, bg: ROW_BG }),
        mkCell('Actividad exploratoria / Preguntas orales', { bg: ROW_BG }),
        mkCell('Identificar saberes previos de los estudiantes', { bg: ROW_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('Formativa 1', { bold: true, bg: ALT_BG }),
        mkCell('7', { align: AlignmentType.CENTER, bg: ALT_BG }),
        mkCell('Lista de cotejo oral / Pregunta de salida', { bg: ALT_BG }),
        mkCell('Verificar comprensión al término de la primera fase', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('Formativa 2', { bold: true, bg: ROW_BG }),
        mkCell('14', { align: AlignmentType.CENTER, bg: ROW_BG }),
        mkCell('Rúbrica de proceso / Autoevaluación', { bg: ROW_BG }),
        mkCell('Monitorear avance y ajustar la enseñanza a mitad de unidad', { bg: ROW_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('Formativa 3', { bold: true, bg: ALT_BG }),
        mkCell('21', { align: AlignmentType.CENTER, bg: ALT_BG }),
        mkCell('Coevaluación / Portafolio parcial', { bg: ALT_BG }),
        mkCell('Retroalimentar antes de la evaluación sumativa', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('Sumativa', { bold: true, bg: ROW_BG }),
        mkCell(String(TOTAL_CLASES), { align: AlignmentType.CENTER, bg: ROW_BG }),
        mkCell('Prueba escrita / Rúbrica de producción', { bg: ROW_BG }),
        mkCell('Verificar el logro de los OA de la unidad', { bg: ROW_BG }),
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
        mkCell('DUA — Acción y Expresión', { bold: true, bg: ALT_BG }),
        mkCell('Permitir que los estudiantes demuestren aprendizaje de forma escrita, oral o gráfica.', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('DUA — Compromiso', { bold: true }),
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
      new TableRow({ children: [
        mkCell('PNL — Apertura', { bold: true, bg: ALT_BG }),
        mkCell('Activar conocimientos previos con una pregunta-ancla, imagen motivadora o canción relacionada con el tema de la lección.', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('PNL — Pausa Activa', { bold: true }),
        mkCell('Incorporar una pausa de movimiento o respiración a mitad de la sesión para restablecer la atención y el estado de aprendizaje.'),
      ]}),
      new TableRow({ children: [
        mkCell('PNL — Cierre', { bold: true, bg: ALT_BG }),
        mkCell('Cerrar la clase con una imagen mental, una frase de refuerzo positivo o un recuento oral breve que consolide el aprendizaje.', { bg: ALT_BG }),
      ]}),
      new TableRow({ children: [
        mkCell('PNL — Anclaje', { bold: true }),
        mkCell('Usar un gesto, color o palabra clave que se repite cada vez que se introduce un concepto o fonema nuevo, para reforzar la memoria asociativa.'),
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

  // ═══════════════════════════════════════
  // 12. CONEXIÓN TEXTO ESCOLAR MINEDUC
  // ═══════════════════════════════════════
  const textbookData = TEXTBOOK_STRUCTURE[grade];
  if (textbookData) {
    // Seleccionar unidades relevantes según la unidad curricular
    let relevantUnits: TextbookUnit[] = textbookData.unidades;

    // Para cursos con 4 unidades (5°B–2°M): mostrar solo las del tomo correspondiente
    const totalUnits = textbookData.unidades.length;
    if (totalUnits <= 6) {
      // 4–6 unidades grandes → tomo 1 = unidades 1-2, tomo 2 = unidades 3-4
      const tomoTarget: 1 | 2 = unitNum <= Math.ceil(totalUnits / 2) ? 1 : 2;
      relevantUnits = textbookData.unidades.filter(u => u.tomo === tomoTarget);
    } else {
      // Muchas lecciones (1°–4° básico) → mostrar las del tomo aproximado
      // unitNum 1-2 → tomo 1, unitNum 3-4 → tomo 2
      const tomoTarget: 1 | 2 = unitNum <= 2 ? 1 : 2;
      const tomoUnits = textbookData.unidades.filter(u => u.tomo === tomoTarget);
      // Mostrar hasta 8 lecciones más relevantes
      relevantUnits = tomoUnits.slice(0, 8);
    }

    children.push(h2('12. Conexión con el Texto Escolar MINEDUC'));
    children.push(p(
      `Lecciones del texto "${textbookData.nombre_texto}" sugeridas para trabajar durante esta unidad. ` +
      'El docente puede usar los textos literarios listados como lectura de modelamiento, motivación o producción.',
      false, 17, '64748B',
    ));
    children.push(spacer());

    const TB_HDR = '0F4C75'; // azul oscuro para encabezado de sección textbook

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [2600, 700, 2200, 4000],
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
              shading: { fill: TB_HDR, color: 'auto', type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Lección del libro', bold: true, size: 17, color: 'FFFFFF', font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
              shading: { fill: TB_HDR, color: 'auto', type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Págs.', bold: true, size: 17, color: 'FFFFFF', font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
              shading: { fill: TB_HDR, color: 'auto', type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Géneros / Tipos de texto', bold: true, size: 17, color: 'FFFFFF', font: 'Calibri' })] })],
            }),
            new TableCell({
              borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
              shading: { fill: TB_HDR, color: 'auto', type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Textos literarios sugeridos', bold: true, size: 17, color: 'FFFFFF', font: 'Calibri' })] })],
            }),
          ],
        }),
        ...relevantUnits.map((u, idx) => {
          const bg = idx % 2 ? ROW_BG : 'E8F4FD'; // celeste muy suave
          const generos = u.generos.slice(0, 3).join(', ');
          const textos = u.textos_literarios.slice(0, 3).join(' · ');
          return new TableRow({
            children: [
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [new Paragraph({ children: [
                  new TextRun({ text: `L${u.numero}: `, bold: true, size: 17, color: '0F4C75', font: 'Calibri' }),
                  new TextRun({ text: u.nombre, size: 17, color: '1E293B', font: 'Calibri' }),
                ]})],
              }),
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
                  new TextRun({ text: `${u.paginas.inicio}–${u.paginas.fin}`, size: 16, color: '64748B', font: 'Calibri' }),
                ]})],
              }),
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [new Paragraph({ children: [
                  new TextRun({ text: generos, size: 16, color: '1E293B', font: 'Calibri' }),
                ]})],
              }),
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                children: [new Paragraph({ children: [
                  new TextRun({ text: textos, size: 16, color: '1E293B', font: 'Calibri' }),
                ]})],
              }),
            ],
          });
        }),
      ],
    }));
    children.push(spacer());

    // ── Tabla secundaria: referencias OA → páginas (solo si hay datos) ────────
    const paginasRefs = relevantUnits.flatMap(u =>
      (u.paginas_por_oa ?? []).map(ref => ({
        leccion: u.numero,
        oa: ref.oa,
        paginas: ref.paginas,
        tipo_recurso: ref.tipo_recurso ?? 'Texto Escolar',
      }))
    );
    if (paginasRefs.length > 0) {
      children.push(p('Referencias por OA en el Texto Escolar:', true, 17, '0F4C75'));
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2200, 3000, 2200, 2100],
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: '1E3A5F', color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 50, bottom: 50, left: 80, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: 'OA', bold: true, size: 16, color: 'FFFFFF', font: 'Calibri' })] })],
              }),
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: '1E3A5F', color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 50, bottom: 50, left: 80, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Páginas sugeridas', bold: true, size: 16, color: 'FFFFFF', font: 'Calibri' })] })],
              }),
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: '1E3A5F', color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 50, bottom: 50, left: 80, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Lección', bold: true, size: 16, color: 'FFFFFF', font: 'Calibri' })] })],
              }),
              new TableCell({
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                shading: { fill: '1E3A5F', color: 'auto', type: ShadingType.CLEAR },
                margins: { top: 50, bottom: 50, left: 80, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: 'Recurso', bold: true, size: 16, color: 'FFFFFF', font: 'Calibri' })] })],
              }),
            ],
          }),
          ...paginasRefs.map((ref, idx) => {
            const bg = idx % 2 ? ROW_BG : 'EFF6FF';
            const paginasTxt = ref.paginas.length === 1
              ? `Pág. ${ref.paginas[0]}`
              : `Págs. ${ref.paginas[0]}–${ref.paginas[ref.paginas.length - 1]}`;
            return new TableRow({
              children: [
                new TableCell({
                  borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                  shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                  margins: { top: 50, bottom: 50, left: 80, right: 80 },
                  children: [new Paragraph({ children: [new TextRun({ text: ref.oa, size: 16, color: '0F4C75', font: 'Calibri', bold: true })] })],
                }),
                new TableCell({
                  borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                  shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                  margins: { top: 50, bottom: 50, left: 80, right: 80 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: paginasTxt, size: 16, color: '1E293B', font: 'Calibri' })] })],
                }),
                new TableCell({
                  borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                  shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                  margins: { top: 50, bottom: 50, left: 80, right: 80 },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `L${ref.leccion}`, size: 16, color: '64748B', font: 'Calibri' })] })],
                }),
                new TableCell({
                  borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                  shading: { fill: bg, color: 'auto', type: ShadingType.CLEAR },
                  margins: { top: 50, bottom: 50, left: 80, right: 80 },
                  children: [new Paragraph({ children: [new TextRun({ text: ref.tipo_recurso, size: 16, color: '64748B', font: 'Calibri' })] })],
                }),
              ],
            });
          }),
        ],
      }));
      children.push(spacer());
    }

    children.push(p(
      `Fuente: ${textbookData.nombre_texto} — ${textbookData.editorial}. ` +
      'Uso exclusivo como referencia pedagógica. No reproducir actividades ni textos completos.',
      false, 15, '94A3B8',
    ));
    children.push(spacer());
  }

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
