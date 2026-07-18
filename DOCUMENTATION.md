# Documentación Técnica del Proyecto — Didakta

Esta documentación recopila de forma detallada la estructura técnica del proyecto **Didakta**, incluyendo las variables de entorno, la base de datos (tablas y RLS), los endpoints de la API, y la estructura de componentes/páginas en la interfaz.

---

## 1. Variables de Entorno (.env.local)

Las siguientes variables de entorno configuran la conexión de base de datos y la integración de servicios de IA:

* **`NEXT_PUBLIC_SUPABASE_URL`**: URL pública del proyecto Supabase (ej: `https://svvjduhtfwgnnxlohcjm.supabase.co`).
* **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Clave anónima pública del cliente Supabase, utilizada para consultas directas y operaciones del lado del cliente.
* **`ANTHROPIC_API_KEY`**: Clave de API privada de Anthropic, utilizada del lado del servidor para procesar las planificaciones y los resúmenes curriculares con Claude 3.5 Sonnet.
* **`ANTHROPIC_MODEL`**: Nombre del modelo predeterminado de Anthropic (ej: `claude-3-5-sonnet-20241022` o `claude-3-5-sonnet-20240715`).
* **`OPENAI_API_KEY`**: Clave de API de OpenAI, utilizada del lado del servidor para generar descripciones y prompts enriquecidos para imágenes a través del modelo de DALL-E.
* **`NEXT_PUBLIC_MAX_TRIAL_USERS`**: Límite de registro de usuarios del período de prueba (Trial) en el portal de registro de demostración.

---

## 2. Estructura de la Base de Datos (Tablas Supabase)

La base de datos utiliza políticas de Seguridad de Nivel de Fila (RLS) para asegurar que cada docente acceda exclusivamente a su propio contenido (`user_id = auth.uid()`), con excepción de las tablas curriculares estatales, que son de lectura pública.

### Tabla `user_profiles`
Registra el perfil del docente, su estado de suscripción y los límites/contadores de generación.
* **Campos**: `id` (UUID, referencia a Auth), `plan_status` (trial/active/expired), `trial_started_at` (timestamp), `stripe_customer_id`, `stripe_subscription_id`, y contadores de uso: `planifications_generated`, `presentations_generated`, `images_generated`, `guides_generated`, `gamified_activities_generated`, `visual_resources_generated`, `evaluations_generated`.
* **RPCs asociadas**: `get_or_create_profile(user_id)` e `increment_usage_counter(user_id, column_name)`.

### Tabla `plannings`
Almacena las planificaciones de clases completas.
* **Campos**: `id` (UUID), `user_id` (UUID), `created_at` (timestamp), `subject` (texto), `grade` (texto), `learning_objective` (texto), `unit` (texto), `reading_level` (JSONB con nivel estimado y alerta), `content` (JSONB con la secuencia, gamificación, adaptaciones DUA 1/2/3, Lirmi y UTP), y `curricular_summary` (texto).

### Tablas Curriculares (Lectura Pública)
* **`curriculum_oa`**: Almacena los Objetivos de Aprendizaje oficiales (5° Básico a 2° Medio) del Mineduc chileno. Campos: `id`, `asignatura` (ej: Lenguaje y Comunicación), `nivel`, `ciclo`, `eje` (Lectura, Escritura, etc.), `codigo_oa` (ej: OA 3), `texto_oa` e `indicadores` (texto con saltos de línea).
* **`curriculum_unidades`**: Agrupa los OAs por unidades anuales. Campos: `id`, `nivel`, `unidad_numero` (1 al 7), `titulo_tema` y `oa_codes` (array de códigos de OA).
* **`curriculum_oat_actitudes`**: Objetivos Transversales y Actitudes por nivel. Campos: `id`, `nivel`, `tipo` (OAT/Actitud), `codigo`, `texto`.

