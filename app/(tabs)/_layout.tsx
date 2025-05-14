// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            initialRouteName="offers"
            screenOptions={{
                tabBarActiveTintColor: '#ffd700',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { backgroundColor: '#1C1C1E' },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="offers"
                options={{
                    title: 'Ofertas',
                    tabBarIcon: ({ color, size, focused }) =>
                        <Ionicons name={focused ? 'list-circle' : 'list-circle-outline'} size={size} color={color} />
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Mapa',
                    tabBarIcon: ({ color, size, focused }) =>
                        <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
                }}
            />
        </Tabs>
    );
}
