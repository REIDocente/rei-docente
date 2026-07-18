'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { KeyRound, Sparkles, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // When arriving at this page, Supabase Auth must have loaded the session.
    // We can double-check if we have access.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // In a real application, the recovery link contains a hash.
        // If there is no session, we show a message.
        console.log('No active recovery session found.');
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess('¡Contraseña restablecida correctamente! Redirigiendo al inicio...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña. Asegúrate de haber usado el enlace de recuperación válido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#FAF9FC] text-slate-800 overflow-hidden px-4">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-200/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-200/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20 mb-4">
            <KeyRound className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 mb-2">
            Nueva Contraseña
          </h1>
          <p className="text-slate-500 text-sm">
            Restablece tu contraseña de acceso a REI DOCENTE
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0]/70 rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleResetPassword} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl flex items-start gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF9FC] border border-[#E2E8F0]/70 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="submit-reset"
              className="w-full bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Actualizar Contraseña
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
