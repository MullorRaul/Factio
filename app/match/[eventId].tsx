// app/match/[eventId].tsx (mover fuera de (tabs) para ocultar tab bar)
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    Animated,
    PanResponder,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import participantsData from '../data/participants.json';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * width;
const SWIPE_OUT_DURATION = 250;

interface Participant {
    id: string;
    name: string;
    age: number;
    gender: 'male' | 'female';
    orientation: 'heterosexual' | 'bisexual';
    image: string;
}

export default function MatchScreen() {
    const router = useRouter();
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const all: Participant[] = participantsData[eventId] || [];
    const participants = all.filter(p => p.gender === 'female');

    const [index, setIndex] = useState(0);
    const position = useRef(new Animated.ValueXY()).current;
    const [matchAnim] = useState(new Animated.Value(0));
    const [showMatchIcon, setShowMatchIcon] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) forceSwipe('right');
                else if (gesture.dx < -SWIPE_THRESHOLD) forceSwipe('left');
                else resetPosition();
            },
        })
    ).current;

    const forceSwipe = (direction: 'left' | 'right') => {
        Animated.timing(position, {
            toValue: { x: direction === 'right' ? width : -width, y: 0 },
            duration: SWIPE_OUT_DURATION,
            useNativeDriver: false,
        }).start(() => onSwipeComplete(direction));
    };

    const onSwipeComplete = (direction: 'left' | 'right') => {
        if (direction === 'right') {
            setShowMatchIcon(true);
            Animated.sequence([
                Animated.timing(matchAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.delay(500),
                Animated.timing(matchAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => setShowMatchIcon(false));
        }
        position.setValue({ x: 0, y: 0 });
        setIndex(i => i + 1);
    };

    const resetPosition = () => {
        Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    };

    if (index >= participants.length) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noMore}>No quedan más participantes</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonBottom}>
                    <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    }

    const person = participants[index];
    const rotate = position.x.interpolate({
        inputRange: [-width*1.5, 0, width*1.5],
        outputRange: ['-20deg','0deg','20deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                {...panResponder.panHandlers}
                style={[styles.card, { transform: [...position.getTranslateTransform(), { rotate }] }]}
            >
                <Image source={{ uri: person.image }} style={styles.image} />
                <Text style={styles.name}>{person.name}, {person.age}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonTop}>
                    <MaterialCommunityIcons name="arrow-left" size={30} color="#fff" />
                </TouchableOpacity>
                {showMatchIcon && (
                    <Animated.View style={[styles.matchIconContainer, { opacity: matchAnim }]}>
                        <Text style={styles.matchEmoji}>💖</Text>
                    </Animated.View>
                )}
            </Animated.View>

            {/* Botones de swipe */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={() => forceSwipe('left')}>
                    <Text style={styles.buttonEmoji}>😕</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => forceSwipe('right')}>
                    <Text style={styles.buttonEmoji}>😍</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center' },
    card: {
        width: width*0.9,
        height: height*0.75,
        borderRadius:20,
        overflow:'hidden',
        backgroundColor:'#222',
        position:'absolute',
    },
    image:{ width:'100%', height:'85%' },
    name:{ color:'#fff', fontSize:22, marginTop:10, fontWeight:'bold', textAlign:'center' },
    centered:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' },
    noMore:{ color:'#fff', fontSize:18, marginBottom:20 },
    backButtonTop:{ position:'absolute', top:40, left:20 },
    backButtonBottom:{ marginTop:20 },
    matchIconContainer:{ position:'absolute', top:'40%', alignSelf:'center' },
    matchEmoji:{ fontSize:80 },
    buttonsContainer:{ position:'absolute', bottom:50, width:'60%', flexDirection:'row', justifyContent:'space-between' },
    buttonEmoji:{ fontSize:40 }
});
