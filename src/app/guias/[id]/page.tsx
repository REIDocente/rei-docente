'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
// Importar drawGuidePdf y formatChallengeAnswer actualizados para los nuevos tipos de desafíos
import { drawGuidePdf, formatChallengeAnswer } from '@/lib/templates/drawGuidePdf';
import {
  ArrowLeft, Loader2, Download, Printer, AlertCircle,
  ScrollText, Layers, Sparkles, Search, Compass, Map, KeyRound, Pencil,
  Lightbulb, Eye, Brain, Star, Lock, Shield, Target,
  BookOpen, List, PenLine, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type Formato  = 'tradicional' | 'narrativa';
type TemaKey  = 'caso' | 'mision' | 'expedicion' | 'desafio' | 'custom';
type RtiNivel = 'universal' | 'dua' | 'pie';

interface Palabra    { palabra: string; definicion: string; ejemplo?: string }
interface VocabItem  { palabra: string; oracion_contexto: string }
interface Pregunta   { numero: number; nivel_cognitivo: string; enunciado: string; tipo_respuesta: string; lineas_respuesta?: number }

interface BloqueBase {
  tipo: string;
  titulo?: string;
  instruccion?: string;
}
interface BloqueBanco      extends BloqueBase { tipo: 'banco_palabras'; palabras: Palabra[] }
interface BloqueVocab      extends BloqueBase { tipo: 'vocabulario'; items: VocabItem[] }
interface BloqueAnalogia   extends BloqueBase { tipo: 'analogia'; enunciado: string; respuesta_modelo?: string }
interface BloquePreguntas  extends BloqueBase { tipo: 'preguntas_comprension'; preguntas: Pregunta[] }
interface BloqueProduccion extends BloqueBase { tipo: 'produccion_escrita'; consigna: string; lineas_respuesta?: number }
interface BloqueSemaforo   extends BloqueBase { tipo: 'autoevaluacion_semaforo'; items: string[] }

type Bloque = BloqueBanco | BloqueVocab | BloqueAnalogia | BloquePreguntas | BloqueProduccion | BloqueSemaforo;

interface Pista {
  numero: number;
  titulo_pista: string;
  tipo_contenido: string;
  contenido: Record<string, unknown>;
  lineas_respuesta?: number;
}

interface Encabezado { numero: string; subtitulo: string }
interface SemaforoAuto { titulo?: string; items: string[] }

interface GuiaContenido {
  titulo?: string;
  nivel?: string;
  eje?: string;
  oa_code?: string;
  formato: Formato;
  tema_narrativo?: string;
  rti_nivel?: RtiNivel;
  instrucciones_docente?: string;
  // Tradicional
  bloques?: Bloque[];
  // Narrativa
  encabezado?: Encabezado;
  contexto?: string;
  pistas?: Pista[];
  veredicto?: string;
  autoevaluacion_semaforo?: SemaforoAuto;
}

interface GuiaRecord {
  id: string;
  titulo: string | null;
  nivel: string;
  eje: string | null;
  oa_codes: string[];
  formato: Formato;
  tema_narrativo: string | null;
  rti_nivel: RtiNivel;
  contenido_json: any;
  created_at: string;
}

// ─── Theme config ─────────────────────────────────────────────────────────────

const TEMA_CFG: Record<string, {
  label: string; Icon: React.ComponentType<{className?: string}>;
  bg: string; border: string; text: string; headerBg: string;
  pistaIcons: React.ComponentType<{className?: string}>[];
  wordHex: string; pdfR: number; pdfG: number; pdfB: number;
  pdfDarkBg: [number,number,number];
}> = {
  caso:       { label:'Caso a resolver',      Icon:Search,  bg:'bg-amber-50',  border:'border-amber-500/30',  text:'text-amber-300',  headerBg:'bg-amber-500/15',  pistaIcons:[Lightbulb,Eye,Brain,Search,Star],  wordHex:'F59E0B', pdfR:245,pdfG:158,pdfB:11,  pdfDarkBg:[50,28,0] },
  mision:     { label:'Misión de exploración',Icon:Compass, bg:'bg-teal-500/10',   border:'border-teal-500/30',   text:'text-teal-300',   headerBg:'bg-teal-500/15',   pistaIcons:[Compass,Eye,Brain,Target,Shield], wordHex:'14B8A6', pdfR:20, pdfG:184,pdfB:166,pdfDarkBg:[0,45,40]  },
  expedicion: { label:'Expedición',           Icon:Map,     bg:'bg-indigo-50', border:'border-indigo-500/30', text:'text-indigo-300', headerBg:'bg-indigo-500/15', pistaIcons:[Map,Eye,Brain,BookOpen,Star],     wordHex:'6366F1', pdfR:99, pdfG:102,pdfB:241,pdfDarkBg:[20,20,70] },
  desafio:    { label:'Desafío secreto',      Icon:KeyRound,bg:'bg-rose-50',   border:'border-rose-500/30',   text:'text-rose-300',   headerBg:'bg-rose-500/15',   pistaIcons:[Lock,Shield,Brain,Star,Target],  wordHex:'F43F5E', pdfR:244,pdfG:63, pdfB:94, pdfDarkBg:[60,0,25]  },
  custom:     { label:'Personalizado',        Icon:Pencil,  bg:'bg-slate-700/20',  border:'border-slate-600/40',  text:'text-slate-700',  headerBg:'bg-slate-700/30',  pistaIcons:[Lightbulb,Eye,Brain,Star,Target],wordHex:'64748B', pdfR:100,pdfG:116,pdfB:139,pdfDarkBg:[25,30,35] },
};

const RTI_BADGE: Record<RtiNivel, string> = {
  universal: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700',
  dua:       'bg-violet-500/10 border-violet-500/20 text-violet-700',
  pie:       'bg-violet-500/10 border-violet-500/20 text-violet-700',
};
const RTI_LABEL: Record<RtiNivel, string> = {
  universal: 'Guía Universal',
  dua:       'Adaptación DUA',
  pie:       'Adaptación DUA',
};

const COGNITIVO_COLOR: Record<string, string> = {
  literal:    'text-sky-600',
  inferencial:'text-violet-400',
  critico:    'text-rose-600',
};

// ─── Block renderers (on-screen) ──────────────────────────────────────────────

function BancoWords({ bloque }: { bloque: BloqueBanco }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {bloque.palabras.map((p, i) => (
        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0]/70/40">
          <p className="text-xs font-bold text-emerald-600">{p.palabra}</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{p.definicion}</p>
          {p.ejemplo && <p className="text-[10px] text-slate-600 italic mt-1">Ej: {p.ejemplo}</p>}
        </div>
      ))}
    </div>
  );
}

function VocabList({ bloque }: { bloque: BloqueVocab }) {
  return (
    <div className="space-y-2">
      {bloque.items.map((it, i) => (
        <div key={i} className="flex items-start gap-3 text-xs p-2.5 bg-slate-800/30 rounded-lg">
          <span className="font-bold text-emerald-600 shrink-0">{it.palabra}:</span>
          <span className="text-slate-700 leading-relaxed">{it.oracion_contexto}</span>
        </div>
      ))}
    </div>
  );
}

function Analogia({ bloque }: { bloque: BloqueAnalogia }) {
  return (
    <div className="p-4 bg-slate-800/30 rounded-xl border border-[#E2E8F0]/70/30">
      <p className="text-sm text-slate-800 font-medium">{bloque.enunciado}</p>
      <div className="mt-3 h-px border-b border-dashed border-[#E2E8F0]/70" />
      {bloque.respuesta_modelo && (
        <p className="text-[10px] text-slate-600 italic mt-2">Respuesta modelo: {bloque.respuesta_modelo}</p>
      )}
    </div>
  );
}

