// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
// Eliminada la importación de TabBarIcon ya que no se utiliza y causa error
// import { TabBarIcon } from '@/components/navigation/TabBarIcon'; // Asegúrate de que esta ruta es correcta
import { Colors } from '@/constants/Colors'; // Asegúrate de que esta ruta es correcta
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons'; // Importa un set de iconos

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false, // O true si quieres un header por defecto
                tabBarStyle: {
                    backgroundColor: '#1e1e1e', // Color de fondo de la barra de pestañas
                    borderTopColor: '#2a2a2a', // Color del borde superior
                    paddingBottom: 5, // Espacio inferior
                    height: 60, // Altura de la barra de pestañas
                },
                tabBarLabelStyle: {
                    fontSize: 12, // Tamaño de la fuente de la etiqueta
                    fontWeight: 'bold',
                },
                tabBarInactiveTintColor: '#aaa', // Color de los iconos y texto inactivos
            }}>
            <Tabs.Screen
                name="offers" // El nombre del archivo de la pantalla (offers.tsx)
                options={{
                    title: 'Ofertas', // Etiqueta que se muestra en la pestaña
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'flame' : 'flame-outline'} size={24} color={color} />
                        // O usa tu componente TabBarIcon si lo tienes configurado
                        // <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="map" // El nombre del archivo de la pantalla (map.tsx)
                options={{
                    title: 'Mapa', // Etiqueta que se muestra en la pestaña
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
                        // O usa tu componente TabBarIcon
                        // <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
                    ),
                }}
            />
            {/* Nueva entrada para la pantalla de Perfil */}
            <Tabs.Screen
                name="profile" // El nombre del archivo de la pantalla que acabas de crear (profile.tsx)
                options={{
                    title: 'Perfil', // Etiqueta que se muestra en la pestaña
                    tabBarIcon: ({ color, focused }) => (
                        // Usa un icono adecuado para el perfil
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
