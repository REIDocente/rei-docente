-- ============================================================
-- MIGRACIÓN Y CARGA DE CURRÍCULUM: 6° Y 7° BÁSICO LENGUAJE
-- ============================================================

-- 1. Actualizar nombres/títulos de las unidades de 6° Básico solamente (estaban vacíos/null)
UPDATE public.curriculum_unidades 
SET titulo_tema = 'El poder de la aventura, la imaginación y la creatividad' 
WHERE nivel = '6° Básico' AND unidad_numero = 1;

UPDATE public.curriculum_unidades 
SET titulo_tema = 'El medioambiente y su protección' 
WHERE nivel = '6° Básico' AND unidad_numero = 2;

UPDATE public.curriculum_unidades 
SET titulo_tema = 'El ser humano y su vínculo con el cosmos' 
WHERE nivel = '6° Básico' AND unidad_numero = 3;

UPDATE public.curriculum_unidades 
SET titulo_tema = 'Respetar las diferencias y la igualdad de derechos' 
WHERE nivel = '6° Básico' AND unidad_numero = 4;

-- NOTA: Para 7° Básico NO se modifican los títulos de curriculum_unidades para
-- preservar la información del marco oficial (ej. 'El héroe en distintas épocas', etc.).

-- 2. Limpiar registros previos de lecciones de 6° y 7° Básico
DELETE FROM public.curriculum_lecciones 
WHERE unidad_id IN (
  SELECT id FROM public.curriculum_unidades 
  WHERE nivel IN ('6° Básico', '7° Básico')
);

-- ============================================================
-- 3. INSERTAR LAS 11 LECCIONES DE 6° BÁSICO
-- ============================================================

-- Unidad 1: El poder de la aventura, la imaginación y la creatividad
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 1), 
   1, 'Juegos e imaginación', 'importancia de la imaginación y el juego en el aprendizaje', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 27'], ARRAY['OA 2', 'OA 12', 'OA 13']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 1), 
   2, 'Creatividad e innovación', 'ideas innovadoras, reciclaje creativo, cuidado del medioambiente', 
   ARRAY['OA 1', 'OA 6', 'OA 7', 'OA 24', 'OA 27'], ARRAY['OA 12', 'OA 13']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 1), 
   3, 'Aventuras y viajes en el tiempo', 'relatos de historias y aventuras en distintas épocas', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 14', 'OA 27'], ARRAY['OA 2', 'OA 13', 'OA 19']);

-- Unidad 2: El medioambiente y su protección
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 2), 
   4, 'El ser humano y la naturaleza', 'relación hombre-naturaleza, cuidado del entorno', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 5', 'OA 6', 'OA 7', 'OA 27'], ARRAY['OA 2', 'OA 12', 'OA 13']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 2), 
   5, 'La conservación de la biodiversidad', 'biodiversidad en distintas culturas, activismo ambiental', 
   ARRAY['OA 6', 'OA 7', 'OA 11', 'OA 24', 'OA 27', 'OA 29'], ARRAY['OA 8', 'OA 10', 'OA 13', 'OA 17', 'OA 20']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 2), 
   6, 'Conectándonos con la naturaleza', 'sensaciones del contacto con la naturaleza, beneficios del deporte al aire libre', 
   ARRAY['OA 1', 'OA 3', 'OA 5', 'OA 6', 'OA 7', 'OA 11', 'OA 15', 'OA 18', 'OA 27'], ARRAY['OA 2', 'OA 8', 'OA 12', 'OA 16']);

-- Unidad 3: El ser humano y su vínculo con el cosmos
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 3), 
   7, 'Investigando el universo', 'misterios del universo, divulgación científica', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 6', 'OA 7', 'OA 27'], ARRAY['OA 2', 'OA 8', 'OA 12', 'OA 13']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 3), 
   8, 'Distintas creencias sobre el cielo', 'cosmogonías de Pueblos Originarios, eclipses', 
   ARRAY['OA 1', 'OA 6', 'OA 7', 'OA 24', 'OA 27'], ARRAY['OA 12', 'OA 13']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 3), 
   9, 'Historias de vida', 'relatos de vida, transmisión de creencias generacional', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 11', 'OA 14', 'OA 24', 'OA 27'], ARRAY['OA 2', 'OA 13', 'OA 19', 'OA 23']);

