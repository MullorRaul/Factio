/* app/(tabs)/offers.tsx */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    ImageBackground,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height, width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60; // Assuming this is the height of your tab bar
const AUTO_SCROLL_DURATION = 13000;

const API_BASE_URL = 'https://e64d-2a0c-5a82-c201-2100-19ae-8cd2-77f2-647c.ngrok-free.app';
const AUTH_TOKEN_KEY = 'userToken';


const CAFE_IMAGE = require('../../assets/images/cafe.jpg');
const DELIRIUM_IMAGE = require('../../assets/images/delirium.jpg');
const DON_VITO_IMAGE = require('../../assets/images/don_vito.jpeg');
const GAUDI_IMAGE = require('../../assets/images/Gaudi.jpg');
const GAVANA_IMAGE = require('../../assets/images/gavana.jpg');

const LOCAL_IMAGES_LIST_SEQUENTIAL = [
    CAFE_IMAGE,
    DELIRIUM_IMAGE,
    GAUDI_IMAGE,
    DON_VITO_IMAGE,
    GAVANA_IMAGE,
];

interface BackendEvent {
    cod_evento: number;
    nombre: string;
    hora_inicio: string;
    hora_finalizacion: string;
    descripcion: string;
    imagen_url: string;
    nombre_local: string;
    aforo: number;
    hombres_dentro: number;
    mujeres_dentro: number;
    localImageSource?: any;
}


