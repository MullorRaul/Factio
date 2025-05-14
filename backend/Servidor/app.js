// Importar las librerías necesarias
const express = require('express'); // Framework para crear el servidor web
const cors = require('cors');     // Middleware para habilitar CORS
const bcrypt = require('bcrypt');   // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para crear y verificar JSON Web Tokens
const app = express();            // Crear una instancia de la aplicación Express
const port = 3001;                // Definir el puerto en el que el servidor escuchará

// Importar el cliente de Supabase y el pool (aunque el pool no se usa directamente en este archivo)
// Asegúrate de que tu archivo db.js inicializa y exporta 'supabase' correctamente.
const { supabase, pool } = require('./db'); // Verifica que db.js existe y exporta esto

// Middleware para habilitar CORS (permite peticiones desde otros dominios/puertos)
app.use(cors());
// Middleware para parsear el cuerpo de las peticiones entrantes como JSON
app.use(express.json());

// Clave secreta para firmar los tokens JWT
// !!! ADVERTENCIA: Usa una variable de entorno para esto en producción.
const JWT_SECRET = 'factiodb'; // ¡Clave secreta para JWT! Considera usar una variable de entorno.

// Middleware para verificar el token JWT de admin_empresa
// Protege las rutas que solo deben ser accesibles por administradores de empresa autenticados
const authenticateAdminEmpresa = async (req, res, next) => {
    // Obtener el token del encabezado 'Authorization' (formato: 'Bearer TOKEN')
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Si no hay token, retornar error de autenticación
    if (!token) {
        return res.status(401).json({ error: 'Autenticación requerida' });
    }

    try {
        // Verificar el token usando la clave secreta
        const decoded = jwt.verify(token, JWT_SECRET);
        // Buscar el administrador en la base de datos usando el ID del token
        const { data: admin, error } = await supabase
            .from('admin_empresa')
            .select('id_admin')
            .eq('id_admin', decoded.adminId)
            .single(); // Esperamos un único resultado

        // Si hay un error en la consulta o el admin no se encuentra, el token es inválido
        if (error || !admin) {
            return res.status(401).json({ error: 'Autenticación inválida' });
        }

        // Si el token es válido y el admin existe, guardar el ID del admin en el objeto request
        req.adminId = decoded.adminId;
        // Continuar al siguiente middleware o manejador de ruta
        next();
    } catch (error) {
        // Si la verificación del token falla (token expirado, mal firmado, etc.)
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// ==============================================
// Definición de Rutas (Endpoints) de tu API
// ==============================================

// Ruta básica para la raíz del servidor
// Al visitar http://localhost:3001/ en el navegador, verás este mensaje
app.get('/', (req, res) => {
    res.send('¡Bienvenido a tu API con Express y Supabase!');
});

// Health Check - Ruta para verificar si el servidor está funcionando
// Responde con un estado OK y la hora actual
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Health Check de Base de Datos (Supabase) - Añadido para verificar la conexión a Supabase
// Intenta realizar una consulta simple a la base de datos
app.get('/health/db', async (req, res) => {
    try {
        // Realizar una consulta simple (ej: contar filas en una tabla pequeña)
        // Esto verifica si la aplicación puede comunicarse con Supabase
        const { count, error } = await supabase
            .from('usuario') // Usa una tabla que sepas que existe
            .select('*', { count: 'exact', head: true }); // Solo cuenta, no trae datos

        if (error) {
            console.error('Database health check failed:', error.message);
            return res.status(500).json({
                status: 'Database connection failed',
                error: error.message,
                timestamp: new Date()
            });
        }

        // Si no hubo error, la conexión funciona
        res.status(200).json({
            status: 'Database connection OK',
            timestamp: new Date(),
            // Opcional: puedes incluir el conteo si quieres
            // user_count: count
        });

    } catch (err) {
        // Capturar errores inesperados durante el proceso
        console.error('Unexpected error during database health check:', err.message);
        res.status(500).json({
            status: 'Database health check encountered an error',
            error: err.message,
            timestamp: new Date()
        });
    }
});


// ====================== AUTENTICACIÓN DE ADMIN_EMPRESA ======================

// Ruta para registrar un nuevo administrador de empresa
app.post('/admin/signup', async (req, res) => {
    // --- MODIFICACIÓN AQUÍ: Añadir 'nombre' a la desestructuración ---
    const { email, password, nombre } = req.body;
    // ---------------------------------------------------------------

    if (!email || !password || !nombre) { // --- MODIFICACIÓN AQUÍ: Validar que nombre también esté presente ---
        return res.status(400).json({ error: 'Email, nombre y contraseña son requeridos' });
    }

    try {
        // Verificar si ya existe un admin con ese email (usando cod_usuario)
        const { data: existingAdmin, error: existingAdminError } = await supabase
            .from('admin_empresa')
            .select('id_admin')
            .eq('cod_usuario', email) // Asumiendo que el email se guarda en cod_usuario
            .single();

        // Manejar error si no es el de "no rows found" (PGRST116)
        if (existingAdminError && existingAdminError.code !== 'PGRST116') {
            console.error('Error checking existing admin:', existingAdminError.message); // Log de error
            throw existingAdminError;
        }

        // Si ya existe un admin, retornar conflicto
        if (existingAdmin) {
            return res.status(409).json({ error: 'El email ya está registrado como administrador' });
        }

        // Verificar si ya existe un usuario con ese email (usando cod_usuario o Email)
        const { data: existingUser, error: existingUserError } = await supabase
            .from('usuario')
            .select('cod_usuario')
            .eq('cod_usuario', email) // O .eq('Email', email) dependiendo de tu diseño
            .single();

        // Manejar error si no es el de "no rows found" (PGRST116)
        if (existingUserError && existingUserError.code !== 'PGRST116') {
            console.error('Error checking existing user:', existingUserError.message); // Log de error
            throw existingUserError;
        }

        // Si ya existe un usuario (no admin), también podría ser un conflicto dependiendo de tu lógica de negocio
        // Por ahora, asumimos que un email solo puede ser usuario O admin_empresa, no ambos con entradas separadas
        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado como usuario' });
        }


        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // --- MODIFICACIÓN AQUÍ: Incluir 'nombre' al insertar en la tabla 'usuario' ---
        // Crear la entrada en la tabla usuario
        const { data: newUsuario, error: newUsuarioError } = await supabase
            .from('usuario')
            .insert([{ cod_usuario: email, Email: email, Nombre: nombre }]) // <-- Añadido Nombre: nombre
            .select('cod_usuario')
            .single();

        if (newUsuarioError) {
            console.error('Error creando usuario:', newUsuarioError.message); // Log de error
            throw newUsuarioError; // Si falla la creación del usuario, detenemos el proceso
        }
        // -----------------------------------------------------------------------------


        // Crear la entrada en la tabla admin_empresa
        const { data: newAdmin, error: newAdminError } = await supabase
            .from('admin_empresa')
            .insert([{ cod_usuario: email, password: hashedPassword }]) // Usar el mismo cod_usuario
            .select('id_admin, cod_usuario') // Seleccionar datos para la respuesta
            .single(); // Esperamos un único resultado

        if (newAdminError) {
            console.error('Error creando admin_empresa:', newAdminError.message); // Log de error
            // Si falla la inserción en admin_empresa, considera eliminar la entrada de usuario que acabas de crear
            // para evitar inconsistencias. Esto requiere lógica adicional.
            // Por ahora, solo lanzamos el error.
            throw newAdminError;
        }

        // Respuesta de éxito
        res.status(201).json({ message: 'Administrador creado exitosamente', admin: newAdmin });

    } catch (err) {
        console.error('Signup Error:', err.message); // Log de error general
        res.status(500).json({ error: err.message });
    }
});

// Ruta para iniciar sesión de administrador de empresa
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
        // Buscar el admin por email (usando cod_usuario)
        const { data: admin, error: adminError } = await supabase
            .from('admin_empresa')
            .select('id_admin, cod_usuario, password')
            .eq('cod_usuario', email)
            .single();

        // Manejar error si no es el de "no rows found"
        if (adminError && adminError.code !== 'PGRST116') {
            console.error('Error finding admin for login:', adminError.message); // Log de error
            throw adminError;
        }

        // Si no se encontró el admin o la contraseña no coincide
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Crear un token JWT
        const token = jwt.sign({ adminId: admin.id_admin }, JWT_SECRET, { expiresIn: '1h' }); // Expira en 1 hora

        // Enviar el token en la respuesta
        res.json({ token });

    } catch (err) {
        console.error('Login Error:', err.message); // Log de error general
        res.status(500).json({ error: err.message });
    }
});

