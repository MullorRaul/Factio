// app/signup.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator, ScrollView, Image, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
// import { Picker } from '@react-native-picker/picker'; // Si usas Picker, asegúrate de que está instalado y se usa correctamente
// Reemplazado Picker por botones de selección manual para mejor UI en móvil

// Define la URL base de tu backend
// ¡CAMBIA ESTO POR LA URL DE TU SERVIDOR DE PRODUCCIÓN CUANDO DESPLIEGUES!
import { BASE_URL } from '../../app/urlgrok';
const API_BASE_URL = BASE_URL // <-- Asegúrate de que esta IP es accesible

export default function SignUpScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [edad, setEdad] = useState('');

    // Estados para campos opcionales
    const [genero, setGenero] = useState<string | null>(null); // Usamos null para estado inicial "no seleccionado"
    const [estudiosTrabajo, setEstudiosTrabajo] = useState('');
    const [orientacionSexual, setOrientacionSexual] = useState<string | null>(null); // Usamos null

    // Estados para las fotos
    const [foto1Uri, setFoto1Uri] = useState<string | null>(null);
    const [foto2Uri, setFoto2Uri] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false); // Estado para indicador de carga

    // Opciones para los selectores (deben coincidir con los ENUMs del backend en minúsculas)
    const generoOptions = ['masculino', 'femenino', 'otro'];
    const orientacionOptions = ['heterosexual', 'homosexual', 'bisexual', 'otro'];


    const pickImage = async (setUri: React.Dispatch<React.SetStateAction<string | null>>) => {
        // Solicitar permisos de la galería
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tu galería de fotos.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3], // O el aspecto que prefieras
            quality: 0.5, // Reducir calidad para subir más rápido
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setUri(result.assets[0].uri); // Usar la URI del asset seleccionado
        }
    };

    const handleSignUp = async () => {
        setIsLoading(true); // Iniciar indicador de carga

        // Validar campos requeridos
        if (!email || !username || !password) {
            Alert.alert('Campos incompletos', 'Email, username y password son requeridos.');
            setIsLoading(false);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.\S+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Email inválido', 'Por favor, introduce un formato de email correcto.');
            setIsLoading(false);
            return;
        }

        // Validar que al menos una foto fue seleccionada (si es obligatorio)
        // if (!foto1Uri && !foto2Uri) {
        //     Alert.alert('Fotos requeridas', 'Debes subir al menos una foto.');
        //     setIsLoading(false);
        //     return;
        // }


        const formData = new FormData();
        formData.append('email', email.trim());
        formData.append('username', username.trim());
        formData.append('password', password.trim());

        // Añadir campos opcionales solo si tienen valor (no null o cadena vacía después de trim)
        if (edad.trim() !== '') {
            const parsedEdad = parseInt(edad.trim(), 10);
            if (!isNaN(parsedEdad)) {
                formData.append('edad', parsedEdad.toString()); // Enviar edad como string
            } else {
                Alert.alert('Edad inválida', 'Por favor, introduce un número válido para la edad.');
                setIsLoading(false);
                return;
            }
        }

        if (genero !== null) { // Si se seleccionó un género (no es null)
            formData.append('genero', genero.toLowerCase()); // Enviar en minúsculas
        }
        if (estudiosTrabajo.trim() !== '') {
            formData.append('estudios_trabajo', estudiosTrabajo.trim());
        }
        if (orientacionSexual !== null) { // Si se seleccionó una orientación (no es null)
            formData.append('orientacion_sexual', orientacionSexual.toLowerCase()); // Enviar en minúsculas
        }

        // Añadir archivos de fotos si existen
        // Formato para subir archivos con fetch y FormData en React Native
        // https://github.com/facebook/react-native/issues/11725
        if (foto1Uri) {
            const uriParts = foto1Uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            formData.append('foto1', {
                uri: foto1Uri,
                name: `foto1_${Date.now()}.${fileType}`,
                type: `image/${fileType}`, // O usar 'image/jpeg', 'image/png' etc.
            } as any); // 'as any' a veces es necesario para el tipo de archivo en FormData
        }

        if (foto2Uri) {
            const uriParts = foto2Uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            formData.append('foto2', {
                uri: foto2Uri,
                name: `foto2_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }


        try {
            const response = await fetch(`${API_BASE_URL}/usuarios/signup`, {
                method: 'POST',
                // NO establecer Content-Type: 'multipart/form-data'. Fetch lo hace automáticamente con FormData.
                // headers: { 'Content-Type': 'multipart/form-data' }, // <-- ¡NO HACER ESTO!
                body: formData, // Envía el FormData
            });

            const data = await response.json();

            if (!response.ok) {
                // Si la respuesta no es OK (ej: 409, 400, 500)
                Alert.alert('Error de registro', data.error || 'Error desconocido al registrar usuario.');
                console.error('Signup API Error:', data.error);
            } else {
                // Registro exitoso
                Alert.alert('Éxito', data.message || 'Usuario registrado exitosamente.');
                // Redirigir a la pantalla de login después del registro exitoso
                router.replace('/login'); // Ajusta esta ruta a tu pantalla de login
            }

        } catch (error: any) {
            console.error('Fetch error during signup:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Verifica la URL y tu conexión.');
        } finally {
            setIsLoading(false); // Detener indicador de carga
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <StatusBar style="light" />
            <Text style={styles.title}>Regístrate</Text>

            {/* Campos de texto requeridos */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
                <Icon name="email-outline" size={24} color="#aaa" />
                <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
                <Icon name="account-outline" size={24} color="#aaa" />
                <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#aaa" value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={24} color="#aaa" />
                <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#aaa" secureTextEntry value={password} onChangeText={setPassword} />
            </View>

            {/* Campos opcionales */}
            <Text style={styles.label}>Edad</Text>
            <View style={styles.inputContainer}>
                <Icon name="cake-variant-outline" size={24} color="#aaa" />
                <TextInput style={styles.input} placeholder="Edad" placeholderTextColor="#aaa" value={edad} onChangeText={setEdad} keyboardType="number-pad" />
            </View>

            <Text style={styles.label}>Género</Text>
            <View style={styles.selectionContainer}>
                {generoOptions.map(option => (
                    <TouchableOpacity
                        key={option}
                        style={[styles.selectionButton, genero === option && styles.selectionButtonSelected]}
                        onPress={() => setGenero(genero === option ? null : option)} // Toggle selection
                    >
                        <Text style={[styles.selectionButtonText, genero === option && styles.selectionButtonTextSelected]}>
                            {option.charAt(0).toUpperCase() + option.slice(1)} {/* Capitalizar para mostrar */}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Estudios/Trabajo (Opcional)</Text>
            <View style={styles.inputContainer}>
                <Icon name="briefcase-outline" size={24} color="#aaa" />
                <TextInput style={styles.input} placeholder="Estudios o Trabajo" placeholderTextColor="#aaa" value={estudiosTrabajo} onChangeText={setEstudiosTrabajo} />
            </View>

            <Text style={styles.label}>Orientación Sexual</Text>
            <View style={styles.selectionContainer}>
                {orientacionOptions.map(option => (
                    <TouchableOpacity
                        key={option}
                        style={[styles.selectionButton, orientacionSexual === option && styles.selectionButtonSelected]}
                        onPress={() => setOrientacionSexual(orientacionSexual === option ? null : option)} // Toggle selection
                    >
                        <Text style={[styles.selectionButtonText, orientacionSexual === option && styles.selectionButtonTextSelected]}>
                            {option.charAt(0).toUpperCase() + option.slice(1)} {/* Capitalizar para mostrar */}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>


            {/* Carga de Fotos */}
            <Text style={styles.label}>Fotos (Opcional)</Text>
            <View style={styles.photoUploadContainer}>
                <View style={styles.photoInputGroup}>
                    <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setFoto1Uri)}>
                        <Icon name="camera-outline" size={30} color="#aaa" />
                        <Text style={styles.selectionButtonText}>Foto 1</Text>
                    </TouchableOpacity>
                    {foto1Uri && <Image source={{ uri: foto1Uri }} style={styles.photoPreview} />}
                </View>
                <View style={styles.photoInputGroup}>
                    <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setFoto2Uri)}>
                        <Icon name="camera-outline" size={30} color="#aaa" />
                        <Text style={styles.selectionButtonText}>Foto 2</Text>
                    </TouchableOpacity>
                    {foto2Uri && <Image source={{ uri: foto2Uri }} style={styles.photoPreview} />}
                </View>
            </View>


            {/* Botón de Registro */}
            <LinearGradient
                colors={['#e14eca', '#9e6fca']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.signupButton}
                    onPress={handleSignUp}
                    disabled={isLoading} // Deshabilitar botón durante la carga
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" /> // Indicador de carga
                    ) : (
                        <Text style={styles.buttonText}>Registrarse</Text>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {/* Link a Login */}
            <Link href="/login" style={styles.switchLink}> {/* Asegúrate de que la ruta '/login' es correcta */}
                <Text style={styles.switchText}>¿Ya tienes cuenta? Inicia Sesión</Text>
            </Link>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1, // Permite que el contenido crezca para ScrollView
        backgroundColor: '#0d0d0d',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60, // Espacio para la barra de estado
    },
    title: { fontSize: 36, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
    label: { color: '#fff', alignSelf: 'flex-start', marginLeft: 10, marginTop: 15, fontSize: 14 },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 10,
        marginTop: 8,
        alignItems: 'center',
        width: '100%',
    },
    input: { flex: 1, color: '#fff', paddingVertical: 0, marginLeft: 10 },
    buttonGradient: {
        width: '100%',
        borderRadius: 10,
        marginTop: 25, // Más espacio antes del botón principal
        marginBottom: 15, // Espacio después del botón principal
    },
    signupButton: {
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchLink: {
        // No necesita marginTop si ya hay marginBottom en el botón
    },
    switchText: {
        color: '#e14eca',
        fontSize: 16,
    },
    // Estilos para los selectores de género y orientación
    selectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 5,
        marginTop: 8,
        width: '100%',
    },
    selectionButton: {
        flex: 1, // Distribuye el espacio equitativamente
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        marginHorizontal: 3, // Espacio entre botones
    },
    selectionButtonSelected: {
        backgroundColor: '#e14eca',
    },
    selectionButtonText: {
        color: '#aaa',
        fontWeight: 'bold',
        fontSize: 14, // Ajustar tamaño de fuente
    },
    selectionButtonTextSelected: {
        color: '#fff',
    },
    // Estilos de Carga de Fotos
    photoUploadContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 15,
        marginBottom: 10,
    },
    photoInputGroup: {
        alignItems: 'center',
        flex: 1, // Ocupa el espacio disponible
        marginHorizontal: 5,
    },
    photoButton: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%', // Ancho del botón
        aspectRatio: 1, // Hacerlo cuadrado
    },
    photoPreview: {
        width: '80%', // Ancho de la previsualización
        aspectRatio: 1, // Hacerlo cuadrado
        borderRadius: 10,
        marginTop: 10,
        resizeMode: 'cover',
    },
});
