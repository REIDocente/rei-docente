'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Gamepad2,
  FileDown,
  Info,
  Calendar,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  Download,
  Users,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  FileText,
  Library
} from 'lucide-react';
import { gameEngines, GameEngine, GameSection } from '@/lib/templates/gameEngines';
import { drawPlayPdf } from '@/lib/templates/drawPlayPdf';
import { drawPlayWord } from '@/lib/templates/drawPlayWord';
import { jsPDF } from 'jspdf';
import { Packer } from 'docx';

const CHILEAN_COURSES = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico',
  '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio'
];

export default function REIPlayPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [loadingPlannings, setLoadingPlannings] = useState(true);
  const [lecturas, setLecturas] = useState<any[]>([]);
  const [loadingLecturas, setLoadingLecturas] = useState(true);

  // Stepper state
  const [step, setStep] = useState(1);

  // Form states
  const [fuente, setFuente] = useState<'planificacion' | 'tema_manual' | 'lectura_domiciliaria'>('planificacion');
  const [planificacionId, setPlanificacionId] = useState<string>('');
  const [tema, setTema] = useState<string>('');
  const [libroId, setLibroId] = useState<string>('');
  const [nivel, setNivel] = useState<string>('2° Medio');
  const [oaCodes, setOaCodes] = useState<string>('');

  // Selected engine & configs
  const [selectedEngineId, setSelectedEngineId] = useState<string>('detective');
  const [duracion, setDuracion] = useState<number>(20);
  const [modalidad, setModalidad] = useState<string>('parejas');
  const [dificultad, setDificultad] = useState<string>('media');

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedGame, setGeneratedGame] = useState<any>(null);

  // Preview UI collapsibles
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Export statuses
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch plannings
      try {
        const { data: planningsData } = await supabase
          .from('plannings')
          .select('id, created_at, subject, grade, learning_objective, unit')
          .order('created_at', { ascending: false });
        
        setPlannings(planningsData || []);
        if (planningsData && planningsData.length > 0) {
          setPlanificacionId(planningsData[0].id);
        }
      } catch (e) {
        console.error('Error fetching plannings:', e);
      } finally {
        setLoadingPlannings(false);
      }

      // Fetch lecturas_docente
      try {
        const { data: lecturasData } = await supabase
          .from('lecturas_docente')
          .select('id, libro_id, biblioteca_libros(id, titulo, autor, cursos_sugeridos, oa_sugeridos)')
          .order('created_at', { ascending: false });

        const flattened = (lecturasData || []).map((ld: any) => ({
          id: ld.id,
          libro_id: ld.libro_id,
          titulo: ld.biblioteca_libros?.titulo,
          autor: ld.biblioteca_libros?.autor,
          cursos_sugeridos: ld.biblioteca_libros?.cursos_sugeridos,
          oa_sugeridos: ld.biblioteca_libros?.oa_sugeridos
        })).filter(l => l.titulo);

        setLecturas(flattened);
        if (flattened.length > 0) {
          setLibroId(flattened[0].libro_id);
        }
      } catch (e) {
        console.error('Error fetching lecturas:', e);
      } finally {
        setLoadingLecturas(false);
      }
    });
  }, [router]);

  // Read URL params for deep-link from REI Lecturas (/play?fuente=lectura_domiciliaria&libro_id=...&motor=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fuenteParam = params.get('fuente');
    const libroIdParam = params.get('libro_id');
    const motorParam = params.get('motor');
    if (fuenteParam === 'lectura_domiciliaria') {
      setFuente('lectura_domiciliaria');
      if (libroIdParam) setLibroId(libroIdParam);
      if (motorParam) setSelectedEngineId(motorParam);
    }
  }, []);

  const handleSelectEngine = (engineId: string) => {
    setSelectedEngineId(engineId);
    const engine = gameEngines.find(e => e.id === engineId);
    if (engine) {
      // Set default compatible duration, modality, difficulty
      if (!engine.duraciones.includes(duracion)) {
        setDuracion(engine.duraciones[0]);
      }
      if (!engine.modalidades.includes(modalidad)) {
        setModalidad(engine.modalidades[0]);
      }
      if (!engine.dificultades.includes(dificultad)) {
        setDificultad(engine.dificultades[0]);
      }
    }
  };

  const handleSelectBook = (libId: string) => {
    setLibroId(libId);
    const selected = lecturas.find(l => l.libro_id === libId);
    if (selected) {
      if (selected.cursos_sugeridos && selected.cursos_sugeridos.length > 0) {
        setNivel(selected.cursos_sugeridos[0]);
      }
      if (selected.oa_sugeridos && selected.oa_sugeridos.length > 0) {
        setOaCodes(selected.oa_sugeridos.join(', '));
      }
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationError(null);
    setGeneratedGame(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const payload = {
      motor: selectedEngineId,
      fuente,
      planificacion_id: fuente === 'planificacion' ? planificacionId : undefined,
      tema: fuente === 'tema_manual' ? tema : undefined,
      libro_id: fuente === 'lectura_domiciliaria' ? libroId : undefined,
      nivel,
      oa_codes: oaCodes ? oaCodes.split(',').map(s => s.trim()) : ['OA General'],
      duracion,
      modalidad,
      dificultad
    };

    try {
      const res = await fetch('/api/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error inesperado al generar el juego.');
      }

      setGeneratedGame(data);
      // Initialize collapsibles to open
      const initialCollapseState: Record<string, boolean> = {};
      const activeEngine = gameEngines.find(e => e.id === selectedEngineId);
      activeEngine?.estructura.forEach(sec => {
        initialCollapseState[sec.id] = false;
      });
      setCollapsedSections(initialCollapseState);
      setStep(5); // Go to results

    } catch (e: any) {
      setGenerationError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedGame) return;
    setExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      drawPlayPdf({
        doc,
        motorId: generatedGame.motor,
        juego: generatedGame.contenido_json,
        docenteNombre: user?.user_metadata?.full_name || 'Docente',
        establecimiento: 'RIGOBERTO FONTT IZQUIERDO'
      });
      doc.save(`Juego_REI_Play_${generatedGame.motor}_${generatedGame.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error al descargar PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!generatedGame) return;
    setExportingWord(true);
    try {
      const doc = drawPlayWord({
        motorId: generatedGame.motor,
        juego: generatedGame.contenido_json,
        docenteNombre: user?.user_metadata?.full_name || 'Docente',
        establecimiento: 'RIGOBERTO FONTT IZQUIERDO'
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Juego_REI_Play_${generatedGame.motor}_${generatedGame.id}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Error al descargar Word');
    } finally {
      setExportingWord(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const activeEngine = gameEngines.find(e => e.id === selectedEngineId);

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-slate-700 flex font-sans antialiased overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar sidebarOpen={false} setSidebarOpen={() => {}} />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white border-b border-[#E2E8F0]/70 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-violet-700" />
            <h1 className="text-lg font-black bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              REI PLAY · Juegos de Mesa Pedagógicos
            </h1>
          </div>
          {step > 1 && (
            <button
              onClick={() => {
                if (step === 5) {
                  setStep(1);
                  setGeneratedGame(null);
                } else {
                  setStep(prev => prev - 1);
                }
              }}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8">
          
          {/* Stepper Indicators */}
          {step < 5 && (
            <div className="flex items-center justify-between max-w-md mx-auto mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      step >= s
                        ? 'bg-violet-700 text-white shadow-md shadow-violet-700/20'
                        : 'bg-white border border-[#E2E8F0] text-slate-400'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-all ${
                        step > s ? 'bg-violet-700' : 'bg-[#E2E8F0]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PASO 1: Fuente del Contenido */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0]/70 p-6 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-800">Paso 1: ¿De dónde proviene el contenido del juego?</h2>
                <p className="text-xs text-slate-400">Vincula tu juego a una planificación existente para autocompletar o escribe un tema libre.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFuente('planificacion')}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                    fuente === 'planificacion'
                      ? 'border-violet-600 bg-violet-50/20 text-violet-700 shadow-sm'
                      : 'border-slate-100 bg-[#FAF9FC]/30 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <BookOpen className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">Desde una planificación existente</span>
                  <span className="text-[10px] text-slate-400 mt-1">Usa los textos y objetivos de tu kit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFuente('tema_manual')}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                    fuente === 'tema_manual'
                      ? 'border-violet-600 bg-violet-50/20 text-violet-700 shadow-sm'
                      : 'border-slate-100 bg-[#FAF9FC]/30 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Sparkles className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">Escribir tema manualmente</span>
                  <span className="text-[10px] text-slate-400 mt-1">Crea un juego desde cero</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFuente('lectura_domiciliaria')}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                    fuente === 'lectura_domiciliaria'
                      ? 'border-violet-600 bg-violet-50/20 text-violet-700 shadow-sm'
                      : 'border-slate-100 bg-[#FAF9FC]/30 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <Library className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">Desde una lectura domiciliaria</span>
                  <span className="text-[10px] text-slate-400 mt-1">Usa personajes y tramas de tus libros</span>
                </button>
              </div>

              {fuente === 'planificacion' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Selecciona tu Planificación Reciente</label>
                  {loadingPlannings ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-700" />
                      Cargando planificaciones...
                    </div>
                  ) : plannings.length === 0 ? (
                    <div className="text-xs text-slate-500 p-4 bg-slate-50 border rounded-xl">
                      No tienes planificaciones creadas. Crea una en el Kit de Clase o elige tema manual.
                    </div>
                  ) : (
                    <select
                      value={planificacionId}
                      onChange={(e) => setPlanificacionId(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-violet-600 focus:outline-none bg-white"
                    >
                      {plannings.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.unit} ({p.grade} - {p.subject})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {fuente === 'lectura_domiciliaria' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 block">Selecciona tu Libro Domiciliario</label>
                    {loadingLecturas ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-700" />
                        Cargando biblioteca...
                      </div>
                    ) : lecturas.length === 0 ? (
                      <div className="text-xs text-slate-500 p-5 bg-amber-50/20 border border-amber-100 rounded-xl space-y-3">
                        <p>Aún no tienes libros en REI Lecturas. Ve a REI Lecturas para agregar tu primer libro.</p>
                        <button
                          type="button"
                          onClick={() => router.push('/lecturas')}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Ir a REI Lecturas
                        </button>
                      </div>
                    ) : (
                      <select
                        value={libroId}
                        onChange={(e) => handleSelectBook(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-violet-600 focus:outline-none bg-white"
                      >
                        {lecturas.map((l) => (
                          <option key={l.libro_id} value={l.libro_id}>
                            {l.titulo} — {l.autor}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {lecturas.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 block">Curso / Nivel</label>
                        <select
                          value={nivel}
                          onChange={(e) => setNivel(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-violet-600 focus:outline-none bg-white"
                        >
                          {CHILEAN_COURSES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 block">Códigos OA (Separados por coma)</label>
                        <input
                          type="text"
                          placeholder="Ej: OA 2, OA 9"
                          value={oaCodes}
                          onChange={(e) => setOaCodes(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-violet-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {fuente === 'tema_manual' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 block">Tema Pedagógico o Lectura</label>
                    <input
                      type="text"
                      placeholder="Ej: Comprensión lectora de el cantar de mio cid"
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-violet-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 block">Curso / Nivel</label>
                      <select
                        value={nivel}
                        onChange={(e) => setNivel(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-violet-600 focus:outline-none bg-white"
                      >
                        {CHILEAN_COURSES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 block">Códigos OA (Separados por coma)</label>
                      <input
                        type="text"
                        placeholder="Ej: OA 2, OA 9"
                        value={oaCodes}
                        onChange={(e) => setOaCodes(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] focus:border-violet-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={
                    (fuente === 'planificacion' && !planificacionId) ||
                    (fuente === 'lectura_domiciliaria' && !libroId) ||
                    (fuente === 'tema_manual' && !tema.trim())
                  }
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Siguiente paso <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Seleccionar Motor */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/70 p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-800">Paso 2: Selecciona el Motor de Juego</h2>
                  <p className="text-xs text-slate-400">Elige la dinámica lúdica que mejor se adapte a tus objetivos curriculares.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gameEngines.map((engine) => (
                    <button
                      key={engine.id}
                      type="button"
                      onClick={() => handleSelectEngine(engine.id)}
                      className={`flex flex-col p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                        selectedEngineId === engine.id
                          ? 'border-violet-600 bg-violet-50/10 text-slate-800 shadow-sm'
                          : 'border-[#E2E8F0]/80 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{engine.emoji}</span>
                        <span className="font-bold text-sm text-slate-800">{engine.nombre}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3 flex-1">{engine.descripcion}</p>
                      
                      <div className="text-[10px] font-bold text-violet-600 border-t border-slate-50 pt-2 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Ideal para: {engine.ideal_para}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informative block of materials generated by the selected engine */}
              {activeEngine && (
                <div className="bg-violet-50/40 border border-violet-100 rounded-2xl p-5 flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-violet-950 uppercase tracking-wider">Materiales Imprimibles del Motor</h3>
                    <ul className="text-xs text-violet-900 list-disc list-inside space-y-1 pt-1">
                      {activeEngine.materiales_imprimibles.map((mat, idx) => (
                        <li key={idx} className="font-medium">{mat}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-[#E2E8F0] hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Siguiente paso <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Configurar Parámetros */}
          {step === 3 && activeEngine && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0]/70 p-6 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-800">Paso 3: Configuración de la Sesión de Juego</h2>
                <p className="text-xs text-slate-400">Ajusta los parámetros para adaptar la dinámica a los tiempos y modalidades de tu aula.</p>
              </div>

              <div className="space-y-6">
                {/* Duración */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 block">Duración Estimada</label>
                  <div className="flex gap-3">
                    {activeEngine.duraciones.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuracion(d)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          duracion === d
                            ? 'bg-violet-700 border-violet-700 text-white'
                            : 'bg-white border-[#E2E8F0] text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {d} minutos
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modalidad */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 block">Modalidad de Trabajo</label>
                  <div className="flex gap-3">
                    {activeEngine.modalidades.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModalidad(m)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                          modalidad === m
                            ? 'bg-violet-700 border-violet-700 text-white'
                            : 'bg-white border-[#E2E8F0] text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dificultad */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 block">Dificultad Pedagógica</label>
                  <div className="flex gap-3">
                    {activeEngine.dificultades.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDificultad(d)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                          dificultad === d
                            ? 'bg-violet-700 border-violet-700 text-white'
                            : 'bg-white border-[#E2E8F0] text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 border border-[#E2E8F0] hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Siguiente paso <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: Confirmación y Generación */}
          {step === 4 && activeEngine && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0]/70 p-6 space-y-6 shadow-sm text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center mx-auto shadow-inner">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-800">¿Listo para crear tu juego?</h2>
                  <p className="text-xs text-slate-400">
                    Claude estructurará todo el contenido variable de tu juego **{activeEngine.nombre}** según los parámetros seleccionados.
                  </p>
                </div>

                {/* Resumen Ficha */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Juego:</span>
                    <span className="font-bold text-slate-700">{activeEngine.emoji} {activeEngine.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Fuente:</span>
                    <span className="font-bold text-slate-700 capitalize">{fuente.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Nivel:</span>
                    <span className="font-bold text-slate-700">{nivel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Configuración:</span>
                    <span className="font-bold text-slate-700 capitalize">{duracion} min · {modalidad} · {dificultad}</span>
                  </div>
                </div>

                {generationError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-left">
                    <strong>Error de generación:</strong> {generationError}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={generating}
                    className="flex-1 px-5 py-3 border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-50 rounded-xl text-xs font-bold transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generar Juego
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 5: Resultado / Preview del Juego Generado */}
          {step === 5 && generatedGame && activeEngine && (
            <div className="space-y-6">
              {/* Box de exportaciones y metadata */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0]/70 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeEngine.emoji}</span>
                    <h2 className="text-lg font-bold text-slate-800">¡Juego Generado con Éxito!</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mapeado curricular listo. Descarga los materiales listos para imprimir y recortar.
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2">
                    Materiales incluidos: {activeEngine.materiales_imprimibles.join(' · ')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={exportingPdf}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Descargar PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadWord}
                    disabled={exportingWord}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {exportingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    Descargar Word
                  </button>
                </div>
              </div>

              {/* Vista previa del contenido (Acordeones por Sección) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  Vista Previa del Contenido del Juego
                </h3>

                {activeEngine.estructura.map((section) => {
                  const isCollapsed = collapsedSections[section.id] !== false;
                  const rawData = generatedGame.contenido_json[section.id];
                  
                  // Formatear visualmente el dato de la sección si existe
                  let formattedContent = null;
                  if (rawData) {
                    if (Array.isArray(rawData)) {
                      formattedContent = (
                        <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 font-medium">
                          {rawData.map((item: any, idx: number) => {
                            if (typeof item === 'object') {
                              return (
                                <li key={idx}>
                                  <strong>{item.pregunta || item.nombre || item.concepto || `Ítem ${idx+1}`}:</strong> {item.respuesta || item.definicion || item.descripcion || ''}
                                </li>
                              );
                            }
                            return <li key={idx}>{item}</li>;
                          })}
                        </ul>
                      );
                    } else if (typeof rawData === 'object') {
                      formattedContent = (
                        <div className="space-y-1.5 text-xs text-slate-600 font-medium pl-2">
                          {Object.keys(rawData).map((key) => (
                            <p key={key}>
                              <strong className="capitalize">{key}:</strong> {String(rawData[key])}
                            </p>
                          ))}
                        </div>
                      );
                    } else {
                      formattedContent = <p className="text-xs text-slate-600 font-medium leading-relaxed">{String(rawData)}</p>;
                    }
                  } else {
                    formattedContent = <span className="text-xs text-slate-400 italic">No requiere contenido de Claude. Se dibuja dinámicamente en el PDF.</span>;
                  }

                  return (
                    <div key={section.id} className="bg-white border border-[#E2E8F0]/70 rounded-xl overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-left">
                          <span className={`w-2 h-2 rounded-full ${section.es_solo_docente ? 'bg-red-500' : 'bg-violet-500'}`} />
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{section.nombre}</h4>
                            <p className="text-[10px] text-slate-400">{section.descripcion}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {section.es_solo_docente && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 uppercase tracking-wider">
                              Docente
                            </span>
                          )}
                          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="p-4 border-t border-slate-50 bg-[#FAF9FC]/10">
                          {formattedContent}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón para volver a empezar */}
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setGeneratedGame(null);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-950 transition-colors cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4" /> Configurar otro juego nuevo
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
