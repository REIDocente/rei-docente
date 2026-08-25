'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Loader2, Download, FileText, BarChart3,
  Star, Users, BookOpen, Sparkles, ClipboardCheck,
  CheckCircle2, XCircle, AlertCircle, Printer, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { drawEvaluacionesWord } from '@/lib/templates/drawEvaluacionesWord';
import drawEvaluacionesPdf from '@/lib/templates/drawEvaluacionesPdf';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alternativa {
  letra: string;
  texto: string;
  correcta: boolean;
}

interface Pregunta {
  numero: number;
  oa: string;
  nivel_cognitivo?: string;
  dificultad_rti?: string;
  tipo: 'seleccion_multiple' | 'consigna_abierta' | 'verdadero_falso' | 'desarrollo';
  texto_base?: string | null;
  enunciado: string;
  alternativas?: Alternativa[];
  criterios_correccion?: string[];
  respuesta_esperada?: string;
  justificacion?: string;
  fuente?: string;
}

function getTechniqueInstruction(tipoEvaluacion?: string): string {
  const isFormativaOrDiag = !tipoEvaluacion || 
    tipoEvaluacion.toLowerCase().includes('formativa') || 
    tipoEvaluacion.toLowerCase().includes('diagn');
  return isFormativaOrDiag
    ? "Responde usando la técnica OREO: escribe tu Opinión, una Razón que la justifique, un Ejemplo concreto y cierra reafirmando tu Opinión."
    : "Responde usando la técnica RICE: Repite la pregunta con tus palabras, Incluye tu postura, Cita una evidencia del texto y Explica cómo esa cita apoya tu argumento.";
}

const getCleanAlternatives = (raw: any, qNum?: any, qObj?: any): Array<{ letra: string; texto: string; correcta?: boolean }> => {
  if (!raw) return [];

  let strings: string[] = [];

  // Si es string, intentar parsear como JSON
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return [];
    try {
      raw = JSON.parse(trimmed);
    } catch {
      // Si no es JSON válido pero tiene contenido, tratarlo como texto único
      strings = [trimmed];
    }
  }

  // Si es array
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    
    strings = raw
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'number') return String(item);
        if (typeof item === 'object' && item !== null) {
          // Buscar en todos los campos comunes que puedan contener el texto
          const textValue = 
            item.texto ?? 
            item.text ?? 
            item.contenido ?? 
            item.alternativa ?? 
            item.descripcion ?? 
            item.value ?? 
            item.opcion ??
            item.content ??
            null;
          
          if (textValue !== null && textValue !== undefined) {
            return String(textValue).trim();
          }
          
          // Si tiene letra/label + otro campo con el texto
          const keys = Object.keys(item).filter(k => !['letra', 'label', 'key', 'id', 'numero'].includes(k.toLowerCase()));
          if (keys.length === 1) return String(item[keys[0]]).trim();
          if (keys.length > 1) {
            // Tomar el valor más largo como el texto de la alternativa
            const longestKey = keys.reduce((a, b) => String(item[a] ?? '').length > String(item[b] ?? '').length ? a : b);
            return String(item[longestKey]).trim();
          }
        }
        return '';
      })
      .filter(s => s.length > 0);
  }
  // Si es objeto plano (clave → valor)
  else if (typeof raw === 'object' && raw !== null) {
    const entries = Object.entries(raw);
    if (entries.length > 0) {
      strings = entries
        .map(([, value]) => {
          if (typeof value === 'string') return value.trim();
          if (typeof value === 'number') return String(value);
          if (typeof value === 'object' && value !== null) {
            // Objeto anidado: {A: {texto: "..."}}
            const nested = value as any;
            const textValue = 
              nested.texto ?? 
              nested.text ?? 
              nested.contenido ?? 
              nested.alternativa ?? 
              nested.descripcion ?? 
              nested.value ??
              nested.content ??
              null;
            if (textValue !== null) return String(textValue).trim();
            // Tomar el primer string encontrado
            const nestedValues = Object.values(nested).filter(v => typeof v === 'string');
            if (nestedValues.length > 0) return String(nestedValues[0]).trim();
          }
          return '';
        })
        .filter(s => s.length > 0);
    }
  }

  // Si al final no se pudo extraer nada, imprimir error de formato no reconocido
  if (strings.length === 0 && raw !== null && raw !== undefined) {
    console.error('[getCleanAlternatives] Formato no reconocido:', JSON.stringify(raw), 'tipo:', typeof raw);
    return [];
  }

  // Mapear strings a la estructura esperada por el PDF y la UI: Array<{ letra: string; texto: string; correcta?: boolean }>
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = String(qObj?.clave || qObj?.respuesta_correcta || 'A').toUpperCase().trim();

  return strings.map((texto, aIdx) => {
    const letra = letters[aIdx] || '';
    return {
      letra,
      texto,
      correcta: letra === correctLetter
    };
  });
};

