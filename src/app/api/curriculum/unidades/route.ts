import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { staticCurriculum } from '@/lib/curriculum/index';

function mapNivelParam(nivelParam: string): string {
  const norm = (nivelParam || '').toLowerCase().replace(/_/g, ' ');
  const isBasico = norm.includes('bás') || norm.includes('bas') || norm.includes('básico') || norm.includes('basico');
  const isMedio  = norm.includes('med') || norm.includes('medio');
  if (norm.includes('1') && isBasico)  return '1° Básico';
  if (norm.includes('2') && isBasico)  return '2° Básico';
  if (norm.includes('3') && isBasico)  return '3° Básico';
  if (norm.includes('4') && isBasico)  return '4° Básico';
  if (norm.includes('5') || norm.includes('quinto'))  return '5° Básico';
  if (norm.includes('6') || norm.includes('sexto'))   return '6° Básico';
  if (norm.includes('7') || norm.includes('séptimo') || norm.includes('septimo')) return '7° Básico';
  if (norm.includes('8') || norm.includes('octavo'))  return '8° Básico';
  if ((norm.includes('1') && isMedio) || norm.includes('primero') || norm.includes('i°')) return '1° Medio';
  if ((norm.includes('2') && isMedio) || norm.includes('segundo') || norm.includes('ii°')) return '2° Medio';
  return nivelParam;
}

