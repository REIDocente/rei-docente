import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';

// pdf-parse has no official TS types


// ─── Types ───────────────────────────────────────────────────────────────────

interface HorarioBloque {
  dia_semana: string;
  n_bloques: number;
  hora_inicio?: string;
  hora_fin?: string;
}

interface ClaudeHorarioResponse {
  bloques: HorarioBloque[];
  mensaje?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildClaudePrompt(cursoNombre: string, nivel: string): string {
  return (
    `Eres un asistente que analiza horarios escolares. ` +
    `Examina este horario y extrae ÚNICAMENTE los bloques de clase de la asignatura ` +
    `'Lenguaje y Comunicación' para el curso ${cursoNombre} (${nivel}). ` +
    `Devuelve SOLO un JSON válido con este formato exacto, sin texto adicional:\n` +
    `{"bloques": [{"dia_semana": "lunes", "n_bloques": 2, "hora_inicio": "08:30", "hora_fin": "10:00"}]}\n` +
    `Días válidos: lunes, martes, miércoles, jueves, viernes. ` +
    `n_bloques entre 1 y 3. ` +
    `Si no encuentras Lenguaje para ese curso, devuelve ` +
    `{"bloques": [], "mensaje": "No se encontraron bloques de Lenguaje y Comunicación para este curso"}.`
  );
}

/**
 * Strips markdown code-fences and trims the string so JSON.parse can handle
 * responses that Claude may occasionally wrap in ```json ... ```.
 */
function sanitizeJsonString(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// ─── POST /api/horario/parse ──────────────────────────────────────────────────
/**
 * Accepts a multipart FormData with:
 *   - file         (required) — image (JPG/PNG), PDF, DOCX, or XLSX
 *   - curso_nombre (required) — name of the course being searched
 *   - nivel        (required) — grade level, e.g. "5° Básico"
 *
 * Returns the parsed JSON produced by Claude:
 *   { bloques: [...], mensaje?: string }
 */
export async function POST(req: NextRequest) {
  // ── Parse form data ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'FormData inválida' }, { status: 400 });
  }

  const file = formData.get('file');
  const cursoNombre = (formData.get('curso_nombre') as string | null)?.trim() ?? '';
  const nivel = (formData.get('nivel') as string | null)?.trim() ?? '';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" requerido' }, { status: 400 });
  }
  if (!cursoNombre) {
    return NextResponse.json({ error: 'Campo "curso_nombre" requerido' }, { status: 400 });
  }
  if (!nivel) {
    return NextResponse.json({ error: 'Campo "nivel" requerido' }, { status: 400 });
  }

  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const systemPrompt = buildClaudePrompt(cursoNombre, nivel);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'tu_anthropic_api_key_aqui') {
    return NextResponse.json({ error: 'API Key de Anthropic no configurada.' }, { status: 500 });
  }
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    return NextResponse.json({ error: 'La variable de entorno ANTHROPIC_MODEL no está configurada.' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  let parsedResult: ClaudeHorarioResponse;

  try {
    // ── Branch: image (JPG / PNG) — use Claude vision ──────────────────────
    if (
      mimeType === 'image/jpeg' ||
      mimeType === 'image/jpg' ||
      mimeType === 'image/png' ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mediaType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'Analiza este horario escolar y devuelve el JSON solicitado.',
              },
            ],
          },
        ],
      });

      const rawText =
        response.content[0]?.type === 'text' ? response.content[0].text : '';
      parsedResult = JSON.parse(sanitizeJsonString(rawText));

    // ── Branch: PDF ─────────────────────────────────────────────────────────
    } else if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      const extractedText: string = pdfData.text ?? '';

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Contenido del horario escolar (extraído del PDF):\n\n${extractedText}`,
          },
        ],
      });

      const rawText =
        response.content[0]?.type === 'text' ? response.content[0].text : '';
      parsedResult = JSON.parse(sanitizeJsonString(rawText));

    // ── Branch: DOCX ────────────────────────────────────────────────────────
    } else if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { value: extractedText } = await mammoth.extractRawText({ buffer });

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Contenido del horario escolar (extraído del DOCX):\n\n${extractedText}`,
          },
        ],
      });

      const rawText =
        response.content[0]?.type === 'text' ? response.content[0].text : '';
      parsedResult = JSON.parse(sanitizeJsonString(rawText));

    // ── Branch: XLSX ────────────────────────────────────────────────────────
    } else if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      // Dynamically require xlsx to avoid bundling issues if not installed
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = require('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Concatenate all sheets as CSV text
      const sheetsText: string = workbook.SheetNames.map((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        return `[Hoja: ${sheetName}]\n${XLSX.utils.sheet_to_csv(sheet)}`;
      }).join('\n\n');

      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Contenido del horario escolar (extraído del Excel):\n\n${sheetsText}`,
          },
        ],
      });

      const rawText =
        response.content[0]?.type === 'text' ? response.content[0].text : '';
      parsedResult = JSON.parse(sanitizeJsonString(rawText));

    } else {
      return NextResponse.json(
        {
          error: 'Tipo de archivo no soportado. Use JPG, PNG, PDF, DOCX o XLSX.',
        },
        { status: 415 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[POST /api/horario/parse] Error:', message);
    return NextResponse.json(
      { error: 'Error al analizar el horario', detail: message },
      { status: 500 }
    );
  }

  // Validate the structure that Claude returned before sending to client
  if (!Array.isArray(parsedResult?.bloques)) {
    return NextResponse.json(
      { error: 'Respuesta de Claude con formato inesperado', raw: parsedResult },
      { status: 502 }
    );
  }

  return NextResponse.json(parsedResult, { status: 200 });
}
