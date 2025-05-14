const express = require('express');
const router = express.Router();
const db = require('../db'); // Importar conexión a PostgreSQL

/* GET todos los usuarios */
router.get('/', async (req, res) => {
  try {
    // Consulta con paginación
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Obtener usuarios paginados
    const users = await db.query(
        `SELECT * FROM usuario 
      ORDER BY cod_usuario 
      LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    // Obtener total de usuarios
    const total = await db.query('SELECT COUNT(*) FROM usuario');

    res.json({
      data: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        totalPages: Math.ceil(total.rows[0].count / limit)
      }
    });

  } catch (error) {
    console.error(`Error en GET /users: ${error.stack}`);
    res.status(500).json({
      error: 'Error al obtener usuarios',
      details: error.message
    });
  }
});

/* GET usuario específico */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
        'SELECT * FROM usuario WHERE cod_usuario = $1',
        [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error en GET /users/${req.params.id}: ${error.stack}`);
    res.status(500).json({
      error: 'Error al obtener usuario',
      details: error.message
    });
  }
});

module.exports = router;