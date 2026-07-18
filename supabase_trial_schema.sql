-- ======================================================================
-- DIDAKTA — SISTEMA DE TRIAL Y CONTADORES DE USO
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ======================================================================
-- Agrega la tabla user_profiles con el sistema de plan/trial y contadores
-- de generación para los 5 tipos de material:
--   1. planifications_generated (planificaciones)
--   2. presentations_generated  (presentaciones)
--   3. images_generated         (imágenes)
--   4. guides_generated         (guías)
--   5. gamified_activities_generated (actividades gamificadas)
--   6. visual_resources_generated   (Generador Visual Educativo)
-- ======================================================================

-- ── Tabla de perfiles (una fila por usuario) ──────────────────────────

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                             UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_status                    TEXT    NOT NULL DEFAULT 'trial'
                                   CHECK (plan_status IN ('trial', 'active', 'expired')),
  trial_started_at               TIMESTAMPTZ DEFAULT now(),
  active_started_at              TIMESTAMPTZ DEFAULT NULL,
  last_cycle_start               TIMESTAMPTZ DEFAULT NULL,
  stripe_customer_id             TEXT,
  stripe_subscription_id         TEXT,

  -- Contadores independientes por tipo de material
  planifications_generated       INTEGER NOT NULL DEFAULT 0,
  presentations_generated        INTEGER NOT NULL DEFAULT 0,
  images_generated               INTEGER NOT NULL DEFAULT 0,
  guides_generated               INTEGER NOT NULL DEFAULT 0,
  gamified_activities_generated  INTEGER NOT NULL DEFAULT 0,
  visual_resources_generated     INTEGER NOT NULL DEFAULT 0,

  updated_at                     TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Auto-create profile on new user signup ────────────────────────────
-- (Optional but recommended: create profile automatically on signup)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, trial_started_at)
  VALUES (NEW.id, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Index ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_status ON public.user_profiles (plan_status);

-- ── Helper: get or create profile ─────────────────────────────────────
-- Called by the API via RPC to atomically get-or-create the profile row

CREATE OR REPLACE FUNCTION public.get_or_create_profile(p_user_id UUID)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  profile public.user_profiles;
BEGIN
  INSERT INTO public.user_profiles (id, trial_started_at)
  VALUES (p_user_id, now())
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO profile FROM public.user_profiles WHERE id = p_user_id;
  RETURN profile;
END;
$$;

-- ── Helper: atomic counter increment ─────────────────────────────────
-- p_column must be a valid counter column name (validated by CHECK constraint
-- on the INSERT above; here we use dynamic SQL safely for the UPDATE).

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
    'visual_resources_generated'
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

-- ── NOTE ─────────────────────────────────────────────────────────────

-- Limits per trial (enforced in the API, not here):
--   planifications_generated       < 10
--   presentations_generated        < 10 (cubre todos los formatos del módulo Presentaciones)
--   evaluations_generated          < 6
--   guides_generated               < 5
--   (images_generated, gamified_activities_generated y visual_resources_generated no están activos como topes independientes)
-- Trial duration: 7 days from trial_started_at
-- All limits are independent: hitting one does not block the others.
