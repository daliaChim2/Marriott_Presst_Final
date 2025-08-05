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

// Editar artículo (solo permite modificar nombre/id, estado, hotel, costo y descripcion)
exports.update = (req, res) => {
  const { id } = req.params;
  // Solo los campos permitidos:
  const camposPermitidos = ["id", "estado", "hotel", "costo", "descripcion"];
  const updates = [];
  const valores = [];
  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) {
      updates.push(`${campo}=?`);
      valores.push(req.body[campo]);
    }
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No hay campos válidos para actualizar.' });
  }
  valores.push(id);
  db.query(
    `UPDATE articulos SET ${updates.join(', ')} WHERE id=?`,
    valores,
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
