const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para registrar un nuevo usuario
exports.register = async (req, res) => {
  const { nombre_completo, email, password, rol } = req.body;

  try {
    // Cifrar la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar usuario en la base de datos
    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre_completo, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, email, rol",
      [nombre_completo, email, password_hash, rol]
    );

    res.status(201).json({ message: "Usuario registrado exitosamente", user: newUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
};

// Función para iniciar sesión
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario por email
    const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Comparar la contraseña ingresada con la cifrada en la BD
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Crear y firmar el token de sesión (JWT)
    const payload = {
  user: { 
    id: user.rows[0].id, 
    rol: user.rows[0].rol, 
    nombre: user.rows[0].nombre_completo, 
    sede_id: user.rows[0].sede_id // <-- Esta línea es crucial
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // El token expira en 1 hora
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
};