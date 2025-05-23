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
const TAB_BAR_HEIGHT = 60;
const AUTO_SCROLL_DURATION = 13000;

const API_BASE_URL = 'https://307d-2a0c-5a82-c002-1600-5468-aff7-895-fea0.ngrok-free.app';
const AUTH_TOKEN_KEY = 'userToken';


const CAFE_IMAGE = require('../../assets/images/cafe.jpg'); // Verifica esta ruta
const DELIRIUM_IMAGE = require('../../assets/images/delirium.jpg'); // Verifica esta ruta
const DON_VITO_IMAGE = require('../../assets/images/don_vito.jpeg'); // Verifica esta ruta
const GAUDI_IMAGE = require('../../assets/images/Gaudi.jpg'); // Verifica esta ruta y la capitalización
const GAVANA_IMAGE = require('../../assets/images/gavana.jpg'); // Verifica esta ruta

// --- Crea un array con las imágenes importadas en el orden deseado ---
const LOCAL_IMAGES_LIST_SEQUENTIAL = [
    CAFE_IMAGE,       // Asignada al 1er evento
    DELIRIUM_IMAGE,   // Asignada al 2do evento
    GAUDI_IMAGE,      // Asignada al 3er evento (cambiado el orden según tu petición)
    DON_VITO_IMAGE,   // Asignada al 4to evento (cambiado el orden según tu petición)
    GAVANA_IMAGE,     // Asignada al 5to evento (cambiado el orden según tu petición)
];

// Define la interfaz para los datos de evento que vienen del backend
interface BackendEvent {
    cod_evento: number;
    nombre: string;
    hora_inicio: string;
    hora_finalizacion: string;
    descripcion: string;
    imagen_url: string; // La mantenemos en la interfaz, aunque no la usaremos para mostrar
    nombre_local: string;
    aforo: number;
    hombres_dentro: number;
    mujeres_dentro: number;
    // Añadiremos una propiedad para la imagen local asignada
    localImageSource?: any; // require() devuelve un número/objeto, usamos 'any' o 'number'
}


