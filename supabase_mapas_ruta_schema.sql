-- ================================================================
-- DIDAKTA — MAPAS DE RUTA SCHEMA
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

CREATE TABLE IF NOT EXISTS public.mapas_ruta (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id         UUID        NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  asignatura       TEXT        NOT NULL DEFAULT 'Lenguaje y Comunicación',
  año              TEXT        NOT NULL DEFAULT '2026',
  n_estudiantes    INTEGER,
  distribucion_rti JSONB,                 -- e.g. {"n1": 30, "n2": 10, "n3": 5}
  unidades         JSONB       NOT NULL,  -- Array de 4 unidades
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT uq_mapa_ruta_curso UNIQUE (curso_id)
);

-- Habilitar RLS
ALTER TABLE public.mapas_ruta ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ────────────────────────────────────────────────
-- Access is granted when the parent curso belongs to the authenticated user.

CREATE POLICY "mapas_ruta: users select own via curso"
  ON public.mapas_ruta FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "mapas_ruta: users insert own via curso"
  ON public.mapas_ruta FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "mapas_ruta: users update own via curso"
  ON public.mapas_ruta FOR UPDATE
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

CREATE POLICY "mapas_ruta: users delete own via curso"
  ON public.mapas_ruta FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cursos c
      WHERE c.id = curso_id
        AND c.user_id = auth.uid()
    )
  );

-- ── Índices ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mapas_ruta_curso ON public.mapas_ruta (curso_id);