// Ejemplo de ruta protegida para administradores de empresa
// Solo accesible si se envía un token JWT válido en el encabezado Authorization
app.get('/admin/protected', authenticateAdminEmpresa, (req, res) => {
    res.json({ message: `Ruta protegida para el administrador de empresa con ID: ${req.adminId}` });
});

// ====================== CLIENTES ======================

// Ruta para obtener todos los clientes, incluyendo datos del usuario relacionado y su ubicación
app.get('/clientes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cliente')
            .select(`
                cod_usuario,
                Edad,
                Estudios_Trabajo,
                Orientacion_sexual,
                usuario:cod_usuario(  // Relación con la tabla 'usuario' a través de 'cod_usuario'
                    Email,
                    Nombre,
                    -- Seleccionar coordenadas del usuario desde el campo 'location' (tipo geometry/geography)
                    location::geometry -> ST_Y as latitude, // Extraer latitud (Y)
                    location::geometry -> ST_X as longitude // Extraer longitud (X)
                )
            `);

        if (error) throw error; // Si hay un error en la consulta, lanzar la excepción
        res.json(data); // Enviar los datos obtenidos como JSON
    } catch (err) {
        console.error('Error fetching clients:', err.message);
        res.status(500).json({ error: err.message }); // Manejar errores y enviar respuesta 500
    }
});

