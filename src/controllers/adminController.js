const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// --- 1. GESTIÓN DE USUARIOS ---

exports.crearUsuario = async (req, res) => {
  const { nombre_completo, email, password, rol, sede_id } = req.body;
  
  try {
    // Encriptamos la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // Insertamos en la base de datos usando la columna correcta 'password_hash'
    const newUser = await pool.query(
      `INSERT INTO usuarios (nombre_completo, email, password_hash, rol, sede_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [nombre_completo, email, passwordEncriptada, rol, sede_id]
    );
    
    res.json(newUser.rows[0]);

  } catch (err) { 
    console.error("❌ Error al crear usuario:", err.message); 
    res.status(500).json({ error: err.message }); 
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT u.id, u.nombre_completo, u.email, u.rol, s.nombre as nombre_sede 
      FROM usuarios u 
      LEFT JOIN sedes s ON u.sede_id = s.id 
      ORDER BY u.id ASC
    `);
    res.json(users.rows);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: 'Error al obtener usuarios' }); 
  }
};

// --- 2. INFORMES Y ESTADÍSTICAS ---

exports.obtenerDatosInforme = async (req, res) => {
    try {
        const porEstado = await pool.query("SELECT estado, COUNT(*) as cantidad FROM solicitudes GROUP BY estado");
        const porVehiculo = await pool.query("SELECT v.placa, COUNT(*) as cantidad FROM solicitudes s JOIN vehiculos v ON s.id_vehiculo = v.id GROUP BY v.placa");
        
        res.json({
            porEstado: porEstado.rows,
            porVehiculo: porVehiculo.rows
        });
    } catch (err) { 
        console.error(err); 
        res.status(500).json({ error: 'Error generando informes' }); 
    }
};

// --- 3. HISTORIAL GLOBAL DE SOLICITUDES (MEJORADO) ---

exports.obtenerTodasSolicitudes = async (req, res) => {
    const { sede_id } = req.query;
    
    // AQUÍ ESTÁ LA MAGIA: Hacemos JOIN múltiples veces a la tabla usuarios
    // para obtener el nombre del conductor, del técnico Y del coordinador por separado.
    let query = `
        SELECT 
            s.*, 
            v.nombre as nombre_vehiculo, 
            v.placa as placa_vehiculo, 
            se.nombre as nombre_sede,
            u_cond.nombre_completo as nombre_conductor,
            u_tall.nombre_completo as nombre_tecnico,
            u_coor.nombre_completo as nombre_coordinador
        FROM solicitudes s
        LEFT JOIN vehiculos v ON s.id_vehiculo = v.id
        LEFT JOIN sedes se ON s.sede_id = se.id
        LEFT JOIN usuarios u_cond ON s.id_conductor_solicitante = u_cond.id
        LEFT JOIN usuarios u_tall ON s.id_tecnico_taller = u_tall.id
        LEFT JOIN usuarios u_coor ON s.id_coordinador_aprueba = u_coor.id
    `;
    
    let params = [];
    
    // Aplicar filtro si se selecciona una sede específica
    if (sede_id && sede_id !== 'todas') {
        query += ' WHERE s.sede_id = $1';
        params.push(sede_id);
    }
    
    query += ' ORDER BY s.id DESC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) { 
        console.error(err); 
        res.status(500).json({ error: 'Error al obtener historial de solicitudes' }); 
    }
};