'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Edit3, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Loader2, Save, Users, ChevronDown, ChevronUp
} from 'lucide-react';

export default function CorregirDesarrolloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [preguntasDesarrollo, setPreguntasDesarrollo] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [showRubric, setShowRubric] = useState(false);

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
          const des = (json.preguntas || []).filter((p: any) => p.tipo === 'desarrollo');
          setPreguntasDesarrollo(des);
          setResultados(json.resultados || []);

          if (json.resultados?.length > 0) {
            setScores(json.resultados[0].puntajes_desarrollo || {});
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

  const currentResultado = resultados[currentIndex] || null;

  useEffect(() => {
    if (currentResultado) {
      setScores(currentResultado.puntajes_desarrollo || {});
    }
  }, [currentIndex, resultados]);

  // Atajos de teclado (Teclas 0-4 para seleccionar puntaje, Flechas para navegar)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['0', '1', '2', '3', '4'].includes(e.key) && preguntasDesarrollo.length > 0) {
        const pNum = preguntasDesarrollo[0].numero.toString();
        const scoreVal = parseInt(e.key, 10);
        handleScoreChange(pNum, scoreVal);
      } else if (e.key === 'ArrowRight') {
        handleNextStudent();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStudent();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, resultados, preguntasDesarrollo, scores]);

  const handleScoreChange = (pregNum: string, score: number) => {
    setScores(prev => ({ ...prev, [pregNum]: score }));
  };

  const saveCurrentStudentScores = async () => {
    if (!currentResultado) return;
    setSaving(true);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      await fetch(`/api/resultados/${currentResultado.id}/desarrollo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          puntajes_desarrollo: scores,
        }),
      });
    } catch (err) {
      console.error('Error guardando puntaje:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNextStudent = async () => {
    await saveCurrentStudentScores();
    if (currentIndex < resultados.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevStudent = async () => {
    await saveCurrentStudentScores();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
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
              <h1 className="text-base font-black text-slate-800 leading-none">Corrección de Preguntas de Desarrollo</h1>
              <p className="text-xs text-slate-400 mt-1">{evaluacion.curso} — {evaluacion.titulo}</p>
            </div>
          </div>
          <Link
            href={`/evaluador/${evaluacionId}/analisis`}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Ver Análisis del Curso <ArrowRight className="w-4 h-4" />
          </Link>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">

          {resultados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center space-y-3">
              <p className="text-sm font-bold text-slate-800">No hay hojas procesadas para corregir desarrollo.</p>
              <Link href={`/evaluador/${evaluacionId}/escanear`} className="text-xs font-bold text-emerald-700 underline">
                Escanear hojas primero
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-6 shadow-2xs">
              
              {/* Barra Estudiante Actual */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estudiante ({currentIndex + 1} de {resultados.length})</span>
                  <h3 className="text-base font-black text-slate-800">
                    {currentResultado?.estudiante?.nombre || `Hoja N° ${currentResultado?.estudiante?.numero_lista || (currentIndex + 1)}`}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevStudent}
                    disabled={currentIndex === 0}
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStudent}
                    disabled={currentIndex === resultados.length - 1}
                    className="px-3 py-2 bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>

              {/* Foto recortada de la respuesta si está disponible */}
              {currentResultado?.imagen_url && (
                <div className="p-4 bg-slate-900 rounded-xl text-center space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Captura Manuscrita del Estudiante</span>
                  <img
                    src={currentResultado.imagen_url}
                    alt="Hoja del estudiante"
                    className="max-h-64 mx-auto rounded-lg border border-slate-800 shadow-md object-contain"
                  />
                </div>
              )}

              {/* Lista de Preguntas de Desarrollo */}
              {preguntasDesarrollo.length === 0 ? (
                <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold">
                  Esta evaluación no contiene preguntas de desarrollo. Todas son alternativas OMR.
                </div>
              ) : (
                <div className="space-y-6">
                  {preguntasDesarrollo.map(p => {
                    const pregKey = p.numero.toString();
                    const maxScore = p.puntaje_maximo || 4;
                    const currentScore = scores[pregKey] ?? 0;

                    return (
                      <div key={p.id} className="p-5 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Pregunta {p.numero} — Desarrollo
                            </span>
                            <span className="text-xs text-slate-500 ml-2">({p.habilidad} • {p.oa_codigo || 'OA General'})</span>
                          </div>
                          <span className="text-xs font-black text-slate-800">Máx: {maxScore} pts</span>
                        </div>

                        {/* Botones Selector de Puntajes */}
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs font-bold text-slate-500">Puntaje Asignado:</span>
                          {Array.from({ length: maxScore + 1 }).map((_, pt) => (
                            <button
                              key={pt}
                              type="button"
                              onClick={() => handleScoreChange(pregKey, pt)}
                              className={`w-10 h-10 rounded-xl font-black text-sm transition-all cursor-pointer border ${currentScore === pt ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-700/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                            >
                              {pt}
                            </button>
                          ))}
                        </div>

                        {/* Rúbrica Desplegable */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setShowRubric(!showRubric)}
                            className="text-[11px] font-bold text-slate-500 flex items-center gap-1 hover:text-slate-800"
                          >
                            {showRubric ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {showRubric ? 'Ocultar Criterios de Rúbrica' : 'Ver Criterios de Rúbrica'}
                          </button>

                          {showRubric && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                              <p className="font-bold text-slate-800">Criterios de Corrección:</p>
                              <p>• {maxScore} pts: Responde de forma completa, precisa y argumentada con evidencia del texto.</p>
                              <p>• {Math.floor(maxScore / 2)} pts: Responde parcialmente o falta fundamentación textual.</p>
                              <p>• 0 pts: No responde o respuesta errónea.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pie de Página Guardado */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Puntaje Total Estudiante: <strong className="text-slate-800">{(currentResultado?.puntaje_alternativas || 0) + Object.values(scores).reduce((a, b) => a + b, 0)} pts</strong></span>
                <button
                  type="button"
                  onClick={saveCurrentStudentScores}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Puntaje
                </button>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
