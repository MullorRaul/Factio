// app/match/[eventId].tsx (mover fuera de (tabs) para ocultar tab bar)
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    Animated,
    PanResponder,
    ActivityIndicator,
    // Modal, Pressable, TouchableWithoutFeedback removed as per File 1 swipe logic
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * width; // From File 1
const SWIPE_OUT_DURATION = 250; // From File 1

// Interface for a participant, from File 2 (more comprehensive)
interface Participant {
    cod_usuario: number;
    nombre: string | null;
    username: string | null;
    edad: number | null;
    genero: 'masculino' | 'femenino' | 'otro' | null;
    orientacion_sexual: 'homosexual' | 'heterosexual' | 'bisexual' | 'otro' | null;
    foto_url_1: string | null;
    foto_url_2: string | null;
    url_fotoperfil: string | null;
    bio: string | null;
    intereses: string | null;
    estudios_trabajo?: string | null;
}

// --- INICIO: Datos de participantes locales POR EVENTO (from File 2) ---
interface EventParticipants {
    [eventId: number]: Participant[];
}

const allLocalParticipantsData: EventParticipants = {
    1006: [ // Evento existente
        {
            cod_usuario: 101, nombre: 'Elena Rivers', username: 'elena_r_event1', edad: 29, genero: 'femenino', orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Amante de los viajes y la fotografía en el Evento Alpha.', intereses: 'Viajes, Fotografía, Senderismo', estudios_trabajo: 'Diseñadora Gráfica',
        },
        {
            cod_usuario: 102, nombre: 'Marco Diaz', username: 'marco_d_event1', edad: 32, genero: 'masculino', orientacion_sexual: 'homosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Desarrollador de software listo para el Evento Alpha.', intereses: 'Tecnología, Videojuegos, Café', estudios_trabajo: 'Ingeniero de Software',
        },
        {
            cod_usuario: 105, nombre: 'Anaïs Dubois', username: 'anais_d_event1', edad: 26, genero: 'femenino', orientacion_sexual: 'bisexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Chef pastelera y amante del arte. Solo en Evento Alpha.', intereses: 'Cocina, Arte, Música clásica', estudios_trabajo: 'Chef Pastelera',
        }
    ],
    1003: [ // Evento existente
        {
            cod_usuario: 103, nombre: 'Sofia Chen', username: 'sofia_c_event2_match', edad: 27, genero: 'femenino', orientacion_sexual: 'bisexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Música y conciertos en el Evento Beta. ¡Haz match conmigo!', intereses: 'Música, Conciertos, Arte', estudios_trabajo: 'Productora Musical',
        },
        {
            cod_usuario: 104, nombre: 'Leo Baker', username: 'leo_b_event2', edad: 30, genero: 'otro', orientacion_sexual: 'otro',
            url_fotoperfil: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Escritor y soñador en el Evento Beta.', intereses: 'Literatura, Escritura, Filosofía', estudios_trabajo: 'Escritor Freelance',
        }
    ],
    1004: [ // Evento existente
        {
            cod_usuario: 301, nombre: 'Laura Jones', username: 'laura_j_event3', edad: 28, genero: 'femenino', orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Veterinaria apasionada por los animales. Buscando conocer gente en el Evento Gamma.', intereses: 'Animales, Naturaleza, Voluntariado', estudios_trabajo: 'Veterinaria',
        }
    ],
    // --- INICIO: Nuevos datos para el evento 1005 ---
    1005: [
        {
            cod_usuario: 501, nombre: 'Carlos Vega', username: 'cvega_event1005', edad: 31, genero: 'masculino', orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Ingeniero y aficionado al ciclismo de montaña. Aquí para el Evento Delta.', intereses: 'Ciclismo, Tecnología, Senderismo', estudios_trabajo: 'Ingeniero Mecánico',
        },
        {
            cod_usuario: 502, nombre: 'Isabel Luna', username: 'iluna_event1005', edad: 27, genero: 'femenino', orientacion_sexual: 'bisexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', // Re-used for example
            foto_url_1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Artista plástica explorando nuevas conexiones en Evento Delta.', intereses: 'Pintura, Escultura, Cine de autor', estudios_trabajo: 'Artista Freelance',
        },
        {
            cod_usuario: 503, nombre: 'Alex Chen', username: 'achen_event1005', edad: 29, genero: 'otro', orientacion_sexual: 'pansexual', // Assuming 'pansexual' would fall under 'otro' or you'd extend the enum
            url_fotoperfil: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Activista y amante de la literatura. Buscando conversaciones profundas en Evento Delta.', intereses: 'Derechos Humanos, Literatura, Yoga', estudios_trabajo: 'Sociólogo',
        }
    ],
    // --- FIN: Nuevos datos para el evento 1005 ---

    // --- INICIO: Nuevos datos para el evento 1007 ---
    1007: [
        {
            cod_usuario: 701, nombre: 'Roberto Morales', username: 'rmorales_event1007', edad: 35, genero: 'masculino', orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Chef ejecutivo apasionado por la gastronomía local. Presente en Evento Sigma.', intereses: 'Cocina Fusión, Vinos, Viajes Culinarios', estudios_trabajo: 'Chef Ejecutivo',
        },
        {
            cod_usuario: 702, nombre: 'Gabriela Silva', username: 'gsilva_event1007', edad: 29, genero: 'femenino', orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Periodista curiosa y siempre en busca de una buena historia. Evento Sigma.', intereses: 'Lectura, Documentales, Fotografía Urbana', estudios_trabajo: 'Periodista',
        },
        {
            cod_usuario: 703, nombre: 'Kenji Tanaka', username: 'ktanaka_event1007', edad: 32, genero: 'masculino', orientacion_sexual: 'homosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Arquitecto minimalista y amante del buen diseño. Descubriendo Evento Sigma.', intereses: 'Arquitectura, Diseño de Interiores, Música Electrónica', estudios_trabajo: 'Arquitecto',
        },
        {
            cod_usuario: 704, nombre: 'Olivia Reed', username: 'oreed_event1007', edad: 26, genero: 'femenino', orientacion_sexual: 'bisexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', // Re-used for example
            foto_url_1: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80', foto_url_2: null,
            bio: 'Bailarina profesional y coreógrafa. Explorando el ritmo en Evento Sigma.', intereses: 'Danza Contemporánea, Teatro, Viajes', estudios_trabajo: 'Bailarina y Coreógrafa',
        }
    ]
    // --- FIN: Nuevos datos para el evento 1007 ---
};
// --- FIN: Datos de participantes locales POR EVENTO ---

