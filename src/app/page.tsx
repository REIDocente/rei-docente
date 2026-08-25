'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  BookOpen,
  GraduationCap,
  ChevronRight,
  FileText,
  User,
  Loader2,
  Trash2,
  Folder,
  Settings,
  HelpCircle,
  Menu,
  X,
  FileDown,
  Activity,
  ArrowUpRight,
  Home,
  PlusCircle,
  Library,
  Sliders,
  LogOut as LogOutIcon,
  Layers,
  Bell,
  MoreVertical,
  ExternalLink,
  Gamepad2,
  ClipboardCheck,
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface Planning {
  id: string;
  created_at: string;
  subject: string;
  grade: string;
  learning_objective: string;
  unit: string;
}
interface UserProfile {
  plan_status: 'trial' | 'active' | 'expired';
  trial_started_at: string | null;
  planifications_generated: number;
  presentations_generated: number;
  images_generated: number;
  guides_generated: number;
  gamified_activities_generated: number;
  visual_resources_generated: number;
  evaluations_generated: number;
  plan_name?: string;
  subscription_plan?: string;
}

const cardIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  kit: Sparkles,
  presentaciones: Sliders,
  evaluaciones: FileText,
  guias: BookOpen,
  gamificacion: Gamepad2,
  experiencias: Layers,
  evaluador: ClipboardCheck,
};

const toolIconPaths: Record<string, string> = {
  kit: '/assets/dashboard/icons/kit_icon.png',
  presentaciones: '/assets/dashboard/icons/presentaciones_icon.png',
  evaluaciones: '/assets/dashboard/icons/evaluaciones_icon.png',
  guias: '/assets/dashboard/icons/guias_icon.png',
  gamificacion: '/assets/dashboard/icons/gamificacion_icon.png',
};

// Colores por módulo — identidad visual REI
const MODULE_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  'kit-clase':    { color: '#6D28F5', bg: '#F0EBFF', label: 'morado'  },
  'play':         { color: '#10B981', bg: '#ECFDF5', label: 'verde'   },
  'evaluaciones': { color: '#F97316', bg: '#FFF7ED', label: 'naranjo' },
  'guias':        { color: '#3B82F6', bg: '#EFF6FF', label: 'azul'    },
  'evaluador':    { color: '#059669', bg: '#ECFDF5', label: 'esmeralda'},
  'lecturas':     { color: '#EC4899', bg: '#FDF2F8', label: 'rosado'  },
  'experiencias': { color: '#F59E0B', bg: '#FFFBEB', label: 'amarillo'},
};

