// app/(auth)/_layout.tsx (Layout del grupo de autenticación)
// Este archivo define el navegador para las rutas dentro de la carpeta (auth).
import { Stack } from 'expo-router';
import React from 'react';
import {LogBox} from "react-native";

// Recommended: Hide specific warnings
LogBox.ignoreLogs([
    'Warning: Text strings must be rendered within a <Text> component.',
    // Add other specific warning messages you want to ignore here
]);

// Este es el componente del layout para el grupo (auth).
// Generalmente se usa un Stack navigator aquí para manejar la navegación
// entre pantallas como login y signup.
export default function AuthLayout() {
    return (
        // El componente Stack crea un navegador de pila para este grupo.
        // Las Stack.Screen dentro de este Stack se refieren a los archivos
        // .tsx que están directamente dentro de la carpeta (auth).
        <Stack>
            {/*
        Stack.Screen name="login"
        Define la pantalla login.tsx dentro de este Stack.
        options={{ headerShown: false }} oculta el encabezado por defecto
        para la pantalla de login.
      */}
            <Stack.Screen name="login" options={{ headerShown: false }} />

            {/*
        Stack.Screen name="signup"
        Define la pantalla signup.tsx dentro de este Stack.
        options={{ headerShown: false }} oculta el encabezado por defecto
        para la pantalla de signup.
      */}
            <Stack.Screen name="signup" options={{ headerShown: false }} />

            {/*
        Aquí podrías añadir otras pantallas relacionadas con autenticación
        si las tienes en esta carpeta (ej: reset-password.tsx).
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      */}
            <Stack.Screen name="pantallaInicio" options={{ headerShown: false }} />
        </Stack>
    );
}
