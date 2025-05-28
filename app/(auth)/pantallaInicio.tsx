// app/pantallaInicio.tsx
// Modificado para incluir AnimatedBackground
import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// Asegúrate que la ruta al componente AnimatedBackground sea correcta
// Si creaste una carpeta 'components' dentro de 'app':
import AnimatedBackground from '../components/AnimatedBackground';
// Si AnimatedBackground.tsx está en la misma carpeta 'app':
// import AnimatedBackground from './AnimatedBackground';


export default function SplashScreen() {
    const router = useRouter();

    const handleNavigateToLogin = () => {
        router.push('/login'); // Asume que tu ruta de login es (auth)/login.tsx
    };

    return (
        <View style={styles.container}>
            {/* El fondo animado se renderiza primero para estar detrás de otros elementos */}
            <AnimatedBackground />

            <StatusBar style="light" backgroundColor="#0d0d0d" />

            {/* Contenedor para el contenido principal (logo, eslogan, botón) */}
            {/* Esto asegura que el contenido esté por encima del fondo y bien distribuido */}
            <View style={styles.mainContentContainer}>
                <View style={styles.content}>
                    <Text style={styles.companyName}>Factio</Text>
                    <View style={{ height: 10}} />
                    <Text style={styles.slogan}>"¿Dónde está la fiesta? Aquí lo sabes"</Text>
                    <View style={{ height: 40 }} />
                </View>

                <LinearGradient
                    colors={['#e14eca', '#9e6fca']} // Degradado para el botón
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }} // Dirección del degradado
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleNavigateToLogin}
                        activeOpacity={0.8} // Feedback visual al presionar
                    >
                        <Text style={styles.buttonText}>Comenza la Fiesta</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d',
    },
    mainContentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', // Centramos verticalmente todo el contenido
        paddingHorizontal: 20,
        zIndex: 1,
    },
    content: {
        alignItems: 'center',
        marginBottom: 0, // Espacio entre texto y botón
    },
    companyName: {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#e14eca',
        textShadowColor: 'rgba(225, 78, 202, 0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 20,
        marginBottom: 10,
    },
    slogan: {
        fontSize: 18,
        color: '#b0b0b0',
        textAlign: 'center',
        fontStyle: 'italic',
        maxWidth: '85%',
    },
    buttonGradient: {
        marginTop: 70,
        width: '90%',
        borderRadius: 30,
        shadowColor: '#e14eca',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 10,
    },
    button: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
