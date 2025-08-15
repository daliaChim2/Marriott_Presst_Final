const db = require('../config/db');

// Obtener todos los empleados
exports.getAll = (req, res) => {
  db.query('SELECT * FROM empleados', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener empleados' });
    res.json(results);
  });
};

// Crear nuevo empleado
exports.create = (req, res) => {
  const { nombre, hotel, cargo, departamento, numero_asociado, enterpasssid, status } = req.body;
  if (!nombre || !numero_asociado) return res.status(400).json({ error: 'Faltan campos obligatorios' });

  const statusFinal = (status === 'inactivo' || status === 'activo') ? status : 'activo';

  db.query(
    'INSERT INTO empleados (nombre, hotel, cargo, departamento, numero_asociado, enterpasssid, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre.trim(), hotel?.trim(), cargo?.trim(), departamento?.trim(), numero_asociado.trim(), enterpasssid?.trim() || '', statusFinal],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Número de asociado ya existe.' });
        return res.status(500).json({ error: 'Error al crear empleado' });
      }
      res.status(201).json({ id: result.insertId, ...req.body, status: statusFinal });
    }
  );
};

// Editar empleado (impide pasar a inactivo si tiene préstamos activos)
exports.update = (req, res) => {
  const { nombre, hotel, cergo, departamento, numero_asociado, enterpasssid, status } = req.body;
  const { id } = req.params;

  // Si intentan poner INACTIVO, primero verificar préstamos activos
  const quiereInactivar = status === 'inactivo';

  const continuarActualizacion = () => {
    // Validar unicidad de # asociado
    db.query(
      'SELECT id FROM empleados WHERE numero_asociado = ? AND id <> ?',
      [numero_asociado.trim(), id],
      (e1, r1) => {
        if (e1) return res.status(500).json({ error: 'Error al validar # asociado' });
        if (r1.length > 0) return res.status(409).json({ error: 'Número de asociado ya existe.' });

        const campos = [nombre.trim(), hotel?.trim(), cargo?.trim(), departamento?.trim(), numero_asociado.trim(), enterpasssid?.trim() || ''];
        let sql = 'UPDATE empleados SET nombre=?, hotel=?, cargo=?, departamento=?, numero_asociado=?, enterpasssid=?';
        if (status === 'activo' || status === 'inactivo') {
          sql += ', status=?';
          campos.push(status);
        }
        sql += ' WHERE id=?';
        campos.push(id);

        db.query(sql, campos, (err) => {
          if (err) return res.status(500).json({ error: 'Error al actualizar empleado' });
          res.json({ id, ...req.body });
        });
      }
    );
  };

  if (!quiereInactivar) {
    return continuarActualizacion();
  }

  // Verificar préstamos activos antes de inactivar
  db.query(
    `SELECT COUNT(*) AS total FROM prestamos WHERE empleado_id=? AND estado='activo'`,
    [id],
    (e, r) => {
      if (e) return res.status(500).json({ error: 'Error al validar préstamos activos' });
      if (r[0].total > 0) {
        return res.status(409).json({ error: 'No se puede cambiar a INACTIVO: el colaborador tiene prestamos activos' });
      }
      continuarActualizacion();
    }
  );
};

// Eliminar empleado
exports.delete = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM empleados WHERE id=?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar empleado' });
    res.status(204).send();
  });
};

// Nueva función: carga masiva de empleados ------------------------------------------------>
exports.bulkUpload = (req, res) => {
  const { rows } = req.body;
  const { mode } = req.query; // 'upsert' o 'insert'

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No hay datos para insertar.' });
  }

  // Normalizar status
  const normalizeStatus = (status) => {
    return (status === 'inactivo' || status === 'activo') ? status : 'activo';
  };

  try {
    // Construir consultas en lotes...
    const values = rows.map(emp => [
      emp.nombre?.trim() || '',
      emp.hotel?.trim() || '',
      emp.cargo?.trim() || '',
      emp.departamento?.trim() || '',
      emp.numero_asociado?.trim() || '',
      emp.enterpasssid?.trim() || '',
      normalizeStatus(emp.status)
    ]);

    let sql;

    if (mode === 'upsert') {
      sql = `
        INSERT INTO empleados (nombre, hotel, cargo, departamento, numero_asociado, enterpasssid, status)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          nombre=VALUES(nombre),
          hotel=VALUES(hotel),
          cargo=VALUES(cargo),
          departamento=VALUES(departamento),
          enterpasssid=VALUES(enterpasssid),
          status=VALUES(status)
      `;
    } else {
      sql = `
        INSERT INTO empleados (nombre, hotel, cargo, departamento, numero_asociado, enterpasssid, status)
        VALUES ?
      `;
    }

    db.query(sql, [values], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'error al presentar carga masiva', details: err.message });
      }

      res.json({
        message: 'Carga masiva completada',
        total: rows.length,
        affectedRows: result.affectedRows
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en carga masiva', details: err.message });
  }
};

