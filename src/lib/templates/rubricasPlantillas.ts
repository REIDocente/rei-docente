export interface RubricaCriterio {
  nombre: string;
  oa?: string;
  excelente?: string;
  bueno?: string;
  suficiente?: string;
  insuficiente?: string;
  logrado?: string;
  no_logrado?: string;
  destacado?: string;
  en_desarrollo?: string;
  descripcion?: string;
}

export interface Rubrica {
  titulo: string;
  tipo_instrumento: string;
  instruccion: string;
  criterios: RubricaCriterio[];
}

export const getRubricaHolistica = (devQuestions: any[]): Rubrica => ({
  titulo: "RÚBRICA HOLÍSTICA DE EVALUACIÓN",
  tipo_instrumento: "rubrica_holistica",
  instruccion: "Evalúa el desempeño global del estudiante en base a los siguientes descriptores integrales.",
  criterios: [
    {
      nombre: "Destacado (4 pts)",
      descripcion: "El estudiante demuestra una comprensión profunda de los textos. Responde con precisión y rigurosidad, relacionando ideas complejas y aplicando de manera sobresaliente las habilidades de análisis."
    },
    {
      nombre: "Logrado (3 pts)",
      descripcion: "El estudiante comprende de forma clara los textos. Responde adecuadamente las preguntas de desarrollo y selección múltiple cumpliendo de forma satisfactoria con los indicadores de evaluación."
    },
    {
      nombre: "En Desarrollo (2 pts)",
      descripcion: "El estudiante demuestra una comprensión parcial o fragmentada de los textos. Responde con imprecisión o con explicaciones incompletas que no logran cubrir del todo los indicadores."
    },
    {
      nombre: "No Logrado (1 pt)",
      descripcion: "El estudiante presenta severas dificultades de comprensión lectora. Sus respuestas son erróneas, incoherentes o no se relacionan con los indicadores de evaluación."
    }
  ]
});

export const getListaCotejo = (devQuestions: any[]): Rubrica => {
  const criterios: RubricaCriterio[] = [];
  if (devQuestions.length > 0) {
    devQuestions.forEach((q, idx) => {
      const num = q.numero_original || q.numero || (idx + 1);
      criterios.push({
        nombre: `Pregunta ${num}: Evalúa si el alumno responde al indicador: ${q.indicador || 'Comprensión lectora.'}`,
        oa: q.oa || 'General',
        logrado: "Responde de forma completa al indicador aplicando la técnica solicitada.",
        no_logrado: "No responde, o responde de forma vaga o incoherente."
      });
    });
  } else {
    criterios.push({
      nombre: "Comprende las ideas principales de los textos leídos.",
      oa: "General",
      logrado: "Identifica correctamente las ideas centrales en las preguntas de selección múltiple.",
      no_logrado: "Falla al reconocer las ideas centrales del texto."
    });
  }
  return {
    titulo: "LISTA DE COTEJO DE DESEMPEÑO",
    tipo_instrumento: "lista_cotejo",
    instruccion: "Marque con un Sí (Logrado) o No (No Logrado) la presencia del indicador de desempeño en cada ítem.",
    criterios
  };
};

export const getAnaliticaDescriptiva = (devQuestions: any[]): Rubrica => {
  const criterios: RubricaCriterio[] = [];
  if (devQuestions.length > 0) {
    devQuestions.forEach((q, idx) => {
      const num = q.numero_original || q.numero || (idx + 1);
      criterios.push({
        nombre: `Pregunta ${num} (${q.habilidad || 'Análisis'})`,
        oa: q.oa || 'General',
        excelente: `Responde con total claridad y precisión al indicador: ${q.indicador || 'Comprender e integrar información.'}. Aplica de forma excelente la técnica de respuesta.`,
        bueno: `Responde de forma satisfactoria al indicador: ${q.indicador || 'Comprender e integrar información.'}. Aplica de forma aceptable la técnica.`,
        suficiente: `Responde de forma parcial o con imprecisiones al indicador: ${q.indicador || 'Comprender e integrar información.'}.`,
        insuficiente: `No responde, o la respuesta no tiene relación con el indicador: ${q.indicador || 'Comprender e integrar información.'}.`
      });
    });
  } else {
    criterios.push({
      nombre: "Comprensión e Integración de Ideas",
      oa: "General",
      excelente: "Identifica con precisión las ideas principales y secundarias en todas las preguntas.",
      bueno: "Reconoce de manera adecuada las ideas principales en la mayoría de las preguntas.",
      suficiente: "Reconoce parcialmente las ideas principales con imprecisiones.",
      insuficiente: "Muestra graves dificultades para comprender o identificar las ideas del texto."
    });
  }
  return {
    titulo: "RÚBRICA ANALÍTICA DESCRIPTIVA",
    tipo_instrumento: "analitica_descriptiva",
    instruccion: "Use los descriptores detallados para evaluar el nivel de logro del estudiante.",
    criterios
  };
};

