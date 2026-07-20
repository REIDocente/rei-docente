'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  BookOpen, Search, CheckCircle, AlertCircle, Copy, Sparkles, Loader2, Download,
  ChevronDown, ChevronUp, ArrowRight, FileDown, X, Star, ExternalLink, PanelRight, Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { drawLecturasPdf } from '@/lib/templates/drawLecturasPdf';
import { drawLecturasWord } from '@/lib/templates/drawLecturasWord';
import { Packer } from 'docx';

// ── Types ──────────────────────────────────────────────────────────────────

type TipoRecurso = 'planificacion' | 'guia' | 'banco_preguntas' | 'evaluacion' | 'rubrica' | 'experiencia' | 'recursos_visuales';

interface ModalConfig {
  tipo: TipoRecurso;
  subtipo?: string;
  label: string;
  sesiones?: number;
}

interface RecursoGenerado {
  content: string;
  tipo: TipoRecurso;
  subtipo?: string;
  label: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const CHILEAN_COURSES = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico',
  '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio'
];

const PLAY_MOTORS = [
  { id: 'detective',           emoji: '🕵️', label: 'Detective' },
  { id: 'escape_room',         emoji: '🔐', label: 'Escape Room' },
  { id: 'trivia',              emoji: '❓', label: 'Trivia' },
  { id: 'bingo',               emoji: '🎯', label: 'Bingo' },
  { id: 'memoria',             emoji: '🧠', label: 'Memoria' },
  { id: 'clue',                emoji: '🎲', label: 'CLUE' },
  { id: 'serpiente_escaleras', emoji: '🐍', label: 'Serpientes' },
  { id: 'ludo',                emoji: '🔴', label: 'Ludo' },
];

const EXPERIENCIAS_LIST = [
  { id: 'booktuber',           emoji: '🎥', label: 'Booktuber',           proximamente: false },
  { id: 'podcast',             emoji: '🎙️', label: 'Podcast',             proximamente: false },
  { id: 'instagram_personaje', emoji: '📱', label: 'Instagram Personaje', proximamente: false },
  { id: 'diario_personaje',    emoji: '📔', label: 'Diario Personaje',    proximamente: false },
  { id: 'juicio_personaje',    emoji: '⚖️', label: 'Juicio al Personaje', proximamente: false },
  { id: 'noticiero',           emoji: '📰', label: 'Noticiero',           proximamente: true },
  { id: 'teatro',              emoji: '🎭', label: 'Teatro',              proximamente: true },
];

const PROGRESS_STEPS = [
  'Libro identificado',
  'Prompt generado',
  'Análisis pegado',
  'Expediente guardado',
];

// ── Sub-components ─────────────────────────────────────────────────────────

