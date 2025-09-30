const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const vehiculoController = require('../controllers/vehiculoController');

router.get('/', authMiddleware, vehiculoController.obtenerVehiculos);
router.post('/', authMiddleware, vehiculoController.crearVehiculo);

module.exports = router;