import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps } from 'react';

// Define las props que espera tu componente TabBarIcon.
// Usamos ComponentProps<typeof Ionicons> para heredar automáticamente las props que acepta Ionicons.
interface TabBarIconProps extends ComponentProps<typeof Ionicons> {
    // Especificamos explícitamente 'name' y 'color' ya que son las props principales que usaremos
    // y que se pasan desde TabLayout.tsx.
    name: ComponentProps<typeof Ionicons>['name']; // Espera un nombre de icono válido de Ionicons.
    color: string; // Espera un color para el icono.
    // Puedes añadir otras props si tu TabBarIcon personalizado las necesita.
}

// Define y exporta el componente TabBarIcon.
// Recibe 'name', 'color' y cualquier otra prop que Ionicons pueda necesitar (...rest).
export function TabBarIcon({ name, color, ...rest }: TabBarIconProps) {
    // Renderiza el componente Ionicons pasándole las props recibidas.
    // El tamaño (size) se fija a 28, puedes ajustarlo si lo necesitas.
    return <Ionicons name={name} size={28} color={color} {...rest} />;
}
