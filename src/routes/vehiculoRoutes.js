const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const vehiculoController = require('../controllers/vehiculoController');

// Verificación de seguridad:
if (!vehiculoController) {
    console.error("❌ ERROR: vehiculoController no se importó correctamente.");
}

router.get('/', authMiddleware, vehiculoController.obtenerVehiculos);
router.post('/', authMiddleware, vehiculoController.crearVehiculo);
router.get('/estado-flota', authMiddleware, vehiculoController.obtenerEstadoFlota);

// --- ESTA LÍNEA ES VITAL ---
module.exports = router;