// Constantes fuera del componente para evitar traducción automática del navegador
const ASIGNATURAS_LIST_GLOBAL = ['Lengua y Literatura','Lenguaje y Comunicación','Matemática','Historia, Geografía y Cs. Sociales','Ciencias Naturales','Inglés','Educación Física','Artes Visuales','Música','Otra'];
const LEVEL_NAME_MAP_GLOBAL: Record<string,string> = {'1°B':'1° Básico','2°B':'2° Básico','3°B':'3° Básico','4°B':'4° Básico','5°B':'5° Básico','6°B':'6° Básico','7°B':'7° Básico','8°B':'8° Básico','1°M':'1° Medio','2°M':'2° Medio'};
const LETRAS_GLOBAL = ['A','B','C','D','E','F','G'] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [guias, setGuias] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [visuals, setVisuals] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<any>(null);
  const [cursos, setCursos] = useState<any[]>([]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState<'all' | 'kits' | 'guias' | 'evals' | 'visuals'>('all');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'inicio' | 'biblioteca'>('inicio');

  // ── Perfil inline ──────────────────────────────────────────────
  const ASIGNATURAS_LIST = ASIGNATURAS_LIST_GLOBAL;
  const LEVEL_NAME_MAP = LEVEL_NAME_MAP_GLOBAL;
  const LETRAS = LETRAS_GLOBAL;
  const [pfNombre, setPfNombre] = useState('');
  const [pfEstablecimiento, setPfEstablecimiento] = useState('');
  const [pfTipo, setPfTipo] = useState('Municipal');
  const [pfComuna, setPfComuna] = useState('');
  const [pfAsignatura, setPfAsignatura] = useState('Lengua y Literatura');
  const [pfOtra, setPfOtra] = useState('');
  const [pfLevels, setPfLevels] = useState<Record<string,boolean>>({});
  const [pfLetras, setPfLetras] = useState<Record<string,Record<string,boolean>>>({});
  const [pfSaving, setPfSaving] = useState(false);
  const [pfSuccess, setPfSuccess] = useState('');

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        setUser(user);
        setCheckingAuth(false);
        const { data: planningsData } = await supabase
          .from('plannings')
          .select('id, created_at, subject, grade, learning_objective, unit')
          .order('created_at', { ascending: false });
        setPlannings(planningsData || []);
        try {
          const { data: guiasData } = await supabase.from('guias').select('id, created_at, nivel, eje, titulo, formato, rti_nivel').order('created_at', { ascending: false });
          setGuias(guiasData || []);
        } catch (e) { console.warn('Guias table not queryable:', e); }
        try {
          const { data: evsData } = await supabase.from('evaluaciones').select('id, created_at, nivel, eje, titulo, n_preguntas, dificultad').order('created_at', { ascending: false });
          setEvaluaciones(evsData || []);
        } catch (e) { console.warn('Evaluaciones table not queryable:', e); }
        try {
          const { data: visData } = await supabase.from('recursos_visuales').select('id, created_at, tema, tipo, imagen_url, contenido_json').order('created_at', { ascending: false });
          setVisuals(visData || []);
        } catch (e) { console.warn('Recursos visuales table not queryable:', e); }
        
        // Fetch profile and courses
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes.data.session?.access_token;
        const profileRes = await fetch('/api/onboarding/perfil', {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        const profileData = await profileRes.json();
        if (profileData.profile) {
          setOnboardingProfile(profileData.profile);
          setProfile(profileData.profile as UserProfile);
        }
        if (profileData.cursos) {
          setCursos(profileData.cursos);
        }
      } catch (err) {
        console.error('Error in checkAuthAndFetch:', err);
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, [router]);

  // Pre-fill profile form when data loads
  useEffect(() => {
    if (!onboardingProfile) return;
    setPfNombre(onboardingProfile.nombre_completo || '');
    setPfEstablecimiento(onboardingProfile.establecimiento || '');
    setPfTipo(onboardingProfile.establecimiento_tipo || 'Municipal');
    setPfComuna(onboardingProfile.comuna || '');
    if (ASIGNATURAS_LIST.includes(onboardingProfile.asignatura_principal)) {
      setPfAsignatura(onboardingProfile.asignatura_principal || 'Lengua y Literatura');
    } else if (onboardingProfile.asignatura_principal) {
      setPfAsignatura('Otra'); setPfOtra(onboardingProfile.asignatura_principal);
    }
  }, [onboardingProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cursos.length) return;
    const lv: Record<string,boolean> = {};
    const lt: Record<string,Record<string,boolean>> = {};
    cursos.forEach((c: any) => {
      const code = Object.keys(LEVEL_NAME_MAP).find(k => LEVEL_NAME_MAP[k] === c.nivel);
      if (code) {
        lv[code] = true;
        if (!lt[code]) lt[code] = {A:false,B:false,C:false,D:false,E:false,F:false,G:false};
        const m = c.nombre?.match(/[A-G]$/);
        if (m) lt[code][m[0]] = true;
      }
    });
    setPfLevels(lv); setPfLetras(lt);
  }, [cursos]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async () => {
    setPfSaving(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data.session?.access_token;
      const compiledCursos: any[] = [];
      Object.keys(pfLevels).forEach(lvl => {
        if (!pfLevels[lvl]) return;
        const letrasObj = pfLetras[lvl] || {};
        Object.keys(letrasObj).forEach(letter => {
          if (!letrasObj[letter]) return;
          compiledCursos.push({ nombre: `${LEVEL_NAME_MAP[lvl]} ${letter}`, nivel: LEVEL_NAME_MAP[lvl], asignatura: pfAsignatura === 'Otra' ? pfOtra.trim() : pfAsignatura });
        });
      });
      const payload = {
        nombre_completo: pfNombre.trim(),
        establecimiento: pfEstablecimiento.trim(),
        establecimiento_tipo: pfTipo,
        comuna: pfComuna.trim(),
        asignatura_principal: pfAsignatura === 'Otra' ? pfOtra.trim() : pfAsignatura,
        perfil_completado: true,
        cursos: compiledCursos,
      };
      const res = await fetch('/api/onboarding/guardar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setPfSuccess('¡Perfil guardado correctamente!');
        setOnboardingProfile((prev: any) => ({ ...prev, ...payload }));
        setCursos(compiledCursos);
        setTimeout(() => setPfSuccess(''), 4000);
      }
    } catch (e) { console.error(e); }
    finally { setPfSaving(false); }
  };

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#biblioteca') setCurrentTab('biblioteca');
        else setCurrentTab('inicio');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleDelete = async (id: string, table: 'plannings' | 'guias' | 'evaluaciones' | 'recursos_visuales', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar este recurso?')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      if (table === 'plannings') setPlannings(plannings.filter(p => p.id !== id));
      else if (table === 'guias') setGuias(guias.filter(g => g.id !== id));
      else if (table === 'evaluaciones') setEvaluaciones(evaluaciones.filter(ev => ev.id !== id));
      else if (table === 'recursos_visuales') setVisuals(visuals.filter(v => v.id !== id));
      setActiveDropdownId(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('No se pudo eliminar el recurso.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPlannings = plannings.filter(p =>
    p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredGuias = guias.filter(g =>
    (g.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.nivel || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredEvaluaciones = evaluaciones.filter(e =>
    (e.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.nivel || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVisuals = visuals.filter(v =>
    (v.tema || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.tipo || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mockExports = [
    { name: 'Rei_Docente_Planificacion_Nueva_2Medio.pdf', type: 'PDF', date: 'Hace 10 min' },
    { name: 'Rei_Docente_Planificacion_6Basico_Breve.docx', type: 'Word', date: 'Hace 2 horas' },
    { name: 'Rei_Docente_Planificacion_7Basico_UTP.pdf', type: 'PDF', date: 'Ayer' }
  ];

  const tools: any[] = [
    {
      id: 'kit-clase',
      iconKey: 'kit',
      title: 'Kit de Clase',
      description: 'Sesión de clase, planificación completa y adaptada.',
      enabled: true,
      link: '/planner/new',
    },
    {
      id: 'play',
      iconKey: 'gamificacion',
      title: 'REI Play',
      description: 'Gamificación y motores de juego interactivos con inteligencia artificial.',
      enabled: true,
      link: '/play',
    },
    {
      id: 'evaluaciones',
      iconKey: 'evaluaciones',
      title: 'Evaluaciones y Rúbricas',
      description: 'Evaluaciones y rúbricas alineadas al currículo.',
      enabled: true,
      link: '/evaluaciones',
    },
    {
      id: 'evaluador',
      iconKey: 'evaluador',
      title: 'REI Evaluador IA',
      description: 'Hojas OMR imprimibles, escáner con cámara, corrección automática y análisis RTI por OA.',
      enabled: true,
      link: '/evaluador',
    },
    {
      id: 'guias',
      iconKey: 'guias',
      title: 'Guías de Aprendizaje',
      description: 'Guías de aprendizaje listas para usar.',
      enabled: true,
      link: '/guias',
    },
    {
      id: 'lecturas',
      iconKey: 'guias',
      title: 'REI Lecturas',
      description: 'Planificaciones, guías, evaluaciones y experiencias desde tus lecturas domiciliarias.',
      enabled: true,
      link: '/lecturas',
    },
    {
      id: 'experiencias',
      iconKey: 'experiencias',
      title: 'Experiencias REI',
      description: 'Experiencias de aprendizaje innovadoras impulsadas por inteligencia artificial.',
      enabled: true,
      link: '/experiencias',
    },
  ];

  const email = user?.email || '';
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.first_name || (profile as any)?.full_name || '';
  const emailPrefix = email ? email.split('@')[0] : '';
  const firstName = fullName ? fullName.split(' ')[0] : (emailPrefix || 'Docente');
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : (email ? email[0].toUpperCase() : 'UD');

  let planLabel = 'Plan Docente';
  let statusLabel = 'Prueba';
  if (profile) {
    const rawPlan = profile.plan_name || profile.subscription_plan;
    if (rawPlan) {
      const planLower = rawPlan.toLowerCase();
      if (planLower === 'pro') planLabel = 'Plan Pro';
      else if (planLower === 'premium') planLabel = 'Plan Premium';
      else planLabel = 'Plan Docente';
      if (profile.plan_status === 'active') statusLabel = 'Activo';
      else if (profile.plan_status === 'expired') statusLabel = 'Expirado';
    }
  }

  const recentDocuments = [
    ...plannings.map(p => ({ id: p.id, title: `Unidad: ${p.unit}`, type: 'Kit de Clase', typeKey: 'plannings', date: p.created_at, link: `/planner/${p.id}`, meta: p.grade, subject: p.subject, estilo: null, paleta: null, formato: null })),
    ...guias.map(g => ({ id: g.id, title: g.titulo || 'Guía de Trabajo', type: 'Guía', typeKey: 'guias', date: g.created_at, link: `/guias/${g.id}`, meta: g.nivel, subject: 'Lenguaje', estilo: null, paleta: null, formato: null })),
    ...evaluaciones.map(ev => ({ id: ev.id, title: ev.titulo || 'Evaluación Escrita', type: 'Evaluación', typeKey: 'evaluaciones', date: ev.created_at, link: `/evaluaciones/${ev.id}`, meta: ev.nivel, subject: 'Lenguaje', estilo: null, paleta: null, formato: null })),
    ...visuals.map(v => ({ id: v.id, title: `Tema: ${v.tema}`, type: 'Recurso Visual', typeKey: 'recursos_visuales', date: v.created_at, link: `/visual`, meta: 'General', subject: v.tipo, estilo: v.contenido_json?.estilo, paleta: v.contenido_json?.paleta, formato: v.contenido_json?.formato }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  interface HorarioBloque {
    dia: string;
    desde: string;
    hasta: string;
    curso: string;
    asignatura: string;
  }

  const getHoyBlocks = () => {
    if (!onboardingProfile?.horario_docente_json) return [];
    try {
      const hoy = new Date().toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago', weekday: 'long'
      });
      const diaHoy = hoy.charAt(0).toUpperCase() + hoy.slice(1);
      const blocks = (onboardingProfile.horario_docente_json as HorarioBloque[]) || [];
      return blocks
        .filter((b) => b.dia.toLowerCase() === diaHoy.toLowerCase())
        .sort((a, b) => a.desde.localeCompare(b.desde));
    } catch (e) {
      return [];
    }
  };

  const getDiaHoyString = () => {
    try {
      const hoy = new Date().toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago', weekday: 'long'
      });
      return hoy.charAt(0).toUpperCase() + hoy.slice(1);
    } catch (e) {
      return 'Hoy';
    }
  };

  const diaHoy = getDiaHoyString();
  const hoyBlocks = getHoyBlocks();

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#6D28F5' }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#6D28F5' }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>Cargando tu Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-700 flex font-sans antialiased overflow-x-hidden" style={{ backgroundColor: '#F8FAFC' }}>

      {/* SIDEBAR */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-bold" style={{ color: '#6D28F5' }}>REI DOCENTE</span>
          </div>
          <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs" style={{ backgroundColor: '#6D28F5' }}>
            {initials}
          </div>
        </header>


        {/* Central & Right Layout */}
        <div className="flex-1 flex flex-col xl:flex-row min-w-0">

          {/* ── CONTENIDO CENTRAL ── */}
          <main className="flex-1 p-6 md:p-8 space-y-8 min-w-0">
            {currentTab === 'inicio' && (
              <>
                {/* BANNER REQUERIMIENTO ONBOARDING COMPLETADO */}
                {onboardingProfile && !onboardingProfile.perfil_completado && (
                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-800 animate-pulse">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="font-bold">Completa tu perfil pedagógico para personalizar tus recursos y planificaciones.</p>
                    </div>
                    <button
                      onClick={() => router.push('/onboarding')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2 rounded-xl text-[10px] shrink-0 cursor-pointer shadow-xs transition-colors"
                    >
                      Completar Perfil
                    </button>
                  </div>
                )}


                {/* BIENVENIDA HERO */}
                {(() => {
                  const PNL_MESSAGES = [
                    { dia: 'Domingo',   msg: 'Mañana vuelves a transformar vidas. Descansa y confía en tu preparación. Eres exactamente el docente que tus estudiantes necesitan.' },
                    { dia: 'Lunes',     msg: 'Hoy abres una nueva página en la historia de cada estudiante. Tu presencia en el aula hace la diferencia desde el primer minuto.' },
                    { dia: 'Martes',    msg: 'Lo que tú crees sobre tus estudiantes, ellos lo creen sobre sí mismos. Cree en ellos hoy — y verás cómo crecen.' },
                    { dia: 'Miércoles', msg: 'Cada pregunta que haces en el aula planta una semilla de curiosidad. Sigues sembrando aunque no siempre veas la cosecha.' },
                    { dia: 'Jueves',    msg: 'Tu vocación transforma vidas. Lo que haces hoy — esta clase, esta corrección, este gesto — importa más de lo que imaginas.' },
                    { dia: 'Viernes',   msg: 'Has llegado hasta aquí con todo tu compromiso. Celebra cada avance de tus estudiantes: son el reflejo de tu dedicación.' },
                    { dia: 'Sábado',    msg: 'Hoy es un buen día para recargar energía y recordar por qué elegiste enseñar. Tu vocación es un regalo para quienes aprenden contigo.' },
                  ];
                  const diaSemana = new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago', weekday: 'long' });
                  const diaKey = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
                  const pnl = PNL_MESSAGES.find(m => m.dia === diaKey) || PNL_MESSAGES[1];
                  const nombreDocente = onboardingProfile?.nombre_completo?.split(' ')[0] || firstName;
                  return (
                    <div className="rounded-3xl p-8 relative overflow-hidden border" style={{ background: 'linear-gradient(135deg, #7C3AED08 0%, #EC489908 100%)', borderColor: '#E2E8F0', boxShadow: '0 8px 30px rgba(124,58,237,0.06)' }}>
                      {/* Logo decorativo */}
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:block opacity-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo-rei.png" alt="" className="w-32 h-32 object-contain" />
                      </div>
                      <div className="relative z-10 space-y-3 max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7C3AED' }}>
                          {diaKey} · {new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: 'numeric', month: 'long' })}
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-black leading-tight" style={{ color: '#0F172A' }}>
                          ¡Hola, {nombreDocente}! 👋
                        </h1>
                        {onboardingProfile?.establecimiento && (
                          <p className="text-xs font-semibold" style={{ color: '#64748B' }}>
                            {onboardingProfile.establecimiento} · {onboardingProfile.establecimiento_tipo} · {onboardingProfile.comuna}
                          </p>
                        )}
                        {/* Mensaje PNL diario */}
                        <div className="mt-2 flex items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: 'white', border: '1px solid #E2E8F0' }}>
                          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#7C3AED' }} />
                          <p className="text-sm leading-relaxed font-medium italic" style={{ color: '#475569' }}>
                            &ldquo;{pnl.msg}&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* WIDGETS PEDAGÓGICOS: AGENDA + CURSOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Widget Hoy en Aula */}
                  {onboardingProfile?.horario_docente_json && (
                    <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border" style={{ borderColor: '#E5E7EB', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
                      <div className="space-y-3">
                        <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-rose-600" /> Hoy en Aula ({diaHoy})
                        </h3>
                        <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                          {hoyBlocks.length > 0 ? (
                            hoyBlocks.map((blk, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-semibold">
                                <span className="text-slate-550 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {blk.desde}–{blk.hasta}</span>
                                <span className="text-slate-800 font-extrabold">{blk.curso}</span>
                                <span className="text-slate-450 text-[10px] truncate max-w-40">{blk.asignatura || 'General'}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2 text-center">No tienes clases programadas para hoy 🎉</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Widget Mis Cursos */}
                  <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border" style={{ borderColor: '#E5E7EB', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
                    <div className="space-y-3">
                      <h3 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-rose-600" /> Mis Cursos Registrados
                      </h3>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cursos.length > 0 ? (
                          cursos.map((c, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-extrabold rounded-full border border-rose-100"
                            >
                              {c.nombre}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">No tienes cursos registrados aún.</p>
                        )}
                      </div>
                    </div>
                    {cursos.length > 0 && (
                      <div className="pt-2 text-right">
                        <Link
                          href="/evaluaciones/evaluador"
                          className="text-[10px] font-black text-rose-600 hover:underline inline-flex items-center gap-0.5"
                        >
                          Ver todos los cursos →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* FORMULARIO PERFIL PEDAGÓGICO INLINE */}
                <div className="space-y-4">
                  {pfSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold">✓ {pfSuccess}</div>
                  )}

                  {/* Sección 1: Identificación */}
                  <div className="bg-white rounded-3xl p-5 border space-y-4" style={{ borderColor: '#E5E7EB' }}>
                    <h2 className="text-xs font-black uppercase tracking-wider pb-2 border-b" style={{ color: '#7C3AED', borderColor: '#EDE9FE' }}>1. Identificación y Establecimiento</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Nombre Completo</label>
                        <input value={pfNombre} onChange={e => setPfNombre(e.target.value)} placeholder="Tu nombre completo" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Establecimiento Educativo</label>
                        <input value={pfEstablecimiento} onChange={e => setPfEstablecimiento(e.target.value)} placeholder="Nombre del colegio" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Comuna / Ciudad</label>
                        <input value={pfComuna} onChange={e => setPfComuna(e.target.value)} placeholder="Ej: Santiago" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 block">Asignatura Principal</label>
                        <select value={pfAsignatura} onChange={e => setPfAsignatura(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                          {ASIGNATURAS_LIST.map(a => <option key={a}>{a}</option>)}
                        </select>
                        {pfAsignatura === 'Otra' && (
                          <input value={pfOtra} onChange={e => setPfOtra(e.target.value)} placeholder="Escribe tu asignatura" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300 mt-2" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 block">Tipo de Dependencia</label>
                      <div className="flex flex-wrap gap-2">
                        {['Municipal', 'Particular subvencionado', 'Particular pagado'].map(t => (
                          <button key={t} type="button" onClick={() => setPfTipo(t)}
                            className="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
                            style={pfTipo === t ? { background: 'linear-gradient(135deg,#7C3AED,#EC4899)', color: '#fff', borderColor: 'transparent' } : { background: '#F8F9FC', color: '#64748B', borderColor: '#E5E7EB' }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sección 2: Cursos */}
                  <div className="bg-white rounded-3xl p-5 border space-y-4" style={{ borderColor: '#E5E7EB' }}>
                    <h2 className="text-xs font-black uppercase tracking-wider pb-2 border-b" style={{ color: '#7C3AED', borderColor: '#EDE9FE' }}>2. Cursos y Paralelos</h2>
                    <p className="text-[10px] text-slate-400">Selecciona los niveles y marca los paralelos que atiendes.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {Object.entries(LEVEL_NAME_MAP).map(([code, name]) => (
                        <div key={code} className="space-y-1">
                          <button type="button" onClick={() => setPfLevels(prev => ({ ...prev, [code]: !prev[code] }))}
                            className="w-full px-3 py-2 rounded-xl text-[10px] font-bold border transition-all"
                            style={pfLevels[code] ? { background: 'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', borderColor:'transparent' } : { background:'#F8F9FC', color:'#64748B', borderColor:'#E5E7EB' }}>
                            {name}
                          </button>
                          {pfLevels[code] && (
                            <div className="flex flex-wrap gap-1 px-1">
                              {LETRAS.map(l => (
                                <button key={l} type="button" translate="no"
                                  onClick={() => setPfLetras(prev => ({ ...prev, [code]: { ...prev[code], [l]: !prev[code]?.[l] } }))}
                                  className="w-6 h-6 rounded-lg text-[9px] font-black border transition-all"
                                  style={pfLetras[code]?.[l] ? { backgroundColor:'#7C3AED', color:'#fff', borderColor:'#7C3AED' } : { backgroundColor:'#F3F4F6', color:'#9CA3AF', borderColor:'#E5E7EB' }}>
                                  <span translate="no">{l}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón guardar */}
                  <button onClick={handleSaveProfile} disabled={pfSaving}
                    className="w-full py-3 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#7C3AED 0%,#EC4899 100%)' }}>
                    {pfSaving ? 'Guardando...' : 'Guardar mi perfil pedagógico →'}
                  </button>
                </div>
              </>
            )}

            {/* BIBLIOTECA */}
            {currentTab === 'biblioteca' && (
              <div id="biblioteca" className="bg-white rounded-2xl p-6 space-y-6" style={{ border: '1.5px solid #E5E7EB', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: '#0F172A' }}>Mi Biblioteca</h2>
                    <p className="text-[10px]" style={{ color: '#64748B' }}>Revisa y administra todo el material generado recientemente.</p>
                  </div>
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                    <input
                      type="text"
                      placeholder="Buscar recurso..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none transition-all"
                      style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E5E7EB', color: '#0F172A' }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pb-2" style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'kits', label: `Kits (${plannings.length})` },
                    { id: 'guias', label: `Guías (${guias.length})` },
                    { id: 'evals', label: `Evaluaciones (${evaluaciones.length})` },
                    { id: 'visuals', label: `Visuales (${visuals.length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveLibraryTab(tab.id as any)}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={
                        activeLibraryTab === tab.id
                          ? { backgroundColor: '#6D28F5', color: '#FFFFFF' }
                          : { backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E5E7EB' }
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  {recentDocuments.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <p className="text-xs italic" style={{ color: '#94A3B8' }}>Aún no tienes planificaciones, crea la primera aquí.</p>
                      <Link href="/planner/new" className="inline-flex items-center gap-1 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-sm" style={{ backgroundColor: '#6D28F5' }}>
                        Planificar clase <Plus className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <table className="w-full text-xs border-collapse" style={{ color: '#64748B' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                          <th className="p-3 text-left font-bold text-[10px] uppercase tracking-wide">Nombre / Recurso</th>
                          <th className="p-3 text-left font-bold text-[10px] uppercase tracking-wide">Curso / Asignatura</th>
                          <th className="p-3 text-left font-bold text-[10px] uppercase tracking-wide">Fecha Creación</th>
                          <th className="p-3 text-right font-bold text-[10px] uppercase tracking-wide">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentDocuments
                          .filter(doc => {
                            if (activeLibraryTab === 'kits' && doc.typeKey !== 'plannings') return false;
                            if (activeLibraryTab === 'guias' && doc.typeKey !== 'guias') return false;
                            if (activeLibraryTab === 'evals' && doc.typeKey !== 'evaluaciones') return false;
                            if (activeLibraryTab === 'visuals' && doc.typeKey !== 'recursos_visuales') return false;
                            return doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   doc.meta.toLowerCase().includes(searchQuery.toLowerCase());
                          })
                          .slice(0, 5)
                          .map((doc) => (
                            <tr key={doc.id} className="transition-colors" style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td className="p-3">
                                <div className="font-bold line-clamp-1 flex items-center gap-2 flex-wrap" style={{ color: '#0F172A' }}>
                                  {doc.title}
                                </div>
                                <div className="text-[9px] font-semibold uppercase" style={{ color: '#94A3B8' }}>{doc.type}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold" style={{ color: '#64748B' }}>{doc.meta}</div>
                                <div className="text-[9px]" style={{ color: '#94A3B8' }}>{doc.subject}</div>
                              </td>
                              <td className="p-3 text-[10px]" style={{ color: '#94A3B8' }}>
                                {new Date(doc.date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link href={doc.link} className="inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all" style={{ backgroundColor: '#F0EBFF', color: '#6D28F5' }}>
                                    Abrir
                                  </Link>
                                  <button
                                    onClick={(e) => handleDelete(doc.id, doc.typeKey as any, e)}
                                    disabled={deletingId === doc.id}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: '#CBD5E1' }}
                                    title="Eliminar"
                                  >
                                    {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {plannings.length > 0 && (
                  <div className="pt-2 text-center" style={{ borderTop: '1px solid #F1F5F9' }}>
                    <Link href="/planner/new" className="inline-flex items-center gap-1.5 text-xs font-bold transition-all" style={{ color: '#6D28F5' }}>
                      Ver todas mis planificaciones <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ── PANEL DERECHO — solo en Biblioteca ── */}
          {currentTab === 'biblioteca' && (
          <aside className="w-full xl:w-76 bg-white p-6 space-y-6 shrink-0" style={{ borderLeft: '1px solid #E5E7EB' }}>

            {/* Actividad Reciente */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2" style={{ color: '#64748B' }}>
                  <Activity className="w-3.5 h-3.5 animate-pulse" style={{ color: '#6D28F5' }} />
                  Actividad reciente
                </h2>
                <a href="#biblioteca" className="text-[10px] font-bold" style={{ color: '#94A3B8' }}>Ver todas</a>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: '#F0EBFF', color: '#6D28F5' }}>
                    Plan
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold" style={{ color: '#0F172A' }}>Planificación creada</p>
                    <p className="text-[9px] truncate" style={{ color: '#94A3B8' }}>Lenguaje - 2° Medio</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
                    Guía
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold" style={{ color: '#0F172A' }}>Guía generada</p>
                    <p className="text-[9px] truncate" style={{ color: '#94A3B8' }}>El Mito de Sísifo - 2° Medio</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Últimas Planificaciones */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2" style={{ color: '#64748B' }}>
                  <FileText className="w-3.5 h-3.5" style={{ color: '#EC4899' }} />
                  Últimas planificaciones
                </h2>
                <Link href="/planner/new" className="text-[10px] font-bold" style={{ color: '#94A3B8' }}>Ver todas</Link>
              </div>
              {plannings.length === 0 ? (
                <p className="text-[10px] italic" style={{ color: '#94A3B8' }}>Aún no hay planificaciones.</p>
              ) : (
                <div className="space-y-2">
                  {plannings.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      href={`/planner/${p.id}`}
                      className="block p-3 rounded-xl transition-all duration-200"
                      style={{ border: '1px solid #E5E7EB' }}
                    >
                      <p className="text-[10px] font-bold truncate" style={{ color: '#0F172A' }}>U: {p.unit}</p>
                      <div className="flex items-center justify-between text-[8px] mt-1">
                        <span className="font-semibold" style={{ color: '#64748B' }}>{p.grade}</span>
                        <span style={{ color: '#94A3B8' }}>{new Date(p.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Últimas Exportaciones */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2" style={{ color: '#64748B' }}>
                  <FileDown className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                  Últimas exportaciones
                </h2>
                <a href="#biblioteca" className="text-[10px] font-bold" style={{ color: '#94A3B8' }}>Ver todas</a>
              </div>
              <div className="space-y-2">
                {mockExports.map((exp, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl flex items-center justify-between gap-3" style={{ border: '1px solid #E5E7EB', backgroundColor: '#F8FAFC' }}>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate" style={{ color: '#0F172A' }}>{exp.name}</p>
                      <p className="text-[8px]" style={{ color: '#94A3B8' }}>{exp.date}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md`} style={
                      exp.type === 'PDF'
                        ? { backgroundColor: '#FFF1F2', color: '#F43F5E', border: '1px solid #FFE4E6' }
                        : { backgroundColor: '#EFF6FF', color: '#3B82F6', border: '1px solid #DBEAFE' }
                    }>
                      {exp.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </aside>
          )}
        </div>
      </div>
    </div>
  );
}
