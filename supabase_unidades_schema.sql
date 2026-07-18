-- ============================================================
-- DIDAKTA: ESQUEMA Y SEED DE UNIDADES (5° BÁSICO)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Crear tablas
CREATE TABLE IF NOT EXISTS public.unidades (
  id SERIAL PRIMARY KEY,
  nivel_id INTEGER REFERENCES public.niveles(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL, -- 1, 2, 3, 4...
  titulo TEXT, -- "El héroe en distintas épocas" (7° en adelante)
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS public.unidad_oa (
  unidad_id INTEGER REFERENCES public.unidades(id) ON DELETE CASCADE,
  oa_id INTEGER REFERENCES public.objetivos_aprendizaje(id) ON DELETE CASCADE,
  PRIMARY KEY (unidad_id, oa_id)
);

-- RLS — Lectura pública
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidad_oa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica unidades" ON public.unidades;
CREATE POLICY "Lectura publica unidades" ON public.unidades FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura publica unidad_oa" ON public.unidad_oa;
CREATE POLICY "Lectura publica unidad_oa" ON public.unidad_oa FOR SELECT USING (true);

-- 2. Poblar datos del currículum (5° Básico como primer paso)
DO $$
DECLARE
  n_5_id INTEGER;
  u1_id INTEGER;
  u2_id INTEGER;
  u3_id INTEGER;
  u4_id INTEGER;
BEGIN
  -- Obtener nivel_id para 5° Básico
  SELECT id INTO n_5_id FROM public.niveles WHERE nombre = '5° Básico' LIMIT 1;
  
  IF n_5_id IS NOT NULL THEN
    -- Limpiar registros previos si los hay
    DELETE FROM public.unidad_oa WHERE unidad_id IN (SELECT id FROM public.unidades WHERE nivel_id = n_5_id);
    DELETE FROM public.unidades WHERE nivel_id = n_5_id;

    -- Insertar las 4 unidades
    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n_5_id, 1, 'Unidad 1', 'Desarrollo de lectura comprensiva y expresión oral.')
    RETURNING id INTO u1_id;

    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n_5_id, 2, 'Unidad 2', 'Comprensión de poemas y textos informativos.')
    RETURNING id INTO u2_id;

    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n_5_id, 3, 'Unidad 3', 'Lectura de mitos, leyendas y producción escrita.')
    RETURNING id INTO u3_id;

    INSERT INTO public.unidades (nivel_id, numero, titulo, descripcion)
    VALUES (n_5_id, 4, 'Unidad 4', 'Análisis dramático y exposiciones orales.')
    RETURNING id INTO u4_id;

    -- Asociar OAs a Unidad 1: OA 3, OA 4, OA 24, OA 27
    INSERT INTO public.unidad_oa (unidad_id, oa_id)
    SELECT u1_id, oa.id FROM public.objetivos_aprendizaje oa
    JOIN public.ejes e ON oa.eje_id = e.id
    WHERE e.nivel_id = n_5_id AND oa.codigo IN ('OA 3', 'OA 4', 'OA 24', 'OA 27');

    -- Asociar OAs a Unidad 2: OA 3, OA 4, OA 24, OA 26, OA 30
    INSERT INTO public.unidad_oa (unidad_id, oa_id)
    SELECT u2_id, oa.id FROM public.objetivos_aprendizaje oa
    JOIN public.ejes e ON oa.eje_id = e.id
    WHERE e.nivel_id = n_5_id AND oa.codigo IN ('OA 3', 'OA 4', 'OA 24', 'OA 26', 'OA 30');

    -- Asociar OAs a Unidad 3: OA 3, OA 4, OA 7, OA 15
    INSERT INTO public.unidad_oa (unidad_id, oa_id)
    SELECT u3_id, oa.id FROM public.objetivos_aprendizaje oa
    JOIN public.ejes e ON oa.eje_id = e.id
    WHERE e.nivel_id = n_5_id AND oa.codigo IN ('OA 3', 'OA 4', 'OA 7', 'OA 15');

    -- Asociar OAs a Unidad 4: OA 5, OA 29
    INSERT INTO public.unidad_oa (unidad_id, oa_id)
    SELECT u4_id, oa.id FROM public.objetivos_aprendizaje oa
    JOIN public.ejes e ON oa.eje_id = e.id
    WHERE e.nivel_id = n_5_id AND oa.codigo IN ('OA 5', 'OA 29');

  END IF;
END $$;
