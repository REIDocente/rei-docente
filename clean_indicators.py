#!/usr/bin/env python3
"""
Limpia los indicadores de todos los curriculum_XB.json / curriculum_XM.json.
Fuentes (por prioridad):
  1. staticCurriculum en index.ts  (datos limpios de Supabase, solo 1B-4B)
  2. Primeras frases limpias del raw JSON (PDF filtrado)
  3. Indicadores generados desde el texto del propio OA
"""
import json, re, os

# ── Patrones de basura (mismo que en route.ts) ──────────────────────────────
GARBAGE = [
    re.compile(r'Programa de Estudio', re.I),
    re.compile(r'Los estudiantes que han alcanzado', re.I),
    re.compile(r'Unidad \d+ de', re.I),
    re.compile(r'\bU\d+\b'),
    re.compile(r'Se espera que los estudiantes', re.I),
    re.compile(r'El docente', re.I),
    re.compile(r'^\s*\d+\s*$'),
    re.compile(r'isbn', re.I),
    re.compile(r'ministerio de educaci', re.I),
    re.compile(r'objetivo de aprendizaje oficial', re.I),
    re.compile(r'logrado\s+MedianaMente', re.I),
    re.compile(r'recortes recorten', re.I),
    re.compile(r'\([^)]+,[^)]+\)'),
    re.compile(r'Los alumnos', re.I),
    re.compile(r'El profesor', re.I),
    re.compile(r'El estudiante debe', re.I),
    re.compile(r'\bEjemplo\b', re.I),
    re.compile(r'Actividad\b', re.I),
    re.compile(r'dadinU'),
]
IMPERATIVE = re.compile(r'^(Describa|Explique|Comente|Compare|Analice|Discuta|Reflexione|Señale|Mencione|Identifique|Busca|Lee|Escribe|Observa|Responde|Piensa|Investiga)\b', re.I)

def is_clean(s):
    s = s.strip()
    if len(s) < 15 or len(s) > 380: return False
    if any(p.search(s) for p in GARBAGE): return False
    if s.startswith('¿') or s.endswith('?'): return False
    if s and s[0] == s[0].lower() and s[0] != s[0].upper(): return False
    if IMPERATIVE.match(s): return False
    return True

def split_to_bullets(text):
    """Divide un string de indicadores en bullets individuales."""
    if not text: return []
    # Separar por \n primero
    parts = text.split('\n')
    result = []
    for part in parts:
        # Cada parte: separar por ". " seguido de mayúscula
        subs = re.split(r'(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])', part.strip())
        result.extend(subs)
    out = []
    for s in result:
        s = s.strip()
        if len(s) > 10:
            if not s.endswith('.'): s += '.'
            out.append(s)
    return out

def clean_raw_indicators(raw_list):
    """Filtra indicadores raw del JSON."""
    bullets = []
    for raw in raw_list:
        # Dividir por ". " seguido de mayúscula y por \n
        parts = re.split(r'\n|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ])', raw.strip())
        for p in parts:
            p = p.strip()
            if is_clean(p):
                if not p.endswith('.'): p += '.'
                bullets.append(p)
    # Deduplicar manteniendo orden
    seen = set()
    unique = []
    for b in bullets:
        key = b.lower()[:60]
        if key not in seen:
            seen.add(key)
            unique.append(b)
    return unique[:6]  # máx 6 por OA

def generate_from_oa_text(oa_text, oa_code):
    """Genera 2-3 indicadores mínimos dividiendo el texto del OA."""
    if not oa_text or len(oa_text) < 20:
        return [f"Demuestran dominio del {oa_code} según el Programa de Estudio MINEDUC."]
    # Dividir el OA text en frases
    frases = re.split(r'[;:]', oa_text)
    bullets = []
    for f in frases[:3]:
        f = f.strip().strip(',').strip()
        if len(f) < 15: continue
        # Capitalizar
        f = f[0].upper() + f[1:]
        if not f.endswith('.'): f += '.'
        bullets.append(f)
    if not bullets:
        bullets = [oa_text[:200].strip() + '.']
    return bullets

# ── Leer indicadores limpios de staticCurriculum (index.ts) ─────────────────
print("Cargando staticCurriculum desde index.ts...")
with open('src/lib/curriculum/index.ts', encoding='utf-8') as f:
    ts_content = f.read()

# Extraer todos los OAs del staticCurriculum como JSON
oa_blocks = re.findall(r'\{[^{}]*"nivel"[^{}]*"indicadores"[^{}]*\}', ts_content, re.DOTALL)
static_inds = {}  # (nivel, codigo_oa) → clean indicator string
for block in oa_blocks:
    nivel_m = re.search(r'"nivel"\s*:\s*"([^"]+)"', block)
    codigo_m = re.search(r'"codigo_oa"\s*:\s*"([^"]+)"', block)
    ind_m = re.search(r'"indicadores"\s*:\s*"([^"]+)"', block)
    if nivel_m and codigo_m and ind_m:
        key = (nivel_m.group(1), codigo_m.group(1))
        static_inds[key] = ind_m.group(1).replace('\\n', '\n')

print(f"  → {len(static_inds)} OAs con indicadores limpios en staticCurriculum")

# ── Procesar cada JSON ───────────────────────────────────────────────────────
JSON_FILES = {
    '1° Básico':  'public/curriculum/curriculum_1B.json',
    '2° Básico':  'public/curriculum/curriculum_2B.json',
    '3° Básico':  'public/curriculum/curriculum_3B.json',
    '4° Básico':  'public/curriculum/curriculum_4B.json',
    '5° Básico':  'public/curriculum/curriculum_5B.json',
    '6° Básico':  'public/curriculum/curriculum_6B.json',
    '7° Básico':  'public/curriculum/curriculum_7B.json',
    '8° Básico':  'public/curriculum/curriculum_8B.json',
    '1° Medio':   'public/curriculum/curriculum_1M.json',
    '2° Medio':   'public/curriculum/curriculum_2M.json',
}

for nivel, filepath in JSON_FILES.items():
    if not os.path.exists(filepath):
        print(f"  ⚠ No existe: {filepath}")
        continue
    with open(filepath, encoding='utf-8') as f:
        data = json.load(f)

    total_oas = 0
    static_used = 0
    raw_used = 0
    generated = 0

    for unidad in data.get('unidades', []):
        for oa in unidad.get('oas', []):
            total_oas += 1
            codigo = oa.get('codigo', '')
            oa_text = oa.get('texto', '')
            raw_inds = oa.get('indicadores', [])

            # 1. Intentar staticCurriculum
            key = (nivel, codigo)
            if key in static_inds:
                clean = split_to_bullets(static_inds[key])
                if clean:
                    oa['indicadores'] = clean
                    static_used += 1
                    continue

            # 2. Intentar raw del JSON
            if raw_inds:
                clean = clean_raw_indicators(raw_inds)
                if clean:
                    oa['indicadores'] = clean
                    raw_used += 1
                    continue

            # 3. Generar desde texto del OA
            oa['indicadores'] = generate_from_oa_text(oa_text, codigo)
            generated += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"{nivel}: {total_oas} OAs → staticCurriculum={static_used}, raw_limpio={raw_used}, generado={generated}")

print("\n✅ Todos los JSONs limpiados.")
