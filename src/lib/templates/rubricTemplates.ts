export interface RubricTemplate {
  tipo: string;
  nombre: string;
  estructura: string;
}

export const rubricTemplates: Record<string, RubricTemplate> = {
  lista_cotejo: {
    tipo: 'lista_cotejo',
    nombre: 'Lista de Cotejo',
    estructura: `[ESTRUCTURA DE LISTA DE COTEJO]
- Criterios dicotómicos (Sí / No o Logrado / No Logrado).
- Columnas: Dimensión / Indicador de logro | Logrado (Sí) | No Logrado (No) | Observaciones.
- Ejemplo de Relleno: [COMPLETAR criterios específicos del OA]`
  },
  rubrica_holistica: {
    tipo: 'rubrica_holistica',
    nombre: 'Rúbrica Holística',
    estructura: `[ESTRUCTURA DE RÚBRICA HOLÍSTICA]
- Desempeño evaluado de manera global y unificada.
- Niveles:
  * Destacado: Descripción global de desempeño excelente [COMPLETAR]
  * Logrado: Descripción global de desempeño adecuado [COMPLETAR]
  * En Desarrollo: Descripción global de desempeño parcial [COMPLETAR]
  * No Logrado: Descripción global de desempeño deficiente [COMPLETAR]`
  },
  rubrica_analitica: {
    tipo: 'rubrica_analitica',
    nombre: 'Rúbrica Analítica Descriptiva',
    estructura: `[ESTRUCTURA DE RÚBRICA ANALÍTICA DESCRIPTIVA]
- Criterios detallados desglosados por dimensiones específicas del OA.
- Niveles: Excelente | Bueno | Suficiente / En Desarrollo | Insuficiente / No Logrado.
- Cada celda debe tener un descriptor de desempeño concreto:
  * Dimensión [COMPLETAR nombre]
  * Excelente descriptor [COMPLETAR]
  * Bueno descriptor [COMPLETAR]
  * En Desarrollo descriptor [COMPLETAR]
  * No Logrado descriptor [COMPLETAR]`
  },
  escala_apreciacion: {
    tipo: 'escala_apreciacion',
    nombre: 'Escala de Apreciación Cuantitativa',
    estructura: `[ESTRUCTURA DE ESCALA DE APRECIACIÓN CUANTITATIVA]
- Criterios evaluados con puntuación o niveles de frecuencia/logro.
- Columnas: Criterio / Indicador | Destacado (4 pts) | Logrado (3 pts) | En Desarrollo (2 pts) | No Logrado (1 pt).
- Ejemplo de Relleno: [COMPLETAR criterios e indicadores del OA]`
  }
};
