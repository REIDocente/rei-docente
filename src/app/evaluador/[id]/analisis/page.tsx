'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  BarChart3, Sparkles, ArrowLeft, Download, Loader2, CheckCircle2, AlertTriangle, FileText, Users
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Packer, Document, Paragraph, TextRun, HeadingLevel } from 'docx';

export default function AnalisisCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [analisis, setAnalisis] = useState<any>(null);

  const [calculating, setCalculating] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planRefuerzo, setPlanRefuerzo] = useState<string | null>(null);

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
          setAnalisis(json.analisis);
          if (json.analisis?.plan_refuerzo) {
            setPlanRefuerzo(json.analisis.plan_refuerzo);
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

  const handleCalculateAnalysis = async () => {
    setCalculating(true);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch(`/api/analisis/${evaluacionId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.analisis) {
        setAnalisis(json.analisis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const handleGenerateAIPlan = async () => {
    setGeneratingPlan(true);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch(`/api/analisis/${evaluacionId}/refuerzo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.plan_refuerzo) {
        setPlanRefuerzo(json.plan_refuerzo);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleDownloadPlanPdf = () => {
    if (!planRefuerzo) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`PLAN DE REFUERZO PEDAGÓGICO REÍ — ${evaluacion?.curso}`, 15, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(planRefuerzo.replace(/#/g, ''), 180);
    doc.text(lines, 15, 30);
    doc.save(`Plan_Refuerzo_${evaluacion?.curso.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadPlanWord = async () => {
    if (!planRefuerzo) return;

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text: `PLAN DE REFUERZO PEDAGÓGICO REÍ — ${evaluacion?.curso}`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [new TextRun({ text: planRefuerzo, size: 22 })],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Plan_Refuerzo_${evaluacion?.curso.replace(/\s+/g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(url);
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

  const porHab = analisis?.resultados_por_habilidad || {};
  const porOA = analisis?.resultados_por_oa || {};
  const rti1 = analisis?.rti_nivel1 || [];
  const rti2 = analisis?.rti_nivel2 || [];
  const rti3 = analisis?.rti_nivel3 || [];

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
              <h1 className="text-base font-black text-slate-800 leading-none">Análisis del Curso y Plan de Refuerzo IA</h1>
              <p className="text-xs text-slate-400 mt-1">{evaluacion.curso} — {evaluacion.titulo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCalculateAnalysis}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Recalcular Análisis
          </button>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">

          {!analisis ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">El análisis del curso aún no ha sido generado</h3>
                <p className="text-xs text-slate-400 mt-1">Presiona el botón para procesar el logro por Habilidad, OA y clasificación RTI.</p>
              </div>
              <button
                type="button"
                onClick={handleCalculateAnalysis}
                disabled={calculating}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {calculating ? 'Calculando...' : 'Generar Análisis del Curso'}
              </button>
            </div>
          ) : (
            <>
              {/* Gráficos de Logro por Habilidad */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">1. Logro por Habilidad Pedagógica</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'literal', label: 'Literal (Localizar información)' },
                    { key: 'inferencial', label: 'Inferencial (Relacionar e interpretar)' },
                    { key: 'interpretativo', label: 'Interpretativo (Reflexionar)' },
                    { key: 'argumentativo', label: 'Argumentativo (Evaluar críticamente)' },
                  ].map(hab => {
                    const rate = porHab[hab.key] || 0;
                    const pct = Math.round(rate * 100);
                    const isLow = pct < 60;

                    return (
                      <div key={hab.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-800">{hab.label}</span>
                          <span className={isLow ? 'text-amber-600' : 'text-emerald-700'}>{pct}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-gradient-to-r from-amber-400 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logro por OA y Clasificación RTI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Logro por OA */}
                <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">2. Logro por Objetivo (OA)</h3>
                  <div className="space-y-3">
                    {Object.entries(porOA).map(([cod, item]: [string, any]) => {
                      const pct = Math.round((item.logro || 0) * 100);
                      return (
                        <div key={cod} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{cod}</span>
                          <span className={`px-2.5 py-1 rounded-lg font-black ${pct < 50 ? 'bg-red-50 text-red-700' : pct < 70 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-800'}`}>
                            {pct}% logro
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Clasificación RTI */}
                <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">3. Clasificación RTI (Prioridad Refuerzo)</h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-black text-red-900 uppercase">🔴 Nivel 3 — Intervención Específica ({rti3.length})</span>
                      <p className="text-xs text-red-800">{rti3.join(', ') || 'Sin estudiantes bajo 40%'}</p>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-black text-amber-900 uppercase">🟡 Nivel 2 — Grupo Apoyo Adicional ({rti2.length})</span>
                      <p className="text-xs text-amber-800">{rti2.join(', ') || 'Sin estudiantes entre 40% y 60%'}</p>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-black text-emerald-900 uppercase">🟢 Nivel 1 — Refuerzo Curso Completo ({rti1.length})</span>
                      <p className="text-xs text-emerald-800">Estudiantes alcanzando nivel estándar</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Generador Plan de Refuerzo IA */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      4. Plan de Refuerzo Pedagógico IA (Claude Sonnet)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Estrategias diferenciadas en 2 semanas basadas en los resultados reales del curso.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {planRefuerzo && (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadPlanWord}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Exportar Word
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadPlanPdf}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Exportar PDF
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleGenerateAIPlan}
                      disabled={generatingPlan}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {generatingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {planRefuerzo ? 'Regenerar Plan' : 'Generar Plan de Refuerzo'}
                    </button>
                  </div>
                </div>

                {generatingPlan && (
                  <div className="py-12 text-center space-y-2 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-700" />
                    <p className="text-xs font-bold">Claude Sonnet está diseñando el plan de refuerzo en 2 semanas...</p>
                  </div>
                )}

                {planRefuerzo && !generatingPlan && (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {planRefuerzo}
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
