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
  AlertTriangle,
  Lock,
  Zap,
  X
} from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import Sidebar from '@/components/Sidebar';
import { drawGuidePdf, formatChallengeAnswer } from '@/lib/templates/drawGuidePdf';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface GuiaRecord {
  id: string;
  titulo: string | null;
  nivel: string;
  eje: string | null;
  oa_codes: string[];
  formato: 'tradicional' | 'narrativa';
  tema_narrativo: string | null;
  rti_nivel: 'universal' | 'dua' | 'pie';
  contenido_json: any;
  created_at: string;
}

interface Planning {
  id: string;
  unit: string;
  subject: string;
  grade: string;
  learning_objective: string;
  content?: any;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHILEAN_COURSES = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico',
  '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio'
];

const DESAFIOS_LUDICOS = [
  { id: 'palabra_intrusa', label: 'Palabra intrusa', emoji: '🚫' },
  { id: 'encuentra_diferencias', label: 'Encuentra las diferencias', emoji: '🔍' },
  { id: 'clasificacion_burbujas', label: 'Clasificación de burbujas', emoji: '🫧' },
  { id: 'unir_parejas', label: 'Unir parejas', emoji: '🔗' },
  { id: 'camino_pistas', label: 'Camino de pistas', emoji: '👣' },
  { id: 'pupiletra_crucigramas', label: 'Pupiletra / Crucigramas', emoji: '🧩' },
  { id: 'anagramas', label: 'Anagramas', emoji: '🔤' },
  { id: 'completar_oraciones', label: 'Completar oraciones', emoji: '📝' },
  { id: 'ordenar_parrafos', label: 'Ordenar párrafos', emoji: '📌' },
  { id: 'verdadero_falso', label: 'Verdadero o falso', emoji: '✅' },
  { id: 'mensajes_cifrados', label: 'Mensajes cifrados', emoji: '🔐' },
  { id: 'preguntas_inferenciales', label: 'Preguntas de nivel inferencial y crítico', emoji: '🧠' }
];

const ORGANIZADORES = [
  { id: 'ninguno', label: 'Sin organizador gráfico', desc: 'No incluir diagramas' },
  { id: 'mapa_conceptual', label: '🧠 Mapa conceptual', desc: 'Esquema jerárquico de conceptos' },
  { id: 'mapa_mental', label: '📝 Mapa mental', desc: 'Ideas radiales y asociaciones libres' },
  { id: 'linea_tiempo', label: '📈 Línea de tiempo', desc: 'Sucesos en orden cronológico' },
  { id: 'cuadro_comparativo', label: '📋 Cuadro comparativo', desc: 'Tabla de contrastación' }
];

const LOADING_STEPS = [
  'Analizando los requerimientos pedagógicos...',
  'Diseñando actividades según taxonomía de Bloom...',
  'Estructurando organizadores visuales...',
  'Completando pautas de autoevaluación...',
];

