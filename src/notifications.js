const admin = require('firebase-admin');
const pool = require('./config/db');

try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
    console.log("Firebase Admin SDK inicializado.");
} catch (error) {
    console.error("Error al inicializar Firebase Admin SDK:", error.message);
}

exports.sendNotificationToRole = async (rol, payload) => {
    if (!admin.apps.length) return;
    try {
        const users = await pool.query("SELECT push_subscription FROM usuarios WHERE rol = $1 AND push_subscription IS NOT NULL", [rol]);
        if (users.rows.length === 0) return;

        const tokens = users.rows.map(user => user.push_subscription.token);
        if (tokens.length > 0) {
            const message = { notification: payload, tokens: tokens };
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(response.successCount + ' notificaciones enviadas exitosamente.');
        }
    } catch (e) { console.error("Error al notificar al rol:", e); }
};