const db = require('../config/db');

// Obtener todos los préstamos con datos relacionados
exports.getAll = (req, res) => {
  db.query(`
    SELECT p.*, e.nombre AS empleado_nombre, e.numero_asociado, e.hotel AS hotel_empleado,
      GROUP_CONCAT(a.id) AS articulos_id,
      GROUP_CONCAT(a.marca) AS articulos_marca,
      GROUP_CONCAT(a.modelo) AS articulos_modelo,
      GROUP_CONCAT(a.numero_serie) AS articulos_numero_serie
    FROM prestamos p
    LEFT JOIN empleados e ON p.empleado_id = e.id
    LEFT JOIN prestamo_articulos pa ON pa.prestamo_id = p.id
    LEFT JOIN articulos a ON pa.articulo_id = a.id
    GROUP BY p.id
    ORDER BY p.id DESC
  `, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener préstamos' });
    res.json(results);
  });
};

// Crear nuevo préstamo con snapshot para PDF seguro
exports.create = (req, res) => {
  const {
    empleado_id,
    usuario_entrega,
    fecha_prestamo,
    fecha_vencimiento,
    periodo,
    comentarios,
    articulos
  } = req.body;

  if (!empleado_id || !usuario_entrega || !fecha_prestamo || !periodo || !Array.isArray(articulos) || articulos.length === 0) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  // 1. Buscar el empleado (validar existencia + estatus + autopréstamo)
  db.query('SELECT * FROM empleados WHERE id = ?', [empleado_id], (errEmp, empRes) => {
    if (errEmp) return res.status(500).json({ error: 'Error al buscar empleado receptor' });
    if (empRes.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });

    const empleado = empRes[0];

    // Bloquea autopréstamo
    if (
      empleado.nombre &&
      usuario_entrega &&
      empleado.nombre.trim().toLowerCase() === usuario_entrega.trim().toLowerCase()
    ) {
      return res.status(403).json({ error: 'No puedes auto-prestarte artículos.' });
    }

    // Bloquea préstamo a INACTIVO
    if ((empleado.status || 'activo') !== 'activo') {
      return res.status(400).json({ error: 'No se puede prestar a un colaborador INACTIVO.' });
    }

    // --- Fecha de vencimiento si es “permanente”
    let fechaVencimientoFinal = fecha_vencimiento;
    if (periodo === "permanente") {
      const d = new Date(fecha_prestamo);
      d.setFullYear(d.getFullYear() + 1);
      fechaVencimientoFinal = d.toISOString().slice(0, 10);
    }

    const hotel = empleado.hotel;
    const prefix = hotel === "JW Marriott" ? "JW" : hotel === "Marriott Resort" ? "MR" : "XX";

    // 2. Contar préstamos existentes para folio por hotel
    db.query(`
      SELECT COUNT(*) AS total FROM prestamos p
      INNER JOIN empleados e ON p.empleado_id = e.id
      WHERE e.hotel = ?`, [hotel], (err2, countRes) => {
        if (err2) {
          return res.status(500).json({ error: 'Error al contar préstamos' });
        }
        const nextFolio = String(countRes[0].total + 1).padStart(4, "0");
        const folio = `${prefix}-${nextFolio}`;

        // 3. Insertar préstamo
        db.query(
          'INSERT INTO prestamos (folio, empleado_id, usuario_entrega, fecha_prestamo, fecha_vencimiento, periodo, comentarios, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [folio, empleado_id, usuario_entrega, fecha_prestamo, fechaVencimientoFinal, periodo, comentarios || null, 'activo'],
          (err3, result) => {
            if (err3) {
              return res.status(500).json({ error: 'Error al crear préstamo' });
            }
            const prestamoId = result.insertId;

            // 4. Relacionar artículos y cambiarlos a "ocupado"
            const queries = articulos.map(id =>
              new Promise((resolve, reject) => {
                db.query('INSERT INTO prestamo_articulos (prestamo_id, articulo_id) VALUES (?, ?)', [prestamoId, id], (e) => {
                  if (e) return reject(e);
                  db.query('UPDATE articulos SET estado = "ocupado", empleado_id = ? WHERE id = ?', [empleado_id, id], (e2) => {
                    if (e2) return reject(e2);
                    resolve();
                  });
                });
              })
            );

            Promise.all(queries)
              .then(() => {
                // 5. Crear snapshot del resguardo
                db.query(
                  `
                  SELECT 
                    p.id AS prestamo_id, p.folio, p.fecha_prestamo, p.fecha_vencimiento, p.periodo, p.comentarios,
                    e.nombre AS empleado_nombre, e.cargo AS empleado_cargo, e.departamento AS empleado_departamento, 
                    e.numero_asociado AS empleado_numero_asociado, e.hotel AS empleado_hotel,
                    p.usuario_entrega AS responsable_nombre,
                    'Responsable de sistemas' AS responsable_puesto
                  FROM prestamos p
                  LEFT JOIN empleados e ON p.empleado_id = e.id
                  WHERE p.id = ?
                  `,
                  [prestamoId],
                  (err4, snapshotDataArr) => {
                    if (err4 || !snapshotDataArr.length) {
                      return res.status(201).json({ message: 'Préstamo registrado correctamente.', prestamoId, folio });
                    }
                    const snapshot = snapshotDataArr[0];
                    db.query(
                      `SELECT a.id, t.nombre as tipo, a.marca, a.modelo, a.numero_serie, a.descripcion, a.costo 
                       FROM prestamo_articulos pa 
                       JOIN articulos a ON pa.articulo_id = a.id
                       JOIN tipos_articulo t ON a.tipo_id = t.id
                       WHERE pa.prestamo_id = ?`,
                      [prestamoId],
                      (err5, articulosRows) => {
                        const articulos_json = JSON.stringify(articulosRows || []);
                        db.query(
                          `INSERT INTO resguardo_snapshots 
                           (prestamo_id, empleado_nombre, empleado_cargo, empleado_departamento, empleado_numero_asociado, empleado_hotel, responsable_nombre, responsable_puesto, articulos_json, fecha_prestamo, fecha_vencimiento, periodo, comentarios, folio)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                          [
                            prestamoId, snapshot.empleado_nombre, snapshot.empleado_cargo, snapshot.empleado_departamento,
                            snapshot.empleado_numero_asociado, snapshot.empleado_hotel, snapshot.responsable_nombre,
                            snapshot.responsable_puesto, articulos_json, snapshot.fecha_prestamo, snapshot.fecha_vencimiento,
                            snapshot.periodo, snapshot.comentarios, snapshot.folio
                          ],
                          (err6) => {
                            if (err6) {
                              // si falla snapshot, igual se creó el préstamo
                              console.error('No se guardó snapshot del resguardo:', err6);
                            }
                            res.status(201).json({ message: 'Préstamo registrado correctamente.', prestamoId, folio });
                          }
                        );
                      }
                    );
                  }
                );
              })
              .catch(() => res.status(500).json({ error: 'Error al relacionar artículos' }));
          }
        );
      }
    );
  });
};

exports.finalizar = (req, res) => {
  const { prestamoId } = req.params;

  // 1. Marcar el préstamo como finalizado y poner la fecha de devolución
  db.query(
    'UPDATE prestamos SET estado = "finalizado", fecha_devolucion = NOW() WHERE id = ?',
    [prestamoId],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al finalizar el préstamo' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Préstamo no encontrado' });

      // 2. Buscar los artículos relacionados y liberarlos
      db.query(
        'SELECT articulo_id FROM prestamo_articulos WHERE prestamo_id = ?',
        [prestamoId],
        (err2, rows) => {
          if (err2) return res.status(500).json({ error: 'Error al buscar artículos del préstamo' });
          const promises = rows.map(row =>
            new Promise((resolve, reject) => {
              db.query('UPDATE articulos SET estado = "disponible", empleado_id = NULL WHERE id = ?', [row.articulo_id], (e) => {
                if (e) return reject(e);
                resolve();
              });
            })
          );
          Promise.all(promises)
            .then(() => res.json({ message: 'Préstamo finalizado y artículos liberados' }))
            .catch(() => res.status(500).json({ error: 'Error al liberar artículos' }));
        }
      );
    }
  );
};
