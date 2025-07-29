// src/models/articuloModel.js
const pool = require('../config/db');

const ArticuloModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM articulos');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM articulos WHERE id = ?', [id]);
    return rows[0];
  },

  async create(articulo) {
    const { id, tipo_id, marca, modelo, numero_serie, estado, hotel, empleado_id, costo, descripcion } = articulo;
    const [result] = await pool.query(
      `INSERT INTO articulos (id, tipo_id, marca, modelo, numero_serie, estado, hotel, empleado_id, costo, descripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tipo_id, marca, modelo, numero_serie, estado, hotel, empleado_id, costo, descripcion]
    );
    return result;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM articulos WHERE id = ?', [id]);
    return result;
  }
};

module.exports = ArticuloModel;
