import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { staticCurriculum } from '@/lib/curriculum/index';

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
  '1° Básico': {
    1: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 4', 'OA 5'] },
      { numero: 2, titulo: 'Escritura inicial', oa_codes: ['OA 13', 'OA 14', 'OA 15'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 17', 'OA 21', 'OA 22'] },
    ],
    2: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 5', 'OA 8'] },
      { numero: 2, titulo: 'Escritura inicial', oa_codes: ['OA 13', 'OA 14', 'OA 15'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 17', 'OA 18', 'OA 21'] },
    ],
    3: [
      { numero: 1, titulo: 'Lectura y comprensión', oa_codes: ['OA 4', 'OA 6', 'OA 7'] },
      { numero: 2, titulo: 'Producción de textos', oa_codes: ['OA 13', 'OA 14', 'OA 15'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 17', 'OA 21', 'OA 23'] },
    ],
    4: [
      { numero: 1, titulo: 'Lectura y comprensión', oa_codes: ['OA 5', 'OA 6', 'OA 7'] },
      { numero: 2, titulo: 'Producción de textos', oa_codes: ['OA 14', 'OA 15', 'OA 16'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 17', 'OA 21', 'OA 25'] },
    ],
  },
  '2° Básico': {
    1: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 4', 'OA 6'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 12', 'OA 13', 'OA 15'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 21', 'OA 22', 'OA 23'] },
    ],
    2: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 4', 'OA 5', 'OA 6'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 12', 'OA 14', 'OA 15'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 21', 'OA 23', 'OA 24'] },
    ],
    3: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 5', 'OA 6'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 13', 'OA 15', 'OA 16'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 22', 'OA 23', 'OA 25'] },
    ],
    4: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 4', 'OA 5', 'OA 7'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 13', 'OA 15', 'OA 17'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 22', 'OA 24', 'OA 29'] },
    ],
  },
  '3° Básico': {
    1: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 12', 'OA 14', 'OA 15'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 21', 'OA 22', 'OA 26'] },
    ],
    2: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 5', 'OA 9'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 12', 'OA 14', 'OA 16'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 21', 'OA 24', 'OA 28'] },
    ],
    3: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 2', 'OA 4', 'OA 5'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 13', 'OA 15', 'OA 16'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 22', 'OA 23', 'OA 26'] },
    ],
    4: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 4', 'OA 6'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 15', 'OA 16', 'OA 17'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 22', 'OA 24', 'OA 25'] },
    ],
  },
  '4° Básico': {
    1: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 12', 'OA 14', 'OA 15'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 21', 'OA 22', 'OA 23'] },
    ],
    2: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 4', 'OA 5'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 14', 'OA 15', 'OA 16'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 21', 'OA 23', 'OA 24'] },
    ],
    3: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 2', 'OA 3', 'OA 6'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 13', 'OA 15', 'OA 16'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 22', 'OA 23', 'OA 27'] },
    ],
    4: [
      { numero: 1, titulo: 'Lectura y comprensión literaria', oa_codes: ['OA 3', 'OA 4', 'OA 6'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 12', 'OA 15', 'OA 17'] },
      { numero: 3, titulo: 'Comunicación oral', oa_codes: ['OA 22', 'OA 24', 'OA 29'] },
    ],
  },
  '5° Básico': {
    1: [
      { numero: 1, titulo: 'Fútbol y trabajo en equipo', oa_codes: ['OA 1', 'OA 3', 'OA 9'] },
      { numero: 2, titulo: 'Jugar como niña', oa_codes: ['OA 6', 'OA 24', 'OA 26'] },
      { numero: 3, titulo: 'Deporte y perseverancia', oa_codes: ['OA 11', 'OA 17', 'OA 18'] }
    ],
    2: [
      { numero: 4, titulo: 'Emociones en verso', oa_codes: ['OA 5', 'OA 9', 'OA 26'] },
      { numero: 5, titulo: 'Narrar para no olvidar', oa_codes: ['OA 3', 'OA 14', 'OA 17'] },
      { numero: 6, titulo: 'Vientos que arrasan', oa_codes: ['OA 2', 'OA 6', 'OA 7'] }
    ],
    3: [
      { numero: 7, titulo: 'Coexistir en armonía', oa_codes: ['OA 2', 'OA 5', 'OA 9'] },
      { numero: 8, titulo: 'Guardianes de la naturaleza', oa_codes: ['OA 3', 'OA 24', 'OA 26'] },
      { numero: 9, titulo: 'Pueblos Originarios: Espíritu Verde', oa_codes: ['OA 6', 'OA 14', 'OA 18'] }
    ],
    4: [
      { numero: 10, titulo: 'Viajar para volver a empezar', oa_codes: ['OA 3', 'OA 9', 'OA 17'] },
      { numero: 11, titulo: 'Viajes migratorios', oa_codes: ['OA 6', 'OA 11', 'OA 28'] }
    ]
  },
  '6° Básico': {
    1: [
      { numero: 1, titulo: 'Juegos e imaginación', oa_codes: ['OA 1', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Creatividad e innovación', oa_codes: ['OA 6', 'OA 24', 'OA 27'] },
      { numero: 3, titulo: 'Aventuras y viajes en el tiempo', oa_codes: ['OA 2', 'OA 7', 'OA 14'] }
    ],
    2: [
      { numero: 4, titulo: 'El ser humano y la naturaleza', oa_codes: ['OA 3', 'OA 4', 'OA 5'] },
      { numero: 5, titulo: 'La conservación de la biodiversidad', oa_codes: ['OA 11', 'OA 24', 'OA 29'] },
      { numero: 6, titulo: 'Conectándonos con la naturaleza', oa_codes: ['OA 6', 'OA 7', 'OA 15'] }
    ],
    3: [
      { numero: 7, titulo: 'Investigando el universo', oa_codes: ['OA 3', 'OA 4', 'OA 6'] },
      { numero: 8, titulo: 'Distintas creencias sobre el cielo', oa_codes: ['OA 7', 'OA 12', 'OA 24'] },
      { numero: 9, titulo: 'Historias de vida', oa_codes: ['OA 2', 'OA 11', 'OA 14'] }
    ],
    4: [
      { numero: 10, titulo: 'Somos iguales', oa_codes: ['OA 3', 'OA 4', 'OA 7'] },
      { numero: 11, titulo: 'Mujeres activistas', oa_codes: ['OA 6', 'OA 11', 'OA 18'] }
    ]
  },
  // 7° Básico — 7 unidades, OAs según Programa MINEDUC Dec. 628/2016
  '7° Básico': {
    1: [ // El héroe en distintas épocas — OA 2,3,7,8,11,14,15,21
      { numero: 1, titulo: 'Lectura y análisis literario', oa_codes: ['OA 2', 'OA 3', 'OA 7'] },
      { numero: 2, titulo: 'Comprensión avanzada y argumentación', oa_codes: ['OA 8', 'OA 11', 'OA 14'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 15', 'OA 21'] },
    ],
    2: [ // La solidaridad y la amistad — OA 2,3,4,7,10,14,15,16,21
      { numero: 1, titulo: 'Lectura y análisis literario', oa_codes: ['OA 2', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Lectura crítica y textos no literarios', oa_codes: ['OA 7', 'OA 10', 'OA 14'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 15', 'OA 16', 'OA 21'] },
    ],
    3: [ // Mitología y relatos de creación — OA 1,3,6,7,13,15,22,24,25
      { numero: 1, titulo: 'Lectura literaria y mitos', oa_codes: ['OA 1', 'OA 3', 'OA 6'] },
      { numero: 2, titulo: 'Lectura crítica y escritura', oa_codes: ['OA 7', 'OA 13', 'OA 15'] },
      { numero: 3, titulo: 'Oralidad e investigación', oa_codes: ['OA 22', 'OA 24', 'OA 25'] },
    ],
    4: [ // La identidad — OA 1,2,3,4,7,13,15,18,21,23
      { numero: 1, titulo: 'Lectura literaria e identidad', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Lectura crítica y escritura creativa', oa_codes: ['OA 4', 'OA 7', 'OA 13'] },
      { numero: 3, titulo: 'Producción de textos y comunicación oral', oa_codes: ['OA 15', 'OA 21', 'OA 23'] },
    ],
    5: [ // El Romancero y la poesía popular — OA 2,4,5,7,10,14,15,21
      { numero: 1, titulo: 'Lectura y análisis poético', oa_codes: ['OA 2', 'OA 4', 'OA 5'] },
      { numero: 2, titulo: 'Lectura crítica y textos no literarios', oa_codes: ['OA 7', 'OA 10', 'OA 14'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 15', 'OA 21'] },
    ],
    6: [ // El terror y lo extraño — OA 1,2,3,6,7,11,14,15,17,21
      { numero: 1, titulo: 'Lectura literaria de terror y fantasía', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Comprensión y análisis crítico', oa_codes: ['OA 6', 'OA 7', 'OA 11'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 14', 'OA 15', 'OA 21'] },
    ],
    7: [ // Medios de comunicación — OA 1,9,10,12,13,18,19,20,22,23,24,25
      { numero: 1, titulo: 'Análisis de textos mediáticos', oa_codes: ['OA 1', 'OA 9', 'OA 10'] },
      { numero: 2, titulo: 'Escritura en contextos digitales', oa_codes: ['OA 12', 'OA 13', 'OA 19'] },
      { numero: 3, titulo: 'Comunicación oral e investigación', oa_codes: ['OA 20', 'OA 22', 'OA 24'] },
    ],
  },
  // 8° Básico — 7 unidades, OAs según Programa MINEDUC Dec. 628/2016
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
  // 1° Medio — OAs según Programa MINEDUC Dec. 628/2016
  '1° Medio': {
    1: [ // La libertad como tema literario — OA 1,3,4,7,8,12,21,24
      { numero: 1, titulo: 'Lectura literaria: romanticismo y libertad', oa_codes: ['OA 1', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Análisis crítico y argumentación', oa_codes: ['OA 7', 'OA 8', 'OA 12'] },
      { numero: 3, titulo: 'Comunicación oral e investigación', oa_codes: ['OA 21', 'OA 24'] },
    ],
    2: [ // Ciudadanos y opinión — OA 1,9,11,14,15,17,18,20,24
      { numero: 1, titulo: 'Lectura y análisis de textos argumentativos', oa_codes: ['OA 1', 'OA 9', 'OA 11'] },
      { numero: 2, titulo: 'Producción de textos persuasivos', oa_codes: ['OA 14', 'OA 15', 'OA 17'] },
      { numero: 3, titulo: 'Oralidad e investigación ciudadana', oa_codes: ['OA 18', 'OA 20', 'OA 24'] },
    ],
    3: [ // Relaciones humanas en el teatro — OA 1,2,5,6,16,21,23,24
      { numero: 1, titulo: 'Lectura dramática y narrativa', oa_codes: ['OA 1', 'OA 2', 'OA 5'] },
      { numero: 2, titulo: 'Análisis teatral y escritura', oa_codes: ['OA 6', 'OA 16', 'OA 21'] },
      { numero: 3, titulo: 'Comunicación oral e investigación', oa_codes: ['OA 23', 'OA 24'] },
    ],
    4: [ // Comunicación y sociedad — OA 4,10,13,15,19,21,22,23
      { numero: 1, titulo: 'Análisis de medios y discurso social', oa_codes: ['OA 4', 'OA 10', 'OA 13'] },
      { numero: 2, titulo: 'Producción de textos escritos', oa_codes: ['OA 15', 'OA 19', 'OA 21'] },
      { numero: 3, titulo: 'Comunicación oral y géneros discursivos', oa_codes: ['OA 22', 'OA 23'] },
    ],
  },
  // 2° Medio — OAs según Programa MINEDUC Dec. 628/2016
  '2° Medio': {
    1: [ // Sobre la ausencia: exilio, migración e identidad — OA 1,2,3,7,8,9,11,12,13,14,15,18,19,20,21,22,23,24
      { numero: 1, titulo: 'Lectura literaria: exilio e identidad', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Análisis crítico y argumentación', oa_codes: ['OA 7', 'OA 8', 'OA 9'] },
      { numero: 3, titulo: 'Producción escrita y oralidad', oa_codes: ['OA 12', 'OA 14', 'OA 21'] },
    ],
    2: [ // Ciudadanía y trabajo — OA 1,2,3,8,9,10,12,13,14,15,16,17,18,19,20,21,22,23,24
      { numero: 1, titulo: 'Lectura literaria y textos ciudadanos', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Análisis de medios y argumentación', oa_codes: ['OA 8', 'OA 9', 'OA 10'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 14', 'OA 21', 'OA 24'] },
    ],
    3: [ // Lo divino y lo humano — OA 1,2,4,6,8,9,11,12,13,14,15,18,19,21,22,23,24
      { numero: 1, titulo: 'Lectura literaria: lo sagrado y lo humano', oa_codes: ['OA 1', 'OA 2', 'OA 4'] },
      { numero: 2, titulo: 'Análisis dramático y argumentación', oa_codes: ['OA 6', 'OA 8', 'OA 9'] },
      { numero: 3, titulo: 'Producción escrita y oralidad', oa_codes: ['OA 14', 'OA 21', 'OA 22'] },
    ],
    4: [ // Poder y ambición — OA 1,2,3,5,6,8,9,11,12,14,15,18,19,20,21,22,23,24
      { numero: 1, titulo: 'Lectura literaria: poder y drama', oa_codes: ['OA 1', 'OA 2', 'OA 3'] },
      { numero: 2, titulo: 'Análisis crítico y argumentación', oa_codes: ['OA 5', 'OA 6', 'OA 8'] },
      { numero: 3, titulo: 'Producción de textos y oralidad', oa_codes: ['OA 14', 'OA 21', 'OA 22'] },
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
      const fallbackResult = levelLessonsStatic.map((l, idx) => {
        const oas = l.oa_codes.map((code, oaIdx) => {
          const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
          return {
            id: oaIdx + idx * 10 + 10000,
            codigo: code,
            texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.'
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
          const result = lecciones.map((l: any) => {
            const codes = (l.oa_basales || []).slice(0, 3);
            const oas = codes.map((code: string, idx: number) => {
              if (oasMap[code]) {
                return oasMap[code];
              }
              // Fallback estático en memoria
              const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
              return {
                id: `${l.id}-${code}-${idx}`,
                codigo: code,
                texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.'
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
      const fallbackResult = levelLessons.map((l, idx) => {
        const oas = l.oa_codes.map((code, oaIdx) => {
          const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
          return {
            id: oaIdx + idx * 10 + 10000,
            codigo: code,
            texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.'
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
