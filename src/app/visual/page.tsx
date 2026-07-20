'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Download,
  Save,
  Sparkles,
  Upload,
  X,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Clock,
  Lock,
  Zap,
  BookOpen,
  Sliders,
  Sparkle,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

// ─── Types ────────────────────────────────────────────────────────────────────

type BackendTipo = 'infografia' | 'linea_tiempo' | 'flashcards' | 'afiche';

interface FormatoOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

interface RecursoVisual {
  id: string;
  tema: string;
  tipo: BackendTipo;
  imagen_url?: string | null;
  html_fallback?: string | null;
  contenido_json?: any;
  created_at: string;
}

interface GenerateResult {
  id?: string;
  imagen_url?: string | null;
  html_fallback?: string | null;
  tipo: BackendTipo;
  contenido_json?: any;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHILEAN_COURSES = [
  '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico',
  '7° Básico', '8° Básico', '1° Medio', '2° Medio', '3° Medio', '4° Medio'
];

const FORMATOS: FormatoOption[] = [
  { id: 'infografia', label: 'Infografía', emoji: '📊', description: 'Datos y conceptos organizados en un panel visual.' },
  { id: 'linea_de_tiempo', label: 'Línea de Tiempo', emoji: '📅', description: 'Cronología paso a paso de sucesos o procesos históricos.' },
  { id: 'flashcards', label: 'Flashcards', emoji: '🃏', description: 'Tarjetas didácticas interactivas con términos y definiciones.' },
  { id: 'afiche', label: 'Afiche', emoji: '📌', description: 'Cartel informativo o publicitario pedagógico con mensaje directo.' },
];

const ESTILOS = [
  { id: 'editorial_clean', label: 'Editorial Clean', emoji: '📰', desc: 'Limpio, profesional, jerarquía de texto estricta y espacio generoso.', ideal: 'Clases formales' },
  { id: 'notebooklm', label: 'NotebookLM Docente', emoji: '📓', desc: 'Papel punteado claro, personajes planos, insignias [PRESENTACIÓN].', ideal: 'Lectura, análisis didáctico' },
  { id: 'canva_educativo', label: 'Canva Educativo', emoji: '🎨', desc: 'Tarjetas de colores, iconografía amigable y modular.', ideal: 'Recursos dinámicos' },
  { id: 'futuro_tech', label: 'Futuro Tech / Dark', emoji: '🚀', desc: 'Fondo oscuro, acentos cian/magenta/violeta luminosos.', ideal: 'Ciencia, IA, tecnología' },
  { id: 'sketchnote', label: 'Sketchnote / Mano', emoji: '✏️', desc: 'Trazos a mano alzada, tipografía caligráfica, textura de cuaderno.', ideal: 'Procesos humanos' },
  { id: 'roadmap', label: 'Roadmap / Tiempo', emoji: '🗺️', desc: 'Estética cronológica con datos estructurados y mini gráficos.', ideal: 'Procesos históricos' },
  { id: 'para_pequenos', label: 'Para pequeños', emoji: '🧸', desc: 'Colores pasteles, ilustraciones redondeadas, tipografía lúdica.', ideal: 'Educación inicial' },
  { id: 'revista_visual', label: 'Revista / Narrativo', emoji: '📖', desc: 'Titulares dramáticos, maquetación editorial tipo viaje.', ideal: 'Storytelling' }
];

const PALETAS = [
  { id: 'elegante_institucional', label: 'Elegante Institucional', colors: ['#0F172A', '#0284C7', '#FFFFFF', '#F8FAFC'], desc: 'Azul noche, cian y blanco.' },
  { id: 'canva_educativo', label: 'Canva Educativo', colors: ['#06B6D4', '#F43F5E', '#FFFBEB', '#FFFFFF'], desc: 'Turquesa, coral y amarillo.' },
  { id: 'tierra_premium', label: 'Tierra Premium', colors: ['#854D0E', '#C2410C', '#FAF7F2', '#EFEAE2'], desc: 'Arena, terracota y oliva.' },
  { id: 'dark_tech', label: 'Dark Tech', colors: ['#06B6D4', '#D946EF', '#090D16', '#1E293B'], desc: 'Negro carbón, cian y magenta.' },
  { id: 'minimal_luxury', label: 'Minimal Luxury', colors: ['#D4AF37', '#1E1E1E', '#FFFFFF', '#F3F4F6'], desc: 'Blanco, negro y dorado.' },
  { id: 'alto_contraste', label: 'Alto Contraste', colors: ['#000000', '#EF4444', '#FFFFFF', '#E5E7EB'], desc: 'Negro, blanco y acento rojo.' },
  { id: 'humana_suave', label: 'Humana Suave', colors: ['#8B5CF6', '#EC4899', '#FAF5FF', '#F3E8FF'], desc: 'Rosa suave, lavanda y crema.' }
];

const FORMATOS_ESTILO = [
  { id: 'infografia_vertical', label: 'Infografía Vertical', emoji: '📊', desc: 'Diseño alargado vertical ideal para posters.' },
  { id: 'linea_tiempo_horizontal', label: 'Línea de Tiempo Horiz.', emoji: '📅', desc: 'Eje temporal distribuido horizontalmente.' },
  { id: 'mapa_conceptual', label: 'Mapa Conceptual', emoji: '🧠', desc: 'Red de conceptos jerárquicos conectados.' },
  { id: 'cuadrado', label: 'Cuadrado', emoji: '⬜', desc: 'Formato equilibrado 1:1 para fichas.' }
];

// Map frontend and legacy formats to the 4 supported backend types
const TIPO_MAPPING: Record<string, BackendTipo> = {
  infografia: 'infografia',
  linea_de_tiempo: 'linea_tiempo',
  linea_tiempo: 'linea_tiempo',
  flashcards: 'flashcards',
  afiche: 'afiche',
  organizador_grafico: 'infografia',
  mapa_conceptual: 'infografia',
  cuadro_comparativo: 'infografia',
  mini_libro: 'flashcards',
};

const LOADING_STEPS = [
  'Configurando contexto pedagógico...',
  'Generando estructura de contenido educativo...',
  'Diseñando paleta y composición del recurso...',
  'Renderizando imagen final...',
];

// ─── Browser Export Helpers ──────────────────────────────────────────────────

const exportToWord = async (result: GenerateResult, temaOriginal: string) => {
  if (!result || !result.contenido_json) return;
  const data = result.contenido_json;
  const tipo = TIPO_MAPPING[result.tipo] || result.tipo;

  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: data.titulo || temaOriginal || 'Recurso Visual Educativo',
          bold: true,
          size: 32,
          color: '2D3748',
        }),
      ],
    })
  );

  // Subtitle
  if (data.subtitulo) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: data.subtitulo,
            italics: true,
            size: 24,
            color: '4A5568',
          }),
        ],
      })
    );
  }

  // Format Specific Rendering
  if (tipo === 'infografia') {
    if (data.secciones && Array.isArray(data.secciones)) {
      data.secciones.forEach((sec: any) => {
        children.push(
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: sec.titulo || 'Sección',
                bold: true,
                size: 24,
                color: '7C3AED', // purple-600
              }),
            ],
          })
        );
        if (sec.puntos && Array.isArray(sec.puntos)) {
          sec.puntos.forEach((pt: string) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: pt,
                    size: 22,
                  }),
                ],
              })
            );
          });
        }
      });
    }
    if (data.conclusion) {
      children.push(
        new Paragraph({
          spacing: { before: 360, after: 120 },
          children: [
            new TextRun({
              text: 'Conclusión',
              bold: true,
              size: 24,
              color: '2D3748',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: data.conclusion,
              size: 22,
            }),
          ],
        })
      );
    }
  } else if (tipo === 'linea_tiempo') {
    if (data.eventos && Array.isArray(data.eventos)) {
      data.eventos.forEach((evt: any) => {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `[${evt.año || ''}] ${evt.titulo || ''}`,
                bold: true,
                size: 24,
                color: '7C3AED',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: evt.descripcion || '',
                size: 22,
              }),
            ],
          })
        );
      });
    }
  } else if (tipo === 'flashcards') {
    if (data.tarjetas && Array.isArray(data.tarjetas)) {
      data.tarjetas.forEach((crd: any, idx: number) => {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: `Tarjeta ${idx + 1}: ${crd.termino || ''}`,
                bold: true,
                size: 24,
                color: '7C3AED',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `Definición: `,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: crd.definicion || '',
                size: 22,
              }),
            ],
          })
        );
        if (crd.ejemplo) {
          children.push(
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: `Ejemplo: `,
                  bold: true,
                  size: 22,
                  italics: true,
                }),
                new TextRun({
                  text: crd.ejemplo,
                  size: 22,
                  italics: true,
                }),
              ],
            })
          );
        }
      });
    }
  } else if (tipo === 'afiche') {
    if (data.mensaje_central) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({
              text: 'Mensaje Central:',
              bold: true,
              size: 24,
              color: '7C3AED',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: data.mensaje_central,
              size: 24,
              italics: true,
            }),
          ],
        })
      );
    }
    if (data.puntos_clave && Array.isArray(data.puntos_clave)) {
      data.puntos_clave.forEach((pt: string) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: pt,
                size: 22,
              }),
            ],
          })
        );
      });
    }
    if (data.llamada_accion) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: `Llamada a la Acción: ${data.llamada_accion}`,
              bold: true,
              size: 22,
              color: 'E11D48',
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recurso-visual-${tipo}.docx`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToPdf = async (result: GenerateResult, temaOriginal: string) => {
  if (!result) return;
  const doc = new jsPDF();
  const tipo = TIPO_MAPPING[result.tipo] || result.tipo;

  doc.setFont("helvetica", "normal");
  let y = 20;
  const margin = 20;
  const width = doc.internal.pageSize.getWidth() - 2 * margin;

  const addText = (text: string, size: number, style = "normal", color = "default") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    if (color === "violet") {
      doc.setTextColor(124, 58, 237);
    } else if (color === "gray") {
      doc.setTextColor(100, 116, 139);
    } else {
      doc.setTextColor(30, 41, 59);
    }

    const lines = doc.splitTextToSize(text, width);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += size * 0.4 + 4;
    });
  };

  const data = result.contenido_json;

  if (data) {
    // Title
    addText(data.titulo || temaOriginal || 'Recurso Visual', 20, "bold", "default");
    y += 4;

    // Subtitle
    if (data.subtitulo) {
      addText(data.subtitulo, 13, "italic", "gray");
      y += 4;
    }

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
    y += 10;

    if (tipo === 'infografia') {
      if (data.secciones && Array.isArray(data.secciones)) {
        data.secciones.forEach((sec: any) => {
          addText(sec.titulo || 'Sección', 14, "bold", "violet");
          y += 2;
          if (sec.puntos && Array.isArray(sec.puntos)) {
            sec.puntos.forEach((pt: string) => {
              addText(`• ${pt}`, 11, "normal", "default");
            });
          }
          y += 4;
        });
      }
      if (data.conclusion) {
        addText('Conclusión', 14, "bold", "default");
        y += 2;
        addText(data.conclusion, 11, "normal", "default");
      }
    } else if (tipo === 'linea_tiempo') {
      if (data.eventos && Array.isArray(data.eventos)) {
        data.eventos.forEach((evt: any) => {
          addText(`[${evt.año || ''}] ${evt.titulo || ''}`, 13, "bold", "violet");
          y += 2;
          addText(evt.descripcion || '', 11, "normal", "default");
          y += 4;
        });
      }
    } else if (tipo === 'flashcards') {
      if (data.tarjetas && Array.isArray(data.tarjetas)) {
        data.tarjetas.forEach((crd: any, idx: number) => {
          addText(`Tarjeta ${idx + 1}: ${crd.termino || ''}`, 13, "bold", "violet");
          y += 2;
          addText(`Definición: ${crd.definicion || ''}`, 11, "normal", "default");
          if (crd.ejemplo) {
            addText(`Ejemplo: ${crd.ejemplo}`, 11, "italic", "gray");
          }
          y += 4;
        });
      }
    } else if (tipo === 'afiche') {
      if (data.mensaje_central) {
        addText('Mensaje Central', 13, "bold", "violet");
        y += 2;
        addText(data.mensaje_central, 14, "italic", "default");
        y += 4;
      }
      if (data.puntos_clave && Array.isArray(data.puntos_clave)) {
        data.puntos_clave.forEach((pt: string) => {
          addText(`• ${pt}`, 11, "normal", "default");
        });
        y += 4;
      }
      if (data.llamada_accion) {
        addText(`Llamada a la Acción: ${data.llamada_accion}`, 12, "bold", "violet");
      }
    }
  } else {
    addText(temaOriginal || 'Recurso Visual', 18, "bold");
    y += 10;
    if (result.html_fallback) {
      const cleanText = result.html_fallback.replace(/<[^>]*>/g, '');
      addText(cleanText, 11);
    }
  }

  doc.save(`recurso-visual-${tipo}.pdf`);
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VisualPage() {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth & User Details
  const [authLoading, setAuthLoading] = useState(true);
  const [initials, setInitials] = useState('U');

  // Input fields
  const [origen, setOrigen] = useState<'tema' | 'kit' | 'planificacion' | 'lectura'>('tema');
  const [selectedPlanningId, setSelectedPlanningId] = useState<string>('');
  const [plannings, setPlannings] = useState<any[]>([]);
  const [lecturas, setLecturas] = useState<any[]>([]);
  const [selectedLecturaId, setSelectedLecturaId] = useState<string>('');

  const [curso, setCurso] = useState('5° Básico');
  const [unidad, setUnidad] = useState('');
  const [oa, setOa] = useState('');
  const [tema, setTema] = useState('');
  const [estilo, setEstilo] = useState<string>('editorial_clean');
  const [paleta, setPaleta] = useState<string>('elegante_institucional');
  const [formatoLayout, setFormatoLayout] = useState<string>('infografia_vertical');
  const [formato, setFormato] = useState<string>('infografia');
  const [wizardStep, setWizardStep] = useState(1);

  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Generation States
  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // History List
  const [history, setHistory] = useState<RecursoVisual[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'trial_expired' | 'limit_reached'>('limit_reached');
  const [upgradePlanStatus, setUpgradePlanStatus] = useState<'trial' | 'active'>('trial');
  const [upgradeRenewalDate, setUpgradeRenewalDate] = useState<string | null>(null);
  const [upgradeLimit, setUpgradeLimit] = useState<number>(15);

  // ── Auth Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
      const email = user?.email || '';
      const initLetters = fullName
        ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : (email ? email[0].toUpperCase() : 'U');
      setInitials(initLetters);

      // Load plannings
      try {
        const { data: planningsData } = await supabase
          .from('plannings')
          .select('id, unit, subject, grade, learning_objective')
          .order('created_at', { ascending: false });
        setPlannings(planningsData || []);
        if (planningsData && planningsData.length > 0) {
          setSelectedPlanningId(planningsData[0].id);
        }
      } catch (err) {
        console.warn('Error loading plannings:', err);
      }

      // Load lecturas REI
      try {
        const { data: lecturasData } = await supabase
          .from('lecturas_docente')
          .select('id, titulo_manual, libro_id, biblioteca_libros(titulo, autor, resumen, temas, personajes)')
          .order('created_at', { ascending: false });
        setLecturas(lecturasData || []);
        if (lecturasData && lecturasData.length > 0) {
          setSelectedLecturaId(lecturasData[0].id);
        }
      } catch (err) {
        console.warn('Error loading lecturas:', err);
      }

      setAuthLoading(false);
      fetchHistory();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ── Fetch History ─────────────────────────────────────────────────────────
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/recursos-visuales?limit=10');
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : data?.recursos ?? []);
      }
    } catch {
      // Non-fatal
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Generate Handler ──────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const hasTema = tema.trim().length > 0;
    const hasPlan = (origen === 'kit' || origen === 'planificacion') && selectedPlanningId;
    const hasLectura = origen === 'lectura' && selectedLecturaId;
    if (!hasTema && !hasPlan && !hasLectura) return;

    setGenerating(true);
    setGenError(null);
    setResult(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2000);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      let finalTema = tema.trim();
      let finalCurso = curso;
      let finalUnidad = unidad;
      let finalOa = oa;

      if ((origen === 'kit' || origen === 'planificacion') && selectedPlanningId) {
        const plan = plannings.find(p => p.id === selectedPlanningId);
        if (plan) {
          finalCurso = plan.grade;
          finalUnidad = plan.unit;
          finalOa = plan.learning_objective;
          finalTema = `Recurso visual didáctico sobre: ${plan.unit}. Asignatura: ${plan.subject}. Objetivo de Aprendizaje: ${plan.learning_objective}.`;
        }
      }

      if (origen === 'lectura' && selectedLecturaId) {
        const lec = lecturas.find((l: any) => l.id === selectedLecturaId);
        if (lec) {
          const libro = lec.biblioteca_libros as any;
          finalCurso = curso;
          finalUnidad = `Lectura Domiciliaria: ${libro?.titulo || lec.titulo_manual}`;
          finalOa = oa;
          finalTema = `Recurso visual para lectura domiciliaria del libro "${libro?.titulo || lec.titulo_manual}" de ${libro?.autor || ''}. Resumen: ${libro?.resumen || ''}. Temas centrales: ${(libro?.temas || []).join(', ')}. Personajes principales: ${(libro?.personajes || []).map((p: any) => typeof p === 'string' ? p : p.nombre).slice(0, 4).join(', ')}.`;
        }
      }

      // ⚠️ MVP Temporary Workaround ⚠️
      // To satisfy visual finalization without modifying the API endpoint logic,
      // we inject the Curso, Unidad, OA, and Estilo metadata directly into the 'tema' prompt.
      // The backend accepts the prompt as the sole 'tema' parameter and sends it to Claude.
      const promptInject = `