export default function MatchScreen() {
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const eventCod = parseInt(eventId || '0', 10);

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [index, setIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const position = useRef(new Animated.ValueXY()).current;
    const [matchAnim] = useState(new Animated.Value(0)); // For match icon animation
    const [showMatchIcon, setShowMatchIcon] = useState(false); // To show/hide match icon

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        // Simulating load time
        setTimeout(() => {
            if (isNaN(eventCod) || eventCod <= 0) {
                setError('ID de evento inválido.');
                setParticipants([]);
                setIsLoading(false);
                return;
            }
            const eventSpecificParticipants = allLocalParticipantsData[eventCod] || [];
            setParticipants(eventSpecificParticipants);
            setIndex(0);
            if (eventSpecificParticipants.length === 0) {
                setError(allLocalParticipantsData.hasOwnProperty(eventCod) ? `No hay participantes definidos para el evento ${eventCod} por ahora.` : `Evento con ID ${eventCod} no encontrado.`);
            }
            setIsLoading(false);
        }, 500);
    }, [eventCod]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy), // Kept from File 2 for responsiveness
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    forceSwipe('left');
                } else {
                    resetPosition();
                }
            },
            onPanResponderTerminationRequest: () => true, // Kept from File 2
            onPanResponderTerminate: () => resetPosition(), // Kept from File 2
            onShouldBlockNativeResponder: () => true, // Kept from File 2
        })
    ).current;

    // Swipe logic from File 1
    const forceSwipe = (direction: 'left' | 'right') => {
        Animated.timing(position, {
            toValue: { x: direction === 'right' ? width : -width, y: 0 },
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false, // Must be false for Animated.ValueXY position
        }).start(() => onSwipeComplete(direction));
    };

    // onSwipeComplete logic from File 1
    const onSwipeComplete = (direction: 'left' | 'right') => {
        if (direction === 'right') {
            setShowMatchIcon(true);
            Animated.sequence([
                Animated.timing(matchAnim, { toValue: 1, duration: 300, useNativeDriver: true }), // useNativeDriver: true for opacity
                Animated.delay(500),
                Animated.timing(matchAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => {
                setShowMatchIcon(false);
                // Common logic after animation completes
                position.setValue({ x: 0, y: 0 });
                setIndex(i => i + 1);
            });
        } else { // Left swipe
            position.setValue({ x: 0, y: 0 });
            setIndex(i => i + 1);
        }
    };

    // resetPosition logic from File 1
    const resetPosition = () => {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    };


    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#e14eca" />
                <Text style={styles.loadingText}>Cargando participantes para el evento {eventCod}...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonBottom}>
                    <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
                    <Text style={styles.backButtonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // "No more participants" screen - kept enriched version from File 2 / previous merge
    if (index >= participants.length) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noMore}>No quedan más participantes en el evento {eventCod} por ahora.</Text>
                <TouchableOpacity style={styles.matchesButton} onPress={() => router.push(`/event/${eventCod}/matches` as any)}>
                    <Text style={styles.matchesButtonText}>Ver Mis Matches en este Evento</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonBottom}>
                    <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
                    <Text style={styles.backButtonText}>Volver a Eventos</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const person = participants[index];
    const mainPhoto = person.url_fotoperfil || person.foto_url_1 || person.foto_url_2;

    // Card rotation from File 1
    const rotate = position.x.interpolate({
        inputRange: [-width * 1.5, 0, width * 1.5],
        outputRange: ['-20deg', '0deg', '20deg'],
        extrapolate: 'clamp', // Good practice to add extrapolate
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonTopAbsolute}>
                <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
            </TouchableOpacity>

            {person && (
                <Animated.View
                    {...panResponder.panHandlers}
                    // Card transform includes File 1's rotation
                    style={[styles.card, { transform: [...position.getTranslateTransform(), { rotate }] }]}
                >
                    <Image
                        source={{ uri: mainPhoto || 'https://via.placeholder.com/300x400?text=No+Photo' }}
                        style={styles.image} // Using File 1's simpler image and name display directly on card
                        onError={(e) => console.error('Error loading image:', e.nativeEvent.error, 'URL:', mainPhoto)}
                    />
                    {/* Info Overlay from File 2 for richer info display, can be simplified if needed */}
                    <View style={styles.infoOverlay}>
                        <Text style={styles.nameOnCard} numberOfLines={1} ellipsizeMode="tail">
                            {person.nombre || person.username}
                            {person.edad !== null && person.edad !== undefined ? `, ${person.edad}` : ''}
                        </Text>
                        {person.bio && <Text style={styles.bioText} numberOfLines={2} ellipsizeMode="tail">{person.bio}</Text>}
                    </View>


                    {/* Match icon display from File 1 */}
                    {showMatchIcon && (
                        <Animated.View style={[styles.matchIconContainer, { opacity: matchAnim }]}>
                            <Text style={styles.matchEmoji}>💖</Text>
                        </Animated.View>
                    )}
                </Animated.View>
            )}

            {/* Buttons with File 1 emojis and functionality */}
            {person && !isLoading && !error && (
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={styles.buttonCircle} onPress={() => forceSwipe('left')} disabled={isLoading || index >= participants.length}>
                        <Text style={styles.buttonEmojiFile1}>😕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buttonCircle} onPress={() => forceSwipe('right')} disabled={isLoading || index >= participants.length}>
                        <Text style={styles.buttonEmojiFile1}>😍</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center', paddingTop: 40, paddingBottom: 120 },
    centered:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000', paddingHorizontal: 20 },
    loadingText: { color: '#fff', marginTop: 10, fontSize: 16 },
    errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 20 },
    noMore:{ color:'#fff', fontSize:18, marginBottom: 20, textAlign: 'center' },
    card: { // Styles adapted from File 1 for card dimensions, but position managed by Animated.View
        width: width * 0.9,
        height: height * 0.75, // File 1 height
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#222', // File 1 bg
        position: 'absolute', // Important for PanResponder and swipe animations
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    image: { // From File 1 - image takes most of the card
        width: '100%',
        height: '85%', // File 1 image height
        resizeMode: 'cover',
    },
    // Using infoOverlay from previous merge for richer info, placed below image area
    infoOverlay: {
        position: 'absolute',
        bottom: 0, // At the bottom of the card
        left: 0,
        right: 0,
        height: '15%', // Remaining space after image
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 15,
        paddingVertical: 10, // Adjusted padding
        justifyContent: 'center', // Center content vertically
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    nameOnCard:{ // Adapted from File 1's name style for the overlay
        color:'#fff',
        fontSize:22,
        fontWeight:'bold',
        textAlign:'center',
    },
    bioText: { // Simplified bio for the overlay
        color: '#f0f0f0',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    backButtonTopAbsolute: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 5,
    },
    backButtonBottom:{ marginTop:20, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    backButtonText: { color: '#fff', marginLeft: 5, fontSize: 16 },
    matchesButton: {
        marginTop: 20,
        backgroundColor: '#e14eca',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
    },
    matchesButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Match icon styles from File 1
    matchIconContainer:{
        position:'absolute',
        top:'40%',
        alignSelf:'center',
        zIndex: 5 // Ensure it's above image but below other potential overlays if any
    },
    matchEmoji:{ // For on-card match icon, from File 1
        fontSize: 80
    },
    buttonsContainer:{
        position:'absolute',
        bottom: 50, // File 1 position
        width:'60%', // File 1 width
        flexDirection:'row',
        justifyContent:'space-between', // File 1 spacing
        alignItems: 'center',
        zIndex: 10
    },
    buttonCircle: { // Generic circle style for buttons
        backgroundColor: 'rgba(40,40,40,0.8)',
        width: 60, // A bit larger to accommodate File 1 emoji size
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonEmojiFile1:{ // Emoji style for buttons from File 1
        fontSize: 40
    },
});
