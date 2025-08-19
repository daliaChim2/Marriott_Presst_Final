// backend/scripts/finalizar_vencidos.js

require('dotenv').config();
const db = require('../src/config/db');

console.log('--- Comenzando proceso de finalización automática de préstamos vencidos ---');

db.query(`
  SELECT id, folio, fecha_vencimiento 
  FROM prestamos 
  WHERE estado = 'activo' AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento <= CURDATE()
`, (err, prestamos) => {
  if (err) {
    console.error('Error al buscar préstamos vencidos:', err);
    process.exit(1);
  }

  if (prestamos.length === 0) {
    console.log('No hay préstamos vencidos para finalizar.');
    process.exit(0);
  }

  let procesados = 0;

  prestamos.forEach(prestamo => {
    const { id, folio } = prestamo;
    // 1. Marcar como finalizado y poner fecha_devolucion
    db.query(
      `UPDATE prestamos SET estado = 'finalizado', fecha_devolucion = CURDATE() WHERE id = ?`,
      [id],
      err2 => {
        if (err2) return console.error(`Error actualizando préstamo ${folio}:`, err2);

        // 2. Liberar artículos asociados
        db.query(
          `SELECT articulo_id FROM prestamo_articulos WHERE prestamo_id = ?`,
          [id],
          (err3, arts) => {
            if (err3) return console.error(`Error buscando artículos de préstamo ${folio}:`, err3);

            let updates = arts.map(row => new Promise((resolve, reject) => {
              db.query(
                `UPDATE articulos SET estado = 'disponible', empleado_id = NULL WHERE id = ?`,
                [row.articulo_id],
                err4 => err4 ? reject(err4) : resolve()
              );
            }));

            Promise.all(updates)
              .then(() => {
                procesados++;
                console.log(` Préstamo ${folio} finalizado automáticamente (${id})`);
                if (procesados === prestamos.length) {
                  console.log('--- Proceso completado. ---');
                  process.exit(0);
                }
              })
              .catch(e => console.error(`Error liberando artículos de préstamo ${folio}:`, e));
          }
        );
      }
    );
  });
});
// ejecutar -> node scripts/finalizar_vencidos.js para checar los prestamos vencidos(esto desde la carpeta del backend)
