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
  Sparkle,
  Bell,
  MoreVertical,
  ExternalLink,
  Gamepad2
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
};

const toolIconPaths: Record<string, string> = {
  kit: '/assets/dashboard/icons/kit_icon.png',
  presentaciones: '/assets/dashboard/icons/presentaciones_icon.png',
  evaluaciones: '/assets/dashboard/icons/evaluaciones_icon.png',
  guias: '/assets/dashboard/icons/guias_icon.png',
  gamificacion: '/assets/dashboard/icons/gamificacion_icon.png',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [guias, setGuias] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [visuals, setVisuals] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState<'all' | 'kits' | 'guias' | 'evals' | 'visuals'>('all');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'inicio' | 'biblioteca'>('inicio');

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Fetch plannings
        const { data: planningsData } = await supabase
          .from('plannings')
          .select('id, created_at, subject, grade, learning_objective, unit')
          .order('created_at', { ascending: false });
        setPlannings(planningsData || []);

        // Fetch guias (fail-safe)
        try {
          const { data: guiasData } = await supabase
            .from('guias')
            .select('id, created_at, nivel, eje, titulo, formato, rti_nivel')
            .order('created_at', { ascending: false });
          setGuias(guiasData || []);
        } catch (e) {
          console.warn('Guias table not queryable:', e);
        }

        // Fetch evaluaciones (fail-safe)
        try {
          const { data: evsData } = await supabase
            .from('evaluaciones')
            .select('id, created_at, nivel, eje, titulo, n_preguntas, dificultad')
            .order('created_at', { ascending: false });
          setEvaluaciones(evsData || []);
        } catch (e) {
          console.warn('Evaluaciones table not queryable:', e);
        }

        // Fetch recursos visuales (fail-safe)
        try {
          const { data: visData } = await supabase
            .from('recursos_visuales')
            .select('id, created_at, tema, tipo, imagen_url, contenido_json')
            .order('created_at', { ascending: false });
          setVisuals(visData || []);
        } catch (e) {
          console.warn('Recursos visuales table not queryable:', e);
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (profileData) setProfile(profileData as UserProfile);
      } catch (err) {
        console.error('Error in checkAuthAndFetch:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#biblioteca') {
          setCurrentTab('biblioteca');
        } else {
          setCurrentTab('inicio');
        }
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
      
      if (table === 'plannings') {
        setPlannings(plannings.filter(p => p.id !== id));
      } else if (table === 'guias') {
        setGuias(guias.filter(g => g.id !== id));
      } else if (table === 'evaluaciones') {
        setEvaluaciones(evaluaciones.filter(ev => ev.id !== id));
      } else if (table === 'recursos_visuales') {
        setVisuals(visuals.filter(v => v.id !== id));
      }
      setActiveDropdownId(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('No se pudo eliminar el recurso.');
    } finally {
      setDeletingId(null);
    }
  };



  // Filter logic across different tab states
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
      color: 'bg-violet-50/70 border-violet-100 text-violet-700'
    },
    {
      id: 'play',
      iconKey: 'gamificacion',
      title: 'REI Play',
      description: 'Gamificación y motores de juego interactivos con inteligencia artificial.',
      enabled: true,
      link: '/play',
      color: 'bg-indigo-50/70 border-indigo-100 text-indigo-700'
    },
    {
      id: 'evaluaciones',
      iconKey: 'evaluaciones',
      title: 'Evaluaciones y Rúbricas',
      description: 'Evaluaciones y rúbricas alineadas al currículo.',
      enabled: true,
      link: '/evaluaciones',
      color: 'bg-rose-50/60 border-rose-100 text-rose-700'
    },
    {
      id: 'guias',
      iconKey: 'guias',
      title: 'Guías de Aprendizaje',
      description: 'Guías de aprendizaje listas para usar.',
      enabled: true,
      link: '/guias',
      color: 'bg-emerald-50/60 border-emerald-100 text-emerald-700'
    },
    {
      id: 'lecturas',
      iconKey: 'guias',
      title: 'REI Lecturas',
      description: 'Planificaciones, guías, evaluaciones y experiencias desde tus lecturas domiciliarias.',
      enabled: true,
      link: '/lecturas',
      color: 'bg-teal-50/70 border-teal-100 text-teal-700'
    }
  ];

  // Helper to construct dynamic greetings based on local time
  const getGreetingText = (name: string) => {
    if (!name) return '¡Bienvenido(a) a REI DOCENTE! 👋';
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return `¡Buenos días, ${name}! 👋`;
    } else if (hour >= 12 && hour < 20) {
      return `¡Buenas tardes, ${name}! ☀️`;
    } else {
      return `¡Buenas noches, ${name}! 🌙`;
    }
  };

  // Extract user details
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.first_name || (profile as any)?.full_name || '';
  const firstName = fullName ? fullName.split(' ')[0] : 'Docente';
  const email = user?.email || '';
  
  // Create initials for profile placeholder
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : (email ? email[0].toUpperCase() : 'UD');

  // Dynamic plan and status logic based on database fields
  let planLabel = 'Plan Docente';
  let statusLabel = 'Prueba';

  if (profile) {
    const rawPlan = profile.plan_name || profile.subscription_plan;
    
    if (rawPlan) {
      const planLower = rawPlan.toLowerCase();
      if (planLower === 'docente') {
        planLabel = 'Plan Docente';
      } else if (planLower === 'pro') {
        planLabel = 'Plan Pro';
      } else if (planLower === 'premium') {
        planLabel = 'Plan Premium';
      } else {
        planLabel = 'Plan Docente';
      }

      if (profile.plan_status === 'active') {
        statusLabel = 'Activo';
      } else if (profile.plan_status === 'trial') {
        statusLabel = 'Prueba';
      } else if (profile.plan_status === 'expired') {
        statusLabel = 'Expirado';
      }
    }
  }

  // Combine generated documents for a unified recent list
  const recentDocuments = [
    ...plannings.map(p => ({ id: p.id, title: `Unidad: ${p.unit}`, type: 'Kit de Clase', typeKey: 'plannings', date: p.created_at, link: `/planner/${p.id}`, meta: p.grade, subject: p.subject, estilo: null, paleta: null, formato: null })),
    ...guias.map(g => ({ id: g.id, title: g.titulo || 'Guía de Trabajo', type: 'Guía', typeKey: 'guias', date: g.created_at, link: `/guias/${g.id}`, meta: g.nivel, subject: 'Lenguaje', estilo: null, paleta: null, formato: null })),
    ...evaluaciones.map(ev => ({ id: ev.id, title: ev.titulo || 'Evaluación Escrita', type: 'Evaluación', typeKey: 'evaluaciones', date: ev.created_at, link: `/evaluaciones/${ev.id}`, meta: ev.nivel, subject: 'Lenguaje', estilo: null, paleta: null, formato: null })),
    ...visuals.map(v => ({ id: v.id, title: `Tema: ${v.tema}`, type: 'Recurso Visual', typeKey: 'recursos_visuales', date: v.created_at, link: `/visual`, meta: 'General', subject: v.tipo, estilo: v.contenido_json?.estilo, paleta: v.contenido_json?.paleta, formato: v.contenido_json?.formato }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-violet-700 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando tu Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-slate-700 flex font-sans antialiased selection:bg-violet-100 selection:text-violet-950 overflow-x-hidden">
      
      {/* ─── 1. SIDEBAR IZQUIERDA FIJA ─── */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ─── CONTENEDOR PRINCIPAL ─── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-[#E2E8F0]/70 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:text-slate-800" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-bold bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">
              REI DOCENTE
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-violet-700 text-white flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-[#FAF9FC] px-8 py-4 justify-between items-center z-20 border-b border-slate-100/30">
          <div className="text-xs font-semibold text-slate-400">Panel Docente</div>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
            </button>
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-violet-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Central & Right Columns Layout */}
        <div className="flex-1 flex flex-col xl:flex-row min-w-0">
          
          {/* ─── CONTENIDO CENTRAL ─── */}
          <main className="flex-1 p-6 md:p-8 xl:p-8 space-y-8 min-w-0">
            
            {currentTab === 'inicio' && (
              <>
                {/* ─── 3. BANNER DE BIENVENIDA ─── */}
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-2 max-w-lg z-10">
                    <h1 className="text-2xl font-black text-slate-800">
                      Hola 👋 {firstName || 'Docente'}, ¿Qué vamos a crear hoy?
                    </h1>
                    <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                      Todo lo que necesitas para planificar, enseñar y evaluar con inteligencia artificial.
                    </p>
                  </div>
                  {/* Decorative welcome illustration or fallback sparkle icon */}
                  <div className="hidden sm:flex shrink-0 mr-4 items-center justify-center relative w-36 h-24">
                    <img
                      src="/assets/dashboard/welcome_illustration.png"
                      alt="Bienvenida"
                      className="w-full h-full object-contain rounded-2xl z-10 hidden"
                      onLoad={(e) => {
                        e.currentTarget.classList.remove('hidden');
                        const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallbackEl) fallbackEl.style.display = 'none';
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallbackEl) fallbackEl.style.display = 'flex';
                      }}
                    />
                    <div
                      className="w-16 h-16 rounded-full bg-white/40 border border-white/60 items-center justify-center shrink-0 shadow-sm animate-pulse flex"
                    >
                      <Sparkles className="w-8 h-8 text-violet-700" />
                    </div>
                  </div>
                </div>

                {/* ─── 4. GRILLA DE ACCESO RÁPIDO A MÓDULOS ─── */}
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Accesos Rápidos a Módulos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tools.map((tool) => {
                      const Icon = cardIcons[tool.iconKey];
                      return (
                        <div
                          key={tool.id}
                          className={`bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                            tool.enabled
                              ? 'shadow-xs hover:shadow-md hover:scale-[1.005] hover:border-violet-100/50'
                              : 'opacity-70'
                          }`}
                        >
                          <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-slate-100 relative overflow-hidden bg-slate-50">
                              {toolIconPaths[tool.iconKey] ? (
                                <img
                                  src={toolIconPaths[tool.iconKey]}
                                  alt={tool.title}
                                  className="w-full h-full object-cover hidden"
                                  onLoad={(e) => {
                                    e.currentTarget.classList.remove('hidden');
                                    const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallbackEl) fallbackEl.style.display = 'none';
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallbackEl = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallbackEl) fallbackEl.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full flex items-center justify-center rounded-xl ${
                                  tool.enabled
                                    ? 'bg-gradient-to-tr from-violet-600 via-purple-500 to-pink-500 text-white border-transparent shadow-violet-500/10'
                                    : 'bg-slate-50 border-slate-100 text-slate-350'
                                }`}
                              >
                                {Icon && <Icon className="w-5 h-5" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-slate-800 text-xs">{tool.title}</h3>
                                {tool.badge && (
                                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded-md shrink-0">
                                    {tool.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-500 text-[10px] leading-normal font-medium">
                                {tool.description}
                              </p>
                              <div className="pt-2">
                                {tool.enabled && tool.link ? (
                                  <Link
                                    href={tool.link}
                                    id={`btn-${tool.id}`}
                                    className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-sm active:scale-[0.98]"
                                  >
                                    Crear <ChevronRight className="w-3 h-3" />
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-350 text-[10px] font-bold rounded-xl select-none cursor-not-allowed">
                                    Próximamente
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ─── 5. BIBLIOTECA (RECURSOS RECIENTES) ─── */}
            {currentTab === 'biblioteca' && (
              <div id="biblioteca" className="bg-white border border-[#E2E8F0]/50 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Mi Biblioteca</h2>
                    <p className="text-[10px] text-slate-400">Revisa y administra todo el material generado recientemente.</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar recurso..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50/60 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-700 transition-all"
                    />
                  </div>
                </div>

                {/* Categorization Tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
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
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        activeLibraryTab === tab.id
                          ? 'bg-violet-700 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-100/50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Document List / Table */}
                <div className="overflow-x-auto">
                  {recentDocuments.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <p className="text-xs text-slate-400 italic">Aún no tienes planificaciones, crea la primera aquí.</p>
                      <Link
                        href="/planner/new"
                        className="inline-flex items-center gap-1 bg-violet-700 hover:bg-violet-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xs"
                      >
                        Planificar clase <Plus className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <table className="w-full text-xs text-slate-500 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-605">
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
                            <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-700 line-clamp-1 flex items-center gap-2 flex-wrap">
                                  {doc.title}
                                  {doc.estilo && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-50 border border-slate-200/65 rounded text-[8px] font-bold text-slate-500 uppercase tracking-wide">
                                      {doc.estilo.replace('_', ' ')}
                                    </span>
                                  )}
                                  {doc.paleta && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-50 border border-indigo-200/65 rounded text-[8px] font-bold text-indigo-650 uppercase tracking-wide">
                                      {doc.paleta.replace('_', ' ')}
                                    </span>
                                  )}
                                  {doc.formato && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 border border-amber-200/65 rounded text-[8px] font-bold text-amber-650 uppercase tracking-wide">
                                      {doc.formato.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-slate-400 font-semibold uppercase">{doc.type}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-600">{doc.meta}</div>
                                <div className="text-[9px] text-slate-400">{doc.subject}</div>
                              </td>
                              <td className="p-3 text-[10px] text-slate-400">
                                {new Date(doc.date).toLocaleDateString('es-CL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="p-3 text-right relative">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Link
                                    href={doc.link}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 text-[10px] font-bold rounded-xl transition-all duration-200"
                                  >
                                    Abrir
                                  </Link>
                                  <button
                                    onClick={(e) => handleDelete(doc.id, doc.typeKey as any, e)}
                                    disabled={deletingId === doc.id}
                                    className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
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
                  <div className="pt-2 border-t border-slate-50 text-center">
                    <Link 
                      href="/planner/new" 
                      className="inline-flex items-center gap-1.5 text-xs text-violet-700 hover:text-violet-800 font-bold transition-all duration-200"
                    >
                      Ver todas mis planificaciones
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

          </main>

          {/* ─── 6. PANEL DERECHO CON WIDGETS ─── */}
          <aside className="w-full xl:w-76 bg-white border-t xl:border-t-0 xl:border-l border-[#E2E8F0]/50 p-6 space-y-6 shrink-0">
            
            {/* Actividad Reciente */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-violet-700 animate-pulse" />
                  Actividad reciente
                </h2>
                <a href="#biblioteca" className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">Ver todas</a>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center text-violet-700 text-[10px] font-bold shrink-0 mt-0.5">
                    Plan
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-700">Planificación creada</p>
                    <p className="text-[9px] text-slate-400 truncate">Lenguaje - 2° Medio</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-[10px] font-bold shrink-0 mt-0.5">
                    Guía
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-700">Guía generada</p>
                    <p className="text-[9px] text-slate-400 truncate">El Mito de Sísifo - 2° Medio</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Últimas Planificaciones */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-pink-500" />
                  Últimas planificaciones
                </h2>
                <Link href="/planner/new" className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">Ver todas</Link>
              </div>
              
              {plannings.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Aún no hay planificaciones.</p>
              ) : (
                <div className="space-y-2">
                  {plannings.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      href={`/planner/${p.id}`}
                      className="block p-3 rounded-xl border border-slate-50 hover:border-violet-100 hover:bg-violet-50/5 transition-all duration-200"
                    >
                      <p className="text-[10px] font-bold text-slate-700 truncate">U: {p.unit}</p>
                      <div className="flex items-center justify-between text-[8px] text-slate-400 mt-1">
                        <span className="font-semibold text-slate-500">{p.grade}</span>
                        <span>{new Date(p.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Últimas Exportaciones */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileDown className="w-3.5 h-3.5 text-sky-500" />
                  Últimas exportaciones
                </h2>
                <a href="#biblioteca" className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">Ver todas</a>
              </div>
              <div className="space-y-2">
                {mockExports.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-50 flex items-center justify-between gap-3 bg-slate-50/70"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-700 truncate">{exp.name}</p>
                      <p className="text-[8px] text-slate-400">{exp.date}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                      exp.type === 'PDF' 
                        ? 'bg-rose-50 text-rose-500 border border-rose-100/50' 
                        : 'bg-blue-50 text-blue-500 border border-blue-100/50'
                    }`}>
                      {exp.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
