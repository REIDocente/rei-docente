-- ============================================================
-- MIGRACIÓN Y CARGA DE CURRÍCULUM: 5° BÁSICO LENGUAJE
-- ============================================================

-- 1. Crear tabla curriculum_lecciones si no existe
CREATE TABLE IF NOT EXISTS public.curriculum_lecciones (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id           UUID    NOT NULL REFERENCES public.curriculum_unidades(id) ON DELETE CASCADE,
  leccion_numero      INT     NOT NULL,
  titulo_leccion      TEXT    NOT NULL,
  temas               TEXT,              -- Palabras clave / descripción corta
  oa_basales          TEXT[]  NOT NULL DEFAULT '{}',
  oa_complementarios  TEXT[]  NOT NULL DEFAULT '{}',
  CONSTRAINT uq_curriculum_lecciones_unidad_num UNIQUE (unidad_id, leccion_numero)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.curriculum_lecciones ENABLE ROW LEVEL SECURITY;

-- 3. Crear política de lectura pública para curriculum_lecciones si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'curriculum_lecciones' AND policyname = 'curriculum_lecciones_public_read'
  ) THEN
    CREATE POLICY "curriculum_lecciones_public_read"
      ON public.curriculum_lecciones FOR SELECT USING (true);
  END IF;
END $$;

-- 4. Crear índice de optimización
CREATE INDEX IF NOT EXISTS idx_curriculum_lecciones_unidad 
  ON public.curriculum_lecciones (unidad_id);

-- 5. Actualizar nombres/títulos de las unidades de 5° Básico
UPDATE public.curriculum_unidades SET titulo_tema = 'La unión hace la fuerza' WHERE nivel = '5° Básico' AND unidad_numero = 1;
UPDATE public.curriculum_unidades SET titulo_tema = 'Emociones que sanan' WHERE nivel = '5° Básico' AND unidad_numero = 2;
UPDATE public.curriculum_unidades SET titulo_tema = 'Coexistir en armonía' WHERE nivel = '5° Básico' AND unidad_numero = 3;
UPDATE public.curriculum_unidades SET titulo_tema = 'Un mundo en movimiento' WHERE nivel = '5° Básico' AND unidad_numero = 4;

-- 6. Insertar las 11 lecciones de 5° Básico (Limpiando previas si existían)
DELETE FROM public.curriculum_lecciones 
WHERE unidad_id IN (SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico');

-- Unidad 1: La unión hace la fuerza
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 1), 
   1, 'Fútbol y trabajo en equipo', 'fútbol, trabajo en equipo, compañerismo, esfuerzo, superación', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9'], ARRAY['OA 2', 'OA 12']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 1), 
   2, 'Jugar como niña', 'equidad de género en el deporte, estereotipos, perseverancia, empatía, análisis de roles', 
   ARRAY['OA 6', 'OA 7', 'OA 24', 'OA 26'], ARRAY['OA 12']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 1), 
   3, 'Deporte y perseverancia', 'perseverancia, superación frente a la adversidad, resiliencia, automotivación', 
   ARRAY['OA 4', 'OA 11', 'OA 15', 'OA 17', 'OA 18'], ARRAY['OA 12']);

-- Unidad 2: Emociones que sanan
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 2), 
   4, 'Emociones en verso', 'poesía, expresión de emociones, figuras literarias (metáfora, personificación), rima, lenguaje figurado', 
   ARRAY['OA 1', 'OA 3', 'OA 5', 'OA 6', 'OA 7', 'OA 9', 'OA 24', 'OA 26'], ARRAY['OA 2', 'OA 8', 'OA 12', 'OA 27']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 2), 
   5, 'Narrar para no olvidar', 'memoria histórica, tradición oral, narración de historias, identidad cultural, mitos y leyendas locales', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 14', 'OA 17', 'OA 18'], ARRAY['OA 2', 'OA 8', 'OA 13']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 2), 
   6, 'Vientos que arrasan', 'fuerzas de la naturaleza, leyendas sobre el clima y desastres naturales, mitología, respeto al medio ambiente', 
   ARRAY['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 6', 'OA 7'], ARRAY['OA 2', 'OA 8', 'OA 16']);

-- Unidad 3: Coexistir en armonía
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 3), 
   7, 'Coexistir en armonía', 'convivencia pacífica, resolución de conflictos, tolerancia, empatía comunitaria', 
   ARRAY['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 5', 'OA 9'], ARRAY['OA 2', 'OA 12']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 3), 
   8, 'Guardianes de la naturaleza', 'ecología, conservación ambiental, biodiversidad, responsabilidad ecológica activa, flora y fauna', 
   ARRAY['OA 1', 'OA 2', 'OA 3', 'OA 4', 'OA 9', 'OA 24', 'OA 26'], ARRAY['OA 2', 'OA 12', 'OA 25', 'OA 27', 'OA 28']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 3), 
   9, 'Pueblos Originarios: Espíritu Verde', 'sabiduría ancestral, cosmovisión indígena, respeto por la tierra, relación con la naturaleza', 
   ARRAY['OA 1', 'OA 2', 'OA 3', 'OA 6', 'OA 7', 'OA 9', 'OA 14', 'OA 17', 'OA 18'], ARRAY['OA 2', 'OA 8', 'OA 12']);

-- Unidad 4: Un mundo en movimiento
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 4), 
   10, 'Viajar para volver a empezar', 'migración, adaptación cultural, nuevos comienzos, diversidad cultural, empatía con el migrante', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 9', 'OA 15', 'OA 17', 'OA 18'], ARRAY['OA 2', 'OA 8', 'OA 12', 'OA 13', 'OA 16', 'OA 22']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '5° Básico' AND unidad_numero = 4), 
   11, 'Viajes migratorios', 'migración animal, viajes por el mundo, geografía, ecología, adaptaciones para la supervivencia', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 9', 'OA 11', 'OA 28'], ARRAY['OA 2', 'OA 12']);
