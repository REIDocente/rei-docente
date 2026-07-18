'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  Upload,
  FileText,
  X,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DaySchedule {
  n_bloques: number;
  hora_inicio: string;
  hora_fin: string;
}

type Horario = {
  lunes: DaySchedule;
  martes: DaySchedule;
  miercoles: DaySchedule;
  jueves: DaySchedule;
  viernes: DaySchedule;
};

type DayKey = keyof Horario;

interface CursoData {
  id?: string;
  nombre: string;
  nivel: string;
  seccion: string;
  horario?: Horario | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────


const DAYS: { key: DayKey; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
];

const DEFAULT_DAY: DaySchedule = { n_bloques: 0, hora_inicio: '', hora_fin: '' };

const DEFAULT_HORARIO: Horario = {
  lunes: { ...DEFAULT_DAY },
  martes: { ...DEFAULT_DAY },
  miercoles: { ...DEFAULT_DAY },
  jueves: { ...DEFAULT_DAY },
  viernes: { ...DEFAULT_DAY },
};

function tipoBloque(n: number): string {
  if (n === 1) return 'Simple';
  if (n === 2) return 'Doble';
  if (n === 3) return 'Triple';
  return '';
}

// Helper color function
function tipoBloqueColor(n: number): string {
  if (n === 1) return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
  if (n === 2) return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
  if (n === 3) return 'bg-amber-50 text-amber-300 border-amber-100';
  return '';
}

// ─── Manual Schedule Table ────────────────────────────────────────────────────

function ManualTable({
  horario,
  onChange,
}: {
  horario: Horario;
  onChange: (h: Horario) => void;
}) {
  const updateDay = (key: DayKey, field: keyof DaySchedule, value: string | number) => {
    onChange({
      ...horario,
      [key]: { ...horario[key], [field]: value },
    });
  };

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => {
        const day = horario[key];
        const n = day.n_bloques;
        return (
          <div
            key={key}
            className={`rounded-2xl border p-4 transition-all ${
              n > 0
                ? 'bg-indigo-500/5 border-indigo-150'
                : 'bg-slate-50/50 border-[#E2E8F0]/60'
            }`}
          >
            <div className="flex items-center gap-4 flex-wrap">
              {/* Day name */}
              <div className="w-28 shrink-0">
                <p
                  className={`text-sm font-semibold ${
                    n > 0 ? 'text-slate-800' : 'text-slate-600'
                  }`}
                >
                  {label}
                </p>
              </div>

              {/* Block count */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 uppercase tracking-wider font-semibold">
                  Bloques
                </label>
                <div className="flex items-center gap-1 bg-[#FAF9FC]/80 border border-[#E2E8F0]/70 rounded-xl overflow-hidden">
                  {[0, 1, 2, 3].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateDay(key, 'n_bloques', v)}
                      className={`w-9 h-9 text-sm font-bold transition-all ${
                        n === v
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-800 hover:text-slate-800'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* tipo_bloque badge */}
              {n > 0 && (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${tipoBloqueColor(n)}`}
                >
                  {tipoBloque(n)}
                </span>
              )}

              {/* hora_inicio / hora_fin */}
              {n > 0 && (
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <input
                      type="time"
                      value={day.hora_inicio}
                      onChange={(e) => updateDay(key, 'hora_inicio', e.target.value)}
                      className="bg-[#FAF9FC]/80 border border-[#E2E8F0]/70 rounded-xl py-1.5 px-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-28"
                    />
                  </div>
                  <span className="text-slate-600 text-xs">–</span>
                  <input
                    type="time"
                    value={day.hora_fin}
                    onChange={(e) => updateDay(key, 'hora_fin', e.target.value)}
                    className="bg-[#FAF9FC]/80 border border-[#E2E8F0]/70 rounded-xl py-1.5 px-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-28"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── File Upload Tab ──────────────────────────────────────────────────────────

function UploadTab({
  nombre,
  nivel,
  onConfirm,
}: {
  nombre: string;
  nivel: string;
  onConfirm: (h: Horario) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<Horario | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setParsed(null);
    setParseError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setParseError(null);
    setParsed(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', nombre);
      formData.append('nivel', nivel);

      const res = await fetch('/api/horario/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }

      const data = await res.json();
      if (!data?.horario) {
        throw new Error('No se detectó un horario en el archivo.');
      }
      setParsed(data.horario as Horario);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setParseError(msg);
    } finally {
      setParsing(false);
    }
  };

  const acceptedTypes =
    '.jpg,.jpeg,.png,.pdf,.docx,.xlsx,image/jpeg,image/png,application/pdf';

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          file
            ? 'border-indigo-500/50 bg-indigo-500/5'
            : 'border-[#E2E8F0]/70 hover:border-[#E2E8F0]/70 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={acceptedTypes}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-indigo-600" />
            <p className="text-slate-800 font-semibold text-sm">{file.name}</p>
            <p className="text-slate-600 text-xs">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setParsed(null);
                setParseError(null);
              }}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Quitar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-slate-600" />
            <div>
              <p className="text-slate-700 font-semibold text-sm">
                Arrastra tu horario aquí
              </p>
              <p className="text-slate-600 text-xs mt-1">
                o haz clic para seleccionar un archivo
              </p>
            </div>
            <p className="text-slate-700 text-xs">
              Formatos: JPG, PNG, PDF, DOCX, XLSX
            </p>
          </div>
        )}
      </div>

      {/* Parse button */}
      {file && !parsed && (
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-2xl transition-all"
        >
          {parsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analizando archivo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Detectar horario con IA
            </>
          )}
        </button>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-300 font-semibold text-sm">
              No se pudo procesar el archivo
            </p>
            <p className="text-rose-600/80 text-xs mt-1">{parseError}</p>
            <p className="text-slate-600 text-xs mt-2">
              Intenta con otro formato o configura el horario manualmente en la
              pestaña anterior.
            </p>
          </div>
        </div>
      )}

      {/* Parsed preview */}
      {parsed && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-semibold text-sm">Horario detectado — vista previa</p>
          </div>

          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-900/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]/70">
                  <th className="px-4 py-2.5 text-left text-xs text-slate-600 font-semibold uppercase tracking-wider">
                    Día
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs text-slate-600 font-semibold uppercase tracking-wider">
                    Bloques
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs text-slate-600 font-semibold uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs text-slate-600 font-semibold uppercase tracking-wider">
                    Horario
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map(({ key, label }) => {
                  const day = parsed[key];
                  const n = day.n_bloques;
                  return (
                    <tr key={key} className="border-b border-[#E2E8F0]/60/60 last:border-0">
                      <td className="px-4 py-2.5 text-slate-700 font-medium">
                        {label}
                      </td>
                      <td className="px-4 py-2.5">
                        {n > 0 ? (
                          <span className="text-indigo-600 font-bold">{n}</span>
                        ) : (
                          <span className="text-slate-700">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {n > 0 ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold border ${tipoBloqueColor(n)}`}
                          >
                            {tipoBloque(n)}
                          </span>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">
                        {n > 0 && (day.hora_inicio || day.hora_fin)
                          ? `${day.hora_inicio || '?'} – ${day.hora_fin || '?'}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onConfirm(parsed)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar horario detectado
            </button>
            <button
              type="button"
              onClick={() => {
                setParsed(null);
                setFile(null);
              }}
              className="px-4 py-3 bg-white border border-[#E2E8F0]/70 text-slate-600 hover:text-slate-800 rounded-2xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function NuevoCursoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);

  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [nivel, setNivel] = useState('');
  const [seccion, setSeccion] = useState('');
  const [horario, setHorario] = useState<Horario>({ ...DEFAULT_HORARIO });
  const [niveles, setNiveles] = useState<string[]>([]);

  // Tab
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual');

  // Auth + load existing
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load dynamic levels from database
      try {
        const { data: levelRows } = await supabase
          .from('curriculum_unidades')
          .select('nivel');
        if (levelRows && levelRows.length > 0) {
          const unique = [...new Set(levelRows.map((r) => r.nivel))];
          const order = ['5° Básico', '6° Básico', '7° Básico', '8° Básico', '1° Medio', '2° Medio'];
          unique.sort((a, b) => order.indexOf(a) - order.indexOf(b));
          setNiveles(unique);
        }
      } catch (err) {
        console.error('Error fetching levels:', err);
      }

      if (editId) {
        try {
          const res = await fetch(`/api/cursos/${editId}`);
          if (res.ok) {
            const data: CursoData = await res.json();
            setNombre(data.nombre ?? '');
            setNivel(data.nivel ?? '');
            setSeccion(data.seccion ?? '');
            if (data.horario) {
              setHorario(data.horario);
            }
          }
        } catch {
          // Non-blocking
        }
      }

      setAuthLoading(false);
    };
    init();
  }, [router, editId]);

  const handleConfirmParsed = useCallback((h: Horario) => {
    setHorario(h);
    setActiveTab('manual');
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !nivel) {
      setError('Por favor completa el nombre del curso y el nivel.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let cursoId = editId;

      if (!isEdit) {
        // Create
        const res = await fetch('/api/cursos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.trim(),
            nivel,
            seccion: seccion.trim() || null,
            asignatura: 'Lenguaje y Comunicación',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Error ${res.status} al crear el curso`);
        }
        const created = await res.json();
        cursoId = created.id;
      } else {
        // Update curso info
        const res = await fetch(`/api/cursos/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.trim(),
            nivel,
            seccion: seccion.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Error ${res.status} al actualizar el curso`);
        }
      }

      // Save horario
      if (cursoId) {
        const resH = await fetch(`/api/horario/${cursoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ horario }),
        });
        if (!resH.ok) {
          // Non-fatal for now — curso was saved
          console.warn('No se pudo guardar el horario:', resH.status);
        }
      }

      setSuccess(true);
      setTimeout(() => router.push('/cursos'), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-600 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-[40%] h-[50%] bg-violet-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35%] h-[40%] bg-pink-200/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9FC]/80 backdrop-blur-md border-b border-[#E2E8F0]/60 px-6 py-4 flex items-center gap-4">
        <Link
          href="/cursos"
          className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-[#E2E8F0]/70 transition-all text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-150">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            {isEdit ? 'Editar Curso' : 'Nuevo Curso'}
          </span>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 z-10">
        <form onSubmit={handleSave} className="space-y-8">
          {/* ── Section A: Course info ───────────────────────────────────── */}
          <section className="bg-white backdrop-blur-xl border border-[#E2E8F0]/60 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                A
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Información del Curso
              </h2>
            </div>

            {/* Asignatura badge (read-only) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Asignatura
              </label>
              <div className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 border border-indigo-150 rounded-2xl text-indigo-300 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Lenguaje y Comunicación
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                Fase 1: solo disponible para esta asignatura.
              </p>
            </div>

            {/* Nombre */}
            <div>
              <label
                htmlFor="nombre"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
              >
                Nombre del Curso *
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej. 5° Básico A"
                required
                autoComplete="off"
                className="w-full bg-[#FAF9FC]/80 border border-[#E2E8F0]/70 rounded-2xl py-3 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Nivel */}
            <div>
              <label
                htmlFor="nivel"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
              >
                Nivel *
              </label>
              <select
                id="nivel"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                required
                className="w-full bg-[#FAF9FC]/80 border border-[#E2E8F0]/70 rounded-2xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Selecciona un nivel
                </option>
                {niveles.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección */}
            <div>
              <label
                htmlFor="seccion"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
              >
                Sección{' '}
                <span className="text-slate-700 normal-case font-normal">
                  (opcional)
                </span>
              </label>
              <input
                id="seccion"
                type="text"
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                placeholder="ej. A"
                maxLength={10}
                className="w-full bg-[#FAF9FC]/80 border border-[#E2E8F0]/70 rounded-2xl py-3 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </section>

          {/* ── Section B: Horario semanal ──────────────────────────────── */}
          <section className="bg-white backdrop-blur-xl border border-[#E2E8F0]/60 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                B
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Horario Semanal
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#FAF9FC]/60 border border-[#E2E8F0]/70 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'manual'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-700'
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                Subir horario
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'manual' ? (
              <ManualTable horario={horario} onChange={setHorario} />
            ) : (
              <UploadTab
                nombre={nombre}
                nivel={nivel}
                onConfirm={handleConfirmParsed}
              />
            )}
          </section>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-rose-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-emerald-300 text-sm">
                {isEdit ? 'Curso actualizado' : 'Curso creado'} correctamente. Redirigiendo...
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3">
            <Link
              href="/cursos"
              className="flex-1 flex items-center justify-center py-3.5 bg-white border border-[#E2E8F0]/70 text-slate-600 hover:text-slate-800 font-semibold rounded-2xl transition-all text-sm"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving || success}
              className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Actualizar' : 'Guardar Curso'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NuevoCursoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9FC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin text-indigo-600" />
          <p className="text-slate-600 text-sm">Cargando formulario...</p>
        </div>
      </div>
    }>
      <NuevoCursoForm />
    </Suspense>
  );
}
