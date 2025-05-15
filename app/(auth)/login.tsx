// app/login.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator // Importa ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';

// Define la URL base de tu backend usando la IP local de tu ordenador
// ¡CAMBIA ESTO POR LA URL DE TU SERVIDOR DE PRODUCCIÓN CUANDO DESPLIEGUES!
const API_BASE_URL = 'http://192.168.1.142:3001'; // <-- IP de tu ordenador

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState(''); // Estado para el username
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        // Validar campos requeridos para login: Email, Username, Password
        // Tu backend /usuarios/login espera estos 3 campos.
        if (!email || !username || !password) {
            Alert.alert('Error', 'Por favor, introduce email, username y contraseña.');
            return;
        }

        setIsLoading(true); // Inicia el indicador de carga

        try {
            // Llama a la ruta de login de usuario en tu backend
            const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Envía email, username y password como pide la API de backend
                body: JSON.stringify({ email, username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Si la respuesta no es OK (ej. 401 Unauthorized, 400 Bad Request)
                Alert.alert('Error al iniciar sesión', data.error || 'Error desconocido.');
                console.error('Error response data:', data); // Log para depuración
                // Considera limpiar los campos de contraseña aquí por seguridad
                setPassword('');
                return; // Detiene la ejecución si hay error
            }

            // Si la respuesta es OK (ej. 200 OK)
            const token = data.token; // Asume que el token viene en 'token'

            // TODO: Guarda el token de forma segura (ej. AsyncStorage)
            console.log('Login exitoso. Token recibido:', token);
            // Ejemplo (requiere instalar @react-native-async-storage/async-storage):
            // import AsyncStorage from '@react-native-async-storage/async-storage';
            // await AsyncStorage.setItem('userToken', token);


            // Navega a la siguiente pantalla (por ejemplo, '/offers')
            router.replace('/offers'); // Asegúrate de que esta ruta exista y sea accesible después del login

        } catch (error: any) { // Captura errores de red, etc.
            console.error('Error durante la petición de login:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo y la IP es correcta.');
            // Considera limpiar los campos de contraseña aquí también
            setPassword('');
        } finally {
            setIsLoading(false); // Detiene el indicador de carga
        }
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.title}>Iniciar Sesión</Text>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    keyboardType="email-address"
                    value={email} // Vincula el valor del input al estado 'email'
                    onChangeText={setEmail} // Actualiza el estado 'email' al escribir
                    autoCapitalize="none" // Previene mayúsculas automáticas para emails
                />
            </View>

            {/* Username */}
            <Text style={styles.label}>Username</Text> {/* Campo Username */}
            <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color="#aaa" /> {/* Icono de usuario */}
                <TextInput
                    placeholder="@yourusername"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    value={username} // Vincula el valor del input al estado 'username'
                    onChangeText={setUsername} // Actualiza el estado 'username' al escribir
                    autoCapitalize="none"
                />
            </View>

            {/* Password */}
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="********"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    style={styles.input}
                    value={password} // Vincula el valor del input al estado 'password'
                    onChangeText={setPassword} // Actualiza el estado 'password' al escribir
                />
            </View>

            {/* Botón Login */}
            <LinearGradient colors={['#e14eca','#f4524d']} style={styles.button}>
                {/* Llama a handleLogin al presionar, y deshabilita si está cargando */}
                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={isLoading} // Deshabilita si está cargando
                    style={{ alignItems: 'center', width: '100%' }} // Asegura que el contenido esté centrado
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" /> // Indicador de carga
                    ) : (
                        <Text style={styles.buttonText}>Iniciar Sesión</Text>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {/* Link a Sign Up */}
            <Link href="/(auth)/signup" style={styles.switchLink}>
                <Text style={styles.switchText}>¿No tienes cuenta? Regístrate</Text>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    // Mantén tus estilos existentes
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
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
    input: { flex: 1, color: '#fff', paddingVertical: 0, marginLeft: 10 }, // Añadido marginLeft
    button: { marginTop: 20, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    switchLink: { marginTop: 20 },
    switchText: { color: '#aaa', textDecorationLine: 'underline' },
});
