const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE || process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const resetPass = async () => {
  try {
    const emailObjetivo = 'admin@empresa.com'; // El correo que vi en tu foto
    const nuevaPassword = '123456';            // Tu nueva contraseña

    // 1. Encriptar
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(nuevaPassword, salt);

    // 2. Actualizar en BD (Usando la columna 'password_hash')
    const res = await pool.query(
      `UPDATE usuarios 
       SET password_hash = $1 
       WHERE email = $2 RETURNING *`,
      [passwordEncriptada, emailObjetivo]
    );

    if (res.rows.length > 0) {
      console.log('✅ ¡Éxito! Contraseña restablecida.');
      console.log('   Usuario:', res.rows[0].nombre_completo);
      console.log('   Email:', res.rows[0].email);
      console.log('   Nueva Clave:', nuevaPassword);
    } else {
      console.log('❌ Error: No se encontró el usuario con ese email.');
    }

  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    pool.end();
  }
};

resetPass();