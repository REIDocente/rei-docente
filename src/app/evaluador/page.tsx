'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ClipboardCheck, Plus, Users, FileText, BarChart3,
  Search, ArrowRight, Loader2, Calendar, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

export default function EvaluadorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurso, setSelectedCurso] = useState<string>('todos');

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      try {
        const res = await fetch('/api/evaluaciones', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.evaluaciones) {
          setEvaluaciones(data.evaluaciones);
        }
      } catch (err) {
        console.error('Error cargando evaluaciones:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const cursosUnicos = Array.from(new Set(evaluaciones.map(e => e.curso)));

  const filteredEvaluaciones = evaluaciones.filter(e => {
    const matchSearch = e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.curso.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCurso = selectedCurso === 'todos' || e.curso === selectedCurso;
    return matchSearch && matchCurso;
  });

  const totalEvaluaciones = evaluaciones.length;
  const totalCorregidas = evaluaciones.filter(e => e.estado === 'corregida').length;
  const totalEstudiantesEvaluados = evaluaciones.reduce((sum, e) => sum + (e.resultados?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-700 flex font-sans antialiased">
      <Sidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/70 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-800 leading-none">Módulo REÍ Evaluador IA</h1>
              <p className="text-xs text-slate-400 mt-1">Evaluación diagnóstica, OMR y análisis RTI por OA y habilidad</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/evaluador/cursos"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Gestión de Cursos
            </Link>
            <Link
              href="/evaluador/nueva"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Evaluación
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">

          {/* Cards Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Evaluaciones</p>
                <p className="text-2xl font-black text-slate-800">{totalEvaluaciones}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluaciones Corregidas</p>
                <p className="text-2xl font-black text-slate-800">{totalCorregidas}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estudiantes Evaluados</p>
                <p className="text-2xl font-black text-slate-800">{totalEstudiantesEvaluados}</p>
              </div>
            </div>
          </div>

          {/* Controles de Búsqueda y Filtro */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar evaluación o curso..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500">Filtrar curso:</span>
              <select
                value={selectedCurso}
                onChange={e => setSelectedCurso(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
              >
                <option value="todos">Todos los cursos</option>
                {cursosUnicos.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Evaluaciones */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
              <p className="text-xs font-bold">Cargando evaluaciones...</p>
            </div>
          ) : filteredEvaluaciones.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <ClipboardCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No hay evaluaciones registradas</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Crea tu primera evaluación para generar hojas de respuestas imprimibles, corregir con la cámara del celular y obtener análisis de aprendizaje.
                </p>
              </div>
              <Link
                href="/evaluador/nueva"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Evaluación Ahora
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvaluaciones.map(ev => {
                const nResp = ev.resultados?.length || 0;
                return (
                  <div key={ev.id} className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {ev.curso}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ev.estado === 'corregida' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {ev.estado === 'corregida' ? 'Corregida' : 'Activa'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-2">{ev.titulo}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ev.fecha}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {ev.total_alternativas + ev.total_desarrollo} preg.</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">{nResp}</span> <span className="text-slate-400">hojas escaneadas</span>
                      </div>
                      <Link
                        href={`/evaluador/${ev.id}`}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        Abrir Módulo <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
