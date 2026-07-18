'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Loader2, Download, FileText, BarChart3,
  Star, Users, BookOpen, Sparkles, ClipboardCheck,
  CheckCircle2, XCircle, AlertCircle, Printer,
} from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, HeadingLevel, WidthType, Footer, PageNumber } from 'docx';

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
    return ['Criterio / Dimensión / Indicador', 'Logrado (Sí)', 'No Logrado (No)'];
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
      <p className="text-sm text-slate-800 leading-relaxed font-sans">{idx + 1}. {p.enunciado}</p>

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
          {p.criterios_correccion && (
            <div className="text-[11px] text-slate-500 font-sans space-y-1">
              <p className="font-semibold">Criterios de evaluación:</p>
              {p.criterios_correccion.map((c, i) => (
                <p key={i} className="leading-relaxed pl-2 text-[10px] text-slate-550">• {c}</p>
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
      const contenido = ev.contenido_json;
      const sections: any[] = [];

      // ─ helpers ────────────────────────────────────────────────────────
      const h2 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
      const gap = () => new Paragraph({ text: '' });
      const cell = (text: string, bold = false) =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: text || '', bold, size: 20 })] })] });
      const headerRow = (cols: string[]) =>
        new TableRow({ children: cols.map((c) => cell(c, true)) });
      const makeTable = (rows: any[]) =>
        new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });

      // Helper: Chilean grade conversion scale (60% exigencia)
      const getGradesScale = (total: number, exigencia = 0.6) => {
        const scale: Array<{ puntos: number; nota: number }> = [];
        for (let p = 0; p <= total; p++) {
          let nota = 1.0;
          if (total > 0) {
            const approvalPoints = total * exigencia;
            if (p < approvalPoints) {
              nota = 1.0 + 3.0 * (p / approvalPoints);
            } else {
              nota = 4.0 + 3.0 * ((p - approvalPoints) / (total * (1 - exigencia)));
            }
          }
          scale.push({ puntos: p, nota: Math.round(nota * 10) / 10 });
        }
        return scale;
      };

      // ── Calculate dynamic points ──
      const preguntas = getPreguntasList(contenido);
      const MC_Preguntas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple');
      const Dev_Preguntas = preguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

      let mcPoints = MC_Preguntas.length * 2;
      let devPoints = Dev_Preguntas.length * 4;

      const filasSpec = contenido.tabla_especificaciones?.filas || [];
      if (filasSpec.length) {
        let sumMc = 0;
        let sumDev = 0;
        filasSpec.forEach((f: any) => {
          const ptosVal = Number(f.ptos) || 0;
          const isMc = f.tipo_item === 'Selección múltiple' || String(f.tipo_item).toLowerCase().includes('alternativa');
          if (isMc) sumMc += ptosVal;
          else sumDev += ptosVal;
        });
        if (sumMc > 0) mcPoints = sumMc;
        if (sumDev > 0) devPoints = sumDev;
      }
      const totalPtos = mcPoints + devPoints;

      // Group specs table by Habilidad (Taxonomía)
      const groupedSpec: Record<string, {
        habilidad: string;
        indicadores: Set<string>;
        contenidos: Set<string>;
        tipo_items: Set<string>;
        num_items: number[];
        claves: string[];
        ptos: number;
      }> = {};

      filasSpec.forEach((f: any) => {
        const hab = f.habilidad || 'General';
        if (!groupedSpec[hab]) {
          groupedSpec[hab] = {
            habilidad: hab,
            indicadores: new Set(),
            contenidos: new Set(),
            tipo_items: new Set(),
            num_items: [],
            claves: [],
            ptos: 0
          };
        }
        if (f.indicador) groupedSpec[hab].indicadores.add(f.indicador);
        if (f.contenido) groupedSpec[hab].contenidos.add(f.contenido);
        if (f.tipo_item) groupedSpec[hab].tipo_items.add(f.tipo_item);
        if (f.n_pregunta) {
          String(f.n_pregunta).split(',').forEach(n => {
            const num = parseInt(n.trim(), 10);
            if (!isNaN(num)) groupedSpec[hab].num_items.push(num);
          });
        }
        if (f.clave) groupedSpec[hab].claves.push(f.clave);
        groupedSpec[hab].ptos += (Number(f.ptos) || 0);
      });

      // Title & Header Establishment Info using a Table layout
      const estName = contenido.establecimiento || "___________________________";
      sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: "[Logo del establecimiento]", size: 14, color: '888888', italics: true })
                    ]
                  })
                ]
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `Establecimiento: ${estName}`, bold: true, size: 22 })
                    ]
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Depto. de Lenguaje y Comunicación  ·  RBD: 10243-9", size: 16, color: '666666' })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }));
      sections.push(gap());

      sections.push(new Paragraph({ text: ev.titulo ?? 'Evaluación de Aprendizaje', heading: HeadingLevel.HEADING_1 }));
      sections.push(new Paragraph({
        children: [new TextRun({ text: `Asignatura: Lenguaje y Comunicación  ·  Curso: ${ev.nivel}`, size: 22, color: '666666' })],
      }));
      sections.push(gap());

      // Student fields box as Table
      sections.push(makeTable([
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Nombre: ___________________________________________________________", bold: true, size: 20 })] })], columnSpan: 2 }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Curso: _________", bold: true, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Fecha: _________", bold: true, size: 20 })] })] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ` Puntaje obtenido: ________ / ${totalPtos} pts`, bold: true, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Nota: ________", bold: true, size: 20 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Exigencia: 60%", size: 18, color: '555555' })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ` Tiempo: ${contenido.duracion_min ?? 90} min`, size: 18, color: '555555' })] })] })
          ]
        })
      ]));
      sections.push(gap());

      // Instructions
      sections.push(new Paragraph({
        children: [new TextRun({ text: "INSTRUCCIONES GENERALES", bold: true, size: 20, color: 'BE123C' })]
      }));
      sections.push(new Paragraph({
        children: [new TextRun({ text: "Lee atentamente cada pregunta antes de responder. En la Parte I, marca con una X la letra de la alternativa correcta. En la Parte II, responde en el espacio asignado siguiendo la técnica indicada.", size: 20, color: '555555' })]
      }));
      sections.push(gap());

      // Textos de Lectura (Word)
      if (contenido.textos_lectura && contenido.textos_lectura.length > 0) {
        sections.push(gap()); sections.push(h2('TEXTOS DE LECTURA'));
        contenido.textos_lectura.forEach((txt: any, index: number) => {
          const cleanTxtTitle = (txt.titulo || '').replace(/^Texto\s*\d+\s*:\s*/i, '').trim() || 'Sin Título';
          sections.push(new Paragraph({
            children: [new TextRun({ text: `Texto ${index + 1}: ${cleanTxtTitle} — Tipo: ${txt.tipo || 'Lectura'} — Fuente: Texto adaptado con fines pedagógicos.`, bold: true, size: 22, color: 'BE123C' })],
          }));
          sections.push(gap());
          sections.push(new Paragraph({
            children: [new TextRun({ text: txt.contenido, size: 20 })],
          }));
          sections.push(gap());
        });
      }

      // PARTE I: SELECCIÓN ÚNICA
      if (MC_Preguntas.length > 0) {
        sections.push(gap()); sections.push(h2(`PARTE I: Comprensión de Lectura — Selección Única (${mcPoints} puntos)`));
        MC_Preguntas.forEach((p: any, i: number) => {
          sections.push(new Paragraph({
            children: [new TextRun({ text: `${i + 1}. ${p.enunciado}`, bold: true, size: 22 })],
          }));
          if (p.texto_base) {
            sections.push(new Paragraph({
              children: [new TextRun({ text: p.texto_base, italics: true, size: 20, color: '555555' })],
            }));
          }
          (p.alternativas ?? []).forEach((alt: any) => {
            sections.push(new Paragraph({
              children: [new TextRun({ text: `   ${alt.letra}) ${alt.texto}`, size: 20 })]
            }));
          });
          sections.push(gap());
        });
      }

      // PARTE II: DESARROLLO
      if (Dev_Preguntas.length > 0) {
        sections.push(gap()); sections.push(h2(`PARTE II: Preguntas de Desarrollo (${devPoints} puntos)`));
        Dev_Preguntas.forEach((p: any, i: number) => {
          const itemNum = MC_Preguntas.length + i + 1;
          sections.push(new Paragraph({
            children: [new TextRun({ text: `${itemNum}. ${p.enunciado}`, bold: true, size: 22 })],
          }));
          
          const instTipo = contenido.tipo_evaluacion || ev?.tipo_evaluacion || 'formativa';
          const techniqueInstructionText = getTechniqueInstruction(instTipo);

          sections.push(new Paragraph({
            children: [new TextRun({ text: `   ${techniqueInstructionText}`, bold: true, size: 20, color: 'BE123C' })]
          }));
          sections.push(gap());

          sections.push(new Paragraph({
            children: [new TextRun({ text: '   ____________________________________________________________________________________', color: 'CCCCCC' })]
          }));
          sections.push(new Paragraph({
            children: [new TextRun({ text: '   ____________________________________________________________________________________', color: 'CCCCCC' })]
          }));
          sections.push(new Paragraph({
            children: [new TextRun({ text: '   ____________________________________________________________________________________', color: 'CCCCCC' })]
          }));
          sections.push(gap());
        });
      }

      // RÚBRICA (Word)
      const rub = contenido.rubrica;
      if (rub?.criterios?.length) {
        sections.push(gap());
        sections.push(h2(rub.titulo || 'Instrumento de Evaluación Descriptivo (Rúbrica)'));
        if (rub.instruccion) {
          sections.push(new Paragraph({
            children: [new TextRun({ text: rub.instruccion, size: 20, color: '555555', italics: true })]
          }));
          sections.push(gap());
        }

        const instTipo = rub.tipo_instrumento || 'rubrica_analitica';
        const headers = getInstrumentHeaders(instTipo);

        let colWidths: number[] = [];
        if (instTipo === 'lista_cotejo') {
          colWidths = [50, 25, 25];
        } else if (instTipo === 'rubrica_holistica') {
          colWidths = [25, 75];
        } else if (instTipo === 'escala_apreciacion') {
          colWidths = [40, 15, 15, 15, 15];
        } else {
          colWidths = [28, 18, 18, 18, 18];
        }

        const rubRows = [];
        rubRows.push(new TableRow({
          children: headers.map((h, i) => new TableCell({
            width: { size: colWidths[i], type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })]
          }))
        }));

        const makeWordCell = (txt: string, wPct: number, boldText = false) => new TableCell({
          width: { size: wPct, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: txt || '', bold: boldText, size: 20 })] })]
        });

        rub.criterios.forEach((c: any) => {
          const cells = [];
          
          cells.push(new TableCell({
            width: { size: colWidths[0], type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: c.nombre || c.dimension || '', bold: true, size: 20 }),
                  ...(c.oa ? [new TextRun({ text: `\n${c.oa}`, size: 16, color: 'BE123C' })] : [])
                ]
              })
            ]
          }));

          if (instTipo === 'lista_cotejo') {
            cells.push(makeWordCell(c.logrado || c.si || '', colWidths[1]));
            cells.push(makeWordCell(c.no_logrado || c.no || '', colWidths[2]));
          } else if (instTipo === 'escala_apreciacion') {
            cells.push(makeWordCell(c.destacado || '', colWidths[1]));
            cells.push(makeWordCell(c.logrado || '', colWidths[2]));
            cells.push(makeWordCell(c.en_desarrollo || '', colWidths[3]));
            cells.push(makeWordCell(c.no_logrado || '', colWidths[4]));
          } else if (instTipo === 'rubrica_holistica') {
            cells.push(makeWordCell(c.descripcion || c.excelente || c.logrado || '', colWidths[1]));
          } else {
            cells.push(makeWordCell(c.excelente || c.logrado || '', colWidths[1]));
            cells.push(makeWordCell(c.bueno || c.logrado_parcial || '', colWidths[2]));
            cells.push(makeWordCell(c.suficiente || c.en_desarrollo || '', colWidths[3]));
            cells.push(makeWordCell(c.insuficiente || c.no_logrado || '', colWidths[4]));
          }

          rubRows.push(new TableRow({ children: cells }));
        });

        sections.push(new Table({
          rows: rubRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        }));
        sections.push(gap());
      }

      // AUTOEVALUACIÓN (Word)
      const auto = contenido.autoevaluacion;
      if (auto) {
        sections.push(gap());
        sections.push(h2('Autoevaluación'));
        if (auto.oa_actitudinal) {
          sections.push(new Paragraph({
            children: [
              new TextRun({ text: `${auto.oa_actitudinal}: `, bold: true, size: 20, color: 'BE123C' }),
              ...(auto.texto_oa_actitudinal ? [new TextRun({ text: auto.texto_oa_actitudinal, size: 20 })] : [])
            ]
          }));
          sections.push(gap());
        }
        if (auto.instruccion) {
          sections.push(new Paragraph({
            children: [new TextRun({ text: auto.instruccion, size: 20, color: '555555', italics: true })]
          }));
          sections.push(gap());
        }
        const autoItems = auto.items ?? [];
        autoItems.forEach((item: any) => {
          sections.push(new Paragraph({
            children: [
              new TextRun({ text: `${item.numero}. ${item.enunciado} `, size: 20 }),
              new TextRun({ text: `[Escala: ${item.escala}]`, size: 18, color: '666666', italics: true })
            ]
          }));
        });
        sections.push(gap());
      }

      // COEVALUACIÓN (Word)
      const co = contenido.coevaluacion;
      if (co) {
        sections.push(gap());
        sections.push(h2('Coevaluación'));
        if (co.oa_actitudinal) {
          sections.push(new Paragraph({
            children: [
              new TextRun({ text: `${co.oa_actitudinal}: `, bold: true, size: 20, color: 'BE123C' }),
              ...(co.texto_oa_actitudinal ? [new TextRun({ text: co.texto_oa_actitudinal, size: 20 })] : [])
            ]
          }));
          sections.push(gap());
        }
        if (co.instruccion) {
          sections.push(new Paragraph({
            children: [new TextRun({ text: co.instruccion, size: 20, color: '555555', italics: true })]
          }));
          sections.push(gap());
        }
        const coItems = co.criterios ?? (co as any).items ?? [];
        coItems.forEach((item: any) => {
          sections.push(new Paragraph({
            children: [
              new TextRun({ text: `${item.numero}. ${item.enunciado} `, size: 20 }),
              new TextRun({ text: `[Escala: ${item.escala}]`, size: 18, color: '666666', italics: true })
            ]
          }));
        });
        sections.push(gap());
      }

      // HETEROEVALUACIÓN (Word)
      const hetero = contenido.heteroevaluacion;
      if (hetero?.criterios?.length) {
        sections.push(gap());
        sections.push(h2('Heteroevaluación Docente'));
        if (hetero.instruccion) {
          sections.push(new Paragraph({
            children: [new TextRun({ text: hetero.instruccion, size: 20, color: '555555', italics: true })]
          }));
          sections.push(gap());
        }

        const heteroColWidths = [40, 20, 20, 20];
        const heteroRows = [];

        heteroRows.push(new TableRow({
          children: ['Criterio', 'Logrado', 'Medianamente Logrado', 'Por Lograr'].map((h, i) => new TableCell({
            width: { size: heteroColWidths[i], type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })]
          }))
        }));

        hetero.criterios.forEach((c: any) => {
          heteroRows.push(new TableRow({
            children: [
              new TableCell({
                width: { size: heteroColWidths[0], type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: c.nombre || '', bold: true, size: 20 }),
                      ...(c.oa ? [new TextRun({ text: `\n${c.oa}`, size: 16, color: 'BE123C' })] : [])
                    ]
                  })
                ]
              }),
              new TableCell({
                width: { size: heteroColWidths[1], type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: c.logrado || '', size: 20 })] })]
              }),
              new TableCell({
                width: { size: heteroColWidths[2], type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: c.medianamente_logrado || '', size: 20 })] })]
              }),
              new TableCell({
                width: { size: heteroColWidths[3], type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: c.por_lograr || '', size: 20 })] })]
              })
            ]
          }));
        });

        sections.push(new Table({
          rows: heteroRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        }));
        sections.push(gap());
      }

      // TABLA DE ESPECIFICACIONES (Word)
      if (filasSpec.length > 0) {
        sections.push(gap()); sections.push(h2('TABLA DE ESPECIFICACIONES'));
        
        // 4x2 grid information table
        sections.push(makeTable([
          new TableRow({
            children: [
              cell(`Docente Responsable: ${(contenido.docente || "___________________________").replace(/ROGOBERTO/gi, 'RIGOBERTO')}`, true),
              cell("Asignatura: Lenguaje y Comunicación", true),
              cell(`Nivel/Curso: ${ev.nivel || ''}`, true),
              cell(`Tiempo: ${contenido.duracion_min ?? 90} min`, true)
            ]
          }),
          new TableRow({
            children: [
              cell(`Ítems Totales: ${preguntas.length}`, true),
              cell(`Puntaje Total: ${totalPtos} pts`, true),
              cell("Exigencia: 60%", true),
              cell("RBD: 10243-9", true)
            ]
          })
        ]));
        sections.push(gap());

        const oaCodesText = (ev.oa_codes && ev.oa_codes.length > 0)
          ? ev.oa_codes.join(' | ')
          : ((contenido.tabla_especificaciones?.oa_evaluado) || 'OA 3 | OA 4 | OA 8');
        sections.push(new Paragraph({
          children: [
            new TextRun({ text: `Objetivos de Aprendizaje (OAs): `, bold: true, size: 20 }),
            new TextRun({ text: oaCodesText, size: 20 })
          ]
        }));
        sections.push(new Paragraph({
          children: [
            new TextRun({ text: `Descripción sintetizada: Evalúa habilidades de comprensión lectora, identificación de vocabulario en contexto e inferencia.`, size: 18, color: '555555' })
          ]
        }));
        sections.push(gap());

        const totalItemsCount = preguntas.length;
        const specRows = [
          headerRow(['Habilidades', 'Indicadores', 'Contenido', 'Tipo Ítem', 'N° Ítem', 'Claves', 'Ponderación']),
          ...Object.values(groupedSpec).map((g: any) => {
            const numItemsText = g.num_items.sort((a: number, b: number) => a - b).join(', ');
            const pct = totalItemsCount > 0 ? Math.round((g.num_items.length / totalItemsCount) * 100) : 0;
            const ponderacionText = `${g.num_items.length} / ${totalItemsCount} (${pct}%)`;

            return new TableRow({
              children: [
                cell(g.habilidad, true),
                cell(Array.from(g.indicadores).join(', ')),
                cell(Array.from(g.contenidos).join(', ')),
                cell(Array.from(g.tipo_items).join(', ')),
                cell(numItemsText),
                cell(g.claves.join(', ')),
                cell(ponderacionText)
              ]
            });
          })
        ];
        sections.push(makeTable(specRows));
        sections.push(gap());

        // Signatures footer
        sections.push(new Paragraph({
          children: [
            new TextRun({ text: "Firma Docente: __________________      ", bold: true, size: 20 }),
            new TextRun({ text: "VoBo Jefe UTP: __________________      ", bold: true, size: 20 }),
            new TextRun({ text: "Fecha: _________", bold: true, size: 20 })
          ]
        }));
        sections.push(gap());
      }

      // TABLA DE CONVERSIÓN PUNTAJE a NOTA (Escala 60%)
      sections.push(gap()); sections.push(h2('TABLA DE CONVERSIÓN PUNTAJE a NOTA (Escala 60%)'));
      const gradesScale = getGradesScale(totalPtos, 0.6);
      const gridColsCount = 5;
      const rowsCountInGrid = Math.ceil(gradesScale.length / gridColsCount);
      
      const convTableRows = [];
      // Header for conversion grid
      convTableRows.push(new TableRow({
        children: Array(gridColsCount).fill(null).map(() => cell("Pts   Nota", true))
      }));

      for (let r = 0; r < rowsCountInGrid; r++) {
        const rowCells = [];
        for (let c = 0; c < gridColsCount; c++) {
          const itemIdx = r + c * rowsCountInGrid;
          if (itemIdx < gradesScale.length) {
            const scaleItem = gradesScale[itemIdx];
            rowCells.push(cell(`${scaleItem.puntos}  ->  ${scaleItem.nota.toFixed(1)}`));
          } else {
            rowCells.push(cell(""));
          }
        }
        convTableRows.push(new TableRow({ children: rowCells }));
      }
      sections.push(makeTable(convTableRows));
      sections.push(gap());

      // PAUTA DE CORRECCIÓN
      sections.push(gap()); sections.push(h2('PAUTA DE CORRECCIÓN — USO EXCLUSIVO DOCENTE'));
      const respList = contenido.respuestas_esperadas || [];
      const mcAnswers = respList.filter((r: any) => r.tipo === 'seleccion_multiple' || !r.respuesta_esperada);
      const devAnswers = respList.filter((r: any) => r.tipo === 'consigna_abierta' || r.respuesta_esperada);

      if (mcAnswers.length > 0) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: 'Parte I: Alternativas (Claves y Justificaciones)', bold: true, size: 22, color: 'BE123C' })]
        }));
        sections.push(gap());

        const tableRows = [
          headerRow(['N° Pregunta', 'Clave', 'Justificación específica'])
        ];

        mcAnswers.forEach((resp: any, ri: number) => {
          const num = resp.pregunta || (ri + 1);
          const justification = resp.explicacion || 'Justificación basada en la información explícita e implícita del texto.';
          tableRows.push(new TableRow({
            children: [
              cell(String(num), false),
              cell(resp.clave || 'A', true),
              cell(justification, false)
            ]
          }));
        });

        sections.push(makeTable(tableRows));
        sections.push(gap());
      }

      if (devAnswers.length > 0) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: 'Parte II: Preguntas de Desarrollo (Respuestas Esperadas y Criterios)', bold: true, size: 22, color: 'BE123C' })]
        }));
        sections.push(gap());

        devAnswers.forEach((resp: any) => {
          const num = resp.pregunta;
          sections.push(new Paragraph({
            children: [new TextRun({ text: `Pregunta ${num} (Desarrollo)`, bold: true, size: 22 })]
          }));
          const instTipo = contenido.tipo_evaluacion || ev?.tipo_evaluacion || 'formativa';
          const techniqueInstructionText = getTechniqueInstruction(instTipo);
          sections.push(new Paragraph({
            children: [new TextRun({ text: `   ${techniqueInstructionText}`, bold: true, size: 20, color: 'BE123C' })]
          }));
          sections.push(new Paragraph({
            children: [
              new TextRun({ text: `Respuesta esperada: `, bold: true, size: 20 }),
              new TextRun({ text: resp.respuesta_esperada, size: 20 })
            ]
          }));
          if (resp.criterios_correccion?.length) {
            sections.push(new Paragraph({
              children: [new TextRun({ text: `Criterios de evaluación:`, bold: true, size: 20, color: '666666' })]
            }));
            resp.criterios_correccion.forEach((c: string) => {
              sections.push(new Paragraph({
                children: [new TextRun({ text: `• ${c}`, size: 20, color: '666666' })]
              }));
            });
          }
          sections.push(gap());
        });
      }

      if (contenido.pauta_correccion) {
        sections.push(gap());
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Pauta de Calificación:`, bold: true, size: 22 })]
        }));
        sections.push(new Paragraph({
          children: [
            new TextRun({ text: `Puntaje Total: ${contenido.pauta_correccion.puntaje_total || totalPtos} Ptos | Exigencia: ${contenido.pauta_correccion.exigencia || '60%'} | Puntaje Aprobación (Nota 4.0): ${contenido.pauta_correccion.puntaje_aprobacion || Math.round(totalPtos * 0.6)} Ptos`, size: 20 })
          ]
        }));
      }

      const doc = new Document({
        sections: [{
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: `${contenido.establecimiento || "___________________________"} | Página `, size: 16, color: '888888' }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
                    new TextRun({ text: " de ", size: 16, color: '888888' }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888' })
                  ]
                })
              ]
            })
          },
          children: sections
        }]
      });
      const blob = await Packer.toBlob(doc);
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
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const contenido = ev.contenido_json;
      const margin = 20;
      const usable = 170; // 210 - 2*20
      let y = margin;

      // ─ Clean Dark background on every page ──────────────────────────────
      const fillBackground = () => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 297, 'F');
      };
      fillBackground(); // page 1

      // ─ Text helper (auto-page) ────────────────────
      const addText = (text: string, size = 10, bold = false, color = '#e2e8f0') => {
        // Map dark colors to light colors for dark mode
        let mappedColor = color;
        if (color.toLowerCase() === '#1e293b' || color.toLowerCase() === '#30293b') {
          mappedColor = '#e2e8f0'; // slate-200
        } else if (color.toLowerCase() === '#be123c') {
          mappedColor = '#fb7185'; // rose-400
        } else if (color.toLowerCase() === '#334155' || color.toLowerCase() === '#475569') {
          mappedColor = '#cbd5e1'; // slate-300
        } else if (color.toLowerCase() === '#16a34a') {
          mappedColor = '#4ade80'; // green-400
        } else if (color.toLowerCase() === '#64748b') {
          mappedColor = '#94a3b8'; // slate-400
        }

        const applyTextStyles = () => {
          doc.setFontSize(size);
          if (mappedColor.startsWith('#')) {
            const r = parseInt(mappedColor.slice(1, 3), 16);
            const g = parseInt(mappedColor.slice(3, 5), 16);
            const b = parseInt(mappedColor.slice(5, 7), 16);
            doc.setTextColor(r, g, b);
          } else {
            doc.setTextColor(226, 232, 240); // default slate-200
          }
          doc.setFont('helvetica', bold ? 'bold' : 'normal');
        };

        applyTextStyles();
        const lines: string[] = doc.splitTextToSize(text ?? '', usable);
        lines.forEach((line: string) => {
          if (y > 272) {
            doc.addPage();
            fillBackground();
            y = margin;
            applyTextStyles(); // re-apply on new page
          }
          doc.text(line, margin, y);
          y += size * 0.45;
        });
        y += 2;
      };

      // Helper: draw a divider line
      const addLine = () => {
        doc.setDrawColor(51, 65, 85); // slate-700
        doc.line(margin, y, 210 - margin, y);
        y += 4;
      };
      // Helper: section header
      const addSection = (label: string) => {
        y += 4;
        addText(label, 12, true, '#be123c'); // rose-700
        addLine();
      };

      const getTextoAsociado = (q: any, idx: number, total: number) => {
        const txt = String(q.texto_asociado || q.texto || '').toLowerCase();
        if (txt.includes('texto_1') || txt.includes('texto 1') || txt.includes('1')) return 'texto_1';
        if (txt.includes('texto_2') || txt.includes('texto 2') || txt.includes('2')) return 'texto_2';
        if (txt.includes('ambos') || txt.includes('integra') || txt.includes('ambas')) return 'ambos';
        
        const enunc = String(q.enunciado || '').toLowerCase();
        if (enunc.includes('texto 1') || enunc.includes('primer texto')) return 'texto_1';
        if (enunc.includes('texto 2') || enunc.includes('segundo texto')) return 'texto_2';
        if (enunc.includes('ambos textos') || enunc.includes('ambas lecturas')) return 'ambos';
        
        if (idx < total * 0.45) return 'texto_1';
        if (idx < total * 0.9) return 'texto_2';
        return 'ambos';
      };

      const checkSpaceForNextGroup = (nextText: any, nextQuestions: any[]) => {
        let needed = 15; // títulos y márgenes mínimos
        if (nextText) {
          const paragraphs = (nextText.contenido || '').split('\n');
          paragraphs.forEach((p: string) => {
            if (p.trim()) {
              const lines = doc.splitTextToSize(p.trim(), usable);
              needed += lines.length * 4.5 + 1.5;
            }
          });
        }
        if (nextQuestions && nextQuestions.length > 0) {
          needed += 25; // cabecera + primera pregunta
        }
        if (y + needed > 265) {
          doc.addPage();
          fillBackground();
          y = margin;
        }
      };

      const drawSingleText = (txt: any, index: number) => {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        y += 2;
        const cleanTxtTitle = (txt.titulo || '').replace(/^Texto\s*\d+\s*:\s*/i, '').trim() || 'Sin Título';
        addText(`Texto ${index + 1}: ${cleanTxtTitle} — Tipo: ${txt.tipo || 'Lectura'} — Fuente: Texto adaptado con fines pedagógicos.`, 10, true, '#be123c');
        y += 2;

        const paragraphs = (txt.contenido || '').split('\n');
        paragraphs.forEach((p: string) => {
          const trimmed = p.trim();
          if (trimmed) {
            addText(trimmed, 9, false, '#334155');
            y += 1.5;
          }
        });
        y += 4;
      };

      const drawQuestionsGroup = (qGroup: any[], groupTitle: string) => {
        if (qGroup.length === 0) return;
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        addSection(groupTitle);

        const mcQ = qGroup.filter((p: any) => p.tipo === 'seleccion_multiple');
        const devQ = qGroup.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

        if (mcQ.length > 0) {
          let currentWidth = 80;
          const gap = 10;
          let colY = [y, y];
          let currentCol = 0;
          const yLimit = 265;

          const printTextInCol = (text: string, size = 9, bold = false, color = '#1e293b', isTestOnly = false) => {
            let mappedColor = color;
            if (color.toLowerCase() === '#1e293b') {
              mappedColor = '#e2e8f0';
            } else if (color.toLowerCase() === '#475569') {
              mappedColor = '#94a3b8';
            }

            doc.setFontSize(size);
            if (mappedColor.startsWith('#')) {
              const r = parseInt(mappedColor.slice(1, 3), 16);
              const g = parseInt(mappedColor.slice(3, 5), 16);
              const b = parseInt(mappedColor.slice(5, 7), 16);
              if (!isTestOnly) doc.setTextColor(r, g, b);
            } else {
              if (!isTestOnly) doc.setTextColor(226, 232, 240);
            }
            if (!isTestOnly) doc.setFont('helvetica', bold ? 'bold' : 'normal');
            const lines = doc.splitTextToSize(text ?? '', currentWidth);
            let localY = 0;
            lines.forEach((line: string) => {
              localY += size * 0.45;
            });
            return localY + 1.2;
          };

          const getQuestionHeight = (p: any) => {
            let h = 0;
            if (p.texto_base) {
              h += printTextInCol(p.texto_base, 8, false, '#475569', true);
            }
            h += printTextInCol(`${p.numero_original || p.numero}. ${p.enunciado}`, 9.5, true, '#1e293b', true);
            const alts = p.alternativas ?? [];
            if (alts.length > 0) {
              alts.forEach((alt: any) => {
                h += printTextInCol(`   ${alt.letra}) ${alt.texto}`, 8.5, false, '#475569', true);
              });
            } else {
              h += printTextInCol(`   [Alternativas no disponibles]`, 8.5, false, '#475569', true);
            }
            h += 2;
            return h;
          };

          const drawQuestionInCol = (p: any, colX: number, colIndex: number) => {
            if (p.texto_base) {
              doc.setFontSize(8);
              doc.setTextColor(148, 163, 184); // slate-400
              doc.setFont('helvetica', 'normal');
              const lines = doc.splitTextToSize(p.texto_base, currentWidth);
              lines.forEach((line: string) => {
                doc.text(line, colX, colY[colIndex]);
                colY[colIndex] += 8 * 0.45;
              });
              colY[colIndex] += 1.2;
            }

            // Enunciado
            doc.setFontSize(9.5);
            doc.setTextColor(226, 232, 240); // slate-200
            doc.setFont('helvetica', 'bold');
            const linesEnunc = doc.splitTextToSize(`${p.numero_original || p.numero}. ${p.enunciado}`, currentWidth);
            linesEnunc.forEach((line: string) => {
              doc.text(line, colX, colY[colIndex]);
              colY[colIndex] += 9.5 * 0.45;
            });
            colY[colIndex] += 1.2;

            // Alternativas
            doc.setFontSize(8.5);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.setFont('helvetica', 'normal');
            const alts = p.alternativas ?? [];
            if (alts.length > 0) {
              alts.forEach((alt: any) => {
                const linesAlt = doc.splitTextToSize(`   ${alt.letra}) ${alt.texto}`, currentWidth);
                linesAlt.forEach((line: string) => {
                  doc.text(line, colX, colY[colIndex]);
                  colY[colIndex] += 8.5 * 0.45;
                });
                colY[colIndex] += 1.2;
              });
            } else {
              const linesAlt = doc.splitTextToSize(`   [Alternativas no disponibles]`, currentWidth);
              linesAlt.forEach((line: string) => {
                doc.text(line, colX, colY[colIndex]);
                colY[colIndex] += 8.5 * 0.45;
              });
              colY[colIndex] += 1.2;
            }
            colY[colIndex] += 2;
          };

          currentCol = 0;
          mcQ.forEach((p: any, idx: number) => {
            const isLastOdd = (idx === mcQ.length - 1 && currentCol === 0);
            if (isLastOdd) {
              y = Math.max(colY[0], colY[1]);
              colY = [y, y];
              currentWidth = 170;
            } else {
              currentWidth = 80;
            }

            const qHeight = getQuestionHeight(p);
            if (colY[currentCol] + qHeight > yLimit) {
              if (isLastOdd) {
                doc.addPage();
                fillBackground();
                y = margin;
                colY = [y, y];
              } else if (currentCol === 0) {
                const isLeftColumnEmpty = (colY[0] === y || colY[0] === margin);
                if (isLeftColumnEmpty && y > margin) {
                  doc.addPage();
                  fillBackground();
                  colY = [margin, margin];
                  currentCol = 0;
                } else {
                  currentCol = 1;
                }
              } else {
                doc.addPage();
                fillBackground();
                colY = [margin, margin];
                currentCol = 0;
              }
            }
            const colX = isLastOdd ? margin : (margin + currentCol * (80 + gap));
            drawQuestionInCol(p, colX, isLastOdd ? 0 : currentCol);
            if (isLastOdd) {
              colY[1] = colY[0];
            }
          });

          y = Math.max(colY[0], colY[1]) + 4;
        }

        if (devQ.length > 0) {
          if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
          devQ.forEach((p: any) => {
            if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
            addText(`${p.numero_original || p.numero}. ${p.enunciado}`, 9.5, true, '#1e293b');

            // BUG 2 Fix: Se removió la instrucción RICE en rojo de la sección estudiante.

            doc.setDrawColor(203, 213, 225);
            doc.line(margin + 5, y, 210 - margin, y); y += 6;
            doc.line(margin + 5, y, 210 - margin, y); y += 6;
            doc.line(margin + 5, y, 210 - margin, y); y += 4;
          });
          y += 4;
        }
      };
      // Helper: Chilean grade conversion scale (60% exigencia)
      const getGradesScale = (total: number, exigencia = 0.6) => {
        const scale: Array<{ puntos: number; nota: number }> = [];
        for (let p = 0; p <= total; p++) {
          let nota = 1.0;
          if (total > 0) {
            const approvalPoints = total * exigencia;
            if (p < approvalPoints) {
              nota = 1.0 + 3.0 * (p / approvalPoints);
            } else {
              nota = 4.0 + 3.0 * ((p - approvalPoints) / (total * (1 - exigencia)));
            }
          }
          scale.push({ puntos: p, nota: Math.round(nota * 10) / 10 });
        }
        return scale;
      };

      // ── Calculate dynamic points ──
      const preguntas = getPreguntasList(contenido);
      const MC_Preguntas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple');
      const Dev_Preguntas = preguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

      let mcPoints = MC_Preguntas.length * 2;
      let devPoints = Dev_Preguntas.length * 4;

      const filasSpec = contenido.tabla_especificaciones?.filas || [];
      if (filasSpec.length) {
        let sumMc = 0;
        let sumDev = 0;
        filasSpec.forEach((f: any) => {
          const ptosVal = Number(f.ptos) || 0;
          const isMc = f.tipo_item === 'Selección múltiple' || String(f.tipo_item).toLowerCase().includes('alternativa');
          if (isMc) sumMc += ptosVal;
          else sumDev += ptosVal;
        });
        if (sumMc > 0) mcPoints = sumMc;
        if (sumDev > 0) devPoints = sumDev;
      }
      const totalPtos = mcPoints + devPoints;

      // Group specs table by Habilidad (Taxonomía)
      const groupedSpec: Record<string, {
        habilidad: string;
        indicadores: Set<string>;
        contenidos: Set<string>;
        tipo_items: Set<string>;
        num_items: number[];
        claves: string[];
        ptos: number;
      }> = {};

      filasSpec.forEach((f: any) => {
        const hab = f.habilidad || 'General';
        if (!groupedSpec[hab]) {
          groupedSpec[hab] = {
            habilidad: hab,
            indicadores: new Set(),
            contenidos: new Set(),
            tipo_items: new Set(),
            num_items: [],
            claves: [],
            ptos: 0
          };
        }
        if (f.indicador) groupedSpec[hab].indicadores.add(f.indicador);
        if (f.contenido) groupedSpec[hab].contenidos.add(f.contenido);
        if (f.tipo_item) groupedSpec[hab].tipo_items.add(f.tipo_item);
        if (f.n_pregunta) {
          String(f.n_pregunta).split(',').forEach(n => {
            const num = parseInt(n.trim(), 10);
            if (!isNaN(num)) groupedSpec[hab].num_items.push(num);
          });
        }
        if (f.clave) groupedSpec[hab].claves.push(f.clave);
        groupedSpec[hab].ptos += (Number(f.ptos) || 0);
      });

      // ── 1. ENCABEZADO DEL ESTUDIANTE (Student Header) ──
      const drawHeaderCell = (x: number, yCell: number, w: number, h: number, header: string, value: string) => {
        doc.setDrawColor(51, 65, 85); // slate-700
        doc.setLineWidth(0.35);
        doc.rect(x, yCell, w, h, 'S');

        // Header text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(header, x + 2, yCell + 4.5);

        // Value text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(226, 232, 240); // slate-200
        doc.text(value, x + 2, yCell + 9.5);
      };

      const drawTwoColumnInstructionsTable = (yStart: number) => {
        const w1 = 85;
        const w2 = 85;
        const x = margin;

        // Extract instructions
        let rawInst = 'Lee atentamente las instrucciones antes de responder.';
        if (typeof contenido.instrucciones_generales === 'string') {
          rawInst = contenido.instrucciones_generales;
        } else if (typeof contenido.instrucciones === 'string') {
          rawInst = contenido.instrucciones;
        } else if (contenido.instrucciones_generales && typeof (contenido.instrucciones_generales as any).texto === 'string') {
          rawInst = (contenido.instrucciones_generales as any).texto;
        }
        
        // Extract objectives (OA) - Only the codes
        let rawObj = 'Evaluar comprensión lectora y análisis de textos.';
        if (Array.isArray(contenido.oa_codes) && contenido.oa_codes.length > 0 && contenido.oa_codes[0] !== 'OA_EVAL') {
          rawObj = contenido.oa_codes.map((c: string) => c.replace(/^OA\s*:/i, 'OA ')).join(', ');
        } else if (Array.isArray(ev.oa_codes) && ev.oa_codes.length > 0 && ev.oa_codes[0] !== 'OA_EVAL') {
          rawObj = ev.oa_codes.map((c: string) => c.replace(/^OA\s*:/i, 'OA ')).join(', ');
        } else if (typeof contenido.tabla_especificaciones?.oa_evaluado === 'string' && contenido.tabla_especificaciones.oa_evaluado) {
          const matches = contenido.tabla_especificaciones.oa_evaluado.match(/OA\s*\d+/gi);
          if (matches && matches.length > 0) {
            rawObj = matches.map(m => m.toUpperCase().replace(/\s+/g, ' ')).join(', ');
          } else {
            rawObj = contenido.tabla_especificaciones.oa_evaluado;
          }
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(226, 232, 240);

        // Split text for each column
        const col1Lines = doc.splitTextToSize(rawInst, w1 - 6);
        const col2Lines = doc.splitTextToSize(rawObj, w2 - 6);

        const lineHeight = 4;
        const headerHeight = 7;
        const height1 = headerHeight + col1Lines.length * lineHeight + 4;
        const height2 = headerHeight + col2Lines.length * lineHeight + 4;
        const maxHeight = Math.max(height1, height2);

        // Draw outer borders
        doc.setDrawColor(51, 65, 85); // slate-700
        doc.setLineWidth(0.35);
        doc.rect(x, yStart, w1, maxHeight, 'S');
        doc.rect(x + w1, yStart, w2, maxHeight, 'S');

        // Column 1 header background
        doc.setFillColor(30, 41, 59); // slate-800
        doc.rect(x + 0.1, yStart + 0.1, w1 - 0.2, headerHeight - 0.1, 'F');
        
        // Column 2 header background
        doc.rect(x + w1 + 0.1, yStart + 0.1, w2 - 0.2, headerHeight - 0.1, 'F');

        // Header text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(226, 232, 240);
        doc.text("Instrucciones", x + 3, yStart + 4.5);
        doc.text("Objetivos", x + w1 + 3, yStart + 4.5);

        // Draw content for Column 1
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        let currY1 = yStart + headerHeight + 3;
        col1Lines.forEach((line: string) => {
          doc.text(line, x + 3, currY1);
          currY1 += lineHeight;
        });

        // Draw content for Column 2
        let currY2 = yStart + headerHeight + 3;
        col2Lines.forEach((line: string) => {
          doc.text(line, x + w1 + 3, currY2);
          currY2 += lineHeight;
        });

        return maxHeight;
      };

      const courseName = ev.nivel || 'General';
      const teacherName = (contenido.docente || '___________________________').replace(/ROGOBERTO/gi, 'RIGOBERTO');
      const subjectName = contenido.asignatura || 'Lenguaje y Comunicación';

      // Fila 1:
      drawHeaderCell(margin, y, 45, 12, "Instrumento", "PRUEBA ESCRITA");
      drawHeaderCell(margin + 45, y, 65, 12, "Asignatura/Especialidad", subjectName);
      drawHeaderCell(margin + 110, y, 30, 12, "Curso", courseName);
      drawHeaderCell(margin + 140, y, 30, 12, "Letra", "");

      y += 12;

      // Fila 2:
      drawHeaderCell(margin, y, 60, 12, "Docente Responsable", teacherName);
      drawHeaderCell(margin + 60, y, 22, 12, "Pje. Ideal", `${totalPtos} pts`);
      drawHeaderCell(margin + 82, y, 22, 12, "Pje. Corte", `${Math.round(totalPtos * 0.6)} pts`);
      drawHeaderCell(margin + 104, y, 22, 12, "Prema/Ex.", "60%");
      drawHeaderCell(margin + 126, y, 22, 12, "Tiempo", `${contenido.duracion_min || 90} min`);
      drawHeaderCell(margin + 148, y, 22, 12, "Coef.", "1");

      y += 12;

      // Fila 3:
      drawHeaderCell(margin, y, 90, 12, "Nombre del Estudiante", "");
      drawHeaderCell(margin + 90, y, 30, 12, "Fecha", "");
      drawHeaderCell(margin + 120, y, 25, 12, "Pje. Obtenido", "");
      drawHeaderCell(margin + 145, y, 25, 12, "Calificación", "");

      y += 18;

      // Título en negrita y subrayado
      const getEvaluationTitle = () => {
        const tipo = String(contenido.tipo_evaluacion || ev.tipo_evaluacion || '').toLowerCase();
        const isSimce = ev.simce_ensayo || tipo.includes('simce');
        if (isSimce) return 'ENSAYO SIMCE';
        if (tipo.includes('diagnostica')) return 'EVALUACIÓN DIAGNÓSTICA';
        if (tipo.includes('formativa')) return 'EVALUACIÓN FORMATIVA';
        if (tipo.includes('sumativa')) return 'EVALUACIÓN SUMATIVA';
        return 'EVALUACIÓN FORMATIVA';
      };

      const titleText = getEvaluationTitle();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(226, 232, 240); // slate-200
      const textWidth = doc.getTextWidth(titleText);
      const startX = margin + (usable - textWidth) / 2;
      doc.text(titleText, startX, y);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.45);
      doc.line(startX, y + 1.2, startX + textWidth, y + 1.2);

      y += 8;

      // Tabla de dos columnas: Instrucciones | Objetivos
      const tableHeight = drawTwoColumnInstructionsTable(y);
      y += tableHeight + 6;
      // ── 3. TEXTOS Y PREGUNTAS INTERCALADOS ──
      // Clean alternatives first and apply the sequential numbering in the exact sorted order
      const cleanPreguntasList = preguntas.map((q: any) => {
        const cleanAlts = getCleanAlternatives(q.alternativas, q.numero, q);
        return {
          ...q,
          alternativas: cleanAlts
        };
      });

      const preguntasT1_raw = cleanPreguntasList.filter((q: any, idx: number) => getTextoAsociado(q, idx, cleanPreguntasList.length) === 'texto_1');
      const preguntasT2_raw = cleanPreguntasList.filter((q: any, idx: number) => getTextoAsociado(q, idx, cleanPreguntasList.length) === 'texto_2');
      const preguntasAmbos_raw = cleanPreguntasList.filter((q: any, idx: number) => getTextoAsociado(q, idx, cleanPreguntasList.length) === 'ambos');

      const getMC = (arr: any[]) => arr.filter((p: any) => p.tipo === 'seleccion_multiple');
      const getDev = (arr: any[]) => arr.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

      const finalSortedPreguntas = [
        ...getMC(preguntasT1_raw),
        ...getDev(preguntasT1_raw),
        ...getMC(preguntasT2_raw),
        ...getDev(preguntasT2_raw),
        ...getMC(preguntasAmbos_raw),
        ...getDev(preguntasAmbos_raw)
      ];

      const questionsWithNum = finalSortedPreguntas.map((q: any, idx: number) => ({
        ...q,
        numero_original: idx + 1
      }));

      const preguntasT1 = questionsWithNum.filter((q: any, idx: number) => getTextoAsociado(q, idx, questionsWithNum.length) === 'texto_1');
      const preguntasT2 = questionsWithNum.filter((q: any, idx: number) => getTextoAsociado(q, idx, questionsWithNum.length) === 'texto_2');
      const preguntasAmbos = questionsWithNum.filter((q: any, idx: number) => getTextoAsociado(q, idx, questionsWithNum.length) === 'ambos');

      const texts = contenido.textos_lectura || [];
      if (texts.length >= 2) {
        // Texto 1
        addSection('TEXTO DE LECTURA 1');
        drawSingleText(texts[0], 0);
        
        // Preguntas Texto 1
        drawQuestionsGroup(preguntasT1, 'PREGUNTAS DEL TEXTO 1');

        // Texto 2
        checkSpaceForNextGroup(texts[1], preguntasT2);
        addSection('TEXTO DE LECTURA 2');
        drawSingleText(texts[1], 1);

        // Preguntas Texto 2
        drawQuestionsGroup(preguntasT2, 'PREGUNTAS DEL TEXTO 2');

        // Preguntas Integradas
        if (preguntasAmbos.length > 0) {
          checkSpaceForNextGroup(null, preguntasAmbos);
          drawQuestionsGroup(preguntasAmbos, 'PREGUNTAS DE INTEGRACIÓN (AMBOS TEXTOS)');
        }
      } else {
        // Fallback
        if (texts.length > 0) {
          addSection('TEXTOS DE LECTURA');
          texts.forEach((txt: any, idx: number) => {
            drawSingleText(txt, idx);
          });
        }
        drawQuestionsGroup(questionsWithNum, 'PREGUNTAS DE COMPRENSIÓN');
      }
      // ── 6. TABLA DE ESPECIFICACIONES (FORMATO EXACTO) ──
      doc.addPage();
      fillBackground();
      y = margin;

      addSection('TABLA DE ESPECIFICACIONES');

      // 4x2 Header info grid
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
      doc.setTextColor(226, 232, 240); // slate-200
      doc.setDrawColor(51, 65, 85); // slate-700
      doc.rect(margin, y, usable, 16, 'S');
      doc.line(margin, y + 8, margin + usable, y + 8);
      doc.line(margin + 45, y, margin + 45, y + 16);
      doc.line(margin + 90, y, margin + 90, y + 16);
      doc.line(margin + 130, y, margin + 130, y + 16);
      
      doc.text("Docente Responsable:", margin + 2, y + 5);
      doc.setFont('helvetica', 'normal');
      const docResponsable = (contenido.docente || "___________________________").replace(/ROGOBERTO/gi, 'RIGOBERTO');
      doc.text(docResponsable, margin + 2, y + 12);
      
      doc.setFont('helvetica', 'bold');
      doc.text("Asignatura:", margin + 47, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text("Lenguaje y Comunicación", margin + 47, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.text("Nivel / Curso:", margin + 92, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(ev.nivel || '', margin + 92, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.text("Tiempo estimado:", margin + 132, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${contenido.duracion_min ?? 90} min`, margin + 132, y + 12);

      y += 20;

      // Second info row
      doc.setDrawColor(51, 65, 85); // slate-700
      doc.rect(margin, y, usable, 8, 'S');
      doc.line(margin + 45, y, margin + 45, y + 8);
      doc.line(margin + 90, y, margin + 90, y + 8);
      doc.line(margin + 130, y, margin + 130, y + 8);

      doc.setFont('helvetica', 'bold');
      doc.text("Ítems Totales:", margin + 2, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(String(preguntas.length), margin + 25, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.text("Puntaje Total:", margin + 47, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${totalPtos} pts`, margin + 70, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.text("Exigencia:", margin + 92, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text("60%", margin + 112, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.text("RBD:", margin + 132, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text("10243-9", margin + 145, y + 5);

      y += 14;

      // OA Block
      const oaCodesText = (ev.oa_codes && ev.oa_codes.length > 0)
        ? ev.oa_codes.join(' | ')
        : ((contenido.tabla_especificaciones?.oa_evaluado) || 'OA 3 | OA 4 | OA 8');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(226, 232, 240); // slate-200
      doc.text(`Objetivos de Aprendizaje (OAs): ${oaCodesText}`, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Descripción sintetizada: Evalúa habilidades de comprensión lectora, identificación de vocabulario en contexto e inferencia.`, margin, y);
      y += 8;

      // Spec Grid Table Headers
      const specColW = [30, 45, 30, 22, 15, 12, 16];
      const specHeaders = ['Habilidades', 'Indicadores', 'Contenido', 'Tipo Ítem', 'N° Ítem', 'Claves', 'Ponderación'];

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); // slate-400
      doc.setFillColor(30, 41, 59); // slate-800
      doc.setDrawColor(51, 65, 85); // slate-700
      doc.rect(margin, y - 4, usable, 6, 'F');
      doc.rect(margin, y - 4, usable, 6, 'S');

      let sx = margin;
      specHeaders.forEach((h, idx) => {
        doc.text(h, sx + 1, y);
        sx += specColW[idx];
      });
      y += 4;

      doc.setFont('helvetica', 'normal'); doc.setTextColor(226, 232, 240); // slate-200

      filasSpec.forEach((f: any, idx: number) => {
        if (y > 250) { doc.addPage(); fillBackground(); y = margin; }
        
        const numItemsText = f.n_pregunta || String(idx + 1);
        const ponderacionText = `${f.ponderacion_pct || 0}%`;

        const rowCells = [
          f.habilidad || 'General',
          f.indicador || 'Comprender e integrar información.',
          f.contenido || 'Comprensión lectora',
          f.tipo_item || 'Ítem',
          numItemsText,
          f.clave || 'A',
          ponderacionText
        ];

        const cellLines = rowCells.map((text, idx) => doc.splitTextToSize(String(text), specColW[idx] - 2));
        const maxLines = Math.max(...cellLines.map(lines => lines.length));
        const rowHeight = maxLines * 4 + 2;

        doc.setDrawColor(51, 65, 85); // slate-700
        sx = margin;
        
        rowCells.forEach((cellText, cellIdx) => {
          const lines = cellLines[cellIdx];
          lines.forEach((line: string, lineIdx: number) => {
            doc.text(line, sx + 1, y + lineIdx * 4 + 3);
          });
          doc.rect(sx, y, specColW[cellIdx], rowHeight, 'S');
          sx += specColW[cellIdx];
        });
        y += rowHeight;
      });

      y += 12;

      // ── 8. PAUTA DE CORRECCIÓN — USO EXCLUSIVO DOCENTE ──
      if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
      addSection('PAUTA DE CORRECCIÓN — USO EXCLUSIVO DOCENTE');
      
      const respList = contenido.respuestas_esperadas || [];
      const mcAnswers = respList.filter((r: any) => r.tipo === 'seleccion_multiple' || !r.respuesta_esperada);
      const devAnswers = respList.filter((r: any) => r.tipo === 'consigna_abierta' || r.respuesta_esperada);

      if (mcAnswers.length > 0) {
        addText('Parte I: Alternativas (Claves y Justificaciones)', 10, true, '#be123c');
        y += 2;

        const tableColW = [25, 20, 125];
        const tableHeaders = ['N° Pregunta', 'Clave', 'Justificación específica'];

        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); // slate-400
        doc.setFillColor(30, 41, 59); // slate-800
        doc.setDrawColor(51, 65, 85); // slate-700
        doc.rect(margin, y - 4, usable, 6, 'F');
        doc.rect(margin, y - 4, usable, 6, 'S');

        let sx = margin;
        tableHeaders.forEach((h, idx) => {
          doc.text(h, sx + 1, y);
          sx += tableColW[idx];
        });
        y += 4;

        doc.setFont('helvetica', 'normal'); doc.setTextColor(226, 232, 240); // slate-200

        mcAnswers.forEach((resp: any, ri: number) => {
          const num = resp.pregunta || (ri + 1);
          const justification = resp.explicacion || 'Justificación basada en la información explícita e implícita del texto.';
          
          const cellLines = [
            String(num),
            resp.clave || 'A',
            doc.splitTextToSize(justification, tableColW[2] - 2)
          ];

          const lineCount = cellLines[2].length;
          const rowHeight = Math.max(lineCount * 4 + 2, 6);

          if (y + rowHeight > 275) {
            doc.addPage();
            fillBackground();
            y = margin + 4;
            
            // Redraw table headers on new page
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); // slate-400
            doc.setFillColor(30, 41, 59); // slate-800
            doc.setDrawColor(51, 65, 85); // slate-700
            doc.rect(margin, y - 4, usable, 6, 'F');
            doc.rect(margin, y - 4, usable, 6, 'S');
            let sx2 = margin;
            tableHeaders.forEach((h, idx) => {
              doc.text(h, sx2 + 1, y);
              sx2 += tableColW[idx];
            });
            y += 4;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(226, 232, 240); // slate-200
          }

          let sx = margin;
          doc.setDrawColor(51, 65, 85); // slate-700
          doc.rect(sx, y - 4, tableColW[0], rowHeight, 'S');
          doc.text(cellLines[0], sx + 2, y);
          sx += tableColW[0];

          doc.rect(sx, y - 4, tableColW[1], rowHeight, 'S');
          doc.setFont('helvetica', 'bold'); doc.setTextColor(74, 222, 128); // green-400
          doc.text(cellLines[1], sx + 2, y);
          doc.setFont('helvetica', 'normal'); doc.setTextColor(226, 232, 240); // slate-200
          sx += tableColW[1];

          doc.rect(sx, y - 4, tableColW[2], rowHeight, 'S');
          cellLines[2].forEach((line: string, lineIdx: number) => {
            doc.text(line, sx + 1, y + lineIdx * 4);
          });

          y += rowHeight;
        });
        y += 6;
      }

      if (devAnswers.length > 0) {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        addText('Parte II: Preguntas de Desarrollo (Respuestas Esperadas y Criterios)', 10, true, '#be123c');
        y += 2;

        devAnswers.forEach((resp: any) => {
          if (y > 240) { doc.addPage(); fillBackground(); y = margin; }
          const num = resp.pregunta;
          addText(`Pregunta ${num} (Desarrollo)`, 9.5, true, '#1e293b');
          const instTipo = contenido.tipo_evaluacion || ev?.tipo_evaluacion || 'formativa';
          const techniqueInstructionText = getTechniqueInstruction(instTipo);
          addText(`   ${techniqueInstructionText}`, 8, true, '#be123c');
          addText(`Respuesta esperada: ${resp.respuesta_esperada}`, 9, false, '#16a34a');
          
          if (resp.criterios_correccion?.length) {
            addText('Criterios de evaluación:', 8.5, true, '#64748b');
            resp.criterios_correccion.forEach((c: string) => addText(`• ${c}`, 8.5, false, '#64748b'));
          }
          y += 2;
        });
      }

      if (contenido.pauta_correccion) {
        if (y > 265) { doc.addPage(); fillBackground(); y = margin; }
        y += 2;
        addText('Pauta de Calificación:', 9.5, true, '#1e293b');
        addText(`Puntaje Total: ${contenido.pauta_correccion.puntaje_total || totalPtos} Ptos | Exigencia: ${contenido.pauta_correccion.exigencia || '60%'} | Aprobación (Nota 4.0): ${contenido.pauta_correccion.puntaje_aprobacion || Math.round(totalPtos * 0.6)} Ptos`, 9, false, '#475569');
      }

      // ── 8.5. RÚBRICA/INSTRUMENTO DE EVALUACIÓN ──
      const rub = contenido.rubrica;
      if (rub?.criterios?.length) {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        const instTipo = rub.tipo_instrumento || 'rubrica_analitica';
        addSection(rub.titulo || 'INSTRUMENTO DE EVALUACIÓN');
        if (rub.instruccion) addText(rub.instruccion, 8.5, false, '#64748b');

        let rColW = [38, 33, 33, 33, 33];
        const getInstrumentHeaders = (tipo: string) => {
          if (tipo === 'lista_cotejo') return ['Criterio', 'Logrado', 'No Logrado'];
          if (tipo === 'rubrica_holistica') return ['Nivel', 'Descripción del Desempeño'];
          if (tipo === 'escala_apreciacion') return ['Criterio', 'Excelente', 'Bueno', 'Suficiente', 'Insuficiente'];
          return ['Dimensión / Criterio', 'Excelente', 'Bueno', 'Suficiente', 'Insuficiente'];
        };
        let rHeaders = getInstrumentHeaders(instTipo);

        if (instTipo === 'lista_cotejo') {
          rColW = [80, 45, 45];
        } else if (instTipo === 'rubrica_holistica') {
          rColW = [40, 130];
        } else if (instTipo === 'escala_apreciacion') {
          rColW = [50, 30, 30, 30, 30];
        }

        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); // slate-400
        let rx = margin;
        rHeaders.forEach((h, i) => { doc.text(h, rx, y); rx += rColW[i]; });
        y += 6;

        rub.criterios.forEach((c: any) => {
          if (y > 265) { doc.addPage(); fillBackground(); y = margin; }
          rx = margin;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(226, 232, 240); // slate-200

          let vals = [c.nombre || c.dimension || ''];
          if (instTipo === 'lista_cotejo') {
            vals.push(c.logrado || c.si || '', c.no_logrado || c.no || '');
          } else if (instTipo === 'escala_apreciacion') {
            vals.push(c.destacado || '', c.logrado || '', c.en_desarrollo || '', c.no_logrado || '');
          } else if (instTipo === 'rubrica_holistica') {
            vals.push(c.descripcion || c.excelente || c.logrado || '');
          } else {
            vals.push(c.excelente || c.logrado || '', c.bueno || c.logrado_parcial || '', c.suficiente || c.en_desarrollo || '', c.insuficiente || c.no_logrado || '');
          }

          let rowH = 5;
          vals.forEach((v, i) => {
            const ls = doc.splitTextToSize(v ?? '', rColW[i] - 2);
            rowH = Math.max(rowH, ls.length * 4);
          });

          vals.forEach((v, i) => {
            const ls = doc.splitTextToSize(v ?? '', rColW[i] - 2);
            ls.forEach((l: string, li: number) => doc.text(l, rx, y + li * 4));
            rx += rColW[i];
          });
          y += rowH + 2;
        });
      }

      // AUTOEVALUACIÓN (PDF)
      const auto = contenido.autoevaluacion;
      if (auto) {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        addSection('AUTOEVALUACIÓN');
        if (auto.oa_actitudinal) {
          addText(`${auto.oa_actitudinal}: ${auto.texto_oa_actitudinal ?? ''}`, 9, true, '#fb7185');
          y += 2;
        }
        if (auto.instruccion) {
          addText(auto.instruccion, 8.5, false, '#cbd5e1');
          y += 2;
        }
        const autoItems = auto.items ?? [];
        autoItems.forEach((item: any) => {
          if (y > 270) { doc.addPage(); fillBackground(); y = margin; }
          addText(`${item.numero}. ${item.enunciado}   [ Escala: ${item.escala} ]`, 8.5, false, '#e2e8f0');
        });
        y += 4;
      }

      // COEVALUACIÓN (PDF)
      const co = contenido.coevaluacion;
      if (co) {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        addSection('COEVALUACIÓN');
        if (co.oa_actitudinal) {
          addText(`${co.oa_actitudinal}: ${co.texto_oa_actitudinal ?? ''}`, 9, true, '#fb7185');
          y += 2;
        }
        if (co.instruccion) {
          addText(co.instruccion, 8.5, false, '#cbd5e1');
          y += 2;
        }
        const coItems = co.criterios ?? (co as any).items ?? [];
        coItems.forEach((item: any) => {
          if (y > 270) { doc.addPage(); fillBackground(); y = margin; }
          addText(`${item.numero}. ${item.enunciado}   [ Escala: ${item.escala} ]`, 8.5, false, '#e2e8f0');
        });
        y += 4;
      }

      // HETEROEVALUACIÓN (PDF)
      const hetero = contenido.heteroevaluacion;
      if (hetero?.criterios?.length) {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        addSection('HETEROEVALUACIÓN DOCENTE');
        if (hetero.instruccion) {
          addText(hetero.instruccion, 8.5, false, '#cbd5e1');
          y += 2;
        }

        const hColW = [65, 35, 35, 35];
        const hHeaders = ['Criterio', 'Logrado', 'Med. Logrado', 'Por Lograr'];

        // Table Header
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); // slate-400
        doc.setFillColor(30, 41, 59); // slate-800
        doc.setDrawColor(51, 65, 85); // slate-700
        doc.rect(margin, y - 4, usable, 6, 'F');
        doc.rect(margin, y - 4, usable, 6, 'S');

        let hx = margin;
        hHeaders.forEach((h, i) => {
          doc.text(h, hx + 1, y);
          hx += hColW[i];
        });
        y += 4;

        doc.setFont('helvetica', 'normal'); doc.setTextColor(226, 232, 240); // slate-200

        hetero.criterios.forEach((c: any) => {
          const rowCells = [
            c.nombre || '',
            c.logrado || '',
            c.medianamente_logrado || '',
            c.por_lograr || ''
          ];

          const cellLines = rowCells.map((text, idx) => doc.splitTextToSize(String(text), hColW[idx] - 2));
          const maxLines = Math.max(...cellLines.map(lines => lines.length));
          const rowHeight = maxLines * 4 + 2;

          if (y + rowHeight > 275) {
            doc.addPage();
            fillBackground();
            y = margin + 4;

            // Redraw table headers on new page
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
            doc.setFillColor(30, 41, 59);
            doc.setDrawColor(51, 65, 85);
            doc.rect(margin, y - 4, usable, 6, 'F');
            doc.rect(margin, y - 4, usable, 6, 'S');
            let hx2 = margin;
            hHeaders.forEach((h, i) => {
              doc.text(h, hx2 + 1, y);
              hx2 += hColW[i];
            });
            y += 4;
            doc.setFont('helvetica', 'normal'); doc.setTextColor(226, 232, 240);
          }

          hx = margin;
          doc.setDrawColor(51, 65, 85); // slate-700
          rowCells.forEach((cellText, cellIdx) => {
            const lines = cellLines[cellIdx];
            lines.forEach((line: string, lineIdx: number) => {
              doc.text(line, hx + 1, y + lineIdx * 4);
            });
            doc.rect(hx, y - 4, hColW[cellIdx], rowHeight, 'S');
            hx += hColW[cellIdx];
          });
          y += rowHeight;
        });
        y += 4;
      }

      // ── 9. TWO-PASS PAGE FOOTERS (Page X of Y) ──
      const totalPages = doc.getNumberOfPages();
      const estNameFooter = contenido.establecimiento || "___________________________";
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        
        doc.text(`${estNameFooter} | Página ${i} de ${totalPages}`, 105, 287, { align: 'center' });
      }

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${ev.titulo ?? 'evaluacion'}-completa.pdf`;
      a.click();
      URL.revokeObjectURL(url);
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
