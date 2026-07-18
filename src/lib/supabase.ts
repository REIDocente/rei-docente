import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

const realSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to create chainable mock query builder
function makeMockQueryBuilder(data: any, tableName?: string): any {
  let filteredData = data;
  const builder = {
    select: () => builder,
    order: () => builder,
    limit: () => builder,
    eq: (column: string, value: any) => {
      if (Array.isArray(filteredData)) {
        filteredData = filteredData.filter((item: any) => item[column] === value);
      } else if (filteredData && typeof filteredData === 'object') {
        if (filteredData[column] !== value) {
          filteredData = null;
        }
      }
      return builder;
    },
    maybeSingle: () => makeMockQueryBuilder(Array.isArray(filteredData) ? (filteredData[0] || null) : filteredData, tableName),
    single: () => makeMockQueryBuilder(Array.isArray(filteredData) ? (filteredData[0] || null) : filteredData, tableName),
    insert: (payload: any) => {
      if (typeof window !== 'undefined' && tableName) {
        try {
          if (tableName === 'guias') {
            console.log('[MockDB guias] insertando nueva guía:', JSON.stringify(payload).substring(0, 200));
          }
          const storageKey = `mock_${tableName}`;
          const list = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
          const payloads = Array.isArray(payload) ? payload : [payload];
          payloads.forEach(p => {
            const idx = list.findIndex((x: any) => x.id === p.id);
            if (idx > -1) {
              list[idx] = p;
            } else {
              list.push(p);
            }
          });
          window.localStorage.setItem(storageKey, JSON.stringify(list));
          if (tableName === 'guias') {
            console.log('[MockDB guias] mock_guias después de insertar:', window.localStorage.getItem('mock_guias'));
          }
        } catch (e) {}
      }
      return makeMockQueryBuilder(payload, tableName);
    },
    update: (payload: any) => makeMockQueryBuilder(payload, tableName),
    delete: () => makeMockQueryBuilder([], tableName),
    then: (onfulfilled: any) => {
      return Promise.resolve({ data: filteredData, error: null }).then(onfulfilled);
    }
  };
  return builder;
}

const mockProfiles = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'docente.test@gmail.com',
  full_name: 'Jacqueline',
  plan_name: 'premium',
  plan_status: 'active'
};

const mockPlannings = [
  {
    id: 'plan-1',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    subject: 'Lenguaje y Literatura',
    grade: '2° Medio',
    learning_objective: 'OA 2: Proponer interpretaciones de textos de diversos géneros o épocas...',
    unit: 'Unidad 1: Desafíos y búsquedas',
    content: {
      writing_technique: 'rice',
      backward_design: {
        objective: 'Propósito: Analizar críticamente textos narrativos utilizando la técnica RICE para estructurar respuestas fundamentadas.',
        assessment_evidence: 'Evidencia: Ticket de salida escrito donde el alumno aplica RICE para explicar la motivación de un personaje con una cita del texto.',
        activities_sequence: 'Inicio: Presentación del objetivo y modelamiento de la técnica RICE (Repetir, Incluir, Citar, Explicar).\n\nDesarrollo: Lectura conjunta de un fragmento literario. Los estudiantes trabajan individualmente en responder una pregunta compleja sobre el texto guiados por el organizador gráfico RICE.\n\nCierre: Discusión en plenario y co-evaluación rápida de respuestas.'
      },
      dua_adaptations: 'Adaptación universal: Organizadores visuales de la estructura RICE para todo el curso.\nAdaptación focalizada: Pauta de vocabulario contextualizado.\nAdaptación intensiva: Audioguía de lectura y mediación individualizada.',
      rti_supports: {
        general: 'Apoyo general: Retroalimentación grupal constante en el aula y andamiaje RICE proyectado.',
        targeted: 'Apoyo focalizado: Trabajo en pequeños grupos con guía guiada enfocada en la selección de citas.',
        intensive: 'Apoyo intensivo: Sesión personalizada uno a uno para estructurar la explicación de la evidencia.'
      },
      gamification: '',
      nlp_technique: 'Apertura: Respiración guiada y frase de auto-afirmación: "Hoy soy capaz de analizar en profundidad".\nPausa: Breve estiramiento físico al cambiar de actividad.\nCierre: Metacognición expresando cómo se sienten sobre su aprendizaje en una frase.',
      rubric: 'Criterio 1: Repite e incluye la pregunta en su respuesta (2 pts).\nCriterio 2: Cita evidencia textual pertinente (3 pts).\nCriterio 3: Explica la relación entre la cita y la idea (3 pts).'
    },
    reading_level: {
      estimated_level: 'Séptimo básico',
      warning_alert: 'Nivel adecuado de lectura estimado.'
    }
  },
  {
    id: 'plan-2',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    subject: 'Lenguaje y Literatura',
    grade: '6° Básico',
    learning_objective: 'OA 3: Analizar las narraciones leídas para enriquecer su comprensión...',
    unit: 'Unidad 2: Relaciones humanas',
    content: {
      writing_technique: 'oreo',
      backward_design: {
        objective: 'Propósito: Fundamentar opiniones sobre las actitudes de los personajes utilizando la técnica OREO.',
        assessment_evidence: 'Evidencia: Párrafo de opinión estructurado con OREO sobre una acción moral en la lectura.',
        activities_sequence: 'Inicio: Activación de conocimientos previos sobre relaciones humanas.\n\nDesarrollo: Modelamiento de la técnica OREO (Opinión, Razón, Ejemplo, Opinión de nuevo). Redacción de opiniones autónomas.\n\nCierre: Lectura de opiniones seleccionadas.'
      },
      dua_adaptations: 'Adaptación universal: Ficha nemotécnica de la estructura OREO.\nAdaptación focalizada: Plantilla con conectores lógicos prediseñados.\nAdaptación intensiva: Apoyo oral y transcripción por el docente.',
      rti_supports: {
        general: 'Apoyo general: Retroalimentación grupal de la estructura de opinión.',
        targeted: 'Apoyo focalizado: Banco de conectores y modelaje extra del paso de la Razón.',
        intensive: 'Apoyo intensivo: Enfoque paso a paso guiado de manera directa.'
      },
      gamification: '',
      nlp_technique: 'Apertura: Conexión visual y frase de foco.\nPausa: Cambio de foco mental.\nCierre: Compartir un logro en parejas.',
      rubric: 'Criterio 1: Estructura OREO completa (4 pts).\nCriterio 2: Conexión con el tema de relaciones humanas (2 pts).'
    },
    reading_level: {
      estimated_level: 'Quinto básico',
      warning_alert: 'Nivel adecuado de lectura estimado.'
    }
  }
];