### Tablas de Cursos y Horarios
* **`cursos`**: Registra los niveles asignados al profesor. Campos: `id`, `user_id`, `nombre` (ej: 6° Básico B), `nivel` (ej: 6° Básico), `seccion` (ej: B), `created_at`.
* **`horario_semanal`**: Bloques horarios de clases para un curso específico. Campos: `id`, `curso_id`, `asignatura`, `dia_semana` (lunes-viernes), `n_bloques` (1-3), `tipo_bloque` (simple/doble/triple), `hora_inicio`, `hora_fin`.
* **`mapas_ruta`**: Mapas de ruta anuales autogenerados por curso. Campos: `id`, `curso_id`, `asignatura`, `año`, `n_estudiantes`, `distribucion_rti` (JSONB), `unidades` (JSONB con objetivos anuales por unidad).

### Tablas de Materiales Adicionales
* **`guias`**: Fichas y guías de trabajo adaptadas (DUA / PIE / Narrativa). Campos: `id`, `user_id`, `nivel`, `eje`, `oa_codes` (array), `formato` (tradicional/narrativa), `tema_narrativo`, `rti_nivel` (universal/dua/pie), `titulo`, `contenido_json`, `created_at`.
* **`evaluaciones`**: Pruebas, pautas y heteroevaluaciones. Campos: `id`, `user_id`, `nivel`, `eje`, `oa_codes` (array), `tipos` (array de instrumentos), `titulo`, `n_preguntas`, `duracion_min`, `dificultad`, `contenido_json`, `simce_ensayo` (boolean), `created_at`.
* **`banco_simce`**: Preguntas de práctica tipo SIMCE recopiladas para el docente. Campos: `id`, `user_id`, `nivel`, `eje`, `habilidad`, `texto_pregunta`, `alternativas` (JSONB), `oa_code`, `veces_usada`, `created_at`.
* **`recursos_visuales`**: Material visual de apoyo curricular. Campos: `id`, `user_id`, `planning_id`, `tipo` (infografia/linea_tiempo/flashcards/afiche), `tema`, `contenido_json`, `imagen_url`, `html_fallback`, `prompt_imagen`, `created_at`.

---

## 3. Endpoints de la API (/src/app/api)

Todos los endpoints procesan solicitudes mediante manejadores HTTP Next.js (`route.ts`).

1. **`/api/curriculum`** (`GET`): Consulta y agrupa los OAs y objetivos por eje y unidad para construir formularios del planificador.
2. **`/api/cursos`** (`GET`/`POST`): Lista y registra cursos asociados al docente autenticado.
3. **`/api/cursos/mapa-ruta`** (`GET`/`POST`): Gestiona el mapa de ruta curricular anual para cada curso.
4. **`/api/cursos/mapa-ruta/generate`** (`POST`): Llama a Claude para estructurar un mapa curricular completo con 4 unidades anuales alineadas a los OAs oficiales.
5. **`/api/horario/[cursoId]`** (`GET`/`POST`): Lee o actualiza los bloques de horario asignados al curso.
6. **`/api/horario/parse`** (`POST`): Carga y analiza documentos de horarios escolares (PDF, Word, Imágenes, Excel) y los convierte en datos de horario estructurados mediante IA.
7. **`/api/generate`** (`POST`): Invoca el pipeline de planificación de 4 etapas (Backward Design, DUA, Gamificación y Rúbricas). Aplica filtros de calidad específicos para Lenguaje (5° Básico - 2° Medio) respecto a la variación de claves y consistencia en el tamaño de alternativas.
8. **`/api/planner/adjust`** (`POST`): Permite al usuario enviar instrucciones libres para ajustar partes de la planificación actual de manera interactiva sin perder la consistencia del plan.
9. **`/api/planner/summarize`** (`POST`): Condensa una planificación en dos resúmenes (Lirmi para libros de clases y UTP para directores docentes). Se autoguarda de forma transparente en la base de datos (caching).
10. **`/api/guias`** (`GET`/`POST`): Administra las guías y talleres escolares. Genera las guías diferenciadas mediante Claude.
11. **`/api/evaluaciones`** (`GET`/`POST`): Crea y lista los instrumentos de evaluación (pruebas, pautas, rúbricas).
12. **`/api/evaluaciones/simce`** (`GET`/`POST`): Gestiona los ensayos SIMCE del docente e interactúa con el banco de preguntas guardadas.
13. **`/api/recursos-visuales`** (`GET`/`POST`): Lista y vincula las infografías y materiales gráficos.
14. **`/api/visual-generator`** (`POST`): Recibe un tema educativo, genera un prompt enriquecido, lo envía a OpenAI DALL-E, descarga la imagen generada y la sube al bucket de almacenamiento privado de Supabase (`recursos-visuales`).

