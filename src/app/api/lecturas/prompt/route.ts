import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { titulo, autor = 'Autor Desconocido', granularidad, rango_inicio, rango_fin } = body;

  if (!titulo) {
    return NextResponse.json({ error: 'El campo "titulo" es obligatorio' }, { status: 400 });
  }

  let resumenInstruction = '';
  if (granularidad === 'capitulos') {
    resumenInstruction = `El campo "resumen" debe ser un resumen capítulo por capítulo, indicando para cada uno: número, título (si lo tiene), eventos principales y personajes que aparecen.`;
  } else if (granularidad === 'paginas') {
    resumenInstruction = `El campo "resumen" debe cubrir las páginas ${rango_inicio || '1'} a ${rango_fin || 'fin'}, describiendo los eventos en orden, en bloques de aproximadamente 10 páginas.`;
  } else if (granularidad === 'fragmento') {
    resumenInstruction = `El campo "resumen" debe ser un resumen detallado del fragmento seleccionado.`;
  } else {
    resumenInstruction = `El campo "resumen" debe contener una sinopsis general y un resumen de las partes principales (Inicio, Nudo/Conflicto y Desenlace).`;
  }

  const promptText = `Analiza el libro "${titulo}" de ${autor} y responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta. No escribas explicaciones antes ni después. No uses bloques Markdown (no pongas \`\`\`json). Solo el JSON limpio.

{
  "titulo": "título exacto de la obra",
  "autor": "nombre completo del autor",
  "genero": "género literario",
  "resumen": "...",
  "personajes": [
    {
      "nombre": "...",
      "descripcion": "personalidad y rasgos físicos",
      "rol": "protagonista | antagonista | secundario | mentor | aliado",
      "relaciones": "vínculos con otros personajes"
    }
  ],
  "temas": ["tema central", "tema secundario 1", "tema secundario 2"],
  "conflictos": ["conflicto principal", "conflicto secundario 1"],
  "simbolos": ["símbolo 1 y su significado", "símbolo 2 y su significado"],
  "vocabulario": [
    { "palabra": "...", "definicion": "definición contextualizada" }
  ],
  "estructura_narrativa": "tipo de narrador, punto de vista, estructura temporal",
  "contexto_historico": "época, contexto social e histórico de la obra",
  "valores_mensajes": ["valor o moraleja 1", "valor o moraleja 2"],
  "fragmentos_clave": ["cita textual 1", "cita textual 2", "cita textual 3"]
}

INSTRUCCIONES ESPECÍFICAS:
- ${resumenInstruction}
- "personajes": incluye al menos los 3 personajes más importantes.
- "temas": mínimo 3 temas.
- "conflictos": mínimo el conflicto principal.
- "simbolos": mínimo 2 símbolos o elementos literarios.
- "vocabulario": exactamente 10 palabras complejas o interesantes de la obra con definición.
- "fragmentos_clave": exactamente 3 citas textuales importantes.
- No inventes información que no aparezca en la fuente.
- Devuelve SOLO el JSON. Sin texto adicional.`;

  return NextResponse.json({ prompt: promptText });
}
