// app/signup.tsx
import React from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';

export default function SignUpScreen() {
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
                />
            </View>

            {/* Botón Sign Up */}
            <LinearGradient colors={['#e14eca','#f4524d']} style={styles.button}>
                <TouchableOpacity onPress={() => {/* lógica de registro */}}>
                    <Text style={styles.buttonText}>Sign up</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* Otras opciones sociales */}
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
