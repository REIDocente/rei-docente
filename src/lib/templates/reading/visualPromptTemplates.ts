export const VISUAL_PROMPTS = {
  mapa_personajes: (libro: string, personajes: any[]) => {
    const list = Array.isArray(personajes) 
      ? personajes.map(p => `- ${p.nombre} (${p.rol || 'Secundario'}): ${p.descripcion || ''}`).join('\n')
      : '';
    return `Crea un mapa mental o infografía visual de personajes del libro "${libro}".
El diagrama debe conectar las relaciones, bandos o influencias mutuas entre los siguientes personajes principales:
${list}

Para cada personaje, dibuja un nodo con su nombre, una ilustración representativa en estilo plano moderno y añade una flecha que indique la relación con otro personaje (por ejemplo: "Aliado", "Enemigo", "Mentor", "Traición"). Usa colores contrastantes por bando.`;
  },
  linea_tiempo: (libro: string) => `Dibuja una línea de tiempo horizontal y cronológica con los hitos narrativos clave del libro "${libro}".
Divide la línea de tiempo en 5 hitos fundamentales:
1. Introducción y estado inicial.
2. Incidente desencadenante.
3. Clímax del conflicto central.
4. Desenlace de la historia.
5. Estado final o moraleja.

Para cada hito, incluye un recuadro de texto con un título grande en negrita, un resumen de 2 líneas del acontecimiento y una ilustración o ícono representativo. Usa un diseño minimalista con una línea central punteada y marcadores circulares.`,
  mapa_conceptual: (libro: string, temas: string[]) => {
    const list = Array.isArray(temas) ? temas.map(t => `- ${t}`).join('\n') : '';
    return `Genera un mapa conceptual de los temas principales del libro "${libro}".
El nodo central es el título del libro, conectado a los siguientes nodos temáticos primarios:
${list}

De cada tema primario, ramifica al menos dos subtemas o manifestaciones del conflicto en el texto. Dibuja rectángulos de color de fondo claro y líneas conectoras con verbos de enlace (ej: "se manifiesta en", "causa", "se opone a").`;
  },
  arbol_genealogico: (libro: string) => `Diseña un árbol genealógico familiar o de lealtades para el libro "${libro}".
Coloca en la cúspide a los ancestros o líderes principales de las familias y conecta hacia abajo en cascada a los descendientes o subordinados.
Dibuja cajas individuales para cada personaje que contengan:
- Nombre completo del personaje.
- Relación de parentesco o alianza.
- Colores diferenciados por linaje familiar o facción.

Usa líneas continuas para indicar relaciones de sangre directas y líneas punteadas para alianzas políticas o matrimonios.`,
  secuencia_narrativa: (libro: string) => `Genera un diagrama de flujo de secuencia narrativa para trabajar la estructura de la lectura domiciliaria del libro "${libro}".
El diagrama debe tener la estructura clásica del viaje del héroe o estructura dramática de Freytag:
- Exposición ➔ Incidente ➔ Acción Ascendente ➔ Clímax ➔ Acción Descendente ➔ Resolución.

Representa cada parte como un bloque con flechas que conecten la secuencia temporal y espacial del relato. Añade notas al margen sobre el punto de vista del narrador.`
};
