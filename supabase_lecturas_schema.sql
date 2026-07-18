-- ============================================================
-- DIDAKTA: MÓDULO DE LECTURAS DOMICILIARIAS — SCHEMA
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Biblioteca compartida de libros (reutilizable entre todos los docentes) ──

CREATE TABLE IF NOT EXISTS public.biblioteca_libros (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo                TEXT NOT NULL,
  autor                 TEXT,
  genero                TEXT,
  cursos_sugeridos      TEXT[],
  resumen               TEXT,
  personajes            JSONB,   -- [{nombre, descripcion, rol, relaciones}]
  temas                 TEXT[],
  conflictos            TEXT[],
  simbolos              TEXT[],
  vocabulario           JSONB,   -- [{palabra, definicion}]
  estructura_narrativa  TEXT,    -- tipo de narrador, punto de vista, lineal/no lineal
  contexto_historico    TEXT,
  valores_mensajes      TEXT[],
  fragmentos_clave      TEXT[],  -- 5 citas importantes
  oa_sugeridos          TEXT[],
  preguntas_literales   TEXT[],
  preguntas_inferenciales TEXT[],
  preguntas_criticas    TEXT[],
  experiencias_sugeridas TEXT[],
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── Proyectos personales del docente (privados) ──

CREATE TABLE IF NOT EXISTS public.lecturas_docente (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  libro_id        UUID REFERENCES public.biblioteca_libros(id),
  titulo_manual   TEXT,   -- si el docente escribe el título sin que exista en biblioteca
  granularidad    TEXT,   -- 'completo', 'capitulos', 'paginas', 'fragmento'
  rango_inicio    TEXT,   -- ej: '1', 'capítulo 3', 'página 45'
  rango_fin       TEXT,
  analisis_raw    TEXT,   -- texto completo pegado desde NotebookLM
  observaciones   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Migración user_profiles (lecturas_generated) ──

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS lecturas_generated INTEGER NOT NULL DEFAULT 0;

-- ── Actualizar RPC increment_usage_counter (agrega lecturas_generated) ──

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
    'juegos_generated',
    'lecturas_generated'
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

-- ── RLS ──

ALTER TABLE public.biblioteca_libros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica" ON public.biblioteca_libros
  FOR SELECT USING (true);

CREATE POLICY "insertar_libros" ON public.biblioteca_libros
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.lecturas_docente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propias_lecturas" ON public.lecturas_docente
  FOR ALL USING (auth.uid() = user_id);

-- ── Índices ──

CREATE INDEX IF NOT EXISTS idx_biblioteca_titulo ON public.biblioteca_libros (titulo);
CREATE INDEX IF NOT EXISTS idx_lecturas_user ON public.lecturas_docente (user_id, created_at DESC);
