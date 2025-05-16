const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Importar multer
const app = express();
const port = 3001;
// Asegúrate de que db.js exporta 'supabase' y 'pool' correctamente
// Nota: El código usa principalmente 'supabase'. Asegúrate de que 'pool' es necesario o elimínalo si no se usa.
const { supabase, pool } = require('./db');

// Configurar Supabase Storage (asegúrate de que tu instancia de Supabase está inicializada correctamente en db.js)
const supabaseStorage = supabase.storage;

// Configurar Multer para almacenamiento en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage, // Usamos el storage en memoria que definimos
    limits: { fileSize: 5 * 1024 * 1024 }, // Opcional: Límite de tamaño de archivo (ej: 5MB por archivo)
    fileFilter: (req, file, cb) => { // Opcional: Define qué tipos de archivo aceptar
        // Aquí verificamos si el tipo MIME del archivo empieza por 'image/'
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Acepta el archivo
        } else {
            // Rechaza el archivo y envía un error
            cb(new Error('Tipo de archivo no soportado. Sube solo imágenes.'), false);
        }
    }
});

// Middleware para habilitar CORS y parsear JSON (Multer manejará multipart/form-data en rutas específicas)
app.use(cors());
app.use(express.json()); // Sigue siendo necesario para otras rutas que usen JSON o para los campos de texto en rutas con Multer


// Clave secreta para firmar los tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'factiodb_default_secret';

// Middleware para verificar el token JWT de usuario (Sin cambios aquí)
const authenticateUser = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Autenticación de usuario requerida' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'user') {
            return res.status(401).json({ error: 'Autenticación de usuario requerida: Token de tipo incorrecto' });
        }

        const { data: user, error } = await supabase
            .from('usuario')
            .select('cod_usuario, username')
            .eq('cod_usuario', decoded.codUsuario)
            .single();

        if (error || !user) {
            console.error('User not found during authentication:', decoded.codUsuario);
            return res.status(401).json({ error: 'Usuario no encontrado o token inválido' });
        }

        req.codUsuario = user.cod_usuario;
        req.username = user.username;

        next();
    } catch (error) {
        console.error('Error verifying user token:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Por favor, inicia sesión de nuevo.' });
        }
        return res.status(401).json({ error: 'Token de usuario inválido' });
    }
};


// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ====================== RUTAS DE AUTENTICACIÓN Y DATOS DE USUARIO ======================

