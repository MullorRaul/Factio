// app/(tabs)/map.tsx
import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TextInput,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Modal,
    Animated,
    Easing,
    Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Heatmap } from 'react-native-maps';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import puntosData from '../../data_mapa/localizaciones';   // tu JSON de puntos
import mapaOscuro from '../../data_mapa/estilos_mapa/mapaOscuro';
import { Punto } from '../../data_mapa/types';             // tu tipo Punto
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// categorías rápidas (chips)
const CHIP_CATEGORIES = ['Discoteca', 'Terraza', 'Pub', 'Azotea'];

/**
 * Pantalla de mapa
 */
export default function PantallaMapa() {
    const navigation = useNavigation<any>();

    /* estado de ubicación inicial */
    const [region, setRegion] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    /* búsqueda y chips */
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    /* detalle */
    const [selectedPunto, setSelectedPunto] = useState<Punto | null>(null);
    const slideAnim = useRef(new Animated.Value(height)).current;

    const mapRef = useRef<MapView>(null);

    /* obtener permiso y posición al montar */
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permiso de ubicación denegado');
                setLoading(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            setRegion({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
            setLoading(false);
        })();
    }, []);

    /* centrar en ubicación actual */
    const centrarEnUbicacion = async () => {
        if (!mapRef.current) return;
        const loc = await Location.getCurrentPositionAsync({});
        mapRef.current.animateToRegion(
            {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            },
            1000,
        );
    };

    /* lista filtrada según búsqueda / chip */
    const filteredPuntos = useMemo(
        () =>
            puntosData.filter(p => {
                if (selectedCategory && p.category !== selectedCategory) return false;
                if (search && !p.title.toLowerCase().includes(search.toLowerCase()))
                    return false;
                return true;
            }),
        [search, selectedCategory],
    );

    /* abrir detalle (animación up) */
    const openDetail = useCallback((punto: Punto) => {
        setSelectedPunto(punto);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.poly(4)),
            useNativeDriver: true,
        }).start();
    }, []);

    /* cerrar detalle (animación down) */
    const closeDetail = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 200,
            easing: Easing.in(Easing.poly(4)),
            useNativeDriver: true,
        }).start(() => setSelectedPunto(null));
    };

    /* abrir Google Maps */
    const openInGoogleMaps = () => {
        if (selectedPunto?.mapUrl) {
            closeDetail();
            Linking.openURL(selectedPunto.mapUrl).catch(console.error);
        }
    };

    /* navegar a eventos */
    const handleEventsPress = () => {
        if (selectedPunto?.eventPageName) {
            closeDetail();
            navigation.navigate(selectedPunto.eventPageName);
        }
    };

    if (loading || !region) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    /* ---------- UI ---------- */
    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                customMapStyle={mapaOscuro}
                showsUserLocation
                showsMyLocationButton={false}
                rotateEnabled={false}
                toolbarEnabled={false}
            >
                {/* heat-map: amarillo → rosa-morado */}
                <Heatmap
                    points={puntosData.map(p => ({
                        latitude: p.latitude,
                        longitude: p.longitude,
                        weight: p.weight || 1,
                    }))}
                    radius={50}
                    opacity={0.7}
                    gradient={{
                        colors: ['#FFFF00', '#FFC300', '#FF8A00', '#FF0080', '#8A2BE2'],
                        startPoints: [0, 0.25, 0.5, 0.75, 1],
                        colorMapSize: 256,
                    }}
                />

                {/* markers */}
                {filteredPuntos.map(p => (
                    <Marker
                        key={String(p.id)}
                        coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                        onPress={() => openDetail(p)}
                    >
                        <View
                            style={[
                                styles.marker,
                                { backgroundColor: p.pinColor || '#8A2BE2' },
                            ]}
                        >
                            <Ionicons
                                name={p.icon || 'flame'}
                                size={22}
                                color="#fff"
                                style={{ transform: [{ translateY: 1 }] }}
                            />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* --- búsqueda --- */}
            <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={18} color="#aaa" style={{ margin: 6 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar..."
                    placeholderTextColor="#aaa"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* --- chips --- */}
            <View style={styles.chipsContainer}>
                <FlatList
                    data={CHIP_CATEGORIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item}
                    renderItem={({ item }) => {
                        const active = selectedCategory === item;
                        return (
                            <TouchableOpacity
                                style={[styles.chip, active && styles.chipActive]}
                                onPress={() =>
                                    setSelectedCategory(prev => (prev === item ? null : item))
                                }
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* botón centrar */}
            <TouchableOpacity style={styles.centerButton} onPress={centrarEnUbicacion}>
                <Ionicons name="locate" size={26} color="#fff" />
            </TouchableOpacity>

            {/* -------- detalle modal -------- */}
            <Modal transparent visible={!!selectedPunto} animationType="none">
                <View style={styles.modalOverlay}>
                    {/* tap fuera para cerrar */}
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDetail} />
                    <Animated.View
                        style={[
                            styles.detailContainer,
                            { transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        {selectedPunto && (
                            <>
                                {/* imagen */}
                                {selectedPunto.image && (
                                    <Image
                                        source={selectedPunto.image}
                                        style={styles.detailImage}
                                    />
                                )}
                                {/* título + dirección */}
                                <Text style={styles.detailTitle}>{selectedPunto.title}</Text>
                                <Text style={styles.detailSubtitle}>
                                    {selectedPunto.address}
                                </Text>
                                {/* descripción breve */}
                                {selectedPunto.description && (
                                    <Text style={styles.detailDescription}>
                                        {selectedPunto.description}
                                    </Text>
                                )}
                                {/* botones */}
                                <View style={styles.detailButtonsRow}>
                                    <TouchableOpacity
                                        style={styles.detailButton}
                                        onPress={openInGoogleMaps}
                                    >
                                        <Ionicons name="navigate" size={18} color="#fff" />
                                        <Text style={styles.detailButtonText}>Cómo llegar</Text>
                                    </TouchableOpacity>
                                    {selectedPunto.eventPageName && (
                                        <TouchableOpacity
                                            style={styles.detailButton}
                                            onPress={handleEventsPress}
                                        >
                                            <Ionicons name="calendar" size={18} color="#fff" />
                                            <Text style={styles.detailButtonText}>Eventos</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </Animated.View>
                </View>
            </Modal>

            <StatusBar style="light" />
        </View>
    );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width, height },

    /* loader de inicio */
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },

    /* search */
    searchBarContainer: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 28,
        height: 44,
    },
    searchInput: { flex: 1, color: '#fff', fontSize: 16 },

    /* chips */
    chipsContainer: {
        position: 'absolute',
        top: 112,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    chip: {
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 8,
    },
    chipActive: { backgroundColor: '#8A2BE2' },
    chipText: { color: '#eee', fontSize: 14 },
    chipTextActive: { color: '#fff', fontWeight: 'bold' },

    /* center button */
    centerButton: {
        position: 'absolute',
        bottom: 100,
        right: 16,
        backgroundColor: '#8A2BE2',
        padding: 14,
        borderRadius: 32,
        elevation: 6,
    },

    /* marker wrapper */
    marker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* overlay y sheet */
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    detailContainer: {
        backgroundColor: '#222',
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: height * 0.45,
    },
    detailImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
    detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    detailSubtitle: { fontSize: 14, color: '#ccc', marginBottom: 8 },
    detailDescription: { fontSize: 14, color: '#aaa', marginBottom: 12 },

    detailButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8A2BE2',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    detailButtonText: { color: '#fff', marginLeft: 6, fontSize: 14 },
});
