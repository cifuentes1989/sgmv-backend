const admin = require('firebase-admin');
const pool = require('./config/db');
const fs = require('fs');

try {
    let serviceAccount;
    // Lógica inteligente: Si está en Render, busca en la bóveda. Si está local, busca en la carpeta.
    if (fs.existsSync('/etc/secrets/firebase-credentials.json')) {
        serviceAccount = require('/etc/secrets/firebase-credentials.json');
    } else {
        serviceAccount = require('../firebase-credentials.json');
    }
    
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'sgmv-notificaciones.appspot.com'
        });
        console.log("✅ Firebase Admin inicializado correctamente con credenciales.");
    }
} catch (error) {
    console.error("❌ Error crítico al inicializar Firebase:", error.message);
}

exports.sendNotificationToRole = async (rol, payload) => {
    if (!admin.apps.length) return;
    try {
        const users = await pool.query("SELECT push_subscription FROM usuarios WHERE rol = $1 AND push_subscription IS NOT NULL", [rol]);
        if (users.rows.length === 0) return;

        const tokens = users.rows.map(user => user.push_subscription.token);
        if (tokens.length > 0) {
            const message = { notification: payload, tokens: tokens };
            await admin.messaging().sendEachForMulticast(message);
        }
    } catch (e) { console.error("Error al enviar notificaciones:", e); }
};

exports.admin = admin;