// app/_layout.tsx (Layout de la raíz)
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/* Pantallas de eventos ya existentes */}
            <Stack.Screen name="eventos_delirium" options={{ headerShown: false }} />
            <Stack.Screen name="eventos_gaudi" options={{ headerShown: false }} />
            <Stack.Screen name="eventos_don_vito" options={{ headerShown: false }} />

            {/* --- ¡Añadir estas nuevas líneas! --- */}
            {/* Define la pantalla eventos_gavana.tsx que está directamente en la carpeta `app`. */}
            <Stack.Screen name="eventos_gavana" options={{ headerShown: false }} />

            {/* Define la pantalla eventos_epsa.tsx que está directamente en la carpeta `app`. */}
            <Stack.Screen name="eventos_epsa" options={{ headerShown: false }} />
            {/* --- Fin de nuevas líneas --- */}


            <Stack.Screen name="+not-found" options={{ headerShown: false }} />

        </Stack>
    );
}