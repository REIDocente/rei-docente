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

export interface AnalisisData {
  titulo: string;
  nivel: string;
  establecimiento?: string;
  nombre_docente?: string;
  n_preguntas_sm: number;
  n_preguntas_desarrollo: number;
  pauta_json: Record<string, string | number>;
  tabla_especificaciones_json?: any[];
  rubrica_json?: any[];
  plan_mejora_json?: {
    top_habilidades_debiles?: Array<{ habilidad: string; porcentaje_logro: number; descripcion: string }>;
    estrategias_pedagogicas?: string[];
    actividades_sugeridas?: Array<{ habilidad: string; actividad: string }>;
    seguimiento_estudiantes?: Array<{ nombre: string; nota: number; habilidades_a_reforzar: string[]; nivel_rti: number; nivel_rti_explicacion?: string }>;
  };
  created_at: string;
}

export interface ResultadoEstudianteData {
  nombre_estudiante: string;
  respuestas_json: Record<string, string | number>;
  puntaje_sm: number;
  puntaje_desarrollo: number;
  puntaje_total: number;
  porcentaje_logro: number;
  nota: number;
}

export async function drawPlanMejoraWord(analisis: AnalisisData, resultados: ResultadoEstudianteData[]): Promise<Blob> {
  const docElements: any[] = [];

  const gap = () => new Paragraph({ text: "", spacing: { after: 150 } });
  
  const cell = (text: string, bold = false) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: text || '', bold, size: 20 })] })] });

  const headerRow = (cols: string[]) =>
    new TableRow({ children: cols.map((c) => cell(c, true)) });

  // 1. Header Info
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "REI DOCENTE - PLAN DE MEJORA Y SEGUIMIENTO", bold: true, size: 28, color: "BE123C" })
      ],
      spacing: { after: 300 }
    })
  );

  const metaRows = [
    new TableRow({
      children: [
        cell("Título del Análisis:", true),
        cell(analisis.titulo),
        cell("Curso:", true),
        cell(analisis.nivel)
      ]
    }),
    new TableRow({
      children: [
        cell("Establecimiento:", true),
        cell(analisis.establecimiento || "No especificado"),
        cell("Docente:", true),
        cell(analisis.nombre_docente || "No especificado")
      ]
    }),
    new TableRow({
      children: [
        cell("Fecha:", true),
        cell(new Date(analisis.created_at || Date.now()).toLocaleDateString('es-CL')),
        cell("Total Alumnos:", true),
        cell(String(resultados.length))
      ]
    })
  ];

  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: metaRows
    }),
    gap()
  );

  // 2. Sección 1: Estadísticas del curso
  const grades = resultados.map(r => r.nota);
  const avgGrade = grades.length > 0 ? (grades.reduce((sum, n) => sum + n, 0) / grades.length).toFixed(1) : "0.0";
  const avgPct = resultados.length > 0 ? (resultados.reduce((sum, r) => sum + r.porcentaje_logro, 0) / resultados.length).toFixed(1) : "0.0";
  const aboveFour = resultados.filter(r => r.nota >= 4.0).length;
  const belowFour = resultados.filter(r => r.nota < 4.0).length;

  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: "Sección 1: Estadísticas Generales del Curso", bold: true, size: 24, color: "1E3A8A" })],
      spacing: { before: 200, after: 150 }
    })
  );

  const statRows = [
    headerRow(["Métrica", "Valor"]),
    new TableRow({ children: [cell("Promedio de Notas"), cell(avgGrade)] }),
    new TableRow({ children: [cell("Porcentaje Promedio de Logro"), cell(`${avgPct}%`)] }),
    new TableRow({ children: [cell("Alumnos con Nota ≥ 4.0 (Aprobados)"), cell(String(aboveFour))] }),
    new TableRow({ children: [cell("Alumnos con Nota < 4.0 (Bajo el Mínimo)"), cell(String(belowFour))] })
  ];

  docElements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: statRows
    }),
    gap()
  );

  // 3. Sección 2: % de Logro por Habilidad
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: "Sección 2: Porcentaje de Logro por Habilidad", bold: true, size: 24, color: "1E3A8A" })],
      spacing: { before: 200, after: 150 }
    })
  );

  const specTable = analisis.tabla_especificaciones_json || [];
  if (specTable.length > 0) {
    const skillRows = [
      headerRow(["Habilidad", "Preguntas", "Logro Promedio del Curso"])
    ];

    specTable.forEach((skill: any) => {
      const qNums = String(skill.preguntas || '').split(',').map(s => s.trim()).filter(Boolean);
      let totalPointsPossible = 0;
      let totalPointsEarned = 0;

      resultados.forEach(est => {
        qNums.forEach(qNum => {
          // Check if Q is SM or Desarrollo
          const pval = analisis.pauta_json[qNum];
          if (typeof pval === 'number') {
            totalPointsPossible += pval;
            totalPointsEarned += Number(est.respuestas_json[qNum]) || 0;
          } else if (typeof pval === 'string') {
            totalPointsPossible += 1;
            totalPointsEarned += est.respuestas_json[qNum] === pval ? 1 : 0;
          }
        });
      });

      const logro = totalPointsPossible > 0 ? Math.round((totalPointsEarned / totalPointsPossible) * 100) : 0;

      skillRows.push(
        new TableRow({
          children: [
            cell(skill.habilidad || "Habilidad"),
            cell(qNums.join(', ')),
            cell(`${logro}%`)
          ]
        })
      );
    });

    docElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: skillRows
      }),
      gap()
    );
  } else {
    docElements.push(
      new Paragraph({ text: "No se configuró tabla de especificaciones." }),
      gap()
    );
  }

  // 4. Sección 3: Plan de Mejora del Curso (IA)
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: "Sección 3: Plan de Mejora Pedagógica (IA)", bold: true, size: 24, color: "1E3A8A" })],
      spacing: { before: 200, after: 150 }
    })
  );

  const plan = analisis.plan_mejora_json;
  if (plan) {
    if (Array.isArray(plan.top_habilidades_debiles) && plan.top_habilidades_debiles.length > 0) {
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: "Habilidades Prioritarias a Reforzar:", bold: true, size: 20 })],
          spacing: { after: 100 }
        })
      );
      plan.top_habilidades_debiles.forEach((h, index) => {
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. ${h.habilidad} (${h.porcentaje_logro}% de logro): `, bold: true }),
              new TextRun({ text: h.descripcion || '' })
            ],
            spacing: { after: 80 }
          })
        );
      });
      docElements.push(gap());
    }

    if (Array.isArray(plan.estrategias_pedagogicas) && plan.estrategias_pedagogicas.length > 0) {
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: "Estrategias Pedagógicas Concretas (Próximas 2 semanas):", bold: true, size: 20 })],
          spacing: { after: 100 }
        })
      );
      plan.estrategias_pedagogicas.forEach((est, index) => {
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${est}` })],
            spacing: { after: 80 }
          })
        );
      });
      docElements.push(gap());
    }

    if (Array.isArray(plan.actividades_sugeridas) && plan.actividades_sugeridas.length > 0) {
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: "Actividades Sugeridas por Habilidad:", bold: true, size: 20 })],
          spacing: { after: 100 }
        })
      );
      plan.actividades_sugeridas.forEach(act => {
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Habilidad: ${act.habilidad}\n`, bold: true }),
              new TextRun({ text: act.actividad })
            ],
            spacing: { after: 120 }
          })
        );
      });
      docElements.push(gap());
    }
  } else {
    docElements.push(
      new Paragraph({ text: "El plan de mejora con IA aún no ha sido generado." }),
      gap()
    );
  }

  // 5. Sección 4: Plan de Seguimiento Individual
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: "Sección 4: Plan de Seguimiento Individual (Alumnos bajo 4.0)", bold: true, size: 24, color: "1E3A8A" })],
      spacing: { before: 200, after: 150 }
    })
  );

  const alumnosBajoCuatro = plan?.seguimiento_estudiantes || [];
  if (alumnosBajoCuatro.length > 0) {
    const studentRows = [
      headerRow(["Estudiante", "Nota", "Habilidades a Reforzar", "Nivel RTI"])
    ];

    alumnosBajoCuatro.forEach((est: any) => {
      studentRows.push(
        new TableRow({
          children: [
            cell(est.nombre || "Estudiante"),
            cell(String(est.nota || "")),
            cell(Array.isArray(est.habilidades_a_reforzar) ? est.habilidades_a_reforzar.join(', ') : String(est.habilidades_a_reforzar || '-')),
            cell(`Nivel ${est.nivel_rti || '1'}${est.nivel_rti_explicacion ? ` (${est.nivel_rti_explicacion})` : ''}`)
          ]
        })
      );
    });

    docElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: studentRows
      })
    );
  } else {
    docElements.push(
      new Paragraph({ text: "No hay estudiantes registrados con promedio inferior a 4.0 en este análisis." })
    );
  }

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
                children: [
                  new TextRun({ text: "Página " }),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun({ text: " de " }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] })
                ]
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
