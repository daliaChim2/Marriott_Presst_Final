const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM empleados_sistemas', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener empleados de sistemas' });
    res.json(results);
  });
};
