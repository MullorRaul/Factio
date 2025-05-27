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
    photo: any; // Assuming you'd have specific images for Gavana events
    time?: string;
    entryPrice?: string;
}

const DELIRIUM_EVENTS: Event[] = [
    {
        id: 'gav-jue-1',
        name: 'Jueves Techno Universitario',
        description: 'La noche universitaria más potente con sets de techno underground y minimal. ¡Ofertas en copas para estudiantes toda la noche!',
        day: 'Jueves',
        photo: require('../assets/images/delirium.jpg'), // Placeholder, replace with Gavana image
        time: '23:00h - 04:00h',
        entryPrice: 'Gratis con carné universitario / 10€ sin carné (incluye consumición)',
    },
    {
        id: 'gav-vie-1',
        name: 'Viernes Trance & Progressive',
        description: 'Un viaje eufórico a través de los sonidos del trance melódico y progressive house. Eleva tus sentidos con visuales envolventes.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        time: '23:30h - 06:00h',
        entryPrice: '15€ con 1 consumición',
    },
    {
        id: 'gav-vie-2',
        name: 'Dark Room: Acid & Industrial Techno',
        description: 'Sumérgete en la oscuridad con los ritmos contundentes del acid y el techno industrial. Solo para los más atrevidos.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        time: '01:00h - 07:00h',
        entryPrice: '20€ con 1 consumición',
    },
    {
        id: 'gav-sab-1',
        name: 'Sábado Mainstage: EDM & Big Room Anthems',
        description: 'La noche cumbre de Gavana con los DJs más explosivos y los himnos del EDM y Big Room que te harán vibrar. ¡Show de luces y CO2 garantizado!',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        time: '00:00h - 07:00h',
        entryPrice: '25€ con 2 consumiciones',
    },
    {
        id: 'gav-sab-2',
        name: 'Minimal & Deep Tech Showcase',
        description: 'Explora las profundidades del minimal y el deep tech con una selección exquisita de artistas locales e invitados. Un ambiente más íntimo y sofisticado.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        time: '01:30h - 06:00h',
        entryPrice: 'Incluido con la entrada general',
    },
    {
        id: 'gav-dom-1',
        name: 'Sunday Chill Out: Downtempo & Ambient',
        description: 'Termina el fin de semana con una sesión relajada de downtempo y ambient electrónico. Perfecta para conversar y disfrutar de los últimos beats.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        time: '22:00h - 03:00h',
        entryPrice: '10€ con 1 consumición',
    },
    {
        id: 'gav-dom-2',
        name: 'Gavana Closing Set: Classic House Revival',
        description: 'Un viaje nostálgico a los orígenes del house con los clásicos que marcaron una era. La forma perfecta de despedir el fin de semana.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        time: '00:00h - 04:00h',
        entryPrice: 'Gratis para los que lleguen antes de la 1:00h',
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
                        <View key={day} style={styles.daySection}>
                            <Text style={styles.dayTitle}>{day}</Text>

                            {eventsToday.map(event => {
                                const isJoined = joinedEvents.has(event.id);
                                return (
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