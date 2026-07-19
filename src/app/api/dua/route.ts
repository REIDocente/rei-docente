/**
 * POST /api/dua
 * Adapta UNA página de evaluación o guía con principios DUA.
 * Usa claude-haiku para velocidad (< 15s por página).
 * Sin trial limit: es post-proceso de contenido ya generado.
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoPagina =
  | 'portada'
  | 'texto_preguntas'
  | 'desarrollo'
  | 'rubrica'
  | 'actividades'
  | 'cierre';

interface DuaPageBody {
  modulo: 'evaluacion' | 'guia';
  tipo_pagina: TipoPagina;
  pagina: number;
  total: number;
  contenido: string;
  contexto: {
    asignatura: string;
    nivel: string;
    oa: string;
    tipo?: string;
  };
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(body: DuaPageBody): string {
  const { tipo_pagina, pagina, total, contenido, contexto, modulo } = body;

  const ctx = `• Asignatura: ${contexto.asignatura}
• Curso: ${contexto.nivel}
• OA: ${contexto.oa}
• Módulo: ${modulo === 'evaluacion' ? 'Evaluación' : 'Guía de Aprendizaje'}
• Página ${pagina} de ${total}`;

  const reglas = `PRINCIPIOS DUA — OBLIGATORIOS:
✅ Instrucciones numeradas, máx. 2 líneas c/u
✅ Íconos Unicode para cada sección (📖 ✏️ 🧠 📝 ✅ 🎯 🔤 💬)
✅ Párrafos de máx. 4 líneas (fragmentar los más largos)
✅ Vocabulario complejo: significado entre paréntesis en primera aparición
✅ Alternativas SM en lista vertical con espacio visual entre preguntas
✅ Espacios de respuesta estructurados y amplios
❌ NO modificar OA, habilidades, preguntas ni claves correctas
❌ NO reducir la exigencia académica`;

  const instrucciones: Record<TipoPagina, string> = {
    portada: `TAREA — Portada e Instrucciones:
• Encabezado claro: Establecimiento / Asignatura / Curso / Fecha
• Instrucciones generales numeradas con íconos
• Recuadro resumen: secciones y puntajes totales
• Frase motivacional breve para el estudiante`,

    texto_preguntas: `TAREA — Texto y Preguntas SM:
• Si el texto supera 180 palabras: dividir en párrafos de máx. 4 líneas
• Recuadro "🔤 Vocabulario de apoyo" con 3-5 términos antes del texto
• Alternativas SM en lista VERTICAL (una por línea)
• Espacio visual entre preguntas
• MANTENER EXACTAMENTE el texto de las alternativas y las claves correctas`,

    desarrollo: `TAREA — Pregunta de Desarrollo:
• Sub-pasos: "1. Lee → 2. Planifica → 3. Escribe → 4. Revisa"
• Plantilla de respuesta estructurada: Introducción | Desarrollo | Conclusión
• Recuadro con criterios de evaluación visibles para el estudiante
• Mantener mismo puntaje y nivel de exigencia`,

    rubrica: `TAREA — Rúbrica y Pauta de Corrección:
• Tabla visual con | para columnas
• Íconos de nivel: ⭐⭐⭐ Logrado / ⭐⭐ En proceso / ⭐ Por mejorar
• Pauta SM horizontal: P1:A | P2:C | ...
• Mantener exactamente criterios, ponderaciones y puntajes`,

    actividades: `TAREA — Actividades:
• Cada actividad: ícono + título claro + instrucciones numeradas
• Recuadros de respuesta con líneas o espacios estructurados
• Comparaciones: tablas T o esquemas visuales simples
• Mantener exactamente las preguntas y nivel de exigencia`,

    cierre: `TAREA — Desafío Lúdico y Cierre:
• Desafío con instrucciones paso a paso y ícono 🧩
• "🎯 Lo que aprendí hoy:" → 3 líneas en blanco
• "💬 Una pregunta que me quedó:" → 2 líneas
• Mensaje motivacional al final`,
  };

  return `CONTEXTO:
${ctx}

${reglas}

${instrucciones[tipo_pagina] ?? 'TAREA — Adaptar con principios DUA'}

CONTENIDO A ADAPTAR:
─────────────────────
${contenido.slice(0, 3500)}
─────────────────────

Genera el contenido completo de esta página con adaptaciones DUA.
Usa SOLO texto plano con símbolos Unicode. Sin HTML ni Markdown.
La respuesta debe estar lista para pegar directamente en Word.`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 });
    }

    const body: DuaPageBody = await req.json();

    if (!body.contenido || !body.tipo_pagina) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const client   = new Anthropic({ apiKey, timeout: 55000 });
    const prompt   = buildPrompt(body);

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: 'Eres un especialista en Diseño Universal para el Aprendizaje (DUA) con experiencia en materiales educativos chilenos. Adaptas contenido para mejorar accesibilidad sin reducir la exigencia académica. Respondes SOLO con el contenido adaptado, sin explicaciones ni comentarios.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as any).text ?? '';
    return NextResponse.json({ pagina_adaptada: text });

  } catch (err: any) {
    console.error('[DUA] Error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Error generando adaptación DUA' },
      { status: 500 }
    );
  }
}
