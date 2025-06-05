const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/usuario', async (req, res) => {
  try {
    // 1. Corregir la forma de obtener los resultados
    const result = await db.query('SELECT * FROM usuario'); // 2. Nombre de tabla corregido
    res.json(result.rows); // 3. Acceder a la propiedad rows
  } catch (error) {
    console.error('Error en GET /usuario:', error); // 4. Mejor logging
    res.status(500).json({
      error: 'Error al obtener usuarios',
      detalle: error.message
    });
  }
});

module.exports = router;

