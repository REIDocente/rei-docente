'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  X
} from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, HeadingLevel, WidthType, Footer, PageNumber } from 'docx';
import Sidebar from '@/components/Sidebar';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface EvaluacionRecord {
  id: string;
  titulo: string | null;
  nivel: string;
  eje: string | null;
  oa_codes: string[];
  tipos: string[];
  simce_ensayo: boolean;
  contenido_json: any;
  created_at: string;
}

interface Planning {
  id: string;
  unit: string;
  subject: string;
  grade: string;
  learning_objective: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHILEAN_COURSES = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico',
  '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio'
];

const TIPOS_EVALUACION = [
  { id: 'diagnostica', label: 'Diagnóstica', desc: 'Identifica saberes previos y vacíos de aprendizaje.' },
  { id: 'formativa', label: 'Formativa', desc: 'Monitorea el proceso de aprendizaje sin calificación directa.' },
  { id: 'sumativa', label: 'Sumativa', desc: 'Calificación al término de una unidad o proceso.' },
  { id: 'simce', label: 'SIMCE', desc: 'Ensayo alineado a estándares nacionales SIMCE.' }
];

const INSTRUMENTOS = [
  { id: 'rubrica_holistica', label: 'Holística', desc: 'Evaluación global del desempeño general.' },
  { id: 'lista_cotejo', label: 'Lista de cotejo', desc: 'Indicadores dicotómicos Sí / No.' },
  { id: 'analitica_descriptiva', label: 'Analítica descriptiva', desc: 'Desglose detallado por criterios con descriptores.' },
  { id: 'analitica_cuantitativa', label: 'Analítica cuantitativa', desc: 'Desglose con escala numérica y puntajes.' },
  { id: 'pauta_correccion', label: 'Pauta de corrección', desc: 'Respuestas de desarrollo y criterios de corrección.' }
];function getTechniqueInstruction(tipoEvaluacion?: string): string {
  const isFormativaOrDiag = !tipoEvaluacion || 
    tipoEvaluacion.toLowerCase().includes('formativa') || 
    tipoEvaluacion.toLowerCase().includes('diagn');
  return isFormativaOrDiag
    ? "Responde usando la técnica OREO: escribe tu Opinión, una Razón que la justifique, un Ejemplo concreto y cierra reafirmando tu Opinión."
    : "Responde usando la técnica RICE: Repite la pregunta con tus palabras, Incluye tu postura, Cita una evidencia del texto y Explica cómo esa cita apoya tu argumento.";
}

const getCleanAlternatives = (raw: any, qNum?: any, qObj?: any): Array<{ letra: string; texto: string; correcta?: boolean }> => {
  if (!raw) return [];

  let strings: string[] = [];

  // Si es string, intentar parsear como JSON
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return [];
    try {
      raw = JSON.parse(trimmed);
    } catch {
      // Si no es JSON válido pero tiene contenido, tratarlo como texto único
      strings = [trimmed];
    }
  }

  // Si es array
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    
    strings = raw
      .map((item: any) => {
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'number') return String(item);
        if (typeof item === 'object' && item !== null) {
          // Buscar en todos los campos comunes que puedan contener el texto
          const textValue = 
            item.texto ?? 
            item.text ?? 
            item.contenido ?? 
            item.alternativa ?? 
            item.descripcion ?? 
            item.value ?? 
            item.opcion ??
            item.content ??
            null;
          
          if (textValue !== null && textValue !== undefined) {
            return String(textValue).trim();
          }
          
          // Si tiene letra/label + otro campo con el texto
          const keys = Object.keys(item).filter(k => !['letra', 'label', 'key', 'id', 'numero'].includes(k.toLowerCase()));
          if (keys.length === 1) return String(item[keys[0]]).trim();
          if (keys.length > 1) {
            // Tomar el valor más largo como el texto de la alternativa
            const longestKey = keys.reduce((a, b) => String(item[a] ?? '').length > String(item[b] ?? '').length ? a : b);
            return String(item[longestKey]).trim();
          }
        }
        return '';
      })
      .filter(s => s.length > 0);
  }
  // Si es objeto plano (clave → valor)
  else if (typeof raw === 'object' && raw !== null) {
    const entries = Object.entries(raw);
    if (entries.length > 0) {
      strings = entries
        .map(([, value]) => {
          if (typeof value === 'string') return value.trim();
          if (typeof value === 'number') return String(value);
          if (typeof value === 'object' && value !== null) {
            // Objeto anidado: {A: {texto: "..."}}
            const nested = value as any;
            const textValue = 
              nested.texto ?? 
              nested.text ?? 
              nested.contenido ?? 
              nested.alternativa ?? 
              nested.descripcion ?? 
              nested.value ??
              nested.content ??
              null;
            if (textValue !== null) return String(textValue).trim();
            // Tomar el primer string encontrado
            const nestedValues = Object.values(nested).filter(v => typeof v === 'string');
            if (nestedValues.length > 0) return String(nestedValues[0]).trim();
          }
          return '';
        })
        .filter(s => s.length > 0);
    }
  }

  // Si al final no se pudo extraer nada, imprimir error de formato no reconocido
  if (strings.length === 0 && raw !== null && raw !== undefined) {
    console.error('[getCleanAlternatives] Formato no reconocido:', JSON.stringify(raw), 'tipo:', typeof raw);
    return [];
  }

  // Mapear strings a la estructura esperada por el PDF y la UI: Array<{ letra: string; texto: string; correcta?: boolean }>
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = String(qObj?.clave || qObj?.respuesta_correcta || 'A').toUpperCase().trim();

  return strings.map((texto, aIdx) => {
    const letra = letters[aIdx] || '';
    return {
      letra,
      texto,
      correcta: letra === correctLetter
    };
  });
};

const getPreguntasList = (cj: any): any[] => {
  if (!cj) return [];
  
  // 1. Check prueba?.secciones
  const fromPruebaSecciones = cj.prueba?.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromPruebaSecciones) && fromPruebaSecciones.length > 0) {
    return fromPruebaSecciones;
  }
  
  // 2. Check secciones directly
  const fromSecciones = cj.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromSecciones) && fromSecciones.length > 0) {
    return fromSecciones;
  }
  
  // 3. Check preguntas directly
  if (Array.isArray(cj.preguntas) && cj.preguntas.length > 0) {
    return cj.preguntas;
  }
  
  // 4. Check preguntas_alternativas and preguntas_desarrollo combined
  const alts = cj.preguntas_alternativas || [];
  const devs = cj.preguntas_desarrollo || [];
  if (alts.length > 0 || devs.length > 0) {
    return [...alts, ...devs];
  }
  
  // 5. Fallback: recursive traversal
  const collected: any[] = [];
  const visited = new Set();
  const traverse = (obj: any) => {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
    visited.add(obj);
    
    if (
      (obj.enunciado || obj.pregunta) && 
      (obj.tipo === 'seleccion_multiple' || obj.tipo === 'consigna_abierta' || obj.tipo === 'desarrollo' || obj.alternativas)
    ) {
      collected.push(obj);
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'object' && val !== null) {
        traverse(val);
      }
    }
  };
  traverse(cj);
  return collected;
};

function getInstrumentHeaders(tipo: string) {
  if (tipo === 'lista_cotejo') {
    return ['Criterio / Dimensión / Indicador', 'Logrado (Sí)', 'No Logrado (No)'];
  } else if (tipo === 'rubrica_holistica') {
    return ['Nivel / Logro', 'Descripción del Desempeño Global'];
  } else if (tipo === 'pauta_correccion') {
    return ['Criterio de Corrección', 'Respuesta Esperada / Criterio de Logro'];
  } else if (tipo === 'analitica_cuantitativa') {
    return ['Criterio / Dimensión', 'Excelente (5 ptos)', 'Bueno (3 ptos)', 'Suficiente (1 pto)', 'Insuficiente (0 ptos)'];
  } else {
    return ['Criterio / Dimensión', 'Excelente', 'Bueno', 'Suficiente', 'Insuficiente'];
  }
}

function renderCriterioColumns(crit: any, tipo: string) {
  if (tipo === 'lista_cotejo') {
    return (
      <>
        <td className="p-2 border-r border-slate-200">{crit.logrado || crit.si || 'Sí'}</td>
        <td className="p-2">{crit.no_logrado || crit.no || 'No'}</td>
      </>
    );
  } else if (tipo === 'rubrica_holistica') {
    return (
      <>
        <td className="p-2 leading-relaxed">{crit.descripcion || crit.excelente || crit.logrado}</td>
      </>
    );
  } else if (tipo === 'pauta_correccion') {
    return (
      <>
        <td className="p-2 leading-relaxed">{crit.logrado || crit.descripcion || 'Criterio de logro'}</td>
      </>
    );
  } else if (tipo === 'analitica_cuantitativa') {
    return (
      <>
        <td className="p-2 border-r border-slate-200">{crit.excelente || '5 pts'}</td>
        <td className="p-2 border-r border-slate-200">{crit.bueno || '3 pts'}</td>
        <td className="p-2 border-r border-slate-200">{crit.suficiente || '1 pt'}</td>
        <td className="p-2">{crit.insuficiente || '0 pts'}</td>
      </>
    );
  } else {
    return (
      <>
        <td className="p-2 border-r border-slate-200">{crit.excelente || crit.logrado}</td>
        <td className="p-2 border-r border-slate-200">{crit.bueno || crit.logrado_parcial}</td>
        <td className="p-2 border-r border-slate-200">{crit.suficiente || crit.en_desarrollo}</td>
        <td className="p-2">{crit.insuficiente || crit.no_logrado}</td>
      </>
    );
  }
}

const LOADING_STEPS = [
  'Analizando la cobertura del objetivo de aprendizaje...',
  'Diseñando tabla de especificaciones con pesos curriculares...',
  'Redactando preguntas y solucionario detallado...',
  'Construyendo instrumento de evaluación seleccionado...',
];

