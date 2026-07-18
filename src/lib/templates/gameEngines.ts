export interface GameEngine {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  ideal_para: string;
  duraciones: number[]; // en minutos
  modalidades: string[];
  dificultades: string[];
  estructura: GameSection[];
  campos_para_claude: string[];
  materiales_imprimibles: string[];
}

export interface GameSection {
  id: string;
  nombre: string;
  descripcion: string;
  es_solo_docente: boolean;
}

export const gameEngines: GameEngine[] = [
  {
    id: 'detective',
    nombre: 'Detective',
    emoji: '🕵️',
    descripcion: 'Los alumnos resuelven un caso usando pistas del texto leído.',
    ideal_para: 'Comprensión lectora e inferencia',
    duraciones: [20, 45],
    modalidades: ['parejas', 'equipos'],
    dificultades: ['básica', 'media', 'desafiante'],
    estructura: [
      { id: 'portada', nombre: 'Portada del Caso', descripcion: 'Nombre del caso, fecha, investigador', es_solo_docente: false },
      { id: 'historia', nombre: 'Historia del Misterio', descripcion: 'Contexto narrativo breve del caso (100-150 palabras)', es_solo_docente: false },
      { id: 'mision', nombre: 'Misión', descripcion: 'Objetivo del investigador', es_solo_docente: false },
      { id: 'pistas', nombre: 'Tarjetas de Pistas', descripcion: '3 pistas para recortar', es_solo_docente: false },
      { id: 'preguntas', nombre: 'Preguntas de Investigación', descripcion: '5 preguntas de comprensión', es_solo_docente: false },
      { id: 'evidencia', nombre: 'Evidencia Final', descripcion: 'Documento o elemento que cierra el caso', es_solo_docente: false },
      { id: 'ticket', nombre: 'Ticket de Salida', descripcion: '2 preguntas metacognitivas', es_solo_docente: false },
      { id: 'solucion', nombre: 'Solución del Caso', descripcion: 'Respuestas correctas para el docente', es_solo_docente: true },
    ],
    campos_para_claude: ['nombre_caso', 'historia', 'mision', 'pistas', 'preguntas', 'evidencia', 'ticket', 'solucion'],
    materiales_imprimibles: ['Hoja del caso (alumno)', 'Tarjetas de pistas (recortables)', 'Hoja de solución (docente)'],
  },
  {
    id: 'escape_room',
    nombre: 'Escape Room',
    emoji: '🔐',
    descripcion: 'Los alumnos resuelven 3 pruebas encadenadas para escapar.',
    ideal_para: 'Repaso de contenidos y cierre de unidad',
    duraciones: [20, 45],
    modalidades: ['equipos'],
    dificultades: ['básica', 'media', 'desafiante'],
    estructura: [
      { id: 'mision', nombre: 'Hoja de Misión', descripcion: 'Contexto narrativo del escape (100 palabras)', es_solo_docente: false },
      { id: 'prueba1', nombre: 'Prueba 1', descripcion: 'Primera prueba con su clave de desbloqueo', es_solo_docente: false },
      { id: 'prueba2', nombre: 'Prueba 2', descripcion: 'Segunda prueba con su clave', es_solo_docente: false },
      { id: 'prueba3', nombre: 'Prueba 3', descripcion: 'Tercera prueba con clave final', es_solo_docente: false },
      { id: 'ticket', nombre: 'Ticket de Salida', descripcion: 'Reflexión final del alumno', es_solo_docente: false },
      { id: 'solucion', nombre: 'Pauta Docente', descripcion: 'Claves de las 3 pruebas', es_solo_docente: true },
    ],
    campos_para_claude: ['mision', 'prueba1', 'clave1', 'prueba2', 'clave2', 'prueba3', 'clave_final', 'ticket', 'solucion'],
    materiales_imprimibles: ['Hoja de misión', 'Tarjetas de pruebas (recortables)', 'Pauta docente'],
  },
  {
    id: 'bingo',
    nombre: 'Bingo',
    emoji: '🎯',
    descripcion: 'Cartones con conceptos clave. El docente lee definiciones y los alumnos marcan.',
    ideal_para: 'Vocabulario y conceptos clave',
    duraciones: [10, 20],
    modalidades: ['individual', 'parejas'],
    dificultades: ['básica', 'media'],
    estructura: [
      { id: 'cartones', nombre: 'Cartones de Bingo', descripcion: '6 cartones diferentes de 4x4 con conceptos', es_solo_docente: false },
      { id: 'instrucciones', nombre: 'Instrucciones', descripcion: 'Reglas del juego para alumnos', es_solo_docente: false },
      { id: 'tarjetas_docente', nombre: 'Tarjetas de Llamada', descripcion: 'Lista de definiciones que lee el docente', es_solo_docente: true },
    ],
    campos_para_claude: ['conceptos', 'definiciones'],
    materiales_imprimibles: ['6 cartones (recortables)', 'Tarjetas de llamada (docente)'],
  },
  {
    id: 'trivia',
    nombre: 'Trivia',
    emoji: '❓',
    descripcion: 'Preguntas por categorías con sistema de puntos por equipo.',
    ideal_para: 'Repaso rápido de contenidos',
    duraciones: [10, 20, 45],
    modalidades: ['equipos'],
    dificultades: ['básica', 'media', 'desafiante'],
    estructura: [
      { id: 'instrucciones', nombre: 'Instrucciones', descripcion: 'Reglas del juego', es_solo_docente: false },
      { id: 'tarjetas', nombre: 'Tarjetas de Preguntas', descripcion: '20 tarjetas con pregunta al frente y respuesta al dorso', es_solo_docente: false },
      { id: 'tabla_puntos', nombre: 'Tabla de Puntuación', descripcion: 'Para registrar puntos por equipo', es_solo_docente: false },
      { id: 'solucion', nombre: 'Respuestas', descripcion: 'Clave de respuestas para el docente', es_solo_docente: true },
    ],
    campos_para_claude: ['preguntas', 'respuestas', 'categorias'],
    materiales_imprimibles: ['Tarjetas de preguntas (recortables)', 'Tabla de puntuación', 'Clave docente'],
  },
  {
    id: 'cartas',
    nombre: 'Cartas',
    emoji: '🃏',
    descripcion: 'Mazo de cartas con personajes, conceptos o fragmentos. Se juega como duelo o colección.',
    ideal_para: 'Análisis literario y personajes',
    duraciones: [20, 45],
    modalidades: ['parejas', 'equipos'],
    dificultades: ['básica', 'media', 'desafiante'],
    estructura: [
      { id: 'reglas', nombre: 'Reglas del Juego', descripcion: 'Instrucciones de cómo se juega el mazo', es_solo_docente: false },
      { id: 'mazo', nombre: 'Mazo de Cartas', descripcion: '16 cartas con imagen descriptiva, nombre, atributos y cita o habilidad', es_solo_docente: false },
      { id: 'tabla_puntos', nombre: 'Tabla de Puntuación', descripcion: 'Para registrar puntos', es_solo_docente: false },
    ],
    campos_para_claude: ['cartas', 'reglas'],
    materiales_imprimibles: ['16 cartas (recortables)', 'Reglas', 'Tabla de puntuación'],
  },
  {
    id: 'memoria',
    nombre: 'Memoria',
    emoji: '🧠',
    descripcion: 'Pares de tarjetas que los alumnos deben emparejar (concepto + definición o imagen + nombre).',
    ideal_para: 'Vocabulario, conceptos y personajes',
    duraciones: [10, 20],
    modalidades: ['parejas', 'equipos'],
    dificultades: ['básica', 'media'],
    estructura: [
      { id: 'instrucciones', nombre: 'Instrucciones', descripcion: 'Cómo jugar la memoria', es_solo_docente: false },
      { id: 'pares', nombre: 'Pares de Tarjetas', descripcion: '12 pares de tarjetas (concepto al frente, definición al dorso)', es_solo_docente: false },
      { id: 'solucion', nombre: 'Pauta de Pares', descripcion: 'Lista de pares correctos para el docente', es_solo_docente: true },
    ],
    campos_para_claude: ['pares'],
    materiales_imprimibles: ['24 tarjetas de memoria (recortables)', 'Pauta docente'],
  },
  {
    id: 'clue',
    nombre: 'CLUE',
    emoji: '🎲',
    descripcion: 'Juego de deducción tipo Cluedo. Los alumnos identifican al culpable, el lugar y la evidencia usando pistas del texto o del OA.',
    ideal_para: 'Lectura domiciliaria, análisis de personajes, comprensión profunda',
    duraciones: [45],
    modalidades: ['equipos', 'parejas'],
    dificultades: ['media', 'desafiante'],
    estructura: [
      { id: 'tablero', nombre: 'Tablero de la Mansión', descripcion: 'Mapa con 6 habitaciones imprimible', es_solo_docente: false },
      { id: 'personajes', nombre: 'Tarjetas de Sospechosos', descripcion: '4 personajes recortables con nombre, descripción y motivación', es_solo_docente: false },
      { id: 'evidencias', nombre: 'Tarjetas de Evidencia', descripcion: 'Objetos o pistas ubicadas en habitaciones', es_solo_docente: false },
      { id: 'hoja_investigacion', nombre: 'Hoja de Investigación', descripcion: 'Tabla para marcar sospechosos y evidencias descartadas', es_solo_docente: false },
      { id: 'reglas', nombre: 'Reglas del Juego', descripcion: 'Instrucciones de cómo se juega', es_solo_docente: false },
      { id: 'solucion', nombre: 'Sobre de Solución', descripcion: 'Culpable + lugar + evidencia. Solo docente.', es_solo_docente: true },
    ],
    campos_para_claude: ['nombre_caso', 'historia', 'personajes', 'evidencias', 'distribucion_habitaciones', 'solucion'],
    materiales_imprimibles: ['Tablero mansión (A4)', 'Tarjetas sospechosos (recortables)', 'Tarjetas de evidencia (recortables)', 'Hoja de investigación', 'Sobre de solución (docente)'],
  },
  {
    id: 'serpiente_escaleras',
    nombre: 'Serpiente y Escaleras',
    emoji: '🎯',
    descripcion: 'Tablero 8x8 pedagógico. Responde bien: subes por la escalera. Responde mal: bajas por la serpiente.',
    ideal_para: 'Repaso de contenidos, vocabulario, comprensión',
    duraciones: [20, 45],
    modalidades: ['equipos', 'parejas'],
    dificultades: ['básica', 'media', 'desafiante'],
    estructura: [
      { id: 'tablero', nombre: 'Tablero 8x8', descripcion: 'Tablero imprimible con serpientes y escaleras', es_solo_docente: false },
      { id: 'tarjetas_preguntas', nombre: 'Tarjetas de Preguntas', descripcion: '20 preguntas generadas por Claude según el OA', es_solo_docente: false },
      { id: 'reglas', nombre: 'Reglas del Juego', descripcion: 'Instrucciones de cómo se juega', es_solo_docente: false },
      { id: 'solucion', nombre: 'Clave de Respuestas', descripcion: 'Respuestas correctas para el docente', es_solo_docente: true },
    ],
    campos_para_claude: ['preguntas', 'respuestas', 'casillas_especiales'],
    materiales_imprimibles: ['Tablero 8x8 (imprimible)', 'Tarjetas de preguntas (recortables)', 'Clave docente'],
  },
  {
    id: 'ludo',
    nombre: 'Ludo',
    emoji: '🔴',
    descripcion: 'Tablero Ludo clásico de 4 equipos. Para avanzar en casillas especiales debes responder una pregunta del OA.',
    ideal_para: 'Repaso de contenidos con equipos, motivación y competencia sana',
    duraciones: [45],
    modalidades: ['equipos'],
    dificultades: ['básica', 'media'],
    estructura: [
      { id: 'tablero', nombre: 'Tablero Ludo', descripcion: 'Tablero clásico con 4 zonas de color', es_solo_docente: false },
      { id: 'tarjetas_preguntas', nombre: 'Tarjetas de Preguntas', descripcion: '24 preguntas por nivel de dificultad', es_solo_docente: false },
      { id: 'reglas', nombre: 'Reglas del Juego', descripcion: 'Reglas adaptadas con preguntas pedagógicas', es_solo_docente: false },
      { id: 'solucion', nombre: 'Clave de Respuestas', descripcion: 'Respuestas correctas para el docente', es_solo_docente: true },
    ],
    campos_para_claude: ['preguntas_faciles', 'preguntas_medias', 'preguntas_dificiles', 'respuestas'],
    materiales_imprimibles: ['Tablero Ludo (imprimible)', 'Tarjetas de preguntas (recortables)', 'Clave docente'],
  },
];
