'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  TrendingUp, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Plus, LineChart
} from 'lucide-react';

export default function SeguimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [evaluacionesCurso, setEvaluacionesCurso] = useState<any[]>([]);
  const [seguimientos, setSeguimientos] = useState<any[]>([]);

  const [habilidad, setHabilidad] = useState('inferencial');
  const [evaluacionSeguimientoId, setEvaluacionSeguimientoId] = useState('');
  const [saving, setSaving] = useState(false);

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

          // Cargar todas las evaluaciones del mismo curso
          const allEvRes = await fetch('/api/evaluaciones', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const allEvJson = await allEvRes.json();
          if (allEvJson.evaluaciones) {
            setEvaluacionesCurso(allEvJson.evaluaciones.filter((e: any) => e.curso === json.evaluacion.curso));
          }

          // Cargar historial de seguimiento del curso
          const segRes = await fetch(`/api/seguimiento/${encodeURIComponent(json.evaluacion.curso)}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const segJson = await segRes.json();
          if (segJson.seguimientos) {
            setSeguimientos(segJson.seguimientos);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [evaluacionId]);

  const handleCreateSeguimiento = async () => {
    if (!evaluacionSeguimientoId) return;
    setSaving(true);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch(`/api/seguimiento/${encodeURIComponent(evaluacion.curso)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          habilidad,
          evaluacion_inicial_id: evaluacionId,
          evaluacion_seguimiento_id: evaluacionSeguimientoId,
        }),
      });

      const json = await res.json();
      if (json.seguimiento) {
        setSeguimientos(prev => [json.seguimiento, ...prev]);
      }
    } catch (err) {
      console.error(err);
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
              <h1 className="text-base font-black text-slate-800 leading-none">Seguimiento Longitudinal del Aprendizaje</h1>
              <p className="text-xs text-slate-400 mt-1">{evaluacion.curso} — {evaluacion.titulo}</p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">

          {/* Formulario Crear Comparativa de Seguimiento */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">
              Comparar Evaluación Inicial vs Evaluación de Seguimiento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Habilidad a Comparar</label>
                <select
                  value={habilidad}
                  onChange={e => setHabilidad(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none"
                >
                  <option value="inferencial">Inferencial (Relacionar e interpretar)</option>
                  <option value="literal">Literal (Localizar información)</option>
                  <option value="interpretativo">Interpretativo (Reflexionar)</option>
                  <option value="argumentativo">Argumentativo (Evaluar críticamente)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Evaluación Post-Refuerzo</label>
                <select
                  value={evaluacionSeguimientoId}
                  onChange={e => setEvaluacionSeguimientoId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none"
                >
                  <option value="">-- Seleccionar Segunda Evaluación --</option>
                  {evaluacionesCurso
                    .filter(ev => ev.id !== evaluacionId)
                    .map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.titulo} ({ev.fecha})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCreateSeguimiento}
                disabled={saving || !evaluacionSeguimientoId}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Calcular Impacto del Refuerzo
              </button>
            </div>
          </div>

          {/* Historial de Seguimientos Registrados */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-700" />
              Historial de Seguimiento ({evaluacion.curso})
            </h3>

            {seguimientos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Aún no has registrado comparativas de seguimiento para este curso.
              </p>
            ) : (
              <div className="space-y-4">
                {seguimientos.map(seg => (
                  <div key={seg.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Habilidad: {seg.habilidad}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${seg.diferencia >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {seg.diferencia >= 0 ? `+${seg.diferencia}% mejora` : `${seg.diferencia}%`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluación Inicial</span>
                        <span className="font-bold text-slate-700 block">{seg.evaluacion_inicial?.titulo || 'Evaluación inicial'}</span>
                        <span className="text-lg font-black text-slate-900">{seg.logro_inicial}%</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluación de Seguimiento</span>
                        <span className="font-bold text-slate-700 block">{seg.evaluacion_seguimiento?.titulo || 'Segunda evaluación'}</span>
                        <span className="text-lg font-black text-emerald-700">{seg.logro_seguimiento}%</span>
                      </div>
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
