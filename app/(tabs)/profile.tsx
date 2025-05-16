// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    ActivityIndicator, // Para indicar que se está cargando el perfil o guardando
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons'; // Usaremos Ionicons para iconos
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para obtener el token
import { Picker } from '@react-native-picker/picker'; // Para los desplegables
// Si necesitas useRouter para navegar a otras partes de la app (fuera de las pestañas), mantenlo:
// import { useRouter } from 'expo-router';

// Define la URL base de tu backend
const API_BASE_URL = 'http://192.168.1.142:3001'; // <-- IP de tu ordenador/servidor

// Clave para AsyncStorage donde guardamos el token JWT
const AUTH_TOKEN_KEY = 'userToken'; // Asegúrate de que esta clave coincide con la que usas en login.tsx

// Definimos la interfaz para los datos del perfil que esperamos del backend
interface UserProfile {
    cod_usuario: number; // O string, según cómo lo manejes en backend/DB
    email: string;
    nombre: string; // Nombre (puede ser diferente al username) - Mapeado a 'Sobre mí' en frontend
    username: string; // Nickname
    edad?: number;
    genero?: string; // Nuevo campo
    estudios_trabajo?: string;
    orientacion_sexual?: string;
    url_fotoperfil?: string; // <-- USAR LA NUEVA COLUMNA
    foto_url_1?: string; // Mantener para referencia si es necesario, aunque no se edite aquí
    foto_url_2?: string; // Mantener para referencia si es necesario, aunque no se edite aquí
    latitude?: number; // Si quieres mostrar/editar ubicación
    longitude?: number; // Si quieres mostrar/editar ubicación
    // Si tienes un campo 'descripcion' en DB, añádelo aquí
    // descripcion?: string;
}


