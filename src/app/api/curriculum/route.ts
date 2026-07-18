import { NextRequest, NextResponse } from 'next/server';
import { staticCurriculum } from '@/lib/curriculum/index';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EjeGroup {
  nombre: string;
  oas: {
    id: string;
    codigo: string;
    texto: string;
    tipo: string;
    indicadores_evaluacion: { id: string; texto: string }[];
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseIndicadores(raw: string | null): { id: string; texto: string }[] {
  if (!raw?.trim()) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((texto, idx) => ({ id: String(idx + 1), texto }));
}

const EJE_ORDER = [
  'Lectura',
  'Escritura',
  'Comunicación Oral',
  'Investigación en Lenguaje y Literatura',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const asignaturaNombre = searchParams.get('asignatura');
  const nivelNombre      = searchParams.get('nivel');
  const ejeFilter        = searchParams.get('eje');
  const unidadNum        = searchParams.get('unidad');

  if (!asignaturaNombre || !nivelNombre) {
    return NextResponse.json(
      { error: 'Se requieren los parámetros "asignatura" y "nivel".' },
      { status: 400 }
    );
  }

  // ── 1. Fetch OAs for this nivel from staticCurriculum ────────────────────
  let oas = staticCurriculum.oas.filter(oa => {
    const isAsigMatch = oa.asignatura === asignaturaNombre || 
      (asignaturaNombre.includes('Lenguaje') && oa.asignatura === 'Lenguaje y Comunicación');
    return isAsigMatch && oa.nivel === nivelNombre;
  });

  if (ejeFilter) {
    oas = oas.filter(oa => oa.eje === ejeFilter);
  }

  // If a unidad filter is requested, filter the static list
  let unidadOaCodes: string[] | null = null;
  if (unidadNum) {
    const unidadRow = staticCurriculum.unidades.find(
      u => u.nivel === nivelNombre && u.unidad_numero === Number(unidadNum)
    );

    if (unidadRow?.oa_codes?.length) {
      unidadOaCodes = unidadRow.oa_codes;
      oas = oas.filter(oa => unidadRow.oa_codes!.includes(oa.codigo_oa));
    }
  }

  if (oas.length === 0) {
    return NextResponse.json(
      { error: `No se encontraron OAs para "${nivelNombre}" — "${asignaturaNombre}".` },
      { status: 404 }
    );
  }

  // ── 2. Group OAs by eje (in canonical order) ─────────────────────────────
  const ejeMap = new Map<string, EjeGroup>();

  for (const oa of oas) {
    if (!ejeMap.has(oa.eje)) {
      ejeMap.set(oa.eje, { nombre: oa.eje, oas: [] });
    }
    ejeMap.get(oa.eje)!.oas.push({
      id:     oa.id,
      codigo: oa.codigo_oa,
      texto:  oa.texto_oa ?? '',
      tipo:   'aprendizaje',
      indicadores_evaluacion: parseIndicadores(oa.indicadores),
    });
  }

  const sortedEjes = [...ejeMap.values()].sort((a, b) => {
    const ia = EJE_ORDER.indexOf(a.nombre);
    const ib = EJE_ORDER.indexOf(b.nombre);
    if (ia === -1 && ib === -1) return a.nombre.localeCompare(b.nombre);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  // ── 3. Filter unidades and lecciones for this nivel ─────────────────────────
  const filteredUnidades = staticCurriculum.unidades
    .filter(u => u.nivel === nivelNombre)
    .map(u => ({
      id: u.id,
      unidad_numero: u.unidad_numero,
      titulo_tema: u.titulo_tema,
      oa_codes: u.oa_codes
    }));

  const unidadIds = filteredUnidades.map(u => u.id);
  const filteredLecciones = staticCurriculum.lecciones
    .filter(l => unidadIds.includes(l.unidad_id))
    .map(l => {
      const u = filteredUnidades.find(unit => unit.id === l.unidad_id);
      return {
        id: l.id,
        unidad_id: l.unidad_id,
        unidad_numero: u ? u.unidad_numero : null,
        leccion_numero: l.leccion_numero,
        titulo_leccion: l.titulo_leccion,
        temas: l.temas,
        oa_basales: l.oa_basales,
        oa_complementarios: l.oa_complementarios
      };
    });

  // ── 3.5 Filter OAT and attitudes for this nivel ───────────────────────────
  const filteredOat = staticCurriculum.oat
    .filter(o => o.nivel === nivelNombre)
    .map(o => ({
      tipo: o.tipo,
      codigo: o.codigo,
      texto: o.texto
    }));

  // ── 4. Build response ─────────────────────────────────────────────────────
  const ejesWithIds = sortedEjes.map((eje, idx) => ({
    id:          idx + 1,
    nombre:      eje.nombre,
    descripcion: null,
    objetivos_aprendizaje: eje.oas.map((oa, oaIdx) => ({
      ...oa,
      id: oaIdx + 1 + idx * 1000,
    })),
  }));

  return NextResponse.json({
    nivel_nombre: nivelNombre,
    ciclo:        oas[0].ciclo,
    ejes:         ejesWithIds,
    unidades:     filteredUnidades,
    lecciones:    filteredLecciones,
    oat_actitudes: filteredOat,
    ...(unidadOaCodes ? { unidad_oa_codes: unidadOaCodes } : {}),
  });
}
