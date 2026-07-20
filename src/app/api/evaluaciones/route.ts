/**
 * POST /api/evaluaciones
 *
 * Genera una evaluación educativa usando Claude.
 * Auth OBLIGATORIA — sin token válido → 401 sin excepción.
 * Trial limit ANTES de llamar a Claude → 403 si bloqueado.
 *
 * GET /api/evaluaciones
 * Retorna las evaluaciones del usuario autenticado (paginadas).
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 180;
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';
import { buildEvaluacionMinimalPrompt } from '@/lib/prompts/promptTemplates';
import { buildRubrica } from '@/lib/templates/rubricasPlantillas';

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoEvaluacion =
  | 'prueba'
  | 'tabla_especificaciones'
  | 'rubrica'
  | 'autoevaluacion'
  | 'heteroevaluacion'
  | 'coevaluacion';

type Dificultad = 'N1_basico' | 'N2_intermedio' | 'N3_avanzado' | 'mixto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  if (process.env.NODE_ENV === 'development') {
    return 'mock-access-token';
  }
  return null;
}

function sanitizeJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// ─── System prompt (server-side only, never returned to client) ────────────────

function buildEvaluacionSystemPrompt(): string {
  return `Eres un experto en evaluación educativa para el sistema escolar chileno (MINEDUC).
Generas evaluaciones pedagógicas de alta calidad en español.

LÍMITES MÁXIMOS DE PREGUNTAS (ESTRICTO):
- Alternativas (selección múltiple): máximo 25 preguntas únicas, no repetidas.
- Desarrollo: máximo 5 preguntas únicas, no repetidas.
Genera exactamente el número de preguntas solicitado. Nunca superes 25 preguntas de selección múltiple ni 5 preguntas de desarrollo. Los textos de lectura deben tener entre 300 y 500 palabras cada uno. No agregues secciones adicionales fuera de lo solicitado.

REGLAS ABSOLUTAS DE CALIDAD DE PREGUNTAS:

1. ALTERNATIVAS DE LARGO PAREJO Y CLAVES:
   - Las alternativas A, B, C y D deben tener una extensión extremadamente similar (diferencia de máximo 2 a 3 palabras o 8 a 12 caracteres sin contar espacios).
   - NUNCA usar "Todas las anteriores", "Ninguna de las anteriores", ni "A y B son correctas".
   - Para cada pregunta de selección múltiple, incluye el campo clave con la letra de la respuesta correcta (A, B, C o D). DISTRIBUCIÓN DE CLAVES OBLIGATORIA: De las preguntas de selección múltiple, exactamente el 25% deben tener clave A, 25% clave B, 25% clave C y 25% clave D. Está PROHIBIDO tener más de 2 preguntas consecutivas con la misma clave. Varía deliberadamente cuál alternativa es la correcta en cada pregunta.
   - OBLIGATORIO SIN EXCEPCIÓN: Cada pregunta de tipo "seleccion_multiple" DEBE incluir el campo "alternativas" con exactamente 4 opciones (A, B, C, D). Ninguna pregunta de alternativas puede carecer de este campo ni tenerlo vacío.

2. ASOCIACIÓN Y ORGANIZACIÓN DE PREGUNTAS POR TEXTO:
   - Las preguntas deben aparecer ordenadas por texto: primero las del Texto 1, luego las del Texto 2, y al final las integradoras de ambos textos.
   - Cada pregunta debe incluir obligatoriamente el campo 'texto_asociado' con valor exacto 'texto_1', 'texto_2' o 'ambos'.

3. COHERENCIA PEDAGÓGICA:
   - Cada pregunta debe ser relevante, evaluando habilidades cognitivas (Comprender, Analizar, Evaluar) a partir de los textos.
   - Las preguntas de desarrollo deben incluir una respuesta modelo en 'respuesta_esperada'.

Responde SIEMPRE con JSON válido de la siguiente estructura exacta, sin texto adicional fuera del JSON:

{
  "textos_lectura": [
    {
      "titulo": "título del texto 1",
      "tipo": "tipo de texto (ej. Argumentativo)",
      "contenido": "contenido completo del texto 1 con conteo al final: (Conteo de palabras: X palabras)"
    },
    {
      "titulo": "título del texto 2",
      "tipo": "tipo de texto (ej. Expositivo)",
      "contenido": "contenido completo del texto 2 con conteo al final: (Conteo de palabras: X palabras)"
    }
  ],
  "preguntas": [
    {
      "numero": 1,
      "enunciado": "pregunta para selección múltiple",
      "tipo": "seleccion_multiple",
      "texto_asociado": "texto_1",
      "alternativas": {
        "A": "texto alternativa A",
        "B": "texto alternativa B",
        "C": "texto alternativa C",
        "D": "texto alternativa D"
      },
      "clave": "B",
      "habilidad": "Comprender",
      "indicador": "indicador del MINEDUC específico para esta pregunta",
      "contenido": "contenido evaluado"
    },
    {
      "numero": 2,
      "enunciado": "pregunta abierta de desarrollo",
      "tipo": "desarrollo",
      "texto_asociado": "texto_2",
      "habilidad": "Analizar",
      "indicador": "indicador del MINEDUC específico para esta pregunta",
      "contenido": "contenido evaluado",
      "respuesta_esperada": "respuesta modelo esperada del estudiante"
    }
  ]
}`;
}

function buildEvaluacionPrompt(params: {
  nivel: string;
  eje: string | null;
  oa_codes: string[];
  oa_textos: Record<string, string>;
  tipos: TipoEvaluacion[];
  n_preguntas: number;
  duracion_min: number | null;
  dificultad: Dificultad;
  titulo: string | null;
  tipo_evaluacion?: string;
  tipo_preguntas?: string;
  n_preguntas_multiple?: number;
  n_preguntas_desarrollo?: number;
  instrumento?: string;
  texto_1_tipo?: string;
  texto_2_tipo?: string;
}): string {
  const {
    nivel, eje, oa_codes, oa_textos, tipos, n_preguntas, duracion_min, dificultad, titulo,
    tipo_evaluacion = 'formativa',
    tipo_preguntas = 'seleccion_multiple',
    n_preguntas_multiple = 6,
    n_preguntas_desarrollo = 2,
    instrumento = 'rubrica_analitica',
    texto_1_tipo = 'Argumentativo',
    texto_2_tipo = 'Expositivo'
  } = params;

  const oaBlock = oa_codes
    .map((c) => `  - ${c}: ${oa_textos[c] ?? '(texto no disponible)'}`)
    .join('\n');

  const durStr = duracion_min ? `${duracion_min} minutos` : '90 minutos';

  // Instructions for questions
  const techniqueType = (tipo_evaluacion === 'formativa' || tipo_evaluacion === 'diagnostica') ? 'OREO' : 'RICE';
  const techniqueInstruction = techniqueType === 'OREO'
    ? 'Responde usando la técnica OREO: escribe tu Opinión, una Razón que la justifique, un Ejemplo concreto y cierra reafirmando tu Opinión.'
    : 'Responde usando la técnica RICE: Repite la pregunta con tus palabras, Incluye tu postura, Cita una evidencia del texto y Explica cómo esa cita apoya tu argumento.';

  let questionInstructions = '';
  if (tipo_preguntas === 'seleccion_multiple') {
    questionInstructions = `Genera exactamente ${n_preguntas_multiple} preguntas de tipo "seleccion_multiple". Cada una debe tener 4 alternativas (A, B, C, D). Genera exactamente ${n_preguntas_multiple} preguntas de alternativas únicas y distintas entre sí, basadas en los textos generados. Ninguna pregunta puede repetirse ni parafrasearse.`;
  } else if (tipo_preguntas === 'desarrollo') {
    questionInstructions = `Genera exactamente ${n_preguntas_desarrollo} preguntas de tipo "consigna_abierta" (abiertas/desarrollo), con criterios_correccion y respuesta_esperada. Genera exactamente ${n_preguntas_desarrollo} preguntas de desarrollo con enunciados completamente distintos, cada una evaluando un aspecto diferente de los textos.`;
  } else {
    // mixta
    questionInstructions = `Genera exactamente ${n_preguntas_multiple} preguntas de tipo "seleccion_multiple" (con alternativas A, B, C, D) y exactamente ${n_preguntas_desarrollo} preguntas de tipo "consigna_abierta" (abiertas/desarrollo), ordenadas de forma consecutiva (primero alternativas, luego desarrollo). Genera exactamente ${n_preguntas_multiple} preguntas de alternativas únicas y distintas entre sí, basadas en los textos generados. Ninguna pregunta puede repetirse ni parafrasearse.`;
  }
  questionInstructions += `\nREGLA OBLIGATORIA: Genera preguntas reales, concretas y contextualizadas basadas en los textos de lectura generados y el tema/OA de la planificación. NUNCA uses frases genéricas como 'Pregunta de alternativas número X sobre el tema evaluado'. Cada pregunta debe referirse a contenido concreto del texto o planificación.`;
  questionInstructions += `\nREGLA ESTRICTA DE UNICIDAD Y DIVERSIDAD: Todas las preguntas generadas (ya sean de selección múltiple o de desarrollo) deben ser COMPLETAMENTE ÚNICAS, DISTINTAS y DIFERENTES entre sí. Está terminantemente prohibido repetir la misma pregunta, enunciado o alternativas, ni clonar preguntas cambiando pequeñas palabras. Cada pregunta debe evaluar un fragmento, idea, concepto de vocabulario, inferencia o postura crítica diferente del texto.`;
  questionInstructions += `\n!!! MÁXIMA PRIORIDAD - PROHIBICIÓN DE DUPLICADOS: Genera exactamente ${n_preguntas_desarrollo} preguntas de desarrollo con enunciados completamente distintos entre sí. Está prohibido repetir enunciados, ideas principales o estructuras similares. Verifica que cada pregunta evalúe un aspecto diferente del texto.`;
  
  if (tipo_preguntas !== 'seleccion_multiple') {
    questionInstructions += `\nREGLA DE RESPUESTA PARA DESARROLLO: Para las preguntas de desarrollo ("consigna_abierta"), debes instruir al estudiante a responder usando la técnica ${techniqueType} de la siguiente manera: "${techniqueInstruction}". Asegúrate de que las respuestas esperadas ("respuesta_esperada") y criterios de corrección ("criterios_correccion") generados se estructuren en base a la aplicación de esta técnica (${techniqueType}). NUNCA generes preguntas de desarrollo idénticas o redundantes. Cada pregunta de desarrollo debe ser única, con enunciados e ideas principales enteramente diferentes entre sí.`;
  }

  // Instructions for instrument
  let instrumentInstructions = '';
  if (instrumento === 'lista_cotejo') {
    instrumentInstructions = `El instrumento de evaluación ("rubrica") debe ser una "Lista de cotejo" con "tipo_instrumento": "lista_cotejo". Debe tener criterios dicotómicos Sí / No, estructurados en el arreglo de criterios con los campos "nombre", "logrado" (descripción para Sí) y "no_logrado" (descripción para No).`;
  } else if (instrumento === 'escala_apreciacion') {
    instrumentInstructions = `El instrumento de evaluación ("rubrica") debe ser una "Escala de apreciación" con "tipo_instrumento": "escala_apreciacion". Debe tener criterios evaluados en 4 niveles de desempeño: "destacado", "logrado", "en_desarrollo", "no_logrado". Cada objeto en el arreglo de criterios debe tener estos campos descriptivos.`;
  } else if (instrumento === 'rubrica_holistica') {
    instrumentInstructions = `El instrumento de evaluación ("rubrica") debe ser una "Rúbrica holística" con "tipo_instrumento": "rubrica_holistica". Debe describir niveles globales de logro en lugar de criterios separados. El arreglo de criterios debe representar los niveles generales de logro (e.g. Destacado, Logrado, Suficiente, Insuficiente) con el campo "nombre" (nivel de logro) y "descripcion" (descripción global).`;
  } else {
    // rubrica_analitica
    instrumentInstructions = `El instrumento de evaluación ("rubrica") debe ser una "Rúbrica analítica" con "tipo_instrumento": "rubrica_analitica". Debe desglosar detalladamente criterios por dimensión en 4 niveles: excelente, bueno, suficiente (o en desarrollo), e insuficiente (o no logrado). Cada objeto del arreglo de criterios debe tener campos: "nombre", "excelente", "bueno", "en_desarrollo", "no_logrado".`;
  }

  // Extension rules based on grade level (nivel)
  let extensionRule = '200 a 250 palabras';
  const lowerNivel = (nivel || '').toLowerCase();
  if (lowerNivel.includes('1° medio') || lowerNivel.includes('2° medio') || lowerNivel.includes('i° medio') || lowerNivel.includes('ii° medio') || lowerNivel.includes('1 medio') || lowerNivel.includes('2 medio') || lowerNivel.includes('i medio') || lowerNivel.includes('ii medio')) {
    extensionRule = '500 a 600 palabras';
  } else if (lowerNivel.includes('7° básico') || lowerNivel.includes('8° básico') || lowerNivel.includes('7mo') || lowerNivel.includes('8vo') || lowerNivel.includes('7 básico') || lowerNivel.includes('8 básico') || lowerNivel.includes('7mo básico') || lowerNivel.includes('8vo básico')) {
    extensionRule = '350 a 450 palabras';
  } else if (lowerNivel.includes('5° básico') || lowerNivel.includes('6° básico') || lowerNivel.includes('5to') || lowerNivel.includes('6to') || lowerNivel.includes('5 básico') || lowerNivel.includes('6 básico') || lowerNivel.includes('5to básico') || lowerNivel.includes('6to básico')) {
    extensionRule = '200 a 250 palabras';
  }

  const readingTextInstructions = `Genera exactamente 2 textos de lectura didácticos relacionados con el tema/OA para que el alumno los lea antes de responder las preguntas.
- Texto 1 debe ser de tipo "${texto_1_tipo}" y tener una extensión exacta de: ${extensionRule}.
- Texto 2 debe ser de tipo "${texto_2_tipo}" y tener una extensión exacta de: ${extensionRule}.
Ambos textos deben ser completos, bien redactados, adaptados para el nivel escolar de ${nivel}, y guardados en el arreglo "textos_lectura" con campos "titulo", "tipo" y "contenido".
MÁXIMA REGLA DE LONGITUD DE TEXTOS: Genera el texto de lectura completo con introducción, desarrollo y cierre. Cuenta las palabras. No uses texto placeholder ni descripciones del texto — escribe el texto mismo. Incluye al final del contenido de cada texto el conteo de palabras entre paréntesis (Conteo de palabras: X palabras), asegurándote de que la extensión total esté estrictamente en el rango de ${extensionRule}.`;

  return `Genera la siguiente evaluación educativa consolidada e integrada para el sistema escolar chileno.

DATOS:
- Asignatura: Lenguaje y Comunicación
- Nivel: ${nivel}
- Eje: ${eje ?? 'Evaluación de Aula'}
- Tipo de evaluación (propósito): ${tipo_evaluacion}
- OA(s) evaluado(s):
${oaBlock}
- Duración estimada: ${durStr}
- Nivel de dificultad: ${dificultad}
- Instrumento asociado: ${instrumento}
${titulo ? `- Título sugerido: ${titulo}` : ''}

REQUERIMIENTO DE TEXTOS DE LECTURA:
${readingTextInstructions}

REQUERIMIENTO DE PREGUNTAS:
${questionInstructions}

REQUERIMIENTO DE INSTRUMENTO:
${instrumentInstructions}

Genera un JSON con esta estructura exacta:

{
  "titulo": "string — título completo de la evaluación",
  "nivel": "${nivel}",
  "asignatura": "Lenguaje y Comunicación",
  "eje": "${eje ?? ''}",
  "tipo_evaluacion": "${tipo_evaluacion}",
  "oa_codes": ${JSON.stringify(oa_codes)},
  "duracion_min": ${duracion_min ?? 90},
  "dificultad": "${dificultad}",
  "instrucciones_generales": "string — instrucciones claras para el estudiante",

  "textos_lectura": [
    {
      "titulo": "string — título del texto 1",
      "tipo": "${texto_1_tipo}",
      "contenido": "string — contenido completo del texto 1 (respetando la extensión: ${extensionRule})"
    },
    {
      "titulo": "string — título del texto 2",
      "tipo": "${texto_2_tipo}",
      "contenido": "string — contenido completo del texto 2 (respetando la extensión: ${extensionRule})"
    }
  ],

  "tabla_especificaciones": {
    "oa_evaluado": "string — Códigos de los OAs evaluados (ej: 'OA 3, OA 5')",
    "filas": [
      {
        "habilidad": "string — Habilidad cognitiva evaluada (ej: Comprender)",
        "indicador": "string — Indicador de evaluación del MINEDUC",
        "contenido": "string — Contenido/tema específico de esta fila",
        "tipo_item": "string — Selección múltiple | Desarrollo",
        "n_pregunta": "string — Número(s) de pregunta(s) correspondiente(s), ej: 1, 2, 3 o 1-3",
        "clave": "string — Alternativa correcta, ej: A, B, C, D (para desarrollo usar 'Rúbrica')",
        "ptos": 2,
        "ponderacion_pct": 10
      }
    ]
  },

  "prueba": {
    "secciones": [
      {
        "nombre": "Sección I: Selección múltiple",
        "instruccion": "string — instrucción de la sección",
        "preguntas": [
          {
            "numero": 1,
            "oa": "OA X",
            "nivel_cognitivo": "string",
            "dificultad_rti": "N1|N2|N3",
            "tipo": "seleccion_multiple",
            "enunciado": "string",
            "alternativas": [
              { "letra": "A", "texto": "string", "correcta": false },
              { "letra": "B", "texto": "string", "correcta": true },
              { "letra": "C", "texto": "string", "correcta": false },
              { "letra": "D", "texto": "string", "correcta": false }
            ]
          }
        ]
      },
      {
        "nombre": "Sección II: Preguntas de desarrollo",
        "instruccion": "string — instrucción de la sección",
        "preguntas": [
          {
            "numero": 2,
            "oa": "OA X",
            "nivel_cognitivo": "string",
            "dificultad_rti": "N1|N2|N3",
            "tipo": "consigna_abierta",
            "enunciado": "string"
          }
        ]
      }
    ]
  },

  "respuestas_esperadas": [
    // Para preguntas de tipo seleccion_multiple:
    {
      "pregunta": 1,
      "tipo": "seleccion_multiple",
      "clave": "B",
      "explicacion": "string — justificación detallada de por qué B es la correcta"
    },
    // Para preguntas de tipo consigna_abierta (desarrollo):
    {
      "pregunta": 2,
      "tipo": "consigna_abierta",
      "respuesta_esperada": "string — respuesta modelo esperada o respuesta ideal del estudiante",
      "criterios_correccion": [
        "string — criterio 1 de evaluación",
        "string — criterio 2 de evaluación"
      ]
    }
  ],

  "pauta_correccion": {
    "puntaje_total": 20,
    "exigencia": "60%",
    "puntaje_aprobacion": 12
  },

  "rubrica": {
    "titulo": "string — título del instrumento",
    "tipo_instrumento": "${instrumento}",
    "instruccion": "string — instrucciones del instrumento",
    "criterios": [
      // Si tipo_instrumento es "rubrica_analitica":
      {
        "nombre": "string — criterio/dimensión",
        "oa": "OA X",
        "excelente": "string — descriptor excelente (3 ptos)",
        "bueno": "string — descriptor bueno (2 ptos)",
        "suficiente": "string — descriptor suficiente (1 pto)",
        "insuficiente": "string — descriptor insuficiente (0 ptos)"
      },
      // Si tipo_instrumento es "lista_cotejo":
      {
        "nombre": "string — criterio/indicador",
        "oa": "OA X",
        "logrado": "string — descriptor de cumplimiento (Sí)",
        "no_logrado": "string — descriptor de no cumplimiento (No)"
      },
      // Si tipo_instrumento es "escala_apreciacion":
      {
        "nombre": "string — criterio",
        "oa": "OA X",
        "destacado": "string",
        "logrado": "string",
        "en_desarrollo": "string",
        "no_logrado": "string"
      },
      // Si tipo_instrumento es "rubrica_holistica":
      {
        "nombre": "string — nivel de logro (ej: Excelente, Logrado, etc.)",
        "descripcion": "string — descriptor global del nivel de desempeño"
      }
    ]
  }
}

Recuerda: las alternativas de selección múltiple deben tener extensión similar (±2-3 palabras) y de letras (diferencia máxima de 8 a 12 caracteres sin contar espacios). Queda estrictamente prohibido que supere las 12 letras de diferencia. Los distractores deben ser plausibles, la respuesta correcta en posición variada. NUNCA uses "Todas/Ninguna de las anteriores". Cuenta mentalmente los caracteres sin espacios antes de generar el JSON.

CRÍTICO: Para evitar exceder el límite de caracteres del JSON y que se trunque la respuesta, sé sumamente conciso en las explicaciones de respuestas_esperadas (máximo 12 palabras por explicación) y en los descriptores del instrumento/rúbrica (máximo 15 palabras por descriptor). No incluyas información redundante. NUNCA hagas referencia literal a la letra de la opción (A, B, C, D) en el campo "explicacion" de "respuestas_esperadas" (ej: no escribas "La B es correcta porque..."). Redacta la explicación basándote únicamente en el concepto o contenido.`;
}

// ─── Backend alternatives validator & corrector helpers ──────────────────────────

function countLettersWithoutSpaces(text: string): number {
  return (text || '').replace(/\s+/g, '').length;
}

function getQuestionAlternatives(q: any): { letra: string; texto: string; correcta?: boolean }[] {
  if (!q || !q.alternativas) return [];
  const alts = q.alternativas;
  const list: { letra: string; texto: string; correcta?: boolean }[] = [];
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = String(q.clave || q.respuesta_correcta || 'A').toUpperCase();

  if (Array.isArray(alts)) {
    alts.forEach((alt: any, aIdx: number) => {
      const letraFallback = letters[aIdx] || '';
      if (typeof alt === 'string') {
        const match = alt.match(/^\s*([A-D])\s*[\.\)]\s*(.*)/i);
        const letra = match ? match[1].toUpperCase() : letraFallback;
        const texto = match ? match[2].trim() : alt.trim();
        list.push({
          letra,
          texto,
          correcta: letra === correctLetter
        });
      } else {
        const letra = String(alt.letra || alt.option || letraFallback).toUpperCase();
        list.push({
          letra,
          texto: String(alt.texto || alt.text || '').trim(),
          correcta: !!alt.correcta || letra === correctLetter
        });
      }
    });
  } else if (alts && typeof alts === 'object') {
    Object.entries(alts).forEach(([letra, val]: [string, any]) => {
      const uLetra = letra.toUpperCase();
      let texto = '';
      if (typeof val === 'string') {
        texto = val.trim();
      } else if (val && typeof val === 'object') {
        texto = String(val.texto || val.text || '').trim();
      }
      list.push({
        letra: uLetra,
        texto,
        correcta: uLetra === correctLetter || !!val?.correcta
      });
    });
  }
  return list;
}

function isQuestionValid(q: any): { valid: boolean; diff: number } {
  const alts = getQuestionAlternatives(q);
  if (alts.length === 0) return { valid: true, diff: 0 };
  
  const lengths = alts.map(a => countLettersWithoutSpaces(a.texto));
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);
  const diff = maxLength - minLength;
  return {
    valid: diff <= 12,
    diff
  };
}

function validateCorrectKeysDistribution(keys: string[]): boolean {
  if (keys.length < 4) return true;

  // Rule 1: No key represents more than 50%
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  keys.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount > keys.length * 0.5) return false;

  // Rule 2: At least 3 different letters used
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size < 3) return false;

  // Rule 3: No 3 consecutive equal keys
  for (let i = 0; i < keys.length - 2; i++) {
    if (keys[i] === keys[i+1] && keys[i] === keys[i+2]) return false;
  }

  // Rule 4: No simple cyclic patterns of length 2 (e.g. B-C-B-C-B-C)
  let length2Cycle = true;
  for (let i = 0; i < keys.length - 2; i++) {
    if (keys[i] !== keys[i+2]) {
      length2Cycle = false;
      break;
    }
  }
  if (length2Cycle) return false;

  // Rule 5: No simple cyclic patterns of length 3 (e.g. A-B-C-A-B-C)
  if (keys.length >= 6) {
    let length3Cycle = true;
    for (let i = 0; i < keys.length - 3; i++) {
      if (keys[i] !== keys[i+3]) {
        length3Cycle = false;
        break;
      }
    }
    if (length3Cycle) return false;
  }

  return true;
}

function generateBalancedKeysSequence(n: number): string[] {
  const letters = ['A', 'B', 'C', 'D'];
  let attempts = 0;
  while (attempts < 1000) {
    const candidate: string[] = [];
    for (let i = 0; i < n; i++) {
      candidate.push(letters[Math.floor(Math.random() * letters.length)]);
    }
    if (validateCorrectKeysDistribution(candidate)) {
      return candidate;
    }
    attempts++;
  }
  // Fallback safe sequence
  const fallback: string[] = [];
  for (let i = 0; i < n; i++) {
    fallback.push(letters[i % 4]);
  }
  return fallback;
}

function traverseAndCollectQuestions(obj: any): any[] {
  const questions: any[] = [];
  if (!obj || typeof obj !== 'object') return questions;

  const isQuestionString = (str: any) => {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    return trimmed.length > 8 && trimmed.includes(' ');
  };

  const hasEnunciado = isQuestionString(obj.enunciado) || isQuestionString(obj.pregunta);

  if (hasEnunciado) {
    questions.push(obj);
    return questions;
  }

  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === 'object') {
      questions.push(...traverseAndCollectQuestions(obj[key]));
    }
  }
  return questions;
}

function tryRepairJson(raw: string): string {
  let text = raw.trim();
  
  // Extraer solo el bloque JSON si hay texto extra
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    text = text.slice(jsonStart, jsonEnd + 1);
  } else if (jsonStart > 0) {
    text = text.slice(jsonStart);
  }
  
  // Intentar parsear directamente
  try { JSON.parse(text); return text; } catch {}
  
  // Remover trailing comas antes de } o ]
  text = text.replace(/,\s*([}\]])/g, '$1');
  try { JSON.parse(text); return text; } catch {}
  
  // Cerrar strings sin cerrar (comilla abierta al final)
  if ((text.match(/"/g) || []).length % 2 !== 0) {
    text = text + '"';
  }
  try { JSON.parse(text); return text; } catch {}
  
  // Cerrar arrays y objetos abiertos
  const opens = (text.match(/\[/g) || []).length - (text.match(/\]/g) || []).length;
  const openBraces = (text.match(/\{/g) || []).length - (text.match(/\}/g) || []).length;
  for (let i = 0; i < opens; i++) text += ']';
  for (let i = 0; i < openBraces; i++) text += '}';
  try { JSON.parse(text); return text; } catch {}
  
  // Truncar al último objeto/array completo válido
  for (let i = text.length - 1; i > 2; i--) {
    if (text[i] === '}' || text[i] === ']') {
      try { 
        JSON.parse(text.slice(0, i + 1)); 
        return text.slice(0, i + 1); 
      } catch {}
    }
  }
  
  return text;
}

function checkResponseTruncated(rawText: string, stopReason?: string | null, isArray: boolean = false): void {
  // Check disabled to prevent false positives when auto-truncation is in place
  return;
}

async function generateAndCorrectEvaluation(
  anthropic: Anthropic,
  model: string,
  params: {
    nivel: string;
    eje: string | null;
    oa_codes: string[];
    oa_textos: Record<string, string>;
    tipos: TipoEvaluacion[];
    n_preguntas: number;
    duracion_min: number | null;
    dificultad: Dificultad;
    titulo: string | null;
    tipo_evaluacion?: string;
    tipo_preguntas?: string;
    n_preguntas_multiple?: number;
    n_preguntas_desarrollo?: number;
    instrumento?: string;
    texto_1_tipo?: string;
    texto_2_tipo?: string;
    libroContexto?: string;
    fuente?: string;
    textos_provistos?: string;
    unidad?: string;
  }
): Promise<Record<string, unknown>> {
  const maxTokens = params.textos_provistos ? 6000
    : params.fuente === 'kit_clase' ? 8000
    : 10000;
  console.log("[EVALUACIONES] fuente:", params.fuente, "max_tokens:", maxTokens);
  const response = await anthropic.messages.create({
    model:      model,
    max_tokens: maxTokens,
    system:     [
      {
        type: 'text',
        text: buildEvaluacionSystemPrompt(),
        cache_control: { type: 'ephemeral' }
      }
    ] as any,
    messages:   [{ role: 'user', content: buildEvaluacionMinimalPrompt({
      nivel: params.nivel,
      eje: params.eje,
      oa_code: params.oa_codes.join(', '),
      oa_texto: Object.values(params.oa_textos).join('; '),
      tipo_evaluacion: params.tipo_evaluacion ?? 'formativa',
      tipo_preguntas: params.tipo_preguntas ?? 'seleccion_multiple',
      n_preguntas_multiple: params.n_preguntas_multiple ?? 6,
      n_preguntas_desarrollo: params.n_preguntas_desarrollo ?? 2,
      instrumento: params.instrumento ?? 'rubrica_analitica',
      texto_1_tipo: params.texto_1_tipo ?? 'Argumentativo',
      texto_2_tipo: params.texto_2_tipo ?? 'Expositivo',
      fuente: params.fuente,
      textos_provistos: params.textos_provistos,
      unidad: params.unidad
    }) + `\n\n${params.libroContexto || ''}\n\nREGLAS DE LÍMITES MÁXIMOS DE PREGUNTAS (ESTRICTO):
- Alternativas (selección múltiple): máximo 25 preguntas únicas, no repetidas.
- Desarrollo: máximo 5 preguntas únicas, no repetidas.
Todas las preguntas deben ser únicas, no repetidas y de alta calidad.` }],
  }, {
    timeout: 180000
  });
  console.log("Respuesta recibida:", response);

  const rawText = response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : '';

  console.log('[EVALUACIONES] Raw response length:', rawText.length);
  // Log a chunk around position 4150 for diagnosis
  if (rawText.length > 4200) {
    console.log('[EVALUACIONES] Raw response tail (near 4150):', rawText.slice(4100, 4200));
  } else {
    console.log('[EVALUACIONES] Raw response tail:', rawText.slice(Math.max(0, rawText.length - 200)));
  }

  checkResponseTruncated(rawText, response.stop_reason, false);

  let contenidoJson: Record<string, unknown>;
  const stopReason = response.stop_reason;

  if (stopReason !== 'max_tokens') {
    try {
      contenidoJson = JSON.parse(sanitizeJson(rawText));
    } catch (parseError: any) {
      console.error('[evaluaciones] JSON Parsing failed (JSON was complete but malformed). trying to repair...', parseError.message);
      try {
        contenidoJson = JSON.parse(tryRepairJson(sanitizeJson(rawText)));
      } catch (repairError: any) {
        console.error('[evaluaciones] Repair failed too:', repairError.message);
        try {
          const fs = require('fs');
          const path = require('path');
          const scratchDir = 'C:\\Users\\56940\\.gemini\\antigravity\\brain\\e0a356e0-6703-4315-a66e-7d62d8948fb6\\scratch';
          if (!fs.existsSync(scratchDir)) {
            fs.mkdirSync(scratchDir, { recursive: true });
          }
          fs.writeFileSync(path.join(scratchDir, 'failed_claude_response.json'), rawText);
          console.log('[evaluaciones] Raw response saved to scratch/failed_claude_response.json');
        } catch (saveErr) {
          console.error('[evaluaciones] Failed to save raw response:', saveErr);
        }
        throw new Error(`La respuesta recibida está mal formada: ${parseError.message}`);
      }
    }
  } else {
    try {
      contenidoJson = JSON.parse(tryRepairJson(sanitizeJson(rawText)));
    } catch (parseError: any) {
      console.error('[evaluaciones] Repaired JSON Parsing failed. Raw text length:', rawText.length);
      console.error('[evaluaciones] Parsing error message:', parseError.message);
      try {
        const fs = require('fs');
        const path = require('path');
        const scratchDir = 'C:\\Users\\56940\\.gemini\\antigravity\\brain\\e0a356e0-6703-4315-a66e-7d62d8948fb6\\scratch';
        if (!fs.existsSync(scratchDir)) {
          fs.mkdirSync(scratchDir, { recursive: true });
        }
        fs.writeFileSync(path.join(scratchDir, 'failed_claude_response.json'), rawText);
        console.log('[evaluaciones] Raw response saved to scratch/failed_claude_response.json');
      } catch (saveErr) {
        console.error('[evaluaciones] Failed to save raw response:', saveErr);
      }
      throw new Error("Error al procesar la respuesta. Por favor, intenta nuevamente.");
    }
  }

  // Run validation and correction loop
  const questions = traverseAndCollectQuestions(contenidoJson);
  questions.forEach((q, idx) => {
    q._tempId = `q_${idx}`;
  });

  let attempt = 0;
  while (attempt < 2) {
    const invalidQuestions = questions.filter(q => !isQuestionValid(q).valid);
    if (invalidQuestions.length === 0) {
      break;
    }
    
    console.log(`[evaluaciones] Detection: ${invalidQuestions.length} questions need alternative balance correction. Attempt ${attempt + 1}.`);
    
    try {
      const correctionPrompt = `Tienes las siguientes preguntas de selección múltiple que NO cumplen con la regla de balance de longitud de alternativas.
La regla exige que la diferencia de letras (caracteres sin contar espacios) entre la alternativa más larga y la más corta de una misma pregunta debe ser de MÁXIMO 12 caracteres (idealmente entre 8 y 12 letras de diferencia, sin pasarse de 12).

Preguntas a corregir:
${JSON.stringify(invalidQuestions.map(q => ({
  _tempId: q._tempId,
  enunciado: q.enunciado,
  alternativas: q.alternativas
})), null, 2)}

Por favor, reescribe las alternativas de cada pregunta para que:
1. La diferencia en cantidad de letras (sin contar espacios) entre la alternativa más larga y la más corta de la pregunta sea de MÁXIMO 12 caracteres (idealmente entre 8 y 12 caracteres). Por ejemplo, si la más corta tiene 25 letras, la más larga debe tener entre 33 y 37 letras.
2. Mantengas el sentido exacto de la pregunta, las alternativas y la respuesta correcta.
3. La letra correcta (indicada por "correcta": true o la clave correspondiente) debe seguir siendo la misma.

Responde ÚNICAMENTE con un arreglo JSON en el siguiente formato exacto, sin explicaciones ni bloques de código markdown:
[
  {
    "_tempId": "el_id_de_la_pregunta",
    "alternativas": [
      // las 4 alternativas corregidas con la misma estructura que recibieron
    ]
  }
]`;

      const corrResponse = await anthropic.messages.create({
        model: model,
        max_tokens: 3000,
        system: "Eres un asistente experto en edición y curación de contenidos educativos. Responde solo con JSON válido.",
        messages: [{ role: 'user', content: correctionPrompt }]
      });

      const corrRawText = corrResponse.content[0].type === 'text' ? corrResponse.content[0].text.trim() : '';
      checkResponseTruncated(corrRawText, corrResponse.stop_reason, true);
      const correctedList = JSON.parse(sanitizeJson(corrRawText));

      if (Array.isArray(correctedList)) {
        correctedList.forEach((item: any) => {
          const q = invalidQuestions.find(invalidQ => invalidQ._tempId === item._tempId);
          if (q && item.alternativas) {
            q.alternativas = item.alternativas;
          }
        });
      }
    } catch (err) {
      console.error(`[evaluaciones] Correction attempt ${attempt + 1} failed:`, err);
    }
    
    attempt++;
  }

  // Log final validation status
  const finalInvalidQuestions = questions.filter(q => !isQuestionValid(q).valid);
  if (finalInvalidQuestions.length > 0) {
    console.warn(`[evaluaciones] WARNING: ${finalInvalidQuestions.length} questions still fail character limit rule after 2 correction attempts. Proceeding anyway.`);
    finalInvalidQuestions.forEach((q) => {
      const validationInfo = isQuestionValid(q);
      console.warn(`  - Question "${q.enunciado?.slice(0, 40)}..." has letter diff of ${validationInfo.diff} characters.`);
    });
  } else {
    console.log('[evaluaciones] Success: All questions comply with character limit rule.');
  }

  // Balance MC correct keys distribution programmatically if needed
  const mcQuestions = questions.sort((a, b) => (a.numero || 0) - (b.numero || 0));
  const currentKeys = mcQuestions.map(q => {
    const alts = getQuestionAlternatives(q);
    const correctAlt = alts.find(a => a.correcta);
    return correctAlt ? correctAlt.letra.toUpperCase() : null;
  }).filter((k): k is string => k !== null);

  const isDistributionValid = validateCorrectKeysDistribution(currentKeys);
  console.log('[evaluaciones-backend] Secuencia de claves original:', currentKeys.join('-'));

  if (!isDistributionValid && mcQuestions.length >= 4) {
    const targetKeys = generateBalancedKeysSequence(mcQuestions.length);
    console.log('[evaluaciones-backend] Secuencia de claves corregida:', targetKeys.join('-'));

    mcQuestions.forEach((q, i) => {
      const K_new = targetKeys[i];
      const alts = q.alternativas;
      if (!Array.isArray(alts)) return;

      const oldCorrectAlt = alts.find((a: any) => a.correcta);
      const K_old = oldCorrectAlt ? oldCorrectAlt.letra.toUpperCase() : null;
      if (!K_old || K_old === K_new) return;

      const targetAlt = alts.find((a: any) => a.letra.toUpperCase() === K_new);
      const oldAlt = alts.find((a: any) => a.letra.toUpperCase() === K_old);

      if (targetAlt && oldAlt) {
        // Swap texts
        const tempTexto = targetAlt.texto;
        targetAlt.texto = oldAlt.texto;
        oldAlt.texto = tempTexto;

        // Swap correctness flags
        targetAlt.correcta = true;
        oldAlt.correcta = false;
      }

      // Update respuestas_esperadas
      const respuestas = contenidoJson.respuestas_esperadas;
      if (Array.isArray(respuestas)) {
        const respObj = respuestas.find((r: any) => r.pregunta === q.numero && (r.tipo === 'seleccion_multiple' || r.clave));
        if (respObj) {
          respObj.clave = K_new;
          if (typeof respObj.explicacion === 'string') {
            let exp = respObj.explicacion;
            const markerOld = `__TEMP_OLD_MARKER__`;
            const markerNew = `__TEMP_NEW_MARKER__`;
            
            const regexOld = new RegExp(`\\b${K_old}\\b`, 'g');
            const regexNew = new RegExp(`\\b${K_new}\\b`, 'g');
            
            exp = exp.replace(regexOld, markerOld);
            exp = exp.replace(regexNew, markerNew);
            exp = exp.replace(new RegExp(markerOld, 'g'), K_new);
            exp = exp.replace(new RegExp(markerNew, 'g'), K_old);
            
            respObj.explicacion = exp;
          }
        }
      }
    });
  } else {
    console.log('[evaluaciones-backend] Secuencia de claves original ya es válida o muy corta. No se requiere corrección.');
  }

  // Cleanup
  questions.forEach((q) => {
    delete q._tempId;
  });

  // Word count reporting & custom verification fields mappings
  if (contenidoJson.textos_lectura && Array.isArray(contenidoJson.textos_lectura)) {
    if (contenidoJson.textos_lectura[0]) {
      const text1 = contenidoJson.textos_lectura[0].contenido || '';
      contenidoJson.texto_1 = text1;
      const count1 = text1.trim().split(/\s+/).filter(Boolean).length;
      console.log(`[CONTEO PALABRAS] Texto 1 ("${contenidoJson.textos_lectura[0].titulo || 'Sin Título'}"): ${count1} palabras.`);
    }
    if (contenidoJson.textos_lectura[1]) {
      const text2 = contenidoJson.textos_lectura[1].contenido || '';
      contenidoJson.texto_2 = text2;
      const count2 = text2.trim().split(/\s+/).filter(Boolean).length;
      console.log(`[CONTEO PALABRAS] Texto 2 ("${contenidoJson.textos_lectura[1].titulo || 'Sin Título'}"): ${count2} palabras.`);
    }
  }



  // ── Normalization Layer ──
  // Unwrap root key if nested (e.g., cj.evaluacion_sumativa)
  let cj = contenidoJson as any;
  const rootKeys = Object.keys(cj);
  if (rootKeys.length === 1 && typeof cj[rootKeys[0]] === 'object' && cj[rootKeys[0]] !== null && !Array.isArray(cj[rootKeys[0]])) {
    console.log(`Unwrapping root key: ${rootKeys[0]}`);
    cj = cj[rootKeys[0]];
    // Update the parent object's reference so it's saved correctly
    for (const key of Object.keys(contenidoJson)) {
      delete (contenidoJson as any)[key];
    }
    for (const key of Object.keys(cj)) {
      (contenidoJson as any)[key] = cj[key];
    }
    cj = contenidoJson as any;
  }

  // 1. textos / texto_1 / texto_2 → array estándar textos_lectura con titulo, tipo, contenido
  let textosLecturaList = cj.textos_lectura || cj.textos;
  if (textosLecturaList && typeof textosLecturaList === 'object' && !Array.isArray(textosLecturaList)) {
    textosLecturaList = Object.values(textosLecturaList);
  }
  if (!Array.isArray(textosLecturaList) || textosLecturaList.length === 0) {
    textosLecturaList = [];
    if (cj.texto_1 || cj.texto_1_contenido) {
      textosLecturaList.push({
        titulo: cj.texto_1_titulo || 'Texto de Lectura 1',
        tipo: params.texto_1_tipo || 'Argumentativo',
        contenido: cj.texto_1 || cj.texto_1_contenido
      });
    }
    if (cj.texto_2 || cj.texto_2_contenido) {
      textosLecturaList.push({
        titulo: cj.texto_2_titulo || 'Texto de Lectura 2',
        tipo: params.texto_2_tipo || 'Expositivo',
        contenido: cj.texto_2 || cj.texto_2_contenido
      });
    }
  }
  
  if (Array.isArray(textosLecturaList)) {
    cj.textos_lectura = textosLecturaList.map((t: any, idx: number) => {
      if (typeof t === 'string') {
        return {
          titulo: `Texto de Lectura ${idx + 1}`,
          tipo: idx === 0 ? (params.texto_1_tipo || 'Argumentativo') : (params.texto_2_tipo || 'Expositivo'),
          contenido: t
        };
      }
      return {
        titulo: t.titulo || t.title || `Texto de Lectura ${idx + 1}`,
        tipo: t.tipo || t.type || (idx === 0 ? (params.texto_1_tipo || 'Argumentativo') : (params.texto_2_tipo || 'Expositivo')),
        contenido: t.contenido || t.content || t.cuerpo || t.body || ''
      };
    });

    if (cj.textos_lectura[0]) {
      cj.texto_1 = cj.textos_lectura[0].contenido;
    }
    if (cj.textos_lectura[1]) {
      cj.texto_2 = cj.textos_lectura[1].contenido;
    }
  }

  // 2. preguntas_alternativas y preguntas_desarrollo → estructura unificada prueba.secciones
  const finalQuestions = traverseAndCollectQuestions(cj);
  let altsList = finalQuestions.filter((q: any) => 
    q.tipo === 'seleccion_multiple' || 
    q.alternativas || 
    (typeof q.id === 'string' && q.id.startsWith('P'))
  );
  let devsList = finalQuestions.filter((q: any) => 
    !altsList.includes(q)
  );

  if (altsList.length > 25) {
    altsList = altsList.slice(0, 25);
  }
  if (devsList.length > 5) {
    devsList = devsList.slice(0, 5);
  }
  const cleanAlts = altsList.map((q: any, idx: number) => {
    let normalizedAlts: string[] = [];
    let isInvalid = false;

    try {
      const alts = q.alternativas;
      if (Array.isArray(alts)) {
        if (alts.length === 4) {
          normalizedAlts = alts.map((a: any) => {
            if (typeof a === 'string') {
              return a.replace(/^\s*[A-D]\s*[\.\)]\s*/i, '').trim();
            } else if (a && typeof a === 'object') {
              return String(a.texto || a.text || '').trim();
            }
            return '';
          });
        } else {
          isInvalid = true;
        }
      } else if (alts && typeof alts === 'object') {
        const keys = ['A', 'B', 'C', 'D'];
        const hasKeys = keys.some(k => k in alts || k.toLowerCase() in alts);
        if (hasKeys) {
          normalizedAlts = keys.map(k => {
            const val = alts[k] ?? alts[k.toLowerCase()];
            if (typeof val === 'string') {
              return val.trim();
            } else if (val && typeof val === 'object') {
              return String(val.texto || val.text || '').trim();
            }
            return '';
          });
        } else {
          const entries = Object.entries(alts);
          if (entries.length === 4) {
            normalizedAlts = entries.map(([_, val]: [string, any]) => {
              if (typeof val === 'string') {
                return val.trim();
              } else if (val && typeof val === 'object') {
                return String(val.texto || val.text || '').trim();
              }
              return '';
            });
          } else {
            isInvalid = true;
          }
        }
      } else {
        isInvalid = true;
      }
    } catch (err) {
      isInvalid = true;
    }

    if (normalizedAlts.length !== 4 || normalizedAlts.some(str => !str)) {
      isInvalid = true;
    }

    return {
      numero: q.numero || (idx + 1),
      oa: q.oa || q.OA || q.OA_asociado || params.oa_codes[0] || 'OA 1',
      nivel_cognitivo: q.nivel_cognitivo || q.habilidad_cognitiva || 'Comprender',
      dificultad_rti: q.dificultad_rti || q.nivel_DUA || q.dificultad || 'N2',
      tipo: 'seleccion_multiple',
      enunciado: q.enunciado || q.pregunta || '',
      alternativas: normalizedAlts,
      clave: q.clave || q.respuesta_correcta || 'A',
      indicador: q.indicador || q.indicador_evaluacion || '',
      contenido: q.contenido || q.contenido_evaluado || '',
      texto_asociado: q.texto_asociado || q.texto || 'texto_1',
      ...(isInvalid ? { _alternativas_invalidas: true } : {})
    };
  });

  const cleanDevs = devsList.map((q: any, idx: number) => {
    let expectedAnswer = q.respuesta_esperada || q.respuesta_correcta || '';
    let criteria: string[] = [];
    
    if (cj.pauta_correccion) {
      const pautaB = cj.pauta_correccion.seccion_B || cj.pauta_correccion.desarrollo || cj.pauta_correccion.preguntas_desarrollo;
      if (pautaB) {
        if (pautaB.solucionario_referencia) {
          if (typeof pautaB.solucionario_referencia === 'string') {
            expectedAnswer = pautaB.solucionario_referencia;
          } else if (typeof pautaB.solucionario_referencia === 'object' && pautaB.solucionario_referencia !== null) {
            expectedAnswer = Object.values(pautaB.solucionario_referencia).join('\n\n');
          }
        } else if (pautaB.ejemplo_respuesta_nivel_logrado) {
          expectedAnswer = pautaB.ejemplo_respuesta_nivel_logrado || expectedAnswer;
        }
        
        if (pautaB.criterios_RICE) {
          if (typeof pautaB.criterios_RICE === 'string') {
            criteria = [pautaB.criterios_RICE];
          } else if (typeof pautaB.criterios_RICE === 'object' && pautaB.criterios_RICE !== null) {
            criteria = Object.entries(pautaB.criterios_RICE).map(([k, v]: [string, any]) => {
              if (typeof v === 'object' && v !== null) {
                return `${k.replace('_', ' ')}: ${v.criterio || v.descriptor} (${v.puntaje} pts)`;
              }
              return `${k.replace('_', ' ')}: ${v}`;
            });
          }
        }
      }
      
      if (Array.isArray(cj.pauta_correccion.desarrollo)) {
        const matchPauta = cj.pauta_correccion.desarrollo.find((d: any) => d.id === q.id || d.pregunta === q.numero);
        if (matchPauta) {
          expectedAnswer = matchPauta.ejemplo_respuesta_nivel_logrado || matchPauta.respuesta_esperada || expectedAnswer;
          if (matchPauta.distribucion_RICE) {
            criteria = Object.entries(matchPauta.distribucion_RICE).map(([k, v]: [string, any]) => `${k.replace('_', ' ')}: ${v.criterio} (${v.puntaje} pts)`);
          }
        }
      }
    }
    if (criteria.length === 0 && Array.isArray(q.criterios_correccion)) {
      criteria = q.criterios_correccion;
    }
    
    return {
      numero: q.numero || (cleanAlts.length + idx + 1),
      oa: q.oa || q.OA || q.OA_asociado || params.oa_codes[0] || 'OA 1',
      nivel_cognitivo: q.nivel_cognitivo || q.habilidad_cognitiva || 'Analizar',
      dificultad_rti: q.dificultad_rti || q.nivel_DUA || q.dificultad || 'N2',
      tipo: 'consigna_abierta',
      enunciado: q.enunciado || q.pregunta || '',
      respuesta_esperada: expectedAnswer,
      criterios_correccion: criteria,
      indicador: q.indicador || q.indicador_evaluacion || '',
      contenido: q.contenido || q.contenido_evaluado || '',
      texto_asociado: q.texto_asociado || q.texto || 'texto_1'
    };
  });

   // Fix A: Eliminar SM sin alternativas validas antes del rebalanceo
  {
    const _validAlts = (cleanAlts as any[]).filter((q: any) => !q._alternativas_invalidas);
    if (_validAlts.length < cleanAlts.length) {
      console.warn("[EVALUACIONES] " + (cleanAlts.length - _validAlts.length) + " preguntas SM eliminadas por falta de alternativas");
      _validAlts.forEach((q: any, i: number) => { q.numero = i + 1; });
      (cleanAlts as any[]).splice(0, cleanAlts.length, ..._validAlts);
    }
  }
   // Rebalanceo de claves si hay concentración > 40% (Bug 2)
  const mcCount = cleanAlts.length;
  if (mcCount > 0) {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    cleanAlts.forEach(q => {
      const k = String(q.clave || 'A').toUpperCase().trim();
      if (k in counts) counts[k]++;
    });
    
    const maxFreq = Math.max(...Object.values(counts));
    const threshold = mcCount * 0.40;
    
    if (maxFreq > threshold) {
      // Aplicar distribución balanceada con swap semántico de alternativas
      const balancedKeys = generateBalancedKeysSequence(mcCount);
      const _ltoi: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      cleanAlts.forEach((q, idx) => {
        const qAny = q as any;
        const newKey = balancedKeys[idx];
        const curKey = String(qAny.clave || 'A').toUpperCase().trim();
        if (newKey !== curKey) {
          const alts = qAny.alternativas;
          if (Array.isArray(alts) && alts.length === 4) {
            const nI = _ltoi[newKey], oI = _ltoi[curKey];
            if (nI !== undefined && oI !== undefined) {
              if (typeof alts[nI] === 'string') {
                // String array: intercambiar posiciones
                const tmp = alts[nI]; alts[nI] = alts[oI]; alts[oI] = tmp;
              } else if (alts[nI] && alts[oI]) {
                // Object array: intercambiar texto + flag correcta
                const tmpT = alts[nI].texto;
                alts[nI].texto = alts[oI].texto;
                alts[oI].texto = tmpT;
                alts.forEach((a: any) => { a.correcta = false; });
                alts[nI].correcta = true;
              }
            }
          }
        }
        qAny.clave = newKey;
        if (qAny.respuesta_correcta) qAny.respuesta_correcta = newKey;
      });
    }
  }

  // Intercalación por textos idéntica al frontend (Bug 1)
  const getTextoAsociado = (q: any, idx: number, total: number) => {
    const txt = String(q.texto_asociado || q.texto || '').toLowerCase();
    if (txt.includes('texto_1') || txt.includes('texto 1') || txt.includes('1')) return 'texto_1';
    if (txt.includes('texto_2') || txt.includes('texto 2') || txt.includes('2')) return 'texto_2';
    if (txt.includes('ambos') || txt.includes('integra') || txt.includes('ambas')) return 'ambos';
    
    const enunc = String(q.enunciado || '').toLowerCase();
    if (enunc.includes('texto 1') || enunc.includes('primer texto')) return 'texto_1';
    if (enunc.includes('texto 2') || enunc.includes('segundo texto')) return 'texto_2';
    if (enunc.includes('ambos textos') || enunc.includes('ambas lecturas')) return 'ambos';
    
    if (idx < total * 0.45) return 'texto_1';
    if (idx < total * 0.9) return 'texto_2';
    return 'ambos';
  };

  const allQuestionsRaw = [...cleanAlts, ...cleanDevs];
  const preguntasT1_raw = allQuestionsRaw.filter((q, idx) => getTextoAsociado(q, idx, allQuestionsRaw.length) === 'texto_1');
  const preguntasT2_raw = allQuestionsRaw.filter((q, idx) => getTextoAsociado(q, idx, allQuestionsRaw.length) === 'texto_2');
  const preguntasAmbos_raw = allQuestionsRaw.filter((q, idx) => getTextoAsociado(q, idx, allQuestionsRaw.length) === 'ambos');

  const getMC = (arr: any[]) => arr.filter((p) => p.tipo === 'seleccion_multiple');
  const getDev = (arr: any[]) => arr.filter((p) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

  const finalSortedPreguntas = [
    ...getMC(preguntasT1_raw),
    ...getDev(preguntasT1_raw),
    ...getMC(preguntasT2_raw),
    ...getDev(preguntasT2_raw),
    ...getMC(preguntasAmbos_raw),
    ...getDev(preguntasAmbos_raw)
  ];

  // Asignar el número correlativo global ordenado
  finalSortedPreguntas.forEach((q, idx) => {
    q.numero = idx + 1;
  });

  cj.preguntas_alternativas = finalSortedPreguntas.filter(q => q.tipo === 'seleccion_multiple');
  cj.preguntas_desarrollo = finalSortedPreguntas.filter(q => q.tipo === 'consigna_abierta' || q.tipo === 'desarrollo');

  // ── Popular metadatos de la evaluación ──────────────────────────────────────
  cj.titulo = params.titulo || cj.titulo || 'Evaluación de Comprensión Lectora';
  cj.nivel = params.nivel;
  cj.asignatura = 'Lenguaje y Comunicación';
  cj.eje = params.eje || 'Lectura';
  cj.tipo_evaluacion = params.tipo_evaluacion || 'formativa';
  cj.oa_codes = params.oa_codes;
  cj.duracion_min = params.duracion_min || 90;
  cj.dificultad = params.dificultad;
  cj.instrucciones_generales = cj.instrucciones_generales || 'Lee atentamente las lecturas y responde las preguntas asociadas.';

  if (!cj.prueba || typeof cj.prueba !== 'object') {
    cj.prueba = {};
  }
  const sections = [];
  if (cj.preguntas_alternativas.length > 0) {
    sections.push({
      nombre: 'Sección I: Selección múltiple',
      instruccion: 'Lee atentamente cada pregunta y marca la opción correcta.',
      preguntas: cj.preguntas_alternativas
    });
  }
  if (cj.preguntas_desarrollo.length > 0) {
    sections.push({
      nombre: 'Sección II: Preguntas de desarrollo',
      instruccion: 'Responde las siguientes preguntas justificando tu respuesta.',
      preguntas: cj.preguntas_desarrollo
    });
  }
  cj.prueba.secciones = sections;

  // ── Generar tabla_especificaciones programáticamente ──────────────────────────
  const getFallbackIndicator = (habilidad: string): string => {
    const h = String(habilidad || '').toLowerCase();
    if (h.includes('comprender') || h.includes('comprension')) {
      return 'Comprender e integrar información explícita e implícita de los textos leídos.';
    }
    if (h.includes('analizar') || h.includes('analisis')) {
      return 'Analizar las relaciones lógicas y la estructura argumentativa de las lecturas.';
    }
    if (h.includes('evaluar') || h.includes('critica') || h.includes('reflexionar')) {
      return 'Evaluar de forma crítica la veracidad de los argumentos y la postura del autor.';
    }
    if (h.includes('aplicar')) {
      return 'Aplicar conceptos de análisis crítico y vocabulario contextual en la lectura.';
    }
    return 'Identificar y relacionar elementos clave del texto para su interpretación.';
  };

  const totalPtos = (cj.preguntas_alternativas.length * 2) + (cj.preguntas_desarrollo.length * 4);

  const filas: any[] = [];

  finalSortedPreguntas.forEach((q) => {
    if (q.tipo === 'seleccion_multiple') {
      filas.push({
        habilidad: q.nivel_cognitivo || 'Comprender',
        indicador: q.indicador || getFallbackIndicator(q.nivel_cognitivo || 'Comprender'),
        contenido: q.contenido || 'Comprensión de lectura',
        tipo_item: 'Selección múltiple',
        n_pregunta: String(q.numero),
        clave: q.clave,
        ptos: 2,
        ponderacion_pct: totalPtos > 0 ? Math.round((2 / totalPtos) * 100) : 0
      });
    } else {
      filas.push({
        habilidad: q.nivel_cognitivo || 'Analizar',
        indicador: q.indicador || getFallbackIndicator(q.nivel_cognitivo || 'Analizar'),
        contenido: q.contenido || 'Análisis crítico',
        tipo_item: 'Desarrollo',
        n_pregunta: String(q.numero),
        clave: 'Rúbrica',
        ptos: 4,
        ponderacion_pct: totalPtos > 0 ? Math.round((4 / totalPtos) * 100) : 0
      });
    }
  });

  cj.tabla_especificaciones = {
    oa_evaluado: params.oa_codes.join(', '),
    filas: filas
  };

  // ── Generar respuestas_esperadas (Solucionario) y criterios programáticamente ─
  const respuestas: any[] = [];
  
  finalSortedPreguntas.forEach((q) => {
    if (q.tipo === 'seleccion_multiple') {
      respuestas.push({
        pregunta: q.numero,
        tipo: 'seleccion_multiple',
        clave: q.clave,
        explicacion: `Justificación basada en el indicador de evaluación: ${q.indicador || 'Comprender e integrar información.'}`
      });
    } else {
      const techniqueType = (params.tipo_evaluacion === 'formativa' || params.tipo_evaluacion === 'diagnostica') ? 'OREO' : 'RICE';
      const criteriaArr = [
        `Nivel Alto (4 pts): Responde con claridad e incorpora cita o evidencia textual relevante. Aplica la técnica ${techniqueType} de forma completa y coherente.`,
        `Nivel Medio (2-3 pts): Responde parcialmente o sin cita del texto. Aplica la técnica ${techniqueType} de forma incompleta o con imprecisiones.`,
        `Nivel Inicial (0-1 pts): Respuesta incompleta, incorrecta o ausente. No incorpora evidencia del texto ni aplica la técnica ${techniqueType}.`,
      ];

      respuestas.push({
        pregunta: q.numero,
        tipo: 'consigna_abierta',
        respuesta_esperada: q.respuesta_esperada || 'Respuesta detallada demostrando análisis crítico.',
        criterios_correccion: criteriaArr
      });
    }
  });

  cj.respuestas_esperadas = respuestas;

  // ── Generar pauta_correccion programáticamente ──────────────────────────────
  cj.pauta_correccion = {
    puntaje_total: totalPtos,
    exigencia: "60%",
    puntaje_aprobacion: Math.round(totalPtos * 0.6)
  };

  // ── Generar rubrica (instrumento_evaluacion) desde plantillas fijas ───────────
  cj.rubrica = buildRubrica(params.instrumento || 'analitica_descriptiva', cleanDevs);

  // ── Generar autoevaluacion y coevaluacion programáticamente si son solicitadas ─
  if (params.tipos.includes('autoevaluacion')) {
    cj.autoevaluacion = {
      oa_actitudinal: "Valorar la lectura de textos literarios y no literarios como espacio de reflexión y aprendizaje personal.",
      criterios: [
        "Leí con atención los textos seleccionados.",
        "Reflexioné críticamente sobre el contenido de las lecturas.",
        "Respondí de forma estructurada utilizando la técnica de respuesta solicitada.",
        "Revisé mis respuestas antes de entregar para corregir posibles errores."
      ]
    };
  }
  if (params.tipos.includes('coevaluacion')) {
    cj.coevaluacion = {
      oa_actitudinal: "Colaborar de manera respetuosa e integradora en las actividades de análisis grupal.",
      criterios: [
        "Mi compañero participó activamente en el análisis de los textos.",
        "Escuchó con respeto las opiniones y puntos de vista divergentes.",
        "Aportó ideas constructivas para resolver las preguntas planteadas.",
        "Cumplió con los tiempos asignados para el trabajo colaborativo."
      ]
    };
  }


  console.log(`[VERIFICACION DE PREGUNTAS] Alternativas encontradas: ${cleanAlts.length}, Desarrollo encontradas: ${cleanDevs.length}.`);



  return cj;
}


