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
        Aquí puedes añadir otras pantallas o grupos de rutas de nivel superior
        si las tienes. Por ejemplo, si moviste tus archivos de eventos a `app/events/`:
        <Stack.Screen name="events" options={{ headerShown: false }} />
        Esto permitiría navegar al grupo de eventos. El layout dentro de `app/events`
        (si existe) manejaría la navegación dentro de ese grupo.

        Si tus archivos de eventos (`eventos_delirium.tsx`, `eventos_gaudi.tsx`)
        están directamente en la carpeta `app` (no dentro de `(tabs)` ni `(auth)`
        ni `events`), entonces los definirías aquí directamente:
        <Stack.Screen name="eventos_delirium" options={{ title: 'Eventos Delirium' }} />
        <Stack.Screen name="eventos_gaudi" options={{ title: 'Eventos Gaudi' }} />
        (Pero por cómo estructuraste las pestañas, parece que están en un grupo separado).
      */}

            {/*
        Stack.Screen name="+not-found"
        Esto define la pantalla que se muestra cuando `expo-router` no encuentra una ruta.
        Si tu archivo `+not-found.tsx` está directamente en la carpeta `app`,
        esta línea asegura que se pueda navegar a él cuando ocurra un error de ruta.
        options={{ headerShown: false }} para que la pantalla de error no tenga encabezado.
      */}
            <Stack.Screen name="+not-found" options={{ headerShown: false }} />


        </Stack>
    );
}
