require('dotenv').config(); // Asegúrate de que esta línea esté al principio

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// --- DEBUGGING: Imprime los valores de las variables de entorno ---
console.log('DEBUG: SUPABASE_URL =', process.env.SUPABASE_URL);
console.log('DEBUG: SUPABASE_KEY =', process.env.SUPABASE_KEY ? '******** (Key is present)' : 'UNDEFINED or EMPTY'); // No imprimas la clave completa por seguridad
console.log('DEBUG: DB_HOST =', process.env.DB_HOST);
console.log('DEBUG: DB_USER =', process.env.DB_USER);
console.log('DEBUG: DB_PORT =', process.env.DB_PORT);
console.log('DEBUG: DB_NAME =', process.env.DB_NAME);
console.log('---------------------------------------------------');
// --- FIN DEBUGGING ---


// Configuración de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Configuración de PostgreSQL para consultas SQL
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // ¡Asegúrate de que esta contraseña esté en tu .env!
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } // Obligatorio para Supabase
});

// Prueba de conexión al pool de PostgreSQL (opcional, pero útil para depurar la conexión directa)
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to PostgreSQL pool:', err.message);
        // No lances un error fatal aquí si solo falla el pool, ya que SupabaseClient podría funcionar
    } else {
        console.log('Successfully connected to PostgreSQL pool');
        client.release(); // Libera el cliente de vuelta al pool
    }
    // No llames a done() aquí, ya que no estamos dentro de una query específica
});


module.exports = { supabase, pool };
