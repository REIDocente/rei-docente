'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Loader2,
  Sparkle,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  FileText,
  FileDown,
  Info,
  Sliders,
  Trash2,
  Clock,
  Plus,
  ClipboardCheck,
  Check,
  Star,
  AlertTriangle,
  Lock,
  Zap,
  X,
  Camera,
  User,
  PlusCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { drawPlanMejoraWord } from '@/lib/templates/drawPlanMejoraWord';
import { Packer } from 'docx';

// --- Types ---
interface SkillRow {
  habilidad: string;
  preguntas: string;
  puntaje: number;
}

interface RubricRow {
  criterio: string;
  logrado: string;
  en_proceso: string;
  por_lograr: string;
}

interface StudentResult {
  id: string;
  nombre: string;
  respuestas_sm: Record<string, string>; // e.g. { "1": "A", "2": "C" }
  respuestas_desarrollo: Record<string, number>; // e.g. { "21": 3 }
  rubrica?: Record<number, string>; // e.g. { 0: 'logrado' }
}

const COURSES = ['5°B', '6°B', '7°B', '8°B', '1°M', '2°M'];

export default function AnalizarPage() {
  const router = useRouter();
  
  // --- Navigation & Auth ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [analisisId, setAnalisisId] = useState<string | null>(null);

  // --- Step 1 Form States ---
  const [titulo, setTitulo] = useState('Análisis de Evaluación');
  const [nivel, setNivel] = useState('5°B');
  const [establecimiento, setEstablecimiento] = useState('');
  const [nombreDocente, setNombreDocente] = useState('');
  const [nPreguntasSM, setNPreguntasSM] = useState(20);
  const [nPreguntasDesarrollo, setNPreguntasDesarrollo] = useState(0);

  const [pautaSM, setPautaSM] = useState<Record<string, string>>({});
  const [pautaDesarrollo, setPautaDesarrollo] = useState<Record<string, number>>({});

  const [skills, setSkills] = useState<SkillRow[]>([{ habilidad: '', preguntas: '', puntaje: 0 }]);
  const [rubric, setRubric] = useState<RubricRow[]>([{ criterio: '', logrado: '', en_proceso: '', por_lograr: '' }]);

  // --- Step 2 States ---
  const [rawStudentNames, setRawStudentNames] = useState('');
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [studentLoading, setStudentLoading] = useState<Record<string, boolean>>({});
  const [savingResults, setSavingResults] = useState(false);

  // --- Step 3 & 4 States ---
  const [resultsTab, setResultsTab] = useState<'curso' | 'estudiante'>('curso');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [sortField, setSortField] = useState<'nombre' | 'nota' | 'porcentaje'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- Auth Check ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
        setNombreDocente(name);
      }
      setAuthLoading(false);
    });
  }, [router]);

  // --- Pauta Sync on Counts Change ---
  useEffect(() => {
    // Sync SM pauta
    setPautaSM(prev => {
      const updated = { ...prev };
      for (let i = 1; i <= nPreguntasSM; i++) {
        if (!updated[String(i)]) {
          updated[String(i)] = 'A';
        }
      }
      return updated;
    });

    // Sync Desarrollo pauta
    setPautaDesarrollo(prev => {
      const updated = { ...prev };
      for (let i = 1; i <= nPreguntasDesarrollo; i++) {
        const qIndex = nPreguntasSM + i;
        if (!updated[String(qIndex)]) {
          updated[String(qIndex)] = 3; // Default max 3 points
        }
      }
      return updated;
    });
  }, [nPreguntasSM, nPreguntasDesarrollo]);

  // --- Calculations for Students ---
  const studentsWithStats = useMemo(() => {
    return students.map(student => {
      let puntaje_sm = 0;
      for (let i = 1; i <= nPreguntasSM; i++) {
        const qKey = String(i);
        if (student.respuestas_sm[qKey] === pautaSM[qKey]) {
          puntaje_sm += 1;
        }
      }

      let puntaje_desarrollo = 0;
      for (let i = 1; i <= nPreguntasDesarrollo; i++) {
        const qKey = String(nPreguntasSM + i);
        puntaje_desarrollo += Number(student.respuestas_desarrollo[qKey]) || 0;
      }

      const puntaje_total = puntaje_sm + puntaje_desarrollo;

      let maxPossible = nPreguntasSM * 1;
      for (let i = 1; i <= nPreguntasDesarrollo; i++) {
        const qKey = String(nPreguntasSM + i);
        maxPossible += Number(pautaDesarrollo[qKey]) || 1;
      }

      const porcentaje_logro = maxPossible > 0 ? (puntaje_total / maxPossible) * 100 : 0;

      let nota = 1.0;
      if (porcentaje_logro < 60) {
        nota = 1.0 + 3.0 * (porcentaje_logro / 60);
      } else {
        nota = 4.0 + 3.0 * ((porcentaje_logro - 60) / 40);
      }
      nota = Math.max(1.0, Math.min(7.0, Math.round(nota * 10) / 10));

      return {
        ...student,
        puntaje_sm,
        puntaje_desarrollo,
        puntaje_total,
        porcentaje_logro,
        nota,
        maxPossible
      };
    });
  }, [students, nPreguntasSM, nPreguntasDesarrollo, pautaSM, pautaDesarrollo]);

  // --- Course Level Stats ---
  const courseStats = useMemo(() => {
    if (studentsWithStats.length === 0) return null;

    const grades = studentsWithStats.map(s => s.nota);
    const pcts = studentsWithStats.map(s => s.porcentaje_logro);

    const avgGrade = (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1);
    const avgPct = (pcts.reduce((sum, p) => sum + p, 0) / pcts.length).toFixed(1);

    const aboveFour = studentsWithStats.filter(s => s.nota >= 4.0).length;
    const belowFour = studentsWithStats.filter(s => s.nota < 4.0).length;

    // Notes distribution ranges
    const dist = {
      insuficiente_muy: grades.filter(g => g < 3.0).length,
      insuficiente: grades.filter(g => g >= 3.0 && g < 4.0).length,
      suficiente: grades.filter(g => g >= 4.0 && g < 5.5).length,
      bueno: grades.filter(g => g >= 5.5 && g < 6.5).length,
      excelente: grades.filter(g => g >= 6.5).length
    };

    // Question stats
    const totalQuestions = nPreguntasSM + nPreguntasDesarrollo;
    const questionLogro = Array.from({ length: totalQuestions }).map((_, qIdx) => {
      const qNum = qIdx + 1;
      const qKey = String(qNum);
      let earned = 0;
      let possible = 0;

      studentsWithStats.forEach(est => {
        if (qNum <= nPreguntasSM) {
          possible += 1;
          earned += est.respuestas_sm[qKey] === pautaSM[qKey] ? 1 : 0;
        } else {
          possible += pautaDesarrollo[qKey] || 1;
          earned += Number(est.respuestas_desarrollo[qKey]) || 0;
        }
      });

      const pct = possible > 0 ? (earned / possible) * 100 : 0;
      return { qNum, pct };
    });

    // Skill stats
    const skillStats = skills.filter(s => s.habilidad.trim()).map(skill => {
      const qNums = skill.preguntas.split(',').map(s => s.trim()).filter(Boolean);
      let earned = 0;
      let possible = 0;

      studentsWithStats.forEach(est => {
        qNums.forEach(qNum => {
          if (Number(qNum) <= nPreguntasSM) {
            possible += 1;
            earned += est.respuestas_sm[qNum] === pautaSM[qNum] ? 1 : 0;
          } else {
            possible += pautaDesarrollo[qNum] || 1;
            earned += Number(est.respuestas_desarrollo[qNum]) || 0;
          }
        });
      });

      const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
      return { habilidad: skill.habilidad, pct };
    });

    return {
      avgGrade,
      avgPct,
      aboveFour,
      belowFour,
      dist,
      questionLogro,
      skills: skillStats
    };
  }, [studentsWithStats, nPreguntasSM, nPreguntasDesarrollo, pautaSM, pautaDesarrollo, skills]);

  // --- Sorted Students ---
  const sortedStudents = useMemo(() => {
    const list = [...studentsWithStats];
    list.sort((a, b) => {
      let valA: any = a.nombre;
      let valB: any = b.nombre;
      if (sortField === 'nota') {
        valA = a.nota;
        valB = b.nota;
      } else if (sortField === 'porcentaje') {
        valA = a.porcentaje_logro;
        valB = b.porcentaje_logro;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [studentsWithStats, sortField, sortDirection]);

  // --- Step 1 Handlers ---
  const handleAddSkill = () => {
    if (skills.length >= 8) return;
    setSkills([...skills, { habilidad: '', preguntas: '', puntaje: 0 }]);
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSkillChange = (index: number, field: keyof SkillRow, value: any) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const handleAddRubric = () => {
    if (rubric.length >= 6) return;
    setRubric([...rubric, { criterio: '', logrado: '', en_proceso: '', por_lograr: '' }]);
  };

  const handleRemoveRubric = (index: number) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  const handleRubricChange = (index: number, field: keyof RubricRow, value: string) => {
    const updated = [...rubric];
    updated[index] = { ...updated[index], [field]: value };
    setRubric(updated);
  };

  const handleSaveStep1 = async () => {
    if (!titulo.trim()) {
      alert('Por favor, ingresa un título para el análisis.');
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const payload = {
        titulo: titulo.trim(),
        nivel,
        establecimiento: establecimiento.trim(),
        nombre_docente: nombreDocente.trim(),
        n_preguntas_sm: nPreguntasSM,
        n_preguntas_desarrollo: nPreguntasDesarrollo,
        pauta_json: { sm: pautaSM, desarrollo: pautaDesarrollo },
        tabla_especificaciones_json: skills.filter(s => s.habilidad.trim()),
        rubrica_json: rubric.filter(r => r.criterio.trim()),
        user_id: user?.id || '00000000-0000-0000-0000-000000000000'
      };

      const { data, error } = await supabase
        .from('analisis_evaluaciones')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      setAnalisisId(data.id);
      setStep(2);
    } catch (e: any) {
      console.error(e);
      alert('Error al guardar la evaluación: ' + e.message);
    }
  };

  // --- Step 2 Handlers ---
  const handleLoadStudents = () => {
    const lines = rawStudentNames.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 45) {
      alert('El máximo permitido es 45 estudiantes. Se importarán solo los primeros 45.');
    }
    const finalLines = lines.slice(0, 45);
    const newStudents: StudentResult[] = finalLines.map(name => ({
      id: Math.random().toString(36).substring(2),
      nombre: name,
      respuestas_sm: {},
      respuestas_desarrollo: {}
    }));
    setStudents(newStudents);
  };

  const updateStudentDesarrolloScore = (index: number, qKey: string, score: number) => {
    const updated = [...students];
    updated[index].respuestas_desarrollo = {
      ...updated[index].respuestas_desarrollo,
      [qKey]: score
    };
    setStudents(updated);
  };

  const updateStudentRubricLevel = (index: number, criterionIdx: number, level: string) => {
    const updated = [...students];
    const rub = updated[index].rubrica || {};
    updated[index].rubrica = {
      ...rub,
      [criterionIdx]: level
    };
    setStudents(updated);
  };

  const handleCameraCapture = async (index: number, file: File) => {
    const updatedLoading = { ...studentLoading, [students[index].id]: true };
    setStudentLoading(updatedLoading);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch('/api/evaluaciones/analizar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            action: 'vision',
            image: base64,
            n_preguntas_sm: nPreguntasSM
          })
        });

        if (res.ok) {
          const data = await res.json();
          const parsedAnswers = data.respuestas || {};

          // Clean answers to match A/B/C/D upper case
          const clean: Record<string, string> = {};
          Object.keys(parsedAnswers).forEach(k => {
            const val = String(parsedAnswers[k]).toUpperCase().trim();
            if (['A', 'B', 'C', 'D'].includes(val)) {
              clean[k] = val;
            }
          });

          const updatedStudents = [...students];
          updatedStudents[index].respuestas_sm = clean;
          setStudents(updatedStudents);
        } else {
          alert('Error al procesar la hoja con Claude Vision.');
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      alert('Error al leer el archivo de imagen.');
    } finally {
      const finishedLoading = { ...studentLoading };
      delete finishedLoading[students[index].id];
      setStudentLoading(finishedLoading);
    }
  };

  const handleSaveStep2 = async () => {
    if (students.length === 0) {
      alert('Debes ingresar al menos un estudiante.');
      return;
    }
    setSavingResults(true);

    try {
      const rows = studentsWithStats.map(s => ({
        analisis_id: analisisId,
        nombre_estudiante: s.nombre,
        respuestas_json: { sm: s.respuestas_sm, desarrollo: s.respuestas_desarrollo, rubrica: s.rubrica || {} },
        puntaje_sm: s.puntaje_sm,
        puntaje_desarrollo: s.puntaje_desarrollo,
        puntaje_total: s.puntaje_total,
        porcentaje_logro: s.porcentaje_logro,
        nota: s.nota
      }));

      // Clear previous results of this analysis if any
      await supabase
        .from('resultados_estudiantes')
        .delete()
        .eq('analisis_id', analisisId);

      const { error } = await supabase
        .from('resultados_estudiantes')
        .insert(rows);

      if (error) throw error;
      setStep(3);
    } catch (e: any) {
      console.error(e);
      alert('Error al guardar las respuestas: ' + e.message);
    } finally {
      setSavingResults(false);
    }
  };

  // --- Step 4 Handlers ---
  const handleGeneratePlanMejora = async () => {
    setGeneratingPlan(true);
    setPlanError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      // Stats wrapper
      const payloadStats = {
        nivel,
        titulo,
        totalEstudiantes: studentsWithStats.length,
        avgGrade: courseStats?.avgGrade,
        avgPct: courseStats?.avgPct,
        belowFour: courseStats?.belowFour,
        habilidades: courseStats?.skills,
        estudiantes: studentsWithStats.map(s => ({
          nombre_estudiante: s.nombre,
          nota: s.nota,
          porcentaje_logro: s.porcentaje_logro
        }))
      };

      const res = await fetch('/api/evaluaciones/analizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'plan_mejora',
          analisisId,
          stats: payloadStats
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.error?.includes('Límite')) {
          setPlanError(data.error);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      setPlanResult(data.plan);
      setStep(4);
    } catch (e: any) {
      console.error(e);
      setPlanError(e.message || 'Ocurrió un error inesperado al generar el plan.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleExportWordReport = async () => {
    try {
      const completeAnalisis = {
        titulo,
        nivel,
        establecimiento,
        nombre_docente: nombreDocente,
        n_preguntas_sm: nPreguntasSM,
        n_preguntas_desarrollo: nPreguntasDesarrollo,
        pauta_json: { ...pautaSM, ...pautaDesarrollo },
        tabla_especificaciones_json: skills.filter(s => s.habilidad.trim()),
        rubrica_json: rubric.filter(r => r.criterio.trim()),
        plan_mejora_json: planResult,
        created_at: new Date().toISOString()
      };

      const formattedStudents = studentsWithStats.map(s => ({
        nombre_estudiante: s.nombre,
        respuestas_json: { ...s.respuestas_sm, ...s.respuestas_desarrollo },
        puntaje_sm: s.puntaje_sm,
        puntaje_desarrollo: s.puntaje_desarrollo,
        puntaje_total: s.puntaje_total,
        porcentaje_logro: s.porcentaje_logro,
        nota: s.nota
      }));

      const blob = await drawPlanMejoraWord(completeAnalisis, formattedStudents);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `REI_Plan_Mejora_${titulo.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al exportar informe a Word.');
    }
  };

  // --- Helper calculations for Selected Student ---
  const selectedStudentStats = useMemo(() => {
    if (studentsWithStats.length === 0 || selectedStudentIndex >= studentsWithStats.length) return null;
    const est = studentsWithStats[selectedStudentIndex];

    const questionResults = Array.from({ length: nPreguntasSM + nPreguntasDesarrollo }).map((_, qIdx) => {
      const qNum = qIdx + 1;
      const qKey = String(qNum);
      if (qNum <= nPreguntasSM) {
        const correct = est.respuestas_sm[qKey] === pautaSM[qKey];
        return { qNum, tipo: 'sm', resp: est.respuestas_sm[qKey] || '-', pauta: pautaSM[qKey], correct };
      } else {
        const score = est.respuestas_desarrollo[qKey] ?? 0;
        const max = pautaDesarrollo[qKey] || 1;
        return { qNum, tipo: 'desarrollo', resp: `${score}/${max}`, pauta: max, correct: score === max };
      }
    });

    const skillStats = skills.filter(s => s.habilidad.trim()).map(skill => {
      const qNums = skill.preguntas.split(',').map(s => s.trim()).filter(Boolean);
      let earned = 0;
      let possible = 0;

      qNums.forEach(qNum => {
        if (Number(qNum) <= nPreguntasSM) {
          possible += 1;
          earned += est.respuestas_sm[qNum] === pautaSM[qNum] ? 1 : 0;
        } else {
          possible += pautaDesarrollo[qNum] || 1;
          earned += Number(est.respuestas_desarrollo[qNum]) || 0;
        }
      });

      const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
      return { habilidad: skill.habilidad, pct };
    });

    return {
      est,
      questions: questionResults,
      skills: skillStats
    };
  }, [studentsWithStats, selectedStudentIndex, nPreguntasSM, nPreguntasDesarrollo, pautaSM, pautaDesarrollo, skills]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-700 flex font-sans antialiased overflow-x-hidden">
      <Sidebar sidebarOpen={false} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200/70 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 rounded-xl">
              <ClipboardCheck className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-none">Corregir y Analizar</h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Corrección Automática & Planificación de Mejora por IA</p>
            </div>
          </div>
          {step > 1 && (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al paso {step - 1}
            </button>
          )}
        </header>

        {/* Steps indicator */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex gap-4 text-xs font-semibold text-slate-400 select-none overflow-x-auto">
          {[
            { num: 1, label: '1. Pauta e Instrumentos' },
            { num: 2, label: '2. Ingreso & OMR' },
            { num: 3, label: '3. Resultados de Curso' },
            { num: 4, label: '4. Plan de Mejora IA' }
          ].map(s => (
            <div
              key={s.num}
              className={`flex items-center gap-1 shrink-0 ${step === s.num ? 'text-rose-600 font-bold' : ''} ${step > s.num ? 'text-emerald-600' : ''}`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{s.num}</span>}
              <span>{s.label}</span>
              {s.num < 4 && <ChevronRight className="w-3 h-3 text-slate-300 ml-1" />}
            </div>
          ))}
        </div>

        {/* MAIN BODY */}
        <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
          
          {/* STEP 1: CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Configuración General</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block">Título del Análisis</label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Prueba Diagnóstico Lenguaje"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block">Nivel/Curso</label>
                    <select
                      value={nivel}
                      onChange={(e) => setNivel(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block">Establecimiento</label>
                    <input
                      type="text"
                      value={establecimiento}
                      onChange={(e) => setEstablecimiento(e.target.value)}
                      placeholder="Ej: Liceo Técnico A-10"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block">Docente</label>
                    <input
                      type="text"
                      value={nombreDocente}
                      onChange={(e) => setNombreDocente(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block">Preguntas de Selección Múltiple (Máx 40)</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={nPreguntasSM}
                      onChange={(e) => setNPreguntasSM(Math.min(40, Math.max(1, Number(e.target.value) || 0)))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block">Preguntas de Desarrollo (Máx 5)</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={nPreguntasDesarrollo}
                      onChange={(e) => setNPreguntasDesarrollo(Math.min(5, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Inline Pauta */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Claves de Pauta de Corrección</h2>
                
                {/* SM pauta */}
                {nPreguntasSM > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500">Selección Múltiple:</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {Array.from({ length: nPreguntasSM }).map((_, i) => {
                        const qNum = i + 1;
                        return (
                          <div key={qNum} className="flex flex-col items-center p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">P{qNum}</span>
                            <select
                              value={pautaSM[String(qNum)] || 'A'}
                              onChange={(e) => setPautaSM(prev => ({ ...prev, [String(qNum)]: e.target.value }))}
                              className="text-xs bg-white border border-slate-200 rounded p-1 focus:outline-none"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Desarrollo pauta */}
                {nPreguntasDesarrollo > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <h3 className="text-xs font-bold text-slate-500">Desarrollo (Puntajes Máximos 1 - 10):</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {Array.from({ length: nPreguntasDesarrollo }).map((_, i) => {
                        const qNum = nPreguntasSM + i + 1;
                        return (
                          <div key={qNum} className="flex flex-col p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-400 mb-1.5">Pregunta {qNum}</span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={pautaDesarrollo[String(qNum)] ?? 3}
                              onChange={(e) => {
                                const val = Math.min(10, Math.max(1, Number(e.target.value) || 1));
                                setPautaDesarrollo(prev => ({ ...prev, [String(qNum)]: val }));
                              }}
                              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-center"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Specification Table (Optional) */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tabla de Especificaciones (Opcional)</h2>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={skills.length >= 8}
                    className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Habilidad
                  </button>
                </div>

                <div className="space-y-3">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Nombre de Habilidad (ej: Localizar)"
                          value={skill.habilidad}
                          onChange={(e) => handleSkillChange(index, 'habilidad', e.target.value)}
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Preguntas (ej: 1,3,5)"
                          value={skill.preguntas}
                          onChange={(e) => handleSkillChange(index, 'preguntas', e.target.value)}
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Puntaje Total"
                          value={skill.puntaje || ''}
                          onChange={(e) => handleSkillChange(index, 'puntaje', Number(e.target.value) || 0)}
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-xs italic text-slate-400">Ninguna habilidad agregada. Las estadísticas del curso se calcularán de manera genérica.</p>
                  )}
                </div>
              </div>

              {/* Rubric (Optional) */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Rúbrica de Evaluación (Opcional)</h2>
                  <button
                    type="button"
                    onClick={handleAddRubric}
                    disabled={rubric.length >= 6}
                    className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Criterio
                  </button>
                </div>

                <div className="space-y-4">
                  {rubric.map((rub, index) => (
                    <div key={index} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30 space-y-3 relative pr-10">
                      <button
                        type="button"
                        onClick={() => handleRemoveRubric(index)}
                        className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="Criterio (ej: Coherencia)"
                          value={rub.criterio}
                          onChange={(e) => handleRubricChange(index, 'criterio', e.target.value)}
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Logrado (3 pts)"
                          value={rub.logrado}
                          onChange={(e) => handleRubricChange(index, 'logrado', e.target.value)}
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="En proceso (2 pts)"
                          value={rub.en_proceso}
                          onChange={(e) => handleRubricChange(index, 'en_proceso', e.target.value)}
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Por lograr (1 pt)"
                          value={rub.por_lograr}
                          onChange={(e) => handleRubricChange(index, 'por_lograr', e.target.value)}
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                  {rubric.length === 0 && (
                    <p className="text-xs italic text-slate-400">Ningún criterio agregado para la rúbrica.</p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveStep1}
                  className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  Continuar al Paso 2 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: STUDENTS AND ANSWERS INPUT */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Load Students List */}
              {students.length === 0 && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Sub-Paso 2A: Cargar Lista de Estudiantes</h2>
                  <p className="text-xs text-slate-400">Pega los nombres de tus estudiantes (un nombre por línea. Máx 45):</p>
                  <textarea
                    rows={8}
                    value={rawStudentNames}
                    onChange={(e) => setRawStudentNames(e.target.value)}
                    placeholder="Ej:&#10;Juan Pérez&#10;María González&#10;Carlos Muñoz"
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleLoadStudents}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Cargar Estudiantes
                  </button>
                </div>
              )}

              {/* Students grid and input */}
              {students.length > 0 && (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Sub-Paso 2B: Captura de Respuestas y Calificación</h2>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold rounded-full">{students.length} estudiantes</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3 px-2 text-center w-12">N°</th>
                          <th className="py-3 px-4">Estudiante</th>
                          <th className="py-3 px-4">Ingreso OMR (Fotos SM)</th>
                          {nPreguntasDesarrollo > 0 && (
                            <th className="py-3 px-4">Puntaje Desarrollo</th>
                          )}
                          <th className="py-3 px-4 text-center w-24">Puntaje</th>
                          <th className="py-3 px-4 text-center w-24">% Logro</th>
                          <th className="py-3 px-4 text-center w-24">Nota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {studentsWithStats.map((est, index) => {
                          const isProcessing = studentLoading[est.id];
                          const keysCount = Object.keys(est.respuestas_sm).length;

                          return (
                            <tr key={est.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-2 text-center font-bold text-slate-400">{index + 1}</td>
                              <td className="py-3 px-4 font-bold text-slate-800">{est.nombre}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  {isProcessing ? (
                                    <span className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold animate-pulse">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analizando Hoja...
                                    </span>
                                  ) : (
                                    <label className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                      <Camera className="w-3.5 h-3.5" />
                                      <span>{keysCount > 0 ? `Re-capturar (${keysCount}/${nPreguntasSM})` : 'Fotografiar Hoja'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleCameraCapture(index, e.target.files[0]);
                                          }
                                        }}
                                      />
                                    </label>
                                  )}
                                  
                                  {keysCount > 0 && !isProcessing && (
                                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                                      Leída ✓
                                    </span>
                                  )}
                                </div>
                              </td>

                              {nPreguntasDesarrollo > 0 && (
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-2.5">
                                    {Array.from({ length: nPreguntasDesarrollo }).map((_, dIdx) => {
                                      const qNum = nPreguntasSM + dIdx + 1;
                                      const max = pautaDesarrollo[String(qNum)] || 1;
                                      return (
                                        <div key={qNum} className="flex items-center gap-1 shrink-0">
                                          <span className="text-[10px] text-slate-400 font-medium">P{qNum}:</span>
                                          <input
                                            type="number"
                                            min={0}
                                            max={max}
                                            value={est.respuestas_desarrollo[String(qNum)] ?? ''}
                                            onChange={(e) => {
                                              const val = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                                              updateStudentDesarrolloScore(index, String(qNum), val);
                                            }}
                                            className="w-10 px-1 py-1 border border-slate-200 rounded text-center text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
                                          />
                                          <span className="text-[9px] text-slate-400">/{max}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              )}

                              <td className="py-3 px-4 text-center font-bold text-slate-600">
                                {est.puntaje_total} <span className="text-[10px] text-slate-400 font-normal">/ {est.maxPossible}</span>
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-slate-600">
                                {est.porcentaje_logro.toFixed(0)}%
                              </td>
                              <td className={`py-3 px-4 text-center font-black text-sm ${est.nota < 4.0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                {est.nota.toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStudents([])}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      ← Cambiar lista de estudiantes
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveStep2}
                      disabled={savingResults || Object.keys(studentLoading).length > 0}
                      className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      {savingResults ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          Calcular y Continuar <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RESULTS (CURSO AND ESTUDIANTE) */}
          {step === 3 && courseStats && (
            <div className="space-y-6">
              
              {/* Toolbar tabs */}
              <div className="flex items-center justify-between border-b border-slate-200">
                <div className="flex gap-4">
                  <button
                    onClick={() => setResultsTab('curso')}
                    className={`py-3.5 px-1 text-sm font-black border-b-2 transition-all flex items-center gap-1.5 ${resultsTab === 'curso' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                  >
                    <FileText className="w-4 h-4" /> Vista de Curso
                  </button>
                  <button
                    onClick={() => setResultsTab('estudiante')}
                    className={`py-3.5 px-1 text-sm font-black border-b-2 transition-all flex items-center gap-1.5 ${resultsTab === 'estudiante' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                  >
                    <User className="w-4 h-4" /> Vista por Estudiante
                  </button>
                </div>
                <div className="pb-2">
                  <button
                    onClick={handleExportWordReport}
                    className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <FileDown className="w-4 h-4" /> Exportar Informe de Curso (.docx)
                  </button>
                </div>
              </div>

              {/* TABS: CURSO */}
              {resultsTab === 'curso' && (
                <div className="space-y-6">
                  
                  {/* Grid Summary widgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                      <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xl">
                        {courseStats.avgGrade}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider leading-none">Promedio Curso</p>
                        <h4 className="text-slate-700 font-black text-lg mt-1">Nota Escala 1-7</h4>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-xl">
                        {parseFloat(courseStats.avgPct).toFixed(0)}%
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider leading-none">Logro Promedio</p>
                        <h4 className="text-slate-700 font-black text-lg mt-1">Rendimiento</h4>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xl">
                        {courseStats.aboveFour}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider leading-none">Aprobados</p>
                        <h4 className="text-slate-700 font-bold text-lg mt-1">Nota ≥ 4.0</h4>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                      <div className={`p-3 rounded-2xl font-black text-xl ${courseStats.belowFour > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                        {courseStats.belowFour}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider leading-none">Bajo Mínimo</p>
                        <h4 className="text-slate-700 font-bold text-lg mt-1">Nota &lt; 4.0</h4>
                      </div>
                    </div>
                  </div>

                  {/* SVG Charts section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* SVG Grades Distribution */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Distribución de Notas</h3>
                      <div className="h-64 flex items-end justify-around border-b border-slate-200 pb-3">
                        {[
                          { label: '1.0 - 2.9', val: courseStats.dist.insuficiente_muy, color: '#EF4444' },
                          { label: '3.0 - 3.9', val: courseStats.dist.insuficiente, color: '#F59E0B' },
                          { label: '4.0 - 5.4', val: courseStats.dist.suficiente, color: '#10B981' },
                          { label: '5.5 - 6.4', val: courseStats.dist.bueno, color: '#3B82F6' },
                          { label: '6.5 - 7.0', val: courseStats.dist.excelente, color: '#8B5CF6' }
                        ].map((d, i) => {
                          const maxVal = Math.max(...Object.values(courseStats.dist), 1);
                          const heightPct = (d.val / maxVal) * 100;
                          return (
                            <div key={i} className="flex flex-col items-center w-full group relative">
                              <span className="text-[10px] font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                                {d.val} Alum.
                              </span>
                              <div
                                style={{ height: `${Math.max(10, heightPct * 1.8)}px`, backgroundColor: d.color }}
                                className="w-12 rounded-t-lg transition-all hover:brightness-95 shadow-2xs"
                              />
                              <span className="text-[10px] text-slate-400 mt-2 font-bold select-none">{d.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Skill Achievement chart */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logro promedio por Habilidad</h3>
                      {courseStats.skills.length > 0 ? (
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                          {courseStats.skills.map((s, idx) => {
                            const barColor = s.pct < 50 ? 'bg-rose-500' : s.pct < 70 ? 'bg-amber-400' : 'bg-emerald-500';
                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-slate-700">{s.habilidad}</span>
                                  <span className="text-slate-500">{s.pct}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                  <div style={{ width: `${s.pct}%` }} className={`h-full ${barColor} transition-all`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center border border-dashed border-slate-100 rounded-2xl text-xs italic text-slate-400">
                          Ingresa la tabla de especificaciones en el Paso 1 para ver el análisis de habilidades.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question levels bar graph */}
                  <div className="bg-white border border-[#E2E8F0]/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logro promedio por Pregunta</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                      {courseStats.questionLogro.map((q) => {
                        const barColor = q.pct < 50 ? 'bg-rose-500' : q.pct < 70 ? 'bg-amber-400' : 'bg-emerald-500';
                        return (
                          <div key={q.qNum} className="p-3 border border-slate-100 rounded-2xl bg-slate-50/30 space-y-1.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400">P{q.qNum}</span>
                              <span className="text-xs font-bold text-slate-700">{q.pct.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div style={{ width: `${q.pct}%` }} className={`h-full ${barColor} transition-all`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary course table */}
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tabla de Rendimiento Individual</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSortField('nota');
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                          className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all ${sortField === 'nota' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          Ordenar por Nota {sortField === 'nota' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                          onClick={() => {
                            setSortField('nombre');
                            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                          className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all ${sortField === 'nombre' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                          Ordenar por Nombre {sortField === 'nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-4 w-12">N°</th>
                            <th className="py-2.5 px-4">Estudiante</th>
                            <th className="py-2.5 px-4 text-center">Puntaje</th>
                            <th className="py-2.5 px-4 text-center">% Logro</th>
                            <th className="py-2.5 px-4 text-center">Nota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {sortedStudents.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-4 font-bold text-slate-700">{s.nombre}</td>
                              <td className="py-2.5 px-4 text-center">{s.puntaje_total} / {s.maxPossible}</td>
                              <td className="py-2.5 px-4 text-center">{s.porcentaje_logro.toFixed(0)}%</td>
                              <td className={`py-2.5 px-4 text-center font-black ${s.nota < 4.0 ? 'text-rose-600 bg-rose-50/30' : 'text-emerald-700'}`}>
                                {s.nota.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI trigger block */}
                  <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white space-y-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1.5 text-center md:text-left">
                      <h3 className="font-black text-lg flex items-center justify-center md:justify-start gap-1.5">
                        <Sparkles className="w-5 h-5 animate-pulse" /> Generar Plan de Mejora Pedagógica
                      </h3>
                      <p className="text-xs text-rose-100 max-w-xl">
                        Nuestra inteligencia artificial analizará los resultados, debilidades curriculares y notas bajo el mínimo para generar estrategias prioritarias de aula y un plan de seguimiento individual.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePlanMejora}
                      disabled={generatingPlan}
                      className="px-6 py-3 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-70 disabled:cursor-not-allowed font-black rounded-2xl shadow-md text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {generatingPlan ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Creando Plan...
                        </>
                      ) : (
                        <>
                          <Sparkle className="w-4 h-4" /> Generar Plan con IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TABS: ESTUDIANTE */}
              {resultsTab === 'estudiante' && selectedStudentStats && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Student picker & info */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                      <label className="text-xs font-bold text-slate-500 block">Seleccionar Estudiante</label>
                      <select
                        value={selectedStudentIndex}
                        onChange={(e) => setSelectedStudentIndex(Number(e.target.value))}
                        className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                      >
                        {studentsWithStats.map((s, idx) => (
                          <option key={s.id} value={idx}>{s.nombre} (Nota: {s.nota.toFixed(1)})</option>
                        ))}
                      </select>

                      <div className="border-t border-slate-100 pt-4 flex flex-col items-center text-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-lg uppercase shadow-inner">
                          {selectedStudentStats.est.nombre.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{selectedStudentStats.est.nombre}</h4>
                          <p className="text-[10px] text-slate-400">N° Lista {selectedStudentIndex + 1}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 w-full pt-2">
                          <div className="bg-slate-50 rounded-xl p-2.5">
                            <span className="text-[9px] text-slate-400 block font-bold">Puntaje</span>
                            <span className="text-xs font-black text-slate-700">{selectedStudentStats.est.puntaje_total}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2.5">
                            <span className="text-[9px] text-slate-400 block font-bold">% Logro</span>
                            <span className="text-xs font-black text-slate-700">{selectedStudentStats.est.porcentaje_logro.toFixed(0)}%</span>
                          </div>
                          <div className={`rounded-xl p-2.5 ${selectedStudentStats.est.nota < 4.0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            <span className="text-[9px] block font-bold">Nota</span>
                            <span className="text-xs font-black">{selectedStudentStats.est.nota.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rubric evaluation form for student */}
                    {rubric.filter(r => r.criterio.trim()).length > 0 && (
                      <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pauta de Rúbrica del Estudiante</h3>
                        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                          {rubric.filter(r => r.criterio.trim()).map((rub, rIdx) => {
                            const selectedLevel = selectedStudentStats.est.rubrica?.[rIdx] || '';
                            return (
                              <div key={rIdx} className="space-y-1.5 border-b border-slate-50 pb-3 last:border-b-0">
                                <p className="text-xs font-bold text-slate-700">{rub.criterio}</p>
                                <div className="flex flex-col gap-1">
                                  {[
                                    { key: 'logrado', label: `Logrado: ${rub.logrado || '3 pts'}` },
                                    { key: 'en_proceso', label: `En proceso: ${rub.en_proceso || '2 pts'}` },
                                    { key: 'por_lograr', label: `Por lograr: ${rub.por_lograr || '1 pt'}` }
                                  ].map(lvl => (
                                    <button
                                      key={lvl.key}
                                      onClick={() => updateStudentRubricLevel(selectedStudentIndex, rIdx, lvl.key)}
                                      className={`text-[10px] text-left px-2 py-1.5 border rounded-lg transition-colors font-medium ${selectedLevel === lvl.key ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                      {lvl.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Answers and skills list */}
                  <div className="lg:col-span-8 space-y-4">
                    
                    {/* Item specific breakdown */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Respuestas por Pregunta</h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                        {selectedStudentStats.questions.map((q) => {
                          const statusBg = q.tipo === 'sm'
                            ? (q.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800')
                            : 'bg-indigo-50 border-indigo-150 text-indigo-800';

                          return (
                            <div key={q.qNum} className={`p-3 border rounded-2xl flex flex-col justify-between space-y-1.5 ${statusBg}`}>
                              <div className="flex items-center justify-between text-[10px] font-black uppercase">
                                <span>P{q.qNum}</span>
                                <span>{q.tipo === 'sm' ? 'SM' : 'Des.'}</span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-black">{q.resp}</span>
                                {q.tipo === 'sm' && (
                                  <span className="text-[9px] text-slate-400">Pauta: {q.pauta}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Individual skills achievement */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Porcentaje de Logro por Habilidad (Individual)</h3>
                      {selectedStudentStats.skills.length > 0 ? (
                        <div className="space-y-4">
                          {selectedStudentStats.skills.map((s, idx) => {
                            const barColor = s.pct < 50 ? 'bg-rose-500' : s.pct < 70 ? 'bg-amber-400' : 'bg-emerald-500';
                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-slate-700">{s.habilidad}</span>
                                  <span className="text-slate-500">{s.pct}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                  <div style={{ width: `${s.pct}%` }} className={`h-full ${barColor} transition-all`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400">Ingresa la tabla de especificaciones en el Paso 1 para ver el rendimiento por habilidades.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: AI PLAN GENERATION RESULTS */}
          {step === 4 && planResult && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Header actions */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Plan de Mejora y Seguimiento Generado</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Analizado a partir de las estadísticas del curso</p>
                  </div>
                  <button
                    onClick={handleExportWordReport}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-4.5 h-4.5" /> Descargar Plan y Reporte (.docx)
                  </button>
                </div>

                {/* Course improvements */}
                <div className="space-y-4">
                  <h3 className="text-base font-black text-indigo-900 border-l-4 border-indigo-600 pl-2">I. Plan de Mejora del Curso</h3>
                  
                  {/* Top weak skills */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top 3 Habilidades a Trabajar:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {planResult.top_habilidades_debiles?.map((h: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase">Habilidad Prioritaria</span>
                            <span className="text-xs font-black text-slate-500">{h.porcentaje_logro}% logro</span>
                          </div>
                          <h5 className="font-bold text-slate-800 text-xs leading-tight">{h.habilidad}</h5>
                          <p className="text-[10.5px] text-slate-450 leading-relaxed">{h.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategies */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estrategias Pedagógicas Concretas (2 Semanas):</h4>
                    <div className="space-y-2">
                      {planResult.estrategias_pedagogicas?.map((est: string, idx: number) => (
                        <div key={idx} className="flex gap-2.5 p-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl text-xs text-indigo-950 leading-relaxed">
                          <span className="font-black text-indigo-600 text-base leading-none">0{idx + 1}</span>
                          <p className="font-semibold">{est}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested activities */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actividades Sugeridas por Habilidad:</h4>
                    <div className="space-y-3">
                      {planResult.actividades_sugeridas?.map((act: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
                          <h5 className="text-xs font-bold text-slate-850">Habilidad: <span className="text-rose-600">{act.habilidad}</span></h5>
                          <p className="text-xs text-slate-450 leading-relaxed pt-1 whitespace-pre-line">{act.actividad}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual student follow-up plans */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-black text-emerald-900 border-l-4 border-emerald-600 pl-2">II. Plan de Seguimiento Individual (Estudiantes Rezagados)</h3>
                  
                  {planResult.seguimiento_estudiantes && planResult.seguimiento_estudiantes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-4">Estudiante</th>
                            <th className="py-2.5 px-4 text-center">Nota</th>
                            <th className="py-2.5 px-4">Habilidades a Reforzar</th>
                            <th className="py-2.5 px-4">Nivel RTI Propuesto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {planResult.seguimiento_estudiantes.map((est: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-bold text-slate-700">{est.nombre}</td>
                              <td className="py-3 px-4 text-center font-black text-rose-600">{est.nota}</td>
                              <td className="py-3 px-4">{Array.isArray(est.habilidades_a_reforzar) ? est.habilidades_a_reforzar.join(', ') : String(est.habilidades_a_reforzar)}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${est.nivel_rti === 3 ? 'bg-rose-50 text-rose-700 border border-rose-200' : est.nivel_rti === 2 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-150'}`}>
                                    Nivel {est.nivel_rti || '1'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">{est.nivel_rti_explicacion}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">Todos los estudiantes se encuentran sobre la nota mínima 4.0.</p>
                  )}
                </div>

                {/* Back button to results */}
                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(3)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
                  >
                    Volver a Resultados
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Plan error state */}
          {planError && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">Error al generar plan:</p>
                <p className="mt-0.5">{planError}</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upgrade Limit Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-md text-center shadow-xl space-y-4">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">Límite de análisis alcanzado</h3>
              <p className="text-xs text-slate-400 mt-1">
                Has alcanzado el límite de 5 análisis pedagógicos con IA en tu plan gratuito.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push('/'); // Navigate to main dashboard to subscribe or check plans
                }}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-bold rounded-xl text-xs shadow-md transition-all"
              >
                Suscribirse a Plan Premium
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
