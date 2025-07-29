const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor corriendo en el puerto ${PORT}`);
});

const empleadosRoutes = require('./routes/empleadosRoutes');
app.use('/api/empleados', empleadosRoutes);

const articulosRoutes = require('./routes/articulosRoutes');
app.use('/api/articulos', articulosRoutes);

const tiposArticuloRoutes = require('./routes/tiposArticuloRoutes');
app.use('/api/tipos-articulo', tiposArticuloRoutes);

const marcasRoutes = require('./routes/marcasRoutes');
app.use('/api/marcas', marcasRoutes);

const prestamosRoutes = require('./routes/prestamosRoutes');
app.use('/api/prestamos', prestamosRoutes);

const resguardosRoutes = require('./routes/resguardosRoutes');
app.use('/api/resguardos', resguardosRoutes);

const empleadosSistemasRoutes = require('./routes/empleadosSistemasRoutes');
app.use('/api/empleados-sistemas', empleadosSistemasRoutes);

