// app/_layout.tsx (Layout de la raíz)
// Este archivo define el navegador principal para toda tu aplicación.
// Generalmente se usa un Stack navigator aquí.
import { Stack } from 'expo-router';
import React from 'react';

// Este es el componente principal del layout de la raíz.
export default function RootLayout() {
    return (
        // El componente Stack crea un navegador de pila.
        // Cada Stack.Screen define una pantalla o un grupo de pantallas
        // a las que se puede navegar desde este Stack.
        <Stack>
            {/*
        Stack.Screen name="(tabs)"
        Esto le dice al Stack que existe un grupo de rutas definido
        en la carpeta `(tabs)` (app/(tabs)).
        Cuando navegas a este grupo (ej: router.push('/(tabs)')),
        el control pasa al layout definido en `app/(tabs)/_layout.tsx`.
        options={{ headerShown: false }} oculta el encabezado del Stack
        cuando estás dentro de este grupo (ya que tu navegador de pestañas
        probablemente no necesita un encabezado adicional del Stack).
      */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/*
        Stack.Screen name="(auth)"
        Similar al anterior, esto le dice al Stack que existe un grupo de rutas
        para autenticación definido en la carpeta `(auth)` (app/(auth)).
        Cuando navegas a este grupo (ej: router.push('/(auth)/login')),
        el control pasa al layout definido en `app/(auth)/_layout.tsx` (si existe)
        o directamente a las pantallas dentro de `(auth)`.
        options={{ headerShown: false }} oculta el encabezado del Stack
        cuando estás en las pantallas de autenticación (login/signup).
      */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/*
        Stack.Screen name="eventos_delirium"
        Define la pantalla eventos_delirium.tsx que está directamente en la carpeta `app`.
        options={{ headerShown: false }} oculta el encabezado por defecto para esta pantalla.
      */}
            <Stack.Screen name="eventos_delirium" options={{ headerShown: false }} />

            {/*
        Stack.Screen name="eventos_gaudi"
        Define la pantalla eventos_gaudi.tsx que está directamente en la carpeta `app`.
        options={{ headerShown: false }} oculta el encabezado por defecto para esta pantalla.
      */}
            <Stack.Screen name="eventos_gaudi" options={{ headerShown: false }} />

            {/*
        Stack.Screen name="eventos_donvito"
        Define la nueva pantalla eventos_donvito.tsx que está directamente en la carpeta `app`.
        options={{ headerShown: false }} oculta el encabezado por defecto para esta pantalla.
      */}
            <Stack.Screen name="eventos_don_vito" options={{ headerShown: false }} />


            {/*
        La pantalla not-found de nivel superior (app/+not-found.tsx)
        se define aquí si quieres que se muestre cuando no se encuentre una ruta.
        Si tu +not-found.tsx está directamente en la carpeta `app`, esta línea la maneja.
        options={{ headerShown: false }} para que la pantalla de error no tenga encabezado.
      */}
            <Stack.Screen name="+not-found" options={{ headerShown: false }} />


        </Stack>
    );
}
