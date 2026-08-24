/**
 * GET /api/curriculum/temas?nivel=1° Básico&unidad=1
 * Retorna los temas (bloques) de una unidad desde el JSON curricular.
 */
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const NIVEL_TO_FILE: Record<string, string> = {
  '1° Básico':  'curriculum_1B.json',
  '2° Básico':  'curriculum_2B.json',
  '3° Básico':  'curriculum_3B.json',
  '4° Básico':  'curriculum_4B.json',
  '5° Básico':  'curriculum_5B.json',
  '6° Básico':  'curriculum_6B.json',
  '7° Básico':  'curriculum_7B.json',
  '8° Básico':  'curriculum_8B.json',
  '1° Medio':   'curriculum_1M.json',
  '2° Medio':   'curriculum_2M.json',
};

function mapNivel(p: string): string {
  const n = (p || '').toLowerCase().replace(/_/g, ' ');
  const isB = n.includes('bás') || n.includes('bas') || n.includes('básico') || n.includes('basico');
  const isM = n.includes('med') || n.includes('medio');
  if (n.includes('1') && isB) return '1° Básico';
  if (n.includes('2') && isB) return '2° Básico';
  if (n.includes('3') && isB) return '3° Básico';
  if (n.includes('4') && isB) return '4° Básico';
  if (n.includes('5') || n.includes('quinto'))  return '5° Básico';
  if (n.includes('6') || n.includes('sexto'))   return '6° Básico';
  if (n.includes('7') || n.includes('séptimo') || n.includes('septimo')) return '7° Básico';
  if (n.includes('8') || n.includes('octavo'))  return '8° Básico';
  if ((n.includes('1') && isM) || n.includes('primero')) return '1° Medio';
  if ((n.includes('2') && isM) || n.includes('segundo')) return '2° Medio';
  return p;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nivel  = mapNivel(searchParams.get('nivel') || '');
  const unidad = parseInt(searchParams.get('unidad') || '1', 10);

  const fileName = NIVEL_TO_FILE[nivel];
  if (!fileName) return NextResponse.json({ temas: [] });

  try {
    const filePath = path.join(process.cwd(), 'public', 'curriculum', fileName);
    if (!fs.existsSync(filePath)) return NextResponse.json({ temas: [] });
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const unidadData = data.unidades?.find((u: any) => u.numero === unidad);
    const temas: string[] = Array.isArray(unidadData?.temas) ? unidadData.temas : [];
    return NextResponse.json({ temas });
  } catch {
    return NextResponse.json({ temas: [] });
  }
}