export default function ProfileScreen() { // Renombrado a ProfileScreen
    // Si necesitas useRouter para navegar a otras partes de la app (fuera de las pestañas), mantenlo:
    // const router = useRouter();

    // Estado para almacenar los datos originales del perfil cargado
    const [originalProfileData, setOriginalProfileData] = useState<UserProfile | null>(null);

    // Estados para almacenar los datos del perfil que se pueden editar
    const [codUsuario, setCodUsuario] = useState<string | null>(null); // Para el ID/email del usuario (no editable)
    const [email, setEmail] = useState<string>(''); // Editable
    const [username, setUsername] = useState<string>(''); // Editable (corresponde a 'nombre' en DB y 'username' en signup)
    const [edad, setEdad] = useState<string>(''); // Como string para el TextInput
    const [genero, setGenero] = useState<string>(''); // Editable (Picker)
    const [estudiosTrabajo, setEstudiosTrabajo] = useState<string>(''); // Editable (Botones)
    const [orientacionSexual, setOrientacionSexual] = useState<string>(''); // Editable (Picker)
    const [description, setDescription] = useState<string>(''); // Editable (corresponde a 'nombre' o un nuevo campo 'descripcion'?)

    const [password, setPassword] = useState<string>(''); // Para establecer una NUEVA contraseña (no se carga la existente)

    // Estados para la foto de perfil (una sola)
    const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null); // URI de la foto (URL de DB o URI local de nueva foto)
    const [newProfilePhotoFile, setNewProfilePhotoFile] = useState<any>(null); // Archivo de la nueva foto seleccionada


    const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Para cargar el perfil
    const [isSaving, setIsSaving] = useState(false); // Para indicar que se están guardando los cambios


    // --- Cargar datos del perfil al montar la pantalla ---
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            try {
                const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
                // Eliminada la comprobación de token y redirección aquí.
                // Se asume que el layout superior ya ha verificado la autenticación.

                // Si por alguna razón no hay token (a pesar de la navegación), la llamada al backend fallará con 401.
                // Tu backend ya maneja el 401 para la ruta /usuarios/profile.

                const response = await fetch(`${API_BASE_URL}/usuarios/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Incluir el token en la cabecera (necesario por backend)
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    // Si el backend retorna un error (incluyendo 401 si el token es inválido/expirado), mostrar alerta.
                    Alert.alert('Error al cargar perfil', data.error || 'Error desconocido.');
                    console.error('Error fetching profile:', data);
                    // Considerar redirigir a login si el error es de autenticación (401)
                    // Esto podría ser redundante si el layout superior ya lo hace, pero es una capa de seguridad adicional.
                    if (response.status === 401) {
                        // Si necesitas redirigir a login desde aquí en caso de error de auth:
                        // Asegúrate de importar useRouter de 'expo-router'
                        // const router = useRouter();
                        // router.replace('/(auth)/login');
                    }
                    return;
                }

                // Guardar los datos originales cargados
                setOriginalProfileData(data.profile);

                // Rellenar los estados con los datos del perfil
                setCodUsuario(data.profile.cod_usuario); // Guardar el ID/email autogenerado
                setEmail(data.profile.email || '');
                // Asumiendo que 'nombre' en DB es el nombre real y 'username' es el username único
                // Si 'nombre' es el username duplicado, ajusta esto.
                setUsername(data.profile.username || ''); // Usamos 'username' para el campo nickname visible
                // Si tienes un campo 'real_name' en DB, úsalo aquí: setUsername(data.profile.real_name || '');

                setEdad(data.profile.edad ? String(data.profile.edad) : ''); // Convertir número a string para TextInput
                setGenero(data.profile.genero || ''); // Usar '' si es null
                setEstudiosTrabajo(data.profile.estudios_trabajo || ''); // Usar '' si es null
                setOrientacionSexual(data.profile.orientacion_sexual || ''); // Usar '' si es null
                // Si tienes un campo 'descripcion' en DB, úsalo aquí: setDescription(data.profile.descripcion || '');
                // Si no tienes 'descripcion' en DB, puedes inicializar description con otro campo o eliminarlo.
                // Por ahora, lo inicializamos con el campo 'nombre' si no hay campo de descripción real.
                setDescription(data.profile.nombre || ''); // Mapeando description a 'nombre' temporalmente si no hay campo real de descripción

                // Cargar URL de la foto de perfil si existe
                setProfilePhotoUri(data.profile.url_fotoperfil || null); // <-- USAR LA NUEVA COLUMNA

            } catch (error: any) {
                console.error('Error fetching profile:', error);
                // Mostrar error de conexión si falla la petición
                Alert.alert('Error de conexión', 'No se pudo cargar el perfil. Asegúrate de que el backend está corriendo.');
            } finally {
                setIsLoadingProfile(false);
            }
        };

        // Asegurarse de que la carga se ejecute solo una vez al montar.
        fetchProfile();
    }, []); // El array vacío asegura que se ejecuta solo una vez al montar


    // --- Lógica de selección de una sola foto ---
    const pickProfileImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Aspecto cuadrado para foto de perfil
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedAsset = result.assets[0];
            setProfilePhotoUri(selectedAsset.uri); // Guardar la URI local para previsualización
            // Guardar la información del archivo para enviarla al backend
            setNewProfilePhotoFile({
                uri: selectedAsset.uri,
                name: selectedAsset.uri.split('/').pop(), // Obtener nombre del archivo de la URI
                type: 'image/jpeg', // O el tipo MIME real si ImagePicker lo proporciona
            });
        }
    };

    // --- Lógica para manejar la eliminación de la foto de perfil ---
    const handleRemoveProfilePhoto = async () => {
        // Lógica para eliminar la foto en el backend
        // Esto requiere un endpoint DELETE específico o un indicador en el PUT.
        // Por ahora, solo limpia el estado local y muestra una alerta.
        Alert.alert('Info', 'Eliminar foto de perfil (requiere implementación en backend).');
        setProfilePhotoUri(null); // Limpia la URI local
        setNewProfilePhotoFile(null); // Asegura que no se envíe un archivo nuevo si se seleccionó antes de eliminar
        // Deberías hacer una llamada API aquí para eliminar la foto en Supabase Storage y poner url_fotoperfil a NULL en DB.
        // Ejemplo (conceptual, requiere endpoint de backend):
        // const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        // if (token && codUsuario) {
        //      fetch(`${API_BASE_URL}/usuarios/${codUsuario}/profile_photo`, {
        //          method: 'DELETE',
        //          headers: { 'Authorization': `Bearer ${token}` },
        //      })
        //      .then(response => {
        //          if (response.ok) {
        //              Alert.alert('Éxito', 'Foto de perfil eliminada.');
        //              setProfilePhotoUri(null); // Limpia la URI local si el backend confirma
        //              setNewProfilePhotoFile(null);
        //          } else {
        //              Alert.alert('Error', 'No se pudo eliminar la foto.');
        //          }
        //      })
        //      .catch(error => console.error('Error deleting photo:', error));
        // }
    };


    // --- Lógica para guardar los cambios ---
    const handleSave = async () => {
        setIsSaving(true);

        // Validar campos si es necesario (ej. formato de email si se cambió)
        const emailRegex = /^\S+@\S+\.\S+$/; // Corrected the regex
        if (email && !emailRegex.test(email)) {
            Alert.alert('Error', 'Por favor, introduce un email válido.');
            setIsSaving(false);
            return;
        }

        // Validar que tenemos el ID del usuario para la URL de actualización
        if (!codUsuario) {
            Alert.alert('Error', 'No se pudo obtener la información del usuario para guardar.');
            setIsSaving(false);
            return;
        }

        // Crear FormData para enviar datos mixtos (texto y archivo)
        const formData = new FormData();
        let hasChanges = false; // Flag to track if any changes were made


        // Añadir campos de texto al FormData SOLO si han sido modificados O si se envían vacíos para poner a NULL
        // Comparamos con los datos originales cargados (originalProfileData)
        // Si originalProfileData es null (ej. error de carga inicial), enviaremos todos los campos no vacíos.
        const currentEmail = email.trim();
        if (originalProfileData?.email !== currentEmail) { // Si el email cambió o se vació
            formData.append('email', currentEmail); // Enviar el valor actual (vacío o con email)
            hasChanges = true;
        }

        const currentUsername = username.trim();
        if (originalProfileData?.username !== currentUsername) { // Si el username cambió o se vació
            formData.append('username', currentUsername);
            hasChanges = true;
        }

        const currentDescription = description.trim();
        // Asumiendo que description mapea a 'nombre' en DB:
        if (originalProfileData?.nombre !== currentDescription) { // Si la descripción cambió o se vació
            formData.append('nombre', currentDescription);
            hasChanges = true;
        }
        // Si tienes un campo 'descripcion' real en DB, usa eso en lugar de 'nombre'.
        // if (originalProfileData?.descripcion !== currentDescription) { formData.append('descripcion', currentDescription); hasChanges = true; }


        // Manejo de la contraseña: Solo actualizar si se proporciona una nueva contraseña
        const currentPassword = password.trim();
        if (currentPassword !== '') { // Si se introdujo una nueva contraseña
            formData.append('password', currentPassword);
            hasChanges = true;
        }
        // Si currentPassword está vacío, no se añade al FormData, el backend no lo actualizará.


        const currentEdad = edad.trim();
        const originalEdadString = originalProfileData?.edad ? String(originalProfileData.edad) : '';
        if (originalEdadString !== currentEdad) { // Si la edad cambió o se vació
            if (currentEdad !== '') {
                const parsedEdad = parseInt(currentEdad, 10);
                if (!isNaN(parsedEdad)) {
                    formData.append('edad', String(parsedEdad)); // Enviar como string, backend parseará a int
                    hasChanges = true;
                } else {
                    Alert.alert('Error', 'El campo edad debe ser un número válido.');
                    setIsSaving(false);
                    return;
                }
            } else {
                formData.append('edad', ''); // Enviar vacío para que backend lo ponga a NULL
                hasChanges = true;
            }
        }

        const currentGenero = genero.trim();
        if (originalProfileData?.genero !== currentGenero) { // Si el género cambió o se vació
            formData.append('genero', currentGenero);
            hasChanges = true;
        } else if (currentGenero === '' && originalProfileData?.genero !== null) {
            // Caso especial: si el original tenía valor y ahora está vacío, enviar vacío
            formData.append('genero', '');
            hasChanges = true;
        }


        const currentEstudiosTrabajo = estudiosTrabajo.trim();
        if (originalProfileData?.estudios_trabajo !== currentEstudiosTrabajo) { // Si estudios/trabajo cambió o se vació
            formData.append('estudios_trabajo', currentEstudiosTrabajo);
            hasChanges = true;
        } else if (currentEstudiosTrabajo === '' && originalProfileData?.estudios_trabajo !== null) {
            formData.append('estudios_trabajo', '');
            hasChanges = true;
        }


        const currentOrientacionSexual = orientacionSexual.trim();
        if (originalProfileData?.orientacion_sexual !== currentOrientacionSexual) { // Si la orientación cambió o se vació
            formData.append('orientacion_sexual', currentOrientacionSexual);
            hasChanges = true;
        } else if (currentOrientacionSexual === '' && originalProfileData?.orientacion_sexual !== null) {
            formData.append('orientacion_sexual', '');
            hasChanges = true;
        }


        // --- Manejo de subida de la nueva foto de perfil ---
        if (newProfilePhotoFile) { // Si se seleccionó un nuevo archivo de foto
            // El nombre del campo debe coincidir con lo que espera Multer en el backend ('fotoperfil')
            formData.append('fotoperfil', newProfilePhotoFile as any);
            hasChanges = true;
        }
        // Check if the photo was removed (profilePhotoUri is null, but originalProfileData had a url_fotoperfil)
        // This requires backend logic to handle deletion based on a flag or separate endpoint.
        // For now, we'll just note if the local state indicates removal.
        // If you implement delete logic in backend PUT, add a flag here:
        // if (profilePhotoUri === null && originalProfileData?.url_fotoperfil) {
        //     formData.append('delete_profile_photo', 'true');
        //     hasChanges = true;
        // }


        // Check if any changes were made (text fields or new photo)
        if (!hasChanges) {
            Alert.alert('Información', 'No hay cambios para guardar.');
            setIsSaving(false);
            return;
        }


        try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                Alert.alert('Error', 'No se encontró token de autenticación.');
                // router.replace('/(auth)/login');
                return;
            }

            // Llama a la ruta de actualización de perfil en tu backend (PUT)
            const response = await fetch(`${API_BASE_URL}/usuarios/${codUsuario}`, { // Usar el ID del usuario cargado
                method: 'PUT', // Usar PUT para actualizar
                // No establecer Content-Type para FormData
                headers: {
                    'Authorization': `Bearer ${token}`, // Incluir el token
                    // Content-Type se establece automáticamente por FormData
                },
                body: formData, // Enviar FormData
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Error al guardar', data.error || 'Error desconocido.');
                console.error('Error saving profile:', data);
                // Si el error es por token inválido/expirado, redirigir a login
                if (response.status === 401) {
                    // router.replace('/(auth)/login');
                }
                return;
            }

            Alert.alert('Éxito', 'Perfil actualizado correctamente.');

            // Actualizar los estados locales con los datos de la respuesta si el backend los retorna
            if (data.profile) {
                setOriginalProfileData(data.profile); // Actualizar los datos originales
                setEmail(data.profile.email || '');
                setUsername(data.profile.username || '');
                setEdad(data.profile.edad ? String(data.profile.edad) : '');
                setGenero(data.profile.genero || '');
                setEstudiosTrabajo(data.profile.estudios_trabajo || '');
                setOrientacionSexual(data.profile.orientacion_sexual || '');
                setDescription(data.profile.nombre || ''); // Mapeando description a 'nombre'
                setProfilePhotoUri(data.profile.url_fotoperfil || null); // <-- Actualizar la URI de la foto de perfil
            }

            // Limpiar el campo de contraseña después de guardar
            setPassword('');
            // Limpiar el archivo de nueva foto seleccionada después de intentar guardar
            setNewProfilePhotoFile(null);


        } catch (error: any) {
            console.error('Error saving profile:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor para guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };


    // --- Renderizado condicional mientras se carga el perfil ---
    if (isLoadingProfile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e14eca" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e1e1e" />
            <View style={styles.headerBar}>
                <Text style={styles.title}>Editar Perfil</Text>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

                    {/* Sección de Foto de Perfil (una sola) */}
                    <Text style={[styles.label, { alignSelf: 'center', marginBottom: 10 }]}>Foto de Perfil (Opcional)</Text>
                    <View style={styles.photoUploadContainerSingle}> {/* Nuevo contenedor para una sola foto */}
                        <TouchableOpacity
                            style={styles.imagePickerSingle} // Nuevo estilo para el área tocable de la única foto
                            onPress={pickProfileImage} // Llama a la función para una sola foto
                        >
                            {profilePhotoUri ? (
                                <Image source={{ uri: profilePhotoUri }} style={styles.profileImageLarge} /> // Usar el estilo grande
                            ) : (
                                <View style={styles.placeholderLarge}> {/* Nuevo placeholder grande */}
                                    <Ionicons name="camera-outline" size={50} color="#aaa" /> {/* Icono más grande */}
                                    <Text style={styles.placeholderTextLarge}>Seleccionar Foto</Text> {/* Texto más grande */}
                                </View>
                            )}
                        </TouchableOpacity>
                        {/* Botón para eliminar Foto de Perfil (Opcional) */}
                        {profilePhotoUri && (
                            <TouchableOpacity
                                style={styles.removePhotoButtonSingle} // Nuevo estilo para el botón de eliminar
                                onPress={handleRemoveProfilePhoto} // Llama a la función de eliminar
                            >
                                <Ionicons name="close-circle" size={28} color="red" /> {/* Icono más grande */}
                            </TouchableOpacity>
                        )}
                    </View>


                    {/* Campo Email (No editable si cod_usuario es el email) */}
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]} // Estilo para indicar que no es editable
                        value={email}
                        editable={false} // Hacer que el campo no sea editable
                        placeholderTextColor="#aaa"
                    />
                    {/* Si el email es editable, usa el input normal y onChangeText={setEmail} */}
                    {/* <TextInput
                        style={styles.input}
                        placeholder="yourname@gmail.com"
                        placeholderTextColor="#aaa"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    /> */}


                    {/* Campo Nickname / Username */}
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tu Username"
                        placeholderTextColor="#aaa"
                        autoCapitalize="none" // Username suele ser sin mayúsculas
                        value={username}
                        onChangeText={setUsername}
                    />

                    {/* Campo Nueva Contraseña */}
                    <Text style={styles.label}>Nueva Contraseña (Dejar vacío para no cambiar)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        placeholderTextColor="#aaa"
                        secureTextEntry
                        value={password} // Este estado solo guarda la nueva contraseña a establecer
                        onChangeText={setPassword}
                    />

                    {/* Campo Edad */}
                    <Text style={styles.label}>Edad (Opcional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: 25"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                        value={edad}
                        onChangeText={setEdad}
                    />

                    {/* Campo Género (Desplegable) */}
                    <Text style={styles.label}>Género (Opcional)</Text>
                    <View style={styles.pickerContainer}>
                        <Ionicons name="person" size={20} color="#aaa" style={styles.pickerIcon} />
                        <Picker
                            selectedValue={genero}
                            onValueChange={(itemValue: string) => setGenero(itemValue)}
                            style={styles.picker}
                            itemStyle={styles.pickerItem}
                        >
                            <Picker.Item label="Selecciona tu género" value="" enabled={false} style={{ color: '#aaa' }} />
                            <Picker.Item label="Masculino" value="Masculino" style={{ color: '#fff' }} />
                            <Picker.Item label="Femenino" value="Femenino" style={{ color: '#fff' }} />
                            <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
                        </Picker>
                    </View>


                    {/* Campo Estudios / Trabajo (Botones de Selección) */}
                    <Text style={styles.label}>Estudios / Trabajo (Opcional)</Text>
                    <View style={styles.selectionButtonContainer}>
                        <TouchableOpacity
                            style={[styles.selectionButton, estudiosTrabajo === 'Estudiante' && styles.selectionButtonSelected]}
                            onPress={() => setEstudiosTrabajo('Estudiante')}
                        >
                            <Text style={[styles.selectionButtonText, estudiosTrabajo === 'Estudiante' && styles.selectionButtonTextSelected]}>Estudiante</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.selectionButton, estudiosTrabajo === 'Trabajando' && styles.selectionButtonSelected]}
                            onPress={() => setEstudiosTrabajo('Trabajando')}
                        >
                            <Text style={[styles.selectionButtonText, estudiosTrabajo === 'Trabajando' && styles.selectionButtonTextSelected]}>Trabajando</Text>
                        </TouchableOpacity>
                        {/* Opción para deseleccionar */}
                        {estudiosTrabajo !== '' && (
                            <TouchableOpacity onPress={() => setEstudiosTrabajo('')} style={styles.clearSelectionButton}>
                                <Ionicons name="close-circle-outline" size={20} color="#aaa" />
                            </TouchableOpacity>
                        )}
                    </View>


                    {/* Campo Orientación Sexual (Desplegable) */}
                    <Text style={styles.label}>Orientación Sexual (Opcional)</Text>
                    <View style={styles.pickerContainer}>
                        <Ionicons name="heart" size={20} color="#aaa" style={styles.pickerIcon} />
                        <Picker
                            selectedValue={orientacionSexual}
                            onValueChange={(itemValue: string) => setOrientacionSexual(itemValue)}
                            style={styles.picker}
                            itemStyle={styles.pickerItem}
                        >
                            <Picker.Item label="Selecciona tu orientación" value="" enabled={false} style={{ color: '#aaa' }} />
                            <Picker.Item label="Heterosexual" value="Heterosexual" style={{ color: '#fff' }} />
                            <Picker.Item label="Bisexual" value="Bisexual" style={{ color: '#fff' }} />
                            <Picker.Item label="Homosexual" value="Homosexual" style={{ color: '#fff' }} />
                            <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
                        </Picker>
                    </View>

                    {/* Campo Descripción */}
                    <Text style={styles.label}>Sobre mí (Opcional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Cuéntanos sobre ti..."
                        placeholderTextColor="#aaa"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />


                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <LinearGradient colors={['#e14eca', '#f4524d']} style={styles.buttonGradient}>
                    <TouchableOpacity onPress={handleSave} style={styles.buttonInner} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0d0d0d',
    },
    loadingText: {
        marginTop: 10,
        color: '#fff',
        fontSize: 18,
    },
    container: { flex: 1, backgroundColor: '#0d0d0d', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0},
    headerBar: {
        height: 60, // Ajustada altura
        backgroundColor: '#1e1e1e',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centrado
        paddingHorizontal: 15,
        elevation: 5, // Sombra Android
        shadowColor: '#000', // Sombra iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    flex: { flex: 1 },
    inner: { padding: 20 },

    // Estilos para la sección de foto de perfil (una sola)
    photoUploadContainerSingle: { // Nuevo contenedor para centrar la única foto
        alignItems: 'center', // Centra horizontalmente
        marginTop: 5,
        marginBottom: 20,
    },
    imagePickerSingle: { // Nuevo estilo para el área tocable de la única foto
        width: 150, // Tamaño más grande para una sola foto
        height: 150,
        borderRadius: 75, // Para hacerlo circular
        backgroundColor: '#1e1e1e',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden', // Asegura que la imagen se recorte dentro del círculo
        borderWidth: 2, // Borde
        borderColor: '#e14eca',
        position: 'relative', // Para posicionar el botón de eliminar
    },
    profileImageLarge: { // Usamos el estilo grande para la imagen dentro
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderLarge: { // Nuevo estilo para el placeholder grande
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a2a',
    },
    placeholderTextLarge: { // Estilo para el texto dentro del placeholder grande
        color: '#aaa',
        fontSize: 16, // Texto más grande
        marginTop: 8,
    },
    removePhotoButtonSingle: { // Nuevo estilo para el botón de eliminar en la única foto
        position: 'absolute',
        top: -5, // Ajusta la posición
        right: -5, // Ajusta la posición
        backgroundColor: '#0d0d0d',
        borderRadius: 14, // Para hacerlo circular
        padding: 3,
        zIndex: 1,
    },


    label: { color: '#fff', fontSize: 14, marginBottom: 6, marginTop: 15 },
    input: { height: 48, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#1e1e1e', color: '#fff' },
    disabledInput: {
        opacity: 0.6, // Indicar visualmente que está deshabilitado
    },
    textArea: { height: 100 },

    // Estilos para Pickers (Desplegables) - Ajustados ligeramente
    pickerContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e1e1e',
        borderRadius: 8, // Bordes un poco menos redondeados
        marginTop: 8,
        alignItems: 'center',
        width: '100%',
        paddingLeft: 12, // Ajustado paddingLeft
        overflow: 'hidden',
        height: 48, // Altura consistente con inputs
    },
    pickerIcon: {
        marginRight: 12, // Ajustado marginRight
    },
    picker: {
        flex: 1,
        color: '#fff',
        ...Platform.select({
            ios: {},
            android: {
                height: 48, // Altura consistente en Android
            },
        }),
    },
    pickerItem: {
        color: '#fff',
        backgroundColor: '#1e1e1e',
    },

    // Estilos para Botones de Selección (Estudios / Trabajo) - Ajustados ligeramente
    selectionButtonContainer: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 8,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        borderRadius: 8, // Bordes un poco menos redondeados
        padding: 4, // Padding interno
    },
    selectionButton: {
        flex: 1,
        paddingVertical: 12, // Ajustado padding vertical
        paddingHorizontal: 8, // Ajustado padding horizontal
        borderRadius: 6, // Bordes un poco más redondeados que el contenedor
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        marginHorizontal: 3,
    },
    selectionButtonSelected: {
        backgroundColor: '#e14eca',
    },
    selectionButtonText: {
        color: '#aaa',
        fontWeight: 'bold',
        fontSize: 14, // Ajustado tamaño de fuente
    },
    selectionButtonTextSelected: {
        color: '#fff',
    },
    clearSelectionButton: {
        padding: 6, // Área de toque
    },


    footer: { padding: 20, backgroundColor: '#0d0d0d', borderTopWidth: 1, borderTopColor: '#2d2d2d' }, // Borde superior
    buttonGradient: { borderRadius: 10,  overflow: 'hidden', },
    buttonInner: { paddingVertical: 14, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
});
