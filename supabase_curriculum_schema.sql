-- ============================================================
-- DIDAKTA: ESQUEMA CURRICULAR + SEED DE DATOS
-- Lenguaje y Comunicación / Literatura — 5° a 8° Básico
-- Ministerio de Educación de Chile
--
-- INSTRUCCIONES:
--   1. Abre el Editor SQL de Supabase.
--   2. Pega y ejecuta este script completo de una sola vez.
--   3. Verifica que no haya errores antes de arrancar la app.
-- ============================================================


-- ============================================================
-- PARTE 1: CREACIÓN DE TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.asignaturas (
  id     SERIAL      PRIMARY KEY,
  nombre TEXT        NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.niveles (
  id            SERIAL  PRIMARY KEY,
  nombre        TEXT    NOT NULL,
  orden         INTEGER NOT NULL,
  asignatura_id INTEGER REFERENCES public.asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.ejes (
  id            SERIAL  PRIMARY KEY,
  nivel_id      INTEGER REFERENCES public.niveles(id) ON DELETE CASCADE,
  nombre        TEXT    NOT NULL,
  descripcion   TEXT,
  asignatura_id INTEGER REFERENCES public.asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.objetivos_aprendizaje (
  id            SERIAL  PRIMARY KEY,
  eje_id        INTEGER REFERENCES public.ejes(id) ON DELETE CASCADE,
  codigo        TEXT    NOT NULL,
  texto         TEXT    NOT NULL,
  tipo          TEXT    NOT NULL DEFAULT 'aprendizaje',
  asignatura_id INTEGER REFERENCES public.asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.indicadores_evaluacion (
  id            SERIAL  PRIMARY KEY,
  oa_id         INTEGER REFERENCES public.objetivos_aprendizaje(id) ON DELETE CASCADE,
  texto         TEXT    NOT NULL,
  asignatura_id INTEGER REFERENCES public.asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.oa_transversales (
  id            SERIAL  PRIMARY KEY,
  nivel_id      INTEGER REFERENCES public.niveles(id) ON DELETE CASCADE,
  texto         TEXT    NOT NULL,
  asignatura_id INTEGER REFERENCES public.asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.actitudes (
  id            SERIAL  PRIMARY KEY,
  nivel_id      INTEGER REFERENCES public.niveles(id) ON DELETE CASCADE,
  letra         TEXT    NOT NULL,
  texto         TEXT    NOT NULL,
  asignatura_id INTEGER REFERENCES public.asignaturas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.referencias_curriculares (
  id            SERIAL  PRIMARY KEY,
  nivel_id      INTEGER REFERENCES public.niveles(id) ON DELETE CASCADE,
  documento     TEXT    NOT NULL,
  decreto       TEXT    NOT NULL,
  paginas       TEXT    NOT NULL,
  asignatura_id INTEGER REFERENCES public.asignaturas(id) ON DELETE CASCADE
);


-- ============================================================
-- PARTE 2: ROW LEVEL SECURITY (lectura pública, sin escritura)
-- ============================================================

ALTER TABLE public.asignaturas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niveles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objetivos_aprendizaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicadores_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oa_transversales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actitudes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referencias_curriculares ENABLE ROW LEVEL SECURITY;

-- Lectura pública para todos los usuarios autenticados y anónimos
CREATE POLICY "Lectura publica curriculum" ON public.asignaturas           FOR SELECT USING (true);
CREATE POLICY "Lectura publica curriculum" ON public.niveles               FOR SELECT USING (true);
CREATE POLICY "Lectura publica curriculum" ON public.ejes                  FOR SELECT USING (true);
CREATE POLICY "Lectura publica curriculum" ON public.objetivos_aprendizaje FOR SELECT USING (true);
CREATE POLICY "Lectura publica curriculum" ON public.indicadores_evaluacion FOR SELECT USING (true);
CREATE POLICY "Lectura publica curriculum" ON public.oa_transversales      FOR SELECT USING (true);
CREATE POLICY "Lectura publica curriculum" ON public.actitudes             FOR SELECT USING (true);
CREATE POLICY "Lectura publica curriculum" ON public.referencias_curriculares FOR SELECT USING (true);


-- ============================================================
-- PARTE 3: ÍNDICES PARA RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_niveles_asig    ON public.niveles(asignatura_id);
CREATE INDEX IF NOT EXISTS idx_ejes_nivel      ON public.ejes(nivel_id);
CREATE INDEX IF NOT EXISTS idx_oa_eje          ON public.objetivos_aprendizaje(eje_id);
CREATE INDEX IF NOT EXISTS idx_ind_oa          ON public.indicadores_evaluacion(oa_id);
CREATE INDEX IF NOT EXISTS idx_oat_nivel       ON public.oa_transversales(nivel_id);
CREATE INDEX IF NOT EXISTS idx_act_nivel       ON public.actitudes(nivel_id);
CREATE INDEX IF NOT EXISTS idx_ref_nivel       ON public.referencias_curriculares(nivel_id);


-- ============================================================
-- PARTE 4: LIMPIEZA PREVIA (idempotente — seguro re-ejecutar)
-- ============================================================
-- Borra todos los datos curriculares y reinicia las secuencias.
-- Las tablas se limpian de hoja a raíz para respetar las FK.
-- La tabla "plannings" (datos de usuarios) NO se toca.

TRUNCATE TABLE
  public.referencias_curriculares,
  public.actitudes,
  public.oa_transversales,
  public.indicadores_evaluacion,
  public.objetivos_aprendizaje,
  public.ejes,
  public.niveles,
  public.asignaturas
RESTART IDENTITY CASCADE;


-- ============================================================
-- PARTE 5: SEED — DATOS CURRICULARES OFICIALES MINEDUC
-- ============================================================

DO $$
DECLARE
  asig_id       INTEGER;
  nivel_5_id    INTEGER;
  nivel_6_id    INTEGER;
  nivel_7_id    INTEGER;
  nivel_8_id    INTEGER;

  -- IDs de ejes
  eje_5_lec_id  INTEGER;  eje_5_esc_id  INTEGER;  eje_5_oral_id  INTEGER;
  eje_6_lec_id  INTEGER;  eje_6_esc_id  INTEGER;  eje_6_oral_id  INTEGER;
  eje_7_lec_id  INTEGER;  eje_7_esc_id  INTEGER;  eje_7_oral_id  INTEGER;  eje_7_inv_id INTEGER;
  eje_8_lec_id  INTEGER;  eje_8_esc_id  INTEGER;  eje_8_oral_id  INTEGER;  eje_8_inv_id INTEGER;

  -- IDs de OA — 5° Básico
  oa_5_lec_oa1  INTEGER;  oa_5_lec_oa2  INTEGER;  oa_5_lec_oa3  INTEGER;
  oa_5_lec_oa4  INTEGER;  oa_5_lec_oa6  INTEGER;
  oa_5_esc_oa15 INTEGER;  oa_5_esc_oa17 INTEGER;  oa_5_esc_oa18 INTEGER;
  oa_5_ora_oa24 INTEGER;  oa_5_ora_oa27 INTEGER;

  -- IDs de OA — 6° Básico
  oa_6_lec_oa1  INTEGER;  oa_6_lec_oa3  INTEGER;
  oa_6_lec_oa4  INTEGER;  oa_6_lec_oa6  INTEGER;
  oa_6_esc_oa15 INTEGER;  oa_6_esc_oa18 INTEGER;
  oa_6_ora_oa24 INTEGER;  oa_6_ora_oa27 INTEGER;

  -- IDs de OA — 7° Básico
  oa_7_lec_oa2  INTEGER;  oa_7_lec_oa3  INTEGER;
  oa_7_lec_oa6  INTEGER;  oa_7_lec_oa8  INTEGER;
  oa_7_esc_oa12 INTEGER;  oa_7_esc_oa14 INTEGER;  oa_7_esc_oa15 INTEGER;
  oa_7_ora_oa20 INTEGER;  oa_7_ora_oa21 INTEGER;
  oa_7_inv_oa24 INTEGER;

  -- IDs de OA — 8° Básico
  oa_8_lec_oa2  INTEGER;  oa_8_lec_oa3  INTEGER;  oa_8_lec_oa5  INTEGER;
  oa_8_lec_oa6  INTEGER;  oa_8_lec_oa9  INTEGER;
  oa_8_esc_oa14 INTEGER;  oa_8_esc_oa16 INTEGER;
  oa_8_ora_oa21 INTEGER;  oa_8_ora_oa22 INTEGER;
  oa_8_inv_oa25 INTEGER;

BEGIN

  -- ──────────────────────────────────────────────────────
  -- ASIGNATURA
  -- ──────────────────────────────────────────────────────
  INSERT INTO public.asignaturas (nombre)
    VALUES ('Lenguaje y Comunicación')
    ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
    RETURNING id INTO asig_id;

  -- ──────────────────────────────────────────────────────
  -- NIVELES
  -- ──────────────────────────────────────────────────────
  INSERT INTO public.niveles (nombre, orden, asignatura_id) VALUES ('5° Básico', 5, asig_id) RETURNING id INTO nivel_5_id;
  INSERT INTO public.niveles (nombre, orden, asignatura_id) VALUES ('6° Básico', 6, asig_id) RETURNING id INTO nivel_6_id;
  INSERT INTO public.niveles (nombre, orden, asignatura_id) VALUES ('7° Básico', 7, asig_id) RETURNING id INTO nivel_7_id;
  INSERT INTO public.niveles (nombre, orden, asignatura_id) VALUES ('8° Básico', 8, asig_id) RETURNING id INTO nivel_8_id;


  -- ══════════════════════════════════════════════════════
  -- 5° BÁSICO — Decreto 2960/2012
  -- ══════════════════════════════════════════════════════

  -- Ejes
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_5_id, 'Lectura',             asig_id) RETURNING id INTO eje_5_lec_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_5_id, 'Escritura',            asig_id) RETURNING id INTO eje_5_esc_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_5_id, 'Comunicación Oral',    asig_id) RETURNING id INTO eje_5_oral_id;

  -- OA Lectura 5°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_lec_id, 'OA 1',
     'Leer de manera fluida textos variados apropiados a su edad: pronunciando las palabras con precisión; respetando la prosodia indicada por todos los signos de puntuación; decodificando de manera automática la mayoría de las palabras del texto.',
     asig_id) RETURNING id INTO oa_5_lec_oa1;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_lec_id, 'OA 2',
     'Comprender textos, aplicando estrategias de comprensión lectora; por ejemplo: relacionar la información del texto con sus experiencias y conocimientos; releer lo que no fue comprendido; formular preguntas sobre lo leído y responderlas; organizar la información en esquemas o mapas conceptuales; resumir.',
     asig_id) RETURNING id INTO oa_5_lec_oa2;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_lec_id, 'OA 3',
     'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo, desarrollar su imaginación y reconocer su valor social y cultural; por ejemplo: poemas, cuentos folclóricos y de autor, fábulas, leyendas, mitos, novelas, historietas, otros.',
     asig_id) RETURNING id INTO oa_5_lec_oa3;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_lec_id, 'OA 4',
     'Analizar aspectos relevantes de narraciones leídas para profundizar su comprensión: interpretando el lenguaje figurado presente en el texto; expresando opiniones sobre las actitudes y acciones de los personajes y fundamentándolas con ejemplos del texto; determinando las consecuencias de hechos o acciones; describiendo el ambiente y las costumbres representadas en el texto; explicando las características físicas y sicológicas de los personajes que son relevantes para el desarrollo de la historia; comparando textos de autores diferentes y justificando su preferencia por alguno.',
     asig_id) RETURNING id INTO oa_5_lec_oa4;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_lec_id, 'OA 6',
     'Leer independientemente y comprender textos no literarios (cartas, biografías, relatos históricos, libros y artículos informativos, noticias, etc.) para ampliar su conocimiento del mundo y formarse una opinión: extrayendo información explícita e implícita; haciendo inferencias a partir de la información del texto y de sus experiencias y conocimientos; relacionando la información de imágenes, gráficos, tablas, mapas o diagramas, con el texto en el cual están insertos; interpretando expresiones en lenguaje figurado; comparando información; formulando una opinión sobre algún aspecto de la lectura; fundamentando su opinión con información del texto o sus conocimientos previos.',
     asig_id) RETURNING id INTO oa_5_lec_oa6;

  -- OA Escritura 5°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_esc_id, 'OA 15',
     'Escribir artículos informativos para comunicar información sobre un tema: presentando el tema en una oración; desarrollando una idea central por párrafo; agregando las fuentes utilizadas.',
     asig_id) RETURNING id INTO oa_5_esc_oa15;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_esc_id, 'OA 17',
     'Planificar sus textos: estableciendo propósito y destinatario; generando ideas a partir de sus conocimientos e investigación; organizando las ideas que compondrán su escrito.',
     asig_id) RETURNING id INTO oa_5_esc_oa17;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_esc_id, 'OA 18',
     'Escribir, revisar y editar sus textos para satisfacer un propósito y transmitir sus ideas con claridad. Durante este proceso: desarrollan las ideas relevantes y omiten las innecesarias; utilizan un vocabulario variado y preciso; mejoran la redacción del texto a partir de sugerencias de los pares y el docente; corrigen la ortografía y la presentación; usan eficazmente las herramientas del procesador de textos para buscar sinónimos, corregir ortografía y gramática, y dar formato.',
     asig_id) RETURNING id INTO oa_5_esc_oa18;

  -- OA Comunicación Oral 5°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_oral_id, 'OA 24',
     'Comprender textos orales (explicaciones, instrucciones, noticias, documentales, entrevistas, testimonios, relatos, etc.) para obtener información y desarrollar su curiosidad por el mundo: relacionando las ideas escuchadas con sus experiencias personales y sus conocimientos previos; extrayendo y registrando la información relevante; formulando preguntas al profesor o a los compañeros para comprender o elaborar una idea, o aclarar el significado de una palabra; comparando información dentro del texto o con otros textos; formulando y fundamentando una opinión sobre lo escuchado.',
     asig_id) RETURNING id INTO oa_5_ora_oa24;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_5_oral_id, 'OA 27',
     'Interactuar de acuerdo con las convenciones sociales en diferentes situaciones: presentarse a sí mismo y a otros; saludar; preguntar; expresar opiniones, sentimientos e ideas; otras situaciones que requieran el uso de fórmulas de cortesía como por favor, gracias, perdón, permiso.',
     asig_id) RETURNING id INTO oa_5_ora_oa27;

  -- Indicadores 5°
  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_5_lec_oa3, 'Relacionan situaciones de la vida cotidiana con versos de los textos leídos', asig_id),
    (oa_5_lec_oa3, 'Mencionan textos y autores que han leído', asig_id),
    (oa_5_lec_oa3, 'Relacionan aspectos de un texto con otros leídos previamente', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_5_lec_oa6, 'Extraen información explícita e implícita', asig_id),
    (oa_5_lec_oa6, 'Hacen inferencias a partir de la información del texto', asig_id),
    (oa_5_lec_oa6, 'Relacionan información de imágenes y tablas con el texto', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_5_esc_oa15, 'Eligen un tema interesante y registran información', asig_id),
    (oa_5_esc_oa15, 'Elaboran una introducción para presentar el tema', asig_id),
    (oa_5_esc_oa15, 'Desarrollan al menos tres párrafos con ideas centrales', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_5_ora_oa24, 'Relacionan ideas escuchadas con experiencias personales', asig_id),
    (oa_5_ora_oa24, 'Extraen y registran información relevante', asig_id),
    (oa_5_ora_oa24, 'Formulan preguntas para aclarar significados', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_5_ora_oa27, 'Usan convenciones de cortesía en sus interacciones', asig_id),
    (oa_5_ora_oa27, 'Adecuan el registro y el vocabulario según la situación comunicativa', asig_id);

  -- OA Transversales 5°
  INSERT INTO public.oa_transversales (nivel_id, texto, asignatura_id) VALUES
    (nivel_5_id, 'Favorecer el desarrollo físico y el autocuidado, en el marco del respeto y valoración del cuerpo.', asig_id),
    (nivel_5_id, 'Desarrollar el pensamiento reflexivo y metódico y el sentido de crítica y autocrítica.', asig_id),
    (nivel_5_id, 'Promover el interés por conocer la realidad y utilizar el conocimiento y seleccionar información.', asig_id),
    (nivel_5_id, 'Aprender a usar las tecnologías de la información de manera reflexiva y eficaz para obtener, procesar y comunicar información.', asig_id);

  -- Actitudes 5°
  INSERT INTO public.actitudes (nivel_id, letra, texto, asignatura_id) VALUES
    (nivel_5_id, 'a', 'Demostrar interés y una actitud activa frente a la lectura, orientada al disfrute de la misma y a la valoración del conocimiento que se puede obtener a partir de ella.', asig_id),
    (nivel_5_id, 'b', 'Demostrar disposición e interés por compartir ideas, experiencias y opiniones con otros.', asig_id),
    (nivel_5_id, 'c', 'Demostrar disposición e interés por expresarse de manera creativa por medio de la comunicación oral y escrita.', asig_id),
    (nivel_5_id, 'd', 'Realizar tareas y trabajos de forma rigurosa y perseverante, con el fin de desarrollarlos de manera adecuada a los propósitos de la asignatura.', asig_id),
    (nivel_5_id, 'e', 'Reflexionar sobre sí mismo, sus ideas y sus intereses para comprenderse y valorarse.', asig_id),
    (nivel_5_id, 'f', 'Demostrar empatía hacia los demás, comprendiendo el contexto en el que se sitúan.', asig_id),
    (nivel_5_id, 'g', 'Demostrar respeto por las diversas opiniones y puntos de vista, reconociendo el diálogo como una herramienta de enriquecimiento personal y social.', asig_id);

  -- Referencia 5°
  INSERT INTO public.referencias_curriculares (nivel_id, documento, decreto, paginas, asignatura_id) VALUES
    (nivel_5_id, 'Programa de Estudio Quinto Año Básico', 'Decreto 2960/2012', '30-59, 114, 115', asig_id);


  -- ══════════════════════════════════════════════════════
  -- 6° BÁSICO — Decreto 2960/2012 (Nivel SIMCE Lectura)
  -- ══════════════════════════════════════════════════════

  -- Ejes
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_6_id, 'Lectura',             asig_id) RETURNING id INTO eje_6_lec_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_6_id, 'Escritura',            asig_id) RETURNING id INTO eje_6_esc_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_6_id, 'Comunicación Oral',    asig_id) RETURNING id INTO eje_6_oral_id;

  -- OA Lectura 6°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_lec_id, 'OA 1',
     'Leer de manera fluida textos variados apropiados a su edad: pronunciando las palabras con precisión; respetando la prosodia indicada por todos los signos de puntuación; decodificando de manera automática la mayoría de las palabras del texto.',
     asig_id) RETURNING id INTO oa_6_lec_oa1;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_lec_id, 'OA 3',
     'Leer y familiarizarse con un amplio repertorio de literatura para aumentar su conocimiento del mundo, desarrollar su imaginación y reconocer su valor social y cultural; por ejemplo: poemas, cuentos folclóricos y de autor, fábulas, leyendas, mitos, novelas, historietas, otros.',
     asig_id) RETURNING id INTO oa_6_lec_oa3;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_lec_id, 'OA 4',
     'Analizar aspectos relevantes de las narraciones leídas para profundizar su comprensión: identificando las acciones principales del relato y explicando cómo influyen en el desarrollo de la historia; explicando las actitudes y reacciones de los personajes de acuerdo con sus motivaciones y las situaciones que viven; describiendo el ambiente y las costumbres representadas en el texto y explicando su influencia en las acciones del relato; relacionando el relato, si es pertinente, con la época y el lugar en que se ambienta; interpretando el lenguaje figurado presente en el texto; subrayando las ideas principales de un texto; llegando a conclusiones sustentadas en la información del texto; comparando textos de autores diferentes y justificando su preferencia por alguno.',
     asig_id) RETURNING id INTO oa_6_lec_oa4;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_lec_id, 'OA 6',
     'Leer independientemente y comprender textos no literarios (cartas, biografías, relatos históricos, libros y artículos informativos, noticias, etc.) para ampliar su conocimiento del mundo y formarse una opinión: extrayendo información explícita e implícita; haciendo inferencias a partir de la información del texto y de sus experiencias y conocimientos; relacionando la información de imágenes, gráficos, tablas, mapas o diagramas, con el texto en el cual están insertos; interpretando expresiones en lenguaje figurado; comparando información; formulando una opinión sobre algún aspecto de la lectura; fundamentando su opinión con información del texto o sus conocimientos previos.',
     asig_id) RETURNING id INTO oa_6_lec_oa6;

  -- OA Escritura 6°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_esc_id, 'OA 15',
     'Escribir artículos informativos para comunicar información sobre un tema: organizando el texto en una estructura clara; desarrollando una idea central por párrafo; agregando las fuentes utilizadas.',
     asig_id) RETURNING id INTO oa_6_esc_oa15;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_esc_id, 'OA 18',
     'Escribir, revisar y editar sus textos para satisfacer un propósito y transmitir sus ideas con claridad. Durante este proceso: agregan ejemplos, datos y justificaciones para profundizar las ideas; emplean un vocabulario preciso y variado, y un registro adecuado; aseguran la coherencia y la cohesión del texto mediante el uso de conectores y pronombres; organizan el texto en párrafos que desarrollan una idea relevante; editan independientemente aspectos de ortografía y presentación; utilizan herramientas del procesador de textos para buscar sinónimos, corregir ortografía y gramática, y dar formato.',
     asig_id) RETURNING id INTO oa_6_esc_oa18;

  -- OA Comunicación Oral 6°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_oral_id, 'OA 24',
     'Comprender textos orales (explicaciones, instrucciones, noticias, documentales, entrevistas, testimonios, relatos, reportajes, etc.) para obtener información y desarrollar su curiosidad por el mundo: relacionando las ideas escuchadas con sus experiencias personales y sus conocimientos previos; extrayendo y registrando la información relevante; formulando preguntas al profesor o a los compañeros para comprender o elaborar una idea, o aclarar el significado de una palabra; comparando información dentro del texto o con otros textos; formulando y fundamentando una opinión sobre lo escuchado; identificando diferentes puntos de vista.',
     asig_id) RETURNING id INTO oa_6_ora_oa24;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_6_oral_id, 'OA 27',
     'Dialogar para compartir y desarrollar ideas y buscar acuerdos: manteniendo el foco en un tema; complementando las ideas de otro y ofreciendo sugerencias; aceptando sugerencias; haciendo comentarios en los momentos adecuados; mostrando acuerdo o desacuerdo con respeto; fundamentando su postura.',
     asig_id) RETURNING id INTO oa_6_ora_oa27;

  -- Indicadores 6°
  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_6_lec_oa3, 'Relacionan situaciones cotidianas con versos de los textos leídos', asig_id),
    (oa_6_lec_oa3, 'Mencionan textos y autores leídos y sus temas', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_6_esc_oa15, 'Organizan el texto en una estructura clara', asig_id),
    (oa_6_esc_oa15, 'Desarrollan una idea central por párrafo', asig_id),
    (oa_6_esc_oa15, 'Agregan las fuentes utilizadas', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_6_ora_oa24, 'Relacionan ideas escuchadas con conocimientos previos', asig_id),
    (oa_6_ora_oa24, 'Emiten opinión fundamentada sobre el texto escuchado', asig_id),
    (oa_6_ora_oa24, 'Identifican diferentes opiniones', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_6_ora_oa27, 'Comparten sus opiniones sobre textos leídos', asig_id),
    (oa_6_ora_oa27, 'Opinan sustentando con ejemplos de experiencia personal', asig_id),
    (oa_6_ora_oa27, 'Respetan los turnos', asig_id);

  -- OA Transversales 6°
  INSERT INTO public.oa_transversales (nivel_id, texto, asignatura_id) VALUES
    (nivel_6_id, 'Favorecer el desarrollo de capacidades de análisis, síntesis, resolución de problemas y pensamiento reflexivo y crítico.', asig_id),
    (nivel_6_id, 'Demostrar interés por conocer la realidad y utilizar el conocimiento.', asig_id),
    (nivel_6_id, 'Trabajar en equipo de manera responsable, construyendo relaciones de confianza mutua.', asig_id);

  -- Actitudes 6°
  INSERT INTO public.actitudes (nivel_id, letra, texto, asignatura_id) VALUES
    (nivel_6_id, 'a', 'Demostrar interés y una actitud activa frente a la lectura, orientada al disfrute de la misma y a la valoración del conocimiento que se puede obtener a partir de ella.', asig_id),
    (nivel_6_id, 'b', 'Demostrar disposición e interés por compartir ideas, experiencias y opiniones con otros.', asig_id),
    (nivel_6_id, 'c', 'Demostrar interés por expresarse de manera creativa por medio de la comunicación oral y escrita.', asig_id),
    (nivel_6_id, 'd', 'Realizar tareas y trabajos de forma rigurosa y perseverante, con el fin de desarrollarlos de manera adecuada a los propósitos de la asignatura.', asig_id),
    (nivel_6_id, 'e', 'Reflexionar sobre sí mismo, sus ideas y sus intereses para comprenderse y valorarse.', asig_id),
    (nivel_6_id, 'f', 'Demostrar empatía hacia los demás, comprendiendo el contexto en el que se sitúan.', asig_id),
    (nivel_6_id, 'g', 'Demostrar respeto por las diversas opiniones y puntos de vista, reconociendo el diálogo como una herramienta de enriquecimiento personal y social.', asig_id);

  -- Referencia 6°
  INSERT INTO public.referencias_curriculares (nivel_id, documento, decreto, paginas, asignatura_id) VALUES
    (nivel_6_id, 'Programa de Estudio Sexto Año Básico', 'Decreto 2960/2012', '30-61, 114', asig_id);


  -- ══════════════════════════════════════════════════════
  -- 7° BÁSICO — Decreto 628/2016 (Lenguaje y Literatura)
  -- ══════════════════════════════════════════════════════

  -- Ejes
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_7_id, 'Lectura',                              asig_id) RETURNING id INTO eje_7_lec_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_7_id, 'Escritura',                             asig_id) RETURNING id INTO eje_7_esc_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_7_id, 'Comunicación Oral',                     asig_id) RETURNING id INTO eje_7_oral_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_7_id, 'Investigación en Lenguaje y Literatura', asig_id) RETURNING id INTO eje_7_inv_id;

  -- OA Lectura 7°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_lec_id, 'OA 2',
     'Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.',
     asig_id) RETURNING id INTO oa_7_lec_oa2;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_lec_id, 'OA 3',
     'Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; los personajes, su evolución en el relato y su relación con otros personajes; la relación de un fragmento de la obra con el total; el narrador, distinguiéndolo del autor; personajes tipo, símbolos y tópicos literarios presentes en el texto; los prejuicios, estereotipos y creencias presentes en el relato y su conexión con el mundo actual; la disposición temporal de los hechos; elementos en común con otros textos leídos en el año.',
     asig_id) RETURNING id INTO oa_7_lec_oa3;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_lec_id, 'OA 6',
     'Leer y comprender relatos mitológicos, considerando sus características y el contexto en el que se enmarcan.',
     asig_id) RETURNING id INTO oa_7_lec_oa6;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_lec_id, 'OA 8',
     'Analizar y evaluar textos con finalidad argumentativa como columnas de opinión, cartas y discursos, considerando: la postura del autor y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; su postura personal frente a lo leído y argumentos que la sustentan.',
     asig_id) RETURNING id INTO oa_7_lec_oa8;

  -- OA Escritura 7°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_esc_id, 'OA 12',
     'Expresarse en forma creativa por medio de la escritura de textos de diversos géneros (por ejemplo, cuentos, crónicas, diarios de vida, cartas, poemas, etc.), escogiendo libremente: el tema; el género; el destinatario.',
     asig_id) RETURNING id INTO oa_7_esc_oa12;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_esc_id, 'OA 14',
     'Escribir, con el propósito de persuadir, textos breves de diversos géneros (por ejemplo, cartas al director, editoriales, críticas literarias, etc.), caracterizados por: la presentación de una afirmación referida a temas contingentes o literarios; la presencia de evidencias e información pertinente; la mantención de la coherencia temática.',
     asig_id) RETURNING id INTO oa_7_esc_oa14;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_esc_id, 'OA 15',
     'Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro, específicamente, el vocabulario, el uso de la persona gramatical, y la estructura del texto al género discursivo, contexto y destinatario; usando un vocabulario variado y preciso; usando eficazmente las herramientas del procesador de textos.',
     asig_id) RETURNING id INTO oa_7_esc_oa15;

  -- OA Comunicación Oral 7°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_oral_id, 'OA 20',
     'Comprender, comparar y evaluar textos orales y audiovisuales tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustentan; los temas, conceptos o hechos principales; una distinción entre los hechos y las opiniones expresadas; diferentes puntos de vista expresados en los textos; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y cualquier otra manifestación artística; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.',
     asig_id) RETURNING id INTO oa_7_ora_oa20;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_oral_id, 'OA 21',
     'Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión o profundicen un aspecto del tema; negociando acuerdos con los interlocutores; considerando al interlocutor para la toma de turnos.',
     asig_id) RETURNING id INTO oa_7_ora_oa21;

  -- OA Investigación 7°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_7_inv_id, 'OA 24',
     'Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: delimitando el tema de investigación; utilizando los principales sistemas de búsqueda de textos en la biblioteca e internet; usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; organizando en categorías la información encontrada en las fuentes investigadas; registrando la información bibliográfica de las fuentes consultadas; elaborando un texto oral o escrito bien estructurado que comunique sus hallazgos.',
     asig_id) RETURNING id INTO oa_7_inv_oa24;

  -- Indicadores 7°
  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_7_lec_oa3, 'Distinguen eventos anteriores y posteriores a un hecho referente', asig_id),
    (oa_7_lec_oa3, 'Hacen recuentos cronológicos', asig_id),
    (oa_7_lec_oa3, 'Comparan narraciones en organizadores gráficos', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_7_esc_oa14, 'Escriben cartas al director identificando propósitos', asig_id),
    (oa_7_esc_oa14, 'Argumentan hipótesis en discusiones orales', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_7_ora_oa21, 'Mantienen el foco de la discusión', asig_id),
    (oa_7_ora_oa21, 'Formulan preguntas que estimulan el diálogo', asig_id),
    (oa_7_ora_oa21, 'Llegan a acuerdos con los compañeros', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_7_inv_oa24, 'Buscan fuentes en sitios confiables', asig_id),
    (oa_7_inv_oa24, 'Evalúan si la información es suficiente', asig_id),
    (oa_7_inv_oa24, 'Elaboran fichas de investigación con autor y título', asig_id);

  -- OA Transversales 7°
  INSERT INTO public.oa_transversales (nivel_id, texto, asignatura_id) VALUES
    (nivel_7_id, 'Ejercer de modo responsable grados crecientes de libertad y autonomía personal, de acuerdo a valores de justicia, honestidad y respeto.', asig_id),
    (nivel_7_id, 'Demostrar interés por conocer la realidad y utilizar el conocimiento.', asig_id),
    (nivel_7_id, 'Gestionar de manera activa el propio aprendizaje, utilizando capacidades de análisis e interpretación.', asig_id),
    (nivel_7_id, 'Usar de manera responsable y efectiva las tecnologías de la comunicación.', asig_id);

  -- Actitudes 7°
  INSERT INTO public.actitudes (nivel_id, letra, texto, asignatura_id) VALUES
    (nivel_7_id, 'A', 'Manifestar disposición a formarse un pensamiento propio, reflexivo e informado, mediante una lectura crítica y el diálogo con otros.', asig_id),
    (nivel_7_id, 'B', 'Manifestar una disposición a reflexionar sobre sí mismo y sobre las cuestiones sociales y éticas que emanan de las lecturas.', asig_id),
    (nivel_7_id, 'C', 'Interesarse por comprender las experiencias e ideas de los demás, utilizando la lectura y el diálogo para el enriquecimiento personal, y la construcción de buenas relaciones con los demás.', asig_id),
    (nivel_7_id, 'D', 'Valorar la diversidad de perspectivas, creencias y culturas, presentes en su entorno y el mundo, como manifestación de la libertad, creatividad y dignidad humana.', asig_id),
    (nivel_7_id, 'E', 'Valorar las posibilidades que da el discurso hablado y escrito para participar de manera proactiva, informada y responsable en la vida de la sociedad democrática.', asig_id),
    (nivel_7_id, 'F', 'Valorar la evidencia y la búsqueda de conocimientos que apoyen sus aseveraciones.', asig_id),
    (nivel_7_id, 'G', 'Realizar tareas y trabajos de forma rigurosa y perseverante, entendiendo que los logros se obtienen solo después de un trabajo prolongado.', asig_id),
    (nivel_7_id, 'H', 'Trabajar colaborativamente, usando de manera responsable las tecnologías de la comunicación, dando crédito al trabajo de otros y respetando la propiedad y la privacidad de las personas.', asig_id);

  -- Referencia 7°
  INSERT INTO public.referencias_curriculares (nivel_id, documento, decreto, paginas, asignatura_id) VALUES
    (nivel_7_id, 'Programa de Estudio Séptimo Básico', 'Decreto 628/2016', '54-70, 151, 152', asig_id);


  -- ══════════════════════════════════════════════════════
  -- 8° BÁSICO — Decreto 628/2016 (Lenguaje y Literatura)
  -- ══════════════════════════════════════════════════════

  -- Ejes
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_8_id, 'Lectura',                              asig_id) RETURNING id INTO eje_8_lec_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_8_id, 'Escritura',                             asig_id) RETURNING id INTO eje_8_esc_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_8_id, 'Comunicación Oral',                     asig_id) RETURNING id INTO eje_8_oral_id;
  INSERT INTO public.ejes (nivel_id, nombre, asignatura_id) VALUES (nivel_8_id, 'Investigación en Lenguaje y Literatura', asig_id) RETURNING id INTO eje_8_inv_id;

  -- OA Lectura 8°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_lec_id, 'OA 2',
     'Reflexionar sobre las diferentes dimensiones de la experiencia humana, propia y ajena, a partir de la lectura de obras literarias y otros textos que forman parte de nuestras herencias culturales, abordando los temas estipulados para el curso y las obras sugeridas para cada uno.',
     asig_id) RETURNING id INTO oa_8_lec_oa2;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_lec_id, 'OA 3',
     'Analizar las narraciones leídas para enriquecer su comprensión, considerando, cuando sea pertinente: el o los conflictos de la historia; los personajes, su evolución en el relato y su relación con otros personajes; la relación de un fragmento de la obra con el total; el narrador, distinguiéndolo del autor; personajes tipo (por ejemplo, el pícaro, el avaro, el seductor, la madrastra, etc.), símbolos y tópicos literarios presentes en el texto; los prejuicios, estereotipos y creencias presentes en el relato y su conexión con el mundo actual; la disposición temporal de los hechos, con atención a los recursos léxicos y gramaticales empleados para expresarla; elementos en común con otros textos leídos en el año.',
     asig_id) RETURNING id INTO oa_8_lec_oa3;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_lec_id, 'OA 5',
     'Analizar los textos dramáticos leídos o vistos, para enriquecer su comprensión, considerando, cuando sea pertinente: el conflicto y sus semejanzas con situaciones cotidianas; los personajes principales y cómo sus acciones y dichos conducen al desenlace o afectan a otros personajes; personajes tipo, símbolos y tópicos literarios; los prejuicios, estereotipos y creencias presentes en el relato y su conexión con el mundo actual.',
     asig_id) RETURNING id INTO oa_8_lec_oa5;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_lec_id, 'OA 6',
     'Leer y comprender fragmentos de epopeyas, considerando sus características y el contexto en el que se enmarcan.',
     asig_id) RETURNING id INTO oa_8_lec_oa6;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_lec_id, 'OA 9',
     'Analizar y evaluar textos con finalidad argumentativa, como columnas de opinión, cartas y discursos, considerando: la postura del autor y los argumentos e información que la sostienen; la diferencia entre hecho y opinión; con qué intención el autor usa diversos modos verbales; su postura personal frente a lo leído y argumentos que la sustentan.',
     asig_id) RETURNING id INTO oa_8_lec_oa9;

  -- OA Escritura 8°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_esc_id, 'OA 14',
     'Escribir, con el propósito de explicar un tema, textos de diversos géneros (por ejemplo, artículos, informes, reportajes, etc.) caracterizados por: una presentación clara del tema en que se esbozan los aspectos que se abordarán; la presencia de información de distintas fuentes; la inclusión de hechos, descripciones, ejemplos o explicaciones que desarrollen el tema; una progresión temática clara, con especial atención al empleo de recursos anafóricos; el uso de imágenes u otros recursos gráficos pertinentes; un cierre coherente con las características del género; el uso de referencias según un formato previamente acordado.',
     asig_id) RETURNING id INTO oa_8_esc_oa14;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_esc_id, 'OA 16',
     'Planificar, escribir, revisar, reescribir y editar sus textos en función del contexto, el destinatario y el propósito: recopilando información e ideas y organizándolas antes de escribir; adecuando el registro, específicamente, el vocabulario, el uso de la persona gramatical, y la estructura del texto al género discursivo, contexto y destinatario; incorporando información pertinente; asegurando la coherencia y la cohesión del texto; cuidando la organización a nivel oracional y textual.',
     asig_id) RETURNING id INTO oa_8_esc_oa16;

  -- OA Comunicación Oral 8°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_oral_id, 'OA 21',
     'Comprender, comparar y evaluar textos orales y audiovisuales tales como exposiciones, discursos, documentales, noticias, reportajes, etc., considerando: su postura personal frente a lo escuchado y argumentos que la sustentan; los temas, conceptos o hechos principales; el contexto en el que se enmarcan los textos; prejuicios expresados en los textos; una distinción entre los hechos y las opiniones expresados; diferentes puntos de vista expresados en los textos; las relaciones que se establecen entre imágenes, texto y sonido; relaciones entre lo escuchado y los temas y obras estudiados durante el curso.',
     asig_id) RETURNING id INTO oa_8_ora_oa21;

  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_oral_id, 'OA 22',
     'Dialogar constructivamente para debatir o explorar ideas: manteniendo el foco; demostrando comprensión de lo dicho por el interlocutor; fundamentando su postura de manera pertinente; formulando preguntas o comentarios que estimulen o hagan avanzar la discusión o profundicen un aspecto del tema; negociando acuerdos con los interlocutores; reformulando sus comentarios para desarrollarlos mejor; considerando al interlocutor para la toma de turnos.',
     asig_id) RETURNING id INTO oa_8_ora_oa22;

  -- OA Investigación 8°
  INSERT INTO public.objetivos_aprendizaje (eje_id, codigo, texto, asignatura_id) VALUES
    (eje_8_inv_id, 'OA 25',
     'Realizar investigaciones sobre diversos temas para complementar sus lecturas o responder interrogantes relacionadas con el lenguaje y la literatura: usando los organizadores y la estructura textual para encontrar información de manera eficiente; evaluando si los textos entregan suficiente información para responder una determinada pregunta o cumplir un propósito; descartando fuentes que no aportan a la investigación porque se alejan del tema; organizando en categorías la información encontrada en las fuentes investigadas.',
     asig_id) RETURNING id INTO oa_8_inv_oa25;

  -- Indicadores 8°
  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_8_lec_oa3, 'Explican causas de conflictos', asig_id),
    (oa_8_lec_oa3, 'Identifican personajes tipo como la madrastra', asig_id),
    (oa_8_lec_oa3, 'Distinguen al narrador del autor', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_8_esc_oa14, 'Organizan el texto en estructura clara', asig_id),
    (oa_8_esc_oa14, 'Desarrollan una idea central por párrafo', asig_id),
    (oa_8_esc_oa14, 'Agregan fuentes utilizadas', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_8_esc_oa16, 'Recopilan documentos de internet', asig_id),
    (oa_8_esc_oa16, 'Toman apuntes o hacen fichas', asig_id),
    (oa_8_esc_oa16, 'Reorganizan párrafos para coherencia temática', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_8_ora_oa21, 'Explican similitudes y diferencias entre presentaciones de un mismo hecho', asig_id),
    (oa_8_ora_oa21, 'Describen relación entre lo escuchado y otras artes', asig_id);

  INSERT INTO public.indicadores_evaluacion (oa_id, texto, asignatura_id) VALUES
    (oa_8_ora_oa22, 'Retoman lo dicho por otros para refutar o expandir', asig_id),
    (oa_8_ora_oa22, 'Explicitan acuerdos y desacuerdos', asig_id),
    (oa_8_ora_oa22, 'Llegan a acuerdos sobre aspectos discutidos', asig_id);

  -- OA Transversales 8°
  INSERT INTO public.oa_transversales (nivel_id, texto, asignatura_id) VALUES
    (nivel_8_id, 'Favorecer el desarrollo de capacidades de análisis, interpretación y síntesis.', asig_id),
    (nivel_8_id, 'Valorar la libertad, la igualdad de derechos y la dignidad humana.', asig_id),
    (nivel_8_id, 'Practicar la iniciativa personal, la creatividad y el espíritu emprendedor.', asig_id),
    (nivel_8_id, 'Demostrar interés por conocer la realidad y utilizar el conocimiento.', asig_id);

  -- Actitudes 8°
  INSERT INTO public.actitudes (nivel_id, letra, texto, asignatura_id) VALUES
    (nivel_8_id, 'A', 'Manifestar disposición a formarse un pensamiento propio, reflexivo e informado, mediante una lectura crítica y el diálogo con otros.', asig_id),
    (nivel_8_id, 'B', 'Manifestar una disposición a reflexionar sobre sí mismo y sobre las cuestiones sociales y éticas que emanan de las lecturas.', asig_id),
    (nivel_8_id, 'C', 'Interesarse por comprender las experiencias e ideas de los demás, utilizando la lectura y el diálogo para el enriquecimiento personal y para la construcción de buenas relaciones con los demás.', asig_id),
    (nivel_8_id, 'D', 'Valorar la diversidad de perspectivas, creencias y culturas, presentes en su entorno y el mundo, como manifestación de la libertad, creatividad y dignidad humana.', asig_id),
    (nivel_8_id, 'E', 'Valorar las posibilidades que da el discurso hablado y escrito para participar de manera proactiva, informada y responsable en la vida de la sociedad democrática.', asig_id),
    (nivel_8_id, 'F', 'Valorar la evidencia y la búsqueda de conocimientos que apoyen sus aseveraciones.', asig_id),
    (nivel_8_id, 'G', 'Realizar tareas y trabajos de forma rigurosa y perseverante, entendiendo que los logros se obtienen solo después de un trabajo prolongado.', asig_id),
    (nivel_8_id, 'H', 'Trabajar colaborativamente, usando de manera responsable las tecnologías de la comunicación, dando crédito al trabajo de otros y respetando la propiedad y la privacidad de las personas.', asig_id);

  -- Referencia 8°
  INSERT INTO public.referencias_curriculares (nivel_id, documento, decreto, paginas, asignatura_id) VALUES
    (nivel_8_id, 'Programa de Estudio Octavo Básico', 'Decreto 628/2016', '30-72, 245-284, 352-368', asig_id);

END $$;
