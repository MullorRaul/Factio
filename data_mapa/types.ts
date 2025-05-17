export interface Punto {
    id: number;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    image: any;
    weight?: number;
    pinColor?: string;
}