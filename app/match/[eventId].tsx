// app/match/[eventId].tsx // Ruta correcta del archivo
// Asumo que la ruta será así o similar usando expo-router dynamic routes

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
    ActivityIndicator, // Para indicador de carga
    Alert, // Para mostrar errores o matches
    Modal, // Para el modal de match
    Pressable, // Para el fondo del modal
    TouchableWithoutFeedback, // Para evitar cerrar modal al tocar dentro
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
// import participantsData from '../data/participants.json'; // ELIMINAR
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para obtener el token

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25; // Umbral para considerar un swipe completo
const SWIPE_OUT_DURATION = 250; // Duración de la animación de salida
const API_BASE_URL = 'http://192.168.1.142:3001'; // Asegúrate de que es la URL correcta de tu backend
const AUTH_TOKEN_KEY = 'userToken'; // Clave usada para guardar el token

// Definir la interfaz de los participantes basada en lo que retorna tu backend
interface Participant {
    cod_usuario: number; // ID del usuario, usado para likes/dislikes
    nombre: string | null;
    username: string | null; // Si quieres mostrar el username también
    edad: number | null;
    genero: 'masculino' | 'femenino' | 'otro' | null; // Usar valores ENUM
    orientacion_sexual: 'homosexual' | 'heterosexual' | 'bisexual' | 'otro' | null; // Usar valores ENUM
    foto_url_1: string | null; // URL de la foto 1
    foto_url_2: string | null; // URL de la foto 2
    url_fotoperfil: string | null; // URL de la foto de perfil principal
    bio: string | null;
    intereses: string | null;
    // ... otros campos que selecciones en la consulta SQL
}

