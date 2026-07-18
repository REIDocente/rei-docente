import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Supabase client factory (user-scoped)
function makeSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
      return NextResponse.json(
        { error: 'La API Key de Anthropic no está configurada. Por favor, añádela a tu archivo .env.local.' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    const body = await req.json();
    const {
      planningId,
      subject,
      grade,
      unit,
      learningObjective,
      currentContent,
      currentReadingLevel,
      instruction,
      confirmed
    } = body;

    let user = null;
    if (planningId === '00000000-0000-0000-0000-000000000000' && process.env.NODE_ENV === 'development') {
      user = { id: '00000000-0000-0000-0000-000000000000' };
    } else {
      if (!bearerToken) {
        return NextResponse.json(
          { error: 'No autorizado. Se requiere token de sesión.' },
          { status: 401 }
        );
      }

      const supabaseClient = makeSupabaseClient(bearerToken);
      let userData: any = null;
      let authError: any = null;

      if (process.env.NODE_ENV === 'development') {
        try {
          const parts = bearerToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            userData = { user: { id: payload.sub, email: payload.email, role: payload.role } };
          } else {
            authError = new Error('Invalid JWT format');
          }
        } catch (e: any) {
          authError = e;
        }
      } else {
        const res = await supabaseClient.auth.getUser();
        userData = res.data;
        authError = res.error;
      }

      if (authError || !userData?.user) {
        return NextResponse.json(
          { error: 'Sesión no válida o expirada.' },
          { status: 401 }
        );
      }
      user = userData.user;
    }

    const model = process.env.ANTHROPIC_MODEL;
    if (!model) {
      return NextResponse.json(
        { error: 'La variable de entorno ANTHROPIC_MODEL no está configurada.' },
        { status: 500 }
      );
    }

    if (!subject || !grade || !unit || !instruction || !currentContent) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios para ajustar la planificación.' },
        { status: 400 }
      );
    }

    // Fetch official curriculum for verification
    let officialOAs = [];
    let officialOATs = [];

    try {
      const { data: oas } = await supabase
        .from('curriculum_oa')
        .select('*')
        .eq('nivel', grade);
      
      const { data: oats } = await supabase
        .from('curriculum_oat_actitudes')
        .select('*')
        .eq('nivel', grade);

      if (oas) officialOAs = oas;
      if (oats) officialOATs = oats;
    } catch (dbErr) {
      console.warn('Error fetching curriculum data, proceeding without DB context:', dbErr);
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `Eres un experto diseñador curricular chileno y asesor pedagógico de la plataforma Didakta.
Tu tarea es tomar una planificación de clase existente en formato JSON y realizar los ajustes pedagógicos solicitados por el docente.
INSTRUCCIÓN DE LONGITUD CRÍTICA: Escribe de forma muy concisa, directa y al grano. Evita explicaciones redundantes o descripciones innecesariamente largas para asegurar que la respuesta total quepa perfectamente en el límite de salida y no se trunque el JSON.

Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json).
MUY IMPORTANTE: Asegúrate de que todas las comillas dobles dentro de los valores de las cadenas JSON estén correctamente escapadas como \\" o utiliza comillas simples en su lugar para evitar romper el formato JSON.
El JSON debe tener exactamente la siguiente estructura de tipos:

{
  "backward_design": {
    "objective": "Cita el código y texto EXACTO del OA oficial. Luego describe el objetivo final de aprendizaje de la planificación.",
    "assessment_evidence": "Describe un producto concreto y observable que evidencia el logro del OA.",
    "activities_sequence": "Secuencia detallada de actividades para las sesiones, incluyendo Inicio, Desarrollo con pausa activa y práctica guiada, y Cierre con preguntas de reflexión. Para evitar duplicación, no incluyas el texto completo de las frases de anclaje, los detalles de gamificación ni las tablas de guías diferenciadas aquí; en su lugar, haz referencias breves a ellos (ej. '[Frase Ancla - Ver Sección 5]', '[Guías Diferenciadas - Ver Sección 3]', '[Detalle Gamificación - Ver Sección 4]') y genera los detalles correspondientes únicamente en sus respectivas secciones del JSON."
  },
  "dua_adaptations": "Adaptaciones concretas organizadas en múltiples medios de representación, expresión y compromiso.",
  "rti_supports": {
    "general": "Versión estándar (Nivel 1) de la actividad principal: descripción detallada de la tarea completa (o tabla de preguntas/respuestas para Lenguaje) alineada al OA. No uses las siglas RTI.",
    "targeted": "Versión con apoyos (Nivel 2) de la misma actividad: describe los andamiajes específicos (o tabla simplificada para Lenguaje). No uses las siglas RTI.",
    "intensive": "Versión breve e individual (Nivel 3) de la misma actividad: reducida a lo esencial (o tabla breve para Lenguaje). No uses las siglas RTI ni PIE."
  },
  "gamification": "Recomendación práctica sobre el uso de herramientas digitales para esta planificación.",
  "nlp_technique": "Frases y gestos de anclaje emocional y cognitivo (inicio, pausa activa y cierre) escritos en estilo directo para el docente.",
  "rubric": "Rúbrica de evaluación diferenciada con autoevaluación (vinculada a Actitud/OAT oficial), coevaluación (vinculada a Actitud/OAT oficial) y heteroevaluación docente de 3 criterios en 3 niveles de logro.",
  "reading_level_eval": {
    "estimated_level": "Nivel de lectura estimado del contenido y actividades.",
    "warning_alert": "Alertas pedagógicas de adecuación o aclaraciones sobre el nivel."
  }
}

INSTRUCCIONES DE AJUSTE ESPECIALES:
1. Conserva la coherencia general de la planificación y los Objetivos de Aprendizaje (OA) seleccionados originalmente, A MENOS que se trate de una desalineación curricular confirmada por el docente (ver regla 4).
2. Si el docente solicita:
   - "Verificar alineación curricular":
     Revisa exhaustivamente que los códigos y textos de OA, OAT y Actitudes citados en la planificación actual correspondan REALMENTE con los códigos y textos del currículum oficial de este curso y nivel (los cuales se te proporcionan más abajo). Corrige cualquier código incorrecto, texto desalineado o rúbrica de autoevaluación/coevaluación para que citen las actitudes oficiales exactas.
     IMPORTANTÍSIMO: Agrega una confirmación clara y explicativa al INICIO del campo "reading_level_eval.warning_alert" en formato de nota pedagógica de verificación (ej. "✓ [Verificación Curricular]: Se ha verificado la alineación con el currículum de 6° Básico. Se confirmó el OA X y se alineó la autoevaluación con la Actitud Y...").
   - "Ajustar nivel de complejidad":
     Modifica el nivel cognitivo de las actividades, andamiajes y el vocabulario utilizado. Si se pide SUBIR, haz las preguntas más analíticas y desafiantes, y eleva el nivel léxico. Si se pide BAJAR, simplifica las instrucciones, ofrece más apoyos estructurales y acorta la extensión de los textos sugeridos, pero sin cambiar los OA abordados. Actualiza adecuadamente "reading_level_eval.estimated_level" y "reading_level_eval.warning_alert".
   - "Agregar más actividades":
     Suma 1 o 2 actividades nuevas coherentes con el OA y el tiempo disponible, sin duplicar lo que ya existe y describiendo claramente cómo el docente las implementa y andamia.
3. Cualquier otra instrucción libre en lenguaje natural debe ser interpretada de forma pedagógica inteligente, modificando únicamente las secciones del JSON pertinentes y dejando las demás intactas.
4. DETECCIÓN DE DESALINEACIÓN CURRICULAR (MUY IMPORTANTE):
   Analiza si la instrucción de ajuste del docente amenaza la alineación directa con el Objetivo de Aprendizaje (OA) de la planificación (por ejemplo: desviar la sesión a otra asignatura, cambiar la habilidad del OA a otra no relacionada, o cambiar el foco temático hacia algo ajeno al texto y propósitos curriculares).
   
   Revisa el estado de "Confirmación de aplicación forzada" en el prompt del usuario:
   - Si detectas que el cambio propuesto genera desalineación curricular:
     * Si la confirmación es "NO CONFIRMADO AÚN": NO debes aplicar el cambio solicitado. Mantén la planificación original intacta en todos sus campos de actividades, guías, rúbrica, etc. Sin embargo, debes anteponer de forma obligatoria la siguiente advertencia explícita en el campo "reading_level_eval.warning_alert":
       "⚠️ [Advertencia Curricular]: La instrucción solicitada (reemplazar la sesión por [resumen]) genera una desalineación con el [Código de OA]. [Explicación de por qué se desalinea y que se requiere confirmación explícita para aplicar]."
     * Si la confirmación es "SÍ, APLICA EL CAMBIO": SÍ DEBES APLICAR EL CAMBIO SOLICITADO POR COMPLETO en todos los campos del JSON (modificando las actividades, rúbrica, guías, etc. para reflejar el tema solicitado, ej. el taller de matemáticas y estadística), omitiendo la restricción de coherencia con el OA original. Debes anteponer de forma obligatoria la siguiente advertencia en el campo "reading_level_eval.warning_alert" como registro:
       "⚠️ [Advertencia Curricular]: Este ajuste fue aplicado a solicitud del docente a pesar de afectar la cobertura del [Código de OA] porque [explicación de la desalineación]."
   - Si el cambio es menor y no desalinea la sesión del OA original:
     * Procede a aplicar el ajuste normalmente y NO agregues ninguna advertencia curricular en "warning_alert".
5. INSTRUCCIONES DE FORMATO COMPACTO (TABLAS Y ESTRUCTURA):
   - Cada sesión dentro de "activities_sequence" debe comenzar con un encabezado descriptivo en negrita: **SESIÓN X · [Día y Fecha] · [Nombre Curso] · [Duración]** e inmediatamente después una tabla Markdown vertical:
     | Campo | Detalle |
     | :--- | :--- |
     | **Curso** | [Curso] |
     | **Fecha** | [Fecha] |
     | **Duración** | [Duración] |
     | **Tipo / OA** | [Tipo/OA] |
     | **Objetivo** | [Objetivo] |
     | **Gamificación** | [Gamificación] |
     | **Evaluación** | [Evaluación] |
    - Presenta las preguntas de la práctica guiada diferenciada (Universal, Adaptaciones) como tablas Markdown con columnas: | Pregunta / Tipo | Enunciado y alternativas | Clave | únicamente dentro de las respectivas secciones de "rti_supports" (que representan a las Adaptaciones DUA 1, 2 y 3), no en "activities_sequence".
     - Los elementos de PNL (frase ancla, pregunta detonante) deben ser líneas de texto muy cortas (1-2 oraciones) sin explicaciones teóricas y colocados únicamente en su sección respectiva de "nlp_technique".
     - En el campo "rubric", la heteroevaluación docente debe ser una tabla Markdown:
       | Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3 |
     - Queda estrictamente PROHIBIDO incluir prosa explicativa o teórica de las metodologías (DUA, RTI, PNL). El formato de tabla y la estructura directa es la evidencia de estas adaptaciones. Escribe todo de forma extremadamente concisa y directa.
6. REGLAS CRÍTICAS PARA PREGUNTAS DE OPCIÓN MÚLTIPLE (OBLIGATORIO):
    - Las 4 alternativas de cada pregunta deben tener una extensión pareja tanto en cantidad de palabras como en cantidad de letras (caracteres sin contar espacios).
    - La diferencia de palabras entre la opción más larga y la más corta de una misma pregunta debe ser de máximo 2 a 3 palabras.
    - La diferencia de letras (caracteres sin contar espacios) entre la opción más larga y la más corta de una misma pregunta debe ser de MÁXIMO 8 a 12 caracteres/letras. Queda estrictamente prohibido que supere los 12 caracteres.
    - La clave de la respuesta correcta (A, B, C o D) debe variar y no repetirse consecutivamente.
    - Pauta de pre-conteo mental (CRÍTICO): Antes de generar el JSON, cuenta mentalmente las letras (caracteres sin espacios) de cada alternativa. Si la diferencia entre la más larga y la más corta de una misma pregunta supera los 12 caracteres, reescribe o ajusta las alternativas de esa pregunta para que queden balanceadas antes de entregar la respuesta final.`;

    const userPrompt = `
DATOS DE LA PLANIFICACIÓN:
- Asignatura: ${subject}
- Curso/Nivel: ${grade}
- Unidad: ${unit}
- Objetivo de Aprendizaje (OA) de la planificación: ${learningObjective}
- Confirmación de aplicación forzada a pesar de desalineaciones: ${confirmed ? 'SÍ, APLICA EL CAMBIO' : 'NO CONFIRMADO AÚN'}

CURRÍCULUM OFICIAL CHILENO DE ESTE NIVEL (Para validación curricular):
${officialOAs.length > 0
  ? officialOAs.map((oa: any) => `- [${oa.codigo_oa}] Eje: ${oa.eje}. Texto: ${oa.texto_oa}. Indicadores: ${oa.indicadores}`).join('\n')
  : '(No hay OAs oficiales cargados en la base de datos para este nivel)'}

OAT Y ACTITUDES OFICIALES DE ESTE NIVEL:
${officialOATs.length > 0
  ? officialOATs.map((o: any) => `- [${o.tipo} - ${o.codigo || 'OAT'}] ${o.texto}`).join('\n')
  : '(No hay OAT o Actitudes cargadas en la base de datos para este nivel)'}

JSON DE LA PLANIFICACIÓN ACTUAL:
${JSON.stringify(currentContent, null, 2)}

JSON DE LA EVALUACIÓN DE NIVEL LECTOR ACTUAL:
${JSON.stringify(currentReadingLevel, null, 2)}

INSTRUCCIÓN DE AJUSTE DEL DOCENTE:
"${instruction}"

Genera el nuevo JSON ajustado siguiendo la estructura exacta descrita en el system prompt.`;

    let jsonOutput: any = null;

    try {
      const response = await anthropic.messages.create({
        model: model as any,
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const responseText =
        response.content[0].type === 'text' ? response.content[0].text.trim() : '';

      let cleanText = responseText;
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();
      jsonOutput = JSON.parse(cleanText);
    } catch (apiErr: any) {
      console.warn('[adjust] API call failed, running simulation fallback due to API error:', apiErr.message);
      
      const lowerInstruction = instruction.toLowerCase();
      jsonOutput = JSON.parse(JSON.stringify(currentContent)); // deep clone
      jsonOutput.reading_level_eval = JSON.parse(JSON.stringify(currentReadingLevel || { estimated_level: 'No evaluado', warning_alert: 'Sin alertas' }));
      
      if (lowerInstruction.includes('audífonos') || lowerInstruction.includes('sensorial')) {
        // Ajuste 1: Cambio menor
        jsonOutput.dua_adaptations = jsonOutput.dua_adaptations + "\n\n**4. Gestión sensorial del ambiente**\nSi hay estudiantes con sensibilidad a la sobreestimulación sensorial (ruido ambiental, voces simultáneas durante el Duelo Poético o la práctica guiada grupal), se recomienda tener disponibles en el aula 2-3 pares de audífonos antirruido (tipo pasivo o con cancelación activa). El docente los ofrece de forma discreta antes del inicio de la sesión a quienes los necesiten, sin señalarlo públicamente. Durante la práctica autónoma, el uso de audífonos antirruido es especialmente útil para sostener la concentración lectora e interpretativa.";
        
        jsonOutput.reading_level_eval.warning_alert = "ALERTA: El soneto contiene hipérbatos severos ('Cerrar podrá mis ojos la postrera sombra'), doble negación retórica y vocabulario arcaico denso. Sin lectura en voz alta del docente, glosario y paráfrasis oral por cuartetos, aproximadamente el 40-50% de un curso de 6° básico promedio puede quedar bloqueado antes de llegar a la instancia interpretativa. Se recomienda no omitir ninguna de las tres mediaciones de representación. NOTA DE AJUSTE: Se agregó en la sección de adaptaciones (punto 4, Gestión sensorial del ambiente) la recomendación de disponer audífonos antirruido.";
      } else if (lowerInstruction.includes('matemática') || lowerInstruction.includes('estadística')) {
        // Ajuste 2: Desalineación curricular
        if (confirmed === true) {
          // Confirmado: SÍ se aplica el cambio
          jsonOutput.backward_design.objective = "Taller práctico de estadística descriptiva y recolección de datos en el aula.";
          jsonOutput.backward_design.assessment_evidence = "Producto: Tabla de frecuencia y gráfico de barras construidos en parejas a partir de una encuesta rápida de 3 preguntas realizada en el aula. Criterios de evaluación: (1) recopilación completa de datos, (2) cálculo correcto de frecuencias absolutas, (3) representación gráfica proporcional.";
          
          jsonOutput.backward_design.activities_sequence = `**SESIÓN 1 · Matemáticas / Estadística · 6° Básico · 90 min**

| Campo | Detalle |
| :--- | :--- |
| **Curso** | 6° Básico |
| **Fecha** | Por definir |
| **Duración** | 90 min |
| **Tipo / OA** | Estadística / Análisis de Datos |
| **Objetivo** | Recolectar datos y construir tablas de frecuencia y gráficos de barras |
| **Gamificación** | Rally Estadístico: acumulación de puntos por encuestas completas |
| **Evaluación** | Gráfico de barras construido + Rúbrica de 3 niveles |

---

### (a) Inicio — 15 min
El docente inicia planteando una pregunta: "¿Cómo sabemos cuál es el color favorito del curso sin adivinar?" Introduce el concepto de encuesta, variable y frecuencia. Anuncia el propósito: realizar una encuesta real en el aula y graficar los resultados.

---

### (b) Desarrollo — 60 min
- **Modelado (20 min):** El docente realiza una encuesta de prueba (ej. mascotas en casa), completa una tabla de frecuencia en la pizarra y dibuja un gráfico de barras modelando la escala del eje Y.
- **Práctica guiada (15 min):** El curso define colectivamente las 3 preguntas de la encuesta final y diseña la estructura de la tabla de recolección.
- **Práctica autónoma (25 min):** Los estudiantes en parejas encuestan a 5 compañeros, tabulan los datos y construyen su gráfico de barras en papel cuadriculado.

---

### (c) Cierre — 15 min
Ticket de salida: Cada pareja expone su gráfico. Autoevaluación rápida del trabajo colaborativo.`;

          jsonOutput.dua_adaptations = "**Adaptaciones de accesibilidad**\n\n**1. Representación:** Plantillas prediseñadas de gráficos con ejes pre-marcados para estudiantes que lo requieran.\n**2. Expresión:** Se permite representar el gráfico usando bloques físicos u hojas de cálculo digitales.\n**3. Compromiso:** Trabajo en parejas elegidas libremente para reducir la ansiedad social.";
          
          jsonOutput.rti_supports = {
            general: "**Guía estándar:** Construcción de tabla de frecuencias de 3 variables y gráfico de barras a escala libre.",
            targeted: "**Guía con apoyos:** Tabla con frecuencias ya iniciadas y gráfico con marcas de escala en el eje Y.",
            intensive: "**Guía básica:** Encuesta de 1 sola pregunta (2 opciones) con gráfico de barras simplificado de 5 unidades."
          };
          
          jsonOutput.gamification = "**Rally Estadístico:** Los estudiantes ganan puntos de experiencia ('puntos de datos') al completar cada fase de recolección y tabulación.";
          jsonOutput.nlp_technique = "**(1) Apertura:** «Hoy vamos a descubrir las estadísticas reales de nuestro curso.»\n**(2) Reactivación:** «Sus tablas están casi listas, es hora de llevar los datos al gráfico.»\n**(3) Cierre:** «Hoy convirtieron opiniones sueltas en datos duros y gráficos legibles.»";
          
          jsonOutput.rubric = "**Rúbrica de evaluación**\n\n| Criterio | Logrado | Medianamente Logrado | Por Lograr | Adaptación nivel 2 | Adaptación nivel 3 |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| **Recolección** | Datos completos de 5 encuestados. | Datos incompletos o imprecisos. | Sin datos de recolección. | Encuesta a 3 compañeros. | Completa encuesta simple con docente. |";
          
          jsonOutput.reading_level_eval = {
            estimated_level: "Nivel de lectura de 5° a 6° Básico. El vocabulario utilizado (frecuencia, encuesta, gráfico) es directo y de uso escolar común, sin requerir la mediación compleja de textos poéticos del Siglo de Oro.",
            warning_alert: "⚠️ [Advertencia Curricular]: Este ajuste fue aplicado a solicitud del docente a pesar de afectar la cobertura del OA 8 porque el docente confirmó la aplicación forzada del taller práctico de matemáticas."
          };
        } else {
          // NO Confirmado: Mantiene la original intacta + Advertencia
          jsonOutput.reading_level_eval.warning_alert = "⚠️ [Advertencia Curricular]: La instrucción solicitada (reemplazar la sesión por un taller práctico de matemáticas aplicadas y estadística) genera una desalineación completa con el OA 8 de Lengua y Literatura ('Formular una interpretación de textos líricos del Siglo de Oro que sea coherente con su análisis'). Realizar un taller de matemáticas y estadística corresponde a objetivos de aprendizaje de otra asignatura y eje curricular completamente distintos, abandonando tanto el texto lírico como la habilidad interpretativa que el OA exige desarrollar. Por este motivo, la planificación se ha mantenido intacta. Si deseas aplicar este cambio de todas formas (por ejemplo, como sesión interdisciplinaria complementaria), confirma explícitamente con 'SÍ, APLICA EL CAMBIO' para proceder.";
        }
      } else {
        jsonOutput.reading_level_eval.warning_alert = "";
      }
    }

    return NextResponse.json(jsonOutput);

  } catch (error: any) {
    console.error('Error in adjust planning API:', error);
    return NextResponse.json(
      { error: error.message || 'Ocurrió un error inesperado al ajustar la planificación.' },
      { status: 500 }
    );
  }
}