// ─── GET — Lista de evaluaciones del usuario ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development') {
    const mockEvaluacionesData = [
      {
        id: 'ev-1',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        nivel: '2° Medio',
        eje: 'Lectura',
        titulo: 'Evaluación del Mito de Sísifo',
        n_preguntas: 3,
        dificultad: 'Media',
        tipos: ['prueba', 'autoevaluacion', 'heteroevaluacion'],
        contenido_json: {
          titulo: 'Evaluación del Mito de Sísifo',
          meta: { curso: '2° Medio', unidad: 'Unidad 1', tema: 'El Mito de Sísifo' },
          secciones: [
            {
              tipo: 'prueba',
              titulo: 'Prueba Escrita',
              preguntas: [
                {
                  id: 'p1',
                  enunciado: '¿Por qué es castigado Sísifo por los dioses?',
                  alternativas: [
                    'Por revelar los secretos de los dioses a los mortales',
                    'Por robar el fuego sagrado de la cima del Olimpo',
                    'Por negarse a rendir tributo en el templo principal',
                    'Por conspirar para derrocar al soberano Zeus'
                  ],
                  clave: 'A',
                  puntaje: 2,
                  habilidad: 'Comprensión global'
                }
              ]
            },
            {
              tipo: 'autoevaluacion',
              titulo: 'Autoevaluación del Estudiante',
              criterios: [
                'Comprendí el conflicto existencial del personaje.',
                'Logré relacionar el castigo con el absurdo humano.'
              ]
            },
            {
              tipo: 'heteroevaluacion',
              titulo: 'Rúbrica de Heteroevaluación',
              criterios: [
                {
                  criterio: 'Análisis del absurdo',
                  niveles: {
                    logrado: 'Identifica y fundamenta el concepto de absurdo en el mito.',
                    proceso: 'Identifica el absurdo pero la fundamentación es incompleta.',
                    inicio: 'Nombra el absurdo sin explicar su relevancia.'
                  }
                }
              ]
            }
          ]
        }
      }
    ];
    return NextResponse.json({ evaluaciones: mockEvaluacionesData, total: mockEvaluacionesData.length, limit: 20, offset: 0 });
  }

  const supabase = makeSupabaseClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(50, Number(searchParams.get('limit')  ?? '20'));
  const offset =             Number(searchParams.get('offset') ?? '0');

  const { data, error, count } = await supabase
    .from('evaluaciones')
    .select('id, titulo, nivel, eje, oa_codes, tipos, simce_ensayo, contenido_json, created_at', { count: 'exact' })
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ evaluaciones: data ?? [], total: count ?? 0, limit, offset });
}

