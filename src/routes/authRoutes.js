const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Verificación de seguridad: Si esto imprime "undefined", el controlador está vacío o mal importado
if (!authController.login) {
    console.error("❌ ERROR FATAL: authController.login no está definido. Revisa src/controllers/authController.js");
}

// Ruta de Login
router.post('/login', authController.login);

// Ruta para obtener usuario actual (opcional, pero útil)
router.get('/usuario', authController.obtenerUsuario);

module.exports = router;