-- Modificaciones a la tabla user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS nombre_completo TEXT,
  ADD COLUMN IF NOT EXISTS establecimiento TEXT,
  ADD COLUMN IF NOT EXISTS establecimiento_tipo TEXT,
  ADD COLUMN IF NOT EXISTS comuna TEXT,
  ADD COLUMN IF NOT EXISTS asignatura_principal TEXT,
  ADD COLUMN IF NOT EXISTS horario_docente_json JSONB,
  ADD COLUMN IF NOT EXISTS perfil_completado BOOLEAN DEFAULT false;
