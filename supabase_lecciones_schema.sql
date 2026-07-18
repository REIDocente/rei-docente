-- ============================================================
-- DIDAKTA: ESQUEMA Y SEED DE LECCIONES Y UNIDADES
-- Niveles: 5°, 6°, 7° y 8° Básico
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Tabla de unidades
CREATE TABLE IF NOT EXISTS public.unidades (
  id SERIAL PRIMARY KEY,
  nivel_id INTEGER REFERENCES public.niveles(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  titulo TEXT,
  descripcion TEXT
);

-- NUEVA: tabla de lecciones
CREATE TABLE IF NOT EXISTS public.lecciones (
  id SERIAL PRIMARY KEY,
  unidad_id INTEGER REFERENCES public.unidades(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  titulo TEXT
);

-- NUEVA: OAs por lección (máx 3 por lección)
CREATE TABLE IF NOT EXISTS public.leccion_oa (
  leccion_id INTEGER REFERENCES public.lecciones(id) ON DELETE CASCADE,
  oa_id INTEGER REFERENCES public.objetivos_aprendizaje(id) ON DELETE CASCADE,
  PRIMARY KEY (leccion_id, oa_id)
);

-- Habilitar RLS
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leccion_oa ENABLE ROW LEVEL SECURITY;

-- Crear políticas públicas de lectura
DROP POLICY IF EXISTS "read_public_unidades" ON public.unidades;
CREATE POLICY "read_public_unidades" ON public.unidades FOR SELECT USING (true);

DROP POLICY IF EXISTS "read_public_lecciones" ON public.lecciones;
CREATE POLICY "read_public_lecciones" ON public.lecciones FOR SELECT USING (true);

DROP POLICY IF EXISTS "read_public_leccion_oa" ON public.leccion_oa;
CREATE POLICY "read_public_leccion_oa" ON public.leccion_oa FOR SELECT USING (true);

-- Poblar datos
DO $$
DECLARE
  n5_id INT;
  n6_id INT;
  n7_id INT;
  n8_id INT;
  
  u_id INT;
  lec_id INT;
BEGIN
  -- Obtener nivel_id para cada curso
  SELECT id INTO n5_id FROM public.niveles WHERE nombre = '5° Básico' LIMIT 1;
  SELECT id INTO n6_id FROM public.niveles WHERE nombre = '6° Básico' LIMIT 1;
  SELECT id INTO n7_id FROM public.niveles WHERE nombre = '7° Básico' LIMIT 1;
  SELECT id INTO n8_id FROM public.niveles WHERE nombre = '8° Básico' LIMIT 1;

  -- Limpieza de registros previos para evitar conflictos de claves únicas/duplicados en re-ejecuciones
  DELETE FROM public.leccion_oa;
  DELETE FROM public.lecciones;
  DELETE FROM public.unidades;

  -- ────────────────────────────────────────────────────────
  -- 5° BÁSICO SEEDING (4 unidades, 11 lecciones)
  -- ────────────────────────────────────────────────────────
  IF n5_id IS NOT NULL THEN
    -- Unidad 1: La unión hace la fuerza
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n5_id, 1, 'La unión hace la fuerza', 'Trabajo en equipo, colaboración y perseverancia.')
    RETURNING id INTO u_id;
    
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Fútbol y trabajo en equipo') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 1', 'OA 3', 'OA 9') AND nivel_id = n5_id;
    
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'Jugar como niña') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 6', 'OA 24', 'OA 26') AND nivel_id = n5_id;
    
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Deporte y perseverancia') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 11', 'OA 17', 'OA 18') AND nivel_id = n5_id;

    -- Unidad 2: Emociones que sanan
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n5_id, 2, 'Emociones que sanan', 'Comprensión de poemas y narraciones que expresan emociones.')
    RETURNING id INTO u_id;
    
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Emociones en verso') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 5', 'OA 9', 'OA 26') AND nivel_id = n5_id;
    
    -- Lección 5
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 5, 'Narrar para no olvidar') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 14', 'OA 17') AND nivel_id = n5_id;
    
    -- Lección 6
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 6, 'Vientos que arrasan') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 6', 'OA 7') AND nivel_id = n5_id;

    -- Unidad 3: Coexistir en armonía
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n5_id, 3, 'Coexistir en armonía', 'El vínculo con la naturaleza y los saberes de los pueblos originarios.')
    RETURNING id INTO u_id;
    
    -- Lección 7
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 7, 'Coexistir en armonía') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 5', 'OA 9') AND nivel_id = n5_id;
    
    -- Lección 8
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 8, 'Guardianes de la naturaleza') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 24', 'OA 26') AND nivel_id = n5_id;
    
    -- Lección 9
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 9, 'Pueblos Originarios: Espíritu Verde') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 6', 'OA 14', 'OA 18') AND nivel_id = n5_id;

    -- Unidad 4: Un mundo en movimiento
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n5_id, 4, 'Un mundo en movimiento', 'Viajes, migraciones y cambios en el tiempo.')
    RETURNING id INTO u_id;
    
    -- Lección 10
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 10, 'Viajar para volver a empezar') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 9', 'OA 17') AND nivel_id = n5_id;
    
    -- Lección 11
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 11, 'Viajes migratorios') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 6', 'OA 11', 'OA 28') AND nivel_id = n5_id;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- 6° BÁSICO SEEDING (4 unidades, 11 lecciones)
  -- ────────────────────────────────────────────────────────
  IF n6_id IS NOT NULL THEN
    -- Unidad 1: El poder de la aventura, la imaginación y la creatividad
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n6_id, 1, 'El poder de la aventura, la imaginación y la creatividad', 'Desarrollo de lectura comprensiva y expresión oral.')
    RETURNING id INTO u_id;
    
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Juegos e imaginación') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 1', 'OA 3', 'OA 4') AND nivel_id = n6_id;
    
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'Creatividad e innovación') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 6', 'OA 24', 'OA 27') AND nivel_id = n6_id;
    
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Aventuras y viajes en el tiempo') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 7', 'OA 14') AND nivel_id = n6_id;

    -- Unidad 2: El medioambiente y su protección
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n6_id, 2, 'El medioambiente y su protección', 'Comprensión de poemas y textos informativos.')
    RETURNING id INTO u_id;
    
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'El ser humano y la naturaleza') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 4', 'OA 5') AND nivel_id = n6_id;
    
    -- Lección 5
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 5, 'La conservación de la biodiversidad') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 11', 'OA 24', 'OA 29') AND nivel_id = n6_id;
    
    -- Lección 6
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 6, 'Conectándonos con la naturaleza') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 6', 'OA 7', 'OA 15') AND nivel_id = n6_id;

    -- Unidad 3: El ser humano y su vínculo con el cosmos
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n6_id, 3, 'El ser humano y su vínculo con el cosmos', 'Lectura de mitos, leyendas y producción escrita.')
    RETURNING id INTO u_id;
    
    -- Lección 7
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 7, 'Investigando el universo') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 4', 'OA 6') AND nivel_id = n6_id;
    
    -- Lección 8
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 8, 'Distintas creencias sobre el cielo') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 7', 'OA 12', 'OA 24') AND nivel_id = n6_id;
    
    -- Lección 9
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 9, 'Historias de vida') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 11', 'OA 14') AND nivel_id = n6_id;

    -- Unidad 4: Respetar las diferencias y la igualdad de derechos
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n6_id, 4, 'Respetar las diferencias y la igualdad de derechos', 'Análisis dramático y exposiciones orales.')
    RETURNING id INTO u_id;
    
    -- Lección 10
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 10, 'Somos iguales') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 4', 'OA 7') AND nivel_id = n6_id;
    
    -- Lección 11
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 11, 'Mujeres activistas') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 6', 'OA 11', 'OA 18') AND nivel_id = n6_id;
  END IF;

  -- ────────────────────────────────────────────────────────
  -- 7° BÁSICO SEEDING (4 unidades, 16 lecciones)
  -- ────────────────────────────────────────────────────────
  IF n7_id IS NOT NULL THEN
    -- Unidad 1: ¿Qué me hace sentir bien?
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n7_id, 1, '¿Qué me hace sentir bien?', 'Unidad 1 de 7° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Tener un amigo') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 9', 'OA 20') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'Confiar y compartir') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 7', 'OA 11', 'OA 21') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Expresar mi interior') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 4', 'OA 14', 'OA 24') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Trabajar por mis metas') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 13', 'OA 15', 'OA 16') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);

    -- Unidad 2: ¿Cómo construimos comunidad?
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n7_id, 2, '¿Cómo construimos comunidad?', 'Unidad 2 de 7° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Respetando mis derechos y los tuyos') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 7', 'OA 21') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'Con todos los sentimientos') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 10', 'OA 11', 'OA 20') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Conociendo relatos ancestrales') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 24', 'OA 25') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Apoyándonos mutuamente') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 8', 'OA 14', 'OA 15') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);

    -- Unidad 3: Somos naturaleza
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n7_id, 3, 'Somos naturaleza', 'Unidad 3 de 7° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Con el océano y sus habitantes') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 3', 'OA 20') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'En nuevos territorios') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 7', 'OA 11', 'OA 21') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'En la creación literaria') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 4', 'OA 10', 'OA 24') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Protegiendo los espacios naturales') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 9', 'OA 14', 'OA 17') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);

    -- Unidad 4: ¿Qué nos cuenta el mundo?
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n7_id, 4, '¿Qué nos cuenta el mundo?', 'Unidad 4 de 7° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Historias del pasado') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 5', 'OA 7') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'La visión popular') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 10', 'OA 24', 'OA 25') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Mentiras y verdades') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 9', 'OA 20', 'OA 21') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Representaciones de vida') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 8', 'OA 17', 'OA 22') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n7_id);
  END IF;

  -- ────────────────────────────────────────────────────────
  -- 8° BÁSICO SEEDING (4 unidades, 16 lecciones)
  -- ────────────────────────────────────────────────────────
  IF n8_id IS NOT NULL THEN
    -- Unidad 1: ¿Dónde empieza el amor?
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n8_id, 1, '¿Dónde empieza el amor?', 'Unidad 1 de 8° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'En un instante mágico') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 8', 'OA 13') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'En un rincón cotidiano') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 11', 'OA 22') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Poemas (lección de investigación)') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 4', 'OA 25', 'OA 26') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Entrevista a Elisa Avendaño') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 14', 'OA 18', 'OA 21') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);

    -- Unidad 2: ¿Es todo como parece?
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n8_id, 2, '¿Es todo como parece?', 'Unidad 2 de 8° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Lo que no queremos ver') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 5', 'OA 7') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'Lo que debemos descifrar') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 11', 'OA 13') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Lo que vemos distinto (investigación)') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 23', 'OA 25', 'OA 26') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Lo que nos quieren hacer creer') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 9', 'OA 15', 'OA 22') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);

    -- Unidad 3: ¿Qué queda del pasado?
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n8_id, 3, '¿Qué queda del pasado?', 'Unidad 3 de 8° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Aventuras que atraviesan el tiempo') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 6', 'OA 23') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'Heroísmos revisitados (investigación)') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 14', 'OA 21', 'OA 26') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'Historias de vidas y de pueblos') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 4', 'OA 24') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Saberes ancestrales') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 10', 'OA 16', 'OA 22') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);

    -- Unidad 4: ¿Hacia dónde va el futuro?
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n8_id, 4, '¿Hacia dónde va el futuro?', 'Unidad 4 de 8° Básico')
    RETURNING id INTO u_id;
    -- Lección 1
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 1, 'Hacia un mundo distópico') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 2', 'OA 3', 'OA 22') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 2
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 2, 'Más allá de lo imaginado (investigación)') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 8', 'OA 25', 'OA 26') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 3
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 3, 'A donde anhelamos llegar') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 3', 'OA 12', 'OA 13') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
    -- Lección 4
    INSERT INTO public.lecciones (unidad_id, numero, titulo) VALUES (u_id, 4, 'Construir un tiempo mejor') RETURNING id INTO lec_id;
    INSERT INTO public.leccion_oa (leccion_id, oa_id) SELECT lec_id, id FROM public.objetivos_aprendizaje WHERE codigo IN ('OA 9', 'OA 15', 'OA 16') AND eje_id IN (SELECT id FROM public.ejes WHERE nivel_id = n8_id);
  END IF;

END $$;
