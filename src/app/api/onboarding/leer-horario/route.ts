import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  if (process.env.NODE_ENV === 'development') {
    return 'mock-access-token';
  }
  return null;
}

function sanitizeJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const isMock = !apiKey || apiKey === 'tu_anthropic_api_key_aqui' || token === 'mock-access-token';

    if (isMock) {
      // Return mock timetable blocks for testing
      const mockBloques = [
        { dia: 'Lunes', desde: '08:00', hasta: '09:30', curso: '7°A', asignatura: 'Lengua y Literatura' },
        { dia: 'Lunes', desde: '09:45', hasta: '11:15', curso: '7°B', asignatura: 'Lengua y Literatura' },
        { dia: 'Martes', desde: '08:00', hasta: '09:30', curso: '8°A', asignatura: 'Lengua y Literatura' },
        { dia: 'Miércoles', desde: '11:30', hasta: '13:00', curso: '7°A', asignatura: 'Lengua y Literatura' },
        { dia: 'Jueves', desde: '08:00', hasta: '09:30', curso: '8°B', asignatura: 'Lengua y Literatura' }
      ];
      return NextResponse.json({ bloques: mockBloques });
    }

    // 1. Parse FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let imageBuffer: Buffer;
    let mimeType = file.type;

    // 2. Convert PDF to PNG if applicable
    if (file.name.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
      try {
        const { fromBuffer } = require('pdf2pic');
        const converter = fromBuffer(buffer, {
          density: 150,
          saveFilename: 'horario_' + Date.now(),
          savePath: os.tmpdir(),
          format: 'png',
          width: 1200
        });
        const page = await converter(1);
        imageBuffer = fs.readFileSync(page.path);
        mimeType = 'image/png';
        
        // Clean up temp file asynchronously
        try {
          fs.unlink(page.path, () => {});
        } catch (e) {}
      } catch (err: any) {
        console.error('Error converting PDF with pdf2pic:', err);
        return NextResponse.json(
          { error: 'No pudimos convertir el archivo PDF. Intenta con una imagen en formato PNG o JPG.' },
          { status: 422 }
        );
      }
    } else {
      imageBuffer = buffer;
    }

    // Determine media type for Claude
    let mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      mediaType = 'image/jpeg';
    } else if (mimeType === 'image/gif') {
      mediaType = 'image/gif';
    } else if (mimeType === 'image/webp') {
      mediaType = 'image/webp';
    }

    // 3. Query Claude Vision
    const anthropic = new Anthropic({ apiKey });
    
    // Fallback strategy for the model parameter
    let responseText = '';
    const userPrompt = `Analiza este horario escolar chileno.
Extrae TODOS los bloques de clase y retorna
ÚNICAMENTE un JSON con este formato exacto,
sin texto adicional:
[
  { "dia": "Lunes", "desde": "08:00",
    "hasta": "09:30", "curso": "7°A",
    "asignatura": "Lengua y Literatura" }
]
Si no puedes determinar la asignatura de un bloque,
usa "asignatura": "" (string vacío).
Días válidos: Lunes Martes Miércoles Jueves Viernes.
Formato hora: HH:MM (24 horas).`;

    try {
      // First try 'claude-opus-4-5' as requested
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBuffer.toString('base64')
              }
            },
            {
              type: 'text',
              text: userPrompt
            }
          ]
        }]
      });
      responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    } catch (e: any) {
      console.warn('claude-opus-4-5 failed, falling back to claude-3-5-sonnet:', e.message);
      
      // Fallback to claude-3-5-sonnet-20241022
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBuffer.toString('base64')
              }
            },
            {
              type: 'text',
              text: userPrompt
            }
          ]
        }]
      });
      responseText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    }

    // 4. Parse JSON
    try {
      const sanitized = sanitizeJson(responseText);
      const bloques = JSON.parse(sanitized);

      if (!Array.isArray(bloques)) {
        throw new Error('La respuesta no es un array de bloques');
      }

      return NextResponse.json({ bloques });
    } catch (err) {
      console.error('Failed to parse Claude Vision timetable JSON response:', responseText, err);
      return NextResponse.json(
        { error: 'No pudimos leer el horario. Intenta con una imagen más clara o ingrésalo manualmente.' },
        { status: 422 }
      );
    }
  } catch (err: any) {
    console.error('Error in /api/onboarding/leer-horario:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
