// components/AnimatedIcon.tsx
// Asegúrate de que este archivo esté en una ruta como 'app/components/AnimatedIcon.tsx'
// o ajusta la importación en AnimatedBackground.tsx
import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Propiedades que el componente AnimatedIcon espera
export interface AnimatedIconProps {
    id: string;
    icon: string; // El carácter emoji
    size: number;
    initialX: number;
    initialY: number;
    initialOpacity?: number; // Opacidad final después del fade-in (0 a 1)
}

// Lo que el componente AnimatedIcon expondrá a su padre a través de la ref
export interface AnimatedIconHandle {
    id: string;
    x: Animated.SharedValue<number>;
    y: Animated.SharedValue<number>;
    vx: Animated.SharedValue<number>;
    vy: Animated.SharedValue<number>;
    size: number;
    initialOpacityValue: number;
}

const AnimatedIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    (
        {
            id,
            icon,
            size,
            initialX,
            initialY,
            initialOpacity = 0.7, // Valor por defecto si no se provee
        },
        ref
    ) => {
        // Valores animados compartidos para la posición y velocidad del icono
        const x = useSharedValue(initialX);
        const y = useSharedValue(initialY);
        const vx = useSharedValue((Math.random() - 0.5) * 1.5); // Velocidad X inicial aleatoria (rango ajustado)
        const vy = useSharedValue((Math.random() - 0.5) * 1.5); // Velocidad Y inicial aleatoria (rango ajustado)
        const opacity = useSharedValue(0); // Comienza invisible para el fade-in

        // Exponer los shared values y otras propiedades al componente padre (AnimatedBackground)
        useImperativeHandle(ref, () => ({
            id,
            x,
            y,
            vx,
            vy,
            size,
            initialOpacityValue: initialOpacity,
        }), [id, x, y, vx, vy, size, initialOpacity]); // Dependencias para actualizar la ref si cambian

        // Efecto para la animación de aparición (fade-in)
        useEffect(() => {
            opacity.value = withTiming(initialOpacity, {
                duration: 1500 + Math.random() * 1000, // Duración aleatoria para un efecto escalonado
                easing: Easing.out(Easing.quad),
            });
        }, [opacity, initialOpacity]); // Se ejecuta si cambian opacity o initialOpacity

        // Estilos animados para el icono
        const animatedStyle = useAnimatedStyle(() => {
            return {
                position: 'absolute',
                left: x.value - size / 2, // Centrar el icono en su coordenada X
                top: y.value - size / 2,  // Centrar el icono en su coordenada Y
                opacity: opacity.value,
                // Pequeña animación de "flote" sutil para cada ícono
                transform: [
                    {
                        translateY: interpolate(
                            opacity.value, // Usar la opacidad como trigger
                            [0, initialOpacity], // Rango de entrada de la opacidad
                            [0, Math.sin(x.value / 25 + y.value / 25) * (size / 12)] // Rango de salida para el flote
                        ),
                    },
                    {
                        rotate: `${interpolate(opacity.value, [0, initialOpacity], [0, Math.cos(y.value / 30) * 5])}deg` // Rotación sutil
                    }
                ],
            };
        });

        // El componente Text se usa para renderizar el emoji como icono
        return (
            <Animated.View style={animatedStyle}>
                <Text style={{ fontSize: size, color: 'white' }}>{icon}</Text>
            </Animated.View>
        );
    }
);
export default AnimatedIcon;