export default function GuiasPage() {
  const router = useRouter();

  // Auth & Profile
  const [authLoading, setAuthLoading] = useState(true);
  const [initials, setInitials] = useState('U');
  const [docenteNombre, setDocenteNombre] = useState('');
  const [establecimientoGuia, setEstablecimientoGuia] = useState('');
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
  
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState<string[]>(['unir_parejas', 'completar_oraciones']);
  const [tipoGuia, setTipoGuia] = useState('tradicional');
  const [organizador, setOrganizador] = useState('ninguno');
  const rtiNivel = 'universal';
  const [templateId, setTemplateId] = useState('comprension_lectora');
  const incluirImagenes = false;
  const [actividadAdicional, setActividadAdicional] = useState('ninguna');

  // Fallback states for theme manual
  const [curso, setCurso] = useState('5° Básico');
  const [unidad, setUnidad] = useState('');
  const [oa, setOa] = useState('');
  const [tema, setTema] = useState('');

  // State of generated guide / loaded guide
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // History / Database Guides List
  const [history, setHistory] = useState<GuiaRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'trial_expired' | 'limit_reached'>('limit_reached');
  const [upgradePlanStatus, setUpgradePlanStatus] = useState<'trial' | 'active'>('trial');
  const [upgradeRenewalDate, setUpgradeRenewalDate] = useState<string | null>(null);
  const [upgradeLimit, setUpgradeLimit] = useState<number>(12);

  // ── DUA Real (3 principios) ────────────────────────────────────────────────
  const [showDuaRealModal, setShowDuaRealModal] = useState(false);
  const [duaRealPages, setDuaRealPages]         = useState<(string | null)[]>([]);
  const [duaRealLabels, setDuaRealLabels]       = useState<string[]>([]);
  const [duaRealViewIdx, setDuaRealViewIdx]     = useState(0);
  const [duaRealPageCopied, setDuaRealPageCopied] = useState(false);
  const [duaRealAllCopied, setDuaRealAllCopied] = useState(false);

  // ── DUA cola automática ───────────────────────────────────────────────────
  const [showDuaModal, setShowDuaModal]       = useState(false);
  const [duaPages, setDuaPages]               = useState<(string | null)[]>([]);
  const [duaLabels, setDuaLabels]             = useState<string[]>([]);
  const [duaGenerating, setDuaGenerating]     = useState(false);
  const [duaStep, setDuaStep]                 = useState(-1);
  const [duaViewIdx, setDuaViewIdx]           = useState(0);
  const [duaPageCopied, setDuaPageCopied]     = useState(false);
  const [duaAllCopied, setDuaAllCopied]       = useState(false);

  let resultCj = result?.contenido_json || {};
  if (typeof resultCj === 'string') {
    try {
      resultCj = JSON.parse(resultCj);
    } catch (e) {
      resultCj = {};
    }
  }
  const isNewFlatFormat = !!(resultCj.desafios || resultCj.texto_lectura || resultCj.banco_palabras);
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Bypass] Guias auth bypass activated');
        setInitials('G');
        setDocenteNombre('Docente Invitado');
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
      // Solo usar el nombre del perfil si es un nombre real (no placeholder genérico)
      const genericNames = ['docente', 'docente invitado', 'teacher', 'profesor', 'user'];
      const isGeneric = !fullName || genericNames.includes(fullName.toLowerCase().trim());
      setDocenteNombre(isGeneric ? '' : fullName);

      // Fetch actual plannings from Supabase
      try {
        const { data: planningsData } = await supabase
          .from('plannings')
          .select('id, unit, subject, grade, learning_objective, content')
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
      // Siempre leer las guías guardadas localmente (creadas en esta sesión o anteriores)
      const localRaw = typeof window !== 'undefined' ? localStorage.getItem('mock_guias') : null;
      const localGuias: any[] = localRaw ? JSON.parse(localRaw) : [];
      
      // Fetch normal desde Supabase (en mock mode devuelve solo El Túnel, en prod devuelve las reales)
      const { data, error } = await supabase
        .from('guias')
        .select('id, titulo, nivel, eje, formato, created_at, oa_codes, tema_narrativo, contenido_json')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[fetchHistory] Supabase error:', error);
      }
      
      // Fusionar: las locales primero (más recientes), luego las de Supabase
      const supabaseGuias = data || [];
      // Evitar duplicados por id
      const idsLocales = new Set(localGuias.map((g: any) => g.id));
      const supabaseUnicas = supabaseGuias.filter((g: any) => !idsLocales.has(g.id));
      
      setHistory([...localGuias, ...supabaseUnicas]);
    } catch (e) {
      console.error('[fetchHistory] Error loading history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar esta guía?')) return;
    try {
      const { error } = await supabase.from('guias').delete().eq('id', id);
      if (error) throw error;
      setHistory(history.filter(g => g.id !== id));
      if (result && result.id === id) {
        setResult(null);
      }
    } catch (err) {
      console.error('Error deleting guide:', err);
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
        setTema(`Guía basada en el Kit de clase: ${selectedKit.unit} (${selectedKit.grade}) - ${selectedKit.subject}`);
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
        setTema(`Guía basada en la Lectura Domiciliaria: ${selectedLibro.titulo} de ${selectedLibro.autor}`);
      }
    }
  }, [selectedPlanningId, selectedLibroId, origen, plannings, lecturas]);

  // Toggle activity checkbox with max 4 items limit
  const toggleActivity = (id: string) => {
    if (actividadesSeleccionadas.includes(id)) {
      setActividadesSeleccionadas(actividadesSeleccionadas.filter(a => a !== id));
    } else {
      if (actividadesSeleccionadas.length >= 4) {
        alert('Puedes seleccionar un máximo de 4 desafíos lúdicos para mantener la guía didáctica y balanceada.');
        return;
      }
      setActividadesSeleccionadas([...actividadesSeleccionadas, id]);
    }
  };

  // ── Generate Guide Handler ────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const selectedPlanning = plannings.find(p => p.id === selectedPlanningId);
    const themeText = origen === 'kit'
      ? selectedPlanning
        ? `Kit de Clase: ${selectedPlanning.unit}${selectedPlanning.grade ? ` - ${selectedPlanning.grade}` : ''}`
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

      // Pack custom parameters for Claude injection
      let texto_kit = null;
      if (origen === 'kit' && selectedPlanning) {
        const c = selectedPlanning.content as any;
        if (c && c.texto_sesion) {
          texto_kit = {
            titulo: c.texto_sesion.titulo || c.texto_sesion.title || 'Texto de Lectura',
            autor: c.texto_sesion.autor || c.texto_sesion.author || 'Anónimo',
            cuerpo: c.texto_sesion.cuerpo || c.texto_sesion.contenido || c.texto_sesion.content || ''
          };
        }
      }

      const match = String(oa || '').match(/OA\s*\d+/gi);
      const cleanOaCode = match ? match.join(', ') : 'OA_GUIA';

      const body = {
        nivel: curso,
        eje: 'Lectura',
        oa_code: cleanOaCode,
        oa_texto: oa || 'OA de Lenguaje',
        formato: templateId === 'guia_gamificada' ? 'narrativa' : 'tradicional',
        rti_nivel: 'universal',
        templateId: templateId,
        actividad_adicional: actividadAdicional !== 'ninguna' ? actividadAdicional : null,
        actividadesSeleccionadas,
        texto_kit,
        fuente: origen === 'lectura' ? 'lectura_domiciliaria' : undefined,
        libro_id: origen === 'lectura' ? selectedLibroId : undefined
      };

      const res = await fetch('/api/guias', {
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
      
      // GUARDAR en localStorage desde el cliente
      const guiaParaGuardar: GuiaRecord = {
        id: record.id || `mock-${Date.now()}`,
        titulo: record.titulo || `Guía de Aprendizaje: ${themeText.trim()}`,
        formato: (record.formato || (tipoGuia === 'gamificada' ? 'narrativa' : 'tradicional')) as "tradicional" | "narrativa",
        created_at: record.created_at || new Date().toISOString(),
        contenido_json: record.contenido_json || record,
        oa_codes: record.oa_codes || [],
        tema_narrativo: record.tema_narrativo || null,
        nivel: record.nivel || curso,
        eje: record.eje || 'Lectura',
        rti_nivel: record.rti_nivel || 'Universal'
      };
      try {
        const existing = JSON.parse(localStorage.getItem('mock_guias') || '[]');
        const filtered = existing.filter((x: any) => x.id !== guiaParaGuardar.id);
        filtered.unshift(guiaParaGuardar);
        localStorage.setItem('mock_guias', JSON.stringify(filtered));
        console.log('[Biblioteca] Guardado en localStorage OK:', filtered.length, 'guías');
      } catch (e) {
        console.error('[Biblioteca] Error al guardar en localStorage:', e);
      }

      setResult(record);
      setSavedId(record.id);
      setHistory(prev => {
        const exists = prev.some((x: any) => x.id === guiaParaGuardar.id);
        if (exists) return prev;
        return [guiaParaGuardar, ...prev];
      });
      fetchHistory();
    } catch (err: any) {
      clearInterval(stepInterval);
      setGenError(err.message || 'Error de conexión. Por favor intenta de nuevo.');
      
      // MOCK FALLBACK for visual demo purposes
      setTimeout(() => {
        const mockGeneratedContent = generateMockupGuideContent();
        setResult({
          id: 'mock-guide-' + Date.now(),
          titulo: `Guía de Aprendizaje: ${themeText.trim()}`,
          nivel: curso,
          rti_nivel: 'universal',
          formato: tipoGuia === 'gamificada' ? 'narrativa' : 'tradicional',
          contenido_json: mockGeneratedContent
        });
        setGenerating(false);
      }, 1000);
    } finally {
      setGenerating(false);
      setLoadingStep(0);
    }
  }, [tema, curso, oa, tipoGuia, actividadesSeleccionadas, organizador, origen, selectedPlanningId, plannings, docenteNombre]);

  // ── Mockup content generator for instant premium display ───────────────────
  const generateMockupGuideContent = () => {
    const selectedKit = plannings.find(p => p.id === selectedPlanningId);
    const asignatura = origen === 'kit' && selectedKit ? selectedKit.subject : 'Lengua y Literatura';
    const isDuaActive = false;
    const isNarrativa = tipoGuia === 'gamificada';

    const universalContent = {
      narrativa_encabezado: isNarrativa ? {
        numero: "Caso N°1",
        subtitulo: "El secreto detrás del manuscrito perdido"
      } : null,
      narrativa_contexto: isNarrativa ? "Un antiguo manuscrito ha aparecido en la biblioteca del colegio. Los investigadores deben analizar su estructura y vocabulario para determinar si es auténtico o una falsificación histórica." : null,
      activacion: {
        titulo: isNarrativa ? "Pista 1: El Enigma de Entrada" : "Activación de Conocimientos Previos",
        texto: "Antes de comenzar la lectura, es fundamental reflexionar sobre cómo nos comunicamos a través de la escritura. Los textos transmiten no solo información, sino también las intenciones y el contexto cultural del autor en su época.",
        pregunta: "¿Por qué crees que un autor elige ciertas palabras específicas en lugar de otras para contar una historia?",
        lineas_respuesta: 3
      },
      desarrollo: {
        titulo: isNarrativa ? "Pista 2: Lectura del Expediente: El Retorno" : "Lectura Principal: El Retorno de la Primavera",
        texto_principal: "El viento soplaba con fuerza sobre las colinas doradas del sur. Julia contempló el horizonte, buscando alguna señal del carruaje que traía las cartas de la capital. Sabía que su destino dependía de las palabras escritas en ese pergamino sellado. Tras meses de incertidumbre y silencio, el invierno finalmente daba paso a los primeros brotes verdes, trayendo consigo una mezcla de esperanza y temor por el veredicto definitivo.",
        imagen_url: incluirImagenes ? "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600" : null
      },
      actividades: {
        titulo: isNarrativa ? "Pista 3: Evidencias por Resolver" : "Actividades de Comprensión y Aplicación",
        instruccion: "Analiza el texto de lectura principal y responde las siguientes preguntas de forma completa.",
        preguntas: [
          {
            numero: 1,
            nivel_cognitivo: "literal",
            enunciado: "¿Qué estaba esperando Julia mientras contemplaba el horizonte?",
            puntaje: 2,
            lineas_respuesta: 3
          },
          {
            numero: 2,
            nivel_cognitivo: "inferencial",
            enunciado: "¿Qué simboliza el cambio de estación del invierno a la primavera en el estado emocional de Julia?",
            puntaje: 2,
            lineas_respuesta: 3
          },
          {
            numero: 3,
            nivel_cognitivo: "critico",
            enunciado: "A partir del comportamiento de Julia, ¿crees que es correcto depositar toda la felicidad o el destino personal en una noticia externa? Justifica tu postura.",
            puntaje: 3,
            lineas_respuesta: 4
          }
        ],
        produccion_escrita: {
          titulo: isNarrativa ? "Pista 4: El Reporte Final de Investigación" : "Actividad de Escritura",
          instruccion: "Redacta tu propio escrito siguiendo la consigna.",
          consigna: "Escribe una breve continuación del relato (de 6 a 8 líneas) donde narres qué contenía la carta que esperaba Julia y cómo reacciona al leerla, utilizando al menos dos figuras literarias aprendidas en clase.",
          puntaje: 4,
          lineas_respuesta: 6
        }
      },
      cierre: {
        titulo: isNarrativa ? "Pista 5: Veredicto y Cierre" : "Cierre de la Sesión",
        ticket_salida: {
          pregunta: "¿Cuál fue el aprendizaje más importante que obtuviste al analizar el texto de hoy?",
          lineas_respuesta: 2
        },
        metacognicion: [
          "¿Qué parte de la actividad me costó más responder y cómo lo solucioné?",
          "¿De qué manera me sirve analizar las emociones de los personajes para comprender mejor a las personas en la vida real?"
        ],
        autoevaluacion: [
          "Comprendí el conflicto inicial que experimenta el personaje Julia.",
          "Redacté el reporte final de escritura utilizando figuras literarias de apoyo.",
          "Logré justificar mi opinión personal con argumentos sólidos extraídos de la lectura."
        ],
        frase_pnl: "¡Excelente esfuerzo! Tu capacidad de comprensión es como una semilla que hoy ha echado raíces profundas."
      },
      narrativa_veredicto: isNarrativa ? "¡Enigma resuelto! Has descifrado las intenciones del personaje en el manuscrito y completado tu reporte con éxito. El caso queda archivado." : null,
      pauta_docente: {
        respuestas_preguntas: [
          {
            numero: 1,
            respuesta_correcta: "Julia estaba esperando el carruaje que traía las cartas de la capital con noticias sobre su destino.",
            criterios_evaluacion: "2 pts: Menciona el carruaje y las cartas/noticias de la capital. 1 pt: Menciona solo las cartas o el carruaje sin detallar el origen o propósito. 0 pts: Respuesta errónea."
          },
          {
            numero: 2,
            respuesta_correcta: "El cambio del invierno a la primavera simboliza la transición de un estado de tristeza, incertidumbre y silencio a uno de esperanza, brotes nuevos de vida y cambio.",
            criterios_evaluacion: "2 pts: Explica la analogía entre invierno (tristeza/esperanza congelada) y primavera (renacimiento/nuevas posibilidades). 1 pt: Menciona solo una de las emociones sin contrastar adecuadamente. 0 pts: No identifica la relación."
          },
          {
            numero: 3,
            respuesta_correcta: "Respuesta abierta donde el estudiante debe tomar postura (ej: Sí, porque las noticias de seres queridos definen nuestro rumbo; o No, porque el destino se construye por decisiones propias) y fundamentar.",
            criterios_evaluacion: "3 pts: Expresa postura clara y fundamenta con argumentos lógicos. 2 pts: Expresa postura pero el argumento es débil o repetitivo. 1 pt: Expresa postura sin argumentar."
          }
        ],
        respuesta_produccion: {
          respuesta_modelo: "El sobre de cera roja crujió en sus manos. Julia leyó las palabras con respiración contenida: 'El juicio ha terminado, eres libre de volver'. Sus lágrimas cayeron como gotas de lluvia en tierra seca, limpiando meses de dolor. Corrió como el viento hacia la casa, sintiendo que su corazón florecía como los cerezos del jardín.",
          criterios_evaluacion: "4 pts: Redacta la continuación coherentemente (6-8 líneas), responde al contenido de la carta y utiliza 2 figuras literarias identificables. 2 pts: Redacción incompleta o falta uso de recursos literarios."
        },
        respuesta_ticket: {
          respuesta_correcta: "El alumno debe resumir el foco principal de la lección (ej: comprender el simbolismo en la literatura y mejorar la redacción creativa)."
        }
      }
    };

    const duaContent = isDuaActive ? {
      narrativa_encabezado: isNarrativa ? {
        numero: "Caso N°1 (Adaptado DUA)",
        subtitulo: "El secreto del manuscrito (Apoyos diversificados)"
      } : null,
      narrativa_contexto: isNarrativa ? "Un antiguo texto ha sido descubierto en la biblioteca. Debemos investigar sus secretos. Te ayudaremos con pistas especiales y un glosario de palabras difíciles para resolver este desafío." : null,
      vocabulario_apoyo: [
        { palabra: "Horizonte", definicion: "Línea lejana donde la tierra y el cielo parecen unirse.", ejemplo: "El sol desapareció en el horizonte." },
        { palabra: "Incertidumbre", definicion: "Falta de seguridad o duda sobre lo que va a ocurrir.", ejemplo: "Tenía incertidumbre por el resultado del examen." },
        { palabra: "Veredicto", definicion: "Decisión o respuesta final sobre un asunto importante.", ejemplo: "El juez entregó el veredicto del caso." }
      ],
      activacion: {
        titulo: isNarrativa ? "Pista 1: El Enigma de Entrada (Adaptado)" : "Activación de Conocimientos Previos (Apoyo Visual)",
        texto_simplificado: "Antes de leer, pensemos en la escritura. Los textos nos ayudan a compartir ideas y sentimientos con otros. El autor escoge palabras especiales para transmitir lo que siente.",
        pregunta_andamiada: "¿Cómo nos ayudan las palabras a expresar lo que sentimos? Piensa en una palabra alegre y una triste.",
        pista_ayuda: "Pista: Piensa en palabras como 'sol' o 'tormenta' y las emociones que te producen.",
        lineas_respuesta: 2
      },
      desarrollo: {
        titulo: isNarrativa ? "Pista 2: Lectura del Expediente: El Retorno (Adaptado)" : "Lectura con Apoyo: El Retorno de la Primavera",
        texto_principal: "El viento soplaba fuerte sobre las colinas doradas. Julia miraba a lo lejos (horizonte). Ella esperaba un carruaje con cartas de la capital. Su futuro dependía de lo que dijen esas cartas. Después de mucho tiempo de duda y silencio (incertidumbre), el invierno terminaba. Comenzaban a salir las primeras plantas verdes. Esto le traía esperanza, pero también miedo por la decisión final (veredicto).",
        apoyo_visual_desc: "Sugerencia DUA: Completa el mapa de causa-efecto dibujado abajo. En la izquierda escribe la causa (espera de cartas de la capital) y en la derecha el efecto emocional en Julia (miedo y esperanza)."
      },
      actividades: {
        titulo: isNarrativa ? "Pista 3: Evidencias por Resolver (Adaptadas)" : "Actividades de Comprensión Diversificadas",
        instruccion_simplificada: "Responde las preguntas de comprensión utilizando las pistas y las opciones de respuesta.",
        preguntas: [
          {
            numero: 1,
            nivel_cognitivo: "literal",
            enunciado: "¿Qué esperaba ver Julia en el horizonte?",
            opciones_alternativas: [
              "A) Un carruaje con cartas de la capital.",
              "B) Un jinete con provisiones de comida.",
              "C) Una tormenta de viento sobre las colinas."
            ],
            pista_ayuda: "Pista: Lee la segunda y tercera oración del texto adaptado.",
            puntaje: 2,
            lineas_respuesta: 1
          },
          {
            numero: 2,
            nivel_cognitivo: "inferencial",
            enunciado: "¿Qué emoción siente Julia con la llegada de la primavera?",
            opciones_alternativas: null,
            pista_ayuda: "Pista: Lee la parte final del texto donde se habla de las plantas verdes.",
            inicio_respuesta: "Con la llegada de la primavera, Julia siente una mezcla de...",
            puntaje: 2,
            lineas_respuesta: 2
          },
          {
            numero: 3,
            nivel_cognitivo: "critico",
            enunciado: "¿Cómo te sentirías tú si tu futuro dependiera de una carta externa?",
            opciones_alternativas: [
              "A) Muy nervioso y preocupado, porque me gusta tener el control de las cosas.",
              "B) Tranquilo y paciente, esperando que las cosas se resuelvan por sí solas.",
              "C) Otra respuesta personal."
            ],
            pista_ayuda: "Pista: Elige la opción que mejor represente tu forma de ser y explica brevemente por qué.",
            puntaje: 3,
            lineas_respuesta: 3
          }
        ],
        produccion_escrita: {
          titulo: isNarrativa ? "Pista 4: El Reporte Final (Formas de Expresión)" : "Actividad de Expresión y Escritura Adaptada",
          instruccion_simplificada: "Elige tu forma favorita de continuar la historia de Julia.",
          consigna_adaptada: "Escribe 3 o 4 líneas sobre lo que decía la carta de Julia y qué hizo ella al leerla. Usa palabras simples y claras.",
          opciones_expresion: "Opciones DUA: 1) Escribe un texto breve de 3 líneas. 2) Dibuja en el recuadro el contenido de la carta. 3) Graba un audio corto explicando el final del relato para tu profesor.",
          puntaje: 4,
          lineas_respuesta: 4
        }
      },
      cierre: {
        titulo: isNarrativa ? "Pista 5: Veredicto y Cierre Adaptado" : "Cierre de la Sesión (Ticket de Salida Adaptado)",
        ticket_salida: {
          pregunta_andamiada: "¿Qué te ayudó más a comprender la lectura de hoy?",
          pista_ayuda: "Pista: Puedes elegir entre el vocabulario, las pistas o el texto simplificado.",
          lineas_respuesta: 2
        },
        metacognicion: [
          "¿Me sirvió tener el significado de las palabras difíciles en la guía?",
          "¿Cómo me sentí al poder elegir la forma de expresar mi trabajo escrito?"
        ],
        autoevaluacion: [
          "Utilicé las palabras del glosario para entender mejor el texto.",
          "Respondí la pregunta 1 seleccionando la opción correcta apoyada en la lectura.",
          "Completé el cierre reflexionando sobre lo que me ayudó a aprender."
        ]
      },
      narrativa_veredicto: isNarrativa ? "¡Excelente trabajo investigador! Has resuelto los enigmas de la lectura con la ayuda de tus herramientas DUA. El manuscrito ha sido descifrado." : null,
      pauta_docente: {
        respuestas_preguntas: [
          {
            numero: 1,
            respuesta_correcta: "Alternativa A: Un carruaje con cartas de la capital.",
            criterios_evaluacion: "2 pts: Marca la opción correcta A. 0 pts: Marca otra opción."
          },
          {
            numero: 2,
            respuesta_correcta: "Julia siente una mezcla de esperanza y de temor por el veredicto definitivo.",
            criterios_evaluacion: "2 pts: Completa la oración indicando esperanza y temor/miedo. 1 pt: Indica solo una de las dos emociones. 0 pts: Indica emociones incorrectas."
          },
          {
            numero: 3,
            respuesta_correcta: "Respuesta libre justificada según la opción elegida por el estudiante.",
        criterios_evaluacion: "3 pts: Selecciona una opción y justifica coherentemente. 1-2 pts: Selecciona opción con justificación incompleta o nula."
          }
        ],
        respuesta_produccion: {
          respuesta_modelo: "La carta decía que Julia era declarada inocente y podía volver con su familia. Ella gritó de alegría y abrazó a sus seres queridos, sintiendo que el invierno en su alma terminaba.",
          criterios_evaluacion: "4 pts: Expresa con claridad la resolución del caso a través del medio de expresión elegido (dibujo, escrito breve u oralidad) siguiendo la consigna. 2 pts: Explicación confusa o incompleta."
        },
        respuesta_ticket: {
          respuesta_correcta: "El alumno reflexiona sobre los apoyos que facilitaron su aprendizaje (vocabulario, pistas de andamiaje, etc.)."
        }
      }
    } : null;

    return {
      titulo: isNarrativa ? "El misterio del manuscrito perdido" : "Guía de Trabajo: Comprensión y Creación Literaria",
      nivel: curso,
      eje: "Lectura",
      oa_code: oa || "OA 3",
      formato: isNarrativa ? "narrativa" : "tradicional",
      tema_narrativo: isNarrativa ? tema : null,
      rti_nivel: rtiNivel,
      instrucciones_docente: "Guiar la lectura del texto y monitorear el trabajo de los estudiantes. En la sección DUA, dar libertad para el formato de entrega de la actividad final.",
      universal: universalContent,
      dua: duaContent
    };
  };



  // ── DUA: construir secciones de guía ─────────────────────────────────────
  const buildDuaGuiaSections = (cj: any) => {
    type DuaSection = { tipo: string; label: string; contenido: string };
    const sections: DuaSection[] = [];
    const univ = cj.universal || {};

    // ── Página 1 — Portada + Texto de Lectura ─────────────────────────────────
    // Formato Kit de Clase: cj.texto_lectura.contenido
    // Formato Universal:    cj.universal.desarrollo.texto_principal
    let c1 = 'PORTADA Y TEXTO DE LECTURA\n';
    if (cj.objetivo_clase) c1 += `OBJETIVO: ${cj.objetivo_clase}\n\n`;
    if (cj.activacion)     c1 += `PREGUNTA DE ACTIVACIÓN: ${cj.activacion}\n\n`;

    const txtLectura = cj.texto_lectura;
    if (txtLectura && (txtLectura.contenido || txtLectura.cuerpo)) {
      if (txtLectura.titulo) c1 += `TEXTO: "${txtLectura.titulo}"`;
      if (txtLectura.tipo)   c1 += ` (${txtLectura.tipo})`;
      if (txtLectura.autor)  c1 += ` — Autor: ${txtLectura.autor}`;
      c1 += `\n\n${(txtLectura.contenido || txtLectura.cuerpo || '').slice(0, 2000)}`;
    } else if (univ.desarrollo?.texto_principal) {
      c1 += univ.desarrollo.texto_principal.slice(0, 2000);
    } else if (cj.texto_sesion || cj.texto) {
      const t = cj.texto_sesion || cj.texto;
      c1 += typeof t === 'string' ? t.slice(0, 2000) : JSON.stringify(t).slice(0, 2000);
    } else {
      c1 += '[Sin texto de lectura disponible]';
    }
    sections.push({ tipo: 'portada', label: 'Portada y texto de lectura', contenido: c1 });

    // ── Página 2 — Actividades / Desafíos ────────────────────────────────────
    // Formato Kit de Clase: cj.desafios[] con tipo, instruccion, items/pares/oraciones
    // Formato Universal:    cj.universal.actividades.preguntas[]
    let c2 = 'ACTIVIDADES PRINCIPALES:\n\n';
    const desafios: any[] = cj.desafios || [];
    if (desafios.length > 0) {
      c2 += desafios.slice(0, 5).map((d: any, i: number) => {
        const tipo   = d.tipo ? d.tipo.replace(/_/g, ' ').toUpperCase() : `ACTIVIDAD ${i + 1}`;
        const instr  = d.instruccion || d.instrucciones || '';
        const items  = d.items || d.pares || d.oraciones || d.fragmentos || d.afirmaciones || [];
        let bloque = `[${tipo}]\n${instr}`;
        if (Array.isArray(items) && items.length > 0) {
          bloque += '\n' + items.slice(0, 5).map((it: any) => {
            if (typeof it === 'string') return `  - ${it}`;
            const txt = it.afirmacion || it.texto || it.izquierda || (it.grupo ? it.grupo.join(', ') : '') || '';
            return `  - ${txt}`;
          }).join('\n');
        }
        return bloque;
      }).join('\n\n');
    } else {
      const preguntas: any[] = univ.actividades?.preguntas || cj.bloques || cj.actividades || [];
      if (preguntas.length > 0) {
        c2 += preguntas.slice(0, 6).map((p: any, i: number) => {
          const num = p.numero || i + 1;
          return `P${num}: ${p.enunciado || p.texto || p.pregunta || ''}`;
        }).join('\n');
        const prod = univ.actividades?.produccion_escrita;
        if (prod) c2 += `\n\nPRODUCCIÓN ESCRITA:\n${prod.consigna || prod.instruccion || ''}`;
      } else {
        c2 += '[Sin actividades — generar actividades DUA basadas en el texto de la página 1]';
      }
    }
    sections.push({ tipo: 'actividades', label: 'Actividades principales', contenido: c2 });

    // ── Página 3 — Cierre ────────────────────────────────────────────────────
    // Formato Universal: cj.universal.cierre.ticket_salida / autoevaluacion / frase_pnl
    // Formato Kit de Clase: cj.ticket_salida (string), cj.autoevaluacion (array)
    const cierre = univ.cierre || {};
    let c3 = 'CIERRE:\n';
    // Ticket de salida
    const ticketPregunta = cierre.ticket_salida?.pregunta || (typeof cj.ticket_salida === 'string' ? cj.ticket_salida : null);
    if (ticketPregunta) c3 += `TICKET DE SALIDA: ${ticketPregunta}\n\n`;
    // Autoevaluación
    const autoEval = (Array.isArray(cierre.autoevaluacion) && cierre.autoevaluacion.length > 0)
      ? cierre.autoevaluacion
      : (Array.isArray(cj.autoevaluacion) && cj.autoevaluacion.length > 0 ? cj.autoevaluacion : null);
    if (autoEval) c3 += `AUTOEVALUACIÓN:\n${autoEval.map((x: string) => `- ${x}`).join('\n')}\n\n`;
    // Frase PNL
    if (cierre.frase_pnl) c3 += `FRASE DE CIERRE: ${cierre.frase_pnl}\n`;
    if (c3 === 'CIERRE:\n') c3 += '[Generar cierre motivador con semáforo de autoevaluación y mensaje final]';
    sections.push({ tipo: 'cierre', label: 'Desafío y cierre', contenido: c3 });

    return sections;
  };

  // ── DUA: plantilla de prompt guía (contextual) ─────────────────────────────
  const buildDuaPromptGuia = (contenido: string, pagina: number, total: number, ctx?: { establecimiento?: string; docente?: string; asignatura?: string; curso?: string; oas?: string }): string => {
    const _est  = (ctx && ctx.establecimiento) || '';
    const _doc  = (ctx && ctx.docente) || '';
    const _asig = (ctx && ctx.asignatura) || 'Lenguaje y Comunicación';
    const _cur  = (ctx && ctx.curso) || '';
    const _oas  = (ctx && ctx.oas) || '';

    const lines = [];
    lines.push('Actua como ilustrador editorial, disenador grafico educativo y especialista en Diseno Universal para el Aprendizaje (DUA), con experiencia en editoriales como Santillana, SM, Zig-Zag, Oxford y Pearson.');
    lines.push('');
    lines.push('El contenido de cada pagina esta incluido al final de este prompt bajo "CONTENIDO DE ESTA PAGINA". Basate unicamente en ese contenido.');
    lines.push('');
    lines.push('==================================================');
    lines.push('DATOS DE CONTEXTO (referencia interna)');
    lines.push('Establecimiento: ' + (_est || '(no especificado)'));
    lines.push('Docente: ' + (_doc || '(no especificado)'));
    lines.push('Asignatura: ' + _asig);
    lines.push('Curso: ' + _cur);
    lines.push('OA trabajados: ' + _oas);
    lines.push('Total de paginas: ' + total);
    lines.push('==================================================');
    lines.push('');
    lines.push('MISION: Transformar esta pagina en una version ilustrada y accesible segun los principios del DUA. Trabaja UNICAMENTE sobre la Pagina ' + pagina + ' de ' + total + '.');

    if (pagina === 1) {
      lines.push('');
      lines.push('ENCABEZADO INSTITUCIONAL (solo pagina 1):');
      lines.push('Nombre del establecimiento arriba: ' + (_est || 'LICEO'));
      lines.push('Tabla de encabezado (3 filas):');
      lines.push('  Fila 1: [Tipo: GUIA DE APRENDIZAJE] [Asignatura: ' + _asig + '] [Curso: ' + _cur + '] [Letra: ___]');
      lines.push('  Fila 2: [Docente: ' + (_doc || '') + '] [Fecha: ______] [OA: ' + _oas + ']');
      lines.push('  Fila 3: [Nombre del Estudiante: ___________________________] [Puntaje: ___] [Nota: ___]');
      lines.push('Luego el titulo de la guia en negrita, centrado.');
    }

    lines.push('');
    lines.push('ADAPTACIONES DUA:');
    lines.push('- Ilustraciones relacionadas con el tema o texto de la guia');
    lines.push('- Pictogramas para instrucciones y conceptos clave');
    lines.push('- Organizadores graficos, mapas conceptuales, esquemas visuales');
    lines.push('- Vocabulario ilustrado con definiciones visuales');
    lines.push('- Iconos para representar acciones (leer, subrayar, responder)');
    lines.push('- Mayor espaciado y bloques visuales entre actividades');
    lines.push('- Colores suaves para diferenciar secciones');
    lines.push('Las ilustraciones deben apoyar la comprension. NUNCA decorativas.');
    lines.push('');
    lines.push('NO MODIFIQUES: OA, actividades, preguntas, respuestas, contenido pedagogico, nombres institucionales.');
    lines.push('');
    lines.push('DISENO: Editorial educativa profesional. A4 vertical. 300 dpi. Listo para impresion.');
    lines.push('');
    lines.push('ENTREGA: SOLO Pagina ' + pagina + ' de ' + total + ' como imagen A4 independiente. No combines paginas.');
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('CONTENIDO DE ESTA PAGINA:');
    lines.push('');
    lines.push(contenido);
    lines.push('----------------------------------------');
    lines.push('');
    lines.push('Genera la Pagina ' + pagina + ' de ' + total + ' como imagen A4 ilustrada y lista para imprimir.');

    return lines.join('\n');
  };

  // ── DUA Real: 3 páginas condensadas ──────────────────────────────────────
  const buildDuaRealPromptGuia = (
    contenido: string,
    pagina: number,
    total: number,
    ctx?: { establecimiento?: string; docente?: string; asignatura?: string; curso?: string; oas?: string },
    notaDUA?: string
  ): string => {
    const _est  = ctx?.establecimiento || '';
    const _doc  = ctx?.docente || '';
    const _asig = ctx?.asignatura || 'Lenguaje y Comunicacion';
    const _cur  = ctx?.curso || '';
    const _oas  = ctx?.oas || '';
    const lines: string[] = [];
    lines.push('Actua como disenador grafico editorial, ilustrador educativo y especialista en Diseno Universal para el Aprendizaje (DUA), con experiencia en editoriales chilenas (Santillana, SM, Zig-Zag).');
    lines.push('');
    lines.push('==================================================');
    lines.push('DATOS DE CONTEXTO (referencia interna)');
    lines.push('Establecimiento: ' + (_est || '(no especificado)'));
    lines.push('Docente: ' + (_doc || '(no especificado)'));
    lines.push('Asignatura: ' + _asig);
    lines.push('Curso: ' + _cur);
    lines.push('OA trabajados: ' + _oas);
    lines.push('Total de paginas: ' + total);
    lines.push('==================================================');
    lines.push('');
    lines.push('MISION: Generar la Pagina ' + pagina + ' de ' + total + ' de la VERSION DUA de esta guia de aprendizaje (version condensada con los 3 principios aplicados).');
    lines.push('');
    if (pagina === 1) {
      lines.push('ENCABEZADO INSTITUCIONAL (solo esta pagina):');
      lines.push('Establecimiento: ' + (_est || 'LICEO'));
      lines.push('Tabla 3 filas:');
      lines.push('  Fila 1: [GUIA DUA] [Asignatura: ' + _asig + '] [Curso: ' + _cur + '] [Letra: ___]');
      lines.push('  Fila 2: [Docente: ' + _doc + '] [Fecha: ______] [OA: ' + _oas + ']');
      lines.push('  Fila 3: [Nombre del Estudiante: ________________________________] [Puntaje: ___] [Nota: ___]');
      lines.push('OA visible en recuadro: "En esta guia aprenderas a..."');
      lines.push('');
    }
    if (notaDUA) {
      lines.push('NOTA DUA PARA ESTA PAGINA:');
      lines.push(notaDUA);
      lines.push('');
    }
    lines.push('--- PRINCIPIO 1: REPRESENTACION ---');
    lines.push('- Ilustraciones relacionadas al contenido de esta pagina');
    lines.push('- Pictogramas para instrucciones (lapiz, lupa, estrella)');
    lines.push('- Vocabulario clave resaltado con definicion simple al margen');
    lines.push('- Colores suaves, tipografia legible, interlineado amplio');
    lines.push('');
    lines.push('--- PRINCIPIO 2: ACCION Y EXPRESION ---');
    lines.push('- Lineas suficientes para responder');
    lines.push('- Alternativa: "O dibuja tu respuesta aqui:" con espacio');
    lines.push('- Iniciadores de oracion: "Creo que... / Porque... / Me parece..."');
    lines.push('- Instrucciones en pasos numerados si son largas');
    lines.push('');
    lines.push('--- PRINCIPIO 3: IMPLICACION ---');
    lines.push('- Tono amigable y motivador en todas las instrucciones');
    if (pagina === total) {
      lines.push('- Semaforo de autoevaluacion: No lo entendi / Lo estoy logrando / Lo aprendi');
      lines.push('- Desafio opcional: "Si terminaste, te desafio a..."');
      lines.push('- Mensaje motivador de cierre');
    }
    lines.push('');
    lines.push('NO MODIFICAR: OA, sentido pedagogico, objetivo de aprendizaje.');
    lines.push('DISENO: Editorial educativa profesional. A4 vertical. 300 dpi. Listo para imprimir.');
    lines.push('ENTREGA: SOLO Pagina ' + pagina + ' de ' + total + ' como imagen A4. No combines paginas.');
    lines.push('');
    lines.push('----------------------------------------');
    lines.push('CONTENIDO DE ESTA PAGINA:');
    lines.push('');
    lines.push(contenido);
    return lines.join('\n');
  };

  const handleDuaRealGenerate = () => {
    if (!result) return;
    const cj = (result as any).contenido_json || result;
    const _ctx = {
      establecimiento: establecimientoGuia || '',
      docente: docenteNombre || '',
      asignatura: String((cj as any).asignatura || 'Lenguaje y Comunicacion'),
      curso: String((cj as any).nivel || (cj as any).curso || ''),
      oas: String(((cj as any).oa_codes || []).join(', ') || (cj as any).oa || ''),
    };

    // Extraer secciones del JSON (igual que Version Visual)
    const allSections = buildDuaGuiaSections(cj);
    const textoSec      = allSections.find(s => s.tipo === 'portada');
    const actividadSec  = allSections.find(s => s.tipo === 'actividades');
    const cierreSec     = allSections.find(s => s.tipo === 'cierre');

    const contenidoTexto = textoSec?.contenido ||
      '[Sin texto de lectura — incluir encabezado de guia con objetivo y pregunta de anticipacion]';
    const contenidoActs  = actividadSec?.contenido ||
      '[Sin actividades — generar actividades DUA basadas en el texto de la pagina anterior]';
    const contenidoCierre = (cierreSec?.contenido || '') +
      '\n\nAGREGAR: (1) Reflexion: "Aprendi que... / Todavia tengo dudas sobre...", (2) Semaforo de autoevaluacion, (3) Mensaje motivador final.';

    const duaSections = [
      {
        label: 'Pag 1 DUA — Portada y Texto',
        contenido: contenidoTexto,
        nota: 'Puedes simplificar levemente el vocabulario dificil manteniendo el sentido. Agrega pregunta de anticipacion al inicio. NO incluyas las actividades en esta pagina.',
      },
      {
        label: 'Pag 2 DUA — Actividades',
        contenido: contenidoActs,
        nota: 'Selecciona solo las actividades MAS REPRESENTATIVAS del OA. Puedes reducir la cantidad. Adapta con espacios de respuesta amplios y opciones alternativas.',
      },
      {
        label: 'Pag 3 DUA — Desafio y Cierre',
        contenido: contenidoCierre,
        nota: '',
      },
    ];
    const prompts = duaSections.map((s, i) =>
      buildDuaRealPromptGuia(s.contenido, i + 1, duaSections.length, _ctx, s.nota || undefined)
    );
    setDuaRealPages(prompts);
    setDuaRealLabels(duaSections.map(s => s.label));
    setDuaRealViewIdx(0);
    setShowDuaRealModal(true);
  };

    // ── DUA: generar prompts por página (sin llamada API) ────────────────────
  const handleDuaGenerate = () => {
    if (!result) return;
    const cj = result.contenido_json || result;
    const sections = buildDuaGuiaSections(cj);
    if (sections.length === 0) return;
    const _cjCtx = result.contenido_json || result;
    const _ctx = {
      establecimiento: establecimientoGuia || '',
      docente: docenteNombre || '',
      asignatura: String(_cjCtx.asignatura || 'Lenguaje y Comunicacion'),
      curso: String(_cjCtx.nivel || _cjCtx.curso || ''),
      oas: String((_cjCtx.oa_codes || []).join(', ') || _cjCtx.oa || ''),
    };
    const prompts = sections.map((s, i) =>
      buildDuaPromptGuia(s.contenido, i + 1, sections.length, _ctx)
    );
    setDuaPages(prompts);
    setDuaLabels(sections.map(s => s.label));
    setDuaStep(-1);
    setDuaGenerating(false);
    setShowDuaModal(true);
    setDuaViewIdx(0);
    setDuaPageCopied(false);
    setDuaAllCopied(false);
  };

    // ── Export PDF Client-side ────────────────────────────────────────────────
  const triggerPdfDownload = () => {
    if (!result) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const cj = result.contenido_json || result;

    // Call unified PDF drawing helper
    drawGuidePdf(doc, cj, 'color', result, docenteNombre);

    doc.save(`${result.titulo || 'guia-aprendizaje'}.pdf`);
  };

  // ── Client Word download ──────────────────────────────────────────────────
  const triggerWordDownload = async () => {
    if (!result) return;
    const cj = result.contenido_json || result;
    const children: any[] = [];

    const p = (text: string, bold = false, size = 11, color = '000000', before = 0, after = 6) => {
      return new Paragraph({
        children: [new TextRun({ text, bold, size: size * 2, color })],
        spacing: { before, after }
      });
    };

    const dottedLines = (count = 3) => {
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push(new Paragraph({ text: "_________________________________________________________", spacing: { after: 120 } }));
      }
      return arr;
    };

    if (cj.universal) {
      // Title
      children.push(p(cj.titulo || "Guía de Aprendizaje", true, 18, '059669', 0, 12));
      children.push(p(`Curso: ${result.nivel || 'Lengua y Literatura'} | Eje: ${cj.eje || 'Lectura'} | OA: ${cj.oa_code || ''}`, true, 10, '475569', 0, 12));
      if (cj.instrucciones_docente) {
        children.push(p(`Orientación Docente: ${cj.instrucciones_docente}`, false, 9, '64748b', 0, 12));
      }

      children.push(p("Estudiante: _____________________________________   Fecha: ___________", false, 10, '1e293b', 120, 120));

      const uni = cj.universal;

      // Activación
      if (uni.activacion) {
        children.push(p(uni.activacion.titulo || "1. Activación de Aprendizajes", true, 13, '059669', 180, 6));
        if (uni.activacion.texto) children.push(p(uni.activacion.texto, false, 11, '334155'));
        if (uni.activacion.pregunta) children.push(p(uni.activacion.pregunta, true, 11, '1e293b'));
        children.push(...dottedLines(uni.activacion.lineas_respuesta || 3));
      }

      // Desarrollo
      if (uni.desarrollo) {
        children.push(p(uni.desarrollo.titulo || "2. Lectura y Desarrollo", true, 13, '059669', 180, 6));
        if (uni.desarrollo.texto_principal) children.push(p(uni.desarrollo.texto_principal, false, 11, '334155'));
      }

      // Actividades
      if (uni.actividades) {
        children.push(p(uni.actividades.titulo || "3. Actividades de Comprensión", true, 13, '059669', 180, 6));
        if (uni.actividades.instruccion) children.push(p(uni.actividades.instruccion, false, 10, '475569'));
        
        if (uni.actividades.preguntas) {
          uni.actividades.preguntas.forEach((q: any) => {
            children.push(p(`${q.numero}. [${q.nivel_cognitivo || 'Comprensión'}] ${q.enunciado} (${q.puntaje || 2} pts)`, true, 11, '1e293b', 120, 6));
            children.push(...dottedLines(q.lineas_respuesta || 3));
          });
        }

        if (uni.actividades.produccion_escrita) {
          const pe = uni.actividades.produccion_escrita;
          children.push(p(pe.titulo || "Actividad de Escritura", true, 12, '059669', 180, 6));
          if (pe.consigna) children.push(p(pe.consigna, false, 11, '1e293b'));
          children.push(p(`Puntaje: ${pe.puntaje || 4} puntos.`, true, 9.5, '475569'));
          children.push(...dottedLines(pe.lineas_respuesta || 6));
        }
      }

      // Cierre
      if (uni.cierre) {
        children.push(p(uni.cierre.titulo || "4. Cierre y Autoevaluación", true, 13, '059669', 180, 6));
        if (uni.cierre.ticket_salida) {
          children.push(p(`Ticket de Salida: ${uni.cierre.ticket_salida.pregunta}`, true, 11, '1e293b'));
          children.push(...dottedLines(uni.cierre.ticket_salida.lineas_respuesta || 2));
        }
        if (uni.cierre.metacognicion) {
          children.push(p("Preguntas para reflexionar:", true, 10.5, '059669'));
          uni.cierre.metacognicion.forEach((m: string) => {
            children.push(p(`• ${m}`, false, 10.5, '334155'));
          });
        }
        if (uni.cierre.autoevaluacion) {
          children.push(p("Autoevaluación:", true, 10.5, '059669'));
          uni.cierre.autoevaluacion.forEach((ae: string) => {
            children.push(p(`[  ] [  ] [  ]  ${ae}`, false, 10, '334155'));
          });
        }
      }

      // DUA Adaptación
      if (cj.dua) {
        children.push(new Paragraph({ text: "", pageBreakBefore: true }));
        const dua = cj.dua;

        children.push(p(`Adaptación DUA: ${cj.titulo || "Guía de Aprendizaje"}`, true, 18, '7c3aed', 0, 12));
        children.push(p(`Curso: ${result.nivel || 'Lengua y Literatura'} | Eje: ${cj.eje || 'Lectura'} | Apoyo Diversificado DUA`, true, 10, '475569', 0, 12));

        children.push(p("Estudiante: _____________________________________   Fecha: ___________", false, 10, '1e293b', 120, 120));

        // Vocabulario
        if (dua.vocabulario_apoyo && dua.vocabulario_apoyo.length > 0) {
          children.push(p("Glosario de Palabras de Apoyo", true, 12, '7c3aed', 120, 6));
          dua.vocabulario_apoyo.forEach((w: any) => {
            children.push(p(`• ${w.palabra}: ${w.definicion} (Ej: ${w.ejemplo || ''})`, false, 10, '1e293b'));
          });
        }

        // Activación DUA
        if (dua.activacion) {
          children.push(p(dua.activacion.titulo || "1. Activación de Aprendizajes (Adaptado)", true, 13, '7c3aed', 180, 6));
          if (dua.activacion.texto_simplificado) children.push(p(dua.activacion.texto_simplificado, false, 11, '334155'));
          if (dua.activacion.pregunta_andamiada) children.push(p(dua.activacion.pregunta_andamiada, true, 11, '1e293b'));
          if (dua.activacion.pista_ayuda) children.push(p(`Ayuda: ${dua.activacion.pista_ayuda}`, false, 9.5, '7c3aed'));
          children.push(...dottedLines(dua.activacion.lineas_respuesta || 2));
        }

        // Desarrollo DUA
        if (dua.desarrollo) {
          children.push(p(dua.desarrollo.titulo || "2. Lectura y Organizador", true, 13, '7c3aed', 180, 6));
          if (dua.desarrollo.texto_principal) children.push(p(dua.desarrollo.texto_principal, false, 11, '334155'));
          if (dua.desarrollo.apoyo_visual_desc) children.push(p(`Apoyo Visual: ${dua.desarrollo.apoyo_visual_desc}`, true, 10.5, '7c3aed'));
        }

        // Actividades DUA
        if (dua.actividades) {
          children.push(p(dua.actividades.titulo || "3. Actividades de Comprensión", true, 13, '7c3aed', 180, 6));
          if (dua.actividades.preguntas) {
            dua.actividades.preguntas.forEach((q: any) => {
              children.push(p(`${q.numero}. [${q.nivel_cognitivo || 'Comprensión'}] ${q.enunciado} (${q.puntaje || 2} pts)`, true, 11, '1e293b', 120, 6));
              if (q.opciones_alternativas) {
                q.opciones_alternativas.forEach((opt: string) => {
                  children.push(p(`   [  ] ${opt}`, false, 10, '334155'));
                });
              }
              if (q.pista_ayuda) children.push(p(`   Pista: ${q.pista_ayuda}`, false, 9, '7c3aed'));
              if (q.inicio_respuesta) children.push(p(`   Comienza así: "${q.inicio_respuesta}"`, false, 9, '64748b'));
              children.push(...dottedLines(q.lineas_respuesta || 2));
            });
          }

          if (dua.actividades.produccion_escrita) {
            const pe = dua.actividades.produccion_escrita;
            children.push(p(pe.titulo || "Actividad de Expresión Adaptada", true, 12, '7c3aed', 180, 6));
            if (pe.consigna_adaptada) children.push(p(pe.consigna_adaptada, false, 11, '1e293b'));
            if (pe.opciones_expresion) children.push(p(`Opciones: ${pe.opciones_expresion}`, true, 9.5, '7c3aed'));
            children.push(...dottedLines(pe.lineas_respuesta || 4));
          }
        }

        // Cierre DUA
        if (dua.cierre) {
          children.push(p(dua.cierre.titulo || "4. Cierre y Autoevaluación", true, 13, '7c3aed', 180, 6));
          if (dua.cierre.ticket_salida) {
            children.push(p(`Ticket de Salida: ${dua.cierre.ticket_salida.pregunta_andamiada || dua.cierre.ticket_salida.pregunta}`, true, 11, '1e293b'));
            children.push(...dottedLines(dua.cierre.ticket_salida.lineas_respuesta || 2));
          }
        }
      }

      // Pauta Docente
      children.push(new Paragraph({ text: "", pageBreakBefore: true }));
      children.push(p("PAUTA DE CORRECCIÓN DOCENTE", true, 16, 'e11d48', 0, 12));
      children.push(p("Evaluación Curricular Confidencial", true, 10, '475569', 0, 12));

      if (uni.pauta_docente) {
        children.push(p("Pauta: Guía Universal", true, 12, 'e11d48', 120, 6));
        if (uni.pauta_docente.respuestas_preguntas) {
          uni.pauta_docente.respuestas_preguntas.forEach((ans: any) => {
            children.push(p(`Pregunta ${ans.numero}: Respuesta: ${ans.respuesta_correcta}`, true, 11, '1e293b'));
            if (ans.criterios_evaluacion) children.push(p(`Criterios: ${ans.criterios_evaluacion}`, false, 9.5, '64748b'));
          });
        }
        if (uni.pauta_docente.respuesta_produccion) {
          children.push(p(`Escritura: Respuesta: ${uni.pauta_docente.respuesta_produccion.respuesta_modelo}`, true, 11, '1e293b'));
          children.push(p(`Criterios: ${uni.pauta_docente.respuesta_produccion.criterios_evaluacion}`, false, 9.5, '64748b'));
        }
        if (uni.pauta_docente.respuesta_ticket) {
          children.push(p(`Ticket de Salida: Respuesta: ${uni.pauta_docente.respuesta_ticket.respuesta_correcta}`, true, 11, '1e293b'));
        }
      }

      if (cj.dua && cj.dua.pauta_docente) {
        children.push(p("Pauta: Adaptación DUA", true, 12, 'e11d48', 180, 6));
        const duaP = cj.dua.pauta_docente;
        if (duaP.respuestas_preguntas) {
          duaP.respuestas_preguntas.forEach((ans: any) => {
            children.push(p(`Pregunta ${ans.numero}: Respuesta: ${ans.respuesta_correcta}`, true, 11, '1e293b'));
            if (ans.criterios_evaluacion) children.push(p(`Criterios: ${ans.criterios_evaluacion}`, false, 9.5, '64748b'));
          });
        }
        if (duaP.respuesta_produccion) {
          children.push(p(`Expresión DUA: Respuesta: ${duaP.respuesta_produccion.respuesta_modelo}`, true, 11, '1e293b'));
        }
      }
    } else {
      // Fallback
      children.push(p(result.titulo || 'Guía de Aprendizaje', true, 18, '10B981'));
      if (cj.contexto) children.push(p(`Contexto: ${cj.contexto}`));
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.titulo || 'guia'}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(g =>
    (g.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.nivel || '').toLowerCase().includes(searchQuery.toLowerCase())
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
                : 'Límite de guías alcanzado'}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {upgradePlanStatus === 'active'
                ? `Has alcanzado tu cupo mensual de ${upgradeLimit} guías de aprendizaje en tu suscripción. Tu cupo se renovará automáticamente en tu próximo ciclo el ${formattedRenewalDate}.`
                : upgradeReason === 'trial_expired'
                ? 'Tu trial gratuito de 7 días ha expirado. Actualiza tu plan para seguir generando recursos visuales, planificaciones y más.'
                : `Has generado 5 guías de aprendizaje en tu trial gratuito. Los demás módulos siguen funcionando con sus propios límites. Actualiza para generación ilimitada.`}
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

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-slate-700 flex font-sans antialiased selection:bg-emerald-100 selection:text-emerald-950 overflow-x-hidden">
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
            <span className="text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              REI DOCENTE
            </span>
          </div>
        </header>

        {/* PNL BANNER */}
        <div className="px-6 md:px-8 pt-8">
          <div className="rounded-3xl p-6 flex items-center justify-between relative overflow-hidden border" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', borderColor: '#E5E7EB', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
            <div className="space-y-2 max-w-lg z-10">
              <h2 className="text-xl font-black" style={{ color: '#0F172A' }}>
                Guía con intención ✨
              </h2>
              <p className="text-xs leading-relaxed font-semibold" style={{ color: '#64748B' }}>
                Tu didáctica transforma el papel en una herramienta de descubrimiento. Cada guía que creas abre una puerta al aprendizaje.
              </p>
            </div>
            <div className="hidden sm:flex shrink-0 mr-4 items-center justify-center w-20 h-16">
              <img src="/assets/dashboard/icons/guias_icon.png" alt="Guías" className="w-full h-full object-contain" />
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
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Creador de Guías</h2>
                  <p className="text-slate-450 text-[10px] font-semibold mt-0.5">Diseña guías de trabajo y desafíos lúdicos.</p>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setActiveTab('generador')}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                      activeTab === 'generador' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    Generar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('biblioteca');
                      fetchHistory();
                    }}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all ${
                      activeTab === 'biblioteca' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-400'
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
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-355'
                        }`}
                      >
                        Kit de Clase
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrigen('tema')}
                        className={`py-2 text-[9px] font-bold rounded-lg border transition-all ${
                          origen === 'tema'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
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
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
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
                            className="w-full bg-[#FAF9FC] border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
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

                  {/* 2. Desafíos lúdicos (12 opciones, máx 4) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                        2. Desafíos Lúdicos
                      </label>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        actividadesSeleccionadas.length === 4 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {actividadesSeleccionadas.length} / 4 Seleccionados
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {DESAFIOS_LUDICOS.map((act) => {
                        const isChecked = actividadesSeleccionadas.includes(act.id);
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => toggleActivity(act.id)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left text-[10px] transition-all ${
                              isChecked
                                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-850 font-bold'
                                : 'bg-[#FAF9FC]/30 border-slate-100 hover:border-slate-300 text-slate-500'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                              isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-350 bg-white'
                            }`}>
                              {isChecked && <span className="text-[8px] font-black">✓</span>}
                            </div>
                            <span className="truncate">{act.emoji} {act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extra options */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Plantilla de Guía</label>
                        <select
                          value={templateId}
                          onChange={(e) => setTemplateId(e.target.value)}
                          className="w-full bg-[#FAF9FC] border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-semibold focus:outline-none"
                        >
                          <option value="comprension_lectora">Comprensión Lectora</option>
                          <option value="escritura">Taller de Escritura</option>
                          <option value="vocabulario">Vocabulario en Contexto</option>
                          <option value="analisis_literario">Análisis Literario</option>
                          <option value="guia_gamificada">Guía Gamificada</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Actividad Adicional</label>
                        <select
                          value={actividadAdicional}
                          onChange={(e) => setActividadAdicional(e.target.value)}
                          className="w-full bg-[#FAF9FC] border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-semibold focus:outline-none"
                        >
                          <option value="ninguna">Ninguna</option>
                          <option value="codigo_secreto">Código secreto</option>
                          <option value="preguntas_capciosas">Preguntas capciosas</option>
                        </select>
                      </div>
                    </div>


                  </div>

                </div>
              ) : (
                // Library View
                <div className="space-y-4 flex-1 flex flex-col min-h-[380px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar guías..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#FAF9FC] border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {historyLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 italic">
                      No hay guías guardadas en la biblioteca.
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
                      {filteredHistory.map((g) => {
                        const isSelected = result && result.id === g.id;
                        return (
                          <div
                            key={g.id}
                            onClick={() => {
                              setResult(g);
                              setSavedId(g.id);
                            }}
                            className={`group flex items-start justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-50/50 border-emerald-350 shadow-2xs'
                                : 'bg-white border-slate-100 hover:border-slate-350'
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-extrabold uppercase rounded">
                                {g.formato === 'narrativa' ? 'Gamificada' : 'Tradicional'}
                              </span>
                              <h4 className="text-xs font-bold text-slate-700 truncate">{g.titulo || 'Guía de Trabajo'}</h4>
                              <p className="text-[9px] text-slate-400 flex items-center gap-1.5">
                                <span>{g.nivel}</span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(g.created_at).toLocaleDateString('es-CL')}</span>
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDelete(g.id, e)}
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

              {/* Datos del establecimiento y docente */}
              {activeTab === 'generador' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Nombre del establecimiento</label>
                    <input
                      type="text"
                      value={establecimientoGuia}
                      onChange={(e) => setEstablecimientoGuia(e.target.value)}
                      placeholder="Ej: Colegio San Martín"
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Nombre del docente</label>
                    <input
                      type="text"
                      value={docenteNombre}
                      onChange={(e) => setDocenteNombre(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              {activeTab === 'generador' && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating || actividadesSeleccionadas.length === 0}
                    id="btn-generar-guia"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generar Guía de Aprendizaje
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
                      <div className="w-14 h-14 rounded-full border-2 border-emerald-100 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-emerald-50/50 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-slate-700 font-bold text-sm">
                        {LOADING_STEPS[loadingStep]}
                      </p>
                      <div className="flex gap-1.5 justify-center">
                        {LOADING_STEPS.map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i <= loadingStep ? 'bg-emerald-500 w-3' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* IDLE */}
                {!generating && !result && (
                  <div className="flex-grow flex flex-col items-center justify-center gap-4 p-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-emerald-550/70" />
                    </div>
                    <div>
                      <p className="text-slate-650 font-bold text-sm">Ficha de Trabajo Escolar</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                        Define los parámetros en el panel izquierdo y presiona Generar.
                      </p>
                    </div>
                  </div>
                )}

                {/* RESULT PREVIEW */}
                {!generating && result && (
                  <div className="flex flex-col flex-grow">
                    {/* Preview Canvas Header */}
                    <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between shrink-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{result.titulo || 'Guía de Trabajo'}</p>
                        <p className="text-[10px] text-slate-500">{(result.rti_nivel || rtiNivel) === 'universal' ? 'Guía Universal' : 'Adaptación DUA'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={triggerPdfDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all">
                          <Printer className="w-3.5 h-3.5" />
                          PDF
                        </button>
                        <button onClick={triggerWordDownload}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all">
                          <Download className="w-3.5 h-3.5" />
                          Word
                        </button>
                        <button
                          onClick={handleDuaGenerate}
                          disabled={!result}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all"
                          title="Generar version visual ilustrada pagina por pagina"
                        >
                          🎨 Versión Visual
                        </button>
                        <button
                          onClick={handleDuaRealGenerate}
                          disabled={!result}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all"
                          title="Prompts DUA — version condensada 3 principios pagina por pagina"
                        >
                          🧩 Prompts DUA
                        </button>

                      </div>
                    </div>
                    {/* Printable Page Canvas */}
                    <div className="flex-grow p-6 bg-[#FAF9FC] overflow-y-auto max-h-[520px]">
                      <div className="bg-white border border-[#E2E8F0]/80 rounded-2xl p-6 md:p-8 shadow-xs space-y-8 max-w-2xl mx-auto font-sans text-slate-800">
                        
                        {(!resultCj.universal && !isNewFlatFormat) ? (
                          // ── FALLBACK FOR OLD FORMAT ─────────────────────────
                          <div className="space-y-6">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4 font-sans">
                              <div className="space-y-1">
                                <p className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">REI DOCENTE</p>
                                <h3 className="text-xs font-black leading-none text-slate-800">Recursos Educativos Inteligentes</h3>
                                <p className="text-[8px] text-slate-400">Guía de Ejercitación Curricular y Didáctica</p>
                              </div>
                              <div className="text-right text-[8px] text-slate-400 space-y-0.5">
                                <p><span className="font-bold">Curso:</span> {result.nivel || curso}</p>
                                <p><span className="font-bold">Apoyo:</span> {(result.rti_nivel || rtiNivel) === 'universal' ? 'Universal' : 'Adaptación DUA'}</p>
                              </div>
                            </div>

                            {/* Student info box */}
                            <div className="grid grid-cols-2 gap-4 border border-slate-200 p-2.5 rounded-lg text-[9px] font-sans text-slate-500">
                              <div>Nombre Estudiante: ___________________________</div>
                              <div className="text-right">Fecha: ___________  Puntaje: ____ / ____</div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2 text-center py-2">
                              <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans border border-emerald-100">
                                Guía de Trabajo Tradicional
                              </span>
                              <h2 className="text-sm font-black text-slate-800 font-sans leading-tight">
                                {result.titulo || `Guía Didáctica Escolar`}
                              </h2>
                            </div>

                            {/* Context */}
                            {resultCj.contexto && (
                              <div className="bg-slate-50 border-l-4 border-emerald-500 p-3 rounded-r-lg space-y-1">
                                <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 font-sans">
                                  Contextualización de la Actividad
                                </p>
                                <p className="text-[11px] text-slate-650 leading-relaxed italic">
                                  {resultCj.contexto}
                                </p>
                              </div>
                            )}

                            {/* Activities content */}
                            <div className="space-y-4 pt-2">
                              {(resultCj.bloques || []).map((b: any, bIdx: number) => (
                                <div key={bIdx} className="space-y-2 font-sans border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                                  <div className="flex items-center gap-2">
                                    <span className="w-4.5 h-4.5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold font-sans">
                                      {bIdx + 1}
                                    </span>
                                    <h4 className="text-[11px] font-bold text-slate-700 font-sans uppercase tracking-wide">
                                      {b.titulo || b.tipo}
                                    </h4>
                                  </div>
                                  {b.instruccion && (
                                    <p className="text-[9px] text-slate-400 italic font-sans leading-none pl-6">
                                      {b.instruccion}
                                    </p>
                                  )}
                                  <div className="pl-6 pt-1 text-[11px] leading-relaxed text-slate-650">
                                    {b.contenido && <p className="whitespace-pre-line">{b.contenido}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (!resultCj.universal && isNewFlatFormat) ? (
                          // ── NEW UNIFIED FLAT LAYOUT ───────────────────────────
                          <div className="space-y-8 font-sans text-slate-800">
                            {/* INSTITUTIONAL HEADER BOX */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-slate-50">
                              <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                                <span className="font-extrabold text-slate-700">C.E.P. Rigoberto Fontt Izquierdo / Unidad Técnica Pedagógica</span>
                                <span className="text-slate-400 font-mono text-[10px]">Guía de Trabajo</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 p-2.5 text-[10px] text-slate-500">
                                <div className="p-1">
                                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Asignatura</p>
                                  <p className="font-bold text-slate-700">Lenguaje y Literatura</p>
                                </div>
                                <div className="p-1">
                                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Curso</p>
                                  <p className="font-bold text-slate-700">{result.nivel || curso}</p>
                                </div>
                                <div className="p-1">
                                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Pje. Ideal / Corte</p>
                                  <p className="font-bold text-slate-700">30 pts / 18 pts (60%)</p>
                                </div>
                                <div className="p-1">
                                  <p className="text-[8px] uppercase tracking-wider text-slate-400">Estudiante</p>
                                  <p className="font-medium text-slate-650">______________________</p>
                                </div>
                              </div>
                            </div>

                            {/* Title & Objective */}
                            <div className="space-y-2 text-center">
                              <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase underline decoration-emerald-500 decoration-2 underline-offset-4">
                                {resultCj.titulo || "Guía de Aprendizaje"}
                              </h1>
                              {resultCj.objetivo_clase && (
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-650 max-w-lg mx-auto leading-relaxed text-left">
                                  <strong>Objetivo:</strong> {resultCj.objetivo_clase}
                                </div>
                              )}
                            </div>

                            {/* 1. TEXTO DE LECTURA COMPLETO */}
                            {resultCj.texto_lectura && (
                              <div className="space-y-3 border-t border-slate-100 pt-5">
                                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  I. Texto de Lectura: {resultCj.texto_lectura.titulo || 'Lectura Principal'}
                                </h3>
                                {resultCj.texto_lectura.autor && (
                                  <p className="text-[10px] text-slate-400 italic">Autor: {resultCj.texto_lectura.autor}</p>
                                )}
                                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 font-serif text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-3xs">
                                  {resultCj.texto_lectura.contenido || resultCj.texto_lectura.texto_principal || ''}
                                  {resultCj.texto_lectura.imagen_url && (
                                    <div className="my-4 border border-slate-200 rounded-2xl overflow-hidden max-w-md mx-auto bg-white p-2">
                                      <img src={resultCj.texto_lectura.imagen_url} alt="Ilustración" className="w-full h-auto object-contain rounded-lg max-h-[250px] mx-auto" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 2. VOCABULARIO CLAVE */}
                            {((resultCj.banco_palabras && resultCj.banco_palabras.length > 0) || (resultCj.vocabulario && resultCj.vocabulario.length > 0)) && (
                              <div className="space-y-3 border-t border-slate-100 pt-5">
                                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  II. Vocabulario Clave
                                </h3>
                                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl font-mono text-xs text-emerald-700 leading-relaxed">
                                  {(() => {
                                    const vocab = resultCj.banco_palabras || resultCj.vocabulario;
                                    return Array.isArray(vocab) ? vocab.join(' · ') : String(vocab || '');
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* 3. DESAFÍOS CON CONTENIDO (INSTRUCCIÓN + ÍTEMS) */}
                            {resultCj.desafios && Array.isArray(resultCj.desafios) && resultCj.desafios.length > 0 && (
                              <div className="space-y-4 border-t border-slate-100 pt-5">
                                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  III. Desafíos Didácticos
                                </h3>
                                <div className="space-y-6">
                                  {resultCj.desafios.map((d: any, idx: number) => {
                                    if (!d) return null;
                                    const tipo = d.tipo || '';
                                    return (
                                      <div key={idx} className="p-4 bg-white border border-slate-200/70 rounded-2xl shadow-4xs space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            Desafío {idx + 1}: {tipo.replace(/_/g, ' ')}
                                          </h4>
                                        </div>
                                        {d.instruccion && (
                                          <p className="text-[11px] text-slate-500 italic leading-relaxed">{d.instruccion}</p>
                                        )}

                                        {/* Renderizado Seguro de Ítems */}
                                        {tipo === 'palabra_intrusa' && d.items && (
                                          <div className="space-y-2">
                                            {d.items.map((item: any, iIdx: number) => (
                                              <div key={iIdx} className="flex flex-wrap items-center gap-2 text-xs">
                                                <span className="font-bold text-slate-400">{iIdx + 1}.</span>
                                                {Array.isArray(item.grupo) && item.grupo.map((w: string, wIdx: number) => (
                                                  <span key={wIdx} className="px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white transition-all text-slate-700 font-medium">{w}</span>
                                                ))}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {tipo === 'unir_parejas' && d.pares && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                            <div className="space-y-2">
                                              {d.pares.map((p: any, pIdx: number) => (
                                                <div key={pIdx} className="p-2 border border-slate-200 rounded-lg bg-slate-50 font-bold">{pIdx + 1}. {p.izquierda || ''}</div>
                                              ))}
                                            </div>
                                            <div className="space-y-2">
                                              {d.pares.map((p: any, pIdx: number) => (
                                                <div key={pIdx} className="p-2 border border-slate-200 rounded-lg bg-white flex items-center gap-2">
                                                  <span className="w-8 h-6 border border-dashed border-slate-300 rounded flex items-center justify-center font-bold text-slate-400 shrink-0">(   )</span>
                                                  <span>{p.derecha || ''}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {tipo === 'completar_oraciones' && d.oraciones && (
                                          <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                                            {d.oraciones.map((o: any, oIdx: number) => (
                                              <p key={oIdx}>
                                                <span className="font-bold text-slate-400">{oIdx + 1}.</span> {String(o.texto || '').replace(/___/g, "________________")}
                                              </p>
                                            ))}
                                          </div>
                                        )}

                                        {tipo === 'ordenar_parrafos' && d.fragmentos && (
                                          <div className="space-y-3">
                                            {d.fragmentos.map((f: string, fIdx: number) => (
                                              <div key={fIdx} className="flex gap-3 items-start p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                                                <span className="w-8 h-8 border border-slate-300 rounded-lg bg-white flex items-center justify-center font-bold text-slate-400 shrink-0">[  ]</span>
                                                <p className="leading-relaxed">{f}</p>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {tipo === 'verdadero_falso' && d.items && (
                                          <div className="space-y-2 text-xs">
                                            {d.items.map((it: any, iIdx: number) => (
                                              <div key={iIdx} className="flex items-center gap-3">
                                                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-400">[ V ]  [ F ]</span>
                                                <span>{iIdx + 1}. {it.afirmacion || ''}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {tipo === 'pupiletras' && (
                                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                                            {Array.isArray(d.grid) && (
                                              <div className="grid grid-cols-10 gap-0.5 p-2 bg-slate-100 rounded-xl border border-slate-200 shrink-0 font-mono text-xs font-bold text-slate-700 mx-auto sm:mx-0">
                                                {d.grid.map((row: string[], rIdx: number) =>
                                                  Array.isArray(row) && row.map((letter: string, cIdx: number) => (
                                                    <span key={`${rIdx}-${cIdx}`} className="w-5 h-5 bg-white flex items-center justify-center border border-slate-150 rounded-sm uppercase">{letter}</span>
                                                  ))
                                                )}
                                              </div>
                                            )}
                                            <div className="text-xs space-y-2 w-full">
                                              <p className="font-bold text-slate-650">Palabras a buscar:</p>
                                              <div className="flex flex-wrap gap-1.5">
                                                {Array.isArray(d.palabras) && d.palabras.map((w: string) => (
                                                  <span key={w} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-medium">{w}</span>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {tipo === 'anagramas' && d.items && (
                                          <div className="space-y-2 text-xs">
                                            {d.items.map((it: any, iIdx: number) => (
                                              <div key={iIdx} className="flex items-center gap-3">
                                                <span className="w-20 font-bold bg-slate-50 p-1.5 rounded text-center border border-slate-200 tracking-wider">{(it.desordenada || '').toUpperCase()}</span>
                                                <span className="text-slate-350">----------------&gt;</span>
                                                <span className="flex-1 border-b border-dashed border-slate-300 h-6" />
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {tipo === 'mensajes_cifrados' && (
                                          <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                              {d.clave && Object.entries(d.clave).map(([num, letter]) => (
                                                <span key={num} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded">{num}: {String(letter)}</span>
                                              ))}
                                            </div>
                                            {/* Draw each message in a clean way */}
                                            {((d.mensajes && Array.isArray(d.mensajes)) ? d.mensajes : [{ codificado: d.mensaje_cifrado || "" }]).map((m: any, mIdx: number) => (
                                              <div key={mIdx} className="space-y-2 border-t border-slate-100/50 pt-2 first:border-t-0 first:pt-0">
                                                <p className="text-[10px] font-bold text-slate-400">Mensaje {mIdx + 1}:</p>
                                                <div className="flex flex-wrap gap-2 items-center">
                                                  {String(m.codificado || '').split(/\s+/).map((word: string, wIdx: number) => {
                                                    if (word === '/') {
                                                      return <span key={wIdx} className="mx-2 text-slate-350 font-bold">/</span>;
                                                    }
                                                    return (
                                                      <div key={wIdx} className="flex gap-1.5 items-center">
                                                        {word.split("-").map((numChar: string, cIdx: number) => (
                                                          <div key={cIdx} className="flex flex-col items-center gap-1 shrink-0">
                                                            <span className="font-bold text-[9px] text-slate-500">{numChar}</span>
                                                            <div className="w-5.5 h-5.5 border border-slate-200 rounded bg-slate-50" />
                                                          </div>
                                                        ))}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {tipo === 'clasificacion' && (
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                              {Array.isArray(d.categorias) && d.categorias.map((cat: string) => (
                                                <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden">
                                                  <div className="bg-slate-50 p-2 border-b border-slate-200 font-bold text-center text-[10px]">{cat}</div>
                                                  <div className="p-3 min-h-[80px] bg-white" />
                                                </div>
                                              ))}
                                            </div>
                                            <div className="text-xs space-y-1.5">
                                              <p className="font-bold text-slate-500">Términos a clasificar:</p>
                                              <div className="flex flex-wrap gap-1.5">
                                                {Array.isArray(d.items) && d.items.map((it: any, iIdx: number) => (
                                                  <span key={iIdx} className="px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 font-medium">{it.texto || ''}</span>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 4. TICKET DE SALIDA */}
                            {resultCj.ticket_salida && (
                              <div className="space-y-3 border-t border-slate-100 pt-5">
                                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  IV. Ticket de Salida (RICE)
                                </h3>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 space-y-3">
                                  <p className="text-xs font-semibold text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-3xs">{resultCj.ticket_salida}</p>
                                  <div className="space-y-2 pl-2">
                                    <div className="h-px border-b border-dashed border-slate-200 my-2" />
                                    <div className="h-px border-b border-dashed border-slate-200 my-2" />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 5. AUTOEVALUACIÓN (SEMÁFORO) */}
                            {resultCj.autoevaluacion && Array.isArray(resultCj.autoevaluacion) && resultCj.autoevaluacion.length > 0 && (
                              <div className="space-y-3 border-t border-slate-100 pt-5 text-xs">
                                <h3 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  V. Autoevaluación
                                </h3>
                                <div className="space-y-2">
                                  {resultCj.autoevaluacion.map((ae: string, aeIdx: number) => (
                                    <div key={aeIdx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl font-medium text-xs">
                                      <span className="text-[9px] text-slate-400 font-bold shrink-0 bg-slate-100/50 px-2 py-0.5 rounded-md border border-slate-200/40">[ Logrado ] [ En Proceso ] [ Por Lograr ]</span>
                                      <span className="text-slate-700">{ae}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 6. PAUTA DOCENTE */}
                            {resultCj.pauta_docente && (
                              <div className="space-y-4 border-t-2 border-dashed border-slate-200 pt-6 mt-6 font-sans">
                                <h3 className="text-xs font-black text-rose-750 uppercase tracking-wider">
                                  PAUTA DE CORRECCIÓN - EXCLUSIVO DOCENTE
                                </h3>
                                
                                {resultCj.pauta_docente.respuestas_desafios && Array.isArray(resultCj.pauta_docente.respuestas_desafios) && (
                                  <div className="space-y-2.5 text-xs bg-rose-50/20 border border-rose-100 p-4 rounded-xl leading-relaxed">
                                    {resultCj.pauta_docente.respuestas_desafios.map((ans: any, aIdx: number) => {
                                      const d = resultCj.desafios?.[aIdx];
                                      const formatted = formatChallengeAnswer(d, ans);
                                      return (
                                        <div key={aIdx} className="border-b border-rose-100/30 pb-2 last:border-b-0 last:pb-0">
                                          <span className="font-bold text-rose-800 uppercase tracking-wider text-[10px]">
                                            Desafío {aIdx + 1} ({d?.tipo?.replace(/_/g, ' ')}):
                                          </span>
                                          <p className="mt-0.5 text-slate-700 font-mono text-[11px] bg-white p-2 rounded border border-rose-100/50">{formatted}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          // ── NEW STRUCTURED LAYOUT ───────────────────────────
                          <div className="space-y-8">
                            
                            {/* I. GUÍA UNIVERSAL */}
                            <div className="space-y-6">
                              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    I. Guía Universal
                                  </span>
                                  <h3 className="text-sm font-black text-slate-800 mt-1">{result.contenido_json.titulo || "Guía de Aprendizaje"}</h3>
                                </div>
                                <div className="text-right text-[8px] text-slate-400 font-mono">
                                  <p>Curso: {result.nivel || curso}</p>
                                  <p>Eje: {result.contenido_json.eje || "Lectura"}</p>
                                  <p>OA: {result.contenido_json.oa_code || ""}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 border border-slate-200 p-2 rounded-lg text-[9px] text-slate-400">
                                <div>Nombre Estudiante: ___________________________</div>
                                <div className="text-right">Fecha: _________  Puntaje: ____ / ____</div>
                              </div>

                              {/* Activación */}
                              {result.contenido_json.universal.activacion && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                                    {result.contenido_json.universal.activacion.titulo || "1. Activación de Aprendizajes"}
                                  </h4>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">{result.contenido_json.universal.activacion.texto}</p>
                                  <p className="text-[11px] font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{result.contenido_json.universal.activacion.pregunta}</p>
                                  <div className="space-y-1 pl-4 pt-1">
                                    {[...Array(result.contenido_json.universal.activacion.lineas_respuesta || 3)].map((_, i) => (
                                      <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Desarrollo */}
                              {result.contenido_json.universal.desarrollo && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                                    {result.contenido_json.universal.desarrollo.titulo || "2. Lectura y Desarrollo"}
                                  </h4>
                                  <p className="text-[11px] text-slate-700 leading-relaxed bg-[#fbfbfb] p-4 rounded-xl border border-slate-100 font-serif whitespace-pre-line shadow-3xs">
                                    {result.contenido_json.universal.desarrollo.texto_principal}
                                  </p>
                                </div>
                              )}

                              {/* Actividades */}
                              {result.contenido_json.universal.actividades && (
                                <div className="space-y-4">
                                  <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                                    {result.contenido_json.universal.actividades.titulo || "3. Actividades de Comprensión"}
                                  </h4>
                                  <p className="text-[9.5px] text-slate-450 italic pl-1">{result.contenido_json.universal.actividades.instruccion}</p>
                                  
                                  {result.contenido_json.universal.actividades.preguntas?.map((p: any) => (
                                    <div key={p.numero} className="space-y-1.5 pl-2">
                                      <div className="flex items-start gap-2">
                                        <span className="px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 rounded uppercase border border-emerald-100 shrink-0">
                                          {p.nivel_cognitivo}
                                        </span>
                                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                          {p.numero}. {p.enunciado} <span className="text-slate-400 font-normal">({p.puntaje} pts)</span>
                                        </p>
                                      </div>
                                      <div className="space-y-1 pl-12">
                                        {[...Array(p.lineas_respuesta || 3)].map((_, i) => (
                                          <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                        ))}
                                      </div>
                                    </div>
                                  ))}

                                  {result.contenido_json.universal.actividades.produccion_escrita && (
                                    <div className="space-y-2 border-t border-slate-100 pt-3">
                                      <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide pl-2">
                                        {result.contenido_json.universal.actividades.produccion_escrita.titulo || "Actividad de Escritura"}
                                      </h5>
                                      {result.contenido_json.universal.actividades.produccion_escrita.instruccion && (
                                        <p className="text-[9.5px] text-slate-400 italic pl-2">{result.contenido_json.universal.actividades.produccion_escrita.instruccion}</p>
                                      )}
                                      <p className="text-[11px] text-slate-700 pl-2 leading-relaxed font-serif">
                                        {result.contenido_json.universal.actividades.produccion_escrita.consigna}
                                      </p>
                                      <p className="text-[9px] font-bold text-slate-450 pl-2">Puntaje: {result.contenido_json.universal.actividades.produccion_escrita.puntaje} puntos.</p>
                                      <div className="space-y-1 pl-12">
                                        {[...Array(result.contenido_json.universal.actividades.produccion_escrita.lineas_respuesta || 6)].map((_, i) => (
                                          <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Cierre */}
                              {result.contenido_json.universal.cierre && (
                                <div className="space-y-4 border-t border-slate-100 pt-3">
                                  <h4 className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">
                                    {result.contenido_json.universal.cierre.titulo || "4. Cierre de la Sesión"}
                                  </h4>
                                  
                                  {result.contenido_json.universal.cierre.ticket_salida && (
                                    <div className="space-y-1 pl-2">
                                      <p className="text-[11px] font-bold text-slate-800">
                                        Ticket de Salida: {result.contenido_json.universal.cierre.ticket_salida.pregunta}
                                      </p>
                                      <div className="space-y-1 pl-12">
                                        {[...Array(result.contenido_json.universal.cierre.ticket_salida.lineas_respuesta || 2)].map((_, i) => (
                                          <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {result.contenido_json.universal.cierre.metacognicion && (
                                    <div className="space-y-1 pl-2">
                                      <p className="text-[10px] font-bold text-slate-500">Preguntas para reflexionar:</p>
                                      {result.contenido_json.universal.cierre.metacognicion.map((m: string, i: number) => (
                                        <p key={i} className="text-[10px] text-slate-600 leading-tight">• {m}</p>
                                      ))}
                                    </div>
                                  )}

                                  {result.contenido_json.universal.cierre.autoevaluacion && (
                                    <div className="space-y-1.5 pl-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                                      <p className="text-[10px] font-bold text-slate-500">Autoevaluación (Semáforo):</p>
                                      {result.contenido_json.universal.cierre.autoevaluacion.map((ae: string, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                                          <div className="flex gap-0.5 shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                            <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                            <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                          </div>
                                          <span>{ae}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* II. ADAPTACIÓN DUA (si existe) */}
                            {result.contenido_json.dua && (
                              <div className="space-y-6 border-t-2 border-dashed border-violet-200 pt-6">
                                <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                                  <div className="space-y-0.5">
                                    <span className="text-[9px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 tracking-wider uppercase">
                                      II. Adaptación DUA
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 mt-1">Guía Adaptada DUA</h3>
                                  </div>
                                  <div className="text-right text-[8px] text-slate-400 font-mono">
                                    <p>Apoyo Diversificado</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border border-slate-200 p-2 rounded-lg text-[9px] text-slate-400">
                                  <div>Nombre Estudiante: ___________________________</div>
                                  <div className="text-right">Fecha: _________  Puntaje: ____ / ____</div>
                                </div>

                                {/* Vocabulario de Apoyo */}
                                {result.contenido_json.dua.vocabulario_apoyo && result.contenido_json.dua.vocabulario_apoyo.length > 0 && (
                                  <div className="space-y-2 bg-violet-50/20 p-3 rounded-xl border border-violet-100/50">
                                    <h5 className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wide">
                                      Glosario de Apoyo
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                      {result.contenido_json.dua.vocabulario_apoyo.map((w: any, i: number) => (
                                        <div key={i} className="bg-white border border-slate-100 p-2 rounded-lg">
                                          <strong>{w.palabra}:</strong> {w.definicion}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Activación DUA */}
                                {result.contenido_json.dua.activacion && (
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                                      {result.contenido_json.dua.activacion.titulo || "1. Activación de Aprendizajes"}
                                    </h4>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{result.contenido_json.dua.activacion.texto_simplificado}</p>
                                    <p className="text-[11px] font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{result.contenido_json.dua.activacion.pregunta_andamiada}</p>
                                    {result.contenido_json.dua.activacion.pista_ayuda && (
                                      <p className="text-[9.5px] text-violet-650 italic pl-1">💡 Ayuda: {result.contenido_json.dua.activacion.pista_ayuda}</p>
                                    )}
                                    <div className="space-y-1 pl-4 pt-1">
                                      {[...Array(result.contenido_json.dua.activacion.lineas_respuesta || 2)].map((_, i) => (
                                        <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Desarrollo DUA */}
                                {result.contenido_json.dua.desarrollo && (
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                                      {result.contenido_json.dua.desarrollo.titulo || "2. Lectura con Apoyo"}
                                    </h4>
                                    <p className="text-[11px] text-slate-700 leading-relaxed bg-[#fbfbfb] p-4 rounded-xl border border-slate-100 font-serif whitespace-pre-line shadow-3xs">
                                      {result.contenido_json.dua.desarrollo.texto_principal}
                                    </p>
                                    {result.contenido_json.dua.desarrollo.apoyo_visual_desc && (
                                      <div className="border border-dashed border-violet-300 p-2.5 rounded-lg bg-violet-50/10 text-[9.5px] text-slate-600 pl-3">
                                        🎨 <strong>Organizador Visual:</strong> {result.contenido_json.dua.desarrollo.apoyo_visual_desc}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Actividades DUA */}
                                {result.contenido_json.dua.actividades && (
                                  <div className="space-y-4">
                                    <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                                      {result.contenido_json.dua.actividades.titulo || "3. Actividades de Comprensión"}
                                    </h4>
                                    <p className="text-[9.5px] text-slate-450 italic pl-1">{result.contenido_json.dua.actividades.instruccion_simplificada}</p>

                                    {result.contenido_json.dua.actividades.preguntas?.map((p: any) => (
                                      <div key={p.numero} className="space-y-1.5 pl-2">
                                        <div className="flex items-start gap-2">
                                          <span className="px-1.5 py-0.5 text-[8px] font-bold text-violet-700 bg-violet-50 rounded uppercase border border-violet-100 shrink-0">
                                            {p.nivel_cognitivo}
                                          </span>
                                          <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                            {p.numero}. {p.enunciado} <span className="text-slate-400 font-normal">({p.puntaje} pts)</span>
                                          </p>
                                        </div>
                                        
                                        {p.opciones_alternativas && (
                                          <div className="pl-12 space-y-1">
                                            {p.opciones_alternativas.map((opt: string, i: number) => (
                                              <div key={i} className="text-[10px] text-slate-650 flex items-center gap-1.5">
                                                <div className="w-3 h-3 rounded-full border border-slate-350 shrink-0"></div>
                                                <span>{opt}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {p.pista_ayuda && (
                                          <p className="text-[9px] text-violet-650 italic pl-12">💡 Pista: {p.pista_ayuda}</p>
                                        )}
                                        {p.inicio_respuesta && (
                                          <p className="text-[9px] text-slate-450 pl-12 font-mono">Respuesta sugerida: "{p.inicio_respuesta}..."</p>
                                        )}

                                        <div className="space-y-1 pl-12">
                                          {[...Array(p.lineas_respuesta || 2)].map((_, i) => (
                                            <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                          ))}
                                        </div>
                                      </div>
                                    ))}

                                    {result.contenido_json.dua.actividades.produccion_escrita && (
                                      <div className="space-y-2 border-t border-slate-100 pt-3">
                                        <h5 className="text-[10px] font-bold text-violet-600 uppercase tracking-wide pl-2">
                                          {result.contenido_json.dua.actividades.produccion_escrita.titulo || "Actividad de Expresión Adaptada"}
                                        </h5>
                                        {result.contenido_json.dua.actividades.produccion_escrita.instruccion_simplificada && (
                                          <p className="text-[9.5px] text-slate-400 italic pl-2">{result.contenido_json.dua.actividades.produccion_escrita.instruccion_simplificada}</p>
                                        )}
                                        <p className="text-[11px] text-slate-700 pl-2 leading-relaxed font-serif">
                                          {result.contenido_json.dua.actividades.produccion_escrita.consigna_adaptada}
                                        </p>
                                        {result.contenido_json.dua.actividades.produccion_escrita.opciones_expresion && (
                                          <div className="pl-2 pr-2 text-[9.5px] font-bold text-violet-700 bg-violet-50 p-2 rounded border border-violet-100/50 leading-relaxed">
                                            🎨 {result.contenido_json.dua.actividades.produccion_escrita.opciones_expresion}
                                          </div>
                                        )}
                                        <p className="text-[9px] font-bold text-slate-450 pl-2">Puntaje: {result.contenido_json.dua.actividades.produccion_escrita.puntaje} puntos.</p>
                                        <div className="space-y-1 pl-12">
                                          {[...Array(result.contenido_json.dua.actividades.produccion_escrita.lineas_respuesta || 4)].map((_, i) => (
                                            <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Cierre DUA */}
                                {result.contenido_json.dua.cierre && (
                                  <div className="space-y-4 border-t border-slate-100 pt-3">
                                    <h4 className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide">
                                      {result.contenido_json.dua.cierre.titulo || "4. Cierre y Autoevaluación"}
                                    </h4>

                                    {result.contenido_json.dua.cierre.ticket_salida && (
                                      <div className="space-y-1 pl-2">
                                        <p className="text-[11px] font-bold text-slate-800">
                                          Ticket de Salida Adaptado: {result.contenido_json.dua.cierre.ticket_salida.pregunta_andamiada || result.contenido_json.dua.cierre.ticket_salida.pregunta}
                                        </p>
                                        {result.contenido_json.dua.cierre.ticket_salida.pista_ayuda && (
                                          <p className="text-[9px] text-violet-650 italic pl-6">💡 Ayuda: {result.contenido_json.dua.cierre.ticket_salida.pista_ayuda}</p>
                                        )}
                                        <div className="space-y-1 pl-12">
                                          {[...Array(result.contenido_json.dua.cierre.ticket_salida.lineas_respuesta || 2)].map((_, i) => (
                                            <div key={i} className="h-px border-b border-dashed border-slate-200 my-2" />
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {result.contenido_json.dua.cierre.metacognicion && (
                                      <div className="space-y-1 pl-2">
                                        <p className="text-[10px] font-bold text-slate-500">Preguntas para reflexionar:</p>
                                        {result.contenido_json.dua.cierre.metacognicion.map((m: string, i: number) => (
                                          <p key={i} className="text-[10px] text-slate-600 leading-tight">• {m}</p>
                                        ))}
                                      </div>
                                    )}

                                    {result.contenido_json.dua.cierre.autoevaluacion && (
                                      <div className="space-y-1.5 pl-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                                        <p className="text-[10px] font-bold text-slate-500">Autoevaluación (Semáforo):</p>
                                        {result.contenido_json.dua.cierre.autoevaluacion.map((ae: string, i: number) => (
                                          <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                                            <div className="flex gap-0.5 shrink-0">
                                              <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                              <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                              <div className="w-2.5 h-2.5 rounded-full border border-slate-350 bg-white"></div>
                                            </div>
                                            <span>{ae}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* III. PAUTA DOCENTE */}
                            <div className="space-y-6 border-t-2 border-dashed border-rose-200 pt-6 bg-rose-50/15 p-4 rounded-2xl">
                              <div className="border-b border-rose-200 pb-2">
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 tracking-wider uppercase">
                                  PAUTA DE CORRECCIÓN DOCENTE (Exclusivo Docente)
                                </span>
                                <h3 className="text-sm font-black text-slate-800 mt-1">Respuestas y Criterios</h3>
                              </div>

                              {/* Pauta Universal */}
                              {result.contenido_json.universal.pauta_docente && (
                                <div className="space-y-4">
                                  <h4 className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wide">Pauta: Guía Universal</h4>
                                  {result.contenido_json.universal.pauta_docente.respuestas_preguntas?.map((ans: any) => (
                                    <div key={ans.numero} className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                                      <p className="font-bold text-slate-800">Pregunta {ans.numero}</p>
                                      <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {ans.respuesta_correcta}</p>
                                      {ans.criterios_evaluacion && <p className="text-slate-500 italic">Criterios: {ans.criterios_evaluacion}</p>}
                                    </div>
                                  ))}
                                  {result.contenido_json.universal.pauta_docente.respuesta_produccion && (
                                    <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                                      <p className="font-bold text-slate-800">Actividad de Escritura</p>
                                      <p className="text-slate-650"><strong>Respuesta Modelo:</strong> {result.contenido_json.universal.pauta_docente.respuesta_produccion.respuesta_modelo}</p>
                                      {result.contenido_json.universal.pauta_docente.respuesta_produccion.criterios_evaluacion && (
                                        <p className="text-slate-500 italic">Criterios: {result.contenido_json.universal.pauta_docente.respuesta_produccion.criterios_evaluacion}</p>
                                      )}
                                    </div>
                                  )}
                                  {result.contenido_json.universal.pauta_docente.respuesta_ticket && (
                                    <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                                      <p className="font-bold text-slate-800">Ticket de Salida</p>
                                      <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {result.contenido_json.universal.pauta_docente.respuesta_ticket.respuesta_correcta}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Pauta DUA */}
                              {result.contenido_json.dua && result.contenido_json.dua.pauta_docente && (
                                <div className="space-y-4 pt-2 border-t border-rose-100">
                                  <h4 className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wide">Pauta: Adaptación DUA</h4>
                                  {result.contenido_json.dua.pauta_docente.respuestas_preguntas?.map((ans: any) => (
                                    <div key={ans.numero} className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                                      <p className="font-bold text-slate-800">Pregunta {ans.numero}</p>
                                      <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {ans.respuesta_correcta}</p>
                                      {ans.criterios_evaluacion && <p className="text-slate-500 italic">Criterios: {ans.criterios_evaluacion}</p>}
                                    </div>
                                  ))}
                                  {result.contenido_json.dua.pauta_docente.respuesta_produccion && (
                                    <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                                      <p className="font-bold text-slate-800">Actividad de Expresión Adaptada</p>
                                      <p className="text-slate-650"><strong>Respuesta Modelo:</strong> {result.contenido_json.dua.pauta_docente.respuesta_produccion.respuesta_modelo}</p>
                                      {result.contenido_json.dua.pauta_docente.respuesta_produccion.criterios_evaluacion && (
                                        <p className="text-slate-500 italic">Criterios: {result.contenido_json.dua.pauta_docente.respuesta_produccion.criterios_evaluacion}</p>
                                      )}
                                    </div>
                                  )}
                                  {result.contenido_json.dua.pauta_docente.respuesta_ticket && (
                                    <div className="text-[10px] space-y-1 bg-white p-2 rounded border border-rose-100">
                                      <p className="font-bold text-slate-800">Ticket de Salida Adaptado</p>
                                      <p className="text-slate-650"><strong>Respuesta Esperada:</strong> {result.contenido_json.dua.pauta_docente.respuesta_ticket.respuesta_correcta}</p>
                                    </div>
                                  )}
                                </div>
                              )}
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

      </div>{/* closes flex-1 lg:pl-64 */}

      {/* ── MODAL: PROMPT PARA IMÁGENES IA ── */}


      {/* ── Modal DUA Real páginas — Guia ──────────────────────────────────── */}
      {showDuaRealModal && duaRealPages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-800">🧩 Prompts DUA — Guía</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {duaRealPages.length} páginas DUA · texto simplificado · actividades reducidas · 3 principios
                </p>
              </div>
              <button
                onClick={() => setShowDuaRealModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <p className="text-[10px] text-indigo-700">
                  Pega el prompt de <strong>cada página por separado</strong> en ChatGPT o Gemini. El contenido ya está incluido — no necesitas adjuntar el PDF.
                </p>
              </div>
              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {duaRealLabels.map((lbl, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setDuaRealViewIdx(idx); setDuaRealPageCopied(false); }}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all ${
                      duaRealViewIdx === idx
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300'
                    }`}
                  >
                    {idx + 1}. {lbl}
                  </button>
                ))}
              </div>
              {/* Navegación */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setDuaRealViewIdx(i => Math.max(0, i - 1)); setDuaRealPageCopied(false); }}
                  disabled={duaRealViewIdx === 0}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  ← Anterior
                </button>
                <span className="text-[10px] font-bold text-slate-500">
                  📄 {duaRealViewIdx + 1} / {duaRealPages.length}
                </span>
                <button
                  onClick={() => { setDuaRealViewIdx(i => Math.min(duaRealPages.length - 1, i + 1)); setDuaRealPageCopied(false); }}
                  disabled={duaRealViewIdx === duaRealPages.length - 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                >
                  Siguiente →
                </button>
              </div>
              {/* Contenido */}
              <pre className="text-[10px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-72 overflow-y-auto">
                {duaRealPages[duaRealViewIdx] ?? 'Cargando...'}
              </pre>
              {/* Botones */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(duaRealPages[duaRealViewIdx] ?? '');
                    setDuaRealPageCopied(true); setDuaRealAllCopied(false);
                    setTimeout(() => setDuaRealPageCopied(false), 2000);
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all"
                >
                  {duaRealPageCopied ? '✅ Copiado' : '📋 Copiar este prompt'}
                </button>
                <button
                  onClick={() => {
                    const todo = duaRealPages.map((p, i) =>
                      `═══ PÁGINA ${i + 1}: ${duaRealLabels[i] || ''} ═══\n\n${p || ''}`
                    ).join('\n\n');
                    navigator.clipboard.writeText(todo);
                    setDuaRealAllCopied(true); setDuaRealPageCopied(false);
                    setTimeout(() => setDuaRealAllCopied(false), 2000);
                  }}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all"
                >
                  {duaRealAllCopied ? '✅ Copiado todo' : '📄 Copiar todos los prompts'}
                </button>
              </div>
              <p className="text-center text-[9px] text-slate-400">
                Pega cada prompt en ChatGPT o Gemini — el contenido ya está incluido en el prompt
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal DUA Guía ──────────────────────────────────────────────────── */}
      {showDuaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-800">🎨 Versión Visual — Guía</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {duaPages.length} prompt{duaPages.length !== 1 ? 's' : ''} listo{duaPages.length !== 1 ? 's' : ''} — pega cada uno en ChatGPT, Gemini o Canva
                </p>
              </div>
              {!duaGenerating && (
                <button
                  onClick={() => setShowDuaModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {duaPages.length > 0 && (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {duaLabels.map((lbl, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setDuaViewIdx(idx); setDuaPageCopied(false); }}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all ${
                          duaViewIdx === idx
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-300'
                        }`}
                      >
                        {idx + 1}. {lbl}
                      </button>
                    ))}
                  </div>

                  {/* Navegación */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setDuaViewIdx(i => Math.max(0, i - 1)); setDuaPageCopied(false); }}
                      disabled={duaViewIdx === 0}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                      ← Anterior
                    </button>
                    <span className="text-[10px] font-bold text-slate-500">
                      📄 {duaViewIdx + 1} / {duaPages.length}
                    </span>
                    <button
                      onClick={() => { setDuaViewIdx(i => Math.min(duaPages.length - 1, i + 1)); setDuaPageCopied(false); }}
                      disabled={duaViewIdx === duaPages.length - 1}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                    >
                      Siguiente →
                    </button>
                  </div>

                  {/* Contenido */}
                  <pre className="text-[10px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-72 overflow-y-auto">
                    {duaPages[duaViewIdx] ?? 'Cargando...'}
                  </pre>

                  {/* Botones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(duaPages[duaViewIdx] ?? '');
                        setDuaPageCopied(true); setDuaAllCopied(false);
                        setTimeout(() => setDuaPageCopied(false), 2000);
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all"
                    >
                      {duaPageCopied ? '✅ Copiado' : '📋 Copiar este prompt'}
                    </button>
                    <button
                      onClick={() => {
                        const todo = duaPages.map((p, i) =>
                          `═══ PÁGINA ${i + 1}: ${duaLabels[i] || ''} ═══\n\n${p || ''}`
                        ).join('\n\n');
                        navigator.clipboard.writeText(todo);
                        setDuaAllCopied(true); setDuaPageCopied(false);
                        setTimeout(() => setDuaAllCopied(false), 2000);
                      }}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all"
                    >
                      {duaAllCopied ? '✅ Copiado todo' : '📄 Copiar todos los prompts'}
                    </button>
                  </div>

                  <p className="text-center text-[9px] text-slate-400">
                    Pega cada prompt en ChatGPT, Gemini o Canva para generar la página ilustrada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



    </div>
  );
}

