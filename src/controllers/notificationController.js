const pool = require('../config/db');

exports.subscribe = async (req, res) => {
    const { subscription } = req.body;
    const { id } = req.user;
    try {
        await pool.query('UPDATE usuarios SET push_subscription = $1 WHERE id = $2', [subscription, id]);
        res.status(201).json({ success: true, message: "Suscripción guardada." });
    } catch (error) {
        console.error("Error al guardar la suscripción:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};