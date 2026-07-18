-- ============================================================
-- MIGRACIÓN Y CARGA DE CURRÍCULUM: 8° BÁSICO LENGUA Y LITERATURA
-- ============================================================

-- NOTA: Para 8° Básico NO se modifican los títulos de curriculum_unidades para
-- preservar la información del marco oficial (ej. 'Epopeya', 'Experiencias del amor',
-- 'Relatos de misterio', 'Naturaleza').

-- 1. Limpiar registros previos de lecciones de 8° Básico
DELETE FROM public.curriculum_lecciones 
WHERE unidad_id IN (
  SELECT id FROM public.curriculum_unidades 
  WHERE nivel = '8° Básico'
);

-- ============================================================
-- 2. INSERTAR LAS 16 LECCIONES DE 8° BÁSICO
-- ============================================================

-- Unidad 1: ¿Dónde empieza el amor? (Asociado a Unidad 1 de 8° Básico: "Epopeya")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 1), 
   1, 'En un instante mágico', 'amor romántico, leyenda de Tristán e Isolda, roles de género, personajes tipo', 
   ARRAY['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 13'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 1), 
   2, 'En un rincón cotidiano', 'amor propio, amistad como cuidado, "La última hoja"', 
   ARRAY['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 22'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 1), 
   3, 'Poemas (lección de investigación)', 'investigación sobre la visión del amor en la poesía y su contexto', 
   ARRAY['OA 4', 'OA 8', 'OA 25', 'OA 26'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 1), 
   4, 'Entrevista a Elisa Avendaño', 'comprensión de entrevistas, música ancestral Mapuche, hechos vs. opiniones', 
   ARRAY['OA 10', 'OA 14', 'OA 16', 'OA 18', 'OA 21'], ARRAY[]::TEXT[]);

-- Unidad 2: ¿Es todo como parece? (Asociado a Unidad 2 de 8° Básico: "Experiencias del amor")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 2), 
   1, 'Lo que no queremos ver', 'crítica al individualismo ("El ahogado"), montaje teatral', 
   ARRAY['OA 2', 'OA 5', 'OA 7', 'OA 8', 'OA 12'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 2), 
   2, 'Lo que debemos descifrar', 'relatos policiales, pensamiento analítico-deductivo, el detective', 
   ARRAY['OA 2', 'OA 3', 'OA 8', 'OA 11', 'OA 12', 'OA 13'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 2), 
   3, 'Lo que vemos distinto (lección de investigación)', 'microcuentos, investigación de campo con encuestas', 
   ARRAY['OA 8', 'OA 23', 'OA 25', 'OA 26'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 2), 
   4, 'Lo que nos quieren hacer creer', 'fake news, textos argumentativos, fuentes confiables', 
   ARRAY['OA 9', 'OA 15', 'OA 16', 'OA 22'], ARRAY[]::TEXT[]);

-- Unidad 3: ¿Qué queda del pasado? (Asociado a Unidad 3 de 8° Básico: "Relatos de misterio")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 3), 
   1, 'Aventuras que atraviesan el tiempo', 'narrativa épica (rey Arturo), fantasía épica (El Señor de los Anillos)', 
   ARRAY['OA 2', 'OA 3', 'OA 6', 'OA 12', 'OA 23'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 3), 
   2, 'Heroísmos revisitados (lección de investigación)', 'fidelidad histórica/literaria de películas vs. fuentes originales', 
   ARRAY['OA 6', 'OA 14', 'OA 21', 'OA 25', 'OA 26'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 3), 
   3, 'Historias de vidas y de pueblos', 'poesía sobre infancia y orígenes, autores chilenos y de pueblos originarios', 
   ARRAY['OA 2', 'OA 4', 'OA 8', 'OA 12', 'OA 24'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 3), 
   4, 'Saberes ancestrales', 'cultura Kawésqar, reportajes sobre pueblos indígenas', 
   ARRAY['OA 10', 'OA 14', 'OA 16', 'OA 20', 'OA 21', 'OA 22'], ARRAY[]::TEXT[]);

-- Unidad 4: ¿Hacia dónde va el futuro? (Asociado a Unidad 4 de 8° Básico: "Naturaleza")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 4), 
   1, 'Hacia un mundo distópico', 'mundos distópicos, naturaleza vs. tecnología, tiempo narrativo', 
   ARRAY['OA 2', 'OA 3', 'OA 8', 'OA 22'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 4), 
   2, 'Más allá de lo imaginado (lección de investigación)', 'novelas clásicas de ciencia ficción (Fahrenheit 451) y contexto', 
   ARRAY['OA 2', 'OA 8', 'OA 25', 'OA 26'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 4), 
   3, 'A donde anhelamos llegar', 'poesía esperanzadora del futuro, elementos sonoros del lenguaje lírico', 
   ARRAY['OA 2', 'OA 3', 'OA 8', 'OA 12', 'OA 13'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '8° Básico' AND unidad_numero = 4), 
   4, 'Construir un tiempo mejor', 'discursos públicos (Gloria Steinem, Michelle Obama), activismo climático en redes', 
   ARRAY['OA 9', 'OA 15', 'OA 16', 'OA 22'], ARRAY[]::TEXT[]);
