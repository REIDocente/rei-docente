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
  experiencias: Layers,
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
  'lecturas':     { color: '#EC4899', bg: '#FDF2F8', label: 'rosado'  },
  'experiencias': { color: '#F59E0B', bg: '#FFFBEB', label: 'amarillo'},
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
        if (!user) { router.push('/login'); return; }
        setUser(user);
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
        const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
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

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.first_name || (profile as any)?.full_name || '';
  const firstName = fullName ? fullName.split(' ')[0] : 'Docente';
  const email = user?.email || '';
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

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white px-8 py-4 justify-between items-center z-20 border-b" style={{ borderColor: '#E5E7EB' }}>
          <div className="text-xs font-semibold" style={{ color: '#64748B' }}>Panel Docente</div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl border border-transparent hover:border-[#E5E7EB] hover:bg-white transition-all" style={{ color: '#64748B' }}>
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm" style={{ backgroundColor: '#6D28F5' }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Central & Right Layout */}
        <div className="flex-1 flex flex-col xl:flex-row min-w-0">

          {/* ── CONTENIDO CENTRAL ── */}
          <main className="flex-1 p-6 md:p-8 space-y-8 min-w-0">
            {currentTab === 'inicio' && (
              <>
                {/* BANNER BIENVENIDA */}
                <div
                  className="rounded-3xl p-6 flex items-center justify-between relative overflow-hidden border"
                  style={{
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                    borderColor: '#E5E7EB',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
                  }}
                >
                  <div className="space-y-2 max-w-lg z-10">
                    <h1 className="text-2xl font-black" style={{ color: '#0F172A' }}>
                      Hola 👋 {firstName || 'Docente'}, ¿Qué vamos a crear hoy?
                    </h1>
                    <p className="text-xs leading-relaxed font-semibold" style={{ color: '#64748B' }}>
                      Todo lo que necesitas para planificar, enseñar y evaluar con inteligencia artificial.
                    </p>
                  </div>
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
                    <div className="w-16 h-16 rounded-full bg-white border flex items-center justify-center shrink-0 shadow-sm animate-pulse" style={{ borderColor: '#E5E7EB' }}>
                      <Sparkles className="w-8 h-8" style={{ color: '#6D28F5' }} />
                    </div>
                  </div>
                </div>

                {/* GRILLA DE MÓDULOS */}
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748B' }}>Accesos Rápidos a Módulos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tools.map((tool) => {
                      const Icon = cardIcons[tool.iconKey];
                      const mod = MODULE_COLORS[tool.id] || { color: '#6D28F5', bg: '#F0EBFF' };
                      return (
                        <div
                          key={tool.id}
                          className="bg-white rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:scale-[1.005]"
                          style={{
                            border: '1.5px solid #E5E7EB',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
                          }}
                        >
                          <div className="flex gap-4 items-start">
                            {/* Icono con color del módulo */}
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white"
                              style={{ backgroundColor: mod.color }}
                            >
                              {Icon && <Icon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <h3 className="font-bold text-xs" style={{ color: '#0F172A' }}>{tool.title}</h3>
                              <p className="text-[10px] leading-normal font-medium" style={{ color: '#64748B' }}>
                                {tool.description}
                              </p>
                              <div className="pt-2">
                                {tool.enabled && tool.link ? (
                                  <Link
                                    href={tool.link}
                                    className="inline-flex items-center gap-1 px-4 py-2 text-white text-[10px] font-bold rounded-xl transition-colors duration-200 shadow-sm"
                                    style={{ backgroundColor: '#6D28F5' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#5B21D9')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6D28F5')}
                                  >
                                    Crear <ChevronRight className="w-3 h-3" />
                                  </Link>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1.5 text-[10px] font-bold rounded-xl select-none cursor-not-allowed" style={{ backgroundColor: '#F8FAFC', color: '#94A3B8', border: '1px solid #E5E7EB' }}>
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
