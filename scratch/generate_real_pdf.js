const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const outputDir = 'c:\\Users\\56940\\Desktop\\app-docente-ia\\evidencia_visual';
const outputFile = path.join(outputDir, 'evaluacion-completa.pdf');
const jsonFile = path.join(outputDir, 'evaluacion_real.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  let record;
  if (fs.existsSync(jsonFile)) {
    console.log(`Loading cached JSON from: ${jsonFile}`);
    record = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  } else {
    console.log('Sending request to /api/evaluaciones (calling Claude)...');
    
    const body = {
      nivel: '2° Medio',
      eje: 'Lectura',
      oa_codes: ['OA 2'],
      oa_textos: { 'OA 2': 'OA 2: Proponer interpretaciones de textos de diversos géneros o épocas, expresando una postura sobre los temas encontrados en ellos y fundamentándola en el texto.' },
      tipos: ['evaluacion', 'tabla', 'pauta', 'respuestas', 'instrumento'],
      n_preguntas: 5,
      duracion_min: 90,
      dificultad: 'mixto',
      titulo: 'Evaluación de Lenguaje: 2° Medio'
    };

    const res = await fetch('http://localhost:3000/api/evaluaciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-access-token'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API failed: ${res.status} | ${errText}`);
    }

    record = await res.json();
    console.log('API response received successfully!');
    
    // Save JSON output
    fs.writeFileSync(jsonFile, JSON.stringify(record, null, 2), 'utf8');
    console.log(`JSON saved to: ${jsonFile}`);
  }

  try {
    // Generate PDF
    const doc = new jsPDF();
    const cj = record.contenido_json;

    doc.setFont("helvetica", "normal");
    let y = 20;
    const margin = 20;
    const width = doc.internal.pageSize.getWidth() - 2 * margin;

    const addText = (text, size, style = "normal", color = "default") => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      if (color === "violet") doc.setTextColor(124, 58, 237);
      else if (color === "gray") doc.setTextColor(100, 116, 139);
      else doc.setTextColor(30, 41, 59);

      const lines = doc.splitTextToSize(text, width);
      lines.forEach((line) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += size * 0.4 + 4;
      });
    };

    addText(record.titulo || 'Evaluación Completa - REI DOCENTE', 16, "bold", "violet");
    addText(`Curso: ${record.nivel || '2° Medio'} | Tipo: ${cj.tipo_evaluacion || 'Diagnóstica'}`, 10, "normal", "gray");
    y += 4;
    doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
    y += 10;

    if (cj.tabla_especificaciones && cj.tabla_especificaciones.filas) {
      addText("Tabla de Especificaciones", 12, "bold", "violet");
      y += 2;
      cj.tabla_especificaciones.filas.forEach((row) => {
        addText(`Pregunta ${row.n_pregunta}: OA: ${row.oa} | Nivel: ${row.habilidad_cognitiva} | Ponderación: ${row.ponderacion_porcentaje}% | Tipo: ${row.tipo_item}`, 9, "normal");
      });
      y += 6;
    }

    if (cj.evaluacion && cj.evaluacion.items) {
      addText("Evaluación Académica", 12, "bold", "violet");
      y += 2;
      
      if (cj.evaluacion.texto_base) {
        addText(`Texto: ${cj.evaluacion.texto_base.titulo}`, 11, "bold");
        if (cj.evaluacion.texto_base.autor) {
          addText(`Autor: ${cj.evaluacion.texto_base.autor}`, 9, "italic", "gray");
        }
        addText(cj.evaluacion.texto_base.fragmento || '', 9, "normal");
        y += 4;
      }

      cj.evaluacion.items.forEach((q) => {
        addText(`${q.numero}. ${q.enunciado}`, 10, "bold");
        if (q.tipo === 'seleccion_multiple' && q.alternativas) {
          Object.entries(q.alternativas).forEach(([letra, texto]) => {
            addText(`  ${letra}) ${texto}`, 9, "normal");
          });
        } else if (q.tipo === 'desarrollo') {
          addText(`  Respuesta de Desarrollo (Extensión sugerida: ${q.extension_sugerida || 'libre'})`, 9, "normal", "gray");
          if (q.criterios_evaluacion) {
            addText(`  Criterios de evaluación:`, 9, "bold");
            q.criterios_evaluacion.forEach((crit) => {
              addText(`    - ${crit}`, 9, "normal");
            });
          }
        }
        y += 2;
      });
      y += 6;
    }

    if (cj.respuestas) {
      addText("Solucionario & Respuestas Esperadas", 12, "bold", "violet");
      y += 2;
      if (cj.respuestas.clave_seleccion_multiple) {
        cj.respuestas.clave_seleccion_multiple.forEach((r) => {
          addText(`Pregunta ${r.pregunta}: Clave ${r.respuesta_correcta} | Explicación: ${r.justificacion}`, 9, "normal");
        });
      }
      if (cj.respuestas.respuesta_modelo_desarrollo) {
        const rmd = cj.respuestas.respuesta_modelo_desarrollo;
        addText(`Pregunta ${rmd.pregunta} (Ejemplo de respuesta):`, 9, "bold");
        addText(rmd.postura_ejemplo || rmd.respuesta_modelo || '', 9, "normal");
      }
      y += 6;
    }

    if (cj.instrumento) {
      addText("Instrumento de Evaluación", 12, "bold", "violet");
      y += 2;
      addText(cj.instrumento.tipo || 'Autoevaluación y Coevaluación', 10, "bold");
      if (cj.instrumento.oa_actitudinal) {
        addText(cj.instrumento.oa_actitudinal, 9, "italic", "gray");
      }
      
      if (cj.instrumento.autoevaluacion) {
        const auto = cj.instrumento.autoevaluacion;
        addText(`Autoevaluación: ${auto.descripcion || ''}`, 9, "bold");
        if (auto.criterios) {
          auto.criterios.forEach((crit) => {
            addText(`  ${crit.numero || ''}. ${crit.criterio}`, 9, "normal");
          });
        }
        y += 2;
      }
      
      if (cj.instrumento.coevaluacion) {
        const co = cj.instrumento.coevaluacion;
        addText(`Coevaluación: ${co.descripcion || ''}`, 9, "bold");
        if (co.criterios) {
          co.criterios.forEach((crit) => {
            addText(`  ${crit.numero || ''}. ${crit.criterio}`, 9, "normal");
          });
        }
        y += 2;
      }
      y += 6;
    }

    const pdfBuffer = doc.output('arraybuffer');
    fs.writeFileSync(outputFile, Buffer.from(pdfBuffer));
    console.log(`PDF saved to: ${outputFile}`);
    console.log('Finished successfully!');
  } catch (error) {
    console.error('Error during generation:', error);
  }
}

run();
