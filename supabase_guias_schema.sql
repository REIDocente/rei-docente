-- ============================================================
-- DIDAKTA: MÓDULO DE GUÍAS — SCHEMA
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Tabla principal de guías ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guias (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel           TEXT        NOT NULL,
  eje             TEXT,
  oa_codes        TEXT[]      NOT NULL DEFAULT '{}',
  formato         TEXT        NOT NULL DEFAULT 'tradicional',
    -- 'tradicional' | 'narrativa'
  tema_narrativo  TEXT,
    -- 'caso' | 'mision' | 'expedicion' | 'desafio' | texto libre (personalizado)
    -- NULL cuando formato = 'tradicional'
  rti_nivel       TEXT        NOT NULL DEFAULT 'universal',
    -- 'universal' | 'dua' | 'pie'
  titulo          TEXT,
  contenido_json  JSONB       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Migración user_profiles (idempotente — puede ya existir el campo) ─────────

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS guides_generated INTEGER NOT NULL DEFAULT 0;

-- ── Actualizar RPC increment_usage_counter (agrega guides_generated) ──────────

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

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.guias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guias_select_own"
  ON public.guias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "guias_insert_own"
  ON public.guias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guias_update_own"
  ON public.guias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "guias_delete_own"
  ON public.guias FOR DELETE USING (auth.uid() = user_id);

-- ── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_guias_user
  ON public.guias (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guias_nivel
  ON public.guias (nivel);
CREATE INDEX IF NOT EXISTS idx_guias_formato
  ON public.guias (formato);
