import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function makeSupabaseClient(token: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() || null : null;
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL;

    if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui' || !model) {
      return NextResponse.json(
        { error: 'La API Key o el Modelo de Anthropic no están configurados en .env.local' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON de cuerpo no válido' }, { status: 400 });
    }

    const { cursoId, año, n_estudiantes, distribucion_rti } = body;

    if (!cursoId) {
      return NextResponse.json({ error: 'El campo cursoId es obligatorio' }, { status: 400 });
    }

    const supabase = makeSupabaseClient(token);

    // Verify course ownership
    const { data: curso, error: cursoError } = await supabase
      .from('cursos')
      .select('id, nombre, nivel, asignatura')
      .eq('id', cursoId)
      .maybeSingle();

    if (cursoError) {
      return NextResponse.json({ error: 'Error al buscar el curso', details: cursoError.message }, { status: 500 });
    }
    if (!curso) {
      return NextResponse.json({ error: 'Curso no encontrado o no autorizado' }, { status: 404 });
    }

    const grade = curso.nivel;
    const asignatura = curso.asignatura;

    // Fetch official curriculum OAs for this grade
    const { data: oas, error: oasError } = await supabase
      .from('curriculum_oa')
      .select('codigo_oa, texto_oa, eje')
      .eq('nivel', grade)
      .eq('asignatura', asignatura.includes('Lenguaje') ? 'Lenguaje y Comunicación' : asignatura)
      .order('codigo_oa', { ascending: true });

    if (oasError) {
      console.warn('Error fetching curriculum OAs:', oasError);
    }

    // Fetch official pre-defined units for this grade
    const { data: curriculumUnidades, error: unidadesError } = await supabase
      .from('curriculum_unidades')
      .select('unidad_numero, titulo_tema, oa_codes')
      .eq('nivel', grade)
      .order('unidad_numero', { ascending: true });

    if (unidadesError) {
      console.warn('Error fetching curriculum units:', unidadesError);
    }

    const oatDist = distribucion_rti || { n1: 22, n2: 6, n3: 2 };

    // Format OAs context
    const oasContext = oas && oas.length > 0
      ? oas.map(oa => `- [${oa.codigo_oa}] Eje: ${oa.eje}. Texto: ${oa.texto_oa}`).join('\n')
      : '(No hay OAs cargados en la base de datos para este nivel)';

    // Format Units context
    const unitsContext = curriculumUnidades && curriculumUnidades.length > 0
      ? curriculumUnidades.map(u => `- Unidad ${u.unidad_numero}: "${u.titulo_tema}" (OAs sugeridos: ${u.oa_codes.join(', ')})`).join('\n')
      : '(No hay unidades oficiales en la base de datos, sugiere una estructura temática estándar de 4 unidades)';

    const systemPrompt = `Eres un experto diseñador curricular y asesor pedagógico del Ministerio de Educación de Chile (MINEDUC).
Tu tarea es diseñar un Mapa de Ruta Curricular estructurado para el año escolar de la asignatura "${asignatura}" en el nivel "${grade}".
El mapa debe proponer una distribución curricular de EXACTAMENTE 4 unidades temáticas. Para cada unidad, debes diseñar exactamente 6 sesiones de clase de 90 minutos de forma lógica y secuencial.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto introductorio, sin explicaciones ni etiquetas markdown de código (como \`\`\`json).
Asegúrate de que todas las comillas dobles dentro de las cadenas JSON estén correctamente escapadas como \\" o utiliza comillas simples para evitar romper el formato JSON.

El JSON debe tener exactamente la siguiente estructura:
{
  "unidades": [
    {
      "numero": 1,
      "titulo": "Título temático de la Unidad 1 (ej: Unidad 1: Estrategias de lectura y comprensión de textos narrativos)",
      "oa_codes": ["OA 1", "OA 3"],
      "eje_principal": "Lectura",
      "sesiones": [
        {
          "numero": 1,
          "titulo": "Título de la clase 1 (ej: Identificación de personajes y ambiente en cuentos populares)",
          "eje": "Lectura",
          "oa_codes": ["OA 1"]
        },
        {
          "numero": 2,
          "titulo": "Título de la clase 2 (ej: Secuencia temporal de acontecimientos en narraciones)",
          "eje": "Lectura",
          "oa_codes": ["OA 1"]
        },
        {
          "numero": 3,
          "titulo": "Título de la clase 3 (ej: Descripción de actitudes y motivaciones de personajes)",
          "eje": "Lectura",
          "oa_codes": ["OA 3"]
        },
        {
          "numero": 4,
          "titulo": "Título de la clase 4 (ej: Relación entre acontecimientos y reacciones de personajes)",
          "eje": "Lectura",
          "oa_codes": ["OA 3"]
        },
        {
          "numero": 5,
          "titulo": "Título de la clase 5 (ej: Formulación de opiniones fundamentadas sobre personajes)",
          "eje": "Lectura",
          "oa_codes": ["OA 3"]
        },
        {
          "numero": 6,
          "titulo": "Título de la clase 6 (ej: Elaboración de un esquema resumen de la historia leída)",
          "eje": "Lectura",
          "oa_codes": ["OA 1", "OA 3"]
        }
      ]
    },
    ... (repite exactamente para las unidades 2, 3 y 4)
  ]
}`;

    const promptContent = `DISEÑA EL MAPA DE RUTA CURRICULAR ANUAL:
- Nivel: ${grade}
- Asignatura: ${asignatura}
- Año Escolar: ${año || '2026'}
- Matrícula: ${n_estudiantes || 30} estudiantes
- Estudiantes RTI: N1 (Universal): ${oatDist.n1}, N2 (DUA): ${oatDist.n2}, N3 (PIE): ${oatDist.n3}

CURRÍCULUM OFICIAL CHILENO DISPONIBLE:
${oasContext}

UNIDADES PEDAGÓGICAS OFICIALES:
${unitsContext}

Instrucciones de diseño:
1. Diseña exactamente 4 unidades temáticas.
2. Cada unidad debe contener exactamente 6 sesiones pedagógicas bien tituladas que sigan un hilo temático claro.
3. Para cada unidad, asigna los OAs que corresponden. Distribuye y balancea de forma inteligente los OAs entre las 6 sesiones, cuidando que cada sesión aborde 1 o máximo 2 OAs coherentes con el tema.
4. Asegúrate de incluir y rotar de forma realista los ejes curriculares de Lenguaje (Lectura, Escritura, Comunicación Oral) a lo largo de las clases de cada unidad para lograr un desarrollo balanceado.
5. Devuelve únicamente el JSON solicitado.`;

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: promptContent }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    let cleanText = responseText;
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    let jsonOutput;
    try {
      jsonOutput = JSON.parse(cleanText);
    } catch (parseErr: any) {
      console.error('[Generate Roadmap] Claude response was not valid JSON:', parseErr.message);
      console.error('[Generate Roadmap] Response snippet:', cleanText.substring(0, 500));
      return NextResponse.json({ error: 'La respuesta de la IA no pudo ser interpretada como JSON' }, { status: 500 });
    }

    // Save/Upsert in public.mapas_ruta table
    const { data: savedMapa, error: upsertError } = await supabase
      .from('mapas_ruta')
      .upsert({
        curso_id: cursoId,
        asignatura: asignatura,
        año: String(año || '2026'),
        n_estudiantes: n_estudiantes !== undefined ? Number(n_estudiantes) : null,
        distribucion_rti: oatDist,
        unidades: jsonOutput.unidades,
        updated_at: new Date().toISOString()
      }, { onConflict: 'curso_id' })
      .select('*')
      .single();

    if (upsertError) {
      console.error('[Generate Roadmap] DB Save Error:', upsertError);
      return NextResponse.json({ error: 'Error al guardar el mapa de ruta generado', details: upsertError.message }, { status: 500 });
    }

    return NextResponse.json(savedMapa, { status: 200 });

  } catch (err: any) {
    console.error('POST /api/cursos/mapa-ruta/generate error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
