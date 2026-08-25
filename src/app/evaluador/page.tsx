'use client';

import dynamic from 'next/dynamic';

// Cargado sin SSR para evitar crash de bundle en Vercel
const EvaluadorContent = dynamic(
  () => import('./EvaluadorContent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Cargando REI Evaluador IA…</p>
        </div>
      </div>
    )
  }
);

export default function EvaluadorPage() {
  return <EvaluadorContent />;
}
