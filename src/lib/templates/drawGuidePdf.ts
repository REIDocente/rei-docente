import { jsPDF } from 'jspdf';
import { GUIA_ICONS } from '../guiaIcons';

export function drawGuidePdf(
  doc: jsPDF,
  cj: any,
  mode: 'color' | 'ahorro',
  guia: any,
  docenteNombre: string = 'Docente'
) {
  const ink = mode === 'ahorro';
  const margin = 15;
  const width = doc.internal.pageSize.getWidth() - 2 * margin; // ~180mm
  let y = 15;

  const checkPage = (needed = 10) => {
    if (y > 275 - needed) {
      doc.addPage();
      y = 15;
    }
  };

  const addText = (text: string, size: number, style = "normal", colorHex = "#1e293b") => {
    if (!text) return;
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);
    doc.setTextColor(r, g, b);

    const lines = doc.splitTextToSize(text, width);
    lines.forEach((line: string) => {
      checkPage(size * 0.4 + 4);
      doc.text(line, margin, y);
      y += size * 0.4 + 4;
    });
  };

  const drawDottedLines = (count = 3) => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    for (let i = 0; i < count; i++) {
      checkPage(8);
      y += 6;
      doc.line(margin, y, margin + width, y);
    }
    y += 4;
  };

  // 1. Calculate Dynamic Ideal Score
  let totalPoints = 0;
  if (cj.desafios && Array.isArray(cj.desafios)) {
    cj.desafios.forEach((d: any) => {
      if (d.tipo === 'palabra_intrusa') totalPoints += (d.items?.length || 3) * 1;
      else if (d.tipo === 'unir_parejas') totalPoints += (d.pares?.length || 4) * 1;
      else if (d.tipo === 'completar_oraciones') totalPoints += (d.oraciones?.length || 4) * 2;
      else if (d.tipo === 'ordenar_parrafos') totalPoints += 3;
      else if (d.tipo === 'verdadero_falso') totalPoints += (d.items?.length || 4) * 1;
      else if (d.tipo === 'pupiletras') totalPoints += 5;
      else if (d.tipo === 'anagramas') totalPoints += (d.items?.length || 4) * 2;
      else if (d.tipo === 'mensajes_cifrados') totalPoints += 4;
      else if (d.tipo === 'clasificacion') totalPoints += (d.items?.length || 6) * 1;
      else if (d.tipo === 'camino_pistas') totalPoints += (d.pistas?.length || 5) * 1;
      else if (d.tipo === 'preguntas_inferenciales') totalPoints += (d.preguntas?.length || 3) * 2;
      else totalPoints += 5;
    });
  }
  if (totalPoints === 0) totalPoints = 20;

  const accentUni = ink ? "#334155" : "#059669";
  const accentDua = ink ? "#475569" : "#7c3aed";
  const accentPau = ink ? "#0f172a" : "#e11d48";

  // ─── INSTITUTIONAL HEADER ──────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(margin, y, width, 12);
  doc.line(45, y, 45, y + 12);
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("LOGO", margin + 10, y + 7.5);
  
  doc.setFontSize(9);
  doc.text("C.E.P. Rigoberto Fontt Izquierdo / Unidad Técnica Pedagógica", 49, y + 7.5);
  y += 12;

  // Box 2: Metadata
  doc.rect(margin, y, width, 12);
  doc.line(65, y, 65, y + 12);
  doc.line(115, y, 115, y + 12);
  doc.line(155, y, 155, y + 12);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Instrumento: Guía de Trabajo", 17, y + 4.5);
  doc.text("Docente: " + docenteNombre, 17, y + 9);
  doc.text("Asignatura: Lenguaje y Lit.", 67, y + 4.5);
  doc.text(`Curso: ${guia.nivel || '2° Medio'} / Letra: A`, 67, y + 9);
  
  doc.text(`Pje. Ideal: ${totalPoints} pts`, 117, y + 4.5);
  doc.text(`Pje. Corte: ${Math.round(totalPoints * 0.6)} pts`, 117, y + 9);
  
  doc.text("Exigencia: 60% | Coef: 1", 157, y + 4.5);
  doc.text("Tiempo: 90 min", 157, y + 9);
  y += 12;

  // Box 3: Student box
  doc.rect(margin, y, width, 8);
  doc.setFontSize(7.5);
  doc.text("Nombre del Estudiante: ___________________________  Fecha: _________  Puntos: ____  Calificación: ____", 17, y + 5);
  y += 8;

  y += 6;
  // Centered Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);  // tamaño reducido ANTES de splitTextToSize
  doc.setTextColor(30, 41, 59);

  const titleText = (cj.titulo || 'GUÍA DE APRENDIZAJE').toUpperCase();
  const titleLines = doc.splitTextToSize(titleText, 150);  // 150mm, no 165

  const titleY = y;
  checkPage(titleLines.length * 5.5 + 4);

  titleLines.forEach((line: string, i: number) => {
    doc.text(line.trim(), 105, titleY + (i * 5.5), { align: 'center' });
  });

  const lastLineText = titleLines[titleLines.length - 1] || "";
  const textWidth = doc.getTextWidth(lastLineText.trim());
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(105 - textWidth / 2, titleY + (titleLines.length - 1) * 5.5 + 1.2, 105 + textWidth / 2, titleY + (titleLines.length - 1) * 5.5 + 1.2);

  y = titleY + (titleLines.length * 5.5) + 4;

  // Instructions & Objectives Table (2 columns)
  const instText = "Lea atentamente los textos y complete cada uno de los desafíos de manera ordenada y limpia. Use lápiz grafito.";
  const oas = Array.isArray(guia.oa_codes) ? guia.oa_codes.join(', ') : (guia.oa_code || 'OA 2');
  const objText = `${oas}: ${cj.objetivo_clase || 'Comprensión lectora y vocabulario en contexto.'}`;
  
  const instLines = doc.splitTextToSize(instText, 84);
  const objLines = doc.splitTextToSize(objText, 84);
  const tableHeight = Math.max(instLines.length, objLines.length) * 4 + 8;

  checkPage(tableHeight + 8);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  
  // Table Header
  doc.rect(margin, y, width, 5);
  doc.line(105, y, 105, y + 5);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Instrucciones", 17, y + 3.5);
  doc.text("Objetivos", 107, y + 3.5);
  y += 5;

  // Table Content
  doc.rect(margin, y, width, tableHeight);
  doc.line(105, y, 105, y + tableHeight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  
  instLines.forEach((l: string, idx: number) => {
    doc.text(l, 17, y + 4 + idx * 4);
  });
  objLines.forEach((l: string, idx: number) => {
    doc.text(l, 107, y + 4 + idx * 4);
  });
  y += tableHeight + 8;

  // ─── ACTIVACIÓN ────────────────────────────────────────────────────────────
  if (cj.activacion) {
    checkPage(20);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(parseInt(accentUni.slice(1, 3), 16), parseInt(accentUni.slice(3, 5), 16), parseInt(accentUni.slice(5, 7), 16));
    doc.text("I. ACTIVACIÓN DE APRENDIZAJES PREVIOS", margin, y);
    y += 5;
    
    addText(cj.activacion, 9.5, "normal", "#334155");
    drawDottedLines(3);
  }

  // ─── LECTURA ───────────────────────────────────────────────────────────────
  if (cj.texto_lectura) {
    checkPage(30);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(parseInt(accentUni.slice(1, 3), 16), parseInt(accentUni.slice(3, 5), 16), parseInt(accentUni.slice(5, 7), 16));
    doc.text(`II. LECTURA COMPRENSIVA: ${cj.texto_lectura.titulo || 'Texto'}`, margin, y);
    y += 4;
    
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text(`Autor: ${cj.texto_lectura.autor || 'Anónimo'}  |  Tipo: ${cj.texto_lectura.tipo || 'Columna de opinión'}`, margin, y);
    y += 5;

    // Draw reading text body inside a border box
    const readLines = doc.splitTextToSize(cj.texto_lectura.contenido || '', width - 6);
    const boxHeight = readLines.length * 4.2 + 8;
    checkPage(boxHeight + 6);
    
    doc.setDrawColor(220, 225, 230);
    doc.setFillColor(250, 252, 254);
    doc.rect(margin, y, width, boxHeight, "FD");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    
    readLines.forEach((line: string, idx: number) => {
      doc.text(line, margin + 3, y + 5.5 + idx * 4.2);
    });
    y += boxHeight + 8;
  }

  // ─── BANCO DE PALABRAS ─────────────────────────────────────────────────────
  if (cj.banco_palabras && Array.isArray(cj.banco_palabras) && cj.banco_palabras.length > 0) {
    checkPage(18);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Vocabulario Clave del Texto:", margin, y);
    y += 4;
    
    const wordList = cj.banco_palabras.join("  ·  ");
    const wordListLines = doc.splitTextToSize(wordList, width - 8);
    const vocabBoxHeight = wordListLines.length * 4.2 + 3;
    checkPage(vocabBoxHeight + 4);
    
    doc.setDrawColor(210, 215, 220);
    doc.setFillColor(245, 247, 249);
    doc.rect(margin, y, width, vocabBoxHeight, "FD");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    wordListLines.forEach((line: string, lineIdx: number) => {
      doc.text(line, margin + 4, y + 4 + lineIdx * 4.2);
    });
    y += vocabBoxHeight + 5;
  }

  // ─── DESAFÍOS LÚDICOS ──────────────────────────────────────────────────────
  if (cj.desafios && Array.isArray(cj.desafios)) {
    checkPage(15);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(parseInt(accentUni.slice(1, 3), 16), parseInt(accentUni.slice(3, 5), 16), parseInt(accentUni.slice(5, 7), 16));
    doc.text("III. DESAFÍOS DIDÁCTICOS Y DE APLICACIÓN", margin, y);
    y += 6;

    let renderIdx = 1;
    cj.desafios.forEach((d: any) => {
      if (!d || !d.tipo || d.tipo === '') return;
      checkPage(20);
      const name = d.tipo.replace(/_/g, ' ').toUpperCase();
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`${renderIdx}. DESAFÍO: ${name}`, margin, y);
      renderIdx++;

      const icon = GUIA_ICONS[d.tipo];
      if (icon) {
        doc.addImage(icon, 'PNG', 175, y - 4, 18, 18);
      }

      y += 4;

      if (d.instruccion) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        const instLines = doc.splitTextToSize(d.instruccion, 170);
        checkPage(instLines.length * 4.2 + 2);
        instLines.forEach((line: string) => {
          doc.text(line, margin, y);
          y += 4.2;
        });
        y += 1.5;
      }

      // Render challenge visual layout
      if (d.tipo === 'palabra_intrusa') {
        const items = d.items || [];
        items.forEach((item: any, iIdx: number) => {
          checkPage(10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`${iIdx + 1}.`, margin + 2, y + 4);
          
          let xOffset = margin + 10;
          const grp = item.grupo || [];
          grp.forEach((word: string) => {
            doc.setDrawColor(200, 200, 200);
            doc.rect(xOffset, y, 28, 6);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(word, xOffset + 14, y + 4.2, { align: "center" });
            xOffset += 32;
          });
          y += 8;
        });
        y += 4;
      }
      else if (d.tipo === 'unir_parejas') {
        const pairs = d.pares || [];
        const hasLongText = pairs.some((p: any) => (p.derecha || '').length > 60);
        const fontSize = hasLongText ? 8 : 8.5;
        
        pairs.forEach((pair: any, pIdx: number) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(30, 41, 59);
          
          const termText = `${pIdx + 1}. ${pair.izquierda || ''}`;
          const termLines = doc.splitTextToSize(termText, 75);
          
          doc.setFont("helvetica", "normal");
          const defText = pair.derecha || '';
          const defLines = doc.splitTextToSize(defText, 80);
          
          const lineHeight = fontSize * 0.4 + 1.2;
          const rowHeight = Math.max(termLines.length, defLines.length) * lineHeight + 2;
          
          checkPage(rowHeight + 2);
          
          // Print Term
          doc.setFont("helvetica", "bold");
          termLines.forEach((line: string, lineIdx: number) => {
            doc.text(line, margin + 2, y + 4 + lineIdx * lineHeight);
          });
          
          // Print parentheses
          doc.setFont("helvetica", "normal");
          doc.text("(      )", margin + 80, y + 4);
          
          // Print Definition
          defLines.forEach((line: string, lineIdx: number) => {
            doc.text(line, margin + 98, y + 4 + lineIdx * lineHeight);
          });
          
          y += rowHeight;
        });
        y += 4;
      }
      else if (d.tipo === 'completar_oraciones') {
        const oraciones = d.oraciones || [];
        oraciones.forEach((o: any, oIdx: number) => {
          checkPage(12);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          
          const textToShow = `${oIdx + 1}. ${o.texto.replace(/___/g, "________________")}`;
          const lines = doc.splitTextToSize(textToShow, width - 4);
          lines.forEach((line: string) => {
            doc.text(line, margin + 2, y);
            y += 5;
          });
          y += 2;
        });
        y += 4;
      }
      else if (d.tipo === 'ordenar_parrafos') {
        const fragmentos = d.fragmentos || [];
        fragmentos.forEach((f: string, fIdx: number) => {
          const lines = doc.splitTextToSize(f, width - 20);
          const boxHeight = lines.length * 4 + 6;
          checkPage(boxHeight + 4);
          
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, y, width, boxHeight);
          
          // Numbering checkbox
          doc.rect(margin + 3, y + 3, 8, 8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          
          lines.forEach((line: string, lIdx: number) => {
            doc.text(line, margin + 15, y + 5 + (lIdx * 4));
          });
          y += boxHeight + 4;
        });
        y += 4;
      }
      else if (d.tipo === 'verdadero_falso') {
        const items = d.items || [];
        items.forEach((item: any, iIdx: number) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          
          const textToShow = `${iIdx + 1}. ${item.afirmacion || ''}`;
          const afLines = doc.splitTextToSize(textToShow, 150);
          const rowHeight = afLines.length * 4.2 + 2;
          
          checkPage(rowHeight + 2);
          
          doc.setFont("helvetica", "bold");
          doc.text("[ V ]  [ F ]", margin + 2, y + 4);
          
          doc.setFont("helvetica", "normal");
          afLines.forEach((line: string, lineIdx: number) => {
            doc.text(line, margin + 24, y + 4 + lineIdx * 4.2);
          });
          y += rowHeight;
        });
        y += 4;
      }
      else if (d.tipo === 'pupiletras') {
        checkPage(72);
        let gridRaw = d.grid || d.sopa_de_letras || d.sopa || [];
        let grid: string[][] = [];
        if (typeof gridRaw === 'string') {
          const COLUMNAS = 15;
          const letras = gridRaw.replace(/\s/g, '').toUpperCase().split('');
          const filas: string[][] = [];
          for (let i = 0; i < letras.length; i += COLUMNAS) {
            filas.push(letras.slice(i, i + COLUMNAS));
          }
          grid = filas;
        } else if (Array.isArray(gridRaw) && gridRaw.length > 0) {
          if (typeof gridRaw[0] === 'string') {
            grid = gridRaw.map((row: string) => row.toUpperCase().split(''));
          } else {
            grid = gridRaw;
          }
        }

        const startX = margin + 10;
        let currentY = y;
        
        grid.forEach((row: string[], rIdx: number) => {
          row.forEach((letter: string, cIdx: number) => {
            doc.setDrawColor(200, 200, 200);
            doc.rect(startX + (cIdx * 6), currentY + (rIdx * 6), 6, 6);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59);
            doc.text(letter.toUpperCase(), startX + (cIdx * 6) + 3, currentY + (rIdx * 6) + 4.2, { align: "center" });
          });
        });
        
        const columnsCount = grid.length > 0 ? grid[0].length : 10;
        const gridWidth = columnsCount * 6;
        const wordsX = startX + gridWidth + 8;

        const words = d.palabras || [];
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Buscar estas palabras:", wordsX, y + 4);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        words.forEach((word: string, wIdx: number) => {
          doc.text(`• ${word}`, wordsX, y + 10 + (wIdx * 5));
        });
        
        y += 65;
      }
      else if (d.tipo === 'anagramas') {
        const items = d.items || [];
        items.forEach((item: any, iIdx: number) => {
          checkPage(10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`${iIdx + 1}.  ${item.desordenada.toUpperCase()}`, margin + 2, y + 4);
          
          doc.setFont("helvetica", "normal");
          doc.text("--------------------->   ___________________________", margin + 45, y + 4);
          y += 8;
        });
        y += 4;
      }
      else if (d.tipo === 'mensajes_cifrados') {
        checkPage(35);
        const key = d.clave || {};
        const keyEntries = Object.entries(key);
        const chunkSize = 13;
        const rows: [string, any][][] = [];
        for (let i = 0; i < keyEntries.length; i += chunkSize) {
          rows.push(keyEntries.slice(i, i + chunkSize));
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        
        rows.forEach((rowEntries) => {
          checkPage(10);
          let keyOffset = margin + 2;
          rowEntries.forEach(([num, letter]) => {
            doc.rect(keyOffset, y, 11.5, 5.5);
            doc.text(`${num}:${letter}`, keyOffset + 5.75, y + 3.8, { align: "center" });
            keyOffset += 13.5;
          });
          y += 7.5;
        });
        y += 2;
        
        const messages = d.mensajes || [
          { codificado: d.mensaje_cifrado || "", descifrado: d.mensaje_claro || "" }
        ];
        
        messages.forEach((m: any, msgIdx: number) => {
          checkPage(25);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`Mensaje ${msgIdx + 1}:`, margin + 2, y + 4);
          y += 6;
          
          const words = (m.codificado || "").split(/\s*\/\s*/);
          let startX = margin + 4;
          const boxSize = 7.5;
          const boxGap = 9.5;
          
          words.forEach((w: string, wIdx: number) => {
            const numChars = w.split("-");
            
            // Check if word fits on current line, otherwise wrap to next line
            const wordWidth = numChars.length * boxGap;
            if (startX + wordWidth > margin + width - 4) {
              y += 18;
              checkPage(18);
              startX = margin + 4;
            }
            
            numChars.forEach((numChar: string) => {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8);
              doc.text(numChar, startX + boxSize/2, y + 4, { align: "center" });
              doc.rect(startX, y + 6, boxSize, boxSize);
              startX += boxGap;
            });
            
            // Draw a wider gap or a slash for space between words
            if (wIdx < words.length - 1) {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.text("/", startX + 2, y + 10, { align: "center" });
              startX += 6;
            }
          });
          y += 18;
        });
      }
      else if (d.tipo === 'clasificacion') {
        const cats = d.categorias || ["Categoría A", "Categoría B"];
        const items = d.items || [];
        
        checkPage(45);
        doc.setDrawColor(180, 180, 180);
        doc.rect(margin, y, 85, 7);
        doc.rect(margin + 95, y, 85, 7);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(cats[0], margin + 42.5, y + 5, { align: "center" });
        doc.text(cats[1], margin + 137.5, y + 5, { align: "center" });
        y += 7;
        
        for (let i = 0; i < 4; i++) {
          doc.rect(margin, y, 85, 6);
          doc.rect(margin + 95, y, 85, 6);
          y += 6;
        }
        y += 4;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Palabras a clasificar:", margin + 2, y + 4);
        
        doc.setFont("helvetica", "normal");
        const listText = items.map((it: any) => it.texto).join(", ");
        const lines = doc.splitTextToSize(listText, width - 4);
        lines.forEach((line: string) => {
          doc.text(line, margin + 2, y + 9);
          y += 5;
        });
        y += 8;
      }
      else if (d.tipo === 'camino_pistas') {
        const pistas = d.pistas || d.preguntas || d.estaciones || [];
        pistas.forEach((p: any, pIdx: number) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          
          const pText = typeof p === 'string' ? p : (p.pregunta || p.texto || p.estacion || '');
          const qText = `Estación ${pIdx + 1}: ${pText}`;
          const qLines = doc.splitTextToSize(qText, 165);
          
          const rowHeight = qLines.length * 4.5 + 10;
          checkPage(rowHeight + 2);
          
          let currentY = y + 4.5;
          qLines.forEach((line: string) => {
            doc.text(line, margin + 2, currentY);
            currentY += 4.5;
          });
          
          // Draw "Respuesta: ________________________________"
          doc.setFont("helvetica", "normal");
          doc.text("Respuesta: ", margin + 2, currentY + 2);
          
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.25);
          doc.line(margin + 20, currentY + 3, margin + 140, currentY + 3);
          
          // Draw "Letra: [  ]"
          doc.text("Letra: [   ]", margin + 148, currentY + 2);
          
          y = currentY + 7;
        });
        y += 2;
        
        checkPage(15);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text("PALABRA SECRETA:", margin + 2, y + 5);
        
        const slotsCount = pistas.length || 7;
        let slotX = margin + 45;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        for (let i = 0; i < slotsCount; i++) {
          doc.text("_", slotX, y + 4.5);
          slotX += 7;
        }
        y += 12;
      }
      else if (d.tipo === 'preguntas_inferenciales') {
        // Extracción ultra-defensiva
        const preguntas: any[] =
          (Array.isArray(d.preguntas) && d.preguntas.length > 0 ? d.preguntas : null) ??
          (Array.isArray(d.items) && d.items.length > 0 ? d.items : null) ??
          (Array.isArray(d.preguntas_inferenciales) && d.preguntas_inferenciales.length > 0 ? d.preguntas_inferenciales : null) ??
          (Array.isArray(d.lista) && d.lista.length > 0 ? d.lista : null) ??
          (Array.isArray(d.contenido) && d.contenido.length > 0 ? d.contenido : null) ??
          (Array.isArray(d.questions) && d.questions.length > 0 ? d.questions : null) ??
          (Array.isArray(d.ejercicios) && d.ejercicios.length > 0 ? d.ejercicios : null) ??
          (Object.values(d).find((v: any) => Array.isArray(v) && v.length > 0) as any[]) ??
          [];

        // LOG CLIENT-SIDE para diagnosticar (visible en consola del navegador)
        if (typeof window !== 'undefined') {
          console.log('[DEBUG preguntas_inferenciales] d keys:', Object.keys(d));
          console.log('[DEBUG preguntas_inferenciales] preguntas extraídas:', JSON.stringify(preguntas));
          if (preguntas.length > 0) {
            console.log('[DEBUG preguntas_inferenciales] primer item keys:', 
              typeof preguntas[0] === 'object' ? Object.keys(preguntas[0]) : typeof preguntas[0]);
          }
        }

        // Renderizar
        preguntas.forEach((item: any, idx: number) => {
          // Extracción defensiva del texto
          let textoPregunta: string =
            (typeof item === 'string' ? item : null) ??
            item?.pregunta ?? item?.texto ?? item?.enunciado ?? item?.question ??
            item?.descripcion ?? item?.contenido ?? item?.titulo ??
            // Fallback nuclear: si el item es objeto pero no tiene campo de texto conocido,
            // buscar el primer valor string del objeto
            (typeof item === 'object' ? 
              Object.values(item).find((v: any) => typeof v === 'string' && v.length > 10) as string : null) ??
            // Último recurso: JSON completo para poder identificar la estructura
            JSON.stringify(item);

          if (!textoPregunta || textoPregunta === '{}') return;

          // Salto de página si necesario
          if (y > 255) { doc.addPage(); y = 15; }

          // Número y texto de pregunta
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(`${idx + 1}.`, 15, y);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(textoPregunta, 165);
          doc.text(lines, 21, y);
          y += lines.length * 4.5 + 2;

          // 3 líneas de respuesta
          for (let l = 0; l < 3; l++) {
            doc.setDrawColor(180, 180, 180);
            doc.line(15, y, 195, y);
            y += 7;
          }
          y += 4;
        });
      }
      y += 4;
    });
  }

  let nextSectionNum = 4;

  // ─── ACTIVIDAD ADICIONAL ───────────────────────────────────────────────────
  if (cj.actividad_adicional) {
    const act = cj.actividad_adicional;
    
    // LOG para diagnosticar (visible en consola del navegador al descargar PDF)
    if (typeof window !== 'undefined') {
      console.log('[DEBUG actividad_adicional] objeto completo:', JSON.stringify(cj.actividad_adicional ?? null));
      console.log('[DEBUG actividad_adicional] tipo:', cj.actividad_adicional?.tipo);
    }

    const tipoAct = (act.tipo ?? '').toLowerCase().replace(/[_\s-]/g, '').replace('ó', 'o');

    if (act.tipo === 'preguntas_capciosas') {
      checkPage(30);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(parseInt(accentUni.slice(1, 3), 16), parseInt(accentUni.slice(3, 5), 16), parseInt(accentUni.slice(5, 7), 16));
      
      const secLabel = nextSectionNum === 4 ? "IV" : "V";
      doc.text(`${secLabel}. ACTIVIDAD ADICIONAL: PREGUNTAS CAPCIOSAS`, margin, y);
      y += 6;
      nextSectionNum++;

      const pregs = act.preguntas || [];
      pregs.forEach((q: any, qIdx: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);

        const qText = `${qIdx + 1}. ${q.pregunta || ''}`;
        const qLines = doc.splitTextToSize(qText, 165);

        const ops = q.opciones || [];
        const neededHeight = qLines.length * 4.5 + ops.length * 5 + 6;
        checkPage(neededHeight);

        qLines.forEach((line: string) => {
          doc.text(line, margin + 2, y);
          y += 4.5;
        });
        y += 1.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);

        ops.forEach((op: string) => {
          doc.rect(margin + 4, y - 3, 4, 4);
          doc.text(op, margin + 11, y);
          y += 5;
        });
        y += 3;
      });
      y += 4;
    } else if (tipoAct === 'codigosecreto' || tipoAct === 'secreto' || tipoAct === 'codigo') {
      checkPage(35);
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(5, 150, 105); // verde premium
      
      const secLabel = nextSectionNum === 4 ? "IV" : "V";
      doc.text(`${secLabel}. ACTIVIDAD ADICIONAL: CÓDIGO SECRETO`, margin, y);
      y += 5;
      nextSectionNum++;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Usa la clave para descifrar el mensaje oculto", margin, y);
      y += 6;

      const clave = act.clave || {};
      const entries = Object.entries(clave);
      const colWidth = 12;
      const startX = (210 - entries.length * colWidth) / 2;

      checkPage(20);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.25);

      // Fila 1: Letras
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      for (let i = 0; i < entries.length; i++) {
        const x = startX + i * colWidth;
        doc.rect(x, y, colWidth, 6);
        doc.text(String(entries[i][0]), x + colWidth/2, y + 4.2, { align: "center" });
      }
      y += 6;

      // Fila 2: Símbolos
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      for (let i = 0; i < entries.length; i++) {
        const x = startX + i * colWidth;
        doc.rect(x, y, colWidth, 6);
        doc.text(String(entries[i][1]), x + colWidth/2, y + 4.2, { align: "center" });
      }
      y += 12;

      // Mensaje codificado
      const msgCod = act.mensaje_codificado || '';
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      
      const codLines = doc.splitTextToSize(msgCod, 160);
      checkPage(codLines.length * 8 + 20);
      
      codLines.forEach((line: string) => {
        doc.text(line, 105, y, { align: "center" });
        y += 8;
      });
      
      y += 6;

      // Líneas para la respuesta
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      for (let l = 0; l < 2; l++) {
        doc.line(15, y, 195, y);
        y += 7;
      }
      y += 4;
      doc.setTextColor(30, 41, 59);
    }
  }

  // ─── TICKET DE SALIDA ──────────────────────────────────────────────────────
  if (cj.ticket_salida) {
    checkPage(30);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(parseInt(accentUni.slice(1, 3), 16), parseInt(accentUni.slice(3, 5), 16), parseInt(accentUni.slice(5, 7), 16));
    
    const ticketLabel = nextSectionNum === 4 ? "IV" : "V";
    doc.text(`${ticketLabel}. TICKET DE SALIDA (MÉTODO RICE)`, margin, y);
    y += 5;
    nextSectionNum++;

    addText(cj.ticket_salida, 9, "normal", "#1e293b");
    drawDottedLines(4);
  }

  // ─── AUTOEVALUACIÓN ────────────────────────────────────────────────────────
  if (cj.autoevaluacion && Array.isArray(cj.autoevaluacion) && cj.autoevaluacion.length > 0) {
    checkPage(25);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(parseInt(accentUni.slice(1, 3), 16), parseInt(accentUni.slice(3, 5), 16), parseInt(accentUni.slice(5, 7), 16));
    
    const autoLabel = nextSectionNum === 4 ? "IV" : nextSectionNum === 5 ? "V" : "VI";
    doc.text(`${autoLabel}. AUTOEVALUACIÓN Y METACOGNICIÓN`, margin, y);
    y += 5;

    cj.autoevaluacion.forEach((ae: string, aeIdx: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      const itemText = `${aeIdx + 1}. ${ae}`;
      const aeLines = doc.splitTextToSize(itemText, 110);
      const rowHeight = Math.max(1, aeLines.length) * 4.2 + 2;

      checkPage(rowHeight + 2);
      
      // Draw semaphore prefix
      doc.text(`[ Logrado ]  [ En Proceso ]  [ Por Lograr ]`, margin + 2, y + 4);

      // Draw wrapped criteria lines starting at X = margin + 67
      aeLines.forEach((line: string, lineIdx: number) => {
        doc.text(line, margin + 67, y + 4 + lineIdx * 4.2);
      });

      y += rowHeight;
    });
    y += 4;
  }

  // ─── PAUTA DOCENTE (NUEVA PÁGINA) ──────────────────────────────────────────
  if (cj.pauta_docente) {
    doc.addPage();
    y = 15;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(parseInt(accentPau.slice(1, 3), 16), parseInt(accentPau.slice(3, 5), 16), parseInt(accentPau.slice(5, 7), 16));
    doc.text("PAUTA DE CORRECCIÓN - EXCLUSIVO DOCENTE", margin, y);
    y += 4;

    doc.setDrawColor(parseInt(accentPau.slice(1, 3), 16), parseInt(accentPau.slice(3, 5), 16), parseInt(accentPau.slice(5, 7), 16));
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + width, y);
    y += 8;

    if (cj.activacion) {
      checkPage(15);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Respuestas: I. Activación de Aprendizajes Previos", margin, y);
      y += 4.5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("Respuesta abierta del estudiante referida a sus saberes del tema.", margin + 4, y);
      y += 8;
    }

    if (cj.pauta_docente.respuestas_desafios && Array.isArray(cj.pauta_docente.respuestas_desafios)) {
      checkPage(15);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Respuestas: III. Desafíos Didácticos", margin, y);
      y += 6;

      let pautaRenderIdx = 1;
      cj.pauta_docente.respuestas_desafios.forEach((ans: any, aIdx: number) => {
        const d = cj.desafios?.[aIdx];
        if (!d || !d.tipo || d.tipo === '') {
          return;
        }
        if (d.tipo === 'preguntas_capciosas' || d.tipo === 'actividad_adicional') {
          return;
        }

        checkPage(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(`Desafío ${pautaRenderIdx}:`, margin + 2, y);
        pautaRenderIdx++;
        
        if (d && d.tipo === 'unir_parejas') {
          doc.setFont("helvetica", "normal");
          const pairs = d.pares || [];
          pairs.forEach((p: any, idx: number) => {
            const pairText = `${idx + 1}. ${p.izquierda || ''} -> ${p.derecha || ''}`;
            const pLines = doc.splitTextToSize(pairText, 150);
            checkPage(pLines.length * 4.5 + 2);
            pLines.forEach((line: string) => {
              doc.text(line, margin + 28, y);
              y += 4.5;
            });
          });
          y += 3;
        } else if (d && d.tipo === 'preguntas_inferenciales') {
          const preguntas: any[] =
            (Array.isArray(d.preguntas) && d.preguntas.length > 0 ? d.preguntas : null) ??
            (Array.isArray(d.items) && d.items.length > 0 ? d.items : null) ??
            (Array.isArray(d.preguntas_inferenciales) && d.preguntas_inferenciales.length > 0 ? d.preguntas_inferenciales : null) ??
            (Array.isArray(d.lista) && d.lista.length > 0 ? d.lista : null) ??
            (Array.isArray(d.contenido) && d.contenido.length > 0 ? d.contenido : null) ??
            (Array.isArray(d.questions) && d.questions.length > 0 ? d.questions : null) ??
            (Array.isArray(d.ejercicios) && d.ejercicios.length > 0 ? d.ejercicios : null) ??
            (Object.values(d).find((v: any) => Array.isArray(v) && v.length > 0) as any[]) ??
            [];
            
          preguntas.forEach((item: any, idx: number) => {
            const qText = typeof item === 'object' ? (item.pregunta || '') : String(item);
            const crit = typeof item === 'object' ? (item.criterios_evaluacion || '') : '';
            
            // Dibujar pregunta
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            const qTextLine = `${idx + 1}. ${qText}`;
            const qLines = doc.splitTextToSize(qTextLine, width - 35);
            checkPage(qLines.length * 4.5 + 2);
            qLines.forEach((line: string) => {
              doc.text(line, margin + 28, y);
              y += 4.5;
            });

            // Dibujar criterios (texto más pequeño y cursiva)
            if (crit) {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(7.5);
              doc.setTextColor(71, 85, 105);
              const critText = `Criterios: ${crit}`;
              const critLines = doc.splitTextToSize(critText, width - 35);
              checkPage(critLines.length * 4 + 2);
              critLines.forEach((line: string) => {
                doc.text(line, margin + 32, y);
                y += 4;
              });
            }
            y += 2;
          });
          y += 2;
        } else {
          const formattedAns = formatChallengeAnswer(d, ans);
          doc.setFont("helvetica", "normal");
          const ansLines = doc.splitTextToSize(formattedAns, width - 35);
          ansLines.forEach((line: string) => {
            doc.text(line, margin + 28, y);
            y += 4.5;
          });
          y += 3;
        }
      });
      y += 4;
    }

    if (cj.actividad_adicional && cj.actividad_adicional.tipo === 'preguntas_capciosas') {
      checkPage(20);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Respuestas: Actividad Adicional (Preguntas Capciosas)", margin, y);
      y += 5;
      
      const pregs = cj.actividad_adicional.preguntas || [];
      pregs.forEach((q: any, qIdx: number) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const ansText = `${qIdx + 1}. Clave: ${q.respuesta_correcta || ''} - Explicación: ${q.trampa || ''}`;
        const qAnsLines = doc.splitTextToSize(ansText, width - 8);
        checkPage(qAnsLines.length * 4.5 + 2);
        qAnsLines.forEach((line: string) => {
          doc.text(line, margin + 4, y);
          y += 4.5;
        });
      });
      y += 4;
    }

    const actType = (cj.actividad_adicional?.tipo ?? '').toLowerCase().replace(/[_\s-]/g, '').replace('ó', 'o');
    if (cj.actividad_adicional && (actType === 'codigosecreto' || actType === 'secreto' || actType === 'codigo')) {
      checkPage(15);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Respuestas: Actividad Adicional (Código Secreto)", margin, y);
      y += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const ansText = `Código secreto: ${cj.actividad_adicional.mensaje || ''}`;
      const qAnsLines = doc.splitTextToSize(ansText, width - 8);
      checkPage(qAnsLines.length * 4.5 + 2);
      qAnsLines.forEach((line: string) => {
        doc.text(line, margin + 4, y);
        y += 4.5;
      });
      y += 4;
    }

    if (cj.ticket_salida) {
      checkPage(15);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Respuestas: IV. Ticket de Salida", margin, y);
      y += 4.5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const ticketAns = cj.pauta_docente.respuesta_ticket?.respuesta_correcta || cj.pauta_docente.respuesta_correcta || "El estudiante debe aplicar estructura RICE para justificar con una cita del texto.";
      const tLines = doc.splitTextToSize(ticketAns, width - 8);
      tLines.forEach((line: string) => {
        doc.text(line, margin + 4, y);
        y += 4.5;
      });
    }
  }
}

