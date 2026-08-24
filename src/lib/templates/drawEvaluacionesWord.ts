import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  Footer,
  PageNumber,
  PageBreak,
  BorderStyle
} from 'docx';

export interface EvaluacionData {
  titulo: string | null;
  nivel: string;
  eje: string | null;
  oa_codes: string[];
  tipos: string[];
  simce_ensayo: boolean;
  contenido_json: any;
}

export interface ExportOptions {
  establecimiento?: string;
  docente?: string;
  fecha?: string;
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function getPreguntasList(cj: any): any[] {
  if (!cj) return [];
  const fromPruebaSecciones = cj.prueba?.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromPruebaSecciones) && fromPruebaSecciones.length > 0) return fromPruebaSecciones;
  const fromSecciones = cj.secciones?.flatMap((s: any) => s.preguntas || []);
  if (Array.isArray(fromSecciones) && fromSecciones.length > 0) return fromSecciones;
  if (Array.isArray(cj.preguntas) && cj.preguntas.length > 0) return cj.preguntas;
  const alts = cj.preguntas_alternativas || [];
  const devs = cj.preguntas_desarrollo || [];
  if (alts.length > 0 || devs.length > 0) return [...alts, ...devs];
  return [];
}

function getCleanAlternatives(raw: any, qObj?: any): Array<{letra: string; texto: string; correcta?: boolean}> {
  if (!raw) return [];
  let strings: string[] = [];
  if (Array.isArray(raw)) {
    strings = raw.map((item: any) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null) {
        return String(item.texto || item.text || item.contenido || item.alternativa || item.value || '').trim();
      }
      return '';
    }).filter(s => s.length > 0);
  } else if (typeof raw === 'object' && raw !== null) {
    strings = Object.values(raw).map((v: any) => {
      if (typeof v === 'string') return v.trim();
      if (typeof v === 'object' && v !== null) return String(v.texto || v.text || '').trim();
      return '';
    }).filter(s => s.length > 0);
  }
  const letters = ['A', 'B', 'C', 'D'];
  const correctLetter = String(qObj?.clave || qObj?.respuesta_correcta || '').toUpperCase().trim();
  return strings.map((texto, i) => ({
    letra: letters[i] || '',
    texto,
    correcta: letters[i] === correctLetter,
  }));
}

function getTechniqueInstruction(tipoEvaluacion?: string): string {
  const isFormativaOrDiag = !tipoEvaluacion || 
    tipoEvaluacion.toLowerCase().includes('formativa') || 
    tipoEvaluacion.toLowerCase().includes('diagn');
  return isFormativaOrDiag
    ? "Responde usando la técnica OREO: escribe tu Opinión, una Razón que la justifique, un Ejemplo concreto y cierra reafirmando tu Opinión."
    : "Responde usando la técnica RICE: Repite la pregunta con tus palabras, Incluye tu postura, Cita una evidencia del texto y Explica cómo esa cita apoya tu argumento.";
}

function noBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
}

// ------------------------------------------------------------------
// Main Export Function
// ------------------------------------------------------------------

