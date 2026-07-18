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

  let resumenSection = '';

  if (granularidad === 'capitulos') {
    resumenSection = `2. RESUMEN POR CAPÍTULOS
   Para cada capítulo del libro indica:
   - Número y título del capítulo (si lo tiene)
   - Eventos principales
   - Personajes que aparecen
   - Aprendizaje o mensaje del capítulo`;
  } else if (granularidad === 'paginas') {
    resumenSection = `2. RESUMEN DE PÁGINAS ${rango_inicio || '1'} A ${rango_fin || 'fin'}
   Resume los eventos de esta sección en orden, indicando qué ocurre en cada bloque de 10 páginas aproximadamente.`;
  } else if (granularidad === 'fragmento') {
    resumenSection = `2. RESUMEN DEL FRAGMENTO SELECCIONADO
   Resume detalladamente los acontecimientos narrados en el fragmento proporcionado.`;
  } else {
    resumenSection = `2. RESUMEN GENERAL COMPLETO
   Escribe una sinopsis general de la obra y un resumen de las partes principales (Inicio, Nudo/Conflicto y Desenlace).`;
  }

  const promptText = `Analiza el libro "${titulo}" de ${autor} y responde en formato estructurado bajo el siguiente expediente:

1. DATOS BÁSICOS
   - Título de la obra: ${titulo}
   - Autor: ${autor}
   - Género literario
   - Cursos chilenos sugeridos para su lectura

${resumenSection}

3. PERSONAJES
   Proporciona una lista detallada de los personajes principales y secundarios en formato de array JSON o lista estructurada conteniendo para cada uno:
   - nombre
   - descripcion (personalidad y rasgos físicos)
   - rol (ej: protagonista, antagonista, mentor, aliado, secundario)
   - relaciones (vínculos con otros personajes del libro)

4. TEMAS
   Identifica y explica el tema central y al menos 3 temas secundarios abordados en la obra.

5. CONFLICTOS
   Describe el conflicto principal de la historia (ej: hombre vs naturaleza, hombre vs sociedad) y al menos 2 conflictos secundarios.

6. SÍMBOLOS Y ELEMENTOS LITERARIOS
   Explica al menos 3 símbolos o motivos literarios recurrentes en la lectura y su significado dentro de la obra.

7. CONTEXTO HISTÓRICO Y CULTURAL
   Describe la época en que fue escrita la obra o el contexto social e histórico en el que se ambienta, y cómo influye en el relato.

8. ESTRUCTURA NARRATIVA
   Indica el tipo de narrador (ej: protagonista, testigo, omnisciente), el punto de vista narrativo y si la estructura temporal es lineal o no lineal (racconto, flashforward, etc.).

9. VOCABULARIO CLAVE
   Extrae exactamente 15 palabras complejas o interesantes presentes en la lectura junto con su definición contextualizada.

10. VALORES Y MENSAJES
    Detalla los principales valores éticos o moralejas que se pueden extraer de la lectura de esta obra.

11. FRAGMENTOS CLAVE
    Proporciona exactamente 5 citas textuales importantes de la obra que sirvan para analizar o debatir en clases, junto con un breve comentario explicativo de cada una.

IMPORTANTE: Responde cada sección de forma clara y separada.
Usa el mismo encabezado numérico de este prompt para cada sección.`;

  return NextResponse.json({ prompt: promptText });
}
