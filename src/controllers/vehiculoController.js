const pool = require('../config/db');

exports.crearVehiculo = async (req, res) => {
  const { nombre, placa, marca, modelo, sede_id } = req.body;
  try {
    const nuevo = await pool.query(
      "INSERT INTO vehiculos (nombre, placa, marca, modelo, sede_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre, placa, marca, modelo, sede_id]
    );
    res.json(nuevo.rows[0]);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: 'Error creando vehículo' }); 
  }
};

// --- FUNCIÓN MODIFICADA PARA FILTRAR POR SEDE ---
exports.obtenerVehiculos = async (req, res) => {
  // Obtenemos el rol y la sede del usuario que hace la petición (viene del Token)
  const { rol, sede_id } = req.user;

  try {
    let query = "";
    let params = [];

    // CASO 1: Es Administrador -> Ve todos los vehículos de todas las sedes
    if (rol === 'Admin') {
       query = `
         SELECT v.*, s.nombre as nombre_sede 
         FROM vehiculos v 
         LEFT JOIN sedes s ON v.sede_id = s.id 
         ORDER BY v.sede_id, v.nombre
       `;
    } 
    // CASO 2: Es Conductor, Taller o Coordinación -> Solo ve los vehículos de SU sede
    else {
       query = "SELECT * FROM vehiculos WHERE sede_id = $1 ORDER BY nombre";
       params = [sede_id];
    }

    const vehiculos = await pool.query(query, params);
    res.json(vehiculos.rows);

  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: 'Error obteniendo vehículos' }); 
  }
};
// ------------------------------------------------

exports.obtenerEstadoFlota = async (req, res) => {
  try {
    // Esta consulta determina si un vehículo está en taller si tiene una solicitud activa
    const query = `
      SELECT 
        v.id, 
        v.nombre, 
        v.placa, 
        s.nombre AS sede,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM solicitudes sol 
            WHERE sol.id_vehiculo = v.id 
            AND sol.estado NOT IN ('Proceso Finalizado', 'Rechazado')
          ) THEN 'EN TALLER'
          ELSE 'OPERATIVO'
        END AS estado_actual
      FROM vehiculos v
      LEFT JOIN sedes s ON v.sede_id = s.id
      ORDER BY estado_actual ASC, v.nombre ASC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado de flota' });
  }
};

// --- NUEVA FUNCIÓN: ACTUALIZAR SEDE ---
exports.actualizarSedeVehiculo = async (req, res) => {
    const { id } = req.params;
    const { sede_id } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE vehiculos SET sede_id = $1 WHERE id = $2 RETURNING *',
            [sede_id, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Vehículo no encontrado' });
        }
        
        res.json({ msg: 'Sede actualizada correctamente', vehiculo: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar la sede:', error);
        res.status(500).json({ error: 'Error al actualizar la sede del vehículo' });
    }
};