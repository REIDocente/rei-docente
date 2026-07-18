-- ============================================================
-- DIDAKTA: MÓDULO DE JUEGOS REI — SCHEMA
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Tabla principal de juegos_rei ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.juegos_rei (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motor           TEXT        NOT NULL,
  nivel           TEXT,
  tema            TEXT,
  oa_codes        TEXT[]      NOT NULL DEFAULT '{}',
  duracion        INTEGER,
  modalidad       TEXT,
  dificultad      TEXT,
  contenido_json  JSONB       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Migración user_profiles (juegos_generated) ───────────────────────────────

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS juegos_generated INTEGER NOT NULL DEFAULT 0;

-- ── Actualizar RPC increment_usage_counter ───────────────────────────

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
    'evaluations_generated',
    'juegos_generated'
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

ALTER TABLE public.juegos_rei ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_propios_juegos"
  ON public.juegos_rei FOR ALL USING (auth.uid() = user_id);

-- ── Índices ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_juegos_rei_user
  ON public.juegos_rei (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_juegos_rei_motor
  ON public.juegos_rei (motor);
