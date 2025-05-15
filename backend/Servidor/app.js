const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;
const { supabase, pool } = require('./db'); // Asegúrate de que db.js exporta 'supabase' y 'pool' correctamente

// Middleware para habilitar CORS
app.use(cors());
// Middleware para parsear el cuerpo de las peticiones como JSON
app.use(express.json());

// Clave secreta para firmar los tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'factiodb_default_secret'; // Usar variable de entorno, con fallback

// Middleware para verificar el token JWT de admin_empresa
const authenticateAdminEmpresa = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Autenticación requerida' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Verifica si el token es de un admin_empresa
        if (decoded.type !== 'admin') {
            return res.status(401).json({ error: 'Autenticación requerida: Se espera un token de admin' });
        }

        const { data: admin, error } = await supabase
            .from('admin_empresa')
            .select('id_admin')
            .eq('id_admin', decoded.adminId)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: 'Autenticación inválida' });
        }

        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        console.error('Error verifying admin token:', error.message);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Middleware para verificar el token JWT de usuario normal
const authenticateUser = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Autenticación de usuario requerida' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Verifica si el token es de un usuario normal
        if (decoded.type !== 'user') {
            return res.status(401).json({ error: 'Autenticación de usuario requerida: Se espera un token de usuario' });
        }

        // Busca al usuario para asegurarse de que existe y obtener su cod_usuario y username
        // Usamos el email (cod_usuario) del token para buscar
        const { data: user, error } = await supabase
            .from('usuario')
            .select('cod_usuario, username') // Selecciona campos relevantes
            .eq('cod_usuario', decoded.codUsuario) // Busca por cod_usuario (email) guardado en el token
            .single();

        if (error || !user) {
            // Si el usuario no se encuentra (quizás fue eliminado), el token es inválido
            return res.status(401).json({ error: 'Usuario no encontrado o token inválido' });
        }

        // Guarda el cod_usuario y username del usuario autenticado en el request
        req.codUsuario = user.cod_usuario; // Guarda el email real del usuario
        req.username = user.username; // Guarda el username real del usuario

        next();
    } catch (error) {
        console.error('Error verifying user token:', error.message);
        return res.status(401).json({ error: 'Token de usuario inválido o expirado' });
    }
};


// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ====================== AUTENTICACIÓN DE ADMIN_EMPRESA ======================
// Ruta de registro de admin (mantienes la lógica existente)
app.post('/admin/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
        const { data: existingAdmin, error: existingAdminError } = await supabase
            .from('admin_empresa')
            .select('id_admin')
            .eq('cod_usuario', email) // Asumiendo que el email se guarda en cod_usuario
            .single();

        if (existingAdminError && existingAdminError.code !== 'PGRST116') { // PGRST116 = No rows found, which is expected
            throw existingAdminError;
        }


        if (existingAdmin) {
            return res.status(409).json({ error: 'El email ya está registrado como administrador' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Primero crea el usuario en la tabla 'usuario' si aún no existe (puede que ya exista si es un cliente)
        // Nota: Esta lógica puede variar dependiendo de cómo manejas usuarios vs admin_empresa
        // Si un admin es también un 'usuario' con perfil, esta lógica está bien.
        // Si 'usuario' es solo para clientes, deberías reconsiderar esta parte o tener un campo 'is_admin' en usuario.
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .insert([{
                cod_usuario: email, // email como PK
                email: email, // <-- USAR 'email' (minúscula)
                nombre: 'Admin Empresa', // Nombre genérico para admin
                username: `admin_${email.split('@')[0]}`, // Generar un username para el admin si es necesario en tabla usuario
                password_hash: hashedPassword // Guardar la contraseña hasheada también en usuario si es la fuente de verdad
            }])
            .select('cod_usuario')
            .single()
            .onConflict('cod_usuario') // Si el usuario ya existe, no hagas nada (o actualiza si es necesario)
            .ignore(); // O .update(...) si necesitas actualizar algo

        if (usuarioError && usuarioError.code !== '23505') { // 23505 = duplicate key, handled by onConflict
            console.error('Error creating or finding user for admin:', usuarioError.message);
            // Decide cómo manejar si el usuario ya existe pero no se actualiza/selecciona correctamente
        }

        // Luego crea la entrada en admin_empresa
        const { data: newAdmin, error: newAdminError } = await supabase
            .from('admin_empresa')
            .insert([{ cod_usuario: email, password: hashedPassword }]) // Usa el mismo cod_usuario
            .select('id_admin, cod_usuario')
            .single(); // Asumimos que solo insertas uno

        if (newAdminError) {
            // Si falla la inserción en admin_empresa, considera eliminar la entrada de usuario si la creaste aquí
            console.error('Error creating admin_empresa:', newAdminError.message);
            // TODO: Considerar revertir la creación en la tabla 'usuario' if the 'admin_empresa' insertion fails
            throw newAdminError;
        }


        res.status(201).json({ message: 'Administrador creado exitosamente', admin: newAdmin });

    } catch (err) {
        console.error('Admin Signup Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
        const { data: admin, error: adminError } = await supabase
            .from('admin_empresa')
            .select('id_admin, cod_usuario, password')
            .eq('cod_usuario', email) // Asumiendo que el email se guarda en cod_usuario
            .single();

        if (adminError && adminError.code !== 'PGRST116') { // PGRST116 = No rows found
            throw adminError;
        }


        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT para el admin, incluyendo el tipo
        const token = jwt.sign({ adminId: admin.id_admin, type: 'admin' }, JWT_SECRET, { expiresIn: '1h' }); // Expira en 1 hora

        res.json({ token });

    } catch (err) {
        console.error('Admin Login Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Ejemplo de ruta protegida para administradores de empresa
app.get('/admin/protected', authenticateAdminEmpresa, (req, res) => {
    res.json({ message: `Ruta protegida para el administrador de empresa con ID: ${req.adminId}` });
});


// ====================== AUTENTICACIÓN Y DATOS DE USUARIO (Nuevas rutas) ======================

// RUTA DE REGISTRO DE USUARIO NORMAL
app.post('/usuarios/signup', async (req, res) => {
    // --- DEBUGGING: Log req.body at the start ---
    console.log('DEBUG: req.body:', req.body);
    console.log('----------------------------------------');
    // --- FIN DEBUGGING ---

    // Campos requeridos: email, username, password
    // Campos opcionales: edad, estudios_trabajo, orientacion_sexual
    const { email, username, password, edad, estudios_trabajo, orientacion_sexual } = req.body;

    // --- DEBUGGING: Log individual variables after destructuring ---
    console.log('DEBUG: email:', email);
    console.log('DEBUG: username:', username);
    console.log('DEBUG: password:', password ? '********' : 'UNDEFINED or EMPTY'); // Don't log password
    console.log('DEBUG: edad:', edad);
    console.log('DEBUG: estudios_trabajo:', estudios_trabajo);
    console.log('DEBUG: orientacion_sexual:', orientacion_sexual);
    console.log('----------------------------------------');
    // --- FIN DEBUGGING ---


    // 1. Validar campos requeridos
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username y password son requeridos para el registro' });
    }

    try {
        // 2. Verificar si el email o el username ya existen en la tabla usuario
        const { data: existingUser, error: existingUserError } = await supabase
            .from('usuario')
            .select('cod_usuario, username')
            // <-- USAR 'email' (minúscula) en la cláusula or
            .or(`email.eq.${email},username.eq.${username}`); // Busca por email O username

        if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Error checking existing user:', existingUserError.message);
            throw existingUserError; // Lanza el error si no es "no rows found"
        }

        if (existingUser && existingUser.length > 0) {
            // If a user was found, check if email or username match
            const emailExists = existingUser.some(u => u.cod_usuario === email); // cod_usuario is the email
            const usernameExists = existingUser.some(u => u.username === username);

            if (emailExists && usernameExists) {
                return res.status(409).json({ error: 'El email y el username ya están registrados.' });
            } else if (emailExists) {
                return res.status(409).json({ error: 'El email ya está registrado.' });
            } else if (usernameExists) {
                return res.status(409).json({ error: 'El username ya está registrado.' });
            }
        }


        // 3. Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Insertar en la tabla 'usuario'
        // Usamos el email como cod_usuario (PK) según tu estructura actual, y añadimos username y password_hash
        const userDataToInsert = {
            cod_usuario: email, // email as PK
            email: email, // <-- USE 'email' (lowercase)
            nombre: username, // Use username for Nombre field if for display
            username: username, // New username field
            password_hash: hashedPassword // New hashed password field
        };

        // --- DEBUGGING: Log userDataToInsert before insert ---
        console.log('DEBUG: userDataToInsert before insert:', userDataToInsert);
        console.log('----------------------------------------');
        // --- FIN DEBUGGING ---

        const { data: newUser, error: newUserError } = await supabase
            .from('usuario')
            .insert([userDataToInsert]) // Use the object here
            .select('cod_usuario, username, email, nombre')
            .single(); // Expect a single result

        if (newUserError) {
            console.error('Error inserting new user:', newUserError.error || newUserError.message);
            throw newUserError; // Throw the error if insertion fails
        }

        // 5. Insert or update in the 'cliente' table if optional fields are present
        // Only if at least one of the optional fields is present
        if (edad !== undefined || estudios_trabajo !== undefined || orientacion_sexual !== undefined) {
            const clientData = { cod_usuario: email }; // Link by cod_usuario (email)
            // Add only fields that are not undefined, null, or empty/whitespace strings
            // Ensure edad is parsed to a number or excluded if not valid
            if (edad !== undefined && edad !== null && String(edad).trim() !== '') {
                const parsedEdad = parseInt(String(edad).trim(), 10);
                if (!isNaN(parsedEdad)) { // Only add if it's a valid number
                    clientData.Edad = parsedEdad;
                } else {
                    console.warn(`Warning: Could not parse edad "${edad}" as integer for user ${email}. Excluding from client data.`);
                }
            }

            if (estudios_trabajo !== undefined && estudios_trabajo !== null && String(estudios_trabajo).trim() !== '') clientData.Estudios_Trabajo = String(estudios_trabajo).trim();
            if (orientacion_sexual !== undefined && orientacion_sexual !== null && String(orientacion_sexual).trim() !== '') clientData.Orientacion_sexual = String(orientacion_sexual).trim();


            // Only attempt upsert if there is valid client data (more than 1 field, which is cod_usuario)
            if (Object.keys(clientData).length > 1) {
                // --- DEBUGGING: Log clientData before upsert ---
                console.log('DEBUG: clientData before upsert:', clientData);
                console.log('----------------------------------------');
                // --- FIN DEBUGGING ---

                // Attempt upsert with the corrected column name 'Edad' (capital E) based on your screenshot
                const { data: clientEntry, error: clientError } = await supabase
                    .from('cliente')
                    // Use upsert to insert if it doesn't exist or update if it does
                    // onConflict: 'cod_usuario' indicates that if a row with that cod_usuario already exists, update it
                    .upsert([clientData], { onConflict: 'cod_usuario', ignoreDuplicates: false }); // ignoreDuplicates: false to update

                if (clientError) {
                    console.error('Warning: Could not upsert client data for user', email, ':', clientError.message);
                    // Decide if this is a fatal error or just a warning.
                    // Here we just log a warning and continue if the user was inserted successfully.
                }
            } else {
                console.log('DEBUG: No valid optional client data provided for upsert for user', email);
            }
        }


        res.status(201).json({ message: 'Usuario registered successfully', user: newUser }); // Corrected message

    } catch (err) {
        console.error('User Signup Error:', err.message);
        // More specific handling if it's a database error
        if (err.code) {
            res.status(500).json({ error: `Database error: ${err.message}` });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});


// RUTA DE LOGIN DE USUARIO NORMAL
app.post('/usuarios/login', async (req, res) => {
    // Expect email, username, and password in the body
    const { email, username, password } = req.body;

    // Validate required fields for login
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username y password son requeridos para iniciar sesión' });
    }

    try {
        // 1. Search for the user by email AND username
        const { data: user, error: userError } = await supabase
            .from('usuario')
            .select('cod_usuario, username, password_hash') // Make sure to select password_hash
            .eq('email', email) // <-- USE 'email' (lowercase)
            .eq('username', username) // And filter by username
            .single(); // Expect 0 or 1 result

        if (userError && userError.code !== 'PGRST116') { // PGRST116 = No rows found
            console.error('Error searching user for login:', userError.message);
            throw userError; // Throw the error if it's not "no rows found"
        }

        // 2. Check if the user exists and if the password is correct
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            // If user not found (email AND username didn't match) OR password is incorrect
            return res.status(401).json({ error: 'Credenciales inválidas' }); // Generic message for security
        }

        // 3. Generate JWT token for the user
        // Include a unique identifier (email/cod_usuario) and user type in the payload
        const token = jwt.sign(
            { codUsuario: user.cod_usuario, username: user.username, type: 'user' }, // Payload with email (codUsuario) and username
            JWT_SECRET,
            { expiresIn: '1h' } // Expires in 1 hour
        );

        res.json({ token });

    } catch (err) {
        console.error('User Login Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Example protected route for normal users
// Requires the authenticateUser middleware to verify the token
app.get('/usuarios/profile', authenticateUser, async (req, res) => {
    // req.codUsuario contains the email of the authenticated user (from the token)
    // req.username contains the username of the authenticated user (from the token)
    try {
        // Load profile data for the authenticated user, including client data if it exists
        const { data: profile, error } = await supabase
            .from('usuario')
            .select(`
                 cod_usuario,
                 email, -- <-- USE 'email' (lowercase)
                 nombre,
                 username,
                 location::geometry -> ST_Y as latitude,
                 location::geometry -> ST_X as longitude,
                 cliente:cod_usuario(
                     Edad,
                     Estudios_Trabajo,
                     Orientacion_sexual
                 )
             `)
            .eq('cod_usuario', req.codUsuario) // Use the email of the authenticated user (codUsuario)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user profile:', error.message);
            throw error;
        }

        if (!profile) {
            // This should not happen if authenticateUser was successful, but it's good practice
            return res.status(404).json({ error: 'User profile not found after authentication' });
        }

        res.json({
            message: `Profile data for user with email: ${req.codUsuario} / username: ${req.username}`,
            profile: profile
        });

    } catch (err) {
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({ error: 'Error loading profile' });
    }
});


// ====================== CLIENTES ======================
// MODIFIED: Includes location (latitude, longitude) of the related user
// Consider if this route should be protected (authenticateUser or authenticateAdminEmpresa)
app.get('/clientes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cliente')
            .select(`
                cod_usuario,
                Edad,
                Estudios_Trabajo,
                Orientacion_sexual,
                usuario:cod_usuario(
                    email, -- <-- USE 'email' (lowercase)
                    nombre,
                    username,
                    -- Add selection of user coordinates from the usuario table
                    location::geometry -> ST_Y as latitude,
                    location::geometry -> ST_X as longitude
                )
            `);

        if (error) throw error;
        // Each client object will now have a 'usuario' object with 'latitude' and 'longitude'
        res.json(data);
    } catch (err) {
        console.error('Error fetching clients:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Consider if this client update route should be protected
// and if the authenticated user can only update THEIR OWN client entry
app.put('/clientes/:id', async (req, res) => {
    const { Edad, Estudios_Trabajo, Orientacion_sexual } = req.body;
    const clienteCodUsuario = req.params.id; // The cod_usuario of the client to update

    // TODO: Implement AUTHENTICATION/AUTHORIZATION
    // Ex: If only the authenticated user can update their own client profile:
    // app.put('/clientes/:id', authenticateUser, async (req, res) => { ...
    // Then inside the route:
    // if (req.codUsuario !== req.params.id) { // Use req.params.id as it is the client's cod_usuario
    //    return res.status(403).json({ error: 'You do not have permission to update this client profile' });
    // }


    try {
        // Only update the fields that are provided in the body
        const updateData = {};
        // Add only fields that are not undefined, null, or empty/whitespace strings
        if (Edad !== undefined && Edad !== null && String(Edad).trim() !== '') updateData.Edad = parseInt(String(Edad).trim(), 10); // Make sure it's a number
        if (Estudios_Trabajo !== undefined && Estudios_Trabajo !== null && String(Estudios_Trabajo).trim() !== '') updateData.Estudios_Trabajo = String(Estudios_Trabajo).trim();
        if (Orientacion_sexual !== undefined && Orientacion_sexual !== null && String(Orientacion_sexual).trim() !== '') updateData.Orientacion_sexual = String(Orientacion_sexual).trim();


        // If there are no fields to update, return a message or error
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }


        const { data: clienteData, error: clienteError } = await supabase
            .from('cliente')
            .update(updateData)
            .eq('cod_usuario', clienteCodUsuario) // Assume the client ID is cod_usuario
            .select(); // Optional: select the updated data

        if (clienteError) throw clienteError;

        if (!clienteData || clienteData.length === 0) {
            return res.status(404).json({ error: "Client not found with that user code" });
        }

        res.json(clienteData[0]);
    } catch (err) {
        console.error('Error updating client:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ====================== USUARIOS (Location Routes) ======================

// Route to update the location of a specific user
// Expects in the body: { latitude: number, longitude: number }
// The ID of the user to update comes in the URL parameter :cod_usuario
// !!! IMPORTANT: Implement AUTHENTICATION/AUTHORIZATION here to ensure that
// a user can only update THEIR OWN location or that only an admin can do it.
// You can use the authenticateUser middleware here and check if req.codUsuario === req.params.cod_usuario
app.put('/usuarios/:cod_usuario/location', async (req, res) => {
    const usuarioCod = req.params.cod_usuario;
    const { latitude, longitude } = req.body;

    // TODO: Implement AUTHENTICATION/AUTHORIZATION
    // Ex: Using authenticateUser middleware:
    // app.put('/usuarios/:cod_usuario/location', authenticateUser, async (req, res) => { ...
    // Then inside the route:
    // if (req.codUsuario !== req.params.cod_usuario) {
    //    return res.status(403).json({ error: 'You do not have permission to update this location' });
    // }


    // Validate that latitude and longitude were sent
    if (latitude === undefined || longitude === undefined || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Valid latitude and longitude numbers are required' });
    }

    try {
        // Build the value of the 'location' field in WKT (Well-Known Text) format
        // PostGIS and PostgREST can parse this format directly
        // IMPORTANT: POINT expects (longitude, latitude)
        const locationPointWkt = `POINT(${longitude} ${latitude})`;

        const { data, error } = await supabase
            .from('usuario') // Update the 'usuario' table
            .update({ location: locationPointWkt })
            .eq('cod_usuario', usuarioCod) // Filter by cod_usuario
            .select('cod_usuario, location::geometry -> ST_Y as latitude, location::geometry -> ST_X as longitude'); // Optional: select the updated location to confirm

        if (error) {
            console.error('Error updating user location:', error.message);
            throw new Error(`Database error updating location: ${error.message}`);
        }


        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'User not found with that code' });
        }

        res.json(data[0]); // Return the updated user with their new location

    } catch (err) {
        console.error('Unhandled error updating user location:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Route to find users within a specific radius
// Expects in query params: ?lat=...&lon=...&radius=... (radius in meters)
// Optional: You can protect this route if only authenticated users can search nearby
// You can use the authenticateUser middleware here
app.get('/usuarios/nearby', async (req, res) => {
    const { lat, lon, radius } = req.query; // Receive latitude, longitude, and radius from query params

    // Validate parameters
    if (lat === undefined || lon === undefined || radius === undefined) {
        return res.status(400).json({ error: 'Parameters lat, lon, and radius are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusInMeters = parseFloat(radius);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInMeters) || radiusInMeters < 0) {
        return res.status(400).json({ error: 'Invalid parameters: lat, lon must be numbers, radius must be a non-negative number.' });
    }

    try {
        // Create the reference point in WKT format for the PostGIS query
        // ST_SetSRID(ST_MakePoint(longitude, latitude), SRID) - although with simple WKT and filter is enough
        const centerPointWkt = `POINT(${longitude} ${latitude})`; // WKT format

        // Use the 'st_dwithin' PostGIS operator through the Supabase filter
        // The st_dwithin operator for GEOGRAPHY expects (reference_point, distance_in_meters)
        const { data, error } = await supabase
            .from('usuario') // Query the 'usuario' table
            .select(`
                cod_usuario,
                email, -- <-- USE 'email' (lowercase)
                nombre,
                username,
                -- Select coordinates of found users
                location::geometry -> ST_Y as latitude,
                location::geometry -> ST_X as longitude
            `)
            .not('location', 'is', null) // Optional: Exclude users without registered location
            // st_dwithin is the PostGIS operator, ${centerPointWkt}, ${radiusInMeters} are the arguments
            .filter('location', 'st_dwithin', `${centerPointWkt}, ${radiusInMeters}`);

        if (error) {
            console.error('Error fetching nearby users:', error.message);
            // PostGIS errors can be tricky. Make sure the generated SQL is valid.
            // If this becomes complex, consider creating an RPC/Database Function in Supabase.
            throw new Error(`Database error finding nearby users: ${err.message}`); // <-- Corrected: use err.message
        }

        // The data will contain the users found within the radius, with their coordinates.
        res.json(data);

    } catch (err) {
        console.error('Unhandled error fetching nearby users:', err.message);
        res.status(500).json({ error: err.message });
    }
});


// ====================== EMPRESAS ======================
// This section does not need changes as it does not interact directly with user location
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

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching company events:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ====================== EVENTOS ======================
// These routes do not need changes as they do not interact directly with user location
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

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching all events:', err.message);
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

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            throw error;
        }


        data ? res.json(data) : res.status(404).json({ error: "Evento not found" }); // Corrected message
    } catch (err) {
        console.error('Error fetching event by ID:', err.message);
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
        return res.status(400).json({ error: "No fields to update" }); // Corrected message
    }

    try {
        const { data, error } = await supabase
            .from('evento')
            .update(updateData)
            .eq('cod_evento', req.params.id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: "Event not found to update" }); // Corrected message
        }

        res.json(data[0]);
    } catch (err) {
        console.error('Error updating event:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ====================== LOCALES ======================
// This route does not need changes as it does not interact directly with user location
app.get('/locales/:id/eventos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                cod_evento,
                nombre,
                hora_inicio,
                hora_finalizacion,
                empresa:NIF(Nombre)
            `)
            .eq('cod_local', req.params.id);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching local events:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Global error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Avoid sending sensitive details in production
    const errorMessage = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'; // Corrected message
    res.status(500).json({
        error: 'Internal Server Error', // Corrected message
        detalles: errorMessage
    });
});

// Start server
app.listen(port, () => {
    console.log(`Supabase server listening on http://localhost:${port}`); // Corrected message
});