[CONFIGURACIÓN PEDAGÓGICA MVP]
- Origen: ${origen}
- Curso: ${finalCurso}
- Unidad: ${finalUnidad || 'No especificada'}
- OA: ${finalOa || 'No especificado'}
- Estilo: ${estilo}
- Paleta: ${paleta}
- Formato Eje3: ${FORMATOS_ESTILO.find(f => f.id === formatoLayout)?.label || formatoLayout}
- Formato original: ${FORMATOS.find(f => f.id === formato)?.label || formato}

[TEMA PRINCIPAL]
${finalTema}
`.trim();

      const mappedTipo = TIPO_MAPPING[formato] || 'infografia';

      const formData = new FormData();
      formData.append('tema', promptInject);
      formData.append('tipo', mappedTipo);
      formData.append('estilo', estilo);
      formData.append('paleta', paleta);
      formData.append('formatoLayout', formatoLayout);
      if (referenceFile) formData.append('file', referenceFile);

      const res = await fetch('/api/visual-generator', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      clearInterval(stepInterval);

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        if (errData?.error === 'limite_alcanzado') {
          setUpgradeReason(errData.reason === 'trial_expired' ? 'trial_expired' : 'limit_reached');
          setUpgradePlanStatus(errData.plan_status || 'trial');
          setUpgradeRenewalDate(errData.renewal_date || null);
          setUpgradeLimit(errData.limit || 15);
          setShowUpgradeModal(true);
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }

      const data: GenerateResult = await res.json();
      setResult(data);
      
      // Append generated item locally to history list so it displays styled in card history immediately
      setHistory(prev => [
        {
          id: data.id || 'mock-vis-' + Date.now(),
          tema: tema.trim() || `Recurso sobre ${unidad || 'unidad'}`,
          tipo: data.tipo,
          imagen_url: data.imagen_url,
          html_fallback: data.html_fallback,
          contenido_json: data.contenido_json || { estilo, paleta, formato: formatoLayout },
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      fetchHistory();
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : 'Error al generar el recurso visual';
      setGenError(msg);
    } finally {
      setGenerating(false);
      setLoadingStep(0);
    }
  }, [tema, formato, curso, unidad, oa, estilo, paleta, formatoLayout, referenceFile, origen, selectedPlanningId, plannings]);



  // ── Export Triggers ───────────────────────────────────────────────────────
  const triggerPngDownload = () => {
    if (!result?.imagen_url) return;
    const a = document.createElement('a');
    a.href = result.imagen_url;
    a.download = `recurso-visual-${formato}.png`;
    a.click();
  };

  const triggerPdfDownload = () => {
    exportToPdf(result!, tema);
  };

  const triggerWordDownload = () => {
    exportToWord(result!, tema);
  };

  // ─── History Card ─────────────────────────────────────────────────────────
  const HistoryCard = ({ recurso }: { recurso: RecursoVisual }) => {
    const backendTipo = TIPO_MAPPING[recurso.tipo] || recurso.tipo;
    const fmt = FORMATOS.find((f) => f.id === backendTipo || TIPO_MAPPING[f.id] === backendTipo);
    return (
      <div 
        onClick={() => {
          setResult({
            id: recurso.id,
            imagen_url: recurso.imagen_url,
            html_fallback: recurso.html_fallback,
            tipo: recurso.tipo,
            contenido_json: recurso.contenido_json
          });
          const element = document.getElementById('preview-panel-anchor');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }}
        className="group relative flex flex-col bg-white border border-[#E2E8F0]/70 hover:border-violet-200/80 hover:shadow-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      >
        <div className="h-28 bg-[#FAF9FC] flex items-center justify-center relative overflow-hidden border-b border-[#E2E8F0]/30">
          {recurso.imagen_url ? (
            <Image
              src={recurso.imagen_url}
              alt={recurso.tema}
              fill
              className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              unoptimized
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-300" />
          )}
        </div>

        <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 text-[10px] font-bold rounded-lg border border-violet-100/50">
                {fmt?.emoji || '🖼️'} {fmt?.label || recurso.tipo}
              </span>
              {recurso.contenido_json?.estilo && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 text-slate-550 text-[8px] font-bold rounded-lg border border-slate-200/50 uppercase">
                  {recurso.contenido_json.estilo.replace('_', ' ')}
                </span>
              )}
              {recurso.contenido_json?.paleta && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-650 text-[8px] font-bold rounded-lg border border-indigo-100/50 uppercase">
                  {recurso.contenido_json.paleta.replace('_', ' ')}
                </span>
              )}
              {recurso.contenido_json?.formato && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-650 text-[8px] font-bold rounded-lg border border-amber-100/50 uppercase">
                  {recurso.contenido_json.formato.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 line-clamp-2 font-semibold leading-tight pt-1">
              {recurso.tema.includes('[TEMA PRINCIPAL]') 
                ? recurso.tema.split('[TEMA PRINCIPAL]')[1]?.trim() 
                : recurso.tema}
            </p>
          </div>
          <p className="text-[9px] text-slate-400 flex items-center gap-1 pt-1 mt-auto border-t border-slate-50">
            <Clock className="w-3 h-3 text-slate-300" />
            {new Date(recurso.created_at).toLocaleDateString('es-CL', {
              day: '2-digit',
              month: 'short',
            })}
          </p>
        </div>
      </div>
    );
  };

  // ─── Upgrade Modal ────────────────────────────────────────────────────────
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
                : 'Límite de recursos visuales alcanzado'}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              {upgradePlanStatus === 'active'
                ? `Has alcanzado tu cupo mensual de ${upgradeLimit} generaciones para este módulo en tu suscripción. Tu cupo se renovará automáticamente en tu próximo ciclo el ${formattedRenewalDate}.`
                : upgradeReason === 'trial_expired'
                ? 'Tu trial gratuito de 7 días ha expirado. Actualiza tu plan para seguir generando recursos visuales, planificaciones y más.'
                : 'Has generado 15 recursos visuales en tu trial gratuito. Los demás módulos (planificaciones, guías, etc.) siguen funcionando con sus propios límites. Actualiza para generación ilimitada.'}
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] text-[#1E293B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FAF9FC] text-[#1E293B] flex flex-col font-sans antialiased">
      {showUpgradeModal && <UpgradeModal />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 hover:bg-[#FAF9FC] rounded-xl border border-transparent hover:border-[#E2E8F0]/70 transition-all text-slate-400 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-50 rounded-xl border border-violet-100/50">
              <Sparkle className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-tight text-slate-800 leading-none">
                REI DOCENTE
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Recursos Visuales IA
              </span>
            </div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
          {initials}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 z-10 space-y-8">
        
        {/* Banner */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Recursos Visuales IA
          </h1>
          <p className="text-slate-400 text-sm">
            Genera recursos educativos listos para utilizar en clases.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ── LEFT FORM PANEL ────────────────────────────────────────── */}
          <div className="space-y-6 bg-white border border-[#E2E8F0]/60 rounded-3xl p-6 shadow-[0_2px_8px_rgba(99,102,241,0.01)] flex flex-col justify-between min-h-[480px]">
            
            {/* Step indicator bubbles */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]/40 mb-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center border transition-all ${
                    wizardStep === s
                      ? 'bg-violet-650 border-violet-700 text-white shadow-xs'
                      : wizardStep > s
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                    {wizardStep > s ? '✓' : s}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:inline ${
                    wizardStep === s ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    Paso {s}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 py-2 flex flex-col justify-start">
              {/* PASO 1: Contenido */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">1. Origen y Contenido</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">Selecciona la fuente y define el tema para tu recurso visual.</p>
                  </div>

                  {/* Origen Selector */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Origen del Recurso
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-[#FAF9FC] p-1.5 rounded-xl border border-[#E2E8F0]/50 font-sans">
                      <button type="button" onClick={() => setOrigen('planificacion')}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all truncate ${origen === 'planificacion' || origen === 'kit' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}>
                        Planificación
                      </button>
                      <button type="button" onClick={() => setOrigen('tema')}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all truncate ${origen === 'tema' ? 'bg-white text-violet-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}>
                        Tema Libre
                      </button>
                      <button type="button" onClick={() => setOrigen('lectura')}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg transition-all truncate ${origen === 'lectura' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}>
                        Lect. Dom.
                      </button>
                    </div>
                  </div>

                  {/* Conditionally render inputs based on Origen */}
                  {origen === 'lectura' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Lectura Domiciliaria
                        </label>
                        {lecturas.length === 0 ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                            <p className="text-xs text-emerald-700 font-medium">No tienes lecturas analizadas.</p>
                            <p className="text-[10px] text-emerald-600 mt-0.5">Ve a REI Lecturas y analiza un libro primero.</p>
                          </div>
                        ) : (
                          <select
                            value={selectedLecturaId}
                            onChange={(e) => setSelectedLecturaId(e.target.value)}
                            className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                          >
                            {lecturas.map((l: any) => (
                              <option key={l.id} value={l.id}>
                                {(l.biblioteca_libros as any)?.titulo || l.titulo_manual}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Curso</label>
                        <select value={curso} onChange={(e) => setCurso(e.target.value)}
                          className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer">
                          {CHILEAN_COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">OA (opcional)</label>
                        <input type="text" value={oa} onChange={(e) => setOa(e.target.value)}
                          placeholder="ej. OA 3, OA 8"
                          className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-all" />
                      </div>
                    </div>
                  ) : origen === 'tema' ? (
                    <>
                      {/* Pedagogy Settings Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Curso
                          </label>
                          <select
                            value={curso}
                            onChange={(e) => setCurso(e.target.value)}
                            className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer"
                          >
                            {CHILEAN_COURSES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Unidad
                          </label>
                          <input
                            type="text"
                            value={unidad}
                            onChange={(e) => setUnidad(e.target.value)}
                            placeholder="ej. Unidad 1: Narrativa y diálogos"
                            className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Objetivo de Aprendizaje (OA)
                        </label>
                        <input
                          type="text"
                          value={oa}
                          onChange={(e) => setOa(e.target.value)}
                          placeholder="ej. OA 3: Analizar las relaciones entre personajes..."
                          className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        />
                      </div>

                      {/* Tema Input */}
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Tema de fondo del recurso
                        </label>
                        <textarea
                          value={tema}
                          onChange={(e) => setTema(e.target.value)}
                          placeholder="ej. Los tipos de textos literarios y no literarios con sus principales diferencias..."
                          rows={3}
                          className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2 px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Selecciona la fuente ({origen === 'kit' ? 'Kit de Clase' : 'Planificación'})
                      </label>
                      {plannings.length === 0 ? (
                        <div className="p-3 bg-[#FAF9FC] border border-slate-200/50 rounded-xl text-center">
                          <p className="text-xs text-slate-400 italic">No tienes planificaciones creadas en tu cuenta. Crea una primero.</p>
                        </div>
                      ) : (
                        <select
                          value={selectedPlanningId}
                          onChange={(e) => setSelectedPlanningId(e.target.value)}
                          className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-xl py-2.5 px-3 text-xs text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer"
                        >
                          {plannings.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.unit} — {p.grade} ({p.subject})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Reference Upload */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Material de referencia <span className="text-slate-300 lowercase font-normal">(opcional)</span>
                    </label>
                    {referenceFile ? (
                      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-xl">
                        <FileText className="w-4 h-4 text-violet-650 shrink-0" />
                        <span className="text-xs text-slate-650 flex-1 truncate">
                          {referenceFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReferenceFile(null)}
                          className="p-1 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF9FC]/50 hover:bg-[#FAF9FC] border border-[#E2E8F0]/70 border-dashed rounded-xl text-slate-400 hover:text-slate-650 text-xs transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-300" />
                        Subir PDF o TXT de apoyo
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setReferenceFile(f);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* PASO 2: Formato */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">2. Formato del Recurso</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">Elige el formato de recurso visual que deseas generar.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 font-sans">
                    {FORMATOS.map((fmt) => {
                      const isSel = formato === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setFormato(fmt.id)}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                            isSel
                              ? 'bg-violet-50 border-violet-300 text-violet-750 shadow-xs'
                              : 'bg-white border-[#E2E8F0]/60 hover:border-slate-300 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{fmt.emoji}</span>
                            <span className="text-[10px] font-bold block">{fmt.label}</span>
                          </div>
                          <span className="text-[8px] text-slate-400 block mt-1.5 leading-normal">{fmt.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PASO 3: Estilo Visual */}
              {wizardStep === 3 && (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 font-sans">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">3. Estilo visual</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">Selecciona la paleta de colores, tipografía y estética para el recurso visual.</p>
                  </div>

                  {/* EJE 1: ESTILOS */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Eje 1: Composición y Estilo Gráfico
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ESTILOS.map((est) => {
                        const isSel = estilo === est.id;
                        return (
                          <button
                            key={est.id}
                            type="button"
                            onClick={() => setEstilo(est.id)}
                            className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                              isSel
                                ? 'bg-violet-50 border-violet-300 text-violet-750 shadow-xs'
                                : 'bg-white border-[#E2E8F0]/60 hover:border-slate-300 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{est.emoji}</span>
                              <span className="text-[9px] font-extrabold block leading-tight">{est.label}</span>
                            </div>
                            <span className="text-[8px] text-slate-400 block mt-1 leading-normal line-clamp-2">{est.desc}</span>
                            {est.ideal && (
                              <span className="text-[7px] text-violet-500 bg-violet-50/50 px-1 rounded mt-1 font-semibold">
                                Ideal: {est.ideal}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* EJE 2: PALETAS DE COLOR */}
                  <div className="space-y-2 pt-2 border-t border-slate-100/60">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Eje 2: Paleta de Colores
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {PALETAS.map((pal) => {
                        const isSel = paleta === pal.id;
                        return (
                          <button
                            key={pal.id}
                            type="button"
                            onClick={() => setPaleta(pal.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                              isSel
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-850 shadow-xs'
                                : 'bg-white border-[#E2E8F0]/60 hover:border-slate-300 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                {pal.colors.slice(0, 3).map((col, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="w-3 h-3 rounded-full border border-white/60 shadow-xs"
                                    style={{ backgroundColor: col }}
                                  />
                                ))}
                              </div>
                              <div>
                                <span className="text-[9px] font-extrabold block leading-tight">{pal.label}</span>
                                <span className="text-[7.5px] text-slate-400 block mt-0.5 leading-none">{pal.desc}</span>
                              </div>
                            </div>
                            {isSel && (
                              <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold">✓</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* EJE 3: FORMATOS DE SALIDA */}
                  <div className="space-y-2 pt-2 border-t border-slate-100/60">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Eje 3: Formato de Salida
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FORMATOS_ESTILO.map((fmt) => {
                        const isSel = formatoLayout === fmt.id;
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => setFormatoLayout(fmt.id)}
                            className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all ${
                              isSel
                                ? 'bg-pink-50 border-pink-300 text-pink-750 shadow-xs font-bold'
                                : 'bg-white border-[#E2E8F0]/60 hover:border-slate-300 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{fmt.emoji}</span>
                              <span className="text-[9px] font-extrabold block leading-tight">{fmt.label}</span>
                            </div>
                            <span className="text-[7.5px] text-slate-400 block mt-0.5 leading-none">{fmt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 4: Confirmar y Generar */}
              {wizardStep === 4 && (
                <div className="space-y-4 font-sans">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">4. Confirmar y Generar</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">Revisa la configuración antes de generar el recurso visual.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5 text-xs font-sans">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                      <span className="text-slate-400 font-semibold">Origen:</span>
                      <span className="font-bold text-slate-700 capitalize">{origen === 'tema' ? 'Tema libre' : origen === 'kit' ? 'Kit de Clase' : origen === 'lectura' ? 'Lectura REI' : 'Planificación'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                      <span className="text-slate-400 font-semibold">Recurso base:</span>
                      <span className="font-bold text-slate-700">{FORMATOS.find(f => f.id === formato)?.label || formato}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                      <span className="text-slate-400 font-semibold">Estilo visual:</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        {ESTILOS.find(e => e.id === estilo)?.emoji} {ESTILOS.find(e => e.id === estilo)?.label || estilo}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100/50">
                      <span className="text-slate-400 font-semibold">Paleta de color:</span>
                      <span className="font-bold text-slate-700">
                        {PALETAS.find(p => p.id === paleta)?.label || paleta}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 font-semibold">Formato Layout:</span>
                      <span className="font-bold text-slate-700">
                        {FORMATOS_ESTILO.find(f => f.id === formatoLayout)?.label || formatoLayout}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons at the bottom */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100/60 mt-6 gap-3">
              {wizardStep > 1 && (
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => setWizardStep(prev => prev - 1)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-650 hover:text-slate-800 font-bold rounded-xl text-xs transition-all duration-200"
                >
                  Atrás
                </button>
              )}
               {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1) {
                      if (origen === 'tema' && !tema.trim()) {
                        setGenError('Por favor ingresa el tema de la clase antes de continuar.');
                        return;
                      }
                      if ((origen === 'kit' || origen === 'planificacion') && plannings.length === 0) {
                        setGenError('Por favor selecciona una planificación de origen antes de continuar.');
                        return;
                      }
                      if (origen === 'lectura' && lecturas.length === 0) {
                        setGenError('No tienes lecturas analizadas. Ve a REI Lecturas primero.');
                        return;
                      }
                    }
                    setGenError(null);
                    setWizardStep(prev => prev + 1);
                  }}
                  className="ml-auto px-4 py-2 bg-[#7C3AED] hover:bg-violet-750 text-white font-bold rounded-xl text-xs shadow-xs transition-all duration-200"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="ml-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-violet-500/10 transition-all duration-200"
                >
                  {generating ? 'Generando...' : 'Generar recurso'}
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT PREVIEW PANEL ─────────────────────────────────────── */}
          <div id="preview-panel-anchor" className="space-y-4">
            <div className="bg-white border border-[#E2E8F0]/60 rounded-3xl overflow-hidden min-h-[450px] flex flex-col shadow-[0_2px_8px_rgba(99,102,241,0.01)]">
              
              {/* Generating state */}
              {generating && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-2 border-violet-100 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-violet-50/50 animate-pulse" />
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
                            i <= loadingStep ? 'bg-violet-500 w-3' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs max-w-xs text-center leading-relaxed">
                    La inteligencia artificial está estructurando la información y diseñando tu recurso visual didáctico.
                  </p>
                </div>
              )}

              {/* Error State */}
              {!generating && genError && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center">
                  <AlertTriangle className="w-10 h-10 text-rose-500" />
                  <div>
                    <p className="text-rose-600 font-bold text-sm mb-1">
                      No se pudo generar el recurso
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-xs">{genError}</p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {/* Preview Result */}
              {!generating && result && (
                <div className="flex flex-col flex-1">
                  
                  {/* Result Header info */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Recurso generado con éxito
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Guardado automáticamente
                    </span>
                  </div>

                  {/* Visual Render Container */}
                  <div className="flex-1 p-6 overflow-auto bg-[#FAF9FC] flex flex-col justify-start">
                    {result.imagen_url ? (
                      <div className="relative w-full aspect-square rounded-2xl border border-slate-200/50 overflow-hidden bg-white shadow-xs">
                        <Image
                          src={result.imagen_url}
                          alt="Recurso visual de clase"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : result.html_fallback ? (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs prose max-w-none prose-slate text-slate-700 text-xs">
                        <div dangerouslySetInnerHTML={{ __html: result.html_fallback }} />
                      </div>
                    ) : (
                      <div className="text-center py-10 text-slate-400 italic text-xs">
                        No se ha podido cargar el recurso.
                      </div>
                    )}
                  </div>

                  {/* Actions Exports panel */}
                  <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-3 gap-2">
                    <button
                      onClick={triggerPngDownload}
                      disabled={!result.imagen_url}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/50 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      Descargar PNG
                    </button>
                    <button
                      onClick={triggerPdfDownload}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/50 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-rose-500" />
                      Exportar PDF
                    </button>
                    <button
                      onClick={triggerWordDownload}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200/50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      Exportar Word
                    </button>
                  </div>
                </div>
              )}

              {/* Idle empty panel */}
              {!generating && !result && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100/50 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-violet-400/60" />
                  </div>
                  <div>
                    <p className="text-slate-600 font-bold text-sm">
                      Tu recurso visual educativo aparecerá aquí
                    </p>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
                      Define los parámetros curriculares en la izquierda y presiona Generar.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ─── HISTORY LIST SECTION ──────────────────────────────────────── */}
        <div className="space-y-4 pt-6 border-t border-[#E2E8F0]/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Historial de recursos visuales
              </h2>
              <p className="text-xs text-slate-400">Tus recursos previamente generados en la cuenta.</p>
            </div>
            {historyLoading && (
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {history.length === 0 && !historyLoading ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-[#E2E8F0]/70 border-dashed">
              <p className="text-slate-400 text-xs italic">
                Aún no has generado recursos visuales. Completa el formulario de arriba.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((recurso) => (
                <HistoryCard key={recurso.id} recurso={recurso} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
