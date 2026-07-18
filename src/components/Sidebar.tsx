'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  Sparkle
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen = false, setSidebarOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [initials, setInitials] = useState('U');
  const [userName, setUserName] = useState('Docente');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const email = user.email || '';
          const initLetters = fullName
            ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
            : (email ? email[0].toUpperCase() : 'U');
          setInitials(initLetters);
          setUserName(fullName || email.split('@')[0]);
        }
      } catch (err) {
        console.warn('Error fetching user for sidebar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { href: '/', label: 'Inicio', icon: Home, id: 'inicio' },
    { href: '/planner/new', label: 'Kit de Clase', icon: PlusCircle, id: 'kit' },
    { href: '/play', label: 'REI Play', icon: Gamepad2, id: 'play' },
    { href: '/evaluaciones', label: 'Evaluaciones y Rúbricas', icon: FileText, id: 'evaluaciones' },
    { href: '/guias', label: 'Guías de Aprendizaje', icon: BookOpen, id: 'guias' },
  ];

  // Helper to determine if link is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-105 flex flex-col justify-between p-6 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-violet-650 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-violet-500/10">
                <Sparkle className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-black tracking-tight text-slate-800 leading-none">
                  REI DOCENTE
                </span>
                <span className="text-[8.5px] font-extrabold text-slate-400 tracking-wide uppercase mt-1 block">
                  Recursos Educativos Inteligentes
                </span>
              </div>
            </div>
            {setSidebarOpen && (
              <button 
                className="lg:hidden text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-colors" 
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Menú Principal */}
          <nav className="space-y-1.5 pt-4">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 border ${
                    active 
                      ? 'bg-gradient-to-r from-violet-50/70 via-purple-50/70 to-pink-50/40 border-violet-100/50 text-violet-750 font-bold shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-semibold'
                  }`}
                  onClick={() => setSidebarOpen && setSidebarOpen(false)}
                >
                  <Icon className={`w-4.5 h-4.5 transition-colors ${active ? 'text-violet-600' : 'text-slate-450'}`} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Tu Espacio (Biblioteca y Ajustes) */}
          <div className="pt-4 border-t border-slate-100/80">
            <span className="px-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Tu Espacio</span>
            <nav className="space-y-1.5">
              <Link 
                href="/#biblioteca"
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 border ${
                  pathname === '/' && typeof window !== 'undefined' && window.location.hash === '#biblioteca'
                    ? 'bg-gradient-to-r from-violet-50/70 via-purple-50/70 to-pink-50/40 border-violet-100/50 text-violet-750 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-semibold'
                }`}
                onClick={() => setSidebarOpen && setSidebarOpen(false)}
              >
                <Library className="w-4.5 h-4.5 text-slate-450" />
                <span className="text-xs">Mis Recursos</span>
              </Link>
              <Link 
                href="/#configuracion"
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 border ${
                  pathname === '/' && typeof window !== 'undefined' && window.location.hash === '#configuracion'
                    ? 'bg-gradient-to-r from-violet-50/70 via-purple-50/70 to-pink-50/40 border-violet-100/50 text-violet-750 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-semibold'
                }`}
                onClick={() => setSidebarOpen && setSidebarOpen(false)}
              >
                <Settings className="w-4.5 h-4.5 text-slate-450" />
                <span className="text-xs">Ajustes</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Perfil del Docente & Logout */}
        <div className="space-y-4 pt-4 border-t border-slate-100/80">
          <div className="bg-gradient-to-tr from-slate-50 to-slate-50/30 border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 select-none">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-black text-slate-750 truncate leading-tight">
                  {userName}
                </span>
                <span className="text-[9px] text-slate-450 font-semibold block leading-none mt-0.5">
                  Docente Activo
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-rose-50 text-slate-455 hover:text-rose-600 rounded-xl transition-colors shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
