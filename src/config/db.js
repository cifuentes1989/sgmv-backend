const { Pool } = require('pg');
require('dotenv').config();

// Configuración de conexión
const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// ⚠️ AJUSTE CRÍTICO PARA RENDER:
// Si el host NO es localhost, activamos SSL obligatorio.
if (process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1') {
    config.ssl = {
        rejectUnauthorized: false // Esto permite conectar a Render sin certificados complejos
    };
}

const pool = new Pool(config);

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error fatal: No se pudo conectar a la Base de Datos.', err.message);
    console.error('   Verifica que los datos del .env sean los de "External Connection" de Render.');
  } else {
    // Imprimimos el host para que estés seguro de a DÓNDE te conectaste
    console.log(`✅ Conectado Exitosamente a la BD en: ${process.env.DB_HOST}`);
    release();
  }
});

module.exports = pool;