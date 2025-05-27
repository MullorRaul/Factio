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
        id: 'gaudi-jue-1',
        name: 'Jueves Universitario: Electro Latin Beats',
        description: 'La mejor noche para los universitarios. Hits latinos y electrónicos que te harán bailar hasta el amanecer. ¡Ofertas especiales en copas!',
        day: 'Jueves',
        photo: require('../assets/images/delirium.jpg'), // Placeholder, replace with Gaudi image
        // time: '23:00h - 04:00h', // Removed
        // entryPrice: 'Gratis con carné universitario / 8€ sin carné (incluye consumición)', // Removed
    },
    {
        id: 'gaudi-vie-1',
        name: 'Viernes de Fusion: Pop, Reggaeton & R&B',
        description: 'Una mezcla explosiva de los géneros más populares. El ambiente perfecto para arrancar el fin de semana con la pista llena.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '23:30h - 06:00h', // Removed
        // entryPrice: '15€ con 1 consumición', // Removed
    },
    {
        id: 'gaudi-vie-2',
        name: 'Gaudi Clubbing: Techno & House Grooves',
        description: 'Para los amantes de los sonidos más puros. Sesión de nuestros DJs residentes con lo mejor del techno y house contemporáneo.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '01:00h - 07:00h', // Removed
        // entryPrice: '20€ con 1 consumición', // Removed
    },
    {
        id: 'gaudi-sab-1',
        name: 'Sábado Noche Épica: Mainstream Hits',
        description: 'La noche grande de Gaudi. Todos los éxitos comerciales del momento, luces espectaculares y una energía inigualable. ¡No te lo puedes perder!',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '00:00h - 07:00h', // Removed
        // entryPrice: '25€ con 2 consumiciones', // Removed
    },
    {
        id: 'gaudi-sab-2',
        name: 'Urban Beats: Hip-Hop & Trap Takeover',
        description: 'Una sala dedicada a los ritmos urbanos más potentes. Desde el trap más actual hasta los clásicos del hip-hop. ¡Prepárate para perrear!',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '01:30h - 06:00h', // Removed
        // entryPrice: 'Incluido con la entrada general', // Removed
    },
    {
        id: 'gaudi-dom-1',
        name: 'Sunday Funday: Comercial & Remixes',
        description: 'Estira el fin de semana con una sesión divertida de éxitos comerciales y remixes exclusivos. El ambiente perfecto para cerrar con buena vibra.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '22:00h - 03:00h', // Removed
        // entryPrice: '10€ con 1 consumición', // Removed
    },
    {
        id: 'gaudi-dom-2',
        name: 'Noche de Despedida: Old School Hits',
        description: 'Un viaje nostálgico por los éxitos de los 90s y 2000s. Perfecta para recordar viejos tiempos y cantar a pleno pulmón.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '00:00h - 04:00h', // Removed
        // entryPrice: 'Gratis para chicas hasta la 1:00h', // Removed
    },
];

const DAYS_OF_WEEK: ('Jueves' | 'Viernes' | 'Sábado' | 'Domingo')[] = ['Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function EventosDeliriumScreen() {
    const router = useRouter();
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

    const handleFactioPress = (event: Event) => {
        if (event.day === 'Jueves') {
            router.push(`/match/${event.id}`);
        }
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
                                day === 'Jueves' && { marginTop: 30 } // Añadido para bajar la sección del jueves
                            ]}
                        >
                            <Text style={styles.dayTitle}>{day}</Text>

                            {eventsToday.map(event => {
                                const isJoined = joinedEvents.has(event.id);
                                return (
                                    <View key={event.id} style={styles.eventCard}>
                                        <View style={styles.eventInfo}>
                                            <Text style={styles.eventName}>{event.name}</Text>
                                            {/* 'time' and 'entryPrice' display are removed as per previous requests */}
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
    eventDetail: { // This style is now unused but kept for reference if needed
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
        backgroundColor: '#f4524d', // Red for "Apuntarse"
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 10,
    },
    leaveButton: {
        backgroundColor: '#888', // Grey for "Desapuntarse"
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