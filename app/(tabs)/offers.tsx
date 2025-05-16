// app/(tabs)/offers.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    ImageBackground,
    TouchableOpacity, // Necesario para el botón
    Alert, // Necesario si decides usar alertas para pubs sin eventos
} from 'react-native';
// LinearGradient es necesario si lo sigues usando en los estilos
import { LinearGradient } from 'expo-linear-gradient';
// useRouter es necesario para la navegación a otras pantallas
import { useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

interface PubAd {
    id: string;
    image: any; // Consider using a more specific type if possible (e.g., ImageSourcePropType)
    name: string;
    price?: string;
    location: string;
    musicType: string;
    entryPrice?: string;
    // Puedes añadir un campo para el ID del evento real si lo obtienes del backend
    // eventId: number;
    // Añadimos un campo para la ruta de eventos específica si es necesario
    // eventRoute?: string; // Ya no es estrictamente necesario si navegamos por nombre
}

// Datos de ejemplo (Hardcoded por ahora)
// NOTA: En una aplicación real, cargarías estos datos desde tu backend.
const DATA: PubAd[] = [
    {
        id: '1',
        image: require('../../assets/images/delirium.jpg'),
        name: 'Pub Delirium',
        price: '3€ cerveza',
        location: 'Centro Alcoy',
        musicType: 'Rock',
        entryPrice: 'Gratis',
        // eventId: 1, // Ejemplo de cómo podrías tener un ID real
        // eventRoute: '/eventos_delirium', // La ruta real es solo /eventos_delirium
    },
    {
        id: '2',
        image: require('../../assets/images/Gaudi.jpg'),
        name: 'Gaudi',
        price: '5€ copa',
        location: 'Polígono',
        musicType: 'Electrónica',
        entryPrice: '5€ con copa',
        // eventId: 2, // Ejemplo de cómo podrías tener un ID real
        // eventRoute: '/eventos_gaudi', // La ruta real es solo /eventos_gaudi
    },
    // más pubs...
];

export default function OffersScreen() {
    // useRouter es necesario para la navegación a otras pantallas
    const router = useRouter();

    // Función para manejar el botón "Ver Eventos Semanales"
    const handleViewEvents = (pub: PubAd) => {
        // Navegación basada en el nombre del pub.
        // **CORREGIDO:** Las rutas son directas desde la raíz '/' ya que los archivos
        // eventos_delirium.tsx y eventos_gaudi.tsx están directamente en la carpeta `app`.
        if (pub.name === 'Pub Delirium') {
            // Navega a la ruta específica de Delirium.
            router.push('/eventos_delirium' as any); // Ruta corregida
        } else if (pub.name === 'Gaudi') {
            // Navega a la ruta específica de Gaudi.
            router.push('/eventos_gaudi' as any); // Ruta corregida
        } else {
            // Si el pub no tiene una ruta de evento específica definida aquí, muestra una alerta.
            Alert.alert('Info', `No hay eventos semanales definidos para ${pub.name}.`);
            console.warn(`No specific event route found for ${pub.name}.`);
        }

        // Alternativa más robusta (si tuvieras una pantalla de evento genérica y un ID):
        // if (pub.eventId) {
        //      router.push(`/events/${pub.eventId}` as any); // Navega a una pantalla de detalle de evento genérica usando el ID
        // } else {
        //      Alert.alert('Info', `No hay eventos semanales definidos para ${pub.name}.`);
        // }
    };

    const renderItem = ({ item }: { item: PubAd }) => (
        <View style={styles.cardContainer}>
            <ImageBackground
                source={item.image}
                style={styles.imageBackground}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradientOverlay}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.pubName}>{item.name}</Text>
                    <Text style={styles.pubDetail}>{item.location} • {item.musicType}</Text>
                    {item.price && <Text style={styles.pubDetail}>Precio bebida: {item.price}</Text>}
                    {item.entryPrice && <Text style={styles.pubDetail}>Entrada: {item.entryPrice}</Text>}

                    {/* Botón "Ver Eventos Semanales" */}
                    <TouchableOpacity
                        style={styles.viewEventsButton}
                        onPress={() => handleViewEvents(item)} // Llama a la función de navegación
                    >
                        <Text style={styles.viewEventsButtonText}>Ver Eventos Semanales</Text> {/* Texto del botón */}
                    </TouchableOpacity>

                </View>
            </ImageBackground>
        </View>
    );

    return (
        <FlatList
            data={DATA} // Usarías datos reales del backend aquí
            keyExtractor={item => item.id}
            renderItem={renderItem}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={height}
            snapToAlignment="start"
        />
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: width,
        height: height,
        backgroundColor: '#000',
    },
    imageBackground: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    infoContainer: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        paddingBottom: 10,
    },
    pubName: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    pubDetail: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 4,
    },
    viewEventsButton: {
        marginTop: 16,
        backgroundColor: '#e14eca',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    viewEventsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
