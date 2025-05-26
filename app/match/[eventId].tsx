// app/match/[eventId].tsx
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
    Alert,
    Modal,
    Pressable,
    TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const SWIPE_OUT_DURATION = 250;

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

// --- INICIO: Datos de participantes locales POR EVENTO ---
interface EventParticipants {
    [eventId: number]: Participant[];
}

const allLocalParticipantsData: EventParticipants = {
    1006: [ // Participantes para el evento con ID 1
        {
            cod_usuario: 101,
            nombre: 'Elena Rivers',
            username: 'elena_r_event1',
            edad: 29,
            genero: 'femenino',
            orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_2: null,
            bio: 'Amante de los viajes y la fotografía en el Evento Alpha.',
            intereses: 'Viajes, Fotografía, Senderismo',
            estudios_trabajo: 'Diseñadora Gráfica',
        },
        {
            cod_usuario: 102,
            nombre: 'Marco Diaz',
            username: 'marco_d_event1',
            edad: 32,
            genero: 'masculino',
            orientacion_sexual: 'homosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_2: null,
            bio: 'Desarrollador de software listo para el Evento Alpha.',
            intereses: 'Tecnología, Videojuegos, Café',
            estudios_trabajo: 'Ingeniero de Software',
        },
        {
            cod_usuario: 105, // Usuario único para evento 1
            nombre: 'Anaïs Dubois',
            username: 'anais_d_event1',
            edad: 26,
            genero: 'femenino',
            orientacion_sexual: 'bisexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_2: null,
            bio: 'Chef pastelera y amante del arte. Solo en Evento Alpha.',
            intereses: 'Cocina, Arte, Música clásica',
            estudios_trabajo: 'Chef Pastelera',
        }
    ],
    1003: [ // Participantes para el evento con ID 2
        {
            cod_usuario: 103, // Usuario que puede generar un "match" para demostración
            nombre: 'Sofia Chen',
            username: 'sofia_c_event2_match',
            edad: 27,
            genero: 'femenino',
            orientacion_sexual: 'bisexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_2: null,
            bio: 'Música y conciertos en el Evento Beta. ¡Haz match conmigo!',
            intereses: 'Música, Conciertos, Arte',
            estudios_trabajo: 'Productora Musical',
        },
        {
            cod_usuario: 104,
            nombre: 'Leo Baker',
            username: 'leo_b_event2',
            edad: 30,
            genero: 'otro',
            orientacion_sexual: 'otro',
            url_fotoperfil: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_2: null,
            bio: 'Escritor y soñador en el Evento Beta.',
            intereses: 'Literatura, Escritura, Filosofía',
            estudios_trabajo: 'Escritor Freelance',
        },
        {
            cod_usuario: 201, // Usuario único para evento 2
            nombre: 'David Kim',
            username: 'david_k_event2',
            edad: 31,
            genero: 'masculino',
            orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_2: null,
            bio: 'Entusiasta del fitness y la comida saludable. Presente en Evento Beta.',
            intereses: 'Fitness, Nutrición, Ciclismo',
            estudios_trabajo: 'Entrenador Personal',
        }
    ],
    // Puedes añadir más eventos aquí, por ejemplo: eventId 3
    1004: [
        {
            cod_usuario: 301,
            nombre: 'Laura Jones',
            username: 'laura_j_event3',
            edad: 28,
            genero: 'femenino',
            orientacion_sexual: 'heterosexual',
            url_fotoperfil: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_1: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
            foto_url_2: null,
            bio: 'Veterinaria apasionada por los animales. Buscando conocer gente en el Evento Gamma.',
            intereses: 'Animales, Naturaleza, Voluntariado',
            estudios_trabajo: 'Veterinaria',
        }
    ]
};
// --- FIN: Datos de participantes locales POR EVENTO ---

