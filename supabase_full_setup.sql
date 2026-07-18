-- ================================================================
-- DIDAKTA — SCHEMA COMPLETO
-- Proyecto: rei-docente
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
--
-- ORDEN DE EJECUCIÓN (no cambiar):
--   1. user_profiles + trigger + funciones RPC
--   2. plannings
--   3. cursos + horario_semanal
--   4. recursos_visuales
--   5. evaluaciones + banco_simce
--   6. guias
--   7. curriculum_oa + curriculum_unidades + curriculum_oat_actitudes
--   8. Todos los índices al final
-- ================================================================


-- ================================================================
-- SECCIÓN 1 — USER PROFILES (plan/trial + contadores de uso)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                              UUID        PRIMARY KEY
                                              REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_status                     TEXT        NOT NULL DEFAULT 'trial'
                                              CHECK (plan_status IN ('trial','active','expired')),
  trial_started_at                TIMESTAMPTZ DEFAULT now(),
  active_started_at               TIMESTAMPTZ DEFAULT NULL,
  last_cycle_start                TIMESTAMPTZ DEFAULT NULL,
  stripe_customer_id              TEXT,
  stripe_subscription_id          TEXT,

  planifications_generated        INTEGER     NOT NULL DEFAULT 0,  -- límite: 10
  presentations_generated         INTEGER     NOT NULL DEFAULT 0,  -- límite: 10
  images_generated                INTEGER     NOT NULL DEFAULT 0,  -- límite: 10 (inactivo)
  guides_generated                INTEGER     NOT NULL DEFAULT 0,  -- límite: 10
  gamified_activities_generated   INTEGER     NOT NULL DEFAULT 0,  -- inactivo
  visual_resources_generated      INTEGER     NOT NULL DEFAULT 0,  -- inactivo (unificado en presentations)
  evaluations_generated           INTEGER     NOT NULL DEFAULT 0,  -- límite: 6

  updated_at                      TIMESTAMPTZ DEFAULT now()
);

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

-- Trigger: crea la fila en user_profiles automáticamente cuando
-- un usuario se registra en auth.users
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

-- RPC: obtener o crear perfil de forma atómica (llamado desde la API)
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

-- RPC: incrementar contador de uso (validación en lista blanca incluida)
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


-- ================================================================
-- SECCIÓN 2 — PLANNINGS (planificaciones de clase)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.plannings (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject                 TEXT        NOT NULL,
  grade                   TEXT        NOT NULL,
  learning_objective      TEXT        NOT NULL,
  unit                    TEXT        NOT NULL,
  reference_url           TEXT,
  reference_document_name TEXT,
  content                 JSONB       NOT NULL,
  reading_level           JSONB       NOT NULL,
  curricular_summary      TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plannings_select_own"
  ON public.plannings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "plannings_insert_own"
  ON public.plannings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plannings_update_own"
  ON public.plannings FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plannings_delete_own"
  ON public.plannings FOR DELETE USING (auth.uid() = user_id);


-- ================================================================
-- SECCIÓN 3 — CURSOS + HORARIO SEMANAL
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cursos (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT        NOT NULL,   -- "5° Básico A"
  nivel      TEXT        NOT NULL,   -- "5° Básico"
  seccion    TEXT,                   -- "A"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.horario_semanal (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id    UUID    NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  asignatura  TEXT    NOT NULL,  -- "Lenguaje y Comunicación" en Fase 1
  dia_semana  TEXT    NOT NULL
              CHECK (dia_semana IN ('lunes','martes','miércoles','jueves','viernes')),
  n_bloques   INTEGER NOT NULL DEFAULT 1
              CHECK (n_bloques BETWEEN 1 AND 3),
  tipo_bloque TEXT    NOT NULL
              CHECK (tipo_bloque IN ('simple','doble','triple')),
  hora_inicio TEXT,   -- "08:30"
  hora_fin    TEXT    -- "10:00"
);

ALTER TABLE public.cursos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horario_semanal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursos_select_own"
  ON public.cursos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cursos_insert_own"
  ON public.cursos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cursos_update_own"
  ON public.cursos FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cursos_delete_own"
  ON public.cursos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "horario_select_own"
  ON public.horario_semanal FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cursos c
    WHERE c.id = curso_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "horario_insert_own"
  ON public.horario_semanal FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cursos c
    WHERE c.id = curso_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "horario_update_own"
  ON public.horario_semanal FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.cursos c
    WHERE c.id = curso_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "horario_delete_own"
  ON public.horario_semanal FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.cursos c
    WHERE c.id = curso_id AND c.user_id = auth.uid()
  ));


