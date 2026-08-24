-- Columnas faltantes en tablas existentes
ALTER TABLE analisis_evaluaciones
  ADD COLUMN IF NOT EXISTS asignatura TEXT,
  ADD COLUMN IF NOT EXISTS fecha_aplicacion DATE,
  ADD COLUMN IF NOT EXISTS claves_json JSONB,
  ADD COLUMN IF NOT EXISTS habilidades_json JSONB,
  ADD COLUMN IF NOT EXISTS respuestas_modelo_json JSONB,
  ADD COLUMN IF NOT EXISTS remediation_count INTEGER DEFAULT 0;

ALTER TABLE resultados_estudiantes
  ADD COLUMN IF NOT EXISTS numero_lista INTEGER,
  ADD COLUMN IF NOT EXISTS rut TEXT,
  ADD COLUMN IF NOT EXISTS respuestas_sm_json JSONB,
  ADD COLUMN IF NOT EXISTS respuestas_dev_json JSONB,
  ADD COLUMN IF NOT EXISTS informe_apoderado_texto TEXT;

-- Nueva tabla de cursos
CREATE TABLE IF NOT EXISTS cursos_docente (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  nivel TEXT NOT NULL,
  estudiantes_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cursos_docente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own cursos" ON cursos_docente;
CREATE POLICY "Users see own cursos"
  ON cursos_docente FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
