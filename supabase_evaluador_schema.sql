-- ==========================================================================
-- REÍ DOCENTE — MÓDULO EVALUADOR IA
-- Esquema de Base de Datos para Supabase
-- ==========================================================================

-- 1. ESTUDIANTES (se registran una vez al año por curso)
CREATE TABLE IF NOT EXISTS public.estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rut TEXT,
  numero_lista INT NOT NULL, -- 1, 2, 3... identifica al estudiante en la hoja
  curso TEXT NOT NULL, -- "8°A"
  anno_escolar INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVALUACIONES
CREATE TABLE IF NOT EXISTS public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  curso TEXT NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  total_alternativas INT NOT NULL DEFAULT 0,
  total_desarrollo INT NOT NULL DEFAULT 0,
  puntaje_total INT DEFAULT 0, -- calculado automáticamente
  estado TEXT DEFAULT 'borrador', -- 'borrador' | 'activa' | 'corregida'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PREGUNTAS DE LA EVALUACIÓN (vinculadas al currículo)
CREATE TABLE IF NOT EXISTS public.preguntas_evaluacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  tipo TEXT NOT NULL, -- 'alternativa' | 'desarrollo'
  respuesta_correcta TEXT, -- 'A', 'B', 'C', 'D' (solo para alternativas)
  oa_id INTEGER REFERENCES public.objetivos_aprendizaje(id) ON DELETE SET NULL,
  oa_codigo TEXT, -- ej: "OA 4"
  habilidad TEXT, -- 'literal' | 'inferencial' | 'interpretativo' | 'argumentativo'
  puntaje_maximo INT NOT NULL DEFAULT 1,
  criterios_rubrica JSONB -- [{criterio: "Identifica tesis", puntos: 1}, ...]
);

-- 4. RESULTADOS POR ESTUDIANTE
CREATE TABLE IF NOT EXISTS public.resultados_estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE SET NULL,
  respuestas_alternativas JSONB DEFAULT '{}'::jsonb, -- {"1": {"respuesta": "B", "estado": "ok"}, ...}
  puntajes_desarrollo JSONB DEFAULT '{}'::jsonb, -- {"31": 3, "32": 1}
  puntaje_alternativas INT DEFAULT 0,
  puntaje_desarrollo INT DEFAULT 0,
  puntaje_total INT DEFAULT 0,
  porcentaje FLOAT DEFAULT 0.0,
  nivel_logro TEXT DEFAULT 'Inicio', -- 'Logrado' | 'En proceso' | 'Inicio'
  imagen_url TEXT, -- URL foto en Supabase Storage
  procesado_omr BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ANÁLISIS DEL CURSO (generado después de corregir todo el curso)
CREATE TABLE IF NOT EXISTS public.analisis_curso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  resultados_por_habilidad JSONB DEFAULT '{}'::jsonb, 
  -- {"literal": 0.78, "inferencial": 0.42, "interpretativo": 0.51, "argumentativo": 0.38}
  resultados_por_oa JSONB DEFAULT '{}'::jsonb,
  -- {"oa_id_xxx": {"logro": 0.54, "n_correctas": 24, "n_total": 45}}
  rti_nivel1 JSONB DEFAULT '[]'::jsonb, -- [estudiante_ids] -- refuerzo curso completo (<70%)
  rti_nivel2 JSONB DEFAULT '[]'::jsonb, -- [estudiante_ids] -- grupo apoyo adicional (<60%)
  rti_nivel3 JSONB DEFAULT '[]'::jsonb, -- [estudiante_ids] -- intervención específica (<40%)
  plan_refuerzo TEXT, -- generado por Claude Sonnet
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SEGUIMIENTO (antes vs después del refuerzo)
CREATE TABLE IF NOT EXISTS public.seguimiento_aprendizaje (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso TEXT NOT NULL,
  habilidad TEXT NOT NULL,
  evaluacion_inicial_id UUID REFERENCES public.evaluaciones(id) ON DELETE SET NULL,
  evaluacion_seguimiento_id UUID REFERENCES public.evaluaciones(id) ON DELETE SET NULL,
  logro_inicial FLOAT DEFAULT 0.0,
  logro_seguimiento FLOAT DEFAULT 0.0,
  diferencia FLOAT DEFAULT 0.0, -- calculado: logro_seguimiento - logro_inicial
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimiento_aprendizaje ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────
-- POLÍTICAS RLS POR DOCENTE
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Estudiantes
CREATE POLICY "Docente gestiona sus estudiantes" ON public.estudiantes
  FOR ALL USING (auth.uid() = docente_id) WITH CHECK (auth.uid() = docente_id);

-- 2. Evaluaciones
CREATE POLICY "Docente gestiona sus evaluaciones" ON public.evaluaciones
  FOR ALL USING (auth.uid() = docente_id) WITH CHECK (auth.uid() = docente_id);

-- 3. Preguntas de Evaluacion
CREATE POLICY "Docente gestiona preguntas de sus evaluaciones" ON public.preguntas_evaluacion
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluaciones e 
      WHERE e.id = preguntas_evaluacion.evaluacion_id AND e.docente_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluaciones e 
      WHERE e.id = preguntas_evaluacion.evaluacion_id AND e.docente_id = auth.uid()
    )
  );

-- 4. Resultados Estudiantes
CREATE POLICY "Docente gestiona resultados de sus evaluaciones" ON public.resultados_estudiantes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluaciones e 
      WHERE e.id = resultados_estudiantes.evaluacion_id AND e.docente_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluaciones e 
      WHERE e.id = resultados_estudiantes.evaluacion_id AND e.docente_id = auth.uid()
    )
  );

-- 5. Análisis Curso
CREATE POLICY "Docente gestiona analisis de sus evaluaciones" ON public.analisis_curso
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.evaluaciones e 
      WHERE e.id = analisis_curso.evaluacion_id AND e.docente_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluaciones e 
      WHERE e.id = analisis_curso.evaluacion_id AND e.docente_id = auth.uid()
    )
  );

-- 6. Seguimiento Aprendizaje
CREATE POLICY "Docente gestiona sus seguimientos" ON public.seguimiento_aprendizaje
  FOR ALL USING (auth.uid() = docente_id) WITH CHECK (auth.uid() = docente_id);

-- ─────────────────────────────────────────────────────────────────────────
-- ÍNDICES DE RENDIMIENTO
-- ─────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_estudiantes_docente_curso ON public.estudiantes(docente_id, curso);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_docente ON public.evaluaciones(docente_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_evaluacion_eval ON public.preguntas_evaluacion(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_resultados_eval_estudiante ON public.resultados_estudiantes(evaluacion_id, estudiante_id);
CREATE INDEX IF NOT EXISTS idx_analisis_eval ON public.analisis_curso(evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_seguimiento_docente_curso ON public.seguimiento_aprendizaje(docente_id, curso);
