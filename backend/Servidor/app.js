// app.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Importar multer
const app = express();
const port = 3001;


// --- Configuración de Base de Datos y Supabase ---
// Asegúrate de que db.js exporta 'supabase' (cliente Supabase) y 'pool' (pool de pg)
// NECESITAS TENER LA LIBRERÍA 'pg' INSTALADA (npm install pg)
// Y configurar el pool correctamente en db.js con tus credenciales de PostgreSQL
const { supabase, pool } = require('./db');

// Configurar Supabase Storage (asegúrate de que tu instancia de Supabase está inicializada correctamente en db.js)
const supabaseStorage = supabase.storage;

// --- Configuración de Multer ---
// Multer para manejo de carga de archivos (fotos de perfil/usuario)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage, // Usamos el storage en memoria
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de tamaño de archivo (ej: 5MB por archivo)
    fileFilter: (req, file, cb) => { // Define qué tipos de archivo aceptar
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); // Acepta el archivo si es imagen
        } else {
            // Rechaza el archivo
            cb(new Error('Tipo de archivo no soportado. Sube solo imágenes.'), false);
        }
    }
});

// --- Middlewares Globales ---
app.use(cors()); // Habilita CORS para permitir peticiones desde el frontend
app.use(express.json()); // Parsea cuerpos de solicitud con formato JSON


// --- Configuración de Autenticación JWT ---
// Clave secreta para firmar los tokens JWT
// ¡CAMBIA 'factiodb_default_secret' por una clave segura y úsala desde variables de entorno en producción!
const JWT_SECRET = process.env.JWT_SECRET || 'factiodb_default_secret';

// Middleware para verificar el token JWT de usuario y autenticar al usuario
const authenticateUser = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', ''); // Extrae el token 'Bearer'

    if (!token) {
        return res.status(401).json({ error: 'Autenticación de usuario requerida: Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verifica el token
        if (decoded.type !== 'user') {
            return res.status(401).json({ error: 'Autenticación de usuario requerida: Token de tipo incorrecto.' });
        }

        // Busca al usuario en la base de datos usando el ID del token
        // Selecciona solo los campos necesarios para el middleware, o más si los adjuntas al request
        const { data: user, error } = await supabase
            .from('usuario')
            .select('cod_usuario, username, genero, orientacion_sexual') // Selecciona datos que pueden ser útiles en rutas protegidas (género/orientación para filtros)
            .eq('cod_usuario', decoded.codUsuario) // Filtra por el cod_usuario decodificado
            .single(); // Espera un único resultado

        if (error || !user) {
            console.error('Usuario no encontrado durante la autenticación para cod_usuario:', decoded.codUsuario);
            // Esto puede ocurrir si el usuario fue eliminado pero su token aún es válido
            return res.status(401).json({ error: 'Usuario no encontrado o token inválido.' });
        }

        // Adjunta los datos del usuario autenticado al objeto de request
        req.codUsuario = user.cod_usuario;
        req.username = user.username;
        req.userProfileFromAuth = { // Adjunta datos de perfil si son útiles para rutas posteriores
            genero: user.genero,
            orientacion_sexual: user.orientacion_sexual
            // Añade aquí otros campos si los seleccionaste arriba y son necesarios frecuentemente
        };


        next(); // Si la autenticación es exitosa, pasa al siguiente middleware o manejador de ruta
    } catch (error) {
        console.error('Error verificando token JWT de usuario:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Por favor, inicia sesión de nuevo.' });
        }
        // Para otros errores de verificación (token inválido, etc.)
        return res.status(401).json({ error: 'Token de usuario inválido.' });
    }
};


// --- Rutas Públicas (o con middleware específico si es necesario) ---

// Health Check - Ruta simple para verificar que el servidor está corriendo
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ====================== RUTAS DE AUTENTICACIÓN Y DATOS DE USUARIO ======================