export default function EventTinderScreen() {
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const eventCod = parseInt(eventId || '0', 10); // Obtener el ID del evento como número

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [index, setIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const position = useRef(new Animated.ValueXY()).current;
    const [matchAnim] = useState(new Animated.Value(0));
    const [showMatchIcon, setShowMatchIcon] = useState(false);
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [matchedUserName, setMatchedUserName] = useState<string | null>(null);

    // --- Cargar participantes localmente según eventCod ---
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        console.log(`Intentando cargar participantes para evento local ID: ${eventCod}`);

        // Simular una pequeña demora de carga
        setTimeout(() => {
            if (isNaN(eventCod) || eventCod <= 0) {
                setError('ID de evento inválido.');
                setParticipants([]);
                setIsLoading(false);
                return;
            }

            const eventSpecificParticipants = allLocalParticipantsData[eventCod] || [];
            setParticipants(eventSpecificParticipants);
            console.log(`Participantes locales cargados para evento ${eventCod}: ${eventSpecificParticipants.length}`);
            setIndex(0); // Resetear índice al cargar nuevos participantes

            if (eventSpecificParticipants.length === 0) {
                if (allLocalParticipantsData.hasOwnProperty(eventCod)) {
                    // El evento existe en nuestros datos, pero no tiene participantes
                    setError(`No hay participantes definidos para el evento ${eventCod} por ahora.`);
                } else {
                    // El evento no existe en nuestros datos locales
                    setError(`Evento con ID ${eventCod} no encontrado.`);
                }
            }
            setIsLoading(false);
        }, 500); // Simula 0.5 segundos de carga

    }, [eventCod]); // Recargar participantes si el ID del evento cambia


    // --- PanResponder (con logs de depuración, puedes quitarlos si ya funciona) ---
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => {
                // console.log('[PanResponder] Attempting to start - onStartShouldSetPanResponder');
                return true;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // console.log('[PanResponder] Considering to move - onMoveShouldSetPanResponder');
                return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
            },
            onPanResponderGrant: (evt, gestureState) => {
                // console.log('[PanResponder] Granted! Touch started.');
            },
            onPanResponderMove: (_, gesture) => {
                // console.log(`[PanResponder] Moving card: dx=${gesture.dx}, dy=${gesture.dy}`);
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onPanResponderRelease: (_, gesture) => {
                // console.log(`[PanResponder] Released: dx=${gesture.dx}, dy=${gesture.dy}`);
                if (gesture.dx > SWIPE_THRESHOLD) {
                    // console.log('[PanResponder] Swipe Right detected.');
                    forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    // console.log('[PanResponder] Swipe Left detected.');
                    forceSwipe('left');
                } else {
                    // console.log('[PanResponder] Swipe below threshold, resetting position.');
                    resetPosition();
                }
            },
            onPanResponderTerminate: (evt, gestureState) => {
                // console.log('[PanResponder] Terminated by another responder.');
                resetPosition();
            },
            onShouldBlockNativeResponder: (evt, gestureState) => true,
        })
    ).current;

    const getCardStyle = () => {
        const rotate = position.x.interpolate({
            inputRange: [-width / 2, 0, width / 2],
            outputRange: ['-10deg', '0deg', '10deg'],
            extrapolate: 'clamp',
        });
        return {
            ...position.getTranslateTransform(),
            rotate: rotate,
        };
    };

    // --- Lógica de Swipe (Local) ---
    const forceSwipe = (direction: 'left' | 'right') => {
        const currentParticipant = participants[index];
        if (!currentParticipant) return;

        console.log(`Swipe local: ${direction} en ${currentParticipant.nombre || currentParticipant.username} (Evento ${eventCod})`);

        // Lógica de Match Local (Simulada)
        // Sigue aplicando al usuario con cod_usuario 103 (Sofia Chen), quien ahora está en el evento 2
        const isMatch = (direction === 'right' && currentParticipant.cod_usuario === 103);

        if (isMatch) {
            console.log("¡MATCH DETECTADO LOCALMENTE!");
            setMatchedUserName(currentParticipant.nombre || currentParticipant.username || 'este usuario');
            setShowMatchIcon(true);
            Animated.sequence([
                Animated.timing(matchAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.delay(1000),
                Animated.timing(matchAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => {
                setShowMatchIcon(false);
                setMatchModalVisible(true);
            });
        } else {
            moveToNextCard();
        }
    };

    const moveToNextCard = () => {
        Animated.timing(position, {
            toValue: { x: width * (position.x._value > 0 ? 1 : -1), y: 0 },
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false,
        }).start(() => {
            position.setValue({ x: 0, y: 0 });
            setIndex(i => i + 1);
        });
    };

    const resetPosition = () => {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    };

    // --- Renderizado ---
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

    if (index >= participants.length) { // Esto se activa si participants está vacío o se acabaron
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

    return (
        <View style={styles.container}>
            {person && (
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[styles.card, getCardStyle()]}
                >
                    <Image
                        source={{ uri: mainPhoto || 'https://via.placeholder.com/300x400?text=No+Photo' }}
                        style={styles.image}
                        onError={(e) => console.error('Error loading image:', e.nativeEvent.error, 'URL:', mainPhoto)}
                    />
                    <View style={styles.infoOverlay}>
                        <Text style={styles.name}>
                            {person.nombre || person.username}
                            {person.edad !== null && person.edad !== undefined ? `, ${person.edad}` : ''}
                        </Text>
                        {person.bio && <Text style={styles.bioText}>{person.bio}</Text>}
                        {person.genero && <Text style={styles.detailText}>Género: {person.genero}</Text>}
                        {person.orientacion_sexual && <Text style={styles.detailText}>Orientación: {person.orientacion_sexual}</Text>}
                        {person.estudios_trabajo && <Text style={styles.detailText}>Estudios/Trabajo: {person.estudios_trabajo}</Text>}
                        {person.intereses && <Text style={styles.detailText}>Intereses: {person.intereses}</Text>}
                    </View>

                    {showMatchIcon && (
                        <Animated.View style={[styles.matchIconContainer, { opacity: matchAnim }]}>
                            <Text style={styles.matchEmoji}>💖</Text>
                        </Animated.View>
                    )}
                </Animated.View>
            )}

            {/* Solo mostrar botones si hay una persona cargada y no estamos en estado de error/loading/fin */}
            {person && !isLoading && !error && (
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={() => forceSwipe('left')} disabled={isLoading || index >= participants.length}>
                        <Text style={styles.buttonEmoji}>❌</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => forceSwipe('right')} disabled={isLoading || index >= participants.length}>
                        <Text style={styles.buttonEmoji}>💖</Text>
                    </TouchableOpacity>
                </View>
            )}


            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonBottomAbsolute}>
                <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
                <Text style={styles.backButtonText}>Volver a Eventos</Text>
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={matchModalVisible}
                onRequestClose={() => setMatchModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setMatchModalVisible(false)}>
                    <TouchableWithoutFeedback>
                        <View style={styles.matchModalContent}>
                            <Text style={styles.matchModalTitle}>¡Es un Match!</Text>
                            <Text style={styles.matchModalText}>¡Has hecho match con {matchedUserName}!</Text>
                            <Text style={styles.matchModalEmoji}>🎉</Text>
                            <TouchableOpacity style={styles.matchModalCloseButton} onPress={() => { setMatchModalVisible(false); moveToNextCard(); }}>
                                <Text style={styles.matchModalCloseButtonText}>Continuar Swiping</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center' },
    centered:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000', paddingHorizontal: 20 },
    loadingText: { color: '#fff', marginTop: 10, fontSize: 16 },
    errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 20 },
    noMore:{ color:'#fff', fontSize:18, marginBottom: 20, textAlign: 'center' },
    card: {
        width: width * 0.9,
        height: height * 0.7,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#222',
        position: 'absolute',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    image:{ width:'100%', height:'70%', resizeMode: 'cover' },
    infoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 15,
    },
    name:{ color:'#fff', fontSize:24, fontWeight:'bold' },
    bioText: { color: '#ccc', fontSize: 14, marginTop: 5 },
    detailText: { color: '#ccc', fontSize: 12, marginTop: 2 },
    backButtonBottom:{ marginTop:20, flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
    backButtonBottomAbsolute: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
    },
    backButtonText: { color: '#fff', marginLeft: 5, fontSize: 16 },
    matchesButton: {
        marginTop: 20,
        backgroundColor: '#e14eca',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    matchesButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    matchIconContainer:{ position:'absolute', top:'30%', alignSelf:'center', zIndex: 5 },
    matchEmoji:{ fontSize:100 },
    buttonsContainer:{ position:'absolute', bottom:80, width:'60%', flexDirection:'row', justifyContent:'space-between', zIndex: 10 },
    buttonEmoji:{ fontSize:50 },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    matchModalContent: {
        backgroundColor: '#1e1e1e',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '80%',
        shadowColor: '#e14eca',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 2,
        borderColor: '#e14eca',
    },
    matchModalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    matchModalText: {
        fontSize: 18,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 20,
    },
    matchModalEmoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    matchModalCloseButton: {
        backgroundColor: '#555',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginTop: 10,
    },
    matchModalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
