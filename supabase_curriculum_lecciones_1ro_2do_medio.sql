-- ============================================================
-- MIGRACIÓN Y CARGA DE CURRÍCULUM: 1° Y 2° MEDIO LENGUA Y LITERATURA
-- ============================================================

-- NOTA: Para 1° y 2° Medio NO se modifican los títulos de curriculum_unidades para
-- preservar la información del marco oficial (1° Medio: Libertad, Ciudadanos,
-- Relaciones humanas, Sociedad; 2° Medio: Ausencia, Ciudadanía, Lo divino, Poder).

-- 1. Limpiar registros previos de lecciones de 1° y 2° Medio
DELETE FROM public.curriculum_lecciones 
WHERE unidad_id IN (
  SELECT id FROM public.curriculum_unidades 
  WHERE nivel IN ('1° Medio', '2° Medio')
);

-- ============================================================
-- 2. INSERTAR LAS 20 LECCIONES DE 1° MEDIO
-- ============================================================

-- Unidad 1: Caminos alternativos (Asociado a Unidad 1 de 1° Medio: "Libertad")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 1), 
   1, 'En la naturaleza', 'cosmovisión Mapuche, vínculo con el entorno, puntos de vista en ensayos', 
   ARRAY['OA 9', 'OA 21'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 1), 
   2, 'En la ciudad', 'motivaciones de personajes, cambios sociales por la electricidad', 
   ARRAY['OA 3', 'OA 8', 'OA 12'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 1), 
   3, 'En el camino de las soluciones', 'urgencia climática, soluciones basadas en la naturaleza', 
   ARRAY['OA 10', 'OA 15'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 1), 
   4, 'En lugares imaginarios', 'investigación sobre mundos ficticios, validez de la información', 
   ARRAY['OA 12', 'OA 21', 'OA 24'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 1), 
   5, 'En el camino de las redes', 'influencia de la tecnología/lo digital, producción de reportajes', 
   ARRAY['OA 12', 'OA 15', 'OA 17', 'OA 19'], ARRAY[]::TEXT[]);

-- Unidad 2: Un mundo en movimiento (Asociado a Unidad 2 de 1° Medio: "Ciudadanos")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 2), 
   1, 'El viaje personal', 'conflicto humano en género dramático, motivos para viajar', 
   ARRAY['OA 5', 'OA 21'], ARRAY['OA 6', 'OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 2), 
   2, 'La necesidad de movernos', 'historia de las migraciones, derecho a la movilidad', 
   ARRAY['OA 10', 'OA 11'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 2), 
   3, 'Ir y venir', 'lenguaje figurado en poemas sobre desplazamiento y partida', 
   ARRAY['OA 8', 'OA 21'], ARRAY['OA 4']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 2), 
   4, 'Idiomas en movimiento', 'evolución del español, préstamos lingüísticos', 
   ARRAY['OA 12', 'OA 21', 'OA 24'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 2), 
   5, 'El futuro en movimiento', 'futuro de las migraciones, microensayos de anticipación', 
   ARRAY['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 21'], ARRAY[]::TEXT[]);

-- Unidad 3: El impulso de narrar (Asociado a Unidad 3 de 1° Medio: "Relaciones humanas")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 3), 
   1, 'El don de la palabra', 'poder transformador de la narración, causas/consecuencias, intertextualidad', 
   ARRAY['OA 3', 'OA 8', 'OA 21'], ARRAY['OA 11', 'OA 22']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 3), 
   2, 'Todos somos narradores', 'la narración como práctica humana, construcción de identidad', 
   ARRAY['OA 9'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 3), 
   3, 'Una historia que nos mueva', 'storytelling y conciencia ambiental', 
   ARRAY['OA 10', 'OA 21'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 3), 
   4, 'Narradores orales', 'lenguas de pueblos originarios de Chile', 
   ARRAY['OA 10', 'OA 24'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 3), 
   5, 'Narrarnos a nosotros mismos', 'columnas de opinión, formas contemporáneas de contar historias', 
   ARRAY['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 21'], ARRAY[]::TEXT[]);

-- Unidad 4: Imaginar el futuro (Asociado a Unidad 4 de 1° Medio: "Sociedad")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 4), 
   1, 'Una mirada hacia el futuro', 'ciencia ficción, saltos temporales, impacto humano en la Tierra', 
   ARRAY['OA 3', 'OA 8', 'OA 21'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 4), 
   2, 'El futuro es hoy', 'robótica, IA, vínculo humano-máquina', 
   ARRAY['OA 3', 'OA 8', 'OA 19', 'OA 21'], ARRAY['OA 11']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 4), 
   3, 'Soluciones para el mañana', 'bancos de semillas, sustentabilidad, crisis alimentaria', 
   ARRAY['OA 10'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 4), 
   4, 'El futuro de los saberes ancestrales', 'vigencia de conocimientos de pueblos originarios y ciencia', 
   ARRAY['OA 12', 'OA 24'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '1° Medio' AND unidad_numero = 4), 
   5, 'El futuro posible', 'ensayos argumentativos sobre el futuro de la humanidad', 
   ARRAY['OA 9', 'OA 12', 'OA 14', 'OA 15'], ARRAY[]::TEXT[]);


