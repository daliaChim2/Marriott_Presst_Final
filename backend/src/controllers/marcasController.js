const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM marcas', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener marcas' });
    res.json(results);
  });
};
exports.create = (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la marca' });
  db.query('INSERT INTO marcas (nombre) VALUES (?)', [nombre.trim()], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'La marca ya existe.' });
      return res.status(500).json({ error: 'Error al crear marca' });
    }
    res.status(201).json({ id: result.insertId, nombre });
  });
};
