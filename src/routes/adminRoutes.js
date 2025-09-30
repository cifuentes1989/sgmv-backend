const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Middleware para verificar que el usuario es Admin
const isAdmin = (req, res, next) => {
    if (req.user.rol !== 'Admin') {
        return res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de Administrador.' });
    }
    next();
};

// Rutas de Gestión de Usuarios
router.get('/usuarios', [authMiddleware, isAdmin], adminController.obtenerUsuarios);
router.post('/usuarios', [authMiddleware, isAdmin], adminController.crearUsuario);

// Rutas de Datos Globales
router.get('/solicitudes/todas', [authMiddleware, isAdmin], adminController.obtenerTodasLasSolicitudes);
router.get('/informes/datos', [authMiddleware, isAdmin], adminController.obtenerDatosParaInforme);

module.exports = router;