'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ClipboardCheck, Printer, Camera, Edit3, BarChart3, TrendingUp,
  ArrowLeft, CheckCircle2, AlertCircle, Loader2, Users, FileText, Calendar
} from 'lucide-react';

export default function EvaluacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      try {
        const res = await fetch(`/api/evaluaciones/${evaluacionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error cargando detalle');
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [evaluacionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex font-sans antialiased">
        <Sidebar />
        <div className="flex-1 lg:pl-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex font-sans antialiased">
        <Sidebar />
        <div className="flex-1 lg:pl-64 p-6">
          <div className="bg-red-50 text-red-900 border border-red-200 rounded-2xl p-6 text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-700" />
            {error || 'Evaluación no encontrada'}
          </div>
        </div>
      </div>
    );
  }

  const { evaluacion, preguntas, resultados, analisis } = data;
  const totalPreguntas = preguntas.length;
  const totalEscaneados = resultados.length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-700 flex font-sans antialiased">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/70 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href="/evaluador" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                  {evaluacion.curso}
                </span>
                <h1 className="text-base font-black text-slate-800 leading-none">{evaluacion.titulo}</h1>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>Fecha: {evaluacion.fecha}</span>
                <span>•</span>
                <span>{evaluacion.total_alternativas} alternativas + {evaluacion.total_desarrollo} desarrollo</span>
                <span>•</span>
                <span className="font-bold text-slate-700">{evaluacion.puntaje_total} pts totales</span>
              </p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">

          {/* Tarjetas de Acciones Principales del Ciclo Pedagógico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Paso 1: Generar e Imprimir Hoja OMR */}
            <Link
              href={`/evaluador/${evaluacionId}/hoja`}
              className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all group space-y-3 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Paso 1</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">Imprimir Hoja OMR</h3>
                <p className="text-xs text-slate-400 mt-1">Genera y descarga el PDF imprimible con código QR y marcadores de esquina.</p>
              </div>
            </Link>

            {/* Paso 2: Escanear Hojas con la Cámara */}
            <Link
              href={`/evaluador/${evaluacionId}/escanear`}
              className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all group space-y-3 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Paso 2</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-800 transition-colors">Escanear Hojas</h3>
                <p className="text-xs text-slate-400 mt-1">Captura hojas con la cámara del celular o sube fotos. Procesa OMR automático.</p>
              </div>
            </Link>

            {/* Paso 3: Asignar Hojas y Corregir Desarrollo */}
            <Link
              href={`/evaluador/${evaluacionId}/desarrollo`}
              className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all group space-y-3 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Edit3 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Paso 3</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-purple-800 transition-colors">Corregir Desarrollo</h3>
                <p className="text-xs text-slate-400 mt-1">Ingresa puntajes de ítems de desarrollo con atajos de teclado y rúbrica.</p>
              </div>
            </Link>

            {/* Paso 4: Análisis por OA y Plan de Refuerzo */}
            <Link
              href={`/evaluador/${evaluacionId}/analisis`}
              className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all group space-y-3 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Paso 4</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-800 transition-colors">Análisis y Plan IA</h3>
                <p className="text-xs text-slate-400 mt-1">Revisa el logro por habilidad, niveles RTI y genera el Plan de Refuerzo con Claude.</p>
              </div>
            </Link>

            {/* Paso 5: Seguimiento Longitudinal */}
            <Link
              href={`/evaluador/${evaluacionId}/seguimiento`}
              className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all group space-y-3 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Paso 5</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-teal-800 transition-colors">Seguimiento de Aprendizaje</h3>
                <p className="text-xs text-slate-400 mt-1">Compara el avance antes vs después del plan de refuerzo.</p>
              </div>
            </Link>

          </div>

          {/* Resumen de Hojas Escaneadas */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Resultados Procesados ({totalEscaneados} hojas)
              </h3>
              <Link
                href={`/evaluador/${evaluacionId}/escanear`}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                + Escanear más hojas
              </Link>
            </div>

            {totalEscaneados === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <p className="text-xs font-bold">Aún no se han escaneado hojas para esta evaluación.</p>
                <p className="text-xs">Imprime la hoja de respuestas e inicia el escaneo con la cámara.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-3">Estudiante</th>
                      <th className="py-2.5 px-3">Puntaje Alt.</th>
                      <th className="py-2.5 px-3">Puntaje Des.</th>
                      <th className="py-2.5 px-3">Total Obtenido</th>
                      <th className="py-2.5 px-3">Porcentaje</th>
                      <th className="py-2.5 px-3">Nivel Logro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultados.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {r.estudiante?.nombre || `Hoja N° ${r.estudiante?.numero_lista || 'S/N'}`}
                        </td>
                        <td className="py-2.5 px-3">{r.puntaje_alternativas} pts</td>
                        <td className="py-2.5 px-3">{r.puntaje_desarrollo} pts</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{r.puntaje_total} / {evaluacion.puntaje_total} pts</td>
                        <td className="py-2.5 px-3 font-black text-slate-900">{r.porcentaje}%</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.nivel_logro === 'Logrado' ? 'bg-emerald-50 text-emerald-800' : r.nivel_logro === 'En proceso' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>
                            {r.nivel_logro}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
