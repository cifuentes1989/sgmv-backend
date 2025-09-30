const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// --- Gestión de Usuarios ---
exports.obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await pool.query('SELECT u.*, s.nombre as nombre_sede FROM usuarios u LEFT JOIN sedes s ON u.sede_id = s.id ORDER BY u.id ASC');
        res.json(usuarios.rows);
    } catch (err) { 
        console.error(err.message); 
        res.status(500).send('Error en el servidor'); 
    }
};

exports.crearUsuario = async (req, res) => {
    const { nombre_completo, email, password, rol, sede_id } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        await pool.query(
            "INSERT INTO usuarios (nombre_completo, email, password_hash, rol, sede_id) VALUES ($1, $2, $3, $4, $5)",
            [nombre_completo, email, password_hash, rol, sede_id]
        );
        res.status(201).json({msg: "Usuario creado con éxito"});
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'El email ya está registrado.' });
        }
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// --- Historial e Informes ---
exports.obtenerTodasLasSolicitudes = async (req, res) => {
    const { sede_id } = req.query;
    let query = `
        SELECT 
            s.*, 
            u_cond.nombre_completo as nombre_conductor, 
            v.nombre as nombre_vehiculo, 
            v.placa as placa_vehiculo,
            u_tall.nombre_completo as nombre_tecnico,
            u_coor.nombre_completo as nombre_coordinador,
            se.nombre as nombre_sede
        FROM solicitudes s
        LEFT JOIN usuarios u_cond ON s.id_conductor_solicitante = u_cond.id
        LEFT JOIN vehiculos v ON s.id_vehiculo = v.id
        LEFT JOIN usuarios u_tall ON s.id_tecnico_taller = u_tall.id
        LEFT JOIN usuarios u_coor ON s.id_coordinador_aprueba = u_coor.id
        LEFT JOIN sedes se ON s.sede_id = se.id
    `;
    const params = [];

    if (sede_id && sede_id !== 'todas') {
        query += ' WHERE s.sede_id = $1';
        params.push(sede_id);
    }
    query += ' ORDER BY s.id DESC';

    try {
        const solicitudes = await pool.query(query, params);
        res.json(solicitudes.rows);
    } catch (err) { 
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

exports.obtenerDatosParaInforme = async (req, res) => {
    const { fecha_inicio, fecha_fin, sede_id } = req.query;
    try {
        let params = [];
        let whereClauses = [];
        let paramIndex = 1;

        if (fecha_inicio && fecha_fin) {
            params.push(fecha_inicio, `${fecha_fin}T23:59:59`);
            whereClauses.push(`s.fecha_creacion BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        }

        if (sede_id && sede_id !== 'todas') {
            params.push(sede_id);
            whereClauses.push(`s.sede_id = $${paramIndex++}`);
        }
        
        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const solicitudesPorEstado = await pool.query(`SELECT estado, COUNT(*) as cantidad FROM solicitudes s ${whereClause} GROUP BY estado`, params);
        
        const vehiculosJoin = `JOIN vehiculos v ON s.id_vehiculo = v.id`;
        const solicitudesPorVehiculo = await pool.query(`SELECT v.placa, COUNT(s.id) as cantidad FROM solicitudes s ${vehiculosJoin} ${whereClause} GROUP BY v.placa ORDER BY cantidad DESC`, params);
        
        res.json({
            porEstado: solicitudesPorEstado.rows,
            porVehiculo: solicitudesPorVehiculo.rows
        });
    } catch (err) { 
        console.error(err.message);
        res.status(500).send('Error en el servidor'); 
    }
};