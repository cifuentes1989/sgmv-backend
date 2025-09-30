const pool = require('../config/db');

exports.obtenerVehiculos = async (req, res) => {
    // Obtenemos el rol y la sede del token del usuario que hace la petición
    const { rol, sede_id } = req.user; 

    try {
        let query;
        const params = [];
        
        // Si el usuario es Admin, puede ver todos los vehículos de todas las sedes
        if (rol === 'Admin') {
            query = `
                SELECT v.*, s.nombre as nombre_sede 
                FROM vehiculos v 
                LEFT JOIN sedes s ON v.sede_id = s.id 
                ORDER BY v.nombre ASC
            `;
        } else {
            // Si es cualquier otro rol (ej. Conductor), solo ve los vehículos de SU sede
            query = `
                SELECT v.*, s.nombre as nombre_sede 
                FROM vehiculos v 
                LEFT JOIN sedes s ON v.sede_id = s.id 
                WHERE v.sede_id = $1
                ORDER BY v.nombre ASC
            `;
            params.push(sede_id);
        }

        const vehiculos = await pool.query(query, params);
        res.json(vehiculos.rows);
    } catch (err) { 
        console.error(err.message); 
        res.status(500).send('Error en el servidor'); 
    }
};

exports.crearVehiculo = async (req, res) => {
    // Solo un admin puede crear vehículos
    if (req.user.rol !== 'Admin') {
        return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const { nombre, placa, marca, modelo, sede_id } = req.body;
    try {
        const newVehiculo = await pool.query(
            'INSERT INTO vehiculos (nombre, placa, marca, modelo, sede_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, placa, marca, modelo, sede_id]
        );
        res.status(201).json(newVehiculo.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ msg: 'La placa ya está registrada.' });
        res.status(500).send('Error en el servidor');
    }
};