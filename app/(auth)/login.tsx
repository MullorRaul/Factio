// app/login.tsx
import React from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const router = useRouter();
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
                />
            </View>

            {/* Botón Login */}
            <LinearGradient colors={['#e14eca','#f4524d']} style={styles.button}>
                <TouchableOpacity onPress={() => router.replace('/offers')}>
                    <Text>Ver Pubs</Text>
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
    switchLink: { marginTop: 20 },
    switchText: { color: '#aaa', textDecorationLine: 'underline' },
});
