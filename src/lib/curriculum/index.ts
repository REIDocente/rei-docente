// Static Curriculum Database for Chilean Lenguaje y Literatura
// Generated on 2026-07-04T23:11:30.866Z

export interface CurriculumOA {
  id: string;
  codigo_oa: string;
  texto_oa: string | null;
  eje: string;
  indicadores: string | null;
  ciclo: string;
  nivel: string;
  asignatura: string;
  habilidades?: string;
  contenidos?: string;
  actitudes?: string;
}

export interface CurriculumUnidad {
  id: string;
  nivel: string;
  unidad_numero: number;
  titulo_tema: string;
  oa_codes: string[] | null;
}

export interface CurriculumLeccion {
  id: string;
  unidad_id: string;
  leccion_numero: number;
  titulo_leccion: string;
  temas: string | string[] | null;
  oa_basales: string[] | null;
  oa_complementarios: string[] | null;
}

export interface CurriculumOAT {
  id?: string;
  tipo: string;
  codigo: string;
  texto: string;
  nivel: string;
}

export const staticCurriculum = {
  oas: [
  {
    "id": "3f204fd7-b22d-4973-ae86-2344349fd4ca",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 1",
    "texto_oa": "Leer habitualmente para aprender y recrearse, y seleccionar textos de acuerdo con sus preferencias y propósitos.",
    "indicadores": "Leen mensualmente una novela o un libro de cuentos o poemas. Leen semanalmente en clases textos literarios y no literarios. Recomiendan obras de su interés a sus pares a través de exposiciones o comentarios."
  },
  {
    "id": "bc7165ea-948c-42c7-b30a-b53b58c6422e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 10",
    "texto_oa": "Analizar y evaluar textos de los medios de comunicación, como noticias, reportajes, cartas al director, propaganda o crónicas, considerando: los propósitos explícitos e implícitos del texto; las estrategias de persuasión utilizadas en el texto (uso del humor, presencia de estereotipos, apelación a los sentimientos, etc.) y evaluándolas; la veracidad y consistencia de la información; los efectos causados por recursos no lingüísticos presentes en el texto, como diseño, imágenes, disposición gráfica y efectos de audio; similitudes y diferencias en la forma en que distintas fuentes presentan un mismo hecho; qué elementos del texto influyen en las propias opiniones, percepción de sí mismo y opciones que tomamos.",
    "indicadores": "Diferencian entre hecho y opinión en un mensaje de los medios de comunicación; establecen el efecto que producen las imágenes y el sonido que acompaña un texto oral o audiovisual; analizan la pertinencia de la imagen y el sonido que acompaña a un texto; relacionan el tema presentado en un texto de los medios de comunicación con una obra literaria."
  },
  {
    "id": "5f28364d-a07a-41c2-bfe5-ba933d1c3824",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 11",
    "texto_oa": "Leer y comprender textos no literarios para contextualizar y complementar las lecturas literarias realizadas en clases.",
    "indicadores": null
  },
  {
    "id": "223ca6cd-b336-42aa-869f-cd95a14b1e04",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 12",
    "texto_oa": "Aplicar flexiblemente y creativamente las habilidades de escritura adquiridas en clases como medio de expresión personal y cuando se enfrentan a nuevos géneros: investigando las características del género antes de escribir; adecuando el texto a los propósitos de escritura y a la situación.",
    "indicadores": "Escriben narraciones o poemas considerando sus estructuras básicas. Elaboran informes de análisis de textos. Corrigen sus escritos adecuándolos al propósito y destinatario."
  },
  {
    "id": "33a4587f-c565-4979-b14e-7d313a494512",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 13",
    "texto_oa": "Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.) caracterizados por: una presentación clara del tema en que se esbozan los aspectos que se abordarán; una organización y redacción propias de la información; la inclusión de hechos, descripciones, ejemplos o explicaciones que reflejen una reflexión personal sobre el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos y conectores; el uso de imágenes u otros recursos gráficos pertinentes; un cierre coherente con las características del género y el propósito del autor.",
    "indicadores": "Elaboran introducciones que dan cuenta del tema en textos periodísticos. Respaldan su punto de vista con descripciones y hechos. Incorporan información nueva usando recursos anafóricos y conectores. Integran imágenes complementarias y citan información según la norma estipulada."
  },
  {
    "id": "22091a61-3f63-4681-a981-6b140ac79b67",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 14",
    "texto_oa": "Escribir, con el propósito de persuadir, textos de diversos géneros, en particular ensayos sobre los temas o lecturas propuestos para el nivel, caracterizados por: la presentación de una hipótesis o afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente, extraídas de textos literarios y no literarios; la mantención de la coherencia temática; una conclusión coherente con los argumentos presentados; el uso de citas y referencias según un formato previamente acordado.",
    "indicadores": "Elaboran textos que mantienen un eje temático claro. Investigan para obtener evidencias que respalden sus argumentos y referencias para citar."
  },
  {
    "id": "9f3e54e7-3746-4e19-b17b-920175d9db53",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 15",
    "texto_oa": "Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro —específicamente el vocabulario (términos técnicos, frases hechas, palabras propias de redes sociales, expresiones del lenguaje hablado), el uso de la persona gramatical y la estructura del texto— al género discursivo, contexto y destinatario; considerando los conocimientos e intereses del lector al incluir la información; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual; usando conectores adecuados; usando un vocabulario variado y preciso; reconociendo y corrigiendo usos inadecuados (pronombres, conjugaciones verbales, participios irregulares, conectores, concordancia); corrigiendo la ortografía y mejorando la presentación; usando eficazmente las herramientas del procesador de textos.",
    "indicadores": null
  },
  {
    "id": "aa341042-3cb2-4616-81f9-a5c44109a5fa",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 16",
    "texto_oa": "Usar consistentemente el estilo directo y el indirecto en textos escritos y orales: empleando adecuadamente los tiempos verbales en el estilo indirecto; reflexionando sobre el contraste en aspectos formales y de significado entre estilo directo e indirecto, especialmente en textos del ámbito académico.",
    "indicadores": null
  },
  {
    "id": "ed14891c-e163-4701-9420-2c04d6b84708",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 17",
    "texto_oa": "Usar en sus textos recursos de correferencia léxica compleja, empleando adecuadamente la metáfora y la metonimia para este fin.",
    "indicadores": null
  },
  {
    "id": "a7fb591a-94a5-49a4-9a0f-de1cf732b1fe",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 18",
    "texto_oa": "Escribir correctamente para facilitar la comprensión al lector: aplicando todas las reglas de ortografía literal y acentual; verificando la escritura de las palabras cuya ortografía no está sujeta a reglas; usando correctamente punto, coma, raya, dos puntos, paréntesis, puntos suspensivos y comillas.",
    "indicadores": "Escriben textos con ortografía literal, acentual y puntual adecuada. Investigan la escritura correcta de palabras no sujetas a reglas."
  },
  {
    "id": "5607469d-f1b0-4522-82bf-89df54499b25",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 19",
    "texto_oa": "Comprender, comparar y evaluar textos orales y audiovisuales, tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; una ordenación de la información en términos de su relevancia; el contexto en el que se enmarcan los textos; el uso de estereotipos, clichés y generalizaciones; los hechos y las opiniones expresadas y su valor argumentativo; diferentes puntos de vista expresados en los textos; la contribución de imágenes y sonido al significado del texto; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.",
    "indicadores": "Diferencian entre hecho y opinión en mensajes de los medios. Analizan la pertinencia y el efecto de imágenes y sonidos que acompañan a un texto audiovisual. Relacionan temas de los medios con obras literarias."
  },
  {
    "id": "8a8b11e2-28e0-47d2-a59c-e88486014c3a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 2",
    "texto_oa": "Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.",
    "indicadores": null
  },
  {
    "id": "403211b9-8be2-47ec-81bb-ed4e063798a1",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 20",
    "texto_oa": "Resumir un discurso argumentativo escuchado, explicando y evaluando los argumentos usados por el emisor.",
    "indicadores": "Explican oralmente los argumentos principales de panelistas en debates. Evalúan con pautas la calidad de los argumentos de sus compañeros."
  },
  {
    "id": "6c0c389e-b3b6-44d7-845c-5be6493ae05f",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 21",
    "texto_oa": "Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente y usando información que permita cumplir los propósitos establecidos; distinguiendo afirmaciones basadas en evidencias de aquellas que no lo están; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión; negociando acuerdos con los interlocutores; reformulando sus comentarios para desarrollarlos mejor; considerando al interlocutor para la toma de turnos.",
    "indicadores": "Replantean su postura a partir de lo expuesto por otros. Comentan lo expuesto por otros considerando la validez de sus afirmaciones. Respetan instrucciones del moderador en debates."
  },
  {
    "id": "1d9d2dd2-e7e0-47c4-a64c-bcbce6d480b1",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 22",
    "texto_oa": "Expresarse frente a una audiencia de manera clara y adecuada a la situación para comunicar temas de su interés: presentando información fidedigna y que denota una investigación previa; siguiendo una progresión temática clara; relacionando la información ya dicha con la que están explicando; usando un vocabulario que denota dominio del tema; usando conectores adecuados para hilar la presentación; usando material visual que se relacione directamente con lo que se explica y destaque solo lo más relevante.",
    "indicadores": "Incorporan vocabulario nuevo relacionado con el tema. Relacionan ideas mediante conectores adecuados. Elaboran material visual que resume ideas centrales para apoyar sus exposiciones."
  },
  {
    "id": "cf2310b3-52f1-4f00-9e9d-9f32cfeec2b0",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 23",
    "texto_oa": "Analizar los posibles efectos de los elementos lingüísticos, paralingüísticos y no lingüísticos que usa un hablante en una situación determinada.",
    "indicadores": null
  },
  {
    "id": "8adc481f-4690-4a10-9547-9cbc2c3a8bed",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Investigación en Lenguaje y Literatura",
    "codigo_oa": "OA 24",
    "texto_oa": "Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; descartando las páginas de internet que no aportan información útil, usando otras palabras clave para refinar la búsqueda si es necesario; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; evaluando la validez y confiabilidad de las fuentes consultadas; jerarquizando la información encontrada; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.",
    "indicadores": "Determinan temas relativos a literatura o lenguaje para investigar. Seleccionan y comparan información de diferentes fuentes pertinentes. Organizan la información categorizándola de lo general a lo específico. Elaboran una bibliografía completa de las referencias utilizadas. Producen textos (noticias, informes, blogs, etc.) para comunicar hallazgos."
  },
  {
    "id": "af464d20-c44d-42b1-9471-571036812ada",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 3",
    "texto_oa": "Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; un análisis de los personajes que considere su relación con otros personajes, qué dicen, qué se dice de ellos, sus acciones y motivaciones, sus convicciones y los dilemas que enfrentan; la relación de un fragmento de la obra con el total; cómo influye en el relato la narración en primera o tercera persona.",
    "indicadores": "Analizan conflictos, personajes (relaciones, dichos, motivaciones), y la relación de fragmentos con el total de la obra. Comparan obras literarias estableciendo relaciones entre personajes, temas y ambientes."
  },
  {
    "id": "ea3b20ea-223a-4624-b65d-79dd9f497abf",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 4",
    "texto_oa": "Analizar los poemas leídos para enriquecer su comprensión, considerando, cuando sea pertinente: los símbolos presentes en el texto; la actitud del hablante hacia el tema que aborda; el significado o el efecto que produce el uso de lenguaje figurado en el poema; el efecto que tiene el uso de repeticiones (de estructuras, sonidos, palabras o ideas) en el poema; la relación entre los aspectos formales y el significado del poema; relaciones intertextuales con otras obras.",
    "indicadores": "Explican con sus propias palabras los símbolos presentes en el poema. Interpretan el lenguaje figurado y ejemplifican actitudes líricas del hablante. Elaboran comentarios considerando tema, motivos líricos, figuras literarias y tipo de rima."
  },
  {
    "id": "754274d5-3515-4752-82ff-94489f0ff94b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 5",
    "texto_oa": "Analizar los textos dramáticos leídos o vistos, para enriquecer su comprensión, considerando, cuando sea pertinente: el conflicto y qué problema humano se expresa a través de él; un análisis de los personajes principales que considere su evolución, su relación con otros personajes, qué dicen, qué se dice de ellos, lo que hacen, cómo reaccionan, qué piensan y cuáles son sus motivaciones; personajes tipo, símbolos y tópicos literarios; las creencias, prejuicios y estereotipos presentes en el relato, a la luz de la visión de mundo de la época en la que fue escrito y su conexión con el mundo actual; los elementos (hechos, símbolos) que gatillan o anuncian futuros eventos en la tragedia; cómo los elementos propios de la puesta en escena aportan a la comprensión de la obra (iluminación, sonido, vestuario, escenografía, actuación); relaciones intertextuales con otras obras.",
    "indicadores": null
  },
  {
    "id": "da06f6d0-b199-495b-926b-59fac9bfeb0f",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 6",
    "texto_oa": "Comprender la visión de mundo que se expresa a través de las tragedias leídas, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": null
  },
  {
    "id": "5f0165ab-c93e-4082-b510-eca1ac8a8bb7",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 7",
    "texto_oa": "Comprender la relevancia de las obras del Romanticismo, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": null
  },
  {
    "id": "71327979-d11c-4e33-af81-8146bd74ca23",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 8",
    "texto_oa": "Formular una interpretación de los textos literarios leídos o vistos, que sea coherente con su análisis, considerando: una hipótesis sobre el sentido de la obra, que muestre un punto de vista personal, histórico, social o universal; una crítica de la obra sustentada en citas o ejemplos; la presencia o alusión a personajes, temas o símbolos de algún mito, leyenda, cuento folclórico o texto sagrado; la relación de la obra con la visión de mundo y el contexto histórico en el que se ambienta y/o en el que fue creada, ejemplificando dicha relación.",
    "indicadores": "Formulan hipótesis considerando su postura personal, el contexto histórico y la visión de mundo. Investigan narraciones de diferentes culturas (símbolos, personajes, temas) y exponen resultados."
  },
  {
    "id": "8d2eb213-46df-4821-ae44-6b153fe7c41e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "1° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 9",
    "texto_oa": "Analizar y evaluar textos con finalidad argumentativa, como columnas de opinión, cartas, discursos y ensayos, considerando: la tesis, ya sea explícita o implícita, y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; si la información del texto es suficiente y pertinente para sustentar la tesis del autor; la manera en que el autor organiza el texto; con qué intención el autor usa preguntas retóricas, oraciones desiderativas y oraciones dubitativas; su postura personal frente a lo leído y argumentos que la sustenten.",
    "indicadores": "La tesis, ya sea explícita o implícita, y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; si la información del texto es suficiente y pertinente para sustentar la tesis del autor; la manera en que el autor organiza el texto; con qué intención el autor usa preguntas retóricas, oraciones desiderativas y oraciones dubitativas."
  },
  {
    "id": "a356a0b9-f206-4e76-8811-25f2c07e8df4",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 1",
    "texto_oa": "Leer habitualmente para aprender y recrearse, y seleccionar textos de acuerdo con sus preferencias y propósitos.",
    "indicadores": "Establecen criterios para seleccionar las lecturas que realizarán, considerando sus intereses y propósitos, y las características de las obras; evalúan la pertinencia de su selección de textos tras su lectura."
  },
  {
    "id": "ee5f31b1-10ab-474f-a625-59af2638da16",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 10",
    "texto_oa": "Analizar y evaluar textos de los medios de comunicación, como noticias, reportajes, cartas al director, propaganda o crónicas, considerando: los propósitos explícitos e implícitos del texto, justificando con ejemplos sus afirmaciones sobre dichos propósitos; las estrategias de persuasión utilizadas en el texto (uso del humor, presencia de estereotipos, apelación a los sentimientos, etc.) y evaluándolas; las evidencias que se entregan o se omiten para apoyar una afirmación; los efectos causados por recursos no lingüísticos (diseño, imágenes, disposición gráfica, efectos de audio) y lingüísticos (uso de imperativo, figuras literarias, expresiones populares, palabras en otros idiomas, intertextualidad, modalizaciones, etc.) presentes en el texto; similitudes y diferencias en la forma en que distintas fuentes presentan un mismo hecho; qué elementos del texto influyen en las propias opiniones, percepción de sí mismo y opciones que tomamos.",
    "indicadores": "Determinan la relación entre los recursos no lingüísticos, lingüísticos y de persuasión empleados en los textos de los medios de comunicación, con los efectos que podrían provocar sobre los lectores y el propósito que persiguen; evalúan críticamente distintos textos de medios de comunicación, a partir del análisis de sus propósitos, la relación texto-lector, las estrategias de persuasión empleadas, recursos lingüísticos y no lingüísticos, y el uso de la información."
  },
  {
    "id": "c6d07e13-7f39-49ba-8054-30298135f690",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 11",
    "texto_oa": "Leer y comprender textos no literarios para contextualizar y complementar las lecturas literarias realizadas en clases.",
    "indicadores": null
  },
  {
    "id": "f91cc32f-b8bb-43ed-a68a-58ad1366e5eb",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 12",
    "texto_oa": "Aplicar flexiblemente y creativamente las habilidades de escritura adquiridas en clases como medio de expresión personal y cuando se enfrentan a nuevos géneros: investigando las características del género antes de escribir; adecuando el texto a los propósitos de escritura y a la situación.",
    "indicadores": "Determinan el género discursivo adecuado para comunicar sus ideas, considerando el propósito comunicativo, el destinatario y la situación comunicativa; determinan las características que debe tener su discurso para responder a la situación comunicativa, al propósito y al lector; evalúan sus textos de acuerdo a las características del género escogido, características del discurso, la situación comunicativa, el destinatario y el propósito de estos."
  },
  {
    "id": "7274a176-5de3-4693-a5f3-c6a67952fa68",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 13",
    "texto_oa": "Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.) caracterizados por: una presentación clara del tema en que se esbozan los aspectos que se abordarán; una organización y redacción propias de la información; la inclusión de hechos, descripciones, ejemplos o explicaciones que reflejen una reflexión personal sobre el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos y conectores; el uso de recursos variados que favorezcan el interés y la comprensión del lector (anécdotas, citas, síntesis, imágenes, infografías, etc.); un cierre coherente con las características del género y el propósito del autor; el uso de citas y referencias según un formato previamente acordado.",
    "indicadores": "Organizan sus ideas de acuerdo al género, adecuándose a la situación comunicativa y al propósito de explicar; desarrollan las ideas de sus textos incorporando distintas formas discursivas y otros recursos no verbales; relacionan las ideas de sus textos empleando recursos de cohesión como referencias catafóricas y anafóricas, y conectores textuales."
  },
  {
    "id": "471e05f0-a89e-4077-b395-afe18c1cf290",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 14",
    "texto_oa": "Escribir, con el propósito de persuadir, textos de diversos géneros, en particular ensayos sobre los temas o lecturas propuestos para el nivel, caracterizados por: la presentación de una hipótesis o afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente, extraídas de textos literarios y no literarios; el uso de contraargumentos cuando es pertinente; el uso de recursos variados que favorezcan el interés y la comprensión del lector (anécdotas, citas, síntesis, imágenes, infografías, etc.); la mantención de la coherencia temática; una conclusión coherente con los argumentos presentados; el uso de citas y referencias según un formato previamente acordado.",
    "indicadores": null
  },
  {
    "id": "06fb546f-ecc8-4b7f-8839-834bd36513e6",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 15",
    "texto_oa": "Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro —específicamente el vocabulario (términos técnicos, frases hechas, palabras propias de redes sociales, expresiones del lenguaje hablado), el uso de la persona gramatical y la estructura del texto— al género discursivo, contexto y destinatario; considerando los conocimientos e intereses del lector al incluir la información; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual; usando conectores adecuados para unir las secciones del texto y relacionar las ideas dentro de cada párrafo; usando un vocabulario variado y preciso; reconociendo y corrigiendo usos inadecuados (pronombres personales y reflejos, conjugaciones verbales, participios irregulares, conectores, preposiciones, concordancia sujeto-verbo, artículo-sustantivo, sustantivo-adjetivo y complementarios); corrigiendo la ortografía y mejorando la presentación; usando eficazmente las herramientas del procesador de textos.",
    "indicadores": null
  },
  {
    "id": "bb410fff-0852-4bc3-b2fb-35456aded90b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 16",
    "texto_oa": "Usar consistentemente el estilo directo y el indirecto en textos escritos y orales: empleando adecuadamente los tiempos verbales en el estilo indirecto; reflexionando sobre el contraste en aspectos formales y de significado entre estilo directo e indirecto, especialmente en textos del ámbito académico.",
    "indicadores": null
  },
  {
    "id": "bb73a068-e9a7-4d39-8d9a-dceab8aed1d6",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 17",
    "texto_oa": "Emplear frases nominales complejas como recurso para compactar la información y establecer correferencia en textos con finalidad expositiva y argumentativa.",
    "indicadores": null
  },
  {
    "id": "4c6cfeba-df14-4ece-99f3-53b5eb563c05",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 18",
    "texto_oa": "Escribir correctamente para facilitar la comprensión al lector: aplicando todas las reglas de ortografía literal y acentual; verificando la escritura de las palabras cuya ortografía no está sujeta a reglas; usando correctamente el punto, coma, raya, dos puntos, paréntesis, puntos suspensivos, comillas y punto y coma.",
    "indicadores": null
  },
  {
    "id": "0beda82a-17da-49a1-8913-ed1ddae26104",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 19",
    "texto_oa": "Comprender, comparar y evaluar textos orales y audiovisuales, tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; una ordenación de la información en términos de su relevancia; el contexto en el que se enmarcan los textos; el uso de estereotipos, clichés y generalizaciones; los argumentos y elementos de persuasión que usa el hablante para sostener una postura; diferentes puntos de vista expresados en los textos; la contribución de imágenes y sonido al significado del texto; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.",
    "indicadores": "Evalúan sus intervenciones orales conforme a criterios discursivos y de la situación comunicativa, considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; una ordenación de la información en términos de su relevancia; el contexto en el que se enmarcan los textos; el uso de estereotipos, clichés y generalizaciones; los argumentos y elementos de persuasión que usa el hablante para sostener una postura; diferentes puntos de vista expresados en los textos; la contribución de imágenes y sonido al significado del texto; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y los temas y obras estudiados durante el curso."
  },
  {
    "id": "40eab843-26e0-42f8-9a33-dc3e84d778da",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 2",
    "texto_oa": "Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.",
    "indicadores": null
  },
  {
    "id": "39a0b39d-2f04-4255-b67c-c3d138777bcd",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 20",
    "texto_oa": "Evaluar el punto de vista de un emisor, su razonamiento y uso de recursos retóricos (vocabulario, organización de las ideas, desarrollo y progresión de los argumentos, etc.).",
    "indicadores": "Evalúan los recursos discursivos (coherencia, uso del vocabulario, progresión de sus argumentos) de un emisor al plantear y fundamentar su punto de vista; determinan el punto de vista del emisor considerando el desarrollo argumentativo."
  },
  {
    "id": "af9fab64-0ca7-46e3-843b-fbedd16804c8",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 21",
    "texto_oa": "Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente y usando información que permita cumplir los propósitos establecidos; distinguiendo afirmaciones basadas en evidencias de aquellas que no lo están; retomando lo dicho por otros a través del parafraseo antes de contribuir con una idea nueva o refutar un argumento; negociando acuerdos con los interlocutores; reformulando sus comentarios para desarrollarlos mejor; considerando al interlocutor para la toma de turnos.",
    "indicadores": "Incorporan en sus intervenciones las ideas planteadas por otros para refutarlas, ampliarlas o tomar acuerdos, conforme el propósito y características de la situación comunicativa, manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente y usando información que permita cumplir los propósitos establecidos; distinguiendo afirmaciones basadas en evidencias de aquellas que no lo están; retomando lo dicho por otros a través del parafraseo antes de contribuir con una idea nueva o refutar un argumento; negociando acuerdos con los interlocutores; reformulando sus comentarios para desarrollarlos mejor; considerando al interlocutor para la toma de turnos."
  },
  {
    "id": "b109c2b7-2e6e-4889-9161-29064dbda2b7",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 22",
    "texto_oa": "Expresarse frente a una audiencia de manera clara y adecuada a la situación para comunicar temas de su interés: presentando información fidedigna y que denota una investigación previa; siguiendo una progresión temática clara; graduando la cantidad de información para mantener el interés de la audiencia; usando un vocabulario que denota dominio del tema; usando conectores adecuados para hilar la presentación; usando material visual que se relacione directamente con lo que se explica y destaque solo lo más relevante.",
    "indicadores": null
  },
  {
    "id": "65029aac-dbbd-42a4-8cb8-4c200d6cea0b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 23",
    "texto_oa": "Analizar los posibles efectos de los elementos lingüísticos, paralingüísticos y no lingüísticos que usa un hablante en una situación determinada.",
    "indicadores": "Determinan la función que juegan los recursos del lenguaje verbal, paraverbal y no verbal en situaciones comunicativas orales."
  },
  {
    "id": "d8628bbd-983f-4800-ab6a-8433b5614b88",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Investigación en Lenguaje y Literatura",
    "codigo_oa": "OA 24",
    "texto_oa": "Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; seleccionando páginas y fuentes según la profundidad y la cobertura de la información que buscan; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; evaluando la validez y confiabilidad de las fuentes consultadas; jerarquizando la información encontrada en las fuentes investigadas; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.",
    "indicadores": "Evaluando la validez y confiabilidad de las fuentes consultadas; jerarquizando la información encontrada en las fuentes investigadas; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos."
  },
  {
    "id": "b81dcaf0-261a-464f-9d15-8caf8b12e0e1",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 3",
    "texto_oa": "Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; un análisis de los personajes que considere su relación con otros personajes, qué dicen, qué se dice de ellos, sus acciones y motivaciones, sus convicciones y los dilemas que enfrentan; la relación de un fragmento de la obra con el total; cómo el relato está influido por la visión del narrador; personajes tipo (por ejemplo, el pícaro, el avaro, el seductor, la madrastra, etc.), símbolos y tópicos literarios presentes en el texto; las creencias, prejuicios y estereotipos presentes en el relato, a la luz de la visión de mundo de la época en la que fue escrito y su conexión con el mundo actual; el efecto producido por recursos como flashback, indicios, caja china (historia dentro de una historia), historia paralela; relaciones intertextuales con otras obras.",
    "indicadores": "Analizan el planteamiento de los personajes de las narraciones leídas, considerando sus características, relaciones entre ellos, sus diálogos, mundo personal y social, y sus conflictos y motivaciones; relacionan las creencias, prejuicios y estereotipos presentes en las narraciones leídas con la visión de mundo de su contexto de producción, el contexto actual y sus experiencias de lectura; interpretan el sentido de los recursos narrativos y las relaciones de intertextualidad dadas en las narraciones leídas."
  },
  {
    "id": "3b9ad6e3-0ac8-45c9-bdc2-7b368370b7c5",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 4",
    "texto_oa": "Analizar los poemas leídos para enriquecer su comprensión, considerando, cuando sea pertinente: los símbolos presentes en el texto y su relación con la totalidad del poema; la actitud del hablante hacia el tema que aborda; el significado o el efecto que produce el uso de lenguaje figurado en el poema; el efecto que tiene el uso de repeticiones (de estructuras, sonidos, palabras o ideas) en el poema; la relación que hay entre un fragmento y el total del poema; relaciones intertextuales con otras obras; las características del soneto.",
    "indicadores": null
  },
  {
    "id": "a6f83654-74d7-4420-80a0-d0044df3af69",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 5",
    "texto_oa": "Analizar los textos dramáticos leídos o vistos, para enriquecer su comprensión, considerando, cuando sea pertinente: el conflicto y qué problema humano se expresa a través de él; un análisis de los personajes principales que considere su evolución, su relación con otros personajes, qué dicen, qué se dice de ellos, lo que hacen, cómo reaccionan, qué piensan y cuáles son sus motivaciones; personajes tipo, símbolos y tópicos literarios; las creencias, prejuicios y estereotipos presentes en el relato, a la luz de la visión de mundo de la época en la que fue escrito y su conexión con el mundo actual; la atmósfera de la obra y cómo se construye a través de los diálogos, los monólogos, las acciones y las acotaciones; cómo los elementos propios de la puesta en escena aportan a la comprensión de la obra (iluminación, sonido, vestuario, escenografía, actuación); relaciones intertextuales con otras obras.",
    "indicadores": null
  },
  {
    "id": "71c5026f-1827-463b-8757-6decb40467e9",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 6",
    "texto_oa": "Comprender la relevancia de las obras del Siglo de Oro, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": null
  },
  {
    "id": "332f10af-91af-4b7d-80cb-0d6ea3115bfd",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 7",
    "texto_oa": "Leer y comprender cuentos latinoamericanos modernos y contemporáneos, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": null
  },
  {
    "id": "d52b0d02-213e-4dd0-ba48-b315feafb21b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 8",
    "texto_oa": "Formular una interpretación de los textos literarios leídos o vistos, que sea coherente con su análisis, considerando: una hipótesis sobre el sentido de la obra, que muestre un punto de vista personal, histórico, social o universal; una crítica de la obra sustentada en citas o ejemplos; los antecedentes culturales que influyen en la visión que refleja la obra sobre temas como el destino, la muerte, la trascendencia, la guerra u otros; la relación de la obra con la visión de mundo y el contexto histórico en el que se ambienta y/o en el que fue creada, ejemplificando dicha relación.",
    "indicadores": null
  },
  {
    "id": "0501b582-d376-46b7-b646-8cacd10f4f28",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "2° Medio",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 9",
    "texto_oa": "Analizar y evaluar textos con finalidad argumentativa, como columnas de opinión, cartas al director, discursos y ensayos, considerando: la tesis, ya sea explícita o implícita, y los argumentos e información que la sostienen; los recursos emocionales que usa el autor para persuadir o convencer al lector, y evaluándolos; fallas evidentes en la argumentación (por ejemplo, exageración, estereotipos, generalizaciones, descalificaciones personales, entre otras); el efecto que produce el uso de modalizadores en el grado de certeza con que se presenta la información; la manera en que el autor organiza el texto; con qué intención el autor usa distintos elementos léxicos valorativos y figuras retóricas; su postura personal frente a lo leído, refutando o apoyando los argumentos que la sustentan.",
    "indicadores": null
  },
  {
    "id": "33dbbf90-7a60-4c7e-8f6d-fcba03e9b0cb",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 1",
    "texto_oa": "Leer de manera fluida textos variados apropiados a su edad: pronunciando las palabras con precisión; respetando la prosodia indicada por todos los signos de puntuación; decodificando de manera automática la mayoría de las palabras del texto.",
    "indicadores": "Leen en voz alta, de forma individual y colectiva: diciendo todas las palabras sin error y de manera fluida; poniendo énfasis en aquello que el sentido del texto exige; respetando signos de puntuación (punto, coma, signos de exclamación y de interrogación); manteniendo una velocidad que demuestre decodificación automática de la mayoría de las palabras."
  },
  {
    "id": "a716de99-d7c2-4285-8fdc-b7b11003a58a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 10",
    "texto_oa": "Asistir habitualmente a la biblioteca para satisfacer diversos propósitos (seleccionar textos, investigar sobre un tema, informarse sobre actualidad, etc.), adecuando su comportamiento y cuidando el material para permitir el trabajo y la lectura de los demás.",
    "indicadores": null
  },
  {
    "id": "2c28112a-12c0-462d-a3ce-d83322a76a3b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 11",
    "texto_oa": "Buscar y seleccionar la información más relevante sobre un tema en internet, libros, diarios, revistas, enciclopedias, atlas, etc., para llevar a cabo una investigación.",
    "indicadores": null
  },
  {
    "id": "885aba5d-68e9-41e9-98d8-9dbc8febece3",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 12",
    "texto_oa": "Aplicar estrategias para determinar el significado de palabras nuevas: claves del texto (para determinar qué acepción es pertinente según el contexto); raíces y afijos; preguntar a otro; diccionarios, enciclopedias e internet.",
    "indicadores": null
  },
  {
    "id": "33da8f26-e0c5-495f-961c-9b8b05679b8e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 13",
    "texto_oa": "Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas, textos como poemas, diarios de vida, cuentos, anécdotas, cartas, blogs, etc.",
    "indicadores": null
  },
  {
    "id": "bf3bf264-6f27-4dcf-8121-8efef88423aa",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 14",
    "texto_oa": "Escribir creativamente narraciones (relatos de experiencias personales, noticias, cuentos, etc.) que: tengan una estructura clara; utilicen conectores adecuados; incluyan descripciones y diálogo (si es pertinente) para desarrollar la trama, los personajes y el ambiente.",
    "indicadores": null
  },
  {
    "id": "45adb847-763a-4d01-b6ec-41c2d1cfaf6a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 15",
    "texto_oa": "Escribir artículos informativos para comunicar información sobre un tema: presentando el tema en una oración; desarrollando una idea central por párrafo; agregando las fuentes utilizadas.",
    "indicadores": "Eligen un tema interesante sobre las lecturas realizadas en clases y registran información para desarrollarlo; elaboran una introducción para presentar el tema al lector; desarrollan el tema en al menos tres párrafos en los que: elaboran un subtema y lo ilustran con ejemplos, datos o explicaciones; incorporan datos, descripciones, ejemplos o reflexiones provenientes de los textos leídos; describen hechos relevantes y acordes con el tema elegido; incluyen palabras y expresiones específicas del tema tratado."
  },
  {
    "id": "4ef273a7-cdda-46d1-96b8-dc51f2cd3934",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 16",
    "texto_oa": "Escribir frecuentemente para compartir impresiones sobre sus lecturas, desarrollando un tema relevante del texto leído y fundamentando sus comentarios con ejemplos.",
    "indicadores": null
  },
  {
    "id": "868fedf9-df32-43d7-ae3d-1485370fa38c",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 17",
    "texto_oa": "Planificar sus textos: estableciendo propósito y destinatario; generando ideas a partir de sus conocimientos e investigación; organizando las ideas que compondrán su escrito.",
    "indicadores": null
  },
  {
    "id": "42e19c83-d4b6-4f3e-8a9b-d0ddece05ebe",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 18",
    "texto_oa": "Escribir, revisar y editar sus textos para satisfacer un propósito y transmitir sus ideas con claridad. Durante este proceso: desarrollan las ideas agregando información; emplean un vocabulario preciso y variado, y un registro adecuado; releen a medida que escriben; aseguran la coherencia y agregan conectores; editan, en forma independiente, aspectos de ortografía y presentación; utilizan las herramientas del procesador de textos para buscar sinónimos, corregir ortografía y gramática, y dar formato (cuando escriben en computador).",
    "indicadores": "Desarrollan las ideas agregando información; emplean un vocabulario preciso y variado, y un registro adecuado; releen a medida que escriben; aseguran la coherencia y agregan conectores; editan, en forma independiente, aspectos de ortografía y presentación."
  },
  {
    "id": "11bb25f4-08ae-4394-aaf6-3ff8877e8b30",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 19",
    "texto_oa": "Incorporar de manera pertinente en la escritura el vocabulario nuevo extraído de textos escuchados o leídos.",
    "indicadores": null
  },
  {
    "id": "dcaa02d3-a73b-43a0-8add-8bb66c97d548",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 2",
    "texto_oa": "Comprender textos aplicando estrategias de comprensión lectora; por ejemplo: relacionar la información del texto con sus experiencias y conocimientos; releer lo que no fue comprendido; formular preguntas sobre lo leído y responderlas; identificar las ideas más importantes de acuerdo con el propósito del lector; organizar la información en esquemas o mapas conceptuales.",
    "indicadores": null
  },
  {
    "id": "1fa9f4ae-24f3-4c02-b251-29721409fc51",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 20",
    "texto_oa": "Distinguir matices entre sinónimos al leer, hablar y escribir para ampliar su comprensión y capacidad expresiva.",
    "indicadores": null
  },
  {
    "id": "a61c400f-02a8-4ec7-8a21-9ab30d9425dc",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 21",
    "texto_oa": "Conjugar correctamente los verbos regulares al utilizarlos en sus producciones escritas.",
    "indicadores": null
  },
  {
    "id": "e4955ce2-ea0b-4990-bd9e-45466455bee3",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 22",
    "texto_oa": "Escribir correctamente para facilitar la comprensión por parte del lector, aplicando las reglas ortográficas aprendidas en años anteriores, además de: uso de c-s-z; raya para indicar diálogo; acento diacrítico y dierético; coma en frases explicativas.",
    "indicadores": "Escriben raya antes de cada intervención en un diálogo; escriben las frases explicativas entre comas; escriben aplicando las reglas de ortografía literal, acentual y de puntuación."
  },
  {
    "id": "b1bdd3a4-b19f-4b12-8364-6fe739391afd",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 23",
    "texto_oa": "Comprender y disfrutar versiones completas de obras de la literatura, narradas o leídas por un adulto, como: cuentos folclóricos y de autor; poemas; mitos y leyendas; capítulos de novelas.",
    "indicadores": "Relacionan aspectos de un texto escuchado y comentado en clases con otros textos leídos o escuchados previamente; explican qué les gustó o no de un texto escuchado en clases; solicitan lecturas similares a las escuchadas."
  },
  {
    "id": "477c88f4-283b-4c9b-a255-e988ea89818a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 24",
    "texto_oa": "Comprender textos orales para obtener información y desarrollar su curiosidad por el mundo: relacionando las ideas escuchadas con sus experiencias personales y sus conocimientos previos; extrayendo y registrando la información relevante.",
    "indicadores": null
  },
  {
    "id": "fea06a2b-bad9-4a62-bd87-682d7897266d",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 25",
    "texto_oa": "Apreciar obras de teatro, películas o representaciones: discutiendo aspectos relevantes de la historia; describiendo a los personajes según su manera de hablar y de comportarse.",
    "indicadores": null
  },
  {
    "id": "33a4d325-4632-4e14-b3f2-64fd9f761cdf",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 26",
    "texto_oa": "Dialogar para compartir y desarrollar ideas y buscar acuerdos: manteniendo el foco en un tema; aceptando sugerencias; haciendo comentarios en los momentos adecuados; mostrando acuerdo o desacuerdo con respeto; fundamentando su postura.",
    "indicadores": null
  },
  {
    "id": "bf187538-473d-4274-bd0d-29c4a4c9d666",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 27",
    "texto_oa": "Interactuar de acuerdo con las convenciones sociales en diferentes situaciones: presentarse a sí mismo y a otros; saludar; preguntar; expresar opiniones, sentimientos e ideas; otras situaciones que requieran el uso de fórmulas de cortesía como por favor, gracias, perdón, permiso.",
    "indicadores": "Usan las convenciones de cortesía en sus interacciones de la vida cotidiana; adecuan el registro y el vocabulario según la situación comunicativa."
  },
  {
    "id": "065dc685-fcb1-4568-a4fa-f788532b2a57",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 28",
    "texto_oa": "Expresarse de manera clara y efectiva en exposiciones orales para comunicar temas de su interés: presentando las ideas de manera coherente y cohesiva; fundamentando sus planteamientos con ejemplos y datos; organizando las ideas en introducción, desarrollo y cierre; utilizando un vocabulario variado y preciso y un registro formal, adecuado a la situación comunicativa; reemplazando algunas construcciones sintácticas familiares por otras más variadas; conjugando correctamente los verbos; pronunciando claramente y usando un volumen audible, entonación, pausas y énfasis adecuados; usando gestos y posturas acordes a la situación; usando material de apoyo (power point, papelógrafo, objetos, etc.) de manera efectiva.",
    "indicadores": null
  },
  {
    "id": "bd679ac8-a32d-4bc1-aa2a-c25b65401417",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 29",
    "texto_oa": "Incorporar de manera pertinente en sus intervenciones orales el vocabulario nuevo extraído de textos escuchados o leídos.",
    "indicadores": null
  },
  {
    "id": "a6471683-be05-45ad-9f90-d4a4d2b3f0fc",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 3",
    "texto_oa": "Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo, desarrollar su imaginación y reconocer su valor social y cultural; por ejemplo: cuentos folclóricos y de autor, historietas, poemas, fábulas, leyendas, mitos, novelas, otros.",
    "indicadores": "Relacionan situaciones de la vida cotidiana con versos de los textos leídos en clases o independientemente."
  },
  {
    "id": "025b157e-2522-4878-bca8-2f8097e9690c",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 30",
    "texto_oa": "Producir textos orales planificados de diverso tipo para desarrollar su capacidad expresiva: poemas; narraciones (contar una historia, describir una actividad, relatar noticias, testimonios, etc.).",
    "indicadores": null
  },
  {
    "id": "d7cf583f-5b59-4c14-bbcc-b47467d14230",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 4",
    "texto_oa": "Analizar aspectos relevantes de narraciones leídas para profundizar su comprensión: interpretando el lenguaje figurado presente en el texto; expresando opiniones sobre las actitudes y acciones de los personajes y fundamentándolas con ejemplos del texto; determinando las consecuencias de hechos o acciones; describiendo el ambiente y las costumbres representadas en el texto; explicando las características físicas y sicológicas de los personajes que son relevantes para el desarrollo de la historia; comparando textos de autores diferentes y justificando su preferencia por alguno.",
    "indicadores": null
  },
  {
    "id": "f53217e1-b1a6-478b-b9f4-7299f0d1682e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 5",
    "texto_oa": "Analizar aspectos relevantes de diversos poemas para profundizar su comprensión: explicando cómo el lenguaje poético que emplea el autor apela a los sentidos, sugiere estados de ánimo y crea imágenes en el lector; identificando personificaciones y comparaciones y explicando su significado dentro del poema; analizando poemas leídos en clases.",
    "indicadores": null
  },
  {
    "id": "d3f21c3a-517d-4753-9114-94e83c522120",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 6",
    "texto_oa": "Leer independientemente y comprender textos no literarios (cartas, biografías, relatos históricos, libros y artículos informativos, noticias, etc.) para ampliar su conocimiento del mundo y formarse una opinión: extrayendo información explícita e implícita; haciendo inferencias a partir de la información del texto y de sus experiencias y conocimientos; relacionando la información de imágenes, gráficos, tablas, mapas o diagramas, con el texto en el cual están insertos; interpretando expresiones en lenguaje figurado; comparando información; formulando una opinión sobre algún aspecto de la lectura; fundamentando su opinión con información del texto o sus conocimientos previos.",
    "indicadores": "Identifican las ideas más importantes de acuerdo con el propósito del lector; organizan la información en esquemas o mapas conceptuales."
  },
  {
    "id": "242def7a-bd05-4272-82a6-36504aa66e6b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 7",
    "texto_oa": "Evaluar críticamente la información presente en textos de diversa procedencia: determinando quién es el emisor, cuál es su propósito y a quién dirige el mensaje; evaluando si un texto entrega suficiente información para responder una determinada pregunta o cumplir un propósito.",
    "indicadores": "Identifican al autor y explican cuál es su intención al publicar ese texto; mencionan y fundamentan a qué público está dirigido el texto; explican si la información presente en un texto satisface su propósito de lectura o si necesitan consultar más fuentes."
  },
  {
    "id": "64531a21-c5b7-4510-9b75-cda955b826bd",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 8",
    "texto_oa": "Sintetizar y registrar las ideas principales de textos leídos para satisfacer propósitos como estudiar, hacer una investigación, recordar detalles, etc.",
    "indicadores": "Subrayan o registran la información relevante en un texto para distinguirla de la información accesoria; parafrasean con sus palabras un texto leído; completan organizadores gráficos dados por el docente con la información escuchada en clases."
  },
  {
    "id": "7d2b3477-90e2-4ef5-9669-36b1bfbde2df",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "5° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 9",
    "texto_oa": "Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos.",
    "indicadores": "Leen libros para entretenerse, para encontrar información o con otros propósitos; leen periódicos, revistas y artículos en internet para informarse e investigar; leen sin distraerse; comentan sus lecturas; comparten los libros que les han gustado; expresan por qué les gustó un texto leído."
  },
  {
    "id": "1becda7c-d28a-496b-9cf9-304ec4a9ad6f",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 1",
    "texto_oa": "Leer de manera fluida textos variados apropiados a su edad: pronunciando las palabras con precisión; respetando la prosodia indicada por todos los signos de puntuación; decodificando de manera automática la mayoría de las palabras del texto.",
    "indicadores": "Leen en voz alta: diciendo todas las palabras sin error y de manera fluida; poniendo énfasis en aquello que el sentido del texto exige; respetando signos de puntuación (punto, coma, signos de exclamación y de interrogación); manteniendo una velocidad que demuestre decodificación automática de la mayoría de las palabras."
  },
  {
    "id": "b8745049-446d-40b6-ab5d-7127362ca01d",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 10",
    "texto_oa": "Asistir habitualmente a la biblioteca para satisfacer diversos propósitos (seleccionar textos, investigar sobre un tema, informarse sobre actualidad, etc.), adecuando su comportamiento y cuidando el material para permitir el trabajo y la lectura de los demás.",
    "indicadores": null
  },
  {
    "id": "a8f8755b-6460-45b2-9ee7-11d9a7cfbfc0",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 11",
    "texto_oa": "Buscar y comparar información sobre un tema, utilizando fuentes como internet, enciclopedias, libros, prensa, etc., para llevar a cabo una investigación.",
    "indicadores": null
  },
  {
    "id": "24ccc469-9f6b-419a-95fa-b04867546e6f",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 12",
    "texto_oa": "Aplicar estrategias para determinar el significado de palabras nuevas: claves contextuales; raíces y afijos; preguntar a otro; diccionarios, enciclopedias e internet.",
    "indicadores": null
  },
  {
    "id": "3df371c8-6b88-4d04-a005-ceeea482524c",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 13",
    "texto_oa": "Escribir frecuentemente, para desarrollar la creatividad y expresar sus ideas, textos como poemas, diarios de vida, cuentos, anécdotas, cartas, blogs, etc.",
    "indicadores": null
  },
  {
    "id": "0da11cae-312b-4ad9-adcd-5c351860a934",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 14",
    "texto_oa": "Escribir creativamente narraciones (relatos de experiencias personales, noticias, cuentos, etc.) que: tengan una estructura clara; utilicen conectores adecuados; incluyan descripciones y diálogos (si es pertinente) para desarrollar la trama, los personajes y el entorno.",
    "indicadores": null
  },
  {
    "id": "ff566a01-1930-4fed-b3f0-2a07ed5e8068",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 15",
    "texto_oa": "Escribir artículos informativos para comunicar información sobre un tema: organizando el texto en una estructura clara; desarrollando una idea central por párrafo; agregando las fuentes utilizadas.",
    "indicadores": null
  },
  {
    "id": "e97e3b2d-7f27-46a5-bf9e-9b793bce0e70",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 16",
    "texto_oa": "Escribir frecuentemente para compartir impresiones sobre sus lecturas, desarrollando un tema relevante del texto leído y fundamentando sus comentarios con ejemplos.",
    "indicadores": "Escriben comentarios de al menos dos párrafos en los que: expresan una postura sobre un personaje o una situación de un texto leído; fundamentan su postura con ejemplos del texto y apuntes de su cuaderno. Escriben comentarios de al menos dos párrafos, en los que destacan qué aprendieron luego de la lectura de un texto y describen por qué es relevante esta información."
  },
  {
    "id": "414070c8-b540-4fef-9993-ebfc65ed9adb",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 17",
    "texto_oa": "Planificar sus textos: estableciendo propósito y destinatario; generando ideas a partir de sus conocimientos e investigación; organizando las ideas que compondrán su escrito.",
    "indicadores": null
  },
  {
    "id": "179cfc6c-ade0-4996-a789-8bdedf529a5a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 18",
    "texto_oa": "Escribir, revisar y editar sus textos para satisfacer un propósito y transmitir sus ideas con claridad. Durante este proceso: agregan ejemplos, datos y justificaciones para profundizar las ideas; emplean un vocabulario preciso y variado, y un registro adecuado; releen a medida que escriben; aseguran la coherencia y agregan conectores; editan, en forma independiente, aspectos de ortografía y presentación; utilizan las herramientas del procesador de textos para buscar sinónimos, corregir ortografía y gramática, y dar formato (cuando escriben en computador).",
    "indicadores": null
  },
  {
    "id": "0ce6559d-418b-4e70-b419-562958c5cb17",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 19",
    "texto_oa": "Incorporar de manera pertinente en la escritura el vocabulario nuevo extraído de textos escuchados o leídos.",
    "indicadores": null
  },
  {
    "id": "c07278c3-a1df-42dc-9da9-52c070f2c331",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 2",
    "texto_oa": "Comprender textos aplicando estrategias de comprensión lectora; por ejemplo: relacionar la información del texto con sus experiencias y conocimientos; releer lo que no fue comprendido; formular preguntas sobre lo leído y responderlas; organizar la información en esquemas o mapas conceptuales; resumir.",
    "indicadores": null
  },
  {
    "id": "327a48b8-0ee2-4443-8c43-fea16bdbba30",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 20",
    "texto_oa": "Ampliar su capacidad expresiva, utilizando los recursos que ofrece el lenguaje para expresar un mismo mensaje de diversas maneras; por ejemplo: sinónimos, hipónimos e hiperónimos; locuciones; comparaciones; otros.",
    "indicadores": null
  },
  {
    "id": "c41b17a9-8755-4517-aabe-6c65ced36ef6",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 21",
    "texto_oa": "Utilizar correctamente los participios irregulares (por ejemplo, roto, abierto, dicho, escrito, muerto, puesto, vuelto) en sus producciones escritas.",
    "indicadores": null
  },
  {
    "id": "1890e1d4-4da7-4b7d-8151-8d92c8533aea",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Escritura",
    "codigo_oa": "OA 22",
    "texto_oa": "Escribir correctamente para facilitar la comprensión por parte del lector, aplicando todas las reglas de ortografía literal, acentual y puntual aprendidas en años anteriores, además de: escritura de los verbos haber, tener e ir, en los tiempos más utilizados; coma en frases explicativas; coma en presencia de conectores que la requieren; acentuación de pronombres interrogativos y exclamativos.",
    "indicadores": "Añaden coma en sus textos cuando es necesario; explican por qué usaron coma en una determinada oración; escriben aplicando las reglas de ortografía literal, acentual y de puntuación."
  },
  {
    "id": "9750b191-5ad5-4989-b7c6-c0ac8816ba7b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 23",
    "texto_oa": "Comprender y disfrutar versiones completas de obras de la literatura, narradas o leídas por un adulto, como: cuentos folclóricos y de autor; poemas; mitos y leyendas; capítulos de novelas.",
    "indicadores": null
  },
  {
    "id": "8eea304f-59bf-4ded-9036-5d4e7be6a133",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 24",
    "texto_oa": "Comprender textos orales para obtener información y desarrollar su curiosidad por el mundo: relacionando las ideas escuchadas con sus experiencias personales y sus conocimientos previos; extrayendo y registrando la información relevante.",
    "indicadores": "Escriben un resumen de un texto escuchado en clases; registran información de un texto escuchado que les sirva para un determinado propósito; expresan, oralmente o por escrito, apreciaciones y/o conclusiones generales sobre lo escuchado."
  },
  {
    "id": "b47be7b2-67f9-4393-8f2d-ffb758eaaeb9",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 25",
    "texto_oa": "Evaluar críticamente mensajes publicitarios: identificando al emisor; explicando cuál es la intención del emisor; identificando a quién está dirigido el mensaje (a niñas, a usuarios del metro, a adultos mayores, etc.) y fundamentando cómo llegaron a esa conclusión.",
    "indicadores": null
  },
  {
    "id": "20e04b71-003b-4526-9da7-22304a0808ff",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 26",
    "texto_oa": "Apreciar obras de teatro, películas o representaciones: discutiendo aspectos relevantes de la historia; describiendo cómo los actores cambian sus tonos de voz y su gestualidad para expresar diversas emociones; identificando algunos recursos que buscan provocar un efecto en la audiencia (efectos de sonido, música, efectos de iluminación, etc.).",
    "indicadores": null
  },
  {
    "id": "c68b02a2-318a-4377-b62f-351c8ae98971",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 27",
    "texto_oa": "Dialogar para compartir y desarrollar ideas y buscar acuerdos: manteniendo el foco en un tema; complementando las ideas de otro y ofreciendo sugerencias; aceptando sugerencias; haciendo comentarios en los momentos adecuados; mostrando acuerdo o desacuerdo con respeto; fundamentando su postura.",
    "indicadores": "Comparten sus opiniones sobre los textos leídos o escuchados en clases; opinan sobre temas diversos sustentando sus argumentos con ejemplos de su experiencia personal o conocimiento previo."
  },
  {
    "id": "45c96707-8e62-4164-9fd3-8927eef34a15",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 28",
    "texto_oa": "Interactuar de acuerdo con las convenciones sociales en diferentes situaciones: presentarse a sí mismo y a otros; saludar; preguntar; expresar opiniones, sentimientos e ideas; otras situaciones que requieran el uso de fórmulas de cortesía, como por favor, gracias, perdón, permiso.",
    "indicadores": null
  },
  {
    "id": "2362c74e-b911-4474-8e50-b003f2608b9c",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 29",
    "texto_oa": "Expresarse de manera clara y efectiva en exposiciones orales para comunicar temas de su interés: presentando las ideas de manera coherente y cohesiva; fundamentando sus planteamientos con ejemplos y datos; organizando las ideas en introducción, desarrollo y cierre; usando elementos de cohesión para relacionar cada parte de la exposición; utilizando un vocabulario variado y preciso y un registro formal adecuado a la situación comunicativa; reemplazando algunas construcciones sintácticas familiares por otras más variadas; conjugando correctamente los verbos; utilizando correctamente los participios irregulares; pronunciando claramente y usando un volumen audible, entonación, pausas y énfasis adecuados; usando gestos y posturas acordes a la situación; usando material de apoyo (power point, papelógrafo, objetos, etc.) de manera efectiva; exponiendo sin leer de un texto escrito.",
    "indicadores": null
  },
  {
    "id": "c809fcdd-1f52-407e-969d-41c25d455d56",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 3",
    "texto_oa": "Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo, desarrollar su imaginación y reconocer su valor social y cultural; por ejemplo: cuentos folclóricos y de autor, novelas, poemas, otros.",
    "indicadores": "Relacionan situaciones de la vida cotidiana con versos de los textos leídos en clases o independientemente."
  },
  {
    "id": "a329710b-ba3d-477f-9e2a-a8a18b8630d4",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 30",
    "texto_oa": "Incorporar de manera pertinente en sus intervenciones orales el vocabulario nuevo extraído de textos escuchados o leídos.",
    "indicadores": null
  },
  {
    "id": "07b0b5d5-d219-499a-b599-718130a79adf",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 31",
    "texto_oa": "Producir textos orales espontáneos o planificados de diverso tipo para desarrollar su capacidad expresiva: poemas.",
    "indicadores": "Recitan poemas o versos de memoria, usando adecuadamente el lenguaje paraverbal y no verbal."
  },
  {
    "id": "4af58301-b4bb-48f6-95c2-999caad8aaf8",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 4",
    "texto_oa": "Analizar aspectos relevantes de las narraciones leídas para profundizar su comprensión: identificando las acciones principales del relato y explicando cómo influyen en el desarrollo de la historia; explicando las actitudes y reacciones de los personajes de acuerdo con sus motivaciones y las situaciones que viven.",
    "indicadores": null
  },
  {
    "id": "40ca6d09-b72a-4e12-8ce3-cc452d3b136a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 5",
    "texto_oa": "Analizar aspectos relevantes de diversos poemas para profundizar su comprensión: explicando cómo el lenguaje poético que emplea el autor apela a los sentidos, sugiere estados de ánimo y crea imágenes en el lector; identificando personificaciones, comparaciones e hipérboles y explicando su significado dentro del poema.",
    "indicadores": null
  },
  {
    "id": "bc74900b-b1e3-4efc-9927-8b03b386d9c7",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 6",
    "texto_oa": "Leer independientemente y comprender textos no literarios (cartas, biografías, relatos históricos, libros y artículos informativos, noticias, etc.) para ampliar su conocimiento del mundo y formarse una opinión: extrayendo información explícita e implícita; haciendo inferencias a partir de la información del texto y de sus experiencias y conocimientos; relacionando la información de imágenes, gráficos, tablas, mapas o diagramas, con el texto en el cual están insertos; interpretando expresiones en lenguaje figurado; comparando información entre dos textos del mismo tema; formulando una opinión sobre algún aspecto de la lectura; fundamentando su opinión con información del texto o sus conocimientos previos.",
    "indicadores": "Mencionan qué información no concuerda con sus conocimientos previos (si es pertinente); marcan los párrafos que no comprenden y los releen; subrayan las palabras que no comprenden y que impiden entender el sentido del fragmento y averiguan su significado; escriben preguntas al margen del texto sobre lo que no comprenden o lo que quieren profundizar; parafrasean, oralmente o por escrito, la información más importante de cada párrafo."
  },
  {
    "id": "272506da-d8c7-4793-ad44-8820869e2036",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 7",
    "texto_oa": "Evaluar críticamente la información presente en textos de diversa procedencia: determinando quién es el emisor, cuál es su propósito y a quién dirige el mensaje.",
    "indicadores": null
  },
  {
    "id": "b93a9fe0-8e50-4b47-891b-bd3018cd89d6",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 8",
    "texto_oa": "Sintetizar, registrar y ordenar las ideas principales de textos leídos para satisfacer propósitos como estudiar, hacer una investigación, recordar detalles, etc.",
    "indicadores": null
  },
  {
    "id": "d505f8f5-2596-482a-a19a-3d5844141833",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "6° Básico",
    "ciclo": "Bases Curriculares 2012",
    "eje": "Lectura",
    "codigo_oa": "OA 9",
    "texto_oa": "Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos.",
    "indicadores": null
  },
  {
    "id": "b810450d-857b-4d66-a7a2-7182e0cc9d3e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 1",
    "texto_oa": "Leer habitualmente para aprender y recrearse, y seleccionar textos de acuerdo con sus preferencias y propósitos.",
    "indicadores": "Leen para entretenerse, para encontrar información, para informarse, etc.; leen periódicos, revistas y artículos en internet en su tiempo libre; comentan los textos que han leído; recomiendan los textos que les han gustado; solicitan recomendaciones de libros a sus pares, al docente u otros."
  },
  {
    "id": "3e80d36b-97d6-4218-8ca4-ad7e94a768fd",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 10",
    "texto_oa": "Leer y comprender textos no literarios para contextualizar y complementar las lecturas literarias realizadas en clases.",
    "indicadores": "Hacen un resumen de los textos leídos."
  },
  {
    "id": "1705cc29-5cae-4a16-9361-927cde43114b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 11",
    "texto_oa": "Aplicar estrategias de comprensión de acuerdo con sus propósitos de lectura: resumir; formular preguntas; analizar los distintos tipos de relaciones que establecen las imágenes o el sonido con el texto escrito (en textos multimodales); identificar los elementos del texto que dificultan la comprensión (pérdida de los referentes, vocabulario desconocido, inconsistencias entre la información del texto y los propios conocimientos) y buscar soluciones.",
    "indicadores": "Analizan el significado de las imágenes o hacen un breve resumen de lo que en ellas se expresa; relacionan la información presente en las imágenes con el texto en que se encuentra inserta; identifican el párrafo o fragmento del texto que les produce dificultades para comprender; explican qué es lo que no entienden del texto; releen los párrafos anteriores o leen los posteriores para verificar si ahí está la información que necesitan; averiguan conceptos o información que no conocen y que es necesaria para la comprensión del texto y la anotan al margen del texto o en su cuaderno; subrayan las palabras que no comprenden, averiguan su significado y lo anotan al margen del texto; subrayan las ideas principales de un texto y las resumen."
  },
  {
    "id": "3aa62e6f-8496-497a-a6c9-f85206058571",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 12",
    "texto_oa": "Expresarse en forma creativa por medio de la escritura de textos de diversos géneros (por ejemplo, cuentos, crónicas, diarios de vida, cartas, poemas, etc.), escogiendo libremente: el tema; el género; el destinatario.",
    "indicadores": null
  },
  {
    "id": "7dd3a897-0a3e-4060-88e6-9275c64b4b44",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 13",
    "texto_oa": "Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.), caracterizados por: una presentación clara del tema; la presencia de información de distintas fuentes; la inclusión de hechos, descripciones, ejemplos o explicaciones que desarrollen el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos; el uso de imágenes u otros recursos gráficos pertinentes; un cierre coherente con las características del género; el uso de referencias según un formato previamente acordado.",
    "indicadores": "Explican, en la introducción, el tema que abordarán en el texto; organizan el texto agrupando las ideas en párrafos; escriben un texto en el que cada párrafo trata un aspecto del tema abordado; incluyen ejemplos o descripciones para ilustrar o aclarar una idea; incluyen información de más de una fuente; redactan combinando la información que recopilaron en más de una fuente; desarrollan las ideas incluidas en sus textos, de manera que el lector comprenda lo que se quiere transmitir; escriben un texto en el que los párrafos siguen un orden coherente; utilizan adecuadamente recursos para introducir, mantener y retomar temas; introducen las ideas siguiendo una lógica que es fácil de seguir; escriben un texto en el que todas las ideas se relacionan con el tema sobre el que se expone; escriben un texto en el que los referentes son claros y no se produce ambigüedad al utilizar recursos anafóricos; incorporan, cuando es pertinente, imágenes o recursos gráficos que aclaran o contribuyen al tema y que tienen directa relación con el mismo; incluyen, al final del texto, un cierre en el que resumen el tema que han desarrollado o plantean preguntas sobre aspectos que podrían complementar el tema o reafirman lo dicho en la introducción, etc.; incluyen las referencias al final del texto o a pie de página, estableciendo al menos el título y el autor de la fuente consultada."
  },
  {
    "id": "5f4bdfe7-87a3-4dca-a1d2-ddc031fe7c53",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 14",
    "texto_oa": "Escribir, con el propósito de persuadir, textos breves de diversos géneros (por ejemplo, cartas al director, editoriales, críticas literarias, etc.), caracterizados por: la presentación de una afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente; la mantención de la coherencia temática.",
    "indicadores": "Escriben textos de diversos géneros con el fin de persuadir al lector respecto de algún tema; mencionan su postura frente al tema, al principio del texto; usan evidencias e información que se relaciona directamente con los argumentos empleados; fundamentan su postura, usando ejemplos de un texto (literario o no literario), casos de la vida cotidiana, conocimientos previos sobre el tema, etc.; escriben textos en que cada una de las oraciones contribuye al desarrollo de la idea central del párrafo; escriben textos en que cada uno de los párrafos aborda un tema que se relaciona directamente con la postura que se quiere transmitir."
  },
  {
    "id": "9a0e4219-5f64-4d81-824b-57a91ad9e6c2",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 15",
    "texto_oa": "Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro, específicamente el vocabulario (uso de términos técnicos, frases hechas, palabras propias de las redes sociales, términos y expresiones propios del lenguaje hablado), el uso de la persona gramatical y la estructura del texto al género discursivo, contexto y destinatario; incorporando información pertinente; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual; usando conectores adecuados para unir las secciones que componen el texto; usando un vocabulario variado y preciso; reconociendo y corrigiendo usos inadecuados, especialmente de pronombres personales y reflejos, conjugaciones verbales, participios irregulares, y concordancia sujeto-verbo, artículo-sustantivo y sustantivo-adjetivo; corrigiendo la ortografía y mejorando la presentación; usando eficazmente las herramientas del procesador de textos.",
    "indicadores": "Recopilan documentos o páginas de internet que puedan aportar información para el tema; toman apuntes o hacen fichas a partir de los textos que consultan; seleccionan la información que se relaciona directamente con el tema y descartan la que no es pertinente; justifican por qué, para escribir sus textos, incluyen o descartan información recopilada; ordenan y agrupan la información seleccionada; organizan sus ideas e información en torno a diferentes categorías o temas, usando organizadores gráficos o esquemas; modifican sus escritos, ya sea a medida que van escribiendo o al final, para incorporar nuevas ideas relevantes o corregir elementos problemáticos; comentan con otros los problemas que tienen en la redacción del texto y las posibles soluciones; identifican fragmentos incoherentes y los reescriben; reorganizan, si es necesario, los párrafos para que estos tengan una progresión temática coherente; eliminan información superflua; incorporan, cuando es necesario, conectores que ayudan al lector a comprender la relación que hay entre las oraciones de un mismo párrafo; revisan la puntuación para que el texto sea coherente."
  },
  {
    "id": "ab4d5806-40e4-49ff-a1de-72b192dd32f2",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 16",
    "texto_oa": "Aplicar los conceptos de oración, sujeto y predicado con el fin de revisar y mejorar sus textos: produciendo consistentemente oraciones completas; conservando la concordancia entre sujeto y predicado; ubicando el sujeto para determinar de qué o quién se habla.",
    "indicadores": null
  },
  {
    "id": "d8a69647-90fd-4d41-b24f-c0af9076d1aa",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 17",
    "texto_oa": "Usar en sus textos recursos de correferencia léxica: empleando adecuadamente la sustitución léxica, la sinonimia y la hiperonimia; reflexionando sobre las relaciones de sinonimia e hiperonimia y su papel en la redacción de textos cohesivos y coherentes.",
    "indicadores": null
  },
  {
    "id": "67a8d08f-f0a0-44b0-81ec-ff96d281a5f2",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 18",
    "texto_oa": "Utilizar adecuadamente, al narrar, los tiempos verbales del indicativo, manteniendo una adecuada secuencia de tiempos verbales.",
    "indicadores": null
  },
  {
    "id": "334c068b-409e-4cc6-b5df-a3aed6e9f4e9",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 19",
    "texto_oa": "Escribir correctamente para facilitar la comprensión al lector: aplicando todas las reglas de ortografía literal y acentual; verificando la escritura de las palabras cuya ortografía no está sujeta a reglas; usando correctamente punto, coma, raya y dos puntos.",
    "indicadores": "Corrigen los textos que escriben y los de sus compañeros, arreglando errores de ortografía; corrigen la puntuación de los textos propios y de sus compañeros para asegurar la coherencia; discuten con sus compañeros sobre dudas que tengan acerca del uso de la puntuación en un extracto de sus textos."
  },
  {
    "id": "4f6c8340-d76b-40ae-a786-32803f56227b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 2",
    "texto_oa": "Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.",
    "indicadores": "Leen una variedad de textos relacionados con el tema de estudio; relacionan las obras leídas con el tema en estudio; comparan personajes de las narraciones con personas de su propia vida o que están en los medios; sacan conclusiones de las lecturas que son aplicables a sus propias vidas; hacen referencia a las obras leídas con anterioridad; describen los elementos de una obra que están presentes hoy en nuestra sociedad; comentan experiencias de los personajes que son distintas a las propias."
  },
  {
    "id": "7a6f3f28-d9b5-4bdc-b812-e7ab5cc4d937",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 20",
    "texto_oa": "Comprender, comparar y evaluar textos orales y audiovisuales tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; los temas, conceptos o hechos principales; una distinción entre los hechos y las opiniones expresadas; diferentes puntos de vista expresados en los textos; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y otras manifestaciones artísticas; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.",
    "indicadores": null
  },
  {
    "id": "83700f9e-bfeb-4529-acb8-2a854fc14a94",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 21",
    "texto_oa": "Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión o profundicen un aspecto del tema; negociando acuerdos con los interlocutores; considerando al interlocutor para la toma de turnos.",
    "indicadores": "Mantienen el tema de la conversación y, aunque hacen digresiones, vuelven a él; se recuerdan mutuamente, si es que se alejan del tema, sobre qué tienen que resolver o llegar a un acuerdo."
  },
  {
    "id": "93fdd87b-34a0-44db-ab5d-2b6a172b7dc0",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 22",
    "texto_oa": "Expresarse frente a una audiencia de manera clara y adecuada a la situación, para comunicar temas de su interés: presentando información fidedigna y que denota una investigación previa; siguiendo una progresión temática clara; dando ejemplos y explicando algunos términos o conceptos clave para la comprensión de la información; usando un vocabulario variado y preciso y evitando el uso de muletillas; usando material visual que apoye lo dicho y se relacione directamente con lo que se explica.",
    "indicadores": "Hacen un resumen, al principio de la presentación, con los temas que abordarán y se ciñen a ellos; organizan su presentación ordenando los temas de manera que ayuden a cumplir el propósito comunicativo; exponen casos específicos o ejemplos para ilustrar el tema; exponen causas o efectos relevantes del hecho o acontecimiento que abordan en la exposición; utilizan un vocabulario variado y preciso; usan los términos específicos del tema expuesto, explicándolos si es necesario; nombran las fuentes consultadas si se les pide; identifican, antes de la presentación, aquellos términos que, siendo nuevos para sus pares, son necesarios para la comprensión del tema, y los explican en la exposición; exponen sin usar muletillas, o usándolas en contadas ocasiones; incorporan material visual que les permita aclarar aspectos puntuales de su presentación; elaboran presentaciones de PowerPoint o Prezi que aportan a lo expuesto; justifican la elección del material visual seleccionado, en caso de ser requerido."
  },
  {
    "id": "3d5c880d-a332-470c-98ab-f1cd2305f0a4",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 23",
    "texto_oa": "Usar conscientemente los elementos que influyen y configuran los textos orales: comparando textos orales y escritos para establecer las diferencias, considerando el contexto y el destinatario; demostrando dominio de los distintos registros y empleándolos adecuadamente según la situación; utilizando estrategias que permiten cuidar la relación con el otro, especialmente al mostrar desacuerdo; utilizando un volumen, una velocidad y una dicción adecuados al propósito y a la situación.",
    "indicadores": "Emplean un volumen, velocidad y dicción adecuados para que el interlocutor pueda escuchar bien."
  },
  {
    "id": "9c236c43-1cc9-4336-8e71-bc5a9f7cee9f",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Investigación en Lengua y Literatura",
    "codigo_oa": "OA 24",
    "texto_oa": "Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; utilizando los principales sistemas de búsqueda de textos en la biblioteca e internet; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; organizando en categorías la información encontrada en las fuentes investigadas; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.",
    "indicadores": "Trabajan en equipo o individualmente, siguiendo un cronograma, para realizar una investigación; colaboran para llevar a cabo una investigación; redactan el tema de manera específica; usan palabras clave para encontrar información en internet; descartan búsquedas que arrojan información muy amplia y buscan palabras o frases que permitan encontrar información más específica."
  },
  {
    "id": "5cfba7ac-4896-4b1f-ba2c-3d2d3dcb0131",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Investigación en Lengua y Literatura",
    "codigo_oa": "OA 25",
    "texto_oa": "Sintetizar, registrar y ordenar las ideas principales de textos escuchados o leídos para satisfacer propósitos como estudiar, hacer una investigación, recordar detalles, etc.",
    "indicadores": "Registran las ideas principales mientras escuchan una exposición o ven un texto audiovisual; escriben las ideas principales de un texto a medida que leen o una vez terminada la lectura."
  },
  {
    "id": "053ee26c-bef5-4e4b-9836-2b695952ca8a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 3",
    "texto_oa": "Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; el papel que juega cada personaje en el conflicto y cómo sus acciones afectan a otros personajes; el efecto de ciertas acciones en el desarrollo de la historia; cuándo habla el narrador y cuándo hablan los personajes; la disposición temporal de los hechos; elementos en común con otros textos leídos en el año.",
    "indicadores": "Explican el o los conflictos de una narración; describen los problemas a los que se enfrentan los personajes en un texto; describen a los personajes y ejemplifican su descripción a partir de lo que dicen, hacen y lo que se dice de ellos; explican y justifican por qué un personaje tiene mayor o menor relevancia en el desenlace de la historia; explican cómo cambia un personaje después de un evento provocado por otro; explican cómo los personajes intentan resolver los dilemas que enfrentan y dan una opinión justificada al respecto; describen cuáles son las consecuencias de las acciones de un personaje; distinguen qué partes del texto están contadas por el narrador y cuáles por los personajes; recuentan un evento relevante del relato y explican qué otros se desencadenan a partir de este o argumentan por qué es relevante para la historia; distinguen qué eventos son anteriores y cuáles posteriores a un hecho usado como referente; en casos en que el relato no esté dispuesto cronológicamente, hacen un recuento cronológico de los eventos; usan un ordenador gráfico para comparar dos narraciones; comparan, a través de ejemplos, personajes de dos obras leídas; comparan lo que se transmite sobre un mismo tema en dos textos distintos."
  },
  {
    "id": "d01e8e71-4660-4950-b405-45a2387697f5",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 4",
    "texto_oa": "Analizar los poemas leídos para enriquecer su comprensión, considerando, cuando sea pertinente: cómo el lenguaje poético que emplea el autor apela a los sentidos, sugiere estados de ánimo y crea imágenes; el significado o el efecto que produce el uso de lenguaje figurado en el poema; el efecto que produce el ritmo y la sonoridad del poema al leerlo en voz alta; elementos en común con otros textos leídos en el año.",
    "indicadores": "Explican en sus palabras el poema leído; explican, oralmente o por escrito, qué reacción les produce el poema; explican a qué alude, en términos denotativos y connotativos, un determinado verso; describen el efecto que les produce algún verso en el cual se incorpora el uso de lenguaje figurado; señalan qué elementos sonoros contribuyen al sentido del poema o a crear un ambiente determinado; describen elementos que tiene en común el poema leído con otra lectura abordada durante el año; describen temas en común presentes en dos textos."
  },
  {
    "id": "2740abd9-4a3f-4312-b63c-46a642dae11e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 5",
    "texto_oa": "Leer y comprender romances y obras de la poesía popular, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": null
  },
  {
    "id": "f24b17d7-3995-4bc4-82b1-d3d69fbb2680",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 6",
    "texto_oa": "Leer y comprender relatos mitológicos, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": "Recuentan el mito leído; explican las características de los mitos usando ejemplos de los textos leídos en clases; describen, en términos generales, la cultura en que se generan los mitos leídos y qué fenómeno se explica a través de ellos."
  },
  {
    "id": "76d63d13-ec67-48fb-adbd-4deb5d7574ef",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 7",
    "texto_oa": "Formular una interpretación de los textos literarios, considerando: su experiencia personal y sus conocimientos; un dilema presentado en el texto y su postura personal acerca del mismo; la relación de la obra con la visión de mundo y el contexto histórico en el que se ambienta y/o en el que fue creada.",
    "indicadores": "Ofrecen una interpretación del texto leído que aborda temas que van más allá de lo literal o de un mero recuento; explican y ejemplifican por qué el texto leído se inserta en el tema en estudio; relacionan el texto con sus propias experiencias y ofrecen una interpretación para un fragmento o el total de lo leído; plantean su postura frente a un dilema o situación problemática que se propone en el texto y fundamentan con ejemplos del mismo; describen algunas características importantes del contexto histórico de la obra y las relacionan con lo leído; explican algún aspecto de la obra considerando el momento histórico en el que se ambienta o fue creada."
  },
  {
    "id": "ea1f680c-89ae-4e75-9a4d-526ec90f6601",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 8",
    "texto_oa": "Analizar y evaluar textos con finalidad argumentativa como columnas de opinión, cartas y discursos, considerando: la postura del autor y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; su postura personal frente a lo leído y argumentos que la sustentan.",
    "indicadores": "Hacen un recuento del texto; explican cuál es la postura del autor y qué argumentos utiliza para respaldarla; para cada argumento de un texto, establecen si es un hecho o una opinión; explican cuál es su postura, si están de acuerdo o en desacuerdo con lo que se dice en el texto; señalan con qué argumentos están de acuerdo y con cuáles en desacuerdo y explican por qué; reconocen las expresiones que muestran que una emisión es un hecho o una opinión."
  },
  {
    "id": "456e4d1b-a212-4e2f-8d4f-5d0fd5947fee",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "7° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 9",
    "texto_oa": "Analizar y evaluar textos de los medios de comunicación, como noticias, reportajes, cartas al director, textos publicitarios o de las redes sociales, considerando: los propósitos explícitos e implícitos del texto; una distinción entre los hechos y las opiniones expresadas; presencia de estereotipos y prejuicios; el análisis e interpretación de imágenes, gráficos, tablas, mapas o diagramas, y su relación con el texto en el que están insertos; los efectos que puede tener la información divulgada en los hombres o las mujeres aludidos en el texto.",
    "indicadores": null
  },
  {
    "id": "a30872e6-ec5c-45a7-83e9-4b53f66f5d2e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 1",
    "texto_oa": "Leer habitualmente para aprender y recrearse, y seleccionar textos de acuerdo con sus preferencias y propósitos.",
    "indicadores": null
  },
  {
    "id": "6c055162-2023-44d7-89d2-0b4265c6b424",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 10",
    "texto_oa": "Analizar y evaluar textos de los medios de comunicación, como noticias, reportajes, cartas al director, textos publicitarios o de las redes sociales, considerando: los propósitos explícitos e implícitos del texto; una distinción entre los hechos y las opiniones expresados; presencia de estereotipos y prejuicios; la suficiencia de información entregada; el análisis e interpretación de imágenes, gráficos, tablas, mapas o diagramas, y su relación con el texto en el que están insertos; similitudes y diferencias en la forma en que distintas fuentes presentan un mismo hecho.",
    "indicadores": "Explican las similitudes y diferencias que hay entre la presentación que hace un texto de un hecho y cómo lo presenta otro."
  },
  {
    "id": "3592731e-9ca9-4586-94dd-ad6796971c08",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 11",
    "texto_oa": "Leer y comprender textos no literarios para contextualizar y complementar las lecturas literarias realizadas en clases.",
    "indicadores": null
  },
  {
    "id": "cf82323e-f17b-42e1-80e6-ce7ab50794e9",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 12",
    "texto_oa": "Aplicar estrategias de comprensión de acuerdo con sus propósitos de lectura: resumir; formular preguntas; analizar los distintos tipos de relaciones que establecen las imágenes o el sonido con el texto escrito (en textos multimodales); identificar los elementos del texto que dificultan la comprensión (pérdida de los referentes, vocabulario desconocido, inconsistencias entre la información del texto y los propios conocimientos) y buscar soluciones.",
    "indicadores": "Subrayan las ideas principales de un texto y las resumen; hacen anotaciones al margen de un texto, extrayendo las ideas principales de cada párrafo; anotan preguntas y comentarios sobre el texto que están leyendo; piden ayuda a otros para comprender un trozo o profundizar una idea leída; en discusiones sobre un texto, hacen preguntas sobre lo leído, ya sea para aclarar una idea o para profundizar."
  },
  {
    "id": "23733577-01d3-492e-b5f8-d68598a43e10",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 13",
    "texto_oa": "Expresarse en forma creativa por medio de la escritura de textos de diversos géneros (por ejemplo, cuentos, crónicas, diarios de vida, cartas, poemas, etc.), escogiendo libremente: el tema; el género; el destinatario.",
    "indicadores": null
  },
  {
    "id": "73a31da1-bd5d-461c-b220-48169b704b57",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 14",
    "texto_oa": "Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.) caracterizados por: una presentación clara del tema en que se esbozan los aspectos que se abordarán; la presencia de información de distintas fuentes; la inclusión de hechos, descripciones, ejemplos o explicaciones que desarrollen el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos; el uso de imágenes u otros recursos gráficos pertinentes; un cierre coherente con las características del género; el uso de referencias según un formato previamente acordado.",
    "indicadores": null
  },
  {
    "id": "377e8955-e946-42be-ba3c-4a67c21290e3",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 15",
    "texto_oa": "Escribir, con el propósito de persuadir, textos breves de diversos géneros (por ejemplo, cartas al director, editoriales, críticas literarias, etc.), caracterizados por: la presentación de una afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente; la mantención de la coherencia temática.",
    "indicadores": null
  },
  {
    "id": "b6f9acbb-46a8-49cc-9589-64554a1cf8f8",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 16",
    "texto_oa": "Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro, específicamente, el vocabulario (uso de términos técnicos, frases hechas, palabras propias de las redes sociales, términos y expresiones propios del lenguaje hablado), el uso de la persona gramatical, y la estructura del texto al género discursivo, contexto y destinatario; incorporando información pertinente; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual; usando conectores adecuados para unir las secciones que componen el texto y relacionando las ideas dentro de cada párrafo; usando un vocabulario variado y preciso; reconociendo y corrigiendo usos inadecuados, especialmente de pronombres personales y reflejos, conjugaciones verbales, participios irregulares, y concordancia sujeto–verbo, artículo–sustantivo y sustantivo–adjetivo; corrigiendo la ortografía y mejorando la presentación; usando eficazmente las herramientas del procesador de textos.",
    "indicadores": "Modifican sus escritos, ya sea a medida que van escribiendo o al final, para incorporar nuevas ideas relevantes; reorganizan los párrafos, si es necesario, para que estos tengan una progresión temática coherente; eliminan información superflua; recopilan documentos o páginas de internet que pueden aportar información para su tema; toman apuntes o hacen fichas a partir de los textos que consultan."
  },
  {
    "id": "5c523016-43d4-4661-8164-e35aea782164",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 17",
    "texto_oa": "Usar adecuadamente oraciones complejas: manteniendo un referente claro; conservando la coherencia temporal; ubicando el sujeto, para determinar de qué o quién se habla.",
    "indicadores": "Usan oraciones complejas que mantienen un referente claro."
  },
  {
    "id": "c9862ecc-800c-49e0-938e-1afaa0058178",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 18",
    "texto_oa": "Construir textos con referencias claras: usando recursos de correferencia como deícticos —en particular, pronombres personales tónicos y átonos— y nominalización, sustitución pronominal y elipsis, entre otros; analizando si los recursos de correferencia utilizados evitan o contribuyen a la pérdida del referente, cambios de sentido o problemas de estilo.",
    "indicadores": null
  },
  {
    "id": "af4cd252-61a6-4ee6-9cfe-5a804a5454d3",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 19",
    "texto_oa": "Conocer los modos verbales, analizar sus usos y seleccionar el más apropiado para lograr un efecto en el lector, especialmente al escribir textos con finalidad persuasiva.",
    "indicadores": null
  },
  {
    "id": "8407a0af-3d15-47e2-99fd-081ce3650ea6",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 2",
    "texto_oa": "Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.",
    "indicadores": "Leen una variedad de textos relacionados con un tema de estudio; comparan personajes de las narraciones con personas de su propia vida o que están en los medios; sacan conclusiones de las lecturas que son aplicables a sus propias vidas; hacen referencia a las obras leídas con anterioridad; describen los elementos de una obra que están presentes hoy en nuestra sociedad; se refieren a las obras leídas en situaciones cotidianas, aludiendo a características de ciertos personajes o situaciones que les recuerdan la vida cotidiana; comentan experiencias de los personajes que son distintas a las propias; explican por qué una obra en particular sigue vigente años o siglos después de escrita."
  },
  {
    "id": "6494734b-6fab-4934-92bf-5f9a7f74211e",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Escritura",
    "codigo_oa": "OA 20",
    "texto_oa": "Escribir correctamente para facilitar la comprensión al lector: aplicando todas las reglas de ortografía literal y acentual; verificando la escritura de las palabras cuya ortografía no está sujeta a reglas; usando correctamente punto, coma, raya y dos puntos.",
    "indicadores": null
  },
  {
    "id": "b5ca72a7-9743-4eca-bbac-85dbea2c7112",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 21",
    "texto_oa": "Comprender, comparar y evaluar textos orales y audiovisuales tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustenten; los temas, conceptos o hechos principales; el contexto en el que se enmarcan los textos; prejuicios expresados en los textos; una distinción entre los hechos y las opiniones expresados; diferentes puntos de vista expresados en los textos; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.",
    "indicadores": "Explican, oralmente o por escrito, los diferentes puntos de vista que se presentan en un mismo texto; describen la relación entre una imagen y el texto o la música presente; describen, oralmente o por escrito, alguna relación entre lo escuchado y otras manifestaciones artísticas, especialmente en el caso de las películas y el teatro; explican, oralmente o por escrito, alguna relación entre lo escuchado y otros textos estudiados durante el año."
  },
  {
    "id": "534178f3-9eac-4a9e-b868-02a02fffc68d",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 22",
    "texto_oa": "Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión o profundicen un aspecto del tema; negociando acuerdos con los interlocutores; reformulando sus comentarios para desarrollarlos mejor; considerando al interlocutor para la toma de turnos.",
    "indicadores": null
  },
  {
    "id": "f99c758a-e91f-4011-ad74-63498dbd6259",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 23",
    "texto_oa": "Expresarse frente a una audiencia de manera clara y adecuada a la situación para comunicar temas de su interés: presentando información fidedigna y que denota una investigación previa; siguiendo una progresión temática clara; recapitulando la información más relevante o más compleja para asegurarse de que la audiencia comprenda; usando un vocabulario variado y preciso y evitando el uso de muletillas; usando conectores adecuados para hilar la presentación; usando material visual que apoye lo dicho y se relacione directamente con lo que se explica.",
    "indicadores": "Hacen un resumen al principio de la presentación con los temas que abordarán y se ciñen a ellos."
  },
  {
    "id": "dfc667f7-4d10-46ac-bc71-094b2dd4d86c",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Comunicación Oral",
    "codigo_oa": "OA 24",
    "texto_oa": "Usar conscientemente los elementos que influyen y configuran los textos orales: comparando textos orales y escritos para establecer las diferencias, considerando el contexto y el destinatario; demostrando dominio de los distintos registros y empleándolos adecuadamente según la situación; utilizando estrategias que permiten cuidar la relación con el otro, especialmente al mostrar desacuerdo; utilizando un volumen, una velocidad y una dicción adecuados al propósito y a la situación.",
    "indicadores": "Emplean un volumen, velocidad y dicción adecuados para que el interlocutor pueda escuchar bien."
  },
  {
    "id": "5397f507-d498-46db-856b-6b99342222c6",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Investigación en Lengua y Literatura",
    "codigo_oa": "OA 25",
    "texto_oa": "Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; aplicando criterios para determinar la confiabilidad de las fuentes consultadas; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; descartando fuentes que no aportan a la investigación porque se alejan del tema; organizando en categorías la información encontrada en las fuentes investigadas; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.",
    "indicadores": "Delimitando el tema de investigación; aplicando criterios para determinar la confiabilidad de las fuentes consultadas; describen brevemente el contenido de cada una de las fuentes consultadas, incluyendo el título y autor; escriben un artículo informativo en el cual comunican la información aprendida; elaboran una presentación oral para transmitir los principales hallazgos de su investigación; descartan fuentes que no aportan información relevante para el tema y buscan otras; anotan categorías que sirven para organizar la información relativa al tema; agrupan la información en torno a las categorías establecidas; organizan la información encontrada en un esquema para presentarla de manera ordenada en una exposición."
  },
  {
    "id": "79e19368-d72d-4815-b780-9e177d6687a3",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Investigación en Lengua y Literatura",
    "codigo_oa": "OA 26",
    "texto_oa": "Sintetizar, registrar y ordenar las ideas principales de textos escuchados o leídos para satisfacer propósitos como estudiar, hacer una investigación, recordar detalles, etc.",
    "indicadores": null
  },
  {
    "id": "7acb73b5-5fae-4f48-8b26-cdbf874b669b",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 3",
    "texto_oa": "Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; los personajes, su evolución en el relato y su relación con otros personajes; la relación de un fragmento de la obra con el total; el narrador, distinguiéndolo del autor; personajes tipo (por ejemplo, el pícaro, el avaro, el seductor, la madrastra, etc.), símbolos y tópicos literarios presentes en el texto; los prejuicios, estereotipos y creencias presentes en el relato y su conexión con el mundo actual; la disposición temporal de los hechos, con atención a los recursos léxicos y gramaticales empleados para expresarla; elementos en común con otros textos leídos en el año.",
    "indicadores": null
  },
  {
    "id": "4ab978e4-2334-4641-b4b7-2a1a246dedf0",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 4",
    "texto_oa": "Analizar los poemas leídos para enriquecer su comprensión, considerando, cuando sea pertinente: cómo el lenguaje poético que emplea el autor apela a los sentidos, sugiere estados de ánimo y crea imágenes; el significado o el efecto que produce el uso de lenguaje figurado en el poema; el efecto que tiene el uso de repeticiones (de estructuras, sonidos, palabras o ideas) en el poema; elementos en común con otros textos leídos en el año.",
    "indicadores": "Explican en sus palabras el poema leído, incluyendo los temas que aborda; explican qué elementos ayudan a recrear un estado de ánimo o identifican versos del poema que lo hacen; explican a qué alude, en términos denotativos y connotativos, un determinado verso; describen el efecto que les produce algún verso en el cual se usa lenguaje figurado; señalan, si los hay, qué elementos sonoros contribuyen al sentido del poema o a crear un ambiente determinado; describen elementos que tiene en común el poema leído con otra lectura abordada durante el año; describen temas en común presentes en dos textos."
  },
  {
    "id": "9e91ee5c-887d-457e-95cb-372a4b525b9d",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 5",
    "texto_oa": "Analizar los textos dramáticos leídos o vistos, para enriquecer su comprensión, considerando, cuando sea pertinente: el conflicto y sus semejanzas con situaciones cotidianas; los personajes principales y cómo sus acciones y dichos conducen al desenlace o afectan a otros personajes; personajes tipo, símbolos y tópicos literarios; los prejuicios, estereotipos y creencias presentes en el relato y su conexión con el mundo actual; las características del género dramático; la diferencia entre obra dramática y obra teatral; elementos en común con otros textos leídos en el año.",
    "indicadores": null
  },
  {
    "id": "7b11374c-8e48-43d3-966d-0bf7d26b1987",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 6",
    "texto_oa": "Leer y comprender fragmentos de epopeya, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": "Resumen un fragmento de una epopeya leída, usando sus propias palabras; al leer epopeyas, explican por qué una obra leída se clasifica como tal, fundamentando con ejemplos del texto."
  },
  {
    "id": "a77afe12-a6a7-449c-84d9-5c96c1b5ea9a",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 7",
    "texto_oa": "Leer y comprender comedias teatrales, considerando sus características y el contexto en el que se enmarcan.",
    "indicadores": null
  },
  {
    "id": "5462443c-cbd1-4603-a2e9-3a21c0a9f0c8",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 8",
    "texto_oa": "Formular una interpretación de los textos literarios leídos o vistos, que sea coherente con su análisis, considerando: su experiencia personal y sus conocimientos; un dilema presentado en el texto y su postura personal acerca del mismo; la relación de la obra con la visión de mundo y el contexto histórico en el que se ambienta y/o en el que fue creada.",
    "indicadores": null
  },
  {
    "id": "04cf99d5-6c28-43ac-9c41-2dc455a506e1",
    "asignatura": "Lenguaje y Comunicación",
    "nivel": "8° Básico",
    "ciclo": "Bases Curriculares 2015",
    "eje": "Lectura",
    "codigo_oa": "OA 9",
    "texto_oa": "Analizar y evaluar textos con finalidad argumentativa como columnas de opinión, cartas y discursos, considerando: la postura del autor y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; con qué intención el autor usa diversos modos verbales; su postura personal frente a lo leído y argumentos que la sustentan.",
    "indicadores": null
  }
] as CurriculumOA[],
  unidades: [
  {
    "id": "51fc724c-66bf-4876-8fd7-95e51a9c07a3",
    "nivel": "1° Medio",
    "unidad_numero": 1,
    "titulo_tema": "Libertad",
    "oa_codes": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 7",
      "OA 8",
      "OA 12",
      "OA 21",
      "OA 24"
    ]
  },
  {
    "id": "438711a4-bc90-4dac-ad25-28779588d5c7",
    "nivel": "1° Medio",
    "unidad_numero": 2,
    "titulo_tema": "Ciudadanos",
    "oa_codes": [
      "OA 1",
      "OA 9",
      "OA 11",
      "OA 14",
      "OA 15",
      "OA 17",
      "OA 18",
      "OA 20",
      "OA 24"
    ]
  },
  {
    "id": "442f246e-fa07-44a1-8406-a43201fbe537",
    "nivel": "1° Medio",
    "unidad_numero": 3,
    "titulo_tema": "Relaciones humanas",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 5",
      "OA 6",
      "OA 16",
      "OA 21",
      "OA 23",
      "OA 24"
    ]
  },
  {
    "id": "307a4c34-165b-4a70-aad6-b96eaeb8e746",
    "nivel": "1° Medio",
    "unidad_numero": 4,
    "titulo_tema": "Sociedad",
    "oa_codes": [
      "OA 10",
      "OA 13",
      "OA 15",
      "OA 19",
      "OA 21",
      "OA 22"
    ]
  },
  {
    "id": "a9eedf82-25cc-4988-9c00-684401388fc3",
    "nivel": "2° Medio",
    "unidad_numero": 1,
    "titulo_tema": "Ausencia",
    "oa_codes": [
      "OA 3",
      "OA 7",
      "OA 11",
      "OA 13",
      "OA 20",
      "OA 23",
      "OA 1",
      "OA 2",
      "OA 8",
      "OA 9",
      "OA 12",
      "OA 14",
      "OA 15",
      "OA 18",
      "OA 19",
      "OA 21",
      "OA 22",
      "OA 24"
    ]
  },
  {
    "id": "e74bf821-808f-41a5-866d-10ff010b651c",
    "nivel": "2° Medio",
    "unidad_numero": 2,
    "titulo_tema": "Ciudadanía",
    "oa_codes": [
      "OA 3",
      "OA 10",
      "OA 13",
      "OA 16",
      "OA 17",
      "OA 20",
      "OA 23",
      "OA 1",
      "OA 2",
      "OA 9",
      "OA 12",
      "OA 14",
      "OA 15",
      "OA 18",
      "OA 19",
      "OA 21",
      "OA 22",
      "OA 24"
    ]
  },
  {
    "id": "f8c90807-142d-4bbc-80d3-a992482125d2",
    "nivel": "2° Medio",
    "unidad_numero": 3,
    "titulo_tema": "Lo divino",
    "oa_codes": [
      "OA 4",
      "OA 6",
      "OA 11",
      "OA 13",
      "OA 23",
      "OA 1",
      "OA 2",
      "OA 8",
      "OA 9",
      "OA 12",
      "OA 15",
      "OA 18",
      "OA 19",
      "OA 21",
      "OA 22",
      "OA 24"
    ]
  },
  {
    "id": "9a8bd8c0-1889-43c1-9970-9fce98af61c1",
    "nivel": "2° Medio",
    "unidad_numero": 4,
    "titulo_tema": "Poder",
    "oa_codes": [
      "OA 3",
      "OA 5",
      "OA 6",
      "OA 11",
      "OA 20",
      "OA 23",
      "OA 1",
      "OA 2",
      "OA 8",
      "OA 9",
      "OA 12",
      "OA 14",
      "OA 15",
      "OA 18",
      "OA 19",
      "OA 21",
      "OA 22",
      "OA 24"
    ]
  },
  {
    "id": "9244ed4b-cd18-4e43-9037-097e457af197",
    "nivel": "5° Básico",
    "unidad_numero": 1,
    "titulo_tema": "La unión hace la fuerza",
    "oa_codes": [
      "OA 3",
      "OA 4",
      "OA 24",
      "OA 27"
    ]
  },
  {
    "id": "f3561954-3339-45fc-a403-dd9c3812819c",
    "nivel": "5° Básico",
    "unidad_numero": 2,
    "titulo_tema": "Emociones que sanan",
    "oa_codes": [
      "OA 3",
      "OA 4",
      "OA 24",
      "OA 26",
      "OA 30"
    ]
  },
  {
    "id": "34bbec4a-a1ff-4548-b744-2a8e5e5546c8",
    "nivel": "5° Básico",
    "unidad_numero": 3,
    "titulo_tema": "Coexistir en armonía",
    "oa_codes": [
      "OA 3",
      "OA 4",
      "OA 7",
      "OA 15"
    ]
  },
  {
    "id": "db9d8ece-efa4-4cb4-b28b-00e8055b56b1",
    "nivel": "5° Básico",
    "unidad_numero": 4,
    "titulo_tema": "Un mundo en movimiento",
    "oa_codes": [
      "OA 5",
      "OA 29"
    ]
  },
  {
    "id": "1f3ff7ae-6823-41e2-8d2d-c2d76f9386f8",
    "nivel": "6° Básico",
    "unidad_numero": 1,
    "titulo_tema": "El poder de la aventura, la imaginación y la creatividad",
    "oa_codes": [
      "OA 3",
      "OA 4"
    ]
  },
  {
    "id": "4e0f1356-18cf-4f51-9690-3504ff42913d",
    "nivel": "6° Básico",
    "unidad_numero": 2,
    "titulo_tema": "El medioambiente y su protección",
    "oa_codes": [
      "OA 3",
      "OA 5",
      "OA 31"
    ]
  },
  {
    "id": "06959f52-2261-4b06-a77c-7b40ec4e734d",
    "nivel": "6° Básico",
    "unidad_numero": 3,
    "titulo_tema": "El ser humano y su vínculo con el cosmos",
    "oa_codes": [
      "OA 7",
      "OA 15"
    ]
  },
  {
    "id": "4de57793-30a8-4ec1-b841-e9830cdbe1dc",
    "nivel": "6° Básico",
    "unidad_numero": 4,
    "titulo_tema": "Respetar las diferencias y la igualdad de derechos",
    "oa_codes": [
      "OA 14"
    ]
  },
  {
    "id": "c64a2427-7cc9-487e-bf60-f762f4948167",
    "nivel": "7° Básico",
    "unidad_numero": 1,
    "titulo_tema": "El héroe en distintas épocas",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 4",
      "OA 7",
      "OA 8",
      "OA 11",
      "OA 14",
      "OA 15",
      "OA 19",
      "OA 21"
    ]
  },
  {
    "id": "589ddeba-f92e-4d60-a402-34ae48edbd1a",
    "nivel": "7° Básico",
    "unidad_numero": 2,
    "titulo_tema": "La solidaridad y la amistad",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 7",
      "OA 10",
      "OA 14",
      "OA 15",
      "OA 16",
      "OA 21"
    ]
  },
  {
    "id": "a54113c6-be66-4cf5-a92e-9e8dd3be73ce",
    "nivel": "7° Básico",
    "unidad_numero": 3,
    "titulo_tema": "Mitología y relatos de creación",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 6",
      "OA 7",
      "OA 13",
      "OA 15",
      "OA 22",
      "OA 24",
      "OA 25"
    ]
  },
  {
    "id": "fb04bd0f-a8af-42e5-8ac4-381e73b60fd6",
    "nivel": "7° Básico",
    "unidad_numero": 4,
    "titulo_tema": "La identidad: quién soy, cómo me ven los demás",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 7",
      "OA 13",
      "OA 15",
      "OA 21",
      "OA 23"
    ]
  },
  {
    "id": "d1b89b23-b975-495f-bf3c-b7db1065d748",
    "nivel": "7° Básico",
    "unidad_numero": 5,
    "titulo_tema": "El romancero y la poesía popular",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 4",
      "OA 5",
      "OA 7",
      "OA 10",
      "OA 14",
      "OA 15",
      "OA 21"
    ]
  },
  {
    "id": "ae23bc9c-62fd-48e0-b233-daec5b429b0e",
    "nivel": "7° Básico",
    "unidad_numero": 6,
    "titulo_tema": "El terror y lo extraño",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 7",
      "OA 11",
      "OA 14",
      "OA 15",
      "OA 17",
      "OA 21"
    ]
  },
  {
    "id": "39483b77-aa80-4750-b751-fb9274fdfd6c",
    "nivel": "7° Básico",
    "unidad_numero": 7,
    "titulo_tema": "Medios de comunicación",
    "oa_codes": [
      "OA 1",
      "OA 9",
      "OA 12",
      "OA 18",
      "OA 19",
      "OA 20",
      "OA 22",
      "OA 23",
      "OA 24",
      "OA 25"
    ]
  },
  {
    "id": "1d1c1f51-8823-4c0e-94df-776e2482e3f1",
    "nivel": "8° Básico",
    "unidad_numero": 1,
    "titulo_tema": "Epopeya",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 6",
      "OA 8",
      "OA 11",
      "OA 12",
      "OA 14",
      "OA 16",
      "OA 22"
    ]
  },
  {
    "id": "b0d25b12-9612-468b-bece-9c6e2c82269b",
    "nivel": "8° Básico",
    "unidad_numero": 2,
    "titulo_tema": "Experiencias del amor",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 4",
      "OA 8",
      "OA 23",
      "OA 25",
      "OA 26"
    ]
  },
  {
    "id": "a7ded253-46e0-4f69-9246-3ada72abbeed",
    "nivel": "8° Básico",
    "unidad_numero": 3,
    "titulo_tema": "Relatos de misterio",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 8",
      "OA 12",
      "OA 13",
      "OA 17",
      "OA 18",
      "OA 22"
    ]
  },
  {
    "id": "356e3822-c882-44e7-acff-2abd988a14b9",
    "nivel": "8° Básico",
    "unidad_numero": 4,
    "titulo_tema": "Naturaleza",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 4",
      "OA 8",
      "OA 15",
      "OA 16",
      "OA 19",
      "OA 21"
    ]
  },
  {
    "id": "dbfa0a1a-7884-4601-a197-b5e186634552",
    "nivel": "8° Básico",
    "unidad_numero": 5,
    "titulo_tema": "La comedia",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 5",
      "OA 7",
      "OA 8",
      "OA 11",
      "OA 14",
      "OA 16",
      "OA 20",
      "OA 22"
    ]
  },
  {
    "id": "6f5ad51f-42da-46d7-89f7-7aef68bd3823",
    "nivel": "8° Básico",
    "unidad_numero": 6,
    "titulo_tema": "El mundo descabellado",
    "oa_codes": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 8",
      "OA 9",
      "OA 11",
      "OA 15",
      "OA 16",
      "OA 22"
    ]
  },
  {
    "id": "6e9db3fd-bfbe-421e-8f08-e8aabe49a3c6",
    "nivel": "8° Básico",
    "unidad_numero": 7,
    "titulo_tema": "Medios de comunicación",
    "oa_codes": [
      "OA 1",
      "OA 9",
      "OA 10",
      "OA 15",
      "OA 16",
      "OA 21",
      "OA 22",
      "OA 23",
      "OA 24",
      "OA 25",
      "OA 26"
    ]
  }
] as CurriculumUnidad[],
  lecciones: [
  {
    "id": "a3e47f66-6865-49a0-b234-a9447340295c",
    "unidad_id": "f8c90807-142d-4bbc-80d3-a992482125d2",
    "leccion_numero": 1,
    "titulo_leccion": "¿Individuos o prójimos?",
    "temas": "dimensión social de la humanidad, ensayos filosóficos",
    "oa_basales": [
      "OA 9",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "66ef68ff-3c4f-4b26-b90b-8ee64bb7f9f9",
    "unidad_id": "438711a4-bc90-4dac-ad25-28779588d5c7",
    "leccion_numero": 1,
    "titulo_leccion": "El viaje personal",
    "temas": "conflicto humano en género dramático, motivos para viajar",
    "oa_basales": [
      "OA 5",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 6",
      "OA 11"
    ]
  },
  {
    "id": "ea885aad-6187-4ebd-9c54-7865176c58e1",
    "unidad_id": "a9eedf82-25cc-4988-9c00-684401388fc3",
    "leccion_numero": 1,
    "titulo_leccion": "El lugar de la partida",
    "temas": "lugar de origen e identidad a través de la poesía",
    "oa_basales": [
      "OA 8",
      "OA 21",
      "OA 24"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 4"
    ]
  },
  {
    "id": "e86538ce-72e7-48d0-8360-8355cd10f9f1",
    "unidad_id": "51fc724c-66bf-4876-8fd7-95e51a9c07a3",
    "leccion_numero": 1,
    "titulo_leccion": "En la naturaleza",
    "temas": "cosmovisión Mapuche, vínculo con el entorno, puntos de vista en ensayos",
    "oa_basales": [
      "OA 9",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "8be3222f-3bca-4814-81ac-be0b027348aa",
    "unidad_id": "c64a2427-7cc9-487e-bf60-f762f4948167",
    "leccion_numero": 1,
    "titulo_leccion": "Tener un amigo",
    "temas": "amistad, vínculos, compromiso, IA en la ciencia ficción",
    "oa_basales": [
      "OA 3",
      "OA 7",
      "OA 9",
      "OA 20",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "f7caf6cf-e3c3-4698-9047-5b55991d51a2",
    "unidad_id": "1f3ff7ae-6823-41e2-8d2d-c2d76f9386f8",
    "leccion_numero": 1,
    "titulo_leccion": "Juegos e imaginación",
    "temas": "importancia de la imaginación y el juego en el aprendizaje",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 6",
      "OA 7",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 12",
      "OA 13"
    ]
  },
  {
    "id": "c3bcbe44-7e60-4501-bc9b-26ccf88b8193",
    "unidad_id": "1d1c1f51-8823-4c0e-94df-776e2482e3f1",
    "leccion_numero": 1,
    "titulo_leccion": "En un instante mágico",
    "temas": "amor romántico, leyenda de Tristán e Isolda, roles de género, personajes tipo",
    "oa_basales": [
      "OA 2",
      "OA 3",
      "OA 8",
      "OA 11",
      "OA 12",
      "OA 13"
    ],
    "oa_complementarios": []
  },
  {
    "id": "a77ffac1-757d-4d46-8369-2f9ac8796dd5",
    "unidad_id": "b0d25b12-9612-468b-bece-9c6e2c82269b",
    "leccion_numero": 1,
    "titulo_leccion": "Lo que no queremos ver",
    "temas": "crítica al individualismo (\"El ahogado\"), montaje teatral",
    "oa_basales": [
      "OA 2",
      "OA 5",
      "OA 7",
      "OA 8",
      "OA 12"
    ],
    "oa_complementarios": []
  },
  {
    "id": "57726a62-c11b-448b-ade2-f9f217480f34",
    "unidad_id": "589ddeba-f92e-4d60-a402-34ae48edbd1a",
    "leccion_numero": 1,
    "titulo_leccion": "Respetando mis derechos y los tuyos",
    "temas": "defensa de derechos, perseverancia, igualdad en el deporte, masculinización del fútbol",
    "oa_basales": [
      "OA 3",
      "OA 7",
      "OA 9",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "812c45c9-179c-45ba-bcc8-250257056253",
    "unidad_id": "a7ded253-46e0-4f69-9246-3ada72abbeed",
    "leccion_numero": 1,
    "titulo_leccion": "Aventuras que atraviesan el tiempo",
    "temas": "narrativa épica (rey Arturo), fantasía épica (El Señor de los Anillos)",
    "oa_basales": [
      "OA 2",
      "OA 3",
      "OA 6",
      "OA 12",
      "OA 23"
    ],
    "oa_complementarios": []
  },
  {
    "id": "286f73dc-cab9-41be-b54d-a2f6f80a26b4",
    "unidad_id": "9a8bd8c0-1889-43c1-9970-9fce98af61c1",
    "leccion_numero": 1,
    "titulo_leccion": "Con el horizonte en la mirada",
    "temas": "motivaciones y dilemas de personajes en la novela",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 12"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "c404b238-21f5-4692-9d60-aaf262fbc2eb",
    "unidad_id": "356e3822-c882-44e7-acff-2abd988a14b9",
    "leccion_numero": 1,
    "titulo_leccion": "Hacia un mundo distópico",
    "temas": "mundos distópicos, naturaleza vs. tecnología, tiempo narrativo",
    "oa_basales": [
      "OA 2",
      "OA 3",
      "OA 8",
      "OA 22"
    ],
    "oa_complementarios": []
  },
  {
    "id": "6a9934d1-730d-419f-b807-f2c141d07bd0",
    "unidad_id": "a54113c6-be66-4cf5-a92e-9e8dd3be73ce",
    "leccion_numero": 1,
    "titulo_leccion": "Con el océano y sus habitantes",
    "temas": "responsabilidad sobre el entorno, historia de balleneras, preservación de fauna marina",
    "oa_basales": [
      "OA 3",
      "OA 7",
      "OA 20"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "f449b914-6377-4ae2-9a86-18965918c659",
    "unidad_id": "307a4c34-165b-4a70-aad6-b96eaeb8e746",
    "leccion_numero": 1,
    "titulo_leccion": "Una mirada hacia el futuro",
    "temas": "ciencia ficción, saltos temporales, impacto humano en la Tierra",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "7ea07a4c-091b-482e-a182-866d44c82c37",
    "unidad_id": "e74bf821-808f-41a5-866d-10ff010b651c",
    "leccion_numero": 1,
    "titulo_leccion": "¿Cuándo actuar?",
    "temas": "conflictos sociales/bélicos (II Guerra Mundial), género dramático",
    "oa_basales": [
      "OA 5",
      "OA 8",
      "OA 12"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "5162a411-71dc-46b4-bed6-77b3391ac430",
    "unidad_id": "442f246e-fa07-44a1-8406-a43201fbe537",
    "leccion_numero": 1,
    "titulo_leccion": "El don de la palabra",
    "temas": "poder transformador de la narración, causas/consecuencias, intertextualidad",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11",
      "OA 22"
    ]
  },
  {
    "id": "f047aec5-007b-457b-ad20-0402c590fe75",
    "unidad_id": "fb04bd0f-a8af-42e5-8ac4-381e73b60fd6",
    "leccion_numero": 1,
    "titulo_leccion": "Historias del pasado",
    "temas": "patrimonio cultural, hechos históricos en la poesía, literatura como fuente histórica",
    "oa_basales": [
      "OA 7",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 4",
      "OA 5",
      "OA 11"
    ]
  },
  {
    "id": "257556ac-e831-446d-b85d-6066be5f6e6d",
    "unidad_id": "9244ed4b-cd18-4e43-9037-097e457af197",
    "leccion_numero": 1,
    "titulo_leccion": "Fútbol y trabajo en equipo",
    "temas": "fútbol, trabajo en equipo, compañerismo, esfuerzo, superación",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 6",
      "OA 7",
      "OA 9"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 12"
    ]
  },
  {
    "id": "7b5e0921-a188-4781-a6bf-0883fdaa97b9",
    "unidad_id": "fb04bd0f-a8af-42e5-8ac4-381e73b60fd6",
    "leccion_numero": 2,
    "titulo_leccion": "La visión popular",
    "temas": "lira popular, décimas, medio de información y crítica social",
    "oa_basales": [
      "OA 24"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 5",
      "OA 10",
      "OA 25"
    ]
  },
  {
    "id": "62907dd3-08f2-4e55-8bab-a37cfd14dac4",
    "unidad_id": "1d1c1f51-8823-4c0e-94df-776e2482e3f1",
    "leccion_numero": 2,
    "titulo_leccion": "En un rincón cotidiano",
    "temas": "amor propio, amistad como cuidado, \"La última hoja\"",
    "oa_basales": [
      "OA 2",
      "OA 3",
      "OA 8",
      "OA 11",
      "OA 12",
      "OA 22"
    ],
    "oa_complementarios": []
  },
  {
    "id": "1b7fe01f-309b-4b17-a106-dc90dc3ddd4b",
    "unidad_id": "b0d25b12-9612-468b-bece-9c6e2c82269b",
    "leccion_numero": 2,
    "titulo_leccion": "Lo que debemos descifrar",
    "temas": "relatos policiales, pensamiento analítico-deductivo, el detective",
    "oa_basales": [
      "OA 2",
      "OA 3",
      "OA 8",
      "OA 11",
      "OA 12",
      "OA 13"
    ],
    "oa_complementarios": []
  },
  {
    "id": "6fa5b2f2-f377-433d-ac88-4d31ecda1782",
    "unidad_id": "e74bf821-808f-41a5-866d-10ff010b651c",
    "leccion_numero": 2,
    "titulo_leccion": "Intentando acercarnos",
    "temas": "migración, inseguridad, adaptación en la narrativa contemporánea",
    "oa_basales": [
      "OA 3",
      "OA 8"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "0660224c-1ab3-4390-a875-7630ca8f8d39",
    "unidad_id": "a9eedf82-25cc-4988-9c00-684401388fc3",
    "leccion_numero": 2,
    "titulo_leccion": "Viaje en el tiempo",
    "temas": "figura materna, sueños, recuerdos, imaginación",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 19"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "99d5f2b2-e6d2-46e2-bd4e-261e45037899",
    "unidad_id": "1f3ff7ae-6823-41e2-8d2d-c2d76f9386f8",
    "leccion_numero": 2,
    "titulo_leccion": "Creatividad e innovación",
    "temas": "ideas innovadoras, reciclaje creativo, cuidado del medioambiente",
    "oa_basales": [
      "OA 1",
      "OA 6",
      "OA 7",
      "OA 24",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 12",
      "OA 13"
    ]
  },
  {
    "id": "2c4dad3f-e187-440e-9257-41a7b529d4bf",
    "unidad_id": "9244ed4b-cd18-4e43-9037-097e457af197",
    "leccion_numero": 2,
    "titulo_leccion": "Jugar como niña",
    "temas": "equidad de género en el deporte, estereotipos, perseverancia, empatía, análisis de roles",
    "oa_basales": [
      "OA 6",
      "OA 7",
      "OA 24",
      "OA 26"
    ],
    "oa_complementarios": [
      "OA 12"
    ]
  },
  {
    "id": "c626b2df-9403-4edf-a3aa-ca97064a48a2",
    "unidad_id": "307a4c34-165b-4a70-aad6-b96eaeb8e746",
    "leccion_numero": 2,
    "titulo_leccion": "El futuro es hoy",
    "temas": "robótica, IA, vínculo humano-máquina",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 19",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "1c26cddc-c544-4ce7-a687-05bb826283a9",
    "unidad_id": "442f246e-fa07-44a1-8406-a43201fbe537",
    "leccion_numero": 2,
    "titulo_leccion": "Todos somos narradores",
    "temas": "la narración como práctica humana, construcción de identidad",
    "oa_basales": [
      "OA 9"
    ],
    "oa_complementarios": []
  },
  {
    "id": "8a64ccc0-23b2-46f2-9510-c423d73fbc7e",
    "unidad_id": "438711a4-bc90-4dac-ad25-28779588d5c7",
    "leccion_numero": 2,
    "titulo_leccion": "La necesidad de movernos",
    "temas": "historia de las migraciones, derecho a la movilidad",
    "oa_basales": [
      "OA 10",
      "OA 11"
    ],
    "oa_complementarios": []
  },
  {
    "id": "da6a64ee-d750-4ee0-ac38-e39485fec033",
    "unidad_id": "51fc724c-66bf-4876-8fd7-95e51a9c07a3",
    "leccion_numero": 2,
    "titulo_leccion": "En la ciudad",
    "temas": "motivaciones de personajes, cambios sociales por la electricidad",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 12"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "622baf8a-5a99-43b1-beb7-8991b0793b55",
    "unidad_id": "c64a2427-7cc9-487e-bf60-f762f4948167",
    "leccion_numero": 2,
    "titulo_leccion": "Confiar y compartir",
    "temas": "resiliencia, empatía, diálogo, superación de obstáculos",
    "oa_basales": [
      "OA 3",
      "OA 7",
      "OA 9",
      "OA 20",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "f478026c-172e-4842-ac40-55ed85e27a6a",
    "unidad_id": "9a8bd8c0-1889-43c1-9970-9fce98af61c1",
    "leccion_numero": 2,
    "titulo_leccion": "Cada uno es como es",
    "temas": "personajes redondos, investigación de figuras de interés",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 24"
    ],
    "oa_complementarios": []
  },
  {
    "id": "b1e1b6c2-14b8-4238-a45f-42a34faf50c8",
    "unidad_id": "356e3822-c882-44e7-acff-2abd988a14b9",
    "leccion_numero": 2,
    "titulo_leccion": "Más allá de lo imaginado (lección de investigación)",
    "temas": "novelas clásicas de ciencia ficción (Fahrenheit 451) y contexto",
    "oa_basales": [
      "OA 2",
      "OA 8",
      "OA 25",
      "OA 26"
    ],
    "oa_complementarios": []
  },
  {
    "id": "90345cee-a74e-4c95-9a85-b19ea9b40847",
    "unidad_id": "589ddeba-f92e-4d60-a402-34ae48edbd1a",
    "leccion_numero": 2,
    "titulo_leccion": "Con todos los sentimientos",
    "temas": "identidad propia, vínculo con orígenes/territorio, música y comunidad",
    "oa_basales": [],
    "oa_complementarios": [
      "OA 10",
      "OA 11"
    ]
  },
  {
    "id": "897ea602-0599-4890-ae48-23483257a2e0",
    "unidad_id": "a54113c6-be66-4cf5-a92e-9e8dd3be73ce",
    "leccion_numero": 2,
    "titulo_leccion": "En nuevos territorios",
    "temas": "adaptación al cambio, carrera espacial, colonización de Marte en ciencia ficción",
    "oa_basales": [
      "OA 3",
      "OA 7",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 11"
    ]
  },
  {
    "id": "01f0bf78-6bd5-45d2-9e1f-bde817cef75f",
    "unidad_id": "f8c90807-142d-4bbc-80d3-a992482125d2",
    "leccion_numero": 2,
    "titulo_leccion": "Búsquedas y encuentros",
    "temas": "soledad y conexión humana en cuentos contemporáneos",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 19"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "47d9a8d4-1bac-42b9-8bfe-6ecf11ff81c9",
    "unidad_id": "a7ded253-46e0-4f69-9246-3ada72abbeed",
    "leccion_numero": 2,
    "titulo_leccion": "Heroísmos revisitados (lección de investigación)",
    "temas": "fidelidad histórica/literaria de películas vs. fuentes originales",
    "oa_basales": [
      "OA 6",
      "OA 14",
      "OA 21",
      "OA 25",
      "OA 26"
    ],
    "oa_complementarios": []
  },
  {
    "id": "4a041055-9e25-4d24-bb62-64e98324c9f1",
    "unidad_id": "fb04bd0f-a8af-42e5-8ac4-381e73b60fd6",
    "leccion_numero": 3,
    "titulo_leccion": "Mentiras y verdades",
    "temas": "confiabilidad de información en internet, fake news",
    "oa_basales": [
      "OA 9",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 20"
    ]
  },
  {
    "id": "f9d66ce7-3c75-4eab-823c-e79bc99f9718",
    "unidad_id": "9244ed4b-cd18-4e43-9037-097e457af197",
    "leccion_numero": 3,
    "titulo_leccion": "Deporte y perseverancia",
    "temas": "perseverancia, superación frente a la adversidad, resiliencia, automotivación",
    "oa_basales": [
      "OA 4",
      "OA 11",
      "OA 15",
      "OA 17",
      "OA 18"
    ],
    "oa_complementarios": [
      "OA 12"
    ]
  },
  {
    "id": "ecd0669d-578c-4f75-b2e2-cba1e2b420e2",
    "unidad_id": "1f3ff7ae-6823-41e2-8d2d-c2d76f9386f8",
    "leccion_numero": 3,
    "titulo_leccion": "Aventuras y viajes en el tiempo",
    "temas": "relatos de historias y aventuras en distintas épocas",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 7",
      "OA 14",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 13",
      "OA 19"
    ]
  },
  {
    "id": "f1d231c4-8bcf-45e6-8bda-ec065b9dc02d",
    "unidad_id": "c64a2427-7cc9-487e-bf60-f762f4948167",
    "leccion_numero": 3,
    "titulo_leccion": "Expresar mi interior",
    "temas": "experiencia personal en la creación literaria, investigación biográfica",
    "oa_basales": [
      "OA 7",
      "OA 14",
      "OA 24"
    ],
    "oa_complementarios": [
      "OA 4",
      "OA 10",
      "OA 25"
    ]
  },
  {
    "id": "3fe610d1-aa69-40c6-b8e7-13f47392f3c4",
    "unidad_id": "589ddeba-f92e-4d60-a402-34ae48edbd1a",
    "leccion_numero": 3,
    "titulo_leccion": "Conociendo relatos ancestrales",
    "temas": "relatos tradicionales, cosmovisión y valores del pueblo Aymara",
    "oa_basales": [
      "OA 3",
      "OA 24"
    ],
    "oa_complementarios": [
      "OA 25"
    ]
  },
  {
    "id": "fe209367-0c42-4493-b70c-eab5674ef142",
    "unidad_id": "a54113c6-be66-4cf5-a92e-9e8dd3be73ce",
    "leccion_numero": 3,
    "titulo_leccion": "En la creación literaria",
    "temas": "la naturaleza en la poesía, evaluación de fuentes de investigación",
    "oa_basales": [
      "OA 7",
      "OA 24"
    ],
    "oa_complementarios": [
      "OA 4",
      "OA 10",
      "OA 25"
    ]
  },
  {
    "id": "2775fff7-afb3-45e3-97cd-807c9aa6eefc",
    "unidad_id": "1d1c1f51-8823-4c0e-94df-776e2482e3f1",
    "leccion_numero": 3,
    "titulo_leccion": "Poemas (lección de investigación)",
    "temas": "investigación sobre la visión del amor en la poesía y su contexto",
    "oa_basales": [
      "OA 4",
      "OA 8",
      "OA 25",
      "OA 26"
    ],
    "oa_complementarios": []
  },
  {
    "id": "885530a9-e7c0-4779-8ed7-124eafd17b14",
    "unidad_id": "b0d25b12-9612-468b-bece-9c6e2c82269b",
    "leccion_numero": 3,
    "titulo_leccion": "Lo que vemos distinto (lección de investigación)",
    "temas": "microcuentos, investigación de campo con encuestas",
    "oa_basales": [
      "OA 8",
      "OA 23",
      "OA 25",
      "OA 26"
    ],
    "oa_complementarios": []
  },
  {
    "id": "929c2698-4263-4c44-9e4a-f77071d0ad71",
    "unidad_id": "a7ded253-46e0-4f69-9246-3ada72abbeed",
    "leccion_numero": 3,
    "titulo_leccion": "Historias de vidas y de pueblos",
    "temas": "poesía sobre infancia y orígenes, autores chilenos y de pueblos originarios",
    "oa_basales": [
      "OA 2",
      "OA 4",
      "OA 8",
      "OA 12",
      "OA 24"
    ],
    "oa_complementarios": []
  },
  {
    "id": "cded0d37-8e37-4c00-97db-d564789c0be0",
    "unidad_id": "356e3822-c882-44e7-acff-2abd988a14b9",
    "leccion_numero": 3,
    "titulo_leccion": "A donde anhelamos llegar",
    "temas": "poesía esperanzadora del futuro, elementos sonoros del lenguaje lírico",
    "oa_basales": [
      "OA 2",
      "OA 3",
      "OA 8",
      "OA 12",
      "OA 13"
    ],
    "oa_complementarios": []
  },
  {
    "id": "07795d93-4db5-46cc-9c88-f0816143e799",
    "unidad_id": "51fc724c-66bf-4876-8fd7-95e51a9c07a3",
    "leccion_numero": 3,
    "titulo_leccion": "En el camino de las soluciones",
    "temas": "urgencia climática, soluciones basadas en la naturaleza",
    "oa_basales": [
      "OA 10",
      "OA 15"
    ],
    "oa_complementarios": []
  },
  {
    "id": "194530b1-89d6-4155-af7f-0abe02bfa946",
    "unidad_id": "438711a4-bc90-4dac-ad25-28779588d5c7",
    "leccion_numero": 3,
    "titulo_leccion": "Ir y venir",
    "temas": "lenguaje figurado en poemas sobre desplazamiento y partida",
    "oa_basales": [
      "OA 8",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 4"
    ]
  },
  {
    "id": "b3874be1-72c7-45e2-9e92-ad81174c2522",
    "unidad_id": "442f246e-fa07-44a1-8406-a43201fbe537",
    "leccion_numero": 3,
    "titulo_leccion": "Una historia que nos mueva",
    "temas": "storytelling y conciencia ambiental",
    "oa_basales": [
      "OA 10",
      "OA 21"
    ],
    "oa_complementarios": []
  },
  {
    "id": "658bf835-b6c5-40b8-9aec-1e9ded275690",
    "unidad_id": "307a4c34-165b-4a70-aad6-b96eaeb8e746",
    "leccion_numero": 3,
    "titulo_leccion": "Soluciones para el mañana",
    "temas": "bancos de semillas, sustentabilidad, crisis alimentaria",
    "oa_basales": [
      "OA 10"
    ],
    "oa_complementarios": []
  },
  {
    "id": "6f4034a5-d2ef-421f-ad88-5500f958927d",
    "unidad_id": "a9eedf82-25cc-4988-9c00-684401388fc3",
    "leccion_numero": 3,
    "titulo_leccion": "El idioma que vas hablando",
    "temas": "la lengua como identidad cultural",
    "oa_basales": [
      "OA 24"
    ],
    "oa_complementarios": [
      "OA 22"
    ]
  },
  {
    "id": "a5bd86a3-63ff-404b-8664-8605fa52dd9f",
    "unidad_id": "e74bf821-808f-41a5-866d-10ff010b651c",
    "leccion_numero": 3,
    "titulo_leccion": "Desafíos de ayer y hoy",
    "temas": "locura, justicia, verdad en obras clásicas",
    "oa_basales": [
      "OA 8",
      "OA 24"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "69bc6274-9227-4710-bc0f-1acc8be6912f",
    "unidad_id": "f8c90807-142d-4bbc-80d3-a992482125d2",
    "leccion_numero": 3,
    "titulo_leccion": "Nuestra convivencia",
    "temas": "posturas sobre convivencia social, ensayo",
    "oa_basales": [
      "OA 14",
      "OA 15",
      "OA 19"
    ],
    "oa_complementarios": []
  },
  {
    "id": "bf71cf42-0b5c-4e3e-8ea0-5f08351e203c",
    "unidad_id": "9a8bd8c0-1889-43c1-9970-9fce98af61c1",
    "leccion_numero": 3,
    "titulo_leccion": "Aprendiendo a vivir",
    "temas": "relaciones humanas, prejuicios, transformación de personajes",
    "oa_basales": [
      "OA 3",
      "OA 8",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 2"
    ]
  },
  {
    "id": "f90c91bd-9493-4e73-a603-d84ea679a375",
    "unidad_id": "307a4c34-165b-4a70-aad6-b96eaeb8e746",
    "leccion_numero": 4,
    "titulo_leccion": "El futuro de los saberes ancestrales",
    "temas": "vigencia de conocimientos de pueblos originarios y ciencia",
    "oa_basales": [
      "OA 12",
      "OA 24"
    ],
    "oa_complementarios": []
  },
  {
    "id": "db0ff4fd-fcf0-4c13-a23b-822c8429db32",
    "unidad_id": "fb04bd0f-a8af-42e5-8ac4-381e73b60fd6",
    "leccion_numero": 4,
    "titulo_leccion": "Representaciones de vida",
    "temas": "discurso publicitario, estereotipos, prejuicios, debate",
    "oa_basales": [
      "OA 8",
      "OA 9",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 17",
      "OA 19",
      "OA 22"
    ]
  },
  {
    "id": "4ef86947-8304-4179-a55b-d566c1ad2a6f",
    "unidad_id": "b0d25b12-9612-468b-bece-9c6e2c82269b",
    "leccion_numero": 4,
    "titulo_leccion": "Lo que nos quieren hacer creer",
    "temas": "fake news, textos argumentativos, fuentes confiables",
    "oa_basales": [
      "OA 9",
      "OA 15",
      "OA 16",
      "OA 22"
    ],
    "oa_complementarios": []
  },
  {
    "id": "e4080b84-2a73-4c69-b94e-e544f136966f",
    "unidad_id": "1d1c1f51-8823-4c0e-94df-776e2482e3f1",
    "leccion_numero": 4,
    "titulo_leccion": "Entrevista a Elisa Avendaño",
    "temas": "comprensión de entrevistas, música ancestral Mapuche, hechos vs. opiniones",
    "oa_basales": [
      "OA 10",
      "OA 14",
      "OA 16",
      "OA 18",
      "OA 21"
    ],
    "oa_complementarios": []
  },
  {
    "id": "e278a675-4850-4dda-9ca8-fe160f45357c",
    "unidad_id": "f3561954-3339-45fc-a403-dd9c3812819c",
    "leccion_numero": 4,
    "titulo_leccion": "Emociones en verso",
    "temas": "poesía, expresión de emociones, figuras literarias (metáfora, personificación), rima, lenguaje figurado",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 5",
      "OA 6",
      "OA 7",
      "OA 9",
      "OA 24",
      "OA 26"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 8",
      "OA 12",
      "OA 27"
    ]
  },
  {
    "id": "6df0cc3f-74b4-4394-a814-e406b17d1ddb",
    "unidad_id": "a9eedf82-25cc-4988-9c00-684401388fc3",
    "leccion_numero": 4,
    "titulo_leccion": "Caminos anchos y diversos",
    "temas": "identidad cultural, ensayos argumentativos",
    "oa_basales": [
      "OA 9",
      "OA 19"
    ],
    "oa_complementarios": [
      "OA 20"
    ]
  },
  {
    "id": "c063eb3b-09c8-45a5-adb2-527997d1db7a",
    "unidad_id": "f8c90807-142d-4bbc-80d3-a992482125d2",
    "leccion_numero": 4,
    "titulo_leccion": "Convivir desde la naturaleza",
    "temas": "cosmovisión mapuche, relación con la tierra, poetas",
    "oa_basales": [
      "OA 10",
      "OA 21",
      "OA 2"
    ],
    "oa_complementarios": []
  },
  {
    "id": "db067c65-60eb-4b50-a00c-8f947d1d30cd",
    "unidad_id": "e74bf821-808f-41a5-866d-10ff010b651c",
    "leccion_numero": 4,
    "titulo_leccion": "Acción frente a la urgencia",
    "temas": "microplásticos en Rapa Nui, reportajes",
    "oa_basales": [
      "OA 10",
      "OA 19",
      "OA 21"
    ],
    "oa_complementarios": []
  },
  {
    "id": "9f83e05e-3ca8-4008-bb47-ce6d10c90643",
    "unidad_id": "438711a4-bc90-4dac-ad25-28779588d5c7",
    "leccion_numero": 4,
    "titulo_leccion": "Idiomas en movimiento",
    "temas": "evolución del español, préstamos lingüísticos",
    "oa_basales": [
      "OA 12",
      "OA 21",
      "OA 24"
    ],
    "oa_complementarios": []
  },
  {
    "id": "1b39ac69-5715-4f46-9e28-c0e9ede94088",
    "unidad_id": "9a8bd8c0-1889-43c1-9970-9fce98af61c1",
    "leccion_numero": 4,
    "titulo_leccion": "Acciones que inspiran",
    "temas": "discursos públicos, conciencia ambiental/social, economía circular",
    "oa_basales": [
      "OA 9",
      "OA 19"
    ],
    "oa_complementarios": []
  },
  {
    "id": "886bf8f5-a696-4543-86e6-36844de15896",
    "unidad_id": "a7ded253-46e0-4f69-9246-3ada72abbeed",
    "leccion_numero": 4,
    "titulo_leccion": "Saberes ancestrales",
    "temas": "cultura Kawésqar, reportajes sobre pueblos indígenas",
    "oa_basales": [
      "OA 10",
      "OA 14",
      "OA 16",
      "OA 20",
      "OA 21",
      "OA 22"
    ],
    "oa_complementarios": []
  },
  {
    "id": "57c69930-1ff4-40f1-a004-ba01c988a872",
    "unidad_id": "a54113c6-be66-4cf5-a92e-9e8dd3be73ce",
    "leccion_numero": 4,
    "titulo_leccion": "Protegiendo los espacios naturales",
    "temas": "conservación de humedales, cartas al director sobre problemas ambientales",
    "oa_basales": [
      "OA 9",
      "OA 14"
    ],
    "oa_complementarios": [
      "OA 15",
      "OA 17"
    ]
  },
  {
    "id": "9c6aa9ad-8ebc-4294-87c0-86ec9c73119d",
    "unidad_id": "51fc724c-66bf-4876-8fd7-95e51a9c07a3",
    "leccion_numero": 4,
    "titulo_leccion": "En lugares imaginarios",
    "temas": "investigación sobre mundos ficticios, validez de la información",
    "oa_basales": [
      "OA 12",
      "OA 21",
      "OA 24"
    ],
    "oa_complementarios": []
  },
  {
    "id": "2c613e54-c356-4f51-8020-cb28511e1ad7",
    "unidad_id": "442f246e-fa07-44a1-8406-a43201fbe537",
    "leccion_numero": 4,
    "titulo_leccion": "Narradores orales",
    "temas": "lenguas de pueblos originarios de Chile",
    "oa_basales": [
      "OA 10",
      "OA 24"
    ],
    "oa_complementarios": []
  },
  {
    "id": "f4383fa1-82cf-46ca-9dcc-046661b18f11",
    "unidad_id": "356e3822-c882-44e7-acff-2abd988a14b9",
    "leccion_numero": 4,
    "titulo_leccion": "Construir un tiempo mejor",
    "temas": "discursos públicos (Gloria Steinem, Michelle Obama), activismo climático en redes",
    "oa_basales": [
      "OA 9",
      "OA 15",
      "OA 16",
      "OA 22"
    ],
    "oa_complementarios": []
  },
  {
    "id": "bd74fd2f-5e04-46e4-a5e6-7c96f80e45aa",
    "unidad_id": "c64a2427-7cc9-487e-bf60-f762f4948167",
    "leccion_numero": 4,
    "titulo_leccion": "Trabajar por mis metas",
    "temas": "esfuerzo, metas, reportajes, textos periodísticos",
    "oa_basales": [
      "OA 9",
      "OA 21"
    ],
    "oa_complementarios": [
      "OA 13",
      "OA 15",
      "OA 16"
    ]
  },
  {
    "id": "730987d6-7b6f-47a7-b7aa-8bdb1a0ade95",
    "unidad_id": "4e0f1356-18cf-4f51-9690-3504ff42913d",
    "leccion_numero": 4,
    "titulo_leccion": "El ser humano y la naturaleza",
    "temas": "relación hombre-naturaleza, cuidado del entorno",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 5",
      "OA 6",
      "OA 7",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 12",
      "OA 13"
    ]
  },
  {
    "id": "d542f68f-0eaf-474c-87c0-3036177f2d61",
    "unidad_id": "589ddeba-f92e-4d60-a402-34ae48edbd1a",
    "leccion_numero": 4,
    "titulo_leccion": "Apoyándonos mutuamente",
    "temas": "igualdad de género, corresponsabilidad, textos argumentativos",
    "oa_basales": [
      "OA 8",
      "OA 14"
    ],
    "oa_complementarios": [
      "OA 15"
    ]
  },
  {
    "id": "785a3aed-5f79-40f6-b241-55744b93e224",
    "unidad_id": "307a4c34-165b-4a70-aad6-b96eaeb8e746",
    "leccion_numero": 5,
    "titulo_leccion": "El futuro posible",
    "temas": "ensayos argumentativos sobre el futuro de la humanidad",
    "oa_basales": [
      "OA 9",
      "OA 12",
      "OA 14",
      "OA 15"
    ],
    "oa_complementarios": []
  },
  {
    "id": "3f31a132-2851-4dd7-9860-26fd240eb2cb",
    "unidad_id": "51fc724c-66bf-4876-8fd7-95e51a9c07a3",
    "leccion_numero": 5,
    "titulo_leccion": "En el camino de las redes",
    "temas": "influencia de la tecnología/lo digital, producción de reportajes",
    "oa_basales": [
      "OA 12",
      "OA 15",
      "OA 17",
      "OA 19"
    ],
    "oa_complementarios": []
  },
  {
    "id": "af0f4041-4031-46d2-b2b2-9d1647e98208",
    "unidad_id": "438711a4-bc90-4dac-ad25-28779588d5c7",
    "leccion_numero": 5,
    "titulo_leccion": "El futuro en movimiento",
    "temas": "futuro de las migraciones, microensayos de anticipación",
    "oa_basales": [
      "OA 9",
      "OA 12",
      "OA 14",
      "OA 15",
      "OA 21"
    ],
    "oa_complementarios": []
  },
  {
    "id": "d1ca9ef2-6dd4-4d20-9ff9-9ee066c7724e",
    "unidad_id": "f8c90807-142d-4bbc-80d3-a992482125d2",
    "leccion_numero": 5,
    "titulo_leccion": "Visiones compartidas",
    "temas": "movimientos literarios, búsquedas estéticas",
    "oa_basales": [
      "OA 11",
      "OA 24",
      "OA 2"
    ],
    "oa_complementarios": []
  },
  {
    "id": "dd0071b8-e1b4-406b-9d11-d67c1f85fbdf",
    "unidad_id": "442f246e-fa07-44a1-8406-a43201fbe537",
    "leccion_numero": 5,
    "titulo_leccion": "Narrarnos a nosotros mismos",
    "temas": "columnas de opinión, formas contemporáneas de contar historias",
    "oa_basales": [
      "OA 9",
      "OA 12",
      "OA 14",
      "OA 15",
      "OA 21"
    ],
    "oa_complementarios": []
  },
  {
    "id": "7d51318d-5699-4f44-b211-785fe98f699c",
    "unidad_id": "4e0f1356-18cf-4f51-9690-3504ff42913d",
    "leccion_numero": 5,
    "titulo_leccion": "La conservación de la biodiversidad",
    "temas": "biodiversidad en distintas culturas, activismo ambiental",
    "oa_basales": [
      "OA 6",
      "OA 7",
      "OA 11",
      "OA 24",
      "OA 27",
      "OA 29"
    ],
    "oa_complementarios": [
      "OA 8",
      "OA 10",
      "OA 13",
      "OA 17",
      "OA 20"
    ]
  },
  {
    "id": "41661cf6-64a2-4a57-8d81-cf701f8d3b5d",
    "unidad_id": "f3561954-3339-45fc-a403-dd9c3812819c",
    "leccion_numero": 5,
    "titulo_leccion": "Narrar para no olvidar",
    "temas": "memoria histórica, tradición oral, narración de historias, identidad cultural, mitos y leyendas locales",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 6",
      "OA 7",
      "OA 14",
      "OA 17",
      "OA 18"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 8",
      "OA 13"
    ]
  },
  {
    "id": "08e5a027-9873-4a10-95ff-d4feda360338",
    "unidad_id": "a9eedf82-25cc-4988-9c00-684401388fc3",
    "leccion_numero": 5,
    "titulo_leccion": "Registros de mi andar",
    "temas": "trayectoria vital propia, autobiografía",
    "oa_basales": [
      "OA 12",
      "OA 15",
      "OA 19"
    ],
    "oa_complementarios": []
  },
  {
    "id": "c6db0a6c-2b8c-4f98-94aa-23cf5c23a8e7",
    "unidad_id": "9a8bd8c0-1889-43c1-9970-9fce98af61c1",
    "leccion_numero": 5,
    "titulo_leccion": "Mis ideas cuentan",
    "temas": "producción de discursos sobre ideas/creencias/valores propios",
    "oa_basales": [
      "OA 9",
      "OA 12",
      "OA 14",
      "OA 15",
      "OA 19"
    ],
    "oa_complementarios": []
  },
  {
    "id": "35554536-61e7-46e9-9a25-842a2b548a24",
    "unidad_id": "e74bf821-808f-41a5-866d-10ff010b651c",
    "leccion_numero": 5,
    "titulo_leccion": "Compromiso con el cambio",
    "temas": "iniciativas contra contaminación/cambio climático, reportajes",
    "oa_basales": [
      "OA 15",
      "OA 17",
      "OA 19"
    ],
    "oa_complementarios": []
  },
  {
    "id": "c7c064e5-c69f-4087-aba2-19d4e0a6ccdc",
    "unidad_id": "f3561954-3339-45fc-a403-dd9c3812819c",
    "leccion_numero": 6,
    "titulo_leccion": "Vientos que arrasan",
    "temas": "fuerzas de la naturaleza, leyendas sobre el clima y desastres naturales, mitología, respeto al medio ambiente",
    "oa_basales": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 4",
      "OA 6",
      "OA 7"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 8",
      "OA 16"
    ]
  },
  {
    "id": "0919064d-41c8-4635-b090-91ad262e4acd",
    "unidad_id": "4e0f1356-18cf-4f51-9690-3504ff42913d",
    "leccion_numero": 6,
    "titulo_leccion": "Conectándonos con la naturaleza",
    "temas": "sensaciones del contacto con la naturaleza, beneficios del deporte al aire libre",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 5",
      "OA 6",
      "OA 7",
      "OA 11",
      "OA 15",
      "OA 18",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 8",
      "OA 12",
      "OA 16"
    ]
  },
  {
    "id": "24e6dad5-66ee-4db4-b22a-47d04d07daba",
    "unidad_id": "06959f52-2261-4b06-a77c-7b40ec4e734d",
    "leccion_numero": 7,
    "titulo_leccion": "Investigando el universo",
    "temas": "misterios del universo, divulgación científica",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 6",
      "OA 7",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 8",
      "OA 12",
      "OA 13"
    ]
  },
  {
    "id": "1907a6ea-08f1-41ee-b4bb-6a8a62804f09",
    "unidad_id": "34bbec4a-a1ff-4548-b744-2a8e5e5546c8",
    "leccion_numero": 7,
    "titulo_leccion": "Coexistir en armonía",
    "temas": "convivencia pacífica, resolución de conflictos, tolerancia, empatía comunitaria",
    "oa_basales": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 4",
      "OA 5",
      "OA 9"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 12"
    ]
  },
  {
    "id": "0dae8905-fddc-40cd-b453-b6d2df483d61",
    "unidad_id": "06959f52-2261-4b06-a77c-7b40ec4e734d",
    "leccion_numero": 8,
    "titulo_leccion": "Distintas creencias sobre el cielo",
    "temas": "cosmogonías de Pueblos Originarios, eclipses",
    "oa_basales": [
      "OA 1",
      "OA 6",
      "OA 7",
      "OA 24",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 12",
      "OA 13"
    ]
  },
  {
    "id": "ea078ee5-0886-4528-be12-1f3e09c884b7",
    "unidad_id": "34bbec4a-a1ff-4548-b744-2a8e5e5546c8",
    "leccion_numero": 8,
    "titulo_leccion": "Guardianes de la naturaleza",
    "temas": "ecología, conservación ambiental, biodiversidad, responsabilidad ecológica activa, flora y fauna",
    "oa_basales": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 4",
      "OA 9",
      "OA 24",
      "OA 26"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 12",
      "OA 25",
      "OA 27",
      "OA 28"
    ]
  },
  {
    "id": "4c2d5e8e-d9f8-4441-bc10-2edd3ce15786",
    "unidad_id": "06959f52-2261-4b06-a77c-7b40ec4e734d",
    "leccion_numero": 9,
    "titulo_leccion": "Historias de vida",
    "temas": "relatos de vida, transmisión de creencias generacional",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 7",
      "OA 11",
      "OA 14",
      "OA 24",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 13",
      "OA 19",
      "OA 23"
    ]
  },
  {
    "id": "adf46255-0c5f-4d66-b6c8-49b0f8a59793",
    "unidad_id": "34bbec4a-a1ff-4548-b744-2a8e5e5546c8",
    "leccion_numero": 9,
    "titulo_leccion": "Pueblos Originarios: Espíritu Verde",
    "temas": "sabiduría ancestral, cosmovisión indígena, respeto por la tierra, relación con la naturaleza",
    "oa_basales": [
      "OA 1",
      "OA 2",
      "OA 3",
      "OA 6",
      "OA 7",
      "OA 9",
      "OA 14",
      "OA 17",
      "OA 18"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 8",
      "OA 12"
    ]
  },
  {
    "id": "0ab7e8f5-6328-4f8d-853b-febde4c60b01",
    "unidad_id": "db9d8ece-efa4-4cb4-b28b-00e8055b56b1",
    "leccion_numero": 10,
    "titulo_leccion": "Viajar para volver a empezar",
    "temas": "migración, adaptación cultural, nuevos comienzos, diversidad cultural, empatía con el migrante",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 9",
      "OA 15",
      "OA 17",
      "OA 18"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 8",
      "OA 12",
      "OA 13",
      "OA 16",
      "OA 22"
    ]
  },
  {
    "id": "9ea61e21-c99e-4431-920b-a1b137d55d9d",
    "unidad_id": "4de57793-30a8-4ec1-b841-e9830cdbe1dc",
    "leccion_numero": 10,
    "titulo_leccion": "Somos iguales",
    "temas": "sociedades antiguas, rol de la mujer, equidad",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 7",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 12",
      "OA 13"
    ]
  },
  {
    "id": "8240d3cc-f6f1-4d57-8768-ccffed853471",
    "unidad_id": "db9d8ece-efa4-4cb4-b28b-00e8055b56b1",
    "leccion_numero": 11,
    "titulo_leccion": "Viajes migratorios",
    "temas": "migración animal, viajes por el mundo, geografía, ecología, adaptaciones para la supervivencia",
    "oa_basales": [
      "OA 1",
      "OA 3",
      "OA 4",
      "OA 6",
      "OA 7",
      "OA 9",
      "OA 11",
      "OA 28"
    ],
    "oa_complementarios": [
      "OA 2",
      "OA 12"
    ]
  },
  {
    "id": "5d07df82-d827-41b5-93fa-3e46ba3dc67f",
    "unidad_id": "4de57793-30a8-4ec1-b841-e9830cdbe1dc",
    "leccion_numero": 11,
    "titulo_leccion": "Mujeres activistas",
    "temas": "activismo, participación femenina en acción climática",
    "oa_basales": [
      "OA 1",
      "OA 6",
      "OA 7",
      "OA 11",
      "OA 18",
      "OA 24",
      "OA 27"
    ],
    "oa_complementarios": [
      "OA 8",
      "OA 10",
      "OA 12",
      "OA 13",
      "OA 17",
      "OA 20"
    ]
  }
] as CurriculumLeccion[],
  oat: [
  {
    "id": "e56d99e2-699c-4f2a-b0c4-f4d1e5aae00a",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "A",
    "texto": "Manifestar disposición a formarse un pensamiento propio, reflexivo e informado, mediante una lectura crítica y el diálogo con otros."
  },
  {
    "id": "2947cbf3-bc42-4030-a5b6-20168e6647a0",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "B",
    "texto": "Manifestar una disposición a reflexionar sobre sí mismo y sobre las cuestiones sociales y éticas que emanan de las lecturas."
  },
  {
    "id": "165173da-b26a-47f6-b7db-77445aeb954a",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "C",
    "texto": "Interesarse por comprender las experiencias e ideas de los demás, utilizando la lectura y el diálogo para el enriquecimiento personal y para la construcción de buenas relaciones con los demás."
  },
  {
    "id": "0bab60ab-e268-4037-b6c6-1da7e087f23e",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "D",
    "texto": "Valorar la diversidad de perspectivas, creencias y culturas, presentes en su entorno y el mundo, como manifestación de la libertad, creatividad y dignidad humana."
  },
  {
    "id": "49621684-2bf6-4641-a9a5-ec39954b1ffb",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión afectiva",
    "texto": "Construir un sentido positivo ante la vida, así como una autoestima y confianza en sí mismo(a) que favorezcan la autoafirmación personal, basándose en el conocimiento de sí y reconociendo tanto potencialidades como ámbitos de superación. Comprender y apreciar la importancia que tienen las dimensiones afectiva, espiritual, ética y social para un sano desarrollo sexual. Apreciar la importancia social, afectiva y espiritual de la familia para el desarrollo integral de cada uno(a) de sus miembros y de toda la sociedad."
  },
  {
    "id": "80d7a850-be81-4951-b55b-b58260de6a87",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión cognitiva-intelectual",
    "texto": "Desplegar las habilidades de investigación que involucran identificar, procesar y sintetizar información de diversas fuentes; organizar información relevante acerca de un tópico o problema; revisar planteamientos a la luz de nuevas evidencias y perspectivas; y suspender los juicios en ausencia de información suficiente. Analizar, interpretar y organizar información con la finalidad de establecer relaciones y comprender procesos y fenómenos complejos, reconociendo su multidimensionalidad, multicausalidad y carácter sistémico. Adaptarse a los cambios en el conocimiento y manejar la incertidumbre. Exponer ideas, opiniones, convicciones, sentimientos y experiencias de manera coherente y fundamentada, haciendo uso de diversas y variadas formas de expresión. Resolver problemas de manera reflexiva en el ámbito escolar, familiar y social, tanto utilizando modelos y rutinas como aplicando de manera creativa conceptos, criterios, principios y leyes generales. Diseñar, planificar y realizar proyectos. Pensar en forma libre, reflexiva y metódica para evaluar críticamente situaciones en los ámbitos escolar, familiar, social, laboral y en su vida cotidiana, así como para evaluar su propia actividad, favoreciendo el conocimiento, comprensión y organización de la propia experiencia."
  },
  {
    "id": "cab83ce6-8bf5-479f-b7aa-0c7e3a642f97",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión espiritual",
    "texto": "Reconocer la finitud humana. Reconocer y reflexionar sobre diversas formas de responder las preguntas acerca de la dimensión trascendente y/o religiosa de la vida humana y del sentido de la existencia."
  },
  {
    "id": "6502503f-42fa-4af7-8b10-bbbf13978ecd",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión física",
    "texto": "Favorecer el desarrollo físico personal y el autocuidado, en el contexto de la valoración de la vida y el propio cuerpo, mediante hábitos de higiene, prevención de riesgos y hábitos de vida saludable. Desarrollar hábitos de vida activa llevando a cabo actividad física adecuada a sus intereses y aptitudes."
  },
  {
    "id": "ec3a462f-108b-4471-9870-ccb86f4121e2",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión moral",
    "texto": "Ejercer de modo responsable grados crecientes de libertad y autonomía personal, de acuerdo a los valores de justicia, solidaridad, honestidad, respeto, bien común y generosidad. Conocer, respetar y defender la igualdad de derechos esenciales de todas las personas, sin distinción de sexo, edad, condición física, etnia, religión o situación económica, y actuar en concordancia con el principio ético que reconoce que todos los “seres humanos nacen libres e iguales en dignidad y derechos y, dotados de razón y conciencia, deben comportarse fraternalmente los unos con los otros”. Valorar el carácter único de cada ser humano y, por lo tanto, la diversidad que se manifiesta entre las personas, y desarrollar la capacidad de empatía con los otros. Reconocer y respetar la diversidad cultural, religiosa y étnica y las ideas y creencias distintas de las propias en los espacios escolares, familiares y comunitarios, interactuando de manera constructiva mediante la cooperación y reconociendo el diálogo como fuente de crecimiento y de superación de las diferencias."
  },
  {
    "id": "b6147c2d-6d95-40ef-b7ed-7db62aa40b9e",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión sociocultural y ciudadana",
    "texto": "Valorar la vida en sociedad como una dimensión esencial del crecimiento de la persona, así como la participación ciudadana democrática, activa, solidaria, responsable, con conciencia de los respectivos deberes y derechos; desenvolverse en su entorno de acuerdo a estos principios y proyectar su participación plena en la sociedad de carácter democrático. Valorar el compromiso en las relaciones entre las personas y al acordar contratos: en la amistad, en el amor, en el matrimonio, en el trabajo y al emprender proyectos. Participar solidaria y responsablemente en las actividades y proyectos de la familia, del establecimiento y de la comunidad. Conocer y valorar la historia y sus actores, las tradiciones, los símbolos y el patrimonio territorial y cultural de la nación, en el contexto de un mundo crecientemente globalizado e interdependiente, comprendiendo la tensión y la complementariedad que existe entre ambos planos. Reconocer y respetar la igualdad de derechos entre hombres y mujeres y apreciar la importancia de desarrollar relaciones que potencien su participación equitativa en la vida económica familiar, social y cultural. Conocer el problema ambiental global, y proteger y conservar el entorno natural y sus recursos como contexto de desarrollo humano."
  },
  {
    "id": "81765ac9-2d9b-4c8c-8215-a62bf55f0862",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "E",
    "texto": "Valorar las posibilidades que da el discurso hablado y escrito para participar de manera proactiva, informada y responsable en la vida de la sociedad democrática."
  },
  {
    "id": "c5420ffc-fe13-4578-91d2-4e7fcbffcb9f",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "F",
    "texto": "Valorar la evidencia y la búsqueda de conocimientos que apoyen sus aseveraciones."
  },
  {
    "id": "694e0f12-80d1-4906-9b9b-2e183a4c1f94",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "G",
    "texto": "Realizar tareas y trabajos de forma rigurosa y perseverante, entendiendo que los logros se obtienen solo después de un trabajo prolongado."
  },
  {
    "id": "394e1fbf-1767-4dc9-87ed-5e4bd9efaab7",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "H",
    "texto": "Trabajar colaborativamente, usando de manera responsable las tecnologías de la comunicación, dando crédito al trabajo de otros y respetando la propiedad y la privacidad de las personas."
  },
  {
    "id": "74f9fa1c-c7e7-40c5-a35c-be1b88e19c55",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Planes y proyectos personales",
    "texto": "Desarrollar planes de vida y proyectos personales, con discernimiento sobre los propios derechos, necesidades e intereses, así como sobre las responsabilidades con los demás, en especial, en el ámbito de la familia."
  },
  {
    "id": "a746a393-3604-4f44-8289-fc8b396114d9",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Proactividad y trabajo",
    "texto": "Demostrar interés por conocer la realidad y utilizar el conocimiento. Practicar la iniciativa personal, la creatividad y el espíritu emprendedor en los ámbitos personal, escolar y comunitario, aportando con esto al desarrollo de la sociedad. Trabajar en equipo de manera responsable, construyendo relaciones de cooperación basadas en la confianza mutua, y resolviendo adecuadamente los conflictos. Comprender y valorar la perseverancia, el rigor y el cumplimiento, por un lado, y la flexibilidad, la originalidad, la aceptación de consejos y críticas y el asumir riesgos, por el otro, como aspectos fundamentales en el desarrollo y la consumación exitosa de tareas y trabajos. Reconocer la importancia del trabajo —manual e intelectual— como forma de desarrollo personal, familiar, social y de contribución al bien común, valorando sus procesos y resultados según criterios de satisfacción personal, sentido de vida, calidad, productividad, innovación, responsabilidad social e impacto sobre el medioambiente, y apreciando la dignidad esencial de todo trabajo y el valor eminente de la persona que lo realiza. Gestionar de manera activa el propio aprendizaje, utilizando sus capacidades de análisis, interpretación y síntesis para monitorear y evaluar su logro."
  },
  {
    "id": "0fc65a63-90bf-474a-89a1-013266bd094d",
    "nivel": "1° Medio",
    "tipo": "OAT",
    "codigo": "Tecnologías de la información y la comunicación (TIC)",
    "texto": "En el nivel medio, se espera que las alumnas y los alumnos aprendan a usar las tecnologías de la información y la comunicación (TIC) para buscar información y evaluar su pertinencia y calidad, aportar en redes virtuales de comunicación o participación, utilizar distintas TIC para comunicar ideas y argumentos, y modelar información y situaciones, entre otras tareas."
  },
  {
    "id": "b733731e-8d2d-4751-b840-9bf27ad7b4e0",
    "nivel": "1° Medio",
    "tipo": "Actitud",
    "codigo": "TIC",
    "texto": "Uso de Tecnologías de la Información y la Comunicación (TIC) para el Nivel Medio: en el nivel medio, se espera que los estudiantes lleven a cabo operaciones con mayor fluidez: buscar información y evaluar su pertinencia y calidad; aportar en redes virtuales de comunicación o participación; utilizar distintas TIC para comunicar ideas y argumentos; modelar información y situaciones; usar procesadores de texto, software de presentación y planillas de cálculo para organizar, crear y presentar información, gráficos o modelos; actuar responsablemente: respetar y asumir consideraciones éticas en el uso de las TIC, señalar las fuentes de las cuales se obtiene la información y respetar las normas de uso y de seguridad, identificar ejemplos de plagio y discutir las posibles consecuencias de reproducir el trabajo de otras personas. (Referencia: Programa de Estudio Lengua y Literatura 1° Medio, Mineduc, págs. 13, 18-19, 50-51.)"
  },
  {
    "id": "64bef489-b9d4-4cc9-9624-272de1843539",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "A",
    "texto": "Manifestar disposición a formarse un pensamiento propio, reflexivo e informado, mediante una lectura crítica y el diálogo con otros."
  },
  {
    "id": "d44a5b50-ce00-41d3-bfde-8a83b1ecaba6",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "B",
    "texto": "Manifestar una disposición a reflexionar sobre sí mismo y sobre las cuestiones sociales y éticas que emanan de las lecturas."
  },
  {
    "id": "cf9915b6-5b3e-47ed-a5b8-528156d00ecd",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "C",
    "texto": "Interesarse por comprender las experiencias e ideas de los demás, utilizando la lectura y el diálogo para el enriquecimiento personal y la construcción de buenas relaciones."
  },
  {
    "id": "39dd5b3f-21b6-497a-b90a-f01e0941c1c1",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "D",
    "texto": "Valorar la diversidad de perspectivas, creencias y culturas, presentes en su entorno y el mundo, como manifestación de la libertad, creatividad y dignidad humana."
  },
  {
    "id": "48c8a076-afdd-4f5f-b9c5-6218c8fc8f4e",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión afectiva",
    "texto": "Construir un sentido positivo ante la vida, así como una autoestima y confianza en sí mismo(a) que favorezcan la autoafirmación personal, basándose en el conocimiento de sí y reconociendo tanto potencialidades como ámbitos de superación. Fomentar en las alumnas y los alumnos la construcción de la identidad y la propia imagen, desarrollando la capacidad de monitorear y regular sus desempeños para facilitar la metacognición y la autorregulación. Comprender y apreciar la importancia que tienen las dimensiones afectiva, espiritual, ética y social para un sano desarrollo sexual. Apreciar la importancia social, afectiva y espiritual de la familia para el desarrollo integral de cada uno de sus miembros y de toda la sociedad."
  },
  {
    "id": "9dcf3b1a-ad33-415c-a24d-55c5f334a88c",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión cognitiva-intelectual",
    "texto": "Desplegar las habilidades de investigación que involucran identificar, procesar y sintetizar información de diversas fuentes; organizar información relevante acerca de un tópico o problema; revisar planteamientos a la luz de nuevas evidencias y perspectivas; y suspender los juicios en ausencia de información suficiente. Analizar, interpretar y organizar información con la finalidad de establecer relaciones y comprender procesos y fenómenos complejos, reconociendo su multidimensionalidad, multicausalidad y carácter sistémico. Adaptarse a los cambios en el conocimiento y manejar la incertidumbre. Exponer ideas, opiniones, convicciones, sentimientos y experiencias de manera coherente y fundamentada, haciendo uso de diversas y variadas formas de expresión. Resolver problemas de manera reflexiva en el ámbito escolar, familiar y social, tanto utilizando modelos y rutinas como aplicando de manera creativa conceptos, criterios, principios y leyes generales. Diseñar, planificar y realizar proyectos. Pensar en forma libre, reflexiva y metódica para evaluar críticamente situaciones en los ámbitos escolar, familiar, social, laboral y en su vida cotidiana, así como para evaluar su propia actividad, favoreciendo el conocimiento, comprensión y organización de la propia experiencia."
  },
  {
    "id": "7372cb0d-148c-44f1-8947-19cb5a77facc",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión espiritual",
    "texto": "Reconocer la finitud humana. Reconocer y reflexionar sobre diversas formas de responder las preguntas acerca de la dimensión trascendente y/o religiosa de la vida humana y del sentido de la existencia."
  },
  {
    "id": "a64518c9-4cec-47e8-b78d-3a70ca7a0a63",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión física",
    "texto": "Favorecer el desarrollo físico personal y el autocuidado, en el contexto de la valoración de la vida y el propio cuerpo, mediante hábitos de higiene, prevención de riesgos y hábitos de vida saludable. Desarrollar hábitos de vida activa llevando a cabo actividad física adecuada a sus intereses y aptitudes."
  },
  {
    "id": "a5af1b7e-7e0a-4cb0-89a6-43c7eeaac483",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión moral",
    "texto": "Ejercer de modo responsable grados crecientes de libertad y autonomía personal, de acuerdo a los valores de justicia, solidaridad, honestidad, respeto, bien común y generosidad. Conocer, respetar y defender la igualdad de derechos esenciales de todas las personas, sin distinción de sexo, edad, condición física, etnia, religión o situación económica. Valorar el carácter único de cada ser humano y, por lo tanto, la diversidad que se manifiesta entre las personas, y desarrollar la capacidad de empatía con los otros. Reconocer y respetar la diversidad cultural, religiosa y étnica y las ideas y creencias distintas de las propias en los espacios escolares, familiares y comunitarios, interactuando de manera constructiva mediante la cooperación y reconociendo el diálogo como fuente de crecimiento."
  },
  {
    "id": "d1b049b0-1672-4ca3-9b47-da24183b77b4",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Dimensión sociocultural y ciudadana",
    "texto": "Valorar la vida en sociedad como una dimensión esencial del crecimiento de la persona, así como la participación ciudadana democrática, activa, solidaria, responsable, con conciencia de los respectivos deberes y derechos. Valorar el compromiso en las relaciones entre las personas y al acordar contratos: en la amistad, en el amor, en el matrimonio, en el trabajo y al emprender proyectos. Conocer y valorar la historia y sus actores, las tradiciones, los símbolos y el patrimonio territorial y cultural de la nación en un mundo globalizado. Reconocer y respetar la igualdad de derechos entre hombres y mujeres y apreciar la importancia de desarrollar relaciones que potencien su participación equitativa en la vida económica, familiar, social y cultural. Conocer el problema ambiental global, y proteger y conservar el entorno natural y sus recursos como contexto de desarrollo humano."
  },
  {
    "id": "f9091d51-4b22-4d20-bd0f-6e92e8fb53f4",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "E",
    "texto": "Valorar las posibilidades que da el discurso hablado y escrito para participar de manera proactiva, informada y responsable en la vida de la sociedad democrática."
  },
  {
    "id": "67a30d32-024c-4f78-8cca-95e1f16737a0",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "F",
    "texto": "Valorar la evidencia y la búsqueda de conocimientos que apoyen sus aseveraciones."
  },
  {
    "id": "1d7ce9bf-fe04-42a3-8fc6-3fde3f48972a",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "G",
    "texto": "Realizar tareas y trabajos de forma rigurosa y perseverante, entendiendo que los logros se obtienen solo después de un trabajo prolongado."
  },
  {
    "id": "bf92c750-158a-4a70-b312-366619b2f559",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "H",
    "texto": "Trabajar colaborativamente, usando de manera responsable las tecnologías de la comunicación, dando crédito al trabajo de otros y respetando la propiedad y la privacidad de las personas."
  },
  {
    "id": "ab3bc6be-f52f-4ffa-9360-73bc7c95ce67",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Proactividad y trabajo",
    "texto": "Demostrar interés por conocer la realidad y utilizar el conocimiento. Practicar la iniciativa personal, la creatividad y el espíritu emprendedor en los ámbitos personal, escolar y comunitario, aportando con esto al desarrollo de la sociedad. Trabajar en equipo de manera responsable, construyendo relaciones de cooperación basadas en la confianza mutua, y resolviendo adecuadamente los conflictos. Comprender y valorar la perseverancia, el rigor y el cumplimiento, así como la flexibilidad, la originalidad, la aceptación de consejos y críticas y el asumir riesgos. Gestionar de manera activa el propio aprendizaje, utilizando sus capacidades de análisis, interpretación y síntesis para monitorear y evaluar su logro."
  },
  {
    "id": "8f59770f-22ee-4c13-b536-defec8c8fdb1",
    "nivel": "2° Medio",
    "tipo": "OAT",
    "codigo": "Tecnologías de la información y la comunicación (TIC)",
    "texto": "En el nivel medio, se espera que los estudiantes aprendan a usar las TIC para buscar información y evaluar su pertinencia y calidad, aportar en redes virtuales de comunicación o participación, utilizar distintas TIC para comunicar ideas y argumentos, y modelar información y situaciones."
  },
  {
    "id": "49706aa9-c5b8-4be1-92b0-06923fa13a48",
    "nivel": "2° Medio",
    "tipo": "Actitud",
    "codigo": "TIC",
    "texto": "Uso de Tecnologías de la Información y la Comunicación (TIC) para el Nivel Medio: en el nivel medio, se espera que los estudiantes lleven a cabo operaciones con mayor fluidez: buscar información y evaluar su pertinencia y calidad; aportar en redes virtuales de comunicación o participación; utilizar distintas TIC para comunicar ideas y argumentos; modelar información y situaciones; usar procesadores de texto, software de presentación y planillas de cálculo para organizar, crear y presentar información, gráficos o modelos; actuar responsablemente: respetar y asumir consideraciones éticas en el uso de las TIC, señalar las fuentes de las cuales se obtiene la información y respetar las normas de uso y de seguridad, identificar ejemplos de plagio y discutir las posibles consecuencias de reproducir el trabajo de otras personas. (Referencia: Programa de Estudio Lengua y Literatura 2° Medio, Mineduc, págs. 13, 18-19, 50-51.)"
  },
  {
    "id": "8eea8cb0-8628-4898-a6d6-e9744cddf060",
    "nivel": "5° Básico",
    "tipo": "Actitud",
    "codigo": "a",
    "texto": "Demostrar interés y una actitud activa frente a la lectura, orientada al disfrute de la misma y a la valoración del conocimiento que se puede obtener a partir de ella."
  },
  {
    "id": "a90468aa-9477-47bd-bb98-ef5adfa00714",
    "nivel": "5° Básico",
    "tipo": "Actitud",
    "codigo": "b",
    "texto": "Demostrar disposición e interés por compartir ideas, experiencias y opiniones con otros."
  },
  {
    "id": "00b71be4-0702-4d81-b925-b26f300af4e4",
    "nivel": "5° Básico",
    "tipo": "Actitud",
    "codigo": "c",
    "texto": "Demostrar disposición e interés por expresarse de manera creativa por medio de la comunicación oral y escrita."
  },
  {
    "id": "22825ad5-2902-452e-8748-eea34e176829",
    "nivel": "5° Básico",
    "tipo": "Actitud",
    "codigo": "d",
    "texto": "Realizar tareas y trabajos de forma rigurosa y perseverante, con el fin de desarrollarlos de manera adecuada a los propósitos de la asignatura."
  },
  {
    "id": "59a1f827-b01a-43e6-a776-a2d72d511b3e",
    "nivel": "5° Básico",
    "tipo": "Actitud",
    "codigo": "e",
    "texto": "Reflexionar sobre sí mismo, sus ideas y sus intereses para comprenderse y valorarse."
  },
  {
    "id": "fcfed4ec-45b9-4273-b38f-b3577e1457d7",
    "nivel": "5° Básico",
    "tipo": "Actitud",
    "codigo": "f",
    "texto": "Demostrar empatía hacia los demás, comprendiendo el contexto en el que se sitúan."
  },
  {
    "id": "457dff52-d49e-4791-b5c0-c158a6394d3a",
    "nivel": "5° Básico",
    "tipo": "Actitud",
    "codigo": "g",
    "texto": "Demostrar respeto por las diversas opiniones y puntos de vista, reconociendo el diálogo como una herramienta de enriquecimiento personal y social."
  },
  {
    "id": "917f5fe1-49b5-4cc3-a808-0b351421e643",
    "nivel": "5° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 1",
    "texto": "Favorecer el desarrollo físico y el autocuidado, en el marco del respeto y valoración del cuerpo."
  },
  {
    "id": "39a02e4e-f0c2-4e7f-ab74-c9dccfecbf65",
    "nivel": "5° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 2",
    "texto": "Desarrollar el pensamiento reflexivo y metódico y el sentido de crítica y autocrítica."
  },
  {
    "id": "7f1c0efe-a60f-4a73-86ea-d95bd07f7f07",
    "nivel": "5° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 3",
    "texto": "Promover el interés por conocer la realidad y utilizar el conocimiento y seleccionar información."
  },
  {
    "id": "c2521b0f-0b2f-4461-af44-cbc56a55ea2b",
    "nivel": "5° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 4",
    "texto": "Aprender a usar las tecnologías de la información de manera reflexiva y eficaz para obtener, procesar y comunicar información."
  },
  {
    "id": "69bf402d-6aae-4626-a71f-d03050bb4f18",
    "nivel": "6° Básico",
    "tipo": "Actitud",
    "codigo": "a",
    "texto": "Demostrar interés y una actitud activa frente a la lectura, orientada al disfrute de la misma y a la valoración del conocimiento que se puede obtener a partir de ella."
  },
  {
    "id": "6f0d66bc-82be-4563-9b07-d208d9bd8992",
    "nivel": "6° Básico",
    "tipo": "Actitud",
    "codigo": "b",
    "texto": "Demostrar disposición e interés por compartir ideas, experiencias y opiniones con otros."
  },
  {
    "id": "7ddb322f-755d-47e5-9424-5922fdd25b8b",
    "nivel": "6° Básico",
    "tipo": "Actitud",
    "codigo": "c",
    "texto": "Demostrar disposición e interés por expresarse de manera creativa por medio de la comunicación oral y escrita."
  },
  {
    "id": "1b42ed76-a68c-4ef4-ac76-d8c4e984e784",
    "nivel": "6° Básico",
    "tipo": "Actitud",
    "codigo": "d",
    "texto": "Realizar tareas y trabajos de forma rigurosa y perseverante, con el fin de desarrollarlos de manera adecuada a los propósitos de la asignatura."
  },
  {
    "id": "bbd9c04d-f502-4722-83ed-6a7848d98b5f",
    "nivel": "6° Básico",
    "tipo": "Actitud",
    "codigo": "e",
    "texto": "Reflexionar sobre sí mismo, sus ideas y sus intereses para comprenderse y valorarse."
  },
  {
    "id": "257b0a74-ef92-451c-a33a-b9f0036607d6",
    "nivel": "6° Básico",
    "tipo": "Actitud",
    "codigo": "f",
    "texto": "Demostrar empatía hacia los demás, comprendiendo el contexto en el que se sitúan."
  },
  {
    "id": "65e16fc5-7083-40a6-a09c-835d94202967",
    "nivel": "6° Básico",
    "tipo": "Actitud",
    "codigo": "g",
    "texto": "Demostrar respeto por las diversas opiniones y puntos de vista, reconociendo el diálogo como una herramienta de enriquecimiento personal y social."
  },
  {
    "id": "000d4463-95d0-4154-b850-9a76a1c45a2c",
    "nivel": "6° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 1",
    "texto": "Favorecer el desarrollo de capacidades de análisis, síntesis, resolución de problemas y pensamiento reflexivo y crítico."
  },
  {
    "id": "983b0f07-dea3-4cd3-886c-1845ca8d2f96",
    "nivel": "6° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 2",
    "texto": "Demostrar interés por conocer la realidad y utilizar el conocimiento."
  },
  {
    "id": "42f5ebd7-3203-42cc-8c0c-dec762d0d120",
    "nivel": "6° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 3",
    "texto": "Trabajar en equipo de manera responsable, construyendo relaciones de confianza mutua."
  },
  {
    "id": "995bc7cf-e68b-4262-940a-aefaacf9e96b",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "A",
    "texto": "Manifestar disposición a formarse un pensamiento propio, reflexivo e informado, mediante una lectura crítica y el diálogo con otros."
  },
  {
    "id": "cb5ed77a-b7c0-4380-8554-4de4fb90d015",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "B",
    "texto": "Manifestar disposición a reflexionar sobre sí mismo y sobre las cuestiones sociales y éticas que emanan de las lecturas."
  },
  {
    "id": "9f94d7eb-b931-46a5-a5de-da34ae37849f",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "C",
    "texto": "Interesarse por comprender las experiencias e ideas de los demás, utilizando la lectura y el diálogo para el enriquecimiento personal y para la construcción de buenas relaciones con los demás."
  },
  {
    "id": "a7820cbb-3795-421f-ac7b-6b4d5dae3ea2",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "D",
    "texto": "Valorar la diversidad de perspectivas, creencias y culturas, presentes en su entorno y el mundo, como manifestación de la libertad, creatividad y dignidad humana."
  },
  {
    "id": "f6e0ee92-5d89-44e0-8c29-28a0f41b4529",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión afectiva",
    "texto": "Construir un sentido positivo ante la vida, así como una autoestima y confianza en sí mismo(a) que favorezcan la autoafirmación personal, basándose en el conocimiento de sí y reconociendo tanto potencialidades como ámbitos de superación. Comprender y apreciar la importancia que tienen las dimensiones afectiva, espiritual, ética y social para un sano desarrollo sexual. Apreciar la importancia social, afectiva y espiritual de la familia para el desarrollo integral de cada uno(a) de sus miembros y de toda la sociedad."
  },
  {
    "id": "418bca7f-1791-4561-99b0-9e9e3073820a",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión cognitiva-intelectual",
    "texto": "Desplegar las habilidades de investigación que involucran identificar, procesar y sintetizar información de diversas fuentes; organizar información relevante acerca de un tópico o problema; revisar planteamientos a la luz de nuevas evidencias y perspectivas; y suspender los juicios en ausencia de información suficiente. Analizar, interpretar y organizar información con la finalidad de establecer relaciones y comprender procesos y fenómenos complejos, reconociendo su multidimensionalidad, multicausalidad y carácter sistémico. Adaptarse a los cambios en el conocimiento y manejar la incertidumbre. Exponer ideas, opiniones, convicciones, sentimientos y experiencias de manera coherente y fundamentada, haciendo uso de diversas y variadas formas de expresión. Resolver problemas de manera reflexiva en el ámbito escolar, familiar y social, tanto utilizando modelos y rutinas como aplicando de manera creativa conceptos, criterios, principios y leyes generales. Diseñar, planificar y realizar proyectos. Pensar en forma libre, reflexiva y metódica para evaluar críticamente situaciones en los ámbitos escolar, familiar, social, laboral y en su vida cotidiana, así como para evaluar su propia actividad, favoreciendo el conocimiento, comprensión y organización de la propia experiencia."
  },
  {
    "id": "d065c570-dc71-44ad-9bcc-73cd415e068b",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión espiritual",
    "texto": "Reconocer la finitud humana. Reconocer y reflexionar sobre diversas formas de responder las preguntas acerca de la dimensión trascendente y/o religiosa de la vida humana y del sentido de la existencia."
  },
  {
    "id": "442876df-e92b-4781-aac9-241cf770a3ab",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión física",
    "texto": "Favorecer el desarrollo físico personal y el autocuidado, en el contexto de la valoración de la vida y el propio cuerpo, mediante hábitos de higiene, prevención de riesgos y hábitos de vida saludable. Desarrollar hábitos de vida activa llevando a cabo actividad física adecuada a sus intereses y aptitudes."
  },
  {
    "id": "01f099f5-4337-47b7-a264-9ff6643590c8",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión moral",
    "texto": "Ejercer de modo responsable grados crecientes de libertad y autonomía personal, de acuerdo a los valores de justicia, solidaridad, honestidad, respeto, bien común y generosidad. Conocer, respetar y defender la igualdad de derechos esenciales de todas las personas, sin distinción de sexo, edad, condición física, etnia, religión o situación económica, y actuar en concordancia con el principio ético que reconoce que todos los \"seres humanos nacen libres e iguales en dignidad y derechos y, dotados de razón y conciencia, deben comportarse fraternalmente los unos con los otros\" (Declaración Universal de Derechos Humanos, Artículo 1º). Valorar el carácter único de cada ser humano y, por lo tanto, la diversidad que se manifiesta entre las personas, y desarrollar la capacidad de empatía con los otros. Reconocer y respetar la diversidad cultural, religiosa y étnica y las ideas y creencias distintas de las propias en los espacios escolares, familiares y comunitarios, interactuando de manera constructiva mediante la cooperación y reconociendo el diálogo como fuente de crecimiento y de superación de las diferencias."
  },
  {
    "id": "df745eb9-ab14-4cd5-9ad1-04c8412548be",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión sociocultural y ciudadana",
    "texto": "Valorar la vida en sociedad como una dimensión esencial del crecimiento de la persona, así como la participación ciudadana democrática, activa, solidaria, responsable, con conciencia de los respectivos deberes y derechos; desenvolverse en su entorno de acuerdo a estos principios y proyectar su participación plena en la sociedad de carácter democrático. Valorar el compromiso en las relaciones entre las personas y al acordar contratos: en la amistad, en el amor, en el matrimonio, en el trabajo y al emprender proyectos. Participar solidaria y responsablemente en las actividades y proyectos de la familia, del establecimiento y de la comunidad. Conocer y valorar la historia y sus actores, las tradiciones, los símbolos y el patrimonio territorial y cultural de la nación, en el contexto de un mundo crecientemente globalizado e interdependiente, comprendiendo la tensión y la complementariedad que existe entre ambos planos. Reconocer y respetar la igualdad de derechos entre hombres y mujeres y apreciar la importancia de desarrollar relaciones que potencien su participación equitativa en la vida económica familiar, social y cultural. Conocer el problema ambiental global, y proteger y conservar el entorno natural y sus recursos como contexto de desarrollo humano."
  },
  {
    "id": "62a607bb-d94d-4470-a18c-e5d01fe47ad7",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "E",
    "texto": "Valorar las posibilidades que da el discurso hablado y escrito para participar de manera proactiva, informada y responsable en la vida de la sociedad democrática."
  },
  {
    "id": "d08e3ff4-0a15-4002-acff-0733473cd684",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "F",
    "texto": "Valorar la evidencia y la búsqueda de conocimientos que apoyen sus aseveraciones."
  },
  {
    "id": "b9686c8a-ba95-4e70-b305-72dffdb00d09",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "G",
    "texto": "Realizar tareas y trabajos de forma rigurosa y perseverante, entendiendo que los logros se obtienen solo después de un trabajo prolongado."
  },
  {
    "id": "f13f3709-87bd-426a-acfa-302d13ae4bca",
    "nivel": "7° Básico",
    "tipo": "Actitud",
    "codigo": "H",
    "texto": "Trabajar colaborativamente, usando de manera responsable las tecnologías de la comunicación, dando crédito al trabajo de otros y respetando la propiedad y la privacidad de las personas."
  },
  {
    "id": "4f3bbde4-52ee-4a74-bfb0-8876ac5b1817",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 1",
    "texto": "Ejercer de modo responsable grados crecientes de libertad y autonomía personal, de acuerdo a valores de justicia, honestidad y respeto."
  },
  {
    "id": "1bbf240a-1296-46cc-a609-9de7c8c7a48c",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 2",
    "texto": "Demostrar interés por conocer la realidad y utilizar el conocimiento."
  },
  {
    "id": "232e6977-0655-45e8-9b10-276fb9f57ea7",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 3",
    "texto": "Gestionar de manera activa el propio aprendizaje, utilizando capacidades de análisis e interpretación."
  },
  {
    "id": "6612425a-d7f9-482b-b7f3-c8bf8be7aa00",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 4",
    "texto": "Usar de manera responsable y efectiva las tecnologías de la comunicación."
  },
  {
    "id": "ef2f8101-7da4-4887-a791-92267cce87fe",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Proactividad y trabajo",
    "texto": "Demostrar interés por conocer la realidad y utilizar el conocimiento. Practicar la iniciativa personal, la creatividad y el espíritu emprendedor en los ámbitos personal, escolar y comunitario, aportando con esto al desarrollo de la sociedad. Trabajar en equipo de manera responsable, construyendo relaciones de cooperación basadas en la confianza mutua, y resolviendo adecuadamente los conflictos. Comprender y valorar la perseverancia, el rigor y el cumplimiento, por un lado, y la flexibilidad, la originalidad, la aceptación de consejos y críticas y el asumir riesgos, por el otro, como aspectos fundamentales en el desarrollo y la consumación exitosa de tareas y trabajos. Reconocer la importancia del trabajo —manual e intelectual— como forma de desarrollo personal, familiar, social y de contribución al bien común, valorando sus procesos y resultados según criterios de satisfacción personal, sentido de vida, calidad, productividad, innovación, responsabilidad social e impacto sobre el medioambiente, y apreciando la dignidad esencial de todo trabajo y el valor eminente de la persona que lo realiza. Gestionar de manera activa el propio aprendizaje, utilizando sus capacidades de análisis, interpretación y síntesis para monitorear y evaluar su logro."
  },
  {
    "id": "218916ed-3c12-41ae-bd53-a8aca03345ea",
    "nivel": "7° Básico",
    "tipo": "OAT",
    "codigo": "Tecnologías de la información y la comunicación (TIC)",
    "texto": "Buscar, acceder y procesar información de diversas fuentes virtuales y evaluar su calidad y pertinencia. Utilizar TIC que resuelvan las necesidades de información, comunicación, expresión y creación dentro del entorno educativo y social inmediato. Utilizar aplicaciones para presentar, representar, analizar y modelar información y situaciones, comunicar ideas y argumentos, comprender y resolver problemas de manera eficiente y efectiva, aprovechando múltiples medios (texto, imagen, audio y video)."
  },
  {
    "id": "340f79f0-c73b-4e60-9c52-fe6844b2e586",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "A",
    "texto": "Manifestar disposición a formarse un pensamiento propio, reflexivo e informado, mediante una lectura crítica y el diálogo con otros."
  },
  {
    "id": "cc18843e-6aea-4712-8b5f-76bb210c34cd",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "B",
    "texto": "Manifestar una disposición a reflexionar sobre sí mismo y sobre las cuestiones sociales y éticas que emanan de las lecturas."
  },
  {
    "id": "2a99f54c-cabd-4faa-8558-68544a31fa9f",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "C",
    "texto": "Interesarse por comprender las experiencias e ideas de los demás, utilizando la lectura y el diálogo para el enriquecimiento personal y para la construcción de buenas relaciones con los demás."
  },
  {
    "id": "274c7b37-2123-4717-8e58-73af375a5203",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "D",
    "texto": "Valorar la diversidad de perspectivas, creencias y culturas, presentes en su entorno y el mundo, como manifestación de la libertad, creatividad y dignidad humana."
  },
  {
    "id": "cf748b91-7a32-4b48-9cfe-04395db7303a",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión afectiva",
    "texto": "Construir un sentido positivo ante la vida, así como una autoestima y confianza en sí mismo(a) que favorezcan la autoafirmación personal, basándose en el conocimiento de sí y reconociendo tanto potencialidades como ámbitos de superación. Comprender y apreciar la importancia que tienen las dimensiones afectiva, espiritual, ética y social para un sano desarrollo sexual. Apreciar la importancia social, afectiva y espiritual de la familia para el desarrollo integral de cada uno(a) de sus miembros y de toda la sociedad."
  },
  {
    "id": "308cafde-2039-4242-bacb-04705c027218",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión cognitiva-intelectual",
    "texto": "Desplegar las habilidades de investigación que involucran identificar, procesar y sintetizar información de diversas fuentes; organizar información relevante acerca de un tópico o problema; revisar planteamientos a la luz de nuevas evidencias y perspectivas; y suspender los juicios en ausencia de información suficiente. Analizar, interpretar y organizar información con la finalidad de establecer relaciones y comprender procesos y fenómenos complejos, reconociendo su multidimensionalidad, multicausalidad y carácter sistémico. Adaptarse a los cambios en el conocimiento y manejar la incertidumbre. Exponer ideas, opiniones, convicciones, sentimientos y experiencias de manera coherente y fundamentada, haciendo uso de diversas y variadas formas de expresión. Resolver problemas de manera reflexiva en el ámbito escolar, familiar y social, tanto utilizando modelos y rutinas como aplicando de manera creativa conceptos, criterios, principios y leyes generales. Diseñar, planificar y realizar proyectos. Pensar en forma libre, reflexiva y metódica para evaluar críticamente situaciones en los ámbitos escolar, familiar, social, laboral y en su vida cotidiana, así como para evaluar su propia actividad, favoreciendo el conocimiento, comprensión y organización de la propia experiencia."
  },
  {
    "id": "c65f9049-7a12-4428-aa8b-8c83a4b60ebd",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión espiritual",
    "texto": "Reconocer la finitud humana. Reconocer y reflexionar sobre diversas formas de responder las preguntas acerca de la dimensión trascendente y/o religiosa de la vida humana y del sentido de la existencia."
  },
  {
    "id": "370c453b-448f-481c-b9e9-c90854ea7744",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión física",
    "texto": "Favorecer el desarrollo físico personal y el autocuidado, en el contexto de la valoración de la vida y el propio cuerpo, mediante hábitos de higiene, prevención de riesgos y hábitos de vida saludable. Desarrollar hábitos de vida activa llevando a cabo actividad física adecuada a sus intereses y aptitudes."
  },
  {
    "id": "6280472c-6e60-4fb2-ab1b-1390a2a27b90",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión moral",
    "texto": "Ejercer de modo responsable grados crecientes de libertad y autonomía personal, de acuerdo a los valores de justicia, solidaridad, honestidad, respeto, bien común y generosidad. Conocer, respetar y defender la igualdad de derechos esenciales de todas las personas, sin distinción de sexo, edad, condición física, etnia, religión o situación económica, y actuar en concordancia con el principio ético que reconoce que todos los \"seres humanos nacen libres e iguales en dignidad y derechos y, dotados de razón y conciencia, deben comportarse fraternalmente los unos con los otros\" (Declaración Universal de Derechos Humanos, Artículo 1º). Valorar el carácter único de cada ser humano y, por lo tanto, la diversidad que se manifiesta entre las personas, y desarrollar la capacidad de empatía con los otros. Reconocer y respetar la diversidad cultural, religiosa y étnica y las ideas y creencias distintas de las propias en los espacios escolares, familiares y comunitarios, interactuando de manera constructiva mediante la cooperación y reconociendo el diálogo como fuente de crecimiento y de superación de las diferencias."
  },
  {
    "id": "14cdf037-1fe1-4259-a5ad-fc852c159d3e",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Dimensión sociocultural y ciudadana",
    "texto": "Valorar la vida en sociedad como una dimensión esencial del crecimiento de la persona, así como la participación ciudadana democrática, activa, solidaria, responsable, con conciencia de los respectivos deberes y derechos; desenvolverse en su entorno de acuerdo a estos principios y proyectar su participación plena en la sociedad de carácter democrático. Valorar el compromiso en las relaciones entre las personas y al acordar contratos: en la amistad, en el amor, en el matrimonio, en el trabajo y al emprender proyectos. Participar solidaria y responsablemente en las actividades y proyectos de la familia, del establecimiento y de la comunidad. Conocer y valorar la historia y sus actores, las tradiciones, los símbolos y el patrimonio territorial y cultural de la nación, en el contexto de un mundo crecientemente globalizado e interdependiente, comprendiendo la tensión y la complementariedad que existe entre ambos planos. Reconocer y respetar la igualdad de derechos entre hombres y mujeres y apreciar la importancia de desarrollar relaciones que potencien su participación equitativa en la vida económica familiar, social y cultural. Conocer el problema ambiental global, y proteger y conservar el entorno natural y sus recursos como contexto de desarrollo humano."
  },
  {
    "id": "c8fcf815-3f61-48b1-bd12-ab299017f723",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "E",
    "texto": "Valorar las posibilidades que da el discurso hablado y escrito para participar de manera proactiva, informada y responsable en la vida de la sociedad democrática."
  },
  {
    "id": "f9c3f0c7-c18d-46bd-9f40-321394d59a34",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "F",
    "texto": "Valorar la evidencia y la búsqueda de conocimientos que apoyen sus aseveraciones."
  },
  {
    "id": "d3fefb44-443e-4fd5-b69e-751d4a3543e1",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "G",
    "texto": "Realizar tareas y trabajos de forma rigurosa y perseverante, entendiendo que los logros se obtienen solo después de un trabajo prolongado."
  },
  {
    "id": "bc0c3ddd-eebe-48fa-94cb-e0cafbd3ecf9",
    "nivel": "8° Básico",
    "tipo": "Actitud",
    "codigo": "H",
    "texto": "Trabajar colaborativamente, usando de manera responsable las tecnologías de la comunicación, dando crédito al trabajo de otros y respetando la propiedad y la privacidad de las personas."
  },
  {
    "id": "92c9e316-0421-4fcd-aaeb-5d64074a82d6",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 1",
    "texto": "Favorecer el desarrollo de capacidades de análisis, interpretación y síntesis."
  },
  {
    "id": "773f9205-f8d9-459a-b2d1-a497f160fd15",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 2",
    "texto": "Valorar la libertad, la igualdad de derechos y la dignidad humana."
  },
  {
    "id": "a4cb7835-7ac9-48f1-9718-f39904b13c30",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 3",
    "texto": "Practicar la iniciativa personal, la creatividad y el espíritu emprendedor."
  },
  {
    "id": "71de4a9b-0a85-4549-b0ff-d018c294b07b",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "OAT-Programa 4",
    "texto": "Demostrar interés por conocer la realidad y utilizar el conocimiento."
  },
  {
    "id": "11317059-5939-4c11-a4c4-382482c9367a",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Proactividad y trabajo",
    "texto": "Demostrar interés por conocer la realidad y utilizar el conocimiento. Practicar la iniciativa personal, la creatividad y el espíritu emprendedor en los ámbitos personal, escolar y comunitario, aportando con esto al desarrollo de la sociedad. Trabajar en equipo de manera responsable, construyendo relaciones de cooperación basadas en la confianza mutua, y resolviendo adecuadamente los conflictos. Comprender y valorar la perseverancia, el rigor y el cumplimiento, por un lado, y la flexibilidad, la originalidad, la aceptación de consejos y críticas y el asumir riesgos, por el otro, como aspectos fundamentales en el desarrollo y la consumación exitosa de tareas y trabajos. Reconocer la importancia del trabajo —manual e intelectual— como forma de desarrollo personal, familiar, social y de contribución al bien común, valorando sus procesos y resultados según criterios de satisfacción personal, sentido de vida, calidad, productividad, innovación, responsabilidad social e impacto sobre el medioambiente, y apreciando la dignidad esencial de todo trabajo y el valor eminente de la persona que lo realiza. Gestionar de manera activa el propio aprendizaje, utilizando sus capacidades de análisis, interpretación y síntesis para monitorear y evaluar su logro."
  },
  {
    "id": "cc0ddc21-f697-4b87-a189-cc08b7dc6665",
    "nivel": "8° Básico",
    "tipo": "OAT",
    "codigo": "Tecnologías de la información y la comunicación (TIC)",
    "texto": "Buscar, acceder y procesar información de diversas fuentes virtuales y evaluar su calidad y pertinencia. Utilizar TIC que resuelvan las necesidades de información, comunicación, expresión y creación dentro del entorno educativo y social inmediato. Utilizar aplicaciones para presentar, representar, analizar y modelar información y situaciones, comunicar ideas y argumentos, comprender y resolver problemas de manera eficiente y efectiva, aprovechando múltiples medios (texto, imagen, audio y video)."
  }
] as CurriculumOAT[]
};
