const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const vehiculoRoutes = require('./src/routes/vehiculoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('¡El servidor del SGMV está funcionando!');
});

// Registrar todas las rutas
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/notifications', require('./src/routes/notificationRoutes')); // <-- AÑADIR ESTA LÍNEA

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});