// RUTA DE REGISTRO DE USUARIO - MODIFICADA PARA SUBIR FOTOS
// Aplicamos el middleware de multer aquí. Esperamos campos de archivo llamados 'foto1' y 'foto2'.
app.post('/usuarios/signup', upload.fields([{ name: 'foto1', maxCount: 1 }, { name: 'foto2', maxCount: 1 }]), async (req, res) => {

    // req.body contendrá los campos de texto (email, password, edad, etc.)
    // req.files contendrá los archivos subidos, agrupados por el nombre del campo ('foto1', 'foto2')
    const { email, username, password, edad, estudios_trabajo, orientacion_sexual } = req.body;
    const fotos = req.files; // { foto1: [{...}], foto2: [{...}] }

    // 1. Validar campos de texto requeridos
    if (!email || !username || !password) {
        // Si faltan campos de texto requeridos, retornamos error. Multer ya habrá procesado los archivos (en memoria).
        return res.status(400).json({ error: 'Email, username y password son requeridos para el registro' });
    }

    // Validar formato básico de email (opcional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // 2. Validar que al menos una foto fue subida si es obligatorio (Descomentar si las fotos son obligatorias)
    // if (!fotos || (!fotos['foto1'] && !fotos['foto2'])) {
    //     return res.status(400).json({ error: 'Se requiere subir al menos una foto.' });
    // }


    let newUser = null; // Variable para guardar el usuario insertado inicialmente

    try {
        // 3. Verificar si el email o el username ya existen (Sin cambios aquí)
        const { data: existingUser, error: existingUserError } = await supabase
            .from('usuario')
            .select('cod_usuario, username')
            .or(`email.eq.${email},username.eq.${username}`);

        if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Error checking existing user during signup:', existingUserError.message);
            throw existingUserError; // Lanza el error si no es "no rows found"
        }

        if (existingUser && existingUser.length > 0) {
            const emailExists = existingUser.some(u => u.cod_usuario === email);
            const usernameExists = existingUser.some(u => u.username === username);

            if (emailExists && usernameExists) {
                return res.status(409).json({ error: 'El email y el username ya están registrados.' });
            } else if (emailExists) {
                return res.status(409).json({ error: 'El email ya está registrado.' });
            } else if (usernameExists) {
                return res.status(409).json({ error: 'El username ya está registrado.' });
            }
        }

        // 4. Hashear la contraseña (Sin cambios aquí)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Preparar datos de texto para insertar en 'usuario' (SIN las URLs de las fotos aún)
        const userDataToInsert = {
            // Asumimos que cod_usuario es SERIAL/autoincremental en la DB
            // por lo que no lo incluimos aquí, la DB lo generará
            email: email,
            nombre: username, // Usar username para el campo Nombre si es para mostrar
            username: username,
            password_hash: hashedPassword
        };

        // Añadir campos opcionales de texto si están presentes y son válidos
        if (edad !== undefined && edad !== null && String(edad).trim() !== '') {
            const parsedEdad = parseInt(String(edad).trim(), 10);
            if (!isNaN(parsedEdad)) userDataToInsert.edad = parsedEdad;
        }
        if (estudios_trabajo !== undefined && estudios_trabajo !== null && String(estudios_trabajo).trim() !== '') {
            userDataToInsert.estudios_trabajo = String(estudios_trabajo).trim();
        }
        if (orientacion_sexual !== undefined && orientacion_sexual !== null && String(orientacion_sexual).trim() !== '') {
            userDataToInsert.orientacion_sexual = String(orientacion_sexual).trim();
        }

        // 6. Insertar el usuario en la base de datos para obtener el cod_usuario generado
        // Usamos .select() para obtener los datos del usuario insertado, incluyendo el cod_usuario
        const { data: newUserArray, error: newUserError } = await supabase
            .from('usuario')
            .insert([userDataToInsert])
            // Seleccionamos los campos del usuario insertado, incluyendo el cod_usuario generado
            .select('cod_usuario, email, nombre, username') // Asegúrate de seleccionar al menos cod_usuario
            .single(); // Esperamos un solo resultado

        if (newUserError) {
            console.error('Error inserting new user (before file upload):', newUserError.message);
            if (newUserError.details) console.error('Error details:', newUserError.details);
            if (newUserError.hint) console.error('Error hint:', newUserError.hint);
            // Manejar error de inserción de usuario (ej. conflicto de unicidad que no atrapamos antes)
            if (newUserError.code === '23505') { // Código de error de clave duplicada
                return res.status(409).json({ error: 'Conflicto de datos al insertar usuario.' });
            }
            throw newUserError; // Lanza el error si es otra cosa
        }

        // El usuario se ha creado con éxito. Guardamos el objeto usuario.
        newUser = newUserArray;
        const userId = newUser.cod_usuario; // ¡Aquí obtienes el ID autogenerado del usuario recién creado!

        // 7. Subir las fotos a Supabase Storage (si se proporcionaron)
        const uploadedPhotoUrls = {}; // Objeto para guardar las URLs de las fotos subidas exitosamente

        // Subir la primera foto si está presente en req.files['foto1']
        if (fotos && fotos['foto1'] && fotos['foto1'][0]) {
            const foto1 = fotos['foto1'][0]; // Multer guarda archivos en un array, incluso si maxCount es 1
            // Definir la ruta en Supabase Storage: bucket/ID_USUARIO/nombre_archivo_unico.extension
            // Usamos el userId y un timestamp para asegurar unicidad dentro de la carpeta del usuario
            const filePath1 = `user-photos/${userId}/foto1_${Date.now()}_${foto1.originalname.replace(/\s/g, '_')}`; // Reemplaza espacios si es necesario

            const { data: uploadData1, error: uploadError1 } = await supabaseStorage
                .from('user-photos') // <-- ¡Asegúrate de que este es el nombre de tu bucket en Supabase!
                .upload(filePath1, foto1.buffer, { // foto1.buffer contiene los datos binarios del archivo
                    contentType: foto1.mimetype, // Usar el tipo MIME proporcionado por Multer
                    upsert: false // No sobrescribir si ya existe
                });

            if (uploadError1) {
                console.error('Error uploading foto1 for user', userId, ':', uploadError1.message);
                // Si la subida falla, la URL correspondiente en DB será NULL.
                // En un sistema robusto, manejarías esto (ej. eliminar usuario si la subida de fotos es crítica).
                uploadedPhotoUrls.foto_url_1 = null; // Asegura que el campo sea null en la DB
            } else {
                // Si la subida fue exitosa, obtener la URL pública para guardarla en la DB
                const { data: publicUrlData } = supabaseStorage
                    .from('user-photos')
                    .getPublicUrl(filePath1);
                uploadedPhotoUrls.foto_url_1 = publicUrlData ? publicUrlData.publicUrl : null; // Guarda la URL pública
                console.log('Foto 1 subida exitosamente para usuario', userId);
            }
        } else {
            // Si el archivo 'foto1' no se proporcionó en la petición
            uploadedPhotoUrls.foto_url_1 = null;
        }


        // Subir la segunda foto si está presente en req.files['foto2']
        if (fotos && fotos['foto2'] && fotos['foto2'][0]) {
            const foto2 = fotos['foto2'][0];
            const filePath2 = `user-photos/${userId}/foto2_${Date.now()}_${foto2.originalname.replace(/\s/g, '_')}`;

            const { data: uploadData2, error: uploadError2 } = await supabaseStorage
                .from('user-photos') // <-- ¡Asegúrate de que este es el nombre de tu bucket en Supabase!
                .upload(filePath2, foto2.buffer, {
                    contentType: foto2.mimetype,
                    upsert: false
                });

            if (uploadError2) {
                console.error('Error uploading foto2 for user', userId, ':', uploadError2.message);
                uploadedPhotoUrls.foto_url_2 = null;
            } else {
                const { data: publicUrlData } = supabaseStorage
                    .from('user-photos')
                    .getPublicUrl(filePath2);
                uploadedPhotoUrls.foto_url_2 = publicUrlData ? publicUrlData.publicUrl : null;
                console.log('Foto 2 subida exitosamente para usuario', userId);
            }
        } else {
            // Si el archivo 'foto2' no se proporcionó en la petición
            uploadedPhotoUrls.foto_url_2 = null;
        }

        // 8. Actualizar la fila del usuario recién creado con las URLs de las fotos
        // Esto se hace DESPUÉS de haber creado el usuario inicialmente y subido las fotos
        const { data: updatedUserArray, error: updateError } = await supabase
            .from('usuario')
            .update({
                foto_url_1: uploadedPhotoUrls.foto_url_1,
                foto_url_2: uploadedPhotoUrls.foto_url_2
            })
            .eq('cod_usuario', userId) // ¡Asegúrate de actualizar la fila correcta usando el userId!
            // Seleccionamos los campos finales del usuario para la respuesta
            .select('cod_usuario, email, nombre, username, edad, estudios_trabajo, orientacion_sexual, foto_url_1, foto_url_2')
            .single(); // Esperamos el usuario actualizado

        if (updateError) {
            console.error('Error updating user with photo URLs:', updateError.message);
            // NOTA: Si falla la actualización aquí, el usuario se creó, pero sin las URLs de las fotos.
            // En un sistema robusto, esto podría requerir eliminar el usuario creado y/o los archivos subidos exitosamente.
            if (updateError.details) console.error('Update error details:', updateError.details);
            if (updateError.hint) console.error('Update error hint:', updateError.hint);
            // Decide si quieres lanzar un error aquí o simplemente retornar el usuario sin las URLs
            // Vamos a lanzar un error para indicar que el registro no fue completamente exitoso
            throw new Error("Usuario registrado, pero falló la actualización con URLs de fotos.");
        }


        // 9. Registro exitoso (con URLs si se subieron y actualizaron)
        res.status(201).json({
            message: 'Usuario registrado exitosamente (incluyendo fotos si se proporcionaron y guardaron).',
            user: updatedUserArray // Retorna el usuario con las URLs de fotos actualizadas
        });

    } catch (err) {
        // Catch para errores generales durante el proceso (validación, inserción de usuario, subida de archivos, actualización)
        console.error('User Signup Error (General Catch):', err.message);

        // Si el error ocurrió DESPUÉS de crear el usuario (paso 6) pero ANTES de la actualización final (paso 8),
        // el usuario se creó pero sin las URLs. En un sistema robusto, podrías querer eliminar ese usuario aquí.
        // (Este es un punto de complejidad, no lo implementamos completamente aquí para no alargar el código,
        // pero tenlo en cuenta para producción).
        if (newUser && newUser.cod_usuario) {
            console.warn(`Intento de registro fallido DESPUÉS de crear usuario ${newUser.cod_usuario}. Considerar eliminarlo.`);
            // Supabase client does not have a simple rollback. You'd need
            // to call await supabase.from('usuario').delete().eq('cod_usuario', newUser.cod_usuario);
            // and handle potential errors during deletion.
        }


        // Asegurarse de que el error retornado al frontend es un objeto JSON
        if (res.headersSent) {
            // Si ya enviamos cabeceras (ej. en una validación inicial o un error de update), no enviar más.
            return;
        }
        // Determinar un estado HTTP apropiado. 500 para errores inesperados, 409 para conflictos, 400 para validación.
        const statusCode = err.message && err.message.includes('Conflicto de datos') ? 409 : (err.message && err.message.includes('Tipo de archivo no soportado') ? 400 : 500);
        res.status(statusCode).json({ error: err.message || 'Error interno del servidor durante el registro.' });
    }
});


