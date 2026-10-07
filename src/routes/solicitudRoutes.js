const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const authMiddleware = require('../middleware/authMiddleware');
const controller = require('../controllers/solicitudController'); 

// --- Rutas del Conductor ---
router.post('/', authMiddleware, controller.crearSolicitud);
router.get('/conductor', authMiddleware, controller.obtenerSolicitudesPorConductor);
router.put('/satisfaccion/:id', authMiddleware, controller.confirmarSatisfaccion);

// --- Rutas del Taller ---
router.get('/taller/pendientes', authMiddleware, controller.obtenerSolicitudesPendientesTaller);
router.get('/taller/en-reparacion', authMiddleware, controller.obtenerSolicitudesEnReparacionTaller);
router.get('/taller/historial', authMiddleware, controller.obtenerHistorialTaller);
router.put('/diagnostico/:id', authMiddleware, controller.agregarDiagnostico);
router.put('/finalizar/:id', authMiddleware, controller.finalizarReparacion);
router.put('/taller/fuera-servicio/:id', authMiddleware, controller.reportarFueraDeServicioManual);

// --- Rutas de Coordinación ---
router.get('/coordinacion/aprobacion', authMiddleware, controller.obtenerSolicitudesParaAprobacion);
router.get('/coordinacion/cierre', authMiddleware, controller.obtenerSolicitudesParaCierre);
router.get('/coordinacion/historial', authMiddleware, controller.obtenerSolicitudesHistorial);
router.put('/decision/:id', authMiddleware, controller.decidirSolicitud);
router.put('/cierre/:id', authMiddleware, controller.cerrarProceso);

// --- Rutas Generales / Archivos / Notificaciones ---
router.get('/notificaciones', authMiddleware, controller.obtenerNotificaciones); // <-- RECUPERADA
router.put('/archivo/subir-evidencia/:id', authMiddleware, upload.single('evidencia'), controller.subirEvidenciaYFinalizar);

module.exports = router;