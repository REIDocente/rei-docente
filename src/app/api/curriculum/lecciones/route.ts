import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { staticCurriculum } from '@/lib/curriculum/index';

function mapNivelParam(nivelParam: string): string {
  const norm = (nivelParam || '').toLowerCase().replace(/_/g, ' ');
  if (norm.includes('5') || norm.includes('quinto')) return '5° Básico';
  if (norm.includes('6') || norm.includes('sexto')) return '6° Básico';
  if (norm.includes('7') || norm.includes('septimo') || norm.includes('séptimo')) return '7° Básico';
  if (norm.includes('8') || norm.includes('octavo')) return '8° Básico';
  if (norm.includes('1') || norm.includes('primero') || norm.includes('i°')) return '1° Medio';
  if (norm.includes('2') || norm.includes('segundo') || norm.includes('ii°')) return '2° Medio';
  return nivelParam;
}

const FALLBACK_LESSONS: Record<string, Record<number, { numero: number; titulo: string; oa_codes: string[] }[]>> = {
  '5° Básico': {
    1: [
      { numero: 1, titulo: 'Fútbol y trabajo en equipo', oa_codes: ['OA 1', 'OA 3', 'OA 9'] },
      { numero: 2, titulo: 'Jugar como niña', oa_codes: ['OA 6', 'OA 24', 'OA 26'] },
      { numero: 3, titulo: 'Deporte y perseverancia', oa_codes: ['OA 11', 'OA 17', 'OA 18'] }
    ],
    2: [
      { numero: 4, titulo: 'Emociones en verso', oa_codes: ['OA 5', 'OA 9', 'OA 26'] },
      { numero: 5, titulo: 'Narrar para no olvidar', oa_codes: ['OA 3', 'OA 14', 'OA 17'] },
      { numero: 6, titulo: 'Vientos que arrasan', oa_codes: ['OA 2', 'OA 6', 'OA 7'] }
    ],
    3: [
      { numero: 7, titulo: 'Coexistir en armonía', oa_codes: ['OA 2', 'OA 5', 'OA 9'] },
      { numero: 8, titulo: 'Guardianes de la naturaleza', oa_codes: ['OA 3', 'OA 24', 'OA 26'] },
      { numero: 9, titulo: 'Pueblos Originarios: Espíritu Verde', oa_codes: ['OA 6', 'OA 14', 'OA 18'] }
    ],
    4: [
      { numero: 10, titulo: 'Viajar para volver a empezar', oa_codes: ['OA 3', 'OA 9', 'OA 17'] },
      { numero: 11, titulo: 'Viajes migratorios', oa_codes: ['OA 6', 'OA 11', 'OA 28'] }
    ]
  },
  '6° Básico': {
    1: [
      { numero: 1, titulo: 'Juegos e imaginación', oa_codes: ['OA 1', 'OA 3', 'OA 4'] },
      { numero: 2, titulo: 'Creatividad e innovación', oa_codes: ['OA 6', 'OA 24', 'OA 27'] },
      { numero: 3, titulo: 'Aventuras y viajes en el tiempo', oa_codes: ['OA 2', 'OA 7', 'OA 14'] }
    ],
    2: [
      { numero: 4, titulo: 'El ser humano y la naturaleza', oa_codes: ['OA 3', 'OA 4', 'OA 5'] },
      { numero: 5, titulo: 'La conservación de la biodiversidad', oa_codes: ['OA 11', 'OA 24', 'OA 29'] },
      { numero: 6, titulo: 'Conectándonos con la naturaleza', oa_codes: ['OA 6', 'OA 7', 'OA 15'] }
    ],
    3: [
      { numero: 7, titulo: 'Investigando el universo', oa_codes: ['OA 3', 'OA 4', 'OA 6'] },
      { numero: 8, titulo: 'Distintas creencias sobre el cielo', oa_codes: ['OA 7', 'OA 12', 'OA 24'] },
      { numero: 9, titulo: 'Historias de vida', oa_codes: ['OA 2', 'OA 11', 'OA 14'] }
    ],
    4: [
      { numero: 10, titulo: 'Somos iguales', oa_codes: ['OA 3', 'OA 4', 'OA 7'] },
      { numero: 11, titulo: 'Mujeres activistas', oa_codes: ['OA 6', 'OA 11', 'OA 18'] }
    ]
  },
  '7° Básico': {
    1: [
      { numero: 1, titulo: 'Tener un amigo', oa_codes: ['OA 3', 'OA 9', 'OA 20'] },
      { numero: 2, titulo: 'Confiar y compartir', oa_codes: ['OA 7', 'OA 11', 'OA 21'] },
      { numero: 3, titulo: 'Expresar mi interior', oa_codes: ['OA 4', 'OA 14', 'OA 24'] },
      { numero: 4, titulo: 'Trabajar por mi metas', oa_codes: ['OA 13', 'OA 15', 'OA 16'] }
    ],
    2: [
      { numero: 1, titulo: 'Respetando mis derechos y los tuyos', oa_codes: ['OA 3', 'OA 7', 'OA 21'] },
      { numero: 2, titulo: 'Con todos los sentimientos', oa_codes: ['OA 10', 'OA 11', 'OA 20'] },
      { numero: 3, titulo: 'Conociendo relatos ancestrales', oa_codes: ['OA 3', 'OA 24', 'OA 25'] },
      { numero: 4, titulo: 'Apoyándonos mutuamente', oa_codes: ['OA 8', 'OA 14', 'OA 15'] }
    ],
    3: [
      { numero: 1, titulo: 'Con el océano y sus habitantes', oa_codes: ['OA 2', 'OA 3', 'OA 20'] },
      { numero: 2, titulo: 'En nuevos territorios', oa_codes: ['OA 7', 'OA 11', 'OA 21'] },
      { numero: 3, titulo: 'En la creación literaria', oa_codes: ['OA 4', 'OA 10', 'OA 24'] },
      { numero: 4, titulo: 'Protegiendo los espacios naturales', oa_codes: ['OA 9', 'OA 14', 'OA 17'] }
    ],
    4: [
      { numero: 1, titulo: 'Historias del pasado', oa_codes: ['OA 2', 'OA 5', 'OA 7'] },
      { numero: 2, titulo: 'La visión popular', oa_codes: ['OA 10', 'OA 24', 'OA 25'] },
      { numero: 3, titulo: 'Mentiras y verdades', oa_codes: ['OA 9', 'OA 20', 'OA 21'] },
      { numero: 4, titulo: 'Representaciones de vida', oa_codes: ['OA 8', 'OA 17', 'OA 22'] }
    ]
  },
  '8° Básico': {
    1: [
      { numero: 1, titulo: 'En un instante mágico', oa_codes: ['OA 3', 'OA 8', 'OA 13'] },
      { numero: 2, titulo: 'En un rincón cotidiano', oa_codes: ['OA 2', 'OA 11', 'OA 22'] },
      { numero: 3, titulo: 'Poemas (lección de investigación)', oa_codes: ['OA 4', 'OA 25', 'OA 26'] },
      { numero: 4, titulo: 'Entrevista a Elisa Avendaño', oa_codes: ['OA 14', 'OA 18', 'OA 21'] }
    ],
    2: [
      { numero: 1, titulo: 'Lo que no queremos ver', oa_codes: ['OA 2', 'OA 5', 'OA 7'] },
      { numero: 2, titulo: 'Lo que debemos descifrar', oa_codes: ['OA 3', 'OA 11', 'OA 13'] },
      { numero: 3, titulo: 'Lo que vemos distinto (investigación)', oa_codes: ['OA 23', 'OA 25', 'OA 26'] },
      { numero: 4, titulo: 'Lo que nos quieren hacer creer', oa_codes: ['OA 9', 'OA 15', 'OA 22'] }
    ],
    3: [
      { numero: 1, titulo: 'Aventuras que atraviesan el tiempo', oa_codes: ['OA 3', 'OA 6', 'OA 23'] },
      { numero: 2, titulo: 'Heroísmos revisitados (investigación)', oa_codes: ['OA 14', 'OA 21', 'OA 26'] },
      { numero: 3, titulo: 'Historias de vidas y de pueblos', oa_codes: ['OA 2', 'OA 4', 'OA 24'] },
      { numero: 4, titulo: 'Saberes ancestrales', oa_codes: ['OA 10', 'OA 16', 'OA 22'] }
    ],
    4: [
      { numero: 1, titulo: 'Hacia un mundo distópico', oa_codes: ['OA 2', 'OA 3', 'OA 22'] },
      { numero: 2, titulo: 'Más allá de lo imaginado (investigación)', oa_codes: ['OA 8', 'OA 25', 'OA 26'] },
      { numero: 3, titulo: 'A donde anhelamos llegar', oa_codes: ['OA 3', 'OA 12', 'OA 13'] },
      { numero: 4, titulo: 'Construir un tiempo mejor', oa_codes: ['OA 9', 'OA 15', 'OA 16'] }
    ]
  }
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nivelParam = searchParams.get('nivel');
    const unidadParam = searchParams.get('unidad');

    if (!nivelParam || !unidadParam) {
      return NextResponse.json({ error: 'Se requieren parámetros "nivel" y "unidad"' }, { status: 400 });
    }

    const nivelNombre = mapNivelParam(nivelParam);
    const unitNum = Number(unidadParam);

    // Intentar consultar base de datos real
    try {
      const { data: unit, error: unitErr } = await supabase
        .from('curriculum_unidades')
        .select('id')
        .eq('nivel', nivelNombre)
        .eq('unidad_numero', unitNum)
        .maybeSingle();

      if (!unitErr && unit) {
        const { data: lecciones, error: lecErr } = await supabase
          .from('curriculum_lecciones')
          .select('id, leccion_numero, titulo_leccion, oa_basales')
          .eq('unidad_id', unit.id)
          .order('leccion_numero', { ascending: true });

        if (!lecErr && lecciones && lecciones.length > 0) {
          // Extraer códigos de OAs (primeros 3 de cada lección)
          const allOaCodesSet = new Set<string>();
          lecciones.forEach((l: any) => {
            const codes = (l.oa_basales || []).slice(0, 3);
            codes.forEach((c: string) => allOaCodesSet.add(c));
          });
          const allOaCodes = Array.from(allOaCodesSet);

          // Consultar los textos oficiales correspondientes en curriculum_oa
          const oasMap: Record<string, { id: string; codigo: string; texto: string }> = {};
          if (allOaCodes.length > 0) {
            const { data: oasData, error: oasErr } = await supabase
              .from('curriculum_oa')
              .select('id, codigo_oa, texto_oa')
              .eq('nivel', nivelNombre)
              .in('codigo_oa', allOaCodes);

            if (!oasErr && oasData) {
              oasData.forEach((oa: any) => {
                oasMap[oa.codigo_oa] = {
                  id: oa.id,
                  codigo: oa.codigo_oa,
                  texto: oa.texto_oa || 'Objetivo de aprendizaje oficial.'
                };
              });
            }
          }

          // Mapear lecciones estructurando los OAs según espera el frontend
          const result = lecciones.map((l: any) => {
            const codes = (l.oa_basales || []).slice(0, 3);
            const oas = codes.map((code: string, idx: number) => {
              if (oasMap[code]) {
                return oasMap[code];
              }
              // Fallback estático en memoria
              const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
              return {
                id: `${l.id}-${code}-${idx}`,
                codigo: code,
                texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.'
              };
            });

            return {
              id: l.id,
              numero: l.leccion_numero,
              titulo: l.titulo_leccion,
              oas: oas
            };
          });

          return NextResponse.json(result);
        }
      }
    } catch (dbErr) {
      console.warn('[API lecciones] Error consultando Supabase, usando fallback estático:', dbErr);
    }

    // Fallback estático si la base de datos no está poblada o falla
    const levelLessons = FALLBACK_LESSONS[nivelNombre]?.[unitNum];
    if (levelLessons) {
      const fallbackResult = levelLessons.map((l, idx) => {
        const oas = l.oa_codes.map((code, oaIdx) => {
          const found = staticCurriculum.oas.find(oa => oa.nivel === nivelNombre && oa.codigo_oa === code);
          return {
            id: oaIdx + idx * 10 + 10000,
            codigo: code,
            texto: found?.texto_oa || 'Objetivo de aprendizaje oficial.'
          };
        });
        return {
          id: l.numero + 2000,
          numero: l.numero,
          titulo: l.titulo,
          oas: oas
        };
      });
      return NextResponse.json(fallbackResult);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
