/**
 * GET /api/curriculum/indicadores
 * Retorna los indicadores de evaluación oficiales MINEDUC
 * para un nivel, unidad y lista de OA codes.
 *
 * Query params:
 *   nivel  — ej: "7° Básico"
 *   unidad — número de unidad (1-7)
 *   oas    — ej: "OA 2,OA 3,OA 7" (separados por coma)
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nivel  = searchParams.get('nivel') || '';
  const unidad = parseInt(searchParams.get('unidad') || '1', 10);
  const oasRaw = searchParams.get('oas') || '';

  const fileName = NIVEL_TO_FILE[nivel];
  if (!fileName) {
    return NextResponse.json({ error: 'Nivel no encontrado', indicadores: [] }, { status: 200 });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'curriculum', fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ indicadores: [] });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    // Buscar la unidad
    const unidadData = data.unidades?.find((u: any) => u.numero === unidad);
    if (!unidadData) {
      return NextResponse.json({ indicadores: [] });
    }

    // Filtrar OAs solicitados
    const requestedOAs = oasRaw
      ? oasRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const result: Array<{ codigo: string; indicadores: string[] }> = [];

    for (const oa of unidadData.oas) {
      if (requestedOAs.length === 0 || requestedOAs.includes(oa.codigo)) {
        const indicadores = (oa.indicadores as string[])
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 10);
        if (indicadores.length > 0) {
          result.push({ codigo: oa.codigo, indicadores });
        }
      }
    }

    return NextResponse.json({ indicadores: result });
  } catch (e) {
    console.error('[indicadores] Error:', e);
    return NextResponse.json({ indicadores: [] });
  }
}
