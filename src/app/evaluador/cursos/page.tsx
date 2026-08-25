'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Users, Upload, Download, Plus, Trash2, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, Layers, BookOpen
} from 'lucide-react';
import Papa from 'papaparse';

// ── Types ─────────────────────────────────────────────────────────────────
interface EstudianteRow {
  numero_lista: number;
  nombre: string;
  rut: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function generarParalelos(nivelBase: string, cantidad: number): string[] {
  const base = nivelBase.trim();
  if (!base) return [];
  if (cantidad === 0) return [base];
  const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  return letras.slice(0, Math.min(cantidad, 7)).map(l => `${base}${l}`);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CursosPage() {
  const router = useRouter();

  // Lista de cursos registrados (todos los chips)
  const [cursosRegistrados, setCursosRegistrados] = useState<string[]>([]);
  // Curso actualmente seleccionado para editar su lista
  const [cursoActivo, setCursoActivo] = useState<string | null>(null);

  // Estado del formulario de agregar nivel
  const [nivelInput, setNivelInput] = useState('');
  const [cantParalelos, setCantParalelos] = useState<number>(1);

  // Lista de estudiantes del curso activo
  const [estudiantes, setEstudiantes] = useState<EstudianteRow[]>([
    { numero_lista: 1, nombre: '', rut: '' },
  ]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Load stored courses list from Supabase on mount ────────────────────
  useEffect(() => {
    async function loadCourseList() {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { router.push('/login'); return; }

      try {
        // Pull distinct cursos from estudiantes table for this teacher
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: rows } = await supabase
          .from('estudiantes')
          .select('curso')
          .eq('docente_id', user.id);

        if (rows && rows.length > 0) {
          const uniq = Array.from(new Set(rows.map((r: any) => r.curso as string))).sort();
          setCursosRegistrados(uniq);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCourseList();
  }, [router]);

  // ── Load students when active course changes ───────────────────────────
  const loadStudents = useCallback(async (curso: string) => {
    setLoadingStudents(true);
    setMessage(null);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    try {
      const res = await fetch(`/api/estudiantes/${encodeURIComponent(curso)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.estudiantes && data.estudiantes.length > 0) {
        setEstudiantes(data.estudiantes.map((e: any) => ({
          numero_lista: e.numero_lista,
          nombre: e.nombre,
          rut: e.rut || '',
        })));
      } else {
        setEstudiantes([{ numero_lista: 1, nombre: '', rut: '' }]);
      }
    } catch (e) {
      console.error(e);
      setEstudiantes([{ numero_lista: 1, nombre: '', rut: '' }]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (cursoActivo) {
      loadStudents(cursoActivo);
    }
  }, [cursoActivo, loadStudents]);

  // ── Add level handler ──────────────────────────────────────────────────
  const handleAgregarNivel = () => {
    if (!nivelInput.trim()) return;
    const nuevos = generarParalelos(nivelInput, cantParalelos);
    setCursosRegistrados(prev => {
      const merged = [...prev, ...nuevos.filter(c => !prev.includes(c))].sort();
      return merged;
    });
    // Auto-select first new course
    if (nuevos.length > 0) setCursoActivo(nuevos[0]);
    setNivelInput('');
    setCantParalelos(1);
  };

  // ── Remove course chip ─────────────────────────────────────────────────
  const handleEliminarCurso = (c: string) => {
    setCursosRegistrados(prev => prev.filter(x => x !== c));
    if (cursoActivo === c) {
      setCursoActivo(null);
      setEstudiantes([{ numero_lista: 1, nombre: '', rut: '' }]);
    }
  };

  // ── Student table handlers ─────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const csv = 'numero_lista,nombre,rut\n1,Martina López,12.345.678-9\n2,Diego García,23.456.789-0';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plantilla_${(cursoActivo || 'Curso').replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: EstudianteRow[] = results.data.map((row: any, idx: number) => ({
          numero_lista: Number(row.numero_lista) || (idx + 1),
          nombre: row.nombre || row['Nombre completo'] || `Estudiante ${idx + 1}`,
          rut: row.rut || row['RUT'] || '',
        }));
        if (rows.length > 0) {
          setEstudiantes(rows);
          setMessage({ type: 'success', text: `${rows.length} estudiantes cargados desde CSV para ${cursoActivo}.` });
        }
      },
      error: (err) => setMessage({ type: 'error', text: 'Error leyendo CSV: ' + err.message }),
    });
  };

  const handleAddRow = () =>
    setEstudiantes(prev => [...prev, { numero_lista: prev.length + 1, nombre: '', rut: '' }]);

  const handleRemoveRow = (idx: number) =>
    setEstudiantes(prev => prev.filter((_, i) => i !== idx));

  const handleRowChange = (idx: number, field: keyof EstudianteRow, value: any) =>
    setEstudiantes(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });

  const handleSaveRoster = async () => {
    if (!cursoActivo) return;
    const validRows = estudiantes.filter(e => e.nombre.trim().length > 0);
    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'Ingresa al menos un estudiante con nombre.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    try {
      const res = await fetch('/api/estudiantes/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ curso: cursoActivo, estudiantes: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      setMessage({ type: 'success', text: `¡Lista de ${cursoActivo} guardada con ${validRows.length} estudiantes!` });

      // Ensure course is in the registered list
      setCursosRegistrados(prev =>
        prev.includes(cursoActivo) ? prev : [...prev, cursoActivo].sort()
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-700 flex font-sans antialiased">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/70 px-6 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-2xs">
          <Link href="/evaluador" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-black text-slate-800 leading-none">Gestión de Cursos y Listas de Estudiantes</h1>
            <p className="text-xs text-slate-400 mt-1">Agrega niveles, genera sus paralelos y administra cada lista por separado</p>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">

          {/* ── Panel Agregar Nivel ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Agregar Nivel y Paralelos
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              {/* Nivel Base */}
              <div className="flex-1 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nivel base
                </label>
                <input
                  type="text"
                  value={nivelInput}
                  onChange={e => setNivelInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAgregarNivel()}
                  placeholder="Ej: 1° Medio, 8°, 2° Básico, Kínder"
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none font-semibold text-slate-800 shadow-2xs"
                />
              </div>

              {/* Cantidad Paralelos */}
              <div className="space-y-1.5 shrink-0">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Paralelos
                </label>
                <select
                  value={cantParalelos}
                  onChange={e => setCantParalelos(Number(e.target.value))}
                  className="text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none shadow-2xs"
                >
                  <option value={0}>Sin paralelo (Único)</option>
                  <option value={1}>1 paralelo (A)</option>
                  <option value={2}>2 paralelos (A – B)</option>
                  <option value={3}>3 paralelos (A – C)</option>
                  <option value={4}>4 paralelos (A – D)</option>
                  <option value={5}>5 paralelos (A – E)</option>
                  <option value={6}>6 paralelos (A – F)</option>
                  <option value={7}>7 paralelos (A – G)</option>
                </select>
              </div>

              {/* Preview + Botón */}
              <div className="space-y-1.5 shrink-0">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {nivelInput.trim()
                    ? `Generará: ${generarParalelos(nivelInput, cantParalelos).join(', ')}`
                    : 'Vista previa'}
                </label>
                <button
                  type="button"
                  onClick={handleAgregarNivel}
                  disabled={!nivelInput.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar nivel
                </button>
              </div>
            </div>
          </div>

          {/* ── Cursos Registrados ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              Cursos Registrados
              {cursosRegistrados.length > 0 && (
                <span className="ml-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {cursosRegistrados.length}
                </span>
              )}
            </h2>

            {cursosRegistrados.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Aún no hay cursos registrados.</p>
                <p className="text-xs text-slate-400 mt-1">Agrega un nivel arriba para comenzar.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cursosRegistrados.map(c => (
                  <div key={c} className="flex items-center gap-0.5 group">
                    <button
                      type="button"
                      onClick={() => setCursoActivo(c)}
                      className={`px-4 py-2 rounded-l-xl text-xs font-black transition-all border ${
                        cursoActivo === c
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      {c}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarCurso(c)}
                      title={`Quitar ${c} de la lista`}
                      className={`px-1.5 py-2 rounded-r-xl text-xs transition-all border-y border-r ${
                        cursoActivo === c
                          ? 'bg-emerald-800 text-emerald-200 border-emerald-700 hover:bg-red-600 hover:border-red-600 hover:text-white'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cursoActivo && (
              <p className="text-[11px] text-slate-400 pt-1">
                Editando lista de: <span className="font-black text-emerald-700">{cursoActivo}</span>
              </p>
            )}
          </div>

          {/* ── Lista de Estudiantes ────────────────────────────────── */}
          {cursoActivo ? (
            <>
              {/* Mensaje */}
              {message && (
                <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {message.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />}
                  {message.text}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    Lista — {cursoActivo}
                    <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {estudiantes.length} filas
                    </span>
                  </h2>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Plantilla CSV
                    </button>

                    <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-200">
                      <Upload className="w-3.5 h-3.5" /> Subir CSV
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar fila
                    </button>
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
                    <p className="text-xs text-slate-400 mt-2">Cargando lista de {cursoActivo}…</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                          <th className="py-2.5 px-3 w-20">N° Lista</th>
                          <th className="py-2.5 px-3">Nombre Completo</th>
                          <th className="py-2.5 px-3 w-40">RUT (Opcional)</th>
                          <th className="py-2.5 px-3 w-12 text-center">—</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {estudiantes.map((est, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={est.numero_lista}
                                onChange={e => handleRowChange(idx, 'numero_lista', Number(e.target.value))}
                                className="w-14 text-center font-bold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="Martina López"
                                value={est.nombre}
                                onChange={e => handleRowChange(idx, 'nombre', e.target.value)}
                                className="w-full px-3 py-1 rounded-lg border border-slate-200 focus:border-emerald-400 focus:outline-none font-medium"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder="12.345.678-9"
                                value={est.rut}
                                onChange={e => handleRowChange(idx, 'rut', e.target.value)}
                                className="w-full px-3 py-1 rounded-lg border border-slate-200 focus:outline-none text-slate-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveRoster}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Guardar lista de {cursoActivo}
                  </button>
                </div>
              </div>
            </>
          ) : (
            cursosRegistrados.length > 0 && (
              <div className="py-10 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Selecciona un curso arriba para editar su lista</p>
              </div>
            )
          )}

        </main>
      </div>
    </div>
  );
}
