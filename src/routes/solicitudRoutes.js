const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const controller = require('../controllers/solicitudController');

// Rutas del Conductor
router.post('/', authMiddleware, controller.crearSolicitud);
router.get('/conductor', authMiddleware, controller.obtenerSolicitudesPorConductor);
router.put('/satisfaccion/:id', authMiddleware, controller.registrarSatisfaccion);

// Rutas del Taller
router.get('/taller/pendientes', authMiddleware, controller.obtenerSolicitudesPendientes);
router.get('/taller/en-reparacion', authMiddleware, controller.obtenerSolicitudesEnReparacion);
router.put('/diagnostico/:id', authMiddleware, controller.agregarDiagnostico);
router.put('/finalizar/:id', authMiddleware, controller.finalizarReparacion);

// Rutas de Coordinación
router.get('/coordinacion/aprobacion', authMiddleware, controller.obtenerSolicitudesParaAprobacion);
router.get('/coordinacion/cierre', authMiddleware, controller.obtenerSolicitudesParaCierre);
router.get('/coordinacion/finalizadas', authMiddleware, controller.obtenerSolicitudesFinalizadas);
router.put('/decision/:id', authMiddleware, controller.decidirSolicitud);
router.put('/cierre/:id', authMiddleware, controller.cerrarProceso);
router.get('/coordinacion/historial', authMiddleware, controller.obtenerSolicitudesPorSede);
// @route   GET api/solicitudes/taller/historial
// @desc    Obtener el historial de trabajos para el técnico logueado
router.get('/taller/historial', authMiddleware, controller.obtenerHistorialTaller);

// Ruta de Notificaciones
router.get('/notificaciones', authMiddleware, controller.obtenerNotificaciones);

module.exports = router;