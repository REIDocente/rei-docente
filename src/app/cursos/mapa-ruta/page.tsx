'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Save,
  Sparkles,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  RotateCcw,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface Session {
  numero: number;
  titulo: string;
  eje: string;
  oa_codes: string[];
}

interface Unit {
  numero: number;
  titulo: string;
  oa_codes: string[];
  eje_principal: string;
  sesiones: Session[];
}

interface RtiDistribution {
  n1: number;
  n2: number;
  n3: number;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  asignatura: string;
}

interface Roadmap {
  id: string;
  curso_id: string;
  asignatura: string;
  año: string;
  n_estudiantes: number | null;
  distribucion_rti: RtiDistribution | null;
  unidades: Unit[];
  created_at: string;
}

function MapaRutaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('id');

  const [curso, setCurso] = useState<Curso | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [año, setAño] = useState('2026');
  const [nEstudiantes, setNEstudiantes] = useState(30);
  const [distRti, setDistRti] = useState<RtiDistribution>({ n1: 22, n2: 6, n3: 2 });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load course and existing roadmap on mount
  useEffect(() => {
    if (!cursoId) {
      setError('ID de curso no especificado en la URL.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;

        const res = await fetch(`/api/cursos/mapa-ruta?cursoId=${cursoId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.status === 404) {
          // Course exists but has no roadmap yet
          const data = await res.json();
          setCurso(data.curso);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setCurso(data.curso);
        if (data.mapa) {
          setRoadmap(data.mapa);
          setAño(data.mapa.año || '2026');
          setNEstudiantes(data.mapa.n_estudiantes || 30);
          setDistRti(data.mapa.distribucion_rti || { n1: 22, n2: 6, n3: 2 });
          setUnidades(data.mapa.unidades || []);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cursoId, router]);

  // Generate roadmap with Claude
  const handleGenerate = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch('/api/cursos/mapa-ruta/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cursoId,
          año,
          n_estudiantes: nEstudiantes,
          distribucion_rti: distRti,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al generar el mapa de ruta.');
      }

      const data = await res.json();
      setRoadmap(data);
      setUnidades(data.unidades || []);
      setSuccess('¡Mapa de ruta curricular generado con éxito por la IA!');
    } catch (err: any) {
      setError(err.message || 'Error en la generación automática.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save edits manually
  const handleSave = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const res = await fetch('/api/cursos/mapa-ruta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cursoId,
          asignatura: curso?.asignatura,
          año,
          n_estudiantes: nEstudiantes,
          distribucion_rti: distRti,
          unidades,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar los cambios.');
      }

      const data = await res.json();
      setRoadmap(data);
      setSuccess('¡Cambios guardados con éxito!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar.');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit fields handlers
  const handleUnitTitleChange = (uIdx: number, val: string) => {
    const next = [...unidades];
    next[uIdx].titulo = val;
    setUnidades(next);
  };

  const handleUnitEjeChange = (uIdx: number, val: string) => {
    const next = [...unidades];
    next[uIdx].eje_principal = val;
    setUnidades(next);
  };

  const handleSessionTitleChange = (uIdx: number, sIdx: number, val: string) => {
    const next = [...unidades];
    next[uIdx].sesiones[sIdx].titulo = val;
    setUnidades(next);
  };

  const handleSessionEjeChange = (uIdx: number, sIdx: number, val: string) => {
    const next = [...unidades];
    next[uIdx].sesiones[sIdx].eje = val;
    setUnidades(next);
  };

  // Loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-600 text-sm">Cargando mapa de ruta curricular...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col">
      {/* Background lights */}
      <div className="absolute top-0 right-0 w-[45%] h-[50%] bg-violet-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35%] h-[40%] bg-pink-200/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9FC]/80 backdrop-blur-md border-b border-[#E2E8F0]/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/cursos"
            className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-[#E2E8F0]/70 transition-all text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-150">
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block">Mapa de Ruta</span>
              {curso && (
                <span className="text-xs text-slate-600 block -mt-0.5">
                  {curso.nombre} · {curso.nivel}
                </span>
              )}
            </div>
          </div>
        </div>

        {roadmap && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Cambios
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 z-10 space-y-8">
        {/* Messages */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-rose-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl text-emerald-300 text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Empty state: Roadmap not generated yet */}
        {!roadmap ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-50/50 backdrop-blur-xl border border-[#E2E8F0]/60 rounded-3xl p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl border border-indigo-150 text-indigo-600 mb-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Generar Mapa de Ruta Anual
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
                  La Inteligencia Artificial analizará los OAs del nivel en la base de datos para estructurar las 4 unidades oficiales de este curso, secuenciando 6 sesiones temáticas balanceadas por cada unidad.
                </p>
              </div>

              <hr className="border-[#E2E8F0]/60" />

              {/* Form parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="input-ano" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Año Escolar
                  </label>
                  <input
                    id="input-ano"
                    type="text"
                    value={año}
                    onChange={(e) => setAño(e.target.value)}
                    className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/60 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-slate-800 text-sm outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="input-nestudientes" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Cantidad de Estudiantes
                  </label>
                  <input
                    id="input-nestudientes"
                    type="number"
                    value={nEstudiantes}
                    onChange={(e) => setNEstudiantes(Number(e.target.value))}
                    className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/60 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-slate-800 text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              {/* RTI Distribution inputs */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Distribución de Alumnos por Nivel de Apoyo
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#FAF9FC]/60 border border-[#E2E8F0]/60 rounded-xl p-3 text-center space-y-1">
                    <label htmlFor="input-n1" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">N1 (Universal)</label>
                    <input
                      id="input-n1"
                      type="number"
                      value={distRti.n1}
                      onChange={(e) => setDistRti({ ...distRti, n1: Number(e.target.value) })}
                      className="w-full text-center bg-transparent text-slate-800 font-bold outline-none text-sm"
                    />
                  </div>
                  <div className="bg-[#FAF9FC]/60 border border-[#E2E8F0]/60 rounded-xl p-3 text-center space-y-1">
                    <label htmlFor="input-n2" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">N2 (DUA)</label>
                    <input
                      id="input-n2"
                      type="number"
                      value={distRti.n2}
                      onChange={(e) => setDistRti({ ...distRti, n2: Number(e.target.value) })}
                      className="w-full text-center bg-transparent text-slate-800 font-bold outline-none text-sm"
                    />
                  </div>
                  <div className="bg-[#FAF9FC]/60 border border-[#E2E8F0]/60 rounded-xl p-3 text-center space-y-1">
                    <label htmlFor="input-n3" className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">N3 (PIE)</label>
                    <input
                      id="input-n3"
                      type="number"
                      value={distRti.n3}
                      onChange={(e) => setDistRti({ ...distRti, n3: Number(e.target.value) })}
                      className="w-full text-center bg-transparent text-slate-800 font-bold outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Diseñando estructura de ruta curricular...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar plan curricular anual
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Roadmap is generated: show units and editing */
          <div className="space-y-6">
            {/* Header info bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 backdrop-blur-xl border border-[#E2E8F0]/60 rounded-2xl p-5">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Año: {año}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Alumnos: {nNEstudiantes(roadmap)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-slate-600">
                    Apoyos: <strong className="text-slate-800">N1 ({distRti.n1})</strong> · <strong className="text-slate-800">N2 ({distRti.n2})</strong> · <strong className="text-slate-800">N3 ({distRti.n3})</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-700 hover:text-white rounded-xl text-xs font-semibold border border-[#E2E8F0]/70/60 transition-colors"
                title="Regenerar con IA"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerar Mapa
              </button>
            </div>

            {/* Units Layout */}
            <div className="space-y-8">
              {unidades.map((unit, uIdx) => (
                <div key={uIdx} className="bg-white/20 border border-[#E2E8F0]/60/80 rounded-2xl p-6 space-y-4">
                  {/* Unit Title Header */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-3 space-y-1">
                      <label htmlFor={`unit-titulo-${uIdx}`} className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Unidad {unit.numero}</label>
                      <input
                        id={`unit-titulo-${uIdx}`}
                        type="text"
                        value={unit.titulo}
                        onChange={(e) => handleUnitTitleChange(uIdx, e.target.value)}
                        className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/60/60 focus:border-indigo-500/40 rounded-xl px-4 py-2 text-slate-800 font-bold text-lg outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor={`unit-eje-${uIdx}`} className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Eje Principal</label>
                      <input
                        id={`unit-eje-${uIdx}`}
                        type="text"
                        value={unit.eje_principal}
                        onChange={(e) => handleUnitEjeChange(uIdx, e.target.value)}
                        className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/60/60 focus:border-indigo-500/40 rounded-xl px-4 py-2 text-slate-700 font-semibold text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-600">OAs de la unidad:</span>
                    {unit.oa_codes?.map((code) => (
                      <span key={code} className="px-2 py-0.5 bg-indigo-50 border border-indigo-500/15 text-indigo-600 rounded-md font-semibold text-[10px]">{code}</span>
                    ))}
                  </div>

                  {/* Sessions table */}
                  <div className="overflow-x-auto border border-[#E2E8F0]/60 rounded-xl bg-[#FAF9FC]/30">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-[#E2E8F0]/60 text-slate-600 text-xs font-bold">
                          <th className="px-4 py-3 w-16 text-center">Sesión</th>
                          <th className="px-4 py-3">Tema/Foco de la Clase</th>
                          <th className="px-4 py-3 w-40">Eje curricular</th>
                          <th className="px-4 py-3 w-36 text-center">OAs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/80 text-sm">
                        {unit.sesiones?.map((session, sIdx) => (
                          <tr key={sIdx} className="hover:bg-white/10 transition-colors">
                            <td className="px-4 py-3.5 text-center font-bold text-indigo-600 bg-white/15">
                              {session.numero}
                            </td>
                            <td className="px-4 py-3.5">
                              <input
                                aria-label={`Título de Sesión ${session.numero}`}
                                type="text"
                                value={session.titulo}
                                onChange={(e) => handleSessionTitleChange(uIdx, sIdx, e.target.value)}
                                className="w-full bg-transparent focus:bg-[#FAF9FC]/80 border border-transparent focus:border-[#E2E8F0]/70 rounded-lg px-2 py-1 text-slate-800 outline-none transition-all"
                              />
                            </td>
                            <td className="px-4 py-3.5">
                              <select
                                aria-label={`Eje de Sesión ${session.numero}`}
                                value={session.eje}
                                onChange={(e) => handleSessionEjeChange(uIdx, sIdx, e.target.value)}
                                className="bg-transparent focus:bg-[#FAF9FC] border border-transparent focus:border-[#E2E8F0]/70 rounded-lg px-2 py-1 text-slate-700 outline-none text-xs transition-all w-full font-medium cursor-pointer"
                              >
                                <option value="Lectura">Lectura</option>
                                <option value="Escritura">Escritura</option>
                                <option value="Comunicación Oral">Comunicación Oral</option>
                                <option value="Investigación">Investigación</option>
                              </select>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {session.oa_codes?.map((code) => (
                                  <span key={code} className="px-1.5 py-0.5 bg-slate-800 text-slate-700 border border-[#E2E8F0]/70 rounded text-[9px] font-bold">
                                    {code}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Link
                href="/cursos"
                className="px-6 py-3 bg-white hover:bg-slate-800 border border-[#E2E8F0]/70 text-slate-700 font-semibold rounded-2xl transition-colors text-sm"
              >
                Cancelar
              </Link>
              <button
                onClick={handleSave}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 text-sm"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar Cambios
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function nNEstudiantes(roadmap: Roadmap) {
  return roadmap.n_estudiantes !== null ? roadmap.n_estudiantes : 30;
}

export default function MapaRutaPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <MapaRutaContent />
    </Suspense>
  );
}
