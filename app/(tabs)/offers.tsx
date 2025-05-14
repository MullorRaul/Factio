// app/(tabs)/offers.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    ImageBackground,
    TouchableOpacity, // Keep if you have other touchables, remove if only for the old "back"
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // Still useful for other navigation if needed

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
        // Assuming assets folder is at the root of your project (e.g., my-app/assets)
        // If offers.tsx was in app/, path was ../assets. Now from app/(tabs)/, it's ../../assets
        image: require('../../assets/images/delirium.jpg'),
        name: 'Pub Delirium',
        price: '3€ cerveza',
        offers: '2x1 hasta las 12',
        location: 'Centro Alcoy',
        musicType: 'Rock',
        entryPrice: 'Gratis',
    },
    {
        id: '2',
        image: require('../../assets/images/Gaudi.jpg'),
        name: 'Gaudi',
        price: '5€ copa',
        offers: 'Happy Hour 4–6am',
        location: 'Polígono',
        musicType: 'Electrónica',
        entryPrice: '5€ con copa',
    },
    // más pubs...
];

export default function OffersScreen() { // Renamed from PubReelScreen
    const router = useRouter(); // Keep for potential future internal navigation

    const renderItem = ({ item }: { item: PubAd }) => (
        <View style={styles.cardContainer}>
            <ImageBackground
                source={item.image}
                style={styles.imageBackground}
                resizeMode="cover" // Good practice for background images
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
                    {/* The 'Volver' button might not be needed here if navigation is handled by tabs
                        If you keep it, ensure its behavior makes sense in the tab context.
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()} // This would navigate back in the stack, if any
                    >
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                    */}
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
            snapToInterval={height} // Be mindful of tab bar height here
            snapToAlignment="start"
            // The FlatList will take the height given by the Tab Navigator's screen area
        />
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        width: width,
        height: height, // This makes each item take the full screen height.
                        // The tab bar will overlay the bottom part or the content area will be adjusted.
                        // Expo Router's Tabs layout usually handles the content area correctly.
        backgroundColor: '#000',
    },
    imageBackground: {
        width: '100%', // Use '100%' for flexibility
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
        bottom: 60, // Increased slightly to ensure it's above a typical tab bar
        left: 20,
        right: 20,
        paddingBottom: 10, // Add some padding at the very bottom of the text content
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
        marginBottom: 4, // Added for better spacing
    },
    offerText: {
        marginTop: 4,
        fontSize: 18,
        color: '#ffd700', // Gold color for offers
        fontWeight: '600',
    },
    // backButton and backButtonText styles are removed if the button is removed
    // backButton: {
    //     marginTop: 16,
    //     alignSelf: 'flex-start',
    //     backgroundColor: 'rgba(0,0,0,0.5)',
    //     paddingVertical: 8,
    //     paddingHorizontal: 16,
    //     borderRadius: 8,
    // },
    // backButtonText: {
    //     color: '#fff',
    //     fontSize: 16,
    // },
});