export const getAnaliticaCuantitativa = (devQuestions: any[]): Rubrica => {
  const criterios: RubricaCriterio[] = [];
  if (devQuestions.length > 0) {
    devQuestions.forEach((q, idx) => {
      const num = q.numero_original || q.numero || (idx + 1);
      criterios.push({
        nombre: `Pregunta ${num}: Desempeño en habilidad de ${q.habilidad || 'Comprensión'} para el indicador: ${q.indicador || 'Análisis lector'}`,
        oa: q.oa || 'General',
        destacado: "Sobresaliente (4 pts). Cumple con todo lo solicitado y excede las expectativas.",
        logrado: "Satisfactorio (3 pts). Responde de forma completa al indicador.",
        en_desarrollo: "Parcial (2 pts). Responde con imprecisiones o de forma incompleta.",
        no_logrado: "Insuficiente (1 pt). No responde o la respuesta no tiene relación."
      });
    });
  } else {
    criterios.push({
      nombre: "Comprensión lectora general",
      oa: "General",
      destacado: "Sobresaliente. Responde correctamente todos los ítems.",
      logrado: "Satisfactorio. Responde correctamente la gran mayoría de los ítems.",
      en_desarrollo: "Parcial. Muestra comprensión de nivel básico o intermedio.",
      no_logrado: "Insuficiente. No demuestra comprensión lectora mínima."
    });
  }
  return {
    titulo: "ESCALA DE APRECIACIÓN CUANTITATIVA",
    tipo_instrumento: "analitica_cuantitativa",
    instruccion: "Valore el desempeño del estudiante asignando el puntaje correspondiente a cada nivel.",
    criterios
  };
};

export const getPautaCorreccion = (devQuestions: any[]): Rubrica => {
  const criterios: RubricaCriterio[] = [];
  if (devQuestions.length > 0) {
    devQuestions.forEach((q, idx) => {
      const num = q.numero_original || q.numero || (idx + 1);
      criterios.push({
        nombre: `Pregunta ${num} (Desarrollo)`,
        logrado: `Respuesta correcta y coherente: ${q.respuesta_esperada || 'Respuesta esperada.'}`,
        no_logrado: "Respuesta incorrecta, incoherente o ausente."
      });
    });
  } else {
    criterios.push({
      nombre: "Preguntas de Selección Múltiple",
      logrado: "Respuesta coincide con la clave de la pauta.",
      no_logrado: "Respuesta incorrecta."
    });
  }
  return {
    titulo: "PAUTA DE CORRECCIÓN",
    tipo_instrumento: "pauta_correccion",
    instruccion: "Utilice la pauta para validar las respuestas esperadas y puntajes asignados.",
    criterios
  };
};

export const buildRubrica = (tipo: string, devQuestions: any[]): Rubrica => {
  switch (tipo) {
    case 'rubrica_holistica':
      return getRubricaHolistica(devQuestions);
    case 'lista_cotejo':
      return getListaCotejo(devQuestions);
    case 'analitica_descriptiva':
    case 'rubrica_analitica':
      return getAnaliticaDescriptiva(devQuestions);
    case 'analitica_cuantitativa':
    case 'escala_apreciacion':
      return getAnaliticaCuantitativa(devQuestions);
    case 'pauta_correccion':
      return getPautaCorreccion(devQuestions);
    default:
      return getAnaliticaDescriptiva(devQuestions);
  }
};
