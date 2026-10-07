const pool = require('./src/config/db');

const agregarCampoEvidencia = async () => {
    try {
        console.log("⏳ Conectando a PostgreSQL...");
        
        await pool.query('ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS url_evidencia_externa TEXT;');
        
        console.log("✅ ¡ÉXITO! Se agregó la columna 'url_evidencia_externa' a la tabla solicitudes.");
    } catch (error) {
        console.error("❌ Error al modificar la tabla:", error.message);
    } finally {
        pool.end();
    }
};

agregarCampoEvidencia();