export default function EvaluacionesPage() {
  const router = useRouter();

  // Auth & Profile
  const [authLoading, setAuthLoading] = useState(true);
  const [initials, setInitials] = useState('U');
  const [plannings, setPlannings] = useState<Planning[]>([]);
  
  // Tab states for left panel
  const [activeTab, setActiveTab] = useState<'generador' | 'biblioteca'>('generador');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [origen, setOrigen] = useState<'kit' | 'tema' | 'lectura'>('kit');
  const [selectedPlanningId, setSelectedPlanningId] = useState<string>('');
  const [lecturas, setLecturas] = useState<any[]>([]);
  const [selectedLibroId, setSelectedLibroId] = useState<string>('');
  const [loadingLecturas, setLoadingLecturas] = useState(true);
  
  const [tipoEvaluacion, setTipoEvaluacion] = useState('formativa');
  const [instrumento, setInstrumento] = useState('rubrica_holistica');
  const [incluirDua, setIncluirDua] = useState(true);
  const [incluirTabla, setIncluirTabla] = useState(true);
  const [establecimiento, setEstablecimiento] = useState('');
  const [docente, setDocente] = useState('');

  // Text types and grade-based reading texts
  const [texto1Tipo, setTexto1Tipo] = useState('Argumentativo');
  const [texto2Tipo, setTexto2Tipo] = useState('Expositivo');

  useEffect(() => {
    if (tipoEvaluacion === 'simce') {
      setTexto1Tipo('Expositivo');
      setTexto2Tipo('Informativo');
    } else if (tipoEvaluacion === 'sumativa') {
      setTexto1Tipo('Argumentativo');
      setTexto2Tipo('Narrativo');
    } else if (tipoEvaluacion === 'formativa') {
      setTexto1Tipo('Argumentativo');
      setTexto2Tipo('Expositivo');
    } else if (tipoEvaluacion === 'diagnostica') {
      setTexto1Tipo('Expositivo');
      setTexto2Tipo('Científico');
    }
  }, [tipoEvaluacion]);

  // Fallback states for theme manual
  const [curso, setCurso] = useState('5° Básico');
  const [unidad, setUnidad] = useState('');
  const [oa, setOa] = useState('');
  const [tema, setTema] = useState('');
  
  // Advanced hidden/collapsible settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cantidadPreguntas, setCantidadPreguntas] = useState(10);
  const [dificultad, setDificultad] = useState('mixto');
  const [tipoPreguntas, setTipoPreguntas] = useState<'seleccion_multiple' | 'desarrollo' | 'mixta'>('mixta');
  const [nPreguntasMultiple, setNPreguntasMultiple] = useState(6);
  const [nPreguntasDesarrollo, setNPreguntasDesarrollo] = useState(2);

  // Preview Generation states
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // History / Database list
  const [history, setHistory] = useState<EvaluacionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'trial_expired' | 'limit_reached'>('limit_reached');
  const [upgradePlanStatus, setUpgradePlanStatus] = useState<'trial' | 'active'>('trial');
  const [upgradeRenewalDate, setUpgradeRenewalDate] = useState<string | null>(null);
  const [upgradeLimit, setUpgradeLimit] = useState<number>(12);

  // ── Auth Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Bypass] Evaluaciones auth bypass activated');
        setInitials('G');
        setPlannings([
          {
            id: 'mock-id-123',
            unit: 'Unidad de Prueba',
            subject: 'Lenguaje y Comunicación',
            grade: '6° Básico',
            learning_objective: 'OA 3: Evaluar críticamente textos de diversos géneros y soportes.'
          }
        ]);
        setSelectedPlanningId('mock-id-123');
        setAuthLoading(false);
        fetchHistory();
        return;
      }
      
      const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
      const email = user?.email || '';
      const initLetters = fullName
        ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : (email ? email[0].toUpperCase() : 'U');
      setInitials(initLetters);

      // Fetch actual plannings from Supabase
      try {
        const { data: planningsData } = await supabase
          .from('plannings')
          .select('id, unit, subject, grade, learning_objective')
          .order('created_at', { ascending: false });
        setPlannings(planningsData || []);
        if (planningsData && planningsData.length > 0) {
          setSelectedPlanningId(planningsData[0].id);
        }
      } catch (e) {
        console.warn('Error loading plannings:', e);
      }

      // Fetch lecturas_docente from Supabase
      try {
        const { data: lecturasData } = await supabase
          .from('lecturas_docente')
          .select('id, libro_id, biblioteca_libros(id, titulo, autor, cursos_sugeridos, oa_sugeridos)')
          .order('created_at', { ascending: false });

        const flattened = (lecturasData || []).map((ld: any) => ({
          id: ld.id,
          libro_id: ld.libro_id,
          titulo: ld.biblioteca_libros?.titulo,
          autor: ld.biblioteca_libros?.autor,
          cursos_sugeridos: ld.biblioteca_libros?.cursos_sugeridos,
          oa_sugeridos: ld.biblioteca_libros?.oa_sugeridos
        })).filter(l => l.titulo);

        setLecturas(flattened);
        if (flattened.length > 0) {
          setSelectedLibroId(flattened[0].libro_id);
        }
      } catch (e) {
        console.warn('Error loading lecturas:', e);
      } finally {
        setLoadingLecturas(false);
      }

      setAuthLoading(false);
      fetchHistory();
    };
    init();
  }, [router]);

  // ── Fetch History ─────────────────────────────────────────────────────────
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/evaluaciones?limit=30');
      if (res.ok) {
        const data = await res.json();
        let list = data.evaluaciones || [];
        if (typeof window !== 'undefined' && window.localStorage.getItem('use_mock_auth') === 'true') {
          try {
            const localList = JSON.parse(window.localStorage.getItem('mock_evaluaciones') || '[]');
            const ids = new Set(localList.map((x: any) => x.id));
            list = [...localList, ...list.filter((x: any) => !ids.has(x.id))];
          } catch (e) {}
        }
        setHistory(list);
      }
    } catch (e) {
      console.warn('Error fetching evaluations history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar esta evaluación?')) return;
    try {
      const { error } = await supabase.from('evaluaciones').delete().eq('id', id);
      if (error) throw error;
      setHistory(history.filter(ev => ev.id !== id));
      if (result && result.id === id) {
        setResult(null);
      }
    } catch (err) {
      console.error('Error deleting evaluation:', err);
    }
  };

  // Sync kit selection with form fields
  useEffect(() => {
    if (origen === 'kit' && selectedPlanningId && plannings.length > 0) {
      const selectedKit = plannings.find(p => p.id === selectedPlanningId);
      if (selectedKit) {
        setCurso(selectedKit.grade);
        setUnidad(selectedKit.unit);
        setOa(selectedKit.learning_objective);
        setTema(`Evaluación basada en el Kit de clase: ${selectedKit.unit} (${selectedKit.grade}) - ${selectedKit.subject}`);
      }
    } else if (origen === 'lectura' && selectedLibroId && lecturas.length > 0) {
      const selectedLibro = lecturas.find(l => l.libro_id === selectedLibroId);
      if (selectedLibro) {
        if (selectedLibro.cursos_sugeridos && selectedLibro.cursos_sugeridos.length > 0) {
          setCurso(selectedLibro.cursos_sugeridos[0]);
        }
        if (selectedLibro.oa_sugeridos && selectedLibro.oa_sugeridos.length > 0) {
          setOa(selectedLibro.oa_sugeridos.join(', '));
        }
        setTema(`Evaluación basada en la Lectura Domiciliaria: ${selectedLibro.titulo} de ${selectedLibro.autor}`);
      }
    }
  }, [selectedPlanningId, selectedLibroId, origen, plannings, lecturas]);

  // Map instrument ID to backend compatible string
  const mapInstrumentoToBackend = (inst: string) => {
    if (inst === 'analitica_descriptiva') return 'rubrica_analitica';
    if (inst === 'analitica_cuantitativa') return 'escala_apreciacion';
    if (inst === 'pauta_correccion') return 'lista_cotejo';
    return inst;
  };

  // ── Generate Evaluation Handler ───────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const themeText = origen === 'kit' 
      ? plannings.find(p => p.id === selectedPlanningId)
        ? `Kit de Clase: ${plannings.find(p => p.id === selectedPlanningId)?.unit} - ${plannings.find(p => p.id === selectedPlanningId)?.grade}`
        : tema
      : (origen === 'lectura' ? `Lectura Domiciliaria: ${lecturas.find(l => l.libro_id === selectedLibroId)?.titulo || ''}` : tema);

    if (!themeText.trim()) return;
    setGenerating(true);
    setGenError(null);
    setResult(null);
    setSavedId(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2000);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Inject the step selections inside the prompt wrapper
      const promptInject = `
[CONFIGURACIÓN DE EVALUACIÓN REI DOCENTE]
- Origen: ${origen === 'kit' ? `Kit ID ${selectedPlanningId}` : (origen === 'lectura' ? `Lectura ID ${selectedLibroId}` : 'Tema libre')}
- Tipo de evaluación: ${tipoEvaluacion}
- Tipo de rúbrica: ${instrumento}
- Incluir DUA: ${incluirDua ? 'Sí' : 'No'}
- Incluir Tabla de especificaciones: ${incluirTabla ? 'Sí' : 'No'}
- Tema/Foco: ${themeText.trim()}
- OA Texto original: ${oa || 'General curricular'}
`.trim();

      const backendInstrument = mapInstrumentoToBackend(instrumento);

      const currentPlanning = plannings.find(p => p.id === selectedPlanningId);
      let derivedOaCodes = ['OA_EVAL'];
      if (origen === 'kit' && currentPlanning?.learning_objective) {
        const matches = currentPlanning.learning_objective.match(/OA\s*\d+/gi);
        if (matches && matches.length > 0) {
          derivedOaCodes = matches.map((m: string) => m.toUpperCase().replace(/\s+/g, ' '));
        }
      } else if ((origen === 'tema' || origen === 'lectura') && oa) {
        const matches = oa.match(/OA\s*\d+/gi);
        if (matches && matches.length > 0) {
          derivedOaCodes = matches.map((m: string) => m.toUpperCase().replace(/\s+/g, ' '));
        }
      }

      const body = {
        nivel: curso,
        eje: 'Evaluación de Aula',
        oa_codes: derivedOaCodes,
        oa_textos: derivedOaCodes.reduce((acc, code) => {
          acc[code] = origen === 'kit' ? (currentPlanning?.learning_objective || promptInject) : (oa || promptInject);
          return acc;
        }, {} as Record<string, string>),
        tipos: ['prueba', 'tabla_especificaciones', 'rubrica'],
        tipo_evaluacion: tipoEvaluacion,
        tipo_preguntas: tipoPreguntas,
        n_preguntas_multiple: tipoPreguntas === 'desarrollo' ? 0 : nPreguntasMultiple,
        n_preguntas_desarrollo: tipoPreguntas === 'seleccion_multiple' ? 0 : nPreguntasDesarrollo,
        n_preguntas: (tipoPreguntas === 'seleccion_multiple' ? nPreguntasMultiple : tipoPreguntas === 'desarrollo' ? nPreguntasDesarrollo : (nPreguntasMultiple + nPreguntasDesarrollo)),
        duracion_min: 90,
        dificultad: dificultad,
        instrumento: backendInstrument,
        titulo: `Evaluación de Aprendizaje: ${themeText.trim().slice(0, 200)}`,
        texto_1_tipo: texto1Tipo,
        texto_2_tipo: texto2Tipo,
        establecimiento: establecimiento,
        docente: docente,
        fuente: origen === 'lectura' ? 'lectura_domiciliaria' : undefined,
        libro_id: origen === 'lectura' ? selectedLibroId : undefined
      };

      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && errData.error === 'limite_alcanzado') {
          setUpgradeReason(errData.reason === 'trial_expired' ? 'trial_expired' : 'limit_reached');
          setUpgradePlanStatus(errData.plan_status || 'trial');
          setUpgradeRenewalDate(errData.renewal_date || null);
          setUpgradeLimit(errData.limit || 12);
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(errData?.error || `Error ${res.status}`);
      }

      const record = await res.json();
      if (typeof window !== 'undefined' && window.localStorage.getItem('use_mock_auth') === 'true') {
        try {
          const list = JSON.parse(window.localStorage.getItem('mock_evaluaciones') || '[]');
          const filtered = list.filter((x: any) => x.id !== record.id);
          record.user_id = '00000000-0000-0000-0000-000000000000';
          filtered.push(record);
          window.localStorage.setItem('mock_evaluaciones', JSON.stringify(filtered));
        } catch (e) {}
      }
      setResult(record);
      setSavedId(record.id);
      fetchHistory();
    } catch (err: any) {
      clearInterval(stepInterval);
      setGenError(err.message || 'Error de conexión. Por favor intenta de nuevo.');
      setGenerating(false);
    } finally {
      setGenerating(false);
      setLoadingStep(0);
    }
  }, [tema, curso, oa, tipoEvaluacion, tipoPreguntas, nPreguntasMultiple, nPreguntasDesarrollo, dificultad, origen, selectedPlanningId, plannings, instrumento, incluirDua, incluirTabla, texto1Tipo, texto2Tipo, establecimiento, docente]);

  // ── Mockup evaluation builder for printable document rendering ───────────
  const generateMockupEvaluationContent = () => {
    const questions: any[] = [];
    const numMultiple = tipoPreguntas === 'desarrollo' ? 0 : nPreguntasMultiple;

    const prebakedMultiple = [
      {
        enunciado: "¿Cuál es el propósito comunicativo principal del primer texto de lectura presentado?",
        correctIndex: 1, // B
        alternativas: [
          "Describir las características históricas de los géneros periodísticos.",
          "Convencer al lector mediante argumentos sobre la relevancia del pensamiento crítico.",
          "Entretener con una anécdota acerca de un debate en el aula.",
          "Enumerar de forma instructiva las reglas de una discusión formal."
        ]
      },
      {
        enunciado: "De acuerdo con el texto argumentativo, ¿cuál de las siguientes opciones define mejor una 'tesis'?",
        correctIndex: 3, // D
        alternativas: [
          "Un conjunto de datos estadísticos verificables que apoyan una postura.",
          "Una conclusión obvia sobre la cual todo el mundo está de acuerdo.",
          "Un argumento de autoridad citado por un científico reconocido.",
          "La postura personal y debatible que el autor defiende a lo largo del texto."
        ]
      },
      {
        enunciado: "Según la estructura del texto de lectura 2, ¿qué función cumple el contraargumento presentado en el tercer párrafo?",
        correctIndex: 0, // A
        alternativas: [
          "Anticipar posibles objeciones del lector para refutarlas y fortalecer la tesis.",
          "Ilustrar la opinión contraria del autor sobre el método científico.",
          "Confundir al lector mostrando puntos de vista que no tienen relación temática.",
          "Apoyar la tesis de manera secundaria sin aportar nuevas razones."
        ]
      },
      {
        enunciado: "¿Cuál de las siguientes palabras podría reemplazar al término 'persuadir' en el contexto del texto 1 sin alterar su sentido original?",
        correctIndex: 2, // C
        alternativas: [
          "Describir",
          "Informar",
          "Convencer",
          "Narrar"
        ]
      },
      {
        enunciado: "En el Texto 2, se menciona la palabra 'hipótesis'. ¿Qué se infiere de su uso en el contexto escolar?",
        correctIndex: 1, // B
        alternativas: [
          "Que es una verdad absoluta e incuestionable en la ciencia.",
          "Que representa una explicación provisoria sujeta a verificación experimental.",
          "Que no tiene utilidad práctica en el desarrollo del aprendizaje.",
          "Que sustituye a los datos empíricos de forma definitiva."
        ]
      }
    ];

    const letters = ['A', 'B', 'C', 'D'];

    for (let i = 1; i <= numMultiple; i++) {
      const idx = (i - 1) % prebakedMultiple.length;
      const ref = prebakedMultiple[idx];
      const correctIdx = ref.correctIndex;
      const key = letters[correctIdx];

      const alts = ref.alternativas.map((text, aIdx) => ({
        letra: letters[aIdx],
        texto: text,
        correcta: aIdx === correctIdx
      }));

      questions.push({
        numero: i,
        enunciado: `${ref.enunciado}`,
        tipo: 'seleccion_multiple',
        oa: oa || 'OA 3',
        alternativas: alts,
        respuesta_correcta: key,
        justificacion: `Esta alternativa es correcta porque se fundamenta directamente en las bases del aprendizaje de Lenguaje.`
      });
    }

    const prebakedDesarrollo = [
      {
        enunciado: "Explique detalladamente de qué manera el autor del primer texto justifica el uso de la argumentación en la discusión académica pública.",
        criterios: [
          "Menciona al menos dos justificaciones dadas en el texto.",
          "Redacta con claridad y respeta la estructura de introducción y desarrollo.",
          "Utiliza vocabulario formal y técnico adecuado."
        ],
        respuesta: "El estudiante debe explicar que la argumentación fomenta el discernimiento crítico, y citar los ejemplos del texto de lectura relativos a los debates públicos."
      },
      {
        enunciado: "Compare críticamente las ideas sobre investigación escolar expuestas en el texto 2 con su propia experiencia en la realización de experimentos.",
        criterios: [
          "Establece al menos un punto de comparación claro.",
          "Formula un juicio de valor crítico sobre la utilidad del método.",
          "Utiliza una correcta cohesión textual."
        ],
        respuesta: "El estudiante debe comparar el rigor metodológico del texto con sus propias prácticas escolares, analizando fortalezas y debilidades."
      }
    ];

    const numDesarrollo = tipoPreguntas === 'seleccion_multiple' ? 0 : nPreguntasDesarrollo;
    for (let i = 1; i <= numDesarrollo; i++) {
      const num = numMultiple + i;
      const idx = (i - 1) % prebakedDesarrollo.length;
      const ref = prebakedDesarrollo[idx];
      questions.push({
        numero: num,
        enunciado: ref.enunciado,
        tipo: 'consigna_abierta',
        oa: oa || 'OA 3',
        criterios_correccion: ref.criterios,
        respuesta_esperada: ref.respuesta
      });
    }

    const specRows = questions.map((q, idx) => {
      const isMc = q.tipo === 'seleccion_multiple';
      const habilidades = ['Comprensión', 'Análisis', 'Evaluación', 'Aplicación'];
      const indicadores = [
        'Identifica elementos estructurales del texto.',
        'Analiza la cohesión y coherencia de las ideas.',
        'Evalúa la calidad de los argumentos presentados.',
        'Aplica conceptos léxicos en contextos nuevos.'
      ];

      return {
        habilidad: habilidades[idx % habilidades.length],
        indicador: indicadores[idx % indicadores.length],
        contenido: isMc ? `Comprensión de lectura: ${texto1Tipo}` : `Análisis y argumentación: ${texto2Tipo}`,
        tipo_item: isMc ? 'Selección múltiple' : 'Desarrollo',
        n_pregunta: String(q.numero),
        clave: isMc ? q.respuesta_correcta : 'Rúbrica',
        ptos: isMc ? 2 : 4,
        ponderacion_pct: Math.round(100 / questions.length)
      };
    });
    const rubricaCriterios: any[] = [];
    if (instrumento === 'lista_cotejo') {
      rubricaCriterios.push(
        { nombre: 'Identificación de conceptos clave', logrado: 'El estudiante identifica con precisión los conceptos.', no_logrado: 'El estudiante no identifica los conceptos.', ponderacion_pct: 50 },
        { nombre: 'Claridad en la argumentación', logrado: 'Presenta argumentos claros y coherentes.', no_logrado: 'Los argumentos son confusos o involuntarios.', ponderacion_pct: 50 }
      );
    } else if (instrumento === 'rubrica_holistica') {
      rubricaCriterios.push(
        { nombre: 'Destacado', descripcion: 'Desempeño excelente. Comprende la totalidad de los conceptos teóricos y argumenta con absoluta claridad académica.' },
        { nombre: 'Logrado', descripcion: 'Desempeño adecuado. Comprende la mayoría de los conceptos y formula argumentos claros con pocos errores de precisión.' },
        { nombre: 'En Desarrollo', descripcion: 'Desempeño en desarrollo. Comprende algunos conceptos básicos pero sus explicaciones carecen de profundidad.' },
        { nombre: 'No Logrado', descripcion: 'Desempeño deficiente. No logra aplicar ni definir conceptos básicos del área evaluada.' }
      );
    } else if (instrumento === 'pauta_correccion') {
      rubricaCriterios.push(
        { nombre: 'Pregunta 1', logrado: 'Respuesta modelo exacta según la pauta.', no_logrado: 'Incorrecta o ausente.' },
        { nombre: 'Pregunta 2', logrado: 'Explicación satisfactoria del concepto.', no_logrado: 'Errónea o incompleta.' }
      );
    } else if (instrumento === 'analitica_cuantitativa') {
      rubricaCriterios.push(
        { nombre: 'Coherencia Conceptual (5 pts)', excelente: 'Excelente precisión.', bueno: 'Buen intento.', suficiente: 'Nivel básico.', insuficiente: 'Nulo.', ponderacion_pct: 50 },
        { nombre: 'Redacción y Sintaxis (5 pts)', excelente: 'Excelente uso de conectores.', bueno: 'Buen intento.', suficiente: 'Nivel básico.', insuficiente: 'Nulo.', ponderacion_pct: 50 }
      );
    } else { // analitica_descriptiva
      rubricaCriterios.push(
        { nombre: 'Coherencia Conceptual', excelente: 'Expresa con total claridad las ideas.', bueno: 'Expresa las ideas pero falta precisión.', suficiente: 'Menciona algunas ideas generales.', insuficiente: 'No expresa ideas coherentes.', ponderacion_pct: 50 },
        { nombre: 'Redacción y Sintaxis', excelente: 'Excelente uso de conectores y ortografía.', bueno: 'Mínimos errores ortográficos.', suficiente: 'Errores recurrentes de redacción.', insuficiente: 'Texto incomprensible o sin estructura.', ponderacion_pct: 50 }
      );
    }

    return {
      titulo: `Evaluación de Aprendizaje`,
      curso: curso,
      unidad: unidad || 'Unidad de Aprendizaje N°1',
      oa: oa || 'OA 3',
      tipo_evaluacion: TIPOS_EVALUACION.find(t => t.id === tipoEvaluacion)?.label || tipoEvaluacion,
      inclusiones: ['evaluacion', 'tabla', 'pauta', 'respuestas', 'instrumento'],
      instrumento_seleccionado: INSTRUMENTOS.find(i => i.id === instrumento)?.label || instrumento,
      textos_lectura: [
        {
          titulo: `Texto 1: Lectura Analítica (${texto1Tipo})`,
          tipo: texto1Tipo,
          contenido: `Este es un texto didáctico modelo de tipo ${texto1Tipo} generado para nivel de ${curso}.\n\nPresenta una exposición clara y estructurada sobre los conceptos evaluados en la unidad para promover habilidades de comprensión lectora, argumentación e inferencia en los estudiantes.`
        },
        {
          titulo: `Texto 2: Aplicación Práctica (${texto2Tipo})`,
          tipo: texto2Tipo,
          contenido: `Este es un texto de lectura complementario de tipo ${texto2Tipo} diseñado para nivel de ${curso}.\n\nExpone datos empíricos y analogías útiles para contextualizar la evaluación escolar chilena del MINEDUC y evaluar objetivos de aprendizaje oficiales.`
        }
      ],
      tabla_especificaciones: {
        oa_evaluado: oa || 'OA 3',
        filas: specRows
      },
      preguntas: questions,
      respuestas_esperadas: questions.map(q => {
        if (q.tipo === 'seleccion_multiple') {
          return {
            pregunta: q.numero,
            tipo: 'seleccion_multiple',
            clave: q.respuesta_correcta,
            explicacion: q.justificacion
          };
        } else {
          return {
            pregunta: q.numero,
            tipo: 'consigna_abierta',
            respuesta_esperada: q.respuesta_esperada,
            criterios_correccion: q.criterios_correccion
          };
        }
      }),
      pauta_correccion: {
        puntaje_total: questions.reduce((acc, cur) => acc + (cur.tipo === 'seleccion_multiple' ? 2 : 4), 0),
        exigencia: '60%',
        puntaje_aprobacion: Math.ceil(questions.reduce((acc, cur) => acc + (cur.tipo === 'seleccion_multiple' ? 2 : 4), 0) * 0.6)
      },
      rubrica: {
        titulo: `Instrumento: ${INSTRUMENTOS.find(i => i.id === instrumento)?.label || 'Rúbrica'}`,
        tipo_instrumento: instrumento,
        criterios: rubricaCriterios
      }
    };
  };

  // ── Client PDF download ───────────────────────────────────────────────────
  const triggerPdfDownload = () => {
    if (!result) return;
    const doc = new jsPDF();
    const cj = result.contenido_json || result;

    doc.setFont("helvetica", "normal");
    let y = 20;
    const margin = 20;
    const usable = 170; // 210 - 2*20

    const addText = (text: string, size = 10, bold = false, color = '#1e293b') => {
      doc.setFontSize(size);
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        doc.setTextColor(r, g, b);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text ?? '', usable);
      lines.forEach((line: string) => {
        if (y > 272) {
          doc.addPage();
          fillBackground();
          y = margin;
        }
        doc.text(line, margin, y);
        y += size * 0.45;
      });
      y += 2;
    };

    const fillBackground = () => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    };

    const addLine = () => {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, 210 - margin, y);
      y += 4;
    };

    const addSection = (label: string) => {
      y += 4;
      addText(label, 12, true, '#be123c');
      addLine();
    };

    const getTextoAsociado = (q: any, idx: number, total: number) => {
      const txt = String(q.texto_asociado || q.texto || '').toLowerCase();
      if (txt.includes('texto_1') || txt.includes('texto 1') || txt.includes('1')) return 'texto_1';
      if (txt.includes('texto_2') || txt.includes('texto 2') || txt.includes('2')) return 'texto_2';
      if (txt.includes('ambos') || txt.includes('integra') || txt.includes('ambas')) return 'ambos';
      
      const enunc = String(q.enunciado || '').toLowerCase();
      if (enunc.includes('texto 1') || enunc.includes('primer texto')) return 'texto_1';
      if (enunc.includes('texto 2') || enunc.includes('segundo texto')) return 'texto_2';
      if (enunc.includes('ambos textos') || enunc.includes('ambas lecturas')) return 'ambos';
      
      if (idx < total * 0.45) return 'texto_1';
      if (idx < total * 0.9) return 'texto_2';
      return 'ambos';
    };

    const checkSpaceForNextGroup = (nextText: any, nextQuestions: any[]) => {
      let needed = 15; // títulos y márgenes mínimos
      if (nextText) {
        const paragraphs = (nextText.contenido || '').split('\n');
        paragraphs.forEach((p: string) => {
          if (p.trim()) {
            const lines = doc.splitTextToSize(p.trim(), usable);
            needed += lines.length * 4.5 + 1.5;
          }
        });
      }
      if (nextQuestions && nextQuestions.length > 0) {
        needed += 25; // cabecera + primera pregunta
      }
      if (y + needed > 265) {
        doc.addPage();
        fillBackground();
        y = margin;
      }
    };

    const drawSingleText = (txt: any, index: number) => {
      if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
      y += 2;
      const cleanTxtTitle = (txt.titulo || '').replace(/^Texto\s*\d+\s*:\s*/i, '').trim() || 'Sin Título';
      addText(`Texto ${index + 1}: ${cleanTxtTitle} — Tipo: ${txt.tipo || 'Lectura'} — Fuente: Texto adaptado con fines pedagógicos.`, 10, true, '#be123c');
      y += 2;

      const paragraphs = (txt.contenido || '').split('\n');
      paragraphs.forEach((p: string) => {
        const trimmed = p.trim();
        if (trimmed) {
          addText(trimmed, 9, false, '#334155');
          y += 1.5;
        }
      });
      y += 4;
    };

    const drawQuestionsGroup = (qGroup: any[], groupTitle: string) => {
      if (qGroup.length === 0) return;
      if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
      addSection(groupTitle);

      const mcQ = qGroup.filter((p: any) => p.tipo === 'seleccion_multiple');
      const devQ = qGroup.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

      if (mcQ.length > 0) {
        let currentWidth = 80;
        const gap = 10;
        let colY = [y, y];
        let currentCol = 0;
        const yLimit = 265;

        const printTextInCol = (text: string, size = 9, bold = false, color = '#1e293b', isTestOnly = false) => {
          doc.setFontSize(size);
          if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            if (!isTestOnly) doc.setTextColor(r, g, b);
          } else {
            if (!isTestOnly) doc.setTextColor(30, 41, 59);
          }
          if (!isTestOnly) doc.setFont('helvetica', bold ? 'bold' : 'normal');
          const lines = doc.splitTextToSize(text ?? '', currentWidth);
          let localY = 0;
          lines.forEach((line: string) => {
            localY += size * 0.45;
          });
          return localY + 1.2;
        };

        const getQuestionHeight = (p: any) => {
          let h = 0;
          if (p.texto_base) {
            h += printTextInCol(p.texto_base, 8, false, '#475569', true);
          }
          h += printTextInCol(`${p.numero_original || p.numero}. ${p.enunciado}`, 9.5, true, '#1e293b', true);
          const alts = p.alternativas ?? [];
          if (alts.length > 0) {
            alts.forEach((alt: any) => {
              h += printTextInCol(`   ${alt.letra}) ${alt.texto}`, 8.5, false, '#475569', true);
            });
          } else {
            h += printTextInCol(`   [Alternativas no disponibles]`, 8.5, false, '#475569', true);
          }
          h += 2;
          return h;
        };

        const drawQuestionInCol = (p: any, colX: number, colIndex: number) => {
          if (p.texto_base) {
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(p.texto_base, currentWidth);
            lines.forEach((line: string) => {
              doc.text(line, colX, colY[colIndex]);
              colY[colIndex] += 8 * 0.45;
            });
            colY[colIndex] += 1.2;
          }

          // Enunciado
          doc.setFontSize(9.5);
          doc.setTextColor(30, 41, 59);
          doc.setFont('helvetica', 'bold');
          const linesEnunc = doc.splitTextToSize(`${p.numero_original || p.numero}. ${p.enunciado}`, currentWidth);
          linesEnunc.forEach((line: string) => {
            doc.text(line, colX, colY[colIndex]);
            colY[colIndex] += 9.5 * 0.45;
          });
          colY[colIndex] += 1.2;

          // Alternativas
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          doc.setFont('helvetica', 'normal');
          const alts = p.alternativas ?? [];
          if (alts.length > 0) {
            alts.forEach((alt: any) => {
              const linesAlt = doc.splitTextToSize(`   ${alt.letra}) ${alt.texto}`, currentWidth);
              linesAlt.forEach((line: string) => {
                doc.text(line, colX, colY[colIndex]);
                colY[colIndex] += 8.5 * 0.45;
              });
              colY[colIndex] += 1.2;
            });
          } else {
            const linesAlt = doc.splitTextToSize(`   [Alternativas no disponibles]`, currentWidth);
            linesAlt.forEach((line: string) => {
              doc.text(line, colX, colY[colIndex]);
              colY[colIndex] += 8.5 * 0.45;
            });
            colY[colIndex] += 1.2;
          }
          colY[colIndex] += 2;
        };

        currentCol = 0;
        mcQ.forEach((p: any, idx: number) => {
          const isLastOdd = (idx === mcQ.length - 1 && currentCol === 0);
          if (isLastOdd) {
            y = Math.max(colY[0], colY[1]);
            colY = [y, y];
            currentWidth = 170;
          } else {
            currentWidth = 80;
          }

          const qHeight = getQuestionHeight(p);
          if (colY[currentCol] + qHeight > yLimit) {
            if (isLastOdd) {
              doc.addPage();
              fillBackground();
              y = margin;
              colY = [y, y];
            } else if (currentCol === 0) {
              const isLeftColumnEmpty = (colY[0] === y || colY[0] === margin);
              if (isLeftColumnEmpty && y > margin) {
                doc.addPage();
                fillBackground();
                colY = [margin, margin];
                currentCol = 0;
              } else {
                currentCol = 1;
              }
            } else {
              doc.addPage();
              fillBackground();
              colY = [margin, margin];
              currentCol = 0;
            }
          }
          const colX = isLastOdd ? margin : (margin + currentCol * (80 + gap));
          drawQuestionInCol(p, colX, isLastOdd ? 0 : currentCol);
          if (isLastOdd) {
            colY[1] = colY[0];
          }
        });

        y = Math.max(colY[0], colY[1]) + 4;
      }

      if (devQ.length > 0) {
        if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
        devQ.forEach((p: any) => {
          if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
          addText(`${p.numero_original || p.numero}. ${p.enunciado}`, 9.5, true, '#1e293b');

          // BUG 2 Fix: Se removió la instrucción RICE en rojo de la sección estudiante.

          doc.setDrawColor(203, 213, 225);
          doc.line(margin + 5, y, 210 - margin, y); y += 6;
          doc.line(margin + 5, y, 210 - margin, y); y += 6;
          doc.line(margin + 5, y, 210 - margin, y); y += 4;
        });
        y += 4;
      }
    };

    const getGradesScale = (total: number, exigencia = 0.6) => {
      const scale: Array<{ puntos: number; nota: number }> = [];
      for (let p = 0; p <= total; p++) {
        let nota = 1.0;
        if (total > 0) {
          const approvalPoints = total * exigencia;
          if (p < approvalPoints) {
            nota = 1.0 + 3.0 * (p / approvalPoints);
          } else {
            nota = 4.0 + 3.0 * ((p - approvalPoints) / (total * (1 - exigencia)));
          }
        }
        scale.push({ puntos: p, nota: Math.round(nota * 10) / 10 });
      }
      return scale;
    };

    // Calculate dynamic points
    const preguntas = getPreguntasList(cj);
    const MC_Preguntas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple');
    const Dev_Preguntas = preguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

    let mcPoints = MC_Preguntas.length * 2;
    let devPoints = Dev_Preguntas.length * 4;

    const filasSpec = cj.tabla_especificaciones?.filas || [];
    if (filasSpec.length) {
      let sumMc = 0;
      let sumDev = 0;
      filasSpec.forEach((f: any) => {
        const ptosVal = Number(f.ptos) || 0;
        const isMc = f.tipo_item === 'Selección múltiple' || String(f.tipo_item).toLowerCase().includes('alternativa');
        if (isMc) sumMc += ptosVal;
        else sumDev += ptosVal;
      });
      if (sumMc > 0) mcPoints = sumMc;
      if (sumDev > 0) devPoints = sumDev;
    }
    const totalPtos = mcPoints + devPoints;

    // Group specs table by Habilidad (Taxonomía)
    const groupedSpec: Record<string, {
      habilidad: string;
      indicadores: Set<string>;
      contenidos: Set<string>;
      tipo_items: Set<string>;
      num_items: number[];
      claves: string[];
      ptos: number;
    }> = {};

    filasSpec.forEach((f: any) => {
      const hab = f.habilidad || 'General';
      if (!groupedSpec[hab]) {
        groupedSpec[hab] = {
          habilidad: hab,
          indicadores: new Set(),
          contenidos: new Set(),
          tipo_items: new Set(),
          num_items: [],
          claves: [],
          ptos: 0
        };
      }
      if (f.indicador) groupedSpec[hab].indicadores.add(f.indicador);
      if (f.contenido) groupedSpec[hab].contenidos.add(f.contenido);
      if (f.tipo_item) groupedSpec[hab].tipo_items.add(f.tipo_item);
      if (f.n_pregunta) {
        String(f.n_pregunta).split(',').forEach(n => {
          const num = parseInt(n.trim(), 10);
          if (!isNaN(num)) groupedSpec[hab].num_items.push(num);
        });
      }
      if (f.clave) groupedSpec[hab].claves.push(f.clave);
      groupedSpec[hab].ptos += (Number(f.ptos) || 0);
    });

    // ── 1. ENCABEZADO DEL ESTUDIANTE (Student Header) ──
    const drawHeaderCell = (x: number, yCell: number, w: number, h: number, header: string, value: string) => {
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.35);
      doc.rect(x, yCell, w, h, 'S');

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(header, x + 2, yCell + 4.5);

      // Value text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(value, x + 2, yCell + 9.5);
    };

    const drawTwoColumnInstructionsTable = (yStart: number) => {
      const w1 = 85;
      const w2 = 85;
      const x = margin;

      // Extract instructions
      const rawInst = cj.instrucciones_generales?.texto || 
                      cj.instrucciones_generales || 
                      cj.instruccion || 
                      'Lee atentamente las instrucciones antes de responder.';
      
      // Extract objectives (OA) - Only the codes
      let rawObj = 'Evaluar comprensión lectora y análisis de textos.';
      if (Array.isArray(result.oa_codes) && result.oa_codes.length > 0 && result.oa_codes[0] !== 'OA_EVAL') {
        rawObj = result.oa_codes.map((c: string) => c.replace(/^OA\s*:/i, 'OA ')).join(', ');
      } else if (Array.isArray(cj.oa_codes) && cj.oa_codes.length > 0 && cj.oa_codes[0] !== 'OA_EVAL') {
        rawObj = cj.oa_codes.map((c: string) => c.replace(/^OA\s*:/i, 'OA ')).join(', ');
      } else if (typeof cj.tabla_especificaciones?.oa_evaluado === 'string' && cj.tabla_especificaciones.oa_evaluado) {
        const matches = cj.tabla_especificaciones.oa_evaluado.match(/OA\s*\d+/gi);
        if (matches && matches.length > 0) {
          rawObj = matches.map((m: string) => m.toUpperCase().replace(/\s+/g, ' ')).join(', ');
        } else {
          rawObj = cj.tabla_especificaciones.oa_evaluado;
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      // Split text for each column
      const col1Lines = doc.splitTextToSize(rawInst, w1 - 6);
      const col2Lines = doc.splitTextToSize(rawObj, w2 - 6);

      const lineHeight = 4;
      const headerHeight = 7;
      const height1 = headerHeight + col1Lines.length * lineHeight + 4;
      const height2 = headerHeight + col2Lines.length * lineHeight + 4;
      const maxHeight = Math.max(height1, height2);

      // Draw outer borders
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.35);
      doc.rect(x, yStart, w1, maxHeight, 'S');
      doc.rect(x + w1, yStart, w2, maxHeight, 'S');

      // Column 1 header background
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(x + 0.1, yStart + 0.1, w1 - 0.2, headerHeight - 0.1, 'F');
      
      // Column 2 header background
      doc.rect(x + w1 + 0.1, yStart + 0.1, w2 - 0.2, headerHeight - 0.1, 'F');

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("Instrucciones", x + 3, yStart + 4.5);
      doc.text("Objetivos", x + w1 + 3, yStart + 4.5);

      // Draw content for Column 1
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      let currY1 = yStart + headerHeight + 3;
      col1Lines.forEach((line: string) => {
        doc.text(line, x + 3, currY1);
        currY1 += lineHeight;
      });

      // Draw content for Column 2
      let currY2 = yStart + headerHeight + 3;
      col2Lines.forEach((line: string) => {
        doc.text(line, x + w1 + 3, currY2);
        currY2 += lineHeight;
      });

      return maxHeight;
    };

    const courseName = result.nivel || curso || 'General';
    const teacherName = (cj.docente || docente || '___________________________').replace(/ROGOBERTO/gi, 'RIGOBERTO');
    const subjectName = cj.asignatura || 'Lenguaje y Comunicación';

    // Fila 1:
    drawHeaderCell(margin, y, 45, 12, "Instrumento", "PRUEBA ESCRITA");
    drawHeaderCell(margin + 45, y, 65, 12, "Asignatura/Especialidad", subjectName);
    drawHeaderCell(margin + 110, y, 30, 12, "Curso", courseName);
    drawHeaderCell(margin + 140, y, 30, 12, "Letra", "");

    y += 12;

    // Fila 2:
    drawHeaderCell(margin, y, 60, 12, "Docente Responsable", teacherName);
    drawHeaderCell(margin + 60, y, 22, 12, "Pje. Ideal", `${totalPtos} pts`);
    drawHeaderCell(margin + 82, y, 22, 12, "Pje. Corte", `${Math.round(totalPtos * 0.6)} pts`);
    drawHeaderCell(margin + 104, y, 22, 12, "Prema/Ex.", "60%");
    drawHeaderCell(margin + 126, y, 22, 12, "Tiempo", `${cj.duracion_min || 90} min`);
    drawHeaderCell(margin + 148, y, 22, 12, "Coef.", "1");

    y += 12;

    // Fila 3:
    drawHeaderCell(margin, y, 90, 12, "Nombre del Estudiante", "");
    drawHeaderCell(margin + 90, y, 30, 12, "Fecha", "");
    drawHeaderCell(margin + 120, y, 25, 12, "Pje. Obtenido", "");
    drawHeaderCell(margin + 145, y, 25, 12, "Calificación", "");

    y += 18;

    // Título en negrita y subrayado
    const getEvaluationTitle = () => {
      const tipo = String(cj.tipo_evaluacion || result.tipo_evaluacion || tipoEvaluacion || '').toLowerCase();
      const isSimce = result.simce_ensayo || tipo.includes('simce');
      if (isSimce) return 'ENSAYO SIMCE';
      if (tipo.includes('diagnostica')) return 'EVALUACIÓN DIAGNÓSTICA';
      if (tipo.includes('formativa')) return 'EVALUACIÓN FORMATIVA';
      if (tipo.includes('sumativa')) return 'EVALUACIÓN SUMATIVA';
      return 'EVALUACIÓN FORMATIVA';
    };

    const titleText = getEvaluationTitle();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    const textWidth = doc.getTextWidth(titleText);
    const startX = margin + (usable - textWidth) / 2;
    doc.text(titleText, startX, y);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.45);
    doc.line(startX, y + 1.2, startX + textWidth, y + 1.2);

    y += 8;

    // Tabla de dos columnas: Instrucciones | Objetivos
    const tableHeight = drawTwoColumnInstructionsTable(y);
    y += tableHeight + 6;
    // Clean alternatives first and apply the sequential numbering in the exact sorted order
    const cleanPreguntasList = preguntas.map((q: any) => {
      const cleanAlts = getCleanAlternatives(q.alternativas, q.numero, q);
      return {
        ...q,
        alternativas: cleanAlts
      };
    });

    const preguntasT1_raw = cleanPreguntasList.filter((q: any, idx: number) => getTextoAsociado(q, idx, cleanPreguntasList.length) === 'texto_1');
    const preguntasT2_raw = cleanPreguntasList.filter((q: any, idx: number) => getTextoAsociado(q, idx, cleanPreguntasList.length) === 'texto_2');
    const preguntasAmbos_raw = cleanPreguntasList.filter((q: any, idx: number) => getTextoAsociado(q, idx, cleanPreguntasList.length) === 'ambos');

    const getMC = (arr: any[]) => arr.filter((p: any) => p.tipo === 'seleccion_multiple');
    const getDev = (arr: any[]) => arr.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

    const finalSortedPreguntas = [
      ...getMC(preguntasT1_raw),
      ...getDev(preguntasT1_raw),
      ...getMC(preguntasT2_raw),
      ...getDev(preguntasT2_raw),
      ...getMC(preguntasAmbos_raw),
      ...getDev(preguntasAmbos_raw)
    ];

    const questionsWithNum = finalSortedPreguntas.map((q: any, idx: number) => ({
      ...q,
      numero_original: idx + 1
    }));

    const preguntasT1 = questionsWithNum.filter((q: any, idx: number) => getTextoAsociado(q, idx, questionsWithNum.length) === 'texto_1');
    const preguntasT2 = questionsWithNum.filter((q: any, idx: number) => getTextoAsociado(q, idx, questionsWithNum.length) === 'texto_2');
    const preguntasAmbos = questionsWithNum.filter((q: any, idx: number) => getTextoAsociado(q, idx, questionsWithNum.length) === 'ambos');
    const texts = cj.textos_lectura || [];
    if (texts.length >= 2) {
      // Texto 1
      addSection('TEXTO DE LECTURA 1');
      drawSingleText(texts[0], 0);
      
      // Preguntas Texto 1
      drawQuestionsGroup(preguntasT1, 'PREGUNTAS DEL TEXTO 1');

      // Texto 2
      checkSpaceForNextGroup(texts[1], preguntasT2);
      addSection('TEXTO DE LECTURA 2');
      drawSingleText(texts[1], 1);

      // Preguntas Texto 2
      drawQuestionsGroup(preguntasT2, 'PREGUNTAS DEL TEXTO 2');

      // Preguntas Integradas
      if (preguntasAmbos.length > 0) {
        checkSpaceForNextGroup(null, preguntasAmbos);
        drawQuestionsGroup(preguntasAmbos, 'PREGUNTAS DE INTEGRACIÓN (AMBOS TEXTOS)');
      }
    } else {
      // Fallback
      if (texts.length > 0) {
        addSection('TEXTOS DE LECTURA');
        texts.forEach((txt: any, idx: number) => {
          drawSingleText(txt, idx);
        });
      }
      drawQuestionsGroup(questionsWithNum, 'PREGUNTAS DE COMPRENSIÓN');
    }

    // ── 6. TABLA DE ESPECIFICACIONES (FORMATO EXACTO) ──
    doc.addPage();
    fillBackground();
    y = margin;

    addSection('TABLA DE ESPECIFICACIONES');

    // 4x2 Header info grid
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, usable, 16, 'S');
    doc.line(margin, y + 8, margin + usable, y + 8);
    doc.line(margin + 45, y, margin + 45, y + 16);
    doc.line(margin + 90, y, margin + 90, y + 16);
    doc.line(margin + 130, y, margin + 130, y + 16);
    
    doc.text("Docente Responsable:", margin + 2, y + 5);
    doc.setFont('helvetica', 'normal');
    const docResponsable = (cj.docente || docente || "___________________________").replace(/ROGOBERTO/gi, 'RIGOBERTO');
    doc.text(docResponsable, margin + 2, y + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text("Asignatura:", margin + 47, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text("Lenguaje y Comunicación", margin + 47, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.text("Nivel / Curso:", margin + 92, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(result.nivel || curso || '', margin + 92, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.text("Tiempo estimado:", margin + 132, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${cj.duracion_min ?? 90} min`, margin + 132, y + 12);

    y += 20;

    // Second info row
    doc.rect(margin, y, usable, 8, 'S');
    doc.line(margin + 45, y, margin + 45, y + 8);
    doc.line(margin + 90, y, margin + 90, y + 8);
    doc.line(margin + 130, y, margin + 130, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.text("Ítems Totales:", margin + 2, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(String(preguntas.length), margin + 25, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text("Puntaje Total:", margin + 47, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${totalPtos} pts`, margin + 70, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text("Exigencia:", margin + 92, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text("60%", margin + 112, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text("RBD:", margin + 132, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text("10243-9", margin + 145, y + 5);

    y += 14;

    // OA Block
    const oaCodesText = (result.oa_codes && result.oa_codes.length > 0)
      ? result.oa_codes.join(' | ')
      : ((cj.tabla_especificaciones?.oa_evaluado) || 'OA 3 | OA 4 | OA 8');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(`Objetivos de Aprendizaje (OAs): ${oaCodesText}`, margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(`Descripción sintetizada: Evalúa habilidades de comprensión lectora, identificación de vocabulario en contexto e inferencia.`, margin, y);
    y += 8;

    // Spec Grid Table Headers
    const specColW = [30, 45, 30, 22, 15, 12, 16];
    const specHeaders = ['Habilidades', 'Indicadores', 'Contenido', 'Tipo Ítem', 'N° Ítem', 'Claves', 'Ponderación'];

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y - 4, usable, 6, 'F');
    doc.rect(margin, y - 4, usable, 6, 'S');

    let sx = margin;
    specHeaders.forEach((h, idx) => {
      doc.text(h, sx + 1, y);
      sx += specColW[idx];
    });
    y += 4;

    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);

    filasSpec.forEach((f: any, idx: number) => {
      if (y > 250) { doc.addPage(); fillBackground(); y = margin; }
      
      const numItemsText = f.n_pregunta || String(idx + 1);
      const ponderacionText = `${f.ponderacion_pct || 0}%`;

      const rowCells = [
        f.habilidad || 'General',
        f.indicador || 'Comprender e integrar información.',
        f.contenido || 'Comprensión lectora',
        f.tipo_item || 'Ítem',
        numItemsText,
        f.clave || 'A',
        ponderacionText
      ];

      const cellLines = rowCells.map((text, idx) => doc.splitTextToSize(String(text), specColW[idx] - 2));
      const maxLines = Math.max(...cellLines.map(lines => lines.length));
      const rowHeight = maxLines * 4 + 2;

      doc.setDrawColor(226, 232, 240);
      sx = margin;
      
      rowCells.forEach((cellText, cellIdx) => {
        const lines = cellLines[cellIdx];
        lines.forEach((line: string, lineIdx: number) => {
          doc.text(line, sx + 1, y + lineIdx * 4 + 3);
        });
        doc.rect(sx, y, specColW[cellIdx], rowHeight, 'S');
        sx += specColW[cellIdx];
      });
      y += rowHeight;
    });

    y += 12;

    // ── 8. PAUTA DE CORRECCIÓN — USO EXCLUSIVO DOCENTE ──
    if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
    addSection('PAUTA DE CORRECCIÓN — USO EXCLUSIVO DOCENTE');
    
    const rawRespList = cj.respuestas_esperadas || [];
    const respList = finalPreguntas.map((q: any) => {
      const resp = rawRespList.find((r: any) => String(r.pregunta) === String(q.numero || q.n_pregunta));
      return {
        pregunta: q.numero_original,
        tipo: q.tipo,
        clave: resp?.clave || q.clave || q.respuesta_correcta || 'A',
        explicacion: resp?.explicacion || 'Justificación basada en el análisis e información extraída de los textos.',
        respuesta_esperada: resp?.respuesta_esperada || q.respuesta_esperada || 'Respuesta esperada.',
        criterios_correccion: resp?.criterios_correccion
      };
    });
    const mcAnswers = respList.filter((r: any) => r.tipo === 'seleccion_multiple');
    const devAnswers = respList.filter((r: any) => r.tipo === 'consigna_abierta' || r.tipo === 'desarrollo' || !mcAnswers.some(mc => mc.pregunta === r.pregunta));

    if (mcAnswers.length > 0) {
      addText('Parte I: Alternativas (Claves y Justificaciones)', 10, true, '#be123c');
      y += 2;

      const tableColW = [25, 20, 125];
      const tableHeaders = ['N° Pregunta', 'Clave', 'Justificación específica'];

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y - 4, usable, 6, 'F');
      doc.rect(margin, y - 4, usable, 6, 'S');

      let sx = margin;
      tableHeaders.forEach((h, idx) => {
        doc.text(h, sx + 1, y);
        sx += tableColW[idx];
      });
      y += 4;

      doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);

      mcAnswers.forEach((resp: any, ri: number) => {
        const num = resp.pregunta || (ri + 1);
        const justification = resp.explicacion || 'Justificación basada en la información explícita e implícita del texto.';
        
        const cellLines = [
          String(num),
          resp.clave || 'A',
          doc.splitTextToSize(justification, tableColW[2] - 2)
        ];

        const lineCount = cellLines[2].length;
        const rowHeight = Math.max(lineCount * 4 + 2, 6);

        if (y + rowHeight > 275) {
          doc.addPage();
          fillBackground();
          y = margin + 4;
          
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, y - 4, usable, 6, 'F');
          doc.rect(margin, y - 4, usable, 6, 'S');
          let sx2 = margin;
          tableHeaders.forEach((h, idx) => {
            doc.text(h, sx2 + 1, y);
            sx2 += tableColW[idx];
          });
          y += 4;
          doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
        }

        let sx = margin;
        doc.rect(sx, y - 4, tableColW[0], rowHeight, 'S');
        doc.text(cellLines[0], sx + 2, y);
        sx += tableColW[0];

        doc.rect(sx, y - 4, tableColW[1], rowHeight, 'S');
        doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74);
        doc.text(cellLines[1], sx + 2, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
        sx += tableColW[1];

        doc.rect(sx, y - 4, tableColW[2], rowHeight, 'S');
        cellLines[2].forEach((line: string, lineIdx: number) => {
          doc.text(line, sx + 1, y + lineIdx * 4);
        });

        y += rowHeight;
      });
      y += 6;
    }

    if (devAnswers.length > 0) {
      if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
      addText('Parte II: Preguntas de Desarrollo (Respuestas Esperadas y Criterios)', 10, true, '#be123c');
      y += 2;

      devAnswers.forEach((resp: any) => {
        if (y > 245) { doc.addPage(); fillBackground(); y = margin; }
        const num = resp.pregunta;
        addText(`Pregunta ${num} (Desarrollo)`, 9.5, true, '#1e293b');
        addText(`Respuesta esperada: ${resp.respuesta_esperada}`, 9, false, '#16a34a');
        y += 2;
      });
    }

    if (cj.pauta_correccion) {
      if (y > 265) { doc.addPage(); fillBackground(); y = margin; }
      y += 2;
      addText('Pauta de Calificación:', 9.5, true, '#1e293b');
      addText(`Puntaje Total: ${cj.pauta_correccion.puntaje_total || totalPtos} Ptos | Exigencia: ${cj.pauta_correccion.exigencia || '60%'} | Aprobación (Nota 4.0): ${cj.pauta_correccion.puntaje_aprobacion || Math.round(totalPtos * 0.6)} Ptos`, 9, false, '#475569');
    }

    // ── 8.5. RÚBRICA/INSTRUMENTO DE EVALUACIÓN ──
    const rub = cj.rubrica;
    if (rub?.criterios?.length) {
      if (y > 230) { doc.addPage(); fillBackground(); y = margin; }
      const instTipo = rub.tipo_instrumento || 'rubrica_analitica';
      addSection(rub.titulo || 'INSTRUMENTO DE EVALUACIÓN');
      if (rub.instruccion) addText(rub.instruccion, 8.5, false, '#64748b');

      let rColW = [38, 33, 33, 33, 33];
      const getInstrumentHeaders = (tipo: string) => {
        if (tipo === 'lista_cotejo') return ['Criterio', 'Logrado', 'No Logrado'];
        if (tipo === 'rubrica_holistica') return ['Nivel', 'Descripción del Desempeño'];
        if (tipo === 'escala_apreciacion') return ['Criterio', 'Excelente', 'Bueno', 'Suficiente', 'Insuficiente'];
        return ['Dimensión / Criterio', 'Excelente', 'Bueno', 'Suficiente', 'Insuficiente'];
      };
      let rHeaders = getInstrumentHeaders(instTipo);

      if (instTipo === 'lista_cotejo') {
        rColW = [80, 45, 45];
      } else if (instTipo === 'rubrica_holistica') {
        rColW = [40, 130];
      } else if (instTipo === 'escala_apreciacion') {
        rColW = [50, 30, 30, 30, 30];
      }

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      let rx = margin;
      rHeaders.forEach((h, i) => { doc.text(h, rx, y); rx += rColW[i]; });
      y += 6;

      rub.criterios.forEach((c: any) => {
        if (y > 265) { doc.addPage(); fillBackground(); y = margin; }
        rx = margin;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 41, 59);

        let vals = [c.nombre || c.dimension || ''];
        if (instTipo === 'lista_cotejo') {
          vals.push(c.logrado || c.si || '', c.no_logrado || c.no || '');
        } else if (instTipo === 'escala_apreciacion') {
          vals.push(c.destacado || '', c.logrado || '', c.en_desarrollo || '', c.no_logrado || '');
        } else if (instTipo === 'rubrica_holistica') {
          vals.push(c.descripcion || c.excelente || c.logrado || '');
        } else {
          vals.push(c.excelente || c.logrado || '', c.bueno || c.logrado_parcial || '', c.suficiente || c.en_desarrollo || '', c.insuficiente || c.no_logrado || '');
        }

        let rowH = 5;
        vals.forEach((v, i) => {
          const ls = doc.splitTextToSize(v ?? '', rColW[i] - 2);
          rowH = Math.max(rowH, ls.length * 4);
        });

        vals.forEach((v, i) => {
          const ls = doc.splitTextToSize(v ?? '', rColW[i] - 2);
          ls.forEach((l: string, li: number) => doc.text(l, rx, y + li * 4));
          rx += rColW[i];
        });
        y += rowH + 2;
      });
    }

    // ── 9. TWO-PASS PAGE FOOTERS (Page X of Y) ──
    const totalPages = doc.getNumberOfPages();
    const estNameFooter = cj.establecimiento || establecimiento || "___________________________";
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      
      doc.text(`${estNameFooter} | Página ${i} de ${totalPages}`, 105, 287, { align: 'center' });
    }

    doc.save(`evaluacion-completa.pdf`);
  };

  // ── Client Word download ──────────────────────────────────────────────────
  const triggerWordDownload = async () => {
    if (!result) return;
    const cj = result.contenido_json || result;
    const sections: any[] = [];

    // ─ helpers ────────────────────────────────────────────────────────
    const h2 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
    const gap = () => new Paragraph({ text: '' });
    const cell = (text: string, bold = false) =>
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: text || '', bold, size: 20 })] })] });
    const headerRow = (cols: string[]) =>
      new TableRow({ children: cols.map((c) => cell(c, true)) });
    const makeTable = (rows: any[]) =>
      new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });

    // Helper: Chilean grade conversion scale (60% exigencia)
    const getGradesScale = (total: number, exigencia = 0.6) => {
      const scale: Array<{ puntos: number; nota: number }> = [];
      for (let p = 0; p <= total; p++) {
        let nota = 1.0;
        if (total > 0) {
          const approvalPoints = total * exigencia;
          if (p < approvalPoints) {
            nota = 1.0 + 3.0 * (p / approvalPoints);
          } else {
            nota = 4.0 + 3.0 * ((p - approvalPoints) / (total * (1 - exigencia)));
          }
        }
        scale.push({ puntos: p, nota: Math.round(nota * 10) / 10 });
      }
      return scale;
    };

    // Calculate dynamic points
    const preguntas = getPreguntasList(cj);
    const MC_Preguntas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple');
    const Dev_Preguntas = preguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

    let mcPoints = MC_Preguntas.length * 2;
    let devPoints = Dev_Preguntas.length * 4;

    const filasSpec = cj.tabla_especificaciones?.filas || [];
    if (filasSpec.length) {
      let sumMc = 0;
      let sumDev = 0;
      filasSpec.forEach((f: any) => {
        const ptosVal = Number(f.ptos) || 0;
        const isMc = f.tipo_item === 'Selección múltiple' || String(f.tipo_item).toLowerCase().includes('alternativa');
        if (isMc) sumMc += ptosVal;
        else sumDev += ptosVal;
      });
      if (sumMc > 0) mcPoints = sumMc;
      if (sumDev > 0) devPoints = sumDev;
    }
    const totalPtos = mcPoints + devPoints;

    // Group specs table by Habilidad (Taxonomía)
    const groupedSpec: Record<string, {
      habilidad: string;
      indicadores: Set<string>;
      contenidos: Set<string>;
      tipo_items: Set<string>;
      num_items: number[];
      claves: string[];
      ptos: number;
    }> = {};

    filasSpec.forEach((f: any) => {
      const hab = f.habilidad || 'General';
      if (!groupedSpec[hab]) {
        groupedSpec[hab] = {
          habilidad: hab,
          indicadores: new Set(),
          contenidos: new Set(),
          tipo_items: new Set(),
          num_items: [],
          claves: [],
          ptos: 0
        };
      }
      if (f.indicador) groupedSpec[hab].indicadores.add(f.indicador);
      if (f.contenido) groupedSpec[hab].contenidos.add(f.contenido);
      if (f.tipo_item) groupedSpec[hab].tipo_items.add(f.tipo_item);
      if (f.n_pregunta) {
        String(f.n_pregunta).split(',').forEach(n => {
          const num = parseInt(n.trim(), 10);
          if (!isNaN(num)) groupedSpec[hab].num_items.push(num);
        });
      }
      if (f.clave) groupedSpec[hab].claves.push(f.clave);
      groupedSpec[hab].ptos += (Number(f.ptos) || 0);
    });

    // Title & Header Establishment Info using a Table layout
    const estName = cj.establecimiento || establecimiento || "___________________________";
    sections.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "[Logo del establecimiento]", size: 14, color: '888888', italics: true })
                  ]
                })
              ]
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Establecimiento: ${estName}`, bold: true, size: 22 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Depto. de Lenguaje y Comunicación  ·  RBD: 10243-9", size: 16, color: '666666' })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }));
    sections.push(gap());

    sections.push(new Paragraph({ text: result.titulo ?? 'Evaluación de Aprendizaje', heading: HeadingLevel.HEADING_1 }));
    sections.push(new Paragraph({
      children: [new TextRun({ text: `Asignatura: Lenguaje y Comunicación  ·  Curso: ${result.nivel || curso}`, size: 22, color: '666666' })],
    }));
    sections.push(gap());

    // Student fields box as Table
    sections.push(makeTable([
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Nombre: ___________________________________________________________", bold: true, size: 20 })] })], columnSpan: 2 }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Curso: _________", bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Fecha: _________", bold: true, size: 20 })] })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ` Puntaje obtenido: ________ / ${totalPtos} pts`, bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Nota: ________", bold: true, size: 20 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: " Exigencia: 60%", size: 18, color: '555555' })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ` Tiempo: ${cj.duracion_min ?? 90} min`, size: 18, color: '555555' })] })] })
        ]
      })
    ]));
    sections.push(gap());

    // Instructions
    sections.push(new Paragraph({
      children: [new TextRun({ text: "INSTRUCCIONES GENERALES", bold: true, size: 20, color: 'BE123C' })]
    }));
    sections.push(new Paragraph({
      children: [new TextRun({ text: "Lee atentamente cada pregunta antes de responder. En la Parte I, marca con una X la letra de la alternativa correcta. En la Parte II, responde en el espacio asignado siguiendo la técnica indicada.", size: 20, color: '555555' })]
    }));
    sections.push(gap());

    // Textos de Lectura (Word)
    if (cj.textos_lectura && cj.textos_lectura.length > 0) {
      sections.push(gap()); sections.push(h2('TEXTOS DE LECTURA'));
      cj.textos_lectura.forEach((txt: any, index: number) => {
        const cleanTxtTitle = (txt.titulo || '').replace(/^Texto\s*\d+\s*:\s*/i, '').trim() || 'Sin Título';
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Texto ${index + 1}: ${cleanTxtTitle} — Tipo: ${txt.tipo || 'Lectura'} — Fuente: Texto adaptado con fines pedagógicos.`, bold: true, size: 22, color: 'BE123C' })],
        }));
        sections.push(gap());
        sections.push(new Paragraph({
          children: [new TextRun({ text: txt.contenido, size: 20 })],
        }));
        sections.push(gap());
      });
    }

    // PARTE I: SELECCIÓN ÚNICA
    if (MC_Preguntas.length > 0) {
      sections.push(gap()); sections.push(h2(`PARTE I: Comprensión de Lectura — Selección Única (${mcPoints} puntos)`));
      MC_Preguntas.forEach((p: any, i: number) => {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${p.enunciado}`, bold: true, size: 22 })],
        }));
        if (p.texto_base) {
          sections.push(new Paragraph({
            children: [new TextRun({ text: p.texto_base, italics: true, size: 20, color: '555555' })],
          }));
        }
        (p.alternativas ?? []).forEach((alt: any) => {
          sections.push(new Paragraph({
            children: [new TextRun({ text: `   ${alt.letra}) ${alt.texto}`, size: 20 })]
          }));
        });
        sections.push(gap());
      });
    }

    // PARTE II: DESARROLLO
    if (Dev_Preguntas.length > 0) {
      sections.push(gap()); sections.push(h2(`PARTE II: Preguntas de Desarrollo (${devPoints} puntos)`));
      Dev_Preguntas.forEach((p: any, i: number) => {
        const itemNum = MC_Preguntas.length + i + 1;
        sections.push(new Paragraph({
          children: [new TextRun({ text: `${itemNum}. ${p.enunciado}`, bold: true, size: 22 })],
        }));
        
        const instTipo = cj.tipo_evaluacion || result.tipo_evaluacion || tipoEvaluacion;
        const techniqueInstructionText = getTechniqueInstruction(instTipo);

        sections.push(new Paragraph({
          children: [new TextRun({ text: `   ${techniqueInstructionText}`, bold: true, size: 20, color: 'BE123C' })]
        }));
        sections.push(gap());

        sections.push(new Paragraph({
          children: [new TextRun({ text: '   ____________________________________________________________________________________', color: 'CCCCCC' })]
        }));
        sections.push(new Paragraph({
          children: [new TextRun({ text: '   ____________________________________________________________________________________', color: 'CCCCCC' })]
        }));
        sections.push(new Paragraph({
          children: [new TextRun({ text: '   ____________________________________________________________________________________', color: 'CCCCCC' })]
        }));
        sections.push(gap());
      });
    }

    // TABLA DE ESPECIFICACIONES (Word)
    if (filasSpec.length > 0) {
      sections.push(gap()); sections.push(h2('TABLA DE ESPECIFICACIONES'));
      
      // 4x2 grid information table
      sections.push(makeTable([
        new TableRow({
          children: [
            cell(`Docente Responsable: ${(cj.docente || docente || "___________________________").replace(/ROGOBERTO/gi, 'RIGOBERTO')}`, true),
            cell("Asignatura: Lenguaje y Comunicación", true),
            cell(`Nivel/Curso: ${result.nivel || curso || ''}`, true),
            cell(`Tiempo: ${cj.duracion_min ?? 90} min`, true)
          ]
        }),
        new TableRow({
          children: [
            cell(`Ítems Totales: ${preguntas.length}`, true),
            cell(`Puntaje Total: ${totalPtos} pts`, true),
            cell("Exigencia: 60%", true),
            cell("RBD: 10243-9", true)
          ]
        })
      ]));
      sections.push(gap());

      const oaCodesText = (result.oa_codes && result.oa_codes.length > 0)
        ? result.oa_codes.join(' | ')
        : ((cj.tabla_especificaciones?.oa_evaluado) || 'OA 3 | OA 4 | OA 8');
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: `Objetivos de Aprendizaje (OAs): `, bold: true, size: 20 }),
          new TextRun({ text: oaCodesText, size: 20 })
        ]
      }));
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: `Descripción sintetizada: Evalúa habilidades de comprensión lectora, identificación de vocabulario en contexto e inferencia.`, size: 18, color: '555555' })
        ]
      }));
      sections.push(gap());

      const totalItemsCount = preguntas.length;
      const specRows = [
        headerRow(['Habilidades', 'Indicadores', 'Contenido', 'Tipo Ítem', 'N° Ítem', 'Claves', 'Ponderación']),
        ...Object.values(groupedSpec).map((g: any) => {
          const numItemsText = g.num_items.sort((a: number, b: number) => a - b).join(', ');
          const pct = totalItemsCount > 0 ? Math.round((g.num_items.length / totalItemsCount) * 100) : 0;
          const ponderacionText = `${g.num_items.length} / ${totalItemsCount} (${pct}%)`;

          return new TableRow({
            children: [
              cell(g.habilidad, true),
              cell(Array.from(g.indicadores).join(', ')),
              cell(Array.from(g.contenidos).join(', ')),
              cell(Array.from(g.tipo_items).join(', ')),
              cell(numItemsText),
              cell(g.claves.join(', ')),
              cell(ponderacionText)
            ]
          });
        })
      ];
      sections.push(makeTable(specRows));
      sections.push(gap());

      // Signatures footer
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: "Firma Docente: __________________      ", bold: true, size: 20 }),
          new TextRun({ text: "VoBo Jefe UTP: __________________      ", bold: true, size: 20 }),
          new TextRun({ text: "Fecha: _________", bold: true, size: 20 })
        ]
      }));
      sections.push(gap());
    }

    // TABLA DE CONVERSIÓN PUNTAJE a NOTA (Escala 60%)
    sections.push(gap()); sections.push(h2('TABLA DE CONVERSIÓN PUNTAJE a NOTA (Escala 60%)'));
    const gradesScale = getGradesScale(totalPtos, 0.6);
    const gridColsCount = 5;
    const rowsCountInGrid = Math.ceil(gradesScale.length / gridColsCount);
    
    const convTableRows = [];
    // Header for conversion grid
    convTableRows.push(new TableRow({
      children: Array(gridColsCount).fill(null).map(() => cell("Pts   Nota", true))
    }));

    for (let r = 0; r < rowsCountInGrid; r++) {
      const rowCells = [];
      for (let c = 0; c < gridColsCount; c++) {
        const itemIdx = r + c * rowsCountInGrid;
        if (itemIdx < gradesScale.length) {
          const scaleItem = gradesScale[itemIdx];
          rowCells.push(cell(`${scaleItem.puntos}  ->  ${scaleItem.nota.toFixed(1)}`));
        } else {
          rowCells.push(cell(""));
        }
      }
      convTableRows.push(new TableRow({ children: rowCells }));
    }
    sections.push(makeTable(convTableRows));
    sections.push(gap());

    // PAUTA DE CORRECCIÓN
    sections.push(gap()); sections.push(h2('PAUTA DE CORRECCIÓN — USO EXCLUSIVO DOCENTE'));
    const rawRespList = cj.respuestas_esperadas || [];
    const respList = finalPreguntas.map((q: any) => {
      const resp = rawRespList.find((r: any) => String(r.pregunta) === String(q.numero || q.n_pregunta));
      return {
        pregunta: q.numero_original,
        tipo: q.tipo,
        clave: resp?.clave || q.clave || q.respuesta_correcta || 'A',
        explicacion: resp?.explicacion || 'Justificación basada en el análisis e información extraída de los textos.',
        respuesta_esperada: resp?.respuesta_esperada || q.respuesta_esperada || 'Respuesta esperada.',
        criterios_correccion: resp?.criterios_correccion
      };
    });
    const mcAnswers = respList.filter((r: any) => r.tipo === 'seleccion_multiple');
    const devAnswers = respList.filter((r: any) => r.tipo === 'consigna_abierta' || r.tipo === 'desarrollo' || !mcAnswers.some(mc => mc.pregunta === r.pregunta));

    if (mcAnswers.length > 0) {
      sections.push(new Paragraph({
        children: [new TextRun({ text: 'Parte I: Alternativas (Claves y Justificaciones)', bold: true, size: 22, color: 'BE123C' })]
      }));
      sections.push(gap());

      const tableRows = [
        headerRow(['N° Pregunta', 'Clave', 'Justificación específica'])
      ];

      mcAnswers.forEach((resp: any, ri: number) => {
        const num = resp.pregunta;
        const justification = resp.explicacion || 'Justificación basada en la información explícita e implícita del texto.';
        tableRows.push(new TableRow({
          children: [
            cell(String(num), false),
            cell(resp.clave || 'A', true),
            cell(justification, false)
          ]
        }));
      });

      sections.push(makeTable(tableRows));
      sections.push(gap());
    }

    if (devAnswers.length > 0) {
      sections.push(new Paragraph({
        children: [new TextRun({ text: 'Parte II: Preguntas de Desarrollo (Respuestas Esperadas)', bold: true, size: 22, color: 'BE123C' })]
      }));
      sections.push(gap());

      devAnswers.forEach((resp: any) => {
        const num = resp.pregunta;
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Pregunta ${num} (Desarrollo)`, bold: true, size: 22 })]
        }));
        sections.push(new Paragraph({
          children: [
            new TextRun({ text: `Respuesta esperada: `, bold: true, size: 20 }),
            new TextRun({ text: resp.respuesta_esperada, size: 20 })
          ]
        }));
        sections.push(gap());
      });
    }

    if (cj.pauta_correccion) {
      sections.push(gap());
      sections.push(new Paragraph({
        children: [new TextRun({ text: `Pauta de Calificación:`, bold: true, size: 22 })]
      }));
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: `Puntaje Total: ${cj.pauta_correccion.puntaje_total || totalPtos} Ptos | Exigencia: ${cj.pauta_correccion.exigencia || '60%'} | Puntaje Aprobación (Nota 4.0): ${cj.pauta_correccion.puntaje_aprobacion || Math.round(totalPtos * 0.6)} Ptos`, size: 20 })
        ]
      }));
    }

    const doc = new Document({
      sections: [{
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${cj.establecimiento || establecimiento || "___________________________"} | Página `, size: 16, color: '888888' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
                  new TextRun({ text: " de ", size: 16, color: '888888' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '888888' })
                ]
              })
            ]
          })
        },
        children: sections
      }]
    });
    const blob = await Packer.toBlob(doc);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${result.titulo ?? 'evaluacion'}-completa.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(ev =>
    (ev.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ev.nivel || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const UpgradeModal = () => {
    const formattedRenewalDate = upgradeRenewalDate
      ? new Date(upgradeRenewalDate).toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
        <div className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-50 border border-violet-100 rounded-2xl mx-auto">
            <Lock className="w-8 h-8 text-violet-600" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {upgradePlanStatus === 'active'
                ? 'Cupo mensual alcanzado'
                : upgradeReason === 'trial_expired'
                ? 'Tu período de prueba ha terminado'
                : 'Límite de evaluaciones alcanzado'}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {upgradePlanStatus === 'active'
                ? `Has alcanzado tu cupo mensual de ${upgradeLimit} evaluaciones y rúbricas en tu suscripción. Tu cupo se renovará automáticamente en tu próximo ciclo el ${formattedRenewalDate}.`
                : upgradeReason === 'trial_expired'
                ? 'Tu trial gratuito de 7 días ha expirado. Actualiza tu plan para seguir generando recursos visuales, planificaciones y más.'
                : `Has generado 6 evaluaciones en tu trial gratuito. Los demás módulos siguen funcionando con sus propios límites. Actualiza para generación ilimitada.`}
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {upgradePlanStatus === 'active' ? (
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl shadow-md transition-all duration-200"
              >
                Entendido
              </button>
            ) : (
              <a
                href="/upgrade"
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl shadow-md transition-all duration-200"
              >
                <Zap className="w-4 h-4" />
                Actualizar Plan — Generación Ilimitada
              </a>
            )}
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              {upgradePlanStatus === 'active' ? 'Volver' : 'Volver al generador'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const cj = result?.contenido_json || result;
  
  const getTextoAsociado = (q: any, idx: number, total: number) => {
    const txt = String(q.texto_asociado || q.texto || '').toLowerCase();
    if (txt.includes('texto_1') || txt.includes('texto 1') || txt.includes('1')) return 'texto_1';
    if (txt.includes('texto_2') || txt.includes('texto 2') || txt.includes('2')) return 'texto_2';
    if (txt.includes('ambos') || txt.includes('integra') || txt.includes('ambas')) return 'ambos';
    
    const enunc = String(q.enunciado || '').toLowerCase();
    if (enunc.includes('texto 1') || enunc.includes('primer texto')) return 'texto_1';
    if (enunc.includes('texto 2') || enunc.includes('segundo texto')) return 'texto_2';
    if (enunc.includes('ambos textos') || enunc.includes('ambas lecturas')) return 'ambos';
    
    if (idx < total * 0.45) return 'texto_1';
    if (idx < total * 0.9) return 'texto_2';
    return 'ambos';
  };

  let finalPreguntas: any[] = [];
  let finalFilasSpec: any = [];
  let totalPtos = 0;

  if (cj) {
    const rawPreguntas = getPreguntasList(cj);
    const preguntasT1 = rawPreguntas.filter((q: any, idx: number) => getTextoAsociado(q, idx, rawPreguntas.length) === 'texto_1');
    const preguntasT2 = rawPreguntas.filter((q: any, idx: number) => getTextoAsociado(q, idx, rawPreguntas.length) === 'texto_2');
    const preguntasAmbos = rawPreguntas.filter((q: any, idx: number) => getTextoAsociado(q, idx, rawPreguntas.length) === 'ambos');

    const sortedPreguntas = [...preguntasT1, ...preguntasT2, ...preguntasAmbos];
    finalPreguntas = sortedPreguntas.map((q: any, idx: number) => ({
      ...q,
      numero_original: idx + 1
    }));

    const MC_Preguntas = finalPreguntas.filter((p: any) => p.tipo === 'seleccion_multiple');
    const Dev_Preguntas = finalPreguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

    totalPtos = MC_Preguntas.length * 2 + Dev_Preguntas.length * 4;

    finalFilasSpec = finalPreguntas.map((q: any, idx: number): any => {
      const row = (cj.tabla_especificaciones?.filas || []).find((f: any) => String(f.n_pregunta || f.n_preguntas || f.num) === String(q.numero || q.n_pregunta));
      return {
        habilidad: q.nivel_cognitivo || q.habilidad || row?.habilidad || 'General',
        indicador: q.indicador || row?.indicador || 'Comprender e integrar información.',
        contenido: q.contenido || row?.contenido || 'Comprensión lectora',
        tipo_item: q.tipo === 'seleccion_multiple' ? 'Selección múltiple' : 'Desarrollo',
        n_pregunta: String(idx + 1),
        clave: q.tipo === 'seleccion_multiple' ? (q.clave || q.respuesta_correcta || row?.clave || 'A') : 'Rúbrica',
        ptos: q.tipo === 'seleccion_multiple' ? 2 : 4,
        ponderacion_pct: Math.round((1 / finalPreguntas.length) * 100)
      };
    });
  }

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-slate-700 flex font-sans antialiased selection:bg-violet-100 selection:text-violet-950 overflow-x-hidden">
      {showUpgradeModal && <UpgradeModal />}
      
      {/* Shared Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-[#E2E8F0]/70 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(true)}>
              <span className="text-xl font-bold">☰</span>
            </button>
            <span className="text-base font-bold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              REI DOCENTE
            </span>
          </div>
        </header>

        {/* PNL BANNER */}
        <div className="px-6 md:px-8 pt-8">
          <div className="bg-gradient-to-r from-violet-50 via-purple-50/60 to-pink-50/30 border border-violet-100/50 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-xs">
            <div className="space-y-1 z-10 max-w-3xl">
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-600">MENSAJE DEL DÍA</span>
              <p className="text-slate-800 text-xs md:text-sm font-semibold italic">
                "Respira: la complejidad del diseño nos toca a nosotros. A ti te toca definir el éxito de tus estudiantes. Hagámoslo simple."
              </p>
            </div>
            <div className="hidden md:flex w-10 h-10 rounded-full bg-white items-center justify-center shrink-0 shadow-xs border border-violet-50">
              <Sparkle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 space-y-6 z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ── LEFT PANEL FORM (Lg: col-span-5) ────────────────────────── */}
            <div className="lg:col-span-5 space-y-6 bg-white border border-[#E2E8F0]/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Diseñador de Evaluaciones</h2>
                  <p className="text-slate-450 text-[10px] font-semibold mt-0.5">Define los parámetros del instrumento de evaluación.</p>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setActiveTab('generador')}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                      activeTab === 'generador' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    Generar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('biblioteca')}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                      activeTab === 'biblioteca' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    Biblioteca
                  </button>
                </div>
              </div>

              {activeTab === 'generador' ? (
                <div className="space-y-5">
                  
                  {/* 1. Origen */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      1. Origen del Contenido
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOrigen('kit')}
                        className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${
                          origen === 'kit'
                            ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350'
                        }`}
                      >
                        Kit de Clase
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrigen('tema')}
                        className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${
                          origen === 'tema'
                            ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-355'
                        }`}
                      >
                        Tema libre
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrigen('lectura')}
                        className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${
                          origen === 'lectura'
                            ? 'bg-rose-600 border-rose-500 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-355'
                        }`}
                      >
                        Lectura Dom.
                      </button>
                    </div>

                    {origen === 'kit' && (
                      <div className="space-y-1">
                        {plannings.length > 0 ? (
                          <select
                            value={selectedPlanningId}
                            onChange={(e) => setSelectedPlanningId(e.target.value)}
                            className="w-full bg-[#FAF9FC] border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                          >
                            {plannings.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.grade} - {p.unit} ({p.subject.slice(0, 15)}...)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[10px] text-rose-600 italic">No tienes ningún Kit de Clase creado. Selecciona "Tema libre".</p>
                        )}
                      </div>
                    )}

                    {origen === 'lectura' && (
                      <div className="space-y-3 bg-[#FAF9FC] border border-slate-100 rounded-xl p-3">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Selecciona el Libro</label>
                          {loadingLecturas ? (
                            <p className="text-[10px] text-slate-400 italic">Cargando lecturas...</p>
                          ) : lecturas.length === 0 ? (
                            <p className="text-[10px] text-rose-600 italic">No tienes ningún libro en REI Lecturas. Ve a agregar uno.</p>
                          ) : (
                            <select
                              value={selectedLibroId}
                              onChange={(e) => setSelectedLibroId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none cursor-pointer"
                            >
                              {lecturas.map((l) => (
                                <option key={l.libro_id} value={l.libro_id}>
                                  {l.titulo} — {l.autor}
                                </option>
                              ))}
                            </select>
                          )}
                         </div>
                         {lecturas.length > 0 && (
                           <div className="grid grid-cols-2 gap-2">
                             <div>
                               <label className="block text-[8px] font-bold text-slate-400 uppercase">Curso sugerido</label>
                               <input
                                 type="text"
                                 readOnly
                                 value={curso}
                                 className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-500"
                               />
                             </div>
                             <div>
                               <label className="block text-[8px] font-bold text-slate-400 uppercase">OAs sugeridos</label>
                               <input
                                 type="text"
                                 readOnly
                                 value={oa}
                                 className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold text-slate-500"
                               />
                             </div>
                           </div>
                         )}
                      </div>
                    )}

                    {origen === 'tema' && (
                      <div className="space-y-3 bg-[#FAF9FC] border border-slate-100 rounded-xl p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Curso</label>
                            <select
                              value={curso}
                              onChange={(e) => setCurso(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none"
                            >
                              {CHILEAN_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-400 uppercase">Unidad</label>
                            <input
                              type="text"
                              placeholder="Unidad 1"
                              value={unidad}
                              onChange={(e) => setUnidad(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">Tema didáctico</label>
                          <textarea
                            rows={2}
                            placeholder="Tema o lectura didáctica base..."
                            value={tema}
                            onChange={(e) => setTema(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">OA (Objetivo)</label>
                          <input
                            type="text"
                            placeholder="ej. OA 3"
                            value={oa}
                            onChange={(e) => setOa(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Tipo de evaluación (barra) */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      2. Tipo de Evaluación
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {TIPOS_EVALUACION.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTipoEvaluacion(t.id)}
                          className={`py-2 px-1 text-[10px] font-extrabold rounded-xl border text-center transition-all ${
                            tipoEvaluacion === t.id
                              ? 'bg-rose-50/80 border-rose-350 text-rose-800'
                              : 'bg-[#FAF9FC]/30 border-slate-100 hover:border-slate-350 text-slate-500'
                          }`}
                          title={t.desc}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selectores de texto */}
                  <div className="space-y-1.5 bg-[#FAF9FC] border border-slate-100 rounded-xl p-3">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase mb-1">
                      Tipos de Texto de Lectura (SIMCE / Evaluación)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Texto 1</label>
                        <select
                          id="texto-1-select"
                          value={texto1Tipo}
                          onChange={(e) => setTexto1Tipo(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none"
                        >
                          {['Argumentativo', 'Expositivo', 'Narrativo', 'Lírico', 'Dramático', 'Informativo', 'Científico'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Texto 2</label>
                        <select
                          id="texto-2-select"
                          value={texto2Tipo}
                          onChange={(e) => setTexto2Tipo(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-semibold focus:outline-none"
                        >
                          {['Argumentativo', 'Expositivo', 'Narrativo', 'Lírico', 'Dramático', 'Informativo', 'Científico'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. Tipo de rúbrica (barra) */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      3. Tipo de Rúbrica / Instrumento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {INSTRUMENTOS.map((inst) => (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => setInstrumento(inst.id)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            instrumento === inst.id
                              ? 'bg-rose-50/80 border-rose-350 text-rose-800 font-bold'
                              : 'bg-[#FAF9FC]/30 border-slate-100 hover:border-slate-350 text-slate-500'
                          }`}
                        >
                          <span className="text-[10px] block leading-tight">{inst.label}</span>
                          <span className="text-[7.5px] text-slate-400 font-normal block leading-tight mt-0.5">{inst.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. ¿Qué deseas incluir? */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      4. Inclusiones curriculares adicionales
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={incluirDua}
                          onChange={(e) => setIncluirDua(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 border-slate-300 accent-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Incluir DUA (Diseño Universal)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={incluirTabla}
                          onChange={(e) => setIncluirTabla(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 border-slate-300 accent-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Tabla de Especificaciones</span>
                      </label>
                    </div>
                  </div>

                  {/* Datos del establecimiento y docente */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Nombre del establecimiento</label>
                      <input
                        type="text"
                        value={establecimiento}
                        onChange={(e) => setEstablecimiento(e.target.value)}
                        placeholder="Ej: Colegio San Martín"
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold focus:outline-none focus:border-rose-450 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Nombre del docente</label>
                      <input
                        type="text"
                        value={docente}
                        onChange={(e) => setDocente(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold focus:outline-none focus:border-rose-450 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Collapsible Advanced Settings */}
                  <div className="border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[9px] font-black text-rose-700 hover:text-rose-900 transition-all uppercase tracking-wider flex items-center gap-1"
                    >
                      {showAdvanced ? '▲ Ocultar Ajustes Avanzados' : '▼ Mostrar Ajustes Avanzados'}
                    </button>
                    
                    {showAdvanced && (
                      <div className="space-y-4 pt-3 mt-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-bold uppercase text-slate-450 mb-1">Dificultad</label>
                            <select
                              value={dificultad}
                              onChange={(e) => setDificultad(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold"
                            >
                              <option value="basico">N1 — Básico</option>
                              <option value="intermedio">N2 — Intermedio</option>
                              <option value="avanzado">N3 — Avanzado</option>
                              <option value="mixto">Mixto</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold uppercase text-slate-450 mb-1">Formato Preguntas</label>
                            <select
                              value={tipoPreguntas}
                              onChange={(e) => setTipoPreguntas(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold"
                            >
                              <option value="seleccion_multiple">Solo Alternativas</option>
                              <option value="desarrollo">Solo Desarrollo</option>
                              <option value="mixta">Mixta</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[8px] font-bold uppercase text-slate-455">Alternativas: {nPreguntasMultiple}</label>
                            <input
                              type="range" min={2} max={25} value={nPreguntasMultiple}
                              onChange={(e) => setNPreguntasMultiple(Number(e.target.value))}
                              className="w-full accent-rose-500"
                              disabled={tipoPreguntas === 'desarrollo'}
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold uppercase text-slate-455">Desarrollo: {nPreguntasDesarrollo}</label>
                            <input
                              type="range" min={1} max={5} value={nPreguntasDesarrollo}
                              onChange={(e) => setNPreguntasDesarrollo(Number(e.target.value))}
                              className="w-full accent-rose-500"
                              disabled={tipoPreguntas === 'seleccion_multiple'}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                // Library View
                <div className="space-y-4 flex-1 flex flex-col min-h-[380px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar evaluaciones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#FAF9FC] border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {historyLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 italic">
                      No hay evaluaciones guardadas.
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
                      {filteredHistory.map((ev) => {
                        const isSelected = result && result.id === ev.id;
                        return (
                          <div
                            key={ev.id}
                            onClick={() => {
                              setResult(ev);
                              setSavedId(ev.id);
                            }}
                            className={`group flex items-start justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-rose-50/50 border-rose-350 shadow-2xs'
                                : 'bg-white border-slate-100 hover:border-slate-350'
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="inline-block px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 text-[8px] font-extrabold uppercase rounded">
                                {ev.simce_ensayo ? 'SIMCE' : 'Evaluación'}
                              </span>
                              <h4 className="text-xs font-bold text-slate-700 truncate">{ev.titulo || 'Evaluación de Aula'}</h4>
                              <p className="text-[9px] text-slate-400 flex items-center gap-1.5">
                                <span>{ev.nivel}</span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(ev.created_at).toLocaleDateString('es-CL')}</span>
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDelete(ev.id, e)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {activeTab === 'generador' && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    id="btn-generar-evaluacion"
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generar Evaluación Completa
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* ── RIGHT PANEL (PREVIEW CANVAS) (Lg: col-span-7) ────────────────── */}
            <div className="lg:col-span-7 space-y-4">
              
              <div className="bg-white border border-[#E2E8F0]/60 rounded-3xl overflow-hidden min-h-[520px] flex flex-col shadow-xs">
                
                {/* LOADING */}
                {generating && (
                  <div className="flex-grow flex flex-col items-center justify-center gap-6 p-10">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-2 border-rose-100 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-rose-50/50 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-slate-700 font-bold text-sm">
                        {LOADING_STEPS[loadingStep]}
                      </p>
                      <p className="text-slate-400 text-xs animate-pulse">
                        Generando evaluación... esto puede tardar 30-60 segundos.
                      </p>
                      <div className="flex gap-1.5 justify-center">
                        {LOADING_STEPS.map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i <= loadingStep ? 'bg-rose-500 w-3' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* IDLE */}
                {!generating && !result && !genError && (
                  <div className="flex-grow flex flex-col items-center justify-center gap-4 p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100/50 flex items-center justify-center">
                      <ClipboardCheck className="w-7 h-7 text-rose-500/70" />
                    </div>
                    <div>
                      <p className="text-slate-650 font-bold text-sm">Documento de Evaluación Unificada</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                        Define los parámetros en el panel izquierdo y presiona Generar.
                      </p>
                    </div>
                  </div>
                )}

                {/* ERROR STATE */}
                {!generating && !result && genError && (
                  <div className="flex-grow flex flex-col items-center justify-center gap-4 p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                      <AlertTriangle className="w-7 h-7 text-rose-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-rose-600 font-bold text-sm">Error de Generación</p>
                      <p className="text-slate-650 text-xs mt-1 max-w-md mx-auto whitespace-pre-line bg-rose-50/50 border border-rose-100 p-3 rounded-xl font-mono text-left">
                        {genError}
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Por favor, revisa la consola o vuelve a intentar la generación.
                      </p>
                    </div>
                  </div>
                )}

                {/* PREVIEW CONTAINER */}
                {!generating && result && (
                  <div className="flex flex-col flex-1">
                    
                    {/* Preview Toolbar */}
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Evaluación generada con éxito
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={triggerPdfDownload}
                          className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-bold"
                          title="Descargar PDF de la Evaluación Completa"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar PDF
                        </button>
                        <button
                          onClick={triggerWordDownload}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-bold"
                          title="Descargar Word de la Evaluación Completa"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Descargar Word
                        </button>
                      </div>
                    </div>

                    {/* Printable Page Canvas */}
                    <div className="flex-grow p-6 bg-[#FAF9FC] overflow-y-auto max-h-[520px]">
                      <div className="bg-white border border-[#E2E8F0]/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-6 max-w-2xl mx-auto font-serif text-slate-800">
                        
                        {/* Header */}
                        {(() => {
                          const cj = result.contenido_json || result;
                          const preguntas = getPreguntasList(cj);
                          const MC_Preguntas = preguntas.filter((p: any) => p.tipo === 'seleccion_multiple');
                          const Dev_Preguntas = preguntas.filter((p: any) => p.tipo === 'consigna_abierta' || p.tipo === 'desarrollo');

                          let mcPoints = MC_Preguntas.length * 2;
                          let devPoints = Dev_Preguntas.length * 4;

                          const filasSpec = cj.tabla_especificaciones?.filas || [];
                          if (filasSpec.length) {
                            let sumMc = 0;
                            let sumDev = 0;
                            filasSpec.forEach((f: any) => {
                              const ptosVal = Number(f.ptos) || 0;
                              const isMc = f.tipo_item === 'Selección múltiple' || String(f.tipo_item).toLowerCase().includes('alternativa');
                              if (isMc) sumMc += ptosVal;
                              else sumDev += ptosVal;
                            });
                            if (sumMc > 0) mcPoints = sumMc;
                            if (sumDev > 0) devPoints = sumDev;
                          }
                          const totalPtos = mcPoints + devPoints;

                          return (
                            <>
                              <div className="text-center py-2">
                                <h2 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase font-sans">
                                  {result.titulo || cj.titulo || 'Evaluación de Aprendizaje'}
                                </h2>
                              </div>

                              <table className="w-full border-collapse border border-slate-200 text-[10px] font-sans text-slate-700 mb-4">
                                <tbody>
                                  <tr className="border-b border-slate-200">
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Instrumento:</td>
                                    <td className="border-r border-slate-200 p-1.5 font-semibold">PRUEBA ESCRITA</td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Asignatura:</td>
                                    <td className="border-r border-slate-200 p-1.5">Lenguaje y Comunicación</td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Curso:</td>
                                    <td className="border-r border-slate-200 p-1.5">{result.nivel || curso || '_________'}</td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Letra:</td>
                                    <td className="p-1.5">{cj.letra || 'A'}</td>
                                  </tr>
                                  <tr className="border-b border-slate-200">
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Docente:</td>
                                    <td className="border-r border-slate-200 p-1.5 truncate max-w-[120px]" title={cj.docente || docente || '___________________________'}>
                                      {cj.docente || docente || '___________________________'}
                                    </td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Pje. Ideal:</td>
                                    <td className="border-r border-slate-200 p-1.5">{totalPtos} pts</td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Pje. Corte (60%):</td>
                                    <td className="border-r border-slate-200 p-1.5">{Math.round(totalPtos * 0.6)} pts</td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Tiempo / Coef.:</td>
                                    <td className="p-1.5">{cj.duracion_min ?? 90} min / Coef. 1</td>
                                  </tr>
                                  <tr>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Nombre Estudiante:</td>
                                    <td className="border-r border-slate-200 p-1.5 text-slate-300 font-normal italic" colSpan={3}>Nombre Completo</td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Fecha:</td>
                                    <td className="border-r border-slate-200 p-1.5 text-slate-300 font-normal italic">__ / __ / ____</td>
                                    <td className="border-r border-slate-200 p-1.5 font-bold bg-slate-50/50">Pje. Obt. / Nota:</td>
                                    <td className="p-1.5 text-slate-300 font-normal italic">______ / ______</td>
                                  </tr>
                                </tbody>
                              </table>
                            </>
                          );
                        })()}

                        {/* Tabla Especificaciones */}
                        {incluirTabla && result.contenido_json?.tabla_especificaciones && (
                          <div className="space-y-2 pt-4 border-t border-slate-100 font-sans">
                            <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider">
                              I. Tabla de Especificaciones
                            </h4>
                            {result.contenido_json.tabla_especificaciones.oa_evaluado && (
                              <p className="text-[10px] font-semibold text-slate-655 mb-2">
                                OAs Evaluados: {(() => {
                                  const matches = result.contenido_json.tabla_especificaciones.oa_evaluado.match(/OA\s*\d+/gi);
                                  return matches ? Array.from(new Set(matches.map((m: string) => m.toUpperCase()))).join(', ') : result.contenido_json.tabla_especificaciones.oa_evaluado;
                                })()}
                              </p>
                            )}
                            <div className="overflow-x-auto">
                              <table className="w-full text-[9px] border-collapse text-left text-slate-650">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-2 font-bold">Habilidad</th>
                                    <th className="p-2 font-bold">Indicador de Evaluación</th>
                                    <th className="p-2 font-bold">Contenido</th>
                                    <th className="p-2 font-bold">Tipo</th>
                                    <th className="p-2 font-bold text-center">N°</th>
                                    <th className="p-2 font-bold text-center">Clave</th>
                                    <th className="p-2 font-bold text-center">Ptos</th>
                                    <th className="p-2 font-bold text-center">Peso</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {finalFilasSpec.map((row: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                                      <td className="p-2 font-semibold">{row.habilidad}</td>
                                      <td className="p-2">{row.indicador}</td>
                                      <td className="p-2">{row.contenido}</td>
                                      <td className="p-2">{row.tipo_item}</td>
                                      <td className="p-2 text-center">{row.n_pregunta}</td>
                                      <td className="p-2 text-center font-bold text-rose-600">{row.clave}</td>
                                      <td className="p-2 text-center">{row.ptos}</td>
                                      <td className="p-2 text-center">{row.ponderacion_pct}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Textos y Preguntas Intercalados */}
                        {(() => {
                          const texts = result.contenido_json?.textos_lectura || [];
                          const t1Q = finalPreguntas.filter((q: any, idx: number) => getTextoAsociado(q, idx, finalPreguntas.length) === 'texto_1');
                          const t2Q = finalPreguntas.filter((q: any, idx: number) => getTextoAsociado(q, idx, finalPreguntas.length) === 'texto_2');
                          const ambosQ = finalPreguntas.filter((q: any, idx: number) => getTextoAsociado(q, idx, finalPreguntas.length) === 'ambos');

                          const renderQuestion = (q: any) => {
                            const cleanAlts = getCleanAlternatives(q.alternativas, q.numero || q.numero_original, q);
                            const esAbierta = q.tipo === 'consigna_abierta' || q.tipo === 'desarrollo' || q.tipo === 'Desarrollo' || cleanAlts.length === 0;
                            return (
                              <div key={q.numero_original} className="space-y-2">
                                <p className="text-xs font-bold leading-normal">
                                  {q.numero_original}. {q.enunciado} <span className="font-sans text-[8px] font-normal text-slate-400">({q.oa})</span>
                                </p>
                                {esAbierta ? (
                                  <div className="space-y-2.5 pl-4">
                                    <div className="space-y-2 mt-2">
                                      <div className="border-b border-dashed border-slate-200 w-full h-4"></div>
                                      <div className="border-b border-dashed border-slate-200 w-full h-4"></div>
                                      <div className="border-b border-dashed border-slate-200 w-full h-4"></div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2 pl-4 text-[11px]">
                                    {cleanAlts.map((alt: any) => (
                                      <div key={alt.letra} className="flex gap-1.5">
                                        <span className="font-bold">{alt.letra})</span>
                                        <span>{alt.texto}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          };

                          const renderTextSection = (txt: any, index: number) => {
                            const cleanTxtTitle = (txt.titulo || '').replace(/^Texto\s*\d+\s*:\s*/i, '').trim() || 'Sin Título';
                            return (
                              <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                  <span className="text-xs font-bold text-slate-800">Texto {index + 1}: {cleanTxtTitle}</span>
                                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                                    {txt.tipo}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-650 leading-relaxed whitespace-pre-wrap font-serif">
                                  {txt.contenido}
                                </p>
                              </div>
                            );
                          };

                          if (texts.length >= 2) {
                            return (
                              <div className="space-y-6 pt-4 border-t border-slate-100 font-sans">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider mb-3">
                                    II. Textos de Lectura y Preguntas Académicas
                                  </h4>
                                  
                                  {/* Grupo 1 */}
                                  <div className="space-y-4">
                                    {renderTextSection(texts[0], 0)}
                                    <div className="space-y-4 pl-2">
                                      {t1Q.map(q => renderQuestion(q))}
                                    </div>
                                  </div>

                                  {/* Grupo 2 */}
                                  <div className="space-y-4 mt-6">
                                    {renderTextSection(texts[1], 1)}
                                    <div className="space-y-4 pl-2">
                                      {t2Q.map(q => renderQuestion(q))}
                                    </div>
                                  </div>

                                  {/* Grupo Ambos */}
                                  {ambosQ.length > 0 && (
                                    <div className="space-y-4 mt-6 pt-4 border-t border-slate-100">
                                      <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                        Preguntas de Integración de Ambos Textos
                                      </h5>
                                      <div className="space-y-4 pl-2">
                                        {ambosQ.map(q => renderQuestion(q))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          } else {
                            // Fallback
                            return (
                              <>
                                {texts.length > 0 && (
                                  <div className="space-y-4 pt-4 border-t border-slate-100 font-sans">
                                    <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider">
                                      II. Textos de Lectura
                                    </h4>
                                    <div className="space-y-3">
                                      {texts.map((txt: any, idx: number) => renderTextSection(txt, idx))}
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-4 pt-4 border-t border-slate-100 font-sans">
                                  <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider">
                                    III. Preguntas de Comprensión ({finalPreguntas.length})
                                  </h4>
                                  <div className="space-y-4">
                                    {finalPreguntas.map(q => renderQuestion(q))}
                                  </div>
                                </div>
                              </>
                            );
                          }
                        })()}

                        {/* Instrumento (Rubrica / Pauta / Lista) */}
                        {result.contenido_json?.rubrica && (
                          <div className="space-y-3 pt-4 border-t border-slate-100 font-sans">
                            <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider">
                              IV. Instrumento de Evaluación: {result.contenido_json.rubrica.titulo || 'Criterios'}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[9px] border-collapse text-slate-650">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200">
                                    {getInstrumentHeaders(result.contenido_json.rubrica.tipo_instrumento).map((hdr, idx) => (
                                      <th key={idx} className="p-2 font-bold border-r border-slate-200 last:border-r-0">
                                        {hdr}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.contenido_json.rubrica.criterios.map((crit: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-150 last:border-b-0 hover:bg-slate-50/50">
                                      <td className="p-2 font-bold border-r border-slate-200 leading-tight">
                                        {crit.nombre}
                                        {crit.ponderacion_pct && (
                                          <span className="block text-[8px] text-slate-400 font-normal">({crit.ponderacion_pct}%)</span>
                                        )}
                                      </td>
                                      {renderCriterioColumns(crit, result.contenido_json.rubrica.tipo_instrumento)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}



                      </div>
                    </div>

                  </div>
                )}

              </div>
              
            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