-- ============================================================
-- 3. INSERTAR LAS 20 LECCIONES DE 2° MEDIO
-- ============================================================

-- Unidad 1: La ruta que tú caminas (Asociado a Unidad 1 de 2° Medio: "Ausencia")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 1), 
   1, 'El lugar de la partida', 'lugar de origen e identidad a través de la poesía', 
   ARRAY['OA 8', 'OA 21', 'OA 24'], ARRAY['OA 2', 'OA 4']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 1), 
   2, 'Viaje en el tiempo', 'figura materna, sueños, recuerdos, imaginación', 
   ARRAY['OA 3', 'OA 8', 'OA 19'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 1), 
   3, 'El idioma que vas hablando', 'la lengua como identidad cultural', 
   ARRAY['OA 24'], ARRAY['OA 22']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 1), 
   4, 'Caminos anchos y diversos', 'identidad cultural, ensayos argumentativos', 
   ARRAY['OA 9', 'OA 19'], ARRAY['OA 20']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 1), 
   5, 'Registros de mi andar', 'trayectoria vital propia, autobiografía', 
   ARRAY['OA 12', 'OA 15', 'OA 19'], ARRAY[]::TEXT[]);

-- Unidad 2: Quién dijo que todo está perdido (Asociado a Unidad 2 de 2° Medio: "Ciudadanía")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 2), 
   1, '¿Cuándo actuar?', 'conflictos sociales/bélicos (II Guerra Mundial), género dramático', 
   ARRAY['OA 5', 'OA 8', 'OA 12'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 2), 
   2, 'Intentando acercarnos', 'migración, inseguridad, adaptación en la narrativa contemporánea', 
   ARRAY['OA 3', 'OA 8'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 2), 
   3, 'Desafíos de ayer y hoy', 'locura, justicia, verdad en obras clásicas', 
   ARRAY['OA 8', 'OA 24'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 2), 
   4, 'Acción frente a la urgencia', 'microplásticos en Rapa Nui, reportajes', 
   ARRAY['OA 10', 'OA 19', 'OA 21'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 2), 
   5, 'Compromiso con el cambio', 'iniciativas contra contaminación/cambio climático, reportajes', 
   ARRAY['OA 15', 'OA 17', 'OA 19'], ARRAY[]::TEXT[]);

-- Unidad 3: Construyendo vínculos (Asociado a Unidad 3 de 2° Medio: "Lo divino")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 3), 
   1, '¿Individuos o prójimos?', 'dimensión social de la humanidad, ensayos filosóficos', 
   ARRAY['OA 9', 'OA 21'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 3), 
   2, 'Búsquedas y encuentros', 'soledad y conexión humana en cuentos contemporáneos', 
   ARRAY['OA 3', 'OA 8', 'OA 19'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 3), 
   3, 'Nuestra convivencia', 'posturas sobre convivencia social, ensayo', 
   ARRAY['OA 14', 'OA 15', 'OA 19'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 3), 
   4, 'Convivir desde la naturaleza', 'cosmovisión mapuche, relación con la tierra, poetas', 
   ARRAY['OA 10', 'OA 21', 'OA 2'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 3), 
   5, 'Visiones compartidas', 'movimientos literarios, búsquedas estéticas', 
   ARRAY['OA 11', 'OA 24', 'OA 2'], ARRAY[]::TEXT[]);

-- Unidad 4: Aquí estoy yo (Asociado a Unidad 4 de 2° Medio: "Poder")
INSERT INTO public.curriculum_lecciones (unidad_id, leccion_numero, titulo_leccion, temas, oa_basales, oa_complementarios)
VALUES 
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 4), 
   1, 'Con el horizonte en la mirada', 'motivaciones y dilemas de personajes en la novela', 
   ARRAY['OA 3', 'OA 8', 'OA 12'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 4), 
   2, 'Cada uno es como es', 'personajes redondos, investigación de figuras de interés', 
   ARRAY['OA 3', 'OA 8', 'OA 24'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 4), 
   3, 'Aprendiendo a vivir', 'relaciones humanas, prejuicios, transformación de personajes', 
   ARRAY['OA 3', 'OA 8', 'OA 21'], ARRAY['OA 2']),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 4), 
   4, 'Acciones que inspiran', 'discursos públicos, conciencia ambiental/social, economía circular', 
   ARRAY['OA 9', 'OA 19'], ARRAY[]::TEXT[]),
   
  ((SELECT id FROM public.curriculum_unidades WHERE nivel = '2° Medio' AND unidad_numero = 4), 
   5, 'Mis ideas cuentan', 'producción de discursos sobre ideas/creencias/valores propios', 
   ARRAY['OA 9', 'OA 12', 'OA 14', 'OA 15', 'OA 19'], ARRAY[]::TEXT[]);
