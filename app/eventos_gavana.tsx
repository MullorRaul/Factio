// app/(tabs)/eventos_delirium.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    StatusBar,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// const API_BASE_URL = 'http://192.168.1.142:3001';
// const AUTH_TOKEN_KEY = 'userToken';

interface Event {
    id: string;
    name: string;
    description: string;
    day: 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
    photo: any;
    time?: string;
    entryPrice?: string;
}

const DELIRIUM_EVENTS: Event[] = [
    {
        id: 'd-jue-1',
        name: 'Noche de Rock Clásico',
        description: 'Los mejores temas de rock de los 70s y 80s.',
        day: 'Jueves',
        photo: require('../assets/images/delirium.jpg'),
        time: '22:00h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-vie-1',
        name: 'Concierto Banda Local',
        description: 'Actuación en vivo de banda local de rock alternativo.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        time: '23:30h',
        entryPrice: '5€ con consumición',
    },
    {
        id: 'd-vie-2',
        name: 'Sesión DJ Rock',
        description: 'DJ set con los hits del rock actual y clásico.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        time: '01:00h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-sab-1',
        name: 'Fiesta Temática: Grunge',
        description: 'Revive la era del grunge con la mejor música.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        time: '23:00h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-sab-2',
        name: 'DJ Set Hard Rock',
        description: 'Música potente para los amantes del hard rock y metal.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        time: '01:30h',
        entryPrice: 'Gratis',
    },
    {
        id: 'd-dom-1',
        name: 'Domingo de Blues Acústico',
        description: 'Ambiente relajado con música blues en vivo.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        time: '20:00h',
        entryPrice: 'Gratis',
    },
];

const DAYS_OF_WEEK: ('Jueves' | 'Viernes' | 'Sábado' | 'Domingo')[] = ['Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function EventosDeliriumScreen() {
    const router = useRouter();

    const handleJoinEvent = (event: Event) => {
        Alert.alert('Apuntarse', `Te has interesado en: ${event.name} (${event.day})`);
    };

    const handleFactioPress = (event: Event) => {
        if (event.day === 'Jueves') {
            router.push(`/match/${event.id}`);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

            {/* --- ELIMINADO: Barra de encabezado personalizada --- */}
            {/* <View style={styles.headerBar}>
                <Text style={styles.title}>Eventos Delirium</Text>
            </View> */}
            {/* --- FIN ELIMINADO --- */}

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {DAYS_OF_WEEK.map(day => {
                    const eventsToday = DELIRIUM_EVENTS.filter(event => event.day === day);

                    if (eventsToday.length === 0) {
                        return null;
                    }

                    return (
                        <View key={day} style={styles.daySection}>
                            <Text style={styles.dayTitle}>{day}</Text>

                            {eventsToday.map(event => (
                                <View key={event.id} style={styles.eventCard}>
                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventName}>{event.name}</Text>
                                        {event.time && (
                                            <Text style={styles.eventDetail}>
                                                Hora: {event.time}
                                            </Text>
                                        )}
                                        {event.entryPrice && (
                                            <Text style={styles.eventDetail}>
                                                Entrada: {event.entryPrice}
                                            </Text>
                                        )}
                                        <Text style={styles.eventDescription}>{event.description}</Text>

                                        <View style={styles.buttonRow}>
                                            <TouchableOpacity
                                                style={styles.joinButton}
                                                onPress={() => handleJoinEvent(event)}
                                            >
                                                <Text style={styles.joinButtonText}>Apuntarse</Text>
                                            </TouchableOpacity>

                                            {event.day === 'Jueves' ? (
                                                <TouchableOpacity
                                                    style={styles.factioButton}
                                                    onPress={() => handleFactioPress(event)}
                                                >
                                                    <Text style={styles.factioButtonText}>Factio</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.factioPlaceholder}>
                                                    <Text style={styles.factioPlaceholderText}>Próximamente...</Text>
                                                </View>
                                            )}
                                        </View>
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
        backgroundColor: '#0d0d0d',
        // Mantener este padding top para el espacio de la barra de estado
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    // --- ELIMINADO: Estilo de la barra de encabezado personalizada ---
    // headerBar: {
    //     height: 60,
    //     backgroundColor: '#1e1e1e',
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     paddingHorizontal: 15,
    //     borderBottomWidth: 1,
    //     borderBottomColor: '#2a2a2a',
    //     elevation: 5,
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.25,
    //     shadowRadius: 3.84,
    // },
    // --- ELIMINADO: Estilo del título personalizado ---
    // title: {
    //     color: '#fff',
    //     fontSize: 20,
    //     fontWeight: 'bold',
    // },

    scrollViewContent: {
        padding: 15,
    },
    daySection: {
        marginBottom: 20,
    },
    dayTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#e14eca',
        marginBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#e14eca',
        paddingBottom: 5,
    },
    eventCard: {
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.62,
        paddingTop: 15,
    },
    eventInfo: {
        padding: 15,
    },
    eventName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    eventDetail: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 3,
    },
    eventDescription: {
        fontSize: 16,
        color: '#ccc',
        marginTop: 8,
        marginBottom: 15,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 10,
        alignSelf: 'flex-start',
        width: '100%',
        paddingHorizontal: 0,
    },
    joinButton: {
        backgroundColor: '#f4524d',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    factioButton: {
        backgroundColor: '#5a287d',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    factioButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    factioPlaceholder: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    factioPlaceholderText: {
        color: '#888',
        fontSize: 16,
        fontWeight: 'bold',
    },
});