'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  FileText, Upload, Plus, Trash2, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, Sparkles, FileCheck, HelpCircle
} from 'lucide-react';

interface PreguntaItem {
  numero: number;
  tipo: 'alternativa' | 'desarrollo';
  respuesta_correcta: string;
  oa_codigo: string;
  habilidad: string;
  puntaje_maximo: number;
}

export default function NuevaEvaluacionPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [curso, setCurso] = useState('8°A');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [preguntas, setPreguntas] = useState<PreguntaItem[]>([
    { numero: 1, tipo: 'alternativa', respuesta_correcta: 'A', oa_codigo: 'OA 1', habilidad: 'Conocimiento', puntaje_maximo: 1 },
    { numero: 2, tipo: 'alternativa', respuesta_correcta: 'B', oa_codigo: 'OA 1', habilidad: 'Comprensión', puntaje_maximo: 1 },
    { numero: 3, tipo: 'alternativa', respuesta_correcta: 'C', oa_codigo: 'OA 2', habilidad: 'Aplicación', puntaje_maximo: 1 },
    { numero: 4, tipo: 'desarrollo', respuesta_correcta: '', oa_codigo: 'OA 3', habilidad: 'Análisis', puntaje_maximo: 4 },
  ]);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipoDoc: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPdf(true);
    setPdfSuccessMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipoDoc);

    try {
      const res = await fetch('/api/evaluaciones/temp/subir-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error extrayendo datos del PDF');

      if (data.preguntas && data.preguntas.length > 0) {
        setPreguntas(data.preguntas);
        setPdfSuccessMessage(`¡PDF de ${tipoDoc} procesado con éxito! Se extrajeron ${data.preguntas.length} preguntas.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleAddQuestion = () => {
    setPreguntas(prev => [
      ...prev,
      {
        numero: prev.length + 1,
        tipo: 'alternativa',
        respuesta_correcta: 'A',
        oa_codigo: 'OA 1',
        habilidad: 'Comprensión',
        puntaje_maximo: 1,
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setPreguntas(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof PreguntaItem, value: any) => {
    setPreguntas(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveEvaluation = async () => {
    if (!titulo.trim() || !curso.trim() || preguntas.length === 0) {
      setError('Por favor completa el título, curso e ingresa al menos una pregunta.');
      return;
    }

    setSaving(true);
    setError(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          titulo,
          curso,
          fecha,
          preguntas,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la evaluación');

      router.push(`/evaluador/${data.evaluacion_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalAlternativas = preguntas.filter(p => p.tipo === 'alternativa').length;
  const totalDesarrollo = preguntas.filter(p => p.tipo === 'desarrollo').length;
  const puntajeTotal = preguntas.reduce((sum, p) => sum + (Number(p.puntaje_maximo) || 1), 0);

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
              <h1 className="text-base font-black text-slate-800 leading-none">Crear Nueva Evaluación</h1>
              <p className="text-xs text-slate-400 mt-1">Configura las preguntas, OAs y habilidades para generar la hoja OMR</p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">

          {/* Formulario Metadatos */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">1. Datos Generales de la Evaluación</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Título de la Evaluación</label>
                <input
                  type="text"
                  placeholder="Ej: Prueba Diagnóstica Unidad 1, Evaluación Sumativa Matemáticas"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Curso</label>
                <input
                  type="text"
                  placeholder="Ej: 8°A, 3°B, Kínder, Nivel 1"
                  value={curso}
                  onChange={e => setCurso(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Subida Opcional de Documentos PDF */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                2. Extraer datos automáticamente desde PDFs (Opcional)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Sube la prueba o pauta en PDF y REÍ extraerá la pauta de preguntas y OAs automáticamente.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'prueba', label: 'Prueba / Evaluación PDF' },
                { id: 'tabla', label: 'Tabla Especificaciones' },
                { id: 'pauta', label: 'Clave / Pauta Respuestas' },
                { id: 'rubrica', label: 'Rúbrica Desarrollo' },
              ].map(item => (
                <label key={item.id} className="p-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Examinar PDF</span>
                  <input type="file" accept=".pdf" onChange={e => handlePdfUpload(e, item.id)} className="hidden" />
                </label>
              ))}
            </div>

            {uploadingPdf && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando PDF y extrayendo preguntas...
              </div>
            )}

            {pdfSuccessMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                {pdfSuccessMessage}
              </div>
            )}
          </div>

          {/* Tabla de Estructuración Manual de Preguntas */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">3. Tabla de Preguntas ({preguntas.length})</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {totalAlternativas} alternativas | {totalDesarrollo} desarrollo | <span className="font-bold text-slate-700">{puntajeTotal} pts totales</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Pregunta
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3 w-16">N°</th>
                    <th className="py-2.5 px-3 w-32">Tipo</th>
                    <th className="py-2.5 px-3 w-28">Clave</th>
                    <th className="py-2.5 px-3 w-32">Objetivo (OA)</th>
                    <th className="py-2.5 px-3">Habilidad Pedagógica</th>
                    <th className="py-2.5 px-3 w-24">Puntaje Máx</th>
                    <th className="py-2.5 px-3 w-12 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preguntas.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-800">{p.numero}.</td>
                      <td className="py-2 px-3">
                        <select
                          value={p.tipo}
                          onChange={e => handleQuestionChange(idx, 'tipo', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium focus:outline-none"
                        >
                          <option value="alternativa">Alternativa</option>
                          <option value="desarrollo">Desarrollo</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        {p.tipo === 'alternativa' ? (
                          <select
                            value={p.respuesta_correcta}
                            onChange={e => handleQuestionChange(idx, 'respuesta_correcta', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold text-emerald-800 focus:outline-none"
                          >
                            <option value="A">Opción A</option>
                            <option value="B">Opción B</option>
                            <option value="C">Opción C</option>
                            <option value="D">Opción D</option>
                          </select>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">— Rúbrica —</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={p.oa_codigo}
                          onChange={e => handleQuestionChange(idx, 'oa_codigo', e.target.value)}
                          placeholder="OA 3"
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 focus:outline-none font-bold"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={p.habilidad}
                          onChange={e => handleQuestionChange(idx, 'habilidad', e.target.value)}
                          placeholder="Ej: Comprensión, Análisis, Aplicación..."
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 font-medium focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={p.puntaje_maximo}
                          onChange={e => handleQuestionChange(idx, 'puntaje_maximo', Number(e.target.value))}
                          className="w-16 text-center font-bold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-900 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700" />
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveEvaluation}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Guardar y Generar Hoja OMR
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
