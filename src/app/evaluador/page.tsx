'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import {
  Home,
  PlusCircle,
  FileText,
  Sliders,
  BookOpen,
  Gamepad2,
  Library,
  Settings,
  LogOut,
  X,
  Sparkle,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  User,
  Camera,
  Loader2,
  ClipboardCheck,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  Check,
  Award,
  Users,
  Eye,
  FileDown
} from 'lucide-react';
// Heavy libs cargadas dinámicamente para evitar crash de bundle en Vercel

// --- Interfaces ---
interface Student {
  nombre: string;
  numero_lista: number;
  rut?: string;
}

interface Curso {
  id?: string;
  nombre: string;
  nivel: string; // 'Básica' | 'Media'
  estudiantes_json: Student[];
  created_at?: string;
}

interface Evaluation {
  id: string;
  titulo: string;
  asignatura: string;
  nivel: string; // Course name from dropdown
  establecimiento: string;
  nombre_docente: string;
  fecha_aplicacion: string;
  n_preguntas_sm: number;
  n_preguntas_desarrollo: number;
  claves_json: Record<string, string>;
  habilidades_json: Record<string, string>;
  respuestas_modelo_json: Record<string, string>;
  pauta_json: Record<string, string | number>;
  tabla_especificaciones_json?: any[];
  rubrica_json?: any[];
  plan_mejora_json?: any;
  remediation_count?: number;
  created_at?: string;
}

interface StudentResult {
  id?: string;
  analisis_id: string;
  nombre_estudiante: string;
  numero_lista?: number;
  rut?: string;
  respuestas_sm_json: Record<string, string>;
  respuestas_dev_json: Record<string, number>;
  informe_apoderado_texto?: string;
  puntaje_sm?: number;
  puntaje_desarrollo?: number;
  puntaje_total?: number;
  porcentaje_logro?: number;
  nota?: number;
}

