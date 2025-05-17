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
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importamos Picker ya que se usará para Género y Orientación Sexual
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

// Define la URL base de tu backend
// IMPORTANTE: Reemplaza esta URL con la URL real de tu API de backend
const API_BASE_URL = 'http://192.168.1.142:3001'; // <-- IP CORREGIDA

// Clave para AsyncStorage donde guardamos el token JWT
const AUTH_TOKEN_KEY = 'userToken';

// Definimos la interfaz para los datos del perfil que esperamos del backend
interface UserProfile {
    cod_usuario: number;
    email: string | null;
    nombre: string | null; // Mapeado a 'Sobre mí' en frontend (ahora eliminado de la UI)
    username: string | null;
    edad: number | null | undefined;
    genero: string | null; // Editable con Picker
    estudios_trabajo: string | null;
    orientacion_sexual: string | null; // Editable con Picker
    url_fotoperfil: string | null;
    foto_url_1: string | null;
    foto_url_2: string | null;
}


export default function ProfileScreen() {
    const router = useRouter();

    const [originalProfileData, setOriginalProfileData] = useState<UserProfile | null>(null);

    const [codUsuario, setCodUsuario] = useState<string | null>(null);
    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [edad, setEdad] = useState<string>('');
    // Estados para género y orientacionSexual (editables)
    const [genero, setGenero] = useState<string>('');
    const [estudiosTrabajo, setEstudiosTrabajo] = useState<string>(''); // Este sigue siendo editable
    const [orientacionSexual, setOrientacionSexual] = useState<string>('');
    // Eliminamos el estado para 'description' (Sobre mí) - eliminado completamente
    // const [description, setDescription] = useState<string>('');


    const [password, setPassword] = useState<string>('');

    const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
    const [newProfilePhotoFile, setNewProfilePhotoFile] = useState<any>(null);

    // Eliminamos el estado para mostrar el valor no editable de "Sobre mí"
    // const [displayNombre, setDisplayNombre] = useState<string>(''); // Para mostrar 'Sobre mí'


    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // Cargar datos del perfil al montar la pantalla
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            setError(null);

            console.log('DEBUG: fetchProfile started');
            try {
                console.log('DEBUG: Attempting to get token from AsyncStorage');
                const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
                console.log(`DEBUG: Token from AsyncStorage: ${token ? 'Found' : 'Not Found'}`);


                if (!token) {
                    console.warn('No token found, redirecting to login.');
                    setIsLoadingProfile(false);
                    Alert.alert('Sesión requerida', 'Por favor, inicia sesión para ver tu perfil.');
                    router.replace('/(auth)/login');
                    return;
                }

                const profileUrl = `${API_BASE_URL}/usuarios/profile`;
                console.log(`DEBUG: Attempting to fetch profile from: ${profileUrl}`);

                const response = await fetch(profileUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                console.log(`DEBUG: Fetch response status: ${response.status}`);

                const responseData = await response.json();
                console.log('DEBUG: Response data:', responseData);


                if (!response.ok) {
                    console.error('Error fetching profile:', responseData.error || response.statusText);
                    if (response.status === 401) {
                        Alert.alert('Sesión expirada', 'Tu sesión ha expirada. Por favor, inicia sesión de nuevo.');
                        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                        router.replace('/(auth)/login');
                    } else {
                        setError(responseData.error || 'Error desconocido al cargar el perfil.');
                        Alert.alert('Error', responseData.error || 'Error al cargar perfil.');
                    }
                    return;
                }

                if (responseData.profile) {
                    const profile = responseData.profile;
                    setOriginalProfileData(profile);

                    setCodUsuario(String(profile.cod_usuario));
                    setEmail(profile.email || '');
                    setUsername(profile.username || '');
                    setEdad(profile.edad !== null && profile.edad !== undefined ? String(profile.edad) : '');
                    // Seteamos estados editables para género y orientacionSexual
                    setGenero(profile.genero || ''); // Usar '' para la opción "Selecciona..."
                    setEstudiosTrabajo(profile.estudios_trabajo || ''); // Este sigue siendo editable
                    setOrientacionSexual(profile.orientacion_sexual || ''); // Usar '' para la opción "Selecciona..."
                    // Ya no seteamos estado editable ni de visualización para description/nombre
                    // setDescription(profile.nombre || '');
                    // setDisplayNombre(profile.nombre || 'No especificado');


                    setProfilePhotoUri(profile.url_fotoperfil || null);

                    console.log('DEBUG: Profile data loaded successfully.');

                } else {
                    console.warn('Profile data not found in response.profile:', responseData);
                    setError('Datos de perfil incompletos recibidos.');
                    Alert.alert('Error', 'Datos de perfil incompletos.');
                }

            } catch (err: any) {
                console.error("Network or unexpected error fetching profile:", err);
                setError('Error de conexión al cargar el perfil. Asegúrate de que el backend está corriendo y la URL es correcta.');
                Alert.alert('Error de conexión', 'No se pudo cargar el perfil.');
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchProfile();
    }, []);


    // Lógica de selección de una sola foto
    const pickProfileImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedAsset = result.assets[0];
            setProfilePhotoUri(selectedAsset.uri);
            const fileUri = selectedAsset.uri;
            const fileName = fileUri.split('/').pop() || `upload_${Date.now()}.jpg`;
            const fileType = selectedAsset.mimeType || 'image/jpeg';

            setNewProfilePhotoFile({
                uri: fileUri,
                name: fileName,
                type: fileType,
            });
        }
    };

    // Lógica para manejar la eliminación de la foto de perfil
    const handleRemoveProfilePhoto = async () => {
        Alert.alert(
            'Confirmar Eliminación',
            '¿Estás seguro de que quieres eliminar tu foto de perfil?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    onPress: async () => {
                        // Simplificado: solo limpia localmente y marca para eliminación al guardar
                        setProfilePhotoUri(null);
                        setNewProfilePhotoFile(null);
                        Alert.alert('Info', 'Foto de perfil marcada para eliminación (Guarda los cambios).');
                    },
                },
            ],
            { cancelable: true }
        );
    };


    // Lógica para guardar los cambios
    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (email && !emailRegex.test(email)) {
            Alert.alert('Error', 'Por favor, introduce un email válido.');
            setIsSaving(false);
            return;
        }

        if (!codUsuario) {
            Alert.alert('Error', 'No se pudo obtener la información del usuario para guardar.');
            setIsSaving(false);
            return;
        }

        const formData = new FormData();
        let hasChanges = false;

        // Campos editables
        const originalEmail = originalProfileData?.email || '';
        const currentEmail = email.trim();
        if (originalEmail !== currentEmail) {
            formData.append('email', currentEmail);
            hasChanges = true;
        }

        const originalUsername = originalProfileData?.username || '';
        const currentUsername = username.trim();
        if (originalUsername !== currentUsername) {
            formData.append('username', currentUsername);
            hasChanges = true;
        }

        // Campo "Sobre mí" (nombre en DB) - ELIMINADO COMPLETAMENTE, NO SE ENVÍA EN FORMDATA
        // const originalDescription = originalProfileData?.nombre || '';
        // const currentDescription = description.trim();
        // if (originalDescription !== currentDescription) {
        //     formData.append('nombre', currentDescription);
        //     hasChanges = true;
        // }

        const currentPassword = password.trim();
        if (currentPassword !== '') {
            formData.append('password', currentPassword);
            hasChanges = true;
        }

        const originalEdad = originalProfileData?.edad !== null && originalProfileData?.edad !== undefined ? String(originalProfileData.edad) : '';
        const currentEdad = edad.trim();
        if (originalEdad !== currentEdad) {
            if (currentEdad !== '') {
                const parsedEdad = parseInt(currentEdad, 10);
                if (!isNaN(parsedEdad)) {
                    formData.append('edad', String(parsedEdad));
                    hasChanges = true;
                } else {
                    Alert.alert('Error', 'El campo edad debe ser un número válido.');
                    setIsSaving(false);
                    return;
                }
            } else {
                formData.append('edad', ''); // Enviar vacío para poner a NULL
                hasChanges = true;
            }
        }

        // Campo Género (Editable con Picker)
        const originalGenero = originalProfileData?.genero || '';
        const currentGenero = genero; // No trim aquí si el Picker usa '' para "Selecciona..."
        if (originalGenero !== currentGenero) {
            // Solo añadir al FormData si el valor no es la cadena vacía ''
            if (currentGenero !== '') {
                formData.append('genero', currentGenero);
            } else {
                // Si el valor es '', enviar explícitamente una cadena vacía o null para que el backend lo maneje
                formData.append('genero', ''); // Backend debería interpretar '' como NULL
            }
            hasChanges = true;
        } else if (currentGenero === '' && originalProfileData?.genero !== null) {
            // Si el valor actual es '' pero el original NO era NULL, significa que se cambió a ''
            formData.append('genero', '');
            hasChanges = true;
        }


        const originalEstudiosTrabajo = originalProfileData?.estudios_trabajo || '';
        const currentEstudiosTrabajo = estudiosTrabajo.trim();
        if (originalEstudiosTrabajo !== currentEstudiosTrabajo) {
            formData.append('estudios_trabajo', currentEstudiosTrabajo);
            hasChanges = true;
        } else if (currentEstudiosTrabajo === '' && originalProfileData?.estudios_trabajo !== null) {
            formData.append('estudios_trabajo', '');
            hasChanges = true;
        }


        // Campo Orientación Sexual (Editable con Picker)
        const originalOrientacionSexual = originalProfileData?.orientacion_sexual || '';
        const currentOrientacionSexual = orientacionSexual; // No trim aquí si el Picker usa '' para "Selecciona..."
        if (originalOrientacionSexual !== currentOrientacionSexual) {
            // Solo añadir al FormData si el valor no es la cadena vacía ''
            if (currentOrientacionSexual !== '') {
                formData.append('orientacion_sexual', currentOrientacionSexual);
            } else {
                // Si el valor es '', enviar explícitamente una cadena vacía o null para que el backend lo maneje
                formData.append('orientacion_sexual', ''); // Backend debería interpretar '' como NULL
            }
            hasChanges = true;
        } else if (currentOrientacionSexual === '' && originalProfileData?.orientacion_sexual !== null) {
            // Si el valor actual es '' pero el original NO era NULL, significa que se cambió a ''
            formData.append('orientacion_sexual', '');
            hasChanges = true;
        }


        // Manejo de subida de la nueva foto de perfil
        if (newProfilePhotoFile) {
            formData.append('fotoperfil', newProfilePhotoFile as any);
            hasChanges = true;
        }
        // Manejo de eliminación de foto de perfil
        if (originalProfileData?.url_fotoperfil && profilePhotoUri === null) {
            // Asegúrate de que el backend maneje la ausencia de 'fotoperfil' en FormData para poner url_fotoperfil a NULL
            hasChanges = true;
        }

        if (!hasChanges) {
            Alert.alert('Información', 'No hay cambios para guardar.');
            setIsSaving(false);
            return;
        }

        try {
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                Alert.alert('Error', 'No se encontró token de autenticación.');
                setIsSaving(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/usuarios/${codUsuario}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Error saving profile:', data.error || response.statusText);
                Alert.alert('Error al guardar', data.error || 'Error desconocido al guardar.');

                if (response.status === 401) {
                    Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
                    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                    router.replace('/(auth)/login');
                }
                return;
            }

            Alert.alert('Éxito', 'Perfil actualizado correctamente.');

            if (data.profile) {
                setOriginalProfileData(data.profile);
                // Actualizar los estados editables para reflejar los datos guardados
                setGenero(data.profile.genero || '');
                setEstudiosTrabajo(data.profile.estudios_trabajo || '');
                setOrientacionSexual(data.profile.orientacion_sexual || '');
                // Ya no actualizamos displayNombre ya que el campo fue eliminado
                // setDisplayNombre(data.profile.nombre || 'No especificado');
            }

            setPassword('');
            setNewProfilePhotoFile(null);

        } catch (error: any) {
            console.error('Network or unexpected error saving profile:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor para guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };


    // Renderizado condicional mientras se carga el perfil
    if (isLoadingProfile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e14eca" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    // Mostrar mensaje de error si falla la carga inicial
    if (error) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    // Mostrar el formulario si no está cargando y no hay error
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1e1e1e" />

            <View style={styles.headerBar}>
                <Text style={styles.title}>Editar Perfil</Text>
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

                    {/* Sección de Foto de Perfil */}
                    <TouchableOpacity onPress={pickProfileImage} style={styles.photoContainer}>
                        {profilePhotoUri ? (
                            <Image source={{ uri: profilePhotoUri }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <Ionicons name="camera" size={50} color="#ccc" />
                                <Text style={styles.photoPlaceholderText}>Subir Foto</Text>
                            </View>
                        )}
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {profilePhotoUri && (
                        <TouchableOpacity onPress={handleRemoveProfilePhoto} style={styles.removePhotoButton}>
                            <Text style={styles.removePhotoButtonText}>Eliminar Foto de Perfil</Text>
                        </TouchableOpacity>
                    )}

                    {/* Campos de texto y selección */}
                    <Text style={styles.label}>Username:</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Tu nombre de usuario"
                        placeholderTextColor="#aaa"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Tu correo electrónico"
                        placeholderTextColor="#aaa"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    {/* Campo "Sobre mí" (Eliminado completamente de la UI) */}
                    {/* <Text style={styles.label}>Sobre mí:</Text> */}
                    {/* <View style={styles.displayValueContainer}> */}
                    {/* <Text style={styles.displayValueText}>{displayNombre}</Text> */}
                    {/* </View> */}


                    <Text style={styles.label}>Edad:</Text>
                    <TextInput
                        style={styles.input}
                        value={edad}
                        onChangeText={setEdad}
                        placeholder="Tu edad"
                        placeholderTextColor="#aaa"
                        keyboardType="number-pad"
                    />

                    {/* Campo Género (Editable con Picker) - Opciones sincronizadas con signup */}
                    <Text style={styles.label}>Género:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={genero} // Usar estado 'genero'
                            onValueChange={(itemValue: string) => setGenero(itemValue)} // Actualizar estado 'genero'
                            style={styles.picker}
                            dropdownIconColor="#fff" // Asegura que el ícono sea visible
                        >
                            {/* Opción por defecto con value="" */}
                            <Picker.Item label="Selecciona tu género" value="" enabled={false} style={{ color: '#aaa' }} />
                            <Picker.Item label="Masculino" value="Masculino" style={{ color: '#fff' }} />
                            <Picker.Item label="Femenino" value="Femenino" style={{ color: '#fff' }} />
                            <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
                            {/* Eliminadas opciones que no están en signup */}
                        </Picker>
                    </View>


                    {/* Campo Estudios/Trabajo */}
                    <Text style={styles.label}>Estudios/Trabajo:</Text>
                    <TextInput
                        style={styles.input}
                        value={estudiosTrabajo}
                        onChangeText={setEstudiosTrabajo}
                        placeholder="Tu ocupación o nivel de estudios"
                        placeholderTextColor="#aaa"
                    />

                    {/* Campo Orientación Sexual (Editable con Picker) - Opciones sincronizadas con signup */}
                    <Text style={styles.label}>Orientación Sexual:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={orientacionSexual} // Usar estado 'orientacionSexual'
                            onValueChange={(itemValue: string) => setOrientacionSexual(itemValue)} // Actualizar estado 'orientacionSexual'
                            style={styles.picker}
                            dropdownIconColor="#fff" // Asegura que el ícono sea visible
                        >
                            {/* Opción por defecto con value="" */}
                            <Picker.Item label="Selecciona tu orientación" value="" enabled={false} style={{ color: '#aaa' }} />
                            <Picker.Item label="Heterosexual" value="Heterosexual" style={{ color: '#fff' }} />
                            <Picker.Item label="Bisexual" value="Bisexual" style={{ color: '#fff' }} />
                            <Picker.Item label="Homosexual" value="Homosexual" style={{ color: '#fff' }} />
                            <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
                            {/* Eliminadas opciones que no están en signup */}
                        </Picker>
                    </View>


                    {/* Campo para cambiar contraseña */}
                    <Text style={styles.label}>Nueva Contraseña (dejar vacío para no cambiar):</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Introduce nueva contraseña"
                        placeholderTextColor="#aaa"
                        secureTextEntry
                    />

                    {/* Botón de Guardar */}
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Estilos
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e',
    },
    flex: {
        flex: 1,
    },
    inner: {
        padding: 20,
        paddingBottom: 50,
    },
    headerBar: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#2a2a2a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#e14eca',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#ff6347',
        textAlign: 'center',
    },
    photoContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#e14eca',
    },
    profileImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        color: '#ccc',
        marginTop: 5,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#e14eca',
        borderRadius: 15,
        padding: 5,
    },
    removePhotoButton: {
        alignSelf: 'center',
        marginTop: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#ff6347',
        borderRadius: 5,
    },
    removePhotoButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    label: {
        fontSize: 16,
        color: '#fff',
        marginTop: 15,
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#333',
        color: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#555',
    },
    multilineInput: {
        height: 100,
    },
    // Estilos para Pickers (Desplegables) - Reutilizamos los estilos del signup
    pickerContainer: {
        flexDirection: 'row',
        backgroundColor: '#333', // Fondo oscuro
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
        width: '100%',
        paddingLeft: 10, // Espacio para el ícono si lo añades
        overflow: 'hidden',
        height: 50, // Altura consistente
        borderWidth: 1, // Borde para que coincida con los inputs
        borderColor: '#555', // Color del borde
    },
    picker: {
        flex: 1,
        color: '#fff', // Color del texto del picker
        ...Platform.select({
            ios: {
                // Estilos específicos de iOS si es necesario
            },
            android: {
                // Estilos específicos de Android si es necesario
                height: 50, // Asegura que la altura sea consistente en Android
            },
        }),
    },
    // Estilos para mostrar valores no editables (solo para "Sobre mí") - Eliminados ya que el campo fue quitado
    // displayValueContainer: {
    //     backgroundColor: '#333',
    //     borderRadius: 8,
    //     paddingHorizontal: 15,
    //     paddingVertical: 12,
    //     borderWidth: 1,
    //     borderColor: '#555',
    //     justifyContent: 'center', // Centrar texto verticalmente si es necesario
    // },
    // displayValueText: {
    //     fontSize: 16,
    //     color: '#fff', // Color del texto mostrado
    // },
    saveButton: {
        backgroundColor: '#e14eca',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 30,
    },
    saveButtonDisabled: {
        backgroundColor: '#555',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
