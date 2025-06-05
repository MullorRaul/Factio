// app/(tabs)/eventos_delirium.tsx
import React, { useState } from 'react';
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

interface Event {
    id: string;
    name: string;
    description: string;
    day: 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
    photo: any;
    // time?: string; // Removed
    // entryPrice?: string; // Removed
}

const DELIRIUM_EVENTS: Event[] = [
    {
        id: 'g-jue-1',
        name: 'Jueves Universitarios: Noche Latina',
        description: 'La fiesta perfecta para estudiantes con los mejores éxitos latinos y reggaeton. ¡Ofertas especiales en copas!',
        day: 'Jueves',
        photo: require('../assets/images/delirium.jpg'), // Assuming you'd change this to a Gaudi-specific image
        // time: '23:00h - 04:00h', // Removed
        // entryPrice: 'Gratis hasta la 1:00h (con carné universitario)', // Removed
    },
    {
        id: 'g-vie-1',
        name: 'Viernes Electrónico: Tech House Fusion',
        description: 'Line-up de DJs residentes y artistas invitados con lo último en tech house y deep house.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '23:30h - 06:00h', // Removed
        // entryPrice: '15€ con 1 copa', // Removed
    },
    {
        id: 'g-vie-2',
        name: 'Hit Factory: Top Chart Party',
        description: 'Todos los éxitos actuales del pop, hip-hop y R&B que no podrás parar de bailar.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '00:00h - 06:00h', // Removed
        // entryPrice: '10€ con consumición', // Removed
    },
    {
        id: 'g-sab-1',
        name: 'Noche de Club: Main Room Anthems',
        description: 'Los DJs más importantes de Gaudi pinchan los himnos del club que te harán vibrar hasta el amanecer.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '00:00h - 07:00h', // Removed
        // entryPrice: '20€ con 2 copas', // Removed
    },
    {
        id: 'g-sab-2',
        name: 'Urban Beats: Hip-Hop & R&B',
        description: 'La mejor selección de ritmos urbanos, desde hip-hop clásico a los últimos éxitos de R&B.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '01:00h - 06:00h', // Removed
        // entryPrice: '12€ con consumición', // Removed
    },
    {
        id: 'g-dom-1',
        name: 'Sunday Closing: Chill & House',
        description: 'Cierra la semana con una sesión más relajada de deep house y soulful grooves. Perfecto para la última copa.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '22:00h - 03:00h', // Removed
        // entryPrice: 'Gratis', // Removed
    },
    {
        id: 'g-dom-2',
        name: 'Fiesta de Temática Sorpresa',
        description: 'Cada domingo, una nueva sorpresa: desde máscaras a fluorescencia. ¡Ven y descúbrelo!',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '23:00h - 04:00h', // Removed
        // entryPrice: '5€', // Removed
    },
];

const DAYS_OF_WEEK: ('Jueves' | 'Viernes' | 'Sábado' | 'Domingo')[] = ['Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function EventosDeliriumScreen() {
    const router = useRouter();
    // State to keep track of joined events. Using a Set for efficient lookups.
    const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set());

    const handleToggleJoinEvent = (event: Event) => {
        const newJoinedEvents = new Set(joinedEvents);
        if (newJoinedEvents.has(event.id)) {
            newJoinedEvents.delete(event.id);
            Alert.alert('Desapuntado', `Te has desapuntado de: ${event.name}`);
        } else {
            newJoinedEvents.add(event.id);
            Alert.alert('Apuntado', `Te has apuntado a: ${event.name}`);
        }
        setJoinedEvents(newJoinedEvents);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {DAYS_OF_WEEK.map(day => {
                    const eventsToday = DELIRIUM_EVENTS.filter(event => event.day === day);

                    if (eventsToday.length === 0) {
                        return null;
                    }

                    return (
                        <View
                            key={day}
                            style={[
                                styles.daySection,
                                day === 'Jueves' && { marginTop: 30 }
                            ]}
                        >
                            <Text style={styles.dayTitle}>{day}</Text>

                            {eventsToday.map(event => {
                                const isJoined = joinedEvents.has(event.id);
                                return (
                                    <View key={event.id} style={styles.eventCard}>
                                        <View style={styles.eventInfo}>
                                            <Text style={styles.eventName}>{event.name}</Text>
                                            <Text style={styles.eventDescription}>{event.description}</Text>

                                            <View style={styles.buttonRow}>
                                                <TouchableOpacity
                                                    style={isJoined ? styles.leaveButton : styles.joinButton}
                                                    onPress={() => handleToggleJoinEvent(event)}
                                                >
                                                    <Text style={styles.joinButtonText}>
                                                        {isJoined ? 'Desapuntarse' : 'Apuntarse'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
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
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
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
    leaveButton: {
        backgroundColor: '#888',
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
});