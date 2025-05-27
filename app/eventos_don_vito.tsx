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
    photo: any; // Assuming you'd have specific images for Don Vito events
    // time?: string; // Removed
    // entryPrice?: string; // Removed
}

const DELIRIUM_EVENTS: Event[] = [
    {
        id: 'dv-jue-1',
        name: 'Ladies Night: Ritmos Calientes',
        description: 'La noche donde las mujeres son las protagonistas. Reggaeton, dembow y hip-hop. ¡Copas gratis para ellas hasta la 1:00h!',
        day: 'Jueves',
        photo: require('../assets/images/delirium.jpg'), // Placeholder, replace with Don Vito image
        // time: '23:00h - 04:00h', // Removed
        // entryPrice: 'Gratis chicas hasta 1:00h / 15€ chicos con copa', // Removed
    },
    {
        id: 'dv-vie-1',
        name: 'Viernes de Pasión: Latin & Salsa Sensual',
        description: 'Una noche para sentir el fuego latino. Salsa, bachata, merengue y una mezcla picante de reggaeton clásico. ¡Clases de baile a las 23:30h!',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '22:00h - 05:00h', // Removed
        // entryPrice: '15€ con copa', // Removed
    },
    {
        id: 'dv-vie-2',
        name: 'After Dark: Secret House Session',
        description: 'Cuando las luces bajan, la música se pone seria. Deep house y tech house con toques sensuales hasta el amanecer.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '01:00h - 06:00h', // Removed
        // entryPrice: '20€ con copa', // Removed
    },
    {
        id: 'dv-sab-1',
        name: 'Sábado V.I.P.: Decadencia y Glamour',
        description: 'La noche más exclusiva. House comercial, R&B y los hits más sofisticados para una clientela selecta. Reservas de mesas disponibles.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '23:30h - 07:00h', // Removed
        // entryPrice: '25€ con 2 copas (entrada anticipada)', // Removed
    },
    {
        id: 'dv-sab-2',
        name: 'Red Room: Burlesque & Cabaret Show',
        description: 'Déjate seducir por un show de burlesque y cabaret en vivo que encenderá la noche. Actuaciones cada hora.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '00:30h - 02:30h', // Removed
        // entryPrice: 'Incluido con la entrada general', // Removed
    },
    {
        id: 'dv-dom-1',
        name: 'Domingo de Conexiones: Speed Dating Nocturno',
        description: 'Busca tu match en un ambiente divertido y sin presiones. Sesiones de speed dating seguidas de una fiesta para socializar.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '21:00h (speed dating) - 03:00h (fiesta)', // Removed
        // entryPrice: '10€ (incluye participación y 1 copa)', // Removed
    },
    {
        id: 'dv-dom-2',
        name: 'Closing Affair: Smooth R&B & Neo-Soul',
        description: 'Termina la semana con elegancia. Ritmos sensuales de R&B y neo-soul que invitan a la conversación y el coqueteo.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '23:00h - 04:00h', // Removed
        // entryPrice: '10€ con consumición', // Removed
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
            // For Don Vito, the "Factio" button on Thursday might directly link to the "Ladies Night" or a dedicated dating feature if you have one.
            // For now, it will link to the generic match page for that event ID.
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