// RUTA DE LOGIN DE USUARIO (Sin cambios aquí)
app.post('/usuarios/login', async (req, res) => {
    // Espera email O username, y password en el body
    const { email, username, password } = req.body;

    // Validar campos requeridos para login: Se requiere al menos email O username, Y password
    if ((!email && !username) || !password) {
        return res.status(400).json({ error: 'Se requiere email o username, y contraseña para iniciar sesión.' });
    }

    try {
        // 1. Construir la consulta de búsqueda
        let query = supabase.from('usuario').select('cod_usuario, username, password_hash');

        if (email && username) { query = query.eq('email', email).eq('username', username); }
        else if (email) { query = query.eq('email', email); }
        else if (username) { query = query.eq('username', username); }

        const { data: user, error: userError } = await query.single();

        if (userError && userError.code !== 'PGRST116') { console.error('Error buscando usuario para login:', userError.message); throw userError; }

        // 2. Verificar usuario y contraseña
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 3. Generar token
        const token = jwt.sign( { codUsuario: user.cod_usuario, username: user.username, type: 'user' }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });

    } catch (err) {
        console.error('Error durante el login de usuario:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message });
    }
});

// RUTA DE PERFIL DE USUARIO (Modificada para incluir URLs de fotos)
// Requiere el middleware authenticateUser para verificar el token
app.get('/usuarios/profile', authenticateUser, async (req, res) => {
    try {
        // Incluye las nuevas columnas foto_url_1 y foto_url_2 en la selección
        const { data: profile, error } = await supabase
            .from('usuario')
            .select(`
                 cod_usuario,
                 email,
                 nombre,
                 username,
                 edad,
                 estudios_trabajo,
                 orientacion_sexual,
                 foto_url_1, -- <-- Incluido
                 foto_url_2, -- <-- Incluido
                 location::geometry -> ST_Y as latitude,
                 location::geometry -> ST_X as longitude
             `)
            .eq('cod_usuario', req.codUsuario)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user profile:', error.message);
            throw error;
        }

        if (!profile) {
            console.error('User profile not found after successful authentication for user:', req.codUsuario);
            return res.status(404).json({ error: 'Perfil de usuario no encontrado' });
        }

        res.json({
            message: `Datos de perfil para el usuario con email: ${req.codUsuario} / username: ${req.username}`,
            profile: profile
        });

    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: 'Error al cargar el perfil' });
    }
});


