// app/signup.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator, ScrollView // Importa ScrollView para campos opcionales
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';

// Define la URL base de tu backend usando la IP local de tu ordenador
// ¡CAMBIA ESTO POR LA URL DE TU SERVIDOR DE PRODUCCIÓN CUANDO DESPLIEGUES!
const API_BASE_URL = 'http://192.168.1.142:3001'; // <-- IP de tu ordenador

export default function SignUpScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState(''); // Estado para username
    const [password, setPassword] = useState('');
    const [edad, setEdad] = useState(''); // Estado para Edad (opcional)
    const [estudiosTrabajo, setEstudiosTrabajo] = useState(''); // Estado para Estudios_Trabajo (opcional)
    const [orientacionSexual, setOrientacionSexual] = useState(''); // Estado para Orientacion_sexual (opcional)
    const [isLoading, setIsLoading] = useState(false); // Estado para indicador de carga


    const handleSignUp = async () => {
        // Validar campos requeridos (Email, Username, Password)
        if (!email || !username || !password) {
            Alert.alert('Error', 'Por favor, completa los campos de email, username y contraseña.');
            return;
        }

        setIsLoading(true); // Inicia el indicador de carga

        try {
            // Llama a la ruta de registro de usuario en tu backend
            const response = await fetch(`${API_BASE_URL}/usuarios/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Envía todos los campos, incluyendo los opcionales si tienen valor
                body: JSON.stringify({
                    email,
                    username,
                    password,
                    // Incluye campos opcionales solo si tienen valor y no son solo espacios
                    ...(edad && edad.trim() !== '' && { edad: parseInt(edad, 10) }), // Convertir edad a número si se proporciona y no está vacío
                    ...(estudiosTrabajo && estudiosTrabajo.trim() !== '' && { estudios_trabajo: estudiosTrabajo.trim() }),
                    ...(orientacionSexual && orientacionSexual.trim() !== '' && { orientacion_sexual: orientacionSexual.trim() }),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Error al registrarse', data.error || 'Error desconocido.');
                console.error('Error response data:', data);
                // Considera limpiar solo la contraseña por seguridad en caso de error
                setPassword('');
                // Opcional: Limpiar campos opcionales si el registro falla
                // setEdad('');
                // setEstudiosTrabajo('');
                // setOrientacionSexual('');
                return;
            }

            // Registro exitoso
            Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');

            // Limpiar formulario y navegar a login
            setEmail('');
            setUsername('');
            setPassword('');
            setEdad('');
            setEstudiosTrabajo('');
            setOrientacionSexual('');

            router.replace('/(auth)/login'); // Navega a la pantalla de login

        } catch (error: any) {
            console.error('Error durante la petición de signup:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo y la IP es correcta.');
            // Limpiar solo la contraseña en caso de error de conexión también
            setPassword('');
            // Opcional: Limpiar campos opcionales en caso de error de conexión
            // setEdad('');
            // setEstudiosTrabajo('');
            // setOrientacionSexual('');
        } finally {
            setIsLoading(false); // Detiene el indicador de carga
        }
    };

    return (
        // Envuelve el contenido en ScrollView para manejar el desbordamiento con muchos campos
        <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.title}>Factio</Text>

            {/* Email (Requerido) */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
            </View>

            {/* Username (Requerido) */}
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="@yourusername"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />
            </View>

            {/* Password (Requerido) */}
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="********"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            {/* Edad (Opcional) */}
            <Text style={styles.label}>Edad (Opcional)</Text>
            <View style={styles.inputContainer}>
                <Icon name="numeric" size={20} color="#aaa" />
                <TextInput
                    placeholder="Ej: 25"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    keyboardType="numeric" // Solo números
                    value={edad}
                    onChangeText={setEdad}
                />
            </View>

            {/* Estudios/Trabajo (Opcional) */}
            <Text style={styles.label}>Estudios / Trabajo (Opcional)</Text>
            <View style={styles.inputContainer}>
                <Icon name="school-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="Ej: Estudiante, Ingeniero"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    value={estudiosTrabajo}
                    onChangeText={setEstudiosTrabajo}
                />
            </View>

            {/* Orientación Sexual (Opcional) */}
            <Text style={styles.label}>Orientación Sexual (Opcional)</Text>
            <View style={styles.inputContainer}>
                <Icon name="gender-male-female" size={20} color="#aaa" />
                <TextInput
                    placeholder="Ej: Heterosexual"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    value={orientacionSexual}
                    onChangeText={setOrientacionSexual}
                />
            </View>


            {/* Botón Sign Up */}
            <LinearGradient colors={['#e14eca','#f4524d']} style={styles.button}>
                <TouchableOpacity
                    onPress={handleSignUp}
                    disabled={isLoading} // Deshabilita si está cargando
                    style={{ alignItems: 'center', width: '100%' }} // Asegura que el contenido esté centrado
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" /> // Indicador de carga
                    ) : (
                        <Text style={styles.buttonText}>Registrarse</Text>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {/* Otras opciones sociales (Mantener o eliminar si no las necesitas) */}
            <Text style={styles.orText}>O registrarse con</Text>
            <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="google" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="apple" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="facebook" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Link a Login */}
            <Link href="/(auth)/login" style={styles.switchLink}>
                <Text style={styles.switchText}>¿Ya tienes cuenta? Iniciar sesión</Text>
            </Link>
        </ScrollView> // Cierra ScrollView
    );
}

const styles = StyleSheet.create({
    // Añade un estilo para el contenido dentro del ScrollView
    scrollContainer: {
        flexGrow: 1, // Permite que el contenido crezca
        justifyContent: 'center', // Centra el contenido verticalmente si hay espacio
        alignItems: 'center',
        padding: 20,
        paddingTop: 50, // Añade un poco de padding arriba si es necesario
        paddingBottom: 50, // Añade padding abajo para que el último campo no quede pegado al borde
    },
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        // Elimina alignItems y justifyContent de aquí si los pones en scrollContainer
    },
    title: { fontSize: 36, color: '#fff', fontWeight: 'bold', marginBottom: 30 },
    label: { color: '#fff', alignSelf: 'flex-start', marginLeft: 10, marginTop: 10, fontSize: 14 },
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
    button: { marginTop: 20, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    orText: { color: '#aaa', marginTop: 20 },
    socialRow: { flexDirection: 'row', marginTop: 10 },
    socialButton: { backgroundColor: '#1e1e1e', padding: 12, borderRadius: 10, marginHorizontal: 5 },
    switchLink: { marginTop: 20 },
    switchText: { color: '#aaa', textDecorationLine: 'underline' },
});
