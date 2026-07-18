export interface GuideTemplateSection {
  key: string;
  tituloDefault: string;
  instruccionAI: string;
}

export interface GuideTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  idealPara: string;
  secciones: GuideTemplateSection[];
}

export const guideTemplates: Record<string, GuideTemplate> = {
  comprension_lectora: {
    id: 'comprension_lectora',
    nombre: 'Comprensión Lectora',
    descripcion: 'Enfocada en el análisis, extracción de información y reflexión crítica sobre un texto.',
    idealPara: 'Extraer información explícita, implícita y evaluar posturas críticas sobre lecturas.',
    secciones: [
      {
        key: 'activacion',
        tituloDefault: '1. Activación de Aprendizajes Previos',
        instruccionAI: 'Escribe un texto breve (1-2 párrafos) introductorio sobre la temática de la lectura principal, seguido de una pregunta abierta reflexiva para que el estudiante responda con sus conocimientos previos.'
      },
      {
        key: 'desarrollo',
        tituloDefault: '2. Lectura Principal',
        instruccionAI: 'Crea o incluye un texto literario o no literario completo (de 3 a 5 párrafos) de alta calidad, adecuado al nivel. El texto debe ser rico en contenido, vocabulario y estructura narrativa o expositiva.'
      },
      {
        key: 'actividades',
        tituloDefault: '3. Actividades de Análisis y Comprensión',
        instruccionAI: 'Genera exactamente 3 preguntas de comprensión sobre la lectura anterior: la primera de nivel literal (extracción explícita de información), la segunda de nivel inferencial (relacionar, interpretar intenciones o deducciones del texto), y la tercera de nivel crítico-valorativo (reflexión o toma de postura del estudiante frente al texto). Asigna 2 o 3 puntos a cada una.'
      },
      {
        key: 'produccion_escrita',
        tituloDefault: '4. Aplicación y Producción Escrita',
        instruccionAI: 'Crea una consigna corta de redacción (producción escrita) donde el estudiante aplique la temática del texto o use el vocabulario clave en un escrito breve (mínimo 5 líneas).'
      },
      {
        key: 'ticket_salida',
        tituloDefault: '5. Ticket de Salida',
        instruccionAI: 'Redacta una pregunta final de cierre o autoevaluación rápida para comprobar la comprensión del objetivo de la clase.'
      }
    ]
  },
  escritura: {
    id: 'escritura',
    nombre: 'Taller de Escritura Creativa/Guiada',
    descripcion: 'Diseñada para guiar paso a paso al estudiante en la planificación y producción de textos.',
    idealPara: 'Producción de textos narrativos, argumentativos o descriptivos estructurados.',
    secciones: [
      {
        key: 'activacion',
        tituloDefault: '1. Lluvia de Ideas y Activación',
        instruccionAI: 'Crea una situación motivadora o estímulo creativo (una imagen mental, un inicio de oración o una premisa intrigante) y una pregunta corta para encender la imaginación.'
      },
      {
        key: 'modelo_breve',
        tituloDefault: '2. Modelo o Texto de Ejemplo',
        instruccionAI: 'Genera un texto modelo muy breve (1-2 párrafos) del tipo de texto que se va a escribir (ej: un microcuento, una carta o un argumento), resaltando las partes esenciales que el estudiante debe replicar.'
      },
      {
        key: 'planificacion',
        tituloDefault: '3. Planificación del Texto',
        instruccionAI: 'Estructura una pauta de planificación con preguntas guía o campos a completar: destinatario, propósito comunicativo, personajes o ideas principales, e inicio-desarrollo-desenlace.'
      },
      {
        key: 'escritura_guiada',
        tituloDefault: '4. Escritura de tu Borrador (Técnica OREO/Estructurada)',
        instruccionAI: 'Establece la consigna y proporciona la plantilla de escritura estructurada. Si es argumentativo, aplica la técnica OREO (Opinión, Razón, Ejemplo, Opinión repetida). Si es narrativo, guíalos en la redacción de su borrador.'
      },
      {
        key: 'autoevaluacion',
        tituloDefault: '5. Revisión y Autoevaluación',
        instruccionAI: 'Define una lista de cotejo simple de 3 criterios para que el estudiante revise su propio texto (ej: uso de conectores, ortografía, coherencia).'
      }
    ]
  },
  vocabulario: {
    id: 'vocabulario',
    nombre: 'Vocabulario en Contexto',
    descripcion: 'Orientada a la adquisición de nuevas palabras y su aplicación en oraciones y juegos.',
    idealPara: 'Aprender y consolidar términos clave de una lectura o unidad curricular.',
    secciones: [
      {
        key: 'banco_palabras',
        tituloDefault: '1. Banco de Palabras Clave',
        instruccionAI: 'Genera una lista de 4 a 6 palabras complejas o interesantes extraídas del tema o lectura. Para cada palabra, incluye su definición amigable y una oración corta de ejemplo.'
      },
      {
        key: 'asociacion',
        tituloDefault: '2. Actividad de Asociación (Definición)',
        instruccionAI: 'Diseña una actividad donde los estudiantes deban unir los términos del banco de palabras con su significado (desordenado) o responder preguntas de verdadero o falso sobre su significado.'
      },
      {
        key: 'completacion',
        tituloDefault: '3. Completar Oraciones en Contexto',
        instruccionAI: 'Escribe un párrafo o conjunto de 4-6 oraciones con espacios en blanco para que el estudiante las complete utilizando los términos del banco de palabras.'
      },
      {
        key: 'actividad_ludica',
        tituloDefault: '4. Reto de Vocabulario (Sopa de letras o Crucigrama)',
        instruccionAI: 'Crea las instrucciones y pistas para un crucigrama de vocabulario o un juego de palabras intrusas (identificar la palabra que no pertenece al grupo semántico).'
      },
      {
        key: 'ticket_salida',
        tituloDefault: '5. Ticket de Salida: Mi Oración',
        instruccionAI: 'Escribe una instrucción donde el estudiante deba redactar una oración propia y coherente utilizando al menos dos palabras aprendidas.'
      }
    ]
  },
  analisis_literario: {
    id: 'analisis_literario',
    nombre: 'Análisis Literario y de Recursos',
    descripcion: 'Para identificar recursos literarios, interpretar lenguaje figurado y analizar personajes.',
    idealPara: 'Estudio de poemas, cuentos, obras dramáticas y figuras literarias.',
    secciones: [
      {
        key: 'desarrollo',
        tituloDefault: '1. Texto Base / Fragmento Literario',
        instruccionAI: 'Presenta un poema breve, microcuento o fragmento de obra dramática rico en recursos literarios y figuras retóricas.'
      },
      {
        key: 'identificar_recursos',
        tituloDefault: '2. Identificación de Recursos y Figuras',
        instruccionAI: 'Diseña actividades específicas para identificar las figuras literarias (ej: metáfora, personificación, comparación) o recursos de la obra con ejemplos del texto.'
      },
      {
        key: 'tabla_analisis',
        tituloDefault: '3. Tabla de Análisis de Personajes o Estructura',
        instruccionAI: 'Crea una tabla o cuestionario estructurado para analizar elementos del texto: el conflicto, motivaciones de los personajes, ambiente físico/psicológico o rima y métrica si es poesía.'
      },
      {
        key: 'evidencia_interpretacion',
        tituloDefault: '4. Interpretación de Evidencia (Técnica OREO)',
        instruccionAI: 'Escribe una pregunta compleja que exija al estudiante opinar sobre las acciones de un personaje o el tema de la obra, fundamentando su respuesta con citas del texto usando la estructura OREO (Opinión, Razón, Ejemplo/Cita, Opinión).'
      },
      {
        key: 'ticket_salida',
        tituloDefault: '5. Ticket de Cierre',
        instruccionAI: 'Una pregunta final de síntesis sobre el mensaje, moraleja o sentimiento predominante en el texto.'
      }
    ]
  },
  guia_gamificada: {
    id: 'guia_gamificada',
    nombre: 'Guía de Trabajo Gamificada',
    descripcion: 'Transforma el aprendizaje en una aventura con misión, reglas y retos con puntaje.',
    idealPara: 'Motivar a los estudiantes mediante dinámicas de juego aplicadas al currículum.',
    secciones: [
      {
        key: 'activacion',
        tituloDefault: '1. La Misión y las Reglas del Juego',
        instruccionAI: 'Plantea una narrativa intrigante (un misterio, un viaje intergaláctico o una búsqueda del tesoro) en la que el estudiante es el protagonista. Explica la misión y las reglas para ganar puntos.'
      },
      {
        key: 'reto_1',
        tituloDefault: '2. Reto 1: Desbloqueo Conceptual (Fácil)',
        instruccionAI: 'Genera un reto o pregunta conceptual simple para conseguir los primeros 10 puntos (ej: descifrar un código secreto relacionado con el tema).'
      },
      {
        key: 'reto_2',
        tituloDefault: '3. Reto 2: El Enigma del Texto (Medio)',
        instruccionAI: 'Presenta un fragmento corto y diseña un enigma o problema de comprensión lectora de nivel inferencial para desbloquear 20 puntos adicionales.'
      },
      {
        key: 'reto_3',
        tituloDefault: '4. Reto 3: La Batalla Final / Producción (Difícil)',
        instruccionAI: 'Plantea un reto creativo o de producción escrita (ej: escribir un conjuro, redactar un contraargumento) para conseguir los 30 puntos finales.'
      },
      {
        key: 'cierre',
        tituloDefault: '5. Tabla de Puntaje y Veredicto',
        instruccionAI: 'Crea una sección de cierre donde el estudiante sume sus puntos acumulados y redacte una breve frase de autoevaluación sobre su desempeño en la misión.'
      }
    ]
  },
  cuadernillo: {
    id: 'cuadernillo',
    nombre: 'Cuadernillo de Actividades Variadas',
    descripcion: 'Secuencia completa de actividades cortas y diversas para ejercitación intensiva.',
    idealPara: 'Repaso de unidades, ejercitación múltiple o guías largas de trabajo.',
    secciones: [
      {
        key: 'activacion',
        tituloDefault: '1. Portada e Instrucciones de Ruta',
        instruccionAI: 'Escribe un saludo motivador para el estudiante y una lista de instrucciones claras de lo que va a lograr a lo largo de este cuadernillo.'
      },
      {
        key: 'desarrollo',
        tituloDefault: '2. Marco Teórico / Resumen Breve',
        instruccionAI: 'Crea un resumen conceptual muy visual y estructurado (con subtítulos o viñetas claras) que sirva de apoyo teórico para resolver las actividades.'
      },
      {
        key: 'actividades',
        tituloDefault: '3. Actividad A: Comprensión Aplicada',
        instruccionAI: 'Genera un set de 2 preguntas de aplicación directa basadas en el marco teórico o en un texto corto.'
      },
      {
        key: 'produccion_escrita',
        tituloDefault: '4. Actividad B: Ejercitación y Creación',
        instruccionAI: 'Diseña una actividad de producción o resolución práctica independiente (por ejemplo, ordenar párrafos desordenados o clasificar palabras en una tabla).'
      },
      {
        key: 'ticket_salida',
        tituloDefault: '5. Ticket de Salida del Cuadernillo',
        instruccionAI: 'Una pregunta final rápida y metacognitiva sobre cuál fue la actividad más desafiante y por qué.'
      }
    ]
  }
};

export const additionalActivities = [
  {
    id: 'ordenar_parrafos',
    nombre: 'Ordenar párrafos',
    descripcion: 'Entrega un texto desordenado para que el estudiante numere y reconstruya el orden lógico.'
  },
  {
    id: 'palabras_intrusas',
    nombre: 'Palabras intrusas',
    descripcion: 'Encontrar palabras que no corresponden a un grupo semántico o contexto en un texto.'
  },
  {
    id: 'codigo_secreto',
    nombre: 'Código secreto',
    descripcion: 'Descifrar un mensaje oculto utilizando una clave de sustitución simple.'
  },
  {
    id: 'preguntas_capciosas',
    nombre: 'Preguntas capciosas',
    descripcion: 'Preguntas con trampa para evaluar una comprensión fina e interpretación más allá de lo literal.'
  }
];