// ====================== RUTAS DE USUARIOS (Ubicación) (Sin cambios aquí) ======================

// Ruta para actualizar la ubicación de un usuario específico (Protegida)
// Espera en el body: { latitude: number, longitude: number }
// El ID del usuario a actualizar viene en el parámetro de URL :cod_usuario
app.put('/usuarios/:cod_usuario/location', authenticateUser, async (req, res) => {
    const usuarioCod = req.params.cod_usuario;
    const { latitude, longitude } = req.body;

    if (req.codUsuario !== usuarioCod) {
        console.warn(`Acceso denegado: Usuario ${req.codUsuario} intentó actualizar ubicación de ${usuarioCod}`);
        return res.status(403).json({ error: 'No tienes permiso para actualizar esta ubicación.' });
    }

    if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Se requieren números válidos para latitude y longitude.' });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Valores de latitud (-90 a 90) o longitud (-180 a 180) inválidos.' });
    }


    try {
        const locationPointWkt = `POINT(${longitude} ${latitude})`;

        const { data, error } = await supabase
            .from('usuario')
            .update({ location: locationPointWkt })
            .eq('cod_usuario', usuarioCod)
            .select('cod_usuario, location::geometry -> ST_Y as latitude, location::geometry -> ST_X as longitude');

        if (error) {
            console.error('Error updating user location:', error.message);
            if (error.details) console.error('Error details:', error.details);
            if (error.hint) console.error('Error hint:', error.hint);
            throw new Error(`Database error updating location: ${error.message}`);
        }

        if (!data || data.length === 0) {
            console.error('User not found during location update despite authentication:', usuarioCod);
            return res.status(404).json({ error: 'Usuario no encontrado para actualizar ubicación.' });
        }

        res.json(data[0]);

    } catch (err) {
        console.error('Unhandled error updating user location:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: 'Error al actualizar la ubicación.' });
    }
});