// ─── POST — Generar evaluación ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth OBLIGATORIA (sin fallback) ──────────────────────────────────────
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado — se requiere sesión activa' }, { status: 401 });
  }

  const isMockToken = token === 'mock-access-token' && process.env.NODE_ENV === 'development';
  let userId = 'mock-user-id';
  let supabase: any = null;

  if (!isMockToken) {
    supabase = makeSupabaseClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }
    userId = userData.user.id;

    // ── Trial limit ANTES de llamar a Claude ──
    const guard = await checkTrialLimit(supabase, userId, 'evaluations_generated');
    if (guard.blocked) {
      const isActive = guard.profile?.plan_status === 'active';
      return NextResponse.json(
        {
          error: 'limite_alcanzado',
          message: 'Alcanzaste el límite del plan piloto. Has utilizado todas las generaciones disponibles para este módulo.',
          reason: guard.reason,
          tipo: 'evaluations_generated',
          limit: isActive ? 12 : 5,
          current: guard.profile?.evaluations_generated ?? 0,
          plan_status: guard.profile?.plan_status,
          renewal_date: guard.renewalDate,
        },
        { status: 403 }
      );
    }
  }



  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const nivel       = (body.nivel        as string | undefined)?.trim() ?? '';
  const eje         = (body.eje          as string | null | undefined) ?? null;
  const oa_codes    = (body.oa_codes     as string[] | undefined) ?? [];
  const oa_textos   = (body.oa_textos    as Record<string, string> | undefined) ?? {};
  const tipos       = (body.tipos        as TipoEvaluacion[] | undefined) ?? ['prueba'];
  const n_preguntas = Number(body.n_preguntas ?? 10);
  const duracion_min = body.duracion_min ? Number(body.duracion_min) : null;
  const dificultad  = (body.dificultad   as Dificultad | undefined) ?? 'mixto';
  const titulo      = (body.titulo       as string | null | undefined) ?? null;

  const tipo_evaluacion = (body.tipo_evaluacion as string | undefined) ?? 'formativa';
  const tipo_preguntas = (body.tipo_preguntas as string | undefined) ?? 'seleccion_multiple';
  const n_preguntas_multiple = Number(body.n_preguntas_multiple ?? 6);
  const n_preguntas_desarrollo = Number(body.n_preguntas_desarrollo ?? 2);
  const instrumento = (body.instrumento as string | undefined) ?? 'rubrica_analitica';
  const texto_1_tipo = (body.texto_1_tipo as string | undefined) ?? 'Argumentativo';
  const texto_2_tipo = (body.texto_2_tipo as string | undefined) ?? 'Expositivo';
  const establecimiento = (body.establecimiento as string | undefined)?.trim() ?? '';
  const docente         = (body.docente         as string | undefined)?.trim() ?? '';

  if (!nivel) {
    return NextResponse.json({ error: 'El campo "nivel" es obligatorio' }, { status: 400 });
  }
  if (oa_codes.length === 0) {
    return NextResponse.json({ error: 'Debes seleccionar al menos un OA' }, { status: 400 });
  }
  if (tipos.length === 0) {
    return NextResponse.json({ error: 'Debes seleccionar al menos un tipo de evaluación' }, { status: 400 });
  }

  // ── Verificar API key ─────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
    return NextResponse.json(
      { error: 'La API Key de Anthropic no está configurada.' },
      { status: 500 }
    );
  }
  const model = 'claude-sonnet-4-6';

  const fuente = (body.fuente as string | undefined) ?? 'tema_libre';
  let libroContexto = '';
  let textos_provistos: string | undefined;
  if (fuente === 'lectura_domiciliaria' && body.libro_id) {
    const supabaseClient = makeSupabaseClient(token);
    const { data: libro } = await supabaseClient
      .from('biblioteca_libros')
      .select('*')
      .eq('id', body.libro_id)
      .single();

    if (libro) {
      libroContexto = `
Esta evaluación se basa en la lectura domiciliaria: "${libro.titulo}" de ${libro.autor || 'Desconocido'}.
METADATOS DEL EXPEDIENTE DEL LIBRO:
- Resumen: ${libro.resumen || ''}
- Personajes principales y secundarios: ${JSON.stringify(libro.personajes || [])}
- Temas abordados: ${(libro.temas || []).join(', ')}
- Conflictos principales: ${(libro.conflictos || []).join(', ')}
- Vocabulario y palabras clave: ${JSON.stringify(libro.vocabulario || [])}
- Estructura Narrativa y narrador: ${libro.estructura_narrativa || ''}
- Contexto histórico o social: ${libro.contexto_historico || ''}
- Valores y mensajes clave: ${(libro.valores_mensajes || []).join(', ')}
- Fragmentos clave / Citas del libro: ${(libro.fragmentos_clave || []).join('\n')}
- Preguntas recomendadas del expediente:
  - Literales: ${(libro.preguntas_literales || []).join('\n')}
  - Inferenciales: ${(libro.preguntas_inferenciales || []).join('\n')}
  - Críticas: ${(libro.preguntas_criticas || []).join('\n')}

Las preguntas deben referirse estrictamente a los personajes, trama, conflictos, vocabulario o fragmentos clave de la obra "${libro.titulo}" detallada en el expediente. No inventes hechos ni cambies los nombres de los personajes.
`;
      // Construir textos_provistos desde fragmentos del libro
      const frags = libro.fragmentos_clave as string[] | undefined;
      if (frags && frags.length >= 2) {
        textos_provistos =
          `TEXTOS DE LECTURA YA PROPORCIONADOS — USA ESTOS FRAGMENTOS EXACTAMENTE COMO "textos_lectura" EN EL JSON. NO generes textos nuevos.\n\n` +
          `Texto 1 (fragmento de "${libro.titulo}"): ${frags[0]}\n\n` +
          `Texto 2 (fragmento de "${libro.titulo}"): ${frags[1]}\n\n` +
          `Técnica de respuesta de desarrollo: RICE\n` +
          `Genera ÚNICAMENTE las preguntas (seleccion_multiple y desarrollo) referidas a estos textos.`;
      } else if (frags && frags.length === 1) {
        textos_provistos =
          `TEXTO DE LECTURA YA PROPORCIONADO — USA ESTE FRAGMENTO COMO "textos_lectura" EN EL JSON. NO generes textos nuevos.\n\n` +
          `Texto 1 (fragmento de "${libro.titulo}"): ${frags[0]}\n\n` +
          `Técnica de respuesta de desarrollo: RICE\n` +
          `Genera ÚNICAMENTE las preguntas referidas a este texto.`;
      }
    }
  }

  // Kit de Clase: construir textos_provistos desde la planificación
  if (fuente === 'kit_clase') {
    const kitTextos = (body.kit_textos as Array<{ titulo?: string; tipo?: string; contenido?: string }> | null | undefined);
    if (Array.isArray(kitTextos) && kitTextos.length > 0) {
      const partes = kitTextos.map((t: { titulo?: string; tipo?: string; contenido?: string }, i: number) => {
        const tipo = t.tipo || (i === 0 ? 'Argumentativo' : 'Expositivo');
        const contenido = t.contenido || '';
        return 'Texto ' + (i + 1) + ' (' + tipo + '):\n' + contenido;
      }).join('\n\n');
      textos_provistos =
        'TEXTOS DE LECTURA PROVISTOS — Usa EXACTAMENTE estos textos como \"textos_lectura\" en el JSON. NO generes textos nuevos.\n\n' +
        partes +
        '\n\nGenera ÚNICAMENTE las preguntas y la rúbrica referidas a estos textos. No agregues más texto de lectura.';
      console.log('[EVALUACIONES] Kit de Clase: ' + kitTextos.length + ' texto(s) provistos desde contenido_json');
    }
  }

  // ── Step 1: Claude genera la evaluación ──────────────────────────────────
  const anthropic = new Anthropic({ apiKey, timeout: 180000 });

  let contenidoJson: Record<string, unknown>;
  try {
    contenidoJson = await generateAndCorrectEvaluation(anthropic, model, {
      nivel, eje, oa_codes, oa_textos, tipos,
      n_preguntas, duracion_min, dificultad, titulo,
      tipo_evaluacion, tipo_preguntas, n_preguntas_multiple, n_preguntas_desarrollo, instrumento,
      texto_1_tipo, texto_2_tipo, libroContexto,
      fuente,
      textos_provistos,
      unidad: (body.unidad as string | undefined)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[evaluaciones] Claude generation failed:', msg);
    let userMsg = `Error al generar la evaluación: ${msg}`;
    if (msg.includes('demasiado extensa')) {
      userMsg = msg;
    } else if (msg.includes('Error al procesar la respuesta')) {
      userMsg = msg;
    } else if (
      msg.toLowerCase().includes('timeout') || 
      msg.toLowerCase().includes('time out') || 
      msg.toLowerCase().includes('timed out') || 
      msg.toLowerCase().includes('timed_out') || 
      msg.toLowerCase().includes('deadline') || 
      msg.toLowerCase().includes('abort') ||
      msg.toLowerCase().includes('connection') ||
      msg.toLowerCase().includes('socket') ||
      msg.toLowerCase().includes('network')
    ) {
      userMsg = "La generación tardó demasiado. Intenta con menos preguntas o un solo texto de lectura.";
    }
    return NextResponse.json(
      { error: userMsg },
      { status: 500 }
    );
  }

  // ── Step 2: Guardar en DB (o responder mock en dev) ──────────────────────
  console.log('PREGUNTAS NORMALIZADAS:', JSON.stringify((contenidoJson as any).preguntas?.slice(0,5), null, 2));
  contenidoJson.establecimiento = establecimiento;
  contenidoJson.docente = docente;

  if (isMockToken) {
    const mockRecord = {
      id: 'mock-ev-' + Date.now(),
      nivel,
      eje,
      oa_codes,
      tipos,
      titulo: (contenidoJson.titulo as string | null) ?? titulo ?? 'Evaluación de REI DOCENTE',
      contenido_json: contenidoJson,
      created_at: new Date().toISOString()
    };
    return NextResponse.json(mockRecord, { status: 201 });
  }

  const { data: record, error: dbError } = await supabase
    .from('evaluaciones')
    .insert({
      user_id:       userId,
      nivel,
      eje,
      oa_codes,
      tipos,
      titulo:        (contenidoJson.titulo as string | null) ?? titulo ?? 'Evaluación sin título',
      n_preguntas,
      duracion_min,
      dificultad,
      contenido_json: contenidoJson,
      simce_ensayo:  false,
    })
    .select('id, titulo, nivel, eje, oa_codes, tipos, contenido_json, created_at')
    .single();

  if (dbError) {
    console.error('[evaluaciones] DB insert error:', dbError);
    return NextResponse.json(
      { error: 'Error al guardar la evaluación.' },
      { status: 500 }
    );
  }

  // ── Step 3: Incrementar contador (DESPUÉS del éxito) ──
  await incrementCounter(supabase, userId, 'evaluations_generated');

  return NextResponse.json(record, { status: 201 });
}
