// app/signup.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
// ImagePicker and Image imports are no longer needed
// import * as ImagePicker from 'expo-image-picker';
// import { Image } from 'react-native';

// Define la URL base de tu backend
// ¡CAMBIA ESTO POR LA URL DE TU SERVIDOR DE PRODUCCIÓN CUANDO DESPLIEGUES!
const API_BASE_URL = 'https://d416-2a0c-5a82-c201-2100-5d1c-12c5-975a-a800.ngrok-free.app'; // <-- Asegúrate de que esta IP es accesible

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

    // Estados para las fotos - ELIMINADOS

    const [isLoading, setIsLoading] = useState(false); // Estado para indicador de carga

    // Opciones para los selectores (deben coincidir con los ENUMs del backend en minúsculas)
    const generoOptions = ['masculino', 'femenino', 'otro'];
    const orientacionOptions = ['heterosexual', 'homosexual', 'bisexual', 'otro'];


    // La función pickImage ha sido eliminada ya que no se necesitan fotos
    // const pickImage = async (setUri: React.Dispatch<React.SetStateAction<string | null>>) => {
    //     // ... (código de pickImage eliminado)
    // };

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

        // Validación de fotos eliminada ya que no se suben fotos.

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

        // La lógica para añadir fotos al FormData ha sido eliminada


        try {
            const response = await fetch(`${API_BASE_URL}/usuarios/signup`, {
                method: 'POST',
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
            <StatusBar barStyle="light-content" /> {/* Usar barStyle en lugar de style */}
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
            <View style={styles.orientationRowsContainer}> {/* Nuevo contenedor para las filas */}
                <View style={styles.selectionRow}>
                    {orientacionOptions.slice(0, 2).map(option => ( // Primera fila: 2 elementos
                        <TouchableOpacity
                            key={option}
                            style={[styles.selectionButton, orientacionSexual === option && styles.selectionButtonSelected]}
                            onPress={() => setOrientacionSexual(orientacionSexual === option ? null : option)}
                        >
                            <Text style={[styles.selectionButtonText, orientacionSexual === option && styles.selectionButtonTextSelected]}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.selectionRow}>
                    {orientacionOptions.slice(2, 4).map(option => ( // Segunda fila: 2 elementos
                        <TouchableOpacity
                            key={option}
                            style={[styles.selectionButton, orientacionSexual === option && styles.selectionButtonSelected]}
                            onPress={() => setOrientacionSexual(orientacionSexual === option ? null : option)}
                        >
                            <Text style={[styles.selectionButtonText, orientacionSexual === option && styles.selectionButtonTextSelected]}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>


            {/* Carga de Fotos - SE HA ELIMINADO COMPLETAMENTE */}


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
    // NUEVOS Estilos para Orientación Sexual en dos filas
    orientationRowsContainer: {
        width: '100%',
        marginTop: 8,
        padding: 5, // Padding similar al selectionContainer para mantener consistencia
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
    },
    selectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 5, // Espacio entre filas
    },
    // Estilos de Carga de Fotos - ELIMINADOS
    // photoUploadContainer: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-around',
    //     width: '100%',
    //     marginTop: 15,
    //     marginBottom: 10,
    // },
    // photoInputGroup: {
    //     alignItems: 'center',
    //     flex: 1,
    //     marginHorizontal: 5,
    // },
    // photoButton: {
    //     backgroundColor: '#1e1e1e',
    //     borderRadius: 10,
    //     padding: 15,
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     width: '80%',
    //     aspectRatio: 1,
    // },
    // photoPreview: {
    //     width: '80%',
    //     aspectRatio: 1,
    //     borderRadius: 10,
    //     marginTop: 10,
    //     resizeMode: 'cover',
    // },
});