const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const vehiculoController = require('../controllers/vehiculoController');

// Verificación de seguridad:
if (!vehiculoController) {
    console.error("❌ ERROR: vehiculoController no se importó correctamente.");
}

// Rutas existentes
router.get('/', authMiddleware, vehiculoController.obtenerVehiculos);
router.post('/', authMiddleware, vehiculoController.crearVehiculo);
router.get('/estado-flota', authMiddleware, vehiculoController.obtenerEstadoFlota);

// --- NUEVA RUTA PARA CAMBIAR LA SEDE ---
// Usamos PUT porque estamos actualizando un dato existente
router.put('/:id/sede', authMiddleware, vehiculoController.actualizarSedeVehiculo);

// --- ESTA LÍNEA ES VITAL ---
module.exports = router;