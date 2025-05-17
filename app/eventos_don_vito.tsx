// app/(tabs)/eventos_delirium.tsx
import React from 'react';
import {
    View,
    Text, // Asegúrate de importar Text
    StyleSheet,
    ScrollView,
    // Eliminado: Image, // Ya no necesitamos el componente Image
    TouchableOpacity,
    Alert, // Para la alerta temporal del botón
    StatusBar,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Si necesitas navegar de vuelta o a otro lugar, puedes importar useRouter
// import { useRouter } from 'expo-router';

// Define la URL base de tu backend si la necesitas para la lógica de "Apuntarse"
// const API_BASE_URL = 'http://192.168.1.142:3001';
// Clave para AsyncStorage donde guardamos el token JWT
// const AUTH_TOKEN_KEY = 'userToken';

// Interfaz para la estructura de un evento
interface Event {
    id: string;
    name: string;
    description: string;
    day: 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
    photo: any; // Mantenemos la propiedad 'photo' aunque no se renderice visualmente
    // Puedes añadir más campos como hora, precio, etc.
    time?: string;
    entryPrice?: string;
}

// Datos de ejemplo para los eventos de Pub Delirium
const DELIRIUM_EVENTS: Event[] = [
    {
        id: 'd-jue-1',
        name: 'Noche de Rock Clásico',
        description: 'Los mejores temas de rock de los 70s y 80s.',
        day: 'Jueves',
        photo: require('../assets/images/delirium.jpg'), // <-- PATH CORREGIDO A ../../
        time: '22:00h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-vie-1',
        name: 'Concierto Banda Local',
        description: 'Actuación en vivo de banda local de rock alternativo.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'), // <-- PATH CORREGIDO A ../../
        time: '23:30h',
        entryPrice: '5€ con consumición',
    },
    {
        id: 'd-vie-2',
        name: 'Sesión DJ Rock',
        description: 'DJ set con los hits del rock actual y clásico.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'), // <-- PATH CORREGIDO A ../../
        time: '01:00h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-sab-1',
        name: 'Fiesta Temática: Grunge',
        description: 'Revive la era del grunge con la mejor música.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'), // <-- PATH CORREGIDO A ../../
        time: '23:00h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-sab-2',
        name: 'DJ Set Hard Rock',
        description: 'Música potente para los amantes del hard rock y metal.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'), // <-- PATH CORREGIDO A ../../
        time: '01:30h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-dom-1',
        name: 'Domingo de Blues Acústico',
        description: 'Ambiente relajado con música blues en vivo.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'), // <-- PATH CORREGIDO A ../../
        time: '20:00h',
        entryPrice: 'Gratis',
    },
    // Añade más eventos para otros días si es necesario
];

