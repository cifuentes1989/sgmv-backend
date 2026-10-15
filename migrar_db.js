const pool = require('./src/config/db'); // Ajusta esta ruta si tu db.js está en otra carpeta

async function actualizarRoles() {
    try {
        console.log("Iniciando actualización de la base de datos...");
        await pool.query(`ALTER TABLE usuarios ALTER COLUMN rol TYPE VARCHAR(50) USING rol::text;`);
        console.log("✅ ÉXITO: El candado fue removido. Ya puedes crear el usuario Archivo.");
    } catch (error) {
        console.error("❌ Error al actualizar:", error.message);
    } finally {
        pool.end(); 
    }
}

actualizarRoles();