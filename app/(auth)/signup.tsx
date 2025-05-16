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
import { Picker } from '@react-native-picker/picker'; // Importa Picker

// Define la URL base de tu backend usando la IP local de tu ordenador
// ¡CAMBIA ESTO POR LA URL DE TU SERVIDOR DE PRODUCCIÓN CUANDO DESPLIEGUES!
const API_BASE_URL = 'http://192.168.1.142:3001'; // <-- IP de tu ordenador

export default function SignUpScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [edad, setEdad] = useState('');

    // Estados para los campos de selección - Cambiados de null a ''
    const [genero, setGenero] = useState<string>(''); // Estado para Género (opcional)
    const [estudiosTrabajo, setEstudiosTrabajo] = useState<string>(''); // Estado para Estudios_Trabajo (opcional)
    const [orientacionSexual, setOrientacionSexual] = useState<string>(''); // Estado para Orientacion_sexual (opcional)

    const [isLoading, setIsLoading] = useState(false);

    // Estados para las fotos (sin cambios)
    const [foto1Uri, setFoto1Uri] = useState<string | null>(null);
    const [foto2Uri, setFoto2Uri] = useState<string | null>(null);

    // Función para seleccionar una imagen (sin cambios)
    const pickImage = async (setFotoUri: React.Dispatch<React.SetStateAction<string | null>>) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a tu galería de fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedAsset = result.assets[0];
            setFotoUri(selectedAsset.uri);
        }
    };


    const handleSignUp = async () => {
        if (!email || !username || !password) {
            Alert.alert('Error', 'Por favor, completa los campos de email, username y contraseña.');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();

        formData.append('email', email);
        formData.append('username', username);
        formData.append('password', password);

        // Añadir campos opcionales si tienen valor (no son cadenas vacías o solo espacios)
        if (edad && edad.trim() !== '') {
            formData.append('edad', edad.trim());
        }

        // Añadir los campos de selección si tienen un valor seleccionado que NO es la cadena vacía ''
        if (genero !== '') { // Comprobar si no es la cadena vacía
            formData.append('genero', genero);
        }
        // Para estudiosTrabajo y orientacionSexual, si usas los botones de selección o Picker con '' como valor por defecto,
        // la lógica es la misma: solo añadir si el valor no es la cadena vacía.
        // Si usas los botones de selección, el estado será null o 'Estudiante'/'Trabajando'.
        // Si usas Picker con '' como valor por defecto, el estado será '' o la opción seleccionada.
        // Asegurémonos de enviar solo si el valor no es nulo O no es una cadena vacía después de trim.
        if (estudiosTrabajo !== '' && estudiosTrabajo.trim() !== '') { // Asegurar que no sea '' ni solo espacios
            formData.append('estudios_trabajo', estudiosTrabajo.trim());
        }
        if (orientacionSexual !== '' && orientacionSexual.trim() !== '') { // Asegurar que no sea '' ni solo espacios
            formData.append('orientacion_sexual', orientacionSexual.trim());
        }


        // Añadir archivos de foto al FormData si se seleccionaron (sin cambios)
        if (foto1Uri) {
            const uriParts = foto1Uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            const fileName = `foto1_${Date.now()}.${fileType}`;

            formData.append('foto1', {
                uri: foto1Uri,
                name: fileName,
                type: `image/${fileType}`,
            } as any);
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
            const response = await fetch(`${API_BASE_URL}/usuarios/signup`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert('Error al registrarse', data.error || 'Error desconocido.');
                console.error('Error response data:', data);
                setPassword('');
                return;
            }

            Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');

            // Limpiar formulario
            setEmail('');
            setUsername('');
            setPassword('');
            setEdad('');
            setGenero(''); // Limpiar estado de género a cadena vacía
            setEstudiosTrabajo(''); // Limpiar estado de estudios/trabajo a cadena vacía
            setOrientacionSexual(''); // Limpiar estado de orientación sexual a cadena vacía
            setFoto1Uri(null);
            setFoto2Uri(null);

            router.replace('/(auth)/login');

        } catch (error: any) {
            console.error('Error durante la petición de signup:', error);
            Alert.alert('Error de conexión', 'No se pudo conectar con el servidor. Asegúrate de que el backend está corriendo y la IP es correcta.');
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Text style={styles.title}>Factio</Text>

            {/* Campos de texto (Email, Username, Password, Edad) - Sin cambios en la estructura */}
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

            {/* Campo de Género (Desplegable) */}
            <Text style={styles.label}>Género (Opcional)</Text>
            <View style={styles.pickerContainer}>
                <Icon name="gender-male-female" size={20} color="#aaa" style={styles.pickerIcon} />
                <Picker
                    selectedValue={genero} // Usar estado 'genero'
                    onValueChange={(itemValue: string) => setGenero(itemValue)} // Actualizar estado 'genero'
                    style={styles.picker}
                    itemStyle={styles.pickerItem} // Estilo para los ítems del Picker (solo Android)
                >
                    {/* Opción por defecto con value="" */}
                    <Picker.Item label="Selecciona tu género" value="" enabled={false} style={{ color: '#aaa' }} />
                    <Picker.Item label="Masculino" value="Masculino" style={{ color: '#fff' }} />
                    <Picker.Item label="Femenino" value="Femenino" style={{ color: '#fff' }} />
                    <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
                </Picker>
            </View>


            {/* Campo Estudios / Trabajo (Botones de Selección) */}
            <Text style={styles.label}>Estudios / Trabajo (Opcional)</Text>
            <View style={styles.selectionButtonContainer}>
                <TouchableOpacity
                    style={[styles.selectionButton, estudiosTrabajo === 'Estudiante' && styles.selectionButtonSelected]}
                    onPress={() => setEstudiosTrabajo('Estudiante')}
                >
                    <Text style={[styles.selectionButtonText, estudiosTrabajo === 'Estudiante' && styles.selectionButtonTextSelected]}>Estudiante</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.selectionButton, estudiosTrabajo === 'Trabajando' && styles.selectionButtonSelected]}
                    onPress={() => setEstudiosTrabajo('Trabajando')}
                >
                    <Text style={[styles.selectionButtonText, estudiosTrabajo === 'Trabajando' && styles.selectionButtonTextSelected]}>Trabajando</Text>
                </TouchableOpacity>
                {/* Opción para deseleccionar */}
                {estudiosTrabajo !== '' && ( // Comprobar si no es cadena vacía
                    <TouchableOpacity onPress={() => setEstudiosTrabajo('')} style={styles.clearSelectionButton}> {/* Limpiar a cadena vacía */}
                        <Icon name="close-circle-outline" size={20} color="#aaa" />
                    </TouchableOpacity>
                )}
            </View>


            {/* Campo Orientación Sexual (Desplegable) */}
            <Text style={styles.label}>Orientación Sexual (Opcional)</Text>
            <View style={styles.pickerContainer}>
                <Icon name="gender-male-female" size={20} color="#aaa" style={styles.pickerIcon} />
                <Picker
                    selectedValue={orientacionSexual} // Usar estado 'orientacionSexual'
                    onValueChange={(itemValue: string) => setOrientacionSexual(itemValue)} // Actualizar estado 'orientacionSexual'
                    style={styles.picker}
                    itemStyle={styles.pickerItem} // Estilo para los ítems del Picker (solo Android)
                >
                    {/* Opción por defecto con value="" */}
                    <Picker.Item label="Selecciona tu orientación" value="" enabled={false} style={{ color: '#aaa' }} />
                    <Picker.Item label="Heterosexual" value="Heterosexual" style={{ color: '#fff' }} />
                    <Picker.Item label="Bisexual" value="Bisexual" style={{ color: '#fff' }} />
                    <Picker.Item label="Homosexual" value="Homosexual" style={{ color: '#fff' }} />
                    <Picker.Item label="Otro" value="Otro" style={{ color: '#fff' }} />
                </Picker>
            </View>


            {/* Sección de Carga de Fotos (Sin cambios en la estructura) */}
            <Text style={styles.label}>Fotos (Opcional)</Text>
            <View style={styles.photoUploadContainer}>
                <View style={styles.photoInputGroup}>
                    <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setFoto1Uri)}>
                        <Icon name="camera-plus-outline" size={24} color="#fff" />
                        <Text style={styles.photoButtonText}>Foto 1</Text>
                    </TouchableOpacity>
                    {foto1Uri && (
                        <Image source={{ uri: foto1Uri }} style={styles.photoPreview} />
                    )}
                </View>

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        paddingBottom: 50,
    },
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    title: { fontSize: 36, color: '#fff', fontWeight: 'bold', marginBottom: 30 },
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
    button: { marginTop: 25, width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    orText: { color: '#aaa', marginTop: 20 },
    socialRow: { flexDirection: 'row', marginTop: 10 },
    socialButton: { backgroundColor: '#1e1e1e', padding: 12, borderRadius: 10, marginHorizontal: 5 },
    switchLink: { marginTop: 20 },
    switchText: { color: '#aaa', textDecorationLine: 'underline' },

    // Nuevos estilos para Pickers (Desplegables)
    pickerContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        marginTop: 8,
        alignItems: 'center',
        width: '100%',
        paddingLeft: 10, // Espacio para el icono
        overflow: 'hidden', // Asegura que el Picker no se salga del contenedor
        // Ajuste de altura para que sea más pequeño
        height: 50, // Altura reducida
    },
    pickerIcon: {
        marginRight: 10,
    },
    picker: {
        flex: 1,
        color: '#fff',
        // Ajustes específicos para iOS y Android si es necesario
        ...Platform.select({
            ios: {
                // En iOS, el Picker es un componente nativo, la altura del contenedor influye.
                // Puedes necesitar ajustar el paddingVertical del contenedor si el texto se ve cortado.
            },
            android: {
                height: 50, // Asegura que la altura sea consistente en Android
            },
        }),
    },
    pickerItem: {
        color: '#fff',
        backgroundColor: '#1e1e1e',
    },

    // Nuevos estilos para Botones de Selección (Estudios / Trabajo)
    selectionButtonContainer: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 8,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 5,
    },
    selectionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        marginHorizontal: 3,
    },
    selectionButtonSelected: {
        backgroundColor: '#e14eca',
    },
    selectionButtonText: {
        color: '#aaa',
        fontWeight: 'bold',
    },
    selectionButtonTextSelected: {
        color: '#fff',
    },
    clearSelectionButton: {
        padding: 8,
    },


    // Estilos de Carga de Fotos (Sin cambios)
    photoUploadContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 15,
        marginBottom: 10,
    },
    photoInputGroup: {
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    photoButton: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 10,
    },
    photoButtonText: {
        color: '#fff',
        marginTop: 5,
        fontSize: 14,
    },
    photoPreview: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 10,
        backgroundColor: '#2a2a2a',
        resizeMode: 'cover',
    },
});