export default function EvaluadorPage() {
  const router = useRouter();

  // --- Session & Global states ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cursos' | 'evaluaciones'>('evaluaciones');

  // --- Cursos tab states ---
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursosLoading, setCursosLoading] = useState(false);
  const [isEditingCurso, setIsEditingCurso] = useState(false);
  const [editingCursoId, setEditingCursoId] = useState<string | null>(null);
  
  const [cursoNombre, setCursoNombre] = useState('');
  const [cursoNivel, setCursoNivel] = useState('Básica');
  const [cursoEstudiantes, setCursoEstudiantes] = useState<Student[]>([]);
  
  const [rawTextNames, setRawTextNames] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRut, setNewStudentRut] = useState('');

  // --- Evaluaciones tab states ---
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [flowStep, setFlowStep] = useState<number>(1);
  const [currentEvalId, setCurrentEvalId] = useState<string | null>(null);

  // --- Step 1 States ---
  const [evalTitulo, setEvalTitulo] = useState('Prueba Formativa');
  const [evalAsignatura, setEvalAsignatura] = useState('');
  const [evalCursoId, setEvalCursoId] = useState('');
  const [evalEstablecimiento, setEvalEstablecimiento] = useState('');
  const [evalDocente, setEvalDocente] = useState('');
  const [evalFecha, setEvalFecha] = useState(new Date().toISOString().split('T')[0]);

  const [nSM, setNSM] = useState(20);
  const [nDesarrollo, setNDesarrollo] = useState(0);

  const [keysSM, setKeysSM] = useState<Record<string, string>>({});
  const [skillsSM, setSkillsSM] = useState<Record<string, string>>({});
  const [devMaxScores, setDevMaxScores] = useState<Record<string, number>>({});
  const [devModelAnswers, setDevModelAnswers] = useState<Record<string, string>>({});

  const [specSkills, setSpecSkills] = useState<any[]>([{ habilidad: '', preguntas: '', puntaje: 0 }]);
  const [specRubric, setSpecRubric] = useState<any[]>([{ criterio: '', logrado: '', en_proceso: '', por_lograr: '' }]);

  // --- Step 2 States ---
  const [generatingSheets, setGeneratingSheets] = useState(false);

  // --- Step 3 States ---
  const [studentsResults, setStudentsResults] = useState<StudentResult[]>([]);
  const [scannedLoading, setScannedLoading] = useState<Record<number, boolean>>({});
  const [savingResults, setSavingResults] = useState(false);

  // IA Grading helper (Haiku)
  const [activeIAGradingIdx, setActiveIAGradingIdx] = useState<number | null>(null);
  const [activeIAGradingQNum, setActiveIAGradingQNum] = useState<string | null>(null);
  const [studentTextResponse, setStudentTextResponse] = useState('');
  const [suggestingScore, setSuggestingScore] = useState(false);
  const [suggestedScoreValue, setSuggestedScoreValue] = useState<number | null>(null);
  const [suggestedScoreJustification, setSuggestedScoreJustification] = useState('');

  // --- Step 4 States ---
  const [statsTab, setStatsTab] = useState<'curso' | 'estudiante'>('curso');
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [sortField, setSortField] = useState<'nombre' | 'nota' | 'porcentaje'>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // --- Step 5 States ---
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planResult, setPlanResult] = useState<any>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [remedyCount, setRemedyCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Apoderados reports
  const [generatingReports, setGeneratingReports] = useState(false);
  const [reportsResult, setReportsResult] = useState<Record<string, string>>({});
  const [combinedPDFGenerating, setCombinedPDFGenerating] = useState(false);

  // --- Auth & Profile Prefills ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        setEvalDocente(user.user_metadata?.full_name || user.user_metadata?.name || '');
        fetchCursos();
        fetchEvaluaciones();
      }
      setAuthLoading(false);
    });
  }, [router]);

  // --- Load lists ---
  const fetchCursos = async () => {
    setCursosLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const res = await fetch('/api/evaluador/cursos', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.cursos) {
        setCursos(data.cursos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCursosLoading(false);
    }
  };

  const fetchEvaluaciones = async () => {
    setEvalLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      // Query from Supabase main route
      const res = await fetch('/api/evaluaciones', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.evaluaciones) {
        // Filter evaluations that have claves_json or asignatura (indicating evaluator v3 type)
        // We can display all but we sort/filter them
        setEvaluaciones(data.evaluaciones);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEvalLoading(false);
    }
  };

  // --- Pauta Sync ---
  useEffect(() => {
    setKeysSM(prev => {
      const updated = { ...prev };
      for (let i = 1; i <= nSM; i++) {
        if (!updated[String(i)]) updated[String(i)] = 'A';
      }
      return updated;
    });
    setSkillsSM(prev => {
      const updated = { ...prev };
      for (let i = 1; i <= nSM; i++) {
        if (!updated[String(i)]) updated[String(i)] = 'Comprensión';
      }
      return updated;
    });
  }, [nSM]);

  useEffect(() => {
    setDevMaxScores(prev => {
      const updated = { ...prev };
      for (let i = 1; i <= nDesarrollo; i++) {
        const qKey = String(nSM + i);
        if (!updated[qKey]) updated[qKey] = 3;
      }
      return updated;
    });
    setDevModelAnswers(prev => {
      const updated = { ...prev };
      for (let i = 1; i <= nDesarrollo; i++) {
        const qKey = String(nSM + i);
        if (!updated[qKey]) updated[qKey] = 'Respuesta modelo sugerida.';
      }
      return updated;
    });
  }, [nSM, nDesarrollo]);

  // --- Selected course loading ---
  const selectedCourseEstudiantes = useMemo(() => {
    const selected = cursos.find(c => c.id === evalCursoId);
    return selected ? selected.estudiantes_json : [];
  }, [cursos, evalCursoId]);

  // --- Calculations for scoring ---
  const calculatedResults = useMemo(() => {
    let maxPossiblePoints = nSM * 1;
    for (let i = 1; i <= nDesarrollo; i++) {
      const qKey = String(nSM + i);
      maxPossiblePoints += Number(devMaxScores[qKey]) || 1;
    }

    return studentsResults.map(est => {
      // Calculate SM score
      let scoreSM = 0;
      for (let i = 1; i <= nSM; i++) {
        const qKey = String(i);
        if (est.respuestas_sm_json?.[qKey] === keysSM[qKey]) {
          scoreSM += 1;
        }
      }

      // Calculate Desarrollo score
      let scoreDev = 0;
      for (let i = 1; i <= nDesarrollo; i++) {
        const qKey = String(nSM + i);
        scoreDev += Number(est.respuestas_dev_json?.[qKey]) || 0;
      }

      const total = scoreSM + scoreDev;
      const pct = maxPossiblePoints > 0 ? (total / maxPossiblePoints) * 100 : 0;

      // Grade calculation
      let grade = 1.0;
      if (pct >= 60) {
        grade = 4.0 + 3.0 * ((pct - 60) / 40);
      } else {
        grade = 1.0 + 3.0 * (pct / 60);
      }
      grade = Math.max(1.0, Math.min(7.0, Math.round(grade * 10) / 10));

      return {
        ...est,
        puntaje_sm: scoreSM,
        puntaje_desarrollo: scoreDev,
        puntaje_total: total,
        porcentaje_logro: pct,
        nota: grade,
        maxPossible: maxPossiblePoints
      };
    });
  }, [studentsResults, nSM, nDesarrollo, keysSM, devMaxScores]);

  // --- Course stats computed ---
  const courseStats = useMemo(() => {
    if (calculatedResults.length === 0) return null;

    const grades = calculatedResults.map(r => r.nota || 1.0);
    const pcts = calculatedResults.map(r => r.porcentaje_logro || 0);

    const avgGrade = (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1);
    const avgPct = (pcts.reduce((sum, p) => sum + p, 0) / pcts.length).toFixed(1);

    const aboveFour = calculatedResults.filter(s => (s.nota || 1.0) >= 4.0).length;
    const belowFour = calculatedResults.filter(s => (s.nota || 1.0) < 4.0).length;

    // Distribution
    const dist = {
      insuficiente_muy: grades.filter(g => g < 3.0).length,
      insuficiente: grades.filter(g => g >= 3.0 && g < 4.0).length,
      suficiente: grades.filter(g => g >= 4.0 && g < 5.5).length,
      bueno: grades.filter(g => g >= 5.5 && g < 6.5).length,
      excelente: grades.filter(g => g >= 6.5).length
    };

    // Question performance
    const totalQ = nSM + nDesarrollo;
    const questionPerformance = Array.from({ length: totalQ }).map((_, idx) => {
      const qNum = idx + 1;
      const qKey = String(qNum);
      let earned = 0;
      let possible = 0;

      calculatedResults.forEach(est => {
        if (qNum <= nSM) {
          possible += 1;
          earned += est.respuestas_sm_json?.[qKey] === keysSM[qKey] ? 1 : 0;
        } else {
          possible += devMaxScores[qKey] || 1;
          earned += Number(est.respuestas_dev_json?.[qKey]) || 0;
        }
      });

      const pct = possible > 0 ? (earned / possible) * 100 : 0;
      return { qNum, pct };
    });

    // Skill stats
    const skillPerformance = specSkills.filter(s => s.habilidad.trim()).map(skill => {
      const qNums = skill.preguntas.split(',').map((s: string) => s.trim()).filter(Boolean);
      let earned = 0;
      let possible = 0;

      calculatedResults.forEach(est => {
        qNums.forEach((qNum: string) => {
          if (Number(qNum) <= nSM) {
            possible += 1;
            earned += est.respuestas_sm_json?.[qNum] === keysSM[qNum] ? 1 : 0;
          } else {
            possible += devMaxScores[qNum] || 1;
            earned += Number(est.respuestas_dev_json?.[qNum]) || 0;
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
      questions: questionPerformance,
      skills: skillPerformance
    };
  }, [calculatedResults, nSM, nDesarrollo, keysSM, devMaxScores, specSkills]);

  // --- Sorted Results ---
  const sortedResults = useMemo(() => {
    const list = [...calculatedResults];
    list.sort((a, b) => {
      let valA: any = a.nombre_estudiante;
      let valB: any = b.nombre_estudiante;
      if (sortField === 'nota') {
        valA = a.nota || 0;
        valB = b.nota || 0;
      } else if (sortField === 'porcentaje') {
        valA = a.porcentaje_logro || 0;
        valB = b.porcentaje_logro || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [calculatedResults, sortField, sortDirection]);

  // --- Student selected breakdown ---
  const selectedStudentStats = useMemo(() => {
    if (calculatedResults.length === 0 || selectedStudentIdx >= calculatedResults.length) return null;
    const est = calculatedResults[selectedStudentIdx];

    const questions = Array.from({ length: nSM + nDesarrollo }).map((_, idx) => {
      const qNum = idx + 1;
      const qKey = String(qNum);
      if (qNum <= nSM) {
        const correct = est.respuestas_sm_json?.[qKey] === keysSM[qKey];
        return { qNum, tipo: 'sm', resp: est.respuestas_sm_json?.[qKey] || '-', pauta: keysSM[qKey], correct };
      } else {
        const score = est.respuestas_dev_json?.[qKey] ?? 0;
        const max = devMaxScores[qKey] || 1;
        return { qNum, tipo: 'desarrollo', resp: `${score}/${max}`, pauta: max, correct: score === max };
      }
    });

    const skillStats = specSkills.filter(s => s.habilidad.trim()).map(skill => {
      const qNums = skill.preguntas.split(',').map((s: string) => s.trim()).filter(Boolean);
      let earned = 0;
      let possible = 0;

      qNums.forEach((qNum: string) => {
        if (Number(qNum) <= nSM) {
          possible += 1;
          earned += est.respuestas_sm_json?.[qNum] === keysSM[qNum] ? 1 : 0;
        } else {
          possible += devMaxScores[qNum] || 1;
          earned += Number(est.respuestas_dev_json?.[qNum]) || 0;
        }
      });

      const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
      return { habilidad: skill.habilidad, pct };
    });

    return {
      est,
      questions,
      skills: skillStats
    };
  }, [calculatedResults, selectedStudentIdx, nSM, nDesarrollo, keysSM, devMaxScores, specSkills]);

  // --- Comparative courses (same level) ---
  const comparativeCourses = useMemo(() => {
    if (!evalCursoId) return [];
    const current = cursos.find(c => c.id === evalCursoId);
    if (!current) return [];
    
    // Find all courses with same level (Básica / Media)
    return cursos.filter(c => c.nivel === current.nivel && c.id !== current.id);
  }, [cursos, evalCursoId]);

  // --- CRUD Cursos Handlers ---
  const handleAddNewCurso = () => {
    setEditingCursoId(null);
    setCursoNombre('');
    setCursoNivel('Básica');
    setCursoEstudiantes([]);
    setRawTextNames('');
    setIsEditingCurso(true);
  };

  const handleEditCurso = (c: Curso) => {
    setEditingCursoId(c.id || null);
    setCursoNombre(c.nombre);
    setCursoNivel(c.nivel);
    setCursoEstudiantes(c.estudiantes_json);
    setRawTextNames(c.estudiantes_json.map(e => e.nombre).join('\n'));
    setIsEditingCurso(true);
  };

  const handleDeleteCurso = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este curso? Se eliminarán los datos históricos asociados.')) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const res = await fetch(`/api/evaluador/cursos?id=${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        fetchCursos();
      } else {
        const d = await res.json();
        alert(d.error || 'Error al eliminar');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Student modifications in editing curso list
  const handleLoadTextNames = () => {
    const lines = rawTextNames.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 45) {
      alert('El máximo permitido es 45 estudiantes. Se cargarán solo los primeros 45.');
    }
    const finalLines = lines.slice(0, 45);
    const studs: Student[] = finalLines.map((name, i) => ({
      nombre: name,
      numero_lista: i + 1
    }));
    setCursoEstudiantes(studs);
  };

  const handleExcelImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        const parsed: Student[] = [];
        let listNum = 1;

        rows.forEach((row) => {
          const name = String(row[0] || '').trim();
          const rut = row[1] ? String(row[1]).trim() : undefined;
          if (name && name.toLowerCase() !== 'nombre' && name.toLowerCase() !== 'name') {
            parsed.push({
              nombre: name,
              numero_lista: listNum++,
              rut
            });
          }
        });

        const limited = parsed.slice(0, 45);
        if (parsed.length > 45) {
          alert('Se limitó la importación a los primeros 45 estudiantes.');
        }
        setCursoEstudiantes(limited);
        setRawTextNames(limited.map(e => e.nombre).join('\n'));
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo Excel/CSV.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddIndividualStudent = () => {
    if (!newStudentName.trim()) return;
    if (cursoEstudiantes.length >= 45) {
      alert('El límite de estudiantes en un curso es 45.');
      return;
    }

    const updated = [...cursoEstudiantes, {
      nombre: newStudentName.trim(),
      numero_lista: cursoEstudiantes.length + 1,
      rut: newStudentRut.trim() || undefined
    }];
    setCursoEstudiantes(updated);
    setRawTextNames(updated.map(e => e.nombre).join('\n'));
    setNewStudentName('');
    setNewStudentRut('');
  };

  const handleRemoveStudentFromList = (idx: number) => {
    const updated = cursoEstudiantes.filter((_, i) => i !== idx).map((e, i) => ({
      ...e,
      numero_lista: i + 1
    }));
    setCursoEstudiantes(updated);
    setRawTextNames(updated.map(e => e.nombre).join('\n'));
  };

  const handleMoveStudent = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === cursoEstudiantes.length - 1) return;

    const list = [...cursoEstudiantes];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    // Recalculate list numbers
    const updated = list.map((e, i) => ({ ...e, numero_lista: i + 1 }));
    setCursoEstudiantes(updated);
    setRawTextNames(updated.map(e => e.nombre).join('\n'));
  };

  const handleSaveCurso = async () => {
    if (!cursoNombre.trim()) {
      alert('Por favor ingresa un nombre para el curso.');
      return;
    }
    if (cursoEstudiantes.length === 0) {
      alert('La lista de estudiantes no puede estar vacía.');
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const payload = {
        id: editingCursoId || undefined,
        nombre: cursoNombre.trim(),
        nivel: cursoNivel,
        estudiantes_json: cursoEstudiantes
      };

      const res = await fetch('/api/evaluador/cursos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditingCurso(false);
        fetchCursos();
      } else {
        alert(data.error || 'Error al guardar el curso.');
      }
    } catch (e) {
      console.error(e);
      alert('Error en la conexión con el servidor.');
    }
  };

  // --- Step 1 Handlers (Evaluaciones) ---
  const handleAddNewEval = () => {
    setCurrentEvalId(null);
    setEvalTitulo('Evaluación OMR');
    setEvalAsignatura('');
    setEvalCursoId(cursos[0]?.id || '');
    setNSM(20);
    setNDesarrollo(0);
    setKeysSM({});
    setSkillsSM({});
    setDevMaxScores({});
    setDevModelAnswers({});
    setSpecSkills([{ habilidad: '', preguntas: '', puntaje: 0 }]);
    setSpecRubric([{ criterio: '', logrado: '', en_proceso: '', por_lograr: '' }]);
    setIsFlowActive(true);
    setFlowStep(1);
  };

  const handleSaveEvalConfig = async () => {
    if (!evalTitulo.trim() || !evalCursoId) {
      alert('Ingresa el título de la evaluación y selecciona un curso.');
      return;
    }

    const selectedCourse = cursos.find(c => c.id === evalCursoId);
    if (!selectedCourse) return;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      // Calculate total points
      let totalPts = nSM * 1;
      for (let i = 1; i <= nDesarrollo; i++) {
        totalPts += Number(devMaxScores[String(nSM + i)]) || 1;
      }

      // Mix key schema
      const pautaUnified: Record<string, string | number> = {};
      for (let i = 1; i <= nSM; i++) pautaUnified[String(i)] = keysSM[String(i)] || 'A';
      for (let i = 1; i <= nDesarrollo; i++) pautaUnified[String(nSM + i)] = Number(devMaxScores[String(nSM + i)]) || 3;

      const payload = {
        titulo: evalTitulo.trim(),
        asignatura: evalAsignatura.trim(),
        nivel: selectedCourse.nombre, // We use the course name as level
        establecimiento: evalEstablecimiento.trim(),
        nombre_docente: evalDocente.trim(),
        fecha_aplicacion: evalFecha,
        n_preguntas_sm: nSM,
        n_preguntas_desarrollo: nDesarrollo,
        claves_json: keysSM,
        habilidades_json: skillsSM,
        respuestas_modelo_json: devModelAnswers,
        pauta_json: pautaUnified,
        tabla_especificaciones_json: specSkills.filter(s => s.habilidad.trim()),
        rubrica_json: specRubric.filter(r => r.criterio.trim()),
        user_id: user?.id || '00000000-0000-0000-0000-000000000000'
      };

      let saveUrl = '/api/evaluaciones';
      let method = 'POST';

      if (currentEvalId) {
        // Supposing updating via query params or PUT
        saveUrl = `/api/evaluaciones/${currentEvalId}`;
        method = 'PUT'; // If route supports it, else we make a new one. Wait, in evaluations route it inserts, let's keep it simple and insert new or we can write updating logic in the page.
      }

      // We use Supabase directly on client for quick insertion/updating
      let evalData: any = null;
      if (currentEvalId) {
        const { data, error } = await supabase
          .from('analisis_evaluaciones')
          .update(payload)
          .eq('id', currentEvalId)
          .select()
          .single();
        if (error) throw error;
        evalData = data;
      } else {
        const { data, error } = await supabase
          .from('analisis_evaluaciones')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        evalData = data;
        setCurrentEvalId(data.id);
      }

      // Initialize studentsResults rows for this course
      const initialResults: StudentResult[] = selectedCourse.estudiantes_json.map(est => ({
        analisis_id: evalData.id,
        nombre_estudiante: est.nombre,
        numero_lista: est.numero_lista,
        rut: est.rut,
        respuestas_sm_json: {},
        respuestas_dev_json: {}
      }));

      setStudentsResults(initialResults);
      setFlowStep(2);
    } catch (e: any) {
      console.error(e);
      alert('Error al guardar la evaluación: ' + e.message);
    }
  };

  const handleSpecAddSkill = () => {
    if (specSkills.length >= 8) return;
    setSpecSkills([...specSkills, { habilidad: '', preguntas: '', puntaje: 0 }]);
  };
  
  const handleSpecRemoveSkill = (idx: number) => {
    setSpecSkills(specSkills.filter((_, i) => i !== idx));
  };

  const handleSpecAddRubric = () => {
    if (specRubric.length >= 6) return;
    setSpecRubric([...specRubric, { criterio: '', logrado: '', en_proceso: '', por_lograr: '' }]);
  };

  const handleSpecRemoveRubric = (idx: number) => {
    setSpecRubric(specRubric.filter((_, i) => i !== idx));
  };

  // --- Step 2 Handlers (Hojas de Respuesta) ---
  const handleGenerateAnswerSheetsPdf = async () => {
    if (studentsResults.length === 0) return;
    setGeneratingSheets(true);
    try {
      const { drawHojaRespuestas } = await import('@/lib/templates/drawHojaRespuestas');
      const selectedCourse = cursos.find(c => c.id === evalCursoId);
      const pdf = await drawHojaRespuestas({
        analisisId: currentEvalId || '',
        titulo: evalTitulo,
        nivel: selectedCourse?.nombre || 'Curso',
        establecimiento: evalEstablecimiento,
        nombreDocente: evalDocente,
        fecha: evalFecha,
        nPreguntasSM: nSM,
        nPreguntasDesarrollo: nDesarrollo,
        estudiantes: studentsResults.map(s => ({
          nombre: s.nombre_estudiante,
          numero_lista: s.numero_lista || 0,
          rut: s.rut
        }))
      });
      pdf.save(`Hojas_Respuestas_${evalTitulo.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error al generar las hojas de respuestas.');
    } finally {
      setGeneratingSheets(false);
    }
  };

  // --- Step 3 Handlers (Corrección / OMR) ---
  const handlePhotographUpload = async (index: number, file: File) => {
    const sId = studentsResults[index].numero_lista || index;
    setScannedLoading(prev => ({ ...prev, [sId]: true }));

    try {
      // 1. Convert file to base64 DataURL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // 2. Call local OMR scanner API
        const res = await fetch('/api/evaluador/omr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            nPreguntasSM: nSM
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const parsedAnswers = data.respuestas || {};
            const clean: Record<string, string> = {};
            Object.keys(parsedAnswers).forEach(k => {
              const val = String(parsedAnswers[k]).toUpperCase().trim();
              if (['A', 'B', 'C', 'D'].includes(val)) {
                clean[k] = val;
              }
            });

            // Match student list number or default to current index
            let targetIdx = index;
            if (data.numeroLista) {
              const match = studentsResults.findIndex(s => s.numero_lista === data.numeroLista);
              if (match > -1) targetIdx = match;
            }

            const updated = [...studentsResults];
            updated[targetIdx].respuestas_sm_json = clean;
            setStudentsResults(updated);
            alert(`Hoja de ${updated[targetIdx].nombre_estudiante} (N° ${updated[targetIdx].numero_lista}) leída correctamente.`);
          } else {
            alert('No se pudo decodificar el QR o las respuestas: ' + (data.error || 'Intenta con otra foto.'));
          }
        } else {
          alert('Error en la llamada de OMR en el servidor.');
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      alert('Error al leer el archivo.');
    } finally {
      setScannedLoading(prev => {
        const c = { ...prev };
        delete c[sId];
        return c;
      });
    }
  };

  const handleOpenIAGradingHelper = (idx: number, qNum: string) => {
    setActiveIAGradingIdx(idx);
    setActiveIAGradingQNum(qNum);
    setStudentTextResponse('');
    setSuggestedScoreValue(null);
    setSuggestedScoreJustification('');
  };

  const handleGetIAScoreSuggestion = async () => {
    if (activeIAGradingIdx === null || !activeIAGradingQNum) return;
    setSuggestingScore(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const modelAnswer = devModelAnswers[activeIAGradingQNum];
      const maxScore = devMaxScores[activeIAGradingQNum];

      const res = await fetch('/api/evaluador/informes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'suggest_score',
          studentAnswer: studentTextResponse,
          modelAnswer,
          maxScore
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuggestedScoreValue(data.score);
        setSuggestedScoreJustification(data.justification);
      } else {
        alert(data.error || 'Error al sugerir puntaje.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al conectar con el servidor.');
    } finally {
      setSuggestingScore(false);
    }
  };

  const handleAcceptIAScore = () => {
    if (activeIAGradingIdx === null || !activeIAGradingQNum || suggestedScoreValue === null) return;
    
    const updated = [...studentsResults];
    updated[activeIAGradingIdx].respuestas_dev_json = {
      ...updated[activeIAGradingIdx].respuestas_dev_json,
      [activeIAGradingQNum]: suggestedScoreValue
    };
    setStudentsResults(updated);
    
    // Close modal
    setActiveIAGradingIdx(null);
    setActiveIAGradingQNum(null);
  };

  const handleSaveStep3Results = async () => {
    setSavingResults(true);
    try {
      const rows = calculatedResults.map(r => ({
        analisis_id: currentEvalId,
        nombre_estudiante: r.nombre_estudiante,
        numero_lista: r.numero_lista,
        rut: r.rut,
        respuestas_json: { sm: r.respuestas_sm_json, desarrollo: r.respuestas_dev_json },
        respuestas_sm_json: r.respuestas_sm_json,
        respuestas_dev_json: r.respuestas_dev_json,
        puntaje_sm: r.puntaje_sm,
        puntaje_desarrollo: r.puntaje_desarrollo,
        puntaje_total: r.puntaje_total,
        porcentaje_logro: r.porcentaje_logro,
        nota: r.nota
      }));

      // Delete former ones
      await supabase
        .from('resultados_estudiantes')
        .delete()
        .eq('analisis_id', currentEvalId);

      const { error } = await supabase
        .from('resultados_estudiantes')
        .insert(rows);

      if (error) throw error;
      setFlowStep(4);
    } catch (e: any) {
      console.error(e);
      alert('Error al guardar: ' + e.message);
    } finally {
      setSavingResults(false);
    }
  };

  // --- Step 4 Handlers (Estadísticas & Excel export) ---
  const handleExportNotasExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = sortedResults.map(s => ({
        'N° Lista': s.numero_lista,
        'Estudiante': s.nombre_estudiante,
        'RUT': s.rut || '-',
        'Puntaje SM': s.puntaje_sm,
        'Puntaje Des.': s.puntaje_desarrollo,
        'Puntaje Total': s.puntaje_total,
        '% Logro': `${(s.porcentaje_logro || 0).toFixed(0)}%`,
        'Nota': (s.nota || 1.0).toFixed(1)
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Notas');
      XLSX.writeFile(wb, `REI_Evaluador_Notas_${evalTitulo.replace(/\s+/g, '_')}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Error al exportar a Excel.');
    }
  };

  // --- Step 5 Handlers (Planes e Informes) ---
  const handleGeneratePlanMejora = async () => {
    setGeneratingPlan(true);
    setPlanError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      // Stats wrapper
      const payloadStats = {
        nivel: cursos.find(c => c.id === evalCursoId)?.nombre || 'Curso',
        titulo: evalTitulo,
        totalEstudiantes: calculatedResults.length,
        avgGrade: courseStats?.avgGrade,
        avgPct: courseStats?.avgPct,
        belowFour: courseStats?.belowFour,
        habilidades: courseStats?.skills,
        estudiantes: calculatedResults.map(s => ({
          nombre_estudiante: s.nombre_estudiante,
          nota: s.nota,
          porcentaje_logro: s.porcentaje_logro
        }))
      };

      const res = await fetch('/api/evaluador/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          analisisId: currentEvalId,
          stats: payloadStats
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setPlanError(data.error);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || 'Error al conectar.');
      }

      setPlanResult(data.plan);
      setRemedyCount(data.nextRemediationCount || 1);
    } catch (e: any) {
      console.error(e);
      setPlanError(e.message || 'Error al generar el plan de mejora.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleGenerateParentReports = async () => {
    setGeneratingReports(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/evaluador/informes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          analisisId: currentEvalId,
          estudiantes: calculatedResults.map(s => ({
            nombre: s.nombre_estudiante,
            nota: s.nota,
            porcentaje_logro: s.porcentaje_logro,
            puntaje_sm: s.puntaje_sm,
            puntaje_desarrollo: s.puntaje_desarrollo,
            maxPossible: s.maxPossible
          })),
          asignatura: evalAsignatura
        })
      });

      const data = await res.json();
      if (res.ok && data.informes) {
        setReportsResult(data.informes);
        
        // Sync reports back into calculated results locally
        const updated = calculatedResults.map(c => ({
          ...c,
          informe_apoderado_texto: data.informes[c.nombre_estudiante] || c.informe_apoderado_texto
        }));
        setStudentsResults(updated);
      } else {
        alert(data.error || 'Error al generar informes apoderados.');
      }
    } catch (e) {
      console.error(e);
      alert('Error en el servidor.');
    } finally {
      setGeneratingReports(false);
    }
  };

  const handleDownloadSingleParentReport = async (idx: number) => {
    const est = calculatedResults[idx];
    const text = est.informe_apoderado_texto || reportsResult[est.nombre_estudiante];
    if (!text) {
      alert('Primero debes generar el informe de apoderado.');
      return;
    }

    try {
      const { drawInformeApoderado } = await import('@/lib/templates/drawInformeApoderado');
      const pdf = drawInformeApoderado({
        establecimiento: evalEstablecimiento,
        nombreDocente: evalDocente,
        fecha: evalFecha,
        curso: cursos.find(c => c.id === evalCursoId)?.nombre || 'Curso',
        evaluacionTitulo: evalTitulo,
        informes: [{
          nombre: est.nombre_estudiante,
          nota: est.nota || 1.0,
          logros: 'Obtuvo un rendimiento destacado en preguntas de comprensión lectora y vocabulario.',
          reforzar: 'Debe practicar redacción escrita y fundamentar sus respuestas en base a evidencias.',
          mensaje: text
        }]
      });
      pdf.save(`Informe_Apoderado_${est.nombre_estudiante.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error al generar PDF de informe.');
    }
  };

  const handleDownloadCombinedParentReports = async () => {
    const missing = calculatedResults.some(c => !c.informe_apoderado_texto && !reportsResult[c.nombre_estudiante]);
    if (missing) {
      alert('Primero debes generar los informes para todos los apoderados.');
      return;
    }

    setCombinedPDFGenerating(true);
    try {
      const { drawInformeApoderado } = await import('@/lib/templates/drawInformeApoderado');
      const list = calculatedResults.map(est => ({
        nombre: est.nombre_estudiante,
        nota: est.nota || 1.0,
        logros: 'Domina los contenidos de alternativas y habilidades directas.',
        reforzar: 'Reforzar las respuestas de desarrollo justificando los argumentos.',
        mensaje: est.informe_apoderado_texto || reportsResult[est.nombre_estudiante]
      }));

      const pdf = drawInformeApoderado({
        establecimiento: evalEstablecimiento,
        nombreDocente: evalDocente,
        fecha: evalFecha,
        curso: cursos.find(c => c.id === evalCursoId)?.nombre || 'Curso',
        evaluacionTitulo: evalTitulo,
        informes: list
      });
      pdf.save(`Informes_Apoderados_CONSOLIDADO_${evalTitulo.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Error al generar el consolidado.');
    } finally {
      setCombinedPDFGenerating(false);
    }
  };

  const handleDownloadWordImprovementPlan = async () => {
    try {
      const completeAnalisis = {
        titulo: evalTitulo,
        nivel: cursos.find(c => c.id === evalCursoId)?.nombre || 'Curso',
        establecimiento: evalEstablecimiento,
        nombre_docente: evalDocente,
        n_preguntas_sm: nSM,
        n_preguntas_desarrollo: nDesarrollo,
        pauta_json: { ...keysSM, ...devMaxScores },
        tabla_especificaciones_json: specSkills.filter(s => s.habilidad.trim()),
        rubrica_json: specRubric.filter(r => r.criterio.trim()),
        plan_mejora_json: planResult,
        created_at: new Date().toISOString()
      };

      const formatted = calculatedResults.map(s => ({
        nombre_estudiante: s.nombre_estudiante,
        respuestas_json: { ...s.respuestas_sm_json, ...s.respuestas_dev_json },
        puntaje_sm: s.puntaje_sm || 0,
        puntaje_desarrollo: s.puntaje_desarrollo || 0,
        puntaje_total: s.puntaje_total || 0,
        porcentaje_logro: s.porcentaje_logro || 0,
        nota: s.nota || 1.0
      }));

      const { drawPlanMejoraWord } = await import('@/lib/templates/drawPlanMejoraWord');
      const blob = await drawPlanMejoraWord(completeAnalisis, formatted);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `REI_Evaluador_PlanMejora_${evalTitulo.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al exportar informe a Word.');
    }
  };

  const handleLoadPreviousEval = async (ev: any) => {
    setEvalLoading(true);
    try {
      // Fetch evaluation details and answers
      setCurrentEvalId(ev.id);
      setEvalTitulo(ev.titulo || 'Evaluación');
      setEvalAsignatura(ev.asignatura || '');
      setEvalEstablecimiento(ev.establecimiento || '');
      setEvalDocente(ev.nombre_docente || '');
      setEvalFecha(ev.fecha_aplicacion || new Date().toISOString().split('T')[0]);
      setNSM(ev.n_preguntas_sm || 20);
      setNDesarrollo(ev.n_preguntas_desarrollo || 0);

      // Restore spec structures
      setSpecSkills(ev.tabla_especificaciones_json?.length > 0 ? ev.tabla_especificaciones_json : [{ habilidad: '', preguntas: '', puntaje: 0 }]);
      setSpecRubric(ev.rubrica_json?.length > 0 ? ev.rubrica_json : [{ criterio: '', logrado: '', en_proceso: '', por_lograr: '' }]);

      // Split keys
      const keysSMTemp: Record<string, string> = {};
      const skillsSMTemp: Record<string, string> = {};
      const devMaxScoresTemp: Record<string, number> = {};
      const devModelAnswersTemp: Record<string, string> = {};

      const pauta = ev.pauta_json || {};
      Object.keys(pauta).forEach(k => {
        if (typeof pauta[k] === 'number') {
          devMaxScoresTemp[k] = pauta[k];
        } else {
          keysSMTemp[k] = pauta[k];
        }
      });
      setKeysSM(keysSMTemp);
      setDevMaxScores(devMaxScoresTemp);
      
      if (ev.habilidades_json) setSkillsSM(ev.habilidades_json);
      if (ev.respuestas_modelo_json) setDevModelAnswers(ev.respuestas_modelo_json);
      if (ev.plan_mejora_json) setPlanResult(ev.plan_mejora_json);

      // Match course
      const matchCurso = cursos.find(c => c.nombre === ev.nivel);
      if (matchCurso) setEvalCursoId(matchCurso.id || '');

      // Load results
      const { data: results, error } = await supabase
        .from('resultados_estudiantes')
        .select('*')
        .eq('analisis_id', ev.id);

      if (results) {
        const mapped: StudentResult[] = results.map(r => ({
          id: r.id,
          analisis_id: r.analisis_id,
          nombre_estudiante: r.nombre_estudiante,
          numero_lista: r.numero_lista,
          rut: r.rut,
          respuestas_sm_json: r.respuestas_sm_json || r.respuestas_json?.sm || {},
          respuestas_dev_json: r.respuestas_dev_json || r.respuestas_json?.desarrollo || {},
          informe_apoderado_texto: r.informe_apoderado_texto || ''
        }));
        setStudentsResults(mapped);

        // Map parent reports locally if saved
        const rep: Record<string, string> = {};
        mapped.forEach(m => {
          if (m.informe_apoderado_texto) {
            rep[m.nombre_estudiante] = m.informe_apoderado_texto;
          }
        });
        setReportsResult(rep);
      }

      setIsFlowActive(true);
      setFlowStep(3); // Skip directly to scan/correct view
    } catch (e) {
      console.error(e);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleExitFlow = () => {
    setIsFlowActive(false);
    fetchEvaluaciones();
  };

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
        
        {/* Header toolbar */}
        <header className="bg-white border-b border-slate-200/70 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#7C3AED20,#EC489920)' }}>
              <ClipboardCheck className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <h1 className="text-sm font-black leading-none" style={{ color: '#0F172A' }}>Evaluador REI</h1>
              <p className="text-[10px] leading-snug mt-1 font-medium italic max-w-sm" style={{ color: '#7C3AED' }}>
                ✨ Te acompañaré a revisar, analizar y comprender los resultados de tus estudiantes — con IA a tu lado.
              </p>
            </div>
          </div>

          {isFlowActive && (
            <button
              onClick={handleExitFlow}
              className="text-xs font-bold bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
            >
              Salir de flujo
            </button>
          )}
        </header>

        {/* ── FLOW OR MAIN MODULE LISTS ── */}
        {!isFlowActive ? (
          <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
            
            {/* Navigation sub-tabs */}
            <div className="flex gap-4 border-b border-slate-200 pb-1">
              <button
                onClick={() => { setActiveTab('evaluaciones'); setIsEditingCurso(false); }}
                className={`py-2 px-1 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${activeTab === 'evaluaciones' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                <FileText className="w-4.5 h-4.5" /> Mis Evaluaciones
              </button>
              <button
                onClick={() => { setActiveTab('cursos'); setIsEditingCurso(false); }}
                className={`py-2 px-1 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${activeTab === 'cursos' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                <Users className="w-4.5 h-4.5" /> Mis Cursos
              </button>
            </div>

            {/* TAB CONTENT: CURSOS */}
            {activeTab === 'cursos' && (
              <div className="space-y-6">
                {!isEditingCurso ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cursos Registrados</h2>
                      <button
                        onClick={handleAddNewCurso}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Nuevo Curso
                      </button>
                    </div>

                    {cursosLoading ? (
                      <div className="h-48 flex items-center justify-center bg-white border rounded-2xl">
                        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
                      </div>
                    ) : cursos.length === 0 ? (
                      <div className="h-48 flex flex-col items-center justify-center bg-white border border-dashed rounded-3xl p-6 text-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <h4 className="font-bold text-slate-800 text-sm">No tienes cursos registrados</h4>
                        <p className="text-xs text-slate-450 max-w-xs">Registra tus cursos y listas de alumnos una vez para poder usarlas en múltiples evaluaciones.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cursos.map(c => (
                          <div key={c.id} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-sm transition-shadow">
                            <div className="space-y-1">
                              <h3 className="text-base font-black text-slate-900 leading-tight">{c.nombre}</h3>
                              <p className="text-[10px] text-slate-450 uppercase font-extrabold tracking-wider">{c.nivel} · {c.estudiantes_json.length} Estudiantes</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCurso(c)}
                                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                Ver Lista / Editar
                              </button>
                              <button
                                onClick={() => handleDeleteCurso(c.id || '')}
                                className="p-2 border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Creating or editing course form
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{editingCursoId ? 'Editar Curso' : 'Registrar Nuevo Curso'}</h2>
                      <button onClick={() => setIsEditingCurso(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450">
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Nombre del Curso (ej: 8°A, 2° Medio B)</label>
                        <input
                          type="text"
                          value={cursoNombre}
                          onChange={(e) => setCursoNombre(e.target.value)}
                          placeholder="Ej: 3° Medio B"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Nivel Educativo</label>
                        <select
                          value={cursoNivel}
                          onChange={(e) => setCursoNivel(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        >
                          <option value="Básica">Educación Básica</option>
                          <option value="Media">Educación Media</option>
                        </select>
                      </div>
                    </div>

                    {/* Students upload options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Copy Paste Text */}
                      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Opción 1: Pegar Lista de Nombres</h3>
                        <p className="text-[10px] text-slate-450">Pega los nombres de tus alumnos de Excel, un estudiante por línea (Máx 45):</p>
                        <textarea
                          rows={6}
                          value={rawTextNames}
                          onChange={(e) => setRawTextNames(e.target.value)}
                          placeholder="Juan Pérez&#10;María González&#10;Sebastián Soto"
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleLoadTextNames}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Cargar Nombres
                        </button>
                      </div>

                      {/* Excel Upload */}
                      <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Opción 2: Subir Excel o CSV</h3>
                          <p className="text-[10px] text-slate-450 leading-relaxed">
                            Sube un archivo de Excel (.xlsx) o de valores delimitados por comas (.csv).<br />
                            - Primera columna: Nombre completo del estudiante.<br />
                            - Segunda columna (opcional): RUT del estudiante.
                          </p>
                        </div>
                        <div className="pt-4">
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-rose-400 bg-white rounded-xl p-4 cursor-pointer transition-colors text-center">
                            <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-slate-600">Seleccionar Archivo</span>
                            <input
                              type="file"
                              accept=".xlsx, .xls, .csv"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleExcelImport(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Preview / Student list editor */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Lista de Estudiantes cargados ({cursoEstudiantes.length}/45)</h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Student list builder */}
                        <div className="lg:col-span-2 overflow-y-auto max-h-96 pr-2 border rounded-2xl bg-white">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                                <th className="py-2.5 px-3 w-12 text-center">N°</th>
                                <th className="py-2.5 px-4">Nombre</th>
                                <th className="py-2.5 px-4">RUT (opcional)</th>
                                <th className="py-2.5 px-4 text-center w-28">Acción / Orden</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {cursoEstudiantes.map((s, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3 text-center font-bold text-slate-400">{s.numero_lista}</td>
                                  <td className="py-2 px-4 font-bold text-slate-800">{s.nombre}</td>
                                  <td className="py-2 px-4 text-slate-500 font-mono">{s.rut || '-'}</td>
                                  <td className="py-2 px-4">
                                    <div className="flex justify-center items-center gap-1">
                                      <button type="button" onClick={() => handleMoveStudent(idx, 'up')} className="p-1 hover:bg-slate-150 rounded text-slate-500">
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button type="button" onClick={() => handleMoveStudent(idx, 'down')} className="p-1 hover:bg-slate-150 rounded text-slate-500">
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button type="button" onClick={() => handleRemoveStudentFromList(idx)} className="p-1 hover:bg-rose-50 rounded text-rose-600 ml-2">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {cursoEstudiantes.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-xs italic text-slate-400">
                                    Lista vacía. Carga estudiantes usando la caja de texto o subiendo un archivo Excel.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Add student inline */}
                        <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4 h-fit">
                          <h4 className="text-xs font-bold text-slate-700">Agregar Estudiante Individual</h4>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre Completo</label>
                            <input
                              type="text"
                              value={newStudentName}
                              onChange={(e) => setNewStudentName(e.target.value)}
                              placeholder="Ej: Pedro Valdivia"
                              className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">RUT (Opcional)</label>
                            <input
                              type="text"
                              value={newStudentRut}
                              onChange={(e) => setNewStudentRut(e.target.value)}
                              placeholder="Ej: 19.345.678-K"
                              className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleAddIndividualStudent}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Agregar a la Lista
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Form actions */}
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => setIsEditingCurso(false)}
                        className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveCurso}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        Guardar Curso
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: EVALUACIONES */}
            {activeTab === 'evaluaciones' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Historial de Evaluaciones</h2>
                  <button
                    onClick={handleAddNewEval}
                    disabled={cursos.length === 0}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Nueva Evaluación
                  </button>
                </div>

                {cursos.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-2xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      Debe <button onClick={() => { setActiveTab('cursos'); handleAddNewCurso(); }} className="underline font-bold">crear un curso primero</button> antes de poder formular evaluaciones.
                    </div>
                  </div>
                )}

                {evalLoading ? (
                  <div className="h-48 flex items-center justify-center bg-white border rounded-2xl">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
                  </div>
                ) : evaluaciones.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center bg-white border border-dashed rounded-3xl p-6 text-center space-y-2">
                    <ClipboardCheck className="w-8 h-8 text-slate-300" />
                    <h4 className="font-bold text-slate-800 text-sm">No tienes evaluaciones registradas</h4>
                    <p className="text-xs text-slate-450 max-w-xs">Comienza una nueva evaluación para poder escanear las hojas de respuestas y analizar el curso.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {evaluaciones.map(e => (
                      <div
                        key={e.id}
                        onClick={() => handleLoadPreviousEval(e)}
                        className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-800 leading-tight group-hover:text-rose-700 transition-colors">{e.titulo}</h3>
                          <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">{e.asignatura || 'Sin Asignatura'} · {e.nivel}</p>
                          <p className="text-[10px] text-slate-400">Fecha: {e.fecha_aplicacion ? new Date(e.fecha_aplicacion).toLocaleDateString('es-CL') : 'No registrada'}</p>
                        </div>
                        <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-rose-500" /> Rendimiento OMR
                          </span>
                          <span className="text-rose-600 hover:underline flex items-center gap-0.5">
                            Ver Análisis <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        ) : (
          
          // FLOW WIZARD STEPS
          <div className="flex-1 flex flex-col min-h-0 bg-[#F8F9FC]">
            {/* Steps mini toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex gap-4 text-xs font-semibold text-slate-400 select-none overflow-x-auto">
              {[
                { num: 1, label: '1. Pauta e Instrumento' },
                { num: 2, label: '2. Imprimir Hojas' },
                { num: 3, label: '3. Escanear & Corregir' },
                { num: 4, label: '4. Estadísticas del Curso' },
                { num: 5, label: '5. Planes e Informes IA' }
              ].map(s => (
                <button
                  key={s.num}
                  disabled={currentEvalId === null && s.num > 1}
                  onClick={() => setFlowStep(s.num)}
                  className={`flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${flowStep === s.num ? 'text-rose-600 font-black' : ''} ${flowStep > s.num ? 'text-emerald-600' : ''}`}
                >
                  {flowStep > s.num ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">{s.num}</span>}
                  <span>{s.label}</span>
                  {s.num < 5 && <ChevronRight className="w-3 h-3 text-slate-350 ml-1" />}
                </button>
              ))}
            </div>

            <main className="p-6 max-w-7xl mx-auto w-full flex-grow">
              
              {/* FLOW STEP 1: CONFIGURATION */}
              {flowStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Parámetros de la Evaluación</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Título de la Evaluación</label>
                        <input
                          type="text"
                          value={evalTitulo}
                          onChange={(e) => setEvalTitulo(e.target.value)}
                          placeholder="Ej: Ensayo Lenguaje U1"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Asignatura</label>
                        <input
                          type="text"
                          value={evalAsignatura}
                          onChange={(e) => setEvalAsignatura(e.target.value)}
                          placeholder="Ej: Matemática"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Curso Registrado</label>
                        <select
                          value={evalCursoId}
                          onChange={(e) => setEvalCursoId(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        >
                          <option value="">Selecciona un curso...</option>
                          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.estudiantes_json.length} alumnos)</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Establecimiento</label>
                        <input
                          type="text"
                          value={evalEstablecimiento}
                          onChange={(e) => setEvalEstablecimiento(e.target.value)}
                          placeholder="Ej: Colegio San Agustín"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">N° Preguntas de Selección Múltiple (Máx 40)</label>
                        <input
                          type="number"
                          min={1}
                          max={40}
                          value={nSM}
                          onChange={(e) => setNSM(Math.min(40, Math.max(1, Number(e.target.value) || 0)))}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">N° Preguntas de Desarrollo (Máx 5)</label>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={nDesarrollo}
                          onChange={(e) => setNDesarrollo(Math.min(5, Math.max(0, Number(e.target.value) || 0)))}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inline keys and skills */}
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Claves de Pauta & Contenidos</h2>

                    {nSM > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500">Respuestas Selección Múltiple:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Array.from({ length: nSM }).map((_, i) => {
                            const qNum = i + 1;
                            return (
                              <div key={qNum} className="flex items-center gap-3 p-3 border border-slate-100 rounded-2xl bg-slate-50/30">
                                <span className="text-xs font-black text-slate-400">P{qNum}</span>
                                <select
                                  value={keysSM[String(qNum)] || 'A'}
                                  onChange={(e) => setKeysSM(prev => ({ ...prev, [String(qNum)]: e.target.value }))}
                                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none w-16"
                                >
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Habilidad (Inferencia, Vocab.)"
                                  value={skillsSM[String(qNum)] || ''}
                                  onChange={(e) => setSkillsSM(prev => ({ ...prev, [String(qNum)]: e.target.value }))}
                                  className="flex-grow text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {nDesarrollo > 0 && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <h3 className="text-xs font-bold text-slate-500">Respuestas Desarrollo:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Array.from({ length: nDesarrollo }).map((_, i) => {
                            const qNum = nSM + i + 1;
                            return (
                              <div key={qNum} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-700">Pregunta {qNum}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-450">Puntaje Máx:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={10}
                                      value={devMaxScores[String(qNum)] ?? 3}
                                      onChange={(e) => {
                                        const val = Math.min(10, Math.max(1, Number(e.target.value) || 1));
                                        setDevMaxScores(prev => ({ ...prev, [String(qNum)]: val }));
                                      }}
                                      className="w-12 text-center text-xs font-bold bg-white border border-slate-200 rounded p-1"
                                    />
                                  </div>
                                </div>
                                <textarea
                                  rows={2}
                                  placeholder="Respuesta esperada o modelo para calificar..."
                                  value={devModelAnswers[String(qNum)] || ''}
                                  onChange={(e) => setDevModelAnswers(prev => ({ ...prev, [String(qNum)]: e.target.value }))}
                                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Specification list */}
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tabla de Especificaciones (Opcional)</h2>
                      <button
                        type="button"
                        onClick={handleSpecAddSkill}
                        disabled={specSkills.length >= 8}
                        className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Habilidad
                      </button>
                    </div>

                    <div className="space-y-3">
                      {specSkills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-grow grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              placeholder="Habilidad (ej: Localizar)"
                              value={skill.habilidad}
                              onChange={(e) => {
                                const copy = [...specSkills];
                                copy[index].habilidad = e.target.value;
                                setSpecSkills(copy);
                              }}
                              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Preguntas asociadas (ej: 1,3,5)"
                              value={skill.preguntas}
                              onChange={(e) => {
                                const copy = [...specSkills];
                                copy[index].preguntas = e.target.value;
                                setSpecSkills(copy);
                              }}
                              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Puntaje"
                              value={skill.puntaje || ''}
                              onChange={(e) => {
                                const copy = [...specSkills];
                                copy[index].puntaje = Number(e.target.value) || 0;
                                setSpecSkills(copy);
                              }}
                              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSpecRemoveSkill(index)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rubric */}
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Rúbrica de Desarrollo (Opcional)</h2>
                      <button
                        type="button"
                        onClick={handleSpecAddRubric}
                        disabled={specRubric.length >= 6}
                        className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar Criterio
                      </button>
                    </div>

                    <div className="space-y-4">
                      {specRubric.map((rub, index) => (
                        <div key={index} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30 space-y-3 relative pr-10">
                          <button
                            type="button"
                            onClick={() => handleSpecRemoveRubric(index)}
                            className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input
                              type="text"
                              placeholder="Criterio (ej: Ortografía)"
                              value={rub.criterio}
                              onChange={(e) => {
                                const copy = [...specRubric];
                                copy[index].criterio = e.target.value;
                                setSpecRubric(copy);
                              }}
                              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Logrado"
                              value={rub.logrado}
                              onChange={(e) => {
                                const copy = [...specRubric];
                                copy[index].logrado = e.target.value;
                                setSpecRubric(copy);
                              }}
                              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="En proceso"
                              value={rub.en_proceso}
                              onChange={(e) => {
                                const copy = [...specRubric];
                                copy[index].en_proceso = e.target.value;
                                setSpecRubric(copy);
                              }}
                              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Por lograr"
                              value={rub.por_lograr}
                              onChange={(e) => {
                                const copy = [...specRubric];
                                copy[index].por_lograr = e.target.value;
                                setSpecRubric(copy);
                              }}
                              className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveEvalConfig}
                      className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      Guardar y Generar Hojas <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* FLOW STEP 2: GENERATE SHEETS */}
              {flowStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 max-w-xl mx-auto text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h2 className="font-black text-slate-800 text-base">Hojas de Respuesta Listas</h2>
                    <p className="text-xs text-slate-450 leading-relaxed">
                      Se generará un PDF consolidado con una hoja de respuesta para cada uno de los {studentsResults.length} estudiantes.<br />
                      Cada hoja posee un código QR único que asocia al estudiante automáticamente al momento de fotografiarla.
                    </p>

                    <div className="pt-4 flex flex-col gap-2">
                      <button
                        onClick={handleGenerateAnswerSheetsPdf}
                        disabled={generatingSheets}
                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {generatingSheets ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" /> Generando PDF...
                          </>
                        ) : (
                          <>
                            <Download className="w-4.5 h-4.5" /> Descargar Hojas de Respuesta (.pdf)
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setFlowStep(3)}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Continuar al Escaneo e Ingreso
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FLOW STEP 3: CAPTURE AND CORRECTION */}
              {flowStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Paso 3: Captura de Respuestas y Corrección OMR</h2>
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full font-mono">{studentsResults.length} estudiantes</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-2 text-center w-12">N°</th>
                            <th className="py-3 px-4">Estudiante</th>
                            <th className="py-3 px-4">Fotografía OMR (Alternativas)</th>
                            {nDesarrollo > 0 && (
                              <th className="py-3 px-4">Respuestas de Desarrollo</th>
                            )}
                            <th className="py-3 px-4 text-center w-24">Puntaje</th>
                            <th className="py-3 px-4 text-center w-24">% Logro</th>
                            <th className="py-3 px-4 text-center w-24">Nota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {calculatedResults.map((est, idx) => {
                            const isScanning = scannedLoading[est.numero_lista || idx];
                            const smAnswersCount = Object.keys(est.respuestas_sm_json || {}).length;

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-3 px-2 text-center font-bold text-slate-400">{est.numero_lista}</td>
                                <td className="py-3 px-4 font-bold text-slate-850">
                                  {est.nombre_estudiante}
                                  {est.rut && <span className="text-[10px] text-slate-400 font-mono block">{est.rut}</span>}
                                </td>
                                
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    {isScanning ? (
                                      <span className="flex items-center gap-1.5 text-[11px] text-rose-600 font-bold animate-pulse">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando burbujas...
                                      </span>
                                    ) : (
                                      <label className="flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors">
                                        <Camera className="w-4 h-4" />
                                        <span>{smAnswersCount > 0 ? `Re-escanear (${smAnswersCount}/${nSM})` : 'Fotografiar Hoja'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          className="hidden"
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handlePhotographUpload(idx, e.target.files[0]);
                                            }
                                          }}
                                        />
                                      </label>
                                    )}

                                    {smAnswersCount > 0 && !isScanning && (
                                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                                        Leído ✓
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {nDesarrollo > 0 && (
                                  <td className="py-3 px-4">
                                    <div className="flex flex-col gap-2">
                                      {Array.from({ length: nDesarrollo }).map((_, dIdx) => {
                                        const qNum = nSM + dIdx + 1;
                                        const max = devMaxScores[String(qNum)] || 1;
                                        return (
                                          <div key={qNum} className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-400 font-bold">P{qNum}:</span>
                                            <input
                                              type="number"
                                              min={0}
                                              max={max}
                                              value={est.respuestas_dev_json?.[String(qNum)] ?? ''}
                                              onChange={(e) => {
                                                const val = Math.min(max, Math.max(0, Number(e.target.value) || 0));
                                                const updated = [...studentsResults];
                                                updated[idx].respuestas_dev_json = {
                                                  ...updated[idx].respuestas_dev_json,
                                                  [String(qNum)]: val
                                                };
                                                setStudentsResults(updated);
                                              }}
                                              className="w-10 px-1 py-1 border border-slate-200 rounded text-center text-xs font-bold focus:outline-none focus:border-rose-500"
                                            />
                                            <span className="text-[9px] text-slate-450 font-medium">/{max}</span>
                                            <button
                                              onClick={() => handleOpenIAGradingHelper(idx, String(qNum))}
                                              className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded transition-colors"
                                            >
                                              Sugerir con Haiku
                                            </button>
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
                                  {est.porcentaje_logro?.toFixed(0)}%
                                </td>
                                <td className={`py-3 px-4 text-center font-black text-sm ${est.nota && est.nota < 4.0 ? 'text-rose-600 bg-rose-50/10' : 'text-emerald-700'}`}>
                                  {est.nota?.toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setFlowStep(1)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition-all"
                      >
                        ← Volver a Configuración
                      </button>
                      <button
                        onClick={handleSaveStep3Results}
                        disabled={savingResults || Object.keys(scannedLoading).length > 0}
                        className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        {savingResults ? (
                          <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" /> Guardando...
                          </>
                        ) : (
                          <>
                            Guardar y Ver Estadísticas <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FLOW STEP 4: STATISTICS */}
              {flowStep === 4 && courseStats && (
                <div className="space-y-6">
                  
                  {/* Tab switches */}
                  <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setStatsTab('curso')}
                        className={`py-3.5 px-1 text-sm font-black border-b-2 transition-all flex items-center gap-1.5 ${statsTab === 'curso' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                      >
                        <FileText className="w-4.5 h-4.5" /> Estadísticas del Curso
                      </button>
                      <button
                        onClick={() => setStatsTab('estudiante')}
                        className={`py-3.5 px-1 text-sm font-black border-b-2 transition-all flex items-center gap-1.5 ${statsTab === 'estudiante' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                      >
                        <User className="w-4.5 h-4.5" /> Ficha Estudiante
                      </button>
                    </div>

                    <div className="pb-2">
                      <button
                        onClick={handleExportNotasExcel}
                        className="px-4 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4.5 h-4.5" /> Exportar a Excel (.xlsx)
                      </button>
                    </div>
                  </div>

                  {/* STATS: CURSO */}
                  {statsTab === 'curso' && (
                    <div className="space-y-6">
                      
                      {/* Grid cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xl">
                            {courseStats.avgGrade}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-455 uppercase font-black tracking-wider leading-none">Promedio Curso</p>
                            <h4 className="text-slate-700 font-bold text-sm mt-1">Nota Escala 1-7</h4>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xl">
                            {parseFloat(courseStats.avgPct).toFixed(0)}%
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-455 uppercase font-black tracking-wider leading-none">Logro Curso</p>
                            <h4 className="text-slate-700 font-bold text-sm mt-1">Rendimiento Promedio</h4>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-xl">
                            {courseStats.aboveFour}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-455 uppercase font-black tracking-wider leading-none">Aprobados</p>
                            <h4 className="text-slate-700 font-bold text-sm mt-1">Nota ≥ 4.0</h4>
                          </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                          <div className={`p-3 rounded-2xl font-black text-xl ${courseStats.belowFour > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                            {courseStats.belowFour}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-455 uppercase font-black tracking-wider leading-none">Reprobados</p>
                            <h4 className="text-slate-700 font-bold text-sm mt-1">Nota &lt; 4.0</h4>
                          </div>
                        </div>
                      </div>

                      {/* SVG Bar graphs distribution */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Grades SVG */}
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Distribución de Calificaciones</h3>
                          <div className="h-56 flex items-end justify-around border-b border-slate-200 pb-3">
                            {[
                              { label: '1.0 - 2.9', val: courseStats.dist.insuficiente_muy, color: '#EF4444' },
                              { label: '3.0 - 3.9', val: courseStats.dist.insuficiente, color: '#F59E0B' },
                              { label: '4.0 - 5.4', val: courseStats.dist.suficiente, color: '#10B981' },
                              { label: '5.5 - 6.4', val: courseStats.dist.bueno, color: '#3B82F6' },
                              { label: '6.5 - 7.0', val: courseStats.dist.excelente, color: '#8B5CF6' }
                            ].map((d, i) => {
                              const maxVal = Math.max(...Object.values(courseStats.dist), 1);
                              const barHeight = (d.val / maxVal) * 140;
                              return (
                                <div key={i} className="flex flex-col items-center w-full group relative">
                                  <span className="text-[9px] font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 absolute -top-5 transition-opacity">
                                    {d.val} Alum.
                                  </span>
                                  <div
                                    style={{ height: `${Math.max(8, barHeight)}px`, backgroundColor: d.color }}
                                    className="w-10 rounded-t shadow-2xs transition-all hover:brightness-95"
                                  />
                                  <span className="text-[10px] text-slate-400 mt-2 font-bold">{d.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Skills Achievement SVG */}
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rendimiento por Habilidad</h3>
                          {courseStats.skills.length > 0 ? (
                            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                              {courseStats.skills.map((s, idx) => {
                                const fill = s.pct < 50 ? 'bg-rose-500' : s.pct < 70 ? 'bg-amber-400' : 'bg-emerald-500';
                                return (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                      <span className="text-slate-700">{s.habilidad}</span>
                                      <span className="text-slate-500">{s.pct}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div style={{ width: `${s.pct}%` }} className={`h-full ${fill} transition-all`} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-56 flex items-center justify-center border border-dashed border-slate-100 rounded-2xl text-xs italic text-slate-400">
                              Define la tabla de especificaciones en el Paso 1 para desglosar el logro por habilidades.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SVG Logro por pregunta */}
                      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Porcentaje de Respuestas Correctas por Pregunta</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          {courseStats.questions.map((q) => {
                            const barColor = q.pct < 50 ? 'bg-rose-500' : q.pct < 70 ? 'bg-amber-400' : 'bg-emerald-500';
                            return (
                              <div key={q.qNum} className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-1 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400">P{q.qNum}</span>
                                  <span className="text-xs font-bold text-slate-800">{q.pct.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div style={{ width: `${q.pct}%` }} className={`h-full ${barColor} transition-all`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comparative study if same level exists */}
                      {comparativeCourses.length > 0 && (
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comparativa entre Paralelos del Nivel</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                                  <th className="py-2.5 px-4">Curso</th>
                                  <th className="py-2.5 px-4 text-center">N° Estudiantes</th>
                                  <th className="py-2.5 px-4 text-center">Nivel</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                <tr className="bg-rose-50/20 font-bold">
                                  <td className="py-2.5 px-4 text-rose-700">{cursos.find(c => c.id === evalCursoId)?.nombre} (Curso actual)</td>
                                  <td className="py-2.5 px-4 text-center">{calculatedResults.length}</td>
                                  <td className="py-2.5 px-4 text-center">{cursos.find(c => c.id === evalCursoId)?.nivel}</td>
                                </tr>
                                {comparativeCourses.map(cc => (
                                  <tr key={cc.id}>
                                    <td className="py-2.5 px-4">{cc.nombre}</td>
                                    <td className="py-2.5 px-4 text-center">{cc.estudiantes_json.length}</td>
                                    <td className="py-2.5 px-4 text-center">{cc.nivel}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Table individual list */}
                      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listado General del Curso</h3>
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
                                <th className="py-2.5 px-4">N° Lista</th>
                                <th className="py-2.5 px-4">Estudiante</th>
                                <th className="py-2.5 px-4 text-center">Respuestas SM</th>
                                <th className="py-2.5 px-4 text-center">Nota</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {sortedResults.map((s) => (
                                <tr key={s.id || s.nombre_estudiante} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-4 font-bold text-slate-400">{s.numero_lista}</td>
                                  <td className="py-2.5 px-4 font-bold text-slate-700">{s.nombre_estudiante}</td>
                                  <td className="py-2.5 px-4 text-center font-mono">{Object.keys(s.respuestas_sm_json || {}).length} / {nSM} cargadas</td>
                                  <td className={`py-2.5 px-4 text-center font-black ${s.nota && s.nota < 4.0 ? 'text-rose-600 bg-rose-50/30' : 'text-emerald-700'}`}>
                                    {s.nota?.toFixed(1)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Sparkles next step block */}
                      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 text-white space-y-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                          <h3 className="font-black text-base flex items-center gap-1.5">
                            <Sparkles className="w-5 h-5 animate-pulse" /> Plan de Mejora & Informes con IA
                          </h3>
                          <p className="text-xs text-rose-100 max-w-xl">
                            Continúa al siguiente paso para que la IA (Claude Sonnet y Haiku) redacte un plan de mejora pedagógica remedial, prepare derivaciones RTI y genere cartas explicativas motivacionales para cada apoderado.
                          </p>
                        </div>
                        <button
                          onClick={() => setFlowStep(5)}
                          className="px-5 py-3 bg-white text-rose-700 hover:bg-rose-50 font-black rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          Ir al Paso 5 (IA) <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STATS: ESTUDIANTE */}
                  {statsTab === 'estudiante' && selectedStudentStats && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left student picker */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
                          <label className="text-xs font-bold text-slate-500 block">Seleccionar Estudiante</label>
                          <select
                            value={selectedStudentIdx}
                            onChange={(e) => setSelectedStudentIdx(Number(e.target.value))}
                            className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                          >
                            {calculatedResults.map((s, idx) => (
                              <option key={idx} value={idx}>{s.nombre_estudiante} (Nota: {s.nota?.toFixed(1)})</option>
                            ))}
                          </select>

                          <div className="border-t border-slate-100 pt-4 flex flex-col items-center text-center space-y-2">
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-650 text-base uppercase shadow-inner">
                              {selectedStudentStats.est.nombre_estudiante.substring(0, 2)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{selectedStudentStats.est.nombre_estudiante}</h4>
                              <p className="text-[10px] text-slate-400">N° Lista {selectedStudentStats.est.numero_lista}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 w-full pt-2">
                              <div className="bg-slate-50 rounded-xl p-2 text-center">
                                <span className="text-[9px] text-slate-400 block font-bold">Puntaje</span>
                                <span className="text-xs font-black text-slate-700">{selectedStudentStats.est.puntaje_total}</span>
                              </div>
                              <div className="bg-slate-50 rounded-xl p-2 text-center">
                                <span className="text-[9px] text-slate-400 block font-bold">% Logro</span>
                                <span className="text-xs font-black text-slate-700">{selectedStudentStats.est.porcentaje_logro?.toFixed(0)}%</span>
                              </div>
                              <div className={`rounded-xl p-2 text-center ${selectedStudentStats.est.nota && selectedStudentStats.est.nota < 4.0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                <span className="text-[9px] block font-bold">Nota</span>
                                <span className="text-xs font-black">{selectedStudentStats.est.nota?.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right answers breakdown */}
                      <div className="lg:col-span-8 space-y-4">
                        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Respuestas del Alumno</h3>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                            {selectedStudentStats.questions.map((q) => {
                              const borderBg = q.tipo === 'sm'
                                ? (q.correct ? 'bg-emerald-50 border-emerald-250 text-emerald-800' : 'bg-rose-50 border-rose-250 text-rose-800')
                                : 'bg-slate-50 border-slate-200 text-slate-800';
                              return (
                                <div key={q.qNum} className={`p-3 border rounded-2xl flex flex-col justify-between space-y-1 ${borderBg}`}>
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase">
                                    <span>P{q.qNum}</span>
                                    <span>{q.tipo === 'sm' ? 'SM' : 'Des.'}</span>
                                  </div>
                                  <div className="flex justify-between items-baseline">
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
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logro por Habilidad del Alumno</h3>
                          {selectedStudentStats.skills.length > 0 ? (
                            <div className="space-y-4">
                              {selectedStudentStats.skills.map((s, idx) => {
                                const fill = s.pct < 50 ? 'bg-rose-500' : s.pct < 70 ? 'bg-amber-400' : 'bg-emerald-500';
                                return (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                      <span className="text-slate-700">{s.habilidad}</span>
                                      <span className="text-slate-500">{s.pct}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div style={{ width: `${s.pct}%` }} className={`h-full ${fill} transition-all`} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs italic text-slate-400">Define la tabla de especificaciones en el Paso 1 para ver el rendimiento individual por habilidades.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-100 pt-4">
                    <button
                      onClick={() => setFlowStep(3)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition-all"
                    >
                      ← Volver a Escanear
                    </button>
                  </div>
                </div>
              )}

              {/* FLOW STEP 5: PLANES E INFORMES IA */}
              {flowStep === 5 && (
                <div className="space-y-6">
                  
                  {/* Part A: Course improvement plan */}
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">I. Plan de Mejora Pedagógica del Curso</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Estrategias y actividades de aula diseñadas por Claude Sonnet</p>
                      </div>
                      
                      {planResult ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleDownloadWordImprovementPlan}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <Download className="w-4 h-4" /> Exportar Plan a Word (.docx)
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleGeneratePlanMejora}
                          disabled={generatingPlan}
                          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {generatingPlan ? (
                            <>
                              <Loader2 className="w-4.5 h-4.5 animate-spin" /> Creando Plan...
                            </>
                          ) : (
                            <>
                              <Sparkle className="w-4 h-4" /> Generar Plan con IA
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {planError && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <p className="font-bold">Límite alcanzado:</p>
                          <p className="mt-0.5">{planError}</p>
                        </div>
                      </div>
                    )}

                    {planResult && (
                      <div className="space-y-6">
                        {/* Top skills */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Habilidades Prioritarias a Reforzar (Nivel de Remediación N° {remedyCount}):</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {planResult.top_habilidades_debiles?.map((h: any, idx: number) => (
                              <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1.5">
                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase">Habilidad {idx + 1}</span>
                                <h5 className="font-bold text-slate-800 text-xs leading-tight">{h.habilidad}</h5>
                                <p className="text-[10px] text-slate-450 leading-relaxed">{h.descripcion}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Strategies */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estrategias en el Aula:</h4>
                          <div className="space-y-2">
                            {planResult.estrategias_pedagogicas?.map((est: string, idx: number) => (
                              <div key={idx} className="flex gap-3 p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl text-xs leading-relaxed">
                                <span className="font-black text-indigo-600 text-sm">0{idx + 1}</span>
                                <p className="font-semibold text-indigo-950">{est}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Activities */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actividades de Remediación Adaptadas:</h4>
                          <div className="space-y-3">
                            {planResult.actividades_sugeridas?.map((act: any, idx: number) => (
                              <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
                                <h5 className="text-xs font-bold text-slate-800">Habilidad: <span className="text-rose-600">{act.habilidad}</span></h5>
                                <p className="text-xs text-slate-500 leading-relaxed pt-1 whitespace-pre-line">{act.actividad}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* RTI Derivations */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan de Seguimiento Individual (Alumnos bajo nota 4.0):</h4>
                          {planResult.seguimiento_estudiantes && planResult.seguimiento_estudiantes.length > 0 ? (
                            <div className="overflow-x-auto border rounded-2xl bg-white">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                                    <th className="py-2.5 px-4">Estudiante</th>
                                    <th className="py-2.5 px-4 text-center">Nota</th>
                                    <th className="py-2.5 px-4">Habilidades a Trabajar</th>
                                    <th className="py-2.5 px-4">Nivel RTI Sugerido</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {planResult.seguimiento_estudiantes.map((s: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-3 px-4 font-bold text-slate-750">{s.nombre}</td>
                                      <td className="py-3 px-4 text-center font-black text-rose-600">{s.nota?.toFixed(1)}</td>
                                      <td className="py-3 px-4">{Array.isArray(s.habilidades_a_reforzar) ? s.habilidades_a_reforzar.join(', ') : String(s.habilidades_a_reforzar)}</td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.nivel_rti === 3 ? 'bg-rose-50 text-rose-700 border border-rose-200' : s.nivel_rti === 2 ? 'bg-amber-50 text-amber-700 border border-amber-250' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                            Nivel {s.nivel_rti || '1'}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-medium">{s.nivel_rti_explicacion}</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs italic text-slate-400">Todos los estudiantes se encuentran aprobados (sobre nota 4.0).</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Part B: Parents reports */}
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">II. Informes Cualitativos para Apoderados</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Cartas individuales redactadas por Claude Haiku dirigidas a la familia</p>
                      </div>

                      {Object.keys(reportsResult).length > 0 ? (
                        <button
                          onClick={handleDownloadCombinedParentReports}
                          disabled={combinedPDFGenerating}
                          className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          {combinedPDFGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Creando Consolidado...
                            </>
                          ) : (
                            <>
                              <FileDown className="w-4 h-4" /> Descargar Todos los Informes (.pdf)
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleGenerateParentReports}
                          disabled={generatingReports}
                          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {generatingReports ? (
                            <>
                              <Loader2 className="w-4.5 h-4.5 animate-spin" /> Generando Informes...
                            </>
                          ) : (
                            <>
                              <Sparkle className="w-4 h-4" /> Generar Informes con Haiku
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {Object.keys(reportsResult).length > 0 && (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {calculatedResults.map((est, idx) => {
                          const text = est.informe_apoderado_texto || reportsResult[est.nombre_estudiante];
                          return (
                            <div key={idx} className="bg-slate-55 border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-200 transition-colors">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-800 text-xs">{est.nombre_estudiante}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${est.nota && est.nota >= 4.0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                    Nota {est.nota?.toFixed(1)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed italic pr-4">&ldquo;{text || 'Pendiente de generación.'}&rdquo;</p>
                              </div>
                              <button
                                onClick={() => handleDownloadSingleParentReport(idx)}
                                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between border-t border-slate-100 pt-4">
                    <button
                      onClick={() => setFlowStep(4)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition-all"
                    >
                      ← Volver a Estadísticas
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* IA Grading suggestion modal */}
      {activeIAGradingIdx !== null && activeIAGradingQNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-800 text-sm">Calificación Asistida con Claude Haiku</h3>
              <button
                onClick={() => {
                  setActiveIAGradingIdx(null);
                  setActiveIAGradingQNum(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 block uppercase text-[10px]">Pregunta {activeIAGradingQNum} (Max: {devMaxScores[activeIAGradingQNum]} Puntos)</span>
                <p className="font-semibold text-slate-800 mt-0.5">Modelo/Esperada: &ldquo;{devModelAnswers[activeIAGradingQNum]}&rdquo;</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 block uppercase text-[10px]">Respuesta del Estudiante ({calculatedResults[activeIAGradingIdx]?.nombre_estudiante})</label>
                <textarea
                  rows={3}
                  value={studentTextResponse}
                  onChange={(e) => setStudentTextResponse(e.target.value)}
                  placeholder="Escribe o copia la respuesta exacta del estudiante aquí..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                />
              </div>

              {suggestedScoreValue !== null && (
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-150 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-indigo-950 font-black">
                    <span>Puntaje Sugerido:</span>
                    <span className="text-sm bg-indigo-100 px-2 py-0.5 rounded text-indigo-800">{suggestedScoreValue} / {devMaxScores[activeIAGradingQNum]}</span>
                  </div>
                  <p className="text-[11px] text-indigo-850 italic font-semibold leading-relaxed">&ldquo;{suggestedScoreJustification}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveIAGradingIdx(null);
                  setActiveIAGradingQNum(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all"
              >
                Cerrar
              </button>
              {suggestedScoreValue !== null ? (
                <button
                  onClick={handleAcceptIAScore}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Aceptar Sugerencia
                </button>
              ) : (
                <button
                  onClick={handleGetIAScoreSuggestion}
                  disabled={suggestingScore || !studentTextResponse.trim()}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  {suggestingScore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Evaluar con IA
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade trial modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-850 text-base leading-tight">Límite de análisis alcanzado</h3>
              <p className="text-xs text-slate-400 mt-1">
                Has alcanzado el límite de 5 planes de mejora e informes cualitativos por IA en tu plan gratuito.
              </p>
            </div>
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                router.push('/');
              }}
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-650 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Suscribirse a Plan Premium
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
