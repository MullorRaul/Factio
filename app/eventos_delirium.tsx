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
    photo: any; // Assuming you'd have specific images for Delirium events
    // time?: string; // Removed
    // entryPrice?: string; // Removed
}

const DELIRIUM_EVENTS: Event[] = [
    {
        id: 'del-jue-1',
        name: 'Jueves de Micro Abierto: Indie & Acústico',
        description: 'Una noche íntima para nuevos talentos y amantes de la música indie, folk y acústica. Trae tu instrumento o simplemente disfruta.',
        day: 'Jueves',
        photo: require('../assets/images/delirium.jpg'),
        // time: '21:00h', // Removed
        // entryPrice: 'Gratis', // Removed
    },
    {
        id: 'del-vie-1',
        name: 'Viernes de Rock Alternativo en Vivo',
        description: 'Bandas locales y nacionales que te harán vibrar con los mejores temas de rock alternativo, post-punk y grunge.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '22:30h', // Removed
        // entryPrice: '5€ con consumición', // Removed
    },
    {
        id: 'del-vie-2',
        name: 'Sesión DJ: New Wave & Synth Pop',
        description: 'DJ set que te transportará a los 80s y 90s con la mejor selección de new wave, synth pop y gothic rock.',
        day: 'Viernes',
        photo: require('../assets/images/delirium.jpg'),
        // time: '00:30h', // Removed
        // entryPrice: 'Gratis', // Removed
    },
    {
        id: 'del-sab-1',
        name: 'Noche Gótica: Dark Electro & Industrial',
        description: 'Adéntrate en los sonidos más oscuros del dark electro, industrial y EBM. ¡Vístete para la ocasión!',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '23:00h', // Removed
        // entryPrice: 'Gratis', // Removed
    },
    {
        id: 'del-sab-2',
        name: 'Concierto Principal: Punk & Hardcore',
        description: 'La banda más potente de la semana sube al escenario para una descarga de punk rock y hardcore que no te dejará indiferente.',
        day: 'Sábado',
        photo: require('../assets/images/delirium.jpg'),
        // time: '01:00h', // Removed
        // entryPrice: '8€', // Removed
    },
    {
        id: 'del-dom-1',
        name: 'Domingo de Blues & Cerveza Artesana',
        description: 'Relaja el cuerpo y el alma con la mejor música blues en vivo y nuestra exclusiva selección de cervezas artesanales.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '20:00h', // Removed
        // entryPrice: 'Gratis', // Removed
    },
    {
        id: 'del-dom-2',
        name: 'Proyección: Cortometrajes de Culto',
        description: 'Una selección de cortometrajes independientes y de culto, acompañados de debate y buen ambiente.',
        day: 'Domingo',
        photo: require('../assets/images/delirium.jpg'),
        // time: '22:00h', // Removed
        // entryPrice: 'Gratis', // Removed
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