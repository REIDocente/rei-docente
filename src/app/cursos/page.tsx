'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DaySchedule {
  n_bloques: number;
  hora_inicio?: string | null;
  hora_fin?: string | null;
}

interface Horario {
  lunes: DaySchedule;
  martes: DaySchedule;
  miercoles: DaySchedule;
  jueves: DaySchedule;
  viernes: DaySchedule;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: string;
  seccion?: string | null;
  asignatura: string;
  horario?: Horario | null;
  created_at: string;
}

// ─── Schedule Grid ────────────────────────────────────────────────────────────

const DAYS: { key: keyof Horario; label: string }[] = [
  { key: 'lunes', label: 'L' },
  { key: 'martes', label: 'M' },
  { key: 'miercoles', label: 'X' },
  { key: 'jueves', label: 'J' },
  { key: 'viernes', label: 'V' },
];

function BlockDots({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-slate-700 text-xs font-bold">–</span>;
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
      ))}
    </div>
  );
}

function ScheduleGrid({ horario }: { horario: Horario | null | undefined }) {
  return (
    <div className="flex items-end gap-1.5 mt-3">
      {DAYS.map(({ key, label }) => {
        const day = horario?.[key];
        const n = day?.n_bloques ?? 0;
        const hasBlocks = n > 0;
        return (
          <div key={key} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className={`w-full rounded-lg border flex items-center justify-center py-2 min-h-[44px] transition-all ${
                hasBlocks
                  ? 'bg-indigo-50 border-indigo-500/30'
                  : 'bg-white/60 border-[#E2E8F0]/60'
              }`}
            >
              <BlockDots count={n} />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                hasBlocks ? 'text-indigo-600' : 'text-slate-600'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Curso Card ───────────────────────────────────────────────────────────────

function CursoCard({
  curso,
  deleting,
  onDelete,
}: {
  curso: Curso;
  deleting: boolean;
  onDelete: () => void;
}) {
  const totalBloques = curso.horario
    ? Object.values(curso.horario).reduce(
        (acc, d) => acc + ((d as DaySchedule).n_bloques ?? 0),
        0
      )
    : 0;

  return (
    <div className="group relative flex flex-col bg-white backdrop-blur-xl hover:bg-white/60 border border-[#E2E8F0]/60 hover:border-[#E2E8F0]/70 rounded-2xl p-6 transition-all duration-300 overflow-hidden">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl" />

      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-500/15">
              <Sparkles className="w-3 h-3" />
              Lenguaje y Comunicación
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 group-hover:text-white mt-2 truncate">
            {curso.nombre}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {curso.nivel}
            {curso.seccion ? ` — Sección ${curso.seccion}` : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/cursos/nuevo?id=${curso.id}`}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Editar horario"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
            title="Eliminar curso"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
          Horario semanal
          {totalBloques > 0 && (
            <span className="ml-2 text-indigo-600 normal-case font-normal">
              · {totalBloques} bloque{totalBloques !== 1 ? 's' : ''}/semana
            </span>
          )}
        </p>
        <ScheduleGrid horario={curso.horario ?? null} />
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-[#E2E8F0]/60/80 flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`/cursos/mapa-ruta?id=${curso.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-350 font-semibold transition-colors border border-indigo-150 px-2.5 py-1 bg-indigo-500/5 hover:bg-indigo-50 rounded-xl"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Mapa de Ruta
        </Link>
        <Link
          href={`/cursos/nuevo?id=${curso.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar horario
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CursosPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch('/api/cursos', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        const data: Curso[] = await res.json();
        setCursos(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.'
      )
    )
      return;

    setDeletingId(id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/cursos?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('No se pudo eliminar el curso.');
      setCursos((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-600 text-sm">Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-slate-800 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-rose-950/40 border border-rose-900/60 rounded-2xl p-8 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <p className="text-rose-300 font-semibold">Ocurrió un error</p>
          <p className="text-rose-600/80 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-rose-900/50 hover:bg-rose-900 border border-rose-800 rounded-xl text-sm text-rose-300 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col">
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-[40%] h-[50%] bg-violet-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35%] h-[40%] bg-pink-200/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9FC]/80 backdrop-blur-md border-b border-[#E2E8F0]/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-[#E2E8F0]/70 transition-all text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-150">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-lg font-bold tracking-tight">Mis Cursos</span>
          </div>
        </div>

        <Link
          href="/cursos/nuevo"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar Curso</span>
          <span className="sm:hidden">Agregar</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 z-10 space-y-8">
        {/* Page intro */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Tus Cursos
          </h1>
          <p className="text-slate-600 text-sm max-w-xl">
            Gestiona los cursos de{' '}
            <span className="text-indigo-600 font-semibold">
              Lenguaje y Comunicación
            </span>{' '}
            y sus horarios semanales. El Planificador usará esta información para
            distribuir las clases.
          </p>
        </div>

        {/* Empty state */}
        {cursos.length === 0 ? (
          <div className="text-center py-20 bg-white/20 rounded-3xl border border-[#E2E8F0]/60 border-dashed">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl border border-indigo-150 mb-6">
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-slate-800 font-bold text-lg mb-3">
              Aún no tienes cursos
            </h3>
            <p className="text-slate-600 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              Configura tu primer curso para que el Planificador distribuya tus
              clases según tu horario real.
            </p>
            <Link
              href="/cursos/nuevo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Crear mi primer curso
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cursos.map((curso) => (
              <CursoCard
                key={curso.id}
                curso={curso}
                deleting={deletingId === curso.id}
                onDelete={() => handleDelete(curso.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
