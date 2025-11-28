const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  // Aquí toma 'sgmv_db' de tu variable DB_DATABASE
  database: process.env.DB_NAME || process.env.DB_DATABASE, 
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Prueba de conexión automática
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error fatal: No se pudo conectar a la Base de Datos', err.stack);
  } else {
    console.log('✅ Base de Datos PostgreSQL Conectada Exitosamente');
    release();
  }
});

module.exports = pool;