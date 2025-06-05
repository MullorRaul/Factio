// components/AnimatedBackground.tsx
import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useFrameCallback } from 'react-native-reanimated';
import AnimatedIcon, { AnimatedIconProps, AnimatedIconHandle } from './AnimatedIcon'; // Ajusta la ruta si es necesario

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Configuración de los iconos
const ICON_TYPES = ['🪩', '🍻', '✨', '🎶']; // Emojis para los iconos
const NUM_ICONS = 20;
const ICON_MIN_SIZE = 25;
const ICON_MAX_SIZE = 50;
const BORDER_SLOWDOWN_FACTOR = 0.7;

const AnimatedBackground: React.FC = () => {
    // Refs para cada icono, permitiendo null inicialmente
    const iconRefs = useRef<React.RefObject<AnimatedIconHandle | null>[]>([]);

    const iconInitialData = useMemo<AnimatedIconProps[]>(() => {
        return Array.from({ length: NUM_ICONS }).map((_, i) => ({
            id: `icon-${i}`,
            icon: ICON_TYPES[i % ICON_TYPES.length],
            size: Math.random() * (ICON_MAX_SIZE - ICON_MIN_SIZE) + ICON_MIN_SIZE,
            initialX: Math.random() * screenWidth,
            initialY: Math.random() * screenHeight,
            initialOpacity: 0.4 + Math.random() * 0.4,
        }));
    }, []);

    // Inicializar refs
    if (iconRefs.current.length === 0) {
        iconInitialData.forEach(() => {
            iconRefs.current.push(React.createRef<AnimatedIconHandle | null>());
        });
    }

    useFrameCallback(() => {
        iconRefs.current.forEach((iconRef) => {
            if (!iconRef?.current) return;

            const icon = iconRef.current;

            icon.x.value += icon.vx.value;
            icon.y.value += icon.vy.value;

            let bounced = false;

            if (icon.x.value - icon.size / 2 < 0) {
                icon.x.value = icon.size / 2;
                icon.vx.value *= -1 * BORDER_SLOWDOWN_FACTOR;
                icon.vy.value *= BORDER_SLOWDOWN_FACTOR;
                bounced = true;
            }
            if (icon.x.value + icon.size / 2 > screenWidth) {
                icon.x.value = screenWidth - icon.size / 2;
                icon.vx.value *= -1 * BORDER_SLOWDOWN_FACTOR;
                icon.vy.value *= BORDER_SLOWDOWN_FACTOR;
                bounced = true;
            }
            if (icon.y.value - icon.size / 2 < 0) {
                icon.y.value = icon.size / 2;
                icon.vy.value *= -1 * BORDER_SLOWDOWN_FACTOR;
                icon.vx.value *= BORDER_SLOWDOWN_FACTOR;
                bounced = true;
            }
            if (icon.y.value + icon.size / 2 > screenHeight) {
                icon.y.value = screenHeight - icon.size / 2;
                icon.vy.value *= -1 * BORDER_SLOWDOWN_FACTOR;
                icon.vx.value *= BORDER_SLOWDOWN_FACTOR;
                bounced = true;
            }

            if (!bounced) {
                icon.vx.value *= 0.998;
                icon.vy.value *= 0.998;
            }

            if (Math.abs(icon.vx.value) < 0.1 && Math.abs(icon.vy.value) < 0.1 && !bounced) {
                icon.vx.value = (Math.random() - 0.5) * 0.5;
                icon.vy.value = (Math.random() - 0.5) * 0.5;
            }
        });

        // Colisiones entre iconos
        for (let i = 0; i < iconRefs.current.length; i++) {
            const iconA_Ref = iconRefs.current[i];
            if (!iconA_Ref?.current) continue;
            const iconA = iconA_Ref.current;

            for (let j = i + 1; j < iconRefs.current.length; j++) {
                const iconB_Ref = iconRefs.current[j];
                if (!iconB_Ref?.current) continue;
                const iconB = iconB_Ref.current;

                const dx = iconA.x.value - iconB.x.value;
                const dy = iconA.y.value - iconB.y.value;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = (iconA.size / 2) + (iconB.size / 2);

                if (distance < minDistance) {
                    const tempVxA = iconA.vx.value;
                    const tempVyA = iconA.vy.value;
                    iconA.vx.value = iconB.vx.value * 0.85;
                    iconA.vy.value = iconB.vy.value * 0.85;
                    iconB.vx.value = tempVxA * 0.85;
                    iconB.vy.value = tempVyA * 0.85;

                    const overlap = (minDistance - distance) / 2;
                    iconA.x.value += (dx / distance) * overlap;
                    iconA.y.value += (dy / distance) * overlap;
                    iconB.x.value -= (dx / distance) * overlap;
                    iconB.y.value -= (dy / distance) * overlap;
                }
            }
        }
    }, true);

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {iconInitialData.map((props, index) => (
                <AnimatedIcon
                    key={props.id}
                    {...props}
                    ref={iconRefs.current[index]}
                />
            ))}
        </View>
    );
};

export default AnimatedBackground;
