// app/signup.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, Alert, ActivityIndicator, ScrollView, Image // Importa Image para mostrar previsualización
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // Importa ImagePicker

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

    // Nuevos estados para las fotos
    const [foto1Uri, setFoto1Uri] = useState<string | null>(null); // URI de la primera foto seleccionada
    const [foto2Uri, setFoto2Uri] = useState<string | null>(null); // URI de la segunda foto seleccionada

    // Función para seleccionar una imagen
    const pickImage = async (setFotoUri: React.Dispatch<React.SetStateAction<string | null>>) => {
        // Solicitar permisos de la galería
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a tu galería de fotos.');
            return;
        }

        // Abrir la galería para seleccionar una imagen
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Solo imágenes
            allowsEditing: true, // Permite editar/recortar la imagen seleccionada
            aspect: [4, 3], // Aspect ratio opcional
            quality: 1, // Calidad de la imagen (0 a 1)
        });

        // Si el usuario no canceló y seleccionó una imagen
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedAsset = result.assets[0];
            setFotoUri(selectedAsset.uri); // Guarda la URI de la imagen seleccionada
        }
    };


    const handleSignUp = async () => {
        // Validar campos requeridos (Email, Username, Password)
        if (!email || !username || !password) {
            Alert.alert('Error', 'Por favor, completa los campos de email, username y contraseña.');
            return;
        }

        setIsLoading(true); // Inicia el indicador de carga

        // Crear un objeto FormData para enviar datos mixtos (texto y archivos)
        const formData = new FormData();

        // Añadir campos de texto al FormData
        formData.append('email', email);
        formData.append('username', username);
        formData.append('password', password);

        // Añadir campos opcionales si tienen valor
        if (edad && edad.trim() !== '') {
            // Asegúrate de que el backend espera un número o una cadena
            formData.append('edad', edad.trim()); // Enviamos como string, el backend puede parsear a int
        }
        if (estudiosTrabajo && estudiosTrabajo.trim() !== '') {
            formData.append('estudios_trabajo', estudiosTrabajo.trim());
        }
        if (orientacionSexual && orientacionSexual.trim() !== '') {
            formData.append('orientacion_sexual', orientacionSexual.trim());
        }

        // Añadir archivos de foto al FormData si se seleccionaron
        // El nombre del campo ('foto1', 'foto2') debe coincidir con lo que espera Multer en el backend
        if (foto1Uri) {
            // Para FormData con archivos en React Native, necesitas crear un objeto con uri, name y type
            const uriParts = foto1Uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            const fileName = `foto1_${Date.now()}.${fileType}`; // Genera un nombre de archivo único

            formData.append('foto1', {
                uri: foto1Uri,
                name: fileName,
                type: `image/${fileType}`, // Asegúrate de que el tipo MIME sea correcto
            } as any); // Usamos 'as any' para evitar errores de tipo con FormData y archivos en RN
        }

        if (foto2Uri) {
            const uriParts = foto2Uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            const fileName = `foto2_${Date.now()}.${fileType}`;

            formData.append('foto2', {
                uri: foto2Uri,
                name: fileName,
                type: `image/${fileType}`,
            } as any);
        }


        try {
            // Llama a la ruta de registro de usuario en tu backend
            const response = await fetch(`${API_BASE_URL}/usuarios/signup`, {
                method: 'POST',
                // ¡IMPORTANTE! No establezcas el 'Content-Type' a 'multipart/form-data' manualmente.
                // Cuando envías un objeto FormData, el método fetch en navegadores y React Native
                // lo establece automáticamente con el boundary correcto.
                // headers: { 'Content-Type': 'multipart/form-data', ... }, // <-- NO HACER ESTO
                body: formData, // Envía el objeto FormData
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Error al registrarse', data.error || 'Error desconocido.');
                console.error('Error response data:', data);
                setPassword(''); // Limpiar contraseña por seguridad
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
            setFoto1Uri(null); // Limpiar URIs de fotos
            setFoto2Uri(null);

            router.replace('/(auth)/login'); // Navega a la pantalla de login

        } catch (error: any) {
            console.error('Error durante la petición de signup:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo y la IP es correcta.');
            setPassword(''); // Limpiar contraseña
        } finally {
            setIsLoading(false); // Detiene el indicador de carga
        }
    };

    return (
        // Envuelve el contenido en ScrollView para manejar el desbordamiento con muchos campos
        <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.title}>Factio</Text>

            {/* Campos de texto (Sin cambios) */}
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color="#aaa" />
                <TextInput placeholder="yourname@gmail.com" placeholderTextColor="#aaa" style={styles.input} keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
            </View>

            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color="#aaa" />
                <TextInput placeholder="@yourusername" placeholderTextColor="#aaa" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color="#aaa" />
                <TextInput placeholder="********" placeholderTextColor="#aaa" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            </View>

            <Text style={styles.label}>Edad (Opcional)</Text>
            <View style={styles.inputContainer}>
                <Icon name="numeric" size={20} color="#aaa" />
                <TextInput placeholder="Ej: 25" placeholderTextColor="#aaa" style={styles.input} keyboardType="numeric" value={edad} onChangeText={setEdad} />
            </View>

            <Text style={styles.label}>Estudios / Trabajo (Opcional)</Text>
            <View style={styles.inputContainer}>
                <Icon name="school-outline" size={20} color="#aaa" />
                <TextInput placeholder="Ej: Estudiante, Ingeniero" placeholderTextColor="#aaa" style={styles.input} value={estudiosTrabajo} onChangeText={setEstudiosTrabajo} />
            </View>

            <Text style={styles.label}>Orientación Sexual (Opcional)</Text>
            <View style={styles.inputContainer}>
                <Icon name="gender-male-female" size={20} color="#aaa" />
                <TextInput placeholder="Ej: Heterosexual" placeholderTextColor="#aaa" style={styles.input} value={orientacionSexual} onChangeText={setOrientacionSexual} />
            </View>

            {/* Sección de Carga de Fotos */}
            <Text style={styles.label}>Fotos (Opcional)</Text>
            <View style={styles.photoUploadContainer}>
                {/* Botón y previsualización para Foto 1 */}
                <View style={styles.photoInputGroup}>
                    <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setFoto1Uri)}>
                        <Icon name="camera-plus-outline" size={24} color="#fff" />
                        <Text style={styles.photoButtonText}>Foto 1</Text>
                    </TouchableOpacity>
                    {foto1Uri && (
                        <Image source={{ uri: foto1Uri }} style={styles.photoPreview} />
                    )}
                </View>

                {/* Botón y previsualización para Foto 2 */}
                <View style={styles.photoInputGroup}>
                    <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setFoto2Uri)}>
                        <Icon name="camera-plus-outline" size={24} color="#fff" />
                        <Text style={styles.photoButtonText}>Foto 2</Text>
                    </TouchableOpacity>
                    {foto2Uri && (
                        <Image source={{ uri: foto2Uri }} style={styles.photoPreview} />
                    )}
                </View>
            </View>


            {/* Botón Sign Up */}
            <LinearGradient colors={['#e14eca','#f4524d']} style={styles.button}>
                <TouchableOpacity onPress={handleSignUp} disabled={isLoading} style={{ alignItems: 'center', width: '100%' }}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
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
        // justifyContent: 'center', // Puedes quitar esto si prefieres que el contenido empiece desde arriba
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
    label: { color: '#fff', alignSelf: 'flex-start', marginLeft: 10, marginTop: 15, fontSize: 14 }, // Ajustado marginTop
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
    button: { marginTop: 25, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' }, // Ajustado marginTop
    buttonText: { color: '#fff', fontWeight: 'bold' },
    orText: { color: '#aaa', marginTop: 20 },
    socialRow: { flexDirection: 'row', marginTop: 10 },
    socialButton: { backgroundColor: '#1e1e1e', padding: 12, borderRadius: 10, marginHorizontal: 5 },
    switchLink: { marginTop: 20 },
    switchText: { color: '#aaa', textDecorationLine: 'underline' },

    // Nuevos estilos para la carga de fotos
    photoUploadContainer: {
        flexDirection: 'row', // Organiza los grupos de fotos horizontalmente
        justifyContent: 'space-around', // Distribuye el espacio alrededor de los elementos
        width: '100%',
        marginTop: 10,
        marginBottom: 10, // Espacio después de la sección de fotos
    },
    photoInputGroup: {
        alignItems: 'center', // Centra el botón y la previsualización verticalmente
        flex: 1, // Permite que cada grupo ocupe espacio disponible
        marginHorizontal: 5, // Espacio entre los grupos de fotos
    },
    photoButton: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Ocupa el ancho del grupo
        marginBottom: 10, // Espacio entre el botón y la previsualización
    },
    photoButtonText: {
        color: '#fff',
        marginTop: 5, // Espacio entre el icono y el texto
        fontSize: 14,
    },
    photoPreview: {
        width: '100%', // Ocupa el ancho del grupo
        aspectRatio: 1, // Mantiene un aspect ratio cuadrado (ajusta si es necesario)
        borderRadius: 10,
        backgroundColor: '#2a2a2a', // Fondo oscuro mientras carga o si no hay imagen
        resizeMode: 'cover', // Cubre el área manteniendo el aspect ratio
    },
});
