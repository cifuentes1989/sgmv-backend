const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/config/db');

const app = express();

app.use(cors());
app.use(express.json());

// --- IMPORTAR RUTAS ---
const authRoutes = require('./src/routes/authRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');
const vehiculoRoutes = require('./src/routes/vehiculoRoutes'); // <--- Importante
const adminRoutes = require('./src/routes/adminRoutes');       // <--- Importante

// --- USAR RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/vehiculos', vehiculoRoutes); // <--- ESTO ARREGLA EL 404 DE VEHÍCULOS
app.use('/api/admin', adminRoutes);       // <--- ESTO ARREGLA EL 404 DE USUARIOS Y ADMIN

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
// Actualización para producción v2