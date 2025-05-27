// app/index.tsx
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert, // Para la funcionalidad temporal del botón
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // Para controlar el estilo de la barra de estado

export default function SplashScreen() {
    const router = useRouter();

    const handleNavigateToLogin = () => {
        // Por ahora, solo una alerta.
        // Alert.alert(
        //     'Próximamente',
        //     'Este botón te llevará a la pantalla de inicio de sesión.'
        // );

        // Cuando estés listo, descomenta esta línea para navegar al login:
        router.push('/login'); // Asume que tu ruta de login está en (auth)/login.tsx
                               // Expo Router manejará el grupo (auth) automáticamente.
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="#0d0d0d" />

            <View style={styles.content}>
                <Text style={styles.companyName}>Factio</Text>
                <Text style={styles.slogan}>aquí empieza y acaba la empresa</Text>
                {/* Alternativa de eslogan más "fiestera": */}
                {/* <Text style={styles.slogan}>donde tu noche toma forma</Text> */}
                {/* <Text style={styles.slogan}>la fiesta empieza aquí</Text> */}
            </View>

            <LinearGradient
                colors={['#e14eca', '#9e6fca']} // Mismos colores que en login/signup
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleNavigateToLogin}
                >
                    <Text style={styles.buttonText}>Comenzar Aventura</Text>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d', // Fondo oscuro principal de tu app
        alignItems: 'center',
        justifyContent: 'space-around', // Distribuye el contenido (logo/eslogan arriba, botón abajo)
        paddingHorizontal: 20,
        paddingVertical: 50, // Más padding vertical para espaciar
    },
    content: {
        alignItems: 'center', // Centra el nombre y eslogan
        // Podrías añadir un logo gráfico aquí encima del nombre si quieres
    },
    companyName: {
        fontSize: 72, // Muy grande y llamativo
        fontWeight: 'bold',
        color: '#e14eca', // Color principal de tu marca (el rosa/púrpura del degradado)
        // Sombra para un efecto "atrevido"
        textShadowColor: 'rgba(225, 78, 202, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
        marginBottom: 10,
    },
    slogan: {
        fontSize: 18,
        color: '#b0b0b0', // Un gris claro, legible pero no compite con el nombre
        textAlign: 'center',
        fontStyle: 'italic', // Un toque de estilo
        maxWidth: '80%', // Para que no se extienda demasiado en pantallas anchas
    },
    buttonGradient: {
        width: '90%', // Ancho del botón
        borderRadius: 30, // Bordes bien redondeados para un look moderno
        // Sombra para el botón
        shadowColor: '#e14eca',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8, // Para Android
    },
    button: {
        paddingVertical: 18, // Botón más "alto"
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});