'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Users, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Save
} from 'lucide-react';

export default function AsignarEstudiantesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [resultados, setResultados] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      try {
        const res = await fetch(`/api/evaluaciones/${evaluacionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.evaluacion) {
          setEvaluacion(json.evaluacion);
          setResultados(json.resultados || []);

          // Cargar estudiantes del curso
          const estRes = await fetch(`/api/estudiantes/${encodeURIComponent(json.evaluacion.curso)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const estJson = await estRes.json();
          setEstudiantes(estJson.estudiantes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [evaluacionId]);

  const handleSelectEstudiante = (resultadoId: string, estudianteId: string) => {
    setResultados(prev => {
      return prev.map(r => r.id === resultadoId ? { ...r, estudiante_id: estudianteId } : r);
    });
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    setMessage(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      for (const resItem of resultados) {
        if (!resItem.estudiante_id) continue;
        await fetch(`/api/resultados/${resItem.id}/desarrollo`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            puntajes_desarrollo: resItem.puntajes_desarrollo || {},
            estudiante_id: resItem.estudiante_id,
          }),
        });
      }

      setMessage('¡Asignación de estudiantes guardada exitosamente!');
      setTimeout(() => router.push(`/evaluador/${evaluacionId}/desarrollo`), 1000);
    } catch (err: any) {
      setMessage('Error guardando asignación: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !evaluacion) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex font-sans antialiased">
        <Sidebar />
        <div className="flex-1 lg:pl-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-700 flex font-sans antialiased">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/70 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href={`/evaluador/${evaluacionId}`} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-black text-slate-800 leading-none">Asignar Hojas Escaneadas a la Lista</h1>
              <p className="text-xs text-slate-400 mt-1">{evaluacion.curso} — {evaluacion.titulo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveAssignments}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Asignaciones
          </button>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">

          {message && (
            <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              {message}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Mapeo de Hojas OMR Procesadas ({resultados.length})
            </h3>

            {resultados.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No hay hojas procesadas pendientes de asignación.</p>
            ) : (
              <div className="space-y-3">
                {resultados.map((res, index) => (
                  <div key={res.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Hoja Escaneada #{index + 1}</span>
                      <span className="text-[11px] text-slate-400">Puntaje alternativas OMR: {res.puntaje_alternativas} pts</span>
                    </div>

                    <div className="w-72">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asignar a Estudiante</label>
                      <select
                        value={res.estudiante_id || ''}
                        onChange={e => handleSelectEstudiante(res.id, e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="">-- Seleccionar Estudiante --</option>
                        {estudiantes.map(e => (
                          <option key={e.id} value={e.id}>
                            N° {e.numero_lista} - {e.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
