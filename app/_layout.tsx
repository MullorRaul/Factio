// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            {/* Auth: Login y Signup */}
            <Stack.Screen
                name="(auth)/login"
                options={{ title: 'Iniciar sesión' }}
            />
            <Stack.Screen
                name="(auth)/signup"
                options={{ title: 'Registro' }}
            />

            {/* Tras autenticación, tu grupo de tabs */}
            <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}
