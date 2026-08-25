-- Tabla principal del análisis
CREATE TABLE IF NOT EXISTS analisis_evaluaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  nivel TEXT NOT NULL,
  establecimiento TEXT,
  nombre_docente TEXT,
  n_preguntas_sm INTEGER DEFAULT 0,
  n_preguntas_desarrollo INTEGER DEFAULT 0,
  pauta_json JSONB NOT NULL,
  tabla_especificaciones_json JSONB,
  rubrica_json JSONB,
  plan_mejora_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE analisis_evaluaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own analisis" ON analisis_evaluaciones;
CREATE POLICY "Users see own analisis"
  ON analisis_evaluaciones FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Resultados por estudiante
CREATE TABLE IF NOT EXISTS resultados_estudiantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analisis_id UUID REFERENCES analisis_evaluaciones(id) ON DELETE CASCADE NOT NULL,
  nombre_estudiante TEXT NOT NULL,
  respuestas_json JSONB NOT NULL,
  puntaje_sm INTEGER DEFAULT 0,
  puntaje_desarrollo INTEGER DEFAULT 0,
  puntaje_total INTEGER DEFAULT 0,
  porcentaje_logro NUMERIC(5,2) DEFAULT 0,
  nota NUMERIC(3,1) DEFAULT 1.0
);

ALTER TABLE resultados_estudiantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own resultados" ON resultados_estudiantes;
CREATE POLICY "Users see own resultados"
  ON resultados_estudiantes FOR ALL
  USING (
    analisis_id IN (
      SELECT id FROM analisis_evaluaciones WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    analisis_id IN (
      SELECT id FROM analisis_evaluaciones WHERE user_id = auth.uid()
    )
  );

-- Tabla para contadores trial genéricos (si no existe)
CREATE TABLE IF NOT EXISTS usage_counters (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL,
  count INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (user_id, feature)
);

ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own counters" ON usage_counters;
CREATE POLICY "Users see own counters"
  ON usage_counters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inicializar contador trial para análisis para usuarios existentes
INSERT INTO usage_counters (user_id, feature, count)
SELECT id, 'analisis', 0 FROM auth.users
ON CONFLICT DO NOTHING;