---

## 4. Estructura de Páginas y Componentes (/src/app)

Didakta está implementado sobre Next.js App Router. Cada subcarpeta define una ruta y contiene la lógica de renderizado del lado del cliente:

### Dashboard Principal (`/src/app/page.tsx`)
Página principal para el docente. Presenta métricas generales de uso (contadores de trial), accesos rápidos de creación, y una lista cronológica de las planificaciones, guías y evaluaciones generadas recientemente.

### Módulo de Cursos (`/src/app/cursos`)
* **`/cursos`**: Listado de los cursos creados y visualización de sus calendarios/horarios semanales.
* **`/cursos/nuevo`**: Formulario interactivo para registrar un curso y subir un archivo de horario (el cual se procesa mediante `/api/horario/parse`).
* **`/cursos/[id]/mapa-ruta`**: Vista interactiva del mapa de ruta anual del curso, permitiendo la generación inteligente de las 4 unidades académicas.

### Planificador Didáctico (`/src/app/planner`)
* **`/planner/new`**: Formulario asistente por pasos. Permite seleccionar el curso, la unidad, y los OAs correspondientes desde la base de datos (o ingresar un objetivo manual), elegir la duración y el enfoque pedagógico antes de lanzar la generación.
* **`/planner/[id]`**: Vista de detalle del plan generado.
  * **Estructura de Tres Pestañas**: Pestaña **Planificación Completa**, **Sesión Breve (Lirmi)** y **Documentación UTP**.
  * **Lógica de Resúmenes**: Llama de forma asíncrona a `/api/planner/summarize` la primera vez que se accede a las pestañas Breve o UTP, y almacena las respuestas para accesos futuros rápidos.
  * **Exportadores Dinámicos**: Implementa los botones de descarga de Word y PDF que leen directamente el estado `activeTab` para renderizar el contenido específico de la pestaña activa utilizando `docx` y `jspdf` del lado del cliente.
  * **Ajustador Asistido**: Permite editar secciones del plan enviando comandos al modelo en `/api/planner/adjust`.

### Generador de Evaluaciones (`/src/app/evaluaciones`)
* **`/evaluaciones/new`**: Diseñador de pruebas y evaluaciones. Permite parametrizar el nivel, el eje, la dificultad, los OAs a evaluar, y si se requiere formato estándar o ensayo SIMCE.
* **`/evaluaciones/[id]`**: Muestra la evaluación final (con su hoja de respuestas y tabla de especificaciones si corresponde) y proporciona las opciones de descarga en PDF/Word.

### Generador de Guías de Aprendizaje (`/src/app/guias`)
* **`/guias/new`**: Diseñador paso a paso para guías tradicionales o de narrativa lúdica (Misión, Expedición, Desafío).
* **`/guias/[id]`**: Visualización del material generado y exportación del archivo final en formato Word o PDF.

### Recursos Visuales (`/src/app/visual`)
* **`/visual/new`**: Panel que permite al usuario escoger un tema o anclarlo a una planificación existente para generar recursos gráficos educativos (infografías, pósters, líneas de tiempo o tarjetas didácticas / flashcards).
* **`/visual/[id]`**: Visor interactivo que muestra el recurso generado y la ilustración DALL-E correspondiente.

### Autenticación
* **`/login`**: Formulario de ingreso (correo/contraseña o inicio rápido) integrado con Supabase Auth.
* **`/reset-password`**: Página de recuperación de contraseña.
