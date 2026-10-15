const pool = require('./src/config/db');

async function ejecutarMigracion() {
    try {
        console.log("⏳ [Migración] Iniciando actualización de reglas en la base de datos...");
        
        // 1. Eliminamos el candado viejo
        await pool.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;`);
        
        // 2. Creamos el candado nuevo incluyendo "Archivo"
        await pool.query(`ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('Admin', 'Coordinacion', 'Taller', 'Conductor', 'Archivo'));`);
        
        console.log("✅ [Migración] Éxito: La base de datos ha sido actualizada permanentemente.");
        process.exit(0); // Le indica al servidor que puede continuar encendiéndose
    } catch (error) {
        console.error("❌ [Migración] Error crítico:", error.message);
        process.exit(1); 
    }
}

ejecutarMigracion();