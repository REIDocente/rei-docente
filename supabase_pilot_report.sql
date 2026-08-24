-- ==========================================================================
-- REPORTE DEL PILOTO REÍ DOCENTE — 23 al 29 de julio de 2026
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- Disponible desde el 30 de julio de 2026
-- Este script es de SOLO LECTURA. No modifica ningún dato.
-- ==========================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. LISTADO DE DOCENTES REGISTRADOS
--    Muestra cada docente, su correo (desde auth.users), fecha de registro
--    y todos sus contadores de generación.
-- ─────────────────────────────────────────────────────────────────────────

SELECT
  up.id                              AS "ID Docente",
  au.email                           AS "Correo",
  au.created_at::date                AS "Fecha de Registro",
  up.plan_status                     AS "Estado del Plan",
  up.planifications_generated        AS "Planificaciones",
  up.evaluations_generated           AS "Evaluaciones",
  up.guides_generated                AS "Guías",
  up.lecturas_generated              AS "Lecturas Domiciliarias",
  (
    up.planifications_generated +
    up.evaluations_generated +
    up.guides_generated +
    up.lecturas_generated
  )                                  AS "Total Generaciones"
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.created_at >= '2026-07-23 00:00:00+00'  -- Solo docentes del piloto
ORDER BY au.created_at ASC;


-- ─────────────────────────────────────────────────────────────────────────
-- 2. TOTALES GENERALES DEL PILOTO
-- ─────────────────────────────────────────────────────────────────────────

SELECT
  COUNT(DISTINCT up.id)                          AS "Docentes Registrados",
  SUM(up.planifications_generated)               AS "Total Planificaciones",
  SUM(up.evaluations_generated)                  AS "Total Evaluaciones",
  SUM(up.guides_generated)                       AS "Total Guías",
  SUM(up.lecturas_generated)                     AS "Total Lecturas Dom.",
  SUM(
    up.planifications_generated +
    up.evaluations_generated +
    up.guides_generated +
    up.lecturas_generated
  )                                              AS "Total General de Generaciones"
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.created_at >= '2026-07-23 00:00:00+00';


-- ─────────────────────────────────────────────────────────────────────────
-- 3. DOCENTES QUE ALCANZARON SU LÍMITE EN AL MENOS UN MÓDULO
-- ─────────────────────────────────────────────────────────────────────────

SELECT
  au.email                           AS "Correo",
  up.planifications_generated        AS "Planificaciones (máx 7)",
  up.evaluations_generated           AS "Evaluaciones (máx 7)",
  up.guides_generated                AS "Guías (máx 7)",
  up.lecturas_generated              AS "Lecturas (máx 2)",
  CASE WHEN up.planifications_generated >= 7 THEN 'SÍ' ELSE 'no' END AS "Límite Planif.",
  CASE WHEN up.evaluations_generated    >= 7 THEN 'SÍ' ELSE 'no' END AS "Límite Eval.",
  CASE WHEN up.guides_generated         >= 7 THEN 'SÍ' ELSE 'no' END AS "Límite Guías",
  CASE WHEN up.lecturas_generated       >= 2 THEN 'SÍ' ELSE 'no' END AS "Límite Lecturas"
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.created_at >= '2026-07-23 00:00:00+00'
  AND (
    up.planifications_generated >= 7
    OR up.evaluations_generated >= 7
    OR up.guides_generated      >= 7
    OR up.lecturas_generated    >= 2
  )
ORDER BY au.created_at ASC;


-- ─────────────────────────────────────────────────────────────────────────
-- 4. TASA DE USO POR MÓDULO (porcentaje del límite utilizado)
-- ─────────────────────────────────────────────────────────────────────────

SELECT
  au.email                                                              AS "Correo",
  ROUND(up.planifications_generated * 100.0 / 7, 1) || '%'            AS "Uso Planificaciones",
  ROUND(up.evaluations_generated    * 100.0 / 7, 1) || '%'            AS "Uso Evaluaciones",
  ROUND(up.guides_generated         * 100.0 / 7, 1) || '%'            AS "Uso Guías",
  ROUND(up.lecturas_generated       * 100.0 / 2, 1) || '%'            AS "Uso Lecturas"
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.created_at >= '2026-07-23 00:00:00+00'
ORDER BY au.created_at ASC;


-- ─────────────────────────────────────────────────────────────────────────
-- 5. EXPORTAR A CSV (ejecutar por separado en psql o usando la opción
--    "Download CSV" del SQL Editor de Supabase luego de ejecutar la
--    consulta 1 o 2)
-- ─────────────────────────────────────────────────────────────────────────

-- INSTRUCCIONES PARA EXPORTAR:
-- 1. Ejecuta cualquiera de las consultas anteriores en el SQL Editor.
-- 2. En la barra de resultados del SQL Editor, haz clic en "Download CSV".
-- 3. El archivo se descargará con los datos del piloto listos para Excel.

-- ==========================================================================
-- FIN DEL REPORTE
-- ==========================================================================
