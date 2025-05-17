/* app/(tabs)/offers.tsx */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    ImageBackground,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height, width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const AUTO_SCROLL_DURATION = 13000;

interface AgeBucket { age: number; count: number; }
interface ReelEvent {
    id: string;
    image: any;
    name: string;
    date: string;
    aforo: number;
    occupied: number;
    genderRatio: { male: number; female: number };
    musicStyle: string;
    dailyOffer: string;
    theme: string;
    ageDistribution: AgeBucket[];
}

const MOCK_REELS: ReelEvent[] = [
    {
        id: '1', image: require('../../assets/images/delirium.jpg'), name: 'Pub Delirium', date: 'May 20, 2025',
        aforo: 200, occupied: 120, genderRatio: { male: 65, female: 35 },
        musicStyle: 'Rock', dailyOffer: '2x1 cervezas', theme: 'Semáforo',
        ageDistribution: [
            { age: 18, count: 5 }, { age: 20, count: 15 }, { age: 22, count: 30 },
            { age: 24, count: 40 }, { age: 26, count: 20 }, { age: 28, count: 10 },
        ],
    },
    {
        id: '2', image: require('../../assets/images/Gaudi.jpg'), name: 'Gaudi', date: 'May 22, 2025',
        aforo: 150, occupied: 85, genderRatio: { male: 50, female: 50 },
        musicStyle: 'Electrónica', dailyOffer: 'Copa 4€', theme: 'Cartas',
        ageDistribution: [
            { age: 19, count: 2 }, { age: 21, count: 10 }, { age: 23, count: 25 },
            { age: 25, count: 30 }, { age: 27, count: 15 }, { age: 29, count: 3 },
        ],
    },
    {
        id: '3', image: require('../../assets/images/don_vito.jpeg'), name: 'Don Vito', date: 'May 24, 2025',
        aforo: 100, occupied: 40, genderRatio: { male: 60, female: 40 },
        musicStyle: 'Variado', dailyOffer: 'Combo 5€', theme: 'Retro',
        ageDistribution: [
            { age: 18, count: 1 }, { age: 20, count: 5 }, { age: 22, count: 10 },
            { age: 24, count: 15 }, { age: 26, count: 8 }, { age: 28, count: 1 },
        ],
    },
];

