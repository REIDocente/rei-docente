'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PresentacionesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/planner/new?tab=visuals');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAF9FC] flex flex-col items-center justify-center space-y-4 font-sans">
      <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      <p className="text-xs text-slate-500 font-semibold">Redireccionando a Recursos Visuales...</p>
    </div>
  );
}
