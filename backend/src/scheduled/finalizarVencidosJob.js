// backend/src/scheduled/finalizarVencidosJob.js
require('dotenv').config();
const cron = require('node-cron');
const db = require('../config/db');

function finalizarVencidos() {
  db.query(`
    SELECT id, folio, fecha_vencimiento 
    FROM prestamos 
    WHERE estado = 'activo' AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento <= CURDATE()
  `, (err, prestamos) => {
    if (err) return console.error('[CRON] Error al buscar préstamos vencidos:', err);

    if (prestamos.length === 0) {
      console.log('[CRON] No hay préstamos vencidos.');
      return;
    }

    prestamos.forEach(prestamo => {
      const { id, folio } = prestamo;
      db.query(
        `UPDATE prestamos SET estado = 'finalizado', fecha_devolucion = CURDATE() WHERE id = ?`,
        [id],
        err2 => {
          if (err2) return console.error(`[CRON] Error actualizando préstamo ${folio}:`, err2);

          db.query(
            `SELECT articulo_id FROM prestamo_articulos WHERE prestamo_id = ?`,
            [id],
            (err3, arts) => {
              if (err3) return console.error(`[CRON] Error buscando artículos de préstamo ${folio}:`, err3);

              let updates = arts.map(row => new Promise((resolve, reject) => {
                db.query(
                  `UPDATE articulos SET estado = 'disponible', empleado_id = NULL WHERE id = ?`,
                  [row.articulo_id],
                  err4 => err4 ? reject(err4) : resolve()
                );
              }));

              Promise.all(updates)
                .then(() => {
                  console.log(`[CRON] ✅ Préstamo ${folio} finalizado automáticamente (${id})`);
                })
                .catch(e => console.error(`[CRON] Error liberando artículos de préstamo ${folio}:`, e));
            }
          );
        }
      );
    });
  });
}

// ---- Configura el horario CRON ----
// Este ejemplo: “0 6 * * *” → todos los días a las 6:00 AM
cron.schedule('0 6 * * *', finalizarVencidos, {
  timezone: 'America/Mexico_City' 
});

console.log('[CRON] Programador activo: finalizarVencidos se ejecutará todos los días a las 6:00 AM');
