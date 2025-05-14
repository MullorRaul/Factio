import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    ImageBackground,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

interface PubAd {
    id: string;
    image: any;
    name: string;
    price?: string;
    offers?: string;
    location: string;
    musicType: string;
    entryPrice?: string;
}

const DATA: PubAd[] = [
    {
        id: '1',
        image: require('../assets/images/delirium.jpg'),
        name: 'Pub Delirium',
        price: '3€ cerveza',
        offers: '2x1 hasta las 12',
        location: 'Centro Alcoy',
        musicType: 'Rock',
        entryPrice: 'Gratis',
    },
    {
        id: '2',
        image: require('../assets/images/Gaudi.jpg'),
        name: 'Gaudi',
        price: '5€ copa',
        offers: 'Happy Hour 4–6am',
        location: 'Polígono',
        musicType: 'Electrónica',
        entryPrice: '5€ con copa',
    },
    // más pubs...
];

export default function PubReelScreen() {
    const router = useRouter();

    const renderItem = ({ item }: { item: PubAd }) => (
        <View style={styles.cardContainer}>
            <ImageBackground
                source={item.image}
                style={styles.imageBackground}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradientOverlay}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.pubName}>{item.name}</Text>
                    <Text style={styles.pubDetail}>{item.location} • {item.musicType}</Text>
                    {item.price && <Text style={styles.pubDetail}>Precio bebida: {item.price}</Text>}
                    {item.offers && <Text style={styles.offerText}>{item.offers}</Text>}
                    {item.entryPrice && <Text style={styles.pubDetail}>Entrada: {item.entryPrice}</Text>}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
    );

    return (
        <FlatList
            data={DATA}
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
        backgroundColor: '#000', // fondo negro mientras carga
    },
    imageBackground: {
        width: width,
        height: height,
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%', // gradiente en la mitad inferior
    },
    infoContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
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
    },
    offerText: {
        marginTop: 4,
        fontSize: 18,
        color: '#ffd700',
        fontWeight: '600',
    },
    backButton: {
        marginTop: 16,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
