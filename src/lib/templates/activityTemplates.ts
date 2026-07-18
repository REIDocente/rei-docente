export interface ActivityTemplate {
  tipo: string;
  nombre: string;
  estructura: string;
}

export const activityTemplates: Record<string, ActivityTemplate> = {
  palabras_intrusas: {
    tipo: 'palabras_intrusas',
    nombre: 'Palabras Intrusas',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: PALABRAS INTRUSAS]
- Conjunto de 4-6 grupos semánticos o palabras.
- En cada grupo, hay una palabra que "no pertenece" al tema o regla morfológica/semántica.
- Los estudiantes deben tachar la palabra intrusa y explicar brevemente la razón de su elección.
- [COMPLETAR palabras y justificaciones]`
  },
  crucigrama: {
    tipo: 'crucigrama',
    nombre: 'Crucigrama de Conceptos',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: CRUCIGRAMA]
- Pistas horizontales (Across) y verticales (Down) basadas en el vocabulario clave o contenidos del OA.
- Listado de 5-8 definiciones claras.
- Matriz o grilla de letras [COMPLETAR pistas y respuestas correctas]`
  },
  sopa_letras: {
    tipo: 'sopa_letras',
    nombre: 'Sopa de Letras Temática',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: SOPA DE LETRAS]
- Lista de 6-10 palabras clave ocultas en una matriz de letras (grilla de 12x12 o 15x15).
- Instrucciones de búsqueda e identificación.
- [COMPLETAR palabras a buscar y sus definiciones]`
  },
  detective: {
    tipo: 'detective',
    nombre: 'Caso de Detective / Misterio',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: DETECTIVE ESTRATÉGICO]
- Caso de misterio estructurado:
  * El enigma o crimen planteado [COMPLETAR]
  * Sospechosos y sus coartadas/testimonios [COMPLETAR]
  * Pistas textuales o lingüísticas ocultas en las lecturas [COMPLETAR]
  * Pregunta de resolución para el estudiante.`
  },
  escape_room: {
    tipo: 'escape_room',
    nombre: 'Escape Room Conceptual',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: ESCAPE ROOM]
- Desafío dividido en 3 o 4 etapas:
  * Etapa 1 (Fácil): Resolver un anagrama o definición clave para obtener el "código 1". [COMPLETAR]
  * Etapa 2 (Medio): Encontrar una contradicción en un texto para liberar el "código 2". [COMPLETAR]
  * Etapa 3 (Difícil): Redactar una postura usando técnica OREO para abrir la puerta de salida. [COMPLETAR]`
  },
  trivia: {
    tipo: 'trivia',
    nombre: 'Trivia Pedagógica / Desafío de Saberes',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: TRIVIA]
- Set de preguntas rápidas con categorías de puntos (100, 200, 300 pts) o niveles de dificultad.
- Solucionario con explicaciones didácticas inmediatas.
- [COMPLETAR preguntas, puntajes y claves]`
  },
  bingo: {
    tipo: 'bingo',
    nombre: 'Bingo de Conceptos',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: BINGO]
- Cartón de bingo virtual (matriz 3x3 o 4x4) con conceptos clave del OA.
- Listado de definiciones desordenadas que el docente lee para que el estudiante marque su cartón.
- [COMPLETAR términos del cartón y definiciones asociadas]`
  },
  ruleta: {
    tipo: 'ruleta',
    nombre: 'Ruleta Conceptual',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: RULETA]
- Ruleta de conceptos ordenados alfabéticamente (A-Z).
- Cada letra contiene una definición o pista para que el estudiante adivine la palabra correspondiente.
- [COMPLETAR definiciones por cada letra seleccionada]`
  },
  memoria: {
    tipo: 'memoria',
    nombre: 'Memorise de Conceptos',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: MEMORIA]
- Set de 8-12 tarjetas recortables para emparejar.
- Tarjetas de tipo A (Concepto/Término clave) y tarjetas de tipo B (Definición/Ejemplo contextual).
- [COMPLETAR pares correctos]`
  },
  verdadero_falso: {
    tipo: 'verdadero_falso',
    nombre: 'Verdadero o Falso con Justificación',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: VERDADERO O FALSO]
- Enunciados directos afirmando o negando hechos de la lectura o conceptos teóricos.
- El estudiante debe marcar V o F, obligándose a justificar detalladamente cada respuesta marcada como Falsa.
- [COMPLETAR enunciados y pauta de justificación]`
  },
  ordenar_parrafos: {
    tipo: 'ordenar_parrafos',
    nombre: 'Ordenar Párrafos / Coherencia Textual',
    estructura: `[ESTRUCTURA DE ACTIVIDAD: ORDENAR PÁRRAFOS]
- Texto breve (4-6 párrafos) cuyas partes han sido completamente desordenadas.
- El estudiante debe leer cada fragmento, identificar los conectores y la progresión lógica, y numerar los párrafos del 1 al N.
- [COMPLETAR párrafos desordenados y solucionario de orden correcto]`
  }
};
