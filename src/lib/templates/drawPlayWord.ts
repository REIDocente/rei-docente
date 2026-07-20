import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { gameEngines } from './gameEngines';

interface ExportPlayWordParams {
  motorId: string;
  juego: any; // contenido_json
  docenteNombre?: string;
  establecimiento?: string;
  nivel?: string;
}

export function drawPlayWord({
  motorId,
  juego,
  docenteNombre = 'Docente',
  establecimiento = 'RIGOBERTO FONTT IZQUIERDO',
  nivel = ''
}: ExportPlayWordParams): Document {
  const engine = gameEngines.find(e => e.id === motorId);
  const studentParagraphs: any[] = [];
  const teacherParagraphs: any[] = [];

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

  // ── SECCIÓN DEL ESTUDIANTE (KIT DEL ESTUDIANTE) ──
  const caseTitle = juego.nombre_caso || engine?.nombre || 'Juego Pedagógico';
  studentParagraphs.push(h1(`REI PLAY · ${caseTitle.toUpperCase()}`, '1E3A5F'));
  studentParagraphs.push(bodyPara(`Establecimiento: ${establecimiento}${nivel ? ` | Nivel: ${nivel}` : ''}`));
  studentParagraphs.push(bodyPara(`Docente Responsable: ${docenteNombre}`));
  studentParagraphs.push(gap());

  if (motorId === 'detective') {
    const oaListDetW = Array.isArray(juego.objetivos_aprendizaje) ? juego.objetivos_aprendizaje : [];
    const estacionesW = Array.isArray(juego.estaciones) ? juego.estaciones : [];

    studentParagraphs.push(bodyPara('DETECTIVE REI · EXPEDIENTE DE INVESTIGACIÓN POR ESTACIONES', true, '64748b'));
    studentParagraphs.push(gap());

    if (juego.nota_metodologica) {
      studentParagraphs.push(bodyPara(`Nota: ${juego.nota_metodologica}`, false, '92400e'));
      studentParagraphs.push(gap());
    }

    studentParagraphs.push(bodyPara('Investigador(a): ____________________________________________________', true));
    studentParagraphs.push(bodyPara(`Organización: 6 equipos de 6 a 8 estudiantes (40-45 alumnos) | Equipo N°: _______ | Fecha: _____ / _____ / 2026`));
    studentParagraphs.push(bodyPara('Roles: Lector/a | Analista | Secretario/a | Encargado/a de pistas | Portavoz | Guardián del tiempo (opcional) | Encargado/a del código (opcional) | Moderador/a (opcional)', true, '1E3A5F'));
    studentParagraphs.push(gap());

    if (oaListDetW.length > 0) {
      studentParagraphs.push(h2('Objetivos de Aprendizaje Vinculados (Síntesis)'));
      oaListDetW.forEach((oa: any) => {
        const desc = oa.descripcion || '';
        const sintesis = desc.length > 110 ? desc.slice(0, 107) + '...' : desc;
        studentParagraphs.push(bodyPara(`${oa.codigo}: ${sintesis}`, false, '334155'));
      });
      studentParagraphs.push(gap());
    }

    studentParagraphs.push(h2('Objetivo de la Investigación'));
    studentParagraphs.push(juego.objetivo_investigacion ? bodyPara(juego.objetivo_investigacion, true) : bodyPara('El equipo debe construir una hipótesis fundamentada sobre el tema central.', true));
    studentParagraphs.push(gap());

    studentParagraphs.push(h2('Contexto del Caso'));
    studentParagraphs.push(bodyPara(juego.contexto_narrativo || ''));
    studentParagraphs.push(gap());

    studentParagraphs.push(h2('Registro de Códigos por Estación'));
    studentParagraphs.push(bodyPara('Anota la letra-código desbloqueada en cada estación:'));
    studentParagraphs.push(bodyPara('Est. 1: [   ]   Est. 2: [   ]   Est. 3: [   ]   Est. 4: [   ]   Est. 5: [   ]   Est. 6: [   ]'));
    studentParagraphs.push(bodyPara('Código final formado: ___________________________', true));
    studentParagraphs.push(gap());

    estacionesW.forEach((est: any, idx: number) => {
      const pista = est.pista || {};
      const tipoEv = pista.tipo_evidencia || 'recreacion_pedagogica';
      const tipoLabel = tipoEv === 'cita_textual' ? 'Cita textual' : tipoEv === 'parafrasis' ? 'Paráfrasis' : 'Recreación pedagógica';
      const fuente = pista.fuente || {};
      const contenido = pista.contenido || '';
      const textoPista = tipoEv === 'cita_textual' ? `"${contenido}"` : contenido;

      studentParagraphs.push(h2(`Estación ${idx + 1}: ${est.nombre || ''}`));
      studentParagraphs.push(bodyPara(`OA trabajado: ${est.oa_vinculado || ''} | Duración: 6-8 minutos`, false, '64748b'));
      studentParagraphs.push(gap());

      studentParagraphs.push(bodyPara(`PISTA [${tipoLabel}]:`, true, '1E3A5F'));
      studentParagraphs.push(bodyPara(textoPista));

      if (tipoEv === 'cita_textual' && (fuente.obra || fuente.capitulo)) {
        const fStr = [fuente.obra, fuente.autor, fuente.capitulo ? `Cap. ${fuente.capitulo}` : '', fuente.pagina ? `p. ${fuente.pagina}` : ''].filter(Boolean).join(' - ');
        studentParagraphs.push(bodyPara(`Fuente: ${fStr}`, false, '64748b'));
      }

      if (tipoEv === 'recreacion_pedagogica') {
        studentParagraphs.push(bodyPara('Advertencia: Esta pista es una recreación pedagógica inspirada en el material de estudio. No corresponde a una cita textual.', false, '92400e'));
      }

      studentParagraphs.push(gap());
      studentParagraphs.push(bodyPara('DESAFÍO PEDAGÓGICO:', true, '1E3A5F'));
      studentParagraphs.push(bodyPara(est.desafio || ''));
      studentParagraphs.push(gap());
      studentParagraphs.push(bodyPara('Respuesta del equipo:'));
      studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
      studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
      studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
      studentParagraphs.push(gap());
      studentParagraphs.push(bodyPara(`Código desbloqueado: [   ]`, true, '1E3A5F'));
      studentParagraphs.push(gap());
    });

    const ef = juego.expediente_final || {};
    studentParagraphs.push(h2('Expediente Final del Equipo'));
    if (ef.instruccion) studentParagraphs.push(bodyPara(ef.instruccion, false, '64748b'));
    studentParagraphs.push(gap());
    studentParagraphs.push(bodyPara(ef.hipotesis_guia || 'Hipótesis del equipo:', true, '1E3A5F'));
    studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
    studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
    studentParagraphs.push(gap());
    studentParagraphs.push(bodyPara(ef.fundamento_guia || 'Fundamento 1 (cita, dato o episodio del material):', true, '1E3A5F'));
    studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
    studentParagraphs.push(gap());
    studentParagraphs.push(bodyPara('Fundamento 2:', true, '1E3A5F'));
    studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
    studentParagraphs.push(gap());
    studentParagraphs.push(bodyPara(ef.conclusion_guia || 'Conclusión: ¿cómo conecta tu hipótesis con los temas del material?', true, '1E3A5F'));
    studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
    studentParagraphs.push(gap());

    studentParagraphs.push(h2('Ticket de Salida'));
    const ticketsW = Array.isArray(juego.ticket) ? juego.ticket : [];
    ticketsW.forEach((t: any, idx: number) => {
      const tText = typeof t === 'string' ? t : (t.pregunta || String(t));
      studentParagraphs.push(bodyPara(`${idx + 1}. ${tText}`, true));
      studentParagraphs.push(bodyPara('___________________________________________________________________________________'));
      studentParagraphs.push(gap());
    });
    studentParagraphs.push(bodyPara('Autoevaluación colaborativa: ¿Todos participaron activamente? ¿Qué rol fue más desafiante?', true));
    studentParagraphs.push(bodyPara('___________________________________________________________________________________'));

  } else if (motorId === 'escape_room') {
    studentParagraphs.push(bodyPara(juego.mision || ''));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Pruebas a Resolver'));
    studentParagraphs.push(h2('Prueba 1'));
    studentParagraphs.push(bodyPara(juego.prueba1 || ''));
    studentParagraphs.push(bodyPara('Código Prueba 1: [ _____ ]', true));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Prueba 2'));
    studentParagraphs.push(bodyPara(juego.prueba2 || ''));
    studentParagraphs.push(bodyPara('Código Prueba 2: [ _____ ]', true));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Prueba 3'));
    studentParagraphs.push(bodyPara(juego.prueba3 || ''));
    studentParagraphs.push(bodyPara('Código Prueba 3 (FINAL): [ _____ ]', true));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Ticket de Salida (Reflexión)'));
    studentParagraphs.push(bodyPara(juego.ticket || ''));
    studentParagraphs.push(bodyPara('Respuesta: __________________________________________________________________________'));

  } else if (motorId === 'bingo') {
    studentParagraphs.push(bodyPara(juego.instrucciones || 'Reglas del Bingo: Complete el cartón según las definiciones leídas por el docente.'));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Cartones del Estudiante (6 Cartones)'));
    const conceptos = Array.isArray(juego.conceptos) ? juego.conceptos : [];
    for (let cNum = 0; cNum < 6; cNum++) {
      studentParagraphs.push(h2(`Cartón N° ${cNum + 1}`));
      const rows = [];
      const cIndex = cNum * 4;
      for (let r = 0; r < 4; r++) {
        const cells = [];
        for (let c = 0; c < 4; c++) {
          const concept = conceptos[(cIndex + r * 4 + c) % conceptos.length] || 'Concepto';
          cells.push(new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: concept, spacing: { before: 100, after: 100 } })]
          }));
        }
        rows.push(new TableRow({ children: cells }));
      }
      studentParagraphs.push(new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE }
      }));
      studentParagraphs.push(gap());
    }

  } else if (motorId === 'trivia') {
    studentParagraphs.push(bodyPara(juego.instrucciones || 'Responda las preguntas por equipo y anote sus puntuaciones.'));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Tarjetas de Trivia'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const categorias = Array.isArray(juego.categorias) ? juego.categorias : [];
    preguntas.forEach((p: any, idx: number) => {
      const cat = categorias[idx] || 'General';
      studentParagraphs.push(bodyPara(`Tarjeta N° ${idx + 1} - Categoría: ${cat}`, true, '4C1D95'));
      studentParagraphs.push(bodyPara(`Pregunta: ${p}`));
      studentParagraphs.push(gap());
    });
    studentParagraphs.push(h2('Tabla de Puntuación (Equipos)'));
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
    studentParagraphs.push(new Table({
      rows: [teamsHeader, scoreRow],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }));

  } else if (motorId === 'cartas') {
    studentParagraphs.push(bodyPara(juego.reglas || 'Reglas del mazo de cartas.'));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Mazo de Cartas (16 Cartas)'));
    const mazo = Array.isArray(juego.cartas) ? juego.cartas : [];
    mazo.forEach((card: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Carta N° ${idx + 1}: ${card.nombre || 'Carta'}`, true, '92400E'));
      studentParagraphs.push(bodyPara(`Atributos: ${card.atributos || ''}`));
      studentParagraphs.push(bodyPara(`Habilidad/Cita: ${card.descripcion || card.cita_habilidad || ''}`));
      studentParagraphs.push(gap());
    });

  } else if (motorId === 'memoria') {
    studentParagraphs.push(bodyPara(juego.instrucciones || 'Encuentre las parejas emparejando los conceptos con sus definiciones correctas.'));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Tarjetas de Memoria'));
    const pares = Array.isArray(juego.pares) ? juego.pares : [];
    pares.forEach((p: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Par N° ${idx + 1} - Concepto`, true, '0C4A6E'));
      studentParagraphs.push(bodyPara(p.concepto));
      studentParagraphs.push(bodyPara(`Par N° ${idx + 1} - Definición`, true, '0C4A6E'));
      studentParagraphs.push(bodyPara(p.definicion));
      studentParagraphs.push(gap());
    });

  } else if (motorId === 'clue') {
    studentParagraphs.push(bodyPara(juego.historia || ''));
    if (juego.nota_ficcion) {
      studentParagraphs.push(bodyPara(`Nota: ${juego.nota_ficcion}`, false, '64748b'));
    }
    studentParagraphs.push(gap());

    const oaList = Array.isArray(juego.objetivos_aprendizaje) ? juego.objetivos_aprendizaje : [];
    if (oaList.length > 0) {
      studentParagraphs.push(h2('Objetivos de Aprendizaje Vinculados (Síntesis)'));
      oaList.forEach((oa: any) => {
        const desc = oa.descripcion || '';
        const sintesis = desc.length > 110 ? desc.slice(0, 107) + '...' : desc;
        studentParagraphs.push(bodyPara(`${oa.codigo}: ${sintesis}`));
      });
      studentParagraphs.push(gap());
    }

    studentParagraphs.push(h2('Sospechosos (4 tarjetas)'));
    const personajes = Array.isArray(juego.personajes) ? juego.personajes : [];
    personajes.forEach((p: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Sospechoso N° ${idx + 1}: ${p.nombre || ''}`, true, '14532d'));
      studentParagraphs.push(bodyPara(`Ficha: ${['ROJO', 'AZUL', 'VERDE', 'NARANJA'][idx] || ''} | Habitación Inicial: ${p.habitacion_inicial || ''}`));
      studentParagraphs.push(bodyPara(`Rol en el contenido: ${p.rol_en_contenido || p.rol_en_obra || p.descripcion || ''}`));
      studentParagraphs.push(bodyPara(`Relevancia para el caso: ${p.motivacion || ''}`));
      studentParagraphs.push(bodyPara('Indicio textual encontrado: ____________________________________________'));
      studentParagraphs.push(gap());
    });

    studentParagraphs.push(h2('Evidencias (6 tarjetas)'));
    const evidencias = Array.isArray(juego.evidencias) ? juego.evidencias : [];
    evidencias.forEach((ev: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Evidencia N° ${idx + 1}: ${ev.nombre || ''}`, true, '14532d'));
      studentParagraphs.push(bodyPara(`Habitación: ${ev.habitacion || ''} | Descripción: ${ev.descripcion || ''}`));
      studentParagraphs.push(bodyPara(`Relevancia pedagógica: ${ev.relevancia_pedagogica || ''}`));
      studentParagraphs.push(gap());
    });

    studentParagraphs.push(h2('Habitaciones con Desafíos Literarios (6 tarjetas)'));
    const habitacionesData = Array.isArray(juego.habitaciones) ? juego.habitaciones : [];
    habitacionesData.forEach((hab: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Habitación N° ${idx + 1}: ${hab.nombre || ''}`, true, '14532d'));
      studentParagraphs.push(bodyPara(`Desafío literario: ${hab.desafio || ''}`));
      studentParagraphs.push('Respuesta del equipo: ____________________________________________');
      studentParagraphs.push(gap());
    });

    studentParagraphs.push(h2('Hoja de Investigación y Descarte'));
    studentParagraphs.push(bodyPara('Marca con X cada carta que hayas visto. La solución es la carta que nadie puede mostrar.'));
    studentParagraphs.push(gap());

    const clueRows = ['SOSPECHOSOS', 'EVIDENCIAS', 'HABITACIONES'];
    clueRows.forEach(colName => {
      studentParagraphs.push(bodyPara(`--- ${colName} ---`, true, '14532d'));
      const items = colName === 'SOSPECHOSOS' ? personajes.map((p: any) => p.nombre || '')
        : colName === 'EVIDENCIAS' ? evidencias.map((ev: any) => ev.nombre || '')
        : habitacionesData.map((h: any) => h.nombre || '');
      items.forEach((item: string) => {
        studentParagraphs.push(bodyPara(`[ ]  ${item}     Quién lo mostró: ________________________`));
      });
      studentParagraphs.push(gap());
    });

    studentParagraphs.push(h2('Acusación Final'));
    const etiqHip = juego.etiqueta_hipotesis || 'Hipótesis:';
    const etiqSos = juego.etiqueta_sospechosos || 'El elemento';
    studentParagraphs.push(bodyPara(`${etiqHip}:`, true, '14532d'));
    studentParagraphs.push(bodyPara(`${etiqSos} ______________, evidencia: ______________, habitación: ______________.`));
    studentParagraphs.push(bodyPara('¿Cómo se relacionan? ____________________________________________________________'));
    studentParagraphs.push(gap());
    studentParagraphs.push(bodyPara('Fundamento 1 (cita, dato o episodio del material): _________________________________'));
    studentParagraphs.push(bodyPara('Fundamento 2: ____________________________________________________________'));

  } else if (motorId === 'serpiente_escaleras') {
    studentParagraphs.push(bodyPara('Lanza el dado, avanza casillas y responde las preguntas para avanzar más rápido por las escaleras o evitar bajar por las serpientes.'));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Tarjetas de Preguntas (20 Preguntas)'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    preguntas.forEach((p: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Pregunta N° ${idx + 1}:`, true, '0891b2'));
      studentParagraphs.push(bodyPara(p));
      studentParagraphs.push(bodyPara('Respuesta del Alumno: __________________________________________________'));
      studentParagraphs.push(gap());
    });

  } else if (motorId === 'ludo') {
    studentParagraphs.push(bodyPara('Clásico juego de ludo donde caer en casillas especiales requiere responder preguntas de dificultad variable para avanzar o no retroceder.'));
    studentParagraphs.push(gap());
    studentParagraphs.push(h2('Preguntas Fáciles (Verde)'));
    const faciles = Array.isArray(juego.preguntas_faciles) ? juego.preguntas_faciles : [];
    faciles.forEach((p: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Pregunta Fácil N° ${idx + 1}:`, true, '16a34a'));
      studentParagraphs.push(bodyPara(p));
      studentParagraphs.push(gap());
    });
    studentParagraphs.push(h2('Preguntas Medias (Amarillo)'));
    const medias = Array.isArray(juego.preguntas_medias) ? juego.preguntas_medias : [];
    medias.forEach((p: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Pregunta Media N° ${idx + 1}:`, true, 'eab308'));
      studentParagraphs.push(bodyPara(p));
      studentParagraphs.push(gap());
    });
    studentParagraphs.push(h2('Preguntas Difíciles (Rojo)'));
    const dificiles = Array.isArray(juego.preguntas_dificiles) ? juego.preguntas_dificiles : [];
    dificiles.forEach((p: any, idx: number) => {
      studentParagraphs.push(bodyPara(`Pregunta Difícil N° ${idx + 1}:`, true, 'dc2626'));
      studentParagraphs.push(bodyPara(p));
      studentParagraphs.push(gap());
    });
  }

  // ── SECCIÓN DEL DOCENTE (GUÍA DOCENTE) ──
  teacherParagraphs.push(h1('GUÍA DOCENTE · USO EXCLUSIVO', 'DC2626'));
  teacherParagraphs.push(bodyPara(`Establecimiento: ${establecimiento}${nivel ? ` | Nivel: ${nivel}` : ''}`));
  teacherParagraphs.push(bodyPara(`Docente Responsable: ${docenteNombre}`));
  teacherParagraphs.push(gap());

  if (motorId === 'detective') {
    const solW = juego.solucion || {};
    const oaListDetDoc = Array.isArray(juego.objetivos_aprendizaje) ? juego.objetivos_aprendizaje : [];

    if (oaListDetDoc.length > 0) {
      teacherParagraphs.push(h2('Objetivos de Aprendizaje Vinculados (Descripciones Completas)'));
      oaListDetDoc.forEach((oa: any) => {
        const origenLblDoc = oa.origen === 'sugerido_ia' ? ' [OA sugerido — verificar]' : oa.origen === 'planificacion' ? ' [de planificación]' : ' [seleccionado]';
        teacherParagraphs.push(bodyPara(`${oa.codigo}${origenLblDoc}:`, true, 'DC2626'));
        teacherParagraphs.push(bodyPara(oa.descripcion || ''));
        teacherParagraphs.push(gap());
      });
    }

    teacherParagraphs.push(h2('Respuestas Esperadas por Estación'));
    const respEstW = Array.isArray(solW.respuestas_estaciones) ? solW.respuestas_estaciones : [];
    respEstW.forEach((re: any) => {
      teacherParagraphs.push(bodyPara(`Estación ${re.estacion} — Código: [ ${re.codigo_letra || '_'} ]`, true, '1E3A5F'));
      teacherParagraphs.push(bodyPara(`Respuesta esperada: ${re.respuesta_esperada || ''}`));
      teacherParagraphs.push(bodyPara(`Criterio de aceptación: ${re.criterio_aceptacion || ''}`, false, '64748b'));
      teacherParagraphs.push(gap());
    });

    if (solW.codigo_final_verificado) {
      teacherParagraphs.push(bodyPara(`CÓDIGO FINAL VERIFICADO: ${solW.codigo_final_verificado}`, true, 'DC2626'));
      teacherParagraphs.push(gap());
    }

    teacherParagraphs.push(h2('Hipótesis Central (Referencia)'));
    teacherParagraphs.push(bodyPara(solW.hipotesis_central || ''));
    teacherParagraphs.push(gap());

    teacherParagraphs.push(h2('Hipótesis Alternativas Válidas'));
    teacherParagraphs.push(bodyPara(solW.hipotesis_alternativas || ''));
    teacherParagraphs.push(gap());

    teacherParagraphs.push(h2('Explicación Pedagógica (según OA seleccionados)'));
    teacherParagraphs.push(bodyPara(solW.explicacion_pedagogica || ''));
    teacherParagraphs.push(gap());

    if (solW.nota_responsabilidad) {
      teacherParagraphs.push(bodyPara('Nota sobre responsabilidad:', true, 'DC2626'));
      teacherParagraphs.push(bodyPara(solW.nota_responsabilidad));
      teacherParagraphs.push(gap());
    }

    teacherParagraphs.push(h2('Rúbrica de Evaluación del Expediente Final'));
    if (solW.rubrica) {
      teacherParagraphs.push(bodyPara('NIVEL 3 — Logrado:', true, '166534'));
      teacherParagraphs.push(bodyPara(solW.rubrica.nivel3 || ''));
      teacherParagraphs.push(bodyPara('NIVEL 2 — En proceso:', true, '92400e'));
      teacherParagraphs.push(bodyPara(solW.rubrica.nivel2 || ''));
      teacherParagraphs.push(bodyPara('NIVEL 1 — Inicial:', true, 'DC2626'));
      teacherParagraphs.push(bodyPara(solW.rubrica.nivel1 || ''));
    }

  } else if (motorId === 'escape_room') {
    teacherParagraphs.push(h2('Respuestas del Escape Room'));
    teacherParagraphs.push(bodyPara(`Clave Prueba 1: ${juego.clave1 || 'A'}`, true));
    teacherParagraphs.push(bodyPara(`Clave Prueba 2: ${juego.clave2 || 'B'}`, true));
    teacherParagraphs.push(bodyPara(`Clave Prueba 3 (FINAL): ${juego.clave_final || 'C'}`, true));
    teacherParagraphs.push(gap());
    teacherParagraphs.push(bodyPara('Solución Detallada:', true));
    teacherParagraphs.push(bodyPara(juego.solucion || ''));

  } else if (motorId === 'bingo') {
    teacherParagraphs.push(h2('Tarjetas de Llamada del Docente (Bingo)'));
    const defs = Array.isArray(juego.definiciones) ? juego.definiciones : [];
    defs.forEach((def: any, idx: number) => {
      const cLabel = typeof def === 'object' ? (def.concepto || `Concepto ${idx+1}`) : `Definición ${idx+1}`;
      const dText = typeof def === 'object' ? (def.definicion || '') : def;
      teacherParagraphs.push(bodyPara(`Definición N° ${idx + 1}: ${dText}`));
      teacherParagraphs.push(bodyPara(`[ Concepto clave: ${cLabel} ]`, true, '166534'));
      teacherParagraphs.push(gap());
    });

  } else if (motorId === 'trivia') {
    teacherParagraphs.push(h2('Clave de Respuestas de Trivia'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const respuestas = Array.isArray(juego.respuestas) ? juego.respuestas : [];
    preguntas.forEach((p: any, idx: number) => {
      teacherParagraphs.push(bodyPara(`Pregunta ${idx + 1}: ${p}`, true));
      teacherParagraphs.push(bodyPara(`Respuesta Correcta: ${respuestas[idx] || 'Sin definir.'}`, true, '16A34A'));
      teacherParagraphs.push(gap());
    });

  } else if (motorId === 'cartas') {
    teacherParagraphs.push(h2('Sugerencia de Dinámicas y Respuestas de Cartas'));
    teacherParagraphs.push(bodyPara('Utilice el mazo de cartas para combates o debates literarios, asignando a los personajes para defender sus posturas según sus atributos y citas.'));

  } else if (motorId === 'memoria') {
    teacherParagraphs.push(h2('Pauta de Emparejamientos Correctos'));
    const pares = Array.isArray(juego.pares) ? juego.pares : [];
    pares.forEach((p: any, idx: number) => {
      teacherParagraphs.push(bodyPara(`Par ${idx + 1}: [ Concepto: ${p.concepto} ] <--> [ Definición: ${p.definicion} ]`, true));
      teacherParagraphs.push(gap());
    });

  } else if (motorId === 'clue') {
    const oaListDoc = Array.isArray(juego.objetivos_aprendizaje) ? juego.objetivos_aprendizaje : [];
    if (oaListDoc.length > 0) {
      teacherParagraphs.push(h2('Objetivos de Aprendizaje Vinculados (Descripciones Completas)'));
      oaListDoc.forEach((oa: any) => {
        const origenLabel = oa.origen === 'sugerido_ia' ? ' [OA sugerido — verificar]'
          : oa.origen === 'planificacion' ? ' [de planificación]'
          : oa.origen === 'seleccion_docente' ? ' [seleccionado]' : '';
        teacherParagraphs.push(bodyPara(`${oa.codigo}${origenLabel}:`, true, 'DC2626'));
        teacherParagraphs.push(bodyPara(oa.descripcion || ''));
        teacherParagraphs.push(gap());
      });
    }
    teacherParagraphs.push(h2('Sobre de Solución (CONFIDENCIAL)'));
    const sol = juego.solucion || {};
    teacherParagraphs.push(bodyPara(`Hipótesis pedagógica central: ${sol.hipotesis_central || sol.culpable || 'Sin definir'}`, true, 'DC2626'));
    teacherParagraphs.push(bodyPara(`Habitación: ${sol.habitacion || 'Sin definir'}`, true));
    teacherParagraphs.push(bodyPara(`Evidencia: ${sol.evidencia || 'Sin definir'}`, true));
    teacherParagraphs.push(gap());
    teacherParagraphs.push(bodyPara('Justificación de la hipótesis central:', true, '14532d'));
    teacherParagraphs.push(bodyPara(sol.justificacion_hipotesis || sol.rol_del_personaje || ''));
    teacherParagraphs.push(gap());
    teacherParagraphs.push(bodyPara('Hipótesis alternativas válidas:', true, '14532d'));
    teacherParagraphs.push(bodyPara(sol.hipotesis_alternativas || ''));
    teacherParagraphs.push(gap());
    teacherParagraphs.push(bodyPara('Explicación pedagógica (según OA seleccionados):', true, '14532d'));
    teacherParagraphs.push(bodyPara(sol.explicacion_docente || ''));
    teacherParagraphs.push(gap());
    if (sol.rubrica) {
      teacherParagraphs.push(h2('Rúbrica de Evaluación'));
      teacherParagraphs.push(bodyPara('NIVEL 3 — Logrado:', true, '166534'));
      teacherParagraphs.push(bodyPara(sol.rubrica.nivel3 || ''));
      teacherParagraphs.push(bodyPara('NIVEL 2 — En proceso:', true, '92400e'));
      teacherParagraphs.push(bodyPara(sol.rubrica.nivel2 || ''));
      teacherParagraphs.push(bodyPara('NIVEL 1 — Inicial:', true, 'DC2626'));
      teacherParagraphs.push(bodyPara(sol.rubrica.nivel1 || ''));
    }

  } else if (motorId === 'serpiente_escaleras') {
    teacherParagraphs.push(h2('Clave de Respuestas (Serpientes y Escaleras)'));
    const preguntas = Array.isArray(juego.preguntas) ? juego.preguntas : [];
    const respuestas = Array.isArray(juego.respuestas) ? juego.respuestas : [];
    preguntas.forEach((p: any, idx: number) => {
      teacherParagraphs.push(bodyPara(`Pregunta ${idx + 1}: ${p}`, true));
      teacherParagraphs.push(bodyPara(`Respuesta Correcta: ${respuestas[idx] || ''}`, true, '16A34A'));
      teacherParagraphs.push(gap());
    });

  } else if (motorId === 'ludo') {
    teacherParagraphs.push(h2('Clave de Respuestas (Ludo)'));
    const faciles = Array.isArray(juego.preguntas_faciles) ? juego.preguntas_faciles : [];
    const medias = Array.isArray(juego.preguntas_medias) ? juego.preguntas_medias : [];
    const dificiles = Array.isArray(juego.preguntas_dificiles) ? juego.preguntas_dificiles : [];
    const respuestas = juego.respuestas || {};

    teacherParagraphs.push(h2('Respuestas Fáciles'));
    faciles.forEach((p: any, idx: number) => {
      teacherParagraphs.push(bodyPara(`P: ${p}`));
      teacherParagraphs.push(bodyPara(`R: ${(respuestas.faciles && respuestas.faciles[idx]) || ''}`, true, '16A34A'));
    });
    teacherParagraphs.push(gap());

    teacherParagraphs.push(h2('Respuestas Medias'));
    medias.forEach((p: any, idx: number) => {
      teacherParagraphs.push(bodyPara(`P: ${p}`));
      teacherParagraphs.push(bodyPara(`R: ${(respuestas.medias && respuestas.medias[idx]) || ''}`, true, '16A34A'));
    });
    teacherParagraphs.push(gap());

    teacherParagraphs.push(h2('Respuestas Difíciles'));
    dificiles.forEach((p: any, idx: number) => {
      teacherParagraphs.push(bodyPara(`P: ${p}`));
      teacherParagraphs.push(bodyPara(`R: ${(respuestas.dificiles && respuestas.dificiles[idx]) || ''}`, true, '16A34A'));
    });
  }

  // Return the multi-section Word Document
  return new Document({
    sections: [
      {
        properties: {},
        children: studentParagraphs
      },
      {
        properties: {},
        children: teacherParagraphs
      }
    ]
  });
}
