// Programas de Estudio — Lenguaje y Comunicación / Lengua y Literatura
// 1° Básico a 2° Medio · Estructura curricular para REÍ Play

export interface OA {
  codigo: string;
  descripcion: string;
}

export interface Tema {
  id: string;
  nombre: string;
  oas: OA[];
  habilidades: string;
  conceptos_clave: string;
  vocabulario: string;
}

export interface Unidad {
  id: string;
  nombre: string;
  horas?: number;
  temas: Tema[];
}

export interface Programa {
  id: string;
  curso: string;
  nivel_codigo: string;
  asignatura: string;
  unidades: Unidad[];
}

export const programas: Programa[] = [
  // ─────────────────────────────────────────────────
  // 1° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '1b',
    curso: '1° Básico',
    nivel_codigo: '1° básico',
    asignatura: 'Lenguaje y Comunicación',
    unidades: [
      {
        id: '1b-perm',
        nombre: 'Objetivos Permanentes (todas las unidades)',
        temas: [
          {
            id: '1b-perm-1',
            nombre: 'Fomento del gusto por la lectura y uso de biblioteca',
            oas: [
              { codigo: 'OA 11', descripcion: 'Desarrollar el gusto por la lectura, explorando libros y sus ilustraciones.' },
              { codigo: 'OA 12', descripcion: 'Asistir habitualmente a la biblioteca para elegir, escuchar, leer y explorar textos de su interés.' },
            ],
            habilidades: 'Desarrollar gusto lector, autonomía en la búsqueda de información.',
            conceptos_clave: 'Exploración, autonomía, interés lector.',
            vocabulario: 'Biblioteca, ilustraciones, recomendación.',
          },
          {
            id: '1b-perm-2',
            nombre: 'Literatura mediada y adquisición de vocabulario',
            oas: [
              { codigo: 'OA 17', descripcion: 'Comprender y disfrutar versiones completas de obras de la literatura, narradas o leídas por un adulto.' },
              { codigo: 'OA 19', descripcion: 'Desarrollar la curiosidad por las palabras o expresiones que desconocen y adquirir el hábito de averiguar su significado.' },
            ],
            habilidades: 'Escuchar atentamente, imaginar, inferir significado, expresar curiosidad.',
            conceptos_clave: 'Tradición oral, patrimonio cultural, instrucción directa de vocabulario.',
            vocabulario: 'Cuentos folclóricos, fábulas, leyendas.',
          },
          {
            id: '1b-perm-3',
            nombre: 'Caligrafía, separación de palabras e interacción social',
            oas: [
              { codigo: 'OA 15', descripcion: 'Escribir con letra clara, separando las palabras con un espacio para que puedan ser leídas por otros.' },
              { codigo: 'OA 16', descripcion: 'Incorporar de manera pertinente en la escritura el vocabulario nuevo extraído de textos escuchados o leídos.' },
              { codigo: 'OA 21', descripcion: 'Participar activamente en conversaciones grupales sobre textos leídos o escuchados o temas de interés.' },
              { codigo: 'OA 22', descripcion: 'Interactuar de acuerdo con las convenciones sociales (saludar, preguntar, agradecer).' },
            ],
            habilidades: 'Legibilidad, precisión motriz, escucha activa, respeto de turnos.',
            conceptos_clave: 'Convención ortográfica, normas de cortesía, diálogo constructivo.',
            vocabulario: 'Espaciado, trazado, fórmulas de cortesía (por favor, gracias, perdón, permiso).',
          },
        ],
      },
      {
        id: '1b-u1',
        nombre: 'Unidad 1: Iniciación a la Lectoescritura',
        horas: 75,
        temas: [
          {
            id: '1b-u1-1',
            nombre: 'Concepto de lo impreso y conciencia fonológica',
            oas: [
              { codigo: 'OA 1', descripcion: 'Reconocer que los textos escritos transmiten mensajes y cumplen un propósito.' },
              { codigo: 'OA 2', descripcion: 'Reconocer que las palabras son unidades de significado separadas por espacios.' },
              { codigo: 'OA 3', descripcion: 'Identificar los sonidos que componen las palabras (conciencia fonológica).' },
            ],
            habilidades: 'Segmentar, identificar sonidos, reconocer direccionalidad, distinguir grafemas.',
            conceptos_clave: 'Correspondencia sonido-letra, principio alfabético, direccionalidad izquierda-derecha.',
            vocabulario: 'Fonema, sílaba, rima, autor, ilustrador.',
          },
          {
            id: '1b-u1-2',
            nombre: 'Iniciación a la lectura y escritura de palabras',
            oas: [
              { codigo: 'OA 4', descripcion: 'Leer palabras aisladas y en contexto con combinaciones simples (sílaba directa, indirecta o compleja).' },
              { codigo: 'OA 5', descripcion: 'Leer textos breves en voz alta para adquirir fluidez (palabra a palabra).' },
              { codigo: 'OA 13', descripcion: 'Experimentar con la escritura para comunicar hechos, ideas y sentimientos.' },
            ],
            habilidades: 'Decodificar, leer fluidamente, producir escritura emergente.',
            conceptos_clave: 'Fluidez inicial, escritura inventada, ambiente letrado.',
            vocabulario: 'Decodificación, autocorrección, caligrafía inventada.',
          },
          {
            id: '1b-u1-3',
            nombre: 'Comprensión oral y recitación inicial',
            oas: [
              { codigo: 'OA 18', descripcion: 'Comprender textos orales para obtener información y desarrollar curiosidad por el mundo.' },
              { codigo: 'OA 26', descripcion: 'Recitar con entonación y expresión poemas, rimas, canciones y trabalenguas.' },
            ],
            habilidades: 'Visualizar lo descrito oralmente, formular preguntas, expresarse ante público.',
            conceptos_clave: 'Lenguaje oral como predictor de lectura, autoconfianza, secuenciación.',
            vocabulario: 'Entonación, descripción, instrucción.',
          },
        ],
      },
      {
        id: '1b-u2',
        nombre: 'Unidad 2: Consolidación de la Decodificación',
        horas: 76,
        temas: [
          {
            id: '1b-u2-1',
            nombre: 'Ampliación de la decodificación y fluidez',
            oas: [
              { codigo: 'OA 4', descripcion: 'Leer palabras aisladas y en contexto con casi todas las letras del abecedario.' },
              { codigo: 'OA 5', descripcion: 'Leer textos breves en voz alta con mayor rapidez y menos autocorrecciones.' },
            ],
            habilidades: 'Decodificación automática, prosodia inicial.',
            conceptos_clave: 'Lectura fluida, reconocimiento automático, precisión lectora.',
            vocabulario: 'Oración, precisión, velocidad.',
          },
          {
            id: '1b-u2-2',
            nombre: 'Comprensión de narraciones y textos informativos simples',
            oas: [
              { codigo: 'OA 8', descripcion: 'Demostrar comprensión de narraciones extrayendo información explícita e implícita.' },
              { codigo: 'OA 10', descripcion: 'Leer independientemente y comprender textos no literarios (cartas, notas, artículos).' },
            ],
            habilidades: 'Inferir sentimientos, opinar sobre personajes, extraer datos clave.',
            conceptos_clave: 'Estructura narrativa vs. informativa, visualización, conexión texto-vida.',
            vocabulario: 'Cuento, carta, instrucción, artículo informativo.',
          },
          {
            id: '1b-u2-3',
            nombre: 'Escritura de oraciones y exposición oral',
            oas: [
              { codigo: 'OA 14', descripcion: 'Escribir oraciones completas para transmitir mensajes.' },
              { codigo: 'OA 23', descripcion: 'Expresarse de manera coherente sobre temas de interés.' },
            ],
            habilidades: 'Organización de ideas, uso de vocabulario preciso, mantenimiento de postura.',
            conceptos_clave: 'Escritura convencional, comunicación organizada, retroalimentación positiva.',
            vocabulario: 'Mensaje, descripción, postura, volumen audible.',
          },
        ],
      },
      {
        id: '1b-u3',
        nombre: 'Unidad 3: Desarrollo de Estrategias de Comprensión',
        horas: 78,
        temas: [
          {
            id: '1b-u3-1',
            nombre: 'Dominio de todas las letras y combinaciones complejas',
            oas: [
              { codigo: 'OA 4', descripcion: 'Leer palabras con todas las combinaciones (rr, ll, ch, qu, ge, gi, etc.).' },
              { codigo: 'OA 5', descripcion: 'Reforzar fluidez respetando punto seguido y aparte.' },
            ],
            habilidades: 'Decodificación total, prosodia avanzada.',
            conceptos_clave: 'Dígrafos, combinaciones irregulares, monitoreo de decodificación.',
            vocabulario: 'Dígrafo, combinación silábica, punto aparte.',
          },
          {
            id: '1b-u3-2',
            nombre: 'Estrategias autónomas de comprensión y hábito lector',
            oas: [
              { codigo: 'OA 6', descripcion: 'Aplicar estrategias de comprensión (visualizar, relacionar con experiencias).' },
              { codigo: 'OA 7', descripcion: 'Leer independientemente y familiarizarse con literatura variada.' },
              { codigo: 'OA 8', descripcion: 'Profundizar comprensión de narraciones (opinión sobre personajes).' },
            ],
            habilidades: 'Visualización mental, conexión metacognitiva, opinión fundamentada.',
            conceptos_clave: 'Estrategias metacognitivas, comunidad de lectores, respuesta personal a la literatura.',
            vocabulario: 'Metacognición, lectura independiente, repertorio.',
          },
          {
            id: '1b-u3-3',
            nombre: 'Poesía, géneros informativos y expresión',
            oas: [
              { codigo: 'OA 9', descripcion: 'Disfrutar poemas de autor y tradición oral adecuados a la edad.' },
              { codigo: 'OA 10', descripcion: 'Comprender textos no literarios complejos para ampliar conocimiento.' },
            ],
            habilidades: 'Apreciación sonora (rima, ritmo), localización de información, síntesis.',
            conceptos_clave: 'Efectos sonoros, lenguaje figurado, valor social de la lectura.',
            vocabulario: 'Rima, verso, estrofa, noticia, documental.',
          },
        ],
      },
      {
        id: '1b-u4',
        nombre: 'Unidad 4: Consolidación y Expresión Creativa',
        horas: 75,
        temas: [
          {
            id: '1b-u4-1',
            nombre: 'Autonomía lectora y estrategias de monitoreo',
            oas: [
              { codigo: 'OA 5', descripcion: 'Leer con fluidez respetando puntuación.' },
              { codigo: 'OA 6', descripcion: 'Aplicar estrategias de comprensión (enseñanza intencional).' },
              { codigo: 'OA 7', descripcion: 'Elegir textos según interés personal.' },
            ],
            habilidades: 'Lectura fluida, monitoreo de la comprensión, elección autónoma.',
            conceptos_clave: 'Monitoreo, detección de palabras desconocidas, práctica independiente.',
            vocabulario: 'Monitoreo, autonomía, recomendación.',
          },
          {
            id: '1b-u4-2',
            nombre: 'Apreciación dramática y representación de roles',
            oas: [
              { codigo: 'OA 20', descripcion: 'Disfrutar de obras de teatro infantil y representaciones.' },
              { codigo: 'OA 25', descripcion: 'Desempeñar diferentes roles para desarrollar lenguaje y autoestima.' },
            ],
            habilidades: 'Expresión corporal, lenguaje paraverbal (tono, ritmo), trabajo en equipo.',
            conceptos_clave: 'Género dramático, autoestima, lenguaje no verbal.',
            vocabulario: 'Teatro, representación, mímica, diálogo.',
          },
          {
            id: '1b-u4-3',
            nombre: 'Escritura integradora y lectura final',
            oas: [
              { codigo: 'OA 8', descripcion: 'Comprensión profunda y disfrute estético final.' },
              { codigo: 'OA 14', descripcion: 'Escribir oraciones completas para expresar ideas o compartir información.' },
            ],
            habilidades: 'Analizar, predecir, sintetizar, producir textos funcionales.',
            conceptos_clave: 'Integración de los tres ejes, escritura significativa.',
            vocabulario: 'Anécdota, tarjeta de despedida, reporte.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 2° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '2b',
    curso: '2° Básico',
    nivel_codigo: '2° básico',
    asignatura: 'Lenguaje y Comunicación',
    unidades: [
      {
        id: '2b-perm',
        nombre: 'Objetivos Permanentes (todas las unidades)',
        temas: [
          {
            id: '2b-perm-1',
            nombre: 'Hábito lector, fluidez y escritura de proceso',
            oas: [
              { codigo: 'OA 8', descripcion: 'Leer con fluidez textos variados apropiados a su edad.' },
              { codigo: 'OA 22', descripcion: 'Interactuar de acuerdo con convenciones sociales.' },
              { codigo: 'OA 2', descripcion: 'Leer textos breves en voz alta respetando puntuación.' },
              { codigo: 'OA 12', descripcion: 'Asistir habitualmente a la biblioteca.' },
              { codigo: 'OA 15', descripcion: 'Escribir con letra clara y separando palabras.' },
            ],
            habilidades: 'Fluidez lectora, autonomía en biblioteca, planificación/revisión de escritos, interacción social cortés.',
            conceptos_clave: 'Comunidad de lectores, lectura como conversación, vocabulario incidental y directo.',
            vocabulario: 'Fórmulas de cortesía, sinónimos, términos extraídos de lecturas.',
          },
        ],
      },
      {
        id: '2b-u1',
        nombre: 'Unidad 1: Consolidación de Lectoescritura y Comprensión Narrativa',
        horas: 76,
        temas: [
          {
            id: '2b-u1-1',
            nombre: 'Leyendas, cuentos y consolidación de la decodificación',
            oas: [
              { codigo: 'OA 4', descripcion: 'Leer palabras con hiatos, diptongos y combinaciones complejas (ce-ci, que-qui, ge-gi, gue-gui).' },
              { codigo: 'OA 5', descripcion: 'Leer textos breves en voz alta con mayor rapidez.' },
              { codigo: 'OA 7', descripcion: 'Leer independientemente y familiarizarse con literatura variada.' },
              { codigo: 'OA 1', descripcion: 'Extraer información explícita e implícita de narraciones.' },
              { codigo: 'OA 11', descripcion: 'Relacionar el texto con conocimientos previos y visualizar lo leído.' },
            ],
            habilidades: 'Decodificar, extraer información, visualizar, caracterizar personajes, planificar párrafos.',
            conceptos_clave: 'Estrategias metacognitivas, unidad temática, estructura de párrafo informativo.',
            vocabulario: 'Hiatos, diptongos, grupos consonánticos, mayúsculas en nombres propios.',
          },
        ],
      },
      {
        id: '2b-u2',
        nombre: 'Unidad 2: Ampliación del Mundo y Comprensión Oral',
        horas: 78,
        temas: [
          {
            id: '2b-u2-1',
            nombre: 'Poesía, fábulas, instrucciones e investigación inicial',
            oas: [
              { codigo: 'OA 4', descripcion: 'Leer fluidamente textos variados.' },
              { codigo: 'OA 6', descripcion: 'Aplicar estrategias de comprensión.' },
              { codigo: 'OA 10', descripcion: 'Comprender textos informativos para investigar.' },
              { codigo: 'OA 23', descripcion: 'Expresarse oralmente con vocabulario preciso y postura adecuada.' },
              { codigo: 'OA 27', descripcion: 'Seguir instrucciones orales y escritas.' },
            ],
            habilidades: 'Interpretar rima/ritmo, localizar información en internet, exponer oralmente, seguir instrucciones.',
            conceptos_clave: 'Sonoridad poética, moraleja, fuentes impresas vs digitales, coherencia local.',
            vocabulario: 'Signos de interrogación y exclamación, conectores temporales.',
          },
        ],
      },
      {
        id: '2b-u3',
        nombre: 'Unidad 3: Estructura Narrativa y Manejo de la Lengua',
        horas: 77,
        temas: [
          {
            id: '2b-u3-1',
            nombre: 'Estrategias de preguntas al texto y gramática aplicada',
            oas: [
              { codigo: 'OA 3', descripcion: 'Formular preguntas para especular y aclarar significados.' },
              { codigo: 'OA 13', descripcion: 'Escribir narraciones con inicio, desarrollo y desenlace.' },
              { codigo: 'OA 19', descripcion: 'Mantener concordancia de género y número en sustantivos y adjetivos.' },
              { codigo: 'OA 20', descripcion: 'Usar adjetivos para especificar características en descripciones.' },
            ],
            habilidades: 'Preguntar al texto, redactar cuentos creativos, asegurar cohesión, opinar fundamentadamente.',
            conceptos_clave: 'Lector activo y crítico, coherencia gramatical, sustantivos propios/comunes, adjetivos calificativos.',
            vocabulario: 'Sinónimos para evitar repeticiones, sustantivos precisos para objetos y lugares.',
          },
        ],
      },
      {
        id: '2b-u4',
        nombre: 'Unidad 4: Género Dramático e Interacción Dialógica',
        horas: 74,
        temas: [
          {
            id: '2b-u4-1',
            nombre: 'Teatro, representación y comunicación en grupo',
            oas: [
              { codigo: 'OA 5', descripcion: 'Leer con fluidez y prosodia.' },
              { codigo: 'OA 13', descripcion: 'Escribir narraciones y descripciones.' },
              { codigo: 'OA 23', descripcion: 'Expresarse oralmente de manera coherente.' },
              { codigo: 'OA 24', descripcion: 'Representar personajes imitando su lenguaje y características.' },
              { codigo: 'OA 25', descripcion: 'Resolver conflictos al trabajar en equipos.' },
            ],
            habilidades: 'Dramatizar, trabajar colaborativamente, escuchar para recapitular, producir cuentos fantásticos.',
            conceptos_clave: 'Apreciación dramática, lenguaje paraverbal (volumen, tono), roles en conversaciones.',
            vocabulario: 'Terminología teatral (escena, acto, mímica), vocabulario de documentales.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 3° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '3b',
    curso: '3° Básico',
    nivel_codigo: '3° básico',
    asignatura: 'Lenguaje y Comunicación',
    unidades: [
      {
        id: '3b-perm',
        nombre: 'Objetivos Permanentes (todas las unidades)',
        temas: [
          {
            id: '3b-perm-1',
            nombre: 'Hábito lector, fluidez y escritura de proceso',
            oas: [
              { codigo: 'OA 1', descripcion: 'Leer de manera fluida textos variados apropiados a su edad.' },
              { codigo: 'OA 7', descripcion: 'Leer independientemente y familiarizarse con literatura variada.' },
              { codigo: 'OA 12', descripcion: 'Asistir habitualmente a la biblioteca.' },
              { codigo: 'OA 16', descripcion: 'Escribir al menos una vez a la semana con formato adecuado.' },
              { codigo: 'OA 27', descripcion: 'Interactuar de acuerdo con las convenciones sociales.' },
            ],
            habilidades: 'Fluidez a nivel de oración, autonomía en biblioteca, planificación/revisión de escritos, interacción cortés.',
            conceptos_clave: 'Comunidad de lectores, vocabulario significativo, convivencia social.',
            vocabulario: 'Fórmulas de cortesía, conectores (primero, luego, después), vocabulario extraído de lecturas.',
          },
        ],
      },
      {
        id: '3b-u1',
        nombre: 'Unidad 1: Estrategias de Comprensión y Artículos Informativos',
        horas: 79,
        temas: [
          {
            id: '3b-u1-1',
            nombre: 'Comprensión de narraciones y literatura',
            oas: [
              { codigo: 'OA 2', descripcion: 'Relacionar situaciones de vida cotidiana con personajes o acciones leídos.' },
              { codigo: 'OA 3', descripcion: 'Describir personajes mencionando características físicas y sentimientos.' },
              { codigo: 'OA 4', descripcion: 'Subrayar información relevante en cada párrafo.' },
            ],
            habilidades: 'Extraer información explícita e implícita, reconstruir secuencias, describir ambientes, aplicar estrategias de relectura.',
            conceptos_clave: 'Cuentos folclóricos, leyendas, cómics, secuencia lógica, subrayado.',
            vocabulario: 'Adjetivos descriptivos de ambiente y personajes.',
          },
          {
            id: '3b-u1-2',
            nombre: 'Textos no literarios y manejo de la lengua',
            oas: [
              { codigo: 'OA 6', descripcion: 'Encontrar información usando títulos, subtítulos e índices.' },
              { codigo: 'OA 11', descripcion: 'Buscar palabras en el diccionario usando orden alfabético.' },
              { codigo: 'OA 14', descripcion: 'Escribir artículos informativos.' },
              { codigo: 'OA 20', descripcion: 'Usar artículos (definidos/indefinidos) y sustantivos precisos.' },
            ],
            habilidades: 'Lectura independiente de biografías/noticias, uso del diccionario, redacción de artículos, puntuación correcta.',
            conceptos_clave: 'Artículo informativo, diccionario ilustrado, concordancia artículo-sustantivo.',
            vocabulario: 'Palabras nuevas del diccionario, sustantivos para lugares y objetos.',
          },
        ],
      },
      {
        id: '3b-u2',
        nombre: 'Unidad 2: Investigación, Poesía y Fábulas',
        horas: 77,
        temas: [
          {
            id: '3b-u2-1',
            nombre: 'Fábulas, poemas y lenguaje figurado',
            oas: [
              { codigo: 'OA 3', descripcion: 'Explicar con sus palabras un poema leído e identificar moraleja en fábulas.' },
              { codigo: 'OA 5', descripcion: 'Analizar poemas (lenguaje figurado, rima, estrofa).' },
            ],
            habilidades: 'Interpretar lenguaje figurado, recitar con sonoridad, relacionar poemas con experiencias.',
            conceptos_clave: 'Fábula, moraleja, poema, lenguaje figurado.',
            vocabulario: 'Términos poéticos, lenguaje cotidiano en sentido figurado.',
          },
          {
            id: '3b-u2-2',
            nombre: 'Procesos de investigación y comunicación oral',
            oas: [
              { codigo: 'OA 6', descripcion: 'Navegar en páginas de internet señaladas para buscar información.' },
              { codigo: 'OA 9', descripcion: 'Identificar raíces, prefijos y sufijos para determinar significados.' },
              { codigo: 'OA 24', descripcion: 'Mantener postura formal y contacto visual en exposiciones.' },
              { codigo: 'OA 28', descripcion: 'Exponer coherentemente con material de apoyo.' },
            ],
            habilidades: 'Investigar en fuentes diversas, inferir significados por contexto, exponer coherentemente.',
            conceptos_clave: 'Fuentes de información, prefijos/sufijos, propósito oral.',
            vocabulario: 'Prefijos (des, anti, re), sufijos (oso, ito, ble), términos técnicos de investigación.',
          },
        ],
      },
      {
        id: '3b-u3',
        nombre: 'Unidad 3: Profundización Narrativa y Cohesión',
        horas: 73,
        temas: [
          {
            id: '3b-u3-1',
            nombre: 'Narración creativa y estrategias metacognitivas',
            oas: [
              { codigo: 'OA 2', descripcion: 'Analizar narraciones y reconstruir secuencias.' },
              { codigo: 'OA 3', descripcion: 'Analizar aspectos relevantes de narraciones leídas.' },
              { codigo: 'OA 13', descripcion: 'Escribir narraciones con inicio, desarrollo y desenlace.' },
            ],
            habilidades: 'Escribir creativamente, visualizar, recapitular, usar conectores temporales.',
            conceptos_clave: 'Secuencia de eventos, desenlace, metacognición, visualización mental.',
            vocabulario: 'Conectores (luego, después, mientras tanto), pronombres personales.',
          },
        ],
      },
      {
        id: '3b-u4',
        nombre: 'Unidad 4: Novelas, Teatro y Formatos Diversos',
        horas: 76,
        temas: [
          {
            id: '3b-u4-1',
            nombre: 'Lectura de novelas y escritura funcional',
            oas: [
              { codigo: 'OA 3', descripcion: 'Comentar capítulos de novelas e identificar personajes.' },
              { codigo: 'OA 4', descripcion: 'Analizar aspectos relevantes de narraciones.' },
              { codigo: 'OA 15', descripcion: 'Escribir pasos para llevar a cabo procedimientos (cartas, recetas, afiches).' },
            ],
            habilidades: 'Comprender narraciones extensas, escribir textos funcionales, fundamentar opiniones.',
            conceptos_clave: 'Novela, coherencia local, formato de carta, receta, afiche informativo.',
            vocabulario: 'Términos de novelas y textos funcionales.',
          },
          {
            id: '3b-u4-2',
            nombre: 'Género dramático e interacción grupal',
            oas: [
              { codigo: 'OA 24', descripcion: 'Representar personajes imitando su lenguaje.' },
              { codigo: 'OA 25', descripcion: 'Relatar partes de obras de teatro vistas.' },
              { codigo: 'OA 26', descripcion: 'Resolver conflictos al trabajar en equipos.' },
              { codigo: 'OA 30', descripcion: 'Escuchar noticias y participar en diálogos grupales.' },
            ],
            habilidades: 'Apreciar obras teatrales, caracterizar personajes, participar activamente en diálogos.',
            conceptos_clave: 'Teatro, dramatización, autoestima, trabajo en equipo, lenguaje paraverbal.',
            vocabulario: 'Fórmulas de interacción grupal, terminología teatral básica.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 4° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '4b',
    curso: '4° Básico',
    nivel_codigo: '4° básico',
    asignatura: 'Lenguaje y Comunicación',
    unidades: [
      {
        id: '4b-perm',
        nombre: 'Objetivos Permanentes (todas las unidades)',
        temas: [
          {
            id: '4b-perm-1',
            nombre: 'Hábito lector, fluidez y escritura de proceso',
            oas: [
              { codigo: 'OA 1', descripcion: 'Leer de manera fluida textos variados apropiados a su edad.' },
              { codigo: 'OA 7', descripcion: 'Leer independientemente y familiarizarse con literatura variada.' },
              { codigo: 'OA 8', descripcion: 'Asistir habitualmente a la biblioteca.' },
              { codigo: 'OA 10', descripcion: 'Usar diccionarios para determinar significados.' },
              { codigo: 'OA 11', descripcion: 'Escribir frecuentemente en bitácoras.' },
            ],
            habilidades: 'Fluidez lectora, autonomía en biblioteca, determinación de significados, expresión creativa, legibilidad.',
            conceptos_clave: 'Lectura fluida, comunidad de lectores, claves del texto, escritura creativa.',
            vocabulario: 'Raíces y afijos, sinónimos, fórmulas de cortesía.',
          },
        ],
      },
      {
        id: '4b-u1',
        nombre: 'Unidad 1: Mitos, Leyendas y Estrategias de Comprensión',
        horas: 77,
        temas: [
          {
            id: '4b-u1-1',
            nombre: 'Narrativa de tradición oral (mitos y leyendas)',
            oas: [
              { codigo: 'OA 2', descripcion: 'Relacionar situaciones cotidianas con el texto.' },
              { codigo: 'OA 3', descripcion: 'Extraer información explícita e implícita; explicar consecuencias de acciones.' },
              { codigo: 'OA 4', descripcion: 'Describir ambientes y personajes; comparar; visualizar.' },
            ],
            habilidades: 'Comprender, profundizar, extraer, describir, comparar, visualizar, recapitular.',
            conceptos_clave: 'Mito, leyenda, conflicto narrativo, secuencia lógica, lenguaje figurado.',
            vocabulario: 'Términos propios de mitos y leyendas.',
          },
          {
            id: '4b-u1-2',
            nombre: 'Textos informativos y proceso de escritura',
            oas: [
              { codigo: 'OA 6', descripcion: 'Encontrar información usando organizadores.' },
              { codigo: 'OA 12', descripcion: 'Escribir narraciones con inicio, desarrollo y desenlace.' },
              { codigo: 'OA 17', descripcion: 'Escribir oraciones usando conectores de causa-efecto.' },
              { codigo: 'OA 21', descripcion: 'Ortografía acentual: tildar palabras agudas, graves y esdrújulas.' },
            ],
            habilidades: 'Leer independientemente, escribir creativamente, planificar, revisar, editar.',
            conceptos_clave: 'Artículo informativo, revisión de textos, ortografía puntual y acentual.',
            vocabulario: 'Conectores de causa-efecto, oposición, tiempo y adición.',
          },
        ],
      },
      {
        id: '4b-u2',
        nombre: 'Unidad 2: Poesía, Fábulas y Comunicación Formal',
        horas: 74,
        temas: [
          {
            id: '4b-u2-1',
            nombre: 'Poesía, fábulas y lenguaje figurado',
            oas: [
              { codigo: 'OA 3', descripcion: 'Analizar aspectos relevantes de narraciones.' },
              { codigo: 'OA 4', descripcion: 'Familiarizarse con literatura variada.' },
              { codigo: 'OA 5', descripcion: 'Identificar problemas y soluciones en fábulas; recitar con entonación.' },
            ],
            habilidades: 'Familiarizarse con literatura, profundizar comprensión, interpretar lenguaje figurado, recitar.',
            conceptos_clave: 'Poema, fábula, personificación, rima, sonoridad, lenguaje paraverbal.',
            vocabulario: 'Palabras con sonoridad especial; términos expresivos en poemas.',
          },
          {
            id: '4b-u2-2',
            nombre: 'Comunicación en formatos diversos y ortografía',
            oas: [
              { codigo: 'OA 14', descripcion: 'Elegir formatos adecuados (cartas, noticias, instrucciones).' },
              { codigo: 'OA 16', descripcion: 'Escribir palabras con b, v y h.' },
              { codigo: 'OA 23', descripcion: 'Realizar exposiciones orales articuladas con material de apoyo.' },
            ],
            habilidades: 'Escribir textos funcionales, planificar, revisar, expresarse oralmente.',
            conceptos_clave: 'Carta, instrucción, noticia, coherencia local, lenguaje formal.',
            vocabulario: 'Vocabulario técnico en instrucciones; precisión léxica en exposiciones.',
          },
        ],
      },
      {
        id: '4b-u3',
        nombre: 'Unidad 3: Investigación, Artículos Informativos e Historietas',
        horas: 79,
        temas: [
          {
            id: '4b-u3-1',
            nombre: 'El proceso de investigación',
            oas: [
              { codigo: 'OA 6', descripcion: 'Encontrar información en internet y libros; registrar datos en fichas.' },
              { codigo: 'OA 9', descripcion: 'Investigar, escribir artículos informativos con introducción y subtemas.' },
              { codigo: 'OA 16', descripcion: 'Desarrollar subtemas por párrafo; usar material de apoyo.' },
              { codigo: 'OA 27', descripcion: 'Exponer oralmente con material de apoyo.' },
            ],
            habilidades: 'Comprender estrategias de comprensión, investigar, escribir artículos, planificar, expresarse oralmente.',
            conceptos_clave: 'Investigación, fuentes de información, estructura del artículo informativo.',
            vocabulario: 'Vocabulario específico del tema; sinónimos para evitar repeticiones.',
          },
          {
            id: '4b-u3-2',
            nombre: 'Narrativa de autor e historietas',
            oas: [
              { codigo: 'OA 3', descripcion: 'Aluden a información explícita; comparan personajes.' },
              { codigo: 'OA 4', descripcion: 'Identifican problemas y soluciones.' },
            ],
            habilidades: 'Leer cuentos de autor e historietas, profundizar comprensión.',
            conceptos_clave: 'Historieta (viñeta, globo), personaje, causa y consecuencia.',
            vocabulario: 'Expresiones específicas del género cómico.',
          },
        ],
      },
      {
        id: '4b-u4',
        nombre: 'Unidad 4: Novelas, Teatro y Manejo de la Lengua',
        horas: 75,
        temas: [
          {
            id: '4b-u4-1',
            nombre: 'Lectura de novelas y crítica literaria',
            oas: [
              { codigo: 'OA 3', descripcion: 'Comentar capítulos de novelas; describir temas del autor.' },
              { codigo: 'OA 4', descripcion: 'Expresar posturas frente a hechos.' },
              { codigo: 'OA 6', descripcion: 'Formarse opinión crítica sobre novelas.' },
            ],
            habilidades: 'Leer novelas, profundizar comprensión, formarse opinión crítica.',
            conceptos_clave: 'Novela, estilo del autor, conexiones intertextuales, predicciones narrativas.',
            vocabulario: 'Vocabulario literario avanzado; términos para precisar descripciones.',
          },
          {
            id: '4b-u4-2',
            nombre: 'Género dramático y gramática aplicada',
            oas: [
              { codigo: 'OA 12', descripcion: 'Identificar verbos; mantener concordancia sujeto-verbo.' },
              { codigo: 'OA 19', descripcion: 'Usar adverbios para precisar.' },
              { codigo: 'OA 24', descripcion: 'Representar roles teatralmente.' },
              { codigo: 'OA 25', descripcion: 'Participar en diálogos grupales respetando turnos.' },
            ],
            habilidades: 'Usar gramática correctamente, disfrutar teatro, interactuar oralmente, caracterizar personajes.',
            conceptos_clave: 'Sujeto/predicado, adverbio, teatro, dramatización, convivencia democrática.',
            vocabulario: 'Adverbios de lugar, tiempo, modo; verbos de acción precisa; terminología teatral.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 5° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '5b',
    curso: '5° Básico',
    nivel_codigo: '5° básico',
    asignatura: 'Lenguaje y Comunicación',
    unidades: [
      {
        id: '5b-perm',
        nombre: 'Objetivos Permanentes (todas las unidades)',
        temas: [
          {
            id: '5b-perm-1',
            nombre: 'Hábito lector, fluidez y comunicación permanente',
            oas: [
              { codigo: 'OA 9', descripcion: 'Desarrollar el gusto por la lectura, leyendo habitualmente diversos textos.' },
              { codigo: 'OA 1', descripcion: 'Leer de manera fluida textos variados apropiados a su edad.' },
              { codigo: 'OA 10', descripcion: 'Asistir habitualmente a la biblioteca para satisfacer diversos propósitos.' },
              { codigo: 'OA 12', descripcion: 'Aplicar estrategias para determinar el significado de palabras nuevas.' },
              { codigo: 'OA 13', descripcion: 'Escribir frecuentemente para desarrollar la creatividad y expresar ideas.' },
              { codigo: 'OA 27', descripcion: 'Interactuar de acuerdo con las convenciones sociales en diferentes situaciones.' },
            ],
            habilidades: 'Fluidez lectora, autonomía, indagación, expresión creativa, precisión léxica, interacción social.',
            conceptos_clave: 'Comunidad de lectores, lectura abundante, asimilación de léxico, convivencia.',
            vocabulario: 'Claves del texto, raíces y afijos, sinónimos, fórmulas de cortesía.',
          },
        ],
      },
      {
        id: '5b-u1',
        nombre: 'Unidad 1: Estrategias de Comprensión e Investigación Inicial',
        horas: 59,
        temas: [
          {
            id: '5b-u1-1',
            nombre: 'Análisis crítico de narraciones y textos informativos',
            oas: [
              { codigo: 'OA 3', descripcion: 'Leer y familiarizarse con un repertorio de literatura (cuentos folclóricos, historietas).' },
              { codigo: 'OA 4', descripcion: 'Analizar aspectos relevantes de narraciones leídas.' },
              { codigo: 'OA 6', descripcion: 'Leer independientemente y comprender textos no literarios (cartas, biografías, noticias).' },
              { codigo: 'OA 7', descripcion: 'Evaluar críticamente la información presente en textos (emisor, propósito, destinatario).' },
              { codigo: 'OA 2', descripcion: 'Comprender textos aplicando estrategias (relacionar info, releer, preguntar).' },
            ],
            habilidades: 'Analizar, interpretar lenguaje figurado, fundamentar opiniones, hacer inferencias, evaluar críticamente.',
            conceptos_clave: 'Emisor, propósito comunicativo, destinatario, información relevante vs. accesoria, metacognición.',
            vocabulario: 'Lenguaje figurado, texto discontinuo, emisor.',
          },
          {
            id: '5b-u1-2',
            nombre: 'Procesos de investigación y producción escrita',
            oas: [
              { codigo: 'OA 11', descripcion: 'Buscar y seleccionar información más relevante en diversas fuentes para investigación.' },
              { codigo: 'OA 8', descripcion: 'Sintetizar y registrar las ideas principales.' },
              { codigo: 'OA 15', descripcion: 'Escribir artículos informativos (intro, desarrollo de idea por párrafo, fuentes).' },
              { codigo: 'OA 17', descripcion: 'Planificar sus textos estableciendo propósito y destinatario.' },
              { codigo: 'OA 18', descripcion: 'Escribir, revisar y editar sus textos con claridad y precisión.' },
            ],
            habilidades: 'Investigar, sintetizar, planificar, organizar ideas, revisar, editar, tomar apuntes.',
            conceptos_clave: 'Estructura del artículo informativo, síntesis, bibliografía, honestidad intelectual.',
            vocabulario: 'Bibliografía, subtema, párrafos, sinónimos.',
          },
        ],
      },
      {
        id: '5b-u2',
        nombre: 'Unidad 2: Literatura, Poesía y Escritura Creativa',
        horas: 56,
        temas: [
          {
            id: '5b-u2-1',
            nombre: 'Géneros literarios y expresión de la imaginación',
            oas: [
              { codigo: 'OA 3', descripcion: 'Familiarizarse con poemas, mitos, leyendas, fábulas y cuentos.' },
              { codigo: 'OA 5', descripcion: 'Analizar poemas (personificación, comparación, rima, estrofa).' },
              { codigo: 'OA 14', descripcion: 'Escribir creativamente narraciones con estructura clara y conectores.' },
              { codigo: 'OA 20', descripcion: 'Distinguir matices entre sinónimos para ampliar capacidad expresiva.' },
              { codigo: 'OA 21', descripcion: 'Conjugar correctamente verbos regulares.' },
              { codigo: 'OA 22', descripcion: 'Ortografía: raya en diálogo, coma explicativa.' },
              { codigo: 'OA 30', descripcion: 'Producir textos orales planificados (poemas, narraciones).' },
            ],
            habilidades: 'Interpretar, apreciar sonoridad, crear, precisar vocabulario, conjugar, dialogar, recitar.',
            conceptos_clave: 'Goce estético, dimensión sonora del lenguaje, matices semánticos, coherencia gramatical.',
            vocabulario: 'Sinónimos precisos, términos poéticos, raya, coma explicativa.',
          },
        ],
      },
      {
        id: '5b-u3',
        nombre: 'Unidad 3: Novelas, Cine y Expresión Dramática',
        horas: 56,
        temas: [
          {
            id: '5b-u3-1',
            nombre: 'Análisis comparativo y apreciación de artes',
            oas: [
              { codigo: 'OA 3', descripcion: 'Leer y familiarizarse con novelas.' },
              { codigo: 'OA 4', descripcion: 'Analizar aspectos relevantes de narraciones extensas.' },
              { codigo: 'OA 16', descripcion: 'Escribir comentarios para compartir impresiones de lectura.' },
              { codigo: 'OA 22', descripcion: 'Ortografía: uso de c-s-z, acento diacrítico.' },
              { codigo: 'OA 25', descripcion: 'Apreciar obras de teatro, películas o representaciones.' },
              { codigo: 'OA 30', descripcion: 'Producir dramatizaciones planificadas.' },
            ],
            habilidades: 'Comparar, relacionar info intertextual, apreciar artes, tildar, editar, caracterizar personajes, dramatizar.',
            conceptos_clave: 'Novela, apreciación dramática, lenguaje no verbal y paraverbal, acentuación diferencial.',
            vocabulario: 'Términos de técnica teatral (escena, montaje, parlamento), c-s-z, acentos.',
          },
        ],
      },
      {
        id: '5b-u4',
        nombre: 'Unidad 4: Procesos de Investigación y Comunicación Efectiva',
        horas: 57,
        temas: [
          {
            id: '5b-u4-1',
            nombre: 'Investigación profunda y difusión de resultados',
            oas: [
              { codigo: 'OA 6', descripcion: 'Comprender textos no literarios para investigaciones.' },
              { codigo: 'OA 7', descripcion: 'Evaluar críticamente confiabilidad y suficiencia de fuentes.' },
              { codigo: 'OA 15', descripcion: 'Escribir artículos informativos sobre el tema investigado.' },
              { codigo: 'OA 28', descripcion: 'Expresarse de manera clara en exposiciones orales con material de apoyo.' },
            ],
            habilidades: 'Investigar en fuentes digitales/escritas, procesar info, sintetizar, planificar, difundir oralmente.',
            conceptos_clave: 'Procedimientos de investigación, selección de info, apoyo visual efectivo, honestidad intelectual.',
            vocabulario: 'Palabras clave de búsqueda, conectores de ordenación, vocabulario técnico del tema.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 6° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '6b',
    curso: '6° Básico',
    nivel_codigo: '6° básico',
    asignatura: 'Lenguaje y Comunicación',
    unidades: [
      {
        id: '6b-perm',
        nombre: 'Objetivos Permanentes (todas las unidades)',
        temas: [
          {
            id: '6b-perm-1',
            nombre: 'Hábito lector, fluidez y comunicación permanente',
            oas: [
              { codigo: 'OA 9', descripcion: 'Desarrollar el gusto por la lectura leyendo habitualmente periódicos y revistas.' },
              { codigo: 'OA 1', descripcion: 'Leer de manera fluida textos variados con prosodia.' },
              { codigo: 'OA 10', descripcion: 'Asistir de forma independiente a la biblioteca.' },
              { codigo: 'OA 12', descripcion: 'Subrayar palabras desconocidas y averiguar su significado.' },
              { codigo: 'OA 13', descripcion: 'Escribir al menos una vez a la semana usando sinónimos y comparaciones.' },
              { codigo: 'OA 28', descripcion: 'Usar convenciones de cortesía.' },
            ],
            habilidades: 'Fluidez lectora, autonomía en biblioteca, determinación de significados, expresión creativa, interacción social.',
            conceptos_clave: 'Lectura abundante, comunidad de lectores, claves del texto, cortesía social.',
            vocabulario: 'Claves contextuales, raíces y afijos, sinónimos, hipónimos, hiperónimos.',
          },
        ],
      },
      {
        id: '6b-u1',
        nombre: 'Unidad 1: Fomento de la Literatura y Escritura Narrativa',
        horas: 57,
        temas: [
          {
            id: '6b-u1-1',
            nombre: 'Interpretación y análisis de obras narrativas',
            oas: [
              { codigo: 'OA 3', descripcion: 'Relacionar situaciones cotidianas con personajes; interpretar lenguaje figurado.' },
              { codigo: 'OA 4', descripcion: 'Describir ambiente y costumbres; fundamentar posturas sobre personajes.' },
            ],
            habilidades: 'Analizar acciones, explicar motivaciones, describir ambiente, relacionar contexto histórico, interpretar lenguaje figurado.',
            conceptos_clave: 'Influencia del personaje en la trama, ambiente narrativo, identificación del tema central.',
            vocabulario: 'Adjetivos descriptivos, términos de análisis literario (trama, desenlace, narrador).',
          },
          {
            id: '6b-u1-2',
            nombre: 'Proceso de escritura y manejo de la lengua',
            oas: [
              { codigo: 'OA 2', descripcion: 'Identificar información nueva vs. conocida.' },
              { codigo: 'OA 14', descripcion: 'Escribir cuentos con secuencia lógica y conectores de orden.' },
              { codigo: 'OA 16', descripcion: 'Escribir comentarios de dos párrafos.' },
              { codigo: 'OA 21', descripcion: 'Usar participios irregulares (roto, escrito).' },
              { codigo: 'OA 22', descripcion: 'Tildar pronombres interrogativos.' },
            ],
            habilidades: 'Comprender estrategias, escribir creativamente, planificar, revisar, editar, conjugar verbos irregulares.',
            conceptos_clave: 'Escritura como proceso, coherencia temática, correferencia, verbos irregulares.',
            vocabulario: 'Conectores (entonces, además), participios irregulares, pronombres interrogativos (qué, quién).',
          },
        ],
      },
      {
        id: '6b-u2',
        nombre: 'Unidad 2: Poesía, Información e Investigación',
        horas: 56,
        temas: [
          {
            id: '6b-u2-1',
            nombre: 'Comprensión e interpretación de poesía',
            oas: [
              { codigo: 'OA 3', descripcion: 'Identificar recursos sonoros (rima, aliteración).' },
              { codigo: 'OA 5', descripcion: 'Subrayar personificaciones e hipérboles; analizar efectos sonoros.' },
            ],
            habilidades: 'Analizar lenguaje poético, explicar estados de ánimo, identificar figuras literarias.',
            conceptos_clave: 'Goce estético, dimensión sonora, figuras de pensamiento y de dicción.',
            vocabulario: 'Terminología poética (verso, estrofa, rima), nombres de figuras literarias.',
          },
          {
            id: '6b-u2-2',
            nombre: 'Lectura de textos no literarios, síntesis y escritura informativa',
            oas: [
              { codigo: 'OA 6', descripcion: 'Identificar ideas relevantes; resumir información de textos discontinuos.' },
              { codigo: 'OA 8', descripcion: 'Sintetizar y registrar ideas principales.' },
              { codigo: 'OA 15', descripcion: 'Escribir artículos informativos organizados en intro-desarrollo-cierre.' },
              { codigo: 'OA 17', descripcion: 'Establecer destinatario y revisar cohesión.' },
            ],
            habilidades: 'Leer independientemente, extraer info, hacer inferencias, sintetizar, escribir artículos informativos.',
            conceptos_clave: 'Metacognición en la comprensión, estructura del artículo informativo, bibliografía.',
            vocabulario: 'Vocabulario específico del tema, expresiones en lenguaje figurado.',
          },
        ],
      },
      {
        id: '6b-u3',
        nombre: 'Unidad 3: Narrativa, Expresión Dramática y Pensamiento Crítico',
        horas: 57,
        temas: [
          {
            id: '6b-u3-1',
            nombre: 'Análisis narrativo y crítica literaria',
            oas: [
              { codigo: 'OA 3', descripcion: 'Explicar temas que aborda un autor; comparar lenguaje de dos autores.' },
              { codigo: 'OA 4', descripcion: 'Analizar aspectos relevantes de narraciones.' },
              { codigo: 'OA 16', descripcion: 'Escribir comentarios de dos párrafos fundamentados con ejemplos.' },
            ],
            habilidades: 'Analizar aspectos relevantes, interpretar fragmentos, escribir impresiones sobre lecturas.',
            conceptos_clave: 'Relación texto-película, elementos del género cinematográfico, fundamentación lógica.',
            vocabulario: 'Conceptos de ciencia ficción, policial, aventuras.',
          },
          {
            id: '6b-u3-2',
            nombre: 'Género dramático y análisis de medios',
            oas: [
              { codigo: 'OA 24', descripcion: 'Identificar emisor e intención de mensajes publicitarios.' },
              { codigo: 'OA 25', descripcion: 'Describir cambios de voz en actores para expresar emociones.' },
              { codigo: 'OA 27', descripcion: 'Ceder para llegar a acuerdos.' },
              { codigo: 'OA 31', descripcion: 'Producir dramatizaciones.' },
            ],
            habilidades: 'Evaluar críticamente mensajes, apreciar obras teatrales, dialogar para acuerdos.',
            conceptos_clave: 'Mensaje publicitario y su audiencia, recursos sonoros en teatro, elementos paraverbales.',
            vocabulario: 'Escena, montaje, parlamento, gestualidad.',
          },
        ],
      },
      {
        id: '6b-u4',
        nombre: 'Unidad 4: Procesos de Investigación y Comunicación Efectiva',
        horas: 58,
        temas: [
          {
            id: '6b-u4-1',
            nombre: 'Investigación crítica y producción de informes',
            oas: [
              { codigo: 'OA 6', descripcion: 'Explicar si la información satisface el propósito; comparar titulares de noticias.' },
              { codigo: 'OA 7', descripcion: 'Evaluar críticamente procedencia y suficiencia de información.' },
              { codigo: 'OA 11', descripcion: 'Encontrar info usando motores de búsqueda.' },
              { codigo: 'OA 15', descripcion: 'Elaborar subtema por párrafo con ejemplos.' },
              { codigo: 'OA 29', descripcion: 'Exponer sin leer, usando apoyo visual (PowerPoint).' },
            ],
            habilidades: 'Evaluar críticamente fuentes, buscar y comparar, sintetizar, escribir informes, exponer oralmente.',
            conceptos_clave: 'Confiabilidad de fuentes, sistematización por subtemas, estructura de manual o guía.',
            vocabulario: 'Palabras clave, términos técnicos de investigación, conectores de cohesión.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 7° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '7b',
    curso: '7° Básico',
    nivel_codigo: '7° básico',
    asignatura: 'Lengua y Literatura',
    unidades: [
      {
        id: '7b-u1',
        nombre: 'Unidad 1: El héroe en distintas épocas',
        horas: 34,
        temas: [
          {
            id: '7b-u1-1',
            nombre: 'Análisis de la figura del Héroe',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre las dimensiones de la experiencia humana a partir de obras literarias.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones leídas para enriquecer la comprensión (conflictos, personajes, disposición temporal).' },
              { codigo: 'OA 7', descripcion: 'Formular una interpretación de textos literarios considerando experiencia personal y contexto histórico.' },
              { codigo: 'OA 8', descripcion: 'Analizar y evaluar textos argumentativos (postura del autor, hechos y opiniones).' },
              { codigo: 'OA 14', descripcion: 'Escribir textos breves para persuadir (cartas al director, críticas literarias).' },
              { codigo: 'OA 21', descripcion: 'Dialogar constructivamente para debatir o explorar ideas.' },
            ],
            habilidades: 'Analizar, interpretar, evaluar críticamente, relacionar, sintetizar, planificar, dialogar.',
            conceptos_clave: 'Héroe (literario vs. cotidiano), conflicto narrativo, texto argumentativo, estrategias de relectura.',
            vocabulario: 'Sinónimos precisos, términos denotativos y connotativos.',
          },
        ],
      },
      {
        id: '7b-u2',
        nombre: 'Unidad 2: La solidaridad y la amistad',
        horas: 31,
        temas: [
          {
            id: '7b-u2-1',
            nombre: 'Relaciones humanas y textos persuasivos',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre las dimensiones de la experiencia humana.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones para enriquecer la comprensión.' },
              { codigo: 'OA 10', descripcion: 'Analizar y evaluar textos no literarios.' },
              { codigo: 'OA 14', descripcion: 'Escribir textos para persuadir.' },
              { codigo: 'OA 15', descripcion: 'Planificar, escribir, revisar y editar textos en función del contexto y propósito.' },
              { codigo: 'OA 21', descripcion: 'Dialogar constructivamente para debatir.' },
            ],
            habilidades: 'Reflexionar, comparar, fundamentar posturas, redactar oraciones complejas, negociar acuerdos.',
            conceptos_clave: 'Solidaridad, amistad, coherencia temática, oración (sujeto y predicado).',
            vocabulario: 'Conectores de causa-efecto, términos técnicos según el tema, registro formal.',
          },
        ],
      },
      {
        id: '7b-u3',
        nombre: 'Unidad 3: Mitología y relatos de creación',
        horas: 36,
        temas: [
          {
            id: '7b-u3-1',
            nombre: 'Investigación y exposición oral de mitos',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre las dimensiones de la experiencia humana.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones leídas.' },
              { codigo: 'OA 6', descripcion: 'Sintetizar información de diversas fuentes.' },
              { codigo: 'OA 13', descripcion: 'Escribir artículos informativos con introducción, desarrollo y cierre.' },
              { codigo: 'OA 22', descripcion: 'Exponer usando vocabulario variado y preciso, evitando muletillas.' },
              { codigo: 'OA 24', descripcion: 'Seleccionar páginas y fuentes según profundidad y cobertura.' },
            ],
            habilidades: 'Investigar, jerarquizar información, parafrasear, ensayar presentaciones, sintetizar.',
            conceptos_clave: 'Relato mitológico, cosmovisión, artículo informativo, fuente confiable, recursos anafóricos.',
            vocabulario: 'Conceptos de mitología clásica y originaria, tecnicismos del tema investigado.',
          },
        ],
      },
      {
        id: '7b-u4',
        nombre: 'Unidad 4: La identidad — quién soy, cómo me ven los demás',
        horas: 30,
        temas: [
          {
            id: '7b-u4-1',
            nombre: 'Construcción de la imagen personal y edición digital',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre las dimensiones de la experiencia humana.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones.' },
              { codigo: 'OA 7', descripcion: 'Formular interpretaciones coherentes de textos literarios.' },
              { codigo: 'OA 13', descripcion: 'Investigar y escribir artículos informativos.' },
              { codigo: 'OA 15', descripcion: 'Planificar, escribir, revisar y editar textos.' },
              { codigo: 'OA 21', descripcion: 'Dialogar constructivamente para explorar ideas.' },
            ],
            habilidades: 'Autoconocimiento, análisis de cambios en personajes, uso de procesador de textos, dicción adecuada.',
            conceptos_clave: 'Identidad personal, transformación de personajes, estructura del cómic, registro formal vs. informal.',
            vocabulario: 'Términos de técnica del cómic (viñeta, globo, nube); palabras complejas.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 8° BÁSICO
  // ─────────────────────────────────────────────────
  {
    id: '8b',
    curso: '8° Básico',
    nivel_codigo: '8° básico',
    asignatura: 'Lengua y Literatura',
    unidades: [
      {
        id: '8b-u1',
        nombre: 'Unidad 1: Epopeya',
        horas: 36,
        temas: [
          {
            id: '8b-u1-1',
            nombre: 'Análisis de la epopeya y contexto histórico',
            oas: [
              { codigo: 'OA 1', descripcion: 'Leer de manera fluida textos variados.' },
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre las dimensiones de la experiencia humana.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones (conflictos, personajes, disposición temporal).' },
              { codigo: 'OA 6', descripcion: 'Sintetizar y registrar ideas principales.' },
              { codigo: 'OA 8', descripcion: 'Analizar y evaluar textos argumentativos.' },
              { codigo: 'OA 14', descripcion: 'Escribir artículos informativos con documentación.' },
              { codigo: 'OA 22', descripcion: 'Dialogar constructivamente para explorar ideas.' },
            ],
            habilidades: 'Analizar conflictos y personajes; interpretar visiones de mundo; resumir; investigar; planificar artículos.',
            conceptos_clave: 'Epopeya, héroe, conflicto narrativo, contexto histórico, sentido del deber, honor.',
            vocabulario: 'Recapitulación, anáforas, referencias bibliográficas.',
          },
        ],
      },
      {
        id: '8b-u2',
        nombre: 'Unidad 2: Experiencias del amor',
        horas: 36,
        temas: [
          {
            id: '8b-u2-1',
            nombre: 'El amor en la literatura y exposición de hallazgos',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre las dimensiones de la experiencia humana.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones (personajes tipo, disposición temporal).' },
              { codigo: 'OA 4', descripcion: 'Analizar poemas (elementos sonoros, lenguaje figurado).' },
              { codigo: 'OA 8', descripcion: 'Analizar y evaluar textos argumentativos.' },
              { codigo: 'OA 23', descripcion: 'Organizar exposiciones con orden lógico y criterios de confiabilidad.' },
            ],
            habilidades: 'Analizar poemas amorosos, investigar contextos, exponer oralmente, sintetizar ideas para informes.',
            conceptos_clave: 'Amor cortés, neoplatonismo, sociedad feudal, tópico literario, confiabilidad de fuentes.',
            vocabulario: 'Muletillas, conectores de organización, categorías de investigación.',
          },
        ],
      },
      {
        id: '8b-u3',
        nombre: 'Unidad 3: Relatos de misterio',
        horas: 30,
        temas: [
          {
            id: '8b-u3-1',
            nombre: 'Narrativa policial, suspenso y cohesión textual',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre las dimensiones de la experiencia humana.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones (estructura, personajes).' },
              { codigo: 'OA 8', descripcion: 'Evaluar textos argumentativos.' },
              { codigo: 'OA 12', descripcion: 'Identificar elementos que dificultan la comprensión (pérdida de referentes).' },
              { codigo: 'OA 13', descripcion: 'Usar deícticos y elipsis para evitar repeticiones.' },
              { codigo: 'OA 17', descripcion: 'Escribir creativamente crónicas y diarios.' },
            ],
            habilidades: 'Analizar creación de suspenso, escribir creativamente, usar oraciones complejas con referentes claros.',
            conceptos_clave: 'Detective, capacidad de observación, correferencia, nominalización, elipsis.',
            vocabulario: 'Hiperónimos, pronombres personales, oraciones subordinadas, deícticos.',
          },
        ],
      },
      {
        id: '8b-u4',
        nombre: 'Unidad 4: Naturaleza',
        horas: 28,
        temas: [
          {
            id: '8b-u4-1',
            nombre: 'Visiones de la naturaleza y escritura persuasiva',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre vigencia de obras clásicas.' },
              { codigo: 'OA 3', descripcion: 'Analizar narraciones.' },
              { codigo: 'OA 4', descripcion: 'Analizar poemas (imágenes, comparaciones).' },
              { codigo: 'OA 8', descripcion: 'Evaluar críticamente documentales.' },
              { codigo: 'OA 15', descripcion: 'Sustentar posturas con evidencias; adecuar registro al destinatario.' },
              { codigo: 'OA 16', descripcion: 'Escribir columnas de opinión.' },
            ],
            habilidades: 'Interpretar símbolos y alegorías, escribir para persuadir, evaluar textos audiovisuales.',
            conceptos_clave: 'Símbolo, alegoría, columna de opinión, modos verbales (subjuntivo e imperativo).',
            vocabulario: 'Términos técnicos, lenguaje figurado, conectores de persuasión.',
          },
        ],
      },
      {
        id: '8b-u5',
        nombre: 'Unidad 5: La comedia',
        horas: 32,
        temas: [
          {
            id: '8b-u5-1',
            nombre: 'Género dramático y normas de escritura informativa',
            oas: [
              { codigo: 'OA 2', descripcion: 'Reflexionar sobre rasgos de época en dramas.' },
              { codigo: 'OA 5', descripcion: 'Analizar textos dramáticos (comedias).' },
              { codigo: 'OA 7', descripcion: 'Formular interpretaciones coherentes.' },
              { codigo: 'OA 14', descripcion: 'Organizar artículos informativos.' },
              { codigo: 'OA 16', descripcion: 'Corregir concordancia artículo-sustantivo y puntuación.' },
              { codigo: 'OA 20', descripcion: 'Debatir en paneles sobre textos leídos.' },
            ],
            habilidades: 'Analizar comedias, comprender visiones de mundo, escribir artículos, debatir.',
            conceptos_clave: 'Comedia, conflicto cotidiano, obra dramática vs. teatral, debate estructurado.',
            vocabulario: 'Acotaciones, parlamentos, términos técnicos de comedia.',
          },
        ],
      },
      {
        id: '8b-u6',
        nombre: 'Unidad 6: El mundo descabellado',
        horas: 30,
        temas: [
          {
            id: '8b-u6-1',
            nombre: 'Literatura de lo absurdo y evaluación crítica de argumentos',
            oas: [
              { codigo: 'OA 2', descripcion: 'Comentar experiencias de personajes distintas a las propias.' },
              { codigo: 'OA 3', descripcion: 'Analizar mundos descabellados.' },
              { codigo: 'OA 8', descripcion: 'Evaluar críticamente tesis y argumentos.' },
              { codigo: 'OA 9', descripcion: 'Identificar prejuicios en textos.' },
              { codigo: 'OA 15', descripcion: 'Escribir críticas de diversos géneros.' },
            ],
            habilidades: 'Analizar mundos descabellados, evaluar tesis y argumentos, escribir críticas, dialogar profundamente.',
            conceptos_clave: 'Mundo descabellado, absurdo, hecho vs. opinión, tesis y razones.',
            vocabulario: 'Modalizadores de certeza, conectores lógicos, sintaxis académica.',
          },
        ],
      },
      {
        id: '8b-u7',
        nombre: 'Unidad 7: Medios de comunicación',
        horas: 36,
        temas: [
          {
            id: '8b-u7-1',
            nombre: 'Análisis crítico de medios, investigación y exposición formal',
            oas: [
              { codigo: 'OA 9', descripcion: 'Analizar y evaluar textos de medios (noticias, publicidad).' },
              { codigo: 'OA 10', descripcion: 'Evaluar validez y confiabilidad de fuentes.' },
              { codigo: 'OA 15', descripcion: 'Escribir textos persuasivos con tesis clara y argumentos coherentes.' },
              { codigo: 'OA 21', descripcion: 'Exponer sin muletillas con material visual de apoyo.' },
              { codigo: 'OA 23', descripcion: 'Identificar propósitos implícitos en noticias.' },
            ],
            habilidades: 'Evaluar críticamente noticieros, investigar temas, expresarse con volumen y dicción, jerarquizar ideas.',
            conceptos_clave: 'Objetividad periodística, sensacionalismo, ética de uso de información, fuente confiable.',
            vocabulario: 'Tematización, conectores de exposición, bibliografía, registro formal.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 1° MEDIO
  // ─────────────────────────────────────────────────
  {
    id: '1m',
    curso: '1° Medio',
    nivel_codigo: '1° medio',
    asignatura: 'Lengua y Literatura',
    unidades: [
      {
        id: '1m-u1',
        nombre: 'Unidad 1: La libertad como tema literario (narrativa y lírica)',
        horas: 58,
        temas: [
          {
            id: '1m-u1-1',
            nombre: 'Análisis de obras narrativas y líricas sobre la libertad',
            oas: [
              { codigo: 'OA 3', descripcion: 'Analizar narraciones (conflictos, personajes, disposición temporal, tipos de narrador).' },
              { codigo: 'OA 4', descripcion: 'Analizar poemas (símbolos, actitud del hablante, lenguaje figurado).' },
              { codigo: 'OA 7', descripcion: 'Comprender la relevancia de obras del Romanticismo.' },
              { codigo: 'OA 8', descripcion: 'Formular interpretaciones coherentes de textos literarios.' },
            ],
            habilidades: 'Analizar obras, interpretar símbolos, formular hipótesis, debatir temas literarios.',
            conceptos_clave: 'Libertad, subjetividad, Romanticismo, contexto de producción, rebelión ante el orden establecido.',
            vocabulario: 'Conflicto narrativo, personajes tipo, lenguaje figurado.',
          },
        ],
      },
      {
        id: '1m-u2',
        nombre: 'Unidad 2: Ciudadanos y opinión (texto argumentativo)',
        horas: 58,
        temas: [
          {
            id: '1m-u2-1',
            nombre: 'Reflexión y producción de discursos argumentativos',
            oas: [
              { codigo: 'OA 9', descripcion: 'Analizar y evaluar textos argumentativos (tesis, argumentos, hechos vs. opiniones).' },
              { codigo: 'OA 14', descripcion: 'Escribir textos para persuadir (ensayos).' },
              { codigo: 'OA 15', descripcion: 'Planificar, escribir, revisar y editar textos.' },
              { codigo: 'OA 20', descripcion: 'Resumir y evaluar discursos argumentativos escuchados.' },
            ],
            habilidades: 'Analizar textos argumentativos, argumentar posturas, persuadir por escrito, dialogar.',
            conceptos_clave: 'Pensamiento crítico, ciudadanos informados, honestidad intelectual, toma de decisiones.',
            vocabulario: 'Ensayo, persuasión, bibliografía, texto no literario.',
          },
        ],
      },
      {
        id: '1m-u3',
        nombre: 'Unidad 3: Relaciones humanas en el teatro y la literatura',
        horas: 40,
        temas: [
          {
            id: '1m-u3-1',
            nombre: 'La tragedia y la representación de la condición humana',
            oas: [
              { codigo: 'OA 5', descripcion: 'Analizar textos dramáticos (conflicto humano, evolución de personajes, puesta en escena).' },
              { codigo: 'OA 6', descripcion: 'Comprender la visión de mundo en tragedias.' },
              { codigo: 'OA 23', descripcion: 'Analizar efectos de elementos lingüísticos, paralingüísticos y no lingüísticos.' },
            ],
            habilidades: 'Analizar obras dramáticas, relacionar géneros, dramatizar, analizar efectos paralingüísticos.',
            conceptos_clave: 'Hybris, catarsis, conflicto trágico, acotaciones, lenguaje paraverbal.',
            vocabulario: 'Tragedia, motivaciones, diálogo, escena, parlamento.',
          },
        ],
      },
      {
        id: '1m-u4',
        nombre: 'Unidad 4: Comunicación y sociedad (medios de comunicación)',
        horas: 40,
        temas: [
          {
            id: '1m-u4-1',
            nombre: 'Lectura crítica de mensajes en medios masivos',
            oas: [
              { codigo: 'OA 10', descripcion: 'Analizar y evaluar textos de medios (noticias, publicidad, propaganda, crónicas).' },
              { codigo: 'OA 13', descripcion: 'Escribir textos explicativos (artículos, reportajes).' },
              { codigo: 'OA 19', descripcion: 'Comprender, comparar y evaluar textos orales y audiovisuales.' },
            ],
            habilidades: 'Analizar textos periodísticos, evaluar recursos persuasivos, escribir géneros periodísticos.',
            conceptos_clave: 'Consumidor responsable, estereotipo, veracidad de la información, progresión temática.',
            vocabulario: 'Publicidad, propaganda, estereotipo, recursos persuasivos.',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // 2° MEDIO
  // ─────────────────────────────────────────────────
  {
    id: '2m',
    curso: '2° Medio',
    nivel_codigo: '2° medio',
    asignatura: 'Lengua y Literatura',
    unidades: [
      {
        id: '2m-u1',
        nombre: 'Unidad 1: Sobre la ausencia — exilio, migración e identidad (narrativa)',
        horas: 58,
        temas: [
          {
            id: '2m-u1-1',
            nombre: 'Introducción a la ausencia e identidad',
            oas: [
              { codigo: 'OA 3', descripcion: 'Analizar narraciones leídas.' },
              { codigo: 'OA 7', descripcion: 'Formular interpretaciones coherentes considerando contexto de producción.' },
              { codigo: 'OA 11', descripcion: 'Aplicar estrategias de comprensión (resumir, formular preguntas).' },
              { codigo: 'OA 20', descripcion: 'Evaluar la pertinencia de selección de textos.' },
            ],
            habilidades: 'Analizar narraciones, reflexionar sobre experiencia humana, formular interpretaciones, evaluar puntos de vista.',
            conceptos_clave: 'Exilio, migración, identidad, conflicto narrativo, visión del narrador, tópicos literarios, flashback.',
            vocabulario: 'Vocabulario específico de cuentos latinoamericanos; términos literarios del género narrativo.',
          },
          {
            id: '2m-u1-2',
            nombre: 'Argumentación y temas sociales',
            oas: [
              { codigo: 'OA 9', descripcion: 'Analizar estrategia argumentativa (tesis, argumentos, modalizadores).' },
              { codigo: 'OA 11', descripcion: 'Aplicar estrategias de comprensión.' },
              { codigo: 'OA 13', descripcion: 'Investigar temas para complementar lecturas.' },
              { codigo: 'OA 14', descripcion: 'Evaluar la eficacia de textos argumentativos.' },
              { codigo: 'OA 21', descripcion: 'Dialogar para debatir ideas.' },
            ],
            habilidades: 'Evaluar razonamientos, investigar, sintetizar ideas, dialogar para debatir.',
            conceptos_clave: 'Tesis, argumentos, fallas en argumentación, modalizadores de certeza, fuentes confiables.',
            vocabulario: 'Conectores argumentativos, modalizadores, términos técnicos de investigación bibliográfica.',
          },
        ],
      },
      {
        id: '2m-u2',
        nombre: 'Unidad 2: Ciudadanía y trabajo (medios de comunicación)',
        horas: 58,
        temas: [
          {
            id: '2m-u2-1',
            nombre: 'Análisis multimodal y recursos de persuasión en medios',
            oas: [
              { codigo: 'OA 10', descripcion: 'Analizar críticamente textos de medios, evaluar mensajes publicitarios/propagandísticos.' },
              { codigo: 'OA 13', descripcion: 'Escribir textos explicativos y expositivos.' },
              { codigo: 'OA 16', descripcion: 'Incorporar frases nominales como mecanismo de correferencia.' },
              { codigo: 'OA 17', descripcion: 'Aplicar estilo directo e indirecto coherentemente.' },
              { codigo: 'OA 20', descripcion: 'Identificar propósitos explícitos e implícitos en reportajes y noticias.' },
            ],
            habilidades: 'Analizar críticamente textos de medios, evaluar mensajes, analizar efectos paralingüísticos.',
            conceptos_clave: 'Análisis multimodal, persuasión lingüística y no lingüística, frases nominales complejas, línea editorial.',
            vocabulario: 'Estrategias de persuasión, multimodalidad, deícticos, frases preposicionales.',
          },
          {
            id: '2m-u2-2',
            nombre: 'Producción de reportaje audiovisual',
            oas: [
              { codigo: 'OA 13', descripcion: 'Organizar ideas adecuándose al género y propósito.' },
              { codigo: 'OA 15', descripcion: 'Planificar y editar textos complejos.' },
              { codigo: 'OA 22', descripcion: 'Desarrollar oralmente ideas con información fidedigna.' },
              { codigo: 'OA 23', descripcion: 'Usar material visual para destacar lo más relevante.' },
              { codigo: 'OA 24', descripcion: 'Producir reportaje audiovisual.' },
            ],
            habilidades: 'Investigar, producir reportaje audiovisual, expresarse ante audiencia, planificar y editar.',
            conceptos_clave: 'Estructura del reportaje (entrada, voz en off, entrevistas, cierre), storyboard, guion.',
            vocabulario: 'Terminología técnica de edición (voz en off, montaje), conectores de progresión temática.',
          },
        ],
      },
      {
        id: '2m-u3',
        nombre: 'Unidad 3: Lo divino y lo humano (género lírico)',
        horas: 40,
        temas: [
          {
            id: '2m-u3-1',
            nombre: 'Poesía del Siglo de Oro y tópicos literarios',
            oas: [
              { codigo: 'OA 4', descripcion: 'Analizar poemas e interpretar sentido a partir de lenguaje poético y recursos estilísticos.' },
              { codigo: 'OA 6', descripcion: 'Determinar el sentido de relaciones intertextuales.' },
              { codigo: 'OA 11', descripcion: 'Evaluar obras leídas considerando criterios estéticos.' },
              { codigo: 'OA 13', descripcion: 'Investigar contextos históricos; argumentar ideas.' },
            ],
            habilidades: 'Analizar poemas, interpretar lenguaje figurado, argumentar ideas, escribir ensayos, investigar contextos.',
            conceptos_clave: 'Siglo de Oro, soneto, tópicos literarios (Carpe diem, Beatus ille, Locus amoenus), ideal de belleza.',
            vocabulario: 'Símbolos, actitud del hablante, lenguaje figurado, metáfora, hipérbaton, métrica poética.',
          },
        ],
      },
      {
        id: '2m-u4',
        nombre: 'Unidad 4: Poder y ambición (género dramático)',
        horas: 40,
        temas: [
          {
            id: '2m-u4-1',
            nombre: 'Conflicto dramático y representación del poder',
            oas: [
              { codigo: 'OA 3', descripcion: 'Analizar planteamiento y desarrollo del conflicto dramático.' },
              { codigo: 'OA 5', descripcion: 'Inferir características de personajes a partir de diálogos y motivaciones.' },
              { codigo: 'OA 6', descripcion: 'Explicar cómo elementos de la puesta en escena aportan a la comprensión.' },
              { codigo: 'OA 11', descripcion: 'Analizar obras dramáticas.' },
              { codigo: 'OA 20', descripcion: 'Adaptar textos narrativos a drama.' },
            ],
            habilidades: 'Interpretar críticamente textos dramáticos, adaptar narrativa a drama, analizar puestas en escena, debatir.',
            conceptos_clave: 'Conflicto dramático, atmósfera de la obra, personajes tipo, acotaciones, monólogos, puesta en escena.',
            vocabulario: 'Parlamentos, escena, montaje, ambición, poder, términos de diseño teatral.',
          },
          {
            id: '2m-u4-2',
            nombre: 'Debate final sobre poder y ambición',
            oas: [
              { codigo: 'OA 9', descripcion: 'Evaluar recursos discursivos (coherencia, vocabulario).' },
              { codigo: 'OA 20', descripcion: 'Negociar acuerdos y reformular comentarios.' },
              { codigo: 'OA 21', descripcion: 'Fundamentar posturas distinguiendo afirmaciones basadas en evidencia.' },
              { codigo: 'OA 22', descripcion: 'Dialogar mediante preguntas factuales e interpretativas.' },
            ],
            habilidades: 'Evaluar puntos de vista, dialogar constructivamente, expresarse con fluidez y dominio del tema.',
            conceptos_clave: 'Tesis y contratesis, refutación, contraargumentación, cortesía comunicativa.',
            vocabulario: 'Registro formal, conectores de debate, términos controversiales.',
          },
        ],
      },
    ],
  },
];

// Helper: obtener unidades de un programa
export function getUnidades(programaId: string): Unidad[] {
  return programas.find(p => p.id === programaId)?.unidades ?? [];
}

// Helper: obtener temas de una unidad
export function getTemas(programaId: string, unidadId: string): Tema[] {
  return getUnidades(programaId).find(u => u.id === unidadId)?.temas ?? [];
}

// Helper: obtener OAs de un tema
export function getOAs(programaId: string, unidadId: string, temaId: string): OA[] {
  return getTemas(programaId, unidadId).find(t => t.id === temaId)?.oas ?? [];
}
