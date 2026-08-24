'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Users, Upload, Download, Plus, Trash2, ArrowLeft,
  CheckCircle2, AlertCircle, Loader2, FileSpreadsheet
} from 'lucide-react';
import Papa from 'papaparse';

interface EstudianteRow {
  numero_lista: number;
  nombre: string;
  rut: string;
}

export default function CursosPage() {
  const router = useRouter();
  const [curso, setCurso] = useState('8°A');
  const [estudiantes, setEstudiantes] = useState<EstudianteRow[]>([
    { numero_lista: 1, nombre: '', rut: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadCurso() {
      setLoading(true);
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      try {
        const res = await fetch(`/api/estudiantes/${encodeURIComponent(curso)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.estudiantes && data.estudiantes.length > 0) {
          setEstudiantes(data.estudiantes.map((e: any) => ({
            numero_lista: e.numero_lista,
            nombre: e.nombre,
            rut: e.rut || '',
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadCurso();
  }, [curso]);

  const handleDownloadTemplate = () => {
    const csvContent = 'numero_lista,nombre,rut\n1,Martina López,12.345.678-9\n2,Diego García,23.456.789-0\n3,Sofía Morales,22.111.333-4';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Plantilla_Estudiantes_${curso.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows: EstudianteRow[] = results.data.map((row: any, idx: number) => ({
          numero_lista: Number(row.numero_lista) || (idx + 1),
          nombre: row.nombre || row['Nombre completo'] || `Estudiante ${idx + 1}`,
          rut: row.rut || row['RUT'] || '',
        }));

        if (parsedRows.length > 0) {
          setEstudiantes(parsedRows);
          setMessage({ type: 'success', text: `Se cargaron ${parsedRows.length} estudiantes desde el archivo.` });
        }
      },
      error: (err) => {
        setMessage({ type: 'error', text: 'Error al leer el archivo CSV: ' + err.message });
      }
    });
  };

  const handleAddRow = () => {
    setEstudiantes(prev => [
      ...prev,
      { numero_lista: prev.length + 1, nombre: '', rut: '' }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setEstudiantes(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof EstudianteRow, value: any) => {
    setEstudiantes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveRoster = async () => {
    const validRows = estudiantes.filter(e => e.nombre.trim().length > 0);
    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'Ingresa al menos un estudiante con nombre válido.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch('/api/estudiantes/importar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          curso,
          estudiantes: validRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la lista');

      setMessage({ type: 'success', text: `¡Lista del curso ${curso} guardada exitosamente con ${validRows.length} estudiantes!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

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
              <h1 className="text-base font-black text-slate-800 leading-none">Gestión de Cursos y Estudiantes</h1>
              <p className="text-xs text-slate-400 mt-1">Registra las listas de curso para asociar los puntajes OMR automáticamente</p>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full space-y-6">

          {/* Selector de Curso */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Seleccionar o ingresar Curso</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={curso}
                    onChange={e => setCurso(e.target.value)}
                    placeholder="Ej: 8°A, 1° Medio B"
                    className="text-sm px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                  <select
                    onChange={e => setCurso(e.target.value)}
                    className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                  >
                    <option value="1° Básico">1° Básico</option>
                    <option value="2° Básico">2° Básico</option>
                    <option value="3° Básico">3° Básico</option>
                    <option value="4° Básico">4° Básico</option>
                    <option value="5° Básico">5° Básico</option>
                    <option value="6° Básico">6° Básico</option>
                    <option value="7° Básico">7° Básico</option>
                    <option value="8° Básico">8° Básico</option>
                    <option value="8°A">8°A</option>
                    <option value="8°B">8°B</option>
                    <option value="1° Medio">1° Medio</option>
                    <option value="2° Medio">2° Medio</option>
                    <option value="3° Medio">3° Medio</option>
                    <option value="4° Medio">4° Medio</option>
                  </select>
                </div>
              </div>

              {/* Botones de plantilla Excel y subida CSV */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Plantilla CSV
                </button>

                <label className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-200">
                  <Upload className="w-3.5 h-3.5" />
                  Subir Lista CSV
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          {message && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-red-700" />}
              {message.text}
            </div>
          )}

          {/* Tabla de Estudiantes */}
          <div className="bg-white rounded-2xl border border-slate-200/70 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Lista de Estudiantes ({estudiantes.length})
              </h3>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Estudiante
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-3 w-20">N° Lista</th>
                      <th className="py-2.5 px-3">Nombre Completo del Estudiante</th>
                      <th className="py-2.5 px-3 w-40">RUT (Opcional)</th>
                      <th className="py-2.5 px-3 w-12 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estudiantes.map((est, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={est.numero_lista}
                            onChange={e => handleRowChange(idx, 'numero_lista', Number(e.target.value))}
                            className="w-14 text-center font-bold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Ej: Martina López"
                            value={est.nombre}
                            onChange={e => handleRowChange(idx, 'nombre', e.target.value)}
                            className="w-full px-3 py-1 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-medium"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="12.345.678-9"
                            value={est.rut}
                            onChange={e => handleRowChange(idx, 'rut', e.target.value)}
                            className="w-full px-3 py-1 rounded-lg border border-slate-200 focus:outline-none text-slate-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
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
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveRoster}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Guardar Lista de {curso}
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
