'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
  User,
  Building2,
  Calendar,
  Plus,
  Trash2,
  Upload,
  Check,
  Loader2,
  Clock,
  Menu,
  Save,
  Bell,
  ArrowLeft
} from 'lucide-react';

const LEVEL_NAME_MAP: Record<string, string> = {
  '1°B': '1° Básico',
  '2°B': '2° Básico',
  '3°B': '3° Básico',
  '4°B': '4° Básico',
  '5°B': '5° Básico',
  '6°B': '6° Básico',
  '7°B': '7° Básico',
  '8°B': '8° Básico',
  '1°M': '1° Medio',
  '2°M': '2° Medio',
};

const ASIGNATURAS_LIST = [
  'Lengua y Literatura',
  'Lenguaje y Comunicación',
  'Matemática',
  'Historia, Geografía y Cs. Sociales',
  'Ciencias Naturales',
  'Inglés',
  'Educación Física',
  'Artes Visuales',
  'Música',
  'Otra'
];

interface SelectedCourseState {
  levelCode: string;
  letras: Record<string, boolean>;
  estudiantes: Record<string, number>;
}

interface HorarioBloque {
  dia: string;
  desde: string;
  hasta: string;
  curso: string;
  asignatura: string;
}

export default function PerfilAjustesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form Fields
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [establecimiento, setEstablecimiento] = useState('');
  const [establecimientoTipo, setEstablecimientoTipo] = useState('Municipal');
  const [comuna, setComuna] = useState('');
  const [asignaturaPrincipal, setAsignaturaPrincipal] = useState('Lengua y Literatura');
  const [otraAsignatura, setOtraAsignatura] = useState('');

  // Courses Checkboxes
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>({});
  const [levelsData, setLevelsData] = useState<Record<string, SelectedCourseState>>({});

  // Timetable
  const [timetableBlocks, setTimetableBlocks] = useState<HorarioBloque[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);

  // Init levels template
  const initLevelsData = () => {
    const initial: Record<string, SelectedCourseState> = {};
    Object.keys(LEVEL_NAME_MAP).forEach((lvl) => {
      initial[lvl] = {
        levelCode: lvl,
        letras: { A: false, B: false, C: false, D: false, E: false, F: false, G: false },
        estudiantes: { A: 45, B: 45, C: 45, D: 45, E: 45, F: 45, G: 45 },
      };
    });
    return initial;
  };

  useEffect(() => {
    const loadProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      try {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes.data.session?.access_token;
        const res = await fetch('/api/onboarding/perfil', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          const p = data.profile || {};
          const cList = data.cursos || [];

          setNombreCompleto(p.nombre_completo || user.user_metadata?.full_name || '');
          setEstablecimiento(p.establecimiento || '');
          setEstablecimientoTipo(p.establecimiento_tipo || 'Municipal');
          setComuna(p.comuna || '');
          
          if (ASIGNATURAS_LIST.includes(p.asignatura_principal)) {
            setAsignaturaPrincipal(p.asignatura_principal || 'Lengua y Literatura');
          } else if (p.asignatura_principal) {
            setAsignaturaPrincipal('Otra');
            setOtraAsignatura(p.asignatura_principal);
          }

          setTimetableBlocks(p.horario_docente_json || []);

          // Rebuild courses checklist state
          const lData = initLevelsData();
          const selLevels: Record<string, boolean> = {};

          cList.forEach((c: any) => {
            // Find Level Code matching the level name (e.g. "7° Básico")
            const code = Object.keys(LEVEL_NAME_MAP).find(k => LEVEL_NAME_MAP[k] === c.nivel);
            if (code) {
              selLevels[code] = true;
              // Extract letter
              const letterMatch = c.nombre.match(/[A-G]$/);
              if (letterMatch) {
                const letter = letterMatch[0];
                lData[code].letras[letter] = true;
                // Students size defaults
                lData[code].estudiantes[letter] = Array.isArray(c.estudiantes_json) ? c.estudiantes_json.length : 45;
              }
            }
          });

          setSelectedLevels(selLevels);
          setLevelsData(lData);
        } else {
          // Initialize empty
          setLevelsData(initLevelsData());
        }
      } catch (err) {
        console.error('Failed to load profile settings:', err);
        setLevelsData(initLevelsData());
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [router]);

  const handleLevelCheckboxChange = (lvl: string, checked: boolean) => {
    setSelectedLevels((prev) => ({ ...prev, [lvl]: checked }));
  };

  const handleLetraCheckboxChange = (lvl: string, letra: string, checked: boolean) => {
    setLevelsData((prev) => {
      const copy = { ...prev };
      copy[lvl].letras[letra] = checked;
      return copy;
    });
  };

  const handleEstudiantesCountChange = (lvl: string, letra: string, val: string) => {
    const num = Math.min(45, Math.max(1, Number(val) || 45));
    setLevelsData((prev) => {
      const copy = { ...prev };
      copy[lvl].estudiantes[letra] = num;
      return copy;
    });
  };

  // Timetable
  const handleUploadTimetable = async () => {
    if (!fileToUpload) return;
    setReadingFile(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const fd = new FormData();
      fd.append('file', fileToUpload);

      const res = await fetch('/api/onboarding/leer-horario', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.bloques) {
        setTimetableBlocks(data.bloques);
        setShowUploadArea(false);
        setFileToUpload(null);
      } else {
        alert(data.error || 'Ocurrió un error al leer el horario.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al analizar el horario.');
    } finally {
      setReadingFile(false);
    }
  };

  const handleAddBlock = () => {
    setTimetableBlocks((prev) => [
      ...prev,
      { dia: 'Lunes', desde: '08:00', hasta: '09:30', curso: '', asignatura: asignaturaPrincipal === 'Otra' ? otraAsignatura : asignaturaPrincipal },
    ]);
  };

  const handleRemoveBlock = (idx: number) => {
    setTimetableBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateBlock = (idx: number, field: keyof HorarioBloque, val: string) => {
    setTimetableBlocks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !establecimiento.trim() || !comuna.trim()) {
      alert('Por favor completa todos los datos obligatorios.');
      return;
    }

    // Courses validations
    const levelsSelected = Object.keys(selectedLevels).filter((k) => selectedLevels[k]);
    if (levelsSelected.length === 0) {
      alert('Por favor selecciona al menos un curso/nivel educativo.');
      return;
    }

    for (const lvl of levelsSelected) {
      const letters = Object.keys(levelsData[lvl].letras).filter((l) => levelsData[lvl].letras[l]);
      if (letters.length === 0) {
        alert(`Debes seleccionar al menos una letra para el nivel ${LEVEL_NAME_MAP[lvl]}.`);
        return;
      }
    }

    setSaving(true);
    setSuccessMsg('');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      // Compile courses payload
      const compiledCursos: Array<{ nombre: string; nivel: string }> = [];
      Object.keys(selectedLevels).forEach((lvl) => {
        if (selectedLevels[lvl]) {
          const lData = levelsData[lvl];
          Object.keys(lData.letras).forEach((letra) => {
            if (lData.letras[letra]) {
              const gradeChar = lvl.replace('B', '').replace('M', '');
              const letterName = gradeChar + letra;
              compiledCursos.push({
                nombre: letterName,
                nivel: LEVEL_NAME_MAP[lvl],
              });
            }
          });
        }
      });

      const finalAsignatura = asignaturaPrincipal === 'Otra' ? otraAsignatura.trim() : asignaturaPrincipal;

      const payload = {
        nombre_completo: nombreCompleto.trim(),
        establecimiento: establecimiento.trim(),
        establecimiento_tipo: establecimientoTipo,
        comuna: comuna.trim(),
        asignatura_principal: finalAsignatura || 'Lengua y Literatura',
        horario_docente_json: timetableBlocks.length > 0 ? timetableBlocks : null,
        perfil_completado: true,
        cursos: compiledCursos,
      };

      const res = await fetch('/api/onboarding/guardar-perfil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        // Trigger cookie sync in proxy client
        await supabase.from('user_profiles').select('*');
        setSuccessMsg('¡Ajustes de perfil actualizados correctamente!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        alert(data.error || 'Ocurrió un error al guardar los ajustes.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  const initials = nombreCompleto
    ? nombreCompleto.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'UD';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-700 flex font-sans antialiased overflow-x-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center gap-3">
            <button className="text-slate-550 hover:text-slate-800" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-base font-bold text-rose-600">REI Ajustes</span>
          </div>
          <div className="w-8 h-8 rounded-full text-white bg-rose-600 flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white px-8 py-4 justify-between items-center z-20 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-450">
            <Link href="/" className="hover:text-slate-700 transition-colors">Inicio</Link>
            <span>/</span>
            <span>Ajustes de Perfil</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-xl border border-transparent hover:border-slate-100 hover:bg-white transition-all text-slate-450">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full text-white bg-rose-600 flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-800">Mi Perfil Pedagógico</h1>
              <p className="text-xs text-slate-450">Actualiza tus cursos, colegio, asignatura y horario escolar.</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl bg-white hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          </div>

          {successMsg && (
            <div className="bg-emerald-55 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold shadow-sm animate-fadeIn">
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* SECCIÓN 1: IDENTIFICACIÓN */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 space-y-4 shadow-xs">
              <h2 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2">1. Identificación y Establecimiento</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 block">Nombre Completo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 block">Establecimiento Educativo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={establecimiento}
                      onChange={(e) => setEstablecimiento(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 block">Comuna</label>
                  <input
                    type="text"
                    required
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 block">Asignatura Principal</label>
                  <select
                    value={asignaturaPrincipal}
                    onChange={(e) => setAsignaturaPrincipal(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    {ASIGNATURAS_LIST.map((asig) => <option key={asig} value={asig}>{asig}</option>)}
                  </select>
                </div>
              </div>

              {asignaturaPrincipal === 'Otra' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-500 block">Especificar Asignatura</label>
                  <input
                    type="text"
                    value={otraAsignatura}
                    onChange={(e) => setOtraAsignatura(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-550 block">Tipo de Dependencia</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Municipal', 'SLEP', 'Particular subvencionado', 'Particular pagado'].map((tipo) => (
                    <label
                      key={tipo}
                      className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-center text-[10px] font-bold transition-all ${establecimientoTipo === tipo ? 'bg-rose-50/50 border-rose-500 text-rose-700 font-extrabold' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                    >
                      <input
                        type="radio"
                        name="dependencia"
                        value={tipo}
                        checked={establecimientoTipo === tipo}
                        onChange={() => setEstablecimientoTipo(tipo)}
                        className="hidden"
                      />
                      <span>{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: TUS CURSOS */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 space-y-4 shadow-xs">
              <h2 className="text-xs font-black text-slate-850 uppercase tracking-wider border-b border-slate-100 pb-2">2. Cursos y Paralelos</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.keys(LEVEL_NAME_MAP).map((lvl) => (
                  <label
                    key={lvl}
                    className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-center text-xs font-bold transition-all ${selectedLevels[lvl] ? 'bg-rose-50/50 border-rose-450 text-rose-700 font-black' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLevels[lvl] || false}
                      onChange={(e) => handleLevelCheckboxChange(lvl, e.target.checked)}
                      className="hidden"
                    />
                    <span>{LEVEL_NAME_MAP[lvl]}</span>
                  </label>
                ))}
              </div>

              {/* Course letter and students expansion */}
              <div className="space-y-3 pt-2">
                {Object.keys(selectedLevels).filter(lvl => selectedLevels[lvl]).map((lvl) => {
                  const data = levelsData[lvl];
                  if (!data) return null;
                  return (
                    <div key={lvl} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{LEVEL_NAME_MAP[lvl]}</h4>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-450 uppercase">Letras / Paralelos:</label>
                        <div className="flex flex-wrap gap-2">
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((letra) => (
                            <label
                              key={letra}
                              className={`px-3 py-1.5 border rounded-lg cursor-pointer text-[10px] font-bold transition-all ${data.letras[letra] ? 'bg-rose-600 border-rose-600 text-white font-black' : 'bg-white border-slate-250 text-slate-550'}`}
                            >
                              <input
                                type="checkbox"
                                checked={data.letras[letra]}
                                onChange={(e) => handleLetraCheckboxChange(lvl, letra, e.target.checked)}
                                className="hidden"
                              />
                              {letra}
                            </label>
                          ))}
                        </div>
                      </div>

                      {Object.keys(data.letras).some(l => data.letras[l]) && (
                        <div className="space-y-2 border-t border-slate-100/50 pt-2.5">
                          <label className="text-[10px] font-bold text-slate-450 uppercase">Cantidad de Estudiantes (Máx 45):</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.keys(data.letras).filter(l => data.letras[l]).map((letra) => (
                              <div key={letra} className="flex items-center gap-1.5 bg-white border border-slate-150 p-2 rounded-xl text-xs">
                                <span className="font-bold text-slate-500">{lvl}{letra}:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={45}
                                  value={data.estudiantes[letra] || ''}
                                  onChange={(e) => handleEstudiantesCountChange(lvl, letra, e.target.value)}
                                  className="w-12 text-center font-bold bg-slate-50 rounded border-0 p-1 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                                <span className="text-[10px] text-slate-400 font-medium">alumnos</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 3: HORARIO ESCOLAR */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 md:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs font-black text-slate-850 uppercase tracking-wider">3. Horario de Clases</h2>
                <button
                  type="button"
                  onClick={() => setShowUploadArea(!showUploadArea)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-500 hover:text-slate-850 text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> {showUploadArea ? 'Cerrar Escáner' : 'Subir imagen/PDF'}
                </button>
              </div>

              {showUploadArea && (
                <div className="space-y-4 border-2 border-dashed border-slate-200 bg-slate-50/20 p-5 rounded-3xl text-center animate-fadeIn">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-1 text-slate-500">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">Analizar Horario Escolar</h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed max-w-md mx-auto">
                    Sube una foto o archivo PDF de tu horario. Claude Vision identificará los bloques de clase y los agregará a la tabla.
                  </p>
                  
                  <div className="pt-1 max-w-xs mx-auto">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileToUpload(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs file:bg-rose-50 file:text-rose-700 file:border-0 file:rounded-xl file:px-4 file:py-2 file:font-bold hover:file:bg-rose-100 cursor-pointer"
                    />
                  </div>

                  {fileToUpload && (
                    <button
                      type="button"
                      onClick={handleUploadTimetable}
                      disabled={readingFile}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 w-full cursor-pointer mt-2"
                    >
                      {readingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Escaneando horario con Claude...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Escanear Archivo
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Editable Blocks Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Bloques Registrados ({timetableBlocks.length})</h3>
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar bloque
                  </button>
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white max-h-80 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-450 font-bold uppercase bg-slate-50/50">
                        <th className="py-2.5 px-3 text-[10px] tracking-wide">Día</th>
                        <th className="py-2.5 px-3 text-[10px] tracking-wide">Desde</th>
                        <th className="py-2.5 px-3 text-[10px] tracking-wide">Hasta</th>
                        <th className="py-2.5 px-3 text-[10px] tracking-wide">Curso</th>
                        <th className="py-2.5 px-3 text-[10px] tracking-wide">Asignatura (Opc.)</th>
                        <th className="py-2.5 px-3 text-center text-[10px] tracking-wide">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timetableBlocks.map((blk, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30">
                          <td className="py-1 px-3">
                            <select
                              value={blk.dia}
                              onChange={(e) => handleUpdateBlock(idx, 'dia', e.target.value)}
                              className="text-xs border border-slate-200 rounded p-1 w-24 bg-white"
                            >
                              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="time"
                              value={blk.desde}
                              onChange={(e) => handleUpdateBlock(idx, 'desde', e.target.value)}
                              className="text-xs border border-slate-200 rounded p-1 w-20 bg-white"
                            />
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="time"
                              value={blk.hasta}
                              onChange={(e) => handleUpdateBlock(idx, 'hasta', e.target.value)}
                              className="text-xs border border-slate-200 rounded p-1 w-20 bg-white"
                            />
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="text"
                              value={blk.curso}
                              onChange={(e) => handleUpdateBlock(idx, 'curso', e.target.value)}
                              placeholder="Ej: 7°A"
                              className="text-xs border border-slate-200 rounded p-1 w-16 bg-white font-bold"
                            />
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="text"
                              value={blk.asignatura}
                              onChange={(e) => handleUpdateBlock(idx, 'asignatura', e.target.value)}
                              placeholder="Ej: Lenguaje"
                              className="text-xs border border-slate-200 rounded p-1 w-28 bg-white"
                            />
                          </td>
                          <td className="py-1 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(idx)}
                              className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {timetableBlocks.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-xs italic text-slate-400 bg-white">
                            Sin bloques de horario registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Guardar Ajustes */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Guardar Ajustes de Perfil
                  </>
                )}
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
