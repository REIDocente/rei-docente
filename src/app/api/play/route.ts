import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { checkTrialLimit, incrementCounter } from '@/lib/trialGuard';

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

function buildPlaySystemPrompt(motorId: string): string {
  let schemaDescription = '';

  if (motorId === 'detective') {
    schemaDescription = `{
  "tipo_fuente": "planificacion | lectura_domiciliaria | texto | contenido_curricular",
  "nombre_caso": "Titulo atractivo del expediente (max 8 palabras, sin spoilers del desenlace)",
  "objetivo_investigacion": "Lo que el equipo debe descubrir o demostrar al final (1-2 oraciones).",
  "contexto_narrativo": "Historia del misterio en 120-150 palabras. Inmersiva, basada exclusivamente en el material del docente.",
  "nota_metodologica": "Una oracion aclarando si las pistas son citas textuales, parafrasis o recreaciones pedagogicas.",
  "estaciones": [
    {
      "numero": 1,
      "nombre": "Nombre de la estacion (max 5 palabras, sin emojis)",
      "pista": {
        "tipo_evidencia": "cita_textual | parafrasis | recreacion_pedagogica",
        "fuente": { "obra": "...", "autor": "...", "capitulo": "...", "pagina": "...", "ubicacion": "..." },
        "contenido": "Texto de la pista. SIN comillas si es parafrasis o recreacion. CON comillas y fuente verificable si es cita_textual."
      },
      "desafio": "Pregunta de analisis vinculada a uno o mas OA. 2-3 oraciones. Nivel comprension o analisis, no solo memoria.",
      "oa_vinculado": "Codigo del OA principal que se trabaja en esta estacion (ej: OA 3)",
      "codigo_letra": "Una letra mayuscula unica que los equipos desbloquean al resolver el desafio"
    },
    { "numero": 2, "nombre": "...", "pista": { "tipo_evidencia": "...", "fuente": {}, "contenido": "..." }, "desafio": "...", "oa_vinculado": "...", "codigo_letra": "..." },
    { "numero": 3, "nombre": "...", "pista": { "tipo_evidencia": "...", "fuente": {}, "contenido": "..." }, "desafio": "...", "oa_vinculado": "...", "codigo_letra": "..." },
    { "numero": 4, "nombre": "...", "pista": { "tipo_evidencia": "...", "fuente": {}, "contenido": "..." }, "desafio": "...", "oa_vinculado": "...", "codigo_letra": "..." },
    { "numero": 5, "nombre": "...", "pista": { "tipo_evidencia": "...", "fuente": {}, "contenido": "..." }, "desafio": "...", "oa_vinculado": "...", "codigo_letra": "..." },
    { "numero": 6, "nombre": "...", "pista": { "tipo_evidencia": "...", "fuente": {}, "contenido": "..." }, "desafio": "...", "oa_vinculado": "...", "codigo_letra": "..." }
  ],
  "codigo_final": "Palabra o codigo de 6 letras formado con los codigo_letra de las 6 estaciones en orden",
  "expediente_final": {
    "instruccion": "Instruccion para construir el informe final del equipo (1-2 oraciones).",
    "hipotesis_guia": "Enunciado guia: que hipotesis debe plantear el equipo sobre el tema central.",
    "fundamento_guia": "Enunciado guia: que tipo de evidencia o episodio del material deben citar.",
    "conclusion_guia": "Enunciado guia: como conectar la hipotesis con los temas del material."
  },
  "ticket": [
    "Pregunta metacognitiva 1 (proceso del equipo o estrategia usada)",
    "Pregunta metacognitiva 2 (conexion con el material o aprendizaje personal)"
  ],
  "objetivos_aprendizaje": [
    { "codigo": "OA X", "descripcion": "Descripcion completa del OA segun curriculo MINEDUC para ese nivel y asignatura.", "origen": "planificacion | seleccion_docente | sugerido_ia" }
  ],
  "solucion": {
    "respuestas_estaciones": [
      { "estacion": 1, "respuesta_esperada": "...", "criterio_aceptacion": "Que elementos debe incluir para aceptarla como valida.", "codigo_letra": "..." },
      { "estacion": 2, "respuesta_esperada": "...", "criterio_aceptacion": "...", "codigo_letra": "..." },
      { "estacion": 3, "respuesta_esperada": "...", "criterio_aceptacion": "...", "codigo_letra": "..." },
      { "estacion": 4, "respuesta_esperada": "...", "criterio_aceptacion": "...", "codigo_letra": "..." },
      { "estacion": 5, "respuesta_esperada": "...", "criterio_aceptacion": "...", "codigo_letra": "..." },
      { "estacion": 6, "respuesta_esperada": "...", "criterio_aceptacion": "...", "codigo_letra": "..." }
    ],
    "codigo_final_verificado": "Confirma la palabra construida con las 6 letras en orden",
    "hipotesis_central": "La hipotesis mas solida que los equipos deberian construir",
    "hipotesis_alternativas": "Otras hipotesis validas que el docente debe aceptar si estan bien fundamentadas",
    "explicacion_pedagogica": "Como este expediente trabaja los OA seleccionados (2-3 oraciones)",
    "nota_responsabilidad": "Si el material involucra actos daninos: la responsabilidad recae en el sujeto; no en factores externos ni en una entidad abstracta como 'la mente'.",
    "rubrica": {
      "nivel3": "Logrado: hipotesis clara con dos fundamentos del material y conclusion coherente con los OA",
      "nivel2": "En proceso: hipotesis con un fundamento o conclusion vaga, sin vinculacion explicita a OA",
      "nivel1": "Inicial: sin hipotesis clara, sin fundamentos del material o sin relacion con el contenido"
    }
  }
}`;
  } else if (motorId === 'escape_room') {
    schemaDescription = `{
  "mision": "Historia y contexto narrativo de la misión de escape en unas 100 palabras. Explica por qué están encerrados y qué necesitan para salir.",
  "prueba1": "Desafío pedagógico 1 que entrega el primer código numérico o palabra clave.",
  "clave1": "Clave o respuesta correcta de la prueba 1 (ej: 42 o LAZOS).",
  "prueba2": "Desafío pedagógico 2 que entrega el segundo código.",
  "clave2": "Clave correcta de la prueba 2.",
  "prueba3": "Desafío pedagógico 3 que entrega el código de salida final.",
  "clave_final": "Clave o código de desbloqueo final.",
  "ticket": "Pregunta de reflexión final del alumno para consolidar el aprendizaje.",
  "solucion": "Explicación docente detallada de las 3 pruebas y cómo obtener sus códigos."
}`;
  } else if (motorId === 'bingo') {
    schemaDescription = `{
  "conceptos": [
    "Concepto 1", "Concepto 2", "Concepto 3", "Concepto 4",
    "Concepto 5", "Concepto 6", "Concepto 7", "Concepto 8",
    "Concepto 9", "Concepto 10", "Concepto 11", "Concepto 12",
    "Concepto 13", "Concepto 14", "Concepto 15", "Concepto 16",
    "Concepto 17", "Concepto 18", "Concepto 19", "Concepto 20",
    "Concepto 21", "Concepto 22", "Concepto 23", "Concepto 24"
  ],
  "definiciones": [
    { "concepto": "Concepto 1", "definicion": "Definición del Concepto 1..." },
    { "concepto": "Concepto 2", "definicion": "Definición del Concepto 2..." },
    ... (genera definiciones cortas y precisas para al menos 16 conceptos)
  ],
  "instrucciones": "Reglas del juego para los alumnos."
}`;
  } else if (motorId === 'trivia') {
    schemaDescription = `{
  "instrucciones": "Reglas de cómo se juega la trivia en equipos.",
  "preguntas": [
    "Pregunta de trivia 1",
    ... (exactamente 20 preguntas)
  ],
  "respuestas": [
    "Respuesta corta de la pregunta 1",
    ... (exactamente 20 respuestas correspondientes)
  ],
  "categorias": [
    "Categoría de la pregunta 1",
    ... (exactamente 20 categorías, ej: Vocabulario, Personajes, Análisis, Contexto, etc.)
  ]
}`;
  } else if (motorId === 'cartas') {
    schemaDescription = `{
  "reglas": "Reglas del juego detalladas para jugar en parejas o equipos con el mazo.",
  "cartas": [
    {
      "nombre": "Nombre del personaje, concepto o fragmento 1",
      "atributos": "Fuerza: X | Sabiduría: Y | Retórica: Z",
      "descripcion": "Una cita del texto o una habilidad especial relacionada con su rol pedagógico."
    },
    ... (exactamente 16 cartas)
  ]
}`;
  } else if (motorId === 'memoria') {
    schemaDescription = `{
  "instrucciones": "Instrucciones de cómo jugar al memorice en parejas o equipos.",
  "pares": [
    { "concepto": "Concepto 1", "definicion": "Definición o par relacionado del Concepto 1" },
    { "concepto": "Concepto 2", "definicion": "Definición o par relacionado del Concepto 2" },
    ... (exactamente 12 pares de tarjetas de memoria)
  ]
}`;
  } else if (motorId === 'clue') {
    schemaDescription = `{
  "tipo_misterio": "Clasifica el tipo de misterio segun el contenido. Valores posibles: personaje | causa | conflicto | interpretacion | concepto | postura | problema. Elige el que mejor se ajuste al material del docente.",
  "tipo_fuente": "Clasifica la fuente del material. Valores posibles: planificacion | lectura_domiciliaria | texto | contenido_curricular.",
  "nombre_caso": "Titulo del misterio derivado del contenido del docente (max 8 palabras, sin spoilers).",
  "historia": "Contexto narrativo del caso en 120-150 palabras. Presenta el misterio de forma inmersiva, basandote EXCLUSIVAMENTE en el material proporcionado. El misterio puede ser: identificar un personaje clave, explicar una causa, interpretar un conflicto, resolver un problema, descubrir una idea central, determinar una postura o relacionar conceptos. Adapta el lenguaje del caso al tipo_misterio elegido.",
  "nota_ficcion": "Nota de 1 oracion aclarando si los sospechosos o evidencias son ficticios, inspirados en el material, o corresponden directamente al contenido. Omite esta nota si todo proviene literalmente del material.",
  "etiqueta_sospechosos": "Como se llaman los sospechosos en este caso especifico. Ejemplos: 'Personajes', 'Causas', 'Hipotesis', 'Factores', 'Autores', 'Conceptos', 'Posturas'. Elige el termino que corresponda al tipo_misterio.",
  "etiqueta_hipotesis": "Como se llama la acusacion final en este caso. Ejemplos: 'Acusacion', 'Hipotesis interpretativa', 'Hipotesis causal', 'Postura central', 'Concepto clave', 'Solucion al problema'.",
  "personajes": [
    { "nombre": "Nombre del elemento 1 (personaje, causa, concepto, etc., max 4 palabras)", "descripcion": "Descripcion breve (max 15 palabras)", "motivacion": "Por que este elemento es relevante para el misterio (max 20 palabras)", "rol_en_contenido": "Rol real en el material del docente (max 15 palabras)", "habitacion_inicial": "Nombre de una de las 6 habitaciones" },
    { "nombre": "Elemento 2", "descripcion": "Descripcion breve", "motivacion": "Relevancia para el misterio", "rol_en_contenido": "Rol en el material", "habitacion_inicial": "Nombre de habitacion" },
    { "nombre": "Elemento 3", "descripcion": "Descripcion breve", "motivacion": "Relevancia para el misterio", "rol_en_contenido": "Rol en el material", "habitacion_inicial": "Nombre de habitacion" },
    { "nombre": "Elemento 4", "descripcion": "Descripcion breve", "motivacion": "Relevancia para el misterio", "rol_en_contenido": "Rol en el material", "habitacion_inicial": "Nombre de habitacion" }
  ],
  "evidencias": [
    { "nombre": "Nombre evidencia 1 (max 4 palabras)", "descripcion": "Descripcion corta (max 15 palabras)", "habitacion": "Nombre de habitacion", "relevancia_pedagogica": "Como se vincula con los OA seleccionados (max 20 palabras)" },
    { "nombre": "Evidencia 2", "descripcion": "Descripcion corta", "habitacion": "Nombre de habitacion", "relevancia_pedagogica": "Vinculo con OA" },
    { "nombre": "Evidencia 3", "descripcion": "Descripcion corta", "habitacion": "Nombre de habitacion", "relevancia_pedagogica": "Vinculo con OA" },
    { "nombre": "Evidencia 4", "descripcion": "Descripcion corta", "habitacion": "Nombre de habitacion", "relevancia_pedagogica": "Vinculo con OA" },
    { "nombre": "Evidencia 5", "descripcion": "Descripcion corta", "habitacion": "Nombre de habitacion", "relevancia_pedagogica": "Vinculo con OA" },
    { "nombre": "Evidencia 6", "descripcion": "Descripcion corta", "habitacion": "Nombre de habitacion", "relevancia_pedagogica": "Vinculo con OA" }
  ],
  "habitaciones": [
    { "nombre": "Nombre habitacion 1 (puede ser lugar de la obra, espacio tematico o concepto espacial)", "desafio": "Pregunta de analisis en 2-3 oraciones vinculada a los OA seleccionados. El equipo debe responder ANTES de plantear su hipotesis en esta habitacion. Debe ser desafiante y requerir comprension del material.", "pista": "Pista que el equipo recibe al responder correctamente (1 oracion)." },
    { "nombre": "Habitacion 2", "desafio": "Desafio diferente vinculado a los OA", "pista": "Pista correspondiente" },
    { "nombre": "Habitacion 3", "desafio": "Desafio diferente", "pista": "Pista correspondiente" },
    { "nombre": "Habitacion 4", "desafio": "Desafio diferente", "pista": "Pista correspondiente" },
    { "nombre": "Habitacion 5", "desafio": "Desafio diferente", "pista": "Pista correspondiente" },
    { "nombre": "Habitacion 6", "desafio": "Desafio diferente", "pista": "Pista correspondiente" }
  ],
  "distribucion_habitaciones": ["Habitacion 1", "Habitacion 2", "Habitacion 3", "Habitacion 4", "Habitacion 5", "Habitacion 6"],
  "objetivos_aprendizaje": [
    {
      "codigo": "OA X",
      "descripcion": "Descripcion completa del objetivo de aprendizaje tal como aparece en el material o en el curriculo chileno.",
      "origen": "planificacion | seleccion_docente | sugerido_ia"
    }
  ],
  "solucion": {
    "hipotesis_central": "El elemento principal (personaje, causa, concepto, etc.) seleccionado como respuesta pedagogica central al misterio.",
    "habitacion": "Nombre de la habitacion donde ocurre el momento clave.",
    "evidencia": "Nombre de la evidencia que confirma la hipotesis central.",
    "justificacion_hipotesis": "Por que esta hipotesis es la mas solida segun el material del docente (2-3 oraciones). Sin mencionar obras, personajes o datos no presentes en el contexto.",
    "hipotesis_alternativas": "Otras respuestas que los alumnos podrian formular y por que tambien son pedagogicamente validas.",
    "explicacion_docente": "Explicacion pedagogica: (1) Como la hipotesis central se justifica segun los OA seleccionados. (2) Que habilidades evidencia el alumno al fundamentar con 2 elementos del material. (3) Criterio de aceptacion de respuestas alternativas.",
    "rubrica": {
      "nivel3": "Logrado: el alumno formula una hipotesis clara y pertinente al tipo_misterio, la fundamenta con 2 elementos concretos del material y explica la relacion entre ambos.",
      "nivel2": "En proceso: el alumno formula una hipotesis plausible pero la fundamentacion es vaga, incompleta o menciona solo 1 elemento del material.",
      "nivel1": "Inicial: el alumno propone un elemento pero no lo vincula con el material ni justifica su relacion con el misterio."
    }
  }
}`;
  } else if (motorId === 'serpiente_escaleras') {
    schemaDescription = `{
  "preguntas": [
    "Pregunta pedagógica 1", "Pregunta pedagógica 2", "Pregunta pedagógica 3", "Pregunta pedagógica 4",
    "Pregunta pedagógica 5", "Pregunta pedagógica 6", "Pregunta pedagógica 7", "Pregunta pedagógica 8",
    "Pregunta pedagógica 9", "Pregunta pedagógica 10", "Pregunta pedagógica 11", "Pregunta pedagógica 12",
    "Pregunta pedagógica 13", "Pregunta pedagógica 14", "Pregunta pedagógica 15", "Pregunta pedagógica 16",
    "Pregunta pedagógica 17", "Pregunta pedagógica 18", "Pregunta pedagógica 19", "Pregunta pedagógica 20"
  ],
  "respuestas": [
    "Respuesta corta 1", "Respuesta corta 2", "Respuesta corta 3", "Respuesta corta 4",
    "Respuesta corta 5", "Respuesta corta 6", "Respuesta corta 7", "Respuesta corta 8",
    "Respuesta corta 9", "Respuesta corta 10", "Respuesta corta 11", "Respuesta corta 12",
    "Respuesta corta 13", "Respuesta corta 14", "Respuesta corta 15", "Respuesta corta 16",
    "Respuesta corta 17", "Respuesta corta 18", "Respuesta corta 19", "Respuesta corta 20"
  ],
  "casillas_especiales": [
    { "casilla": 4, "tipo": "escalera", "destino": 14 },
    { "casilla": 20, "tipo": "escalera", "destino": 38 },
    { "casilla": 45, "tipo": "escalera", "destino": 60 },
    { "casilla": 17, "tipo": "serpiente", "destino": 7 },
    { "casilla": 35, "tipo": "serpiente", "destino": 15 },
    { "casilla": 55, "tipo": "serpiente", "destino": 30 }
  ]
}`;
  } else if (motorId === 'ludo') {
    schemaDescription = `{
  "preguntas_faciles": [
    "Pregunta fácil 1", "Pregunta fácil 2", "Pregunta fácil 3", "Pregunta fácil 4",
    "Pregunta fácil 5", "Pregunta fácil 6", "Pregunta fácil 7", "Pregunta fácil 8"
  ],
  "preguntas_medias": [
    "Pregunta media 1", "Pregunta media 2", "Pregunta media 3", "Pregunta media 4",
    "Pregunta media 5", "Pregunta media 6", "Pregunta media 7", "Pregunta media 8"
  ],
  "preguntas_dificiles": [
    "Pregunta difícil 1", "Pregunta difícil 2", "Pregunta difícil 3", "Pregunta difícil 4",
    "Pregunta difícil 5", "Pregunta difícil 6", "Pregunta difícil 7", "Pregunta difícil 8"
  ],
  "respuestas": {
    "faciles": ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"],
    "medias": ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"],
    "dificiles": ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"]
  }
}`;
  }

  const detectiveNote = motorId === 'detective' ? `
REGLAS OBLIGATORIAS PARA EL MOTOR DETECTIVE REI (plantilla fija, contenido dinamico):

ESTRUCTURA FIJA: El expediente tiene siempre: portada, mapa de estaciones, reglas, 6 estaciones, expediente final, ticket de salida y guia docente. NO modifiques la estructura.

CONTENIDO DINAMICO: Todo el contenido proviene EXCLUSIVAMENTE del material entregado por el docente. No inventes personajes, datos, fragmentos ni hechos que no esten en ese material.

ESTACIONES (OBLIGATORIO — genera exactamente 6):
- Cada estacion tiene nombre (max 5 palabras, sin emojis), pista, desafio, oa_vinculado y codigo_letra.
- Los 6 codigos_letra deben formar el codigo_final (palabra o acronimo con significado relacionado al contenido).
- Cada desafio exige comprension, analisis o interpretacion del material. No preguntas de memoria simple.

SISTEMA DE CITAS (CRITICO):
- "cita_textual": SOLO si el texto completo esta disponible en el material de entrada. DEBE incluir fuente con ubicacion verificable (capitulo, pagina o equivalente). Si no hay fuente verificable, convierte automaticamente a "parafrasis".
- "parafrasis": resumen fiel del material, sin comillas.
- "recreacion_pedagogica": elaboracion inspirada en el material, sin comillas. Debe mostrar advertencia en el PDF/Word.
- NUNCA pongas comillas en parafrasis ni recreaciones pedagogicas.
- NUNCA inventes una fuente o ubicacion.
- Si el material de entrada no contiene el texto completo: usa parafrasis o recreacion_pedagogica.

EXPEDIENTE FINAL: La hipotesis es una interpretacion pedagogica fundamentada, no una verdad absoluta. El docente debe aceptar hipotesis alternativas bien fundamentadas.

PAUTA DOCENTE:
- Si el material involucra un crimen, accion danina o decision cuestionable: la responsabilidad recae en el sujeto o agente de esa accion.
- NO afirmar que "la mente" o un factor externo fue "el verdadero responsable".
- NO usar frases como "era inevitable" o "su mente lo llevo a...".
- Si hay trastorno mental, obsesion o condicionamiento en el material: explicar que ayuda a comprender la construccion narrativa o causal, pero no justifica ni transfiere la responsabilidad del sujeto.
- La hipotesis_central debe formularse como interpretacion solida, no como verdad cerrada.

OBJETIVOS DE APRENDIZAJE (campo objetivos_aprendizaje — OBLIGATORIO):
- Revisa los "OAs entregados" en el prompt de usuario. Si hay OA codes, incluyelos con codigo + descripcion MINEDUC + origen.
- Si NO hay OA codes: SUGIERE 2-3 OA pertinentes al nivel y asignatura con origen "sugerido_ia".
- Vincula cada desafio de estacion a uno de estos OA usando el campo oa_vinculado.
- NUNCA fijes OA especificos por defecto.

PROHIBIDO: No menciones obras, personajes, autores, datos o contenidos que NO esten en el material del docente. Detective REI es una plantilla reutilizable; su contenido viene del aula, no de ejemplos externos.
` : '';

  const clueNote = motorId === 'clue' ? `
REGLAS OBLIGATORIAS PARA EL MOTOR CLUE (plantilla fija, contenido dinamico):

ESTRUCTURA FIJA: La estructura del CLUE es siempre igual: portada, tablero, 4 sospechosos, 6 evidencias, 6 habitaciones con desafios, hoja de investigacion, reglas, acusacion final y guia docente. NO la modifiques.

CONTENIDO DINAMICO: Todo el contenido proviene EXCLUSIVAMENTE del material entregado por el docente. NO inventes personajes, lugares, evidencias ni datos que no esten en ese material.

ADAPTACION SEGUN MATERIAL:
- Si el material es una novela o cuento: los sospechosos son personajes, las habitaciones son espacios de la obra, las evidencias son fragmentos u objetos simbolicos.
- Si el material es una planificacion o unidad curricular: los sospechosos son causas, conceptos, posturas o factores; las habitaciones son ejes tematicos o etapas; las evidencias son datos, ejemplos o fenomenos.
- Si el material es un texto argumentativo: los sospechosos son posturas o argumentos; las habitaciones son secciones o dimensiones del texto; las evidencias son recursos retóricos, citas o contraargumentos.
- Si el material es un contenido curricular (historia, ciencias, etc.): los sospechosos son causas, actores o conceptos; las habitaciones son periodos, contextos o categorias; las evidencias son hechos, documentos o fenomenos.

TIPO DE MISTERIO: Elige el tipo_misterio que mejor corresponda al material:
- personaje: ¿quien es el responsable o protagonista central?
- causa: ¿que factor explica mejor el fenomeno?
- conflicto: ¿que tension o contradiccion es la mas determinante?
- interpretacion: ¿que lectura del texto es mas solida?
- concepto: ¿que idea conecta mejor los elementos?
- postura: ¿que argumento o posicion se sostiene mejor?
- problema: ¿que condicion genero el problema central?

DESAFIOS PEDAGOGICOS: Cada habitacion tiene un desafio vinculado a los OA seleccionados por el docente. Los desafios deben requerir comprension, analisis o aplicacion del material, no solo memoria.

LIMITES DE TEXTO PARA TARJETAS:
- Nombre de sospechoso/elemento: max 4 palabras.
- Descripcion de sospechoso: max 15 palabras.
- Motivacion/relevancia: max 20 palabras.
- Nombre de evidencia: max 4 palabras.
- Descripcion de evidencia: max 15 palabras.

HIPOTESIS, NO VERDAD CERRADA: La solucion es una hipotesis pedagogica solida, no una verdad absoluta. El docente debe aceptar otras hipotesis bien fundamentadas. Incluye siempre hipotesis_alternativas validas.

OBJETIVOS DE APRENDIZAJE (campo objetivos_aprendizaje — OBLIGATORIO):
- Revisa los "OAs entregados" en el prompt de usuario. Si hay OA codes (ej: OA 3, OA 8), incluyelos en objetivos_aprendizaje con:
  * codigo: el codigo exacto entregado (ej: "OA 3")
  * descripcion: la descripcion completa del OA segun el curriculo MINEDUC chileno para ese nivel y asignatura
  * origen: usa el valor que se indica en "ORIGEN DE LOS OA:" del prompt de usuario
- Si NO hay OA codes en el prompt: SUGIERE 2-3 OA pertinentes al nivel y asignatura del juego, con origen "sugerido_ia"
- Todos los desafios de habitaciones, la hipotesis final y la rubrica deben construirse a partir de estos OA
- NUNCA fijes OA 3 y OA 8 por defecto. Usa solo los OA del material o sugiere los pertinentes
- El campo objetivos_aprendizaje debe siempre estar presente en el JSON de respuesta

PROHIBIDO: No menciones obras, personajes, autores, datos o contenidos que NO esten en el material del docente. El motor CLUE es una plantilla reutilizable; su contenido viene del aula, no de ejemplos externos.
` : '';

  return `Eres un diseñador de juegos pedagógicos para el sistema escolar chileno (MINEDUC) y REI Docente.
Estás generando un juego de tipo "${motorId}".
Recibirás un motor de juego con estructura fija. Tu único trabajo es completar los campos de contenido indicados. NO inventes secciones nuevas. NO modifiques la estructura. Solo completa el contenido pedagógico de cada campo.
${detectiveNote}${clueNote}
Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json).
Asegúrate de que todas las comillas dobles dentro de las cadenas estén correctamente escapadas.

Esquema JSON esperado:
${schemaDescription}`;
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'No autorizado — se requiere sesión activa' }, { status: 401 });

  const isDev = process.env.NODE_ENV === 'development';
  let supabaseUser: any = null;
  let userId = '';

  const supabase = makeSupabaseClient(token);

  if (token === 'mock-access-token' && isDev) {
    userId = '00000000-0000-0000-0000-000000000000';
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }
    supabaseUser = userData.user;
    userId = supabaseUser.id;
  }

  // ── Guard check ──
  const guard = await checkTrialLimit(supabase, userId, 'juegos_generated');
  if (guard.blocked) {
    const isActive = guard.profile?.plan_status === 'active';
    return NextResponse.json(
      {
        error: 'limite_alcanzado',
        reason: guard.reason,
        tipo: 'juegos_generated',
        limit: isActive ? 999999 : 3,
        current: guard.profile?.juegos_generated ?? 0,
        plan_status: guard.profile?.plan_status,
        renewal_date: guard.renewalDate,
      },
      { status: 403 }
    );
  }

  // ── Parse Body ──
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const {
    motor,
    fuente,
    planificacion_id,
    tema,
    nivel,
    oa_codes = [],
    duracion,
    modalidad,
    dificultad
  } = body;

  if (!motor) return NextResponse.json({ error: 'El campo "motor" es obligatorio' }, { status: 400 });
  if (!nivel) return NextResponse.json({ error: 'El campo "nivel" es obligatorio' }, { status: 400 });

  let textSourceContext = '';
  let effectiveTema = tema || 'Didáctica General';

  if (fuente === 'planificacion' && planificacion_id) {
    // Obtener planificación de Supabase
    const { data: plan, error: planErr } = await supabase
      .from('plannings')
      .select('*')
      .eq('id', planificacion_id)
      .single();

    if (!planErr && plan) {
      effectiveTema = `Planificación: Unidad ${plan.unit || ''} - Curso ${plan.grade || ''}`;
      const design = plan.content?.backward_design;
      const sequence = plan.content?.backward_design?.activities_sequence || '';
      
      textSourceContext = `
CONTEXTO DE PLANIFICACIÓN PEDAGÓGICA VINCULADA:
- Objetivo de la Sesión: ${design?.objective || plan.learning_objective || ''}
- Evidencia de Evaluación: ${design?.assessment_evidence || ''}
- Secuencia de actividades de clase:
${sequence}
`;
    }
  } else if (fuente === 'lectura_domiciliaria' && body.libro_id) {
    const { data: libro } = await supabase
      .from('biblioteca_libros')
      .select('*')
      .eq('id', body.libro_id)
      .single();

    if (libro) {
      effectiveTema = `Lectura Domiciliaria: ${libro.titulo} de ${libro.autor}`;
      textSourceContext = `
CONTEXTO DEL LIBRO DOMICILIARIO:
- Libro: ${libro.titulo} de ${libro.autor}
- Resumen: ${libro.resumen || ''}
- Personajes: ${JSON.stringify(libro.personajes || [])}
- Temas: ${(libro.temas || []).join(', ')}
- Conflictos: ${(libro.conflictos || []).join(', ')}
- Vocabulario clave: ${JSON.stringify(libro.vocabulario || [])}
`;
    }
  }

  // Determinar origen de los OA para motores con campo objetivos_aprendizaje
  const motorConOaDinamico = motor === 'clue' || motor === 'detective';
  const oaOrigen = motorConOaDinamico
    ? (fuente === 'planificacion' ? 'planificacion'
      : fuente === 'lectura_domiciliaria' ? 'seleccion_docente'
      : oa_codes.length > 0 ? 'seleccion_docente'
      : 'sugerido_ia')
    : '';

  const oaBlock = motorConOaDinamico
    ? `OAs entregados: ${oa_codes.length > 0 ? oa_codes.join(', ') : '(ninguno — sugerir OA pertinentes)'}
ORIGEN DE LOS OA: ${oaOrigen}`
    : `- OAs seleccionados: ${oa_codes.join(', ')}`;

  const userPrompt = `
DATOS DE CONFIGURACIÓN DEL JUEGO:
- Motor de Juego: ${motor}
- Tema del Juego: ${effectiveTema}
- Curso / Nivel: ${nivel}
- ${oaBlock}
- Duración de la partida: ${duracion} minutos
- Modalidad de juego: ${modalidad}
- Dificultad: ${dificultad}

${textSourceContext}

Genera el contenido pedagógico completo y detallado para el juego siguiendo las reglas y el JSON del motor "${motor}".
`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
    return NextResponse.json({ error: 'API Key de Anthropic no configurada.' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  let rawText = '';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: [
        {
          type: 'text',
          text: buildPlaySystemPrompt(motor),
          cache_control: { type: 'ephemeral' }
        }
      ] as any,
      messages: [{ role: 'user', content: userPrompt }],
    });
    rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[play] Claude generation failed:', msg);
    return NextResponse.json({ error: 'Error de Claude al generar el juego. Intente nuevamente.' }, { status: 500 });
  }

  try {
    const cleanText = sanitizeJson(rawText);
    const contentJson = JSON.parse(cleanText);

    // Guardar en la base de datos
    const recordPayload = {
      user_id: userId,
      motor,
      nivel,
      tema: effectiveTema,
      oa_codes,
      duracion: Number(duracion) || 20,
      modalidad,
      dificultad,
      contenido_json: contentJson
    };

    const { data: savedData, error: saveErr } = await supabase
      .from('juegos_rei')
      .insert(recordPayload)
      .select('*')
      .single();

    if (saveErr) {
      console.error('[play] Error saving game record to DB:', saveErr.message);
    }

    // Incrementar contador de límite
    await incrementCounter(supabase, userId, 'juegos_generated');

    const resultRecord = savedData || {
      id: 'mock-game-' + Date.now(),
      ...recordPayload,
      created_at: new Date().toISOString()
    };

    return NextResponse.json(resultRecord, { status: 201 });

  } catch (jsonErr: any) {
    console.error('[play] JSON Parse error from Claude response:', jsonErr.message);
    return NextResponse.json({
      error: 'La respuesta de la IA no pudo ser interpretada como un JSON válido.',
      raw: rawText
    }, { status: 500 });
  }
}