// RUTA DE REGISTRO DE USUARIO
// Maneja la carga de archivos de fotos (foto1, foto2) usando Multer
app.post('/usuarios/signup', upload.fields([{ name: 'foto1', maxCount: 1 }, { name: 'foto2', maxCount: 1 }]), async (req, res) => {
    // req.body contendrá los campos de texto
    // req.files contendrá los archivos subidos { foto1: [...], foto2: [...] }
    const { email, username, password, edad, genero, estudios_trabajo, orientacion_sexual } = req.body;
    const fotos = req.files;

    // 1. Validar campos requeridos
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username y password son requeridos para el registro.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido.' });
    }

    let newUser = null; // Variable para guardar el usuario insertado inicialmente

    try {
        // 2. Verificar si el email o el username ya existen
        const { data: existingUsers, error: existingUserError } = await supabase
            .from('usuario')
            .select('cod_usuario, username, email')
            .or(`email.eq.${email},username.eq.${username}`);

        if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Error verificando usuario existente durante registro:', existingUserError.message);
            throw existingUserError;
        }

        if (existingUsers && existingUsers.length > 0) {
            const emailExists = existingUsers.some(u => u.email === email);
            const usernameExists = existingUsers.some(u => u.username === username);

            if (emailExists && usernameExists) { return res.status(409).json({ error: 'El email y el username ya están registrados.' }); }
            if (emailExists) { return res.status(409).json({ error: 'El email ya está registrado.' }); }
            if (usernameExists) { return res.status(409).json({ error: 'El username ya está registrado.' }); }
        }

        // 3. Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Preparar datos de texto para insertar
        const userDataToInsert = {
            email: email,
            nombre: username, // Usar username para el campo Nombre si es para mostrar
            username: username,
            password_hash: hashedPassword
        };

        // Añadir campos opcionales, asegurando que los campos vacíos ('') se envían como NULL
        if (edad !== undefined && edad !== null && String(edad).trim() !== '') {
            const parsedEdad = parseInt(String(edad).trim(), 10);
            if (!isNaN(parsedEdad)) userDataToInsert.edad = parsedEdad;
            else return res.status(400).json({ error: 'El campo edad debe ser un número válido.' }); // Validar edad numérica
        } else { userDataToInsert.edad = null; }

        // Para campos ENUM que vienen como string del frontend, enviar el string.
        // Supabase (y PostgreSQL con ENUM) manejarán la validación contra los valores permitidos.
        // Si el frontend envía un valor no permitido, la inserción fallará con un error de base de datos.
        // Puedes añadir validación aquí si prefieres atrapar el error antes.
        if (genero !== undefined && genero !== null && String(genero).trim() !== '') {
            // Opcional: Validar aquí si el valor está en tu lista de ENUMs ('masculino', 'femenino', 'otro')
            const validGeneros = ['masculino', 'femenino', 'otro']; // O obtén esto de alguna config si es complejo
            const trimmedGenero = String(genero).trim().toLowerCase(); // Convertir a minúsculas para comparar con ENUM
            if (validGeneros.includes(trimmedGenero)) {
                userDataToInsert.genero = trimmedGenero; // Usar valor normalizado (minúsculas)
            } else {
                console.warn(`Valor de género inválido recibido durante registro: ${genero}`);
                userDataToInsert.genero = null; // O retornar un error 400
            }
        } else { userDataToInsert.genero = null; }


        if (estudios_trabajo !== undefined && estudios_trabajo !== null && String(estudios_trabajo).trim() !== '') {
            userDataToInsert.estudios_trabajo = String(estudios_trabajo).trim();
        } else { userDataToInsert.estudios_trabajo = null; }


        if (orientacion_sexual !== undefined && orientacion_sexual !== null && String(orientacion_sexual).trim() !== '') {
            // Opcional: Validar aquí si el valor está en tu lista de ENUMs ('heterosexual', 'homosexual', 'bisexual', 'otro')
            const validOrientaciones = ['heterosexual', 'homosexual', 'bisexual', 'otro'];
            const trimmedOrientacion = String(orientacion_sexual).trim().toLowerCase(); // Convertir a minúsculas
            if (validOrientaciones.includes(trimmedOrientacion)) {
                userDataToInsert.orientacion_sexual = trimmedOrientacion; // Usar valor normalizado
            } else {
                console.warn(`Valor de orientación sexual inválido recibido durante registro: ${orientacion_sexual}`);
                userDataToInsert.orientacion_sexual = null; // O retornar un error 400
            }
        } else { userDataToInsert.orientacion_sexual = null; }


        console.log('Datos a insertar (signup):', userDataToInsert);

        // 5. Insertar el usuario
        const { data: newUserArray, error: newUserError } = await supabase
            .from('usuario')
            .insert([userDataToInsert])
            .select('cod_usuario, email, nombre, username') // Seleccionar campos del usuario insertado
            .single();

        if (newUserError) {
            console.error('Error insertando nuevo usuario:', newUserError.message);
            // Manejar error de base de datos (ej. violación de FK, violación de check constraint, etc.)
            return res.status(400).json({ error: newUserError.message }); // Retornar error de DB al frontend
        }

        newUser = newUserArray; // Guarda el usuario insertado
        const userId = newUser.cod_usuario; // Obtiene el ID autogenerado

        // 6. Subir las fotos a Supabase Storage (si se proporcionaron)
        const uploadedPhotoUrls = {};

        if (fotos && fotos['foto1'] && fotos['foto1'][0]) {
            const foto1 = fotos['foto1'][0];
            const filePath1 = `user-photos/${userId}/foto1_${Date.now()}_${foto1.originalname.replace(/\s/g, '_')}`;
            const { data: uploadData1, error: uploadError1 } = await supabaseStorage.from('user-photos').upload(filePath1, foto1.buffer, { contentType: foto1.mimetype, upsert: false });
            if (uploadError1) { console.error('Error uploading foto1:', uploadError1.message); uploadedPhotoUrls.foto_url_1 = null; }
            else { const { data: publicUrlData } = supabaseStorage.from('user-photos').getPublicUrl(filePath1); uploadedPhotoUrls.foto_url_1 = publicUrlData?.publicUrl || null; }
        } else { uploadedPhotoUrls.foto_url_1 = null; }

        if (fotos && fotos['foto2'] && fotos['foto2'][0]) {
            const foto2 = fotos['foto2'][0];
            const filePath2 = `user-photos/${userId}/foto2_${Date.now()}_${foto2.originalname.replace(/\s/g, '_')}`;
            const { data: uploadData2, error: uploadError2 } = await supabaseStorage.from('user-photos').upload(filePath2, foto2.buffer, { contentType: foto2.mimetype, upsert: false });
            if (uploadError2) { console.error('Error uploading foto2:', uploadError2.message); uploadedPhotoUrls.foto_url_2 = null; }
            else { const { data: publicUrlData } = supabaseStorage.from('user-photos').getPublicUrl(filePath2); uploadedPhotoUrls.foto_url_2 = publicUrlData?.publicUrl || null; }
        } else { uploadedPhotoUrls.foto_url_2 = null; }


        // 7. Actualizar la fila del usuario con las URLs de las fotos (si se subieron)
        const { data: updatedUserArray, error: updateError } = await supabase
            .from('usuario')
            .update({
                foto_url_1: uploadedPhotoUrls.foto_url_1,
                foto_url_2: uploadedPhotoUrls.foto_url_2
            })
            .eq('cod_usuario', userId)
            .select('cod_usuario, email, nombre, username, edad, genero, estudios_trabajo, orientacion_sexual, foto_url_1, foto_url_2, url_fotoperfil')
            .single();

        if (updateError) {
            console.error('Error actualizando usuario con URLs de fotos:', updateError.message);
            // TODO: Considerar borrar el usuario y las fotos subidas si esta actualización falla y es crítica.
            // Por ahora, simplemente logueamos el error y devolvemos el usuario sin las URLs (o con las que se guardaron).
            // Si el frontend necesita las URLs para continuar, esto podría ser un problema.
            // Decidimos devolver un error al frontend para indicar un registro incompleto.
            // return res.status(500).json({ error: "Usuario registrado, pero falló la actualización con URLs de fotos." });
            // Alternativa: loguear y continuar, devolviendo el usuario sin las URLs.
            console.warn("Usuario registrado, pero actualización de fotos falló. Devolviendo usuario sin fotos.");
            return res.status(201).json({
                message: 'Usuario registrado exitosamente (falló actualización de fotos).',
                user: newUser // Retornar el usuario original insertado (sin URLs)
            });
        }

        // 8. Registro exitoso
        res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: updatedUserArray // Retorna el usuario actualizado (con URLs de fotos si se subieron)
        });

    } catch (err) {
        console.error('User Signup Error (General Catch):', err.message);
        // Si el error ocurrió después de crear el usuario pero antes de la actualización final,
        // el usuario puede quedar creado sin fotos. Considera implementar lógica de limpieza.
        if (newUser && newUser.cod_usuario) {
            console.warn(`Intento de registro fallido DESPUÉS de crear usuario ${newUser.cod_usuario}.`);
        }
        if (res.headersSent) return;
        const statusCode = err.message && (err.message.includes('Conflicto de datos') || err.message.includes('llave duplicada')) ? 409 : (err.message && err.message.includes('Tipo de archivo no soportado') ? 400 : 500);
        res.status(statusCode).json({ error: err.message || 'Error interno del servidor durante el registro.' });
    }
});