export function formatChallengeAnswer(d: any, ans: any): string {
  if (!d) {
    if (ans && typeof ans === 'object') {
      return ''; // No mostrar JSON crudo nunca
    }
    return String(ans || '');
  }

  // Normalizar schema alternativo
  const tipo = d.tipo || d.desafio || '';
  const respuestas = d.respuestas || d.answers || ans;
  ans = respuestas;

  // 1. unir_parejas
  if (tipo === 'unir_parejas') {
    if (d.pares && Array.isArray(d.pares)) {
      return d.pares
        .map((p: any, idx: number) => `${idx + 1}. ${p.izquierda || ''} -> ${p.derecha || ''}`)
        .join(' / ');
    }
  }

  // 2. completar_oraciones
  if (tipo === 'completar_oraciones') {
    if (d.oraciones && Array.isArray(d.oraciones)) {
      return d.oraciones
        .map((o: any, idx: number) => `${idx + 1}. ${o.respuesta || ''}`)
        .join(' / ');
    }
  }

  // 3. palabra_intrusa
  if (tipo === 'palabra_intrusa') {
    if (d.items && Array.isArray(d.items)) {
      return d.items
        .map((item: any, idx: number) => `Grupo ${idx + 1}: ${item.respuesta || item.intrusa || ''}`)
        .join(' / ');
    }
  }

  // 4. anagramas
  if (tipo === 'anagramas') {
    if (d.items && Array.isArray(d.items)) {
      return d.items
        .map((item: any) => `${(item.desordenada || '').toUpperCase()} -> ${item.correcta || ''}`)
        .join(' / ');
    }
  }

  // 5. verdadero_falso
  if (tipo === 'verdadero_falso') {
    if (d.items && Array.isArray(d.items)) {
      return d.items
        .map((it: any, idx: number) => {
          const val = it.respuesta;
          const label = (val === true || String(val).toLowerCase() === 'v' || String(val).toLowerCase() === 'verdadero') ? 'Verdadero' : 'Falso';
          return `${idx + 1}. ${label}`;
        })
        .join(' / ');
    }
  }

  // 6. ordenar_parrafos
  if (tipo === 'ordenar_parrafos') {
    const orden = d.orden_correcto || (ans && ans.orden_correcto) || (ans && Array.isArray(ans) ? ans : null);
    if (orden && Array.isArray(orden)) {
      return `Orden correcto: ${orden.join(' - ')}`;
    }
  }

  // 7. pupiletras
  if (tipo === 'pupiletras') {
    const words = d.palabras || [];
    let posStr = "";
    if (ans && typeof ans === 'object') {
      if (ans.posiciones && typeof ans.posiciones === 'object') {
        posStr = " - Posiciones: " + Object.entries(ans.posiciones)
          .map(([w, pos]) => `${w} (${pos})`)
          .join(', ');
      } else if (Array.isArray(ans)) {
        posStr = " - Posiciones: " + ans
          .map((item: any) => `${item.palabra || ''} (${item.posicion || ''})`)
          .join(', ');
      }
    }
    return `Palabras ocultas: ${words.join(', ')}${posStr}`;
  }

  // 8. mensajes_cifrados
  if (tipo === 'mensajes_cifrados') {
    const claveStr = d.clave ? Object.entries(d.clave).map(([k, v]) => `${k}=${v}`).join(', ') : '';
    if (d.mensajes && Array.isArray(d.mensajes)) {
      const msgList = d.mensajes.map((m: any, idx: number) => `Msg ${idx + 1}: ${m.descifrado || ''}`).join(' / ');
      return `Clave: ${claveStr} / ${msgList}`;
    }
    const descifrado = d.mensaje_claro || (ans && ans.mensaje_claro) || '';
    return `Clave: ${claveStr} / Mensaje descifrado: ${descifrado}`;
  }

  // 9. clasificacion
  if (tipo === 'clasificacion') {
    if (d.items && Array.isArray(d.items)) {
      const categories: Record<string, string[]> = {};
      d.items.forEach((it: any) => {
        const cat = it.categoria || 'Sin categoría';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(it.texto);
      });
      return Object.entries(categories)
        .map(([cat, items]) => `[${cat}]: ${items.join(', ')}`)
        .join(' / ');
    }
  }

  // 10. camino_pistas
  if (tipo === 'camino_pistas') {
    const pistas = d.pistas || d.preguntas || d.estaciones || [];
    if (pistas && Array.isArray(pistas) && pistas.length > 0) {
      const palabraSecreta = pistas.map((p: any) => p.letra || '').join('');
      const lines = pistas.map((p: any, idx: number) => {
        const resp = p.respuesta || p.correcta || '';
        return `Estación ${idx + 1}: ${resp}`;
      });
      lines.push(`Palabra secreta: ${palabraSecreta}`);
      return lines.join('\n');
    }
  }

  // 11. preguntas_inferenciales
  if (tipo === 'preguntas_inferenciales') {
    const preguntas: any[] =
      d.preguntas ??
      d.items ??
      d.preguntas_inferenciales ??
      d.lista ??
      d.contenido ??
      d.questions ??
      Object.values(d).find((v: any) => Array.isArray(v) && v.length > 0) ??
      [];

    if (preguntas.length > 0) {
      return preguntas
        .map((item: any, idx: number) => {
          const crit = typeof item === 'object'
            ? (item.criterios_evaluacion ?? item.criterio ?? item.respuesta ?? item.evaluacion ?? JSON.stringify(item))
            : String(item);
          return `Pregunta ${idx + 1}: ${crit}`;
        })
        .join('\n');
    }
    if (Array.isArray(ans)) {
      return ans
        .map((a: any, idx: number) => {
          const crit = typeof a === 'object' ? (a.criterios_evaluacion || a.criterio || a.respuesta || JSON.stringify(a)) : String(a);
          return `Pregunta ${idx + 1}: ${crit}`;
        })
        .join('\n');
    }
  }

  if (ans) {
    if (typeof ans === 'object') {
      return ''; // No mostrar JSON crudo nunca
    }
    return String(ans);
  }

  return '';
}
