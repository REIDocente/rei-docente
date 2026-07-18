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
    unidades: [1,2,3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 10': {
    codigo: 'OA 10',
    descripcion: "Analizar y evaluar textos de los medios de comunicación, como noticias, reportajes, cartas al director, propaganda o crónicas, considerando: los propósitos explícitos e implícitos del texto; las estrategias de persuasión utilizadas en el texto (uso del humor, presencia de estereotipos, apelación a los sentimientos, etc.) y evaluándolas; la veracidad y consistencia de la información; los efectos causados por recursos no lingüísticos presentes en el texto, como diseño, imágenes, disposición gráfica y efectos de audio; similitudes y diferencias en la forma en que distintas fuentes presentan un mismo hecho; qué elementos del texto influyen en las propias opiniones, percepción de sí mismo y opciones que tomamos.",
    unidades: [4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 11': {
    codigo: 'OA 11',
    descripcion: "Leer y comprender textos no literarios para contextualizar y complementar las lecturas literarias realizadas en clases.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 12': {
    codigo: 'OA 12',
    descripcion: "Aplicar flexiblemente y creativamente las habilidades de escritura adquiridas en clases como medio de expresión personal y cuando se enfrentan a nuevos géneros: investigando las características del género antes de escribir; adecuando el texto a los propósitos de escritura y a la situación.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 13': {
    codigo: 'OA 13',
    descripcion: "Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.) caracterizados por: una presentación clara del tema en que se esbozan los aspectos que se abordarán; una organización y redacción propias de la información; la inclusión de hechos, descripciones, ejemplos o explicaciones que reflejen una reflexión personal sobre el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos y conectores; el uso de imágenes u otros recursos gráficos pertinentes; un cierre coherente con las características del género y el propósito del autor.",
    unidades: [4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 14': {
    codigo: 'OA 14',
    descripcion: "Escribir, con el propósito de persuadir, textos de diversos géneros, en particular ensayos sobre los temas o lecturas propuestos para el nivel, caracterizados por: la presentación de una hipótesis o afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente, extraídas de textos literarios y no literarios; la mantención de la coherencia temática; una conclusión coherente con los argumentos presentados; el uso de citas y referencias según un formato previamente acordado.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 15': {
    codigo: 'OA 15',
    descripcion: "Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro —específicamente el vocabulario (términos técnicos, frases hechas, palabras propias de redes sociales, expresiones del lenguaje hablado), el uso de la persona gramatical y la estructura del texto— al género discursivo, contexto y destinatario; considerando los conocimientos e intereses del lector al incluir la información; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual; usando conectores adecuados; usando un vocabulario variado y preciso; reconociendo y corrigiendo usos inadecuados (pronombres, conjugaciones verbales, participios irregulares, conectores, concordancia); corrigiendo la ortografía y mejorando la presentación; usando eficazmente las herramientas del procesador de textos.",
    unidades: [2,4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 16': {
    codigo: 'OA 16',
    descripcion: "Usar consistentemente el estilo directo y el indirecto en textos escritos y orales: empleando adecuadamente los tiempos verbales en el estilo indirecto; reflexionando sobre el contraste en aspectos formales y de significado entre estilo directo e indirecto, especialmente en textos del ámbito académico.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 17': {
    codigo: 'OA 17',
    descripcion: "Usar en sus textos recursos de correferencia léxica compleja, empleando adecuadamente la metáfora y la metonimia para este fin.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 18': {
    codigo: 'OA 18',
    descripcion: "Escribir correctamente para facilitar la comprensión al lector: aplicando todas las reglas de ortografía literal y acentual; verificando la escritura de las palabras cuya ortografía no está sujeta a reglas; usando correctamente punto, coma, raya, dos puntos, paréntesis, puntos suspensivos y comillas.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 19': {
    codigo: 'OA 19',
    descripcion: "Comprender, comparar y evaluar textos orales y audiovisuales, tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; una ordenación de la información en términos de su relevancia; el contexto en el que se enmarcan los textos; el uso de estereotipos, clichés y generalizaciones; los hechos y las opiniones expresadas y su valor argumentativo; diferentes puntos de vista expresados en los textos; la contribución de imágenes y sonido al significado del texto; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.",
    unidades: [4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 2': {
    codigo: 'OA 2',
    descripcion: "Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 20': {
    codigo: 'OA 20',
    descripcion: "Resumir un discurso argumentativo escuchado, explicando y evaluando los argumentos usados por el emisor.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 21': {
    codigo: 'OA 21',
    descripcion: "Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente y usando información que permita cumplir los propósitos establecidos; distinguiendo afirmaciones basadas en evidencias de aquellas que no lo están; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión; negociando acuerdos con los interlocutores; reformulando sus comentarios para desarrollarlos mejor; considerando al interlocutor para la toma de turnos.",
    unidades: [1,3,4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 22': {
    codigo: 'OA 22',
    descripcion: "Expresarse frente a una audiencia de manera clara y adecuada a la situación para comunicar temas de su interés: presentando información fidedigna y que denota una investigación previa; siguiendo una progresión temática clara; relacionando la información ya dicha con la que están explicando; usando un vocabulario que denota dominio del tema; usando conectores adecuados para hilar la presentación; usando material visual que se relacione directamente con lo que se explica y destaque solo lo más relevante.",
    unidades: [4],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 23': {
    codigo: 'OA 23',
    descripcion: "Analizar los posibles efectos de los elementos lingüísticos, paralingüísticos y no lingüísticos que usa un hablante en una situación determinada.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 24': {
    codigo: 'OA 24',
    descripcion: "Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; descartando las páginas de internet que no aportan información útil, usando otras palabras clave para refinar la búsqueda si es necesario; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; evaluando la validez y confiabilidad de las fuentes consultadas; jerarquizando la información encontrada; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.",
    unidades: [1,2,3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 3': {
    codigo: 'OA 3',
    descripcion: "Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; un análisis de los personajes que considere su relación con otros personajes, qué dicen, qué se dice de ellos, sus acciones y motivaciones, sus convicciones y los dilemas que enfrentan; la relación de un fragmento de la obra con el total; cómo influye en el relato la narración en primera o tercera persona.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 4': {
    codigo: 'OA 4',
    descripcion: "Analizar los poemas leídos para enriquecer su comprensión, considerando, cuando sea pertinente: los símbolos presentes en el texto; la actitud del hablante hacia el tema que aborda; el significado o el efecto que produce el uso de lenguaje figurado en el poema; el efecto que tiene el uso de repeticiones (de estructuras, sonidos, palabras o ideas) en el poema; la relación entre los aspectos formales y el significado del poema; relaciones intertextuales con otras obras.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 5': {
    codigo: 'OA 5',
    descripcion: "Analizar los textos dramáticos leídos o vistos, para enriquecer su comprensión, considerando, cuando sea pertinente: el conflicto y qué problema humano se expresa a través de él; un análisis de los personajes principales que considere su evolución, su relación con otros personajes, qué dicen, qué se dice de ellos, lo que hacen, cómo reaccionan, qué piensan y cuáles son sus motivaciones; personajes tipo, símbolos y tópicos literarios; las creencias, prejuicios y estereotipos presentes en el relato, a la luz de la visión de mundo de la época en la que fue escrito y su conexión con el mundo actual; los elementos (hechos, símbolos) que gatillan o anuncian futuros eventos en la tragedia; cómo los elementos propios de la puesta en escena aportan a la comprensión de la obra (iluminación, sonido, vestuario, escenografía, actuación); relaciones intertextuales con otras obras.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 6': {
    codigo: 'OA 6',
    descripcion: "Comprender la visión de mundo que se expresa a través de las tragedias leídas, considerando sus características y el contexto en el que se enmarcan.",
    unidades: [3],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 7': {
    codigo: 'OA 7',
    descripcion: "Comprender la relevancia de las obras del Romanticismo, considerando sus características y el contexto en el que se enmarcan.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 8': {
    codigo: 'OA 8',
    descripcion: "Formular una interpretación de los textos literarios leídos o vistos, que sea coherente con su análisis, considerando: una hipótesis sobre el sentido de la obra, que muestre un punto de vista personal, histórico, social o universal; una crítica de la obra sustentada en citas o ejemplos; la presencia o alusión a personajes, temas o símbolos de algún mito, leyenda, cuento folclórico o texto sagrado; la relación de la obra con la visión de mundo y el contexto histórico en el que se ambienta y/o en el que fue creada, ejemplificando dicha relación.",
    unidades: [1],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  },
  'OA 9': {
    codigo: 'OA 9',
    descripcion: "Analizar y evaluar textos con finalidad argumentativa, como columnas de opinión, cartas, discursos y ensayos, considerando: la tesis, ya sea explícita o implícita, y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; si la información del texto es suficiente y pertinente para sustentar la tesis del autor; la manera en que el autor organiza el texto; con qué intención el autor usa preguntas retóricas, oraciones desiderativas y oraciones dubitativas; su postura personal frente a lo leído y argumentos que la sustenten.",
    unidades: [2],
    habilidades: ["Comprensión lectora","Análisis crítico"],
    contenidos: ["Comprensión de textos","Estructuras textuales"],
    actitudes: ["Valorar la comunicación","Respeto al diálogo"]
  }
};
