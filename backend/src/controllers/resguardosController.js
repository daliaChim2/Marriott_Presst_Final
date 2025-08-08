// src/controllers/prestamosController.js
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const path = require('path');
const { PassThrough } = require('stream');
const R = 532;
const L = 40;

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

    const doc = new PDFDocument({ size: 'LETTER', margin: 17, bufferPages: true });
    doc.pipe(stream);
    stream.pipe(res);

    const articulos = data.articulos || [];
    const porPagina = 10;
    const totalPaginas = Math.ceil(articulos.length / porPagina) || 1;

    const drawHeader = () => {
      const headerX = 40, headerY = 40, headerW = 526, headerH = 60;
      const col1 = headerX + 8, col2 = headerX + 80, col3 = headerX + 255, col4 = headerX + 390;

      doc.roundedRect(headerX, headerY, headerW, headerH, 7).stroke('#27BBF5'); // azul

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

      const yTabla = 120;
      const hFila = 20;
      const base = p * porPagina;
      const items = articulos.slice(base, base + porPagina);

      // === TABLA DE ARTÍCULOS ===
      doc.roundedRect(45, yTabla, 520, (hFila * porPagina) + 25, 7).stroke('#27BBF5');
      const columnas = [
        { label: 'ARTÍCULO', width: 70 },
        { label: 'MARCA', width: 75 },
        { label: 'MODELO', width: 70 },
        { label: 'SERIE', width: 90 },
        { label: 'DESCRIPCIÓN', width: 110 },
        { label: 'VALOR (MXN)', width: 75 }
      ];
      const xInicio = 50;
      let acumulado = xInicio;
      const posiciones = columnas.map(col => {
        const x = acumulado;
        acumulado += col.width;
        return x;
      });

      doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#232323');
      columnas.forEach((col, i) => {
        doc.text(col.label, posiciones[i], yTabla + 8, {
          width: col.width,
          align: 'center'
        });
      });

      doc.font('Helvetica').fontSize(10);
      let yItem = yTabla + 22;
      for (let i = 0; i < porPagina; i++) {
        const art = items[i];
        const datos = art ? [
          art.tipo, art.marca, art.modelo, art.numero_serie, art.descripcion, mx(art.costo)
        ] : Array(columnas.length).fill('— — — —');
        columnas.forEach((col, j) => {
          doc.text(datos[j], posiciones[j], yItem, {
            width: col.width,
            align: 'center'
          });
        });
        yItem += hFila;
      }

      // === COMENTARIOS ===
      let y = yItem + 30;
      const comentarios = data.comentarios || "";
      const hMin = 60;
      const hReal = doc.heightOfString(comentarios, { width: 390 }) + 18;
      const hComentarios = Math.max(hMin, hReal);

      doc.roundedRect(L, y, R, hComentarios, 7).stroke('#27BBF5'); // azul 
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#555').text('COMENTARIOS:', 53, y + 9);
      doc.font('Helvetica').fontSize(9).fillColor('#232323').text(comentarios, 140, y + 9, { width: 390 });

      // === CLÁUSULA Y FIRMAS ===
      y += hComentarios + 20;

      const clausulaParte1 = "Hago constar que el equipo lo recibo en condiciones requeridas para el trabajo, por lo que me obligo en términos del ";
      const clausulaNegrita = "ARTÍCULO 134 FRACCIÓN VI Y 135 FRACCIONES III Y IX DE LA LEY FEDERAL DEL TRABAJO";
      const clausulaParte2 = " a conservarlos en buen estado, a utilizarlos para lo que están asignados dentro de las funciones a mi cargo; así como restituirlos cuando me sean canjeados o cuando la compañía me los requiera, responsabilizándome de los mismos bajo cualquier circunstancia salvo por caso fortuito o fuerza mayor. Acepto las sanciones establecidas por la empresa en caso de incumplimiento en cualquiera de las obligaciones relativas al equipo recibido.\n\nHaciéndome responsable del buen uso del mismo, y comprometiéndome a utilizarlo solo para lo necesario en la relación de las actividades de operaciones.";

      const hClausula = doc.heightOfString(clausulaParte1 + clausulaNegrita + clausulaParte2, { width: 486, align: 'justify' });
      const yFirmaDeseado = 775 - 85;
      if (y + hClausula + 50 > yFirmaDeseado) y = yFirmaDeseado - hClausula - 20;

      const yFirma = y + hClausula + 60;

      doc.roundedRect(L, y, R, yFirma - y + 95, 7).stroke('#27BBF5'); // azul 
      doc.font('Helvetica').fontSize(9.5).fillColor('#232323');
      doc.text(clausulaParte1, 60, y + 7, {
        width: 486,
        align: 'justify',
        lineGap: 2,
        continued: true
      });
      doc.font('Helvetica-Bold');
      doc.text(clausulaNegrita, { continued: true });
      doc.font('Helvetica');
      doc.text(clausulaParte2);

      // === FIRMAS dentro del recuadro ===
      const firmaOffsetY = yFirma;
      const firmaLineY = firmaOffsetY + 50;
      const firmaNombreY = firmaLineY + 20;
      const firmaPuestoY = firmaNombreY + 12;

      const xIzq = 80;
      const xDer = 345;
      const anchoFirma = 160;

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text("RECIBIDO POR:", xIzq, firmaOffsetY);
      doc.text("ENTREGADO POR:", xDer, firmaOffsetY);

      doc.font('Helvetica').fontSize(10);
      doc.text("____________________________", xIzq, firmaLineY, { width: anchoFirma, align: 'center' });
      doc.text("____________________________", xDer, firmaLineY, { width: anchoFirma, align: 'center' });

      doc.fontSize(9).fillColor('#232323');
      doc.text(data.empleado_nombre || '__________', xIzq, firmaNombreY, { width: anchoFirma, align: 'center' });
      doc.text(data.cargo || 'Colaborador que recibe', xIzq, firmaPuestoY, { width: anchoFirma, align: 'center' });
      doc.text(data.resp_nombre || '__________', xDer, firmaNombreY, { width: anchoFirma, align: 'center' });
      doc.text(data.resp_puesto || 'Responsable de sistemas', xDer, firmaPuestoY, { width: anchoFirma, align: 'center' });
    }

    // === FOOTER EN TODAS LAS PÁGINAS ===
    const total = doc.bufferedPageRange().count;
    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);
      const y = 740;
      doc.roundedRect(L, y, R, 22, 8).stroke('#27BBF5'); // azul 
      doc.font('Helvetica').fontSize(8).fillColor('#232323');
      doc.text("MARRIOTT CONFIDENTIAL AND PROPRIETARY INFORMATION", L, y + 7, {
        width: R,
        align: 'center'
      });
      doc.text(`Pág ${i + 1} de ${total}`, L + R - 90, y + 7, {
        width: 80,
        align: 'right'
      });
    }

    doc.end();
  });
};