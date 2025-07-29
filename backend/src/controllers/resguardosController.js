// resguardosController.js

const db = require('../config/db');
const PDFDocument = require('pdfkit');
const path = require('path');

function formatDate(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
const mx = n => n ? `$${parseFloat(n).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}` : '-';

exports.generarPDF = (req, res) => {
  const prestamoId = req.params.prestamoId;

  db.query(`
    SELECT 
      p.*, 
      e.nombre AS empleado_nombre, e.cargo, e.departamento, e.numero_asociado, e.hotel,
      es.nombre AS entregado_nombre, es.puesto AS entregado_puesto,
      -- si no hay entregado_por_id, usar usuario_entrega
      IFNULL(es.nombre, p.usuario_entrega) AS resp_nombre,
      IFNULL(es.puesto, 'Responsable de sistemas') AS resp_puesto,
      GROUP_CONCAT(a.id) AS articulos_id,
      GROUP_CONCAT(a.marca) AS articulos_marca,
      GROUP_CONCAT(a.modelo) AS articulos_modelo,
      GROUP_CONCAT(a.numero_serie) AS articulos_numero_serie,
      GROUP_CONCAT(a.descripcion) AS articulos_descripcion,
      GROUP_CONCAT(a.costo) AS articulos_costo,
      GROUP_CONCAT(ta.nombre) AS articulos_tipo
    FROM prestamos p
    LEFT JOIN empleados e ON p.empleado_id = e.id
    LEFT JOIN empleados_sistemas es ON p.entregado_por_id = es.id
    LEFT JOIN prestamo_articulos pa ON pa.prestamo_id = p.id
    LEFT JOIN articulos a ON pa.articulo_id = a.id
    LEFT JOIN tipos_articulo ta ON a.tipo_id = ta.id
    WHERE p.id = ?
    GROUP BY p.id
  `, [prestamoId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    const data = results[0];

    // ---- CREACIÓN DEL PDF ----
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="resguardo_${data.folio || data.id}.pdf"`);

    // LOGO y encabezado
    const logoPath = (data.hotel || '').toLowerCase().includes('jw')
      ? path.resolve(__dirname, '../assets/logo_JWmarriott.png')
      : path.resolve(__dirname, '../assets/logo_marriott.png');
    try { doc.image(logoPath, 490, 37, { width: 58 }); } catch {}

    // Título, folio y tipo
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#A71D31')
      .text('RESGUARDO DE EQUIPOS', 45, 48, { width: 350, align: 'left' });
    doc.font('Helvetica').fontSize(11).fillColor('#232323');
    doc.text(`FOLIO: ${data.folio || data.id}`, 400, 48, { width: 180, align: 'right' });
    doc.text(`TIPO: ${data.periodo === 'permanente' ? 'Permanente' : 'Por periodo'}`, 400, 65, { width: 180, align: 'right' });

    // Fechas y departamento abajo
    doc.fontSize(11).fillColor('#232323');
    doc.text(`DEPARTAMENTO: ${data.departamento || 'Sistemas'}`, 45, 89, { width: 220 });
    doc.fontSize(10);
    doc.text(`FECHA INICIAL: ${formatDate(data.fecha_prestamo)}`, 260, 89, { width: 120, align: 'left' });
    doc.text(`FECHA FIN: ${formatDate(data.fecha_vencimiento)}`, 390, 89, { width: 140, align: 'left' });

    // === COMENTARIOS ===
    let y = 115;
    const comentarios = data.comentarios || "";
    doc.roundedRect(45, y, 500, 35, 7).fillAndStroke('#ffe1ec', '#b4b4b4');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#c74263').text('COMENTARIOS:', 60, y + 10, { continued: true });
    doc.font('Helvetica').fontSize(10).fillColor('#A71D31')
      .text(comentarios, 160, y + 10, { width: 370 });

    y += 45;

    // === TABLA DE ARTÍCULOS ===
    const tipos = data.articulos_tipo?.split(',') || [];
    const marcas = data.articulos_marca?.split(',') || [];
    const modelos = data.articulos_modelo?.split(',') || [];
    const numeros = data.articulos_numero_serie?.split(',') || [];
    const descripciones = data.articulos_descripcion?.split(',') || [];
    const costos = data.articulos_costo?.split(',') || [];
    const tableHeight = Math.max(30, tipos.length * 18);
    doc.roundedRect(45, y, 500, tableHeight + 25, 7).stroke('#b4b4b4');
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#232323');
    doc.text('ARTÍCULO', 50, y + 8, { width: 60, align: 'center' });
    doc.text('MARCA', 110, y + 8, { width: 75, align: 'center' });
    doc.text('MODELO', 185, y + 8, { width: 75, align: 'center' });
    doc.text('SERIE', 260, y + 8, { width: 85, align: 'center' });
    doc.text('DESCRIPCIÓN', 345, y + 8, { width: 120, align: 'center' });
    doc.text('VALOR (MXN)', 465, y + 8, { width: 75, align: 'center' });
    doc.font('Helvetica').fontSize(10).fillColor('#232323');
    let yArt = y + 26;
    for (let i = 0; i < tipos.length; i++) {
      doc.text(tipos[i] || '-', 50, yArt, { width: 60, align: 'center' });
      doc.text(marcas[i] || '-', 110, yArt, { width: 75, align: 'center' });
      doc.text(modelos[i] || '-', 185, yArt, { width: 75, align: 'center' });
      doc.text(numeros[i] || '-', 260, yArt, { width: 85, align: 'center' });
      doc.text(descripciones[i] || '-', 345, yArt, { width: 120, align: 'center' });
      doc.text(mx(costos[i]), 465, yArt, { width: 75, align: 'center' });
      yArt += 18;
    }
    y = yArt + 10;

    // === CLÁUSULA LEGAL + FIRMAS ===
    const legalText =
      "Hago constar que el equipo lo recibo en condiciones requeridas para el trabajo, por lo que me obligo en términos del ARTÍCULO 134 FRACCIÓN VI Y 135 FRACCIONES III Y IX DE LA LEY FEDERAL DEL TRABAJO a conservarlos en buen estado, a utilizarlos para lo que están asignados dentro de las funciones a mi cargo; así como restituirlos cuando me sean canjeados o cuando la compañía me los requiera, responsabilizándome de los mismos bajo cualquier circunstancia salvo por caso fortuito o fuerza mayor.\n\nAcepto las sanciones establecidas por la empresa en caso de incumplimiento en cualquiera de las obligaciones relativas al equipo recibido.\n\nHaciéndome responsable del buen uso del mismo, y comprometiéndome a utilizarlo solo para lo necesario en la relación de las actividades de operaciones.";
    doc.font('Helvetica').fontSize(9.5).fillColor('#232323');
    const textWidth = 486;
    const legalTextOptions = { width: textWidth, align: 'justify', lineGap: 2 };
    const textHeight = doc.heightOfString(legalText, legalTextOptions);

    // Espacio para la caja legal y firmas separadas
    const minFirmaSpace = 142; // 5cm
    let yClausula = y;
    let yFirma = yClausula + textHeight + 20;
    if (yFirma < yClausula + minFirmaSpace) yFirma = yClausula + minFirmaSpace;

    doc.roundedRect(45, yClausula, 500, yFirma - yClausula + 72, 7).stroke('#b4b4b4'); // caja legal completa
    doc.text(legalText, 53, yClausula + 7, legalTextOptions);

    // FIRMAS separadas 5cm debajo de la última línea de texto
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#232323');
    doc.text("RECIBIDO POR:", 95, yFirma);
    doc.text("ENTREGADO POR:", 365, yFirma);

    doc.font('Helvetica').fontSize(10);
    doc.text("____________________________", 60, yFirma + 18);
    doc.text("____________________________", 340, yFirma + 18);

    // Nombres y puestos
    doc.fontSize(9).fillColor('#232323');
    doc.text(data.empleado_nombre || '__________', 115, yFirma + 34, { width: 120, align: 'center' });
    doc.text(data.cargo || 'Colaborador que recibe', 115, yFirma + 42, { width: 120, align: 'center' });
    doc.text(data.resp_nombre || '__________', 375, yFirma + 34, { width: 120, align: 'center' });
    doc.text(data.resp_puesto || 'Responsable de sistemas', 375, yFirma + 42, { width: 120, align: 'center' });

    // === FOOTER y paginación ===
    doc.font('Helvetica').fontSize(8).fillColor('#888');
    doc.text("MARRIOTT CONFIDENTIAL AND PROPRIETARY INFORMATION", 45, 800, { align: 'center', width: 500 });
    doc.text(`Pág 1 de 1`, 495, 800, { align: 'right', width: 50 });

    doc.end();
    doc.pipe(res);
  });
};
