export interface EvaluationTemplate {
  tipo: string;
  nombre: string;
  descripcion: string;
  estructura: string;
}

export const evaluationTemplates: Record<string, EvaluationTemplate> = {
  diagnostica: {
    tipo: 'diagnostica',
    nombre: 'Evaluación Diagnóstica',
    descripcion: 'Diseñada al inicio del ciclo escolar o de la unidad para identificar conocimientos y habilidades previas.',
    estructura: `[ESTRUCTURA DE EVALUACIÓN DIAGNÓSTICA]
1. Datos de Identificación (Estudiante, Curso, Fecha, etc.)
2. Instrucciones Generales para el Estudiante [COMPLETAR]
3. Secciones de Textos:
   - Texto 1: [COMPLETAR titulo, tipo, contenido adaptado]
   - Texto 2: [COMPLETAR titulo, tipo, contenido adaptado]
4. Preguntas de Diagnóstico (N preguntas de alternativas y/o desarrollo para medir saberes básicos del OA). [COMPLETAR]
5. Pauta de Corrección Simplificada (Uso docente: Claves e indicadores de logro básicos). [COMPLETAR]`
  },
  formativa: {
    tipo: 'formativa',
    nombre: 'Evaluación Formativa',
    descripcion: 'Orientada a evaluar el progreso continuo del estudiante con foco en la retroalimentación y la técnica OREO/RICE.',
    estructura: `[ESTRUCTURA DE EVALUACIÓN FORMATIVA]
1. Datos de Identificación
2. Instrucciones de Progreso y Técnica de Respuesta (Foco en OREO o RICE según corresponda) [COMPLETAR]
3. Secciones de Textos:
   - Texto 1: [COMPLETAR]
   - Texto 2: [COMPLETAR]
4. Preguntas de Habilidades (Alternativas y Desarrollo usando técnicas RICE/OREO). [COMPLETAR]
5. Pauta de Corrección y Criterios detallados de retroalimentación pedagógica. [COMPLETAR]`
  },
  sumativa: {
    tipo: 'sumativa',
    nombre: 'Evaluación Sumativa',
    descripcion: 'Diseñada al final de la unidad para medir el nivel de logro de los objetivos de aprendizaje (OA).',
    estructura: `[ESTRUCTURA DE EVALUACIÓN SUMATIVA]
1. Datos de Identificación
2. Instrucciones Generales de Cierre de Unidad [COMPLETAR]
3. Secciones de Textos:
   - Texto 1: [COMPLETAR]
   - Texto 2: [COMPLETAR]
4. Tabla de Especificaciones consolidada. [COMPLETAR]
5. Preguntas de Alternativas (Claves y distractores fuertes) y Desarrollo. [COMPLETAR]
6. Pauta de Corrección y Puntos Asignados. [COMPLETAR]
7. Instrumento de Evaluación seleccionado (Rúbrica/Lista de Cotejo). [COMPLETAR]`
  },
  simce: {
    tipo: 'simce',
    nombre: 'Ensayo SIMCE',
    descripcion: 'Formato alineado a los estándares nacionales SIMCE de comprensión lectora (Localizar, Relacionar/Interpretar, Reflexionar).',
    estructura: `[ESTRUCTURA DE ENSAYO SIMCE]
1. Datos de Identificación
2. Instrucciones SIMCE Oficiales (Responder con lápiz grafito, rellenar óvalo, etc.) [COMPLETAR]
3. Secciones de Textos:
   - Texto 1: [COMPLETAR con conteo de palabras exacto según nivel]
   - Texto 2: [COMPLETAR con conteo de palabras exacto según nivel]
4. Tabla de Especificaciones con columna Eje/Habilidad SIMCE. [COMPLETAR]
5. Preguntas SIMCE (Alternativas de opción única y preguntas abiertas breves). [COMPLETAR]
6. Solucionario SIMCE (Uso exclusivo docente con Claves y Explicaciones de Justificación de alternativas correctas). [COMPLETAR]`
  },
  paes: {
    tipo: 'paes',
    nombre: 'Ensayo PAES',
    descripcion: 'Evaluación de Comprensión Lectora alineada al formato de la Prueba de Acceso a la Educación Superior chilena.',
    estructura: `[ESTRUCTURA DE ENSAYO PAES]
1. Datos de Identificación
2. Instrucciones Generales PAES (Lectura reflexiva, manejo del tiempo) [COMPLETAR]
3. Secciones de Textos Académicos de Alta Complejidad (Ensayos, columnas, papers):
   - Texto 1: [COMPLETAR]
   - Texto 2: [COMPLETAR]
4. Preguntas PAES de Vocabulario contextual, Inferencias locales/globales y Crítica. [COMPLETAR]
5. Solucionario PAES con Clave y Justificación pormenorizada de cada alternativa. [COMPLETAR]`
  }
};
