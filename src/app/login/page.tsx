'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LogIn, UserPlus, User, KeyRound, Sparkles, Mail, Lock,
  AlertCircle, CheckCircle, ArrowRight, ShieldCheck,
  Heart, X, Calendar, Users, Clock, Star, GraduationCap
} from 'lucide-react';

const MAX_TRIAL_USERS = Number(process.env.NEXT_PUBLIC_MAX_TRIAL_USERS || '14');

// Ventana de registro de la prueba piloto (solo bloquea nuevos registros, nunca el login)
const PILOT_START = new Date('2026-07-23T00:00:00-04:00');
const PILOT_END   = new Date('2026-07-29T23:59:59-04:00');

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
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setShowLoginModal(false);
        if (data?.session) {
          router.push('/');
        } else {
          router.push('/');
        }
      } else if (mode === 'signup') {
        // Validación 1: ventana de registro 23–29 de julio de 2026
        const now = new Date();
        if (now < PILOT_START || now > PILOT_END) {
          throw new Error('El período de inscripción de la prueba piloto de REÍ Docente ha finalizado.');
        }
        // Validación 2: cupo máximo de docentes
        const { data: count, error: countError } = await supabase.rpc('get_user_profile_count');
        if (!countError && count !== null && count >= MAX_TRIAL_USERS) {
          throw new Error('Los cupos de la prueba piloto de REÍ Docente ya fueron completados. Muchas gracias por tu interés.');
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
        // Guardar full_name en user_profiles si el registro fue inmediato (sin confirmación de email)
        if (data.session && data.user && nombre) {
          await supabase.from('user_profiles').upsert({ id: data.user.id, full_name: nombre }, { onConflict: 'id' });
        }
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
    { name: 'Planificación', desc: 'Clases alineadas al currículo', color: '#7C3AED', bg: '#EDE7F6' },
    { name: 'REI Lecturas', desc: 'Biblioteca inteligente', color: '#00A878', bg: '#E6F7F2' },
    { name: 'Evaluaciones', desc: 'Rúbricas y pruebas', color: '#FF8A65', bg: '#FFF0EB' },
    { name: 'REI Play', desc: 'Gamificación educativa', color: '#D4A017', bg: '#FFF8E7' },
    { name: 'Rec. Visuales', desc: 'Presentaciones y más', color: '#60A5FA', bg: '#EFF6FF' },
    { name: 'Guías', desc: 'Guías y actividades', color: '#A855F7', bg: '#F3EEFF' },
  ];

  const stats = [
    { icon: <Users className="w-5 h-5" />, stat: '+10.000', desc: 'Docentes confían en REI Docente', color: '#7C3AED' },
    { icon: <Clock className="w-5 h-5" />, stat: 'Ahorra horas', desc: 'en planificación y evaluación', color: '#00A878' },
    { icon: <ShieldCheck className="w-5 h-5" />, stat: '100% Alineado', desc: 'al Currículum MINEDUC', color: '#60A5FA' },
    { icon: <Star className="w-5 h-5" style={{ fill: '#FFC857', color: '#FFC857' }} />, stat: 'Calidad pedagógica', desc: 'respaldada por expertos', color: '#FFC857' },
  ];

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden flex flex-col" style={{ backgroundColor: '#F3F0FF' }}>

      {/* NAVBAR */}
      <header className="sticky top-0 z-30 w-full px-6 py-4 flex items-center justify-between" style={{ backgroundColor: 'rgba(243,240,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rei.png" alt="REI DOCENTE" className="w-9 h-9 rounded-xl object-contain" />
          <div>
            <div className="text-base font-black tracking-tight text-slate-900 leading-none">REI DOCENTE</div>
            <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Recursos Educativos Inteligentes</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all border-2"
            style={{ color: '#7C3AED', borderColor: '#7C3AED', backgroundColor: 'transparent' }}>
            Iniciar sesión
          </button>
          <button
            onClick={() => openAuthModal('signup')}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
            Regístrate gratis
          </button>
        </div>
      </header>

      {/* HERO */}
      <main className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* LEFT — Logo grande */}
          <div className="flex flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-rei.png"
              alt="REI DOCENTE"
              className="w-80 h-80 sm:w-96 sm:h-96 object-contain drop-shadow-2xl"
            />
            <div className="mt-4 text-center space-y-1">
              <p className="text-sm font-bold text-slate-500 tracking-wide">Planifica · Enseña · Evalúa</p>
              <p className="text-sm font-bold text-slate-500 tracking-wide">Inspira · Transforma</p>
            </div>
          </div>

          {/* RIGHT — Contenido */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Clases listas en segundos para
              </h1>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mt-1 flex items-center gap-3">
                <span style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Lenguaje
                </span>
                <Heart className="w-7 h-7 shrink-0" style={{ fill: '#EC4899', color: '#EC4899' }} />
              </h1>
            </div>

            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Recursos alineados al currículo chileno para planificar, crear y enseñar experiencias que tus estudiantes recordarán.
            </p>

            {/* Card Evaluador REI — destacada */}
            <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'white', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 16px rgba(124,58,237,0.08)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#7C3AED' }}>TU MEJOR ALIADO</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900">Evaluador REI</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>IA</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Para todas las asignaturas ✨</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Analiza, revisa, corrige y genera planes de reforzamiento y seguimiento personalizados para cada estudiante.</p>
                </div>
                {/* Mini donut chart */}
                <div className="shrink-0 text-right space-y-1">
                  <div className="text-xs font-bold text-slate-500">Resultados</div>
                  <div className="text-2xl font-black" style={{ color: '#7C3AED' }}>68%</div>
                  <div className="text-[9px] font-bold text-slate-400">Promedio general</div>
                </div>
              </div>
              {/* Steps */}
              <div className="flex items-center gap-1 flex-wrap">
                {['Analiza', 'Revisa', 'Corrige', 'Refuerza', 'Acompaña'].map((step, i) => (
                  <React.Fragment key={step}>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{step}</span>
                    {i < 4 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                <Sparkles className="w-4 h-4 text-white shrink-0" />
                <span className="text-[11px] font-bold text-white leading-tight">Ahorra horas de corrección y obtén información real para tomar decisiones que mejoran los aprendizajes.</span>
              </div>
            </div>

            {/* Módulos fila */}
            <div className="flex flex-wrap gap-2">
              {modules.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold" style={{ backgroundColor: m.bg, color: m.color }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-2">
              <button
                onClick={() => openAuthModal('signup')}
                className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-base shadow-xl"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                Regístrate gratis por 7 días
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" style={{ fill: '#EC4899', color: '#EC4899' }} /> Sin tarjeta de crédito</span>
                <span>·</span>
                <span>Cancela cuando quieras</span>
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                <Sparkles className="w-6 h-6 text-white" />
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
                    color: mode === tab ? '#7C3AED' : '#94a3b8',
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
                        className="text-[10px] font-bold" style={{ color: '#7C3AED' }}>
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
              {/* Aviso de privacidad — solo en registro */}
              {mode === 'signup' && (
                <div className="rounded-xl p-3 flex gap-2.5" style={{ backgroundColor: '#F0EBFF', border: '1px solid #DDD6FE' }}>
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#7C3AED' }} />
                  <p className="text-[10px] leading-relaxed font-medium" style={{ color: '#4C1D95' }}>
                    <span className="font-bold block mb-0.5">Tus datos están protegidos 🔒</span>
                    Tu nombre y correo se usan únicamente para que puedas acceder a REI Docente y generar tus materiales. No compartimos tu información con terceros. Usamos Supabase como plataforma de autenticación, con bases de datos cifradas, control de acceso y conexiones seguras.
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
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
