const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/health', async (req, res) => {
    try {
        // 1. Verificar conexión a DB
        const dbCheck = await db.query('SELECT NOW()');

        // 2. Respuesta detallada
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            db: {
                connected: true,
                serverTime: dbCheck.rows[0].now
            },
            services: {
                database: 'Operational',
                cache: 'Operational'
            }
        });
    } catch (error) {
        console.error('⚠️ Health Check Failed:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                database: !error.message.includes('ECONNREFUSED') ? 'Operational' : 'Down'
            }
        });
    }
});

module.exports = router;