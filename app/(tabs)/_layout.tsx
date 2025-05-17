// app/(tabs)/_layout.tsx (Layout del grupo de pestañas)
// Este archivo define el navegador de pestañas para las rutas dentro de la carpeta (tabs).
import { Tabs } from 'expo-router';
import React from 'react';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Este componente define la estructura de pestañas de tu aplicación.
export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        // El componente Tabs envuelve todas las pantallas que serán pestañas.
        <Tabs
            screenOptions={{
                // Define el color activo de los iconos y texto de las pestañas según el tema.
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                // Oculta el encabezado por defecto para todas las pantallas dentro de estas pestañas.
                // Si quisieras un encabezado en alguna pestaña específica, podrías poner headerShown: true
                // en las options de esa Tabs.Screen particular.
                headerShown: false,
                // Estilos para la barra inferior de pestañas.
                tabBarStyle: {
                    backgroundColor: '#1e1e1e', // Fondo oscuro
                    borderTopColor: '#2a2a2a', // Borde superior sutil para separación
                },
                // Color para los iconos y texto de las pestañas que no están activas.
                tabBarInactiveTintColor: '#aaa',
            }}
        >
            {/* Pestaña de Ofertas */}
            <Tabs.Screen
                name="offers" // Corresponde al archivo offers.tsx dentro de (tabs)
                options={{
                    title: 'Ofertas', // Título que se muestra en la pestaña
                    // Función para renderizar el icono de la pestaña.
                    tabBarIcon: ({ color, focused }) => (
                        // Usamos tu componente TabBarIcon, pasándole el nombre del icono y el color.
                        // Cambiamos el nombre del icono si la pestaña está enfocada (activa).
                        <TabBarIcon name={focused ? 'bookmark' : 'bookmark-outline'} color={color} />
                    ),
                }}
            />

            {/* Pestaña de Mapa */}
            {/* Corresponde al archivo map.tsx dentro de (tabs) */}
            <Tabs.Screen
                name="map" // Corresponde al archivo map.tsx
                options={{
                    title: 'Mapa', // Título para la pestaña del mapa.
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'map' : 'map-outline'} color={color} />
                    ),
                }}
            />

            {/* Pestaña de Perfil */}
            {/* Corresponde al archivo profile.tsx dentro de (tabs) */}
            <Tabs.Screen
                name="profile" // Corresponde al archivo profile.tsx
                options={{
                    title: 'Perfil', // Título para la pestaña de perfil.
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
                    ),
                }}
            />
            {/*
                La pantalla +not-found.tsx si está dentro de (tabs)
                NO debe definirse aquí si ya está definida en el layout de la raíz.
                Si tu +not-found.tsx está en app/+not-found.tsx, esta definición debe estar comentada o eliminada.
            */}
            {/*
            <Tabs.Screen
                name="+not-found"
                options={{
                    tabBarButton: () => null, // Oculta el botón de esta pestaña
                }}
            />
            */}
        </Tabs>
    );
}
