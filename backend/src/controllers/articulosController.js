const db = require('../config/db');

// Obtener todos los artículos
exports.getAll = (req, res) => {
  db.query(
    `SELECT articulos.*, empleados.nombre AS empleado_nombre, tipos_articulo.nombre AS tipo_nombre
     FROM articulos
     LEFT JOIN empleados ON articulos.empleado_id = empleados.id
     LEFT JOIN tipos_articulo ON articulos.tipo_id = tipos_articulo.id`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener artículos' });
      res.json(results);
    }
  );
};

// Crear nuevo artículo
exports.create = (req, res) => {
  const { id, tipo_id, marca, modelo, numero_serie, estado, hotel, empleado_id, costo, descripcion } = req.body;
  if (!id || !tipo_id || !marca || !modelo || !numero_serie || !estado || !hotel || !costo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  db.query(
    'INSERT INTO articulos (id, tipo_id, marca, modelo, numero_serie, estado, hotel, empleado_id, costo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, tipo_id, marca.trim(), modelo.trim(), numero_serie.trim(), estado, hotel, empleado_id || null, costo, descripcion || null],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'ID o número de serie ya existe.' });
        return res.status(500).json({ error: 'Error al crear artículo' });
      }
      res.status(201).json({ id, ...req.body });
    }
  );
};

// Editar artículo (NO permite cambiar número de serie ni costo ni ID)
exports.update = (req, res) => {
  const { tipo_id, marca, modelo, estado, hotel, empleado_id, descripcion } = req.body;
  const { id } = req.params;
  db.query(
    'UPDATE articulos SET tipo_id=?, marca=?, modelo=?, estado=?, hotel=?, empleado_id=?, descripcion=? WHERE id=?',
    [tipo_id, marca.trim(), modelo.trim(), estado, hotel, empleado_id || null, descripcion || null, id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar artículo' });
      res.json({ id, ...req.body });
    }
  );
};

// Eliminar artículo
exports.delete = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM articulos WHERE id=?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar artículo' });
    res.status(204).send();
  });
};

// Obtener solo artículos disponibles para préstamo
exports.getDisponibles = (req, res) => {
  db.query(`
    SELECT a.*, t.nombre AS tipo_nombre, e.nombre AS empleado_nombre
    FROM articulos a
    LEFT JOIN tipos_articulo t ON a.tipo_id = t.id
    LEFT JOIN empleados e ON a.empleado_id = e.id
    WHERE a.estado = 'disponible'
  `, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener artículos disponibles' });
    res.json(results);
  });
};
