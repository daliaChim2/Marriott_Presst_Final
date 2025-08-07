// src/controllers/prestamosController.js
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const path = require('path');
const { PassThrough } = require('stream');

function formatDate(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const mx = n => n ? `$${parseFloat(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';

exports.generarPDF = (req, res) => {
  const prestamoId = req.params.prestamoId;

  db.query('SELECT * FROM resguardo_snapshots WHERE prestamo_id = ?', [prestamoId], (err, snapshots) => {
    if (err || !snapshots || snapshots.length === 0) {
      return res.status(500).json({ error: 'Error al generar PDF o no se encontró snapshot.' });
    }

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

    const stream = new PassThrough();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="resguardo_${data.folio || prestamoId}.pdf"`);

    const doc = new PDFDocument({ size: 'LETTER', margin: 22, bufferPages: true });
    doc.pipe(stream);
    stream.pipe(res);

    const articulos = data.articulos || [];
    const porPagina = 10;
    const totalPaginas = Math.ceil(articulos.length / porPagina) || 1;

    const drawHeader = () => {
      const headerX = 40, headerY = 38, headerW = 520, headerH = 60;
      const col1 = headerX + 8, col2 = headerX + 80, col3 = headerX + 255, col4 = headerX + 390;

      doc.roundedRect(headerX, headerY, headerW, headerH, 7).stroke('#b4b4b4');

      const logoPath = (data.hotel || '').toLowerCase().includes('jw')
        ? path.resolve(__dirname, '../assets/logo_JWmarriott.png')
        : path.resolve(__dirname, '../assets/logo_marriott.png');
      try { doc.image(logoPath, col1, headerY + 8, { width: 52, height: 45 }); } catch {}

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#232323')
        .text('RESGUARDO DE EQUIPOS', col2, headerY + 6, { width: 150, align: 'left' });
      doc.font('Helvetica-Bold').fontSize(10).text('DEPARTAMENTO:', col2, headerY + 28, { continued: true })
        .font('Helvetica').text(` ${data.departamento || 'Sistemas'}`, { width: 140 });

      doc.font('Helvetica-Bold').fontSize(10)
        .text('FOLIO:', col3, headerY + 6, { continued: true })
        .font('Helvetica').text(` ${data.folio || prestamoId}`);
      doc.font('Helvetica-Bold').fontSize(10)
        .text('FECHA INICIAL:', col3, headerY + 28, { width: 120, continued: true })
        .font('Helvetica').text(` ${formatDate(data.fecha_prestamo)}`);

      doc.font('Helvetica-Bold').fontSize(10)
        .text('TIPO:', col4, headerY + 6, { continued: true })
        .font('Helvetica').text(` ${data.periodo === 'permanente' ? 'Permanente' : 'Por periodo'}`);
      doc.font('Helvetica-Bold').fontSize(10)
        .text('FECHA FIN:', col4, headerY + 28, { width: 120, continued: true })
        .font('Helvetica').text(` ${formatDate(data.fecha_vencimiento)}`);
    };

    for (let p = 0; p < totalPaginas; p++) {
      if (p > 0) doc.addPage();
      drawHeader();

      const yTabla = 110;
      const hFila = 18;
      const base = p * porPagina;
      const items = articulos.slice(base, base + porPagina);

      doc.roundedRect(45, yTabla, 500, (hFila * porPagina) + 25, 7).stroke('#b4b4b4');
      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#232323');
      doc.text('ARTÍCULO', 50, yTabla + 8, { width: 70, align: 'center' });
      doc.text('MARCA', 120, yTabla + 8, { width: 75, align: 'center' });
      doc.text('MODELO', 195, yTabla + 8, { width: 70, align: 'center' });
      doc.text('SERIE', 265, yTabla + 8, { width: 90, align: 'center' });
      doc.text('DESCRIPCIÓN', 355, yTabla + 8, { width: 110, align: 'center' });
      doc.text('VALOR (MXN)', 465, yTabla + 8, { width: 75, align: 'center' });

      doc.font('Helvetica').fontSize(10);
      let yItem = yTabla + 26;

      for (let i = 0; i < porPagina; i++) {
        const art = items[i];
        const datos = art ? [
          art.tipo, art.marca, art.modelo, art.numero_serie,
          art.descripcion, mx(art.costo)
        ] : Array(6).fill('— — — —');

        [70, 75, 70, 90, 110, 75].reduce((x, w, j) => {
          doc.text(datos[j], x, yItem, { width: w, align: 'center' });
          return x + w;
        }, 50);
        yItem += hFila;
      }

      // if (p < totalPaginas - 1) continue;

      // === COMENTARIOS ===
      let y = yItem + 36;
      const comentarios = data.comentarios || "";
      const hMin = 90;
      const hReal = doc.heightOfString(comentarios, { width: 390 }) + 18;
      const hComentarios = Math.max(hMin, hReal);

      doc.roundedRect(45, y, 500, hComentarios, 7).stroke('#b4b4b4');
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#555').text('COMENTARIOS:', 53, y + 9);
      doc.font('Helvetica').fontSize(10).fillColor('#232323').text(comentarios, 140, y + 9, { width: 390 });

      // === CLÁUSULA Y FIRMAS (2 cm abajo) ===
      y += hComentarios + 20;
      const clausula =
        "Hago constar que el equipo lo recibo en condiciones requeridas para el trabajo, por lo que me obligo en términos del ARTÍCULO 134 FRACCIÓN VI Y 135 FRACCIONES III Y IX DE LA LEY FEDERAL DEL TRABAJO a conservarlos en buen estado, a utilizarlos para lo que están asignados dentro de las funciones a mi cargo; así como restituirlos cuando me sean canjeados o cuando la compañía me los requiera, responsabilizándome de los mismos bajo cualquier circunstancia salvo por caso fortuito o fuerza mayor. Acepto las sanciones establecidas por la empresa en caso de incumplimiento en cualquiera de las obligaciones relativas al equipo recibido.\n\nHaciéndome responsable del buen uso del mismo, y comprometiéndome a utilizarlo solo para lo necesario en la relación de las actividades de operaciones.";

      doc.font('Helvetica').fontSize(9.5).fillColor('#232323');
      const hClausula = doc.heightOfString(clausula, { width: 486, align: 'justify' });
      const yFirmaDeseado = 775 - 85;
      if (y + hClausula + 90 > yFirmaDeseado) y = yFirmaDeseado - hClausula - 20;

      const yFirma = y + hClausula + 20;
      doc.roundedRect(45, y, 500, yFirma - y + 95, 7).stroke('#b4b4b4');
      doc.text(clausula, 53, y + 7, { width: 486, align: 'justify', lineGap: 2 });

      doc.font('Helvetica-Bold').fontSize(10).text("RECIBIDO POR:", 95, yFirma +10);
      doc.text("ENTREGADO POR:", 365, yFirma + 10);

      doc.font('Helvetica').text("____________________________", 60, yFirma + 50);
      doc.text("____________________________", 340, yFirma + 50);

      doc.fontSize(9).fillColor('#232323');
      doc.text(data.empleado_nombre || '__________', 110, yFirma + 70, { width: 120, align: 'center' });
      doc.text(data.cargo || 'Colaborador que recibe', 110, yFirma + 80, { width: 120, align: 'center' });
      doc.text(data.resp_nombre || '__________', 375, yFirma + 70, { width: 120, align: 'center' });
      doc.text(data.resp_puesto || 'Responsable de sistemas', 375, yFirma + 80, { width: 120, align: 'center' });
    }

    // === FOOTER EN TODAS LAS PÁGINAS ===
    const total = doc.bufferedPageRange().count;
    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);
      const y = 720;
      doc.roundedRect(40, y, 520, 25, 7).stroke('#b4b4b4');
      doc.font('Helvetica').fontSize(8).fillColor('#232323')
        .text("MARRIOTT CONFIDENTIAL AND PROPRIETARY INFORMATION", 50, y + 7, { width: 400, align: 'left' })
        .text(`Pág ${i + 1} de ${total}`, 400, y + 7, { width: 120, align: 'right' });
    }

    doc.end();
  });
};
