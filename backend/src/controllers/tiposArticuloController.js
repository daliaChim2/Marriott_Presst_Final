const db = require('../config/db');

// Obtener todos los tipos de artículo
exports.getAll = (req, res) => {
  db.query('SELECT * FROM tipos_articulo', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tipos de artículo' });
    res.json(results);
  });
};

// Crear nuevo tipo de artículo
exports.create = (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre del tipo de artículo' });

  db.query(
    'INSERT INTO tipos_articulo (nombre) VALUES (?)',
    [nombre.trim()],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY')
          return res.status(409).json({ error: 'Tipo ya existe.' });
        return res.status(500).json({ error: 'Error al crear tipo de artículo' });
      }
      res.status(201).json({ id: result.insertId, nombre });
    }
  );
};
