'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LogIn, UserPlus, User, KeyRound, Sparkles, Mail, Lock, AlertCircle, CheckCircle,
  Sparkle, ArrowRight, BookOpen, GraduationCap, FileText, Check, ShieldCheck,
  Heart, Laptop, HelpCircle, X, ChevronRight, Plus
} from 'lucide-react';

const MAX_TRIAL_USERS = Number(process.env.NEXT_PUBLIC_MAX_TRIAL_USERS || '5');

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push('/');
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setShowLoginModal(false);
        router.push('/');
        router.refresh();
      } else if (mode === 'signup') {
        const { data: count, error: countError } = await supabase.rpc('get_user_profile_count');
        if (!countError && count !== null && count >= MAX_TRIAL_USERS) {
          throw new Error(`El período de prueba de REI DOCENTE ya alcanzó el cupo máximo de ${MAX_TRIAL_USERS} docentes. Contacta a la administradora para más información.`);
        }
        const { data, error: authError } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: nombre }
          },
        });
        if (authError) throw authError;
        if (data.session) {
          setSuccess('¡Registro exitoso! Iniciando sesión...');
          setTimeout(() => { setShowLoginModal(false); router.push('/'); }, 1500);
        } else {
          setSuccess('¡Registro exitoso! Por favor revisa tu correo electrónico para confirmar tu cuenta.');
        }
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setSuccess('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      }
    } catch (err: any) {
      let msg = err.message || 'Ocurrió un error inesperado';
      if (msg.includes('El período de prueba de REI DOCENTE')) {
        msg = msg.replace('Database error saving new user: ', '');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = (modalMode: 'login' | 'signup') => {
    setMode(modalMode);
    setError(null);
    setSuccess(null);
    setShowLoginModal(true);
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans antialiased overflow-x-hidden flex flex-col justify-between" style={{ backgroundColor: '#FCFCFE' }}>

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
            <Sparkle className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="block text-base font-black tracking-tight text-slate-800 leading-none">REI DOCENTE</span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Recursos Educativos Inteligentes</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => openAuthModal('login')} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200">
            Iniciar sesión
          </button>
          <button onClick={() => openAuthModal('signup')} className="px-4 py-2 text-sm font-bold text-white rounded-xl shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer" style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
            Regístrate gratis
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1">
        <section className="relative pt-20 pb-28 px-6 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-xs mb-2" style={{ backgroundColor: '#EDE7F6', color: '#6A1BFA', border: '1px solid rgba(106,27,250,0.2)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>IA alineada al currículum chileno de Lenguaje</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-800 leading-tight">
              Clases listas en segundos para <br />
              <span style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Lenguaje
              </span>
            </h1>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
              Materiales pedagógicos de alta calidad alineados al Currículum Nacional MINEDUC de Lenguaje. Planifica, crea guías, presentaciones y evaluaciones completas en segundos con nuestra IA de vanguardia.
            </p>
            <div className="pt-4">
              <button onClick={() => openAuthModal('signup')} className="inline-flex items-center gap-2 px-8 py-3.5 font-bold rounded-2xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer text-white" style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
                Pruébalo gratis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-white border-t border-slate-100 py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex flex-col items-center gap-2 p-2">
            <span className="text-2xl shrink-0 select-none">🇨🇱</span>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Alineado al Currículum MINEDUC de Lenguaje</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-2">
            <GraduationCap className="w-6 h-6 text-slate-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Diseñado para docentes chilenos</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-2">
            <Sparkle className="w-6 h-6 text-slate-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">IA ética y pedagógica</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-2">
            <ShieldCheck className="w-6 h-6 text-slate-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Tus datos siempre protegidos</p>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col items-center gap-2 p-2">
            <Heart className="w-6 h-6 text-rose-500 shrink-0 fill-rose-500" />
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Hecho con amor</p>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6 pt-2">
              <div className="inline-flex items-center justify-center p-2.5 rounded-2xl border mb-3" style={{ backgroundColor: 'rgba(106,27,250,0.1)', borderColor: 'rgba(106,27,250,0.2)' }}>
                <Sparkle className="w-6 h-6" style={{ color: '#6A1BFA' }} />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 mb-1">REI DOCENTE</h1>
              <p className="text-slate-400 text-xs font-semibold">Recursos Educativos Inteligentes</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 pb-2 mb-4">
              <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className="flex-1 pb-1.5 text-xs font-bold transition-all duration-300 border-b-2 flex items-center justify-center gap-1.5"
                style={{ borderColor: mode === 'login' ? '#6A1BFA' : 'transparent', color: mode === 'login' ? '#6A1BFA' : '#94a3b8' }}>
                <LogIn className="w-3.5 h-3.5" /> Ingresar
              </button>
              <button type="button" onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                className="flex-1 pb-1.5 text-xs font-bold transition-all duration-300 border-b-2 flex items-center justify-center gap-1.5"
                style={{ borderColor: mode === 'signup' ? '#6A1BFA' : 'transparent', color: mode === 'signup' ? '#6A1BFA' : '#94a3b8' }}>
                <UserPlus className="w-3.5 h-3.5" /> Registrarse
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-2xl flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-2xl flex items-start gap-2.5 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" required placeholder="e.g. María González" value={nombre} onChange={(e) => setNombre(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all duration-300"
                      style={{ '--tw-ring-color': '#6A1BFA' } as any}
                      onFocus={(e) => e.target.style.borderColor = '#6A1BFA'}
                      onBlur={(e) => e.target.style.borderColor = '#f1f5f9'} />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required placeholder="docente@escuela.cl" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all duration-300"
                    onFocus={(e) => e.target.style.borderColor = '#6A1BFA'}
                    onBlur={(e) => e.target.style.borderColor = '#f1f5f9'} />
                </div>
              </div>
              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contraseña</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                        className="text-[10px] font-bold transition-colors" style={{ color: '#6A1BFA' }}>
                        ¿La olvidaste?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all duration-300"
                      onFocus={(e) => e.target.style.borderColor = '#6A1BFA'}
                      onBlur={(e) => e.target.style.borderColor = '#f1f5f9'} />
                  </div>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none text-xs cursor-pointer text-white"
                style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  <><LogIn className="w-3.5 h-3.5" /> Iniciar Sesión</>
                ) : mode === 'signup' ? (
                  <><UserPlus className="w-3.5 h-3.5" /> Crear Cuenta</>
                ) : (
                  <><KeyRound className="w-3.5 h-3.5" /> Recuperar Contraseña</>
                )}
              </button>
              {mode === 'forgot' && (
                <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-1 block transition-colors font-bold">
                  Volver a Iniciar Sesión
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