// RUTA DE LOGIN DE USUARIO
app.post('/usuarios/login', async (req, res) => {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
        return res.status(400).json({ error: 'Se requiere email o username, y contraseña para iniciar sesión.' });
    }

    try {
        // Construir la consulta de búsqueda. Permite login por email O username.
        // Usar pool.query para flexibilidad si es necesario, pero Supabase client es simple aquí.
        const { data: user, error: userError } = await supabase
            .from('usuario')
            .select('cod_usuario, username, password_hash')
            .or(`email.eq.${email},username.eq.${username}`) // Buscar por email O username
            .single();

        if (userError && userError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Error buscando usuario para login:', userError.message);
            throw userError;
        }

        // Verificar si se encontró un usuario Y si la contraseña es correcta
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            // Importante: No distinguir entre "usuario no encontrado" y "contraseña incorrecta" por seguridad.
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Generar token JWT con el cod_usuario y username
        const token = jwt.sign( { codUsuario: user.cod_usuario, username: user.username, type: 'user' }, JWT_SECRET, { expiresIn: '1h' }); // Token expira en 1 hora

        res.json({ token }); // Retorna el token al frontend

    } catch (err) {
        console.error('Error durante el login de usuario:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message || 'Error interno del servidor durante el login.' });
    }
});

// RUTA DE PERFIL DE USUARIO (Protegida)
// Requiere el middleware authenticateUser para verificar el token y adjuntar req.codUsuario
app.get('/usuarios/profile', authenticateUser, async (req, res) => {
    try {
        // req.codUsuario contiene el ID del usuario autenticado, obtenido del token por el middleware
        const usuarioCod = req.codUsuario;

        // Selecciona los campos del perfil. ¡Eliminadas las referencias a 'bio' e 'intereses'!
        const { data: profile, error } = await supabase
            .from('usuario')
            .select(`
                 cod_usuario,
                 email,
                 nombre,
                 username,
                 edad,
                 genero,
                 estudios_trabajo,
                 orientacion_sexual,
                 url_fotoperfil,
                 foto_url_1,
                 foto_url_2
             `)
            .eq('cod_usuario', usuarioCod) // Filtra por el ID del usuario autenticado
            .single(); // Espera un único resultado

        if (error && error.code !== 'PGRST116') {
            console.error('Error obteniendo perfil de usuario de Supabase:', error.message);
            throw error; // Lanza el error para que el catch general lo maneje
        }

        if (!profile) {
            // Esto no debería ocurrir si el middleware autenticó al usuario correctamente
            console.error('Perfil de usuario no encontrado para el usuario autenticado:', usuarioCod);
            return res.status(404).json({ error: 'Perfil de usuario no encontrado.' });
        }

        res.json({
            message: `Datos de perfil para el usuario ${profile.username}`,
            profile: profile // Retorna el objeto de perfil completo
        });

    } catch (err) {
        console.error('Error en la ruta /usuarios/profile:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message || 'Error al cargar el perfil.' });
    }
});


// RUTA: ACTUALIZAR PERFIL DE USUARIO (Protegida)
// Permite actualizar campos de texto y/o subir una nueva foto de perfil
// Espera en el body (FormData): campos de texto y un archivo ('fotoperfil')
// El ID del usuario a actualizar viene en el parámetro de URL :cod_usuario
app.put('/usuarios/:cod_usuario', authenticateUser, upload.single('fotoperfil'), async (req, res) => {
    const usuarioCodToUpdate = parseInt(req.params.cod_usuario, 10); // ID del usuario a actualizar (del URL)
    const usuarioAutenticadoCod = req.codUsuario; // ID del usuario autenticado (del token)
    const fotoperfil = req.file; // Archivo de foto de perfil subido por Multer

    // 1. Verificar que el usuario autenticado tiene permiso para actualizar este perfil
    if (usuarioAutenticadoCod !== usuarioCodToUpdate) {
        console.warn(`Intento de actualización de perfil no autorizado. Usuario ${usuarioAutenticadoCod} intentó actualizar a ${usuarioCodToUpdate}.`);
        return res.status(403).json({ error: 'No tienes permiso para actualizar este perfil.' });
    }
    if (isNaN(usuarioAutenticadoCod)) { // Doble chequeo, ya debería estar validado por auth middleware
        return res.status(401).json({ error: 'Usuario autenticado inválido.' });
    }


    // Desestructurar los campos de texto del body procesado por Multer
    // ¡Eliminadas las referencias a 'bio' e 'intereses'!
    const { email, username, password, edad, genero, estudios_trabajo, orientacion_sexual, nombre } = req.body;
    // Nota: 'nombre' en DB parece ser el nombre de display, no necesariamente el username. Ajusta si es necesario.

    // 2. Preparar los datos para la actualización
    const updateData = {};

    // Añadir campos de texto a updateData solo si están presentes en el body (no 'undefined')
    // y manejar cadenas vacías ('') estableciéndolas a NULL en la DB.
    // Manejar validaciones específicas (email, edad, etc.).
    if (email !== undefined) {
        const trimmedEmail = String(email || '').trim(); // Tratar null/undefined como string vacío
        if (trimmedEmail !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return res.status(400).json({ error: 'Formato de email inválido.' });
            }
            updateData.email = trimmedEmail;
        } else { updateData.email = null; }
    }

    if (username !== undefined) { const trimmedUsername = String(username || '').trim(); updateData.username = trimmedUsername !== '' ? trimmedUsername : null; }
    if (nombre !== undefined) { const trimmedNombre = String(nombre || '').trim(); updateData.nombre = trimmedNombre !== '' ? trimmedNombre : null; }
    // ¡Eliminadas las referencias a 'bio' e 'intereses'!
    // if (bio !== undefined) { const trimmedBio = String(bio || '').trim(); updateData.bio = trimmedBio !== '' ? trimmedBio : null; }
    // if (intereses !== undefined) { const trimmedIntereses = String(intereses || '').trim(); updateData.intereses = trimmedIntereses !== '' ? trimmedIntereses : null; }
    if (estudios_trabajo !== undefined) { const trimmedEstudios = String(estudios_trabajo || '').trim(); updateData.estudios_trabajo = trimmedEstudios !== '' ? trimmedEstudios : null; }


    // Manejo de la contraseña: Solo actualizar si se proporciona una nueva contraseña no vacía
    if (password !== undefined && password !== null && String(password).trim() !== '') {
        updateData.password_hash = await bcrypt.hash(String(password).trim(), 10); // ¡Hashear la nueva contraseña!
    }

    // Manejo de Edad: Validar si es un número o vacío/nulo
    if (edad !== undefined) {
        const trimmedEdad = String(edad || '').trim();
        if (trimmedEdad !== '') {
            const parsedEdad = parseInt(trimmedEdad, 10);
            if (!isNaN(parsedEdad)) {
                updateData.edad = parsedEdad;
            } else {
                return res.status(400).json({ error: 'El campo edad debe ser un número válido.' });
            }
        } else { updateData.edad = null; } // Establecer a NULL si se envía vacío
    }

    // Manejo de campos ENUM: Normalizar a minúsculas y validar si es necesario
    if (genero !== undefined) {
        const trimmedGenero = String(genero || '').trim().toLowerCase();
        const validGeneros = ['masculino', 'femenino', 'otro'];
        if (trimmedGenero === '') updateData.genero = null; // Si está vacío, poner NULL
        else if (validGeneros.includes(trimmedGenero)) updateData.genero = trimmedGenero;
        else {
            console.warn(`Valor de género inválido recibido durante actualización: ${genero}`);
            return res.status(400).json({ error: `Valor de género inválido: "${genero}". Los valores permitidos son: masculino, femenino, otro.` });
        }
    }

    if (orientacion_sexual !== undefined) {
        const trimmedOrientacion = String(orientacion_sexual || '').trim().toLowerCase();
        const validOrientaciones = ['heterosexual', 'homosexual', 'bisexual', 'otro'];
        if (trimmedOrientacion === '') updateData.orientacion_sexual = null; // Si está vacío, poner NULL
        else if (validOrientaciones.includes(trimmedOrientacion)) updateData.orientacion_sexual = trimmedOrientacion;
        else {
            console.warn(`Valor de orientación sexual inválido recibido durante actualización: ${orientacion_sexual}`);
            return res.status(400).json({ error: `Valor de orientación sexual inválido: "${orientacion_sexual}". Los valores permitidos son: heterosexual, homosexual, bisexual, otro.` });
        }
    }


    // 3. Manejar la subida de la nueva foto de perfil (si se proporcionó)
    if (fotoperfil) {
        const filePath = `user-photos/${usuarioAutenticadoCod}/profile_photo_${usuarioAutenticadoCod}.${fotoperfil.originalname.split('.').pop()}`; // Nombre fijo por usuario ID para sobrescribir
        const { data: uploadData, error: uploadError } = await supabaseStorage.from('user-photos').upload(filePath, fotoperfil.buffer, { contentType: fotoperfil.mimetype, upsert: true });

        if (uploadError) {
            console.error('Error uploading profile photo:', uploadError.message);
            // No retornar error 500 si solo falla la foto, a menos que sea crítico.
            // Loguear y continuar sin actualizar la URL de la foto de perfil si la subida falló.
        } else {
            const { data: publicUrlData } = supabaseStorage.from('user-photos').getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
                updateData.url_fotoperfil = publicUrlData.publicUrl; // <-- USAR LA COLUMNA url_fotoperfil
                console.log('Foto de perfil actualizada para usuario', usuarioAutenticadoCod, ':', updateData.url_fotoperfil);
            }
        }
    }
    // TODO: Lógica para ELIMINAR la foto de perfil si el frontend lo solicita.
    // Requiere un campo adicional del frontend (ej: 'delete_profile_photo: true')


    // 4. Realizar la actualización en la base de datos
    if (Object.keys(updateData).length === 0) {
        // Si no hay campos para actualizar Y no se subió archivo
        if (!fotoperfil) {
            console.log('No hay datos para actualizar para el usuario:', usuarioAutenticadoCod);
            // Retornar los datos del perfil actual ya que no hubo cambios (opcionalmente traerlos de la DB)
            // O simplemente retornar un mensaje de éxito sin cambios.
            // ¡Eliminadas las referencias a 'bio' e 'intereses' en la selección de retorno!
            const { data: currentUserProfile } = await supabase.from('usuario').select('cod_usuario, email, nombre, username, edad, genero, estudios_trabajo, orientacion_sexual, url_fotoperfil, foto_url_1, foto_url_2').eq('cod_usuario', usuarioAutenticadoCod).single();
            return res.status(200).json({ message: 'No hay cambios para guardar.', profile: currentUserProfile });
        }
        // Si se subió foto pero no hay campos de texto, updateData está vacío pero procederemos.
    }


    try {
        const { data: updatedUserArray, error: updateError } = await supabase
            .from('usuario')
            .update(updateData) // Usar el objeto updateData preparado
            .eq('cod_usuario', usuarioAutenticadoCod) // Filtrar por el ID del usuario autenticado
            // Seleccionar los campos actualizados para retornarlos en la respuesta
            // ¡Eliminadas las referencias a 'bio' e 'intereses'!
            .select('cod_usuario, email, nombre, username, edad, genero, estudios_trabajo, orientacion_sexual, url_fotoperfil, foto_url_1, foto_url_2')
            .single();

        if (updateError) {
            console.error('Error actualizando perfil de usuario en base de datos:', updateError.message);
            if (updateError.code === '23505') { // Código de error de clave duplicada (email, username)
                return res.status(409).json({ error: 'Conflicto de datos: El email o username ya están en uso.' });
            }
            // Si es otro error de base de datos
            return res.status(400).json({ error: error.message }); // Retornar el mensaje de error de DB al frontend
        }

        if (!updatedUserArray) {
            // Esto no debería ocurrir si el usuario existe
            console.error('Usuario no encontrado después de una actualización exitosa?', usuarioAutenticadoCod);
            return res.status(404).json({ error: 'Usuario no encontrado después de la actualización.' });
        }

        // 5. Actualización exitosa
        res.json({
            message: 'Perfil actualizado exitosamente.',
            profile: updatedUserArray // Retorna los datos del perfil actualizado
        });

    } catch (err) {
        console.error('Error general en la ruta PUT /usuarios/:cod_usuario:', err.message);
        if (res.headersSent) return;
        res.status(500).json({ error: err.message || 'Error interno del servidor al actualizar perfil.' });
    }
});


