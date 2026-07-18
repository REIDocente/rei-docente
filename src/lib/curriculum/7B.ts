export interface OAData {
  codigo: string;
  descripcion: string;
  unidades: number[];
  habilidades: string[];
  contenidos: string[];
  actitudes: string[];
}

export const OAs: Record<string, OAData> = {
  'OA 1': {
    codigo: 'OA 1',
    descripcion: "Leer habitualmente para aprender y recrearse, y seleccionar textos de acuerdo con sus preferencias y propósitos.",
    unidades: [1,2,3,4,5,6,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 10': {
    codigo: 'OA 10',
    descripcion: "Leer y comprender textos no literarios para contextualizar y complementar las lecturas literarias realizadas en clases.",
    unidades: [2,5],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 11': {
    codigo: 'OA 11',
    descripcion: "Aplicar estrategias de comprensión de acuerdo con sus propósitos de lectura: resumir; formular preguntas; analizar los distintos tipos de relaciones que establecen las imágenes o el sonido con el texto escrito (en textos multimodales); identificar los elementos del texto que dificultan la comprensión (pérdida de los referentes, vocabulario desconocido, inconsistencias entre la información del texto y los propios conocimientos) y buscar soluciones.",
    unidades: [1,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 12': {
    codigo: 'OA 12',
    descripcion: "Expresarse en forma creativa por medio de la escritura de textos de diversos géneros (por ejemplo, cuentos, crónicas, diarios de vida, cartas, poemas, etc.), escogiendo libremente: el tema; el género; el destinatario.",
    unidades: [7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 13': {
    codigo: 'OA 13',
    descripcion: "Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.), caracterizados por: una presentación clara del tema; la presencia de información de distintas fuentes; la inclusión de hechos, descripciones, ejemplos o explicaciones que desarrollen el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos; el uso de imágenes u otros recursos gráficos pertinentes; un cierre coherente con las características del género; el uso de referencias según un formato previamente acordado.",
    unidades: [3,4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 14': {
    codigo: 'OA 14',
    descripcion: "Escribir, con el propósito de persuadir, textos breves de diversos géneros (por ejemplo, cartas al director, editoriales, críticas literarias, etc.), caracterizados por: la presentación de una afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente; la mantención de la coherencia temática.",
    unidades: [1,2,5,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 15': {
    codigo: 'OA 15',
    descripcion: "Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro, específicamente el vocabulario (uso de términos técnicos, frases hechas, palabras propias de las redes sociales, términos y expresiones propios del lenguaje hablado), el uso de la persona gramatical y la estructura del texto al género discursivo, contexto y destinatario; incorporando información pertinente; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual; usando conectores adecuados para unir las secciones que componen el texto; usando un vocabulario variado y preciso; reconociendo y corrigiendo usos inadecuados, especialmente de pronombres personales y reflejos, conjugaciones verbales, participios irregulares, y concordancia sujeto-verbo, artículo-sustantivo y sustantivo-adjetivo; corrigiendo la ortografía y mejorando la presentación; usando eficazmente las herramientas del procesador de textos.",
    unidades: [1,2,3,4,5,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 16': {
    codigo: 'OA 16',
    descripcion: "Aplicar los conceptos de oración, sujeto y predicado con el fin de revisar y mejorar sus textos: produciendo consistentemente oraciones completas; conservando la concordancia entre sujeto y predicado; ubicando el sujeto para determinar de qué o quién se habla.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 17': {
    codigo: 'OA 17',
    descripcion: "Usar en sus textos recursos de correferencia léxica: empleando adecuadamente la sustitución léxica, la sinonimia y la hiperonimia; reflexionando sobre las relaciones de sinonimia e hiperonimia y su papel en la redacción de textos cohesivos y coherentes.",
    unidades: [6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 18': {
    codigo: 'OA 18',
    descripcion: "Utilizar adecuadamente, al narrar, los tiempos verbales del indicativo, manteniendo una adecuada secuencia de tiempos verbales.",
    unidades: [7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 19': {
    codigo: 'OA 19',
    descripcion: "Escribir correctamente para facilitar la comprensión al lector: aplicando todas las reglas de ortografía literal y acentual; verificando la escritura de las palabras cuya ortografía no está sujeta a reglas; usando correctamente punto, coma, raya y dos puntos.",
    unidades: [1,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 2': {
    codigo: 'OA 2',
    descripcion: "Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.",
    unidades: [1,2,3,4,5,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 20': {
    codigo: 'OA 20',
    descripcion: "Comprender, comparar y evaluar textos orales y audiovisuales tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; los temas, conceptos o hechos principales; una distinción entre los hechos y las opiniones expresadas; diferentes puntos de vista expresados en los textos; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y otras manifestaciones artísticas; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.",
    unidades: [7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 21': {
    codigo: 'OA 21',
    descripcion: "Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión o profundicen un aspecto del tema; negociando acuerdos con los interlocutores; considerando al interlocutor para la toma de turnos.",
    unidades: [1,2,4,5,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 22': {
    codigo: 'OA 22',
    descripcion: "Expresarse frente a una audiencia de manera clara y adecuada a la situación, para comunicar temas de su interés: presentando información fidedigna y que denota una investigación previa; siguiendo una progresión temática clara; dando ejemplos y explicando algunos términos o conceptos clave para la comprensión de la información; usando un vocabulario variado y preciso y evitando el uso de muletillas; usando material visual que apoye lo dicho y se relacione directamente con lo que se explica.",
    unidades: [3,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 23': {
    codigo: 'OA 23',
    descripcion: "Usar conscientemente los elementos que influyen y configuran los textos orales: comparando textos orales y escritos para establecer las diferencias, considerando el contexto y el destinatario; demostrando dominio de los distintos registros y empleándolos adecuadamente según la situación; utilizando estrategias que permiten cuidar la relación con el otro, especialmente al mostrar desacuerdo; utilizando un volumen, una velocidad y una dicción adecuados al propósito y a la situación.",
    unidades: [4,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 24': {
    codigo: 'OA 24',
    descripcion: "Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; utilizando los principales sistemas de búsqueda de textos en la biblioteca e internet; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; organizando en categorías la información encontrada en las fuentes investigadas; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.",
    unidades: [3,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 25': {
    codigo: 'OA 25',
    descripcion: "Sintetizar, registrar y ordenar las ideas principales de textos escuchados o leídos para satisfacer propósitos como estudiar, hacer una investigación, recordar detalles, etc.",
    unidades: [3,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 3': {
    codigo: 'OA 3',
    descripcion: "Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; el papel que juega cada personaje en el conflicto y cómo sus acciones afectan a otros personajes; el efecto de ciertas acciones en el desarrollo de la historia; cuándo habla el narrador y cuándo hablan los personajes; la disposición temporal de los hechos; elementos en común con otros textos leídos en el año.",
    unidades: [1,2,3,4,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 4': {
    codigo: 'OA 4',
    descripcion: "Analizar los poemas leídos para enriquecer su comprensión, considerando, cuando sea pertinente: cómo el lenguaje poético que emplea el autor apela a los sentidos, sugiere estados de ánimo y crea imágenes; el significado o el efecto que produce el uso de lenguaje figurado en el poema; el efecto que produce el ritmo y la sonoridad del poema al leerlo en voz alta; elementos en común con otros textos leídos en el año.",
    unidades: [1,5],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 5': {
    codigo: 'OA 5',
    descripcion: "Leer y comprender romances y obras de la poesía popular, considerando sus características y el contexto en el que se enmarcan.",
    unidades: [5],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 6': {
    codigo: 'OA 6',
    descripcion: "Leer y comprender relatos mitológicos, considerando sus características y el contexto en el que se enmarcan.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 7': {
    codigo: 'OA 7',
    descripcion: "Formular una interpretación de los textos literarios, considerando: su experiencia personal y sus conocimientos; un dilema presentado en el texto y su postura personal acerca del mismo; la relación de la obra con la visión de mundo y el contexto histórico en el que se ambienta y/o en el que fue creada.",
    unidades: [1,2,3,4,5,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 8': {
    codigo: 'OA 8',
    descripcion: "Analizar y evaluar textos con finalidad argumentativa como columnas de opinión, cartas y discursos, considerando: la postura del autor y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; su postura personal frente a lo leído y argumentos que la sustentan.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 9': {
    codigo: 'OA 9',
    descripcion: "Analizar y evaluar textos de los medios de comunicación, como noticias, reportajes, cartas al director, textos publicitarios o de las redes sociales, considerando: los propósitos explícitos e implícitos del texto; una distinción entre los hechos y las opiniones expresadas; presencia de estereotipos y prejuicios; el análisis e interpretación de imágenes, gráficos, tablas, mapas o diagramas, y su relación con el texto en el que están insertos; los efectos que puede tener la información divulgada en los hombres o las mujeres aludidos en el texto.",
    unidades: [7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  }
};
