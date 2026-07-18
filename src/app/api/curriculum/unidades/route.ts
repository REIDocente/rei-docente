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

const FALLBACK_UNIDADES: Record<string, { numero: number; titulo: string; descripcion: string }[]> = {
  '5° Básico': [
    { numero: 1, titulo: 'La unión hace la fuerza', descripcion: 'Trabajo en equipo, colaboración y perseverancia.' },
    { numero: 2, titulo: 'Emociones que sanan', descripcion: 'Comprensión de poemas y narraciones que expresan emociones.' },
    { numero: 3, titulo: 'Coexistir en armonía', descripcion: 'El vínculo con la naturaleza y los saberes de los pueblos originarios.' },
    { numero: 4, titulo: 'Un mundo en movimiento', descripcion: 'Viajes, migraciones y cambios en el tiempo.' }
  ],
  '6° Básico': [
    { numero: 1, titulo: 'El poder de la aventura, la imaginación y la creatividad', descripcion: 'Desarrollo de lectura comprensiva y expresión oral.' },
    { numero: 2, titulo: 'El medioambiente y su protección', descripcion: 'Comprensión de poemas y textos informativos.' },
    { numero: 3, titulo: 'El ser humano y su vínculo con el cosmos', descripcion: 'Lectura de mitos, leyendas y producción escrita.' },
    { numero: 4, titulo: 'Respetar las diferencias y la igualdad de derechos', descripcion: 'Análisis dramático y exposiciones orales.' }
  ],
  '7° Básico': [
    { numero: 1, titulo: '¿Qué me hace sentir bien?', descripcion: 'Unidad 1 de 7° Básico' },
    { numero: 2, titulo: '¿Cómo construimos comunidad?', descripcion: 'Unidad 2 de 7° Básico' },
    { numero: 3, titulo: 'Somos naturaleza', descripcion: 'Unidad 3 de 7° Básico' },
    { numero: 4, titulo: '¿Qué nos cuenta el mundo?', descripcion: 'Unidad 4 de 7° Básico' }
  ],
  '8° Básico': [
    { numero: 1, titulo: '¿Dónde empieza el amor?', descripcion: 'Unidad 1 de 8° Básico' },
    { numero: 2, titulo: '¿Es todo como parece?', descripcion: 'Unidad 2 de 8° Básico' },
    { numero: 3, titulo: '¿Qué queda del pasado?', descripcion: 'Unidad 3 de 8° Básico' },
    { numero: 4, titulo: '¿Hacia dónde va el futuro?', descripcion: 'Unidad 4 de 8° Básico' }
  ]
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nivelParam = searchParams.get('nivel');

    if (!nivelParam) {
      return NextResponse.json({ error: 'Se requiere el parámetro "nivel"' }, { status: 400 });
    }

    const nivelNombre = mapNivelParam(nivelParam);

    // Intentar consultar base de datos real
    try {
      const { data: unidades, error: unidadesErr } = await supabase
        .from('curriculum_unidades')
        .select('id, unidad_numero, titulo_tema')
        .eq('nivel', nivelNombre)
        .order('unidad_numero', { ascending: true });

      if (!unidadesErr && unidades && unidades.length > 0) {
        const result = unidades.map(u => ({
          id: u.id,
          numero: u.unidad_numero,
          titulo: u.titulo_tema || `Unidad ${u.unidad_numero}`,
          descripcion: `Unidad curricular ${u.unidad_numero} para ${nivelNombre}.`
        }));
        return NextResponse.json(result);
      }
    } catch (dbErr) {
      console.warn('[API unidades] Error consultando Supabase, usando fallback estático:', dbErr);
    }

    // Fallback estático
    const fallbackList = FALLBACK_UNIDADES[nivelNombre];
    if (fallbackList) {
      const result = fallbackList.map(u => ({
        id: u.numero,
        numero: u.numero,
        titulo: u.titulo,
        descripcion: u.descripcion
      }));
      return NextResponse.json(result);
    }

    // Fallback genérico para otros cursos basado en staticCurriculum
    const staticUnits = staticCurriculum.unidades.filter(u => u.nivel === nivelNombre);
    if (staticUnits.length > 0) {
      const result = staticUnits.map(u => ({
        id: u.unidad_numero,
        numero: u.unidad_numero,
        titulo: u.titulo_tema || `Unidad ${u.unidad_numero}`,
        descripcion: `Unidad curricular ${u.unidad_numero} para ${nivelNombre}.`
      }));
      return NextResponse.json(result);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
