import sharp from 'sharp';
import jsQR from 'jsqr';

export interface OMRResult {
  success: boolean;
  error?: string;
  analisisId?: string;
  numeroLista?: number;
  respuestas: Record<string, string>;
}

// Fixed coordinates in 800x1100 space
const BUBBLE_RADIUS = 8;
const SCAN_WIDTH = 800;
const SCAN_HEIGHT = 1100;

export async function detectBubbles(imageBuffer: Buffer, nPreguntasSM: number): Promise<OMRResult> {
  try {
    // 1. Process image with sharp: resize to fixed dimensions and get raw pixels
    const pipeline = sharp(imageBuffer);
    
    // We get metadata first
    const metadata = await pipeline.metadata();
    
    // Resize to fixed scan size
    const resizedImage = await pipeline
      .resize(SCAN_WIDTH, SCAN_HEIGHT, { fit: 'fill' })
      .toBuffer();

    // 2. Decode QR Code using jsQR
    const { data: rawPixels, info } = await sharp(resizedImage)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const qrCode = jsQR(new Uint8ClampedArray(rawPixels), info.width, info.height);
    
    let decodedData: any = null;
    let decodedAnalisisId: string | undefined;
    let decodedNumeroLista: number | undefined;

    if (qrCode) {
      try {
        decodedData = JSON.parse(qrCode.data);
        decodedAnalisisId = decodedData.analisisId || decodedData.id;
        decodedNumeroLista = Number(decodedData.numeroLista || decodedData.n_lista || decodedData.numero_lista);
      } catch (err) {
        console.warn('QR Code text is not JSON, text is:', qrCode.data);
        // Fallback for simple text formats like "analisisId:numeroLista"
        const parts = qrCode.data.split(':');
        if (parts.length === 2) {
          decodedAnalisisId = parts[0];
          decodedNumeroLista = Number(parts[1]);
        }
      }
    } else {
      console.warn('QR Code could not be decoded from the sheet.');
    }

    // 3. Extract answers by measuring bubble fill ratios
    const respuestas: Record<string, string> = {};
    const columns = ['A', 'B', 'C', 'D'];

    // Convert resized image to grayscale raw bytes for OMR
    const { data: grayPixels } = await sharp(resizedImage)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Helper to get coordinates of a bubble
    // We have 2 columns of 20 questions
    const getBubbleCoords = (qNum: number, letterIdx: number) => {
      let x = 0;
      let y = 0;
      const letterOffset = letterIdx * 28; // Space between bubble columns A, B, C, D

      if (qNum <= 20) {
        // Column 1
        x = 160 + letterOffset;
        y = 280 + (qNum - 1) * 36;
      } else {
        // Column 2
        x = 520 + letterOffset;
        y = 280 + (qNum - 21) * 36;
      }

      return { x, y };
    };

    // For each SM question
    for (let q = 1; q <= nPreguntasSM; q++) {
      const fillRatios: number[] = [];

      for (let l = 0; l < 4; l++) {
        const { x, y } = getBubbleCoords(q, l);
        
        // Measure pixel density in a small bounding box around the coordinate
        let darkPixelCount = 0;
        let totalPixelCount = 0;
        const boxSize = 10; // 10x10 square around the bubble center

        for (let dy = -boxSize; dy <= boxSize; dy++) {
          for (let dx = -boxSize; dx <= boxSize; dx++) {
            const px = x + dx;
            const py = y + dy;

            if (px >= 0 && px < SCAN_WIDTH && py >= 0 && py < SCAN_HEIGHT) {
              const idx = py * SCAN_WIDTH + px;
              const grayVal = grayPixels[idx];
              
              // Standard threshold: below 130 is considered a dark pixel
              if (grayVal < 130) {
                darkPixelCount++;
              }
              totalPixelCount++;
            }
          }
        }

        const ratio = totalPixelCount > 0 ? darkPixelCount / totalPixelCount : 0;
        fillRatios.push(ratio);
      }

      // Find the darkest bubble in the row
      let maxRatio = -1;
      let maxIdx = -1;
      for (let i = 0; i < 4; i++) {
        if (fillRatios[i] > maxRatio) {
          maxRatio = fillRatios[i];
          maxIdx = i;
        }
      }

      // Threshold check:
      // Minimum fill density to count as a mark is 30%
      if (maxRatio >= 0.30) {
        respuestas[String(q)] = columns[maxIdx];
      }
    }

    return {
      success: true,
      analisisId: decodedAnalisisId,
      numeroLista: decodedNumeroLista,
      respuestas
    };
  } catch (err: any) {
    console.error('Error in detectBubbles OMR:', err);
    return {
      success: false,
      error: err.message || 'Error al procesar la imagen.',
      respuestas: {}
    };
  }
}
