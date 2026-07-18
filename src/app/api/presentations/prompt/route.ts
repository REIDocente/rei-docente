import { NextRequest, NextResponse } from 'next/server';
import { presentationTemplates } from '@/lib/templates/presentationPrompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      tipo, 
      destino, 
      tema, 
      curso, 
      oa, 
      contenido,
      unidad,
      actividades,
      evaluacion,
      ticket_salida
    } = body;

    if (!tipo || !destino || !tema || !curso || !oa || !contenido) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // Robust mapping for tipo_recurso to match presentationTemplates keys
    const tipoClean = tipo.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let tipoKey = '';
    if (tipoClean.includes('diapositiva')) {
      tipoKey = 'diapositivas';
    } else if (tipoClean.includes('tiempo')) {
      tipoKey = 'linea_de_tiempo';
    } else if (tipoClean.includes('flashcard')) {
      tipoKey = 'flashcards';
    } else if (tipoClean.includes('poster') || tipoClean.includes('lamina')) {
      tipoKey = 'poster';
    } else if (tipoClean.includes('afiche')) {
      tipoKey = 'afiche';
    } else if (tipoClean.includes('infografia')) {
      tipoKey = 'infografia';
    } else if (tipoClean.includes('organizador')) {
      tipoKey = 'organizador_visual';
    } else if (tipoClean.includes('comic')) {
      tipoKey = 'comic';
    } else {
      tipoKey = tipoClean.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    // Get the template for the requested type
    const templateGroup = presentationTemplates[tipoKey];
    if (!templateGroup) {
      return NextResponse.json({ error: `Tipo de recurso no soportado: ${tipo} (${tipoKey})` }, { status: 400 });
    }

    // Robust mapping for tool/destination
    const destClean = destino.trim().toLowerCase();
    let destKey: 'chatgpt' | 'canva' | 'notebooklm' | 'gamma' = 'chatgpt';
    if (destClean.includes('chatgpt')) {
      destKey = 'chatgpt';
    } else if (destClean.includes('canva')) {
      destKey = 'canva';
    } else if (destClean.includes('notebook')) {
      destKey = 'notebooklm';
    } else if (destClean.includes('gamma')) {
      destKey = 'gamma';
    }

    let rawTemplate = templateGroup[destKey];
    
    // Explicit override to correct "línea de tiempo + chatgpt" routing mismatch
    if ((tipoClean.includes('tiempo') || tipoClean.includes('linea')) && destClean.includes('chatgpt')) {
      rawTemplate = presentationTemplates.linea_de_tiempo.chatgpt;
    }

    if (!rawTemplate) {
      rawTemplate = templateGroup['chatgpt']; // fallback
    }

    // Bug 1 Fix: Safe serialization helper for fields that might be objects
    const serializeField = (field: any): string => {
      if (field === null || field === undefined) return '';
      if (typeof field === 'string') return field;
      if (typeof field === 'object') {
        try {
          return JSON.stringify(field, null, 2);
        } catch {
          return String(field);
        }
      }
      return String(field);
    };

    const cursoStr = serializeField(curso);
    const oaStr = serializeField(oa);
    const temaStr = serializeField(tema);
    const unidadStr = serializeField(unidad || tema);
    const contenidoStr = serializeField(contenido);
    const actividadesStr = serializeField(actividades || contenido);
    const evaluacionStr = serializeField(evaluacion);
    const ticketSalidaStr = serializeField(ticket_salida);

    // Perform replacements
    const finalPrompt = rawTemplate
      .replace(/{curso}/g, cursoStr)
      .replace(/{oa}/g, oaStr)
      .replace(/{unidad}/g, unidadStr)
      .replace(/{tema}/g, temaStr)
      .replace(/{contenido}/g, contenidoStr)
      .replace(/{actividades}/g, actividadesStr)
      .replace(/{evaluacion}/g, evaluacionStr || 'No especificada')
      .replace(/{ticket_salida}/g, ticketSalidaStr || 'No especificado');

    return NextResponse.json({ prompt: finalPrompt });

  } catch (error: any) {
    console.error('Error generating presentation prompt:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor.' }, { status: 500 });
  }
}
