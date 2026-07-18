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
  "nombre_caso": "Nombre descriptivo y atractivo del caso",
  "historia": "Historia del misterio. Debe ser un relato breve, inmersivo y descriptivo de entre 100 y 150 palabras que contextualice el enigma basándose en los textos/temas provistos.",
  "mision": "Explicación breve del objetivo de la investigación para el alumno.",
  "pistas": [
    "Pista 1: Un hecho, diálogo o detalle descriptivo deducido del texto.",
    "Pista 2: Un hecho o detalle adicional del texto.",
    "Pista 3: Una pista final que ayude a conectar los puntos clave."
  ],
  "preguntas": [
    "Pregunta de comprensión 1",
    "Pregunta de comprensión 2",
    "Pregunta de comprensión 3",
    "Pregunta de comprensión 4",
    "Pregunta de comprensión 5"
  ],
  "evidencia": "Descripción detallada del elemento físico, carta, registro o prueba clave que se encuentra al final de la investigación.",
  "ticket": [
    "Pregunta metacognitiva 1",
    "Pregunta metacognitiva 2"
  ],
  "solucion": {
    "pista1": "Explicación de la pista 1 para el docente.",
    "pista2": "Explicación de la pista 2.",
    "pista3": "Explicación de la pista 3.",
    "preguntas": "Respuestas esperadas de las 5 preguntas.",
    "evidencia_final": "Conclusión y solución definitiva del caso."
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
  "nombre_caso": "Título del misterio (ej: El Secreto de la Mansión del Sauce)",
  "historia": "Contexto narrativo del caso, 150 palabras máximo, basado en el texto/OA.",
  "personajes": [
    { "nombre": "Nombre del Sospechoso 1", "descripcion": "Breve descripción", "motivacion": "Por qué podría ser culpable", "habitacion_inicial": "Habitación de inicio" },
    { "nombre": "Nombre del Sospechoso 2", "descripcion": "Breve descripción", "motivacion": "Por qué podría ser culpable", "habitacion_inicial": "Habitación de inicio" },
    { "nombre": "Nombre del Sospechoso 3", "descripcion": "Breve descripción", "motivacion": "Por qué podría ser culpable", "habitacion_inicial": "Habitación de inicio" },
    { "nombre": "Nombre del Sospechoso 4", "descripcion": "Breve descripción", "motivacion": "Por qué podría ser culpable", "habitacion_inicial": "Habitación de inicio" }
  ],
  "evidencias": [
    { "nombre": "Nombre de la evidencia 1", "descripcion": "Descripción corta", "habitacion": "Habitación donde se ubica", "relevancia_pedagogica": "Por qué se relaciona con el texto/OA" },
    { "nombre": "Nombre de la evidencia 2", "descripcion": "Descripción corta", "habitacion": "Habitación donde se ubica", "relevancia_pedagogica": "Por qué se relaciona con el texto/OA" },
    { "nombre": "Nombre de la evidencia 3", "descripcion": "Descripción corta", "habitacion": "Habitación donde se ubica", "relevancia_pedagogica": "Por qué se relaciona con el texto/OA" },
    { "nombre": "Nombre de la evidencia 4", "descripcion": "Descripción corta", "habitacion": "Habitación donde se ubica", "relevancia_pedagogica": "Por qué se relaciona con el texto/OA" },
    { "nombre": "Nombre de la evidencia 5", "descripcion": "Descripción corta", "habitacion": "Habitación donde se ubica", "relevancia_pedagogica": "Por qué se relaciona con el texto/OA" },
    { "nombre": "Nombre de la evidencia 6", "descripcion": "Descripción corta", "habitacion": "Habitación donde se ubica", "relevancia_pedagogica": "Por qué se relaciona con el texto/OA" }
  ],
  "distribucion_habitaciones": [
    "Biblioteca", "Salón", "Comedor", "Jardín", "Cocina", "Bodega"
  ],
  "solucion": {
    "culpable": "Nombre del sospechoso culpable",
    "habitacion": "Nombre de la habitación",
    "evidencia": "Nombre del objeto evidencia",
    "explicacion_docente": "Explicación pedagógica detallada de la resolución del misterio."
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

  return `Eres un diseñador de juegos pedagógicos para el sistema escolar chileno (MINEDUC) y Didakta.
Estás generando un juego de tipo "${motorId}".
Recibirás un motor de juego con estructura fija. Tu único trabajo es completar los campos de contenido indicados. NO inventes secciones nuevas. NO modifiques la estructura. Solo completa el contenido pedagógico de cada campo.

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

  const userPrompt = `
DATOS DE CONFIGURACIÓN DEL JUEGO:
- Motor de Juego: ${motor}
- Tema del Juego: ${effectiveTema}
- Curso / Nivel: ${nivel}
- OAs seleccionados: ${oa_codes.join(', ')}
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
