// app/login.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define la URL base de tu backend
// ¡CAMBIA ESTO POR LA URL DE TU SERVIDOR DE PRODUCCIÓN CUANDO DESPLIEGUES!
import { BASE_URL } from '../../app/urlgrok';
const API_BASE_URL = BASE_URL // <-- Asegúrate de que esta IP es accesible desde tu dispositivo/simulador

// Define la clave para AsyncStorage
const AUTH_TOKEN_KEY = 'userToken'; // Clave para guardar el token JWT

export default function LoginScreen() {
    const router = useRouter();
    const [emailOrUsername, setEmailOrUsername] = useState(''); // Estado para email o username
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Estado para el indicador de carga

    const handleLogin = async () => {
        setIsLoading(true); // Iniciar indicador de carga

        // Determinar si el input es email o username (validación básica)
        const isEmail = emailOrUsername.includes('@');
        const loginPayload = isEmail
            ? { email: emailOrUsername, password: password }
            : { username: emailOrUsername, password: password };

        try {
            const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginPayload),
            });

            const data = await response.json();

            if (!response.ok) {
                // Si la respuesta no es OK (ej: 401, 400, 500)
                Alert.alert('Error de inicio de sesión', data.error || 'Error desconocido al iniciar sesión.');
                console.error('Login API Error:', data.error);
            } else {
                // Inicio de sesión exitoso
                const token = data.token;
                if (token) {
                    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token); // Guardar el token
                    console.log('Token guardado:', token);
                    Alert.alert('Éxito', 'Inicio de sesión exitoso.');
                    // Redirigir a la pantalla principal de la aplicación (ej: offers/event feed)
                    router.replace('/offers'); // Ajusta esta ruta a tu pantalla principal
                } else {
                    Alert.alert('Error', 'Respuesta de inicio de sesión inválida: No se recibió token.');
                }
            }

        } catch (error: any) {
            console.error('Fetch error during login:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Verifica la URL y tu conexión.');
        } finally {
            setIsLoading(false); // Detener indicador de carga
        }
    };

    // @ts-ignore
    // @ts-ignore
    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Text style={styles.title}>Iniciar Sesión</Text>

            {/* Campo Email o Username */}
            <Text style={styles.label}>Email o Username</Text>
            <View style={styles.inputContainer}>
                <Icon name="account-outline" size={24} color="#aaa" />
                <TextInput
                    style={styles.input}
                    placeholder="Email o Username"
                    placeholderTextColor="#aaa"
                    value={emailOrUsername}
                    onChangeText={setEmailOrUsername}
                    keyboardType={emailOrUsername.includes('@') ? 'email-address' : 'default'} // Sugerir teclado
                    autoCapitalize="none"
                />
            </View>

            {/* Campo Contraseña */}
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={24} color="#aaa" />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            {/* Botón de Iniciar Sesión */}
            <LinearGradient
                colors={['#e14eca', '#9e6fca']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={isLoading} // Deshabilitar botón durante la carga
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" /> // Indicador de carga
                    ) : (
                        <Text style={styles.buttonText}>Iniciar Sesión</Text>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {/* Link a Sign Up */}
            <Link href="/signup" style={styles.switchLink}> {/* Asegúrate de que la ruta '/signup' es correcta */}
                <Text style={styles.switchText}>¿No tienes cuenta? Regístrate</Text>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
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
    input: { flex: 1, color: '#fff', paddingVertical: 0, marginLeft: 10 },
    buttonGradient: {
        width: '100%',
        borderRadius: 10,
        marginTop: 20,
    },
    loginButton: {
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
        marginTop: 20,
    },
    switchText: {
        color: '#e14eca',
        fontSize: 16,
    },
});
