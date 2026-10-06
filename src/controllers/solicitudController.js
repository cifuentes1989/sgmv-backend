const pool = require('../config/db');
const { sendNotificationToRole } = require('../notifications');

const baseQuery = `
    SELECT 
        s.*,
        u_cond.nombre_completo as nombre_conductor,
        v.nombre as nombre_vehiculo,
        v.placa as placa_vehiculo,
        u_tall.nombre_completo as nombre_tecnico,
        u_coor.nombre_completo as nombre_coordinador
    FROM 
        solicitudes s
    LEFT JOIN usuarios u_cond ON s.id_conductor_solicitante = u_cond.id
    LEFT JOIN vehiculos v ON s.id_vehiculo = v.id
    LEFT JOIN usuarios u_tall ON s.id_tecnico_taller = u_tall.id
    LEFT JOIN usuarios u_coor ON s.id_coordinador_aprueba = u_coor.id
`;

// --- CONDUCTOR ---

exports.crearSolicitud = async (req, res) => {
  const { id_vehiculo, necesidad, firma_conductor_solicitud } = req.body;
  const { id: id_conductor, sede_id } = req.user;
  try {
    const nuevaSolicitud = await pool.query(
      'INSERT INTO solicitudes (id_vehiculo, id_conductor_solicitante, necesidad_reportada, estado, firma_conductor_solicitud, sede_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id_vehiculo, id_conductor, necesidad, 'Solicitud Creada', firma_conductor_solicitud, sede_id]
    );
    try { sendNotificationToRole('Taller', { title: 'Nueva Solicitud', body: `Se ha creado la solicitud #${nuevaSolicitud.rows[0].id}` }); } catch(e){}
    res.status(201).json(nuevaSolicitud.rows[0]);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.obtenerSolicitudesPorConductor = async (req, res) => {
    const { id: id_conductor } = req.user;
    try {
        const query = `${baseQuery} WHERE s.id_conductor_solicitante = $1 ORDER BY s.id DESC`;
        const solicitudes = await pool.query(query, [id_conductor]);
        res.json(solicitudes.rows);
    } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

// --- CORRECCIÓN CLAVE AQUÍ ---
exports.confirmarSatisfaccion = async (req, res) => {
  const { id } = req.params;
  const { firma_conductor_satisfaccion, observaciones_entrega_conductor } = req.body;

  try {
    // CAMBIO: Ahora pasamos a 'Pendiente de Cierre' para que lo vea Coordinación
    // NO a 'Proceso Finalizado' todavía.
    const result = await pool.query(
      `UPDATE solicitudes 
       SET estado = 'Pendiente de Cierre', 
           firma_conductor_satisfaccion = $1,
           observaciones_entrega_conductor = $2
       WHERE id = $3 RETURNING *`,
      [firma_conductor_satisfaccion, observaciones_entrega_conductor, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    
    // Notificamos a Coordinación
    try { sendNotificationToRole('Coordinacion', { title: 'Vehículo Recibido', body: `El conductor recibió el vehículo solicitud #${id}. Pendiente cierre administrativo.` }); } catch(e){}

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar satisfacción' });
  }
};

// --- TALLER ---

exports.obtenerSolicitudesPendientesTaller = async (req, res) => {
  const { sede_id } = req.user;
  try {
    const query = `${baseQuery} WHERE s.estado = 'Solicitud Creada' AND s.sede_id = $1 ORDER BY s.id ASC`;
    const solicitudes = await pool.query(query, [sede_id]);
    res.json(solicitudes.rows);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.obtenerSolicitudesEnReparacionTaller = async (req, res) => {
    const { sede_id } = req.user;
    try {
        const query = `${baseQuery} WHERE s.estado = 'En Reparación' AND s.sede_id = $1 ORDER BY s.id ASC`;
        const solicitudes = await pool.query(query, [sede_id]);
        res.json(solicitudes.rows);
    } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.agregarDiagnostico = async (req, res) => {
  const { diagnostico, hora_ingreso, firma_taller_diagnostico } = req.body;
  try {
    await pool.query(
      `UPDATE solicitudes SET diagnostico_taller = $1, hora_ingreso_taller = $2, id_tecnico_taller = $3, estado = 'Pendiente Aprobación', firma_taller_diagnostico = $4 WHERE id = $5`,
      [diagnostico, hora_ingreso, req.user.id, firma_taller_diagnostico, req.params.id]
    );
    try { sendNotificationToRole('Coordinacion', { title: 'Diagnóstico Listo', body: `El taller añadió un diagnóstico para la solicitud #${req.params.id}.`}); } catch(e){}
    res.json({ msg: 'Diagnóstico agregado' });
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.finalizarReparacion = async (req, res) => {
  const { id } = req.params;
  const { trabajos_realizados, repuestos_utilizados, observaciones_taller, firma_taller_finalizacion } = req.body;
  
  try {
    // 1. Obtenemos el ID del vehículo asociado a esta solicitud
    const solicitudRes = await pool.query('SELECT id_vehiculo FROM solicitudes WHERE id = $1', [id]);
    
    // 2. Finalizamos la reparación
    await pool.query(
      `UPDATE solicitudes SET estado = 'Listo para Entrega', hora_salida_taller = NOW(), trabajos_realizados = $1, repuestos_utilizados = $2, observaciones_taller = $3, firma_taller_finalizacion = $4 WHERE id = $5`,
      [trabajos_realizados, repuestos_utilizados, observaciones_taller, firma_taller_finalizacion, id]
    );

    // 3. NUEVO: Automáticamente quitamos el estado "Fuera de Servicio" del vehículo
    if (solicitudRes.rows.length > 0) {
        await pool.query('UPDATE vehiculos SET fuera_de_servicio = FALSE WHERE id = $1', [solicitudRes.rows[0].id_vehiculo]);
    }

    try { sendNotificationToRole('Conductor', { title: 'Vehículo Listo', body: `Su vehículo solicitud #${id} está listo para entrega.`}); } catch(e){}
    res.json({msg: "Reparación finalizada y vehículo operativo."});
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.obtenerHistorialTaller = async (req, res) => {
    const { id: id_tecnico } = req.user;
    try {
        const query = `${baseQuery} WHERE s.id_tecnico_taller = $1 ORDER BY s.id DESC`;
        const solicitudes = await pool.query(query, [id_tecnico]);
        res.json(solicitudes.rows);
    } catch (err) { 
        console.error(err.message); 
        res.status(500).send('Error en el servidor'); 
    }
};

// --- COORDINACIÓN ---

exports.obtenerSolicitudesParaAprobacion = async (req, res) => {
  const { sede_id } = req.user;
  try {
    const query = `${baseQuery} WHERE s.estado = 'Pendiente Aprobación' AND s.sede_id = $1 ORDER BY s.id ASC`;
    const solicitudes = await pool.query(query, [sede_id]);
    res.json(solicitudes.rows);
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.decidirSolicitud = async (req, res) => {
  // NUEVO: Recibimos la variable marcar_fuera_servicio desde el frontend
  const { decision, motivo_rechazo, firma_coordinacion_aprobacion, marcar_fuera_servicio } = req.body;
  let nuevoEstado = (decision === 'Aprobado') ? 'En Reparación' : 'Rechazado';
  
  try {
    // 1. Obtenemos el id del vehículo
    const solicitudRes = await pool.query('SELECT id_vehiculo FROM solicitudes WHERE id = $1', [req.params.id]);

    // 2. Guardamos la decisión
    await pool.query(
      `UPDATE solicitudes SET estado = $1, id_coordinador_aprueba = $2, motivo_rechazo = $3, fecha_aprobacion_rechazo = NOW(), firma_coordinacion_aprobacion = $4 WHERE id = $5`,
      [nuevoEstado, req.user.id, motivo_rechazo, firma_coordinacion_aprobacion, req.params.id]
    );

    // 3. NUEVO: Si lo aprobó Y marcó la casilla, ponemos el vehículo fuera de servicio
    if(nuevoEstado === 'En Reparación') {
        if(marcar_fuera_servicio && solicitudRes.rows.length > 0) {
            await pool.query('UPDATE vehiculos SET fuera_de_servicio = TRUE WHERE id = $1', [solicitudRes.rows[0].id_vehiculo]);
        }
        try { sendNotificationToRole('Taller', { title: 'Solicitud Aprobada', body: `La solicitud #${req.params.id} fue aprobada.`}); } catch(e){}
    }
    res.json({ msg: 'Decisión registrada' });
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

// NUEVO ENDPOINT PARA EL TALLER: Reportar Fuera de Servicio Manualmente
exports.reportarFueraDeServicioManual = async (req, res) => {
  try {
    const solicitudRes = await pool.query('SELECT id_vehiculo FROM solicitudes WHERE id = $1', [req.params.id]);
    if (solicitudRes.rows.length > 0) {
        await pool.query('UPDATE vehiculos SET fuera_de_servicio = TRUE WHERE id = $1', [solicitudRes.rows[0].id_vehiculo]);
        res.json({ msg: 'Vehículo reportado como fuera de servicio' });
    } else {
        res.status(404).json({ error: 'Solicitud no encontrada' });
    }
  } catch (err) {
    console.error(err.message); res.status(500).send('Error en el servidor');
  }
};


exports.obtenerSolicitudesParaCierre = async (req, res) => {
    const { sede_id } = req.user;
    try {
        // CORRECCIÓN: Ahora buscamos 'Pendiente de Cierre' (que viene del conductor)
        const query = `${baseQuery} WHERE s.estado = 'Pendiente de Cierre' AND s.sede_id = $1 ORDER BY s.id ASC`;
        const solicitudes = await pool.query(query, [sede_id]);
        res.json(solicitudes.rows);
    } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.cerrarProceso = async (req, res) => {
  const { firma_coordinacion_cierre } = req.body;
  try {
    // CAMBIO: Aquí es donde FINALMENTE ponemos 'Proceso Finalizado' y la fecha de cierre
    await pool.query(
      "UPDATE solicitudes SET estado = 'Proceso Finalizado', fecha_cierre_proceso = NOW(), firma_coordinacion_cierre = $1 WHERE id = $2",
      [firma_coordinacion_cierre, req.params.id]
    );
    res.json({ msg: 'Proceso cerrado' });
  } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

exports.obtenerSolicitudesHistorial = async (req, res) => {
    const { sede_id } = req.user;
    try {
        const query = `${baseQuery} WHERE s.sede_id = $1 ORDER BY s.id DESC`;
        const solicitudes = await pool.query(query, [sede_id]);
        res.json(solicitudes.rows);
    } catch (err) { console.error(err.message); res.status(500).send('Error en el servidor'); }
};

// --- OTROS ---

exports.obtenerNotificaciones = async (req, res) => {
    const { id, rol, sede_id } = req.user; 
    let query = '';
    let params = [];
    switch (rol) {
        case 'Taller':
            query = "SELECT COUNT(*) FROM solicitudes WHERE (estado = 'Solicitud Creada' OR estado = 'En Reparación') AND sede_id = $1";
            params.push(sede_id);
            break;
        case 'Coordinacion':
            // Notificamos si hay aprobaciones O cierres pendientes
            query = "SELECT COUNT(*) FROM solicitudes WHERE (estado = 'Pendiente Aprobación' OR estado = 'Pendiente de Cierre') AND sede_id = $1";
            params.push(sede_id);
            break;
        case 'Conductor':
            query = "SELECT COUNT(*) FROM solicitudes WHERE estado = 'Listo para Entrega' AND id_conductor_solicitante = $1";
            params.push(id);
            break;
        default:
            return res.json({ count: 0 });
    }
    try {
        const result = await pool.query(query, params);
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) { 
        console.error("Error en notificaciones:", err.message); 
        res.status(500).send('Error en el servidor'); 
    }
};