-- ================================================================
-- SECCIÓN 4 — RECURSOS VISUALES (infografías, timelines, etc.)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.recursos_visuales (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planning_id    UUID        REFERENCES public.plannings(id) ON DELETE SET NULL,
  tipo           TEXT        NOT NULL
                 CHECK (tipo IN ('infografia','linea_tiempo','flashcards','afiche')),
  tema           TEXT        NOT NULL,
  contenido_json JSONB,
  imagen_url     TEXT,        -- Supabase Storage URL
  html_fallback  TEXT,        -- fallback HTML/CSS si imagen falló
  prompt_imagen  TEXT,        -- prompt enviado a la API de imágenes (debug)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recursos_visuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recursos_visuales_select_own"
  ON public.recursos_visuales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recursos_visuales_insert_own"
  ON public.recursos_visuales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recursos_visuales_update_own"
  ON public.recursos_visuales FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recursos_visuales_delete_own"
  ON public.recursos_visuales FOR DELETE USING (auth.uid() = user_id);


-- ================================================================
-- SECCIÓN 5 — EVALUACIONES + BANCO SIMCE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel           TEXT        NOT NULL,
  eje             TEXT,
  oa_codes        TEXT[]      NOT NULL DEFAULT '{}',
  tipos           TEXT[]      NOT NULL,
    -- 'prueba' | 'tabla_especificaciones' | 'rubrica'
    -- 'autoevaluacion' | 'heteroevaluacion' | 'coevaluacion'
  titulo          TEXT,
  n_preguntas     INTEGER,
  duracion_min    INTEGER,
  dificultad      TEXT,       -- 'N1_basico' | 'N2_intermedio' | 'N3_avanzado' | 'mixto'
  contenido_json  JSONB       NOT NULL,
  simce_ensayo    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banco_simce (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel           TEXT        NOT NULL,
    -- '6° Básico' | '2° Medio'
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

ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_simce  ENABLE ROW LEVEL SECURITY;

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


-- ================================================================
-- SECCIÓN 6 — GUÍAS DE TRABAJO
-- ================================================================

CREATE TABLE IF NOT EXISTS public.guias (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nivel           TEXT        NOT NULL,
  eje             TEXT,
  oa_codes        TEXT[]      NOT NULL DEFAULT '{}',
  formato         TEXT        NOT NULL DEFAULT 'tradicional',
    -- 'tradicional' | 'narrativa'
  tema_narrativo  TEXT,
    -- 'caso' | 'mision' | 'expedicion' | 'desafio' | texto libre
    -- NULL cuando formato = 'tradicional'
  rti_nivel       TEXT        NOT NULL DEFAULT 'universal',
    -- 'universal' | 'dua' | 'pie'
  titulo          TEXT,
  contenido_json  JSONB       NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guias_select_own"
  ON public.guias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "guias_insert_own"
  ON public.guias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guias_update_own"
  ON public.guias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "guias_delete_own"
  ON public.guias FOR DELETE USING (auth.uid() = user_id);


-- ================================================================
-- SECCIÓN 7 — CURRICULUM OFICIAL (solo lectura, datos del MINEDUC)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_oa (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  asignatura  TEXT    NOT NULL DEFAULT 'Lenguaje',
  nivel       TEXT    NOT NULL,
    -- '5° Básico' | '6° Básico' | '7° Básico' | '8° Básico'
    -- '1° Medio'  | '2° Medio'
  ciclo       TEXT    NOT NULL,
    -- 'Bases Curriculares 2012' (5°-8° Básico)
    -- 'Bases Curriculares 2015' (1°-2° Medio)
  eje         TEXT    NOT NULL,
    -- 'Lectura' | 'Escritura' | 'Comunicación Oral'
    -- 'Investigación en Lenguaje y Literatura'
  codigo_oa   TEXT    NOT NULL,   -- 'OA 1', 'OA 14', etc.
  texto_oa    TEXT,               -- Texto completo (puede ser NULL)
  indicadores TEXT,               -- Indicadores de evaluación

  CONSTRAINT uq_curriculum_oa_nivel_codigo UNIQUE (nivel, codigo_oa)
);

CREATE TABLE IF NOT EXISTS public.curriculum_unidades (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel          TEXT    NOT NULL,
  unidad_numero  INT     NOT NULL,
  titulo_tema    TEXT,
  oa_codes       TEXT[]  NOT NULL,

  CONSTRAINT uq_curriculum_unidades_nivel_num UNIQUE (nivel, unidad_numero)
);

CREATE TABLE IF NOT EXISTS public.curriculum_oat_actitudes (
  id      UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel   TEXT  NOT NULL,
  tipo    TEXT  NOT NULL CHECK (tipo IN ('OAT','Actitud')),
  codigo  TEXT,
  texto   TEXT  NOT NULL
);

ALTER TABLE public.curriculum_oa            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_unidades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_oat_actitudes ENABLE ROW LEVEL SECURITY;

-- Lectura pública para cualquier usuario autenticado
CREATE POLICY "curriculum_oa_public_read"
  ON public.curriculum_oa FOR SELECT USING (true);
CREATE POLICY "curriculum_unidades_public_read"
  ON public.curriculum_unidades FOR SELECT USING (true);
CREATE POLICY "curriculum_oat_public_read"
  ON public.curriculum_oat_actitudes FOR SELECT USING (true);


-- ================================================================
-- SECCIÓN 8 — ÍNDICES
-- ================================================================

-- user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_status
  ON public.user_profiles (plan_status);

-- plannings
CREATE INDEX IF NOT EXISTS idx_plannings_user
  ON public.plannings (user_id, created_at DESC);

-- cursos / horario
CREATE INDEX IF NOT EXISTS idx_cursos_user
  ON public.cursos (user_id);
CREATE INDEX IF NOT EXISTS idx_horario_curso
  ON public.horario_semanal (curso_id);

-- recursos_visuales
CREATE INDEX IF NOT EXISTS idx_recursos_user
  ON public.recursos_visuales (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recursos_planning
  ON public.recursos_visuales (planning_id);

-- evaluaciones
CREATE INDEX IF NOT EXISTS idx_evaluaciones_user
  ON public.evaluaciones (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_nivel
  ON public.evaluaciones (nivel);
CREATE INDEX IF NOT EXISTS idx_banco_simce_user_nivel
  ON public.banco_simce (user_id, nivel);
CREATE INDEX IF NOT EXISTS idx_banco_simce_habilidad
  ON public.banco_simce (user_id, nivel, habilidad);

-- guias
CREATE INDEX IF NOT EXISTS idx_guias_user
  ON public.guias (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guias_formato
  ON public.guias (formato);

-- curriculum
CREATE INDEX IF NOT EXISTS idx_curriculum_oa_nivel_eje
  ON public.curriculum_oa (nivel, eje);
CREATE INDEX IF NOT EXISTS idx_curriculum_oa_nivel_codigo
  ON public.curriculum_oa (nivel, codigo_oa);
CREATE INDEX IF NOT EXISTS idx_curriculum_unidades_nivel
  ON public.curriculum_unidades (nivel);
CREATE INDEX IF NOT EXISTS idx_curriculum_oat_nivel
  ON public.curriculum_oat_actitudes (nivel, tipo);
