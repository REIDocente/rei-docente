import { NextRequest, NextResponse } from 'next/server';
import { detectBubbles } from '@/lib/omr/detectBubbles';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, nPreguntasSM } = body;

    if (!image) {
      return NextResponse.json({ error: 'Falta la imagen a procesar.' }, { status: 400 });
    }

    const nSM = Number(nPreguntasSM) || 20;

    // Convert base64 data to binary buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Run bubble and QR detection
    const result = await detectBubbles(buffer, nSM);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in OMR API route:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error al procesar la imagen con OMR.' },
      { status: 500 }
    );
  }
}