export default function OffersScreen() {
    const router = useRouter();
    const [reels, setReels] = useState<ReelEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<FlatList<ReelEvent>>(null);
    const timer = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setReels(MOCK_REELS);
        setLoading(false);
    }, []);

    useEffect(() => {
        timer.setValue(0);
        Animated.timing(timer, {
            toValue: width,
            duration: AUTO_SCROLL_DURATION,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished && currentIndex < reels.length - 1) {
                scrollRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
            }
        });
    }, [currentIndex, reels.length]);

    const onViewRef = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index);
    });
    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

    const renderReel = ({ item }: { item: ReelEvent }) => {
        const aforoPercent = (item.occupied / item.aforo) * 100;
        const totalAge = item.ageDistribution.reduce((s, b) => s + b.count, 0);
        const ages = item.ageDistribution.map(b => b.age);
        const minAge = Math.min(...ages);
        const maxAge = Math.max(...ages);
        const avgAge = item.ageDistribution.reduce((sum, b) => sum + b.age * b.count, 0) / totalAge;
        const needlePos = ((avgAge - minAge) / (maxAge - minAge)) * 100;

        return (
            <View style={styles.cardContainer}>
                <ImageBackground source={item.image} style={styles.imageBackground}>
                    <View style={styles.overlay} />

                    <View style={styles.infoContainer}>
                        <Text style={styles.title}>{item.name}</Text>
                        <Text style={styles.subtitle}>{item.date}</Text>

                        {/* Aforo */}
                        <View style={styles.statRow}>
                            <MaterialCommunityIcons name="account-group" size={20} color="#aaa" />
                            <Text style={styles.statText}>{item.occupied}/{item.aforo}</Text>
                        </View>
                        <View style={styles.barBackground}><View style={[styles.barFill, { width: `${aforoPercent}%` }]} /></View>

                        {/* Género */}
                        <View style={styles.statRow}>
                            <MaterialCommunityIcons name="gender-male" size={20} color="#4ea8de" />
                            <Text style={styles.statText}>{item.genderRatio.male}%</Text>
                            <MaterialCommunityIcons name="gender-female" size={20} color="#de4eae" style={{ marginLeft:20 }} />
                            <Text style={styles.statText}>{item.genderRatio.female}%</Text>
                        </View>
                        <View style={styles.barBackground}>
                            <View style={[styles.barFillMale,{width:`${item.genderRatio.male}%`}]} />
                            <View style={[styles.barFillFemale,{width:`${item.genderRatio.female}%`}]} />
                        </View>

                        {/* Edades */}
                        <Text style={styles.detail}>Edades: {minAge} - {maxAge} años</Text>
                        <View style={styles.ageBarBackground}>
                            {item.ageDistribution.map(b => {
                                const pct = (b.count / totalAge) * 100;
                                const opacity = b.count / Math.max(...item.ageDistribution.map(x => x.count));
                                return <View key={b.age} style={[styles.ageBarSegment, { width: `${pct}%`, backgroundColor: `rgba(222,78,174,${opacity})` }]} />;
                            })}
                            {/* Needle indicator */}
                            <View style={[styles.ageNeedle, { left: `${needlePos}%` }]} />
                        </View>
                        <Text style={styles.detail}>Edad media: {avgAge.toFixed(1)} años</Text>

                        {/* Otros detalles */}
                        <Text style={styles.detail}>🎶 {item.musicStyle}</Text>
                        <Text style={styles.detail}>🥂 {item.dailyOffer}</Text>
                        <Text style={styles.detail}>🎉 {item.theme}</Text>

                        {/* Botones */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.mapButton} onPress={()=>{}}>
                                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#aaa" />
                                <Text style={styles.buttonText}>Cómo llegar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.factioButton} onPress={()=>router.push({
                                     pathname: '/match/[eventId]',
                                     params: { eventId: item.id }
                                   })}>
                                <Text style={styles.buttonText}>Factio 🔥</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Timer abajo */}
                    <Animated.View style={[styles.timerContainer, { bottom: TAB_BAR_HEIGHT, width: timer }]} />
                </ImageBackground>
            </View>
        );
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#e14eca"/></View>;

    return (
        <FlatList
            ref={scrollRef}
            data={reels}
            keyExtractor={i=>i.id}
            renderItem={renderReel}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={height}
            snapToAlignment="start"
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfigRef.current}
        />
    );
}

const styles = StyleSheet.create({
    cardContainer: { width, height },
    imageBackground: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    infoContainer: { position: 'absolute', bottom: TAB_BAR_HEIGHT + 20, left: 0, right: 0, padding: 20 },
    title: { fontSize: 28, color: '#eee', fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#bbb', marginVertical: 8 },
    statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    statText: { color: '#ddd', fontSize: 13, marginLeft: 6 },
    barBackground: { width: '100%', height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
    barFill: { height: '100%', backgroundColor: '#e14eca' },
    barFillMale: { height: '100%', backgroundColor: '#4ea8de', position: 'absolute', left: 0 },
    barFillFemale: { height: '100%', backgroundColor: '#de4eae', position: 'absolute', right: 0 },
    detail: { color: '#ccc', fontSize: 13, marginTop: 6 },
    ageBarBackground: { flexDirection: 'row', width: '100%', height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
    ageBarSegment: { height: '100%' },
    ageNeedle: { position: 'absolute', top: -4, width: 2, height: 14, backgroundColor: '#fff' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    mapButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a2a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
    factioButton: { backgroundColor: '#f4524d', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#ddd', fontSize: 13, marginLeft: 6, fontWeight: 'bold' },
    timerContainer: { position: 'absolute', height: 4, left: 0, backgroundColor: '#555' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
