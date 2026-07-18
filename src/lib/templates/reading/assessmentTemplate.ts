export type AssessmentType = 'seleccion_multiple' | 'desarrollo' | 'mixta' | 'comprension_lectora' | 'ensayo';

export const ASSESSMENT_TYPES: Record<AssessmentType, string> = {
  seleccion_multiple: 'Selección Múltiple (20 preguntas, 4 alternativas, pauta incluida)',
  desarrollo: 'Preguntas de Desarrollo (5 preguntas con criterios de evaluación)',
  mixta: 'Mixta (10 selección múltiple + 3 desarrollo)',
  comprension_lectora: 'Comprensión Lectora (texto + preguntas literales, inferenciales y críticas)',
  ensayo: 'Ensayo (pregunta central, pauta de evaluación y rúbrica)',
};

export const ASSESSMENT_TEMPLATES: Record<AssessmentType, string> = {
  seleccion_multiple: `
EVALUACIÓN DE SELECCIÓN MÚLTIPLE
{titulo} — {autor}
Curso: {nivel} | Asignatura: Lenguaje y Comunicación

INSTRUCCIONES: Responde las siguientes 20 preguntas seleccionando la alternativa correcta (A, B, C o D).

PREGUNTAS:
{preguntas_cuerpo}

--- CLAVE DE RESPUESTAS (Docente) ---
{clave_respuestas}
`,
  desarrollo: `
EVALUACIÓN DE DESARROLLO
{titulo} — {autor}
Curso: {nivel} | Asignatura: Lenguaje y Comunicación

INSTRUCCIONES: Responde de manera clara y argumentada las siguientes 5 preguntas de desarrollo.

PREGUNTAS:
{preguntas_cuerpo}

--- PAUTA DE CORRECCIÓN (Docente) ---
{clave_respuestas}
`,
  mixta: `
EVALUACIÓN MIXTA
{titulo} — {autor}
Curso: {nivel} | Asignatura: Lenguaje y Comunicación

PARTE I: Selección Múltiple (10 preguntas)
{preguntas_seleccion}

PARTE II: Desarrollo (3 preguntas)
{preguntas_desarrollo}

--- PAUTA DE EVALUACIÓN Y RESPUESTAS (Docente) ---
{clave_respuestas}
`,
  comprension_lectora: `
COMPRENSIÓN LECTORA APLICADA
{titulo} — {autor}
Curso: {nivel} | Asignatura: Lenguaje y Comunicación

TEXTO DE LECTURA / FRAGMENTO CLAVE:
{fragmento_contexto}

PREGUNTAS LITERALES:
{preguntas_literales}

PREGUNTAS INFERENCIALES:
{preguntas_inferenciales}

PREGUNTAS CRÍTICAS:
{preguntas_criticas}

--- CLAVE DE RESPUESTAS Y CRITERIOS (Docente) ---
{clave_respuestas}
`,
  ensayo: `
ENSAYO LITERARIO
{titulo} — {autor}
Curso: {nivel} | Asignatura: Lenguaje y Comunicación

TEMA CENTRAL / PREGUNTA DISPARADORA:
{pregunta_ensayo}

PAUTA Y RÚBRICA DE EVALUACIÓN:
{rubrica_ensayo}
`
};
