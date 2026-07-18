-- ============================================================
-- DIDAKTA: GENERADOR DE EVALUACIONES — SCHEMA + MIGRACIÓN
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Migración: nuevo contador en user_profiles ────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS evaluations_generated INTEGER NOT NULL DEFAULT 0;

-- Registra la nueva columna en la función increment_usage_counter (si existe)
-- La función ya acepta cualquier columna del ARRAY allowed_columns —
-- actualizar el array para incluir 'evaluations_generated':
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
  p_user_id UUID,
  p_column  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  allowed_columns TEXT[] := ARRAY[
    'planifications_generated',
    'presentations_generated',
    'images_generated',
    'guides_generated',
    'gamified_activities_generated',
    'visual_resources_generated',
    'evaluations_generated'
  ];
BEGIN
  IF NOT (p_column = ANY(allowed_columns)) THEN
    RAISE EXCEPTION 'Invalid counter column: %', p_column;
  END IF;

  EXECUTE format(
    'UPDATE public.user_profiles SET %I = %I + 1, updated_at = now() WHERE id = $1',
    p_column, p_column
  ) USING p_user_id;
END;
$$;

-- ── Tabla: evaluaciones generadas ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel           TEXT        NOT NULL,
  eje             TEXT,
  oa_codes        TEXT[]      NOT NULL DEFAULT '{}',
  tipos           TEXT[]      NOT NULL,
    -- Valores posibles: 'prueba' | 'tabla_especificaciones' | 'rubrica'
    --                   | 'autoevaluacion' | 'heteroevaluacion' | 'coevaluacion'
  titulo          TEXT,
  n_preguntas     INTEGER,
  duracion_min    INTEGER,
  dificultad      TEXT,       -- 'N1_basico' | 'N2_intermedio' | 'N3_avanzado' | 'mixto'
  contenido_json  JSONB       NOT NULL,
  simce_ensayo    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Tabla: banco de preguntas SIMCE acumulado (por docente) ───────────────────

CREATE TABLE IF NOT EXISTS public.banco_simce (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel           TEXT        NOT NULL,
    -- '6° Básico' | '2° Medio' — sin DEFAULT, el caller siempre especifica
  eje             TEXT,       -- 'Lectura' | 'Escritura'
  habilidad       TEXT,
    -- 6° Básico: 'comprensión_literal' | 'inferencial' | 'critica_valorativa'
    -- 2° Medio:  'comprensión_lectora' | 'producción_escrita' | 'manejo_idioma'
  texto_pregunta  TEXT        NOT NULL,
  alternativas    JSONB       NOT NULL,
    -- [{ "letra": "A", "texto": "...", "correcta": false }, ...]
  oa_code         TEXT,
  veces_usada     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.evaluaciones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_simce   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluaciones_select_own"
  ON public.evaluaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "evaluaciones_insert_own"
  ON public.evaluaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "evaluaciones_update_own"
  ON public.evaluaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "evaluaciones_delete_own"
  ON public.evaluaciones FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "banco_simce_select_own"
  ON public.banco_simce FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "banco_simce_insert_own"
  ON public.banco_simce FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "banco_simce_update_own"
  ON public.banco_simce FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "banco_simce_delete_own"
  ON public.banco_simce FOR DELETE USING (auth.uid() = user_id);

-- ── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_evaluaciones_user
  ON public.evaluaciones (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_nivel
  ON public.evaluaciones (nivel);
CREATE INDEX IF NOT EXISTS idx_banco_simce_user_nivel
  ON public.banco_simce (user_id, nivel);
CREATE INDEX IF NOT EXISTS idx_banco_simce_habilidad
  ON public.banco_simce (user_id, nivel, habilidad);