function CollapsibleSection({
  id, label, open, onToggle, children,
}: {
  id: string; label: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="text-xs font-black text-slate-700">{label}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function ModuleBtn({
  label, generated, onClick,
}: {
  label: string; generated: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
        generated
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/30'
      }`}
    >
      <span>{label}</span>
      {generated ? (
        <span className="shrink-0 flex items-center gap-1 text-[9px] text-emerald-600">
          <Check className="w-3 h-3" /> Listo
        </span>
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-slate-300 shrink-0" />
      )}
    </button>
  );
}

function ExpedientePanel({
  libro, recursosGenerados, onDownloadPdf, onDownloadWord,
}: {
  libro: any;
  recursosGenerados: Record<string, RecursoGenerado>;
  onDownloadPdf: (content: string, config: any) => void;
  onDownloadWord: (content: string, config: any) => void;
}) {
  const personajes = Array.isArray(libro?.personajes) ? libro.personajes : [];
  const temas = libro?.temas || [];
  const vocabulario = libro?.vocabulario || [];
  const sinopsis = libro?.sinopsis || '';
  const recursos = Object.values(recursosGenerados);

  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Expediente</p>
        <h2 className="text-sm font-black text-slate-800 leading-tight">{libro.titulo}</h2>
        {libro.autor && <p className="text-xs text-slate-400 mt-0.5">{libro.autor}</p>}
      </div>

      {sinopsis && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sinopsis</p>
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-5">{sinopsis}</p>
        </div>
      )}

      {personajes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Personajes</p>
          <div className="space-y-1">
            {personajes.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-emerald-700 shrink-0 mt-0.5">👤</span>
                <div>
                  <span className="text-[10px] font-bold text-slate-700">{typeof p === 'string' ? p : p.nombre}</span>
                  {typeof p !== 'string' && p.rol && (
                    <span className="text-[9px] text-slate-400 ml-1">· {p.rol}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {temas.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Temas</p>
          <div className="flex flex-wrap gap-1">
            {temas.slice(0, 6).map((t: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-full border border-blue-100">{t}</span>
            ))}
          </div>
        </div>
      )}

      {vocabulario.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vocabulario clave</p>
          <div className="flex flex-wrap gap-1">
            {vocabulario.slice(0, 8).map((v: any, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-full border border-amber-100">{typeof v === 'string' ? v : v.palabra}</span>
            ))}
          </div>
        </div>
      )}

      {recursos.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recursos Generados</p>
          <div className="space-y-1.5">
            {recursos.map((r: RecursoGenerado) => (
              <div key={`${r.tipo}_${r.subtipo}`} className="flex items-center justify-between gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 truncate">{r.label}</span>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    title="Descargar PDF"
                    onClick={() => onDownloadPdf(r.content, { tipo: r.tipo, subtipo: r.subtipo })}
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer"
                  >
                    <FileDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    title="Descargar Word"
                    onClick={() => onDownloadWord(r.content, { tipo: r.tipo, subtipo: r.subtipo })}
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function LecturasPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [etapa, setEtapa] = useState<'busqueda' | 'dashboard'>('busqueda');
  const [progressStep, setProgressStep] = useState(1);

  // Búsqueda
  const [searchTitle, setSearchTitle]     = useState('');
  const [searchAutor, setSearchAutor]     = useState('');
  const [searching, setSearching]         = useState(false);
  const [searchChecked, setSearchChecked] = useState(false);
  const [searchResult, setSearchResult]   = useState<any>(null);

  // NotebookLM
  const [granularidad, setGranularidad]           = useState<'completo' | 'capitulos' | 'paginas' | 'fragmento'>('completo');
  const [rangoInicio, setRangoInicio]             = useState('');
  const [rangoFin, setRangoFin]                   = useState('');
  const [promptText, setPromptText]               = useState('');
  const [generatingPrompt, setGeneratingPrompt]   = useState(false);
  const [promptCopied, setPromptCopied]           = useState(false);
  const [notebookResponse, setNotebookResponse]   = useState('');
  const [savingAnalysis, setSavingAnalysis]       = useState(false);
  const [savingError, setSavingError]             = useState<string | null>(null);

  // Libro
  const [libroId, setLibroId]                     = useState('');
  const [libroExpediente, setLibroExpediente]     = useState<any>(null);

  // Dashboard
  const [openSection, setOpenSection]             = useState<string | null>('kit_planificacion');
  const [expedienteOpen, setExpedienteOpen]       = useState(false);

  // Modal generación
  const [openModal, setOpenModal]                 = useState<ModalConfig | null>(null);
  const [nivel, setNivel]                         = useState('2° Medio');
  const [oaCodes, setOaCodes]                     = useState('');
  const [sesiones, setSesiones]                   = useState(4);
  const [generatingModal, setGeneratingModal]     = useState(false);
  const [generatedModal, setGeneratedModal]       = useState('');
  const [modalError, setModalError]               = useState<string | null>(null);
  const [modalDificultad, setModalDificultad]     = useState<'Fácil' | 'Mixto' | 'Difícil'>('Mixto');
  const [modalNumAlt, setModalNumAlt]             = useState(15);
  const [modalNumDes, setModalNumDes]             = useState(3);
  const [exportingModalPdf, setExportingModalPdf] = useState(false);
  const [exportingModalWord, setExportingModalWord] = useState(false);

  // Recursos generados (sesión)
  const [recursosGenerados, setRecursosGenerados] = useState<Record<string, RecursoGenerado>>({});

  // Kit
  const [kitSeleccionado, setKitSeleccionado] = useState<Record<string, boolean>>({
    planificacion: true, evaluacion: true, guia: true, play: true, experiencia: true,
  });
  const [kitMotor, setKitMotor]           = useState('detective');
  const [kitExperiencia, setKitExperiencia] = useState('booktuber');
  const [kitGenerando, setKitGenerando]   = useState(false);
  const [kitProgreso, setKitProgreso]     = useState<string[]>([]);

  // ── Auth ──────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
    });
  }, [router]);

  useEffect(() => {
    if (libroExpediente) {
      if (libroExpediente.cursos_sugeridos?.length > 0) setNivel(libroExpediente.cursos_sugeridos[0]);
      if (libroExpediente.oa_sugeridos?.length > 0) setOaCodes(libroExpediente.oa_sugeridos.join(', '));
    }
  }, [libroExpediente]);

  // ── Cargar recursos persistidos al entrar al dashboard ──────────────────

  useEffect(() => {
    if (!libroId || !user) return;
    (async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch(`/api/lecturas/recursos?libro_id=${libroId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.recursos && typeof data.recursos === 'object') {
          // Merge: los de la DB como base, los de sesión tienen prioridad
          setRecursosGenerados(prev => ({ ...data.recursos, ...prev }));
        }
      } catch (e) {
        console.warn('[lecturas] No se pudieron cargar recursos persistidos:', e);
      }
    })();
  }, [libroId, user]);

  // ── Persistir un recurso en la DB (fire-and-forget) ──────────────────────

  const persistirRecurso = async (key: string, recurso: RecursoGenerado) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await fetch('/api/lecturas/recursos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ libro_id: libroId, key, recurso }),
      });
    } catch (e) {
      console.warn('[lecturas] No se pudo persistir el recurso:', e);
    }
  };

  // ── Handlers Etapa 1 ──────────────────────────────────────────────────

  const handleSearchBook = async () => {
    if (!searchTitle.trim()) return;
    setSearching(true);
    setSearchChecked(false);
    setSearchResult(null);
    setProgressStep(1);
    try {
      const res = await fetch(`/api/lecturas/buscar?titulo=${encodeURIComponent(searchTitle.trim())}`);
      const data = await res.json();
      setSearchChecked(true);
      if (data.encontrado && data.libro) {
        setSearchResult(data.libro);
        setLibroId(data.libro.id);
        setLibroExpediente(data.libro);
        setProgressStep(4);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleGeneratePrompt = async () => {
    setGeneratingPrompt(true);
    try {
      const res = await fetch('/api/lecturas/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: searchTitle.trim(), autor: searchAutor.trim(), granularidad,
          rango_inicio: granularidad === 'paginas' ? rangoInicio : undefined,
          rango_fin: granularidad === 'paginas' ? rangoFin : undefined,
        })
      });
      const data = await res.json();
      setPromptText(data.prompt || '');
      setProgressStep(2);
    } catch (e) { console.error(e); }
    finally { setGeneratingPrompt(false); }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2500);
  };

  const handleSaveNotebookAnalysis = async () => {
    if (!notebookResponse.trim()) return;
    setSavingAnalysis(true);
    setSavingError(null);
    setProgressStep(3);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    try {
      const res = await fetch('/api/lecturas/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          titulo: searchTitle.trim(), analisis_raw: notebookResponse.trim(), granularidad,
          rango_inicio: granularidad === 'paginas' ? rangoInicio : undefined,
          rango_fin: granularidad === 'paginas' ? rangoFin : undefined,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar expediente');
      setLibroId(data.libro_id);
      setLibroExpediente(data.expediente);
      setProgressStep(4);
      setTimeout(() => setEtapa('dashboard'), 1000);
    } catch (e: any) {
      setSavingError(e.message);
      setProgressStep(2);
    } finally {
      setSavingAnalysis(false);
    }
  };

  // ── Handlers Dashboard ────────────────────────────────────────────────

  const handleOpenModal = (config: ModalConfig) => {
    setOpenModal(config);
    setGeneratedModal('');
    setModalError(null);
    if (config.sesiones) setSesiones(config.sesiones);
  };

  const handleCloseModal = () => { setOpenModal(null); setGeneratedModal(''); setModalError(null); };

  const handleGenerateInModal = async () => {
    if (!openModal) return;
    setGeneratingModal(true);
    setModalError(null);
    setGeneratedModal('');
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    try {
      const res = await fetch('/api/lecturas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          libro_id: libroId, tipo: openModal.tipo, subtipo: openModal.subtipo,
          nivel, oa: oaCodes ? oaCodes.split(',').map((s: string) => s.trim()) : ['OA General'],
          sesiones: openModal.tipo === 'planificacion' ? sesiones : undefined,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en la generación');
      setGeneratedModal(data.content);
      const key = `${openModal.tipo}_${openModal.subtipo || 'default'}`;
      const nuevoRecurso: RecursoGenerado = { content: data.content, tipo: openModal.tipo, subtipo: openModal.subtipo, label: openModal.label };
      setRecursosGenerados((prev: Record<string, RecursoGenerado>) => ({ ...prev, [key]: nuevoRecurso }));
      // Persistir en DB (fire-and-forget)
      persistirRecurso(key, nuevoRecurso);
    } catch (e: any) {
      setModalError(e.message);
    } finally {
      setGeneratingModal(false);
    }
  };

  const handleDownloadModalPdf = async (content?: string, config?: any) => {
    const c = content ?? generatedModal;
    const m = config ?? openModal;
    if (!c || !m) return;
    setExportingModalPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      drawLecturasPdf({ doc, tipo: m.tipo, subtipo: m.subtipo, libroTitulo: libroExpediente?.titulo || 'Libro', libroAutor: libroExpediente?.autor || 'Autor', content: c, docenteNombre: user?.user_metadata?.full_name || 'Docente', establecimiento: 'RIGOBERTO FONTT IZQUIERDO' });
      doc.save(`REI_${m.tipo}_${(libroExpediente?.titulo || 'libro').replace(/\s+/g, '_')}.pdf`);
    } catch (e) { console.error(e); alert('Error al exportar PDF'); }
    finally { setExportingModalPdf(false); }
  };

  const handleDownloadModalWord = async (content?: string, config?: any) => {
    const c = content ?? generatedModal;
    const m = config ?? openModal;
    if (!c || !m) return;
    setExportingModalWord(true);
    try {
      const doc = drawLecturasWord({ tipo: m.tipo, subtipo: m.subtipo, libroTitulo: libroExpediente?.titulo || 'Libro', libroAutor: libroExpediente?.autor || 'Autor', content: c, docenteNombre: user?.user_metadata?.full_name || 'Docente', establecimiento: 'RIGOBERTO FONTT IZQUIERDO' });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `REI_${m.tipo}_${(libroExpediente?.titulo || 'libro').replace(/\s+/g, '_')}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); alert('Error al exportar Word'); }
    finally { setExportingModalWord(false); }
  };

  const kitCount = Object.values(kitSeleccionado).filter(Boolean).length;

  const handleGenerarKit = async () => {
    if (kitCount < 2) return;
    setKitGenerando(true);
    setKitProgreso([]);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const items: ModalConfig[] = [];
    if (kitSeleccionado.planificacion) items.push({ tipo: 'planificacion', label: 'Planificación Completa', sesiones: 4 });
    if (kitSeleccionado.guia) items.push({ tipo: 'guia', label: 'Guía de Aprendizaje' });
    if (kitSeleccionado.evaluacion) items.push({ tipo: 'evaluacion', subtipo: 'mixta', label: 'Evaluación Mixta' });
    if (kitSeleccionado.experiencia) items.push({ tipo: 'experiencia', subtipo: kitExperiencia, label: `Experiencia: ${kitExperiencia}` });
    for (const item of items) {
      setKitProgreso((prev: string[]) => [...prev, `⏳ Generando ${item.label}...`]);
      try {
        const res = await fetch('/api/lecturas/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ libro_id: libroId, tipo: item.tipo, subtipo: item.subtipo, nivel, oa: oaCodes ? oaCodes.split(',').map((s: string) => s.trim()) : ['OA General'], sesiones: item.tipo === 'planificacion' ? (item.sesiones || 4) : undefined })
        });
        const data = await res.json();
        if (res.ok && data.content) {
          const key = `${item.tipo}_${item.subtipo || 'default'}`;
          const nuevoRecurso: RecursoGenerado = { content: data.content, tipo: item.tipo, subtipo: item.subtipo, label: item.label };
          setRecursosGenerados((prev: Record<string, RecursoGenerado>) => ({ ...prev, [key]: nuevoRecurso }));
          // Persistir en DB (fire-and-forget)
          persistirRecurso(key, nuevoRecurso);
          setKitProgreso((prev: string[]) => [...prev.slice(0, -1), `✅ ${item.label}`]);
        } else { setKitProgreso((prev: string[]) => [...prev.slice(0, -1), `❌ Error en ${item.label}`]); }
      } catch { setKitProgreso((prev: string[]) => [...prev.slice(0, -1), `❌ Error en ${item.label}`]); }
    }
    if (kitSeleccionado.play) {
      setKitProgreso((prev: string[]) => [...prev, `🎮 Redirigiendo a REI PLAY...`]);
      setTimeout(() => router.push(`/play?fuente=lectura_domiciliaria&libro_id=${libroId}&motor=${kitMotor}`), 1500);
    }
    setKitGenerando(false);
  };

  const toggleSection = (id: string) => setOpenSection((prev: string | null) => prev === id ? null : id);

  const personajes = Array.isArray(libroExpediente?.personajes) ? libroExpediente.personajes : [];
  const temas = libroExpediente?.temas || [];
  const vocabulario = libroExpediente?.vocabulario || [];
  const oaList = libroExpediente?.oa_sugeridos || [];

  // ── RENDER ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-700 flex font-sans antialiased overflow-x-hidden">
      <Sidebar sidebarOpen={false} setSidebarOpen={() => {}} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="bg-white border-b border-slate-200/70 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <BookOpen className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-none">REI Lecturas</h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Planificación Domiciliaria Inteligente</p>
            </div>
          </div>
          {etapa === 'dashboard' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setEtapa('busqueda'); setSearchChecked(false); setSearchResult(null); setProgressStep(1); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ← Cambiar libro
              </button>
              <button
                onClick={() => setExpedienteOpen((prev: boolean) => !prev)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <PanelRight className="w-3.5 h-3.5" />
                Expediente
              </button>
            </div>
          )}
        </header>

        {/* ── ETAPA 1: BÚSQUEDA ── */}
        {etapa === 'busqueda' && (
          <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
            <div className="text-center space-y-1 pt-4">
              <h2 className="text-2xl font-black text-slate-800">Biblioteca REI</h2>
              <p className="text-sm text-slate-400">Busca tu lectura domiciliaria o crea un nuevo expediente</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Título del Libro</label>
                  <input
                    type="text"
                    placeholder="Ej: Hijo de Ladrón"
                    value={searchTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTitle(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearchBook()}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Autor (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Manuel Rojas"
                    value={searchAutor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchAutor(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearchBook()}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSearchBook}
                disabled={searching || !searchTitle.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm"
              >
                {searching ? <span><Loader2 className="w-4 h-4 animate-spin" /></span> : <span><Search className="w-4 h-4" /></span>}
                Buscar en Biblioteca REI
              </button>
            </div>

            {searchChecked && searchResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Encontrado en Biblioteca REI</p>
                  <h3 className="text-base font-black text-emerald-950 truncate">&ldquo;{searchResult.titulo}&rdquo;</h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {searchResult.autor && `Autor: ${searchResult.autor} · `}Analizado · <span className="font-bold">0 créditos</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setEtapa('dashboard')}
                    className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Abrir Expediente <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {searchChecked && !searchResult && (
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                  <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Obra sin analizar</p>
                    <h3 className="text-sm font-bold text-amber-950 mt-0.5">&ldquo;{searchTitle}&rdquo; no está en la Biblioteca</h3>
                    <p className="text-xs text-amber-800 mt-1">Crearemos el expediente con NotebookLM de Google.</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progreso del Expediente</p>
                  <div className="space-y-2.5">
                    {PROGRESS_STEPS.map((label, i) => {
                      const stepNum = i + 1;
                      const done = progressStep > stepNum;
                      const active = progressStep === stepNum;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${done ? 'bg-emerald-600 text-white' : active ? 'bg-emerald-700 text-white ring-4 ring-emerald-700/20' : 'bg-slate-100 text-slate-400'}`}>
                            {done ? <Check className="w-3.5 h-3.5" /> : stepNum}
                          </div>
                          <span className={`text-xs font-medium transition-all ${done ? 'text-emerald-700 line-through decoration-emerald-400' : active ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>{label}</span>
                          {active && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">En curso</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Paso 1 — ¿Cómo trabajarás el libro?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'completo', label: 'Libro completo' },
                      { id: 'capitulos', label: 'Por capítulos' },
                      { id: 'paginas', label: 'Por páginas' },
                      { id: 'fragmento', label: 'Solo un fragmento' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGranularidad(opt.id as any)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${granularidad === opt.id ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {granularidad === 'paginas' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Desde página</label>
                        <input type="text" placeholder="1" value={rangoInicio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRangoInicio(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Hasta página</label>
                        <input type="text" placeholder="100" value={rangoFin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRangoFin(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none" />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleGeneratePrompt}
                    disabled={generatingPrompt}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {generatingPrompt ? <span><Loader2 className="w-4 h-4 animate-spin" /></span> : <span><Sparkles className="w-4 h-4" /></span>}
                    Generar Prompt para NotebookLM
                  </button>
                </div>

                {progressStep >= 2 && promptText && (
                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Paso 2 — Copia el Prompt</h3>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompt para NotebookLM</span>
                        <button type="button" onClick={handleCopyPrompt} className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer">
                          <Copy className="w-3.5 h-3.5" />{promptCopied ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <textarea readOnly value={promptText} className="w-full h-28 bg-transparent text-[10px] font-mono text-slate-500 focus:outline-none resize-none" />
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 space-y-1.5">
                      <p className="font-bold">Instrucciones:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>Ve a <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">notebooklm.google.com</a></li>
                        <li>Sube el archivo PDF del libro</li>
                        <li>Pega el prompt y presiona Enter</li>
                        <li>Copia la respuesta completa</li>
                      </ol>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 block">Paso 3 — Pega la respuesta de NotebookLM</label>
                      <textarea
                        placeholder="Pega el texto completo del análisis aquí..."
                        value={notebookResponse}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setNotebookResponse(e.target.value); if (e.target.value.trim()) setProgressStep(3); }}
                        className="w-full h-40 text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none resize-none transition-all"
                      />
                    </div>
                    {savingError && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{savingError}</div>}
                    <button
                      type="button"
                      onClick={handleSaveNotebookAnalysis}
                      disabled={savingAnalysis || !notebookResponse.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      {savingAnalysis ? <span><Loader2 className="w-4 h-4 animate-spin" /></span> : <span><CheckCircle className="w-4 h-4" /></span>}
                      {savingAnalysis ? 'Procesando análisis...' : 'Procesar y guardar análisis'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        )}

        {/* ── ETAPA 2: DASHBOARD ── */}
        {etapa === 'dashboard' && libroExpediente && (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <main className="flex-1 p-5 md:p-6 overflow-y-auto space-y-4 min-w-0">

              <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-16 bg-gradient-to-br from-emerald-700 to-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide leading-tight truncate">
                      {libroExpediente.titulo}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {libroExpediente.autor && `Autor: ${libroExpediente.autor}`}
                      {libroExpediente.genero && ` · ${libroExpediente.genero}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {(libroExpediente.cursos_sugeridos || []).slice(0, 2).map((c: string) => (
                        <span key={c} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">{c}</span>
                      ))}
                      {oaList.slice(0, 3).map((oa: string) => (
                        <span key={oa} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">{oa}</span>
                      ))}
                      <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-full">✅ Analizado</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                      {personajes.length > 0 && <span>👤 {personajes.length} personajes</span>}
                      {temas.length > 0 && <span>🏷️ {temas.length} temas</span>}
                      {vocabulario.length > 0 && <span>📚 {vocabulario.length} palabras</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/70 p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Configuración curricular</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Nivel / Curso</label>
                    <select value={nivel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNivel(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-emerald-500">
                      {CHILEAN_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">OAs (por coma)</label>
                    <input type="text" value={oaCodes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOaCodes(e.target.value)} placeholder="Ej: OA 3, OA 8" className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </div>

              <CollapsibleSection id="kit_planificacion" label="📅 Kit de Planificación" open={openSection === 'kit_planificacion'} onToggle={() => toggleSection('kit_planificacion')}>
                <div className="grid grid-cols-2 gap-2">
                  <ModuleBtn
                    label="Sesión de clase"
                    generated={!!recursosGenerados['planificacion_default']}
                    onClick={() => handleOpenModal({ tipo: 'planificacion', label: 'Sesión de clase', sesiones: 2 })}
                  />
                  <ModuleBtn
                    label="Recursos Visuales"
                    generated={!!recursosGenerados['recursos_visuales_default']}
                    onClick={() => handleOpenModal({ tipo: 'recursos_visuales', label: 'Recursos Visuales' })}
                  />
                </div>
              </CollapsibleSection>


            </main>

            <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-slate-200/70 bg-white overflow-y-auto sticky top-[57px] h-[calc(100vh-57px)]">
              <ExpedientePanel libro={libroExpediente} recursosGenerados={recursosGenerados} onDownloadPdf={handleDownloadModalPdf} onDownloadWord={handleDownloadModalWord} />
            </aside>

            {expedienteOpen && (
              <div className="fixed inset-0 z-40 flex justify-end md:hidden">
                <div className="absolute inset-0 bg-slate-900/40" onClick={() => setExpedienteOpen(false)} />
                <aside className="relative w-72 bg-white h-full overflow-y-auto shadow-xl">
                  <button onClick={() => setExpedienteOpen(false)} className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                  <ExpedientePanel libro={libroExpediente} recursosGenerados={recursosGenerados} onDownloadPdf={handleDownloadModalPdf} onDownloadWord={handleDownloadModalWord} />
                </aside>
              </div>
            )}
          </div>
        )}

        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-black text-slate-800">{openModal.label}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">&ldquo;{libroExpediente?.titulo}&rdquo;</p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {!generatedModal && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nivel</label>
                        <select value={nivel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNivel(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none">
                          {CHILEAN_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">OAs</label>
                        <input type="text" value={oaCodes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOaCodes(e.target.value)} placeholder="Ej: OA 3, OA 8" className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none" />
                      </div>
                    </div>
                    {openModal.tipo === 'planificacion' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-2">Número de Sesiones</label>
                        <div className="flex gap-2 flex-wrap">
                          {[1, 2, 4, 5, 6, 8].map(s => (
                            <button key={s} type="button" onClick={() => setSesiones(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${sesiones === s ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                              {s === 1 ? '1 sesión' : `${s} sesiones`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {modalError && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{modalError}</div>}
                    <button type="button" onClick={handleGenerateInModal} disabled={generatingModal} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer">
                      {generatingModal ? <span><Loader2 className="w-4 h-4 animate-spin" /></span> : <span><Sparkles className="w-4 h-4" /></span>}
                      {generatingModal ? 'Generando con IA...' : 'Generar con REI IA'}
                    </button>
                  </>
                )}

                {generatingModal && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Generando {openModal.label}...</p>
                    <p className="text-[10px] text-slate-400">Esto puede tomar 20–40 segundos</p>
                  </div>
                )}

                {generatedModal && !generatingModal && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Generado correctamente
                      </span>
                      <button
                        type="button"
                        onClick={() => { setGeneratedModal(''); }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        ← Volver
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 max-h-64 overflow-y-auto">
                      <pre className="text-[10px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">{generatedModal}</pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadModalPdf()}
                        disabled={exportingModalPdf}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {exportingModalPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadModalWord()}
                        disabled={exportingModalWord}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {exportingModalWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Word
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