export default function OffersScreen() {
    const router = useRouter();
    // El estado ahora almacenará objetos BackendEvent con una propiedad adicional
    const [reels, setReels] = useState<BackendEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<FlatList<BackendEvent>>(null);
    const timer = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);


    // Efecto para cargar los eventos desde el backend
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
                        setError('Error al cargar eventos: ' + errorData);
                    }
                    if (response.status === 401) {
                        console.warn('DEBUG: Token inválido o expirado. Eliminando token y redirigiendo al login.');
                        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
                        setError('Sesión expirada. Por favor, inicia sesión de nuevo.');
                    }
                    setLoading(false);
                    return;
                }

                const data: BackendEvent[] = await response.json();
                console.log('DEBUG: Fetch events raw response text:', JSON.stringify(data));

                // --- MODIFICACIÓN AQUÍ: Asignar una imagen local SECUENCIALMENTE a cada evento ---
                const dataWithLocalImages = data.map((event, index) => { // Usamos el índice para asignar secuencialmente
                    // Usamos el operador módulo (%) para ciclar a través de la lista de imágenes
                    // Si hay más eventos que imágenes, se repite la secuencia (cafeteria, delirium, gaudi...)
                    const imageIndex = index % LOCAL_IMAGES_LIST_SEQUENTIAL.length;
                    const assignedImageSource = LOCAL_IMAGES_LIST_SEQUENTIAL[imageIndex];
                    return {
                        ...event, // Mantiene todos los datos originales del backend
                        localImageSource: assignedImageSource, // Añade la propiedad con la imagen local asignada
                    };
                });
                // --- FIN MODIFICACIÓN ---

                console.log('DEBUG: Eventos cargados y con imágenes locales asignadas:', dataWithLocalImages.length);

                setReels(dataWithLocalImages); // Actualiza el estado con los datos modificados
                setLoading(false);

            } catch (err: any) {
                console.error('Error fetching events:', err);
                setError('Error de conexión al cargar eventos: ' + err.message);
                setLoading(false);
            }
        };

        fetchEvents();

        return () => {};

    }, []);


    // Efecto para el timer y auto-scroll (sin cambios)
    useEffect(() => {
        if (reels.length > 0) {
            timer.setValue(0);
            Animated.timing(timer, {
                toValue: width,
                duration: AUTO_SCROLL_DURATION,
                useNativeDriver: false,
            }).start(({ finished }) => {
                if (finished && currentIndex < reels.length - 1) {
                    scrollRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
                } else if (finished && currentIndex === reels.length - 1) {
                    // Opcional: Volver al primer evento o detener el timer al final
                }
            });
        } else {
            timer.stopAnimation();
            timer.setValue(0);
        }
    }, [currentIndex, reels.length, timer]);

    const onViewRef = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== currentIndex) {
            setCurrentIndex(viewableItems[0].index);
            console.log("DEBUG: Current visible item index:", viewableItems[0].index);
        }
    });
    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });


    // Función para renderizar cada evento - Usa la imagen local asignada secuencialmente
    const renderReel = ({ item }: { item: BackendEvent }) => { // 'item' ahora incluye 'localImageSource'
        // Cálculos para las barras basados en los datos del backend (sin cambios)
        const occupied = item.hombres_dentro + item.mujeres_dentro;
        const totalAforo = item.aforo;
        const aforoPercent = totalAforo > 0 ? (occupied / totalAforo) * 100 : 0;

        const totalGenderCount = item.hombres_dentro + item.mujeres_dentro;
        const maleRatio = totalGenderCount > 0 ? (item.hombres_dentro / totalGenderCount) * 100 : 0;
        const femaleRatio = totalGenderCount > 0 ? (item.mujeres_dentro / totalGenderCount) * 100 : 0;

        // Formatear la fecha (sin cambios)
        const startDate = new Date(item.hora_inicio);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const formattedDate = startDate.toLocaleDateString(undefined, options);

        return (
            <View style={styles.cardContainer}>
                {/* --- CAMBIO AQUÍ: Usar la imagen local asignada secuencialmente --- */}
                {/* item.localImageSource contendrá el resultado de require() de la imagen asignada por índice */}
                <ImageBackground source={item.localImageSource} style={styles.imageBackground}>
                    <View style={styles.overlay} />

                    <View style={styles.infoContainer}>
                        {/* Resto de la información y botones (sin cambios) */}
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
                            <View style={styles.barBackground}><View style={[styles.barFill, { width: `${aforoPercent}%` }]} /></View>
                        )}

                        <View style={styles.statRow}>
                            <MaterialCommunityIcons name="gender-male" size={20} color="#4ea8de" />
                            <Text style={styles.statText}>{maleRatio.toFixed(0)}%</Text>
                            <MaterialCommunityIcons name="gender-female" size={20} color="#de4eae" style={{ marginLeft:20 }} />
                            <Text style={styles.statText}>{femaleRatio.toFixed(0)}%</Text>
                        </View>
                        {totalGenderCount > 0 && (
                            <View style={styles.barBackground}>
                                <View style={[styles.barFillMale,{width:`${maleRatio}%`}]} />
                                <View style={[styles.barFillFemale,{width:`${femaleRatio}%`}]} />
                            </View>
                        )}

                        {item.descripcion && (
                            <Text style={styles.detail}>ℹ️ {item.descripcion}</Text>
                        )}

                        {/* Botones (sin cambios) */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.mapButton} onPress={()=>{
                                // Lógica para ir al mapa
                            }}>
                                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#aaa" />
                                <Text style={styles.buttonText}>Cómo llegar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.factioButton} onPress={() => {
                                router.push({
                                    pathname: '/match/[eventId]',
                                    params: { eventId: item.cod_evento }
                                });
                            }}>
                                <Text style={styles.buttonText}>Factio 🔥</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Timer (sin cambios) */}
                    <Animated.View style={[styles.timerContainer, { bottom: TAB_BAR_HEIGHT, width: timer }]} />
                </ImageBackground>
            </View>
        );
    };

    // Mostrar indicador de carga o error (sin cambios)
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
            </View>
        );
    }

    // Si no hay eventos (sin cambios)
    if (reels.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noEventsText}>No hay eventos próximos disponibles por ahora</Text>
            </View>
        );
    }

    // Renderizar la FlatList (sin cambios importantes, solo usa la nueva render Reel)
    return (
        <FlatList
            ref={scrollRef}
            data={reels}
            keyExtractor={item => String(item.cod_evento)}
            renderItem={renderReel}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={height}
            snapToAlignment="start"
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfigRef.current}
        />
    );
}

// Estilos (sin cambios)
const styles = StyleSheet.create({
    cardContainer: { width, height: height - TAB_BAR_HEIGHT },
    imageBackground: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    infoContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, padding: 20 },
    title: { fontSize: 28, color: '#eee', fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#bbb', marginVertical: 4 },
    statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    statText: { color: '#ddd', fontSize: 13, marginLeft: 6 },
    barBackground: { width: '100%', height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
    barFill: { height: '100%', backgroundColor: '#e14eca' },
    barFillMale: { height: '100%', backgroundColor: '#4ea8de', position: 'absolute', left: 0 },
    barFillFemale: { height: '100%', backgroundColor: '#de4eae', position: 'absolute', right: 0 },
    detail: { color: '#ccc', fontSize: 13, marginTop: 6 },
    ageBarBackground: { flexDirection: 'row', width: '100%', height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden', marginTop: 4, position: 'relative' },
    ageBarSegment: { height: '100%' },
    ageNeedle: { position: 'absolute', top: -4, width: 2, height: 14, backgroundColor: '#fff', zIndex: 1 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    mapButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
    factioButton: { backgroundColor: '#f4524d', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#ddd', fontSize: 13, marginLeft: 6, fontWeight: 'bold' },
    timerContainer: { position: 'absolute', height: 4, left: 0, backgroundColor: '#555' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    noEventsText: { color: '#ccc', fontSize: 18, textAlign: 'center' },
});
