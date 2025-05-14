// app/login.tsx
import React, { useState } from 'react'; // Importa useState
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator // Importa Alert y ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useRouter } from 'expo-router';

// !!! Configura la URL base de tu backend con tu IP local
const API_BASE_URL = 'http://192.168.1.142:3001'; // <--- URL de tu backend usando tu IP local

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // Estado de carga


    const handleLogin = async () => {
        console.log('handleLogin: Iniciando función de login'); // Log de inicio de función

        // Validaciones básicas
        if (!email || !password) {
            console.log('handleLogin: Validación fallida - campos vacíos');
            Alert.alert('Error de inicio de sesión', 'Por favor, introduce email y contraseña.');
            setLoading(false); // Asegúrate de desactivar la carga si la validación falla
            return;
        }
        console.log('handleLogin: Validación exitosa');

        setLoading(true); // Iniciar carga
        console.log('handleLogin: Estado de carga true');

        try {
            console.log(`handleLogin: Intentando fetch a ${API_BASE_URL}/admin/login`); // Log antes del fetch
            const response = await fetch(`${API_BASE_URL}/admin/login`, { // <-- Endpoint de login
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email, // <-- Asegúrate que el campo sea 'email' si tu backend lo espera así
                    password: password,
                }),
            });
            console.log('handleLogin: Fetch completado'); // Log después del fetch

            const data = await response.json();
            console.log('handleLogin: Respuesta parseada como JSON:', data); // Log respuesta JSON

            if (response.ok) { // Código de estado 2xx
                console.log('handleLogin: Respuesta OK (2xx)'); // Log respuesta OK
                // ¡Login exitoso!
                Alert.alert('Inicio de sesión exitoso', 'Has iniciado sesión como administrador.');
                // Aquí debes manejar el token JWT que recibes en `data.token`
                // Por ejemplo: await AsyncStorage.setItem('jwtToken', data.token);
                console.log('Token recibido:', data.token); // Logea el token por ahora
                // Redirige al usuario a la pantalla principal (ej: pubReel)
                router.replace('/pubReel'); // Reemplaza la pantalla actual en el historial
            } else { // Códigos de estado de error
                console.log('handleLogin: Respuesta NO OK (error)', response.status); // Log respuesta error
                console.error('Error en el inicio de sesión (backend):', data.error);
                Alert.alert('Error de inicio de sesión', data.error || 'Credenciales inválidas.');
            }

        } catch (error) {
            console.log('handleLogin: Error en el bloque catch'); // Log en catch
            console.error('Error de red o inesperado:', error);
            Alert.alert('Error', 'No se pudo conectar con el servidor. Intenta de nuevo.');
        } finally {
            setLoading(false); // Finalizar carga
            console.log('handleLogin: Estado de carga false (finally)'); // Log carga finalizada
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.title}>Iniciar Sesión</Text>

            {/* Email */}
            <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    keyboardType="email-address"
                    value={email} // Vincula el estado al input
                    onChangeText={setEmail} // Actualiza el estado
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
                    value={password} // Vincula el estado al input
                    onChangeText={setPassword} // Actualiza el estado
                />
            </View>

            {/* Botón Login */}
            <LinearGradient colors={['#e14eca','#f4524d']} style={styles.button}>
                {/* Llama a handleLogin al presionar */}
                <TouchableOpacity onPress={handleLogin} disabled={loading}>
                    {/* Muestra indicador de carga si está cargando */}
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Iniciar Sesión</Text> // Cambiado a español
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {/* Link a Sign Up */}
            <Link href="/signup" style={styles.switchLink}>
                <Text style={styles.switchText}>¿No tienes cuenta? Regístrate</Text>
            </Link>
        </View>
    );
}

// ... Tus estilos permanecen igual ...
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
    input: { flex: 1, color: '#fff' },
    button: { marginTop: 20, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' }, // Asegúrate de que este estilo exista si lo usas
    switchLink: { marginTop: 20 },
    switchText: { color: '#aaa', textDecorationLine: 'underline' },
});