// Ruta para actualizar los datos de un cliente específico
app.put('/clientes/:id', async (req, res) => {
    const { Edad, Estudios_Trabajo, Orientacion_sexual } = req.body;

    // Crear un objeto con los campos a actualizar que estén presentes en el body
    const updateData = {};
    if (Edad !== undefined) updateData.Edad = Edad;
    if (Estudios_Trabajo !== undefined) updateData.Estudios_Trabajo = Estudios_Trabajo;
    if (Orientacion_sexual !== undefined) updateData.Orientacion_sexual = Orientacion_sexual;

    // Si no se proporcionaron campos para actualizar, retornar error 400
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    try {
        // Realizar la actualización en la tabla 'cliente' filtrando por 'cod_usuario'
        const { data: clienteData, error: clienteError } = await supabase
            .from('cliente')
            .update(updateData)
            .eq('cod_usuario', req.params.id) // Filtrar por el ID del cliente (cod_usuario)
            .select(); // Seleccionar los datos actualizados para confirmar

        if (clienteError) throw clienteError; // Si hay un error, lanzar la excepción

        // Si no se encontró el cliente con ese ID, retornar error 404
        if (!clienteData || clienteData.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        res.json(clienteData[0]); // Enviar los datos del cliente actualizado
    } catch (err) {
        console.error('Error updating client:', err.message); // Log de error
        res.status(500).json({ error: err.message }); // Manejar errores
    }
});

// ====================== USUARIOS (Rutas de Ubicación) ======================

// Ruta para actualizar la ubicación de un usuario específico
// Espera en el body: { latitude: number, longitude: number }
// El ID del usuario a actualizar viene en el parámetro URL :cod_usuario
// !!! IMPORTANTE: Implementa AUTENTICACIÓN/AUTORIZACIÓN aquí para asegurar que
// un usuario solo pueda actualizar SU PROPIA ubicación o que solo un admin pueda hacerlo.
app.put('/usuarios/:cod_usuario/location', async (req, res) => {
    const usuarioCod = req.params.cod_usuario;
    const { latitude, longitude } = req.body;

    // --- PENDIENTE DE IMPLEMENTAR AUTENTICACIÓN/AUTORIZACIÓN ---
    // Ej: Verificar si el usuario autenticado (por JWT u otro método) es el mismo que usuarioCod
    // if (req.user.cod_usuario !== usuarioCod) {
    //    return res.status(403).json({ error: 'No tienes permiso para actualizar esta ubicación' });
    // }
    // --- FIN PENDIENTE ---

    // Validar que se enviaron latitud y longitud como números
    if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Valid latitude and longitude numbers are required' });
    }

    try {
        // Construir el valor del campo 'location' en formato WKT (Well-Known Text) para PostGIS
        // IMPORTANTE: POINT espera (longitude, latitude) en WKT
        const locationPointWkt = `POINT(${longitude} ${latitude})`;

        // Realizar la actualización del campo 'location' en la tabla 'usuario'
        const { data, error } = await supabase
            .from('usuario') // Actualizar la tabla 'usuario'
            .update({ location: locationPointWkt }) // Establecer el nuevo valor de location
            .eq('cod_usuario', usuarioCod) // Filtrar por el cod_usuario
            // Seleccionar las coordenadas actualizadas para confirmar (usando ::geometry -> ST_Y/X)
            .select('cod_usuario, location::geometry -> ST_Y as latitude, location::geometry -> ST_X as longitude');

        if (error) {
            console.error('Error updating user location:', error.message); // Log de error
            throw new Error(`Database error updating location: ${error.message}`);
        }

        // Si no se encontró el usuario, retornar error 404
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado con ese código' });
        }

        res.json(data[0]); // Retornar el usuario actualizado con su nueva ubicación
    } catch (err) {
        console.error('Unhandled error updating user location:', err.message); // Log de error
        res.status(500).json({ error: err.message }); // Manejar errores
    }
});