function PreguntasList({ bloque }: { bloque: BloquePreguntas }) {
  return (
    <div className="space-y-3">
      {bloque.preguntas.map((p) => (
        <div key={p.numero} className="space-y-1.5">
          <div className="flex items-start gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${COGNITIVO_COLOR[p.nivel_cognitivo] ?? 'text-slate-600'}`}>
              {p.nivel_cognitivo}
            </span>
            <p className="text-sm text-slate-800 leading-relaxed">{p.numero}. {p.enunciado}</p>
          </div>
          <div className="space-y-1 ml-14">
            {[...Array(p.lineas_respuesta ?? 3)].map((_, i) => (
              <div key={i} className="h-px border-b border-dashed border-[#E2E8F0]/70" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProduccionBloque({ bloque }: { bloque: BloqueProduccion }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-800 leading-relaxed">{bloque.consigna}</p>
      <div className="space-y-1.5 mt-2">
        {[...Array(bloque.lineas_respuesta ?? 6)].map((_, i) => (
          <div key={i} className="h-px border-b border-dashed border-[#E2E8F0]/70" />
        ))}
      </div>
    </div>
  );
}

function SemaforoSection({ data }: { data: SemaforoAuto }) {
  const dots = [
    { label: 'Lo logré', color: 'bg-emerald-500' },
    { label: 'Casi lo logro', color: 'bg-amber-400' },
    { label: 'Necesito ayuda', color: 'bg-rose-500' },
  ];
  return (
    <div className="space-y-3">
      {data.titulo && <p className="text-xs text-slate-600 italic">{data.titulo}</p>}
      {data.items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/30 rounded-xl">
          <div className="flex gap-1 shrink-0">
            {dots.map((d, j) => (
              <div key={j} className={`w-4 h-4 rounded-full border-2 border-[#E2E8F0]/70 ${i === 0 ? d.color + '/20' : ''}`} />
            ))}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{item}</p>
        </div>
      ))}
      <div className="flex gap-3 mt-2 justify-end">
        {dots.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-[10px] text-slate-600">
            <div className={`w-3 h-3 rounded-full ${d.color}`} /> {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderBloque(bloque: Bloque) {
  switch (bloque.tipo) {
    case 'banco_palabras': return <BancoWords bloque={bloque} />;
    case 'vocabulario':    return <VocabList  bloque={bloque} />;
    case 'analogia':       return <Analogia   bloque={bloque} />;
    case 'preguntas_comprension': return <PreguntasList bloque={bloque} />;
    case 'produccion_escrita':    return <ProduccionBloque bloque={bloque} />;
    case 'autoevaluacion_semaforo': return <SemaforoSection data={bloque as BloqueSemaforo} />;
    default: return null;
  }
}

function renderPistaContent(tipo: string, contenido: Record<string, unknown>): React.ReactNode {
  const c = contenido as any;
  switch (tipo) {
    case 'banco_palabras': return <BancoWords bloque={{ tipo: 'banco_palabras', ...c }} />;
    case 'vocabulario':    return <VocabList  bloque={{ tipo: 'vocabulario', ...c }} />;
    case 'analogia':       return <Analogia   bloque={{ tipo: 'analogia', ...c }} />;
    case 'preguntas_comprension': return <PreguntasList bloque={{ tipo: 'preguntas_comprension', ...c }} />;
    case 'produccion_escrita':    return <ProduccionBloque bloque={{ tipo: 'produccion_escrita', ...c }} />;
    default: return <p className="text-xs text-slate-600">{JSON.stringify(contenido)}</p>;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuiaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading]     = useState(true);
  const [guia, setGuia]           = useState<GuiaRecord | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportingPdf,  setExportingPdf]  = useState<null | 'color' | 'ahorro'>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      const { data, error: dbErr } = await supabase
        .from('guias').select('*').eq('id', id).eq('user_id', user.id).single();
      if (dbErr || !data) { setError('No se encontró la guía o no tienes acceso.'); }
      else { setGuia(data as GuiaRecord); }
      setLoading(false);
    });
  }, [id, router]);

  // ── Tema ─────────────────────────────────────────────────────────────────
  const getTema = () => {
    const key = guia?.contenido_json.tema_narrativo ?? guia?.tema_narrativo ?? 'custom';
    return TEMA_CFG[key] ?? TEMA_CFG.custom;
  };

  // ── Export Word ──────────────────────────────────────────────────────────
  const handleExportWord = useCallback(async () => {
    if (!guia) return;
    setExportingWord(true);
    try {
      let cj = guia.contenido_json || {};
      if (typeof cj === 'string') {
        try { cj = JSON.parse(cj); } catch (e) { cj = {}; }
      }
      const children: any[] = [];

      const p = (text: string, bold = false, size = 11, color = '000000', before = 0, after = 6) => {
        return new Paragraph({
          children: [new TextRun({ text, bold, size: size * 2, color })],
          spacing: { before, after }
        });
      };

      const dottedLines = (count = 3) => {
        const arr = [];
        for (let i = 0; i < count; i++) {
          arr.push(new Paragraph({ text: "_________________________________________________________", spacing: { after: 120 } }));
        }
        return arr;
      };

      if (!cj.universal && cj.desafios) {
        // --- NEW UNIFIED FLAT LAYOUT ---
        // Header
        children.push(p("C.E.P. Rigoberto Fontt Izquierdo / Unidad Técnica Pedagógica", true, 10, '475569', 0, 12));
        children.push(p(cj.titulo || "Guía de Trabajo", true, 18, '059669', 0, 12));
        children.push(p(`Curso: ${guia.nivel || 'Lengua y Literatura'} | OA: ${guia.oa_codes?.join(', ') || 'OA 2'} | Objetivo: ${cj.objetivo_clase || ''}`, true, 10, '475569', 0, 12));
        children.push(p("Estudiante: _____________________________________   Fecha: ___________", false, 10, '1e293b', 120, 120));

        // Activation
        if (cj.activacion) {
          children.push(p("I. Activación de Aprendizajes Previos", true, 13, '059669', 180, 6));
          children.push(p(cj.activacion, false, 11, '334155'));
          children.push(...dottedLines(3));
        }

        // Reading Text
        if (cj.texto_lectura) {
          children.push(p(`II. Lectura: ${cj.texto_lectura.titulo}`, true, 13, '059669', 180, 6));
          children.push(p(`Autor: ${cj.texto_lectura.autor || 'Anónimo'}  |  Tipo: ${cj.texto_lectura.tipo || 'Lectura'}`, true, 9.5, '64748b'));
          children.push(p(cj.texto_lectura.contenido, false, 11, '1e293b', 120, 120));
        }

        // Word Bank
        if (cj.banco_palabras && cj.banco_palabras.length > 0) {
          children.push(p(`Palabras clave: ${cj.banco_palabras.join(', ')}`, true, 10, '059669', 120, 120));
        }

        // Challenges
        if (cj.desafios && cj.desafios.length > 0) {
          children.push(p("III. Desafíos Didácticos y de Aplicación", true, 13, '059669', 180, 12));
          cj.desafios.forEach((d: any, idx: number) => {
            children.push(p(`${idx + 1}. Desafío: ${d.tipo?.replace(/_/g, ' ')}`, true, 11, '059669', 120, 6));
            if (d.instruccion) {
              children.push(p(d.instruccion, false, 10, '64748b'));
            }

            // Challenge specific formatting
            if (d.tipo === 'palabra_intrusa' && d.items) {
              d.items.forEach((item: any, iIdx: number) => {
                const wordsStr = item.grupo?.join('  |  ') || '';
                children.push(p(`   ${iIdx + 1}) [ ${wordsStr} ]`, false, 10.5, '1e293b'));
              });
            } else if (d.tipo === 'unir_parejas' && d.pares) {
              d.pares.forEach((pair: any, pIdx: number) => {
                children.push(p(`   ${pIdx + 1}. ${pair.izquierda}   (     )   ${pair.derecha}`, false, 10.5, '1e293b'));
              });
            } else if (d.tipo === 'completar_oraciones' && d.oraciones) {
              d.oraciones.forEach((o: any, oIdx: number) => {
                children.push(p(`   ${oIdx + 1}) ${o.texto.replace(/___/g, '________________')}`, false, 10.5, '1e293b'));
              });
            } else if (d.tipo === 'ordenar_parrafos' && d.fragmentos) {
              d.fragmentos.forEach((frag: string, fIdx: number) => {
                children.push(p(`   [   ] ${frag}`, false, 10.5, '1e293b'));
              });
            } else if (d.tipo === 'verdadero_falso' && d.items) {
              d.items.forEach((it: any, iIdx: number) => {
                children.push(p(`   [ V ] [ F ]  ${iIdx + 1}. ${it.afirmacion}`, false, 10.5, '1e293b'));
              });
            } else if (d.tipo === 'anagramas' && d.items) {
              d.items.forEach((it: any, iIdx: number) => {
                children.push(p(`   ${iIdx + 1}) ${it.desordenada.toUpperCase()}  ->  ____________________`, false, 10.5, '1e293b'));
              });
            } else if (d.tipo === 'clasificacion' && d.items) {
              const terms = d.items.map((it: any) => it.texto).join(', ');
              children.push(p(`   Categorías: ${d.categorias?.join('  /  ') || ''}`, true, 10.5, '475569'));
              children.push(p(`   Términos a clasificar: ${terms}`, false, 10, '1e293b'));
              children.push(...dottedLines(4));
            } else {
              children.push(...dottedLines(3));
            }
          });
        }

        // Ticket
        if (cj.ticket_salida) {
          children.push(p("IV. Ticket de Salida", true, 13, '059669', 180, 6));
          children.push(p(cj.ticket_salida, false, 11, '334155'));
          children.push(...dottedLines(2));
        }

        // Autoevaluacion
        if (cj.autoevaluacion && cj.autoevaluacion.length > 0) {
          children.push(p("V. Autoevaluación", true, 13, '059669', 180, 6));
          cj.autoevaluacion.forEach((ae: string) => {
            children.push(p(`[ ] Logrado  [ ] En Proceso  [ ] Por Lograr   ·   ${ae}`, false, 10, '334155'));
          });
        }

        // Pauta Docente
        children.push(new Paragraph({ text: "", pageBreakBefore: true }));
        children.push(p("PAUTA DE CORRECCIÓN DOCENTE - CONFIDENCIAL", true, 16, 'e11d48', 0, 12));
        if (cj.pauta_docente && cj.pauta_docente.respuestas_desafios) {
          cj.pauta_docente.respuestas_desafios.forEach((ans: any, aIdx: number) => {
            const d = cj.desafios?.[aIdx];
            const formatted = formatChallengeAnswer(d, ans);
            children.push(p(`Desafío ${aIdx + 1}: ${formatted}`, true, 11, '1e293b'));
          });
        }
      } else if (cj.universal) {
        // Title
        children.push(p(cj.titulo || "Guía de Aprendizaje", true, 18, '059669', 0, 12));
        children.push(p(`Curso: ${guia.nivel || 'Lengua y Literatura'} | Eje: ${cj.eje || 'Lectura'} | OA: ${cj.oa_code || ''}`, true, 10, '475569', 0, 12));
        if (cj.instrucciones_docente) {
          children.push(p(`Orientación Docente: ${cj.instrucciones_docente}`, false, 9, '64748b', 0, 12));
        }

        children.push(p("Estudiante: _____________________________________   Fecha: ___________", false, 10, '1e293b', 120, 120));

        const uni = cj.universal;

        // Activación
        if (uni.activacion) {
          children.push(p(uni.activacion.titulo || "1. Activación de Aprendizajes", true, 13, '059669', 180, 6));
          if (uni.activacion.texto) children.push(p(uni.activacion.texto, false, 11, '334155'));
          if (uni.activacion.pregunta) children.push(p(uni.activacion.pregunta, true, 11, '1e293b'));
          children.push(...dottedLines(uni.activacion.lineas_respuesta || 3));
        }

        // Desarrollo
        if (uni.desarrollo) {
          children.push(p(uni.desarrollo.titulo || "2. Lectura y Desarrollo", true, 13, '059669', 180, 6));
          if (uni.desarrollo.texto_principal) children.push(p(uni.desarrollo.texto_principal, false, 11, '334155'));
        }

        // Actividades
        if (uni.actividades) {
          children.push(p(uni.actividades.titulo || "3. Actividades de Comprensión", true, 13, '059669', 180, 6));
          if (uni.actividades.instruccion) children.push(p(uni.actividades.instruccion, false, 10, '475569'));
          
          if (uni.actividades.preguntas) {
            uni.actividades.preguntas.forEach((p: any) => {
              children.push(p(`${p.numero}. ${p.enunciado} (${p.puntaje || 2} pts)`, true, 11, '1e293b'));
              children.push(...dottedLines(p.lineas_respuesta || 3));
            });
          }

          if (uni.actividades.produccion_escrita) {
            const pe = uni.actividades.produccion_escrita;
            children.push(p(pe.titulo || "Actividad de Escritura", true, 12, '059669', 180, 6));
            if (pe.instruccion) children.push(p(pe.instruccion, false, 10, '475569'));
            if (pe.consigna) children.push(p(pe.consigna, false, 11, '1e293b'));
            children.push(...dottedLines(pe.lineas_respuesta || 6));
          }
        }

        // Cierre
        if (uni.cierre) {
          children.push(p(uni.cierre.titulo || "4. Cierre y Autoevaluación", true, 13, '059669', 180, 6));
          if (uni.cierre.ticket_salida) {
            children.push(p(`Ticket de Salida: ${uni.cierre.ticket_salida.pregunta}`, true, 11, '1e293b'));
            children.push(...dottedLines(uni.cierre.ticket_salida.lineas_respuesta || 2));
          }
          if (uni.cierre.metacognicion) {
            children.push(p("Metacognición:", true, 10, '059669'));
            uni.cierre.metacognicion.forEach((m: string) => {
              children.push(p(`• ${m}`, false, 11, '334155'));
            });
          }
          if (uni.cierre.autoevaluacion) {
            children.push(p("Autoevaluación:", true, 10, '059669'));
            uni.cierre.autoevaluacion.forEach((ae: string) => {
              children.push(p(`[ ] Logrado  [ ] En Proceso  [ ] Por Lograr  ·  ${ae}`, false, 10, '334155'));
            });
          }
        }

        // DUA
        if (cj.dua) {
          children.push(new Paragraph({ text: "", pageBreakBefore: true }));
          children.push(p(`Adaptación DUA: ${cj.titulo || "Guía de Aprendizaje"}`, true, 18, '7c3aed', 0, 12));
          children.push(p(`Curso: ${guia.nivel || 'Lengua y Literatura'} | Eje: ${cj.eje || 'Lectura'} | Diversificado`, true, 10, '475569', 0, 12));
          children.push(p("Estudiante: _____________________________________   Fecha: ___________", false, 10, '1e293b', 120, 120));

          const dua = cj.dua;
          if (dua.vocabulario_apoyo && dua.vocabulario_apoyo.length > 0) {
            children.push(p("Vocabulario de Apoyo", true, 12, '7c3aed', 120, 6));
            dua.vocabulario_apoyo.forEach((w: any) => {
              children.push(p(`• ${w.palabra}: ${w.definicion}`, false, 10.5, '1e293b'));
            });
          }

          if (dua.activacion) {
            children.push(p(dua.activacion.titulo || "1. Activación Adaptada", true, 13, '7c3aed', 180, 6));
            if (dua.activacion.texto_simplificado) children.push(p(dua.activacion.texto_simplificado, false, 11, '334155'));
            if (dua.activacion.pregunta_andamiada) children.push(p(dua.activacion.pregunta_andamiada, true, 11, '1e293b'));
            children.push(...dottedLines(dua.activacion.lineas_respuesta || 3));
          }

          if (dua.desarrollo) {
            children.push(p(dua.desarrollo.titulo || "2. Desarrollo Adaptado", true, 13, '7c3aed', 180, 6));
            if (dua.desarrollo.texto_principal) children.push(p(dua.desarrollo.texto_principal, false, 11, '334155'));
          }

          if (dua.actividades) {
            children.push(p(dua.actividades.titulo || "3. Actividades Adaptadas", true, 13, '7c3aed', 180, 6));
            if (dua.actividades.preguntas) {
              dua.actividades.preguntas.forEach((pq: any) => {
                children.push(p(`${pq.numero}. ${pq.enunciado}`, true, 11, '1e293b'));
                if (pq.opciones_alternativas) {
                  pq.opciones_alternativas.forEach((opt: string) => {
                    children.push(p(`   [ ] ${opt}`, false, 10.5, '334155'));
                  });
                }
                children.push(...dottedLines(pq.lineas_respuesta || 2));
              });
            }
          }

          if (dua.cierre) {
            children.push(p(dua.cierre.titulo || "4. Cierre Adaptado", true, 13, '7c3aed', 180, 6));
            if (dua.cierre.ticket_salida) {
              children.push(p(`Ticket de Salida: ${dua.cierre.ticket_salida.pregunta_andamiada}`, true, 11, '1e293b'));
              children.push(...dottedLines(dua.cierre.ticket_salida.lineas_respuesta || 2));
            }
          }
        }

        // Pauta Docente
        children.push(new Paragraph({ text: "", pageBreakBefore: true }));
        children.push(p("PAUTA DE CORRECCIÓN DOCENTE", true, 16, 'e11d48', 0, 12));
      } else {
        // Fallback for old schema
        children.push(p(guia.titulo || 'Guía de Trabajo', true, 18, '10B981'));
        if (cj.contexto) children.push(p(`Contexto: ${cj.contexto}`));
        const bloques = cj.bloques || [];
        bloques.forEach((b: any, idx: number) => {
          children.push(p(`${idx + 1}. ${b.titulo || b.tipo}`, true, 12, '10B981', 120, 6));
          if (b.instruccion) children.push(p(b.instruccion, false, 10, '64748b'));
          if (b.contenido) children.push(p(b.contenido, false, 11, '1e293b'));
        });
      }

      const doc = new Document({
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${guia.titulo || 'guia'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('Word export error:', err); }
    finally { setExportingWord(false); }
  }, [guia]);

  // ── Export PDF ───────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async (mode: 'color' | 'ahorro') => {
    if (!guia) return;
    setExportingPdf(mode);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let cj = guia.contenido_json || {};
      if (typeof cj === 'string') {
        try { cj = JSON.parse(cj); } catch (e) { cj = {}; }
      }
      
      // Call unified drawing function
      drawGuidePdf(doc, cj, mode, guia, 'Docente');

      doc.save(`${guia.titulo || 'guia-aprendizaje'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExportingPdf(null);
    }
  }, [guia]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium font-sans">Cargando guía de aprendizaje...</p>
      </div>
    );
  }

  if (error || !guia) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h3 className="font-bold text-slate-800 font-sans">Error</h3>
        <p className="text-sm text-slate-500 max-w-sm font-sans">{error || 'No se pudo cargar la guía'}</p>
        <Link href="/guias" className="mt-2 px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-700 transition-all font-sans">
          Volver a Guías
        </Link>
      </div>
    );
  }

  let cj = guia.contenido_json || {};
  if (typeof cj === 'string') {
    try {
      cj = JSON.parse(cj);
    } catch (e) {
      cj = {};
    }
  }
  const isNewFlatFormat = !!(cj.desafios || cj.texto_lectura || cj.banco_palabras);
  const isNarrativa = guia.formato === 'narrativa';
  const tema = getTema();
  const TemaIcon = tema.Icon;

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col">
      <div className={`fixed top-0 right-0 w-[35%] h-[35%] rounded-full blur-[120px] pointer-events-none opacity-60 ${
        isNarrativa ? tema.bg : 'bg-emerald-900/8'
      }`} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9FC]/80 backdrop-blur-md border-b border-[#E2E8F0]/60 px-4 py-3 flex items-center gap-3">
        <Link href="/guias" className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-[#E2E8F0]/70 transition-all text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className={`p-1.5 rounded-lg border shrink-0 ${isNarrativa ? `${tema.bg} ${tema.border}` : 'bg-emerald-600/10 border-emerald-100'}`}>
          {isNarrativa ? <TemaIcon className={`w-4 h-4 ${tema.text}`} /> : <Layers className="w-4 h-4 text-emerald-600" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 truncate">{guia.titulo ?? 'Guía de Trabajo'}</p>
          <p className="text-[10px] text-slate-600">{guia.nivel} · {RTI_LABEL[guia.rti_nivel]}</p>
        </div>
        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => handleExportPdf('ahorro')} disabled={!!exportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-[#E2E8F0]/70 text-slate-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap">
            {exportingPdf === 'ahorro' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            PDF Tinta
          </button>
          <button onClick={() => handleExportPdf('color')} disabled={!!exportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-[#E2E8F0]/70 text-slate-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50">
            {exportingPdf === 'color' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            PDF
          </button>
          <button onClick={handleExportWord} disabled={exportingWord}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/50 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50">
            {exportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Word
          </button>
        </div>
      </header>

      <main className="flex-grow p-6 bg-[#FAF9FC] overflow-y-auto">
        <div className="bg-white border border-[#E2E8F0]/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-8 max-w-2xl mx-auto font-sans text-slate-800">
          
          {/* Meta strip */}
          <div className="flex flex-wrap gap-2 items-center text-[10px]">
            <span className={`px-2 py-0.5 rounded-lg border font-semibold ${RTI_BADGE[guia.rti_nivel]}`}>
              {RTI_LABEL[guia.rti_nivel]}
            </span>
            <span className="text-slate-500">{guia.nivel}  ·  Lenguaje y Comunicación</span>
            {guia.eje && <span className="text-slate-500">{guia.eje}</span>}
            {guia.oa_codes?.map((oa) => (
              <span key={oa} className="text-rose-600 font-semibold">{oa}</span>
            ))}
          </div>

          {/* Instrucciones docente */}
          {cj.instrucciones_docente && (
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nota para el docente</p>
              <p className="text-xs text-slate-650 italic leading-relaxed">{cj.instrucciones_docente}</p>
            </div>
          )}

          {(!cj.universal && !isNewFlatFormat) ? (
            // ── FALLBACK FOR OLD FORMAT ─────────────────────────
            <div className="space-y-6">
              {/* Context */}
              {cj.contexto && (
                <div className="bg-slate-50 border-l-4 border-emerald-500 p-3 rounded-r-lg space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 font-sans">
                    Contextualización de la Actividad
                  </p>
                  <p className="text-[11px] text-slate-650 leading-relaxed italic">
                    {cj.contexto}
                  </p>
                </div>
              )}

              {/* Activities content */}
              <div className="space-y-4 pt-2">
                {(cj.bloques || []).map((b: any, bIdx: number) => (
                  <div key={bIdx} className="space-y-2 font-sans border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-4.5 h-4.5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold font-sans">
                        {bIdx + 1}
                      </span>
                      <h4 className="text-[11px] font-bold text-slate-700 font-sans uppercase tracking-wide">
                        {b.titulo || b.tipo}
                      </h4>
                    </div>
                    {b.instruccion && (
                      <p className="text-[9px] text-slate-400 italic font-sans leading-none pl-6">
                        {b.instruccion}
                      </p>
                    )}
                    <div className="pl-6 pt-1 text-[11px] leading-relaxed text-slate-650">
                      {b.contenido && <p className="whitespace-pre-line">{b.contenido}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (!cj.universal && isNewFlatFormat) ? (
            // ── NEW UNIFIED FLAT LAYOUT ───────────────────────────
            <div className="space-y-8 font-sans text-slate-800">
              {/* INSTITUTIONAL HEADER BOX */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-slate-50">
                <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-extrabold text-slate-700">C.E.P. Rigoberto Fontt Izquierdo / Unidad Técnica Pedagógica</span>
                  <span className="text-slate-400 font-mono text-[10px]">Guía de Trabajo</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-2.5 text-[10px] text-slate-500">
                  <div className="p-1">
                    <p className="text-[8px] uppercase tracking-wider text-slate-400">Asignatura</p>
                    <p className="font-bold text-slate-700">Lenguaje y Literatura</p>
                  </div>
                  <div className="p-1">
                    <p className="text-[8px] uppercase tracking-wider text-slate-400">Curso</p>
                    <p className="font-bold text-slate-700">{guia.nivel || 'Lenguaje'}</p>
                  </div>
                  <div className="p-1">
                    <p className="text-[8px] uppercase tracking-wider text-slate-400">Pje. Ideal / Corte</p>
                    <p className="font-bold text-slate-700">30 pts / 18 pts (60%)</p>
                  </div>
                  <div className="p-1">
                    <p className="text-[8px] uppercase tracking-wider text-slate-400">Estudiante</p>
                    <p className="font-medium text-slate-650">______________________</p>
                  </div>
                </div>
              </div>

              {/* Title & Objective */}
              <div className="space-y-2 text-center">
                <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase underline decoration-emerald-500 decoration-2 underline-offset-4">
                  {cj.titulo || "Guía de Aprendizaje"}
                </h1>
                {cj.objetivo_clase && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-650 max-w-lg mx-auto leading-relaxed text-left">
                    <strong>Objetivo:</strong> {cj.objetivo_clase}
                  </div>
                )}
              </div>

              {/* 1. TEXTO DE LECTURA COMPLETO */}
              {cj.texto_lectura && (
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    I. Texto de Lectura: {cj.texto_lectura.titulo || 'Lectura Principal'}
                  </h3>
                  {cj.texto_lectura.autor && (
                    <p className="text-[10px] text-slate-400 italic">Autor: {cj.texto_lectura.autor}</p>
                  )}
                  <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 font-serif text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-3xs">
                    {cj.texto_lectura.contenido || cj.texto_lectura.texto_principal || ''}
                    {cj.texto_lectura.imagen_url && (
                      <div className="my-4 border border-slate-200 rounded-2xl overflow-hidden max-w-md mx-auto bg-white p-2">
                        <img src={cj.texto_lectura.imagen_url} alt="Ilustración" className="w-full h-auto object-contain rounded-lg max-h-[250px] mx-auto" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. VOCABULARIO CLAVE */}
              {((cj.banco_palabras && cj.banco_palabras.length > 0) || (cj.vocabulario && cj.vocabulario.length > 0)) && (
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    II. Vocabulario Clave
                  </h3>
                  <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl font-mono text-xs text-emerald-700 leading-relaxed">
                    {(() => {
                      const vocab = cj.banco_palabras || cj.vocabulario;
                      return Array.isArray(vocab) ? vocab.join(' · ') : String(vocab || '');
                    })()}
                  </div>
                </div>
              )}

              {/* 3. DESAFÍOS CON CONTENIDO (INSTRUCCIÓN + ÍTEMS) */}
              {cj.desafios && Array.isArray(cj.desafios) && cj.desafios.length > 0 && (
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    III. Desafíos Didácticos
                  </h3>
                  <div className="space-y-6">
                    {(() => {
                      let renderIdx = 0;
                      return cj.desafios.map((d: any, idx: number) => {
                        if (!d || !d.tipo || d.tipo === '') return null;
                        renderIdx++;
                        const tipo = d.tipo;
                        return (
                          <div key={idx} className="p-4 bg-white border border-slate-200/70 rounded-2xl shadow-4xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                Desafío {renderIdx}: {tipo.replace(/_/g, ' ')}
                              </h4>
                            </div>
                          {d.instruccion && (
                            <p className="text-[11px] text-slate-500 italic leading-relaxed">{d.instruccion}</p>
                          )}

                          {/* Renderizado Seguro de Ítems */}
                          {tipo === 'palabra_intrusa' && d.items && (
                            <div className="space-y-2">
                              {d.items.map((item: any, iIdx: number) => (
                                <div key={iIdx} className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="font-bold text-slate-400">{iIdx + 1}.</span>
                                  {Array.isArray(item.grupo) && item.grupo.map((w: string, wIdx: number) => (
                                    <span key={wIdx} className="px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white transition-all text-slate-700 font-medium">{w}</span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                          {tipo === 'unir_parejas' && d.pares && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                {d.pares.map((p: any, pIdx: number) => (
                                  <div key={pIdx} className="p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold">{pIdx + 1}. {p.izquierda || ''}</div>
                                ))}
                              </div>
                              <div className="space-y-2">
                                {d.pares.map((p: any, pIdx: number) => (
                                  <div key={pIdx} className="p-2 border border-slate-200 rounded-lg bg-white flex items-center gap-2">
                                    <span className="w-8 h-6 border border-dashed border-slate-300 rounded flex items-center justify-center font-bold text-slate-400 shrink-0">(   )</span>
                                    <span>{p.derecha || ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {tipo === 'completar_oraciones' && d.oraciones && (
                            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                              {d.oraciones.map((o: any, oIdx: number) => (
                                <p key={oIdx}>
                                  <span className="font-bold text-slate-400">{oIdx + 1}.</span> {String(o.texto || '').replace(/___/g, "________________")}
                                </p>
                              ))}
                            </div>
                          )}

                          {tipo === 'ordenar_parrafos' && d.fragmentos && (
                            <div className="space-y-3">
                              {d.fragmentos.map((f: string, fIdx: number) => (
                                <div key={fIdx} className="flex gap-3 items-start p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                                  <span className="w-8 h-8 border border-slate-300 rounded-lg bg-white flex items-center justify-center font-bold text-slate-400 shrink-0">[  ]</span>
                                  <p className="leading-relaxed">{f}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {tipo === 'verdadero_falso' && d.items && (
                            <div className="space-y-2 text-xs">
                              {d.items.map((it: any, iIdx: number) => (
                                <div key={iIdx} className="flex items-center gap-3">
                                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-400">[ V ]  [ F ]</span>
                                  <span>{iIdx + 1}. {it.afirmacion || ''}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {tipo === 'pupiletras' && (
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                              {(() => {
                                let gridRaw = d.grid || d.sopa_de_letras || d.sopa || [];
                                let grid: string[][] = [];
                                if (typeof gridRaw === 'string') {
                                  const COLUMNAS = 15;
                                  const letras = gridRaw.replace(/\s/g, '').toUpperCase().split('');
                                  const filas: string[][] = [];
                                  for (let i = 0; i < letras.length; i += COLUMNAS) {
                                    filas.push(letras.slice(i, i + COLUMNAS));
                                  }
                                  grid = filas;
                                } else if (Array.isArray(gridRaw) && gridRaw.length > 0) {
                                  if (typeof gridRaw[0] === 'string') {
                                    grid = gridRaw.map((row: string) => row.toUpperCase().split(''));
                                  } else {
                                    grid = gridRaw;
                                  }
                                }

                                if (grid.length === 0) return null;

                                return (
                                  <div 
                                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[13px] font-bold text-slate-700 mx-auto sm:mx-0 shrink-0 bg-white" 
                                    style={{ fontFamily: 'monospace', letterSpacing: '0.5em', lineHeight: '1.8', whiteSpace: 'nowrap' }}
                                  >
                                    {grid.map((fila, i) => (
                                      <div key={i}>{fila.join(' ')}</div>
                                    ))}
                                  </div>
                                );
                              })()}
                              <div className="text-xs space-y-2 w-full">
                                <p className="font-bold text-slate-650">Palabras a buscar:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {Array.isArray(d.palabras) && d.palabras.map((w: string) => (
                                    <span key={w} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-medium">{w}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {tipo === 'anagramas' && d.items && (
                            <div className="space-y-2 text-xs">
                              {d.items.map((it: any, iIdx: number) => (
                                <div key={iIdx} className="flex items-center gap-3">
                                  <span className="w-20 font-bold bg-slate-50 p-1.5 rounded text-center border border-slate-200 tracking-wider">{(it.desordenada || '').toUpperCase()}</span>
                                  <span className="text-slate-350">----------------&gt;</span>
                                  <span className="flex-1 border-b border-dashed border-slate-300 h-6" />
                                </div>
                              ))}
                            </div>
                          )}

                          {tipo === 'mensajes_cifrados' && (
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                {d.clave && Object.entries(d.clave).map(([num, letter]) => (
                                  <span key={num} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded">{num}: {String(letter)}</span>
                                ))}
                              </div>
                              {/* Draw each message in a clean way */}
                              {((d.mensajes && Array.isArray(d.mensajes)) ? d.mensajes : [{ codificado: d.mensaje_cifrado || "" }]).map((m: any, mIdx: number) => (
                                <div key={mIdx} className="space-y-2 border-t border-slate-100/50 pt-2 first:border-t-0 first:pt-0">
                                  <p className="text-[10px] font-bold text-slate-400">Mensaje {mIdx + 1}:</p>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    {String(m.codificado || '').split(/\s+/).map((word: string, wIdx: number) => {
                                      if (word === '/') {
                                        return <span key={wIdx} className="mx-2 text-slate-350 font-bold">/</span>;
                                      }
                                      return (
                                        <div key={wIdx} className="flex gap-1.5 items-center">
                                          {word.split("-").map((numChar: string, cIdx: number) => (
                                            <div key={cIdx} className="flex flex-col items-center gap-1 shrink-0">
                                              <span className="font-bold text-[9px] text-slate-500">{numChar}</span>
                                              <div className="w-5.5 h-5.5 border border-slate-200 rounded bg-slate-50" />
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {tipo === 'clasificacion' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                {Array.isArray(d.categorias) && d.categorias.map((cat: string) => (
                                  <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 p-2 border-b border-slate-200 font-bold text-center text-[10px]">{cat}</div>
                                    <div className="p-3 min-h-[80px] bg-white" />
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs space-y-1.5">
                                <p className="font-bold text-slate-500">Términos a clasificar:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {Array.isArray(d.items) && d.items.map((it: any, iIdx: number) => (
                                    <span key={iIdx} className="px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 font-medium">{it.texto || ''}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {tipo === 'camino_pistas' && (
                            <div className="space-y-4">
                              {(() => {
                                const pistas = d.pistas || d.preguntas || d.estaciones || [];
                                return Array.isArray(pistas) && (
                                  <div className="space-y-3 text-xs text-slate-700">
                                    {pistas.map((p: any, pIdx: number) => (
                                      <div key={pIdx} className="p-3 border border-slate-100 rounded-xl bg-slate-50 space-y-2">
                                        <p className="font-bold">Estación {pIdx + 1}: {p.pregunta || p.pista || ''}</p>
                                        <div className="flex items-center gap-3">
                                          <span className="text-slate-400">Respuesta:</span>
                                          <div className="flex-1 border-b border-dashed border-slate-300 h-5" />
                                          <div className="flex items-center gap-1.5 font-bold">
                                            <span>Letra:</span>
                                            <span className="w-8 h-6 border border-dashed border-slate-300 rounded flex items-center justify-center font-bold text-slate-400 shrink-0">[  ]</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="pt-3 border-t border-slate-100 flex items-center gap-3 font-bold text-slate-800">
                                      <span>PALABRA SECRETA:</span>
                                      <div className="flex gap-2">
                                        {pistas.map((_: any, pIdx: number) => (
                                          <span key={pIdx} className="w-6 h-6 border-b-2 border-slate-400 text-center flex items-center justify-center font-mono">_</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {tipo === 'preguntas_inferenciales' && (
                            <div className="space-y-4 text-xs text-slate-700">
                              {(() => {
                                const pregs = d.preguntas || [];
                                return Array.isArray(pregs) && pregs.map((q: any, qIdx: number) => (
                                  <div key={qIdx} className="space-y-2">
                                    <p className="font-bold">{qIdx + 1}. {q.pregunta}</p>
                                    <div className="space-y-2 pl-3">
                                      <div className="border-b border-dashed border-slate-300 h-5 w-full" />
                                      <div className="border-b border-dashed border-slate-300 h-5 w-full" />
                                      <div className="border-b border-dashed border-slate-300 h-5 w-full" />
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    }) })()}
                  </div>
                </div>
              )}

              {/* ACTIVIDAD ADICIONAL */}
              {cj.actividad_adicional && (
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    IV. Actividad Adicional: {cj.actividad_adicional.tipo === 'preguntas_capciosas' ? 'Preguntas Capciosas' : cj.actividad_adicional.tipo}
                  </h3>
                  {cj.actividad_adicional.tipo === 'preguntas_capciosas' && cj.actividad_adicional.preguntas && Array.isArray(cj.actividad_adicional.preguntas) && (
                    <div className="space-y-4">
                      {cj.actividad_adicional.preguntas.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3 text-xs">
                          <p className="font-bold text-slate-800">{qIdx + 1}. {q.pregunta}</p>
                          <div className="space-y-1.5 pl-2 font-medium">
                            {q.opciones && Array.isArray(q.opciones) && q.opciones.map((op: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input type="checkbox" disabled className="w-3.5 h-3.5 rounded border-slate-300 bg-white" />
                                <span className="text-slate-700">{op}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. TICKET DE SALIDA */}
              {cj.ticket_salida && (
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {cj.actividad_adicional ? "V" : "IV"}. Ticket de Salida (RICE)
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 space-y-3">
                    <p className="text-xs font-semibold text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-3xs">{cj.ticket_salida}</p>
                    <div className="space-y-2 pl-2">
                      <div className="h-px border-b border-dashed border-slate-200 my-2" />
                      <div className="h-px border-b border-dashed border-slate-200 my-2" />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. AUTOEVALUACIÓN (SEMÁFORO) */}
              {cj.autoevaluacion && Array.isArray(cj.autoevaluacion) && cj.autoevaluacion.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 pt-5 text-xs">
                  <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    {cj.actividad_adicional ? "VI" : "V"}. Autoevaluación
                  </h3>
                  <div className="space-y-2">
                    {cj.autoevaluacion.map((ae: string, aeIdx: number) => (
                      <div key={aeIdx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl font-medium text-xs">
                        <span className="text-[9px] text-slate-400 font-bold shrink-0 bg-slate-100/50 px-2 py-0.5 rounded-md border border-slate-200/40">[ Logrado ] [ En Proceso ] [ Por Lograr ]</span>
                        <span className="text-slate-700">{ae}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. PAUTA DOCENTE */}
              {cj.pauta_docente && (
                <div className="space-y-4 border-t-2 border-dashed border-slate-200 pt-6 mt-6 font-sans">
                  <h3 className="text-xs font-black text-rose-750 uppercase tracking-wider">
                    PAUTA DE CORRECCIÓN - EXCLUSIVO DOCENTE
                  </h3>
                  
                  {cj.pauta_docente.respuestas_desafios && Array.isArray(cj.pauta_docente.respuestas_desafios) && (
                    <div className="space-y-2.5 text-xs bg-rose-50/20 border border-rose-100 p-4 rounded-xl leading-relaxed">
                      {(() => {
                        let renderIdx = 0;
                        return cj.pauta_docente.respuestas_desafios.map((ans: any, aIdx: number) => {
                          const d = cj.desafios?.[aIdx];
                          const isCapciosa = (d && d.tipo === 'preguntas_capciosas') || (!d && ans && (ans.tipo === 'preguntas_capciosas' || ans.preguntas || (typeof ans === 'object' && JSON.stringify(ans).includes('capciosa'))));
                          if (!d || !d.tipo || d.tipo === '') {
                            if (!isCapciosa) return null;
                          }
                        
                        if (isCapciosa) {
                          if (cj.actividad_adicional) return null;
                          const pregs = ans.preguntas || [];
                          return (
                            <div key={aIdx} className="border-b border-rose-100/30 pb-2 last:border-b-0 last:pb-0">
                              <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">
                                Actividad Adicional (Preguntas Capciosas):
                              </span>
                              <div className="mt-1 space-y-1.5 bg-white p-2.5 rounded border border-rose-100/50 font-mono text-[11px] text-slate-700 leading-relaxed">
                                {Array.isArray(pregs) && pregs.map((q: any, qIdx: number) => (
                                  <div key={qIdx} className="mb-2 last:mb-0 pb-2 border-b border-rose-100/10 last:border-0 last:pb-0">
                                    <strong>Pregunta {qIdx + 1}:</strong> {q.pregunta}<br/>
                                    <strong>Opción Correcta:</strong> {q.respuesta_correcta}<br/>
                                    <strong>Explicación:</strong> {q.trampa}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        renderIdx++;

                        const isInferencial = (d && d.tipo === 'preguntas_inferenciales') || (!d && ans && (ans.tipo === 'preguntas_inferenciales' || (typeof ans === 'object' && JSON.stringify(ans).includes('inferencial'))));
                        
                        if (isInferencial) {
                          const pregs = d?.preguntas || ans?.preguntas || (Array.isArray(ans) ? ans : []);
                          return (
                            <div key={aIdx} className="border-b border-rose-100/30 pb-2 last:border-b-0 last:pb-0">
                              <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">
                                Desafío {renderIdx} (Preguntas Inferenciales - Criterios de Evaluación):
                              </span>
                              <div className="mt-1 space-y-1.5 bg-white p-2.5 rounded border border-rose-100/50 font-mono text-[11px] text-slate-700 leading-relaxed">
                                {Array.isArray(pregs) && pregs.map((q: any, qIdx: number) => {
                                  const questionText = q.pregunta || `Pregunta ${qIdx + 1}`;
                                  const criteriaText = q.criterios_evaluacion || q.criterio || (typeof q === 'object' ? (q.respuesta || JSON.stringify(q)) : String(q));
                                  return (
                                    <div key={qIdx} className="mb-2 last:mb-0 pb-2 border-b border-rose-100/10 last:border-0 last:pb-0">
                                      <strong>Pregunta {qIdx + 1}:</strong> {questionText}<br/>
                                      <strong>Criterio de Evaluación:</strong> {criteriaText}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        const formatted = formatChallengeAnswer(d, ans);
                        return (
                          <div key={aIdx} className="border-b border-rose-100/30 pb-2 last:border-b-0 last:pb-0">
                            <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">
                              Desafío {renderIdx} ({d?.tipo?.replace(/_/g, ' ') || 'Desafío'}):
                            </span>
                            <p className="mt-0.5 text-slate-700 font-mono text-[11px] bg-white p-2 rounded border border-rose-100/50 whitespace-pre-line">{formatted}</p>
                          </div>
                        );
                      }) })()}

                      {cj.actividad_adicional && cj.actividad_adicional.tipo === 'preguntas_capciosas' && (
                        <div className="border-t border-rose-100/50 pt-2.5 mt-2.5">
                          <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">
                            Actividad Adicional (Preguntas Capciosas):
                          </span>
                          <div className="mt-1 space-y-1.5 bg-white p-2.5 rounded border border-rose-100/50 font-mono text-[11px] text-slate-700 leading-relaxed">
                            {cj.actividad_adicional.preguntas && Array.isArray(cj.actividad_adicional.preguntas) && cj.actividad_adicional.preguntas.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="mb-2 last:mb-0 pb-2 border-b border-rose-100/10 last:border-0 last:pb-0">
                                <strong>Pregunta {qIdx + 1}:</strong> {q.pregunta}<br/>
                                <strong>Opción Correcta:</strong> {q.respuesta_correcta}<br/>
                                <strong>Explicación:</strong> {q.trampa}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // ── NEW STRUCTURED LAYOUT ───────────────────────────
            <div className="space-y-8">
              
              {/* I. GUÍA UNIVERSAL */}
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      I. Guía Universal
                    </span>
                    <h3 className="text-sm font-black text-slate-800 mt-1">{cj.titulo || "Guía de Aprendizaje"}</h3>
                  </div>
                  <div className="text-right text-[8px] text-slate-400 font-mono">
                    <p>Curso: {guia.nivel}</p>
                    <p>Eje: {cj.eje || "Lectura"}</p>
                    <p>OA: {cj.oa_code || ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-slate-200 p-2 rounded-lg text-[9px] text-slate-400">
                  <div>Nombre Estudiante: ___________________________</div>
                  <div className="text-right">Fecha: _________  Puntaje: ____ / ____</div>
                </div>

                {/* Activación */}
                {cj.universal.activacion && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                      {cj.universal.activacion.titulo || "1. Activación de Aprendizajes"}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{cj.universal.activacion.texto}</p>
                    <p className="text-[11px] font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{cj.universal.activacion.pregunta}</p>
                    <div className="space-y-1 pl-4 pt-1">
                      {[...Array(cj.universal.activacion.lineas_respuesta || 3)].map((_, i) => (
                        <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Desarrollo */}
                {cj.universal.desarrollo && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                      {cj.universal.desarrollo.titulo || "2. Lectura y Desarrollo"}
                    </h4>
                    <p className="text-[11px] text-slate-700 leading-relaxed bg-[#fbfbfb] p-4 rounded-xl border border-slate-100 font-serif whitespace-pre-line shadow-3xs">
                      {cj.universal.desarrollo.texto_principal}
                    </p>
                    {cj.universal.desarrollo.imagen_url && (
                      <div className="my-4 border border-slate-200 rounded-2xl overflow-hidden max-w-md mx-auto bg-white p-2">
                        <img
                          src={cj.universal.desarrollo.imagen_url}
                          alt="Ilustración de la lectura"
                          className="w-full h-auto object-contain rounded-lg max-h-[300px] mx-auto"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Actividades */}
                {cj.universal.actividades && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                      {cj.universal.actividades.titulo || "3. Actividades de Comprensión"}
                    </h4>
                    <p className="text-[9.5px] text-slate-450 italic pl-1">{cj.universal.actividades.instruccion}</p>
                    
                    {cj.universal.actividades.preguntas?.map((p: any) => (
                      <div key={p.numero} className="space-y-1.5 pl-2">
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 rounded uppercase border border-emerald-100 shrink-0">
                            {p.nivel_cognitivo}
                          </span>
                          <p className="text-[11px] font-bold text-slate-800 leading-tight">
                            {p.numero}. {p.enunciado} <span className="text-slate-400 font-normal">({p.puntaje} pts)</span>
                          </p>
                        </div>
                        <div className="space-y-1 pl-12">
                          {[...Array(p.lineas_respuesta || 3)].map((_, i) => (
                            <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                          ))}
                        </div>
                      </div>
                    ))}

                    {cj.universal.actividades.produccion_escrita && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide pl-2">
                          {cj.universal.actividades.produccion_escrita.titulo || "Actividad de Escritura"}
                        </h5>
                        {cj.universal.actividades.produccion_escrita.instruccion && (
                          <p className="text-[9.5px] text-slate-450 italic pl-2">{cj.universal.actividades.produccion_escrita.instruccion}</p>
                        )}
                        <p className="text-[11px] text-slate-700 pl-2 leading-relaxed font-serif">
                          {cj.universal.actividades.produccion_escrita.consigna}
                        </p>
                        <p className="text-[9px] font-bold text-slate-450 pl-2">Puntaje: {cj.universal.actividades.produccion_escrita.puntaje} puntos.</p>
                        <div className="space-y-1 pl-12">
                          {[...Array(cj.universal.actividades.produccion_escrita.lineas_respuesta || 6)].map((_, i) => (
                            <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cierre */}
                {cj.universal.cierre && (
                  <div className="space-y-4 border-t border-slate-100 pt-3">
                    <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                      {cj.universal.cierre.titulo || "4. Cierre de la Sesión"}
                    </h4>
                    
                    {cj.universal.cierre.ticket_salida && (
                      <div className="space-y-1 pl-2">
                        <p className="text-[11px] font-bold text-slate-800">
                          Ticket de Salida: {cj.universal.cierre.ticket_salida.pregunta}
                        </p>
                        <div className="space-y-1 pl-12">
                          {[...Array(cj.universal.cierre.ticket_salida.lineas_respuesta || 2)].map((_, i) => (
                            <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                          ))}
                        </div>
                      </div>
                    )}

                    {cj.universal.cierre.metacognicion && (
                      <div className="space-y-1 pl-2">
                        <p className="text-[10px] font-bold text-slate-500">Preguntas para reflexionar:</p>
                        {cj.universal.cierre.metacognicion.map((m: string, i: number) => (
                          <p key={i} className="text-[10px] text-slate-650 leading-tight">• {m}</p>
                        ))}
                      </div>
                    )}

                    {cj.universal.cierre.autoevaluacion && (
                      <div className="space-y-1.5 pl-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-500">Autoevaluación (Semáforo):</p>
                        {cj.universal.cierre.autoevaluacion.map((ae: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                            <div className="flex gap-0.5 shrink-0">
                              <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                              <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                              <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                            </div>
                            <span>{ae}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cj.universal.cierre.frase_pnl && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 rounded-xl text-center italic text-violet-750 text-[10.5px] font-semibold">
                        " {cj.universal.cierre.frase_pnl} "
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* II. ADAPTACIÓN DUA (si existe) */}
              {cj.dua && (
                <div className="space-y-6 border-t-2 border-dashed border-violet-200 pt-6">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 tracking-wider uppercase">
                        II. Adaptación DUA
                      </span>
                      <h3 className="text-sm font-black text-slate-800 mt-1">Guía Adaptada DUA</h3>
                    </div>
                    <div className="text-right text-[8px] text-slate-400 font-mono">
                      <p>Apoyo Diversificado</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border border-slate-200 p-2 rounded-lg text-[9px] text-slate-400">
                    <div>Nombre Estudiante: ___________________________</div>
                    <div className="text-right">Fecha: _________  Puntaje: ____ / ____</div>
                  </div>

                  {/* Vocabulario de Apoyo */}
                  {cj.dua.vocabulario_apoyo && cj.dua.vocabulario_apoyo.length > 0 && (
                    <div className="space-y-2 bg-violet-50/20 p-3 rounded-xl border border-violet-100/50">
                      <h5 className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wide">
                        Glosario de Apoyo
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        {cj.dua.vocabulario_apoyo.map((w: any, i: number) => (
                          <div key={i} className="bg-white border border-slate-100 p-2 rounded-lg">
                            <strong>{w.palabra}:</strong> {w.definicion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Activación DUA */}
                  {cj.dua.activacion && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                        {cj.dua.activacion.titulo || "1. Activación de Aprendizajes"}
                      </h4>
                      <p className="text-[11px] text-slate-650 leading-relaxed">{cj.dua.activacion.texto_simplificado}</p>
                      <p className="text-[11px] font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{cj.dua.activacion.pregunta_andamiada}</p>
                      {cj.dua.activacion.pista_ayuda && (
                        <p className="text-[9.5px] text-violet-650 italic pl-1">💡 Ayuda: {cj.dua.activacion.pista_ayuda}</p>
                      )}
                      <div className="space-y-1 pl-4 pt-1">
                        {[...Array(cj.dua.activacion.lineas_respuesta || 2)].map((_, i) => (
                          <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desarrollo DUA */}
                  {cj.dua.desarrollo && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                        {cj.dua.desarrollo.titulo || "2. Lectura con Apoyo"}
                      </h4>
                      <p className="text-[11px] text-slate-750 leading-relaxed bg-[#fbfbfb] p-4 rounded-xl border border-slate-100 font-serif whitespace-pre-line shadow-3xs">
                        {cj.dua.desarrollo.texto_principal}
                      </p>
                      {cj.dua.desarrollo.apoyo_visual_desc && (
                        <div className="border border-dashed border-violet-300 p-2.5 rounded-lg bg-violet-50/10 text-[9.5px] text-slate-600 pl-3">
                          🎨 <strong>Organizador Visual:</strong> {cj.dua.desarrollo.apoyo_visual_desc}
                        </div>
                      )}
                      {cj.dua.desarrollo.imagen_url && (
                        <div className="my-4 border border-slate-200 rounded-2xl overflow-hidden max-w-md mx-auto bg-white p-2">
                          <img
                            src={cj.dua.desarrollo.imagen_url}
                            alt="Ilustración de la lectura (Adaptada)"
                            className="w-full h-auto object-contain rounded-lg max-h-[300px] mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actividades DUA */}
                  {cj.dua.actividades && (
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                        {cj.dua.actividades.titulo || "3. Actividades de Comprensión"}
                      </h4>
                      <p className="text-[9.5px] text-slate-450 italic pl-1">{cj.dua.actividades.instruccion_simplificada}</p>

                      {cj.dua.actividades.preguntas?.map((p: any) => (
                        <div key={p.numero} className="space-y-1.5 pl-2">
                          <div className="flex items-start gap-2">
                            <span className="px-1.5 py-0.5 text-[8px] font-bold text-violet-700 bg-violet-50 rounded uppercase border border-violet-100 shrink-0">
                              {p.nivel_cognitivo}
                            </span>
                            <p className="text-[11px] font-bold text-slate-800 leading-tight">
                              {p.numero}. {p.enunciado} <span className="text-slate-400 font-normal">({p.puntaje} pts)</span>
                            </p>
                          </div>
                          
                          {p.opciones_alternativas && (
                            <div className="pl-12 space-y-1">
                              {p.opciones_alternativas.map((opt: string, i: number) => (
                                <div key={i} className="text-[10px] text-slate-650 flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded-full border border-slate-350 shrink-0"></div>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {p.pista_ayuda && (
                            <p className="text-[9px] text-violet-650 italic pl-12">💡 Pista: {p.pista_ayuda}</p>
                          )}
                          {p.inicio_respuesta && (
                            <p className="text-[9px] text-slate-450 pl-12 font-mono">Respuesta sugerida: "{p.inicio_respuesta}..."</p>
                          )}

                          <div className="space-y-1 pl-12">
                            {[...Array(p.lineas_respuesta || 2)].map((_, i) => (
                              <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                            ))}
                          </div>
                        </div>
                      ))}

                      {cj.dua.actividades.produccion_escrita && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <h5 className="text-[10px] font-bold text-violet-600 uppercase tracking-wide pl-2">
                            {cj.dua.actividades.produccion_escrita.titulo || "Actividad de Expresión Adaptada"}
                          </h5>
                          {cj.dua.actividades.produccion_escrita.instruccion_simplificada && (
                            <p className="text-[9.5px] text-slate-450 italic pl-2">{cj.dua.actividades.produccion_escrita.instruccion_simplificada}</p>
                          )}
                          <p className="text-[11px] text-slate-700 pl-2 leading-relaxed font-serif">
                            {cj.dua.actividades.produccion_escrita.consigna_adaptada}
                          </p>
                          {cj.dua.actividades.produccion_escrita.opciones_expresion && (
                            <div className="pl-2 pr-2 text-[9.5px] font-bold text-violet-700 bg-violet-50 p-2 rounded border border-violet-100/50 leading-relaxed">
                              🎨 {cj.dua.actividades.produccion_escrita.opciones_expresion}
                            </div>
                          )}
                          <p className="text-[9px] font-bold text-slate-450 pl-2">Puntaje: {cj.dua.actividades.produccion_escrita.puntaje} puntos.</p>
                          <div className="space-y-1 pl-12">
                            {[...Array(cj.dua.actividades.produccion_escrita.lineas_respuesta || 4)].map((_, i) => (
                              <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cierre DUA */}
                  {cj.dua.cierre && (
                    <div className="space-y-4 border-t border-slate-100 pt-3">
                      <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                        {cj.dua.cierre.titulo || "4. Cierre y Autoevaluación"}
                      </h4>

                      {cj.dua.cierre.ticket_salida && (
                        <div className="space-y-1 pl-2">
                          <p className="text-[11px] font-bold text-slate-800">
                            Ticket de Salida Adaptado: {cj.dua.cierre.ticket_salida.pregunta_andamiada || cj.dua.cierre.ticket_salida.pregunta}
                          </p>
                          {cj.dua.cierre.ticket_salida.pista_ayuda && (
                            <p className="text-[9px] text-violet-650 italic pl-6">💡 Ayuda: {cj.dua.cierre.ticket_salida.pista_ayuda}</p>
                          )}
                          <div className="space-y-1 pl-12">
                            {[...Array(cj.dua.cierre.ticket_salida.lineas_respuesta || 2)].map((_, i) => (
                              <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                            ))}
                          </div>
                        </div>
                      )}

                      {cj.dua.cierre.metacognicion && (
                        <div className="space-y-1 pl-2">
                          <p className="text-[10px] font-bold text-slate-500">Preguntas para reflexionar:</p>
                          {cj.dua.cierre.metacognicion.map((m: string, i: number) => (
                            <p key={i} className="text-[10px] text-slate-650 leading-tight">• {m}</p>
                          ))}
                        </div>
                      )}

                      {cj.dua.cierre.autoevaluacion && (
                        <div className="space-y-1.5 pl-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                          <p className="text-[10px] font-bold text-slate-500">Autoevaluación (Semáforo):</p>
                          {cj.dua.cierre.autoevaluacion.map((ae: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                              <div className="flex gap-0.5 shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                              </div>
                              <span>{ae}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {(cj.dua.cierre.frase_pnl || cj.universal.cierre.frase_pnl) && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 rounded-xl text-center italic text-violet-750 text-[10.5px] font-semibold">
                          " {cj.dua.cierre.frase_pnl || cj.universal.cierre.frase_pnl} "
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* III. PAUTA DOCENTE */}
              <div className="space-y-6 border-t-2 border-dashed border-rose-200 pt-6 bg-rose-50/15 p-4 rounded-2xl">
                <div className="border-b border-rose-200 pb-2">
                  <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 tracking-wider uppercase">
                    PAUTA DE CORRECCIÓN DOCENTE (Exclusivo Docente)
                  </span>
                  <h3 className="text-sm font-black text-slate-800 mt-1">Respuestas y Criterios</h3>
                </div>

                {/* Pauta Universal */}
                {cj.universal.pauta_docente && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wide">Pauta: Guía Universal</h4>
                    {cj.universal.pauta_docente.respuestas_preguntas?.map((ans: any) => (
                      <div key={ans.numero} className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                        <p className="font-bold text-slate-800">Pregunta {ans.numero}</p>
                        <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {ans.respuesta_correcta}</p>
                        {ans.criterios_evaluacion && <p className="text-slate-500 italic">Criterios: {ans.criterios_evaluacion}</p>}
                      </div>
                    ))}
                    {cj.universal.pauta_docente.respuesta_produccion && (
                      <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                        <p className="font-bold text-slate-800">Actividad de Escritura</p>
                        <p className="text-slate-650"><strong>Respuesta Modelo:</strong> {cj.universal.pauta_docente.respuesta_produccion.respuesta_modelo}</p>
                        {cj.universal.pauta_docente.respuesta_produccion.criterios_evaluacion && (
                          <p className="text-slate-500 italic">Criterios: {cj.universal.pauta_docente.respuesta_produccion.criterios_evaluacion}</p>
                        )}
                      </div>
                    )}
                    {cj.universal.pauta_docente.respuesta_ticket && (
                      <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                        <p className="font-bold text-slate-800">Ticket de Salida</p>
                        <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {cj.universal.pauta_docente.respuesta_ticket.respuesta_correcta}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pauta DUA */}
                {cj.dua && cj.dua.pauta_docente && (
                  <div className="space-y-4 pt-2 border-t border-rose-100">
                    <h4 className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wide">Pauta: Adaptación DUA</h4>
                    {cj.dua.pauta_docente.respuestas_preguntas?.map((ans: any) => (
                      <div key={ans.numero} className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                        <p className="font-bold text-slate-800">Pregunta {ans.numero}</p>
                        <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {ans.respuesta_correcta}</p>
                        {ans.criterios_evaluacion && <p className="text-slate-500 italic">Criterios: {ans.criterios_evaluacion}</p>}
                      </div>
                    ))}
                    {cj.dua.pauta_docente.respuesta_produccion && (
                      <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                        <p className="font-bold text-slate-800">Actividad de Expresión Adaptada</p>
                        <p className="text-slate-650"><strong>Respuesta Modelo:</strong> {cj.dua.pauta_docente.respuesta_produccion.respuesta_modelo}</p>
                        {cj.dua.pauta_docente.respuesta_produccion.criterios_evaluacion && (
                          <p className="text-slate-500 italic">Criterios: {cj.dua.pauta_docente.respuesta_produccion.criterios_evaluacion}</p>
                        )}
                      </div>
                    )}
                    {cj.dua.pauta_docente.respuesta_ticket && (
                      <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                        <p className="font-bold text-slate-800">Ticket de Salida Adaptado</p>
                        <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {cj.dua.pauta_docente.respuesta_ticket.respuesta_correcta}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}