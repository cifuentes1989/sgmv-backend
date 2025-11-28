const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función de Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas (Usuario no existe)' });
    }

    const user = result.rows[0];

    // 2. Comparar contraseña (con password_hash)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas (Contraseña incorrecta)' });
    }

    // 3. Crear Token
    const payload = {
      user: {
        id: user.id,
        rol: user.rol,
        sede_id: user.sede_id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                nombre: user.nombre_completo, 
                rol: user.rol, 
                sede_id: user.sede_id 
            } 
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

// Función Obtener Usuario
exports.obtenerUsuario = async (req, res) => {
    try {
      // Nota: req.user viene del middleware de autenticación
      if (!req.user) return res.status(401).json({ msg: 'No autorizado' });

      const result = await pool.query('SELECT id, nombre_completo, email, rol, sede_id FROM usuarios WHERE id = $1', [req.user.id]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
};