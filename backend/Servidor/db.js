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
// Asegúrate de usar la clave de servicio (service_role key) para operaciones seguras en el backend
// NUNCA uses la clave anon (anon key) en tu backend para operaciones que requieren permisos elevados
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY // Asegúrate de que SUPABASE_KEY en tu .env es la clave de servicio
);

// Configuración de PostgreSQL para consultas SQL directas (usando el pool)
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // ¡Asegúrate de que esta contraseña esté en tu .env!
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432, // Parsear el puerto a número
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false // Configurar SSL según tu entorno
});

// Prueba de conexión al pool de PostgreSQL (opcional, pero útil para depurar la conexión directa)
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to PostgreSQL pool:', err.message);
        console.error('Pool connection error details:', err.stack); // Loguear el stack trace
        // No lances un error fatal aquí si solo falla el pool, ya que SupabaseClient podría funcionar para algunas cosas
    } else {
        console.log('Pool de base de datos PostgreSQL conectado.');
        client.release(); // Libera el cliente inmediatamente si solo es para probar la conexión
    }
});

// Manejar errores del pool después de la conexión inicial
pool.on('error', (err, client) => {
    console.error('Error inesperado en el pool de la base de datos:', err.message);
    console.error('Pool error details:', err.stack);
    // No llames a process.exit() aquí, deja que el gestor de procesos (pm2, forever) reinicie la app si es necesario.
});


module.exports = {
    supabase, // Exporta el cliente Supabase
    pool,     // Exporta el Pool de pg
};
