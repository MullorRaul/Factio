// app/(tabs)/_layout.tsx (Layout del grupo de pestañas)
// Este archivo define el navegador de pestañas para las rutas dentro de la carpeta (tabs).
import { Tabs } from 'expo-router';
import React from 'react'; // Removed useState and useEffect
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Removed Image, View, ActivityIndicator, StyleSheet imports
import AsyncStorage from '@react-native-async-storage/async-storage'; // Keep AsyncStorage for constants

// Define la URL base de tu backend (Still needed for other potential uses or just as a constant)
// ¡CAMBIA ESTO POR LA URL DE TU SERVIDOR DE PRODUCCIÓN CUANDO DESPLIEGUES!
// Asegúrate de que esta IP es accesible desde tu dispositivo/simulador
const API_BASE_URL = 'https://955a-2a0c-5a82-c002-1600-4960-aa6c-4865-16e1.ngrok-free.app'; // <-- Usar la misma URL que en otras pantallas

// Define la clave para AsyncStorage (Still needed as a constant)
const AUTH_TOKEN_KEY = 'userToken'; // Clave para guardar el token JWT

// Este componente define la estructura de pestañas de tu aplicación.
export default function TabLayout() {
    const colorScheme = useColorScheme();

    // Removed State for profile photo URI and loading
    // const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
    // const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);

    // Removed useEffect for fetching profile photo


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
                    // Always use the default person icon
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
                    ),
                }}
            />

            {/* Pestaña Social */}
            <Tabs.Screen
                name="social" // Corresponde al archivo social.tsx
                options={{
                    title: 'Social', // Título para la pestaña social.
                    tabBarIcon: ({ color, focused }) => (
                        // Usa el icono que prefieras para la pestaña social
                        <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} /> // Example: people icon
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

// Removed profileTabIcon style
// const styles = StyleSheet.create({
//     profileTabIcon: {
//         width: 30, // Adjust size as needed
//         height: 30, // Adjust size as needed
//         borderRadius: 15, // Make it round
//         borderWidth: 1, // Add a border
//         // borderColor is set dynamically in the component
//     },
// });
