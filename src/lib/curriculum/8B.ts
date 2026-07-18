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
    descripcion: "Analizar y evaluar textos de los medios de comunicación, como noticias, reportajes, cartas al director, textos publicitarios o de las redes sociales, considerando: los propósitos explícitos e implícitos del texto; una distinción entre los hechos y las opiniones expresados; presencia de estereotipos y prejuicios; la suficiencia de información entregada; el análisis e interpretación de imágenes, gráficos, tablas, mapas o diagramas, y su relación con el texto en el que están insertos; similitudes y diferencias en la forma en que distintas fuentes presentan un mismo hecho.",
    unidades: [7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 11': {
    codigo: 'OA 11',
    descripcion: "Leer y comprender textos no literarios para contextualizar y complementar las lecturas literarias realizadas en clases.",
    unidades: [1,5,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 12': {
    codigo: 'OA 12',
    descripcion: "Aplicar estrategias de comprensión de acuerdo con sus propósitos de lectura: resumir; formular preguntas; analizar los distintos tipos de relaciones que establecen las imágenes o el sonido con el texto escrito (en textos multimodales); identificar los elementos del texto que dificultan la comprensión (pérdida de los referentes, vocabulario desconocido, inconsistencias entre la información del texto y los propios conocimientos) y buscar soluciones.",
    unidades: [1,3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 13': {
    codigo: 'OA 13',
    descripcion: "Expresarse en forma creativa por medio de la escritura de textos de diversos géneros (por ejemplo, cuentos, crónicas, diarios de vida, cartas, poemas, etc.), escogiendo libremente: el tema; el género; el destinatario.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 14': {
    codigo: 'OA 14',
    descripcion: "Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.) caracterizados por: una presentación clara del tema en que se esbozan los aspectos que se abordarán; la presencia de información de distintas fuentes; la inclusión de hechos, descripciones, ejemplos o explicaciones que desarrollen el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos; el uso de imágenes u otros recursos gráficos pertinentes; un cierre coherente con las características del género; el uso de referencias según un formato previamente acordado.",
    unidades: [1,5],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 15': {
    codigo: 'OA 15',
    descripcion: "Escribir, con el propósito de persuadir, textos breves de diversos géneros (por ejemplo, cartas al director, editoriales, críticas literarias, etc.), caracterizados por: la presentación de una afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente; la mantención de la coherencia temática.",
    unidades: [4,6,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 16': {
    codigo: 'OA 16',
    descripcion: "Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro, específicamente, el vocabulario (uso de términos técnicos, frases hechas, palabras propias de las redes sociales, términos y expresiones propios del lenguaje hablado), el uso de la persona gramatical, y la estructura del texto al género discursivo, contexto y destinatario; incorporando información pertinente; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual; usando conectores adecuados para unir las secciones que componen el texto y relacionando las ideas dentro de cada párrafo; usando un vocabulario variado y preciso; reconociendo y corrigiendo usos inadecuados, especialmente de pronombres personales y reflejos, conjugaciones verbales, participios irregulares, y concordancia sujeto–verbo, artículo–sustantivo y sustantivo–adjetivo; corrigiendo la ortografía y mejorando la presentación; usando eficazmente las herramientas del procesador de textos.",
    unidades: [1,4,5,6,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 17': {
    codigo: 'OA 17',
    descripcion: "Usar adecuadamente oraciones complejas: manteniendo un referente claro; conservando la coherencia temporal; ubicando el sujeto, para determinar de qué o quién se habla.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 18': {
    codigo: 'OA 18',
    descripcion: "Construir textos con referencias claras: usando recursos de correferencia como deícticos —en particular, pronombres personales tónicos y átonos— y nominalización, sustitución pronominal y elipsis, entre otros; analizando si los recursos de correferencia utilizados evitan o contribuyen a la pérdida del referente, cambios de sentido o problemas de estilo.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 19': {
    codigo: 'OA 19',
    descripcion: "Conocer los modos verbales, analizar sus usos y seleccionar el más apropiado para lograr un efecto en el lector, especialmente al escribir textos con finalidad persuasiva.",
    unidades: [4],
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
    descripcion: "Escribir correctamente para facilitar la comprensión al lector: aplicando todas las reglas de ortografía literal y acentual; verificando la escritura de las palabras cuya ortografía no está sujeta a reglas; usando correctamente punto, coma, raya y dos puntos.",
    unidades: [5],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 21': {
    codigo: 'OA 21',
    descripcion: "Comprender, comparar y evaluar textos orales y audiovisuales tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; los temas, conceptos o hechos principales; el contexto en el que se enmarcan los textos; prejuicios expresados en los textos; una distinción entre los hechos y las opiniones expresados; diferentes puntos de vista expresados en los textos; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.",
    unidades: [4,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 22': {
    codigo: 'OA 22',
    descripcion: "Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión o profundicen un aspecto del tema; negociando acuerdos con los interlocutores; reformulando sus comentarios para desarrollarlos mejor; considerando al interlocutor para la toma de turnos.",
    unidades: [1,3,5,6,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 23': {
    codigo: 'OA 23',
    descripcion: "Expresarse frente a una audiencia de manera clara y adecuada a la situación para comunicar temas de su interés: presentando información fidedigna y que denota una investigación previa; siguiendo una progresión temática clara; recapitulando la información más relevante o más compleja para asegurarse de que la audiencia comprenda; usando un vocabulario variado y preciso y evitando el uso de muletillas; usando conectores adecuados para hilar la presentación; usando material visual que apoye lo dicho y se relacione directamente con lo que se explica.",
    unidades: [2,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 24': {
    codigo: 'OA 24',
    descripcion: "Usar conscientemente los elementos que influyen y configuran los textos orales: comparando textos orales y escritos para establecer las diferencias, considerando el contexto y el destinatario; demostrando dominio de los distintos registros y empleándolos adecuadamente según la situación; utilizando estrategias que permiten cuidar la relación con el otro, especialmente al mostrar desacuerdo; utilizando un volumen, una velocidad y una dicción adecuados al propósito y a la situación.",
    unidades: [7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 25': {
    codigo: 'OA 25',
    descripcion: "Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; aplicando criterios para determinar la confiabilidad de las fuentes consultadas; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; descartando fuentes que no aportan a la investigación porque se alejan del tema; organizando en categorías la información encontrada en las fuentes investigadas; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.",
    unidades: [2,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 26': {
    codigo: 'OA 26',
    descripcion: "Sintetizar, registrar y ordenar las ideas principales de textos escuchados o leídos para satisfacer propósitos como estudiar, hacer una investigación, recordar detalles, etc.",
    unidades: [2,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 3': {
    codigo: 'OA 3',
    descripcion: "Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; los personajes, su evolución en el relato y su relación con otros personajes; la relación de un fragmento de la obra con el total; el narrador, distinguiéndolo del autor; personajes tipo (por ejemplo, el pícaro, el avaro, el seductor, la madrastra, etc.), símbolos y tópicos literarios presentes en el texto; los prejuicios, estereotipos y creencias presentes en el relato y su conexión con el mundo actual; la disposición temporal de los hechos, con atención a los recursos léxicos y gramaticales empleados para expresarla; elementos en común con otros textos leídos en el año.",
    unidades: [1,2,3,4,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 4': {
    codigo: 'OA 4',
    descripcion: "Analizar los poemas leídos para enriquecer su comprensión, considerando, cuando sea pertinente: cómo el lenguaje poético que emplea el autor apela a los sentidos, sugiere estados de ánimo y crea imágenes; el significado o el efecto que produce el uso de lenguaje figurado en el poema; el efecto que tiene el uso de repeticiones (de estructuras, sonidos, palabras o ideas) en el poema; elementos en común con otros textos leídos en el año.",
    unidades: [2,4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 5': {
    codigo: 'OA 5',
    descripcion: "Analizar los textos dramáticos leídos o vistos, para enriquecer su comprensión, considerando, cuando sea pertinente: el conflicto y sus semejanzas con situaciones cotidianas; los personajes principales y cómo sus acciones y dichos conducen al desenlace o afectan a otros personajes; personajes tipo, símbolos y tópicos literarios; los prejuicios, estereotipos y creencias presentes en el relato y su conexión con el mundo actual; las características del género dramático; la diferencia entre obra dramática y obra teatral; elementos en común con otros textos leídos en el año.",
    unidades: [5],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 6': {
    codigo: 'OA 6',
    descripcion: "Leer y comprender fragmentos de epopeya, considerando sus características y el contexto en el que se enmarcan.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 7': {
    codigo: 'OA 7',
    descripcion: "Leer y comprender comedias teatrales, considerando sus características y el contexto en el que se enmarcan.",
    unidades: [5],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 8': {
    codigo: 'OA 8',
    descripcion: "Formular una interpretación de los textos literarios leídos o vistos, que sea coherente con su análisis, considerando: su experiencia personal y sus conocimientos; un dilema presentado en el texto y su postura personal acerca del mismo; la relación de la obra con la visión de mundo y el contexto histórico en el que se ambienta y/o en el que fue creada.",
    unidades: [1,2,3,4,5,6],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 9': {
    codigo: 'OA 9',
    descripcion: "Analizar y evaluar textos con finalidad argumentativa como columnas de opinión, cartas y discursos, considerando: la postura del autor y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; con qué intención el autor usa diversos modos verbales; su postura personal frente a lo leído y argumentos que la sustentan.",
    unidades: [6,7],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  }
};
