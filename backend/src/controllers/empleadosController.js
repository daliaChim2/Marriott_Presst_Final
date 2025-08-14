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
  const { nombre, hotel, cargo, departamento, numero_asociado, enterpasssid, status } = req.body;
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
        return res.status(409).json({ error: 'No se puede cambiar a INACTIVO: el colaborador tiene préstamos activos.' });
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
