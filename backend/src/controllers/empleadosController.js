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
  const { nombre, hotel, cargo, departamento, numero_asociado, enterpasssid } = req.body;
  if (!nombre || !numero_asociado) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  db.query(
    'INSERT INTO empleados (nombre, hotel, cargo, departamento, numero_asociado, enterpasssid) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre.trim(), hotel?.trim(), cargo?.trim(), departamento?.trim(), numero_asociado.trim(), enterpasssid?.trim()],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Número de asociado ya existe.' });
        return res.status(500).json({ error: 'Error al crear empleado' });
      }
      res.status(201).json({ id: result.insertId, ...req.body });
    }
  );
};

// Editar empleado
exports.update = (req, res) => {
  const { nombre, hotel, cargo, departamento, numero_asociado, enterpasssid } = req.body;
  const { id } = req.params;
  db.query(
    'UPDATE empleados SET nombre=?, hotel=?, cargo=?, departamento=?, numero_asociado=?, enterpasssid=? WHERE id=?',
    [nombre.trim(), hotel?.trim(), cargo?.trim(), departamento?.trim(), numero_asociado.trim(), enterpasssid?.trim(), id],
    (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Número de asociado ya existe.' });
        return res.status(500).json({ error: 'Error al actualizar empleado' });
      }
      res.json({ id, ...req.body });
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
