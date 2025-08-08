const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- RUTAS ---
const authRoutes = require('./routes/authRoutes');
const empleadosRoutes = require('./routes/empleadosRoutes');
const articulosRoutes = require('./routes/articulosRoutes');
const tiposArticuloRoutes = require('./routes/tiposArticuloRoutes');
const marcasRoutes = require('./routes/marcasRoutes');
const prestamosRoutes = require('./routes/prestamosRoutes');
const resguardosRoutes = require('./routes/resguardosRoutes');
const empleadosSistemasRoutes = require('./routes/empleadosSistemasRoutes');

// --- USO DE RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/articulos', articulosRoutes);
app.use('/api/tipos-articulo', tiposArticuloRoutes);
app.use('/api/marcas', marcasRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/resguardos', resguardosRoutes);
app.use('/api/empleados-sistemas', empleadosSistemasRoutes);

// --- CRON Y FINALIZAR PRÉSTAMOS VENCIDOS ---
const cron = require('node-cron');
const db = require('./config/db');

// FUNCIÓN para finalizar préstamos vencidos
function finalizarPrestamosVencidos() {
  const hoy = new Date().toISOString().slice(0, 10);
  db.query(
    `UPDATE prestamos
     SET estado = 'finalizado', fecha_devolucion = CURDATE()
     WHERE estado = 'activo' AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento <= ?`,
    [hoy],
    (err, result) => {
      if (err) {
        console.error('[CRON FinalizarPréstamos] ERROR:', err);
      } else if (result.affectedRows > 0) {
        console.log(`[CRON FinalizarPréstamos] ${result.affectedRows} préstamo(s) finalizado(s) automáticamente por vencimiento (${hoy})`);
      } else {
        console.log(`[CRON FinalizarPréstamos] No hay préstamos vencidos para finalizar hoy (${hoy})`);
      }
      
    }
  );
}

// Ejecuta al INICIAR el backend (por si lo reinician a cualquier hora)
finalizarPrestamosVencidos();

// Cron: ejecuta "DIARIAMENTE" a las 7:00am (el horario se puede cambiar)
cron.schedule('0 7 * * *', finalizarPrestamosVencidos);

// --- RUTA manual para ADMIN: finalizar vencidos forzado ---
app.post('/api/prestamos/finalizar-vencidos', (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  db.query(
    `UPDATE prestamos
     SET estado = 'finalizado', fecha_devolucion = CURDATE()
     WHERE estado = 'activo' AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento <= ?`,
    [hoy],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al finalizar préstamos vencidos.' });
      res.json({ message: `Finalizados ${result.affectedRows} préstamos vencidos hasta ${hoy}` });
    }
  );
});

// --- SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