// ====================== NUEVAS RUTAS PARA EVENTOS Y MATCHING ======================

// RUTA 1: GET /api/eventos/proximos (Listar eventos próximos)
// Protegida: solo usuarios logueados pueden ver eventos
app.get('/api/eventos/proximos', authenticateUser, async (req, res) => {
    try {
        // Usamos pool.query para mayor flexibilidad con fechas y posibles joins a 'local' si es necesario
        // Asegúrate de que las columnas hora_inicio/hora_finalizacion en DB son TIMESTAMP
        const query = `
            SELECT
                e.cod_evento,
                e.nombre,
                e.hora_inicio,
                e.hora_finalizacion,
                e.descripcion,
                e.imagen_url,
                l.nombre AS nombre_local,
                l.aforo, -- Añadido: Aforo del local
                e.hombres_dentro, -- Añadido: Hombres dentro del evento
                e.mujeres_dentro -- Añadido: Mujeres dentro del evento
            FROM
                evento e
                    JOIN
                local l ON e.cod_local = l.cod_local
            WHERE
                e.hora_finalizacion >= CURRENT_TIMESTAMP -- O usa hora_inicio si es más apropiado
            ORDER BY
                e.hora_inicio;
        `;
        console.log("DEBUG: Executing events query:", query); // Log de depuración
        const { rows: eventos } = await pool.query(query); // Usando pool.query
        console.log("DEBUG: Events query result count:", eventos.length); // Log de depuración

        res.json(eventos);

    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ error: 'Error al obtener eventos próximos.' });
    }
});
// RUTA 2: POST /api/eventos/:eventoId/apuntarse (Registrar participación)
// Protegida: solo usuarios logueados pueden apuntarse
app.post('/api/eventos/:eventoId/apuntarse', authenticateUser, async (req, res) => {
    const eventoId = parseInt(req.params.eventoId, 10);
    const usuarioId = req.codUsuario; // Obtenido del token autenticado

    if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID de evento inválido.' });
    }

    try {
        // Insertar en participacion_evento
        const { data, error } = await supabase
            .from('participacion_evento')
            .insert([{ usuario_id: usuarioId, evento_id: eventoId }])
            .select() // Seleccionar para obtener los datos insertados si es necesario
            .single(); // Esperar un solo resultado

        if (error) {
            console.error('Error registrando participación:', error.message);
            if (error.code === '23505') { // Código de error de clave duplicada (ya apuntado)
                return res.status(409).json({ error: 'Ya estás apuntado a este evento.' });
            }
            // Si es otro error de base de datos
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Participación registrada exitosamente.', data });

    } catch (error) {
        console.error('Unhandled error in /apuntarse:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// RUTA 3: GET /api/eventos/:eventoId/participantes (Obtener participantes para Tinder view)
// Protegida: requiere autenticación. Deberías validar que el usuario autenticado participa en el evento si es necesario.
app.get('/api/eventos/:eventoId/participantes', authenticateUser, async (req, res) => {
    const eventoId = parseInt(req.params.eventoId, 10);
    const usuarioActualCod = req.codUsuario; // Obtenido del token autenticado

    if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID de evento inválido.' });
    }

    // TODO: Opcional - Validar si el usuarioActualCod realmente participa en este eventoId
    // const { count: participacionCount } = await supabase.from('participacion_evento').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioActualCod).eq('evento_id', eventoId);
    // if (participacionCount === 0) { return res.status(403).json({ error: 'No estás apuntado a este evento.' }); }


    try {
        // Es vital obtener los datos del usuario actual (género, orientación) para la consulta de filtrado
        // Estos datos ya están adjuntos al request por el middleware authenticateUser si los seleccionaste allí
        const currentUserProfile = req.userProfileFromAuth;

        if (!currentUserProfile || !currentUserProfile.genero || !currentUserProfile.orientacion_sexual) {
            console.error('Datos de género/orientación del usuario actual faltantes en el request.');
            // Si el middleware no adjunta estos datos, obténlos aquí:
            const { data: profile, error: profileError } = await supabase.from('usuario').select('genero, orientacion_sexual').eq('cod_usuario', usuarioActualCod).single();
            if (profileError || !profile) {
                console.error('Error fetching current user profile for participant filter:', profileError?.message);
                return res.status(500).json({ error: 'Error al obtener datos del usuario actual para filtrado.' });
            }
            currentUserProfile.genero = profile.genero;
            currentUserProfile.orientacion_sexual = profile.orientacion_sexual;
        }

        const currentUserGenero = currentUserProfile.genero;
        const currentUserOrientacion = currentUserProfile.orientacion_sexual;

        // Consulta compleja usando pool.query con la lógica de filtrado
        // Adaptada a tus valores ENUM ('masculino', 'femenino', 'otro', 'heterosexual', 'homosexual', 'bisexual')
        // Usamos $1 para usuarioActualCod y $2 para eventoId
        const query = `
            SELECT
                u.cod_usuario,
                u.nombre,
                u.edad,
                u.genero,
                u.orientacion_sexual,
                u.foto_url_1,
                u.url_fotoperfil -- Eliminadas las referencias a bio e intereses
            -- Incluye aquí cualquier otro campo de perfil necesario para mostrar en la tarjeta
            FROM
                usuario u
                    JOIN
                participacion_evento pe ON u.cod_usuario = pe.usuario_id
                    -- LEFT JOIN para excluir usuarios a los que ya dimos like en este evento
                    LEFT JOIN
                evento_like el ON el.evento_id = pe.evento_id AND el.liking_usuario_id = $1 AND el.liked_usuario_id = u.cod_usuario
                    -- LEFT JOIN para excluir usuarios a los que ya dimos dislike en este evento (si usas evento_dislike)
                    LEFT JOIN
                evento_dislike ed ON ed.evento_id = pe.evento_id AND ed.disliking_usuario_id = $1 AND ed.disliked_usuario_id = u.cod_usuario
            WHERE
                pe.evento_id = $2 -- Filtra por el evento actual
              AND u.cod_usuario != $1 -- Excluye al propio usuario
              AND el.liking_usuario_id IS NULL -- Excluye usuarios a los que ya se les dio like
              AND ed.disliking_usuario_id IS NULL -- Excluye usuarios a los que ya se les dio dislike (si usas evento_dislike)

          -- Lógica de compatibilidad de orientación sexual y género (usando los datos del usuario actual)
          -- Los valores del usuario actual se comparan directamente con los ENUMs de la columna u.genero y u.orientacion_sexual
              AND (
          -- Usuario actual es Heterosexual: busca género opuesto, orientación hetero o bi
                ($3 = 'heterosexual'::orientacion_sexual_enum
              AND (
                ($4 = 'masculino'::genero_enum AND u.genero = 'femenino'::genero_enum)
               OR ($4 = 'femenino'::genero_enum AND u.genero = 'masculino'::genero_enum)
                )
              AND (u.orientacion_sexual = 'heterosexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'bisexual'::orientacion_sexual_enum)
                )
          -- Usuario actual es Homosexual: busca mismo género, orientación homo o bi
               OR ($3 = 'homosexual'::orientacion_sexual_enum
              AND $4 = u.genero -- Comparar ENUMs directamente
              AND (u.orientacion_sexual = 'homosexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'bisexual'::orientacion_sexual_enum)
                )
          -- Usuario actual es Bisexual: busca cualquier género (masculino/femenino/otro si aplica), orientación hetero, homo o bi
               OR ($3 = 'bisexual'::orientacion_sexual_enum
          -- Si un bisexual busca, es compatible con cualquier género que se le presente (asumiendo solo masculino/femenino/otro)
          -- y busca perfiles con orientación hetero, homo o bi.
              AND (u.orientacion_sexual = 'heterosexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'homosexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'bisexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'otro'::orientacion_sexual_enum)
                )
          -- Usuario actual es 'otro': si 'otro' significa que es compatible con todos los perfiles mostrados:
               OR ($3 = 'otro'::orientacion_sexual_enum
              AND (u.orientacion_sexual = 'heterosexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'homosexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'bisexual'::orientacion_sexual_enum OR u.orientacion_sexual = 'otro'::orientacion_sexual_enum)
                )
          -- Lógica inversa opcional: Si un perfil tiene orientación 'otro', y el usuario actual está abierto a 'otro'
          -- (Esto depende de tu definición de 'otro', puede ser más complejo)
          -- OR u.orientacion_sexual = 'otro'::orientacion_sexual_enum -- Si los perfiles 'otro' son visibles para todos los que les puedan interesar por género/orientación
                )
            ORDER BY
                RANDOM() -- Orden aleatorio para la vista tipo Tinder
                LIMIT 20; -- Limita el número de perfiles a cargar inicialmente
        `; // Cierre correcto de la cadena multilinea

        // Pasar los parámetros de forma segura: usuarioActualCod, eventoId, currentUserOrientacion, currentUserGenero
        const { rows: participantes } = await pool.query(query, [usuarioActualCod, eventoId, currentUserOrientacion, currentUserGenero]);

        res.json(participantes);

    } catch (error) {
        console.error('Error fetching event participants for Tinder view:', error);
        res.status(500).json({ error: 'Error al obtener participantes del evento.' });
    }
});


// RUTA 4: Registrar un "Like"
// Espera { likedUserId: <cod_usuario del usuario gustado> } en el body
// Protegida: requiere autenticación
app.post('/api/eventos/:eventoId/like', authenticateUser, async (req, res) => {
    const eventoId = parseInt(req.params.eventoId, 10);
    const likingUsuarioId = req.codUsuario; // Usuario que da el like (autenticado)
    const { likedUserId } = req.body; // Usuario que recibe el like (del frontend)

    if (isNaN(eventoId) || !likedUserId || isNaN(likedUserId)) { // Validar likedUserId como número
        return res.status(400).json({ error: 'ID de evento o ID de usuario gustado inválido.' });
    }

    if (likingUsuarioId === likedUserId) {
        return res.status(400).json({ error: 'No puedes gustarte a ti mismo.' });
    }

    let client; // Usaremos un cliente de pool para una transacción
    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Iniciar transacción

        // 1. Insertar el like en evento_like
        // Usa el cliente transaccional
        const insertLikeQuery = `
            INSERT INTO evento_like (liking_usuario_id, liked_usuario_id, evento_id)
            VALUES ($1, $2, $3)
                ON CONFLICT (liking_usuario_id, liked_usuario_id, evento_id) DO NOTHING -- No hacer nada si el like ya existe
            RETURNING *; -- Retornar la fila si se insertó (indica si fue una nueva inserción)
        `;
        const insertResult = await client.query(insertLikeQuery, [likingUsuarioId, likedUserId, eventoId]);

        let matchOccurred = false;
        // Si insertResult.rows.length > 0, significa que el like fue insertado por primera vez (no existía ya)
        if (insertResult.rows.length > 0) {
            console.log(`Like registrado: usuario ${likingUsuarioId} -> ${likedUserId} en evento ${eventoId}`);

            // 2. Comprobar si el like recíproco existe (detección de match)
            // Usa el cliente transaccional
            const checkReciprocalQuery = `
                SELECT 1
                FROM evento_like
                WHERE liking_usuario_id = $1
                  AND liked_usuario_id = $2
                  AND evento_id = $3;
            `;
            const reciprocalResult = await client.query(checkReciprocalQuery, [likedUserId, likingUsuarioId, eventoId]);

            if (reciprocalResult.rows.length > 0) {
                // ¡Hay un match! Insertar en evento_match
                const user1 = Math.min(likingUsuarioId, likedUserId);
                const user2 = Math.max(likingUsuarioId, likedUserId);

                // Usa el cliente transaccional
                const insertMatchQuery = `
                    INSERT INTO evento_match (usuario1_id, usuario2_id, evento_id)
                    VALUES ($1, $2, $3)
                        ON CONFLICT (usuario1_id, usuario2_id, evento_id) DO NOTHING; -- No hacer nada si el match ya existe
                `;
                await client.query(insertMatchQuery, [user1, user2, eventoId]);

                matchOccurred = true;
                console.log(`¡MATCH! Usuarios ${user1} y ${user2} en evento ${eventoId}`);

                // TODO: Aquí podrías añadir lógica para, por ejemplo, enviar una notificación push
            }
        } else {
            // Si insertResult.rows.length es 0, el like ya existía. Aún informamos si ya había match.
            console.log(`Like ya existía (ON CONFLICT DO NOTHING): usuario ${likingUsuarioId} -> ${likedUserId} en evento ${eventoId}`);
            // Comprobar si ya hay match para informar al frontend (opcional, pero útil)
            const checkExistingMatch = `
                SELECT 1
                FROM evento_match
                WHERE (usuario1_id = $1 AND usuario2_id = $2) OR (usuario1_id = $2 AND usuario2_id = $1) -- *** CORREGIDO AQUÍ ***
                    AND evento_id = $3;
            `;
            const existingMatchResult = await client.query(checkExistingMatch, [likingUsuarioId, likedUserId, eventoId]);
            if (existingMatchResult.rows.length > 0) {
                matchOccurred = true; // Había match previo
                console.log(`Like ya existía, y el match ya estaba registrado: usuario ${likingUsuarioId} y ${likedUserId} en evento ${eventoId}`);
            }
        }


        await client.query('COMMIT'); // Confirmar la transacción
        // Retornar si ocurrió un match para que el frontend pueda mostrar una animación/modal especial
        res.json({ message: 'Like procesado.', match: matchOccurred });

    } catch (error) {
        // Revertir la transacción en caso de cualquier error
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error processing like or match:', error);
        res.status(500).json({ error: 'Error al procesar like/match.' });
    } finally {
        // Liberar el cliente del pool SIEMPRE
        if (client) {
            client.release();
        }
    }
});

// RUTA 5: Registrar un "Dislike" (Si usas tabla evento_dislike)
// Espera { dislikedUserId: <cod_usuario del usuario rechazado> } en el body
// Protegida: requiere autenticación
// Si no usas dislikes explícitos, puedes eliminar esta ruta.
app.post('/api/eventos/:eventoId/dislike', authenticateUser, async (req, res) => {
    const eventoId = parseInt(req.params.eventoId, 10);
    const dislikingUsuarioId = req.codUsuario; // Usuario que da el dislike (autenticado)
    const { dislikedUserId } = req.body; // Usuario que recibe el dislike (del frontend)

    if (isNaN(eventoId) || !dislikedUserId || isNaN(dislikedUserId)) { // Validar dislikedUserId como número
        return res.status(400).json({ error: 'ID de evento o ID de usuario rechazado inválido.' });
    }

    if (dislikingUsuarioId === dislikedUserId) {
        return res.status(400).json({ error: 'No puedes rechazarte a ti mismo.' });
    }

    try {
        // Insertar en evento_dislike
        const { data, error } = await supabase // Puedes usar supabase client para inserciones simples
            .from('evento_dislike')
            .insert([{ disliking_usuario_id: dislikingUsuarioId, disliked_usuario_id: dislikedUserId, evento_id: eventoId }])
            .select()
            .single(); // O usar .count() si no necesitas la fila retornada

        if (error) {
            console.error('Error registrando dislike:', error.message);
            if (error.code === '23505') { // Código de error de clave duplicada
                return res.status(409).json({ error: 'Ya has rechazado a este usuario en este evento.' });
            }
            // Si es otro error de base de datos
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'Dislike registrado.', data });

    } catch (error) {
        console.error('Unhandled error in /dislike:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// RUTA 6: Obtener lista de Matches para un evento específico para el usuario actual
// Protegida: requiere autenticación
app.get('/api/eventos/:eventoId/matches', authenticateUser, async (req, res) => {
    const eventoId = parseInt(req.params.eventoId, 10);
    const usuarioActualCod = req.codUsuario; // Usuario autenticado

    if (isNaN(eventoId)) {
        return res.status(400).json({ error: 'ID de evento inválido.' });
    }

    // TODO: Opcional - Validar si el usuarioActualCod realmente participa en este eventoId
    // const { count: participacionCount } = await supabase.from('participacion_evento').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioActualCod).eq('evento_id', eventoId);
    // if (participacionCount === 0) { return res.status(403).json({ error: 'No estás apuntado a este evento.' }); }

    try {
        // Consulta para obtener los datos de los usuarios con los que hay match en este evento
        // Usamos $1 para usuarioActualCod y $2 para eventoId
        const query = `
            SELECT
                -- Seleccionar el ID y nombre del usuario CON el que se hizo match
                CASE
                    WHEN em.usuario1_id = $1 THEN u2.cod_usuario
                    ELSE u1.cod_usuario
                    END AS match_usuario_cod,
                CASE
                    WHEN em.usuario1_id = $1 THEN u2.nombre
                    ELSE u1.nombre
                    END AS match_nombre,
                CASE
                    WHEN em.usuario1_id = $1 THEN u2.url_fotoperfil -- O foto_url_1, la que uses para el perfil
                    ELSE u1.url_fotoperfil
                    END AS match_foto_url,
                em.fecha_match -- Incluir la fecha del match
            -- Puedes añadir más campos de perfil si quieres mostrarlos en la lista de matches
            -- CASE WHEN em.usuario1_id = $1 THEN u2.edad ELSE u1.edad END AS match_edad,
            -- CASE WHEN em.usuario1_id = $1 THEN u2.genero ELSE u1.genero END AS match_genero
            FROM
                evento_match em
                    JOIN
                usuario u1 ON em.usuario1_id = u1.cod_usuario
                    JOIN
                usuario u2 ON em.usuario2_id = u2.cod_usuario
            WHERE
                em.evento_id = $2
              AND ($1 = em.usuario1_id OR $1 = em.usuario2_id); -- Donde el usuario actual es parte del match
        `; // Cierre correcto de la cadena multilinea

        // Pasar los parámetros de forma segura: usuarioActualCod, eventoId, currentUserOrientacion, currentUserGenero
        const { rows: matches } = await pool.query(query, [usuarioActualCod, eventoId]); // Pasar parámetros de forma segura

        res.json(matches);

    } catch (error) {
        console.error('Error fetching event matches:', error);
        res.status(500).json({ error: 'Error al obtener matches del evento.' });
    }
});


// ====================== INICIO DEL SERVIDOR ======================

app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
    console.log(`Clave secreta JWT: ${JWT_SECRET}`);
    // Opcional: Verificar conexión del pool al iniciar
    pool.query('SELECT 1')
        .then(() => console.log('Conexión con la base de datos (pool) establecida.'))
        .catch((err) => console.error('Error conectando a la base de datos (pool):', err.message));
});
