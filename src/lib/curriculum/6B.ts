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
    descripcion: "Leer de manera fluida textos variados apropiados a su edad: pronunciando las palabras con precisión; respetando la prosodia indicada por todos los signos de puntuación; decodificando de manera automática la mayoría de las palabras del texto.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 10': {
    codigo: 'OA 10',
    descripcion: "Asistir habitualmente a la biblioteca para satisfacer diversos propósitos (seleccionar textos, investigar sobre un tema, informarse sobre actualidad, etc.), adecuando su comportamiento y cuidando el material para permitir el trabajo y la lectura de los demás.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 11': {
    codigo: 'OA 11',
    descripcion: "Buscar y comparar información sobre un tema, utilizando fuentes como internet, enciclopedias, libros, prensa, etc., para llevar a cabo una investigación.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 12': {
    codigo: 'OA 12',
    descripcion: "Aplicar estrategias para determinar el significado de palabras nuevas: claves contextuales; raíces y afijos; preguntar a otro; diccionarios, enciclopedias e internet.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 13': {
    codigo: 'OA 13',
    descripcion: "Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas, textos como poemas, diarios de vida, cuentos, anécdotas, cartas, blogs, etc.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 14': {
    codigo: 'OA 14',
    descripcion: "Escribir creativamente narraciones (relatos de experiencias personales, noticias, cuentos, etc.) que: tengan una estructura clara; utilicen conectores adecuados; incluyan descripciones y diálogos (si es pertinente) para desarrollar la trama, los personajes y el entorno.",
    unidades: [4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 15': {
    codigo: 'OA 15',
    descripcion: "Escribir artículos informativos para comunicar información sobre un tema: organizando el texto en una estructura clara; desarrollando una idea central por párrafo; agregando las fuentes utilizadas.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 16': {
    codigo: 'OA 16',
    descripcion: "Escribir frecuentemente para compartir impresiones sobre sus lecturas, desarrollando un tema relevante del texto leído y fundamentando sus comentarios con ejemplos.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 17': {
    codigo: 'OA 17',
    descripcion: "Planificar sus textos: estableciendo propósito y destinatario; generando ideas a partir de sus conocimientos e investigación; organizando las ideas que compondrán su escrito.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 18': {
    codigo: 'OA 18',
    descripcion: "Escribir, revisar y editar sus textos para satisfacer un propósito y transmitir sus ideas con claridad. Durante este proceso: agregan ejemplos, datos y justificaciones para profundizar las ideas; emplean un vocabulario preciso y variado, y un registro adecuado; releen a medida que escriben; aseguran la coherencia y agregan conectores; editan, en forma independiente, aspectos de ortografía y presentación; utilizan las herramientas del procesador de textos para buscar sinónimos, corregir ortografía y gramática, y dar formato (cuando escriben en computador).",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 19': {
    codigo: 'OA 19',
    descripcion: "Incorporar de manera pertinente en la escritura el vocabulario nuevo extraído de textos escuchados o leídos.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 2': {
    codigo: 'OA 2',
    descripcion: "Comprender textos aplicando estrategias de comprensión lectora; por ejemplo: relacionar la información del texto con sus experiencias y conocimientos; releer lo que no fue comprendido; formular preguntas sobre lo leído y responderlas; organizar la información en esquemas o mapas conceptuales; resumir.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 20': {
    codigo: 'OA 20',
    descripcion: "Ampliar su capacidad expresiva, utilizando los recursos que ofrece el lenguaje para expresar un mismo mensaje de diversas maneras; por ejemplo: sinónimos, hipónimos e hiperónimos; locuciones; comparaciones; otros.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 21': {
    codigo: 'OA 21',
    descripcion: "Utilizar correctamente los participios irregulares (por ejemplo, roto, abierto, dicho, escrito, muerto, puesto, vuelto) en sus producciones escritas.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 22': {
    codigo: 'OA 22',
    descripcion: "Escribir correctamente para facilitar la comprensión por parte del lector, aplicando todas las reglas de ortografía literal, acentual y puntual aprendidas en años anteriores, además de: escritura de los verbos haber, tener e ir, en los tiempos más utilizados; coma en frases explicativas; coma en presencia de conectores que la requieren; acentuación de pronombres interrogativos y exclamativos.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 23': {
    codigo: 'OA 23',
    descripcion: "Comprender y disfrutar versiones completas de obras de la literatura, narradas o leídas por un adulto, como: cuentos folclóricos y de autor; poemas; mitos y leyendas; capítulos de novelas.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 24': {
    codigo: 'OA 24',
    descripcion: "Comprender textos orales para obtener información y desarrollar su curiosidad por el mundo: relacionando las ideas escuchadas con sus experiencias personales y sus conocimientos previos; extrayendo y registrando la información relevante.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 25': {
    codigo: 'OA 25',
    descripcion: "Evaluar críticamente mensajes publicitarios: identificando al emisor; explicando cuál es la intención del emisor; identificando a quién está dirigido el mensaje (a niñas, a usuarios del metro, a adultos mayores, etc.) y fundamentando cómo llegaron a esa conclusión.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 26': {
    codigo: 'OA 26',
    descripcion: "Apreciar obras de teatro, películas o representaciones: discutiendo aspectos relevantes de la historia; describiendo cómo los actores cambian sus tonos de voz y su gestualidad para expresar diversas emociones; identificando algunos recursos que buscan provocar un efecto en la audiencia (efectos de sonido, música, efectos de iluminación, etc.).",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 27': {
    codigo: 'OA 27',
    descripcion: "Dialogar para compartir y desarrollar ideas y buscar acuerdos: manteniendo el foco en un tema; complementando las ideas de otro y ofreciendo sugerencias; aceptando sugerencias; haciendo comentarios en los momentos adecuados; mostrando acuerdo o desacuerdo con respeto; fundamentando su postura.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 28': {
    codigo: 'OA 28',
    descripcion: "Interactuar de acuerdo con las convenciones sociales en diferentes situaciones: presentarse a sí mismo y a otros; saludar; preguntar; expresar opiniones, sentimientos e ideas; otras situaciones que requieran el uso de fórmulas de cortesía, como por favor, gracias, perdón, permiso.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 29': {
    codigo: 'OA 29',
    descripcion: "Expresarse de manera clara y efectiva en exposiciones orales para comunicar temas de su interés: presentando las ideas de manera coherente y cohesiva; fundamentando sus planteamientos con ejemplos y datos; organizando las ideas en introducción, desarrollo y cierre; usando elementos de cohesión para relacionar cada parte de la exposición; utilizando un vocabulario variado y preciso y un registro formal adecuado a la situación comunicativa; reemplazando algunas construcciones sintácticas familiares por otras más variadas; conjugando correctamente los verbos; utilizando correctamente los participios irregulares; pronunciando claramente y usando un volumen audible, entonación, pausas y énfasis adecuados; usando gestos y posturas acordes a la situación; usando material de apoyo (power point, papelógrafo, objetos, etc.) de manera efectiva; exponiendo sin leer de un texto escrito.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 3': {
    codigo: 'OA 3',
    descripcion: "Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo, desarrollar su imaginación y reconocer su valor social y cultural; por ejemplo: cuentos folclóricos y de autor, novelas, poemas, otros.",
    unidades: [1,2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 30': {
    codigo: 'OA 30',
    descripcion: "Incorporar de manera pertinente en sus intervenciones orales el vocabulario nuevo extraído de textos escuchados o leídos.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 31': {
    codigo: 'OA 31',
    descripcion: "Producir textos orales espontáneos o planificados de diverso tipo para desarrollar su capacidad expresiva: poemas.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 4': {
    codigo: 'OA 4',
    descripcion: "Analizar aspectos relevantes de las narraciones leídas para profundizar su comprensión: identificando las acciones principales del relato y explicando cómo influyen en el desarrollo de la historia; explicando las actitudes y reacciones de los personajes de acuerdo con sus motivaciones y las situaciones que viven.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 5': {
    codigo: 'OA 5',
    descripcion: "Analizar aspectos relevantes de diversos poemas para profundizar su comprensión: explicando cómo el lenguaje poético que emplea el autor apela a los sentidos, sugiere estados de ánimo y crea imágenes en el lector; identificando personificaciones, comparaciones e hipérboles y explicando su significado dentro del poema.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 6': {
    codigo: 'OA 6',
    descripcion: "Leer independientemente y comprender textos no literarios (cartas, biografías, relatos históricos, libros y artículos informativos, noticias, etc.) para ampliar su conocimiento del mundo y formarse una opinión: extrayendo información explícita e implícita; haciendo inferencias a partir de la información del texto y de sus experiencias y conocimientos; relacionando la información de imágenes, gráficos, tablas, mapas o diagramas, con el texto en el cual están insertos; interpretando expresiones en lenguaje figurado; comparando información entre dos textos del mismo tema; formulando una opinión sobre algún aspecto de la lectura; fundamentando su opinión con información del texto o sus conocimientos previos.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 7': {
    codigo: 'OA 7',
    descripcion: "Evaluar críticamente la información presente en textos de diversa procedencia: determinando quién es el emisor, cuál es su propósito y a quién dirige el mensaje.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 8': {
    codigo: 'OA 8',
    descripcion: "Sintetizar, registrar y ordenar las ideas principales de textos leídos para satisfacer propósitos como estudiar, hacer una investigación, recordar detalles, etc.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 9': {
    codigo: 'OA 9',
    descripcion: "Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos.",
    unidades: [],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  }
};