const mockGuias = [
  {
    id: 'guia-1',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    nivel: '2° Medio',
    eje: 'Lectura',
    titulo: 'Guía de Comprensión Lectora: El Túnel',
    formato: 'Word',
    rti_nivel: 'Universal'
  }
];

const mockEvaluaciones = [
  {
    id: 'ev-1',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    nivel: '2° Medio',
    eje: 'Lectura',
    titulo: 'Evaluación del Mito de Sísifo',
    n_preguntas: 10,
    dificultad: 'Media'
  }
];

const mockVisuals = [
  {
    id: 'vis-1',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    tema: 'Infografía del Ecosistema Marino',
    tipo: 'Infografía',
    imagen_url: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?q=80&w=300&auto=format&fit=crop'
  }
];

export const supabase = new Proxy(realSupabase, {
  get(target, prop, receiver) {
    const isClient = typeof window !== 'undefined';
    const useMock = isClient && window.localStorage.getItem('use_mock_auth') === 'true';

    if (useMock) {
      if (prop === 'auth') {
        return {
          getUser: async () => ({
            data: {
              user: {
                id: '00000000-0000-0000-0000-000000000000',
                email: 'docente.test@gmail.com',
                role: 'authenticated',
                aud: 'authenticated',
                app_metadata: {},
                user_metadata: {},
                created_at: new Date().toISOString()
              }
            },
            error: null
          }),
          getSession: async () => ({
            data: {
              session: {
                access_token: 'mock-access-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh-token',
                user: {
                  id: '00000000-0000-0000-0000-000000000000',
                  email: 'docente.test@gmail.com'
                }
              }
            },
            error: null
          }),
          signOut: async () => {
            if (isClient) window.localStorage.removeItem('use_mock_auth');
            return { error: null };
          },
          onAuthStateChange: (callback: any) => {
            const session = {
              access_token: 'mock-access-token',
              token_type: 'bearer',
              expires_in: 3600,
              user: {
                id: '00000000-0000-0000-0000-000000000000',
                email: 'docente.test@gmail.com'
              }
            };
            callback('SIGNED_IN', session);
            return {
              data: {
                subscription: {
                  unsubscribe: () => {}
                }
              }
            };
          }
        };
      }

      if (prop === 'from') {
        return (table: string) => {
          if (table === 'user_profiles') return makeMockQueryBuilder(mockProfiles, table);
          if (table === 'plannings') return makeMockQueryBuilder(mockPlannings, table);
          if (table === 'guias') {
            let list = [...mockGuias];
            if (isClient) {
              try {
                const stored = window.localStorage.getItem('mock_guias');
                const dynamicGuias = stored ? JSON.parse(stored) : [];
                console.log('[MockDB guias] localStorage mock_guias:', stored);
                const combined = [...mockGuias, ...dynamicGuias];
                console.log('[MockDB guias] combined result:', combined);

                const ids = new Set(list.map((x: any) => x.id));
                list = [...list, ...dynamicGuias.filter((x: any) => !ids.has(x.id))];
              } catch (e) {}
            }
            return makeMockQueryBuilder(list, table);
          }
          if (table === 'evaluaciones') {
            let list = [...mockEvaluaciones];
            if (isClient) {
              try {
                const localList = JSON.parse(window.localStorage.getItem('mock_evaluaciones') || '[]');
                const ids = new Set(list.map((x: any) => x.id));
                list = [...list, ...localList.filter((x: any) => !ids.has(x.id))];
              } catch (e) {}
            }
            return makeMockQueryBuilder(list, table);
          }
          if (table === 'recursos_visuales') return makeMockQueryBuilder(mockVisuals, table);
          if (table === 'biblioteca_libros') {
            let list: any[] = [];
            if (isClient) {
              try {
                list = JSON.parse(window.localStorage.getItem('mock_biblioteca_libros') || '[]');
              } catch (e) {}
            }
            return makeMockQueryBuilder(list, table);
          }
          if (table === 'lecturas_docente') {
            let list: any[] = [];
            if (isClient) {
              try {
                list = JSON.parse(window.localStorage.getItem('mock_lecturas_docente') || '[]');
              } catch (e) {}
            }
            return makeMockQueryBuilder(list, table);
          }
          return makeMockQueryBuilder([], table);
        };
      }

      if (prop === 'rpc') {
        return (fn: string) => {
          if (fn === 'get_user_profile_count') {
            return Promise.resolve({ data: 1, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        };
      }
    }

    return Reflect.get(target, prop, receiver);
  }
});