// Días de la semana en el orden que queremos mostrarlos
const DAYS_OF_WEEK: ('Jueves' | 'Viernes' | 'Sábado' | 'Domingo')[] = ['Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function EventosDeliriumScreen() {
    // const router = useRouter(); // Si necesitas navegar

    // Función para manejar el botón "Apuntarse" (Placeholder)
    const handleJoinEvent = (event: Event) => {
        // Aquí iría la lógica real para apuntarse al evento en el backend
        // Necesitarías obtener el token del usuario (AsyncStorage o contexto)
        // y enviar el ID del evento al backend.
        Alert.alert('Apuntarse', `Te has interesado en: ${event.name} (${event.day})`);
        // Ejemplo de llamada API (requiere token y event.id real):
        // const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        // if (token) {
        //     fetch(`${API_BASE_URL}/usuarios/events/${event.id}/join`, {
        //         method: 'POST',
        //         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        //         // body: JSON.stringify({ userId: yourUserId }), // Si el backend necesita el ID en el body
        //     })
        //     .then(response => response.json())
        //     .then(data => {
        //         if (response.ok) {
        //             Alert.alert('Éxito', data.message || 'Te has apuntado.');
        //             // Actualizar UI si es necesario (ej. cambiar el botón)
        //         } else {
        //             Alert.alert('Error', data.error || 'No se pudo apuntar.');
        //         }
        //     })
        //     .catch(error => {
        //         console.error('Error joining event:', error);
        //         Alert.alert('Error', 'Error de conexión al intentar apuntarse.');
        //     });
        // } else {
        //      Alert.alert('Error', 'No hay sesión activa. Por favor, inicia sesión.');
        // }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
            <View style={styles.headerBar}>
                {/* Si quieres un botón de volver, añádelo aquí */}
                {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity> */}
                <Text style={styles.title}>Eventos Delirium</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {DAYS_OF_WEEK.map(day => {
                    // Filtrar eventos para el día actual
                    const eventsToday = DELIRIUM_EVENTS.filter(event => event.day === day);

                    // No mostrar la sección si no hay eventos para ese día
                    if (eventsToday.length === 0) {
                        return null;
                    }

                    return (
                        <View key={day} style={styles.daySection}>
                            {/* Título del día */}
                            <Text style={styles.dayTitle}>{day}</Text>

                            {/* Lista de eventos para este día */}
                            {eventsToday.map(event => (
                                <View key={event.id} style={styles.eventCard}>
                                    {/* Eliminado el componente Image */}
                                    {/* <Image source={event.photo} style={styles.eventImage} resizeMode="cover" /> */}

                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventName}>{event.name}</Text>
                                        {event.time && (
                                            <Text style={styles.eventDetail}>
                                                Hora: <Text>{event.time}</Text> {/* Texto anidado */}
                                            </Text>
                                        )}
                                        {event.entryPrice && (
                                            <Text style={styles.eventDetail}>
                                                Entrada: <Text>{event.entryPrice}</Text> {/* Texto anidado */}
                                            </Text>
                                        )}
                                        <Text style={styles.eventDescription}>{event.description}</Text>

                                        {/* Botón Apuntarse */}
                                        <TouchableOpacity
                                            style={styles.joinButton}
                                            onPress={() => handleJoinEvent(event)}
                                        >
                                            <Text style={styles.joinButtonText}>Apuntarse</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0d', // Fondo oscuro
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerBar: {
        height: 60,
        backgroundColor: '#1e1e1e', // Fondo de la barra superior
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centrar título
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a', // Borde inferior
        elevation: 5, // Sombra Android
        shadowColor: '#000', // Sombra iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // Estilo para un posible botón de volver
    // backButton: {
    //      position: 'absolute',
    //      left: 15,
    //      zIndex: 1, // Asegura que esté por encima del título
    // },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollViewContent: {
        padding: 15,
    },
    daySection: {
        marginBottom: 20, // Espacio entre secciones de días
    },
    dayTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#e14eca', // Color de acento para el día
        marginBottom: 10,
        borderBottomWidth: 2, // Línea debajo del día
        borderBottomColor: '#e14eca',
        paddingBottom: 5,
    },
    eventCard: {
        backgroundColor: '#1e1e1e', // Fondo de la tarjeta de evento
        borderRadius: 10,
        // Eliminado: overflow: 'hidden', // Ya no es necesario si no hay imagen que recortar
        marginBottom: 15, // Espacio entre tarjetas de evento
        elevation: 3, // Sombra Android
        shadowColor: '#000', // Sombra iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.62,
        paddingTop: 15, // Añadido padding superior para simular el espacio de la imagen
    },
    // Eliminado el estilo eventImage
    // eventImage: {
    //     width: '100%',
    //     height: 200, // Altura de la imagen
    //     resizeMode: 'cover',
    // },
    eventInfo: {
        padding: 0, // Ya hay padding en eventCard, o ajusta si necesitas más espacio interno
    },
    eventName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    eventDetail: {
        fontSize: 14,
        color: '#aaa', // Color para detalles secundarios
        marginBottom: 3,
    },
    eventDescription: {
        fontSize: 16,
        color: '#ccc', // Color para la descripción
        marginTop: 8,
        marginBottom: 15, // Espacio antes del botón
    },
    joinButton: {
        backgroundColor: '#f4524d', // Color de acento para el botón
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: 'flex-start', // Alinea el botón a la izquierda
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