const getPreguntasList = (cj: any): any[] => {
  if (!cj) return [];
  
  // 1. Check prueba?.secciones
  const fromPruebaSecciones = cj.prueba?.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromPruebaSecciones) && fromPruebaSecciones.length > 0) {
    return fromPruebaSecciones;
  }
  
  // 2. Check secciones directly
  const fromSecciones = cj.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromSecciones) && fromSecciones.length > 0) {
    return fromSecciones;
  }
  
  // 3. Check preguntas directly
  if (Array.isArray(cj.preguntas) && cj.preguntas.length > 0) {
    return cj.preguntas;
  }
  
  // 4. Check preguntas_alternativas and preguntas_desarrollo combined
  const alts = cj.preguntas_alternativas || [];
  const devs = cj.preguntas_desarrollo || [];
  if (alts.length > 0 || devs.length > 0) {
    return [...alts, ...devs];
  }
  
  // 5. Fallback: recursive traversal
  const collected: any[] = [];
  const visited = new Set();
  const traverse = (obj: any) => {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
    visited.add(obj);
    
    if (
      (obj.enunciado || obj.pregunta) && 
      (obj.tipo === 'seleccion_multiple' || obj.tipo === 'consigna_abierta' || obj.tipo === 'desarrollo' || obj.alternativas)
    ) {
      collected.push(obj);
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'object' && val !== null) {
        traverse(val);
      }
    }
  };
  traverse(cj);
  return collected;
};

interface TablaEspFila {
  habilidad: string;
  indicador: string;
  contenido: string;
  tipo_item: string;
  n_pregunta: string;
  clave: string;
  ptos: number;
  ponderacion_pct: number;
}

interface CriterioCuatro {
  nombre: string;
  oa?: string;
  ponderacion_pct?: number;
  logrado: string;
  logrado_parcial: string;
  en_desarrollo: string;
  no_logrado: string;
}

interface CriterioDos {
  nombre: string;
  oa?: string;
  logrado: string;
  medianamente_logrado: string;
  por_lograr: string;
}

interface ItemEval {
  numero: number;
  enunciado: string;
  escala: string;
}

interface EvaluacionContenido {
  establecimiento?: string;
  docente?: string;
  tipo_evaluacion?: string;
  titulo?: string;
  nivel?: string;
  asignatura?: string;
  eje?: string;
  oa_codes?: string[];
  duracion_min?: number | null;
  dificultad?: string;
  instrucciones_generales?: string;
  instrucciones?: string;
  tabla_especificaciones?: { oa_evaluado?: string; filas: TablaEspFila[] };
  prueba?: {
    secciones?: Array<{
      nombre: string;
      instruccion: string;
      preguntas: Pregunta[];
    }>;
  };
  textos_lectura?: Array<{
    titulo: string;
    tipo: string;
    contenido: string;
  }>;
  preguntas?: Pregunta[];
  rubrica?: {
    titulo?: string;
    tipo_instrumento?: string;
    instruccion?: string;
    criterios: any[];
  };
  respuestas_esperadas?: any[];
  pauta_correccion?: {
    puntaje_total: number;
    exigencia: string;
    puntaje_aprobacion: number;
  };
  autoevaluacion?: {
    oa_actitudinal?: string;
    texto_oa_actitudinal?: string;
    instruccion?: string;
    items: ItemEval[];
  };
  coevaluacion?: {
    oa_actitudinal?: string;
    texto_oa_actitudinal?: string;
    instruccion?: string;
    criterios: ItemEval[];
  };
  heteroevaluacion?: {
    instruccion?: string;
    criterios: CriterioDos[];
  };
  modo?: string;
  n_banco?: number;
  n_nuevas?: number;
}

