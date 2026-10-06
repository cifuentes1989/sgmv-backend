const pool = require('./src/config/db'); // Llama a tu conexión de PostgreSQL

const actualizarBaseDeDatos = async () => {
    try {
        console.log("⏳ Conectando a PostgreSQL en Render...");
        
        // Ejecutamos el comando SQL directo
        await pool.query('ALTER TABLE vehiculos ADD COLUMN fuera_de_servicio BOOLEAN DEFAULT FALSE;');
        
        console.log("✅ ¡ÉXITO! La columna 'fuera_de_servicio' se agregó correctamente a la tabla vehiculos.");
    } catch (error) {
        // Si la columna ya existe, también nos avisará
        if (error.code === '42701') {
            console.log("⚠️ La columna 'fuera_de_servicio' YA EXISTE en la tabla vehiculos. ¡Todo listo!");
        } else {
            console.error("❌ Error al modificar la tabla:", error.message);
        }
    } finally {
        pool.end(); // Cerramos la conexión para que la terminal no se quede colgada
    }
};

actualizarBaseDeDatos();