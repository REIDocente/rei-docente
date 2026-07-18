export interface PromptTemplate {
  chatgpt: string;
  canva: string;
  notebooklm: string;
  gamma: string;
}

export const presentationTemplates: Record<string, PromptTemplate> = {
  diapositivas: {
    chatgpt: `Actúa como un experto en diseño instruccional y creador de presentaciones educativas. Tu objetivo es generar un esquema detallado para una presentación de diapositivas en español dirigida a estudiantes de {curso}, basada en la siguiente información pedagógica:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones estructurales:
REGLA OBLIGATORIA: La segunda diapositiva debe llamarse 'Objetivo de la clase' y mostrar el objetivo de aprendizaje exactamente como aparece en la planificación, sin resumirlo, sin modificarlo. Es el texto que comienza con 'Objetivo:' en los datos de la sesión.

1) Divide la presentación en diapositivas lógicas cubriendo Inicio (Activación y Objetivo), Desarrollo (Explicación conceptual y práctica guiada) y Cierre (Evaluación/Ticket de salida).
2) Para cada diapositiva, especifica:
   - Título de la diapositiva (máximo 6 palabras)
   - Contenido textual en viñetas claras y sintéticas adaptadas al nivel de {curso}.
   - Sugerencia de organización visual en pantalla y elementos gráficos complementarios (íconos, diagramas).
3) Utiliza una propuesta de diseño moderna, limpia y con alto contraste para garantizar la legibilidad.
4) No incluyas notas de explicación para el docente ni discursos hablados, solo el contenido final para el estudiante.`,

    canva: `Diseña una estructura y distribución visual de diapositivas para Canva basada en la siguiente información de planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de composición en Canva:
REGLA OBLIGATORIA: La segunda diapositiva debe llamarse 'Objetivo de la clase' y mostrar el objetivo de aprendizaje exactamente como aparece en la planificación, sin resumirlo, sin modificarlo. Es el texto que comienza con 'Objetivo:' en los datos de la sesión.

1) Diseña un esquema de páginas:
   - Página 1 (Portada): Título del tema ({tema}), curso ({curso}) y un espacio para una ilustración central descriptiva.
   - Página 2 (Objetivo): Declaración del objetivo de la clase en un contenedor destacado central.
   - Páginas 3-5 (Desarrollo): Estructura en cuadrícula de 2 o 3 columnas, tarjetas de información, cajas de notas conceptuales y analogías visuales a partir de: {contenido} y {actividades}.
   - Página 6 (Práctica): Instrucciones secuenciadas paso a paso con íconos de numeración.
   - Página 7 (Cierre): Pregunta del ticket de salida ({ticket_salida}) enmarcada en una forma geométrica llamativa.
2) Recomendaciones visuales:
   - Usa fuentes tipográficas sans-serif legibles y modernas con escala clara de tamaños para jerarquía.
   - Utiliza formas de fondo suaves para separar los bloques de texto.
   - Sugiere íconos vectoriales simples de la biblioteca de Canva para guiar la lectura y destacar los puntos clave.`,

    notebooklm: `Eres un asistente experto en crear presentaciones educativas dirigidas a estudiantes. La siguiente información corresponde a una planificación generada previamente. Tu tarea es generar una presentación visual separada para cada sesión, respetando su estructura (objetivo de clase, inicio, desarrollo, cierre, tiempos), pero sin incluir lo que dice el docente ni notas de explicación. Solo debe ser contenido para estudiantes.

DATOS PEDAGÓGICOS DE REFERENCIA:
- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones:
REGLA OBLIGATORIA: La segunda diapositiva debe llamarse 'Objetivo de la clase' y mostrar el objetivo de aprendizaje exactamente como aparece en la planificación, sin resumirlo, sin modificarlo. Es el texto que comienza con 'Objetivo:' en los datos de la sesión.

1) Para cada sesión, crea una presentación independiente. No mezcles el contenido de las sesiones.
2) Resume los contenidos de cada sesión en diapositivas claras y visuales, manteniendo Inicio, Desarrollo y Cierre, con subtítulos y tiempos aproximados.
3) Incluye títulos, bullets, esquemas, tablas, mapas conceptuales o ejemplos concretos para que los estudiantes comprendan y sigan la sesión.
4) Sugiere imágenes, íconos o gráficos que hagan cada presentación más atractiva y comprensible.
5) Respeta la estructura de cada sesión: Objetivo, Inicio, Desarrollo, Cierre, Evaluación/Retroalimentación.
6) Incluye apartados de evidencia y ticket de salida, resumidos en bullets, como indica cada sesión.
7) Presenta cada sesión lista para copiar a PowerPoint, Google Slides o Canva.`,

    gamma: `Actúa como un redactor de contenidos experto en presentaciones de inteligencia artificial para Gamma.app. Tu objetivo es estructurar una presentación educativa optimizada para las tarjetas de Gamma a partir del siguiente contenido:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de formato para Gamma:
REGLA OBLIGATORIA: La segunda diapositiva debe llamarse 'Objetivo de la clase' y mostrar el objetivo de aprendizaje exactamente como aparece en la planificación, sin resumirlo, sin modificarlo. Es el texto que comienza con 'Objetivo:' en los datos de la sesión.

1) Organiza el contenido en tarjetas horizontales amplias (formato landscape) que faciliten la maquetación automática por bloques de la IA de Gamma.
2) Para cada tarjeta, proporciona:
   - Título de la tarjeta breve y directo.
   - Breve síntesis conceptual.
   - Distribución sugerida en 2 o 3 columnas de datos estructurados basados en la planificación.
   - Recomendaciones de imágenes o íconos que ayuden a simplificar visualmente las columnas de información.
3) El tono debe ser didáctico, claro y adaptado a estudiantes de {curso}, cubriendo de forma fluida el Inicio, Desarrollo y Cierre de la clase.`
  },

  linea_de_tiempo: {
    chatgpt: `Actúa como especialista en visualización temporal y diseño instruccional. Crea una línea de tiempo didáctica estructurada en español para estudiantes de {curso}, basada en la siguiente información:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de contenido:
1) Extrae de la planificación los acontecimientos, hitos, etapas o pasos cronológicos principales descritos en {contenido} y {actividades}.
2) Organízalos de forma lineal secuencial y progresiva de principio a fin (entre 5 y 8 hitos en total).
3) Para cada hito, detalla:
   - Identificador temporal o etapa del proceso.
   - Título breve del hito (máximo 5 palabras).
   - Explicación del concepto o acontecimiento adaptada a {curso}.
   - Relación causa-efecto con el paso anterior/siguiente.
   - Sugerencia de elemento visual de apoyo (por ejemplo: reloj de arena, pergamino, flecha bidireccional).

---
**PASO 2 — Generar la imagen visual**
Después de recibir el contenido anterior, escribe este mensaje en el mismo chat de ChatGPT:
"Ahora crea una imagen visual de esta línea de tiempo. Reglas estrictas: máximo 4 palabras por hito (solo el título), sin bloques de texto ni explicaciones en la imagen, usa un ícono o símbolo simple por hito, flechas de conexión entre hitos, y los tiempos debajo de cada número. Prioriza lo visual sobre lo textual."`,

    canva: `Diseña una propuesta de distribución de página y composición visual para una Línea de Tiempo en Canva, basada en la siguiente planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de composición en Canva:
1) Establece el formato: Póster vertical u horizontal con una línea directriz clara (eje de tiempo).
2) Organiza entre 5 y 8 bloques de contenido distribuidos equitativamente a lo largo de la directriz.
3) Cada bloque de hito debe incluir:
   - Un nodo gráfico numerado o con la etapa/fecha en fuente destacada de gran tamaño.
   - Una tarjeta de información limpia con bordes redondeados.
   - Título descriptivo corto del hito y resumen explicativo extraído de {contenido}.
   - Espacio reservado para un ícono o gráfico vectorial ilustrativo.
4) La maquetación debe ser limpia, utilizando tipografías de alto contraste y dejando espacio suficiente entre hitos para guiar la lectura secuencial de los estudiantes.`,

    notebooklm: `Actúa como especialista en visualización temporal educativa. La siguiente información corresponde a una planificación generada previamente. Tu tarea es generar una línea de tiempo secuencial y didáctica optimizada para usar como fuente de consulta en NotebookLM.

DATOS PEDAGÓGICOS:
- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones:
1) Identifica y resume secuencialmente entre 5 y 8 hitos cronológicos o conceptuales clave de la planificación.
2) Presenta la información de forma clara y directa para el estudiante de {curso}, omitiendo notas del docente.
3) Para cada hito o etapa, define:
   - Nombre de la etapa o fecha.
   - Título del hito.
   - Resumen didáctico del aprendizaje.
   - Sugerencia de gráfico o dibujo lineal plano explicativo.
4) Entrega la línea de tiempo en un formato de texto limpio en Markdown listo para subir.`,

    gamma: `Actúa como diseñador instruccional experto en Gamma.app. Diseña una línea de tiempo didáctica optimizada para la creación de tarjetas en el generador de Gamma:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de formato para Gamma:
1) Crea una tarjeta inicial para el título de la línea de tiempo ({tema}) y la descripción del objetivo pedagógico.
2) Estructura cada hito cronológico (entre 5 y 8 hitos) en su propia tarjeta secuencial.
3) Utiliza una disposición interna en Gamma de dos columnas por tarjeta:
   - Columna izquierda: Identificador de la etapa o número de paso en gran tamaño tipográfico con un ícono sugerido.
   - Columna derecha: Título y descripción resumida de lo que ocurre en esa etapa basándose en {contenido}.
4) Asegura un flujo narrativo coherente y progresivo entre las tarjetas.`
  },

  flashcards: {
    chatgpt: `Actúa como creador de recursos didácticos de estudio. Genera una colección de tarjetas de aprendizaje (flashcards) para estudiantes de {curso}, a partir de los siguientes contenidos curriculares:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Estructura de las Flashcards:
1) Diseña un set de entre 8 y 10 tarjetas individuales de preguntas y respuestas.
2) Para cada tarjeta, detalla con precisión:
   - Nivel de dificultad (Fácil / Intermedio / Desafiante).
   - Cara A (Pregunta, concepto clave o término en español).
   - Cara B (Respuesta detallada, definición pedagógica, ejemplo contextualizado de aplicación y una sugerencia de analogía visual).
3) El vocabulario y los ejemplos deben estar adaptados para estudiantes de {curso}, promoviendo el autoaprendizaje y la autoevaluación.`,

    canva: `Diseña una distribución física y maquetación de tarjetas didácticas (Flashcards) para Canva basada en la siguiente planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de diseño y composición en Canva:
1) Maqueta una plantilla de cuadrícula A4 con 4 o 6 tarjetas por página.
2) Para cada tarjeta didáctica, define dos caras visualmente diferenciadas:
   - Cara Frontal (Cara A): Centra el término o pregunta en una tipografía sans-serif bold muy visible. Espacio para un ícono representativo.
   - Cara Posterior (Cara B): Redacta una definición clara basada en {contenido}, un ejemplo práctico extraído de {actividades} y un consejo de metacognición.
3) Utiliza un diseño de bordes redondeados y una línea punteada que demarque el área de recorte para facilitar el trabajo manual del estudiante.`,

    notebooklm: `Eres un diseñador de materiales de autoevaluación. Genera una lista estructurada de preguntas y respuestas en formato de Flashcards educativas basada en esta planificación, lista para ser cargada en NotebookLM:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones para la lista:
1) Elabora entre 8 y 10 pares de Flashcards (Cara A / Cara B) basados en los conceptos complejos e hitos teóricos de la sesión.
2) Mantén el tono didáctico enfocado en el estudiante de {curso}.
3) Presenta cada tarjeta bajo la estructura:
   - Flashcard N° [Número]
   - Frente (Cara A): [Pregunta o Término]
   - Reverso (Cara B): [Definición didáctica + Ejemplo práctico]
4) Entrega el contenido listo para copiar y estructurar en herramientas de repaso interactivo.`,

    gamma: `Actúa como especialista en microaprendizaje interactivo. Diseña un set de Flashcards estructuradas en Gamma.app a partir del siguiente contenido pedagógico:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones para Gamma:
1) Organiza el contenido en tarjetas independientes y secuenciales que actúen como un mazo didáctico interactivo.
2) Diseña cada tarjeta con una estructura interna de bloques divididos:
   - Panel de Pregunta (Sección superior destacada): Pregunta directa para activar conocimientos.
   - Panel de Respuesta (Sección inferior oculta o revelada en la presentación): Definición, ejemplo del tema ({tema}) y un ícono gráfico sugerido para anclaje visual.
3) Fomenta un lenguaje directo, dinámico y motivador adaptado a {curso}.`
  },

  infografia: {
    chatgpt: `Actúa como director de arte y diseñador instruccional. Crea el contenido estructurado para una Infografía Modular Educativa en español dirigida a estudiantes de {curso}, basada en la siguiente planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de estructura:
1) Divide los contenidos en 4 o 5 bloques de información independientes pero interconectados bajo un título principal potente.
2) Para cada bloque o sección de la infografía, define:
   - Título del bloque (máximo 4 palabras).
   - Síntesis de contenidos escrita en un formato altamente visual (bullets, oraciones cortas).
   - Sugerencia de elemento gráfico genérico (gráficos de barra, diagramas de flujo, íconos de advertencia, lupas).
3) Termina con una conclusión que sintetice cómo se conecta este tema ({tema}) con la vida real o con el objetivo ({oa}).

---
**PASO 2 — Generar la imagen visual**
Después de recibir el contenido anterior, escribe este mensaje en el mismo chat de ChatGPT:
"Ahora crea una imagen visual de esta infografía. Reglas estrictas: máximo 5 palabras por bloque temático, usa íconos y números grandes para jerarquizar, sin párrafos ni oraciones completas en la imagen, divide el espacio en bloques visuales claramente separados. Prioriza lo visual sobre lo textual."`,

    canva: `Diseña una propuesta de maquetación y distribución espacial para una Infografía Educativa en Canva, a partir de los datos de esta planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de composición en Canva:
1) Define el layout: Formato póster vertical A4 con amplios márgenes para una legibilidad óptima.
2) Organiza la estructura:
   - Encabezado: Título temático llamativo y una caja contenedora con el OA ({oa}).
   - Secciones Centrales (3 a 5 bloques modulares): Distribuidos verticalmente en tarjetas separadas con bordes curvos y sombras sutiles que le den relieve.
   - Contenido de secciones: Redacta puntos explicativos muy sintetizados basados en {contenido}.
   - Espacio gráfico: Propón ubicaciones para íconos lineales limpios en los lados laterales de cada bloque.
   - Pie de página: Resumen didáctico breve y llamado a la acción.
3) El diseño general debe estar equilibrado, utilizando tipografías sans-serif muy legibles.`,

    notebooklm: `Actúa como especialista en síntesis didáctica y visual. Genera un contenido modular estructurado para una infografía educativa basada en la planificación, lista para ser procesada en NotebookLM:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones:
1) Fragmenta la información teórica de la planificación en bloques lógicos independientes.
2) Redacta el contenido en viñetas directas y sintéticas, eliminando textos de relleno o instrucciones docentes.
3) Para cada sección infográfica, especifica:
   - Título del bloque.
   - Contenido de aprendizaje en bullets claros.
   - Sugerencia de ícono lineal de apoyo para anclar el concepto.
4) Entrega la información en formato de texto Markdown limpio y estructurado.`,

    gamma: `Actúa como diseñador instruccional experto en infografías para Gamma.app. Estructura los contenidos de la planificación en una disposición infográfica interactiva optimizada para las tarjetas de Gamma:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Estructura de tarjetas en Gamma:
1) Tarjeta 1 (Introducción): Título principal de la infografía del tema ({tema}) y descripción del objetivo de aprendizaje.
2) Tarjeta de Contenidos: Utiliza una cuadrícula de 2x2 o 3 columnas anchas de Gamma para ubicar de forma paralela los conceptos clave resumidos a partir de {contenido}.
3) Para cada bloque de la cuadrícula, sugiere:
   - Un ícono vectorial representativo en la esquina superior.
   - Datos conceptuales sintetizados en viñetas cortas.
4) Tarjeta de Cierre: Resumen reflexivo y ticket de salida ({ticket_salida}).`
  },

  organizador_visual: {
    chatgpt: `Actúa como organizador gráfico instruccional. Identifica y estructura de forma automática el organizador gráfico que mejor se adapte al tema (mapa conceptual, mapa mental, diagrama de flujo, o tabla comparativa) a partir de la planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones:
1) Identifica y declara la tipología de organizador gráfico óptimo según los datos del tema ({tema}).
2) Detalla la estructura del organizador:
   - Nodo Principal / Idea Central.
   - Nodos de segundo nivel y conceptos asociados de {contenido}.
   - Relaciones, jerarquías e ideas clave adaptadas a estudiantes de {curso}.
3) Proporciona sugerencias gráficas generales e íconos descriptivos para cada nodo.

---
**PASO 2 — Generar la imagen visual**
Después de recibir el contenido anterior, escribe este mensaje en el mismo chat de ChatGPT:
"Ahora crea una imagen visual de este organizador. Reglas estrictas: máximo 3 palabras por nodo o caja, sin explicaciones dentro del organizador, usa flechas, líneas o conectores para mostrar relaciones, cada nodo debe tener solo la etiqueta clave. Prioriza lo visual sobre lo textual."`,

    canva: `Diseña una propuesta de distribución de componentes en Canva para un Organizador Visual educativo basado en los contenidos de la planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de composición en Canva:
1) Determina la estructura gráfica óptima según el tema (red asociativa, árbol jerárquico, cuadro de contraste o secuencia de bloques).
2) Diseña la distribución en el lienzo:
   - Nodo Principal: Ubicado de forma destacada en el centro o en el extremo superior con el título del tema ({tema}).
   - Conectores visuales: Usa líneas simples y flechas limpias de Canva para guiar la lectura jerárquica.
   - Nodos Secundarios (entre 4 y 6 bloques): Cajas de texto con bordes redondeados y espacio suficiente que sinteticen la teoría de {contenido}.
   - Elementos de apoyo: Ubicación sugerida para íconos vectoriales al lado de cada caja.
3) Utiliza fuentes limpias y mantén el lienzo equilibrado y libre de amontonamientos.`,

    notebooklm: `Actúa como experto en esquematización instruccional. A partir de los contenidos de la planificación, estructura un organizador visual adaptado para ser interpretado y utilizado como fuente de consulta en NotebookLM:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de estructuración:
1) Identifica la tipología de organizador adecuada para el tema (mapa mental, jerárquico, comparativo o secuencial).
2) Diseña el esquema nodo por nodo de forma textual clara:
   - Concepto Central: {tema}.
   - Ramificaciones o Subtemas: Ideas derivadas de {contenido}.
   - Para cada subtema, define la jerarquía, conceptos de enlace y el contenido resumido en viñetas directas para {curso}.
3) Presenta el resultado en Markdown limpio y ordenado para fácil copia y procesamiento.`,

    gamma: `Actúa como diseñador instruccional experto en organizadores gráficos para Gamma.app. Diseña un organizador conceptual interactivo optimizado para ser estructurado en las tarjetas de Gamma:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Distribución de tarjetas en Gamma:
1) Tarjeta Principal: Título del organizador visual ({tema}), objetivo pedagógico y tipo de organizador seleccionado.
2) Tarjeta de Estructura: Utiliza la maquetación de bloques de Gamma en formato de columnas verticales u horizontales para mostrar las subdivisiones jerárquicas o procesos de {contenido}.
3) Para cada columna, proporciona:
   - Título de la rama o paso del organizador.
   - Resumen didáctico para estudiantes de {curso}.
   - Sugerencia de imagen o diagrama lineal simple de apoyo.
4) Tarjeta de Conclusión: Resumen general y ticket de salida ({ticket_salida}).`
  },

  poster: {
    chatgpt: `Actúa como diseñador gráfico y director de arte educativo. Tu objetivo es diseñar un Póster Didáctico en español que resuma una única idea fuerza o concepto central a partir de la planificación pedagógica:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones estructurales del Póster:
1) Define una idea fuerza o titular de gran impacto visual (máximo 6 palabras).
2) Estructura el póster en 3 secciones jerárquicas:
   - Título gigante descriptivo del tema.
   - Sección Central: Explicación resumida en 1 o 2 oraciones memorables sobre el concepto básico del tema.
   - Sección de Apoyo: Esquema gráfico o infografía muy simple que represente la idea central de {contenido}.
3) Proporciona recomendaciones para una imagen central simbólica de alto impacto gráfico.
4) El tono debe ser directo, claro, motivador y adaptado a estudiantes de {curso}.

---
**PASO 2 — Generar la imagen visual**
Después de recibir el contenido anterior, escribe este mensaje en el mismo chat de ChatGPT:
"Ahora crea una imagen visual de este póster. Reglas estrictas: máximo 1 idea fuerza en 5 palabras como texto principal, una imagen o ilustración central dominante, texto mínimo de apoyo en tipografía grande. Sin bloques de texto. Prioriza el impacto visual."`,

    canva: `Diseña una propuesta de maquetación y jerarquía visual para un Póster Didáctico en Canva basado en la siguiente planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de composición en Canva:
1) Define el formato: Póster vertical clásico A3 o A4 para imprimir en el aula.
2) Estructura la maquetación:
   - Encabezado: Título principal en tipografía sans-serif bold muy destacada y de gran tamaño.
   - Centro: Espacio reservado para una ilustración vectorial descriptiva que simbolice la idea central del tema ({tema}).
   - Cuerpo Inferior: Cajas de texto limpias con bordes definidos que sinteticen en 2 o 3 puntos los conceptos esenciales extraídos de {contenido}.
   - Cierre: Una frase motivacional en letra cursiva manuscrita en la parte inferior.
3) Utiliza un diseño de alto contraste con márgenes amplios para que se lea fácilmente desde la distancia en el aula.`,

    notebooklm: `Actúa como especialista en síntesis y visualización educativa. Genera la estructura de contenido de un póster didáctico centrado en una sola idea principal a partir de la planificación, optimizado para NotebookLM:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones:
1) Condensa la planificación en una idea fuerza o titular central para el póster.
2) Estructura el contenido del póster en Markdown:
   - Titular Principal.
   - Párrafo de Síntesis Pedagógica (máximo 3 líneas) adaptada para {curso}.
   - Sugerencia detallada de la ilustración central en blanco y negro (line art descriptivo).
   - 3 puntos clave o consejos derivados de {contenido}.
3) Presenta el resultado listo para copiar y usar de referencia.`,

    gamma: `Actúa como diseñador instruccional experto en Gamma.app. Estructura el diseño de un póster didáctico interactivo optimizado para ser presentado en las tarjetas de Gamma:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Disposición de tarjetas en Gamma:
1) Tarjeta Inicial (Póster): Título llamativo gigante del tema ({tema}) y descripción del concepto principal.
2) Tarjeta de Contenido: Utiliza la maquetación en columnas de Gamma para presentar:
   - Columna 1: Ilustración simbólica sugerida.
   - Columna 2: 3 conceptos clave sintéticos y directos extraídos de {contenido}.
3) Tarjeta de Cierre: Pregunta de reflexión del ticket de salida ({ticket_salida}) dirigida a los estudiantes.`
  },

  afiche: {
    chatgpt: `Actúa como redactor publicitario y diseñador instruccional. Crea el texto y estructura para un Afiche Persuasivo Didáctico en español dirigido a estudiantes de {curso}, basado en la siguiente información de la planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones del Afiche:
1) Define un eslogan llamativo y persuasivo que invite al estudiante a la acción o despierte su curiosidad sobre el tema ({tema}).
2) Redacta el cuerpo de texto en español usando un tono motivador y directo (máximo 3 puntos clave resumidos de {contenido}).
3) Incluye un Llamado a la Acción (CTA) muy claro que invite a los estudiantes a realizar la actividad práctica o resolver el ticket de salida.
4) Sugiere elementos gráficos simbólicos e íconos direccionales (flechas, megáfonos) que refuercen el llamado a la acción.

---
**PASO 2 — Generar la imagen visual**
Después de recibir el contenido anterior, escribe este mensaje en el mismo chat de ChatGPT:
"Ahora crea una imagen visual de este afiche. Reglas estrictas: máximo 10 palabras en total en toda la imagen, incluir un llamado a la acción en 3 palabras o menos, imagen o ilustración central llamativa. Sin párrafos ni explicaciones. Prioriza el impacto visual y la persuasión."`,

    canva: `Diseña una propuesta de distribución de componentes gráficos y textuales para un Afiche Persuasivo en Canva, basada en la siguiente planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de maquetación en Canva:
1) Define el formato: Afiche vertical A4 o Carta para publicar en tableros o murallas.
2) Organiza la jerarquía visual:
   - Encabezado: Eslogan o pregunta de enganche en fuentes bold de gran tamaño.
   - Centro: Espacio destacado para un ícono o ilustración central vectorial de carácter persuasivo sobre el tema.
   - Cuerpo Inferior: Cajas destacadas de texto que contengan información básica e instrucciones prácticas de {actividades}.
   - Sección de Llamado a la Acción: En la base, un botón o caja rectangular con el llamado a la acción (ej: realizar el ticket de salida).
3) El diseño general debe estar equilibrado, utilizando tipografías limpias y de alto contraste.`,

    notebooklm: `Actúa como especialista en redacción y diseño de afiches educativos. Genera el contenido estructurado de un afiche motivacional basado en la planificación, optimizado para NotebookLM:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones:
1) Extrae los aprendizajes significativos de la planificación para crear un eslogan de enganche y motivación para {curso}.
2) Diseña la estructura del afiche en Markdown:
   - Eslogan o Titular.
   - Datos e información clave en viñetas (máximo 2 líneas por viñeta) sobre el tema ({tema}).
   - Llamado a la acción pedagógico claro para el alumno.
   - Descripción detallada de una imagen en blanco y negro (line art) sugerida para la composición.
3) Entrega la información en formato limpio y listo para copiar.`,

    gamma: `Actúa como diseñador instruccional experto en afiches para Gamma.app. Estructura el contenido de la planificación en una disposición de afiche interactivo optimizada para las tarjetas de Gamma:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Distribución de tarjetas en Gamma:
1) Tarjeta de Entrada: Título gigante, eslogan persuasivo sobre el tema ({tema}) y descripción del objetivo de aprendizaje.
2) Tarjeta de Desarrollo: Utiliza la maquetación en columnas de Gamma para presentar de forma gráfica:
   - Columna 1: Ilustración o ícono de llamado a la acción.
   - Columna 2: Explicación directa de las actividades prácticas ({actividades}) y su propósito formativo.
3) Tarjeta de Cierre (Llamado a la Acción): Caja de texto con instrucciones del ticket de salida ({ticket_salida}).`
  },

  comic: {
    chatgpt: `Actúa como guionista e ilustrador de cómics educativos. Tu objetivo es transformar los contenidos de la planificación pedagógica en un Guion de Cómic Didáctico escena por escena, adaptado a estudiantes de {curso}:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones del Guion de Cómic:
1) Crea una narrativa pedagógica secuencial con personajes coherentes de edad escolar o científica acorde al nivel de {curso}.
2) Divide el cómic en una secuencia de entre 4 y 6 viñetas (escenas) detalladas.
3) Para cada viñeta, especifica con precisión:
   - Número de viñeta y Título de la escena.
   - Descripción visual detallada de la escena (personajes, expresiones, elementos del entorno y sugerencia de ilustraciones en blanco y negro).
   - Globos de Diálogo (Texto exacto que dicen los personajes en español para explicar los conceptos del tema ({tema}) de forma didáctica).
   - Recuadro del narrador (Texto explicativo breve en los extremos de la viñeta).
4) Los diálogos deben simplificar de forma creativa la teoría de {contenido} y las dinámicas de {actividades}.

---
**PASO 2 — Generar la imagen visual**
Después de recibir el contenido anterior, escribe este mensaje en el mismo chat de ChatGPT:
"Ahora crea una imagen visual de este cómic. Reglas estrictas: máximo 2-3 palabras por globo de diálogo, entre 4 y 6 viñetas secuenciales, personajes consistentes entre escenas, sin narración externa larga. El texto dentro de cada viñeta debe ser mínimo y directo."`,

    canva: `Diseña una propuesta de distribución de cuadrícula (Comic Strip Layout) en Canva basada en los contenidos de la planificación:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones de maquetación en Canva:
1) Establece el formato: Lienzo A4 horizontal con una cuadrícula estructurada de 4 o 6 recuadros (viñetas).
2) Diseña cada recuadro de la tira cómica:
   - Margen de borde limpio y negro de grosor uniforme para separar los recuadros.
   - Espacio superior para cajas de texto del narrador.
   - Espacio central reservado para siluetas o íconos lineales de personajes.
   - Globos de diálogo ovalados o rectangulares con texto legible sans-serif adaptado a estudiantes de {curso}.
3) El guion gráfico debe mostrar el flujo paso a paso de los conceptos de la planificación ({contenido}) de forma secuencial y narrativa.`,

    notebooklm: `Actúa como guionista de tiras cómicas didácticas. Transforma la información de la planificación en un guion gráfico secuencial en formato de texto Markdown listo para usar en NotebookLM:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Instrucciones:
1) Elabora una narrativa de 4 a 6 escenas que traduzca el contenido pedagógico ({contenido}) en un diálogo dinámico entre personajes.
2) Presenta el guion en Markdown siguiendo la estructura:
   - Viñeta N° [Número]
   - Descripción de la imagen: [Detalle visual del escenario y personajes]
   - Diálogo del Personaje A: "[Texto]"
   - Diálogo del Personaje B: "[Texto]"
   - Texto del Narrador: "[Texto]"
3) Adapta el vocabulario a {curso} para que sea dinámico, claro y entretenido.`,

    gamma: `Actúa como especialista en narrativas visuales y storytelling. Estructura el guion didáctico de un cómic educativo en tarjetas independientes optimizadas para el generador de Gamma.app:

- CURSO: {curso}
- OBJETIVO DE APRENDIZAJE (OA): {oa}
- UNIDAD: {unidad}
- TEMA: {tema}
- CONTENIDO PRINCIPAL: {contenido}
- SECUENCIA DE ACTIVIDADES: {actividades}
- EVALUACIÓN: {evaluacion}
- TICKET DE SALIDA: {ticket_salida}

Distribución de tarjetas en Gamma:
1) Tarjeta Inicial: Portada del Cómic Didáctico, título ({tema}), presentación de personajes y objetivo de aprendizaje.
2) Tarjetas de Escenas (4 a 6 tarjetas secuenciales): Cada tarjeta de Gamma representará una viñeta del cómic.
3) En cada tarjeta, utiliza la distribución de columnas:
   - Columna 1: Descripción de la ilustración sugerida escena por escena.
   - Columna 2: Globos de diálogo de los personajes y el texto descriptivo del narrador basados en {contenido}.
4) Tarjeta Final: Conclusión narrativa, síntesis pedagógica y ticket de salida ({ticket_salida}).`
  }
};
