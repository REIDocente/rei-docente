'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  User,
  GraduationCap,
  Building2,
  Calendar,
  Plus,
  Trash2,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  FileSpreadsheet,
  Clock,
  BookOpen
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
  letras: Record<string, boolean>; // 'A', 'B', etc. -> true/false
  estudiantes: Record<string, number>; // 'A' -> count
}

interface HorarioBloque {
  dia: string;
  desde: string;
  hasta: string;
  curso: string;
  asignatura: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // --- Step active state ---
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // --- Step 1 States ---
  const [nombreCompleto, setNombreCompleto] = useState('');

  // --- Step 2 States ---
  const [establecimiento, setEstablecimiento] = useState('');
  const [establecimientoTipo, setEstablecimientoTipo] = useState('Municipal');
  const [comuna, setComuna] = useState('');
  const [asignaturaPrincipal, setAsignaturaPrincipal] = useState('Lengua y Literatura');
  const [otraAsignatura, setOtraAsignatura] = useState('');

  // --- Step 3 States ---
  const [selectedLevels, setSelectedLevels] = useState<Record<string, boolean>>({});
  const [levelsData, setLevelsData] = useState<Record<string, SelectedCourseState>>({});

  // --- Step 4 States ---
  const [horarioModo, setHorarioModo] = useState<'upload' | 'manual' | 'skip' | null>(null);
  const [timetableBlocks, setTimetableBlocks] = useState<HorarioBloque[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [readingFile, setReadingFile] = useState(false);

  // Load Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setNombreCompleto(user.user_metadata?.full_name || user.user_metadata?.name || '');
      } else {
        router.push('/login');
      }
      setLoadingUser(false);
    });
  }, [router]);

  // Initializing level data structures
  useEffect(() => {
    const initial: Record<string, SelectedCourseState> = {};
    Object.keys(LEVEL_NAME_MAP).forEach((lvl) => {
      initial[lvl] = {
        levelCode: lvl,
        letras: { A: false, B: false, C: false, D: false, E: false, F: false, G: false },
        estudiantes: { A: 45, B: 45, C: 45, D: 45, E: 45, F: 45, G: 45 },
      };
    });
    setLevelsData(initial);
  }, []);

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

  // --- Timetable API reading ---
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
        setHorarioModo('manual'); // Show editable preview grid
      } else {
        alert(data.error || 'Ocurrió un error al leer el horario.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al leer el archivo de horario.');
    } finally {
      setReadingFile(false);
    }
  };

  const handleAddManualBlock = () => {
    setTimetableBlocks((prev) => [
      ...prev,
      { dia: 'Lunes', desde: '08:00', hasta: '09:30', curso: '', asignatura: '' },
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

  // --- Flow Actions ---
  const handleStep1Next = () => {
    if (!nombreCompleto.trim()) {
      alert('Por favor ingresa tu nombre completo.');
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!establecimiento.trim()) {
      alert('Por favor ingresa el nombre de tu establecimiento.');
      return;
    }
    if (!comuna.trim()) {
      alert('Por favor ingresa la comuna.');
      return;
    }
    setStep(3);
  };

  const handleStep3Next = async () => {
    // Validation: if a level is selected, at least one letter is required
    const levelsSelected = Object.keys(selectedLevels).filter((k) => selectedLevels[k]);
    if (levelsSelected.length === 0) {
      alert('Por favor selecciona al menos un nivel educativo en el que enseñas.');
      return;
    }

    for (const lvl of levelsSelected) {
      const letters = Object.keys(levelsData[lvl].letras).filter((l) => levelsData[lvl].letras[l]);
      if (letters.length === 0) {
        alert(`Debes seleccionar al menos una letra para el nivel ${LEVEL_NAME_MAP[lvl]}.`);
        return;
      }
    }

    setStep(4);
  };

  const handleSaveAll = async (isSkipHorario = false) => {
    setSaving(true);
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
              // Level name: e.g. "7° Básico", letter "A" -> "7°A"
              const gradeChar = lvl.replace('B', '').replace('M', ''); // "7°"
              const letterName = gradeChar + letra; // "7°A"
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
        horario_docente_json: isSkipHorario || horarioModo === 'skip' ? null : timetableBlocks,
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
        // Force refresh local cookie state by performing a mock client query
        await supabase.from('user_profiles').select('*');
        router.push('/');
      } else {
        alert(data.error || 'Error al guardar el perfil.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar tus datos de onboarding.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Header Block */}
        <div className="space-y-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👋</span>
            <h1 className="text-lg font-black text-slate-800 leading-none">Bienvenida/o a REI Docente</h1>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed">
            Mientras más nos cuentes, más personalizados serán tus recursos pedagógicos. Solo configurarás esto una vez.
          </p>

          {/* Progress bar */}
          <div className="pt-2 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
              <span>Paso {step} de 4</span>
              <span>{step * 25}% completado</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${step * 25}%` }}
                className="h-full bg-rose-600 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* --- STEP 1: IDENTIFICATION --- */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Paso 1: ¿Cómo te llamas?</h2>
              <p className="text-xs text-slate-400">Ingresa tu nombre para firmar tus planificaciones y reportes.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">Nombre Completo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-405">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej: Jacqueline Valenzuela"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleStep1Next}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: ESTABLECIMIENTO --- */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Paso 2: Tu Establecimiento</h2>
              <p className="text-xs text-slate-400">Datos del colegio para adecuar los encabezados de tus instrumentos y guías.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Nombre del Establecimiento</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-405">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={establecimiento}
                    onChange={(e) => setEstablecimiento(e.target.value)}
                    placeholder="Ej: Liceo Rigoberto Fontt"
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Comuna</label>
                <input
                  type="text"
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  placeholder="Ej: Colina"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Dependencia radio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">Tipo de Dependencia</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Municipal', 'Particular subvencionado', 'Particular pagado'].map((tipo) => (
                  <label
                    key={tipo}
                    className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-center text-[10px] font-bold transition-all ${establecimientoTipo === tipo ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'}`}
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

            {/* Asignatura principal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Asignatura Principal que Enseñas</label>
              <select
                value={asignaturaPrincipal}
                onChange={(e) => setAsignaturaPrincipal(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
              >
                {ASIGNATURAS_LIST.map((asig) => <option key={asig} value={asig}>{asig}</option>)}
              </select>
            </div>

            {asignaturaPrincipal === 'Otra' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-slate-500 block">Especificar Asignatura</label>
                <input
                  type="text"
                  value={otraAsignatura}
                  onChange={(e) => setOtraAsignatura(e.target.value)}
                  placeholder="Ej: Filosofía, Física, Química"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                onClick={handleStep2Next}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: TUS CURSOS --- */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Paso 3: Tus Cursos</h2>
              <p className="text-xs text-slate-400">Selecciona los niveles que atiendes y detalla las letras y cantidad de estudiantes.</p>
            </div>

            {/* Checkbox Levels */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.keys(LEVEL_NAME_MAP).map((lvl) => (
                  <label
                    key={lvl}
                    className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer text-center text-xs font-bold transition-all ${selectedLevels[lvl] ? 'bg-rose-50 border-rose-400 text-rose-700 font-black' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'}`}
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

              {/* Letters and students count list per level selected */}
              <div className="space-y-3 pt-2">
                {Object.keys(selectedLevels).filter(lvl => selectedLevels[lvl]).map((lvl) => {
                  const data = levelsData[lvl];
                  if (!data) return null;
                  return (
                    <div key={lvl} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{LEVEL_NAME_MAP[lvl]}</h4>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Letras / Paralelos:</label>
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

                      {/* Students count input per letter selected */}
                      {Object.keys(data.letras).some(l => data.letras[l]) && (
                        <div className="space-y-2 border-t border-slate-100/50 pt-2.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Cantidad de Estudiantes (Opcional, Máx 45):</label>
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

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                onClick={handleStep3Next}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: TIMETABLE --- */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Paso 4: Tu Horario</h2>
              <p className="text-xs text-slate-400">Sube tu horario y REI identificará tus bloques de clase. Así el Planificador sabrá con qué cursos trabajas.</p>
            </div>

            {/* Timing mode selector */}
            {horarioModo === null && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setHorarioModo('upload')}
                  className="bg-white border-2 border-slate-200/80 hover:border-rose-450 hover:bg-rose-50/10 p-6 rounded-3xl flex flex-col items-center text-center space-y-2 cursor-pointer transition-all group"
                >
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-100 transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700">Subir imagen o PDF</h3>
                  <p className="text-[10px] text-slate-455">Envía una foto o PDF del horario. Claude Vision lo leerá automáticamente.</p>
                </button>

                <button
                  onClick={() => {
                    setHorarioModo('manual');
                    setTimetableBlocks([{ dia: 'Lunes', desde: '08:00', hasta: '09:30', curso: '', asignatura: asignaturaPrincipal }]);
                  }}
                  className="bg-white border-2 border-slate-200/80 hover:border-rose-450 hover:bg-rose-50/10 p-6 rounded-3xl flex flex-col items-center text-center space-y-2 cursor-pointer transition-all group"
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700">Ingresar manualmente</h3>
                  <p className="text-[10px] text-slate-455">Digita tus bloques de clase y horas en nuestra tabla interactiva.</p>
                </button>

                <button
                  onClick={() => handleSaveAll(true)}
                  disabled={saving}
                  className="bg-white border-2 border-slate-200/80 hover:border-rose-450 hover:bg-rose-50/10 p-6 rounded-3xl flex flex-col items-center text-center space-y-2 cursor-pointer transition-all group"
                >
                  <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-slate-100 transition-colors">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-700">Omitir por ahora</h3>
                  <p className="text-[10px] text-slate-455">Puedes rellenar o cargar tu horario después en los ajustes de tu perfil.</p>
                </button>
              </div>
            )}

            {/* Timetable File Upload view */}
            {horarioModo === 'upload' && (
              <div className="space-y-4 border-2 border-dashed border-slate-200 bg-slate-50/20 p-6 rounded-3xl text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-500">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-750">Selecciona el archivo de tu horario</h4>
                <p className="text-[10px] text-slate-450">Formatos permitidos: .png, .jpg, .jpeg, .pdf. Claude Vision leerá los días y horas de clases.</p>
                
                <div className="pt-2 max-w-xs mx-auto">
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
                  <div className="pt-4 space-y-2">
                    <button
                      onClick={handleUploadTimetable}
                      disabled={readingFile}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 w-full cursor-pointer"
                    >
                      {readingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Procesando horario con Claude Vision...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> Analizar Horario
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    onClick={() => setHorarioModo(null)}
                    className="text-xs font-bold text-slate-450 hover:text-slate-700 transition-colors"
                  >
                    ← Cambiar opción
                  </button>
                </div>
              </div>
            )}

            {/* Timetable manual editing preview grid */}
            {horarioModo === 'manual' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-750 uppercase tracking-wider">Bloques de clases ({timetableBlocks.length})</h3>
                  <button
                    type="button"
                    onClick={handleAddManualBlock}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar bloque
                  </button>
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white max-h-72 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase bg-slate-50/50">
                        <th className="py-2 px-3">Día</th>
                        <th className="py-2 px-3">Desde</th>
                        <th className="py-2 px-3">Hasta</th>
                        <th className="py-2 px-3">Curso</th>
                        <th className="py-2 px-3">Asignatura (Opc.)</th>
                        <th className="py-2 px-3 text-center">Acción</th>
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
                              placeholder="Ej: 7°A"
                              value={blk.curso}
                              onChange={(e) => handleUpdateBlock(idx, 'curso', e.target.value)}
                              className="text-xs border border-slate-200 rounded p-1 w-16 bg-white font-bold"
                            />
                          </td>
                          <td className="py-1 px-3">
                            <input
                              type="text"
                              placeholder="Ej: Lengua"
                              value={blk.asignatura}
                              onChange={(e) => handleUpdateBlock(idx, 'asignatura', e.target.value)}
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
                            Sin bloques de horario configurados. Presiona "Agregar bloque" o sube tu horario.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setHorarioModo(null);
                      setTimetableBlocks([]);
                    }}
                    className="text-xs font-bold text-slate-450 hover:text-slate-700 transition-colors"
                  >
                    ← Volver a opciones
                  </button>
                  <button
                    onClick={() => handleSaveAll(false)}
                    disabled={saving}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirmar Horario y Finalizar →
                  </button>
                </div>
              </div>
            )}

            {/* General flow back */}
            {horarioModo === null && (
              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