const FALLBACK_UNIDADES: Record<string, { numero: number; titulo: string; descripcion: string }[]> = {
  '1° Básico': [
    { numero: 1, titulo: 'Unidad 1', descripcion: 'Lectura, escritura y comunicación oral — 1° Básico.' },
    { numero: 2, titulo: 'Unidad 2', descripcion: 'Lectura, escritura y comunicación oral — 1° Básico.' },
    { numero: 3, titulo: 'Unidad 3', descripcion: 'Lectura, escritura y comunicación oral — 1° Básico.' },
    { numero: 4, titulo: 'Unidad 4', descripcion: 'Lectura, escritura y comunicación oral — 1° Básico.' },
  ],
  '2° Básico': [
    { numero: 1, titulo: 'Unidad 1', descripcion: 'Lectura, escritura y comunicación oral — 2° Básico.' },
    { numero: 2, titulo: 'Unidad 2', descripcion: 'Lectura, escritura y comunicación oral — 2° Básico.' },
    { numero: 3, titulo: 'Unidad 3', descripcion: 'Lectura, escritura y comunicación oral — 2° Básico.' },
    { numero: 4, titulo: 'Unidad 4', descripcion: 'Lectura, escritura y comunicación oral — 2° Básico.' },
  ],
  '3° Básico': [
    { numero: 1, titulo: 'Unidad 1', descripcion: 'Lectura, escritura y comunicación oral — 3° Básico.' },
    { numero: 2, titulo: 'Unidad 2', descripcion: 'Lectura, escritura y comunicación oral — 3° Básico.' },
    { numero: 3, titulo: 'Unidad 3', descripcion: 'Lectura, escritura y comunicación oral — 3° Básico.' },
    { numero: 4, titulo: 'Unidad 4', descripcion: 'Lectura, escritura y comunicación oral — 3° Básico.' },
  ],
  '4° Básico': [
    { numero: 1, titulo: 'Unidad 1', descripcion: 'Lectura, escritura y comunicación oral — 4° Básico.' },
    { numero: 2, titulo: 'Unidad 2', descripcion: 'Lectura, escritura y comunicación oral — 4° Básico.' },
    { numero: 3, titulo: 'Unidad 3', descripcion: 'Lectura, escritura y comunicación oral — 4° Básico.' },
    { numero: 4, titulo: 'Unidad 4', descripcion: 'Lectura, escritura y comunicación oral — 4° Básico.' },
  ],
  '5° Básico': [
    { numero: 1, titulo: 'La unión hace la fuerza', descripcion: 'Trabajo en equipo, colaboración y perseverancia.' },
    { numero: 2, titulo: 'Emociones que sanan', descripcion: 'Comprensión de poemas y narraciones que expresan emociones.' },
    { numero: 3, titulo: 'Coexistir en armonía', descripcion: 'El vínculo con la naturaleza y los saberes de los pueblos originarios.' },
    { numero: 4, titulo: 'Un mundo en movimiento', descripcion: 'Viajes, migraciones y cambios en el tiempo.' },
  ],
  '6° Básico': [
    { numero: 1, titulo: 'Los sueños y la realidad', descripcion: 'Lectura comprensiva y expresión oral.' },
    { numero: 2, titulo: 'Lazos que nos unen', descripcion: 'Poemas y textos informativos sobre vínculos humanos.' },
    { numero: 3, titulo: 'El ser humano y su vínculo con el cosmos', descripcion: 'Mitos, leyendas y producción escrita.' },
    { numero: 4, titulo: 'Comunicar para transformar', descripcion: 'Análisis crítico y exposiciones orales.' },
  ],
  '7° Básico': [
    { numero: 1, titulo: 'El héroe en distintas épocas', descripcion: 'Narraciones épicas y heroicas de distintas culturas.' },
    { numero: 2, titulo: 'La solidaridad y la amistad', descripcion: 'Textos que abordan vínculos humanos y valores.' },
    { numero: 3, titulo: 'Mitología y relatos de creación', descripcion: 'Mitos y relatos fundacionales de distintas culturas.' },
    { numero: 4, titulo: 'La identidad: quién soy, cómo me ven los demás', descripcion: 'Literatura de identidad y autoconocimiento.' },
    { numero: 5, titulo: 'El romancero y la poesía popular', descripcion: 'Poesía oral y tradición literaria popular.' },
    { numero: 6, titulo: 'El terror y lo extraño', descripcion: 'Cuentos de terror y literatura fantástica.' },
    { numero: 7, titulo: 'Medios de comunicación', descripcion: 'Análisis crítico de textos mediáticos.' },
  ],
  '8° Básico': [
    { numero: 1, titulo: 'Epopeya', descripcion: 'Grandes relatos épicos de la literatura universal.' },
    { numero: 2, titulo: 'Experiencias del amor', descripcion: 'Textos líricos y narrativos sobre el amor.' },
    { numero: 3, titulo: 'Relatos de misterio', descripcion: 'Cuentos y novelas del género policial y de misterio.' },
    { numero: 4, titulo: 'Naturaleza', descripcion: 'Literatura y textos sobre el mundo natural.' },
    { numero: 5, titulo: 'La comedia', descripcion: 'Teatro cómico y textos humorísticos.' },
    { numero: 6, titulo: 'El mundo descabellado', descripcion: 'Literatura absurda, nonsense y humor.' },
    { numero: 7, titulo: 'Medios de comunicación', descripcion: 'Análisis crítico de textos mediáticos.' },
  ],
  '1° Medio': [
    { numero: 1, titulo: 'La libertad como tema literario', descripcion: 'Literatura romántica y textos sobre la libertad.' },
    { numero: 2, titulo: 'Ciudadanos y opinión', descripcion: 'Textos argumentativos y participación ciudadana.' },
    { numero: 3, titulo: 'Relaciones humanas en el teatro y la literatura', descripcion: 'Teatro clásico y relaciones interpersonales.' },
    { numero: 4, titulo: 'Comunicación y sociedad', descripcion: 'Medios de comunicación y su rol social.' },
  ],
  '2° Medio': [
    { numero: 1, titulo: 'Sobre la ausencia: exilio, migración e identidad', descripcion: 'Literatura del exilio y la migración.' },
    { numero: 2, titulo: 'Ciudadanía y trabajo', descripcion: 'Textos sobre derechos laborales y ciudadanía.' },
    { numero: 3, titulo: 'Lo divino y lo humano', descripcion: 'Literatura religiosa y filosófica.' },
    { numero: 4, titulo: 'Poder y ambición', descripcion: 'Teatro y narrativa sobre el poder.' },
  ],
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