export default function OffersScreen() {
    const router = useRouter();
    const [reels, setReels] = useState<BackendEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<FlatList<BackendEvent>>(null);
    const timer = useRef(new Animated.Value(0)).current; // Timer state itself is still needed for auto-scroll logic
    const [currentIndex, setCurrentIndex] = useState(0);


    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
                console.log('DEBUG: Attempting to fetch events from:', `${API_BASE_URL}/api/eventos/proximos`);
                console.log('DEBUG: Using token:', token ? 'Token Found' : 'No Token Found');

                if (!token) {
                    console.warn('DEBUG: No token found. User may not be logged in.');
                    setError('No autenticado. Por favor, inicia sesión.');
                    setLoading(false);
                    // Consider redirecting to login: router.replace('/login');
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/eventos/proximos`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                console.log('DEBUG: Fetch events response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('API Error fetching events (Status:', response.status, '):', errorData);
                    try {
                        const errorJson = JSON.parse(errorData);
                        setError(errorJson.error || 'Error al cargar eventos.');
                    } catch {
                        setError('Error al cargar eventos: ' + errorData.substring(0,100)); // Show first 100 chars
                    }
                    if (response.status === 401) {
                        console.warn('DEBUG: Token inválido o expirado. Eliminando token y redirigiendo al login.');
                        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                        setError('Sesión expirada. Por favor, inicia sesión de nuevo.');
                        // router.replace('/login'); // Example: redirect to login
                    }
                    setLoading(false);
                    return;
                }

                const data: BackendEvent[] = await response.json();
                console.log('DEBUG: Fetch events raw response data:', data.length > 0 ? data[0] : "No data");


                const dataWithLocalImages = data.map((event, index) => {
                    const imageIndex = index % LOCAL_IMAGES_LIST_SEQUENTIAL.length;
                    const assignedImageSource = LOCAL_IMAGES_LIST_SEQUENTIAL[imageIndex];
                    return {
                        ...event,
                        localImageSource: assignedImageSource,
                    };
                });

                console.log('DEBUG: Eventos cargados y con imágenes locales asignadas:', dataWithLocalImages.length);

                setReels(dataWithLocalImages);
                setLoading(false);

            } catch (err: any) {
                console.error('Error fetching events:', err);
                setError('Error de conexión al cargar eventos: ' + err.message);
                setLoading(false);
            }
        };

        fetchEvents();

        // Cleanup if needed, though fetchEvents doesn't set up continuous listeners
        return () => {};

    }, []);


    // Efecto para el timer y auto-scroll (MODIFIED FOR LOOPING)
    useEffect(() => {
        if (reels.length > 0) {
            timer.setValue(0); // Reset timer for the current item
            Animated.timing(timer, {
                toValue: width, // Animate timer to full width (representing duration)
                duration: AUTO_SCROLL_DURATION,
                useNativeDriver: false, // Needs to be false for width animation on some components
            }).start(({ finished }) => {
                if (finished) { // Check if animation finished
                    if (currentIndex < reels.length - 1) { // If not the last item
                        scrollRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
                    } else if (currentIndex === reels.length - 1) { // If IS the last item
                        // --- MODIFICATION HERE: Loop back to the beginning ---
                        scrollRef.current?.scrollToIndex({ index: 0, animated: true });
                    }
                }
            });
        } else {
            timer.stopAnimation(); // Stop animation if no reels
            timer.setValue(0);
        }
        // Ensure the timer animation is stopped if the component unmounts or reels change significantly
        return () => {
            timer.stopAnimation();
        };
    }, [currentIndex, reels.length, timer]); // timer is a dependency as it's used in Animated.timing


    const onViewRef = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null && viewableItems[0].index !== currentIndex) {
            setCurrentIndex(viewableItems[0].index);
            console.log("DEBUG: Current visible item index:", viewableItems[0].index);
        }
    });
    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });


    const renderReel = ({ item }: { item: BackendEvent }) => {
        const occupied = item.hombres_dentro + item.mujeres_dentro;
        const totalAforo = item.aforo;
        const aforoPercent = totalAforo > 0 ? (occupied / totalAforo) * 100 : 0;

        const totalGenderCount = item.hombres_dentro + item.mujeres_dentro;
        const maleRatio = totalGenderCount > 0 ? (item.hombres_dentro / totalGenderCount) * 100 : 0;
        const femaleRatio = totalGenderCount > 0 ? (item.mujeres_dentro / totalGenderCount) * 100 : 0;

        const startDate = new Date(item.hora_inicio);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const formattedDate = startDate.toLocaleDateString(undefined, options);

        return (
            <View style={styles.cardContainer}>
                <ImageBackground source={item.localImageSource} style={styles.imageBackground}>
                    <View style={styles.overlay} />

                    <View style={styles.infoContainer}>
                        <Text style={styles.title}>{item.nombre_local || item.nombre}</Text>
                        {item.nombre_local && item.nombre !== item.nombre_local && (
                            <Text style={styles.subtitle}>{item.nombre}</Text>
                        )}
                        <Text style={styles.subtitle}>{formattedDate}</Text>

                        <View style={styles.statRow}>
                            <MaterialCommunityIcons name="account-group" size={20} color="#aaa" />
                            <Text style={styles.statText}>{occupied}/{totalAforo}</Text>
                        </View>
                        {totalAforo > 0 && (
                            <View style={styles.barBackground}><View style={[styles.barFill, { width: `${Math.min(aforoPercent, 100)}%` }]} /></View>
                        )}

                        <View style={styles.statRow}>
                            <MaterialCommunityIcons name="gender-male" size={20} color="#4ea8de" />
                            <Text style={styles.statText}>{maleRatio.toFixed(0)}%</Text>
                            <MaterialCommunityIcons name="gender-female" size={20} color="#de4eae" style={{ marginLeft:20 }} />
                            <Text style={styles.statText}>{femaleRatio.toFixed(0)}%</Text>
                        </View>
                        {totalGenderCount > 0 && (
                            <View style={styles.genderBarContainer}>
                                <View style={[styles.barFillMale,{width:`${maleRatio}%`}]} />
                                <View style={[styles.barFillFemale,{width:`${femaleRatio}%`, left: `${maleRatio}%`}]} />
                            </View>
                        )}

                        {item.descripcion && (
                            <Text style={styles.detail} numberOfLines={2} ellipsizeMode="tail">ℹ️ {item.descripcion}</Text>
                        )}

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.mapButton} onPress={()=>{
                                // Lógica para ir al mapa
                                console.log("Map button pressed for event:", item.cod_evento);
                            }}>
                                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#aaa" />
                                <Text style={styles.buttonText}>Cómo llegar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.factioButton} onPress={() => {
                                router.push({
                                    pathname: '/match/[eventId]',
                                    params: { eventId: item.cod_evento.toString() } // Ensure eventId is a string
                                });
                            }}>
                                <Text style={styles.buttonText}>Factio 🔥</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Visual Timer Bar Removed */}
                </ImageBackground>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#e14eca"/>
                <Text style={{color: '#ccc', marginTop: 10}}>Cargando eventos...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={{color: 'red', textAlign: 'center'}}>Error: {error}</Text>
                {/* You might want a retry button or link to login here */}
            </View>
        );
    }

    if (reels.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noEventsText}>No hay eventos próximos disponibles por ahora</Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="light-content" />
            <FlatList
                ref={scrollRef}
                data={reels}
                keyExtractor={item => String(item.cod_evento)}
                renderItem={renderReel}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={height - TAB_BAR_HEIGHT}
                snapToAlignment="start"
                onViewableItemsChanged={onViewRef.current}
                viewabilityConfig={viewConfigRef.current}
                getItemLayout={(data, index) => (
                    { length: height - TAB_BAR_HEIGHT, offset: (height - TAB_BAR_HEIGHT) * index, index }
                )}
            />
        </>
    );
}

const styles = StyleSheet.create({
    cardContainer: { width, height: height - TAB_BAR_HEIGHT },
    imageBackground: { flex: 1, justifyContent: 'flex-end' /* Align infoContainer to bottom */ },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }, // Slightly darker overlay
    infoContainer: {
        // position: 'absolute', // No longer needed if ImageBackground justifyContent is 'flex-end'
        // bottom: 20, // Control padding from bottom here
        paddingBottom: TAB_BAR_HEIGHT + 20, // Ensure content is above tab bar + some padding
        paddingHorizontal: 20,
        width: '100%',
    },
    title: { fontSize: 28, color: '#fff', fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
    subtitle: { fontSize: 15, color: '#eee', marginVertical: 4, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 },
    statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    statText: { color: '#f0f0f0', fontSize: 14, marginLeft: 8, fontWeight: '500' },
    barBackground: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginTop: 5 },
    barFill: { height: '100%', backgroundColor: '#e14eca' },

    genderBarContainer: { // New container for gender bars to stack correctly
        flexDirection: 'row', // Bars will be side-by-side if percentages don't overlap
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)', // Background for the whole bar
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 5,
    },
    barFillMale: { height: '100%', backgroundColor: '#4ea8de'/*, position: 'absolute', left: 0*/ }, // Position absolute removed, width dictates size
    barFillFemale: { height: '100%', backgroundColor: '#de4eae'/*, position: 'absolute', right: 0*/ }, // Position absolute removed

    detail: { color: '#ddd', fontSize: 14, marginTop: 10, lineHeight: 20 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, alignItems: 'center' },
    mapButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(42,42,42,0.8)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 25 },
    factioButton: { backgroundColor: '#f4524d', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#fff', fontSize: 14, marginLeft: 6, fontWeight: 'bold' },
    // timerContainer style removed
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    noEventsText: { color: '#ccc', fontSize: 18, textAlign: 'center', paddingHorizontal: 20 },
});
