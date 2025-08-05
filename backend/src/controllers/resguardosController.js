const db = require('../config/db');
const PDFDocument = require('pdfkit');
const path = require('path');

function formatDate(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
const mx = n => n ? `$${parseFloat(n).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}` : '-';

// --- NUEVO: Generar PDF usando snapshot si existe, si no, fallback a legacy ---
exports.generarPDF = (req, res) => {
  const prestamoId = req.params.prestamoId;

  db.query('SELECT * FROM resguardo_snapshots WHERE prestamo_id = ?', [prestamoId], (err, snapshots) => {
    if (err) return res.status(500).json({ error: 'Error al buscar snapshot' });

    if (snapshots && snapshots.length > 0) {
      // ---- USAR SNAPSHOT (histórico) ----
      const snap = snapshots[0];
      const data = {
        folio: snap.folio,
        fecha_prestamo: snap.fecha_prestamo,
        fecha_vencimiento: snap.fecha_vencimiento,
        periodo: snap.periodo,
        comentarios: snap.comentarios,
        empleado_nombre: snap.empleado_nombre,
        cargo: snap.empleado_cargo,
        departamento: snap.empleado_departamento,
        numero_asociado: snap.empleado_numero_asociado,
        hotel: snap.empleado_hotel,
        resp_nombre: snap.responsable_nombre,
        resp_puesto: snap.responsable_puesto,
        articulos: JSON.parse(snap.articulos_json)
      };

      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="resguardo_${data.folio || prestamoId}.pdf"`);

      // === HEADER EN 4 COLUMNAS ===
      const headerY = 38;
      const headerH = 60;
      const headerX = 40;
      const headerW = 520;
      doc.roundedRect(headerX, headerY, headerW, headerH, 7).stroke('#b4b4b4');

      // Columnas
      const col1 = headerX + 8;
      const col2 = headerX + 80;
      const col3 = headerX + 255;
      const col4 = headerX + 390;

      // Logo
      const logoPath = (data.hotel || '').toLowerCase().includes('jw')
        ? path.resolve(__dirname, '../assets/logo_JWmarriott.png')
        : path.resolve(__dirname, '../assets/logo_marriott.png');
      try { doc.image(logoPath, col1, headerY + 8, { width: 52, height: 45 }); } catch {}

      // Título y departamento
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#232323')
        .text('RESGUARDO DE EQUIPOS', col2, headerY + 6, { width: 150, align: 'left' });
      doc.font('Helvetica-Bold').fontSize(10).text('DEPARTAMENTO:', col2, headerY + 28, { continued: true })
        .font('Helvetica').text(` ${data.departamento || 'Sistemas'}`, { width: 140 });

      // Folio y fecha inicial
      doc.font('Helvetica-Bold').fontSize(10)
        .text('FOLIO:', col3, headerY + 6, { continued: true })
        .font('Helvetica').text(` ${data.folio || prestamoId}`);
      doc.font('Helvetica-Bold').fontSize(10)
        .text('FECHA INICIAL:', col3, headerY + 28, { width: 120, continued: true })
        .font('Helvetica').text(` ${formatDate(data.fecha_prestamo)}`);

      // Tipo y fecha fin
      doc.font('Helvetica-Bold').fontSize(10)
        .text('TIPO:', col4, headerY + 6, { continued: true })
        .font('Helvetica').text(` ${data.periodo === 'permanente' ? 'Permanente' : 'Por periodo'}`);
      doc.font('Helvetica-Bold').fontSize(10)
        .text('FECHA FIN:', col4, headerY + 28, { width: 120, continued: true })
        .font('Helvetica').text(` ${formatDate(data.fecha_vencimiento)}`);

      // ==== TABLA DE ARTÍCULOS ====
      let y = 110;
      const articulos = data.articulos || [];
      const tableHeight = Math.max(30, articulos.length * 18);

      doc.roundedRect(45, y, 500, tableHeight + 25, 7).stroke('#b4b4b4');
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#232323');
      doc.text('ARTÍCULO', 50, y + 8, { width: 70, align: 'center' });
      doc.text('MARCA', 120, y + 8, { width: 75, align: 'center' });
      doc.text('MODELO', 195, y + 8, { width: 70, align: 'center' });
      doc.text('SERIE', 265, y + 8, { width: 90, align: 'center' });
      doc.text('DESCRIPCIÓN', 355, y + 8, { width: 110, align: 'center' });
      doc.text('VALOR (MXN)', 465, y + 8, { width: 75, align: 'center' });

      doc.font('Helvetica').fontSize(10).fillColor('#232323');
      let yArt = y + 26;
      for (let i = 0; i < articulos.length; i++) {
        const art = articulos[i];
        doc.text(art.tipo || '-', 50, yArt, { width: 70, align: 'center' });
        doc.text(art.marca || '-', 120, yArt, { width: 75, align: 'center' });
        doc.text(art.modelo || '-', 195, yArt, { width: 70, align: 'center' });
        doc.text(art.numero_serie || '-', 265, yArt, { width: 90, align: 'center' });
        doc.text(art.descripcion || '-', 355, yArt, { width: 110, align: 'center' });
        doc.text(mx(art.costo), 465, yArt, { width: 75, align: 'center' });
        yArt += 18;
      }

      y = yArt + 12;

      // ==== COMENTARIOS ====
      const comentarios = data.comentarios || "";
      doc.roundedRect(45, y, 500, 32, 7).stroke('#b4b4b4');
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#555').text('COMENTARIOS:', 53, y + 9);
      doc.font('Helvetica').fontSize(10).fillColor('#232323')
        .text(comentarios, 140, y + 9, { width: 390 });

      y += 40;

      // ==== CLÁUSULA LEGAL + FIRMAS ====
      const legalText =
        "Hago constar que el equipo lo recibo en condiciones requeridas para el trabajo, por lo que me obligo en términos del ARTÍCULO 134 FRACCIÓN VI Y 135 FRACCIONES III Y IX DE LA LEY FEDERAL DEL TRABAJO a conservarlos en buen estado, a utilizarlos para lo que están asignados dentro de las funciones a mi cargo; así como restituirlos cuando me sean canjeados o cuando la compañía me los requiera, responsabilizándome de los mismos bajo cualquier circunstancia salvo por caso fortuito o fuerza mayor. Acepto las sanciones establecidas por la empresa en caso de incumplimiento en cualquiera de las obligaciones relativas al equipo recibido.\n\nHaciéndome responsable del buen uso del mismo, y comprometiéndome a utilizarlo solo para lo necesario en la relación de las actividades de operaciones.";
      doc.font('Helvetica').fontSize(9.5).fillColor('#232323');
      const textWidth = 486;
      const legalTextOptions = { width: textWidth, align: 'justify', lineGap: 2 };
      const textHeight = doc.heightOfString(legalText, legalTextOptions);

      // Espacio para la caja legal y firmas separadas
      const minFirmaSpace = 142;
      let yClausula = y;
      let yFirma = yClausula + textHeight + 20;
      if (yFirma < yClausula + minFirmaSpace) yFirma = yClausula + minFirmaSpace;

      doc.roundedRect(45, yClausula, 500, yFirma - yClausula + 72, 7).stroke('#b4b4b4');
      doc.text(legalText, 53, yClausula + 7, legalTextOptions);

      // Firmas
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#232323');
      doc.text("RECIBIDO POR:", 95, yFirma);
      doc.text("ENTREGADO POR:", 365, yFirma);

      doc.font('Helvetica').fontSize(10);
      doc.text("____________________________", 60, yFirma + 18);
      doc.text("____________________________", 340, yFirma + 18);

      doc.fontSize(9).fillColor('#232323');
      doc.text(data.empleado_nombre || '__________', 115, yFirma + 34, { width: 120, align: 'center' });
      doc.text(data.cargo || 'Colaborador que recibe', 115, yFirma + 42, { width: 120, align: 'center' });
      doc.text(data.resp_nombre || '__________', 375, yFirma + 34, { width: 120, align: 'center' });
      doc.text(data.resp_puesto || 'Responsable de sistemas', 375, yFirma + 42, { width: 120, align: 'center' });

      // ==== FOOTER ====
      doc.roundedRect(40, 775, 520, 25, 7).stroke('#b4b4b4');
      doc.font('Helvetica').fontSize(8).fillColor('#232323');
      doc.text("MARRIOTT CONFIDENTIAL AND PROPRIETARY INFORMATION", 50, 782, { width: 400, align: 'left' });
      doc.text(`Pág 1 de 1`, 400, 782, { width: 150, align: 'right' });

      doc.end();
      doc.pipe(res);

    } else {
     
      return res.status(404).json({ error: 'No existe snapshot del resguardo para este préstamo.' });
    }
  });
};
