import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { staticCurriculum } from '@/lib/curriculum/index';
import path from 'path';
import fs from 'fs';

const NIVEL_TO_CURRICULUM_FILE: Record<string, string> = {
  '1° Básico':  'curriculum_1B.json',
  '2° Básico':  'curriculum_2B.json',
  '3° Básico':  'curriculum_3B.json',
  '4° Básico':  'curriculum_4B.json',
  '5° Básico':  'curriculum_5B.json',
  '6° Básico':  'curriculum_6B.json',
  '7° Básico':  'curriculum_7B.json',
  '8° Básico':  'curriculum_8B.json',
  '1° Medio':   'curriculum_1M.json',
  '2° Medio':   'curriculum_2M.json',
};

// Carga indicadores MINEDUC desde JSON para un nivel y unidad dados.
// Retorna mapa: { "OA 2": [{ id, texto }, ...], ... }
function loadOfficialIndicadores(
  nivel: string,
  unitNum: number
): Record<string, Array<{ id: number; texto: string }>> {
  const fileName = NIVEL_TO_CURRICULUM_FILE[nivel];
  if (!fileName) return {};
  try {
    const filePath = path.join(process.cwd(), 'public', 'curriculum', fileName);
    if (!fs.existsSync(filePath)) return {};
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const unidadData = data.unidades?.find((u: any) => u.numero === unitNum);
    if (!unidadData) return {};
    const result: Record<string, Array<{ id: number; texto: string }>> = {};
    for (const oa of (unidadData.oas || [])) {
      const indicadores = (oa.indicadores as string[])
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 10)
        .map((texto, idx) => ({ id: idx + 1, texto }));
      if (indicadores.length > 0) {
        result[oa.codigo] = indicadores;
      }
    }
    return result;
  } catch (_e) {
    return {};
  }
}

function mapNivelParam(nivelParam: string): string {
  const norm = (nivelParam || '').toLowerCase().replace(/_/g, ' ');
  const isBasico = norm.includes('bás') || norm.includes('bas') || norm.includes('básico') || norm.includes('basico');
  const isMedio  = norm.includes('med') || norm.includes('medio');
  if (norm.includes('1') && isBasico)  return '1° Básico';
  if (norm.includes('2') && isBasico)  return '2° Básico';
  if (norm.includes('3') && isBasico)  return '3° Básico';
  if (norm.includes('4') && isBasico)  return '4° Básico';
  if (norm.includes('5') || norm.includes('quinto'))  return '5° Básico';
  if (norm.includes('6') || norm.includes('sexto'))   return '6° Básico';
  if (norm.includes('7') || norm.includes('séptimo') || norm.includes('septimo')) return '7° Básico';
  if (norm.includes('8') || norm.includes('octavo'))  return '8° Básico';
  if ((norm.includes('1') && isMedio) || norm.includes('primero') || norm.includes('i°')) return '1° Medio';
  if ((norm.includes('2') && isMedio) || norm.includes('segundo') || norm.includes('ii°')) return '2° Medio';
  return nivelParam;
}

