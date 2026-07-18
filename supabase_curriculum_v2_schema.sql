-- ============================================================
-- DIDAKTA: SCHEMA CURRICULAR v2
-- Lenguaje y Comunicación / Literatura
-- 5°–8° Básico  +  1°–2° Medio
-- Ministerio de Educación de Chile
--
-- INSTRUCCIONES:
--   1. Abre el Editor SQL de Supabase.
--   2. Ejecuta primero el bloque de DROP (comentado abajo) SOLO si
--      quieres reemplazar un schema anterior.
--   3. Pega y ejecuta este script completo.
-- ============================================================

-- ── Limpieza opcional (descomentar si se reemplaza schema anterior) ──
-- DROP TABLE IF EXISTS public.curriculum_oat_actitudes CASCADE;
-- DROP TABLE IF EXISTS public.curriculum_unidades CASCADE;
-- DROP TABLE IF EXISTS public.curriculum_oa CASCADE;


-- ============================================================
-- TABLA 1: curriculum_oa
-- Un OA por fila. Incluye texto e indicadores de evaluación.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.curriculum_oa (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  asignatura  TEXT    NOT NULL DEFAULT 'Lenguaje',
  nivel       TEXT    NOT NULL,
    -- '5° Básico' | '6° Básico' | '7° Básico' | '8° Básico'
    -- '1° Medio'  | '2° Medio'
  ciclo       TEXT    NOT NULL,
    -- 'Bases Curriculares 2012' (5°–8° Básico)
    -- 'Bases Curriculares 2015' (1°–2° Medio)
  eje         TEXT    NOT NULL,
    -- 'Lectura' | 'Escritura' | 'Comunicación Oral'
    -- 'Investigación en Lenguaje y Literatura'
  codigo_oa   TEXT    NOT NULL,
    -- 'OA 1', 'OA 14', etc.
  texto_oa    TEXT,
    -- Texto completo del OA. Puede ser NULL si aún no se verificó.
  indicadores TEXT,
    -- Indicadores de evaluación, separados por salto de línea o en JSON.

  CONSTRAINT uq_curriculum_oa_nivel_codigo UNIQUE (nivel, codigo_oa)
);

-- ============================================================
-- TABLA 2: curriculum_unidades
-- Agrupa los OA en unidades anuales por nivel.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.curriculum_unidades (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel          TEXT    NOT NULL,
  unidad_numero  INT     NOT NULL,
  titulo_tema    TEXT,
    -- 7°–8° Básico y 1°–2° Medio: título literario de la unidad
    -- 5°–6° Básico: puede ser NULL
  oa_codes       TEXT[]  NOT NULL,
    -- Array de códigos, ej. ARRAY['OA 1','OA 3','OA 7','OA 14']
    -- Los códigos referencian curriculum_oa.codigo_oa para el mismo nivel

  CONSTRAINT uq_curriculum_unidades_nivel_num UNIQUE (nivel, unidad_numero)
);

-- ============================================================
-- TABLA 3: curriculum_oat_actitudes
-- OAT (Objetivos de Aprendizaje Transversales) y Actitudes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.curriculum_oat_actitudes (
  id      UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel   TEXT  NOT NULL,
  tipo    TEXT  NOT NULL CHECK (tipo IN ('OAT', 'Actitud')),
  codigo  TEXT,
    -- Para Actitudes: letra (a, b, c, ...)
    -- Para OAT: nombre de la dimensión (ej. 'Dimensión cognitiva')
  texto   TEXT  NOT NULL
);

-- ============================================================
-- RLS — Lectura pública (solo SELECT), sin escritura desde cliente
-- ============================================================

ALTER TABLE public.curriculum_oa           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_unidades     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_oat_actitudes ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado o anónimo puede leer
CREATE POLICY "curriculum_oa_public_read"
  ON public.curriculum_oa FOR SELECT USING (true);

CREATE POLICY "curriculum_unidades_public_read"
  ON public.curriculum_unidades FOR SELECT USING (true);

CREATE POLICY "curriculum_oat_public_read"
  ON public.curriculum_oat_actitudes FOR SELECT USING (true);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_curriculum_oa_nivel_eje
  ON public.curriculum_oa (nivel, eje);

CREATE INDEX IF NOT EXISTS idx_curriculum_oa_nivel_codigo
  ON public.curriculum_oa (nivel, codigo_oa);

CREATE INDEX IF NOT EXISTS idx_curriculum_unidades_nivel
  ON public.curriculum_unidades (nivel);

CREATE INDEX IF NOT EXISTS idx_curriculum_oat_nivel
  ON public.curriculum_oat_actitudes (nivel, tipo);

-- ============================================================
-- NOTA: Datos (seed)
-- Los datos se cargan en un script separado:
--   supabase_curriculum_v2_seed.sql
-- ============================================================
