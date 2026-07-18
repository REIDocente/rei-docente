'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LogIn, UserPlus, User, KeyRound, Sparkles, Mail, Lock,
  AlertCircle, CheckCircle, Sparkle, ArrowRight, ShieldCheck,
  Heart, X, Calendar, Users, Clock, Star, GraduationCap
} from 'lucide-react';

const MAX_TRIAL_USERS = Number(process.env.NEXT_PUBLIC_MAX_TRIAL_USERS || '20');

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
          throw new Error(`El período de prueba ha alcanzado el cupo máximo de ${MAX_TRIAL_USERS} docentes.`);
        }
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
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
          setSuccess('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
        }
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setSuccess('Enviamos un enlace de recuperación a tu correo.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setError(message);
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

  const modules = [
    { name: 'Planificación', desc: 'Clases alineadas al currículo', color: '#6A1BFA', bg: '#EDE7F6' },
    { name: 'REI Lecturas', desc: 'Biblioteca inteligente', color: '#00A878', bg: '#E6F7F2' },
    { name: 'Evaluaciones', desc: 'Rúbricas y pruebas', color: '#FF8A65', bg: '#FFF0EB' },
    { name: 'REI Play', desc: 'Gamificación educativa', color: '#D4A017', bg: '#FFF8E7' },
    { name: 'Rec. Visuales', desc: 'Presentaciones y más', color: '#60A5FA', bg: '#EFF6FF' },
    { name: 'Guías', desc: 'Guías y actividades', color: '#8B5CF6', bg: '#F3EEFF' },
  ];

  const stats = [
    { icon: <Users className="w-5 h-5" />, stat: '+10.000', desc: 'Docentes confían en REI Docente', color: '#6A1BFA' },
    { icon: <Clock className="w-5 h-5" />, stat: 'Ahorra horas', desc: 'en planificación y evaluación', color: '#00A878' },
    { icon: <ShieldCheck className="w-5 h-5" />, stat: '100% Alineado', desc: 'al Currículum MINEDUC', color: '#60A5FA' },
    { icon: <Star className="w-5 h-5" style={{ fill: '#FFC857', color: '#FFC857' }} />, stat: 'Calidad pedagógica', desc: 'respaldada por expertos', color: '#FFC857' },
  ];

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden flex flex-col" style={{ backgroundColor: '#F3F0FF' }}>

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 w-full px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(243,240,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(106,27,250,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
            <Sparkle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-slate-900 leading-none">REI DOCENTE</div>
            <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Recursos Educativos Inteligentes</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all border-2"
            style={{ color: '#6A1BFA', borderColor: '#6A1BFA', backgroundColor: 'transparent' }}>
            Iniciar sesión
          </button>
          <button
            onClick={() => openAuthModal('signup')}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
            Regístrate gratis
          </button>
        </div>
      </header>

      {/* HERO */}
      <main className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* LEFT */}
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: '#EDE7F6', color: '#6A1BFA', border: '1px solid rgba(106,27,250,0.2)' }}>
              <Sparkles className="w-4 h-4" />
              IA alineada al currículum chileno de Lenguaje
            </div>

            <p className="text-slate-600 text-base font-medium flex items-center gap-2 flex-wrap">
              <Heart className="w-4 h-4 shrink-0" style={{ fill: '#fb7185', color: '#fb7185' }} />
              Tú enseñas con pasión, nosotros te damos el tiempo para{' '}
              <span style={{ color: '#6A1BFA', fontWeight: 700 }}>inspirar.</span>
            </p>

            <div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Clases listas en<br />segundos para
              </h1>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mt-1" style={{ background: 'linear-gradient(135deg, #6A1BFA 0%, #FF8A65 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Lenguaje
              </h1>
            </div>

            <div className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl" style={{ backgroundColor: 'white', border: '1.5px solid #E7EAF3', boxShadow: '0 2px 8px rgba(106,27,250,0.08)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#EDE7F6' }}>
                <Calendar className="w-5 h-5" style={{ color: '#6A1BFA' }} />
              </div>
              <div>
                <div className="text-sm font-black" style={{ color: '#6A1BFA' }}>Por 7 días será gratis</div>
                <div className="text-xs text-slate-500 font-medium">y luego será pago</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => openAuthModal('signup')}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-base shadow-xl"
                style={{ background: 'linear-gradient(135deg, #5A0EE8, #6A1BFA)', boxShadow: '0 8px 24px rgba(106,27,250,0.35)' }}>
                Regístrate gratis por 7 días
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Sin tarjeta de crédito · Cancela cuando quieras
              </div>
            </div>
          </div>

          {/* RIGHT — App mockup */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #6A1BFA, #8B5CF6)' }} />
            <div className="relative w-full max-w-lg">
              <div className="rounded-2xl shadow-2xl overflow-hidden border-4 border-white" style={{ background: '#1a1a2e' }}>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: '#16213e' }}>
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 mx-4 h-5 rounded-md flex items-center px-2" style={{ backgroundColor: '#0f3460' }}>
                    <span className="text-[10px] text-slate-400">rei-docente.vercel.app</span>
                  </div>
                </div>
                <div className="p-4" style={{ backgroundColor: '#FAF9FC' }}>
                  <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid #E7EAF3' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md" style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }} />
                      <span className="text-[10px] font-black text-slate-700">REI DOCENTE</span>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#6A1BFA' }}>PRO</span>
                    </div>
                    <div className="w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }} />
                  </div>
                  <div className="mb-3">
                    <div className="text-[11px] font-black text-slate-800">¡Hola, Docente! 👋</div>
                    <div className="text-[9px] text-slate-400 font-medium">¿Qué vamos a crear hoy? ✨</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {modules.map((m, i) => (
                      <div key={i} className="p-2 rounded-xl" style={{ backgroundColor: 'white', border: `1.5px solid ${m.bg}` }}>
                        <div className="w-5 h-5 rounded-md mb-1.5 flex items-center justify-center" style={{ backgroundColor: m.bg }}>
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                        </div>
                        <div className="text-[9px] font-black text-slate-700">{m.name}</div>
                        <div className="text-[7px] text-slate-400 font-medium leading-tight">{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating card 1 */}
              <div className="absolute -top-4 -right-8 bg-white rounded-2xl shadow-xl p-3 border border-slate-100 w-32">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EDE7F6' }}>
                    <GraduationCap className="w-3 h-3" style={{ color: '#6A1BFA' }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-700">Planificación</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: '#EDE7F6' }} />
                  <div className="h-1.5 rounded-full w-4/5" style={{ backgroundColor: '#EDE7F6' }} />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00A878' }} />
                  <span className="text-[8px] font-bold" style={{ color: '#00A878' }}>Listo</span>
                </div>
              </div>

              {/* Floating card 2 */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-3 border border-slate-100 w-36">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF0EB' }}>
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FF8A65' }} />
                  </div>
                  <span className="text-[10px] font-black" style={{ color: '#FF8A65' }}>Evaluación</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium mb-2">20 preguntas</div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E7EAF3' }}>
                  <div className="h-full rounded-full w-3/4" style={{ backgroundColor: '#FF8A65' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* STATS */}
      <div className="w-full py-8 px-6" style={{ backgroundColor: 'white', borderTop: '1px solid #E7EAF3' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}18`, color: item.color }}>
                {item.icon}
              </div>
              <div className="text-sm font-black text-slate-800">{item.stat}</div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
                <Sparkle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">REI DOCENTE</h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">Recursos Educativos Inteligentes</p>
            </div>

            <div className="flex rounded-xl p-1 mb-6" style={{ backgroundColor: '#F8F7FD' }}>
              {(['login', 'signup'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => { setMode(tab); setError(null); setSuccess(null); }}
                  className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                  style={{
                    backgroundColor: mode === tab ? 'white' : 'transparent',
                    color: mode === tab ? '#6A1BFA' : '#94a3b8',
                    boxShadow: mode === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}>
                  {tab === 'login' ? 'Ingresar' : 'Registrarse'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl flex items-start gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" required placeholder="María González" value={nombre} onChange={e => setNombre(e.target.value)}
                      className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
                      style={{ backgroundColor: '#F8F7FD', border: '1.5px solid #E7EAF3' }} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="email" required placeholder="docente@escuela.cl" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
                    style={{ backgroundColor: '#F8F7FD', border: '1.5px solid #E7EAF3' }} />
                </div>
              </div>
              {mode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contraseña</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => { setMode('forgot'); setError(null); }}
                        className="text-[10px] font-bold" style={{ color: '#6A1BFA' }}>
                        ¿La olvidaste?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none"
                      style={{ backgroundColor: '#F8F7FD', border: '1.5px solid #E7EAF3' }} />
                  </div>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #6A1BFA, #8B5CF6)' }}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : mode === 'login' ? (
                  <><LogIn className="w-4 h-4" /> Iniciar Sesión</>
                ) : mode === 'signup' ? (
                  <><UserPlus className="w-4 h-4" /> Crear Cuenta Gratis</>
                ) : (
                  <><KeyRound className="w-4 h-4" /> Enviar Enlace</>
                )}
              </button>
              {mode === 'forgot' && (
                <button type="button" onClick={() => { setMode('login'); setError(null); }}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-bold">
                  ← Volver a Iniciar Sesión
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