-- Unidad 4: Respetar las diferencias y la igualdad de derechos
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 4), 
   10, 'Somos iguales', 'sociedades antiguas, rol de la mujer, equidad', 
   ARRAY['OA 1', 'OA 3', 'OA 4', 'OA 7', 'OA 27'], ARRAY['OA 2', 'OA 12', 'OA 13']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '6° Básico' AND unidad_numero = 4), 
   11, 'Mujeres activistas', 'activismo, participación femenina en acción climática', 
   ARRAY['OA 1', 'OA 6', 'OA 7', 'OA 11', 'OA 18', 'OA 24', 'OA 27'], ARRAY['OA 8', 'OA 10', 'OA 12', 'OA 13', 'OA 17', 'OA 20']);


-- ============================================================
-- 4. INSERTAR LAS 16 LECCIONES DE 7° BÁSICO
-- ============================================================

-- Unidad 1: ¿Qué me hace sentir bien? (Asociado a Unidad 1 de 7° Básico)
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 1), 
   1, 'Tener un amigo', 'amistad, vínculos, compromiso, IA en la ciencia ficción', 
   ARRAY['OA 3', 'OA 7', 'OA 9', 'OA 20', 'OA 21'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 1), 
   2, 'Confiar y compartir', 'resiliencia, empatía, diálogo, superación de obstáculos', 
   ARRAY['OA 3', 'OA 7', 'OA 9', 'OA 20', 'OA 21'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 1), 
   3, 'Expresar mi interior', 'experiencia personal en la creación literaria, investigación biográfica', 
   ARRAY['OA 7', 'OA 14', 'OA 24'], ARRAY['OA 4', 'OA 10', 'OA 25']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 1), 
   4, 'Trabajar por mis metas', 'esfuerzo, metas, reportajes, textos periodísticos', 
   ARRAY['OA 9', 'OA 21'], ARRAY['OA 13', 'OA 15', 'OA 16']);

-- Unidad 2: ¿Cómo construimos comunidad? (Asociado a Unidad 2 de 7° Básico)
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 2), 
   1, 'Respetando mis derechos y los tuyos', 'defensa de derechos, perseverancia, igualdad en el deporte, masculinización del fútbol', 
   ARRAY['OA 3', 'OA 7', 'OA 9', 'OA 21'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 2), 
   2, 'Con todos los sentimientos', 'identidad propia, vínculo con orígenes/territorio, música y comunidad', 
   ARRAY[]::TEXT[], ARRAY['OA 10', 'OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 2), 
   3, 'Conociendo relatos ancestrales', 'relatos tradicionales, cosmovisión y valores del pueblo Aymara', 
   ARRAY['OA 3', 'OA 24'], ARRAY['OA 25']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 2), 
   4, 'Apoyándonos mutuamente', 'igualdad de género, corresponsabilidad, textos argumentativos', 
   ARRAY['OA 8', 'OA 14'], ARRAY['OA 15']);

-- Unidad 3: Somos naturaleza (Asociado a Unidad 3 de 7° Básico)
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 3), 
   1, 'Con el océano y sus habitantes', 'responsabilidad sobre el entorno, historia de balleneras, preservación de fauna marina', 
   ARRAY['OA 3', 'OA 7', 'OA 20'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 3), 
   2, 'En nuevos territorios', 'adaptación al cambio, carrera espacial, colonización de Marte en ciencia ficción', 
   ARRAY['OA 3', 'OA 7', 'OA 21'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 3), 
   3, 'En la creación literaria', 'la naturaleza en la poesía, evaluación de fuentes de investigación', 
   ARRAY['OA 7', 'OA 24'], ARRAY['OA 4', 'OA 10', 'OA 25']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 3), 
   4, 'Protegiendo los espacios naturales', 'conservación de humedales, cartas al director sobre problemas ambientales', 
   ARRAY['OA 9', 'OA 14'], ARRAY['OA 15', 'OA 17']);

-- Unidad 4: ¿Qué nos cuenta el mundo? (Asociado a Unidad 4 de 7° Básico)
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 4), 
   1, 'Historias del pasado', 'patrimonio cultural, hechos históricos en la poesía, literatura como fuente histórica', 
   ARRAY['OA 7', 'OA 21'], ARRAY['OA 2', 'OA 4', 'OA 5', 'OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 4), 
   2, 'La visión popular', 'lira popular, décimas, medio de información y crítica social', 
   ARRAY['OA 24'], ARRAY['OA 2', 'OA 5', 'OA 10', 'OA 25']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 4), 
   3, 'Mentiras y verdades', 'confiabilidad de información en internet, fake news', 
   ARRAY['OA 9', 'OA 21'], ARRAY['OA 20']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '7° Básico' AND unidad_numero = 4), 
   4, 'Representaciones de vida', 'discurso publicitario, estereotipos, prejuicios, debate', 
   ARRAY['OA 8', 'OA 9', 'OA 21'], ARRAY['OA 17', 'OA 19', 'OA 22']);
