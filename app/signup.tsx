// app/signup.tsx
import React, { useState } from 'react'; // Importa useState
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator // Importa Alert y ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useRouter } from 'expo-router'; // Importa useRouter para navegar después del éxito

// !!! Configura la URL base de tu backend con tu IP local
const API_BASE_URL = 'http://192.168.1.142:3001'; // <--- Tu URL del backend

export default function SignUpScreen() {
    const router = useRouter(); // Hook para navegación
    const [email, setEmail] = useState('');
    const [name, setName] = useState(''); // Asumiendo que el nombre de usuario se guarda aquí
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // Estado de carga

    const handleSignUp = async () => {
        console.log('handleSignUp: Iniciando función de registro'); // Log de inicio de función

        // Validaciones básicas
        if (!email || !name || !password) {
            console.log('handleSignUp: Validación fallida - campos vacíos'); // Log 2: Validación fallida
            Alert.alert('Error de registro', 'Por favor, completa todos los campos.');
            setLoading(false); // Asegúrate de desactivar la carga si la validación falla
            return;
        }
        console.log('handleSignUp: Validación exitosa'); // Log 3: Validación exitosa

        setLoading(true); // Iniciar carga
        console.log('handleSignUp: Estado de carga true'); // Log 4: Carga iniciada

        try {
            console.log(`handleSignUp: Intentando fetch a ${API_BASE_URL}/admin/signup`); // Log 5: Antes del fetch
            const response = await fetch(`${API_BASE_URL}/admin/signup`, { // <-- Endpoint de registro
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    // Asegúrate de que el campo sea 'nombre' si tu backend lo espera así
                    // (basado en la modificación anterior de app.js)
                    nombre: name, // <-- Enviando el campo 'name' del frontend como 'nombre' al backend
                }),
            });
            console.log('handleSignUp: Fetch completado'); // Log 6: Después del fetch

            const data = await response.json();
            console.log('handleSignUp: Respuesta parseada como JSON:', data); // Log 7: Respuesta JSON

            if (response.ok) { // Código de estado 2xx
                console.log('handleSignUp: Respuesta OK (2xx)'); // Log 8: Respuesta OK
                Alert.alert('Registro exitoso', 'Tu cuenta de administrador de empresa ha sido creada.');
                // Aquí podrías querer redirigir al usuario a la pantalla de login
                router.replace('/login');
            } else { // Códigos de estado de error (4xx, 5xx)
                console.log('handleSignUp: Respuesta NO OK (error)', response.status); // Log 9: Respuesta error
                console.error('Error en el registro (backend):', data.error);
                Alert.alert('Error de registro', data.error || 'Ocurrió un error al registrar el usuario.');
            }

        } catch (error) {
            console.log('handleSignUp: Error en el bloque catch'); // Log 10: Error en catch
            console.error('Error de red o inesperado:', error);
            Alert.alert('Error', 'No se pudo conectar con el servidor. Intenta de nuevo.');
        } finally {
            setLoading(false); // Finalizar carga
            console.log('handleSignUp: Estado de carga false (finally)'); // Log 11: Carga finalizada
        }
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.title}>Factio</Text>

            {/* Email */}
            <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="yourname@gmail.com"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    keyboardType="email-address"
                    value={email} // Vincula el estado al input
                    onChangeText={setEmail} // Actualiza el estado al cambiar el texto
                    autoCapitalize="none" // Evita autocapitalización en emails
                />
            </View>

            {/* Name */}
            <Text style={styles.label}>Your Name</Text>
            <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="@yourname"
                    placeholderTextColor="#aaa"
                    style={styles.input}
                    value={name} // Vincula el estado al input
                    onChangeText={setName} // Actualiza el estado al cambiar el texto
                    // Podrías necesitar ajustar autoCapitalize/autoCorrect dependiendo del formato del nombre
                />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color="#aaa" />
                <TextInput
                    placeholder="********"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    style={styles.input}
                    value={password} // Vincula el estado al input
                    onChangeText={setPassword} // Actualiza el estado al cambiar el texto
                />
            </View>

            {/* Botón Sign Up */}
            <LinearGradient colors={['#e14eca','#f4524d']} style={styles.button}>
                {/* Llama a handleSignUp al presionar */}
                <TouchableOpacity onPress={handleSignUp} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign up</Text>
                    )}
                </TouchableOpacity>
            </LinearGradient>

            {/* Otras opciones sociales - Lógica no implementada aquí */}
            <Text style={styles.orText}>Or sign up with</Text>
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
            <Link href="/login" style={styles.switchLink}>
                <Text style={styles.switchText}>¿Ya tienes cuenta? Iniciar sesión</Text>
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
    buttonText: { color: '#fff', fontWeight: 'bold' },
    orText: { color: '#aaa', marginTop: 20 },
    socialRow: { flexDirection: 'row', marginTop: 10 },
    socialButton: { backgroundColor: '#1e1e1e', padding: 12, borderRadius: 10, marginHorizontal: 5 },
    switchLink: { marginTop: 20 },
    switchText: { color: '#aaa', textDecorationLine: 'underline' },
});
