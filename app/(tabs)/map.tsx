import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Dimensions,
    TouchableOpacity,
    Text,
    TouchableWithoutFeedback,
    Image,
    Linking,
    Animated,
    Easing,
} from 'react-native';
import MapView, {
    Marker,
    PROVIDER_GOOGLE,
    Heatmap,
    Region,
    MapViewProps,
} from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import puntosData from '../../data_mapa/localizaciones';
import mapaOscuro from '../../data_mapa/estilos_mapa/mapaOscuro';
import { Punto } from '../../data_mapa/types';

import { useNavigation } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';

/*
// Ejemplo de cómo podrías tipar la navegación si usas TypeScript y Stack Navigator
// Reemplaza 'RootStackParamList' con el nombre de tu lista de parámetros de stack
type RootStackParamList = {
  '/eventos_gaudi': undefined; // O define parámetros si los necesitas
  '/eventos_delirium': undefined;
  '/eventos_don_vito': undefined;
  // ... otras rutas de tu aplicación
  '/mapa': undefined; // Asegúrate de incluir la ruta de esta pantalla también
};

// Tipo para la prop de navegación de esta pantalla
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, '/mapa'>;
*/

export default function PantallaMapa() {
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [region, setRegion] = useState<Region | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPunto, setSelectedPunto] = useState<Punto | null>(null);
    const [heatmapRadius, setHeatmapRadius] = useState(75);
    // Corregido el valor inicial de mapRef
    const mapRef = useRef<MapView | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const puntos: Punto[] = puntosData;

    // Obtener la instancia de navegación
    // Si usas TypeScript, puedes usar: useNavigation<MapScreenNavigationProp>();
    const navigation = useNavigation();


    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permiso denegado para acceder a la ubicación');
                return;
            }

            const ubicacion = await Location.getCurrentPositionAsync({});
            setLocation(ubicacion.coords);
            setRegion({
                latitude: ubicacion.coords.latitude,
                longitude: ubicacion.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        })();
    }, []);

    const centrarEnUbicacion = async () => {
        const ubicacion = await Location.getCurrentPositionAsync({});
        setLocation(ubicacion.coords);
        const nuevaRegion: Region = {
            latitude: ubicacion.coords.latitude,
            // Corregido: usar ubicacion.coords.longitude
            longitude: ubicacion.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };
        setRegion(nuevaRegion);
        mapRef.current?.animateToRegion(nuevaRegion, 1000);
    };

    const handleMarkerPress = (punto: Punto) => {
        setSelectedPunto(punto);
        setModalVisible(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setModalVisible(false);
            setSelectedPunto(null);
        });
    };

    // Función para manejar la navegación a la página de eventos
    const handleEventsPress = () => {
        if (selectedPunto?.eventPageName) {
            // Cierra el modal antes de navegar
            closeModal();
            // Navega usando la ruta definida en los datos (e.g., '/eventos_gaudi')
            // Si usas TypeScript y el tipado de rutas, quizás no necesites 'as any'
            // @ts-ignore
            navigation.navigate(selectedPunto.eventPageName as any);
        } else {
            console.warn('No se ha especificado una página de eventos para este punto.');
            // Cierra el modal incluso si no hay página de eventos
            closeModal();
        }
    };

    const openInGoogleMaps = () => {
        if (selectedPunto?.mapUrl) {
            // Cierra el modal antes de abrir Google Maps
            closeModal();
            Linking.openURL(selectedPunto.mapUrl).catch(err => console.error('Error al abrir Google Maps', err));
        } else {
            console.warn('No hay URL para abrir en Google Maps');
            // Cierra el modal
            closeModal();
        }
    };

    return (
        <View style={styles.container}>
            {region && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={region}
                    showsUserLocation
                    showsMyLocationButton={false}
                    provider={PROVIDER_GOOGLE}
                    customMapStyle={mapaOscuro}
                    userLocationAnnotationTitle="Mi ubicación"
                    userLocationCalloutEnabled
                    tintColor="#8A2BE2"
                    onPanDrag={() => {}}
                >
                    <Heatmap
                        points={puntos.map(p => ({
                            latitude: p.latitude,
                            longitude: p.longitude,
                            weight: p.weight || 1,
                        }))}
                        radius={50}
                        opacity={0.7}
                        gradient={{
                            colors: [
                                '#6A5ACD', '#7B68EE', '#8A2BE2', '#9400D3',
                                '#6A0DAD', '#5A0E9C', '#53108F', '#4C0F88',
                                '#480E83', '#4B0082'
                            ],
                            startPoints: [0.01, 0.1, 0.2, 0.3, 0.45, 0.55, 0.65, 0.75, 0.85, 1.0],
                            colorMapSize: 160,
                        }}
                    />
                    {puntos.map(p => (
                        <Marker
                            key={String(p.id)}
                            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                            pinColor={p.pinColor || 'purple'}
                            onPress={() => handleMarkerPress(p)}
                        />
                    ))}
                </MapView>
            )}

            <TouchableOpacity style={styles.boton} onPress={centrarEnUbicacion}>
                <Text style={styles.botonTexto}>📍</Text>
            </TouchableOpacity>

            {modalVisible && selectedPunto && (
                <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                    <TouchableWithoutFeedback onPress={closeModal}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContainer}>
                                    <Text style={styles.modalTitle}>{selectedPunto.title}</Text>
                                    <Text style={styles.modalDescription}>{selectedPunto.description}</Text>
                                    {selectedPunto.image && (
                                        <Image
                                            source={selectedPunto.image}
                                            style={styles.modalImage}
                                            resizeMode="cover"
                                        />
                                    )}
                                    <View style={styles.modalButtonsContainer}>
                                        {/* Botón "Eventos": solo se muestra si hay eventPageName */}
                                        {selectedPunto.eventPageName && (
                                            <TouchableOpacity style={styles.modalCloseButton} onPress={handleEventsPress}>
                                                <Text style={styles.modalCloseText}>Eventos</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Botón "Ir Ahora" */}
                                        <TouchableOpacity style={styles.modalGoogleMapsButton} onPress={openInGoogleMaps}>
                                            <View style={styles.iconTextContainer}>
                                                <Text style={[styles.modalGoogleMapsText, { fontStyle: 'italic' }]}>Ir Ahora</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            )}

            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    boton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#334',
        padding: 12,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    botonTexto: {
        color: 'white',
        fontSize: 20,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxHeight: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 10,
    },
    modalDescription: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    modalImage: {
        width: '100%',
        height: Dimensions.get('window').height * 0.25,
        borderRadius: 8,
        resizeMode: 'cover',
        marginBottom: 10,
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 'auto',
        paddingTop: 10,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    modalCloseButton: {
        backgroundColor: '#9e6fca',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    modalCloseText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalGoogleMapsButton: {
        backgroundColor: '#9e6fca',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    modalGoogleMapsText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    iconTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
});