'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Camera, Upload, ArrowLeft, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, FileCheck, Layers, Play
} from 'lucide-react';

export default function EscanearHojasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = use(params);
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<{ path: string; url: string; status: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [evaluacionId]);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setErrorMessage('No se pudo acceder a la cámara del dispositivo: ' + err.message + '. Puedes subir fotos usando la opción de galería.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadCapturedBlob(blob);
    }, 'image/jpeg', 0.92);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadCapturedBlob(files[i]);
    }
  };

  const uploadCapturedBlob = async (blob: Blob) => {
    const fileName = `hoja_${evaluacionId}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `${evaluacionId}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('hojas')
        .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

      if (error) {
        // Si el bucket no existe en local/dev, simular subida
        console.warn('Simulando upload local:', error.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('hojas')
        .getPublicUrl(filePath);

      const objectUrl = URL.createObjectURL(blob);

      setCapturedImages(prev => [
        ...prev,
        { path: filePath, url: publicUrlData.publicUrl || objectUrl, status: 'pendiente' }
      ]);
    } catch (err: any) {
      setErrorMessage('Error al subir la imagen: ' + err.message);
    }
  };

  const handleProcessOMR = async () => {
    if (capturedImages.length === 0) {
      setErrorMessage('Captura al menos una hoja antes de procesar con OMR.');
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    for (let i = 0; i < capturedImages.length; i++) {
      const img = capturedImages[i];
      if (img.status === 'completado') continue;

      try {
        const formData = new FormData();
        formData.append('evaluacion_id', evaluacionId);
        formData.append('imagen_path', img.path);
        formData.append('tipo_template', 'REI-30');

        const res = await fetch('/api/resultados/procesar-omr', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const json = await res.json();

        setCapturedImages(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: res.ok ? 'completado' : 'error' };
          return updated;
        });
      } catch (err) {
        console.error(err);
      }
    }

    setProcessing(false);
    router.push(`/evaluador/${evaluacionId}/desarrollo`);
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
              <h1 className="text-base font-black text-slate-800 leading-none">Escanear Hojas de Respuestas</h1>
              <p className="text-xs text-slate-400 mt-1">{evaluacion.curso} — {evaluacion.titulo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleProcessOMR}
            disabled={processing || capturedImages.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Procesar {capturedImages.length} Hojas con OMR
          </button>
        </header>

        <main className="p-6 max-w-5xl mx-auto w-full space-y-6">

          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-900 border border-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Area Cámara & Subida Galería */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  Cámara del Dispositivo
                </h3>
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Activar Cámara
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Detener Cámara
                  </button>
                )}
              </div>

              {/* Contenedor Video Cámara con Guía de Encuadre */}
              <div className="relative w-full h-[400px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                
                {!cameraActive && (
                  <div className="text-center space-y-3 p-6">
                    <div className="w-12 h-12 bg-slate-900 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Presiona <strong>&quot;Activar Cámara&quot;</strong> para capturar hojas en tiempo real desde tu celular o laptop.
                    </p>
                  </div>
                )}

                {/* Rectángulo de Encuadre Superpuesto */}
                {cameraActive && (
                  <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400"></div>
                      <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400"></div>
                    </div>
                    <p className="text-[11px] font-bold text-emerald-300 text-center bg-slate-900/60 px-3 py-1 rounded-full backdrop-blur-xs self-center">
                      Alinea los 4 marcadores dentro del recuadro
                    </p>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400"></div>
                      <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400"></div>
                    </div>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {cameraActive && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> Capturar Hoja Actual
                </button>
              )}
            </div>

            {/* Panel Galería & Subida de Archivos */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-700" />
                  Subida desde Galería
                </h3>
                <p className="text-xs text-slate-400">
                  ¿Tomaste fotos previamente? Puedes seleccionar múltiples archivos JPG/PNG desde tu dispositivo.
                </p>
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Seleccionar fotos de la galería</span>
                  <span className="text-[10px] text-slate-400 mt-1">Soporta múltiples fotos a la vez</span>
                  <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Lista de Hojas Capturadas */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Hojas Capturadas ({capturedImages.length})
                </span>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {capturedImages.map((img, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-700 truncate max-w-[140px]">Hoja #{i + 1}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${img.status === 'completado' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                        {img.status === 'completado' ? 'Procesada' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
