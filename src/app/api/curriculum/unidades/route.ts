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
    { numero: 1, titulo: 'El héroe en distintas épocas', descripcion: 'OA 2, 3, 7, 8, 11, 14, 15, 21 — narraciones épicas y heroicas.' },
    { numero: 2, titulo: 'La solidaridad y la amistad', descripcion: 'OA 2, 3, 4, 7, 10, 14, 15, 16, 21 — vínculos humanos y valores.' },
    { numero: 3, titulo: 'Mitología y relatos de creación', descripcion: 'OA 1, 3, 6, 7, 13, 15, 22, 24, 25 — mitos y relatos fundacionales.' },
    { numero: 4, titulo: 'La identidad: quién soy, cómo me ven los demás', descripcion: 'OA 1, 2, 3, 4, 7, 13, 15, 18, 21, 23 — identidad y autoconocimiento.' },
    { numero: 5, titulo: 'El Romancero y la poesía popular', descripcion: 'OA 2, 4, 5, 7, 10, 14, 15, 21 — poesía oral y tradición literaria.' },
    { numero: 6, titulo: 'El terror y lo extraño', descripcion: 'OA 1, 2, 3, 6, 7, 11, 14, 15, 17, 21 — literatura de terror y fantasía.' },
    { numero: 7, titulo: 'Medios de comunicación', descripcion: 'OA 1, 9, 10, 12, 13, 18, 19, 20, 22, 23, 24, 25 — análisis crítico de medios.' },
  ],
  '8° Básico': [
    { numero: 1, titulo: 'Epopeya', descripcion: 'OA 1, 2, 3, 6, 8, 11, 12, 14, 16, 22 — grandes relatos épicos.' },
    { numero: 2, titulo: 'Experiencias del amor', descripcion: 'OA 1, 2, 3, 4, 8, 23, 25, 26 — textos líricos y narrativos.' },
    { numero: 3, titulo: 'Relatos de misterio', descripcion: 'OA 2, 3, 8, 12, 13, 17, 18, 22 — género policial y de misterio.' },
    { numero: 4, titulo: 'Naturaleza', descripcion: 'OA 1, 2, 3, 4, 8, 15, 16, 19, 21 — literatura sobre el mundo natural.' },
    { numero: 5, titulo: 'La comedia', descripcion: 'OA 1, 2, 5, 7, 8, 11, 14, 16, 20, 22 — teatro cómico y humor.' },
    { numero: 6, titulo: 'El mundo descabellado', descripcion: 'OA 1, 2, 3, 8, 9, 11, 15, 16, 22 — literatura absurda y nonsense.' },
    { numero: 7, titulo: 'Medios de comunicación', descripcion: 'OA 1, 9, 10, 15, 16, 21, 22, 23, 24, 25, 26 — análisis crítico de medios.' },
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