// Ruta para encontrar usuarios dentro de un radio específico (Sin cambios aquí)
app.get('/usuarios/nearby', async (req, res) => {
    const { lat, lon, radius } = req.query;

    if (lat === undefined || lon === undefined || radius === undefined) {
        return res.status(400).json({ error: 'Los parámetros lat, lon y radius son requeridos.' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusInMeters = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInMeters) || radiusInMeters < 0) {
        return res.status(400).json({ error: 'Parámetros inválidos: lat, lon deben ser números, radius debe ser un número no negativo.' });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: 'Valores de latitud (-90 a 90) o longitud (-180 a 180) inválidos en los parámetros de búsqueda.' });
    }

    try {
        const centerPointWkt = `POINT(${longitude} ${latitude})`;

        const { data, error } = await supabase
            .from('usuario')
            .select(`
                cod_usuario,
                email,
                nombre,
                username,
                edad,
                estudios_trabajo,
                orientacion_sexual,
                location::geometry -> ST_Y as latitude,
                location::geometry -> ST_X as longitude
            `)
            .not('location', 'is', null)
            .filter('location', 'st_dwithin', `${centerPointWkt}, ${radiusInMeters}`);

        if (error) {
            console.error('Error fetching nearby users:', error.message);
            if (error.details) console.error('Error details:', error.details);
            if (error.hint) console.error('Error hint:', error.hint);
            throw new Error(`Database error finding nearby users: ${error.message}`);
        }

        res.json(data);

    } catch (err) {
        console.error('Unhandled error fetching nearby users:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: 'Error al buscar usuarios cercanos.' });
    }
});


// ====================== RUTAS DE EMPRESAS Y EVENTOS (Sin cambios aquí) ======================

app.get('/empresas/:nif/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo)
            `)
            .eq('NIF', req.params.nif);

        if (error) { console.error('Error fetching company events:', error.message); throw error; }
        res.json(data);
    } catch (err) {
        console.error('Unhandled error fetching company events:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message });
    }
});

app.get('/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo),
                empresa:NIF(Nombre)
            `);

        if (error) { console.error('Error fetching all events:', error.message); throw error; }
        res.json(data);
    } catch (err) {
        console.error('Unhandled error fetching all events:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message });
    }
});

app.get('/eventos/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                local:cod_local(Nombre, Aforo, Direccion),
                empresa:NIF(Nombre)
            `)
            .eq('cod_evento', req.params.id)
            .single();

        if (error && error.code !== 'PGRST116') { console.error('Error fetching event by ID:', error.message); throw error; }

        if (!data) { return res.status(404).json({ error: "Evento no encontrado" }); }

        res.json(data);
    } catch (err) {
        console.error('Unhandled error fetching event by ID:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message });
    }
});

app.put('/eventos/:id', async (req, res) => {
    const { nombre, hora_inicio, hora_finalizacion } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
    if (hora_finalizacion !== undefined) updateData.hora_finalizacion = hora_finalizacion;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No se proporcionaron campos para actualizar" });
    }

    try {
        const { data, error } = await supabase
            .from('evento')
            .update(updateData)
            .eq('cod_evento', req.params.id)
            .select();

        if (error) { console.error('Error updating event:', error.message); throw error; }

        if (!data || data.length === 0) {
            return res.status(404).json({ error: "Evento no encontrado para actualizar" });
        }

        res.json(data[0]);
    } catch (err) {
        console.error('Unhandled error updating event:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message });
    }
});


// Inicia el servidor
app.listen(port, () => {
    console.log(`Backend corriendo en http://localhost:${port}`);
});