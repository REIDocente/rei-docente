'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { drawHojaPdf } from '@/lib/templates/drawHojaPdf';
import {
  Printer, ArrowLeft, Download, Loader2, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';

export default function HojaRespuestasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

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
          setPreguntas(json.preguntas || []);

          // Generar preview PDF automáticamente
          const pdfDoc = await drawHojaPdf({
            evaluacionId,
            titulo: json.evaluacion.titulo,
            curso: json.evaluacion.curso,
            fecha: json.evaluacion.fecha,
            preguntas: json.preguntas || [],
            totalAlternativas: json.evaluacion.total_alternativas,
            totalDesarrollo: json.evaluacion.total_desarrollo,
          });

          const blob = pdfDoc.output('blob');
          const url = URL.createObjectURL(blob);
          setPdfPreviewUrl(url);
        }
      } catch (err) {
        console.error('Error generando hoja PDF:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [evaluacionId]);

  const handleDownloadPdf = async () => {
    if (!evaluacion) return;
    setGeneratingPdf(true);
    try {
      const pdfDoc = await drawHojaPdf({
        evaluacionId,
        titulo: evaluacion.titulo,
        curso: evaluacion.curso,
        fecha: evaluacion.fecha,
        preguntas,
        totalAlternativas: evaluacion.total_alternativas,
        totalDesarrollo: evaluacion.total_desarrollo,
      });

      pdfDoc.save(`REI_Hoja_Respuestas_${evaluacion.curso.replace(/\s+/g, '_')}_${evaluacion.titulo.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error descargando el PDF de la hoja de respuestas.');
    } finally {
      setGeneratingPdf(false);
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
              <h1 className="text-base font-black text-slate-800 leading-none">Hoja de Respuestas OMR Imprimible</h1>
              <p className="text-xs text-slate-400 mt-1">{evaluacion.curso} — {evaluacion.titulo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Descargar PDF para Imprimir
          </button>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Instrucciones para Impresión y Fotocopiado</h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                1. Descarga el PDF generado abajo e imprímelo en hoja tamaño <strong>Carta u Oficio (A4)</strong>.<br />
                2. Fotocopia la hoja para todos tus estudiantes. Asegúrate de que los <strong>4 cuadrados negros de las esquinas</strong> queden completos e intactos.<br />
                3. Pide a tus estudiantes que rellenen las burbujas A, B, C, D con <strong>lápiz pasta o grafito negro</strong> y escriban su N° de lista.
              </p>
            </div>
          </div>

          {/* PDF Visual Preview Canvas / Iframe */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs flex flex-col items-center space-y-4">
            <h3 className="text-sm font-bold text-slate-800 self-start">Vista Previa de la Hoja de Respuestas</h3>
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-[750px] rounded-xl border border-slate-200 shadow-inner"
                title="Vista previa PDF"
              />
            ) : (
              <div className="py-24 text-slate-400">Generando vista previa...</div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
