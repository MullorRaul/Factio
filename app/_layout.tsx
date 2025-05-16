import { Tabs } from 'expo-router';
import React from 'react';
// Importamos el componente TabBarIcon desde nuestra carpeta local de componentes.
// La ruta '@/' asume que tienes configurado un alias en tu proyecto (por ejemplo, en tsconfig.json o babel.config.js)
// que apunta a la raíz de tu proyecto o a la carpeta `src`.
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
// Importamos la configuración de colores de tu proyecto.
import { Colors } from '@/constants/Colors';
// Hook para detectar el esquema de color del sistema (claro u oscuro).
import { useColorScheme } from '@/hooks/useColorScheme';

// Este componente define la estructura de pestañas de tu aplicación.
export default function TabLayout() {
    // Obtenemos el esquema de color actual.
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
            {/* Definición de cada pestaña */}

            {/* Pestaña de Ofertas */}
            <Tabs.Screen
                // 'offers' debe coincidir con el nombre del archivo de la pantalla (ej: app/(tabs)/offers.tsx).
                name="offers"
                options={{
                    title: 'Ofertas', // Título que se muestra debajo del icono en la barra de pestañas.
                    // Función para renderizar el icono de la pestaña.
                    tabBarIcon: ({ color, focused }) => (
                        // Usamos tu componente TabBarIcon, pasándole el nombre del icono y el color.
                        // Cambiamos el nombre del icono si la pestaña está enfocada (activa).
                        <TabBarIcon name={focused ? 'bookmark' : 'bookmark-outline'} color={color} />
                    ),
                }}
            />

            {/* Pestaña de Mapa (asumiendo que 'index' es tu pantalla principal o mapa) */}
            <Tabs.Screen
                // 'index' típicamente se refiere al archivo index.tsx en el directorio (ej: app/(tabs)/index.tsx).
                name="index"
                options={{
                    title: 'Mapa', // Título para la pestaña del mapa.
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'map' : 'map-outline'} color={color} />
                    ),
                }}
            />

            {/* Pestaña de Perfil */}
            <Tabs.Screen
                // 'profile' debe coincidir con el nombre del archivo (ej: app/(tabs)/profile.tsx).
                name="profile"
                options={{
                    title: 'Perfil', // Título para la pestaña de perfil.
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
                    ),
                }}
            />

            {/*
                Manejo de la pantalla not-found.tsx:
                Si tienes un archivo +not-found.tsx dentro de la carpeta (tabs),
                esta configuración asegura que no aparezca como una pestaña visible
                y no tenga un botón en la barra de pestañas.
                Hemos eliminado 'href: null' ya que no es compatible con 'tabBarButton'.
            */}
            <Tabs.Screen
                name="+not-found" // Nombre del archivo: +not-found.tsx
                options={{
                    // Eliminamos href: null aquí
                    tabBarButton: () => null, // Oculta completamente el botón/icono de esta pestaña en la barra.
                }}
            />

        </Tabs>
    );
}
