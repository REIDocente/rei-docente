import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { gameEngines } from './gameEngines';

interface ExportPlayWordParams {
  motorId: string;
  juego: any; // contenido_json
  docenteNombre?: string;
  establecimiento?: string;
}

export function drawPlayWord({
  motorId,
  juego,
  docenteNombre = 'Docente',
  establecimiento = 'RIGOBERTO FONTT IZQUIERDO'
}: ExportPlayWordParams): Document {
  const engine = gameEngines.find(e => e.id === motorId);
  const sections: any[] = [];

  const h1 = (text: string, color = '1E3A5F') => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, color })]
  });

  const h2 = (text: string, color = '475569') => new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color })]
  });

  const bodyPara = (text: string, bold = false, color = '0F172A') => new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold, size: 20, color })]
  });

  const gap = () => new Paragraph({ text: '', spacing: { after: 120 } });

  // 1. ENCABEZADO INSTITUCIONAL
  sections.push(h1(`REI PLAY · JUEGO PEDAGÓGICO: ${engine?.nombre || 'Juego'}`));
  sections.push(bodyPara(`Establecimiento: ${establecimiento} | Nivel: ${juego.nivel || 'General'}`));
  sections.push(bodyPara(`Docente Responsable: ${docenteNombre}`));
  sections.push(gap());

  // ── SECCIÓN DEL ALUMNO ──
  sections.push(h2('=== SECCIÓN DEL ESTUDIANTE ===', '0F766E'));
  sections.push(gap());

  if (motorId === 'detective') {
    sections.push(h1(`Caso: ${juego.nombre_caso || 'Caso sin Título'}`, '1E3A5F'));
    sections.push(bodyPara(`Nombre del Investigador(a): ____________________________________________________`));
    sections.push(bodyPara(`Fecha: _____ / _____ / 2026`));
    sections.push(gap());

    sections.push(h2('Historia del Misterio'));
    sections.push(bodyPara(juego.historia || ''));
    sections.push(gap());

    sections.push(h2('Misión'));
    sections.push(bodyPara(juego.mision || '', true));
    sections.push(gap());

    sections.push(h2('Tarjetas de Pistas'));
    const pistas = Array.isArray(juego.pistas) ? juego.pistas : [];
    pistas.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`[ PISTA N° ${idx + 1} ]`, true, '1E3A5F'));
      sections.push(bodyPara(p));
      sections.push(gap());
    });

    sections.push(h2('Preguntas de Investigación'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    preguntas.forEach((p: any, idx: number) => {
      const enunciado = typeof p === 'object' ? (p.enunciado || p.pregunta) : p;
      sections.push(bodyPara(`${idx + 1}. ${enunciado}`, true));
      sections.push(bodyPara('Respuesta: __________________________________________________________________________'));
      sections.push(gap());
    });

    sections.push(h2('Registro de Evidencia Final'));
    sections.push(bodyPara(juego.evidencia || ''));
    sections.push(gap());

    sections.push(h2('Ticket de Salida (Autoevaluación)'));
    const tickets = Array.isArray(juego.ticket) ? juego.ticket : [];
    tickets.forEach((t: any, idx: number) => {
      sections.push(bodyPara(`${idx + 1}. ${t}`, true));
      sections.push(bodyPara('Respuesta: __________________________________________________________________________'));
      sections.push(gap());
    });

  } else if (motorId === 'escape_room') {
    sections.push(h1('Misión de Escape Room', '7F1D1D'));
    sections.push(bodyPara(juego.mision || ''));
    sections.push(gap());

    sections.push(h2('Pruebas a Resolver'));
    sections.push(h2('Prueba 1'));
    sections.push(bodyPara(juego.prueba1 || ''));
    sections.push(bodyPara('Código Prueba 1: [ _____ ]', true));
    sections.push(gap());

    sections.push(h2('Prueba 2'));
    sections.push(bodyPara(juego.prueba2 || ''));
    sections.push(bodyPara('Código Prueba 2: [ _____ ]', true));
    sections.push(gap());

    sections.push(h2('Prueba 3'));
    sections.push(bodyPara(juego.prueba3 || ''));
    sections.push(bodyPara('Código Prueba 3 (FINAL): [ _____ ]', true));
    sections.push(gap());

    sections.push(h2('Ticket de Salida (Reflexión)'));
    sections.push(bodyPara(juego.ticket || ''));
    sections.push(bodyPara('Respuesta: __________________________________________________________________________'));

  } else if (motorId === 'bingo') {
    sections.push(h1('Bingo de Conceptos Clave', '166534'));
    sections.push(bodyPara(juego.instrucciones || 'Reglas del Bingo: Complete el cartón según las definiciones leídas por el docente.'));
    sections.push(gap());

    sections.push(h2('Cartones del Estudiante (6 Cartones)'));
    const conceptos = Array.isArray(juego.conceptos) ? juego.conceptos : [];
    
    // Crear 6 cartones 4x4
    for (let cNum = 0; cNum < 6; cNum++) {
      sections.push(h2(`Cartón N° ${cNum + 1}`));
      const rows = [];
      const cIndex = cNum * 4;

      for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
          const concept = conceptos[(cIndex + r * 4 + c) % conceptos.length] || 'Didakta';
          cells.push(new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: concept, spacing: { before: 100, after: 100 } })]
          }));
        }
        rows.push(new TableRow({ children: cells }));
      }

      sections.push(new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));
      sections.push(gap());
    }

  } else if (motorId === 'trivia') {
    sections.push(h1('Trivia Pedagógica', '4C1D95'));
    sections.push(bodyPara(juego.instrucciones || 'Responda las preguntas por equipo y anote sus puntuaciones.'));
    sections.push(gap());

    sections.push(h2('Tarjetas de Trivia'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const categorias = Array.isArray(juego.categorias) ? juego.categorias : [];

    preguntas.forEach((p: any, idx: number) => {
      const cat = categorias[idx] || 'General';
      sections.push(bodyPara(`Tarjeta N° ${idx + 1} - Categoría: ${cat}`, true, '4C1D95'));
      sections.push(bodyPara(`Pregunta: ${p}`));
      sections.push(gap());
    });

    sections.push(h2('Tabla de Puntuación (Equipos)'));
    const teamsHeader = new TableRow({
      children: ['Equipo 1', 'Equipo 2', 'Equipo 3', 'Equipo 4', 'Equipo 5'].map(t => new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: t, spacing: { before: 80, after: 80 } })]
      }))
    });
    const scoreRow = new TableRow({
      children: Array(5).fill('_________________').map(s => new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: s, spacing: { before: 80, after: 80 } })]
      }))
    });
    sections.push(new Table({
      rows: [teamsHeader, scoreRow],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }));

  } else if (motorId === 'cartas') {
    sections.push(h1('Duelo de Cartas Pedagógicas', '92400E'));
    sections.push(bodyPara(juego.reglas || 'Reglas del mazo de cartas.'));
    sections.push(gap());

    sections.push(h2('Mazo de Cartas (16 Cartas)'));
    const mazo = Array.isArray(juego.cartas) ? juego.cartas : [];
    mazo.forEach((card: any, idx: number) => {
      sections.push(bodyPara(`Carta N° ${idx + 1}: ${card.nombre || 'Personaje'}`, true, '92400E'));
      sections.push(bodyPara(`Atributos: ${card.atributos || ''}`));
      sections.push(bodyPara(`Habilidad/Cita: ${card.descripcion || card.cita_habilidad || ''}`));
      sections.push(gap());
    });

  } else if (motorId === 'memoria') {
    sections.push(h1('Juego de Memoria', '0C4A6E'));
    sections.push(bodyPara(juego.instrucciones || 'Encuentre las parejas emparejando los conceptos con sus definiciones correctas.'));
    sections.push(gap());

    sections.push(h2('Tarjetas de Memoria'));
    const pares = Array.isArray(juego.pares) ? juego.pares : [];
    pares.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Par N° ${idx + 1}`, true, '0C4A6E'));
      sections.push(bodyPara(`Tarjeta Concepto: ${p.concepto}`));
      sections.push(bodyPara(`Tarjeta Definición: ${p.definicion}`));
      sections.push(gap());
    });
  } else if (motorId === 'clue') {
    sections.push(h1('CLUE Pedagógico - Mansión del Misterio', '14532d'));
    sections.push(bodyPara(`Caso: ${juego.nombre_caso || 'Caso sin Título'}`, true));
    sections.push(bodyPara(juego.historia || ''));
    sections.push(gap());

    sections.push(h2('Sospechosos de la Mansión'));
    const personajes = Array.isArray(juego.personajes) ? juego.personajes : [];
    personajes.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Sospechoso N° ${idx + 1}: ${p.nombre || ''}`, true, '14532d'));
      sections.push(bodyPara(`Habitación Inicial: ${p.habitacion_inicial || ''}`));
      sections.push(bodyPara(`Descripción: ${p.descripcion || ''}`));
      sections.push(bodyPara(`Motivación: ${p.motivacion || ''}`));
      sections.push(gap());
    });

    sections.push(h2('Evidencias Distribuidas'));
    const evidencias = Array.isArray(juego.evidencias) ? juego.evidencias : [];
    evidencias.forEach((ev: any, idx: number) => {
      sections.push(bodyPara(`Evidencia N° ${idx + 1}: ${ev.nombre || ''}`, true, '14532d'));
      sections.push(bodyPara(`Habitación de Ubicación: ${ev.habitacion || ''}`));
      sections.push(bodyPara(`Descripción de la Evidencia: ${ev.descripcion || ''}`));
      sections.push(gap());
    });

    sections.push(h2('Hoja de Investigación y Descarte'));
    sections.push(bodyPara('Marque con X las pistas descartadas durante la partida.'));

  } else if (motorId === 'serpiente_escaleras') {
    sections.push(h1('Serpientes y Escaleras Pedagógico', '0891b2'));
    sections.push(bodyPara('Lanza el dado, avanza casillas y responde las preguntas para avanzar más rápido por las escaleras o evitar bajar por las serpientes.'));
    sections.push(gap());

    sections.push(h2('Tarjetas de Preguntas (20 Preguntas)'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    preguntas.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Pregunta N° ${idx + 1}:`, true, '0891b2'));
      sections.push(bodyPara(p));
      sections.push(bodyPara('Respuesta del Alumno: __________________________________________________'));
      sections.push(gap());
    });

  } else if (motorId === 'ludo') {
    sections.push(h1('Ludo Pedagógico', 'b91c1c'));
    sections.push(bodyPara('Clásico juego de ludo donde caer en casillas especiales requiere responder preguntas de dificultad variable para avanzar o no retroceder.'));
    sections.push(gap());

    sections.push(h2('Preguntas Fáciles (Verde)'));
    const faciles = Array.isArray(juego.preguntas_faciles) ? juego.preguntas_faciles : [];
    faciles.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Pregunta Fácil N° ${idx + 1}:`, true, '16a34a'));
      sections.push(bodyPara(p));
      sections.push(gap());
    });

    sections.push(h2('Preguntas Medias (Amarillo)'));
    const medias = Array.isArray(juego.preguntas_medias) ? juego.preguntas_medias : [];
    medias.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Pregunta Media N° ${idx + 1}:`, true, 'eab308'));
      sections.push(bodyPara(p));
      sections.push(gap());
    });

    sections.push(h2('Preguntas Difíciles (Rojo)'));
    const dificiles = Array.isArray(juego.preguntas_dificiles) ? juego.preguntas_dificiles : [];
    dificiles.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Pregunta Difícil N° ${idx + 1}:`, true, 'dc2626'));
      sections.push(bodyPara(p));
      sections.push(gap());
    });
  }

  // ── SECCIÓN DEL DOCENTE (USO EXCLUSIVO DOCENTE) ──
  sections.push(gap());
  sections.push(gap());
  sections.push(h1('=== USO EXCLUSIVO DOCENTE ===', 'DC2626'));
  sections.push(gap());

  if (motorId === 'detective') {
    sections.push(h2('Respuestas y Solución del Caso'));
    if (typeof juego.solucion === 'object') {
      Object.keys(juego.solucion).forEach((key) => {
        sections.push(bodyPara(`${key.toUpperCase()}:`, true));
        sections.push(bodyPara(String(juego.solucion[key])));
        sections.push(gap());
      });
    } else {
      sections.push(bodyPara(juego.solucion || ''));
    }

  } else if (motorId === 'escape_room') {
    sections.push(h2('Respuestas del Escape Room'));
    sections.push(bodyPara(`Clave Prueba 1: ${juego.clave1 || 'A'}`, true));
    sections.push(bodyPara(`Clave Prueba 2: ${juego.clave2 || 'B'}`, true));
    sections.push(bodyPara(`Clave Prueba 3 (FINAL): ${juego.clave_final || 'C'}`, true));
    sections.push(gap());
    sections.push(bodyPara('Solución Detallada:', true));
    sections.push(bodyPara(juego.solucion || ''));

  } else if (motorId === 'bingo') {
    sections.push(h2('Tarjetas de Llamada del Docente (Bingo)'));
    const defs = Array.isArray(juego.definiciones) ? juego.definiciones : [];
    defs.forEach((def: any, idx: number) => {
      const cLabel = typeof def === 'object' ? (def.concepto || `Concepto ${idx+1}`) : `Definición ${idx+1}`;
      const dText = typeof def === 'object' ? (def.definicion || '') : def;
      sections.push(bodyPara(`Definición N° ${idx + 1}: ${dText}`));
      sections.push(bodyPara(`[ Concepto clave: ${cLabel} ]`, true, '166534'));
      sections.push(gap());
    });

  } else if (motorId === 'trivia') {
    sections.push(h2('Clave de Respuestas de Trivia'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const respuestas = Array.isArray(juego.respuestas) ? juego.respuestas : [];
    preguntas.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Pregunta ${idx + 1}: ${p}`, true));
      sections.push(bodyPara(`Respuesta Correcta: ${respuestas[idx] || 'Sin definir.'}`, true, '16A34A'));
      sections.push(gap());
    });

  } else if (motorId === 'cartas') {
    sections.push(h2('Sugerencia de Dinámicas y Respuestas de Cartas'));
    sections.push(bodyPara('Utilice el mazo de cartas para combates o debates literarios, asignando a los personajes para defender sus posturas según sus atributos y citas.'));

  } else if (motorId === 'memoria') {
    sections.push(h2('Pauta de Emparejamientos Correctos'));
    const pares = Array.isArray(juego.pares) ? juego.pares : [];
    pares.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Par ${idx + 1}: [ Concepto: ${p.concepto} ] <--> [ Definición: ${p.definicion} ]`, true));
      sections.push(gap());
    });
  } else if (motorId === 'clue') {
    sections.push(h2('Sobre de Solución del Misterio (Docente)'));
    const sol = juego.solucion || {};
    sections.push(bodyPara(`Culpable: ${sol.culpable || ''}`, true));
    sections.push(bodyPara(`Habitación / Escena: ${sol.habitacion || ''}`, true));
    sections.push(bodyPara(`Evidencia Clave: ${sol.evidencia || ''}`, true));
    sections.push(bodyPara(`Explicación de la Pauta: ${sol.explicacion_docente || ''}`));

  } else if (motorId === 'serpiente_escaleras') {
    sections.push(h2('Clave de Respuestas (Serpientes y Escaleras)'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const respuestas = Array.isArray(juego.respuestas) ? juego.respuestas : [];
    preguntas.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`Pregunta ${idx + 1}: ${p}`, true));
      sections.push(bodyPara(`Respuesta Correcta: ${respuestas[idx] || ''}`, true, '16A34A'));
      sections.push(gap());
    });

  } else if (motorId === 'ludo') {
    sections.push(h2('Clave de Respuestas (Ludo)'));
    const faciles = Array.isArray(juego.preguntas_faciles) ? juego.preguntas_faciles : [];
    const medias = Array.isArray(juego.preguntas_medias) ? juego.preguntas_medias : [];
    const dificiles = Array.isArray(juego.preguntas_dificiles) ? juego.preguntas_dificiles : [];
    const respuestas = juego.respuestas || {};

    sections.push(h2('Respuestas Fáciles'));
    faciles.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`P: ${p}`));
      sections.push(bodyPara(`R: ${(respuestas.faciles && respuestas.faciles[idx]) || ''}`, true, '16A34A'));
    });
    sections.push(gap());

    sections.push(h2('Respuestas Medias'));
    medias.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`P: ${p}`));
      sections.push(bodyPara(`R: ${(respuestas.medias && respuestas.medias[idx]) || ''}`, true, '16A34A'));
    });
    sections.push(gap());

    sections.push(h2('Respuestas Difíciles'));
    dificiles.forEach((p: any, idx: number) => {
      sections.push(bodyPara(`P: ${p}`));
      sections.push(bodyPara(`R: ${(respuestas.dificiles && respuestas.dificiles[idx]) || ''}`, true, '16A34A'));
    });
  }

  // Retornamos el documento estructurado en una única sección con sus párrafos
  return new Document({
    sections: [
      {
        properties: {},
        children: sections
      }
    ]
  });
}