const FALLBACK_LESSONS: Record<string, Record<number, { numero: number; titulo: string; oa_codes: string[] }[]>> = {
  // 1° Básico — OAs por unidad según Bases Curriculares MINEDUC + NotebookLM
  // U1: OA 1,2,3,4,5,13,18,22,26  U2: OA 4,5,8,10,14,18,23,26
  // U3: OA 4,5,6,7,8,9,10,14,23   U4: OA 5,6,7,8,9,10,14,20,25
  '1° Básico': {
    1: [
      { numero: 1, titulo: 'Lectoescritura inicial y conciencia fonológica', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Decodificación, fluidez y escritura inicial',    oa_codes: ['OA 4', 'OA 5', 'OA 13'] },
      { numero: 3, titulo: 'Comprensión oral, interacción y poesía',          oa_codes: ['OA 18', 'OA 22', 'OA 26'] },
    ],
    2: [
      { numero: 1, titulo: 'Fluidez lectora y comprensión narrativa',        oa_codes: ['OA 4', 'OA 5', 'OA 8'] },
      { numero: 2, titulo: 'Textos no literarios y escritura de oraciones',   oa_codes: ['OA 10', 'OA 14', 'OA 18'] },
      { numero: 3, titulo: 'Expresión oral y poesía',                         oa_codes: ['OA 23', 'OA 26'] },
    ],
    3: [
      { numero: 1, titulo: 'Lectura comprensiva con estrategias',            oa_codes: ['OA 4', 'OA 5', 'OA 6'] },
      { numero: 2, titulo: 'Literatura variada, poesía y comprensión',        oa_codes: ['OA 7', 'OA 8', 'OA 9'] },
      { numero: 3, titulo: 'Textos no literarios, escritura y oralidad',      oa_codes: ['OA 10', 'OA 14', 'OA 23'] },
    ],
    4: [
      { numero: 1, titulo: 'Consolidación de la lectura autónoma',           oa_codes: ['OA 5', 'OA 6', 'OA 7'] },
      { numero: 2, titulo: 'Comprensión, poesía y textos no literarios',      oa_codes: ['OA 8', 'OA 9', 'OA 10'] },
      { numero: 3, titulo: 'Escritura, teatro y dramatización',               oa_codes: ['OA 14', 'OA 20', 'OA 25'] },
    ],
  },
  // 2° Básico — OAs por unidad según Bases Curriculares MINEDUC + NotebookLM
  // U1: OA 1,3,4,5,7,11,14,21,25,26  U2: OA 6,10,21,23,27,30
  // U3: OA 3,13,19,20                 U4: OA 24,29
  '2° Básico': {
    1: [
      { numero: 1, titulo: 'Consolidación lectora y comprensión',            oa_codes: ['OA 1', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Comprensión, vocabulario y textos no literarios', oa_codes: ['OA 5', 'OA 7', 'OA 11'] },
      { numero: 3, titulo: 'Escritura, ortografía y comunicación oral',       oa_codes: ['OA 14', 'OA 21', 'OA 25'] },
    ],
    2: [
      { numero: 1, titulo: 'Poesía, investigación y ortografía',             oa_codes: ['OA 6', 'OA 10', 'OA 21'] },
      { numero: 2, titulo: 'Comprensión oral, expresión y recitación',        oa_codes: ['OA 23', 'OA 27', 'OA 30'] },
    ],
    3: [
      { numero: 1, titulo: 'Comprensión lectora y escritura creativa',       oa_codes: ['OA 3', 'OA 13'] },
      { numero: 2, titulo: 'Gramática: género, número y concordancia',        oa_codes: ['OA 19', 'OA 20'] },
    ],
    4: [
      { numero: 1, titulo: 'Teatro, dramatización y trabajo en equipo',      oa_codes: ['OA 24', 'OA 29'] },
    ],
  },
  // 3° Básico — OAs por unidad según Bases Curriculares MINEDUC + NotebookLM
  // U1: OA 2,3,4,6,14,22,26  U2: OA 5,9,10,22,24,28
  // U3: OA 2,13,21,31         U4: OA 15,25,30
  '3° Básico': {
    1: [
      { numero: 1, titulo: 'Estrategias lectoras y literatura narrativa',    oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Textos informativos, escritura y ortografía',    oa_codes: ['OA 6', 'OA 14', 'OA 22'] },
      { numero: 3, titulo: 'Comunicación oral y conversación grupal',        oa_codes: ['OA 26'] },
    ],
    2: [
      { numero: 1, titulo: 'Poesía, investigación y vocabulario',           oa_codes: ['OA 5', 'OA 9', 'OA 10'] },
      { numero: 2, titulo: 'Ortografía avanzada, comprensión oral y oralidad', oa_codes: ['OA 22', 'OA 24', 'OA 28'] },
    ],
    3: [
      { numero: 1, titulo: 'Estrategias avanzadas y escritura creativa',    oa_codes: ['OA 2', 'OA 13'] },
      { numero: 2, titulo: 'Gramática: pronombres y recitación',             oa_codes: ['OA 21', 'OA 31'] },
    ],
    4: [
      { numero: 1, titulo: 'Escritura variada, teatro y caracterización',   oa_codes: ['OA 15', 'OA 25', 'OA 30'] },
    ],
  },
  // 4° Básico — OAs por unidad según Bases Curriculares MINEDUC + NotebookLM
  // U1: OA 2,3,4,6,12,17,21,23   U2: OA 5,14,16,21,27,30
  // U3: OA 2,9,13                 U4: OA 3,19,20,24,29
  '4° Básico': {
    1: [
      { numero: 1, titulo: 'Estrategias lectoras y literatura narrativa',      oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Textos no literarios, escritura y edición',        oa_codes: ['OA 6', 'OA 12', 'OA 17'] },
      { numero: 3, titulo: 'Ortografía y comprensión de textos orales',        oa_codes: ['OA 21', 'OA 23'] },
    ],
    2: [
      { numero: 1, titulo: 'Poesía, formatos de escritura y planificación',    oa_codes: ['OA 5', 'OA 14', 'OA 16'] },
      { numero: 2, titulo: 'Ortografía, expresión oral y recitación',          oa_codes: ['OA 21', 'OA 27', 'OA 30'] },
    ],
    3: [
      { numero: 1, titulo: 'Investigación, búsqueda y escritura informativa',  oa_codes: ['OA 2', 'OA 9', 'OA 13'] },
    ],
    4: [
      { numero: 1, titulo: 'Novela, gramática verbal y adverbial',             oa_codes: ['OA 3', 'OA 19', 'OA 20'] },
      { numero: 2, titulo: 'Teatro y caracterización de personajes',           oa_codes: ['OA 24', 'OA 29'] },
    ],
  },
  // 5° Básico — OAs por unidad según Bases Curriculares MINEDUC + NotebookLM
  // U1: OA 2,3,4,6,7,8,11,15,17,18,24   U2: OA 3,4,5,14,18,20,21,22,26,30
  // U3: OA 3,4,16,18,22,24,25,26,30      U4: OA 2,6,7,8,15,17,18,24,28
  '5° Básico': {
    1: [
      { numero: 1, titulo: 'Fútbol y trabajo en equipo',          oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Jugar como niña',                     oa_codes: ['OA 6', 'OA 7', 'OA 24'] },
      { numero: 3, titulo: 'Deporte y perseverancia',             oa_codes: ['OA 11', 'OA 17', 'OA 18'] }
    ],
    2: [
      { numero: 4, titulo: 'Emociones en verso',                  oa_codes: ['OA 5', 'OA 26', 'OA 30'] },
      { numero: 5, titulo: 'Narrar para no olvidar',              oa_codes: ['OA 3', 'OA 4', 'OA 14'] },
      { numero: 6, titulo: 'Vientos que arrasan',                 oa_codes: ['OA 20', 'OA 21', 'OA 22'] }
    ],
    3: [
      { numero: 7, titulo: 'Coexistir en armonía',               oa_codes: ['OA 3', 'OA 4', 'OA 16'] },
      { numero: 8, titulo: 'Guardianes de la naturaleza',         oa_codes: ['OA 18', 'OA 24', 'OA 25'] },
      { numero: 9, titulo: 'Pueblos Originarios: Espíritu Verde', oa_codes: ['OA 22', 'OA 26', 'OA 30'] }
    ],
    4: [
      { numero: 10, titulo: 'Viajar para volver a empezar',      oa_codes: ['OA 2', 'OA 6', 'OA 7'] },
      { numero: 11, titulo: 'Viajes migratorios',                 oa_codes: ['OA 8', 'OA 17', 'OA 28'] }
    ]
  },
  // 6° Básico — OAs por unidad según Bases Curriculares MINEDUC + NotebookLM ✅ verificado
  // U1: OA 2,3,4,14,16,18,21,22,27,31   U2: OA 2,3,5,6,8,15,17,18,24,31
  // U3: OA 3,4,16,18,22,24,25,26,27,31  U4: OA 2,6,7,8,11,15,17,18,27,29
  '6° Básico': {
    1: [
      { numero: 1, titulo: 'Estrategias lectoras y literatura narrativa',  oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Escritura creativa, comentario y edición',     oa_codes: ['OA 14', 'OA 16', 'OA 18'] },
      { numero: 3, titulo: 'Gramática, ortografía y narración oral',       oa_codes: ['OA 21', 'OA 27', 'OA 31'] }
    ],
    2: [
      { numero: 4, titulo: 'Poesía y análisis de recursos sonoros',        oa_codes: ['OA 3', 'OA 5', 'OA 2'] },
      { numero: 5, titulo: 'Textos no literarios, síntesis e investigación', oa_codes: ['OA 6', 'OA 8', 'OA 15'] },
      { numero: 6, titulo: 'Artículos informativos, oralidad y recitación', oa_codes: ['OA 17', 'OA 24', 'OA 31'] }
    ],
    3: [
      { numero: 7, titulo: 'Literatura narrativa: fábulas, mitos e historietas', oa_codes: ['OA 3', 'OA 4', 'OA 22'] },
      { numero: 8, titulo: 'Comprensión oral, publicidad y apreciación teatral',  oa_codes: ['OA 24', 'OA 25', 'OA 26'] },
      { numero: 9, titulo: 'Diálogo colaborativo y dramatización',                oa_codes: ['OA 27', 'OA 31'] }
    ],
    4: [
      { numero: 10, titulo: 'Comprensión crítica y búsqueda de información', oa_codes: ['OA 2', 'OA 6', 'OA 7'] },
      { numero: 11, titulo: 'Síntesis, escritura de artículos y edición',    oa_codes: ['OA 8', 'OA 11', 'OA 15'] },
      { numero: 12, titulo: 'Artículo de investigación, diálogo y exposición oral', oa_codes: ['OA 17', 'OA 27', 'OA 29'] }
    ]
  },
  // 7° Básico — 7 unidades, OAs según Programa MINEDUC + NotebookLM ✅ verificado
  // OA 1 y OA 2 son transversales (todas las unidades)
  // U1: OA 1,2,3,4,7,8,11,14,15,19,21   U2: OA 1,2,7,10,14,16
  // U3: OA 1,2,6,13,22,24,25             U4: OA 1,2,15,21,23
  // U5: OA 1,2,4,5,10,15                 U6: OA 1,2,11,17
  // U7: OA 1,2,9,12,18,20
  '7° Básico': {
    1: [ // El héroe en distintas épocas
      { numero: 1, titulo: 'Literatura narrativa y poética del héroe',        oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Interpretación, argumentación y estrategias',     oa_codes: ['OA 7', 'OA 8', 'OA 11'] },
      { numero: 3, titulo: 'Escritura, proceso y ortografía',                 oa_codes: ['OA 14', 'OA 15', 'OA 19'] },
      { numero: 4, titulo: 'Diálogo colaborativo y oralidad',                 oa_codes: ['OA 21'] },
    ],
    2: [ // La solidaridad y la amistad
      { numero: 1, titulo: 'Reflexión literaria y perspectiva histórica',     oa_codes: ['OA 2', 'OA 7', 'OA 10'] },
      { numero: 2, titulo: 'Escritura fundamentada y gramática oracional',    oa_codes: ['OA 14', 'OA 16'] },
    ],
    3: [ // Mitología y relatos de creación
      { numero: 1, titulo: 'Lectura y análisis de mitos',                     oa_codes: ['OA 2', 'OA 6', 'OA 13'] },
      { numero: 2, titulo: 'Exposición oral, investigación y síntesis',       oa_codes: ['OA 22', 'OA 24', 'OA 25'] },
    ],
    4: [ // La identidad: quién soy, cómo me ven los demás
      { numero: 1, titulo: 'Escritura digital, interacción y oralidad',       oa_codes: ['OA 15', 'OA 21', 'OA 23'] },
    ],
    5: [ // El Romancero y la poesía popular
      { numero: 1, titulo: 'Análisis lírico y tradición oral',                oa_codes: ['OA 2', 'OA 4', 'OA 5'] },
      { numero: 2, titulo: 'Contexto histórico, síntesis y edición',          oa_codes: ['OA 10', 'OA 15'] },
    ],
    6: [ // El terror y lo extraño
      { numero: 1, titulo: 'Comprensión estratégica y correferencia',         oa_codes: ['OA 11', 'OA 17'] },
      { numero: 2, titulo: 'Hábito lector e intereses literarios',            oa_codes: ['OA 1'] },
    ],
    7: [ // Medios de comunicación
      { numero: 1, titulo: 'Reflexión crítica y análisis de medios',          oa_codes: ['OA 2', 'OA 9', 'OA 12'] },
      { numero: 2, titulo: 'Tiempos verbales y textos audiovisuales',         oa_codes: ['OA 18', 'OA 20'] },
    ],
  },
  // 8° Básico — 7 unidades, OAs según Programa MINEDUC + NotebookLM ✅ verificado
  // OA 1 transversal. OA 2,3,8 se refuerzan en U2–U6.
  // U1: OA 1,2,3,6,8,11,12,14,16,22     U2: OA 1,2,3,4,8,23,25,26
  // U3: OA 1,2,3,8,12,13,17,18,22        U4: OA 1,2,3,4,8,15,16,19,21
  // U5: OA 1,2,5,7,8,11,14,16,20,22      U6: OA 1,2,3,8,9,11,15,16,22
  // U7: OA 1,9,10,15,16,21,22,23,24,25,26
  '8° Básico': {
    1: [ // Epopeya — OA 1,2,3,6,8,11,12,14,16,22
      { numero: 1, titulo: 'Lectura y análisis épico', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Comprensión avanzada y evaluación crítica', oa_codes: ['OA 6', 'OA 8', 'OA 11'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 12', 'OA 14', 'OA 22'] },
    ],
    2: [ // Experiencias del amor — OA 1,2,3,4,8,23,25,26
      { numero: 1, titulo: 'Lectura lírica y narrativa', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Interpretación y análisis textual', oa_codes: ['OA 4', 'OA 8', 'OA 23'] },
      { numero: 3, titulo: 'Investigación y honestidad intelectual', oa_codes: ['OA 25', 'OA 26'] },
    ],
    3: [ // Relatos de misterio — OA 2,3,8,12,13,17,18,22
      { numero: 1, titulo: 'Lectura y análisis narrativo', oa_codes: ['OA 2', 'OA 3', 'OA 8'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 12', 'OA 13', 'OA 17'] },
      { numero: 3, titulo: 'Cohesión textual y oralidad', oa_codes: ['OA 18', 'OA 22'] },
    ],
    4: [ // Naturaleza — OA 1,2,3,4,8,15,16,19,21
      { numero: 1, titulo: 'Lectura literaria sobre naturaleza', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Análisis crítico e interpretación', oa_codes: ['OA 4', 'OA 8', 'OA 15'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 16', 'OA 19', 'OA 21'] },
    ],
    5: [ // La comedia — OA 1,2,5,7,8,11,14,16,20,22
      { numero: 1, titulo: 'Lectura dramática y humorística', oa_codes: ['OA 1', 'OA 2', 'OA 5'] },
      { numero: 2, titulo: 'Análisis crítico y evaluación textual', oa_codes: ['OA 7', 'OA 8', 'OA 11'] },
      { numero: 3, titulo: 'Producción escrita y comunicación oral', oa_codes: ['OA 14', 'OA 20', 'OA 22'] },
    ],
    6: [ // El mundo descabellado — OA 1,2,3,8,9,11,15,16,22
      { numero: 1, titulo: 'Lectura literaria absurda y fantástica', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Estrategias de comprensión lectora', oa_codes: ['OA 8', 'OA 9', 'OA 11'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 15', 'OA 16', 'OA 22'] },
    ],
    7: [ // Medios de comunicación — OA 1,9,10,15,16,21,22,23,24,25,26
      { numero: 1, titulo: 'Análisis crítico de medios', oa_codes: ['OA 1', 'OA 9', 'OA 10'] },
      { numero: 2, titulo: 'Comunicación oral en medios', oa_codes: ['OA 21', 'OA 22', 'OA 23'] },
      { numero: 3, titulo: 'Producción escrita e investigación', oa_codes: ['OA 15', 'OA 24', 'OA 25'] },
    ],
  },
  // 1° Medio — OAs según Programa MINEDUC + NotebookLM ✅ verificado
  // OA 1 transversal (todas las unidades)
  // U1: OA 1,3,4,7,8,12,21        U2: OA 1,9,11,14,15,17,18,20,24
  // U3: OA 1,2,5,6,16,23,24       U4: OA 1,10,13,15,19,21,22
  '1° Medio': {
    1: [ // La libertad como tema literario
      { numero: 1, titulo: 'Lectura literaria: romanticismo, narrativa y lírica', oa_codes: ['OA 1', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Análisis crítico, contexto histórico y argumentación',  oa_codes: ['OA 7', 'OA 8', 'OA 12'] },
      { numero: 3, titulo: 'Comunicación oral y discusión de ideas',               oa_codes: ['OA 21'] },
    ],
    2: [ // Ciudadanos y opinión
      { numero: 1, titulo: 'Lectura y análisis de textos argumentativos', oa_codes: ['OA 1', 'OA 9', 'OA 11'] },
      { numero: 2, titulo: 'Producción de textos persuasivos y figuras',   oa_codes: ['OA 14', 'OA 15', 'OA 17'] },
      { numero: 3, titulo: 'Ortografía, oralidad e investigación',         oa_codes: ['OA 18', 'OA 20', 'OA 24'] },
    ],
    3: [ // Relaciones humanas en el teatro y la literatura
      { numero: 1, titulo: 'Lectura dramática: tragedia y tópicos literarios', oa_codes: ['OA 2', 'OA 5', 'OA 6'] },
      { numero: 2, titulo: 'Escritura dramática y estilo directo/indirecto',   oa_codes: ['OA 16', 'OA 23', 'OA 24'] },
    ],
    4: [ // Comunicación y sociedad
      { numero: 1, titulo: 'Análisis crítico de medios y persuasión', oa_codes: ['OA 10', 'OA 13', 'OA 19'] },
      { numero: 2, titulo: 'Producción escrita y adecuación al receptor', oa_codes: ['OA 15', 'OA 22'] },
      { numero: 3, titulo: 'Exposición oral con fuentes y debate',        oa_codes: ['OA 21'] },
    ],
  },
  // 2° Medio — OAs según Programa MINEDUC + NotebookLM ✅ verificado
  // Permanentes (todas las unidades): OA 1,2,8,9,12,18,21,22,24
  // U1: perm + OA 3,7,11,13,20          U2: perm + OA 3,10,13,16,17,20,23
  // U3: perm + OA 4,6,11,13,23          U4: perm + OA 3,5,6,11,20,23
  '2° Medio': {
    1: [ // Sobre la ausencia: exilio, migración e identidad
      { numero: 1, titulo: 'Narrativa: análisis de personajes y recursos narrativos', oa_codes: ['OA 2', 'OA 3', 'OA 7'] },
      { numero: 2, titulo: 'No literario, argumentación y perspectiva del emisor',   oa_codes: ['OA 8', 'OA 9', 'OA 11'] },
      { numero: 3, titulo: 'Escritura cohesiva, ortografía e investigación',          oa_codes: ['OA 12', 'OA 13', 'OA 18'] },
      { numero: 4, titulo: 'Oralidad, diálogo y exposición',                         oa_codes: ['OA 20', 'OA 21', 'OA 22'] },
    ],
    2: [ // Ciudadanía y trabajo — Medios de comunicación
      { numero: 1, titulo: 'Análisis crítico de medios y persuasión',               oa_codes: ['OA 8', 'OA 9', 'OA 10'] },
      { numero: 2, titulo: 'Estilo, correferencia y escritura académica',            oa_codes: ['OA 3', 'OA 13', 'OA 16'] },
      { numero: 3, titulo: 'Frases nominales, oralidad e investigación',             oa_codes: ['OA 17', 'OA 20', 'OA 23'] },
    ],
    3: [ // Lo divino y lo humano — Género lírico
      { numero: 1, titulo: 'Lírica: lenguaje figurado e intertextualidad',           oa_codes: ['OA 2', 'OA 4', 'OA 6'] },
      { numero: 2, titulo: 'Escritura de ensayos comparativos y argumentación',      oa_codes: ['OA 8', 'OA 9', 'OA 13'] },
      { numero: 3, titulo: 'Comprensión oral, exposición e investigación',           oa_codes: ['OA 11', 'OA 22', 'OA 23'] },
    ],
    4: [ // Poder y ambición — Género dramático
      { numero: 1, titulo: 'Drama: conflicto humano, personajes y puesta en escena', oa_codes: ['OA 2', 'OA 5', 'OA 6'] },
      { numero: 2, titulo: 'Análisis crítico, argumentación y perspectiva',          oa_codes: ['OA 3', 'OA 8', 'OA 9'] },
      { numero: 3, titulo: 'Oralidad, debate y exposición fundamentada',             oa_codes: ['OA 11', 'OA 20', 'OA 23'] },
    ],
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nivelParam = searchParams.get('nivel');
    const unidadParam = searchParams.get('unidad');

    if (!nivelParam || !unidadParam) {
      return NextResponse.json({ error: 'Se requieren parámetros "nivel" y "unidad"' }, { status: 400 });
    }

    const nivelNombre = mapNivelParam(nivelParam);
    const unitNum = Number(unidadParam);

    // 1. Datos estáticos oficiales tienen PRIORIDAD (correctos y completos)
    const levelLessonsStatic = FALLBACK_LESSONS[nivelNombre]?.[unitNum];
    if (levelLessonsStatic) {
      const indicadoresMap = loadOfficialIndicadores(nivelNombre, unitNum);
      const fallbackResult = levelLessonsStatic.map((l, idx) => {
        const oas = l.oa_codes.map((code, oaIdx) => {
          const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
          return {
            id: oaIdx + idx * 10 + 10000,
            codigo: code,
            texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.',
            indicadores_evaluacion: indicadoresMap[code] || []
          };
        });
        return {
          id: l.numero + 2000,
          numero: l.numero,
          titulo: l.titulo,
          oas: oas
        };
      });
      return NextResponse.json(fallbackResult);
    }

    // 2. Sin datos estáticos, intentar Supabase
    try {
      const { data: unit, error: unitErr } = await supabase
        .from('curriculum_unidades')
        .select('id')
        .eq('nivel', nivelNombre)
        .eq('unidad_numero', unitNum)
        .maybeSingle();

      if (!unitErr && unit) {
        const { data: lecciones, error: lecErr } = await supabase
          .from('curriculum_lecciones')
          .select('id, leccion_numero, titulo_leccion, oa_basales')
          .eq('unidad_id', unit.id)
          .order('leccion_numero', { ascending: true });

        if (!lecErr && lecciones && lecciones.length > 0) {
          // Extraer códigos de OAs (primeros 3 de cada lección)
          const allOaCodesSet = new Set<string>();
          lecciones.forEach((l: any) => {
            const codes = (l.oa_basales || []).slice(0, 3);
            codes.forEach((c: string) => allOaCodesSet.add(c));
          });
          const allOaCodes = Array.from(allOaCodesSet);

          // Consultar los textos oficiales correspondientes en curriculum_oa
          const oasMap: Record<string, { id: string; codigo: string; texto: string }> = {};
          if (allOaCodes.length > 0) {
            const { data: oasData, error: oasErr } = await supabase
              .from('curriculum_oa')
              .select('id, codigo_oa, texto_oa')
              .eq('nivel', nivelNombre)
              .in('codigo_oa', allOaCodes);

            if (!oasErr && oasData) {
              oasData.forEach((oa: any) => {
                oasMap[oa.codigo_oa] = {
                  id: oa.id,
                  codigo: oa.codigo_oa,
                  texto: oa.texto_oa || 'Objetivo de aprendizaje oficial.'
                };
              });
            }
          }

          // Mapear lecciones estructurando los OAs según espera el frontend
          const indicadoresMap = loadOfficialIndicadores(nivelNombre, unitNum);
          const result = lecciones.map((l: any) => {
            const codes = (l.oa_basales || []).slice(0, 3);
            const oas = codes.map((code: string, idx: number) => {
              const baseOa = oasMap[code] || (() => {
                // Fallback estático en memoria
                const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
                return {
                  id: `${l.id}-${code}-${idx}`,
                  codigo: code,
                  texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.'
                };
              })();
              return {
                ...baseOa,
                indicadores_evaluacion: indicadoresMap[code] || []
              };
            });

            return {
              id: l.id,
              numero: l.leccion_numero,
              titulo: l.titulo_leccion,
              oas: oas
            };
          });

          return NextResponse.json(result);
        }
      }
    } catch (dbErr) {
      console.warn('[API lecciones] Error consultando Supabase, usando fallback estático:', dbErr);
    }

    // Fallback estático si la base de datos no está poblada o falla
    const levelLessons = FALLBACK_LESSONS[nivelNombre]?.[unitNum];
    if (levelLessons) {
      const indicadoresMap = loadOfficialIndicadores(nivelNombre, unitNum);
      const fallbackResult = levelLessons.map((l, idx) => {
        const oas = l.oa_codes.map((code, oaIdx) => {
          const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
          return {
            id: oaIdx + idx * 10 + 10000,
            codigo: code,
            texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.',
            indicadores_evaluacion: indicadoresMap[code] || []
          };
        });
        return {
          id: l.numero + 2000,
          numero: l.numero,
          titulo: l.titulo,
          oas: oas
        };
      });
      return NextResponse.json(fallbackResult);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
