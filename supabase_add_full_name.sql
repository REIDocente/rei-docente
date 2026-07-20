-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Agregar full_name a user_profiles
-- Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Agregar columna full_name a user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Poblar full_name para usuarios existentes desde auth.users metadata
UPDATE public.user_profiles up
SET full_name = au.raw_user_meta_data->>'full_name'
FROM auth.users au
WHERE up.id = au.id
  AND (au.raw_user_meta_data->>'full_name') IS NOT NULL
  AND (au.raw_user_meta_data->>'full_name') != '';

-- 3. Actualizar el trigger para que capture full_name al crear el perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, trial_started_at, full_name)
  VALUES (
    NEW.id,
    now(),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name
    WHERE public.user_profiles.full_name IS NULL;
  RETURN NEW;
END;
$$;