// Ruta para encontrar usuarios dentro de un radio específico
// Espera en los query params: ?lat=...&lon=...&radius=... (radius en metros)
// Opcional: Puedes proteger esta ruta si solo usuarios autenticados pueden buscar cercanos
app.get('/usuarios/nearby', async (req, res) => {
    const { lat, lon, radius } = req.query; // Recibir latitud, longitud y radio de los query params

    // Validar que los parámetros requeridos estén presentes
    if (lat === undefined || lon === undefined || radius === undefined) {
        return res.status(400).json({ error: 'Parameters lat, lon, and radius are required' });
    }

    // Convertir los parámetros a números flotantes
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusInMeters = parseFloat(radius);

    // Validar que los parámetros sean números válidos y el radio no sea negativo
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInMeters) || radiusInMeters < 0) {
        return res.status(400).json({ error: 'Invalid parameters: lat, lon must be numbers, radius must be a non-negative number.' });
    }

    try {
        // Crear el punto de referencia en formato WKT (Well-Known Text) para la consulta PostGIS
        const centerPointWkt = `POINT(${longitude} ${latitude})`; // WKT format (longitude, latitude)

        // Usar el operador 'st_dwithin' de PostGIS a través del filtro de Supabase
        // El operador st_dwithin para GEOGRAPHY espera (columna_geografia, punto_referencia, distancia_en_metros)
        const { data, error } = await supabase
            .from('usuario') // Consultar la tabla 'usuario'
            .select(`
                cod_usuario,
                Email,
                Nombre,
                -- Seleccionar coordenadas de los usuarios encontrados
                location::geometry -> ST_Y as latitude,
                location::geometry -> ST_X as longitude
            `)
            .not('location', 'is', null) // Opcional: Excluir usuarios sin ubicación registrada
            // Aplicar el filtro st_dwithin a la columna 'location'
            .filter('location', 'st_dwithin', `${centerPointWkt}, ${radiusInMeters}`);

        if (error) {
            console.error('Error fetching nearby users:', error.message); // Log de error
            throw new Error(`Database error finding nearby users: ${error.message}`);
        }

        // Los datos contendrán los usuarios encontrados dentro del radio, con sus coordenadas.
        res.json(data); // Enviar los resultados como JSON

    } catch (err) {
        console.error('Unhandled error fetching nearby users:', err.message); // Log de error
        res.status(500).json({ error: err.message }); // Manejar errores
    }
});