interface EvaluacionRecord {
  id: string;
  tipo_evaluacion?: string;
  titulo: string | null;
  nivel: string;
  eje: string | null;
  oa_codes: string[];
  tipos: string[];
  simce_ensayo: boolean;
  n_preguntas: number | null;
  duracion_min: number | null;
  dificultad: string | null;
  contenido_json: EvaluacionContenido;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LETRA_COLORS: Record<string, string> = {
  A: 'bg-sky-500/15 border-sky-500/30 text-sky-600',
  B: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
  C: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  D: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
};

function getInstrumentHeaders(tipo: string) {
  if (tipo === 'lista_cotejo') {
    return ['Criterio / Indicador', 'Nivel 2 (Logrado)', 'Nivel 1 (Parcial)', 'Nivel 0 (No logrado)'];
  } else if (tipo === 'escala_apreciacion') {
    return ['Criterio / Dimensión', 'Destacado', 'Logrado', 'En Desarrollo', 'No Logrado'];
  } else if (tipo === 'rubrica_holistica') {
    return ['Nivel / Logro', 'Descripción del Desempeño Global'];
  } else {
    return ['Criterio / Dimensión', 'Excelente (3 ptos)', 'Bueno (2 ptos)', 'Suficiente (1 pto)', 'Insuficiente (0 ptos)'];
  }
}

function renderCriterioColumns(crit: any, tipo: string) {
  if (tipo === 'lista_cotejo') {
    return (
      <>
        <td className="px-3 py-2.5 border-r border-slate-200 text-emerald-600 font-semibold">{crit.logrado || crit.si}</td>
        <td className="px-3 py-2.5 border-r border-slate-200 text-amber-600 font-semibold">{crit.parcial || '—'}</td>
        <td className="px-3 py-2.5 text-rose-600 font-semibold">{crit.no_logrado || crit.no}</td>
      </>
    );
  } else if (tipo === 'escala_apreciacion') {
    return (
      <>
        <td className="px-3 py-2.5 border-r border-slate-200 text-indigo-600 font-semibold">{crit.destacado}</td>
        <td className="px-3 py-2.5 border-r border-slate-200 text-emerald-600">{crit.logrado}</td>
        <td className="px-3 py-2.5 border-r border-slate-200 text-amber-600">{crit.en_desarrollo}</td>
        <td className="px-3 py-2.5 text-rose-600">{crit.no_logrado}</td>
      </>
    );
  } else if (tipo === 'rubrica_holistica') {
    return (
      <>
        <td className="px-3 py-2.5 leading-relaxed text-slate-700">{crit.descripcion || crit.excelente || crit.logrado}</td>
      </>
    );
  } else {
    return (
      <>
        <td className="px-3 py-2.5 border-r border-slate-200 text-emerald-600">{crit.excelente || crit.logrado}</td>
        <td className="px-3 py-2.5 border-r border-slate-200 text-sky-600">{crit.bueno || crit.logrado_parcial}</td>
        <td className="px-3 py-2.5 border-r border-slate-200 text-amber-600">{crit.en_desarrollo || crit.suficiente}</td>
        <td className="px-3 py-2.5 text-rose-600">{crit.insuficiente || crit.no_logrado}</td>
      </>
    );
  }
}

// ─── Section renderers ────────────────────────────────────────────────────────

function TablaEspecificaciones({ data }: { data: EvaluacionContenido['tabla_especificaciones'] }) {
  if (!data?.filas?.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
        <BarChart3 className="w-4 h-4" /> Tabla de Especificaciones
      </h3>
      {data.oa_evaluado && (
        <p className="text-xs font-semibold text-slate-655">
          OAs Evaluados: <span className="text-slate-800 font-extrabold">
            {(() => {
              const matches = data.oa_evaluado.match(/OA\s*\d+/gi);
              return matches ? Array.from(new Set(matches.map(m => m.toUpperCase()))).join(', ') : data.oa_evaluado;
            })()}
          </span>
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]/70">
        <table className="w-full text-xs">
          <thead className="bg-[#FAF9FC]">
            <tr>
              {['Habilidad', 'Indicador de evaluación', 'Contenido', 'Tipo de ítem', 'N°', 'Clave', 'Ptos', '%'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-slate-600 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.filas.map((f, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-3 py-2 font-semibold text-rose-700">{f.habilidad}</td>
                <td className="px-3 py-2 text-slate-700">{f.indicador}</td>
                <td className="px-3 py-2 text-slate-700">{f.contenido}</td>
                <td className="px-3 py-2 text-slate-600">{f.tipo_item}</td>
                <td className="px-3 py-2 text-center text-slate-700">{f.n_pregunta}</td>
                <td className="px-3 py-2 text-center font-bold text-rose-600">{f.clave}</td>
                <td className="px-3 py-2 text-center text-slate-700">{f.ptos}</td>
                <td className="px-3 py-2 text-center text-slate-700">{f.ponderacion_pct}%</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold border-t border-slate-250">
              <td className="px-3 py-2 text-slate-700" colSpan={6}>Total</td>
              <td className="px-3 py-2 text-center text-slate-800">{data.filas.reduce((s, f) => s + (Number(f.ptos) || 0), 0)}</td>
              <td className="px-3 py-2 text-center text-slate-800">{data.filas.reduce((s, f) => s + (Number(f.ponderacion_pct) || 0), 0)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreguntaCard({ p, idx, tipoEvaluacion }: { p: Pregunta; idx: number; tipoEvaluacion?: string }) {
  const [showKey, setShowKey] = useState(false);
  const cleanAlts = getCleanAlternatives(p.alternativas, p.numero || (p as any).numero_original || idx + 1, p);
  const esAbierta = p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo' || cleanAlts.length === 0;

  return (
    <div className="bg-white border border-[#E2E8F0]/60 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-655">P{idx + 1}</span>
          {p.oa && (
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">{p.oa}</span>
          )}
          {p.dificultad_rti && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">{p.dificultad_rti}</span>
          )}
          {p.nivel_cognitivo && (
            <span className="text-[10px] text-slate-600">{p.nivel_cognitivo}</span>
          )}
          {p.fuente === 'banco' && (
            <span className="text-[10px] text-slate-650 italic font-medium">del banco</span>
          )}
        </div>
        <button
          onClick={() => setShowKey(!showKey)}
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
            showKey
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold'
              : 'bg-[#FAF9FC] border border-[#E2E8F0]/70 text-slate-650 hover:bg-slate-50'
          }`}
        >
          {showKey ? (esAbierta ? 'Ocultar pauta' : 'Ocultar clave') : (esAbierta ? 'Ver pauta' : 'Ver clave')}
        </button>
      </div>

      {/* Texto base */}
      {p.texto_base && (
        <div className="text-xs text-slate-600 italic bg-slate-50 rounded-lg p-3 border border-[#E2E8F0]/70 leading-relaxed">
          {p.texto_base}
        </div>
      )}

      {/* Enunciado */}
      <p className="text-sm text-slate-800 leading-relaxed font-sans">
        {idx + 1}. {p.enunciado}
        {(p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo') && (
          <span className="ml-2 text-xs font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200">(4 pts)</span>
        )}
      </p>

      {/* Technique instruction */}
      {esAbierta && (
        <p className="text-xs font-semibold text-rose-700 bg-rose-50/50 border border-rose-100 rounded-lg p-2.5 font-sans mt-1">
          {getTechniqueInstruction(tipoEvaluacion)}
        </p>
      )}

      {/* Alternativas */}
      {!esAbierta && cleanAlts.length > 0 && (
        <div className="space-y-1.5">
          {cleanAlts.map((alt) => (
            <div
              key={alt.letra}
              className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-xs transition-all ${
                showKey && alt.correcta
                  ? 'bg-emerald-50 border border-emerald-500/30 text-emerald-700 font-semibold'
                  : showKey && !alt.correcta
                  ? 'opacity-50 border-[#E2E8F0]/70 bg-transparent'
                  : 'bg-white border-[#E2E8F0]/60 text-slate-700'
              }`}
            >
              <span className="font-bold shrink-0">{alt.letra})</span>
              <span className="leading-relaxed">{alt.texto}</span>
              {showKey && alt.correcta && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-auto" />}
            </div>
          ))}
        </div>
      )}

      {/* Justificación */}
      {showKey && !esAbierta && p.justificacion && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 leading-relaxed">
          <span className="font-semibold">Justificación:</span> {p.justificacion}
        </div>
      )}

      {/* Consigna abierta */}
      {esAbierta && (
        <div className="space-y-3 pl-2">
          <div className="space-y-2 mt-2">
            <div className="border-b border-dashed border-slate-200 w-full h-4"></div>
            <div className="border-b border-dashed border-slate-200 w-full h-4"></div>
            <div className="border-b border-dashed border-slate-200 w-full h-4"></div>
          </div>
          {p.criterios_correccion && p.criterios_correccion.length > 0 && (
            <div className="text-[11px] text-slate-500 font-sans space-y-1.5">
              <p className="font-semibold">Rúbrica de evaluación:</p>
              {p.criterios_correccion.slice(0, 3).map((c, i) => (
                <div key={i} className={`pl-2 text-[10px] leading-relaxed rounded px-2 py-1 ${
                  i === 0 ? 'text-emerald-700 bg-emerald-50/60' : i === 1 ? 'text-amber-700 bg-amber-50/60' : 'text-rose-600 bg-rose-50/60'
                }`}>{c}</div>
              ))}
            </div>
          )}
          {showKey && p.respuesta_esperada && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-150 rounded-lg p-3 leading-relaxed">
              <span className="font-semibold">Respuesta modelo esperada:</span> {p.respuesta_esperada}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RubricaSection({ data }: { data: EvaluacionContenido['rubrica'] }) {
  if (!data?.criterios?.length) return null;
  const instTipo = data.tipo_instrumento || 'rubrica_analitica';
  const headers = getInstrumentHeaders(instTipo);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
        <Star className="w-4 h-4" /> Instrumento de Evaluación Descriptivo ({data.titulo || 'Rúbrica'})
      </h3>
      {data.instruccion && <p className="text-xs text-slate-600">{data.instruccion}</p>}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]/70">
        <table className="w-full text-xs">
          <thead className="bg-[#FAF9FC]">
            <tr>
              {headers.map((h, hi) => (
                <th key={hi} className="px-3 py-2.5 text-left text-slate-600 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.criterios.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50/50 align-top">
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-slate-800">{c.nombre || c.dimension}</p>
                  {c.oa && <p className="text-[10px] text-rose-600 mt-0.5">{c.oa}</p>}
                </td>
                {renderCriterioColumns(c, instTipo)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AutoCoEvalSection({
  data, tipo,
}: {
  data: { oa_actitudinal?: string; texto_oa_actitudinal?: string; instruccion?: string; items?: Array<{numero:number;enunciado:string;escala:string}>; criterios?: Array<{numero:number;enunciado:string;escala:string}> };
  tipo: 'autoevaluacion' | 'coevaluacion';
}) {
  const items = data.items ?? data.criterios ?? [];
  const label = tipo === 'autoevaluacion' ? 'Autoevaluación' : 'Coevaluación';
  const Icon  = Users;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
        <Icon className="w-4 h-4" /> {label}
      </h3>
      {data.oa_actitudinal && (
        <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-[#E2E8F0]/70">
          <span className="font-semibold text-emerald-600">{data.oa_actitudinal}</span>
          {data.texto_oa_actitudinal && <span className="ml-1">{data.texto_oa_actitudinal}</span>}
        </div>
      )}
      {data.instruccion && <p className="text-xs text-slate-600 italic">{data.instruccion}</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.numero} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white border border-[#E2E8F0]/70/40 rounded-xl text-xs">
            <span className="text-slate-700 leading-relaxed flex-1">{item.numero}. {item.enunciado}</span>
            <span className="text-[10px] text-slate-600 shrink-0 border border-[#E2E8F0]/70 rounded-lg px-1.5 py-0.5">{item.escala}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeteroEvalSection({ data }: { data: EvaluacionContenido['heteroevaluacion'] }) {
  if (!data?.criterios?.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
        <BookOpen className="w-4 h-4" /> Heteroevaluación Docente
      </h3>
      {data.instruccion && <p className="text-xs text-slate-600">{data.instruccion}</p>}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]/70">
        <table className="w-full text-xs">
          <thead className="bg-[#FAF9FC]">
            <tr>
              <th className="px-3 py-2.5 text-left text-slate-600 font-semibold">Criterio</th>
              {['Logrado', 'Medianamente Logrado', 'Por Lograr'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-slate-600 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {data.criterios.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50/50 align-top">
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-slate-800">{c.nombre}</p>
                  {c.oa && <p className="text-[10px] text-rose-600 mt-0.5">{c.oa}</p>}
                </td>
                <td className="px-3 py-2.5 text-emerald-300/80 leading-relaxed">{c.logrado}</td>
                <td className="px-3 py-2.5 text-amber-300/80 leading-relaxed">{c.medianamente_logrado}</td>
                <td className="px-3 py-2.5 text-rose-300/80 leading-relaxed">{c.por_lograr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EvaluacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading]         = useState(true);
  const [ev, setEv]                   = useState<EvaluacionRecord | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf,  setExportingPdf]  = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const handleDelete = async () => {
    if (!ev) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta evaluación permanentemente?')) return;
    setDeleting(true);
    try {
      const { error: delErr } = await supabase
        .from('evaluaciones')
        .delete()
        .eq('id', ev.id);
      if (delErr) throw delErr;
      router.push('/evaluaciones');
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }

      const { data, error: dbErr } = await supabase
        .from('evaluaciones')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (dbErr || !data) {
        setError('No se encontró la evaluación o no tienes acceso.');
      } else {
        setEv(data as EvaluacionRecord);
      }
      setLoading(false);
    });
  }, [id, router]);

  // ── Export Word ───────────────────────────────────────────────────────────────────
  const handleExportWord = useCallback(async () => {
    if (!ev) return;
    setExportingWord(true);
    try {
      const blob = await drawEvaluacionesWord(ev);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${ev.titulo ?? 'evaluacion'}-completa.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setExportingWord(false);
    }
  }, [ev]);

  // ── Export PDF ───────────────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    if (!ev) return;
    setExportingPdf(true);
    try {
      const doc = await drawEvaluacionesPdf(ev);
      doc.save(`${ev.titulo ?? 'evaluacion'}-completa.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExportingPdf(false);
    }
  }, [ev]);

  // ─── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <p className="text-slate-700">{error ?? 'Evaluación no encontrada'}</p>
          <Link href="/evaluaciones" className="text-sm text-rose-600 hover:text-rose-300 transition-colors">← Volver</Link>
        </div>
      </div>
    );
  }

  const contenido = ev.contenido_json;
  const preguntas = getPreguntasList(contenido);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col">
      <div className="fixed top-0 right-0 w-[35%] h-[35%] bg-rose-900/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9FC]/80 backdrop-blur-md border-b border-[#E2E8F0]/60 px-4 py-3 flex items-center gap-3">
        <Link href="/evaluaciones" className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-[#E2E8F0]/70 transition-all text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 bg-rose-600/10 rounded-lg border border-rose-100 shrink-0">
            {ev.simce_ensayo ? <Sparkles className="w-4 h-4 text-amber-600" /> : <ClipboardCheck className="w-4 h-4 text-rose-600" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{ev.titulo ?? 'Evaluación'}</p>
            <p className="text-[10px] text-slate-600">{ev.nivel}</p>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => handleExportPdf()}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
            title="Descargar Evaluación Completa (PDF)"
          >
            Descargar PDF
          </button>
          <button
            onClick={() => handleExportWord()}
            disabled={exportingWord}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
            title="Descargar Evaluación Completa (Word)"
          >
            Descargar Word
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-7 space-y-8 z-10">

        {/* Meta strip */}
        <div className="flex flex-wrap gap-2 items-center text-xs">
          {ev.simce_ensayo && (
            <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" /> SIMCE
              {contenido.modo === 'mensual' && <span className="ml-1 opacity-70">Mensual</span>}
            </span>
          )}
          <span className="text-slate-600">
            {ev.nivel}  ·  Lenguaje y Comunicación
            {ev.eje && ` · ${ev.eje}`}
          </span>
          {ev.n_preguntas && <span className="text-slate-600">{ev.n_preguntas} preguntas</span>}
          {ev.duracion_min && <span className="text-slate-600">{ev.duracion_min} min</span>}
          {ev.dificultad && <span className="text-slate-600">{ev.dificultad}</span>}
          {contenido.n_banco !== undefined && (
            <span className="text-slate-600 italic">{contenido.n_banco} del banco · {contenido.n_nuevas} nuevas</span>
          )}
        </div>

        {/* Instrucciones */}
        {(contenido.instrucciones_generales || contenido.instrucciones) && (
          <div className="bg-white border border-[#E2E8F0]/60 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Instrucciones para el estudiante</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {contenido.instrucciones_generales ?? contenido.instrucciones}
            </p>
          </div>
        )}

        {/* Textos de Lectura */}
        {contenido.textos_lectura && contenido.textos_lectura.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Textos de Lectura
            </h3>
            {contenido.textos_lectura.map((txt: any, idx: number) => (
              <div key={idx} className="bg-white border border-[#E2E8F0]/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-extrabold text-slate-800">
                    {txt.titulo}
                  </h4>
                  <span className="text-[9px] font-black uppercase px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
                    {txt.tipo}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-serif">
                  {txt.contenido}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tabla de especificaciones */}
        <TablaEspecificaciones data={contenido.tabla_especificaciones} />

        {/* Prueba — preguntas */}
        {preguntas.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Prueba — {preguntas.length} pregunta{preguntas.length !== 1 ? 's' : ''}
            </h3>
            <div className="space-y-3">
              {preguntas.map((p, i) => (
                <PreguntaCard key={i} p={p} idx={i} tipoEvaluacion={contenido.tipo_evaluacion} />
              ))}
            </div>
          </div>
        )}

        {/* Rúbrica */}
        <RubricaSection data={contenido.rubrica} />

        {/* Autoevaluación */}
        {contenido.autoevaluacion && (
          <AutoCoEvalSection data={contenido.autoevaluacion} tipo="autoevaluacion" />
        )}

        {/* Coevaluación */}
        {contenido.coevaluacion && (
          <AutoCoEvalSection data={contenido.coevaluacion} tipo="coevaluacion" />
        )}

        {/* Heteroevaluación */}
        <HeteroEvalSection data={contenido.heteroevaluacion} />

      </main>
    </div>
  );
}
