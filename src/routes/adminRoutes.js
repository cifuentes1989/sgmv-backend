const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Verificación de seguridad:
if (!adminController) {
    console.error("❌ ERROR: adminController no se importó correctamente.");
}

// Rutas base: /api/admin/...
router.post('/usuarios', authMiddleware, adminController.crearUsuario);
router.get('/usuarios', authMiddleware, adminController.obtenerUsuarios);
router.get('/informes/datos', authMiddleware, adminController.obtenerDatosInforme);
router.get('/solicitudes/todas', authMiddleware, adminController.obtenerTodasSolicitudes);

// --- ESTA LÍNEA ES LA QUE TE FALTABA O ESTABA MAL ---
module.exports = router;