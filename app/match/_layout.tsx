// app/events/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function EventsLayout() {
    return (

        <Stack
            screenOptions={{
                headerShown: false, // Esto ocultará el encabezado para todas las pantallas dentro de este Stack
            }}
        >
            {/*
        No es necesario listar <Stack.Screen name="[eventId]" /> aquí
        si headerShown: false se aplica a todo el Stack y [eventId].tsx
        está en el mismo directorio/grupo 'events'.
        Expo Router es inteligente y aplicará este layout a [eventId].tsx
        porque es el único archivo en este Stack o porque lo "detecta" por convención.
      */}
            <Stack.Screen name="[eventId]" options={{ headerShown: false }} />
        </Stack>
    );
}