// ====================== EMPRESAS ======================

// Ruta para obtener los eventos de una empresa específica por su NIF
app.get('/empresas/:nif/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo) // Relación con la tabla 'local'
            `)
            .eq('NIF', req.params.nif); // Filtrar por el NIF de la empresa

        if (error) throw error; // Si hay un error, lanzar la excepción
        res.json(data); // Enviar los datos como JSON
    } catch (err) {
        console.error('Error fetching company events:', err.message); // Log de error
        res.status(500).json({ error: err.message }); // Manejar errores
    }
});

// ====================== EVENTOS ======================

// Ruta para obtener todos los eventos
app.get('/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo), // Relación con 'local'
                empresa:NIF(Nombre) // Relación con 'empresa' (asumiendo que NIF es la clave foránea)
            `);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching all events:', err.message); // Log de error
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener un evento específico por su ID
app.get('/eventos/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo, Direccion), // Relación con 'local' incluyendo Dirección
                empresa:NIF(Nombre) // Relación con 'empresa'
            `)
            .eq('cod_evento', req.params.id) // Filtrar por el ID del evento
            .single(); // Esperar un único resultado

        // Manejar error si no es el de "no rows found"
        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // Si se encontró el evento, enviarlo; de lo contrario, enviar 404
        data ? res.json(data) : res.status(404).json({ error: "Evento no encontrado" });
    } catch (err) {
        console.error('Error fetching event by ID:', err.message); // Log de error
        res.status(500).json({ error: err.message });
    }
});

// Ruta para actualizar un evento específico por su ID
app.put('/eventos/:id', async (req, res) => {
    const { nombre, hora_inicio, hora_finalizacion } = req.body;

    // Crear objeto con los campos a actualizar presentes en el body
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
    if (hora_finalizacion !== undefined) updateData.hora_finalizacion = hora_finalizacion;

    // Si no hay campos para actualizar, retornar error 400
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    try {
        // Realizar la actualización en la tabla 'evento'
        const { data, error } = await supabase
            .from('evento')
            .update(updateData)
            .eq('cod_evento', req.params.id) // Filtrar por el ID del evento
            .select(); // Seleccionar los datos actualizados

        if (error) throw error;

        // Si no se encontró el evento para actualizar, retornar 404
        if (!data || data.length === 0) {
            return res.status(404).json({ error: "Evento no encontrado para actualizar" });
        }

        res.json(data[0]); // Enviar los datos actualizados
    } catch (err) {
        console.error('Error updating event:', err.message); // Log de error
        res.status(500).json({ error: err.message });
    }
});

// ====================== LOCALES ======================

// Ruta para obtener los eventos de un local específico por su ID
app.get('/locales/:id/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                empresa:NIF(Nombre) // Relación con 'empresa'
            `)
            .eq('cod_local', req.params.id); // Filtrar por el ID del local

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching local events:', err.message); // Log de error
        res.status(500).json({ error: err.message });
    }
});

// ==============================================
// Manejo de Errores Global
// ==============================================

// Middleware para manejar errores que ocurran en las rutas
app.use((err, req, res, next) => {
    console.error(err.stack); // Imprimir el stack trace del error en la consola del servidor
    // Determinar el mensaje de error a enviar al cliente (evitar detalles sensibles en producción)
    const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor';
    res.status(500).json({
        error: 'Error interno del servidor',
        detalles: errorMessage
    });
});

// ==============================================
// Inicio del Servidor
// ==============================================

// Iniciar el servidor Express para que escuche en el puerto definido
app.listen(port, () => {
    // Este mensaje se muestra en la consola cuando el servidor inicia
    console.log(`Servidor Supabase escuchando en http://localhost:${port}`);
});
