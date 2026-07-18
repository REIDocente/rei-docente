-- =================================================================
-- DIDAKTA — VALIDACIÓN DE LÍMITE DE DOCENTES EN PRUEBA (MÁXIMO 5)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- =================================================================

-- 1. Función RPC pública para contar perfiles desde el cliente (bypasseando RLS)
CREATE OR REPLACE FUNCTION public.get_user_profile_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (SELECT count(*)::INTEGER FROM public.user_profiles);
END;
$$;

-- 2. Función de validación de límite antes de registrar un nuevo usuario
CREATE OR REPLACE FUNCTION public.check_registration_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  max_users INTEGER := 10; -- Límite configurable de docentes de prueba
BEGIN
  -- Contamos el número de perfiles creados
  SELECT count(*) INTO user_count FROM public.user_profiles;
  
  -- Si ya hay 10 o más, bloqueamos el registro levantando una excepción
  IF user_count >= max_users THEN
    RAISE EXCEPTION 'El período de prueba de Didakta ya alcanzó el cupo máximo de 10 docentes. Contacta a la administradora para más información.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Trigger BEFORE INSERT en la tabla auth.users
DROP TRIGGER IF EXISTS on_before_auth_user_created ON auth.users;
CREATE TRIGGER on_before_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_registration_limit();

-- =================================================================
-- EXTRA: INSERTAR O CORREGIR PERFIL DE valientepaloj@gmail.com
-- =================================================================
-- Paso A: Consultar el id real de valientepaloj@gmail.com
-- SELECT id FROM auth.users WHERE email = 'valientepaloj@gmail.com';
--
-- Paso B: Insertar la fila manualmente (reemplaza 'EL_ID_UUID_REAL' con el resultado obtenido en el Paso A)
-- INSERT INTO public.user_profiles (id, trial_started_at)
-- VALUES ('EL_ID_UUID_REAL', now())
-- ON CONFLICT (id) DO NOTHING;
-- =================================================================
