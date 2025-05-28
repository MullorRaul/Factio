// app/_layout.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { LogBox } from "react-native";

LogBox.ignoreLogs([
    'Warning: Text strings must be rendered within a <Text> component.',
]);

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
                {/* ➕ DECLARA TU PANTALLA DE INICIO AQUÍ */}
                <Stack.Screen name="pantallaInicio" options={{ headerShown: false }} />

                {/* Tabs principales y autenticación */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />

                {/* Páginas de eventos ya existentes */}
                <Stack.Screen name="eventos_delirium" options={{ headerShown: false }} />
                <Stack.Screen name="eventos_gaudi" options={{ headerShown: false }} />
                <Stack.Screen name="eventos_don_vito" options={{ headerShown: false }} />

                {/* ➕ Nuevas pantallas de eventos */}
                <Stack.Screen name="eventos_gavana" options={{ headerShown: false }} />
                <Stack.Screen name="eventos_epsa" options={{ headerShown: false }} />

                {/* NUEVA LÍNEA: Ocultar el encabezado para el grupo 'match' */}
                <Stack.Screen name="match" options={{ headerShown: false }} />

                {/* 404 */}
                <Stack.Screen name="+not-found" options={{ headerShown: false }} />
            </Stack>
        </GestureHandlerRootView>
    );
}