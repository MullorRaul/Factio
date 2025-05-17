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
    nombre: string | null; // Mapeado a 'Sobre mí' en frontend
    username: string | null;
    edad: number | null | undefined;
    genero: string | null;
    estudios_trabajo: string | null;
    orientacion_sexual: string | null;
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
    const [genero, setGenero] = useState<string>('');
    const [estudiosTrabajo, setEstudiosTrabajo] = useState<string>('');
    const [orientacionSexual, setOrientacionSexual] = useState<string>('');
    const [description, setDescription] = useState<string>(''); // Mapeado a 'nombre' en DB


    const [password, setPassword] = useState<string>('');

    const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
    const [newProfilePhotoFile, setNewProfilePhotoFile] = useState<any>(null);


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
                        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
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
                    setGenero(profile.genero || '');
                    setEstudiosTrabajo(profile.estudios_trabajo || '');
                    setOrientacionSexual(profile.orientacion_sexual || '');
                    setDescription(profile.nombre || '');

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
                console.log('DEBUG: fetchProfile finally block executed.');
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

        const originalDescription = originalProfileData?.nombre || '';
        const currentDescription = description.trim();
        if (originalDescription !== currentDescription) {
            formData.append('nombre', currentDescription);
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
                formData.append('edad', '');
                hasChanges = true;
            }
        }

        const originalGenero = originalProfileData?.genero || '';
        const currentGenero = genero.trim();
        if (originalGenero !== currentGenero) {
            formData.append('genero', currentGenero);
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
        const currentOrientacionSexual = orientacionSexual.trim();
        if (originalOrientacionSexual !== currentOrientacionSexual) {
            formData.append('orientacion_sexual', currentOrientacionSexual);
            hasChanges = true;
        } else if (currentOrientacionSexual === '' && originalProfileData?.orientacion_sexual !== null) {
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

                    {/* Campo "Sobre mí" */}
                    <Text style={styles.label}>Sobre mí:</Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Cuéntanos algo sobre ti"
                        placeholderTextColor="#aaa"
                        multiline={true}
                        numberOfLines={4}
                        textAlignVertical="top"
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

                    {/* Campo Género (Picker) */}
                    <Text style={styles.label}>Género:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={genero}
                            onValueChange={(itemValue, itemIndex) => setGenero(itemValue)}
                            style={styles.picker}
                            dropdownIconColor="#fff"
                        >
                            <Picker.Item label="Selecciona tu género" value="" enabled={false} style={{ color: '#aaa' }} />
                            <Picker.Item label="Masculino" value="Masculino" />
                            <Picker.Item label="Femenino" value="Femenino" />
                            <Picker.Item label="No binario" value="No binario" />
                            <Picker.Item label="Prefiero no decir" value="Prefiero no decir" />
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

                    {/* Campo Orientación Sexual (Picker) */}
                    <Text style={styles.label}>Orientación Sexual:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={orientacionSexual}
                            onValueChange={(itemValue, itemIndex) => setOrientacionSexual(itemValue)}
                            style={styles.picker}
                            dropdownIconColor="#fff"
                        >
                            <Picker.Item label="Selecciona tu orientación" value="" enabled={false} style={{ color: '#aaa' }} />
                            <Picker.Item label="Heterosexual" value="Heterosexual" />
                            <Picker.Item label="Homosexual" value="Homosexual" />
                            <Picker.Item label="Bisexual" value="Bisexual" />
                            <Picker.Item label="Pansexual" value="Pansexual" />
                            <Picker.Item label="Asexual" value="Asexual" />
                            <Picker.Item label="Prefiero no decir" value="Prefiero no decir" />
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
    pickerContainer: {
        backgroundColor: '#333',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#555',
        marginBottom: 10,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
        color: '#fff',
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
});
