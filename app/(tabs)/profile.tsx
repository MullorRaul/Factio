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
const API_BASE_URL = 'https://e64d-2a0c-5a82-c201-2100-19ae-8cd2-77f2-647c.ngrok-free.app'; // <-- IP CORREGIDA

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
    // Assuming your backend returns follower/following counts in the profile endpoint
    // If not, you'll need to fetch these separately or update your backend
    followers_count?: number | null;
    following_count?: number | null;
}

// Function to generate a random number for placeholder counts
const generateRandomCount = (max: number) => Math.floor(Math.random() * max);


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

    // State for follower and following counts (added) - Initialize with random numbers
    const [followersCount, setFollowersCount] = useState<number | null>(generateRandomCount(500)); // Random up to 500
    const [followingCount, setFollowingCount] = useState<number | null>(generateRandomCount(500)); // Random up to 500

    // State to control visibility of editable fields
    const [isEditing, setIsEditing] = useState(false);

    // State for user's level 1 progress (0 to 100) - Placeholder
    const [level1Progress, setLevel1Progress] = useState(75); // Example progress


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

                    // Set follower and following counts from the response if available
                    setFollowersCount(profile.followers_count !== undefined && profile.followers_count !== null ? profile.followers_count : generateRandomCount(500)); // Use backend data or random
                    setFollowingCount(profile.following_count !== undefined && profile.following_count !== null ? profile.following_count : generateRandomCount(500)); // Use backend data or random

                    // Assuming level 1 progress is also returned in the profile endpoint
                    // If not, you'll need to fetch it separately or update your backend
                    // setLevel1Progress(profile.level1_progress !== undefined && profile.level1_progress !== null ? profile.level1_progress : 0);

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
        if (!username.trim()) {
            Alert.alert('Error', 'Por favor, introduce un nombre de usuario.');
            setIsSaving(false);
            return;
        }

        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            Alert.alert('Error', 'Por favor, introduce un email.');
            setIsSaving(false);
            return;
        }

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

        // Campos editables (only add if isEditing is true)
        if (isEditing) {
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

            const originalGenero = originalProfileData?.genero || '';
            const currentGenero = genero;
            if (originalGenero !== currentGenero) {
                if (currentGenero !== '') {
                    formData.append('genero', currentGenero);
                } else {
                    formData.append('genero', '');
                }
                hasChanges = true;
            } else if (currentGenero === '' && originalProfileData?.genero !== null) {
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


            const originalOrientacionSexual = originalProfileData?.orientacion_sexual || '';
            const currentOrientacionSexual = orientacionSexual;
            if (originalOrientacionSexual !== currentOrientacionSexual) {
                if (currentOrientacionSexual !== '') {
                    formData.append('orientacion_sexual', currentOrientacionSexual);
                } else {
                    formData.append('orientacion_sexual', '');
                }
                hasChanges = true;
            } else if (currentOrientacionSexual === '' && originalProfileData?.orientacion_sexual !== null) {
                formData.append('orientacion_sexual', '');
                hasChanges = true;
            }
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

                // Update follower and following counts after saving if they are returned
                setFollowersCount(data.profile.followers_count !== undefined && data.profile.followers_count !== null ? data.profile.followers_count : followersCount);
                setFollowingCount(data.profile.following_count !== undefined && data.profile.following_count !== null ? data.profile.following_count : followingCount);
            }

            setPassword('');
            setNewProfilePhotoFile(null);
            setIsEditing(false); // Exit editing mode after successful save

        } catch (error: any) {
            console.error('Network or unexpected error saving profile:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor para guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handler to toggle editing mode
    const toggleEditing = () => {
        setIsEditing(!isEditing);
        // Optionally reset password field when exiting edit mode
        if (isEditing) {
            setPassword('');
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

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

                    {/* User Info Section at the top (Username only) */}
                    <View style={styles.userInfoSection}>
                        {/* Display username */}
                        <Text style={styles.profileUsernameText}>{username?.toUpperCase() || ''}</Text>
                    </View>


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

                    {/* Remove Photo Button (always visible if photo exists) */}
                    {profilePhotoUri && (
                        <TouchableOpacity onPress={handleRemoveProfilePhoto} style={styles.removePhotoButton}>
                            <Text style={styles.removePhotoButtonText}>Eliminar Foto de Perfil</Text>
                        </TouchableOpacity>
                    )}

                    {/* Follower/Following Counts and Progress Bar (Moved below photo) */}
                    <View style={styles.followCountsContainer}>
                        <Text style={styles.profileFollowCountText}>Seguidores: {followersCount !== null ? followersCount : '--'}</Text>
                        <Text style={styles.profileFollowCountText}>Seguidos: {followingCount !== null ? followingCount : '--'}</Text>
                    </View>

                    {/* Level 1 Progress Bar (Placeholder) */}
                    <View style={styles.progressBarContainer}>
                        <Text style={styles.progressBarLabel}>Nivel 1 Pollete 🐔:</Text> {/* Added (Pollete) */}
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: `${level1Progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{level1Progress}%</Text>
                    </View>


                    {/* Button to toggle editing */}
                    <TouchableOpacity style={styles.editButton} onPress={toggleEditing}>
                        <Text style={styles.editButtonText}>{isEditing ? 'Cancelar Edición' : 'Editar Información'}</Text>
                    </TouchableOpacity>


                    {/* Editable Fields (Conditionally rendered) */}
                    {isEditing ? (
                        <View>
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

                            <Text style={styles.label}>Edad:</Text>
                            <TextInput
                                style={styles.input}
                                value={edad}
                                onChangeText={setEdad}
                                placeholder="Tu edad"
                                placeholderTextColor="#aaa"
                                keyboardType="number-pad"
                            />

                            {/* Campo Género (Editable con Picker) */}
                            <Text style={styles.label}>Género:</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={genero}
                                    onValueChange={(itemValue: string) => setGenero(itemValue)}
                                    style={styles.picker}
                                    dropdownIconColor="#fff"
                                >
                                    <Picker.Item label="Selecciona tu género" value="" enabled={false} style={{ color: '#aaa' }} />
                                    <Picker.Item label="Masculino" value="Masculino" style={{ color: '#fff' }} />
                                    <Picker.Item label="Femenino" value="Femenino" style={{ color: '#fff' }} />
                                    <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
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

                            {/* Campo Orientación Sexual (Editable con Picker) */}
                            <Text style={styles.label}>Orientación Sexual:</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={orientacionSexual}
                                    onValueChange={(itemValue: string) => setOrientacionSexual(itemValue)}
                                    style={styles.picker}
                                    dropdownIconColor="#fff"
                                >
                                    <Picker.Item label="Selecciona tu orientación" value="" enabled={false} style={{ color: '#aaa' }} />
                                    <Picker.Item label="Heterosexual" value="Heterosexual" style={{ color: '#fff' }} />
                                    <Picker.Item label="Bisexual" value="Bisexual" style={{ color: '#fff' }} />
                                    <Picker.Item label="Homosexual" value="Homosexual" style={{ color: '#fff' }} />
                                    <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
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

                            {/* Botón de Guardar (only visible when editing) */}
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
                        </View>
                    ) : (
                        // Non-editable display of user information
                        <View>
                            <Text style={styles.label}>Email:</Text>
                            <Text style={styles.displayValue}>{email || 'No especificado'}</Text>

                            <Text style={styles.label}>Edad:</Text>
                            <Text style={styles.displayValue}>{edad || 'No especificada'}</Text>

                            <Text style={styles.label}>Género:</Text>
                            <Text style={styles.displayValue}>{genero || 'No especificado'}</Text>

                            <Text style={styles.label}>Estudios/Trabajo:</Text>
                            <Text style={styles.displayValue}>{estudiosTrabajo || 'No especificado'}</Text>

                            <Text style={styles.label}>Orientación Sexual:</Text>
                            <Text style={styles.displayValue}>{orientacionSexual || 'No especificada'}</Text>
                        </View>
                    )}


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
    // Styles for user info section (Username only)
    userInfoSection: {
        marginBottom: 24, // Space below username
        alignItems: 'center', // Center content horizontally
        marginTop: 10, // Add some space from the top/header
    },
    profileUsernameText: { // Specific style for username in profile
        fontSize: 28, // Larger font size
        color: '#e14eca', // Lilac color
        fontWeight: 'bold',
        // Removed marginBottom here as follow counts are moved
    },
    // Styles for Follower/Following Counts Container (Moved)
    followCountsContainer: {
        flexDirection: 'row', // Arrange follower/following horizontally
        gap: 20, // Space between counts
        marginTop: 20, // Space above follow counts (moved below photo)
        marginBottom: 20, // Space below follow counts
        alignSelf: 'center', // Center the container
    },
    profileFollowCountText: { // Specific style for follower/following counts in profile
        fontSize: 16,
        color: '#aaa', // Lighter color for counts
    },
    // Styles for Progress Bar (Moved)
    progressBarContainer: {
        width: '100%',
        marginTop: 10, // Space above progress bar (moved below follow counts)
        alignItems: 'center',
        marginBottom: 20, // Space below progress bar
    },
    progressBarLabel: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 5,
    },
    progressBarBackground: {
        width: '80%', // Adjust width as needed
        height: 10,
        backgroundColor: '#333',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#e14eca', // Lilac color for progress
        borderRadius: 5,
    },
    progressText: {
        fontSize: 14,
        color: '#fff',
        marginTop: 5,
    },
    photoContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20, // Space below photo container
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
    cameraIcon: { // MODIFICADO PARA CENTRAR
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: [{ translateX: -17 }, { translateY: -17 }],
        backgroundColor: '#e14eca',
        borderRadius: 17,
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removePhotoButton: {
        alignSelf: 'center',
        marginTop: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#ff6347',
        borderRadius: 5,
        marginBottom: 20, // Add space below remove button
    },
    editButton: {
        backgroundColor: '#9e6fca', // Purple color for edit button
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 20, // Space above the button
        marginBottom: 20, // Space below the button
    },
    editButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    // Styles for Pickers (Dropdowns)
    pickerContainer: {
        flexDirection: 'row',
        backgroundColor: '#333', // Dark background
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
        width: '100%',
        paddingLeft: 10, // Space for icon if you add one
        overflow: 'hidden',
        height: 50, // Consistent height
        borderWidth: 1, // Border to match inputs
        borderColor: '#555', // Border color
    },
    picker: {
        flex: 1,
        color: '#fff', // Picker text color
        ...Platform.select({
            ios: {
                // iOS specific styles if needed
            },
            android: {
                // Android specific styles if needed
                height: 50, // Ensure consistent height on Android
            },
        }),
    },
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
    displayValue: { // New style for displaying non-editable text
        backgroundColor: '#282828', // Slightly darker background for display
        color: '#fff',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#444',
        marginBottom: 10, // Space between display values
    },
});