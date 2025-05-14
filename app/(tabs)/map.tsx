// app/(tabs)/map.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// import MapView from 'react-native-maps'; // You'll add this later

export default function MapScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Pantalla del Mapa</Text>
            <Text style={styles.subtext}>Aquí implementarás la visualización del mapa con las localizaciones.</Text>
            {/* Example: <MapView style={StyleSheet.absoluteFill} /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', // Or any other background
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtext: {
        fontSize: 14,
        color: 'gray',
        marginTop: 8,
    }
});
