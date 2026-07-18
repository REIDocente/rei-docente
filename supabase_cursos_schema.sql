-- ==========================================
-- DIDAKTA — CURSOS & RECURSOS VISUALES SCHEMA
-- ==========================================
-- Instructions:
--   1. Run this script in your Supabase SQL Editor
--      (Dashboard → SQL Editor → New Query → paste → Run)
--   2. After running the SQL, create the Storage bucket manually:
--      Dashboard → Storage → New Bucket
--        Name:   recursos-visuales
--        Public: false   (keep private; images are served via signed URLs or
--                         the API proxying through Supabase Storage)
-- ==========================================

-- ─── TABLE: cursos ───────────────────────────────────────────────────────────
-- Standalone entity independent of asignatura.
-- A teacher can have multiple courses (e.g. "5° Básico A", "6° Básico B").

CREATE TABLE IF NOT EXISTS public.cursos (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT        NOT NULL,   -- e.g. "5° Básico A"
  nivel      TEXT        NOT NULL,   -- e.g. "5° Básico"
  seccion    TEXT,                   -- e.g. "A"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TABLE: horario_semanal ───────────────────────────────────────────────────
-- Weekly schedule: which days and how many blocks a course has for a subject.
-- Designed to scale for future subjects beyond Lenguaje y Comunicación.

CREATE TABLE IF NOT EXISTS public.horario_semanal (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id    UUID    NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  asignatura  TEXT    NOT NULL,  -- Phase 1: always "Lenguaje y Comunicación"
  dia_semana  TEXT    NOT NULL
              CHECK (dia_semana IN ('lunes','martes','miércoles','jueves','viernes')),
  n_bloques   INTEGER NOT NULL DEFAULT 1
              CHECK (n_bloques BETWEEN 1 AND 3),
  tipo_bloque TEXT    NOT NULL
              CHECK (tipo_bloque IN ('simple','doble','triple')),
  hora_inicio TEXT,   -- "08:30"
  hora_fin    TEXT    -- "10:00"
);

-- ─── TABLE: recursos_visuales ─────────────────────────────────────────────────
-- Generated visual resources (infographics, timelines, flashcards, posters).

CREATE TABLE IF NOT EXISTS public.recursos_visuales (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planning_id    UUID        REFERENCES public.plannings(id) ON DELETE SET NULL,
  tipo           TEXT        NOT NULL
                 CHECK (tipo IN ('infografia','linea_tiempo','flashcards','afiche')),
  tema           TEXT        NOT NULL,
  contenido_json JSONB,
  imagen_url     TEXT,        -- Supabase Storage public URL
  html_fallback  TEXT,        -- HTML/CSS fallback content
  prompt_imagen  TEXT,        -- Debug: prompt sent to image generation API
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE public.cursos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horario_semanal   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_visuales ENABLE ROW LEVEL SECURITY;

-- ── cursos RLS policies ──────────────────────────────────────────────────────

CREATE POLICY "cursos: users select own"
  ON public.cursos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cursos: users insert own"
  ON public.cursos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cursos: users update own"
  ON public.cursos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cursos: users delete own"
  ON public.cursos FOR DELETE
  USING (auth.uid() = user_id);

-- ── horario_semanal RLS policies ─────────────────────────────────────────────
-- Access is granted when the parent curso belongs to the authenticated user.

CREATE POLICY "horario: users select own via curso"
  ON public.horario_semanal FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "horario: users insert own via curso"
  ON public.horario_semanal FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "horario: users update own via curso"
  ON public.horario_semanal FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "horario: users delete own via curso"
  ON public.horario_semanal FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  );

-- ── recursos_visuales RLS policies ───────────────────────────────────────────

CREATE POLICY "recursos_visuales: users select own"
  ON public.recursos_visuales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recursos_visuales: users insert own"
  ON public.recursos_visuales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recursos_visuales: users update own"
  ON public.recursos_visuales FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recursos_visuales: users delete own"
  ON public.recursos_visuales FOR DELETE
  USING (auth.uid() = user_id);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cursos_user
  ON public.cursos (user_id);

CREATE INDEX IF NOT EXISTS idx_horario_curso
  ON public.horario_semanal (curso_id);

CREATE INDEX IF NOT EXISTS idx_recursos_user
  ON public.recursos_visuales (user_id);

CREATE INDEX IF NOT EXISTS idx_recursos_planning
  ON public.recursos_visuales (planning_id);
