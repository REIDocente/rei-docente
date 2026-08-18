/**
 * textbook_structure.ts
 * Estructura bibliográfica de textos escolares MINEDUC por curso.
 * IMPORTANTE: Solo se almacena información estructural (títulos, páginas,
 * tópicos, géneros). No se reproduce ningún contenido protegido.
 * Uso permitido: referencia pedagógica interna de la plataforma REI Docente.
 */

export interface TextbookUnit {
  numero: number;
  nombre: string;
  tomo: 1 | 2;
  paginas: { inicio: number; fin: number };
  oas_mencionados: string[];         // OA codes o descripciones según nivel
  generos: string[];                  // tipos de texto que trabaja la unidad
  topicos_linguisticos: string[];     // contenidos gramaticales/lingüísticos
  textos_literarios: string[];        // solo títulos y autores, sin reproducir contenido
  tipo_evaluacion: string;
}

export interface GradeTextbook {
  curso: string;
  nombre_texto: string;
  editorial: string;
  unidades: TextbookUnit[];
}

export const TEXTBOOK_STRUCTURE: Record<string, GradeTextbook> = {

  // ─── 1° Básico ────────────────────────────────────────────────────────────
  '1° Básico': {
    curso: '1° Básico',
    nombre_texto: 'Leo Primero',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: '¡Podemos volar!', tomo: 1,
        paginas: { inicio: 4, fin: 23 },
        oas_mencionados: ['Leer y escribir las vocales', 'Escuchar y comprender cuentos y poemas'],
        generos: ['Cuento', 'Poema'],
        topicos_linguisticos: ['Las vocales (a, e, i, o, u)'],
        textos_literarios: [
          'La montaña de libros más alta del mundo — Rocio Bonilla',
          '¿Qué hacen las vocales? — S. Jorquera'
        ],
        tipo_evaluacion: 'Metacognición y síntesis "Qué aprendí"'
      },
      {
        numero: 2, nombre: 'Un regalo inesperado', tomo: 1,
        paginas: { inicio: 24, fin: 43 },
        oas_mencionados: ['Leer y escribir palabras con la letra M', 'Escribir el resumen de un cuento'],
        generos: ['Cuento'],
        topicos_linguisticos: ['Consonante M m', 'El resumen'],
        textos_literarios: [
          'Mi mamut y yo — Joel Stewart',
          'El regalo de Mili — Equipo elaborador DEG'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 3, nombre: '¿Cómo se expresan?', tomo: 1,
        paginas: { inicio: 44, fin: 63 },
        oas_mencionados: ['Leer y escribir palabras con la letra L'],
        generos: ['Texto informativo', 'Poema'],
        topicos_linguisticos: ['Consonante L l', 'Uso de mayúscula', 'Punto final', 'Espacios entre palabras'],
        textos_literarios: [
          'Una forma muy especial de limpiarse los dientes — Fundación Astoreca',
          'El lagarto está llorando — Federico García Lorca'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 4, nombre: '¡Alas en el cielo!', tomo: 1,
        paginas: { inicio: 64, fin: 83 },
        oas_mencionados: ['Leer y escribir palabras con la letra P'],
        generos: ['Texto informativo', 'Cuento'],
        topicos_linguisticos: ['Consonante P p'],
        textos_literarios: [
          'La golondrina chilena — Fundación Astoreca',
          'El pintor de pajaritos — Cuento tradicional'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 6, nombre: '¡Vamos al mar!', tomo: 1,
        paginas: { inicio: 104, fin: 123 },
        oas_mencionados: ['Leer y escribir palabras con la letra D', 'Escribir una historia'],
        generos: ['Texto informativo', 'Cuento'],
        topicos_linguisticos: ['Consonante D d'],
        textos_literarios: [
          'La estrella de mar — Fundación Astoreca',
          'La historia de la ostra que perdió su perla — Cuento tradicional'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 7, nombre: 'Fiesta de colores', tomo: 1,
        paginas: { inicio: 124, fin: 143 },
        oas_mencionados: ['Leer y escribir palabras con la letra T', 'Escribir un cuento'],
        generos: ['Cuento', 'Texto informativo'],
        topicos_linguisticos: ['Consonante T t'],
        textos_literarios: [
          'La rebelión de los lápices de colores — Alejandra Herbas',
          'Tucán de pico multicolor — María Pía Escobar'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 8, nombre: 'Sorpresas en el colegio', tomo: 1,
        paginas: { inicio: 144, fin: 163 },
        oas_mencionados: ['Leer y escribir palabras con la letra V', 'Escribir diálogos'],
        generos: ['Cuento', 'Poema'],
        topicos_linguisticos: ['Consonante V v'],
        textos_literarios: [
          'Álex quiere un dinosaurio — H. Oram y S. Kitamura',
          'La vaca estudiosa — María Elena Walsh'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 12, nombre: '¡Te muestro mi hogar!', tomo: 1,
        paginas: { inicio: 226, fin: 245 },
        oas_mencionados: ['Leer y escribir palabras con la letra G', 'Escribir observaciones'],
        generos: ['Texto informativo', 'Cuento'],
        topicos_linguisticos: ['Consonante G g (ga, go, gu)'],
        textos_literarios: [
          'La fría Groenlandia — Fundación Astoreca',
          'Noche, Luna y cielo — M. Eggers'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 13, nombre: '¡Viva la amistad!', tomo: 2,
        paginas: { inicio: 4, fin: 23 },
        oas_mencionados: ['Leer y escribir palabras con la letra F', 'Escribir un correo electrónico'],
        generos: ['Cuento', 'Poema'],
        topicos_linguisticos: ['Consonante F f'],
        textos_literarios: [
          'Juan José y Amapola — Trinidad Castro',
          'La olla golosa — C. Romero y M. Bastías'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 14, nombre: '¿Cómo es la naturaleza?', tomo: 2,
        paginas: { inicio: 24, fin: 43 },
        oas_mencionados: ['Leer y escribir palabras con la letra J', 'Escribir una ficha'],
        generos: ['Cuento', 'Texto informativo'],
        topicos_linguisticos: ['Consonante J j'],
        textos_literarios: [
          'El Sol, la Luna y el Agua — Laura Herrera',
          'El caracol de jardín — Equipo elaborador'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 17, nombre: '¿Cómo es el espacio?', tomo: 2,
        paginas: { inicio: 84, fin: 103 },
        oas_mencionados: ['Leer y escribir palabras con la letra Y'],
        generos: ['Cuento'],
        topicos_linguisticos: ['Consonante Y y'],
        textos_literarios: [
          'Calvin no sabe volar — Jennifer Berne',
          'Una ciudad en el espacio — Equipo elaborador'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 20, nombre: '¡Vamos a cultivar!', tomo: 2,
        paginas: { inicio: 144, fin: 163 },
        oas_mencionados: ['Leer y escribir palabras con Ll', 'Escribir un texto instructivo'],
        generos: ['Cuento', 'Texto instructivo'],
        topicos_linguisticos: ['Consonante Ll ll'],
        textos_literarios: [
          'Frederick — Leo Lionni',
          'Cómo hacer un almácigo — Equipo elaborador'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 23, nombre: '¡Hermosa naturaleza!', tomo: 2,
        paginas: { inicio: 204, fin: 223 },
        oas_mencionados: ['Leer y escribir palabras con la letra K', 'Escribir una ficha'],
        generos: ['Texto informativo'],
        topicos_linguisticos: ['Consonante K k', 'Sílabas ka, ke, ki, ko, ku'],
        textos_literarios: [
          'Los volcanes — Fundación Astoreca',
          'Koalas — Icarito'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
      {
        numero: 24, nombre: '¡Llegamos a la meta!', tomo: 2,
        paginas: { inicio: 224, fin: 241 },
        oas_mencionados: ['Leer y escribir palabras con ge, gi, gue, gui'],
        generos: ['Cuento', 'Texto informativo'],
        topicos_linguisticos: ['Combinaciones Gue, Gui, Ge, Gi'],
        textos_literarios: [
          'Un préstamo muy especial — Equipo elaborador',
          'El girasol — Adaptación Wikipedia'
        ],
        tipo_evaluacion: '"Qué aprendí"'
      },
    ]
  },

  // ─── 2° Básico ────────────────────────────────────────────────────────────
  '2° Básico': {
    curso: '2° Básico',
    nombre_texto: 'Leo Primero 2°',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: 'Insectos sorprendentes', tomo: 1,
        paginas: { inicio: 4, fin: 23 },
        oas_mencionados: ['Escuchar, leer y comprender poemas', 'Palabras con sílabas ca, ce, ci, co, cu', 'Escribir una ficha'],
        generos: ['Artículo informativo', 'Poema', 'Ficha'],
        topicos_linguisticos: ['Estrofas y rimas', 'Combinaciones ca, ce, ci, co, cu'],
        textos_literarios: [
          '¡¿Insectos?! — Lila Prap',
          'La cigarra y la hormiga — Félix María de Samaniego'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 2, nombre: '¡Vamos de viaje!', tomo: 1,
        paginas: { inicio: 24, fin: 43 },
        oas_mencionados: ['Escuchar y leer cuentos', 'Elaborar un cuento', 'Ordenar hechos'],
        generos: ['Cuento'],
        topicos_linguisticos: ['Sustantivos comunes', 'Secuencia narrativa (primero, luego, finalmente)'],
        textos_literarios: [
          'Ratón de campo y ratón de ciudad — Kašmir Huseinovic y Andrea Petrlik',
          'Ricitos de Oro y los tres osos — Anónimo'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 3, nombre: 'Gabriela', tomo: 1,
        paginas: { inicio: 44, fin: 63 },
        oas_mencionados: ['Escuchar y leer biografías y poemas', 'Escribir una biografía'],
        generos: ['Biografía', 'Poema', 'Ficha', 'Acróstico'],
        topicos_linguisticos: ['Sustantivos comunes y propios', 'Uso de mayúsculas'],
        textos_literarios: [
          'Gabriela, la poeta viajera — Alejandra Toro',
          '¿En dónde tejemos la ronda? — Gabriela Mistral'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 4, nombre: 'Curiosidades', tomo: 1,
        paginas: { inicio: 64, fin: 83 },
        oas_mencionados: ['Escuchar y leer textos curiosos y cuentos', 'Escribir fichas'],
        generos: ['Artículo informativo', 'Cuento', 'Poema', 'Ficha'],
        topicos_linguisticos: ['Artículos definidos e indefinidos', 'Sustantivos comunes y propios'],
        textos_literarios: [
          '¿Los palotes vienen de los palos? — Luz Valeria Oppliger & Francisco Bozinovic',
          'La piel del cocodrilo — Anónimo'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 6, nombre: '¿Cómo son?', tomo: 1,
        paginas: { inicio: 104, fin: 123 },
        oas_mencionados: ['Escuchar y leer artículos informativos', 'Escribir tarjetas con datos curiosos'],
        generos: ['Artículo informativo'],
        topicos_linguisticos: ['Adjetivos calificativos', 'Combinaciones fl, bl, pl'],
        textos_literarios: [
          '¿Por qué hay flores de distintos colores? — Luz Valeria Oppliger & Francisco Bozinovic',
          'Flamen-cosas — C. Yáñez'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 7, nombre: 'Una hermosa enseñanza', tomo: 1,
        paginas: { inicio: 124, fin: 143 },
        oas_mencionados: ['Escuchar y leer fábulas', 'Escribir una fábula'],
        generos: ['Fábula'],
        topicos_linguisticos: ['Sustantivos comunes', 'Uso de artículos'],
        textos_literarios: [
          'La Tortulenta — Esteban Cabezas',
          'La mujer, el zorro y el gallo — Félix María Samaniego'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 8, nombre: 'Mundo de colores', tomo: 1,
        paginas: { inicio: 144, fin: 163 },
        oas_mencionados: ['Escuchar y leer cuentos y poemas', 'Escribir un poema'],
        generos: ['Cuento', 'Poema'],
        topicos_linguisticos: ['La oración (mayúscula inicial y punto final)', 'Sustantivos comunes'],
        textos_literarios: [
          'Las rayas del tigre — Marcelo Simonetti',
          'Un mundo de colores — Carmen Gil'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 9, nombre: 'Historias emplumadas', tomo: 1,
        paginas: { inicio: 164, fin: 183 },
        oas_mencionados: ['Escuchar y leer cuentos y textos informativos', 'Escribir una investigación'],
        generos: ['Cuento', 'Artículo informativo'],
        topicos_linguisticos: ['Adjetivos calificativos'],
        textos_literarios: [
          'Ema y Pajarito — Ananda Sibilia y Virginia Herrera',
          'El ave del paraíso — Adaptación Wikipedia'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 10, nombre: 'Versos y más versos', tomo: 1,
        paginas: { inicio: 184, fin: 203 },
        oas_mencionados: ['Escuchar y leer cuentos y poemas', 'Escribir e ilustrar un texto'],
        generos: ['Cuento', 'Poema'],
        topicos_linguisticos: ['Signos de interrogación y exclamación'],
        textos_literarios: [
          'El ratón que quería hacer una tortilla — Davide Cali y María Dek',
          'Pastorcita — Rafael Pombo'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 11, nombre: '¡Celebremos!', tomo: 1,
        paginas: { inicio: 204, fin: 225 },
        oas_mencionados: ['Escuchar y leer invitaciones', 'Escribir sobre un cumpleaños soñado'],
        generos: ['Invitación', 'Correo electrónico', 'Diálogo'],
        topicos_linguisticos: ['Sustantivos comunes y propios', 'Adjetivos calificativos', 'Concordancia artículo-sustantivo'],
        textos_literarios: [
          '¿Quién quiere celebrar mi cumpleaños? — Nora Brech'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 12, nombre: 'Juguemos en el bosque', tomo: 1,
        paginas: { inicio: 226, fin: 245 },
        oas_mencionados: ['Escuchar y leer artículos informativos', 'Escribir sobre el cuidado de parques'],
        generos: ['Artículo informativo'],
        topicos_linguisticos: ['Género y número de sustantivos', 'Antónimos'],
        textos_literarios: [
          '¿Por qué están en peligro de extinción las chinchillas? — Luz Valeria Oppliger & Francisco Bozinovic',
          'Los Parques Naturales en peligro — Conaf'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 13, nombre: 'Te dejo una enseñanza', tomo: 2,
        paginas: { inicio: 4, fin: 23 },
        oas_mencionados: ['Escuchar y leer leyendas', 'Escribir una leyenda'],
        generos: ['Leyenda', 'Cuento'],
        topicos_linguisticos: ['Prefijo des-', 'Sustantivos y artículos', 'Momentos de la leyenda (inicio, desarrollo, desenlace)'],
        textos_literarios: [
          'La vaca mágica — Joan De Déu Prats',
          'El murciélago de colores — Anónimo'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 16, nombre: 'El anciano y su jardín', tomo: 2,
        paginas: { inicio: 64, fin: 83 },
        oas_mencionados: ['Escuchar y leer cuentos y poemas', 'Escribir sobre un lugar soñado'],
        generos: ['Cuento', 'Poema'],
        topicos_linguisticos: ['Palabras compuestas', 'Adjetivos calificativos'],
        textos_literarios: [
          'Félix enseña a reciclar — Mrinalini Singh',
          'El anciano y su jardín — S. Jorquera'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 17, nombre: 'Construimos en conjunto', tomo: 2,
        paginas: { inicio: 84, fin: 103 },
        oas_mencionados: ['Escuchar y leer textos instructivos', 'Escribir un instructivo'],
        generos: ['Texto instructivo'],
        topicos_linguisticos: ['Familias de palabras', 'Uso de mayúsculas y minúsculas en el alfabeto'],
        textos_literarios: [
          'Rosa pionera, ingeniera — Andrea Beaty',
          'Instrucciones para elaborar un teléfono casero — Equipo editorial'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 18, nombre: 'Dinosaurios maravillosos', tomo: 2,
        paginas: { inicio: 104, fin: 123 },
        oas_mencionados: ['Escuchar y leer artículos informativos', 'Escribir diálogos e investigar'],
        generos: ['Artículo informativo'],
        topicos_linguisticos: ['Signos de interrogación', 'Diferencias entre cuento y artículo informativo'],
        textos_literarios: [
          'Los dinosaurios — E. Kecir',
          'Descubrimiento de una nueva especie de dinosaurio — La Tercera'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 19, nombre: 'Historias fantásticas', tomo: 2,
        paginas: { inicio: 124, fin: 143 },
        oas_mencionados: ['Escuchar y leer cuentos tradicionales', 'Escribir un cuento'],
        generos: ['Cuento tradicional'],
        topicos_linguisticos: ['Género y número de los artículos', 'Estructura del cuento (inicio, desarrollo, desenlace)'],
        textos_literarios: [
          '74 paraguas — Ana María Güiraldes',
          'El chacal astuto y el cocodrilo — Anónimo'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 20, nombre: '¿Cómo nos alimentamos?', tomo: 2,
        paginas: { inicio: 144, fin: 163 },
        oas_mencionados: ['Escuchar y leer textos informativos', 'Escribir un afiche'],
        generos: ['Texto informativo', 'Afiche'],
        topicos_linguisticos: ['Prefijos i-, in-, im-'],
        textos_literarios: [
          'Pueblo Aymara — Carla Fullá',
          'La alimentación saludable — Unicef'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 21, nombre: '¿Quiénes nos acompañan siempre?', tomo: 2,
        paginas: { inicio: 164, fin: 183 },
        oas_mencionados: ['Escuchar cuentos e interpretar obras de teatro', 'Escribir acotaciones'],
        generos: ['Cuento', 'Obra de teatro'],
        topicos_linguisticos: ['Acotaciones y paréntesis', 'Prefijo des-', 'Signos de interrogación y exclamación'],
        textos_literarios: [
          'Alegría — Carmen Gil',
          'La Pata Dedé — Anónimo'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 22, nombre: 'Un viaje por el universo', tomo: 2,
        paginas: { inicio: 184, fin: 203 },
        oas_mencionados: ['Escuchar y leer artículos informativos', 'Escribir un texto informativo'],
        generos: ['Artículo informativo'],
        topicos_linguisticos: ['Uso de r y rr', 'Antónimos'],
        textos_literarios: [
          'Dibujos de luz — Ofelia Ortega',
          'Tanabata: la fiesta de las estrellas — Wikipedia'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 23, nombre: 'Historia de tortugas', tomo: 2,
        paginas: { inicio: 204, fin: 225 },
        oas_mencionados: ['Escuchar y leer cuentos', 'Escribir un enigma'],
        generos: ['Cuento', 'Enigma'],
        topicos_linguisticos: ['El diálogo'],
        textos_literarios: [
          'El regalo de Marcelina — Joan De Déu Prats',
          'El coyote y la tortuga — Anónimo'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 24, nombre: 'Gente de la tierra', tomo: 2,
        paginas: { inicio: 226, fin: 241 },
        oas_mencionados: ['Escuchar y leer artículos informativos', 'Escribir un diccionario'],
        generos: ['Artículo informativo'],
        topicos_linguisticos: ['Signos de interrogación y exclamación'],
        textos_literarios: [
          'Historia gráfica de Chile — Alfredo Cáceres et al.',
          'Mapuche: gente de la tierra — Dibam'
        ],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
    ]
  },

  // ─── 3° Básico ────────────────────────────────────────────────────────────
  '3° Básico': {
    curso: '3° Básico',
    nombre_texto: 'Leo Primero 3°',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: 'Mis lugares preferidos', tomo: 1,
        paginas: { inicio: 4, fin: 16 },
        oas_mencionados: ['RRA 1.1', 'RRA 1.3', 'RRA 1.5'],
        generos: ['Cuento', 'Poema', 'Noticia', 'Anécdota'],
        topicos_linguisticos: ['Secuenciar hechos (inicio, desarrollo, desenlace)', 'Sustantivos propios y comunes', 'Adjetivos calificativos'],
        textos_literarios: ['El camino que no iba a ninguna parte — Gianni Rodari', 'Los lunes al gol — Javier Ruiz Taboada'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 2, nombre: '¡Qué buena idea!', tomo: 1,
        paginas: { inicio: 17, fin: 28 },
        oas_mencionados: ['RRA 2.1', 'RRA 2.3', 'RRA 2.4', 'RRA 2.5'],
        generos: ['Cuento', 'Afiche', 'Cómic', 'Artículo informativo'],
        topicos_linguisticos: ['Estrategia de predecir', 'Sinónimos', 'Estructura del artículo informativo (título, imagen, párrafos de datos)'],
        textos_literarios: ['¿Qué haces con una idea? — Koby Yamada', 'Preparando la mochila — Equipo elaborador', 'Pura vitamina — Equipo elaborador'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 3, nombre: 'Cómo ser un líder verde', tomo: 1,
        paginas: { inicio: 29, fin: 41 },
        oas_mencionados: ['RRA 3.1', 'RRA 3.4', 'RRA 3.5'],
        generos: ['Cuento', 'Microcuento', 'Noticia', 'Afiche'],
        topicos_linguisticos: ['El microcuento (relato corto, personajes, final abierto)', 'Diálogo oral'],
        textos_literarios: ['Remi busca trabajo — Florencia Herrera & Antonia Herrera', 'Gatos de papel — Daniela Luna Verdejo'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 4, nombre: 'Aventura espacial', tomo: 1,
        paginas: { inicio: 42, fin: 53 },
        oas_mencionados: ['RRA 4.2', 'RRA 4.3'],
        generos: ['Artículo informativo', 'Noticia', 'Infografía', 'Quebrantahuesos'],
        topicos_linguisticos: ['Estrategia de formular preguntas', 'El quebrantahuesos (juego con el lenguaje)', 'Uso de punto seguido y punto aparte', 'La exposición oral'],
        textos_literarios: ['Astrónomos y astronautas', 'Viaje al espacio'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 5, nombre: '¡Lo logramos!', tomo: 1,
        paginas: { inicio: 54, fin: 66 },
        oas_mencionados: ['RRA 5.1', 'RRA 5.4', 'RRA 5.5'],
        generos: ['Leyenda', 'Poema', 'Noticia', 'Artículo informativo', 'Cuento'],
        topicos_linguisticos: ['Partes del cuento (inicio, desarrollo/nudo, desenlace)', 'El diálogo'],
        textos_literarios: ['Pipirima y las dos hermanas — Leyenda rapanui', 'Cancioncilla a la luna — Carlos María Vallejo', 'La escuela pequeña — Cuento'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 6, nombre: 'La Tierra y el universo', tomo: 1,
        paginas: { inicio: 67, fin: 78 },
        oas_mencionados: ['RRA 6.1', 'RRA 6.3', 'RRA 6.4', 'RRA 6.5', 'RRA 6.6'],
        generos: ['Cuento', 'Noticia', 'Artículo informativo', 'Infografía', 'Entrada de blog'],
        topicos_linguisticos: ['Estrategia de inferir', 'Sinónimos', 'Estructura de entrada de blog (sitio web, estilo diario personal)'],
        textos_literarios: ['Mira el cielo, el paseo de Yakana — Sofía Otero'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 7, nombre: 'Animales animados', tomo: 1,
        paginas: { inicio: 79, fin: 91 },
        oas_mencionados: ['RRA 7.1'],
        generos: ['Cuento', 'Texto instructivo', 'Artículo informativo', 'Fragmento de novela', 'Ficha temática'],
        topicos_linguisticos: ['Resumir (subrayar ideas principales) y secuenciar hechos', 'Momento de clímax en el relato', 'Sinónimos y antónimos', 'Estructura de ficha temática (registro sintético de información)'],
        textos_literarios: ['¿Helado de papas? — Satomi Ichikawa', 'Papelucho — Marcela Paz (fragmento)'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 8, nombre: 'Es mejor cuando nos ayudamos', tomo: 1,
        paginas: { inicio: 92, fin: 103 },
        oas_mencionados: ['RRA 8.1', 'RRA 8.3', 'RRA 8.4'],
        generos: ['Cuento', 'Noticia', 'Cuento en verso'],
        topicos_linguisticos: ['Orden cronológico', 'Caracterización de personajes (física, pensamiento, comportamiento)'],
        textos_literarios: ['Pequeño verde — Paulina Jara Straussmann', 'La fuente mágica — Cuento tradicional'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 9, nombre: '¡A pasarlo bien!', tomo: 1,
        paginas: { inicio: 104, fin: 116 },
        oas_mencionados: ['RRA 9.1', 'RRA 9.4', 'RRA 9.5'],
        generos: ['Reseña', 'Comentario de lectura', 'Poema'],
        topicos_linguisticos: ['El comentario de lectura (opinión fundamentada con argumentos)', 'Rima (sonidos iguales al final de los versos)'],
        textos_literarios: ['Tugar, tugar, salir a buscar — Tradición oral', '¿Qué quieres, lobito?', 'Don Libro está helado — Gloria Fuertes'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 10, nombre: 'Objetos increíbles', tomo: 1,
        paginas: { inicio: 117, fin: 128 },
        oas_mencionados: ['RRA 10.1', 'RRA 10.2', 'RRA 10.4'],
        generos: ['Artículo informativo'],
        topicos_linguisticos: ['Vocabulario variado y uso de sinónimos', 'Partes de un artículo informativo (título, introducción, desarrollo, cierre/conclusión)'],
        textos_literarios: ['Lentes ópticos — Bárbara Ossa & Margarita Valdés'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 11, nombre: 'Animales legendarios', tomo: 1,
        paginas: { inicio: 129, fin: 141 },
        oas_mencionados: ['RRA 11.1', 'RRA 11.3'],
        generos: ['Artículo informativo', 'Cuento', 'Leyenda', 'Diario de vida'],
        topicos_linguisticos: ['Uso de pronombres personales', 'El diario de vida (saludo, cuerpo de sentimientos, fecha)'],
        textos_literarios: ['Perezoso, Caballito de mar, Jirafa, Armadillo — Jesse Goossens', '¿Por qué el mar es salado? — Cuento tradicional', 'La leyenda del murciélago'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 12, nombre: 'Huella ecológica', tomo: 1,
        paginas: { inicio: 142, fin: 154 },
        oas_mencionados: ['RRA 12.1', 'RRA 12.2', 'RRA 12.3', 'RRA 12.4'],
        generos: ['Leyenda', 'Texto instructivo', 'Poema'],
        topicos_linguisticos: ['Figuras literarias (personificación, comparación, metáfora)', 'Estructura del poema (versos y estrofas)', 'Recitar un poema (entonación y expresión corporal)'],
        textos_literarios: ['Huella ecológica — Mónica Martin & María de los Ángeles Pavez', 'Para encontrar al alicanto — Sonia Montecino & Catalina Infante', 'Doña Lenga Palo Fino'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 13, nombre: 'Protegemos el planeta', tomo: 2,
        paginas: { inicio: 155, fin: 166 },
        oas_mencionados: ['RRA 13.1', 'RRA 13.3', 'RRA 13.5'],
        generos: ['Artículo informativo', 'Afiche'],
        topicos_linguisticos: ['Resumir ideas principales', 'Estructura del afiche (título, mensaje breve, imagen)'],
        textos_literarios: ['Las 3 Rs'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 14, nombre: 'Tesoros de la tradición oral', tomo: 2,
        paginas: { inicio: 167, fin: 178 },
        oas_mencionados: ['RRA 14.2'],
        generos: ['Artículo informativo', 'Cuento tradicional', 'Leyenda'],
        topicos_linguisticos: ['Conectores de orden temporal', 'Discusión grupal', 'Elementos reales y fantásticos en la leyenda'],
        textos_literarios: ['Seres fantásticos', 'El Sol, la Luna y el Agua — Laura Herrera', 'La Piedra del Puma del cerro Yevide'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 15, nombre: 'Cuidemos el agua', tomo: 2,
        paginas: { inicio: 179, fin: 191 },
        oas_mencionados: ['RRA 15.1', 'RRA 15.2', 'RRA 15.3', 'RRA 15.4'],
        generos: ['Leyenda', 'Artículo informativo', 'Texto instructivo', 'Receta'],
        topicos_linguisticos: ['La coma en enumeración', 'Estructura del texto instructivo (introducción, materiales, elaboración)', 'Círculo de conversación'],
        textos_literarios: ['Ngenko, el dueño del agua — Leyenda mapuche'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 16, nombre: '¡Vamos a celebrar!', tomo: 2,
        paginas: { inicio: 192, fin: 203 },
        oas_mencionados: ['RRA 16.1', 'RRA 16.2', 'RRA 16.5'],
        generos: ['Cuento', 'Artículo informativo', 'Anécdota'],
        topicos_linguisticos: ['Artículos definidos e indefinidos (concordancia de género y número)', 'Normas de cortesía en dramatización'],
        textos_literarios: ['Rojo corazón — Saúl Schkolnik'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 17, nombre: 'Nos movemos con el viento', tomo: 2,
        paginas: { inicio: 204, fin: 216 },
        oas_mencionados: ['RRA 17.1', 'RRA 17.4'],
        generos: ['Artículo informativo', 'Poema', 'Caligrama'],
        topicos_linguisticos: ['El caligrama (poema con silueta de figura)', 'Diminutivos y aumentativos'],
        textos_literarios: ['Pueblo Chango: cazadores del océano', 'Tres historietas del viento — Federico García Lorca', 'La leyenda del viento'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 18, nombre: 'Disfrutamos la fiesta', tomo: 2,
        paginas: { inicio: 217, fin: 228 },
        oas_mencionados: ['RRA 18.1', 'RRA 18.5'],
        generos: ['Cuento tradicional', 'Receta', 'Artículo informativo', 'Adivinanza'],
        topicos_linguisticos: ['Uso de combinaciones ge-gi y je-ji', 'Estructura de la adivinanza (presentación en verso, descripción de características)'],
        textos_literarios: ['Sopa de hacha'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 19, nombre: 'Vamos de viaje', tomo: 2,
        paginas: { inicio: 229, fin: 240 },
        oas_mencionados: ['RRA 19.2', 'RRA 19.3', 'RRA 19.4'],
        generos: ['Cuento', 'Artículo informativo', 'Noticia', 'Bitácora de viaje'],
        topicos_linguisticos: ['Conectores causales (porque, por eso, por lo que)', 'La bitácora de viaje (organización por días, primera persona)'],
        textos_literarios: ['Sofía viaja a la Antártida — Alison Lester'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 20, nombre: 'Historias de amor', tomo: 2,
        paginas: { inicio: 241, fin: 253 },
        oas_mencionados: ['RRA 20.1', 'RRA 20.4', 'RRA 20.5'],
        generos: ['Cuento', 'Artículo informativo', 'Comentario de lectura'],
        topicos_linguisticos: ['Comentario de lectura (primer párrafo con datos, segundo con resumen objetivo, tercero con opinión fundamentada)'],
        textos_literarios: ['Filemón y Baucis — Lemniscates', 'El príncipe feliz — Oscar Wilde'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 21, nombre: 'Un invierno especial', tomo: 2,
        paginas: { inicio: 254, fin: 266 },
        oas_mencionados: ['RRA 21.1', 'RRA 21.2', 'RRA 21.3', 'RRA 21.4', 'RRA 21.5'],
        generos: ['Fábula', 'Artículo informativo'],
        topicos_linguisticos: ['Plurales de palabras terminadas en z (cambio a c)', 'La moraleja en la fábula', 'Actuación (imitación de voz y gestualidad del personaje)'],
        textos_literarios: ['La higuera y el espino', 'La liebre y la tortuga — Esopo', 'El lirón tacaño'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 22, nombre: 'Animales geniales', tomo: 2,
        paginas: { inicio: 267, fin: 278 },
        oas_mencionados: ['RRA 22.4', 'RRA 22.5'],
        generos: ['Artículo informativo', 'Noticia'],
        topicos_linguisticos: ['Palabras homófonas (botar/votar, tuvo/tubo, hola/ola)', 'Estructura de la noticia (titular, bajada, cuerpo)'],
        textos_literarios: ['El delfín chileno — Bernardita García J. & María José Pérez A.'],
        tipo_evaluacion: 'Desafío (conversación grupal de reflexión)'
      },
      {
        numero: 23, nombre: 'Las cuatro estaciones', tomo: 2,
        paginas: { inicio: 279, fin: 291 },
        oas_mencionados: ['RRA 23.3', 'RRA 23.4'],
        generos: ['Leyenda', 'Infografía', 'Cuento', 'Poema', 'Obra dramática'],
        topicos_linguisticos: ['Diálogo dramático y acotaciones (instrucciones que no se dicen en voz alta)'],
        textos_literarios: ['La duración del invierno', 'El pájaro chogüi', 'Doña Primavera — Gabriela Mistral', 'Los tres cerditos — Versión dramatizada'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 24, nombre: 'Inventos y más inventos', tomo: 2,
        paginas: { inicio: 292, fin: 302 },
        oas_mencionados: ['RRA 24.2', 'RRA 24.4', 'RRA 24.5'],
        generos: ['Artículo informativo', 'Cómic / Historieta'],
        topicos_linguisticos: ['Conectores de oposición (pero, en cambio, no obstante, sin embargo)', 'Estructura del cómic (viñetas, globos de diálogo y pensamiento)'],
        textos_literarios: ['El bolígrafo — Bárbara Ossa & Margarita Valdés'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
    ]
  },

  // ─── 4° Básico ────────────────────────────────────────────────────────────
  '4° Básico': {
    curso: '4° Básico',
    nombre_texto: 'Leo Primero 4°',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: 'Un viaje sorpresivo', tomo: 1,
        paginas: { inicio: 4, fin: 16 },
        oas_mencionados: ['OA 4', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Fábula', 'Cuento', 'Fragmento de novela', 'Leyenda'],
        topicos_linguisticos: ['Uso de adjetivos calificativos'],
        textos_literarios: ['El banquete en el cielo — Leyenda', 'El elefantito curioso — Rudyard Kipling', 'Alicia cayendo por la madriguera — Lewis Carroll'],
        tipo_evaluacion: '"¿Qué aprendí?" (metacognición y contenidos)'
      },
      {
        numero: 2, nombre: '¡Qué animales más curiosos!', tomo: 1,
        paginas: { inicio: 17, fin: 28 },
        oas_mencionados: ['OA 6', 'OA 17', 'OA 18', 'OA 26'],
        generos: ['Artículo informativo', 'Noticia'],
        topicos_linguisticos: ['Clasificación de palabras según su sílaba tónica (agudas, graves y esdrújulas)'],
        textos_literarios: ['¿Por qué los leones machos tienen melena? — Luz Valeria Oppliger & Francisco Bozinovic', 'Expo Hormigas: Comunicación y sociedad — Noticia'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 3, nombre: 'Aventuras salvajes', tomo: 1,
        paginas: { inicio: 29, fin: 41 },
        oas_mencionados: ['OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 25'],
        generos: ['Leyenda', 'Artículo informativo', 'Noticia'],
        topicos_linguisticos: ['Uso de verbos', 'Tildación de palabras agudas, graves y esdrújulas'],
        textos_literarios: ['La misión del colibrí — Leyenda quechua', 'El zoológico en el mundo — Artículo informativo', 'El safari se traslada a Chile — Noticia'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 4, nombre: 'El universo canta', tomo: 1,
        paginas: { inicio: 42, fin: 53 },
        oas_mencionados: ['OA 1', 'OA 5', 'OA 7', 'OA 11', 'OA 16', 'OA 17', 'OA 23'],
        generos: ['Cuento', 'Poema'],
        topicos_linguisticos: ['Uso de lenguaje figurado o poético'],
        textos_literarios: ['La Caimana — María Eugenia Manrique & Ramón París', 'El universo canta — Catherine Villaseñor Araya', 'Himno a los pájaros — Gabriela Mistral', 'Todo es ronda — Gabriela Mistral'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 5, nombre: 'Sueños en el aire', tomo: 1,
        paginas: { inicio: 54, fin: 66 },
        oas_mencionados: ['OA 4', 'OA 11', 'OA 15', 'OA 16', 'OA 23', 'OA 29'],
        generos: ['Texto informativo', 'Cuento'],
        topicos_linguisticos: ['Uso de vocabulario variado (sinónimos)'],
        textos_literarios: ['Pájaros por todas partes — Juan José Donoso', 'El castillo aéreo del brujo — Anónimo', 'Historia de los que soñaron — Cuento tradicional'],
        tipo_evaluacion: '"¿Qué aprendí?" y autoevaluación de representación'
      },
      {
        numero: 6, nombre: 'Historias de lugares lejanos', tomo: 1,
        paginas: { inicio: 67, fin: 78 },
        oas_mencionados: ['OA 1', 'OA 4', 'OA 9', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Cuento', 'Cuento tradicional', 'Carta'],
        topicos_linguisticos: ['Estructura de la carta'],
        textos_literarios: ['Gulliver en Liliput — Jonathan Swift', 'La flor de lililá — Cuento tradicional', 'El ruiseñor del emperador — Hans Christian Andersen'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 7, nombre: 'Sueños cumplidos', tomo: 1,
        paginas: { inicio: 79, fin: 91 },
        oas_mencionados: ['OA 4', 'OA 5', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 29'],
        generos: ['Fábula', 'Cuento', 'Noticia'],
        topicos_linguisticos: ['Reconocimiento del sujeto y el predicado en la oración'],
        textos_literarios: ['La lechera — Fábula', 'El rey y el picapedrero — Anónimo', 'Los dos amigos y el oso — Fábula'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 8, nombre: 'Animales fabulosos', tomo: 1,
        paginas: { inicio: 92, fin: 103 },
        oas_mencionados: ['OA 4', 'OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23'],
        generos: ['Fábula', 'Artículo informativo'],
        topicos_linguisticos: ['Uso de vocabulario variado para evitar repeticiones'],
        textos_literarios: ['La zorra y la cigüeña — Fábula', 'El hombre, su hijo y el burro — Esopo', 'El viento norte y el sol — Fábula', 'El triángulo de las Bermudas — Fundación Astoreca'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 9, nombre: 'Historias misteriosas', tomo: 1,
        paginas: { inicio: 104, fin: 116 },
        oas_mencionados: ['OA 4', 'OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Cuento', 'Artículo informativo', 'Mito'],
        topicos_linguisticos: ['Concordancia del sujeto con el verbo de la oración'],
        textos_literarios: ['El adivino — Afanasiev', 'El Yeti — Fundación Astoreca', 'El rapto de Perséfone — Robert Graves'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 10, nombre: 'Historias increíbles', tomo: 1,
        paginas: { inicio: 117, fin: 128 },
        oas_mencionados: ['OA 1', 'OA 4', 'OA 7', 'OA 11', 'OA 16', 'OA 17', 'OA 23'],
        generos: ['Fábula', 'Cuento'],
        topicos_linguisticos: ['Pronombres personales', 'Uso de hay, ¡ay! y ahí'],
        textos_literarios: ['La gallina de los huevos de oro — Fábula', 'El elefante y su sombra — Fábula', 'La vendedora de cerillas — Hans Christian Andersen'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 11, nombre: 'Animales extraordinarios', tomo: 1,
        paginas: { inicio: 129, fin: 141 },
        oas_mencionados: ['OA 1', 'OA 4', 'OA 6', 'OA 9', 'OA 11', 'OA 16', 'OA 17'],
        generos: ['Artículo informativo', 'Cuento'],
        topicos_linguisticos: ['Estructura del artículo informativo (título, introducción, subtemas con subtítulos y conclusión)'],
        textos_literarios: ['La llama del cielo — Artículo informativo', 'Los elefantes, animales extraordinarios — Artículo informativo', 'La liebre blanca — Leyenda japonesa'],
        tipo_evaluacion: '"¿Qué aprendí?" y pauta de representación'
      },
      {
        numero: 12, nombre: 'Buscando un hogar', tomo: 1,
        paginas: { inicio: 142, fin: 153 },
        oas_mencionados: ['OA 1', 'OA 4', 'OA 6', 'OA 7', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Artículo informativo', 'Leyenda'],
        topicos_linguisticos: ['Escritura de palabras con hue, hui y hie'],
        textos_literarios: ['El pájaro que no hace nido — Juan José Donoso', 'El búho — Fundación Astoreca', 'Los siete exploradores — Leyenda Rapa Nui', 'El origen del calafate — Leyenda'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 13, nombre: 'Leyendas de aquí y de allá', tomo: 2,
        paginas: { inicio: 154, fin: 166 },
        oas_mencionados: ['OA 4', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 25'],
        generos: ['Cuento', 'Leyenda', 'Comentario de lectura'],
        topicos_linguisticos: ['Elementos referenciales en el texto (cohesión)'],
        textos_literarios: ['Artemio y el Caleuche — María de los Ángeles Pavez', 'El balseo de las almas — Leyenda chilota', 'Kamshout y el otoño — Leyenda selk\'nam'],
        tipo_evaluacion: '"¿Qué aprendí?" y autoevaluación'
      },
      {
        numero: 14, nombre: 'Historias para soñar', tomo: 2,
        paginas: { inicio: 167, fin: 178 },
        oas_mencionados: ['OA 1', 'OA 4', 'OA 5', 'OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 29'],
        generos: ['Artículo informativo', 'Cuento tradicional', 'Poema', 'Dramatización'],
        topicos_linguisticos: ['Uso de vocabulario variado para evitar repeticiones'],
        textos_literarios: ['Vida y obra de los hermanos Grimm — Artículo informativo', 'Los músicos de Bremen — Hermanos Grimm', 'La noche — Gabriela Mistral', 'El gato con botas — Hermanos Grimm'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 15, nombre: 'Animales especiales', tomo: 2,
        paginas: { inicio: 179, fin: 191 },
        oas_mencionados: ['OA 1', 'OA 4', 'OA 5', 'OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Artículo informativo', 'Poema', 'Fábula', 'Retahíla'],
        topicos_linguisticos: ['Adverbios de modo, tiempo y lugar'],
        textos_literarios: ['Los pájaros guardianes — Artículo informativo', 'Una rana muy especial — Artículo informativo', 'Palabras, palabras y más palabras — Cecilia Beuchat', 'El dromedario y el camello — José Rosas'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 16, nombre: 'La ciudad y sus rincones', tomo: 2,
        paginas: { inicio: 192, fin: 203 },
        oas_mencionados: ['OA 1', 'OA 5', 'OA 6', 'OA 7', 'OA 9', 'OA 11', 'OA 16', 'OA 23', 'OA 27'],
        generos: ['Texto informativo', 'Poema', 'Biografía'],
        topicos_linguisticos: ['Conectores temporales'],
        textos_literarios: ['¿Por qué el centro se llama centro? — Soledad Ugarte', 'La plaza tiene una torre — Antonio Machado', 'Biografía de Luis Braille — Adaptación'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 17, nombre: 'Historias de la tierra', tomo: 2,
        paginas: { inicio: 204, fin: 216 },
        oas_mencionados: ['OA 1', 'OA 4', 'OA 7', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Leyenda', 'Invitación'],
        topicos_linguisticos: ['Adverbios de tiempo y lugar'],
        textos_literarios: ['La leyenda del pehuén', 'Lágrimas de amor: la piedra cruz', 'Lican Ray — Leyendas'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 18, nombre: 'Personajes increíbles', tomo: 2,
        paginas: { inicio: 217, fin: 228 },
        oas_mencionados: ['OA 4', 'OA 5', 'OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 29'],
        generos: ['Poema', 'Fábula', 'Leyenda', 'Receta', 'Diálogo dramático'],
        topicos_linguisticos: ['Concordancia en tiempos verbales en instructivos'],
        textos_literarios: ['Doña Piñones — María de la Luz Uribe', 'El avaro y el oro — Esopo', 'El origen del calafate — Leyenda', 'El tigre y el zorro — Fábula'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 19, nombre: '¡Salvemos a las abejas!', tomo: 2,
        paginas: { inicio: 229, fin: 241 },
        oas_mencionados: ['OA 5', 'OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23'],
        generos: ['Texto informativo', 'Infografía', 'Poema', 'Caligrama'],
        topicos_linguisticos: ['Figuras literarias (personificación, comparación y metáfora)'],
        textos_literarios: ['¿Por qué son importantes las abejas? — Luz Valeria Oppliger & Francisco Bozinovic', '¿Qué pasaría en un mundo sin abejas? — Infografía', 'Cultivo una rosa blanca — José Martí'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 20, nombre: 'Historias de amor y amistad', tomo: 2,
        paginas: { inicio: 242, fin: 253 },
        oas_mencionados: ['OA 4', 'OA 5', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27', 'OA 29'],
        generos: ['Cuento', 'Poema', 'Leyenda', 'Carta', 'Diálogo'],
        topicos_linguisticos: ['Ortografía de las combinaciones -mb- y -nv-'],
        textos_literarios: ['Las tres preguntas — Basado en León Tolstói', 'Es verdad — Federico García Lorca', 'La añañuca — Sonia Montecino', 'Las cataratas del Iguazú — Carlos Clavero'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 21, nombre: 'Cuidemos el planeta', tomo: 2,
        paginas: { inicio: 254, fin: 266 },
        oas_mencionados: ['OA 6', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Artículo informativo', 'Diario de vida'],
        topicos_linguisticos: ['Usos de la letra h'],
        textos_literarios: ['¿Está cambiando el clima del planeta? — L. Oppliger & F. Bozinovic', 'Pueblo Atacameño — Artículo informativo', 'El okapi — Artículo informativo', 'El aye-aye — Artículo informativo'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 22, nombre: '¡Grandes personas!', tomo: 2,
        paginas: { inicio: 267, fin: 278 },
        oas_mencionados: ['OA 4', 'OA 6', 'OA 9', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 25'],
        generos: ['Cuento', 'Artículo informativo', 'Infografía'],
        topicos_linguisticos: ['Análisis de símbolos e imágenes en textos multimodales'],
        textos_literarios: ['Cartas en el bosque — Susanna Isern & Daniel Montero Galán', 'Malala Yousafzai y el derecho a la educación — Juan Ignacio Cortés', '¿Quién es Greta Thunberg? — Infografía'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 23, nombre: 'Un mundo mejor', tomo: 2,
        paginas: { inicio: 279, fin: 291 },
        oas_mencionados: ['OA 6', 'OA 16', 'OA 17', 'OA 23', 'OA 25', 'OA 27'],
        generos: ['Artículo informativo', 'Texto informativo', 'Autobiografía'],
        topicos_linguisticos: ['Palabras homófonas (botar y votar)'],
        textos_literarios: ['¿Cómo transformarse en un observador de pájaros? — Juan José Donoso', 'Jane Goodall — Artículo informativo'],
        tipo_evaluacion: '"¿Qué aprendí?"'
      },
      {
        numero: 24, nombre: 'Paisajes extraordinarios', tomo: 2,
        paginas: { inicio: 292, fin: 303 },
        oas_mencionados: ['OA 4', 'OA 6', 'OA 11', 'OA 16', 'OA 17', 'OA 23', 'OA 27'],
        generos: ['Artículo informativo', 'Infografía', 'Fábula', 'Afiche'],
        topicos_linguisticos: ['Palabras de uso frecuente con V'],
        textos_literarios: ['A comer y descansar: Los humedales — Juan José Donoso', 'El desierto más árido del planeta: Atacama — Infografía', 'El cuervo y la jarra — Fábula'],
        tipo_evaluacion: '"¿Qué aprendí?" y evaluación sumativa final del tomo'
      },
    ]
  },

  // ─── 5° Básico ────────────────────────────────────────────────────────────
  '5° Básico': {
    curso: '5° Básico',
    nombre_texto: 'Texto escolar MINEDUC Lenguaje y Comunicación 5°',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: 'La unión hace la fuerza', tomo: 1,
        paginas: { inicio: 8, fin: 58 },
        oas_mencionados: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9', 'OA 11', 'OA 15', 'OA 17', 'OA 18', 'OA 24', 'OA 26', 'OA 2 (comp)', 'OA 12 (comp)'],
        generos: ['Novela', 'Cómic', 'Cuento', 'Texto discontinuo', 'Artículo informativo', 'Reportaje', 'Discurso'],
        topicos_linguisticos: ['Descripción de personajes', 'Relación de recursos gráficos con el texto', 'Determinación de consecuencias de las acciones', 'Planificación, escritura, revisión y edición de artículos informativos', 'Uso de frases explicativas', 'Lenguaje claro y preciso'],
        textos_literarios: ['Los Futbolísimos — Roberto Santiago', 'Un gol al cielo — Laura Junowicz', 'Canto al deporte — Ricardo Ahumada', 'El salto — Marina Arrate', 'La chueca / Palin — Eulogio Suárez', 'Hombre al agua (Cuento)', 'La clase de surf (Cuento)'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad (comprensión y producción escrita) + reseñas y antología'
      },
      {
        numero: 2, nombre: 'Emociones que sanan', tomo: 1,
        paginas: { inicio: 70, fin: 117 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 5', 'OA 6', 'OA 7', 'OA 9', 'OA 14', 'OA 17', 'OA 18', 'OA 24', 'OA 26', 'OA 8 (comp)', 'OA 12 (comp)', 'OA 13 (comp)', 'OA 16 (comp)', 'OA 27 (comp)'],
        generos: ['Poema (oda, décima)', 'Cuento', 'Memorias / relato autobiográfico', 'Leyenda', 'Noticia', 'Canción'],
        topicos_linguisticos: ['Recursos sonoros (rima asonante y consonante)', 'Lenguaje figurado (personificación, comparación, metáfora)', 'Narración en primera persona', 'Marcas textuales de subjetividad', 'Recopilación de relatos de memoria', 'Expresiones de la oralidad', 'Concordancia verbal'],
        textos_literarios: ['Amigos por el viento — Liliana Bodoc', 'Los amigos — Delia Arjona', 'Sintigo — Liset Lantigua', 'Los aburridos — María Hortensia Lacau', 'Oda a mis amigos — Yolanda Reyes', 'Tu alegría — Carmen Gil', 'Mis abuelos me contaron: Memorias del pueblo yagán — Vargas Filgueira et al.', 'La nueva y yo — Mario Méndez', 'El Principito — Antoine de Saint-Exupéry'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad (análisis de poemas y creación de leyenda) + reseñas y antología'
      },
      {
        numero: 3, nombre: 'Coexistir en armonía', tomo: 2,
        paginas: { inicio: 132, fin: 183 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 5', 'OA 6', 'OA 7', 'OA 9', 'OA 14', 'OA 17', 'OA 18', 'OA 24', 'OA 26', 'OA 8 (comp)', 'OA 12 (comp)', 'OA 25 (comp)', 'OA 27 (comp)', 'OA 28 (comp)'],
        generos: ['Poema', 'Cómic / Historieta', 'Artículo informativo', 'Infografía', 'Noticia', 'Caligrama', 'Texto instructivo'],
        topicos_linguisticos: ['Análisis de lenguaje poético (símbolos e imágenes)', 'Estructura del cómic (viñetas, globos, narrador, recursos gráficos y color)', 'Extracción de información explícita e implícita en textos no literarios', 'Estrategias de lectura activa (subrayado de ideas clave)', 'Producción narrativa visual'],
        textos_literarios: ['Transformación (Poema)', 'Madre Tierra (Poema)', 'Canto a la ceiba — Gioconda Belli', 'Gaturro — Nik', 'Wangari Maathai y el movimiento del cinturón verde — Cómic (Ofoego & Muthoga)', 'Han descuajado un árbol — Rafael Alberti', 'Oda a los calcetines — Pablo Neruda'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad (análisis de poema y creación de cómic) + reseñas y antología'
      },
      {
        numero: 4, nombre: 'Un mundo en movimiento', tomo: 2,
        paginas: { inicio: 192, fin: 229 },
        oas_mencionados: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9', 'OA 11', 'OA 15', 'OA 17', 'OA 18', 'OA 28', 'OA 2 (comp)', 'OA 8 (comp)', 'OA 12 (comp)', 'OA 13 (comp)', 'OA 16 (comp)', 'OA 22 (comp)'],
        generos: ['Fragmento de novela', 'Testimonio', 'Comentario literario / Reseña crítica', 'Artículo informativo', 'Documental', 'Reportaje'],
        topicos_linguisticos: ['Descripción de ambientes y costumbres', 'Inferencia de rasgos psicológicos', 'Marcas de subjetividad en la opinión (adjetivos/adverbios)', 'Cohesión y coherencia (conectores lógicos)', 'Pasos para escribir un comentario (argumento, forma y valoración)', 'Estrategias de investigación'],
        textos_literarios: ['Ana de las Tejas Verdes — Lucy Maud Montgomery', 'María la Monarca (Novela ecológica)', 'Simbad el Marino — Cuento tradicional', 'La puerta roja — José Antonio Giordano Lorca', 'La compuerta 12 — Baldomero Lillo', 'El hombre que fabricó un río — Andrés Gallardo'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad (comentario literario y descripción de ambiente) + reseñas y antología'
      },
    ]
  },

  // ─── 6° Básico ────────────────────────────────────────────────────────────
  '6° Básico': {
    curso: '6° Básico',
    nombre_texto: 'Texto escolar MINEDUC Lenguaje y Comunicación 6°',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: 'El poder de la aventura, la imaginación y la creatividad', tomo: 1,
        paginas: { inicio: 8, fin: 55 },
        oas_mencionados: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 14', 'OA 24', 'OA 27'],
        generos: ['Cuento', 'Novela', 'Reportaje', 'Blog', 'Adivinanza'],
        topicos_linguisticos: ['Acciones principales y secundarias', 'Secuencia narrativa (causa-efecto)', 'Ambiente y costumbres del relato', 'Información explícita e implícita', 'Coherencia y cohesión', 'Ortografía acentual, literal y puntual'],
        textos_literarios: ['El cuarto de guardar — Saki', 'Historia de un amuleto — Edith Nesbit', 'Las aventuras de Tom Sawyer — Mark Twain', 'Peter Pan y Wendy — James Barrie', 'La historia interminable — Michael Ende'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad (comprensión y producción escrita) + reseñas y antología'
      },
      {
        numero: 2, nombre: 'El medioambiente y su protección', tomo: 1,
        paginas: { inicio: 70, fin: 115 },
        oas_mencionados: ['OA 1', 'OA 3', 'OA 4', 'OA 5', 'OA 6', 'OA 7', 'OA 11', 'OA 15', 'OA 18', 'OA 24', 'OA 27', 'OA 29'],
        generos: ['Cuento', 'Poema (himno, canción)', 'Texto informativo', 'Artículo informativo', 'Material audiovisual', 'Exposición oral'],
        topicos_linguisticos: ['Actitudes y reacciones de personajes', 'Lenguaje figurado', 'Inferencias', 'Figuras literarias de sonido (aliteración, onomatopeya)', 'Figuras de pensamiento (personificación, comparación, hipérbole)', 'Prefijos', 'Recursos visuales', 'Estructura del artículo informativo'],
        textos_literarios: ['La tortuga gigante — Horacio Quiroga', 'El aire — Gabriela Mistral', 'Canción primaveral — Federico García Lorca', 'La tempestad — José Zorrilla', 'Zum Zum — Silvia Castro', 'Biobío, Sueño azul — Elicura Chihuailaf', 'Himno al árbol — Gabriela Mistral', 'Una cajita de fósforos — María Elena Walsh', 'La higuera — Juana de Ibarbourou', 'Añañuca y Copihue — Versión de Oreste Plath'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad + reseñas y antología'
      },
      {
        numero: 3, nombre: 'El ser humano y su vínculo con el cosmos', tomo: 2,
        paginas: { inicio: 130, fin: 177 },
        oas_mencionados: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 11', 'OA 14', 'OA 24', 'OA 27'],
        generos: ['Novela', 'Texto de divulgación científica', 'Infografía', 'Entrevista', 'Relato ancestral / cosmovisión', 'Autobiografía', 'Cuento'],
        topicos_linguisticos: ['Caracterización de personajes (física y psicológica)', 'Actitudes y motivaciones', 'Organización de información (esquemas y mapas conceptuales)', 'Relación de recursos gráficos con texto', 'Comparación y contraste', 'Rasgos de la autobiografía (primera persona, secuencia temporal)', 'Estilo directo (uso de raya)', 'Estructura narrativa completa'],
        textos_literarios: ['El universo según Carlota — Teresa Paneque', 'Rinká Wil-llay y la Luna — María Ester Campillay', 'Relato de mi sueño azul — Elicura Chihuailaf', 'La noche — Nicomedes Santa Cruz', 'Ami, el niño de las estrellas — Enrique Barrios'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad + reseñas y antología'
      },
      {
        numero: 4, nombre: 'Respetar las diferencias y la igualdad de derechos', tomo: 2,
        paginas: { inicio: 192, fin: 225 },
        oas_mencionados: ['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 11', 'OA 18', 'OA 24', 'OA 27'],
        generos: ['Cuento', 'Novela', 'Reportaje', 'Infografía', 'Texto argumentativo', 'Debate', 'Columna de opinión', 'Biografía'],
        topicos_linguisticos: ['Relación del relato con su época y lugar (contexto)', 'Conclusiones basadas en evidencia textual', 'Resumir (ideas principales)', 'Criterios de comparación de textos informativos (emisor, receptor, propósito)', 'Estructura del texto argumentativo (postura/tesis, argumentos, datos objetivos, conclusión)', 'Marcadores discursivos', 'Palabras homógrafas'],
        textos_literarios: ['Alí Babá y los cuarenta ladrones — Anónimo', 'Mujercitas — Louisa May Alcott', 'El jardín secreto — Frances Hodgson Burnett'],
        tipo_evaluacion: 'Síntesis + Evaluación de unidad + reseñas y antología'
      },
    ]
  },

  // ─── 7° Básico ────────────────────────────────────────────────────────────
  '7° Básico': {
    curso: '7° Básico',
    nombre_texto: 'Texto escolar MINEDUC Lenguaje y Comunicación 7°',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: '¿Qué me hace sentir bien?', tomo: 1,
        paginas: { inicio: 6, fin: 43 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 7', 'OA 9', 'OA 10', 'OA 11', 'OA 13', 'OA 15', 'OA 16', 'OA 20', 'OA 21', 'OA 24', 'OA 25'],
        generos: ['Cuento', 'Novela', 'Reportaje', 'Artículo informativo', 'Poema', 'Diario personal', 'Meme', 'Texto de redes sociales'],
        topicos_linguisticos: ['Conflicto y secuencia narrativa', 'Personajes principales y secundarios', 'Tema', 'Propósitos explícitos e implícitos', 'Coherencia temática', 'Concordancia sujeto-verbo', 'Recursos de correferencia'],
        textos_literarios: ['El cuento del monje y el general — Jorge Bucay', 'El mejor amigo de un muchacho — Isaac Asimov', 'Amigos por el viento — Liliana Bodoc', 'Valle de Elqui — Gabriela Mistral', 'La mejor luna — Liliana Bodoc', 'Cuatro bicicletas — Federico Ivanier', 'Fortuna — Ida Vitale', 'Viajando conmigo — Óscar Hahn'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis "Sistematizo lo aprendido" + evaluación formativa y metacognitiva'
      },
      {
        numero: 2, nombre: '¿Cómo construimos comunidad?', tomo: 1,
        paginas: { inicio: 44, fin: 87 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 3', 'OA 7', 'OA 8', 'OA 9', 'OA 10', 'OA 11', 'OA 12', 'OA 14', 'OA 15', 'OA 21', 'OA 24', 'OA 25'],
        generos: ['Novela', 'Cuento', 'Poema', 'Canción', 'Columna de opinión', 'Discurso público', 'Relato ancestral'],
        topicos_linguisticos: ['Estrategia de resumen', 'Voz del narrador y personajes (estilo directo e indirecto)', 'Lenguaje poético (rima, ritmo, musicalidad)', 'Conectores de oposición y adición', 'Tema, opinión y argumentos'],
        textos_literarios: ['Sara y las goleadoras — Laura Gallego', 'Alturas de Macchu Picchu — Pablo Neruda', 'Parinacota — Pedro Humire', 'Vengo — Ana Tijoux', 'Tata Parinacota y Mama Sajama defienden su amor (Relato ancestral)', 'Del viento, el granizo y la helada (Relato ancestral)', 'El Mallku del pueblo (Relato ancestral)', 'La muralla — Nicolás Guillén', 'Hagamos un trato — Mario Benedetti', 'Gente pobre — León Tolstói', 'Tía José Rivadeneira — Ángeles Mastretta'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis + evaluación formativa y metacognitiva'
      },
      {
        numero: 3, nombre: 'Somos naturaleza', tomo: 2,
        paginas: { inicio: 88, fin: 133 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9', 'OA 10', 'OA 11', 'OA 14', 'OA 15', 'OA 17', 'OA 20', 'OA 21', 'OA 24', 'OA 25'],
        generos: ['Novela', 'Cuento de ciencia ficción', 'Poema', 'Reportaje', 'Noticia', 'Infografía', 'Carta al director', 'Artículo académico / expositivo', 'Mito'],
        topicos_linguisticos: ['Estrategia de recontar lo leído', 'Características y función de personajes', 'Visión de mundo y contexto histórico', 'Disposición temporal (orden cronológico y saltos temporales)', 'Evaluación de fuentes (confiabilidad y pertinencia)', 'Correferencia (sinónimos, hiperónimos, hipónimos, pronombres)'],
        textos_literarios: ['El mundo del fin del mundo — Luis Sepúlveda', 'La mañana verde — Ray Bradbury', 'Frente al mar — Alfonsina Storni', 'Para sanarte vine, me habló el Canelo — Elicura Chihuailaf', 'Golfo de Penas — Francisco Coloane', 'Quilacheo — Y. Kuramochi', 'Viracocha y el mito de los orígenes — Mito Inca'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis + evaluación formativa y metacognitiva'
      },
      {
        numero: 4, nombre: '¿Qué nos cuenta el mundo?', tomo: 2,
        paginas: { inicio: 134, fin: 173 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 4', 'OA 5', 'OA 7', 'OA 8', 'OA 9', 'OA 10', 'OA 11', 'OA 12', 'OA 14', 'OA 17', 'OA 19', 'OA 20', 'OA 21', 'OA 22', 'OA 24', 'OA 25'],
        generos: ['Poema (romance, décima)', 'Lira popular', 'Noticia', 'Artículo de opinión', 'Post de red social', 'Publicidad (afiche)', 'Debate', 'Biografía'],
        topicos_linguisticos: ['Planificación de la lectura', 'Ritmo y sonoridad en poesía', 'Fuentes primarias y secundarias', 'Registro de fuentes bibliográficas', 'Citas textuales', 'Inferencia de información', 'Confiabilidad en internet', 'Modalizadores discursivos (hechos y opiniones)', 'Estereotipos y prejuicios'],
        textos_literarios: ['Romance del juramento que tomó el Cid al rey don Alfonso — Anónimo', 'Epu — Pedro Alonzo Retamal', 'Puerto Montt está temblando — Violeta Parra', 'Dos plagas más: el volcán Calbuco y el cambio tan bajo — Rosa Araneda', 'Romance del prisionero — Anónimo', 'El cautivo de Til-Til — Patricio Manns', 'Héroes de la Antártida — Mecano'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis + evaluación formativa y metacognitiva'
      },
    ]
  },

  // ─── 8° Básico ────────────────────────────────────────────────────────────
  '8° Básico': {
    curso: '8° Básico',
    nombre_texto: 'Texto escolar MINEDUC Lenguaje y Comunicación 8°',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: '¿Dónde empieza el amor?', tomo: 1,
        paginas: { inicio: 6, fin: 45 },
        oas_mencionados: ['OA 2', 'OA 3', 'OA 4', 'OA 6', 'OA 8', 'OA 10', 'OA 11', 'OA 12', 'OA 13', 'OA 14', 'OA 16', 'OA 18', 'OA 21', 'OA 22', 'OA 25', 'OA 26'],
        generos: ['Leyenda', 'Cuento', 'Poema', 'Entrevista periodística', 'Canción', 'Reseña de libro', 'Meme'],
        topicos_linguisticos: ['Personajes tipo, prejuicios, estereotipos y creencias', 'Visión de mundo y contexto histórico', 'Acepciones de palabras según el contexto', 'Hechos y opiniones', 'Recursos de correferencia', 'Proceso de escritura (planificación, revisión y edición)'],
        textos_literarios: ['Yuriko — Yasunari Kawabata', 'Tristán e Isolda — Leyenda medieval', 'La última hoja — O. Henry', 'Amor 77 — Magda Portal', 'Qué he sacado con quererte — Violeta Parra', 'Date a volar — Alfonsina Storni', 'El recado — Elena Poniatowska', 'Mujercitas — Louisa May Alcott', 'Fangirl — Rainbow Rowell', 'Esto es amor. Poesía chilena del corazón — Mario Valdovinos'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis "Sistematizo lo aprendido" + evaluación metacognitiva'
      },
      {
        numero: 2, nombre: '¿Es todo como parece?', tomo: 1,
        paginas: { inicio: 46, fin: 87 },
        oas_mencionados: ['OA 2', 'OA 3', 'OA 5', 'OA 7', 'OA 8', 'OA 9', 'OA 11', 'OA 12', 'OA 13', 'OA 15', 'OA 16', 'OA 21', 'OA 22', 'OA 23', 'OA 25', 'OA 26'],
        generos: ['Comedia', 'Relato policial', 'Microcuento / Microrrelato', 'Ensayo', 'Noticia', 'Carta al director', 'Crítica literaria', 'Editorial', 'Encuesta'],
        topicos_linguisticos: ['Pensamiento analítico-deductivo (pistas e hipótesis)', 'Personaje tipo del detective', 'Recursos léxicos y gramaticales del mundo narrado', 'Léxico valorativo', 'Modos y tiempos verbales', 'Expresiones temporales', 'Conectores', 'Estructura del texto argumentativo', 'Acotaciones para el montaje teatral'],
        textos_literarios: ['Revelación — Rosario Castellanos', 'El equipaje — Pablo de Santis', 'El ahogado — Neil Simon', 'El crimen casi perfecto — Roberto Arlt', 'La cueva — Fernando Iwasaki', 'Cosecha — Aitziber Elejalde Sáenz', 'El muerto de la calle La Verdad — Javier Naveda', 'Alguien está mintiendo — Karen M. McManus', 'Las aventuras de Enola Holmes — Nancy Springer', 'Narraciones extraordinarias — Edgar Allan Poe'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis + elaboración de revista digital (evaluación integradora)'
      },
      {
        numero: 3, nombre: '¿Qué queda del pasado?', tomo: 2,
        paginas: { inicio: 88, fin: 131 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 6', 'OA 8', 'OA 10', 'OA 11', 'OA 12', 'OA 14', 'OA 16', 'OA 20', 'OA 21', 'OA 22', 'OA 23', 'OA 24', 'OA 25', 'OA 26'],
        generos: ['Epopeya / Relato épico', 'Fantasía épica', 'Poema', 'Reportaje', 'Reseña de película', 'Ensayo', 'Informe de investigación', 'Videoclip'],
        topicos_linguisticos: ['Motivaciones humanas y roles de género', 'Héroe como personaje tipo', 'Lenguaje figurado (connotación y denotación)', 'Objeto y hablante lírico', 'Progresión temática y orden de eventos', 'Estereotipos', 'Ortografía puntual (uso de la coma)'],
        textos_literarios: ['Levantar el papel donde escribimos... — Roberto Juarroz', 'El infinito en un junco — Irene Vallejo', 'La búsqueda del Santo Grial — Anónimo', 'El retorno del rey / El Señor de los Anillos — J. R. R. Tolkien', 'Los gansos dicen adiós — Graciela Huinao', 'Vengo — Myriam Díaz-Diocaretz', 'Código de aguas — Teresa Calderón', 'Hay un día feliz — Nicanor Parra', 'Quena — Pedro Humire', 'Ulises — Alfred Tennyson', 'La bicicleta — Miguel Arteche', 'La Araucana — Alonso de Ercilla', 'La canción de Aquiles — Madeline Miller'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis + informe de investigación'
      },
      {
        numero: 4, nombre: '¿Hacia dónde va el futuro?', tomo: 2,
        paginas: { inicio: 132, fin: 173 },
        oas_mencionados: ['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 8', 'OA 9', 'OA 10', 'OA 12', 'OA 13', 'OA 15', 'OA 16', 'OA 22', 'OA 25', 'OA 26'],
        generos: ['Novela de ciencia ficción', 'Poema', 'Discurso público', 'Post de redes sociales', 'Noticia', 'Canción', 'Videoclip'],
        topicos_linguisticos: ['Utopía y distopía', 'Dicotomía naturaleza/tecnología', 'Disposición temporal de los hechos', 'Registro de información bibliográfica (fichas de investigación)', 'Estado de ánimo y temple del hablante lírico', 'Elementos sonoros (ritmo, métrica y rima)', 'Concordancia verbal, de género y número'],
        textos_literarios: ['Marzo 2000: el contribuyente — Ray Bradbury', 'Las hijas de Tara — Laura Gallego', 'Fahrenheit 451 — Ray Bradbury', '1984 — George Orwell', 'Un mundo feliz — Aldous Huxley', 'La guerra de los mundos — H. G. Wells', 'Último brindis — Nicanor Parra', 'Lento pero viene — Mario Benedetti', 'Soñar, soñar siempre — Lucía Sánchez Saornil', 'Donde pongo la vida... — Ángel González', 'Explosión — Delmira Agustini', 'El aventurero — Rabindranath Tagore', 'Y aun así, me levanto — Maya Angelou', 'Palabras para Julia — José Agustín Goytisolo', 'Si — Rudyard Kipling', 'Correr o morir — James Dashner'],
        tipo_evaluacion: 'Evaluación sumativa (Formas A y B) + síntesis + producción de post argumentativo para redes sociales'
      },
    ]
  },

  // ─── 1° Medio ─────────────────────────────────────────────────────────────
  '1° Medio': {
    curso: '1° Medio',
    nombre_texto: 'Texto escolar MINEDUC Lenguaje y Comunicación 1° Medio',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: 'Caminos alternativos', tomo: 1,
        paginas: { inicio: 6, fin: 49 },
        oas_mencionados: ['OA 3', 'OA 8', 'OA 9', 'OA 10', 'OA 12', 'OA 15', 'OA 17', 'OA 19', 'OA 21', 'OA 24', 'OA 11 (comp)'],
        generos: ['Ensayo', 'Fragmento de novela', 'Reportaje', 'Informe de investigación', 'Poema'],
        topicos_linguisticos: ['Identificación de punto de vista y argumentos', 'Tipos de narradores y voces en el relato', 'Propósitos explícitos e implícitos en medios de comunicación', 'Correferencia léxica compleja'],
        textos_literarios: ['Recado confidencial a los chilenos — Elicura Chihuailaf', 'Chilean electric — Nona Fernández', 'La vida como un camino — Antonio Machado y Robert Frost', 'Bifurcaciones — Pablo de Santis'],
        tipo_evaluacion: 'Evaluación Sumativa 1 y 2 + "Sistematiza lo aprendido" (esquema de síntesis)'
      },
      {
        numero: 2, nombre: 'Un mundo en movimiento', tomo: 1,
        paginas: { inicio: 50, fin: 97 },
        oas_mencionados: ['OA 5', 'OA 8', 'OA 9', 'OA 10', 'OA 12', 'OA 14', 'OA 15', 'OA 19', 'OA 21', 'OA 24', 'OA 4 (comp)', 'OA 6 (comp)', 'OA 11 (comp)'],
        generos: ['Obra dramática', 'Texto informativo', 'Poema', 'Microensayo de anticipación', 'Novela gráfica'],
        topicos_linguisticos: ['Conflicto humano y acción dramática', 'Interpretación de lenguaje figurado / poético', 'Préstamos lingüísticos y evolución del idioma', 'Coherencia, cohesión y conectores (causales, consecutivos, continuativos)'],
        textos_literarios: ['Más allá del horizonte — Eugene O\'Neill', 'Decisión — Jaqueline Caniguan', 'Vamos en una balsa sobrepoblada — Daniela Catrileo', 'Canción del forastero — Anónimo', 'País de la ausencia — Gabriela Mistral', 'Dialéctica de los viajes — Cristina Peri Rossi', 'Ítaca — Constantino Cavafis', 'Emigrantes — Shaun Tan'],
        tipo_evaluacion: 'Evaluación Sumativa 1 y 2 + "Sistematiza lo aprendido"'
      },
      {
        numero: 3, nombre: 'El impulso de narrar', tomo: 2,
        paginas: { inicio: 98, fin: 133 },
        oas_mencionados: ['OA 3', 'OA 8', 'OA 9', 'OA 10', 'OA 12', 'OA 14', 'OA 15', 'OA 21', 'OA 24', 'OA 11 (comp)', 'OA 22 (comp)'],
        generos: ['Novela (fragmento)', 'Discurso', 'Storytelling', 'Reportaje', 'Columna de opinión'],
        topicos_linguisticos: ['Relaciones de causa y consecuencia en la narración', 'Intertextualidad', 'Estrategias discursivas (preguntas retóricas, oraciones desiderativas y dubitativas)', 'Jerarquización y organización de información', 'Progresión temática en la escritura'],
        textos_literarios: ['Tony Ninguno — Andrés Montero', 'Los viajes de Simbad el Marino / Alí Babá y los cuarenta ladrones / Aladino y la lámpara maravillosa — Anónimo/Tradición oral', 'La noche de la Usina — Eduardo Sacheri'],
        tipo_evaluacion: 'Evaluación Sumativa 1 y 2 + esquema de sistematización'
      },
      {
        numero: 4, nombre: 'Imaginar el futuro', tomo: 2,
        paginas: { inicio: 134, fin: 173 },
        oas_mencionados: ['OA 3', 'OA 8', 'OA 9', 'OA 10', 'OA 12', 'OA 14', 'OA 15', 'OA 19', 'OA 21', 'OA 24', 'OA 11 (comp)'],
        generos: ['Novela de ciencia ficción', 'Cómic', 'Reportaje', 'Ensayo'],
        topicos_linguisticos: ['Efecto de los saltos temporales en la narración', 'Integración de recursos lingüísticos y no lingüísticos en textos multimodales', 'Criterios para la comparación de fuentes (énfasis y perspectivas)', 'Uso de pronombres personales reflejos'],
        textos_literarios: ['La Tierra errante — Cixin Liu', 'Yo, robot — Isaac Asimov (versión cómic)', 'Homo deus. Breve historia del mañana — Yuval Noah Harari (fragmento)'],
        tipo_evaluacion: 'Evaluación Sumativa 1 y 2 + esquema de sistematización final'
      },
    ]
  },

  // ─── 2° Medio ─────────────────────────────────────────────────────────────
  '2° Medio': {
    curso: '2° Medio',
    nombre_texto: 'Texto escolar MINEDUC Lengua y Literatura 2° Medio',
    editorial: 'MINEDUC',
    unidades: [
      {
        numero: 1, nombre: 'La ruta que tú caminas', tomo: 1,
        paginas: { inicio: 6, fin: 47 },
        oas_mencionados: ['OA 3', 'OA 8', 'OA 9', 'OA 12', 'OA 15', 'OA 19', 'OA 21', 'OA 24', 'OA 1 (comp)', 'OA 2 (comp)', 'OA 4 (comp)', 'OA 20 (comp)', 'OA 22 (comp)'],
        generos: ['Poema', 'Cuento', 'Artículo académico / de investigación', 'Ensayo argumentativo', 'Texto autobiográfico', 'Videoclip', 'Ficha', 'Infografía'],
        topicos_linguisticos: ['Metáfora y lenguaje figurado', 'Flashback e historias paralelas', 'Indicios', 'Polisemia y sinónimos', 'Modalizadores', 'Mecanismos de correferencia'],
        textos_literarios: ['Canto del camino abierto — Walt Whitman', 'La rosa — Juan Eduardo Zúñiga', 'Poemas de Lore Vilca, Pedro Humire, Gabriela Mistral, Mata-Uiroa Manuel Atan, Carlos Trujillo y Gonzalo Rojas', 'Monte Patria amada — Pedro Humire', 'De su ventana a la mía — Carmen Martín Gaite', 'El padre — Olegario Lazo Baeza', 'Pedro Páramo — Juan Rulfo (fragmento)', 'Autobiografía de Nelson Mandela (fragmento)', 'Hacia rutas salvajes — Jon Krakauer'],
        tipo_evaluacion: 'Evaluaciones Sumativas 1 y 2 + síntesis "Sistematiza lo aprendido" + evaluación metacognitiva'
      },
      {
        numero: 2, nombre: 'Quién dijo que todo está perdido', tomo: 1,
        paginas: { inicio: 48, fin: 93 },
        oas_mencionados: ['OA 3', 'OA 5', 'OA 8', 'OA 10', 'OA 19', 'OA 21', 'OA 24', 'OA 1 (comp)', 'OA 2 (comp)', 'OA 12 (comp)', 'OA 15 (comp)', 'OA 17 (comp)'],
        generos: ['Obra dramática', 'Cuento contemporáneo', 'Obra clásica (investigación)', 'Reportaje escrito y audiovisual', 'Noticia', 'Crítica periodística'],
        topicos_linguisticos: ['Conflicto dramático y acotaciones', 'Estereotipos', 'Estructura dramática (acto, escena, cuadro)', 'Tipos de narrador', 'Campo semántico', 'Citas textuales y referencias bibliográficas', 'Frases nominales complejas'],
        textos_literarios: ['Yo vengo a ofrecer mi corazón — Fito Páez', '¿Cuánto vale el hierro? — Bertolt Brecht', 'Muertos sin sepultura — Jean Paul Sartre', 'El perro hortelano — Lope de Vega', 'La mía era una puerta fácil de abrir — Claudia Hernández', 'Chufa — Alejandra Costamagna', 'El ingenioso Hidalgo don Quijote de la Mancha — Miguel de Cervantes', 'Madrugada — Juan Gelman'],
        tipo_evaluacion: 'Evaluaciones Sumativas 1 y 2 + síntesis de la unidad'
      },
      {
        numero: 3, nombre: 'Construyendo vínculos', tomo: 2,
        paginas: { inicio: 94, fin: 133 },
        oas_mencionados: ['OA 3', 'OA 9', 'OA 10', 'OA 11', 'OA 14', 'OA 15', 'OA 19', 'OA 21', 'OA 24', 'OA 1 (comp)', 'OA 2 (comp)', 'OA 5 (comp)', 'OA 8 (comp)'],
        generos: ['Ensayo', 'Cuento contemporáneo', 'Reportaje', 'Informe de investigación', 'Canción', 'Poema'],
        topicos_linguisticos: ['Premisa, tesis, argumentos y contraargumentos', 'Recursos argumentativos (ironía, pregunta retórica)', 'Parodia', 'Narración enmarcada', 'Polifonía', 'Falacias', 'Signos de puntuación (comas) y conectores'],
        textos_literarios: ['Vivir juntos — Fernando Savater', 'Narración de un soñador de tesoros — Fanny Buitrago', 'Leyes que se nos escapan — Enrique Vila-Matas', 'El sur — Jorge Luis Borges', 'Continuidad de los parques — Julio Cortázar', 'Masa — César Vallejo', 'A cada hombre a cada mujer — Pedro Aznar', 'Quienes se marchan de Omelas — Ursula K. Le Guin'],
        tipo_evaluacion: 'Evaluaciones Sumativas 1 y 2 + feria de difusión literaria'
      },
      {
        numero: 4, nombre: 'Aquí estoy yo', tomo: 2,
        paginas: { inicio: 134, fin: 173 },
        oas_mencionados: ['OA 3', 'OA 8', 'OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 19', 'OA 24', 'OA 1 (comp)', 'OA 2 (comp)', 'OA 21 (comp)'],
        generos: ['Fragmento de novela', 'Biografía', 'Investigación sobre personaje', 'Cuento', 'Discurso público', 'Escrito autorreflexivo'],
        topicos_linguisticos: ['Personaje redondo/dinámico vs. estático/evolutivo', 'Novela de formación (Bildungsroman)', 'Prejuicios sociales', 'Recursos de persuasión', 'Marcadores discursivos', 'Progresión temática'],
        textos_literarios: ['La piel del cielo — Elena Poniatowska', 'Hermione Granger (Harry Potter) — J.K. Rowling (fragmento)', 'Los chicos — Ana María Matute', 'De qué hablo cuando hablo de correr — Haruki Murakami', 'Persépolis — Marjane Satrapi', 'Grandes esperanzas — Charles Dickens', 'Discurso inaugural de la biblioteca de Fuente Vaqueros — Federico García Lorca'],
        tipo_evaluacion: 'Evaluaciones Sumativas 1 y 2 + síntesis final de aprendizajes'
      },
    ]
  },
};

/**
 * Busca las unidades del texto escolar que corresponden a una unidad
 * curricular dada (por nombre aproximado o número de unidad).
 */
export function getTextbookUnitsForGrade(grade: string): TextbookUnit[] {
  return TEXTBOOK_STRUCTURE[grade]?.unidades ?? [];
}

/**
 * Busca unidades del texto escolar que coincidan con géneros o tópicos
 * relacionados al OA que se está planificando.
 */
export function findRelevantTextbookUnits(
  grade: string,
  keywords: string[]
): TextbookUnit[] {
  const units = getTextbookUnitsForGrade(grade);
  if (!units.length || !keywords.length) return [];
  const lower = keywords.map(k => k.toLowerCase());
  return units.filter(u => {
    const haystack = [
      u.nombre,
      ...u.generos,
      ...u.topicos_linguisticos,
      ...u.oas_mencionados
    ].join(' ').toLowerCase();
    return lower.some(k => haystack.includes(k));
  });
}
