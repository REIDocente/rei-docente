/**
 * POST /api/guias  — Genera una guía de trabajo educativa (tradicional o narrativa/investigativa).
 * GET  /api/guias  — Lista las guías del usuario autenticado (paginadas).
 *
 * Auth OBLIGATORIA. Trial limit: guides_generated ≤ 15.
 *
 * IMPORTANTE: el formato narrativo es un ENVOLTORIO DE PRESENTACIÓN independiente del tipo de
 * texto (expositivo, argumentativo, poético, instructivo, etc.). No restringe el eje ni el OA.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';
import { buildGuiaMinimalPrompt } from '@/lib/prompts/promptTemplates';

// ─── Types ────────────────────────────────────────────────────────────────────

type Formato    = 'tradicional' | 'narrativa';
type TemaKey    = 'caso' | 'mision' | 'expedicion' | 'desafio' | 'custom';
type RtiNivel   = 'universal' | 'dua' | 'pie';

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
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function buildTemplatePrompt(params: {
  nivel: string;
  eje: string | null;
  oa_code: string;
  oa_texto: string;
  templateId: string;
  incluir_dua: boolean;
  incluir_imagenes: boolean;
  actividad_adicional?: string | null;
}): string {
  const { nivel, eje, oa_code, oa_texto, templateId, incluir_dua, incluir_imagenes, actividad_adicional } = params;

  const actividadPrompt = actividad_adicional
    ? `Añade obligatoriamente una actividad especial de tipo "${actividad_adicional}" (instrucciones y todo el contenido necesario para resolverla) dentro de la sección de actividades o producción escrita.`
    : '';

  return `Genera una guía de aprendizaje basada en la plantilla "${templateId}" para la asignatura de Lenguaje.
Nivel: ${nivel}
Eje: ${eje ?? 'Lectura'}
OA: ${oa_code} — ${oa_texto}
Incluir Adaptación DUA: ${incluir_dua ? 'SÍ' : 'NO'}
Generar descripción de imagen (Line Art B/N): ${incluir_imagenes ? 'SÍ' : 'NO'}
Actividad Adicional: ${actividad_adicional || 'Ninguna'}
${actividadPrompt}

Instrucciones obligatorias:
1. Rellena únicamente las secciones fijas y campos variables de la plantilla "${templateId}". No inventes secciones nuevas.
2. Todo el contenido debe ser completo, didáctico y adaptado al nivel de los estudiantes de ${nivel}.
3. Si Incluir Adaptación DUA es SÍ, genera también la sección "dua" adaptada correspondiente con andamiaje e instrucciones simplificadas. Si es NO, deja el campo "dua" como null.
4. Si se solicita Actividad Adicional, insértala como una de las actividades del bloque.
5. Si Generar descripción de imagen es SÍ, escribe una descripción de la escena o tema en "universal.desarrollo.imagen_prompt" para generar una ilustración en blanco y negro (line art plano para colorear/imprimir).
6. Genera una frase de Programación Neurolingüística (PNL) corta y motivadora al cierre en "universal.cierre.frase_pnl" ligada al tema y al esfuerzo.

Responde SIEMPRE con el objeto JSON estructurado siguiendo este esquema exacto:
{
  "titulo": "Título de la guía",
  "nivel": "${nivel}",
  "eje": "${eje ?? 'Lectura'}",
  "oa_code": "${oa_code}",
  "formato": "plantilla_${templateId}",
  "rti_nivel": "${incluir_dua ? 'dua' : 'universal'}",
  "instrucciones_docente": "...",
  "universal": {
    "activacion": {
      "titulo": "...",
      "texto": "...",
      "pregunta": "...",
      "lineas_respuesta": 3
    },
    "desarrollo": {
      "titulo": "...",
      "texto_principal": "...",
      "imagen_prompt": "..."
    },
    "actividades": {
      "titulo": "...",
      "instruccion": "...",
      "preguntas": [
        {
          "numero": 1,
          "nivel_cognitivo": "...",
          "enunciado": "...",
          "puntaje": 2,
          "lineas_respuesta": 3
        }
      ],
      "produccion_escrita": {
        "titulo": "...",
        "instruccion": "...",
        "consigna": "...",
        "puntaje": 4,
        "lineas_respuesta": 6
      }
    },
    "cierre": {
      "titulo": "...",
      "ticket_salida": {
        "pregunta": "...",
        "lineas_respuesta": 2
      },
      "metacognicion": ["...", "..."],
      "autoevaluacion": ["...", "..."],
      "frase_pnl": "..."
    },
    "pauta_docente": {
      "respuestas_preguntas": [
        { "numero": 1, "respuesta_correcta": "...", "criterios_evaluacion": "..." }
      ],
      "respuesta_produccion": {
        "respuesta_modelo": "...",
        "criterios_evaluacion": "..."
      },
      "respuesta_ticket": {
        "respuesta_correcta": "..."
      }
    }
  },
  "dua": null
}`;
}

function buildGuiasSystemPrompt(): string {
  return `Eres un experto en didáctica del lenguaje para el sistema escolar chileno (MINEDUC) y diseño universal de aprendizaje (DUA).
Generas fichas de trabajo pedagógicamente fundadas, completas, e inmediatamente imprimibles.

REGLAS ABSOLUTAS DE GENERACIÓN:
1. CONTENIDO COMPLETO Y REAL - NUNCA GENERE TEXTO DE RELLENO, PLACEHOLDERS O RESÚMENES:
   - El objetivo_clase debe tener máximo 2 líneas.
   - El campo contenido del texto_lectura debe tener entre 300 y 400 palabras. No generar textos cortos.
   - Si se proporciona un texto del Kit de Clase (texto_kit) en el prompt del usuario, debes rellenar el campo "texto_lectura" con ese texto de lectura exacto (título, autor y contenido). No debes inventar otro texto de lectura.
   - Los desafíos deben ser variados y estar basados en la lectura.
   - El ticket_salida debe ser una pregunta de cierre que evalúe el objetivo de la clase usando la estructura RICE.
   - La autoevaluación debe consistir en un array de exactamente 3 criterios claros e identificables en primera persona.
   - La pauta_docente debe contener las respuestas correctas de los desafíos en el mismo orden.

Responde SIEMPRE con un objeto JSON válido que siga exactamente este esquema:
{
  "titulo": "Título de la Guía",
  "objetivo_clase": "Objetivo de la clase en máximo 2 líneas",
  "activacion": "Pregunta de activación reflexiva sobre el tema",
  "texto_lectura": {
    "tipo": "Columna de opinión / Carta al director / Editorial / etc.",
    "titulo": "Título del texto",
    "autor": "Autor del texto",
    "contenido": "Texto completo de lectura (debe tener entre 300 y 400 palabras)"
  },
  "banco_palabras": ["palabra1", "palabra2", "palabra3", "palabra4"],
  "desafios": [
    // El array desafios debe contener exactamente los desafíos solicitados en el prompt de entrada, de entre los siguientes tipos:
    {
      "tipo": "palabra_intrusa",
      "instruccion": "Identifica la palabra que no pertenece al grupo semántico.",
      "items": [
        { "grupo": ["p1", "p2", "p3", "intrusa", "p4"], "respuesta": "intrusa" }
      ]
    },
    {
      "tipo": "unir_parejas",
      "instruccion": "Une cada término de la columna A con su definición en la columna B.",
      "pares": [
        { "izquierda": "término", "derecha": "definición" }
      ]
    },
    {
      "tipo": "completar_oraciones",
      "instruccion": "Completa las oraciones con las palabras correspondientes del banco de palabras.",
      "oraciones": [
        { "texto": "El ___ de la columna argumenta que...", "respuesta": "autor" }
      ]
    },
    {
      "tipo": "ordenar_parrafos",
      "instruccion": "Ordena los siguientes párrafos cronológicamente escribiendo el número correcto.",
      "fragmentos": ["fragmento3", "fragmento1", "fragmento2"],
      "orden_correcto": [2, 3, 1]
    },
    {
      "tipo": "verdadero_falso",
      "instruccion": "Escribe V si la afirmación es verdadera o F si es falsa.",
      "items": [
        { "afirmacion": "La empatía es fundamental para la convivencia social.", "respuesta": true }
      ]
    },
    {
      "tipo": "pupiletras",
      "instruccion": "Encuentra las palabras del banco en la siguiente sopa de letras.",
      "grid": [
        ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
        ["K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
        // Grid de 10x10 caracteres
      ],
      "palabras": ["palabra1", "palabra2"]
    },
    {
      "tipo": "anagramas",
      "instruccion": "Ordena las letras para descubrir las palabras clave.",
      "items": [
        { "desordenada": "ATAPEIM", "correcta": "EMPATIA" }
      ]
    },
    {
      "tipo": "mensajes_cifrados",
      "instruccion": "Descifra el mensaje oculto utilizando la clave al pie.",
      "clave": { "1": "E", "2": "M", "3": "P", "4": "A", "5": "T", "6": "I" },
      "mensajes": [
        { "codificado": "2-1-2-3-4-5-6-4", "descifrado": "EMPATIA" }
      ]
    },
    {
      "tipo": "clasificacion",
      "instruccion": "Clasifica los siguientes términos en la columna correspondiente.",
      "categorias": ["Categoría A", "Categoría B"],
      "items": [
        { "texto": "Término 1", "categoria": "Categoría A" }
      ]
    },
    {
      "tipo": "camino_pistas",
      "instruccion": "Sigue las pistas en cada estación y anota la letra indicada para descifrar la palabra secreta.",
      "pistas": [
        { "pregunta": "Pista o pregunta 1", "respuesta": "respuesta1", "letra": "P" }
      ]
    },
    {
      "tipo": "preguntas_inferenciales",
      "instruccion": "Responde las siguientes preguntas de inferencia a partir del texto.",
      "preguntas": [
        {
          "pregunta": "Pregunta inferencial 1",
          "criterios_evaluacion": "Criterio de evaluación esperado"
        }
      ]
    }
  ],
  "ticket_salida": "Pregunta de cierre que evalúe el objetivo usando estructura RICE (Repite, Incluye, Cita, Explica)",
  "autoevaluacion": [
    "Criterio 1 en primera persona",
    "Criterio 2 en primera persona",
    "Criterio 3 en primera persona"
  ],
  "actividad_adicional": null, // o un objeto con la actividad adicional solicitada (preguntas_capciosas o codigo_secreto) si se solicita,
  "pauta_docente": {
    "respuestas_desafios": []
  }
}
Responde únicamente con el objeto JSON válido.`;
}

// ─── Prompts por formato ──────────────────────────────────────────────────────

const TEMA_LABELS: Record<TemaKey, string> = {
  caso:       'Caso a resolver',
  mision:     'Misión de exploración',
  expedicion: 'Expedición',
  desafio:    'Desafío secreto',
  custom:     'Personalizado',
};

function buildTradicionalPrompt(params: {
  nivel: string; eje: string | null; oa_code: string; oa_texto: string;
  rti_nivel: RtiNivel; include_analogia: boolean; include_produccion: boolean;
}): string {
  const { nivel, eje, oa_code, oa_texto, rti_nivel, include_analogia, include_produccion } = params;
  const isDuaActive = rti_nivel === 'dua';

  return `Genera una guía de aprendizaje educativa en formato TRADICIONAL para la asignatura de Lengua y Literatura.
Nivel: ${nivel}
Eje: ${eje ?? 'Lectura'}
OA: ${oa_code} — ${oa_texto}
Generar Adaptación DUA: ${isDuaActive ? 'SÍ (Generar sección Universal y sección DUA)' : 'NO (Generar sólo sección Universal, dejar la clave "dua" como null)'}

El JSON resultante debe seguir EXACTAMENTE esta estructura:
{
  "titulo": "Título formal de la guía",
  "nivel": "${nivel}",
  "eje": "${eje ?? 'Lectura'}",
  "oa_code": "${oa_code}",
  "formato": "tradicional",
  "rti_nivel": "${rti_nivel}",
  "instrucciones_docente": "Indicaciones pedagógicas para el docente sobre los aprendizajes evaluados en esta guía",
  
  "universal": {
    "activacion": {
      "titulo": "Activación de Conocimientos Previos",
      "texto": "Texto breve de 1-2 párrafos que introduce el tema didáctico de forma atractiva.",
      "pregunta": "Pregunta de inicio reflexiva sobre el texto anterior para activar conocimientos previos.",
      "lineas_respuesta": 3
    },
    "desarrollo": {
      "titulo": "Lectura Principal: [Nombre del texto]",
      "texto_principal": "Texto de lectura completo, de 2 a 4 párrafos, adecuado al nivel. Puede ser un fragmento literario, noticia, columna u otro tipo de texto real alineado al OA."
    },
    "actividades": {
      "titulo": "Actividades de Comprensión y Aplicación",
      "instruccion": "Lee atentamente cada pregunta y responde utilizando el texto base.",
      "preguntas": [
        {
          "numero": 1,
          "nivel_cognitivo": "literal",
          "enunciado": "Pregunta de nivel literal sobre el texto principal.",
          "puntaje": 2,
          "lineas_respuesta": 3
        },
        {
          "numero": 2,
          "nivel_cognitivo": "inferencial",
          "enunciado": "Pregunta de nivel inferencial sobre el texto principal.",
          "puntaje": 2,
          "lineas_respuesta": 3
        },
        {
          "numero": 3,
          "nivel_cognitivo": "critico",
          "enunciado": "Pregunta de nivel crítico-valorativo sobre el texto principal.",
          "puntaje": 3,
          "lineas_respuesta": 4
        }
      ],
      "produccion_escrita": {
        "titulo": "Actividad de Producción Escrita",
        "instruccion": "Aplica lo aprendido redactando tu propio escrito breve.",
        "consigna": "Consigna detallada de producción de texto (creación, opinión o ensayo breve) vinculada al OA.",
        "puntaje": 4,
        "lineas_respuesta": 6
      }
    },
    "cierre": {
      "titulo": "Cierre de la Sesión",
      "ticket_salida": {
        "pregunta": "Pregunta rápida de ticket de salida para comprobar el aprendizaje de hoy.",
        "lineas_respuesta": 2
      },
      "metacognicion": [
        "¿Qué estrategia me sirvió más para comprender el texto de hoy?",
        "¿En qué otra asignatura o situación real puedo aplicar lo aprendido?"
      ],
      "autoevaluacion": [
        "Comprendí el tema central del texto leído.",
        "Respondí todas las preguntas fundamentando con el texto.",
        "Realicé la actividad de escritura siguiendo las instrucciones."
      ]
    },
    "pauta_docente": {
      "respuestas_preguntas": [
        { "numero": 1, "respuesta_correcta": "Respuesta modelo exacta esperada para la pregunta 1.", "criterios_evaluacion": "2 pts: Identifica correctamente la información explícita... 1 pt: Respuesta incompleta..." },
        { "numero": 2, "respuesta_correcta": "Respuesta modelo exacta esperada para la pregunta 2.", "criterios_evaluacion": "2 pts: Infiere correctamente el sentido implícito... 1 pt: Deduce parcialmente..." },
        { "numero": 3, "respuesta_correcta": "Respuesta modelo exacta esperada para la pregunta 3.", "criterios_evaluacion": "3 pts: Argumenta su postura con fundamentos del texto... 1-2 pts: Expresa opinión sin suficiente sustento..." }
      ],
      "respuesta_produccion": {
        "respuesta_modelo": "Ejemplo completo de un texto que responde a la consigna de producción.",
        "criterios_evaluacion": "4 pts: Cumple estructura, ortografía y vocabulario. 2 pts: Falta coherencia o desarrollo..."
      },
      "respuesta_ticket": {
        "respuesta_correcta": "Respuesta esperada para el ticket de salida."
      }
    }
  },
  
  "dua": ${isDuaActive ? `{
    "vocabulario_apoyo": [
      { "palabra": "Palabra compleja 1", "definicion": "Definición simple contextualizada", "ejemplo": "Ejemplo en una oración" },
      { "palabra": "Palabra compleja 2", "definicion": "Definición simple contextualizada", "ejemplo": "Ejemplo en una oración" }
    ],
    "activacion": {
      "titulo": "Activación de Conocimientos Previos (Apoyo Visual)",
      "texto_simplificado": "Texto breve de 1-2 párrafos que introduce el tema didáctico de forma más accesible y con oraciones más directas.",
      "pregunta_andamiada": "Pregunta de inicio reflexiva sobre el tema.",
      "pista_ayuda": "Pista: Piensa en situaciones cotidianas donde ocurra esto.",
      "lineas_respuesta": 2
    },
    "desarrollo": {
      "titulo": "Lectura con Apoyo: [Nombre del texto]",
      "texto_principal": "Texto de lectura completo adaptado con oraciones más simples, conectores claros y palabras difíciles destacadas.",
      "apoyo_visual_desc": "Instrucción detallada de organizador gráfico de apoyo (ej: completa el mapa conceptual o cuadro de causas y efectos para sintetizar la lectura)."
    },
    "actividades": {
      "titulo": "Actividades de Comprensión Diversificadas",
      "instruccion_simplificada": "Responde las preguntas. Puedes usar las pistas y los inicios de respuesta para guiarte.",
      "preguntas": [
        {
          "numero": 1,
          "nivel_cognitivo": "literal",
          "enunciado": "Pregunta literal de opción múltiple.",
          "opciones_alternativas": ["A) [Opción correcta]", "B) [Opción incorrecta 1]", "C) [Opción incorrecta 2]"],
          "pista_ayuda": "Pista: Busca la información directamente en el primer párrafo.",
          "puntaje": 2,
          "lineas_respuesta": 1
        },
        {
          "numero": 2,
          "nivel_cognitivo": "inferencial",
          "enunciado": "Pregunta inferencial con inicio de respuesta escrito.",
          "opciones_alternativas": null,
          "pista_ayuda": "Pista: Recuerda cómo reaccionó el personaje ante el suceso.",
          "inicio_respuesta": "El personaje se sintió así porque...",
          "puntaje": 2,
          "lineas_respuesta": 2
        },
        {
          "numero": 3,
          "nivel_cognitivo": "critico",
          "enunciado": "Pregunta crítica con opciones de andamiaje.",
          "opciones_alternativas": ["A) Estoy de acuerdo, porque...", "B) Estoy en desacuerdo, porque...", "C) Tengo una postura neutra, porque..."],
          "pista_ayuda": "Pista: Argumenta usando tu opinión personal apoyada en el texto.",
          "puntaje": 3,
          "lineas_respuesta": 3
        }
      ],
      "produccion_escrita": {
        "titulo": "Actividad de Expresión y Escritura Adaptada",
        "instruccion_simplificada": "Expresa lo aprendido a través de la escritura u otra opción.",
        "consigna_adaptada": "Consigna simplificada y estructurada paso a paso para la producción escrita.",
        "opciones_expresion": "Opciones DUA de expresión: Escribe un párrafo de 4 líneas, dibuja un cómic representativo de la idea central, o explica oralmente tu respuesta al docente.",
        "puntaje": 4,
        "lineas_respuesta": 4
      }
    },
    "cierre": {
      "titulo": "Cierre de la Sesión (Ticket de Salida Adaptado)",
      "ticket_salida": {
        "pregunta_andamiada": "Pregunta rápida de ticket de salida adaptada.",
        "pista_ayuda": "Pista de ayuda.",
        "lineas_respuesta": 2
      },
      "metacognicion": [
        "¿Qué parte de la guía me resultó más fácil de responder hoy?",
        "¿Cómo me ayudaron las pistas y el vocabulario a entender mejor?"
      ],
      "autoevaluacion": [
        "Usé el vocabulario de apoyo para entender el texto.",
        "Respondí las preguntas usando las pistas de ayuda.",
        "Elegí mi opción favorita para expresar mi aprendizaje."
      ]
    },
    "pauta_docente": {
      "respuestas_preguntas": [
        { "numero": 1, "respuesta_correcta": "Respuesta correcta esperada (Alternativa A).", "criterios_evaluacion": "2 pts: Marca la opción correcta A. 0 pts: Marca otra opción." },
        { "numero": 2, "respuesta_correcta": "Respuesta modelo esperada completando el inicio de respuesta.", "criterios_evaluacion": "2 pts: Completa coherentemente el inicio de respuesta con información del texto. 1 pt: Respuesta incompleta." },
        { "numero": 3, "respuesta_correcta": "Respuesta modelo que justifica la postura elegida.", "criterios_evaluacion": "3 pts: Elige una postura y justifica críticamente. 1-2 pts: Elige postura sin justificar adecuadamente." }
      ],
      "respuesta_produccion": {
        "respuesta_modelo": "Ejemplo de producción escrita esperada o descripción del producto alternativo (ej: descripción del dibujo esperado o pauta de rúbrica oral).",
        "criterios_evaluacion": "4 pts: Expresa de forma clara la idea mediante texto, dibujo o explicación oral. 2 pts: Idea confusa o incompleta."
      },
      "respuesta_ticket": {
        "respuesta_correcta": "Respuesta modelo para el ticket de salida adaptado."
      }
    }
  }` : 'null'}
}`;
}

function buildNarrativaPrompt(params: {
  nivel: string; eje: string | null; oa_code: string; oa_texto: string;
  tema: TemaKey; tema_label: string; rti_nivel: RtiNivel;
  include_analogia: boolean; include_produccion: boolean;
}): string {
  const { nivel, eje, oa_code, oa_texto, tema, tema_label, rti_nivel, include_analogia, include_produccion } = params;
  const isDuaActive = rti_nivel === 'dua';

  return `Genera una guía de aprendizaje educativa en formato NARRATIVO/GAMIFICADO para la asignatura de Lengua y Literatura.
Nivel: ${nivel}
Eje: ${eje ?? 'Lectura'}
OA: ${oa_code} — ${oa_texto}
Tema narrativo: "${tema_label}" (toda la guía debe girar en torno a este marco lúdico)
Generar Adaptación DUA: ${isDuaActive ? 'SÍ (Generar sección Universal y sección DUA)' : 'NO (Generar sólo sección Universal, dejar la clave "dua" como null)'}

El JSON resultante debe seguir EXACTAMENTE esta estructura:
{
  "titulo": "Título narrativo e intrigante de la guía (ej: 'El enigma de la última hoja')",
  "nivel": "${nivel}",
  "eje": "${eje ?? 'Lectura'}",
  "oa_code": "${oa_code}",
  "formato": "narrativa",
  "tema_narrativo": "${tema}",
  "rti_nivel": "${rti_nivel}",
  "instrucciones_docente": "Indicaciones pedagógicas para el docente sobre cómo guiar la narrativa y qué aprendizajes del OA se están evaluando",
  
  "universal": {
    "narrativa_encabezado": {
      "numero": "Caso N°1",
      "subtitulo": "Frase enigmática y motivadora conectada al OA"
    },
    "narrativa_contexto": "Texto de 3 a 5 oraciones que plantea la situación o misterio a resolver, conectándola directamente con el contenido didáctico de la guía.",
    "activacion": {
      "titulo": "Pista 1: El Enigma de Entrada",
      "texto": "Texto breve de 1-2 párrafos que introduce el tema didáctico bajo la atmósfera del juego.",
      "pregunta": "Pregunta de activación reflexiva vinculada a la situación inicial.",
      "lineas_respuesta": 3
    },
    "desarrollo": {
      "titulo": "Pista 2: Lectura del Expediente: [Nombre del texto]",
      "texto_principal": "Texto de lectura completo, de 2 a 4 párrafos, adecuado al nivel. Puede ser un fragmento literario, noticia, crónica u otro que sirva de 'evidencia' o texto didáctico al OA."
    },
    "actividades": {
      "titulo": "Pista 3: Evidencias por Resolver",
      "instruccion": "Analiza detenidamente el expediente y descifra los siguientes enigmas de comprensión.",
      "preguntas": [
        {
          "numero": 1,
          "nivel_cognitivo": "literal",
          "enunciado": "Pregunta literal que requiere extraer datos del expediente.",
          "puntaje": 2,
          "lineas_respuesta": 3
        },
        {
          "numero": 2,
          "nivel_cognitivo": "inferencial",
          "enunciado": "Pregunta inferencial que requiere deducir intenciones o sentidos ocultos en el expediente.",
          "puntaje": 2,
          "lineas_respuesta": 3
        },
        {
          "numero": 3,
          "nivel_cognitivo": "critico",
          "enunciado": "Pregunta crítica que requiere evaluar el comportamiento, veracidad o valor del expediente.",
          "puntaje": 3,
          "lineas_respuesta": 4
        }
      ],
      "produccion_escrita": {
        "titulo": "Pista 4: El Reporte Final de Investigación",
        "instruccion": "Redacta el informe oficial con tus hallazgos.",
        "consigna": "Consigna detallada de producción de texto (informe, carta formal o ensayo creativo) conectada al OA y a la resolución de la narrativa.",
        "puntaje": 4,
        "lineas_respuesta": 6
      }
    },
    "cierre": {
      "titulo": "Pista 5: Veredicto y Cierre",
      "ticket_salida": {
        "pregunta": "Pregunta rápida de ticket de salida para comprobar el aprendizaje de hoy.",
        "lineas_respuesta": 2
      },
      "metacognicion": [
        "¿Qué pista del texto me ayudó a resolver el caso de hoy?",
        "¿Cómo evaluaría mi proceso de investigación en esta actividad?"
      ],
      "autoevaluacion": [
        "Identifiqué las evidencias clave en el expediente.",
        "Redacté el reporte final con fundamentos claros.",
        "Resolví el caso analizando críticamente la información."
      ]
    },
    "narrativa_veredicto": "Párrafo breve de síntesis narrativa que cierra la historia conectando las respuestas del estudiante con la conclusión exitosa del caso/misión.",
    "pauta_docente": {
      "respuestas_preguntas": [
        { "numero": 1, "respuesta_correcta": "Respuesta modelo exacta esperada para la pregunta 1.", "criterios_evaluacion": "2 pts: Identifica correctamente la información explícita... 1 pt: Respuesta incompleta..." },
        { "numero": 2, "respuesta_correcta": "Respuesta modelo exacta esperada para la pregunta 2.", "criterios_evaluacion": "2 pts: Infiere correctamente el sentido implícito... 1 pt: Deduce parcialmente..." },
        { "numero": 3, "respuesta_correcta": "Respuesta modelo exacta esperada para la pregunta 3.", "criterios_evaluacion": "3 pts: Argumenta su postura con fundamentos del texto... 1-2 pts: Expresa opinión sin suficiente sustento..." }
      ],
      "respuesta_produccion": {
        "respuesta_modelo": "Ejemplo completo de un texto que responde a la consigna de producción.",
        "criterios_evaluacion": "4 pts: Cumple estructura narrativa, ortografía y coherencia. 2 pts: Falta desarrollo del reporte..."
      },
      "respuesta_ticket": {
        "respuesta_correcta": "Respuesta esperada para el ticket de salida."
      }
    }
  },
  
  "dua": ${isDuaActive ? `{
    "narrativa_encabezado": {
      "numero": "Caso N°1 (Adaptado DUA)",
      "subtitulo": "Frase de apoyo y motivación más directa"
    },
    "narrativa_contexto": "Texto de 3 a 5 oraciones que plantea la situación o misterio de forma directa, con vocabulario accesible y oraciones cortas.",
    "vocabulario_apoyo": [
      { "palabra": "Palabra compleja 1", "definicion": "Definición simple contextualizada", "ejemplo": "Ejemplo en una oración" },
      { "palabra": "Palabra compleja 2", "definicion": "Definición simple contextualizada", "ejemplo": "Ejemplo en una oración" }
    ],
    "activacion": {
      "titulo": "Pista 1: El Enigma de Entrada (Adaptado)",
      "texto_simplificado": "Texto de activación en lenguaje simple con ideas directas conectadas al misterio.",
      "pregunta_andamiada": "Pregunta de activación apoyada.",
      "pista_ayuda": "Pista: Recuerda una situación familiar donde haya pistas similares.",
      "lineas_respuesta": 2
    },
    "desarrollo": {
      "titulo": "Pista 2: Lectura del Expediente: [Nombre del texto] (Adaptado DUA)",
      "texto_principal": "Texto de lectura completo en versión simplificada, con las palabras del glosario destacadas para facilitar la lectura.",
      "apoyo_visual_desc": "Instrucción de organizador gráfico visual (ej: dibuja un mapa mental de las pistas o completa la tabla de evidencias del sospechoso)."
    },
    "actividades": {
      "titulo": "Pista 3: Evidencias por Resolver (Adaptadas)",
      "instruccion_simplificada": "Resuelve los enigmas de comprensión usando las pistas de ayuda.",
      "preguntas": [
        {
          "numero": 1,
          "nivel_cognitivo": "literal",
          "enunciado": "Pregunta literal de opción múltiple para encontrar un dato del expediente.",
          "opciones_alternativas": ["A) [Opción correcta]", "B) [Opción incorrecta 1]", "C) [Opción incorrecta 2]"],
          "pista_ayuda": "Pista: Lee la tercera línea de la lectura.",
          "puntaje": 2,
          "lineas_respuesta": 1
        },
        {
          "numero": 2,
          "nivel_cognitivo": "inferencial",
          "enunciado": "Pregunta inferencial con inicio de respuesta.",
          "opciones_alternativas": null,
          "pista_ayuda": "Pista: Piensa por qué el personaje ocultó el objeto.",
          "inicio_respuesta": "El personaje ocultó el objeto porque quería...",
          "puntaje": 2,
          "lineas_respuesta": 2
        },
        {
          "numero": 3,
          "nivel_cognitivo": "critico",
          "enunciado": "Pregunta crítica con alternativas de andamiaje.",
          "opciones_alternativas": ["A) Hizo bien, porque...", "B) Hizo mal, porque...", "C) Fue una acción sospechosa, porque..."],
          "pista_ayuda": "Pista: Evalúa si su decisión ayudó a resolver el caso.",
          "puntaje": 3,
          "lineas_respuesta": 3
        }
      ],
      "produccion_escrita": {
        "titulo": "Pista 4: El Reporte Final (Formas de Expresión)",
        "instruccion_simplificada": "Elige tu forma favorita de entregar tu informe final.",
        "consigna_adaptada": "Consigna simplificada y estructurada paso a paso para el informe.",
        "opciones_expresion": "Opciones DUA de expresión: Escribe un párrafo de 4 líneas, dibuja el desenlace del misterio, o graba una nota de voz explicando cómo se resolvió el caso.",
        "puntaje": 4,
        "lineas_respuesta": 4
      }
    },
    "cierre": {
      "titulo": "Pista 5: Veredicto y Cierre Adaptado",
      "ticket_salida": {
        "pregunta_andamiada": "Pregunta rápida de ticket de salida con andamiaje.",
        "pista_ayuda": "Pista de ayuda.",
        "lineas_respuesta": 2
      },
      "metacognicion": [
        "¿Qué recurso (glosario, pistas, opciones) me sirvió más hoy para resolver el caso?",
        "¿Cómo explicaría mis aprendizajes a un compañero de equipo?"
      ],
      "autoevaluacion": [
        "Usé el glosario para comprender los términos difíciles.",
        "Seguí las pistas para contestar las preguntas sobre el expediente.",
        "Expresé mi veredicto usando la opción de comunicación que preferí."
      ]
    },
    "narrativa_veredicto": "Párrafo breve de síntesis narrativa adaptado que cierra la historia felicitando la resolución del misterio.",
    "pauta_docente": {
      "respuestas_preguntas": [
        { "numero": 1, "respuesta_correcta": "Respuesta correcta (Alternativa A).", "criterios_evaluacion": "2 pts: Marca la opción correcta A. 0 pts: Marca otra opción." },
        { "numero": 2, "respuesta_correcta": "Respuesta modelo esperada completando el inicio de respuesta.", "criterios_evaluacion": "2 pts: Completa coherentemente el inicio de respuesta con información del texto. 1 pt: Respuesta incompleta." },
        { "numero": 3, "respuesta_correcta": "Respuesta modelo que justifica la postura elegida.", "criterios_evaluacion": "3 pts: Elige una postura y justifica críticamente. 1-2 pts: Elige postura sin justificar adecuadamente." }
      ],
      "respuesta_produccion": {
        "respuesta_modelo": "Ejemplo de reporte esperado o pauta para valorar el cómic o audio alternativo.",
        "criterios_evaluacion": "4 pts: Comunica con claridad la resolución del caso mediante dibujo, texto u oralidad. 2 pts: Explicación parcial o confusa."
      },
      "respuesta_ticket": {
        "respuesta_correcta": "Respuesta modelo esperada para el ticket de salida adaptado."
      }
    }
  }` : 'null'}
}`;
}

// ─── GET — Lista de guías del usuario ────────────────────────────────────────

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development') {
    const mockGuiasData = [
      {
        id: 'guia-1',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        nivel: '2° Medio',
        eje: 'Lectura',
        titulo: 'Guía de Comprensión Lectora: El Túnel',
        formato: 'narrativa',
        tema_narrativo: 'caso',
        rti_nivel: 'universal',
        contenido_json: {
          titulo: 'Guía de Comprensión Lectora: El Túnel',
          meta: { curso: '2° Medio', unidad: 'Unidad 1', tema: 'El Túnel' },
          contexto: 'El pintor Juan Pablo Castel narra desde la cárcel los motivos por los cuales mató a María Iribarne.',
          bloques: [
            {
              tipo: 'lectura',
              titulo: 'Texto Base: El Túnel (Fragmento)',
              texto: 'Bastará decir que soy Juan Pablo Castel, el pintor que mató a María Iribarne; supongo que el proceso está en el recuerdo de todos y que no se necesitan mayores explicaciones sobre mi persona.'
            },
            {
              tipo: 'banco_palabras',
              titulo: 'Vocabulario Clave',
              instruccion: 'Define las siguientes palabras según el contexto:',
              palabras: [
                { palabra: 'POSTRERA', definicion: 'Que es la última en una lista o serie.' },
                { palabra: 'LÉXICO', definicion: 'Conjunto de palabras de una lengua.' }
              ]
            },
            {
              tipo: 'preguntas',
              titulo: 'Preguntas de Comprensión',
              preguntas: [
                {
                  enunciado: '¿Quién es el narrador del fragmento?',
                  alternativas: ['María Iribarne', 'Juan Pablo Castel', 'Un narrador omnisciente', 'Un testigo del crimen'],
                  clave: 'B'
                }
              ]
            }
          ],
          autoevaluacion_semaforo: {
            titulo: 'Autoevaluación de Logros',
            items: ['Identifiqué al narrador principal', 'Expliqué las motivaciones básicas del personaje']
          }
        }
      }
    ];
    return NextResponse.json({ guias: mockGuiasData, total: mockGuiasData.length, limit: 20, offset: 0 });
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
    .from('guias')
    .select('id, titulo, nivel, eje, oa_codes, formato, tema_narrativo, rti_nivel, contenido_json, created_at', { count: 'exact' })
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guias: data ?? [], total: count ?? 0, limit, offset });
}

function buildUnifiedGuiaPrompt(params: {
  nivel: string;
  eje: string | null;
  oa_code: string;
  oa_texto: string;
  formato: string;
  tema_label: string;
  actividadesSeleccionadas: string[];
  texto_kit?: { titulo: string; autor: string; cuerpo: string } | null;
  actividad_adicional?: string | null;
  templateId?: string | null;
  palabraCamino?: string | null;
}): string {
  const { nivel, eje, oa_code, oa_texto, formato, tema_label, actividadesSeleccionadas, texto_kit, actividad_adicional, templateId, palabraCamino } = params;

  let textInstructions = "";
  if (texto_kit) {
    textInstructions = `DEBES utilizar exactamente el siguiente texto de lectura del Kit de Clase. NO inventes otro texto de lectura:
Título: "${texto_kit.titulo}"
Autor: "${texto_kit.autor}"
Contenido (cuerpo):
"${texto_kit.cuerpo}"`;
  } else {
    let rangoPalabras = "entre 280 y 380 palabras"; // fallback medio
    const nivelLower = (nivel || '').toLowerCase();
    if (nivelLower.includes('5') || nivelLower.includes('6') || nivelLower.includes('quinto') || nivelLower.includes('sexto')) {
      rangoPalabras = "entre 200 y 280 palabras";
    } else if (nivelLower.includes('7') || nivelLower.includes('8') || nivelLower.includes('septimo') || nivelLower.includes('séptimo') || nivelLower.includes('octavo')) {
      rangoPalabras = "entre 280 y 380 palabras";
    } else if (nivelLower.includes('1') || nivelLower.includes('2') || nivelLower.includes('i°') || nivelLower.includes('ii°') || nivelLower.includes('medio') || nivelLower.includes('primero') || nivelLower.includes('segundo')) {
      rangoPalabras = "entre 450 y 600 palabras";
    }

    textInstructions = `Genera un texto de lectura 100% original, coherente con el nivel del curso (${nivel}), de tipo ${formato === 'narrativa' ? 'Narrativo' : 'Informativo/Opinión'}.
El texto de lectura DEBE tener ${rangoPalabras} en su campo "contenido". No generes textos cortos.`;
  }

  // Problema 3: OA demasiado largo. Extraemos sólo el código del OA y mantenemos el objetivo corto.
  const cleanOas = oa_code.startsWith("OA_GUIA")
    ? (oa_texto.match(/OA\s*\d+/gi)?.join(", ") || "OA de Lenguaje")
    : oa_code;

  const actList = actividadesSeleccionadas && actividadesSeleccionadas.length > 0 
    ? actividadesSeleccionadas.join(', ')
    : 'completar_oraciones, palabra_intrusa, unir_parejas';

  let adicionalPrompt = "";
  if (actividad_adicional && actividad_adicional !== 'ninguna' && actividad_adicional.trim() !== '') {
    const actType = actividad_adicional.trim();
    if (actType === 'preguntas_capciosas') {
      adicionalPrompt = `
ACTIVIDAD ADICIONAL OBLIGATORIA: Debes incluir en el JSON de respuesta el campo "actividad_adicional" con el tipo "preguntas_capciosas".
El campo debe tener esta estructura:
{
  "tipo": "preguntas_capciosas",
  "preguntas": [
    {
      "pregunta": "texto de la pregunta engañosa",
      "opciones": ["opción A", "opción B", "opción C", "opción D"],
      "respuesta_correcta": "opción correcta",
      "trampa": "explicación de por qué las otras opciones son trampas"
    }
  ]
}
Genera entre 3 y 4 preguntas capciosas relacionadas con el texto de lectura.`;
    } else if (actType === 'codigo_secreto') {
      adicionalPrompt = `
ACTIVIDAD ADICIONAL OBLIGATORIA — CÓDIGO SECRETO:
Incluye en el JSON el campo "actividad_adicional" con esta estructura exacta:
{
  "tipo": "codigo_secreto",
  "mensaje": "frase corta relacionada con el texto (máximo 6 palabras, sin tildes)",
  "clave": {
    "A": "@", "E": "#", "I": "$", "L": "%", "N": "&", "O": "*", "R": "!", "S": "?", "T": "+", "U": "="
  },
  "mensaje_codificado": "la misma frase reemplazando cada letra por su símbolo según la clave"
}
CÓDIGO SECRETO — REGLA CRÍTICA: La clave debe usar SOLO caracteres ASCII de esta lista:
@ # $ % & * ! ? + = / 0 1 2 3 4 5 6 7 8 9
NO usar emojis, flechas, estrellas, círculos ni ningún símbolo Unicode especial.
Ejemplo válido de clave:
{"A":"@", "E":"#", "I":"$", "L":"%", "N":"&", "O":"*", "R":"!", "S":"?", "T":"+", "U":"="}
El campo mensaje_codificado debe construirse sustituyendo letra por letra usando exactamente esa clave.
REGLA CRÍTICA: El campo 'mensaje' DEBE usar ÚNICAMENTE letras que estén
como claves en el objeto 'clave'. Antes de escribir el mensaje, lista las
letras disponibles en tu clave y elige palabras que solo usen esas letras.
Si una palabra contiene una letra que no está en tu clave, NO la uses.
Verifica letra por letra antes de escribir el mensaje_codificado.
El mensaje debe contener SOLO letras que estén en la clave. Verifica letra por letra antes de escribir el mensaje_codificado.`;
    } else {
      adicionalPrompt = `
ACTIVIDAD ADICIONAL OBLIGATORIA: Debes incluir en el JSON de respuesta el campo "actividad_adicional" con el tipo "${actType}".`;
    }
  }

  let caminoPistasInstruction = "";
  if (actividadesSeleccionadas && (actividadesSeleccionadas.includes('camino_pistas') || JSON.stringify(actividadesSeleccionadas).includes('camino_pistas'))) {
    const letters = palabraCamino ? palabraCamino.toUpperCase().split('') : [];
    const stationsText = letters.map((letra, idx) => `- Estación ${idx + 1}: una palabra del texto de lectura que empiece EXACTAMENTE con la letra "${letra}"`).join('\n');
    
    caminoPistasInstruction = `
INSTRUCCIÓN CRÍTICA PARA CAMINO_PISTAS:
Para el desafío camino_pistas, la palabra secreta es "${palabraCamino || 'TESIS'}" (ya definida).
Debes generar exactamente ${letters.length || 5} estaciones. Las respuestas (en "respuesta" o "respuesta_correcta") DEBEN cumplir obligatoriamente esta asignación de letra inicial:
${stationsText || '- Estación 1: T\n- Estación 2: E\n- Estación 3: S\n- Estación 4: I\n- Estación 5: S'}
El campo palabra_secreta debe ser exactamente "${palabraCamino || 'TESIS'}".

PROCESO OBLIGATORIO PARA CAMINO_PISTAS — SEGUIR EN ESTE ORDEN EXACTO:

PASO 1: Lee el texto de lectura completo e identifica las palabras que comiencen con las letras requeridas.
Anótalas mentalmente.

PASO 2: Para cada posición i de la palabra secreta:
  a) Toma la palabra del texto de lectura que asignaste a esa posición (debe empezar con la letra requerida)
  b) PRIMERO escribe el campo "respuesta" o "respuesta_correcta": esa palabra exacta del texto
  c) LUEGO escribe el campo "pregunta": una pregunta que NATURALMENTE lleve al estudiante 
     a responder esa palabra específica. La pregunta debe ser coherente: si alguien lee la 
     pregunta y busca en el texto, debe encontrar ESA palabra como respuesta obvia.

PASO 3: Cada respuesta debe ser ÚNICA. Está PROHIBIDO repetir la misma palabra en dos 
estaciones diferentes.

PROHIBIDO:
- Usar palabras que NO aparezcan literalmente en el texto de lectura
- Repetir la misma respuesta en dos estaciones
- Usar la misma palabra que forma parte de la palabra secreta como respuesta`;
  }

  let adicionalesPrompt = "";
  if (actividadesSeleccionadas && (actividadesSeleccionadas.includes('mensajes_cifrados') || JSON.stringify(actividadesSeleccionadas).includes('mensajes_cifrados'))) {
    adicionalesPrompt += `
INSTRUCCIÓN PARA EL DESAFÍO "mensajes_cifrados":
VERIFICACIÓN OBLIGATORIA: Después de elegir las palabras a codificar, revisa cada letra de cada palabra y confirma que existe en la clave numérica que generaste. Si una palabra tiene una letra que no está en la clave, debes: (a) reemplazar esa palabra por otra que solo use letras presentes en la clave, o (b) agregar esa letra a la clave. NUNCA codifiques una palabra con letras ausentes de la clave — el estudiante no podría descifrarla.

REGLA CRÍTICA para mensajes_cifrados:
- Cada campo "descifrado" DEBE ser una palabra real, completa y reconocible en español.
- NUNCA truncar palabras largas. Si una palabra como SOLIDARIDAD tiene letras que no están en la clave, NO la uses: elige otra palabra diferente que SÍ sea completamente codificable con la clave generada.
- Palabras aceptables de ejemplo: SOLEDAD, VERDAD, VIRTUD, TESIS, EMPATIA, RAZON, LAZOS, PRÓJIMO.
- Antes de incluir una palabra, verifica letra por letra que TODAS sus letras tienen un código asignado en la clave. Si falta aunque sea una letra, descarta esa palabra y elige otra.
- Mínimo 3 mensajes válidos. Si no puedes generar 3 con la clave actual, amplía la clave con las letras faltantes.`;
  }
  if (actividadesSeleccionadas && (actividadesSeleccionadas.includes('pupiletras') || JSON.stringify(actividadesSeleccionadas).includes('pupiletras'))) {
    adicionalesPrompt += `
INSTRUCCIÓN PARA EL DESAFÍO "pupiletras":
RESTRICCIÓN DE LONGITUD: La cuadrícula es de 10×10 celdas. Solo puedes incluir palabras de máximo 9 letras. Palabras de 10 letras o más NO CABEN en la cuadrícula y deben descartarse. Verifica el largo de cada palabra antes de incluirla. Si una palabra clave del texto tiene más de 9 letras (como 'SOLIDARIDAD', 'RESILIENCIA', 'INDIVIDUALISMO'), no la uses — busca una más corta del mismo texto (como 'PRÓJIMO', 'TESIS', 'FANTASÍA', 'SOLEDAD', 'PASIVA').
IMPORTANTE: usa solo palabras completas del vocabulario del texto, entre 4 y 9 letras. Si una palabra supera 9 letras, elíge una palabra diferente — NUNCA la recortes ni truncues.`;
  }
  if (actividadesSeleccionadas && (actividadesSeleccionadas.includes('ordenar_parrafos') || JSON.stringify(actividadesSeleccionadas).includes('ordenar_parrafos'))) {
    adicionalesPrompt += `
INSTRUCCIÓN PARA EL DESAFÍO "ordenar_parrafos":
REGLA CRÍTICA para ordenar_parrafos (pauta):
El campo "respuesta" de cada fragmento en la pauta debe contener el número de posición REAL que ese fragmento ocupa en el texto original (1 = primero que aparece en el texto, 5 = último).
PROCESO OBLIGATORIO:
1. Localiza cada fragmento textualmente dentro del texto de lectura.
2. Ordénalos según su posición de aparición en el texto (de inicio a fin).
3. Al fragmento que aparece primero asígnale posición 1, al segundo posición 2, etc.
4. Verifica que todos los números del 1 al N sean distintos y ninguno se repita.
NUNCA asignes posiciones por intuición — siempre verifica en el texto.
ORDENAR PÁRRAFOS — VALIDACIÓN OBLIGATORIA: Antes de escribir el JSON, verifica
que los números de posición sean todos distintos y cubran exactamente del 1 al N
sin saltos ni repeticiones. Si tienes N=5 fragmentos, los números deben ser
exactamente {1, 2, 3, 4, 5} distribuidos de a uno. Nunca repitas un número.`;
  }

  // Instrucciones específicas por plantilla
  const templateInstructions: Record<string, string> = {
    'comprension_lectora': `ENFOQUE DE PLANTILLA — Comprensión Lectora:
- Los desafíos deben evaluar comprensión literal, inferencial y crítica del texto.
- Prioriza preguntas que identifiquen idea principal, detalles relevantes y propósito del autor.
- El vocabulario debe extraerse del texto y trabajarse en contexto.`,

    'taller_escritura': `ENFOQUE DE PLANTILLA — Taller de Escritura:
- Los desafíos deben incluir actividades de producción escrita: completar oraciones, transformar fragmentos, escribir desde otra perspectiva.
- Prioriza desafíos como completar_oraciones y ordenar_parrafos.
- El ticket de salida debe pedir una producción escrita breve (mínimo un párrafo).`,

    'vocabulario_contexto': `ENFOQUE DE PLANTILLA — Vocabulario en Contexto:
- Los desafíos deben centrarse en el significado, uso y relaciones entre palabras del texto.
- Prioriza desafíos como unir_parejas (término-definición), anagramas y completar_oraciones con vocabulario específico.
- El banco de vocabulario debe incluir al menos 10 palabras con sus definiciones contextualizadas.`,

    'analisis_literario': `ENFOQUE DE PLANTILLA — Análisis Literario:
- Los desafíos deben identificar recursos retóricos, figuras literarias, estructura argumentativa y recursos persuasivos.
- Prioriza preguntas inferenciales y de análisis crítico.
- Incluye actividades de clasificación entre recursos válidos y fallas argumentativas.`,

    'guia_gamificada': `ENFOQUE DE PLANTILLA — Guía Gamificada:
- El tono debe ser motivador, con lenguaje de misión/aventura.
- Los desafíos deben presentarse como retos o misiones numeradas.
- Usa vocabulario dinámico: "tu misión", "desafío", "nivel", "logro".`,

    'cuadernillo_actividades': `ENFOQUE DE PLANTILLA — Cuadernillo de Actividades:
- Genera el máximo de desafíos posible dentro del límite de tokens.
- Mayor variedad tipológica: combina desafíos de comprensión, vocabulario y producción.
- El ticket de salida debe ser más extenso, con al menos 3 preguntas de cierre.`
  };

  const templateNote = templateId && templateInstructions[templateId]
    ? `\n\n${templateInstructions[templateId]}`
    : '';

  return `Genera una guía de aprendizaje en formato ${formato.toUpperCase()}.
Nivel: ${nivel}
Eje: ${eje ?? 'Lectura'}
Códigos OA: ${cleanOas}
Descripción OA: ${oa_texto}

${formato === 'narrativa' ? `TEMA NARRATIVO/GAMIFICADO: "${tema_label}". Toda la guía debe girar bajo esta temática lúdica (Misión, Caso o Expedición), usando términos relacionados en el título y las instrucciones.` : ''}

INSTRUCCIONES DE TEXTO DE LECTURA:
${textInstructions}

DESAFÍOS REQUERIDOS:
Debes generar exactamente los siguientes tipos de desafíos en el array "desafios":
${actList}

Genera actividades que correspondan estrictamente a estos tipos de desafíos, basándote en el texto de lectura.
${caminoPistasInstruction}
${adicionalesPrompt}
${templateNote}
${adicionalPrompt}`;
}

// ─── POST — Generar guía ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth obligatoria ──────────────────────────────────────────────────────
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado — se requiere sesión activa' }, { status: 401 });

  if (token === 'mock-access-token' && process.env.NODE_ENV === 'development') {
    let body: any;
    try { body = await req.json(); } catch { body = {}; }
    const nivel = body.nivel || '2° Medio';
    const rti_nivel = body.rti_nivel || 'universal';
    const formato = body.formato || 'tradicional';
    const tema = body.tema_narrativo || 'caso';

    const mockRecord = {
      id: 'mock-guide-' + Date.now(),
      nivel,
      eje: 'Lectura',
      oa_codes: ['OA 2'],
      formato,
      tema_narrativo: formato === 'narrativa' ? tema : null,
      rti_nivel,
      titulo: 'Guía de Trabajo - REI DOCENTE',
      created_at: new Date().toISOString(),
      contenido_json: {
        titulo: 'Guía de Trabajo - REI DOCENTE',
        objetivo_clase: 'Comprender el arte de la lectura y aplicar vocabulario clave.',
        activacion: '¿Por qué crees que un mismo libro puede gustar o significar algo diferente para distintos lectores?',
        texto_lectura: {
          tipo: 'Columna de opinión',
          titulo: 'El Arte de la Lectura',
          autor: 'Andrés Valenzuela',
          contenido: 'Leer no es simplemente decodificar signos gráficos en una página, sino entablar un diálogo activo con el autor. El lector aporta sus propias experiencias y conocimientos para reconstruir el sentido del texto, haciendo que la obra cobre vida de manera única en cada lectura. Por lo tanto, leer activamente es esencial para desarrollar nuestro propio pensamiento crítico y expandir la imaginación.'
        },
        banco_palabras: ['decodificar', 'diálogo', 'crítico', 'imaginación'],
        desafios: [
          {
            tipo: 'palabra_intrusa',
            instruccion: 'Identifica la palabra que no pertenece al grupo semántico de "lectura".',
            items: [
              { grupo: ['libro', 'página', 'lector', 'camión', 'texto'], respuesta: 'camión' }
            ]
          },
          {
            tipo: 'completar_oraciones',
            instruccion: 'Completa con los conceptos del banco de palabras.',
            oraciones: [
              { texto: 'El lector entabla un ___ activo con el autor.', respuesta: 'diálogo' }
            ]
          }
        ],
        ticket_salida: 'Explica en tus propias palabras por qué la lectura activa requiere del esfuerzo del lector.',
        autoevaluacion: [
          'Comprendí la diferencia entre leer y decodificar.',
          'Identifiqué la palabra intrusa en el desafío.',
          'Completé la oración del texto con el concepto correcto.'
        ],
        pauta_docente: {
          respuestas_desafios: [
            'Palabra intrusa: camión (no tiene relación con lectura).',
            'Completar oraciones: diálogo.'
          ]
        }
      }
    };
    return NextResponse.json(mockRecord, { status: 201 });
  }

  const supabase = makeSupabaseClient(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
  const userId = userData.user.id;

  // ── Trial limit ───────────────────────────────────────────────────────────
  const guard = await checkTrialLimit(supabase, userId, 'guides_generated');
  if (guard.blocked) {
    const isActive = guard.profile?.plan_status === 'active';
    return NextResponse.json(
      {
        error: 'limite_alcanzado',
        message: 'Alcanzaste el límite del plan piloto. Has utilizado todas las generaciones disponibles para este módulo.',
        reason: guard.reason,
        tipo: 'guides_generated',
        limit: isActive ? 12 : 5,
        current: guard.profile?.guides_generated ?? 0,
        plan_status: guard.profile?.plan_status,
        renewal_date: guard.renewalDate,
      },
      { status: 403 }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 }); }

  const nivel             = (body.nivel        as string  | undefined)?.trim() ?? '';
  const eje               = (body.eje          as string  | null | undefined)  ?? null;
  const oa_code           = (body.oa_code      as string  | undefined)?.trim() ?? '';
  const oa_texto          = (body.oa_texto     as string  | undefined)?.trim() ?? '';
  const formato           = (body.formato      as Formato | undefined) ?? 'tradicional';
  const tema              = (body.tema_narrativo as TemaKey | undefined) ?? 'caso';
  const tema_label_custom = (body.tema_label   as string  | undefined)?.trim() ?? '';
  
  // Template parameters
  const templateId        = (body.templateId   as string  | undefined)?.trim() || null;
  const incluir_dua       = body.incluir_dua === true;
  const incluir_imagenes  = body.incluir_imagenes === true;
  const actividad_adicional = (body.actividad_adicional as string | undefined)?.trim() || null;
  console.log('[Guías API] actividad_adicional recibida:', actividad_adicional);
  const actividadesSeleccionadas = (body.actividadesSeleccionadas as string[]) || [];
  const texto_kit         = (body.texto_kit as any) || null;

  const rti_nivel         = templateId 
    ? (incluir_dua ? 'dua' : 'universal') 
    : ((body.rti_nivel    as RtiNivel | undefined) ?? 'universal');

  const include_analogia  = body.include_analogia  !== false;
  const include_produccion= body.include_produccion !== false;

  if (!nivel) return NextResponse.json({ error: 'El campo "nivel" es obligatorio' }, { status: 400 });
  if (!oa_code) return NextResponse.json({ error: 'Debes seleccionar un OA' }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
    return NextResponse.json({ error: 'API Key de Anthropic no configurada.' }, { status: 500 });
  }
  const model = 'claude-sonnet-4-6';

  let libroContexto = '';
  if (body.fuente === 'lectura_domiciliaria' && body.libro_id) {
    const supabaseClient = makeSupabaseClient(token);
    const { data: libro } = await supabaseClient
      .from('biblioteca_libros')
      .select('*')
      .eq('id', body.libro_id)
      .single();

    if (libro) {
      libroContexto = `
Esta guía se basa en la lectura domiciliaria: "${libro.titulo}" de ${libro.autor || 'Desconocido'}.
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

INSTRUCCIÓN ESPECIAL: El texto principal generado en la guía ("desarrollo.texto_principal") debe ser un fragmento adaptado, adaptación didáctica o análisis/reseña sobre la obra "${libro.titulo}". Las preguntas de comprensión, actividades de vocabulario, analogías, desafíos y ticket de salida de la guía deben referirse estrictamente a la trama, personajes, vocabulario y fragmentos de la obra "${libro.titulo}" detallada en el expediente. No inventes hechos ni cambies los nombres de los personajes.
`;
    }
  }

  // ── Generar con Claude ────────────────────────────────────────────────────
  const anthropic = new Anthropic({ apiKey });
  const tema_label = tema === 'custom' && tema_label_custom
    ? tema_label_custom
    : TEMA_LABELS[tema];

  const hasCaminoPistas = actividadesSeleccionadas && (actividadesSeleccionadas.includes('camino_pistas') || JSON.stringify(actividadesSeleccionadas).includes('camino_pistas'));
  let palabraCamino: string | null = null;
  if (hasCaminoPistas) {
    const PALABRAS_CAMINO = [
      'TESIS', 'EMPATIA', 'RAZON', 'LAZOS', 'VALOR', 'IDEAS', 'ETICA',
      'DEBATE', 'LOGICA', 'PROSA', 'TEXTO', 'AUTOR', 'OPINAR', 'SOCIAL'
    ];
    palabraCamino = PALABRAS_CAMINO[Math.floor(Math.random() * PALABRAS_CAMINO.length)];
  }

  const userPrompt = buildUnifiedGuiaPrompt({
    nivel,
    eje,
    oa_code,
    oa_texto,
    formato,
    tema_label,
    actividadesSeleccionadas,
    texto_kit,
    actividad_adicional,
    templateId,
    palabraCamino
  });

  let rawText = '';
  try {
    const response = await anthropic.messages.create({
      model:      model,
      max_tokens: 8000,
      system:     [
        {
          type: 'text',
          text: buildGuiasSystemPrompt(),
          cache_control: { type: 'ephemeral' }
        }
      ] as any,
      messages:   [{ role: 'user', content: userPrompt + `\n\n${libroContexto}` }],
    });
    rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[guias] Claude generation failed:', msg);
    return NextResponse.json({ error: 'Error al generar la guía. Por favor intenta de nuevo.' }, { status: 500 });
  }

  try {
    const contenidoJson = JSON.parse(sanitizeJson(rawText));
    console.log('[DEBUG actividad_adicional]', JSON.stringify(contenidoJson.actividad_adicional ?? null, null, 2));
    console.log('[DEBUG actividad_adicional tipo]', contenidoJson.actividad_adicional?.tipo ?? 'NO ENCONTRADO');

    // Validar y corregir desafíos post-Claude
    if (contenidoJson && Array.isArray(contenidoJson.desafios)) {
      const dInf = contenidoJson.desafios.find((d: any) => d.tipo === 'preguntas_inferenciales');
      if (dInf) {
        console.log('[DEBUG preguntas_inferenciales] estructura completa:', JSON.stringify(dInf, null, 2));
      }
      const shuffleLetras = (palabra: string): string => {
        if (!palabra || palabra.length < 2) return (palabra || '').toUpperCase();
        const letras = palabra.toUpperCase().split('');
        for (let i = letras.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [letras[i], letras[j]] = [letras[j], letras[i]];
        }
        const resultado = letras.join('');
        return resultado === palabra.toUpperCase() ? shuffleLetras(palabra) : resultado;
      };

      const buildWordSearch = (words: string[]): { grid: string, size: number, placedWords: string[] } => {
        const SIZE = 15;
        const DIRECTIONS = [
          [0, 1],   // horizontal →
          [1, 0],   // vertical ↓
          [1, 1],   // diagonal ↘
          [1, -1],  // diagonal ↙
          [0, -1],  // horizontal ← (opcional)
          [-1, 0],  // vertical ↑ (opcional)
          [-1, -1], // diagonal ↖ (opcional)
          [-1, 1],  // diagonal ↗ (opcional)
        ];
        
        // Inicializar grilla vacía
        const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
        const placedWords: string[] = [];
        
        // Para cada palabra, intentar colocarla en dirección aleatoria
        for (const word of words) {
          let placed = false;
          let attempts = 0;
          while (!placed && attempts < 200) {
            attempts++;
            const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            const row = Math.floor(Math.random() * SIZE);
            const col = Math.floor(Math.random() * SIZE);
            
            // Verificar que cabe
            const endRow = row + dir[0] * (word.length - 1);
            const endCol = col + dir[1] * (word.length - 1);
            if (endRow < 0 || endRow >= SIZE || endCol < 0 || endCol >= SIZE) continue;
            
            // Verificar que no colisiona (o que coincide con misma letra)
            let canPlace = true;
            for (let i = 0; i < word.length; i++) {
              const r = row + dir[0] * i;
              const c = col + dir[1] * i;
              if (grid[r][c] !== '' && grid[r][c] !== word[i]) { canPlace = false; break; }
            }
            
            if (canPlace) {
              for (let i = 0; i < word.length; i++) {
                grid[row + dir[0] * i][col + dir[1] * i] = word[i];
              }
              placed = true;
              placedWords.push(word);
            }
          }
        }
        
        // Rellenar celdas vacías con letras aleatorias del vocabulario del texto
        const LETRAS = 'ABCDEFGHIJKLMNOPRSTUVZ';
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++)
            if (grid[r][c] === '') grid[r][c] = LETRAS[Math.floor(Math.random() * LETRAS.length)];
        
        // Serializar: string continuo de SIZE*SIZE chars (filas de SIZE)
        const sopaString = grid.map(row => row.join('')).join('');
        return { grid: sopaString, size: SIZE, placedWords };
      };

      // 1. Procesar y filtrar desafíos que no cumplan requisitos
      const indicesADescartar = new Set<number>();
      contenidoJson.desafios.forEach((desafio: any, idx: number) => {
        if (desafio.tipo === 'camino_pistas') {
          const estaciones = desafio.estaciones || desafio.pistas || desafio.preguntas || [];
          if (!Array.isArray(estaciones) || estaciones.length === 0) {
            console.warn('[Camino Pistas] Marcando para eliminar por falta de estaciones/pistas');
            indicesADescartar.add(idx);
            return;
          }
          desafio.estaciones = estaciones;
          
          if (palabraCamino) {
            const letrasEsperadas = palabraCamino.toUpperCase().split('');
            if (estaciones.length !== letrasEsperadas.length) {
              console.warn(`[Camino Pistas] Longitud de estaciones (${estaciones.length}) no coincide con letras esperadas (${letrasEsperadas.length})`);
              indicesADescartar.add(idx);
              return;
            }

            let coincide = true;
            for (let i = 0; i < estaciones.length; i++) {
              const e = estaciones[i];
              const resp = (e.respuesta_correcta || e.respuesta || '').trim();
              const letraReal = resp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
              if (letraReal !== letrasEsperadas[i]) {
                console.warn(`[Camino Pistas] Estación ${i + 1} respuesta "${resp}" (letra "${letraReal}") no coincide con esperada "${letrasEsperadas[i]}"`);
                coincide = false;
                break;
              }
            }

            if (!coincide) {
              indicesADescartar.add(idx);
            } else {
              desafio.palabra_secreta = palabraCamino;
            }
          } else {
            // Fallback si no había palabraCamino (ej. carga directa)
            const iniciales = desafio.estaciones.map((e: any) => {
              const resp = (e.respuesta_correcta || e.respuesta || '').trim();
              const letra = resp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
              return letra || '';
            }).join('');

            const tieneVocal = /[AEIOU]/i.test(iniciales);
            const tieneBloqueConsonantes = /[^AEIOU]{3}/i.test(iniciales);

            if (!tieneVocal || tieneBloqueConsonantes || iniciales.length < 3) {
              indicesADescartar.add(idx);
            } else {
              desafio.palabra_secreta = iniciales;
            }
          }
        }

        if (desafio.tipo === 'mensajes_cifrados') {
          const clave = desafio.clave || {};
          const letrasClave = new Set(
            Object.values(clave).map((val: any) => String(val).toUpperCase().trim())
          );
          
          const PALABRAS_CIFRADAS = [
            'SOLEDAD', 'VERDAD', 'VIRTUD', 'TESIS', 'EMPATIA', 'RAZON', 'LAZOS', 'PROJIMO',
            'DEBATE', 'LOGICA', 'PROSA', 'TEXTO', 'AUTOR', 'OPINAR', 'SOCIAL', 'IDEAS', 'VALOR', 'ETICA'
          ];

          const mensajes = desafio.mensajes || [];
          const mensajesValidos = mensajes.filter((msg: any) => {
            const descifrado = (msg.descifrado || msg.mensaje || '').toUpperCase();
            if (!descifrado) return false;

            const descifradoNormalizado = descifrado.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (!PALABRAS_CIFRADAS.includes(descifradoNormalizado)) {
              console.warn(`[Mensajes Cifrados] Palabra "${descifradoNormalizado}" no está en la lista de palabras aceptables.`);
              return false;
            }

            for (let i = 0; i < descifrado.length; i++) {
              const char = descifrado[i];
              if (char >= 'A' && char <= 'Z') {
                if (!letrasClave.has(char)) {
                  console.warn(`[Mensajes Cifrados] Letra "${char}" no está en la clave para el mensaje: "${descifrado}"`);
                  return false;
                }
              }
            }
            return true;
          });

          if (mensajesValidos.length < 2) {
            console.warn(`[Mensajes Cifrados] Marcando para eliminar por tener menos de 2 mensajes válidos: ${mensajesValidos.length}`);
            indicesADescartar.add(idx);
          } else {
            desafio.mensajes = mensajesValidos;
          }
        }

        if (desafio.tipo === 'pupiletras') {
          let palabras = Array.isArray(desafio.palabras) ? desafio.palabras : [];
          palabras = palabras.filter((p: string) => p.length <= 9);
          desafio.palabras = palabras;

          const resultGrid = buildWordSearch(palabras);
          if (resultGrid.placedWords.length < 4) {
            console.warn(`[Pupiletras] Marcando para eliminar por tener menos de 4 palabras colocadas: ${resultGrid.placedWords.length}`);
            indicesADescartar.add(idx);
          } else {
            desafio.sopa_de_letras = resultGrid.grid;
            desafio.grid = resultGrid.grid;
            desafio.sopa = resultGrid.grid;
            desafio.grid_size = resultGrid.size;
            desafio.palabras = resultGrid.placedWords;

            if (desafio.instruccion) {
              desafio.instruccion = desafio.instruccion.replace(
                /\b(una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+palabras\b/gi,
                `${resultGrid.placedWords.length} palabras`
              );
            }
          }
        }

        if (desafio.tipo === 'ordenar_parrafos') {
          try {
            const fragmentos = desafio.fragmentos ?? desafio.oraciones ?? desafio.parrafos ?? desafio.items ?? [];
            const N = Array.isArray(fragmentos) ? fragmentos.length : 0;
            if (N > 0) {
              let orden = desafio.orden_correcto || (desafio.respuesta && Array.isArray(desafio.respuesta) ? desafio.respuesta : null);
              if (orden && Array.isArray(orden) && orden.length === N) {
                const hasDuplicates = new Set(orden).size !== N;
                const hasOutofBounds = orden.some(v => typeof v !== 'number' || v < 1 || v > N);
                if (hasDuplicates || hasOutofBounds) {
                  console.log('[DEBUG ordenar_parrafos] Duplicados o fuera de rango detectados en orden_correcto:', orden);
                  const indexed = orden.map((val, idx) => ({ val: Number(val) || 0, idx }));
                  indexed.sort((a, b) => a.val - b.val);
                  
                  const nuevoOrden = new Array(N);
                  indexed.forEach((item, seqIdx) => {
                    nuevoOrden[item.idx] = seqIdx + 1;
                  });
                  desafio.orden_correcto = nuevoOrden;
                  console.log('[DEBUG ordenar_parrafos] Reasignado orden_correcto:', nuevoOrden);
                }
              }
              
              if (Array.isArray(fragmentos) && fragmentos[0] && typeof fragmentos[0] === 'object') {
                const posicionesOriginales = fragmentos.map((f: any) => {
                  if (!f) return 0;
                  const val = f.orden ?? f.posicion_correcta ?? f.posicion ?? f.respuesta ?? 0;
                  return Number(val) || 0;
                });
                
                const hasDuplicates = new Set(posicionesOriginales).size !== N;
                const hasOutofBounds = posicionesOriginales.some(v => v < 1 || v > N);
                if (hasDuplicates || hasOutofBounds) {
                  console.log('[DEBUG ordenar_parrafos] Duplicados o fuera de rango en fragmentos:', posicionesOriginales);
                  const indexed = fragmentos.map((f: any, idx: number) => {
                    if (!f) return { val: 0, idx, ref: {} };
                    const val = f.orden ?? f.posicion_correcta ?? f.posicion ?? f.respuesta ?? 0;
                    return { val: Number(val) || 0, idx, ref: f };
                  });
                  indexed.sort((a, b) => a.val - b.val);
                  
                  indexed.forEach((item, seqIdx) => {
                    const val = seqIdx + 1;
                    if (item.ref && typeof item.ref === 'object') {
                      if (item.ref.orden !== undefined) item.ref.orden = val;
                      if (item.ref.posicion_correcta !== undefined) item.ref.posicion_correcta = val;
                      if (item.ref.posicion !== undefined) item.ref.posicion = val;
                      if (item.ref.respuesta !== undefined) item.ref.respuesta = val;
                    }
                  });
                }
              }

              // Sincronizar con pauta_docente
              if (contenidoJson.pauta_docente && Array.isArray(contenidoJson.pauta_docente.respuestas_desafios)) {
                const ansObj = contenidoJson.pauta_docente.respuestas_desafios[idx];
                if (ansObj && typeof ansObj === 'object') {
                  if (Array.isArray(ansObj)) {
                    contenidoJson.pauta_docente.respuestas_desafios[idx] = desafio.orden_correcto;
                  } else {
                    ansObj.orden_correcto = desafio.orden_correcto;
                  }
                }
              }
            }
          } catch (ordenarErr) {
            console.error('[ordenar_parrafos] Error en validación, se omite corrección:', ordenarErr);
          }
        }
      });

      // Si Claude generó la actividad adicional dentro de desafios o en otra clave, la rescatamos
      
      // Caso 1: preguntas_capciosas
      if (!contenidoJson.actividad_adicional || !contenidoJson.actividad_adicional.tipo || contenidoJson.actividad_adicional.tipo !== 'preguntas_capciosas') {
        const idxCapciosas = contenidoJson.desafios?.findIndex((d: any) => {
          const t = (d.tipo ?? '').toLowerCase().replace(/[_\s-]/g, '');
          return t.includes('capciosa');
        }) ?? -1;
        if (idxCapciosas >= 0) {
          contenidoJson.actividad_adicional = contenidoJson.desafios[idxCapciosas];
          contenidoJson.actividad_adicional.tipo = 'preguntas_capciosas';
          contenidoJson.desafios.splice(idxCapciosas, 1);
          if (contenidoJson.pauta_docente && Array.isArray(contenidoJson.pauta_docente.respuestas_desafios)) {
            contenidoJson.pauta_docente.respuestas_desafios.splice(idxCapciosas, 1);
          }
          console.log('[RESCATE] preguntas_capciosas movido desde desafios a actividad_adicional');
        }
      }

      // Rescate simple y seguro de codigo_secreto
      try {
        if (!contenidoJson.actividad_adicional?.tipo) {
          const idxSecreto = (contenidoJson.desafios ?? []).findIndex((d: any) => {
            try {
              const t = String(d?.tipo ?? '').toLowerCase().replace(/[_\s]/g, '')
              return t.includes('codigo') || t.includes('secreto')
            } catch { return false }
          })
          if (idxSecreto >= 0) {
            contenidoJson.actividad_adicional = {
              ...contenidoJson.desafios[idxSecreto],
              tipo: 'codigo_secreto'
            }
            contenidoJson.desafios.splice(idxSecreto, 1)
            if (contenidoJson.pauta_docente && Array.isArray(contenidoJson.pauta_docente.respuestas_desafios)) {
              contenidoJson.pauta_docente.respuestas_desafios.splice(idxSecreto, 1);
            }
            console.log('[RESCATE] codigo_secreto movido desde desafios a actividad_adicional')
          }
        }
      } catch (rescateError) {
        console.error('[route.ts] Error en rescate codigo_secreto:', rescateError)
        // No hacer nada más — seguir sin actividad adicional
      }

      // Validación de coherencia de mensaje vs clave en codigo_secreto
      try {
        const act = contenidoJson.actividad_adicional;
        const actType = (act?.tipo ?? '').toLowerCase().replace(/[_\s-]/g, '').replace('ó', 'o');
        if (act && (actType === 'codigosecreto' || actType === 'secreto' || actType === 'codigo')) {
          const mensajeNormalizado = String(act.mensaje || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[^A-Z]/g, '');
          const clave = act.clave;
          if (clave && typeof clave === 'object') {
            const letrasClave = new Set(Object.keys(clave).map(k => k.toUpperCase()));
            
            let todasValidas = true;
            for (let i = 0; i < mensajeNormalizado.length; i++) {
              const letra = mensajeNormalizado[i];
              if (!letrasClave.has(letra)) {
                todasValidas = false;
                break;
              }
            }
            
            if (!todasValidas) {
              console.warn('[codigo_secreto] mensaje contiene letras fuera de la clave, se descarta');
              contenidoJson.actividad_adicional = null;
            }
          }
        }
      } catch (codigoErr) {
        console.error('[codigo_secreto] Error en validación de mensaje vs clave, se omite:', codigoErr);
      }

      // Filtrar desafíos y respuestas_desafios correspondientes
      if (indicesADescartar.size > 0) {
        contenidoJson.desafios = contenidoJson.desafios.filter((_: any, idx: number) => !indicesADescartar.has(idx));
        if (contenidoJson.pauta_docente && Array.isArray(contenidoJson.pauta_docente.respuestas_desafios)) {
          contenidoJson.pauta_docente.respuestas_desafios = contenidoJson.pauta_docente.respuestas_desafios.filter((_: any, idx: number) => !indicesADescartar.has(idx));
        }
      }

      // Eliminar desafíos vacíos en el propio array desafíos
      contenidoJson.desafios = contenidoJson.desafios.filter((d: any) => {
        if (!d) return false;
        return d.tipo && d.tipo !== '';
      });

      // Eliminar de respuestas_desafios cualquier entrada con tipo vacío/null
      if (contenidoJson.pauta_docente && Array.isArray(contenidoJson.pauta_docente.respuestas_desafios)) {
        contenidoJson.pauta_docente.respuestas_desafios = contenidoJson.pauta_docente.respuestas_desafios.filter((ans: any) => {
          if (ans === null || ans === undefined) return false;
          if (typeof ans === 'object') {
            if ('tipo' in ans && (ans.tipo === null || ans.tipo === undefined || ans.tipo === '')) {
              return false;
            }
          }
          return true;
        });
      }

      // 2. Procesar anagramas
      contenidoJson.desafios.forEach((desafio: any) => {
        if (desafio.tipo === 'anagramas' && Array.isArray(desafio.items)) {
          desafio.items.forEach((item: any) => {
            const palabraReal = (item.correcta || item.palabra || '').trim();
            if (palabraReal) {
              const desordenada = shuffleLetras(palabraReal);
              item.desordenada = desordenada;
              item.anagrama = desordenada;
              item.correcta = palabraReal;
              item.palabra = palabraReal;
            }
          });
        }
      });
    }

    // Generar imagen con OpenAI si incluir_imagenes es true
    if (incluir_imagenes) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const rawPrompt = contenidoJson?.texto_lectura?.imagen_prompt || `Escena educativa sobre ${tema_label || oa_code}`;
        const premiumPrompt = `${rawPrompt}. Simple educational line art, black and white sketch, flat vector style, no colors, no shading, minimal line drawing, coloring page style, suitable for black and white school printout.`;

        console.log(`[guias-image-generator] Generating image with prompt: ${premiumPrompt}`);
        const imageResult = await openai.images.generate({
          model: 'gpt-image-2',
          prompt: premiumPrompt,
          size: '1024x1024',
          quality: 'medium',
        } as any);

        const b64 = (imageResult.data?.[0] as any)?.b64_json as string | undefined;
        const imageUrl = (imageResult.data?.[0] as any)?.url as string | undefined;

        let imageBuffer: Buffer;
        if (b64) {
          imageBuffer = Buffer.from(b64, 'base64');
        } else if (imageUrl) {
          const imageFetchRes = await fetch(imageUrl);
          if (imageFetchRes.ok) {
            const arrayBuffer = await imageFetchRes.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          } else {
            throw new Error(`Failed to fetch image from OpenAI URL: ${imageFetchRes.statusText}`);
          }
        } else {
          throw new Error('No image returned from OpenAI');
        }

        const timestamp = Date.now();
        const storagePath = `${userId}/${timestamp}-guia-image.png`;

        const { error: uploadError } = await supabase.storage
          .from('recursos-visuales')
          .upload(storagePath, imageBuffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('recursos-visuales')
            .getPublicUrl(storagePath);
          const publicUrl = publicUrlData?.publicUrl ?? null;
          if (publicUrl) {
            if (contenidoJson.texto_lectura) {
              contenidoJson.texto_lectura.imagen_url = publicUrl;
            }
          }
        }
      } catch (imgErr) {
        console.error('[guias-image-generator] Image generation failed:', imgErr);
      }
    }
    // ── Guardar en DB ─────────────────────────────────────────────────────────
    console.log('[DEBUG_GUIAS_INSERT] Inserting object:', {
      user_id:        userId,
      nivel,
      eje,
      oa_codes:       [oa_code],
      formato,
      tema_narrativo: formato === 'narrativa' ? (tema === 'custom' ? tema_label_custom || tema : tema) : null,
      rti_nivel,
      titulo:         (contenidoJson.titulo as string | null) ?? null,
      templateId
    });

    const { data: record, error: dbError } = await supabase
      .from('guias')
      .insert({
        user_id:        userId,
        nivel,
        eje,
        oa_codes:       [oa_code],
        formato,
        tema_narrativo: formato === 'narrativa' ? (tema === 'custom' ? tema_label_custom || tema : tema) : null,
        rti_nivel,
        titulo:         (contenidoJson.titulo as string | null) ?? null,
        contenido_json: contenidoJson,
      })
      .select('id, titulo, nivel, eje, formato, tema_narrativo, rti_nivel, contenido_json, created_at')
      .single();

    if (dbError) {
      console.error('[guias] DB insert error:', dbError);
      return NextResponse.json({ error: 'Error al guardar la guía.' }, { status: 500 });
    }

    // ── Incrementar contador ──────────────────────────────────────────────────
    await incrementCounter(supabase, userId, 'guides_generated');

    return NextResponse.json(record, { status: 201 });

  } catch (postError) {
    console.error('[route.ts] Error en post-procesamiento:', postError);
    // Retornar el JSON crudo sin procesar si falla el post-proceso
    try {
      const contenidoJsonRaw = JSON.parse(sanitizeJson(rawText));
      
      // Intentar guardar en DB incluso si falló el post-procesamiento
      try {
        const { data: record, error: dbError } = await supabase
          .from('guias')
          .insert({
            user_id:        userId,
            nivel,
            eje,
            oa_codes:       [oa_code],
            formato,
            tema_narrativo: formato === 'narrativa' ? (tema === 'custom' ? tema_label_custom || tema : tema) : null,
            rti_nivel,
            titulo:         (contenidoJsonRaw.titulo as string | null) ?? null,
            contenido_json: contenidoJsonRaw,
          })
          .select('id, titulo, nivel, eje, formato, tema_narrativo, rti_nivel, contenido_json, created_at')
          .single();

        if (!dbError && record) {
          await incrementCounter(supabase, userId, 'guides_generated');
          return NextResponse.json(record, { status: 201 });
        }
      } catch (dbErr) {
        console.error('[route.ts] Falló el guardado del JSON crudo:', dbErr);
      }
      
      return NextResponse.json(contenidoJsonRaw);
    } catch {
      return NextResponse.json({ error: 'Error de parseo' }, { status: 500 });
    }
  }
}
