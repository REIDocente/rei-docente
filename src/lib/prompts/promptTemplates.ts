import { OREO } from '../knowledge/oreo';
import { RICE } from '../knowledge/rice';
import { DUA } from '../knowledge/dua';
import { Bloom } from '../knowledge/bloom';
import { TextTypes } from '../knowledge/textTypes';
import { SIMCE } from '../knowledge/simce';
import { evaluationTemplates } from '../templates/evaluationTemplates';
import { rubricTemplates } from '../templates/rubricTemplates';
import { guideTemplates } from '../templates/guideTemplates';
import { activityTemplates } from '../templates/activityTemplates';

export interface EvaluacionPromptParams {
  nivel: string;
  eje: string | null;
  oa_code: string;
  oa_texto: string;
  tipo_evaluacion: string;
  tipo_preguntas: string;
  n_preguntas_multiple: number;
  n_preguntas_desarrollo: number;
  instrumento: string;
  texto_1_tipo: string;
  texto_2_tipo: string;
}

export function buildEvaluacionMinimalPrompt(params: EvaluacionPromptParams): string {
  const {
    nivel,
    eje,
    oa_code,
    oa_texto,
    tipo_evaluacion,
    tipo_preguntas,
    n_preguntas_multiple,
    n_preguntas_desarrollo,
    texto_1_tipo,
    texto_2_tipo
  } = params;

  const techniqueType = (tipo_evaluacion === 'formativa' || tipo_evaluacion === 'diagnostica') ? 'OREO' : 'RICE';

  return `Curso: ${nivel}
Unidad: General curricular
OA: ${oa_code} — ${oa_texto}
Tema: Evaluación consolidada y pauta
Nivel DUA: Universal

Genera los textos de lectura y el listado de preguntas.

Técnica de respuesta de desarrollo requerida:
${techniqueType}

Instrucciones de textos:
- Texto 1 de tipo ${texto_1_tipo}.
- Texto 2 de tipo ${texto_2_tipo}.
- Extensión obligatoria de acuerdo con el nivel escolar. Cuenta las palabras reales.

Reglas de unicidad de preguntas:
- Genera exactamente ${n_preguntas_multiple} preguntas de tipo seleccion_multiple únicas e irrepetibles. Para cada pregunta de selección múltiple, incluye el campo clave con la letra de la respuesta correcta (A, B, C o D). DISTRIBUCIÓN DE CLAVES OBLIGATORIA: De las preguntas de selección múltiple, exactamente el 25% deben tener clave A, 25% clave B, 25% clave C y 25% clave D. Está PROHIBIDO tener más de 2 preguntas consecutivas con la misma clave. Varía deliberadamente cuál alternativa es la correcta en cada pregunta.
- Genera exactamente ${n_preguntas_desarrollo} preguntas de tipo desarrollo con enunciados e ideas enteramente distintas entre sí.
- Ninguna pregunta de alternativas o desarrollo puede repetirse ni parafrasearse.
`;
}

export interface GuiaPromptParams {
  nivel: string;
  eje: string | null;
  oa_code: string;
  oa_texto: string;
  templateId: string;
  incluir_dua: boolean;
  actividad_adicional?: string | null;
}

export function buildGuiaMinimalPrompt(params: GuiaPromptParams): string {
  const { nivel, eje, oa_code, oa_texto, templateId, incluir_dua, actividad_adicional } = params;
  const template = guideTemplates[templateId] || guideTemplates.comprension_lectora;
  const additionalActivityStruct = actividad_adicional ? activityTemplates[actividad_adicional] : null;

  return `Curso: ${nivel}
Unidad: General curricular
OA: ${oa_code} — ${oa_texto}
Tema: Guía de trabajo
Nivel DUA: ${incluir_dua ? 'Sí (Universal y DUA)' : 'No (Solo Universal)'}
Plantilla: ${template.nombre} (Secciones: ${JSON.stringify(template.secciones.map(s => s.tituloDefault))})

Estructura base a completar:
${JSON.stringify(template.secciones.map(s => ({ key: s.key, titulo: s.tituloDefault, instruccion: s.instruccionAI })), null, 2)}

${additionalActivityStruct ? `Actividad adicional a integrar:\n- Nombre: ${additionalActivityStruct.nombre}\n- Estructura: ${additionalActivityStruct.estructura}` : ''}
`;
}