export async function drawEvaluacionesWord(ev: EvaluacionData, options?: ExportOptions): Promise<Blob> {
  const cj = ev.contenido_json || {};
  const docElements: any[] = [];
  
  // 1. Header Table
  const establecimiento = options?.establecimiento || cj.establecimiento || '___________________';
  const docente = options?.docente || cj.docente || '___________________';
  const fecha = options?.fecha || '___________________';
  const asignatura = ev.eje || '___________________';

  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders(),
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "REÍ Docente", bold: true, color: "673AB7", size: 32 })
                  ]
                })
              ]
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ text: `Establecimiento: ${establecimiento}`, alignment: AlignmentType.RIGHT }),
                new Paragraph({ text: `Docente: ${docente}`, alignment: AlignmentType.RIGHT }),
                new Paragraph({ text: `Asignatura: ${asignatura}`, alignment: AlignmentType.RIGHT }),
                new Paragraph({ text: `Fecha: ${fecha}`, alignment: AlignmentType.RIGHT }),
              ]
            })
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 200 } })
  );

  // 2. Title
  docElements.push(
    new Paragraph({
      text: ev.titulo || "Evaluación",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Calculate Total Points (Puntaje Ideal)
  let totalPoints = 0;
  const filasSpec = cj.tabla_especificaciones?.filas || [];
  if (Array.isArray(filasSpec) && filasSpec.length > 0) {
    totalPoints = filasSpec.reduce((sum: number, f: any) => sum + (Number(f.ptos) || 0), 0);
  } else {
    const preguntas = getPreguntasList(cj);
    // Rough fallback: 1 point for multiple choice, 3 for development
    totalPoints = preguntas.reduce((sum: number, p: any) => sum + (p.tipo === 'seleccion_multiple' ? 1 : 3), 0);
  }
  if (totalPoints === 0) totalPoints = 30; // Absolute fallback

  // 3. Student data box
  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(" Nombre: __________________________________________________ ")], margins: { top: 100, bottom: 100, left: 100 } }),
            new TableCell({ children: [new Paragraph(` Curso: ${ev.nivel} `)], margins: { top: 100, bottom: 100, left: 100 } }),
            new TableCell({ children: [new Paragraph(` Fecha: ________________ `)], margins: { top: 100, bottom: 100, left: 100 } })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(` Puntaje Ideal: ${totalPoints}`)], margins: { top: 100, bottom: 100, left: 100 } }),
            new TableCell({ children: [new Paragraph(" Puntaje Obtenido: _______ ")], margins: { top: 100, bottom: 100, left: 100 } }),
            new TableCell({ children: [new Paragraph(" Nota: _______ ")], margins: { top: 100, bottom: 100, left: 100 } })
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 400 } })
  );

  // 4. Instrucciones generales
  if (cj.instrucciones_generales) {
    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: "Instrucciones Generales:", bold: true })],
        spacing: { after: 100 }
      }),
      new Paragraph({ text: cj.instrucciones_generales, spacing: { after: 400 } })
    );
  }

  // 5. Tabla de Especificaciones
  if (Array.isArray(ev.tipos) && ev.tipos.includes('tabla_especificaciones') && filasSpec.length > 0) {
    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: "Tabla de Especificaciones", bold: true, size: 28 })],
        spacing: { after: 200 }
      })
    );

    const specRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Habilidad", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "N° Pregunta", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Puntaje", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "% del Total", bold: true })] })] })
        ]
      })
    ];

    let totalPct = 0;
    filasSpec.forEach((f: any) => {
      const ptos = Number(f.ptos) || 0;
      const pct = totalPoints > 0 ? Math.round((ptos / totalPoints) * 100) : 0;
      totalPct += pct;
      specRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(f.habilidad || "")] }),
            new TableCell({ children: [new Paragraph(String(f.n_pregunta || ""))] }),
            new TableCell({ children: [new Paragraph(String(ptos))] }),
            new TableCell({ children: [new Paragraph(`${pct}%`)] })
          ]
        })
      );
    });

    specRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] }),
          new TableCell({ children: [new Paragraph("-")] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totalPoints), bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalPct}%`, bold: true })] })] })
        ]
      })
    );

    docElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: specRows
      }),
      new Paragraph({ text: "", spacing: { after: 400 } })
    );
  }

  // 6. Textos de Lectura
  const textos = cj.textos_lectura || [];
  if (Array.isArray(textos) && textos.length > 0) {
    textos.forEach((t: any) => {
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: t.titulo || "Texto", bold: true, size: 24 })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `(${t.tipo || 'Lectura'})`, italics: true })],
          spacing: { after: 200 }
        }),
        new Paragraph({ text: t.contenido || "", spacing: { after: 400 } })
      );
    });
  }

  // Questions
  const preguntas = getPreguntasList(cj);
  const multipleChoice = preguntas.filter(p => p.tipo === 'seleccion_multiple' || p.tipo === 'alternativa');
  const development = preguntas.filter(p => p.tipo !== 'seleccion_multiple' && p.tipo !== 'alternativa');

  // 7. Selección Múltiple Questions
  if (multipleChoice.length > 0) {
    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: "I. Preguntas de Selección Múltiple", bold: true, size: 28 })],
        spacing: { after: 200 }
      })
    );

    multipleChoice.forEach((q: any, i: number) => {
      const num = q.numero || (i + 1);
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: `${num}. ${q.enunciado || ""}`, bold: true })],
          spacing: { after: 100 }
        })
      );
      
      const alts = getCleanAlternatives(q.alternativas, q);
      alts.forEach((a) => {
        docElements.push(
          new Paragraph({
            text: `${a.letra}) ${a.texto}`,
            indent: { left: 720 }, // roughly 1/2 inch
            spacing: { after: 50 }
          })
        );
      });
      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    });
  }

  // 8. Desarrollo Questions
  if (development.length > 0) {
    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: "II. Preguntas de Desarrollo", bold: true, size: 28 })],
        spacing: { after: 200 }
      })
    );

    const typesStr = Array.isArray(ev.tipos) ? ev.tipos.join(' ') : '';
    const technique = getTechniqueInstruction(typesStr);

    development.forEach((q: any, i: number) => {
      const num = q.numero || (multipleChoice.length + i + 1);
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: `${num}. ${q.enunciado || ""}`, bold: true })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: technique, italics: true, size: 20 })],
          spacing: { after: 200 }
        })
      );

      for (let j = 0; j < 6; j++) {
        docElements.push(
          new Paragraph({ text: "_________________________________________________________________________________________", spacing: { after: 150 } })
        );
      }
      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    });
  }

  // 9. Rúbrica
  const rubrica = cj.rubrica || cj.rubrica_evaluacion;
  if (rubrica && Array.isArray(rubrica.criterios)) {
    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: "Rúbrica de Evaluación", bold: true, size: 28 })],
        spacing: { after: 200 }
      })
    );

    const rubricaRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Criterio", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Logrado (3)", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "En proceso (2)", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Por lograr (1)", bold: true })] })] })
        ]
      })
    ];

    rubrica.criterios.forEach((c: any) => {
      rubricaRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(c.nombre || c.criterio || "")] }),
            new TableCell({ children: [new Paragraph(c.logrado || c.excelente || c.si || "")] }),
            new TableCell({ children: [new Paragraph(c.en_proceso || c.suficiente || "")] }),
            new TableCell({ children: [new Paragraph(c.por_lograr || c.insuficiente || c.no || "")] })
          ]
        })
      );
    });

    docElements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rubricaRows }),
      new Paragraph({ text: "", spacing: { after: 400 } })
    );
  }

  // Helper for self/co/hetero evaluations
  const buildEvalTable = (title: string, obj: any) => {
    if (!obj) return;
    const items = obj.indicadores || obj.criterios;
    if (!Array.isArray(items) || items.length === 0) return;

    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 24 })],
        spacing: { after: 200 }
      })
    );

    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Indicador", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Siempre", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "A veces", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nunca", bold: true })] })] })
        ]
      })
    ];

    items.forEach((ind: any) => {
      const text = typeof ind === 'string' ? ind : (ind.indicador || ind.nombre || ind.criterio || "");
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(text)] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] })
          ]
        })
      );
    });

    docElements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
      new Paragraph({ text: "", spacing: { after: 400 } })
    );
  };

  // 10, 11, 12. Auto/Co/Hetero Evaluaciones
  buildEvalTable("Autoevaluación", cj.autoevaluacion);
  buildEvalTable("Coevaluación", cj.coevaluacion);
  buildEvalTable("Heteroevaluación", cj.heteroevaluacion);


  // ------------------------------------------------------------------
  // Pauta del Docente (new page)
  // ------------------------------------------------------------------
  docElements.push(new Paragraph({ children: [new PageBreak()] }));

  docElements.push(
    new Paragraph({
      text: "PAUTA DE CORRECCIÓN — USO EXCLUSIVO DEL DOCENTE",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // 14. Claves de Alternativas
  if (multipleChoice.length > 0) {
    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: "Claves de Alternativas", bold: true, size: 24 })],
        spacing: { after: 200 }
      })
    );

    const claveRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "N°", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Clave", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "OA", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Justificación", bold: true })] })] })
        ]
      })
    ];

    multipleChoice.forEach((q: any, i: number) => {
      const num = q.numero || String(i + 1);
      const clave = q.clave || q.respuesta_correcta || "-";
      const oa = q.oa || "-";
      const justif = q.justificacion || "-";
      
      claveRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(String(num))] }),
            new TableCell({ children: [new Paragraph(clave)] }),
            new TableCell({ children: [new Paragraph(oa)] }),
            new TableCell({ children: [new Paragraph(justif)] })
          ]
        })
      );
    });

    docElements.push(
      new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: claveRows }),
      new Paragraph({ text: "", spacing: { after: 400 } })
    );
  }

  // 15. Respuestas de Desarrollo
  if (development.length > 0) {
    docElements.push(
      new Paragraph({
        children: [new TextRun({ text: "Respuestas Esperadas (Desarrollo)", bold: true, size: 24 })],
        spacing: { after: 200 }
      })
    );

    development.forEach((q: any, i: number) => {
      const num = q.numero || String(multipleChoice.length + i + 1);
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: `Pregunta ${num}:`, bold: true })],
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: `Respuesta esperada: ${q.respuesta_esperada || "No especificada"}`,
          spacing: { after: 100 }
        })
      );
      
      if (Array.isArray(q.criterios_correccion) && q.criterios_correccion.length > 0) {
        docElements.push(
          new Paragraph({ children: [new TextRun({ text: "Criterios de corrección:", italics: true })] })
        );
        q.criterios_correccion.forEach((crit: string) => {
          docElements.push(
            new Paragraph({ text: `• ${crit}`, indent: { left: 360 } })
          );
        });
      }
      docElements.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    });
  }

  // 16. Escala de Notas
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: "Escala de Notas (Exigencia 60%)", bold: true, size: 24 })],
      spacing: { after: 200 }
    })
  );

  const escalaRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Puntaje", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nota", bold: true })] })] })
      ]
    })
  ];

  for (let p = 0; p <= totalPoints; p++) {
    let nota = 1.0;
    const ptCorte = totalPoints * 0.6;
    if (p < ptCorte) {
      nota = 1.0 + 3.0 * (p / ptCorte);
    } else {
      nota = 4.0 + 3.0 * ((p - ptCorte) / (totalPoints - ptCorte));
    }
    // Round to 1 decimal place
    const notaStr = nota.toFixed(1);

    escalaRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(String(p))] }),
          new TableCell({ children: [new Paragraph(notaStr)] })
        ]
      })
    );
  }

  docElements.push(
    new Table({ width: { size: 50, type: WidthType.PERCENTAGE }, rows: escalaRows })
  );

  // Build Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT] })]
              })
            ]
          })
        },
        children: docElements
      }
    ]
  });

  return Packer.toBlob(doc);
}
