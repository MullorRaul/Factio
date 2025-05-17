// En ../../data_mapa/types.ts
export interface Punto {
    id: number;
    latitude: number;
    longitude: number;
    title: string;
    description: string;
    mapUrl?: string;
    image?: any; // Ajusta el tipo si es necesario
    pinColor?: string;
    weight?: number; // Para el Heatmap
    eventPageName?: string; // <--- ¡Añadir esta línea!
}