export default function EventTinderScreen() { // Renombrado para mayor claridad
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const eventCod = parseInt(eventId || '0', 10); // Obtener el ID del evento como número

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [index, setIndex] = useState(0); // Índice del participante actual
    const [isLoading, setIsLoading] = useState(true); // Estado para carga inicial
    const [error, setError] = useState<string | null>(null); // Estado para errores

    // Animación para la tarjeta
    const position = useRef(new Animated.ValueXY()).current;

    // Animación y estado para el icono de match (local)
    const [matchAnim] = useState(new Animated.Value(0));
    const [showMatchIcon, setShowMatchIcon] = useState(false);

    // Estado y animación para el modal de match
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [matchedUserName, setMatchedUserName] = useState<string | null>(null); // Nombre del usuario con el que se hizo match


    // --- Cargar participantes del backend ---
    useEffect(() => {
        const fetchParticipants = async () => {
            setIsLoading(true);
            setError(null);
            const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY); // Obtener el token guardado

            if (!token) {
                setError('Usuario no autenticado. Por favor, inicia sesión.');
                setIsLoading(false);
                // router.replace('/login'); // Redirigir si no hay token
                return;
            }
            if (isNaN(eventCod) || eventCod <= 0) {
                setError('ID de evento inválido.');
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/eventos/${eventCod}/participantes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Incluir el token de autenticación
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Error desconocido al cargar participantes.');
                    console.error('API Error fetching participants:', data.error);
                    setParticipants([]); // Limpiar participantes si hay error
                } else {
                    // Asume que 'data' es directamente el array de participantes
                    setParticipants(data);
                    console.log(`Participantes cargados para evento ${eventCod}:`, data.length);
                    setIndex(0); // Resetear índice al cargar nuevos participantes
                }

            } catch (err: any) {
                console.error('Fetch error fetching participants:', err);
                setError('No se pudo conectar con el servidor o error de red.');
                setParticipants([]); // Limpiar participantes si hay error
            } finally {
                setIsLoading(false);
            }
        };

        fetchParticipants();
    }, [eventCod]); // Recargar participantes si el ID del evento cambia


    // --- PanResponder para gestos de swipe ---
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true, // Permitir que este componente responda a gestos táctiles
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy }); // Mover la tarjeta según el gesto
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    forceSwipe('right'); // Swipe a la derecha
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    forceSwipe('left'); // Swipe a la izquierda
                } else {
                    resetPosition(); // Volver a la posición original si no se supera el umbral
                }
            },
        })
    ).current;

    // Estilo animado para la tarjeta (incluye traslación y rotación)
    const getCardStyle = () => {
        const rotate = position.x.interpolate({
            inputRange: [-width / 2, 0, width / 2], // Rango de movimiento horizontal
            outputRange: ['-10deg', '0deg', '10deg'], // Rango de rotación correspondiente
            extrapolate: 'clamp', // Evita que la rotación se salga del rango
        });
        return {
            ...position.getTranslateTransform(), // Aplicar traslación X e Y
            rotate: rotate, // Aplicar rotación
        };
    };

    // --- Lógica de Swipe (Enviar a Backend) ---
    const forceSwipe = async (direction: 'left' | 'right') => {
        const currentParticipant = participants[index];
        if (!currentParticipant) return; // No hacer nada si no hay participante

        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            Alert.alert('Error', 'Usuario no autenticado. Por favor, inicia sesión.');
            // router.replace('/login'); // Redirigir si no hay token
            return;
        }
        if (isNaN(eventCod) || eventCod <= 0) {
            Alert.alert('Error', 'ID de evento inválido.');
            return;
        }

        // Opcional: mostrar un indicador mientras se envía el swipe
        // setIsLoading(true);

        try {
            const endpoint = direction === 'right' ?
                `${API_BASE_URL}/api/eventos/${eventCod}/like` :
                `${API_BASE_URL}/api/eventos/${eventCod}/dislike`; // Usar endpoint de dislike si existe

            // --- CORRECCIÓN: Construir el body condicionalmente y con sintaxis correcta ---
            let bodyContent: { likedUserId?: number; dislikedUserId?: number; };
            if (direction === 'right') {
                bodyContent = { likedUserId: currentParticipant.cod_usuario };
            } else { // direction === 'left'
                bodyContent = { dislikedUserId: currentParticipant.cod_usuario };
            }

            const body = JSON.stringify(bodyContent); // Stringify el objeto construido
            // --- FIN CORRECCIÓN ---


            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            const data = await response.json();

            if (!response.ok) {
                Alert.alert(`Error al procesar ${direction === 'right' ? 'like' : 'dislike'}`, data.error || 'Error desconocido.');
                console.error(`API Error on swipe ${direction}:`, data.error);
                // No avanzar al siguiente perfil si hubo error
                // setIsLoading(false); // Detener indicador si hubo error
                return;
            }

            console.log(`Swipe ${direction} procesado. Backend response:`, data);

            // Si el swipe fue un like y el backend indica que resultó en un match
            if (direction === 'right' && data.match) { // El backend debe enviar { match: true }
                console.log("¡MATCH DETECTADO!");
                setMatchedUserName(currentParticipant.nombre || currentParticipant.username || 'este usuario'); // Guardar nombre para el modal
                // Activar animación de match local (opcional)
                setShowMatchIcon(true);
                Animated.sequence([
                    Animated.timing(matchAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.delay(1000), // Mostrar el icono un tiempo
                    Animated.timing(matchAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => {
                    setShowMatchIcon(false);
                    setMatchModalVisible(true); // Mostrar el modal de match
                });

            } else {
                // Si no fue un match o fue un dislike, simplemente mover a la siguiente tarjeta
                moveToNextCard();
            }


        } catch (err: any) {
            console.error(`Fetch error on swipe ${direction}:`, err);
            Alert.alert('Error de conexión', 'No se pudo enviar el swipe al servidor.');
            // No avanzar al siguiente perfil si hubo error de red
            // setIsLoading(false); // Detener indicador si hubo error
        }
    };

    // Animar la tarjeta saliente y pasar a la siguiente
    const moveToNextCard = () => {
        // Animar la tarjeta saliente fuera de la pantalla
        Animated.timing(position, {
            toValue: { x: width * (position.x._value > 0 ? 1 : -1), y: 0 }, // Swipe hacia el lado correspondiente
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false, // Usar false si Animated.ValueXY está involucrado
        }).start(() => {
            position.setValue({ x: 0, y: 0 }); // Resetear posición para la siguiente tarjeta
            setIndex(i => i + 1); // Mover al siguiente índice
            // setIsLoading(false); // Detener el indicador de carga después de la animación (si lo activaste en forceSwipe)
        });
    };

    // Volver la tarjeta a la posición original
    const resetPosition = () => {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    };

    // --- Renderizado ---
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#e14eca" />
                <Text style={styles.loadingText}>Cargando participantes...</Text>
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


    if (index >= participants.length) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noMore}>No quedan más participantes en este evento por ahora.</Text>
                {/* Botón para ver matches en este evento (navega a una nueva pantalla) */}
                <TouchableOpacity style={styles.matchesButton} onPress={() => router.push(`/event/${eventCod}/matches` as any)}> {/* Ajusta la ruta */}
                    <Text style={styles.matchesButtonText}>Ver Mis Matches en este Evento</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonBottom}>
                    <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
                    <Text style={styles.backButtonText}>Volver al Evento</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Participante actual a mostrar
    const person = participants[index];
    // Determinar qué foto mostrar primero (ej: foto de perfil principal si existe)
    const mainPhoto = person.url_fotoperfil || person.foto_url_1 || person.foto_url_2; // Usar la primera foto disponible


    return (
        <View style={styles.container}>
            {/* Renderizar solo la tarjeta actual */}
            {person && (
                <Animated.View
                    {...panResponder.panHandlers} // Adjuntar manejadores de gestos
                    style={[styles.card, getCardStyle()]} // Aplicar estilos animados
                >
                    {/* Usar la URL de la foto principal del backend */}
                    <Image
                        source={{ uri: mainPhoto || 'https://via.placeholder.com/300x400?text=No+Photo' }} // Placeholder si no hay foto
                        style={styles.image}
                        onError={(e) => console.error('Error loading image:', e.nativeEvent.error, 'URL:', mainPhoto)} // Log de errores de carga de imagen
                    />
                    <View style={styles.infoOverlay}>
                        <Text style={styles.name}>
                            {person.nombre || person.username} {/* Mostrar nombre o username */}
                            {person.edad !== null && person.edad !== undefined ? `, ${person.edad}` : ''}
                        </Text>
                        {person.bio && <Text style={styles.bioText}>{person.bio}</Text>}
                        {/* Mostrar orientación y género si existen */}
                        {person.genero && <Text style={styles.detailText}>Género: {person.genero}</Text>}
                        {person.orientacion_sexual && <Text style={styles.detailText}>Orientación: {person.orientacion_sexual}</Text>}
                        {/* Mostrar estudios/trabajo si existen */}
                        {person.estudios_trabajo && <Text style={styles.detailText}>Estudios/Trabajo: {person.estudios_trabajo}</Text>}
                        {person.intereses && <Text style={styles.detailText}>Intereses: {person.intereses}</Text>}

                    </View>

                    {showMatchIcon && ( // Icono de match local (solo animación visual temporal)
                        <Animated.View style={[styles.matchIconContainer, { opacity: matchAnim }]}>
                            <Text style={styles.matchEmoji}>💖</Text>
                        </Animated.View>
                    )}
                </Animated.View>
            )}

            {/* Botones de swipe */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={() => forceSwipe('left')} disabled={isLoading || index >= participants.length}>
                    <Text style={styles.buttonEmoji}>❌</Text> {/* Icono de rechazo */}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => forceSwipe('right')} disabled={isLoading || index >= participants.length}>
                    <Text style={styles.buttonEmoji}>💖</Text> {/* Icono de like */}
                </TouchableOpacity>
            </View>

            {/* Botón para volver al evento (fijo en la parte inferior) */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButtonBottomAbsolute}>
                <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
                <Text style={styles.backButtonText}>Volver al Evento</Text>
            </TouchableOpacity>

            {/* Modal de Match */}
            <Modal
                animationType="fade" // o "slide"
                transparent={true}
                visible={matchModalVisible}
                onRequestClose={() => setMatchModalVisible(false)} // Para Android back button
            >
                <Pressable style={styles.modalOverlay} onPress={() => setMatchModalVisible(false)}>
                    <TouchableWithoutFeedback>
                        <View style={styles.matchModalContent}>
                            <Text style={styles.matchModalTitle}>¡Es un Match!</Text>
                            <Text style={styles.matchModalText}>¡Has hecho match con {matchedUserName}!</Text>
                            <Text style={styles.matchModalEmoji}>🎉</Text> {/* O un icono más grande */}
                            {/* Opcional: Botón para ir al chat o ver perfil del match */}
                            {/* <TouchableOpacity style={styles.matchModalButton} onPress={() => { setMatchModalVisible(false); router.push(`/chat/${matchedUserId}`); }}>
                                 <Text style={styles.matchModalButtonText}>Enviar Mensaje</Text>
                             </TouchableOpacity> */}
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
    centered:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' },
    loadingText: { color: '#fff', marginTop: 10, fontSize: 16 },
    errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 20 },
    noMore:{ color:'#fff', fontSize:18, marginBottom: 20, textAlign: 'center' },
    card: {
        width: width * 0.9,
        height: height * 0.7, // Ajustar altura si es necesario
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#222',
        position: 'absolute', // Para que solo se muestre la tarjeta actual
        elevation: 5, // Sombra en Android
        shadowColor: '#000', // Sombra en iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    image:{ width:'100%', height:'70%', resizeMode: 'cover' }, // Ajustar altura de la imagen
    infoOverlay: { // Contenedor para nombre y detalles sobre la imagen o debajo
        position: 'absolute', // Opcional: ponerlo sobre la imagen en la parte inferior
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', // Fondo semi-transparente
        padding: 15,
        // O si no quieres overlay, quita 'position: absolute' y ajusta la altura de la imagen/card
        // height: '30%', // Si está debajo de la imagen en un diseño fijo
    },
    name:{ color:'#fff', fontSize:24, fontWeight:'bold' },
    bioText: { color: '#ccc', fontSize: 14, marginTop: 5 },
    detailText: { color: '#ccc', fontSize: 12, marginTop: 2 }, // Estilo para orientación, género, etc.
    backButtonBottom:{ marginTop:20 },
    backButtonBottomAbsolute: { // Botón de volver fijo en la parte inferior
        position: 'absolute',
        bottom: 20, // Ajustar posición
        alignSelf: 'center', // Centrar horizontalmente
        padding: 10,
        zIndex: 10, // Asegurarse de que esté visible
        flexDirection: 'row', // Para icono y texto
        alignItems: 'center',
    },
    backButtonText: { color: '#fff', marginLeft: 5, fontSize: 16 },
    matchesButton: { // Botón para ver matches después de acabar los swipes
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
    matchIconContainer:{ position:'absolute', top:'30%', alignSelf:'center', zIndex: 5 }, // zIndex para que esté sobre la tarjeta
    matchEmoji:{ fontSize:100 }, // Icono de match más grande
    buttonsContainer:{ position:'absolute', bottom:80, width:'60%', flexDirection:'row', justifyContent:'space-between', zIndex: 10 }, // Ajustar bottom y zIndex
    buttonEmoji:{ fontSize:50 }, // Iconos de swipe más grandes

    // Estilos para el Modal de Match
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fondo oscuro semi-transparente
    },
    matchModalContent: {
        backgroundColor: '#1e1e1e', // Fondo del modal oscuro
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '80%',
        shadowColor: '#e14eca', // Sombra con color de marca
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 2,
        borderColor: '#e14eca', // Borde con color de marca
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
    matchModalButton: { // Estilo para un botón de acción adicional (ej: ir al chat)
        backgroundColor: '#e14eca',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginTop: 10,
    },
    matchModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    matchModalCloseButton: {
        backgroundColor: '#555', // Botón para cerrar el modal
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
