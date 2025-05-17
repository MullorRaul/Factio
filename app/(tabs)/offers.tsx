// app/(tabs)/offers.tsx
import React, { useEffect, useState } from 'react'; // Importamos useEffect y useState
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    ImageBackground,
    TouchableOpacity,
    Alert,
    ActivityIndicator, // Añadimos ActivityIndicator para el estado de carga
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

// Interfaz para los datos de los locales, basada en las columnas de la tabla 'local' y lo que necesitas mostrar
interface PubAd {
    id: string; // Corresponde a 'cod_local' de la base de datos (lo convertimos a string)
    image: { uri: string } | number; // Ahora puede ser URL (string) o require (number para imágenes locales temporales)
    name: string; // Corresponde a 'nombre' en la base de datos
    price?: string; // Este dato no está directamente en 'local'. Deberás obtenerlo de otro lado (ej: tabla de ofertas o eventos).
    location: string; // Corresponde a 'direccion' en la base de datos
    musicType?: string; // Este dato no está directamente en 'local'. Deberás obtenerlo de otro lado.
    entryPrice?: string; // Este dato no está directamente en 'local'. Deberás obtenerlo de otro lado.
    // Añadimos los campos que vienen de la tabla 'local' en el backend
    aforo?: number; // Corresponde a 'aforo'
    nif?: string; // Corresponde a 'nif'
    empresa?: number; // Corresponde a 'empresa'
    // Si tu backend incluye la URL de la foto en la respuesta de /api/locales, añádela aquí:
    url_foto_principal?: string; // Ejemplo de campo para la URL de la foto
}

// Datos de ejemplo (Hardcodeados por ahora, incluyendo Don Vito)
// NOTA: Esto será reemplazado por datos de tu backend.
const DATA: PubAd[] = [
    {
        id: '1',
        image: require('../../assets/images/delirium.jpg'), // Reemplazar por URL desde DB
        name: 'Pub Delirium',
        price: '3€ cerveza',
        location: 'Centro Alcoy',
        musicType: 'Rock',
        entryPrice: 'Gratis',
    },
    {
        id: '2',
        image: require('../../assets/images/Gaudi.jpg'), // Reemplazar por URL desde DB
        name: 'Gaudi',
        price: '5€ copa',
        location: 'Polígono',
        musicType: 'Electrónica',
        entryPrice: '5€ con copa',
    },
    {
        id: '3', // Nuevo ID para Don Vito
        // **CORREGIDO:** Usamos require para la imagen local don_vito.jpg
        image: require('../../assets/images/don_vito.png'),
        name: 'Don Vito',
        price: '4€ combinado', // Ejemplo de precio
        location: 'Zona Centro', // Ejemplo de ubicación
        musicType: 'Variado', // Ejemplo de tipo de música
        entryPrice: '10€ con copa', // Ejemplo de entrada
    },
    // más pubs...
];


export default function OffersScreen() {
    const router = useRouter();

    // Estado para almacenar los datos de los locales cargados desde el backend
    const [locals, setLocals] = useState<PubAd[]>([]);
    // Estado para manejar el estado de carga
    const [loading, setLoading] = useState(true);
    // Estado para manejar errores
    const [error, setError] = useState<string | null>(null);

    // useEffect para cargar los datos cuando el componente se monta
    useEffect(() => {
        // Función asíncrona para obtener los datos de los locales desde el backend
        const fetchLocals = async () => {
            try {
                // ** IMPORTANTE: Reemplaza esta URL con la URL real de tu API de backend **
                // Si tu backend corre localmente en el puerto 3001, la URL podría ser:
                // 'http://TU_IP_LOCAL:3001/api/locales' (usa la IP de tu máquina en la red local)
                // o 'http://localhost:3001/api/locales' si usas un emulador que mapea localhost.
                // Si tu backend está desplegado, usa la URL de despliegue.
                const response = await fetch('http://TU_IP_LOCAL_O_DOMINIO:3001/api/locales'); // <-- ¡ACTUALIZA ESTA URL!

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: any[] = await response.json(); // Asumimos que el backend devuelve un array de objetos de la tabla 'local'

                // Mapear los datos del backend a la interfaz PubAd del frontend
                // ** IMPORTANTE: Ajusta este mapeo según la estructura exacta de los datos que devuelve tu backend **
                // Los nombres de las propiedades en 'item' (ej: item.cod_local) deben coincidir
                // con los nombres de las columnas seleccionadas en tu backend endpoint (/api/locales)
                const mappedData: PubAd[] = data.map(item => ({
                    id: item.cod_local.toString(), // Usar cod_local de la DB como ID (convertir a string)
                    name: item.nombre, // Mapear 'nombre' de la DB a 'name'
                    location: item.direccion, // Mapear 'direccion' de la DB a 'location'
                    aforo: item.aforo, // Mapear 'aforo'
                    nif: item.nif, // Mapear 'nif'
                    empresa: item.empresa, // Mapear 'empresa'

                    // ** Manejo de la imagen: **
                    // Si tu tabla 'local' tiene una columna con la URL de la imagen (ej: url_foto_principal), úsala aquí.
                    // Asegúrate de que esa columna esté seleccionada en tu backend endpoint /api/locales.
                    // Si no, necesitarás obtener las imágenes de otra manera o añadir esa columna a tu tabla 'local'.
                    // Por ahora, usamos un placeholder si no hay URL disponible o si la columna no existe/está vacía.
                    image: item.url_foto_principal ? { uri: item.url_foto_principal } : { uri: 'https://placehold.co/400x600/000000/FFFFFF?text=No+Image' }, // Asumiendo que el backend devuelve url_foto_principal

                    // Los campos price, musicType, entryPrice no están en la tabla 'local'.
                    // Si tu backend los incluye en la respuesta de /api/locales (quizás uniéndose con otras tablas),
                    // mapealos aquí. Si no, serán undefined y no se mostrarán en la UI a menos que añadas lógica para ellos.
                    // Ejemplo si tu backend los incluyera:
                    // price: item.precio_bebida || undefined,
                    // musicType: item.tipo_musica || undefined,
                    // entryPrice: item.precio_entrada || undefined,
                    // ... mapear otros campos si es necesario
                }));


                setLocals(mappedData); // Actualizar el estado con los datos mapeados
            } catch (err: any) {
                console.error("Error fetching locals:", err);
                setError("No se pudieron cargar los locales."); // Mostrar un mensaje de error al usuario
            } finally {
                setLoading(false); // Finalizar el estado de carga
            }
        };

        // ** Por ahora, usaremos los datos hardcodeados (DATA) si no hay backend configurado **
        // ** Comenta las 3 líneas de abajo y descomenta fetchLocals() cuando tengas tu backend listo **
        setLocals(DATA); // Usar datos hardcodeados temporalmente
        setLoading(false); // Desactivar carga ya que usamos datos hardcodeados
        console.log("Usando datos hardcodeados. Descomenta fetchLocals() cuando el backend esté listo.");


        // ** Descomenta la línea de abajo y comenta las 3 anteriores cuando tengas tu backend y endpoint listos: **
        // fetchLocals(); // Llamar a la función para cargar los datos al montar el componente

    }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar

    // Función para manejar el botón "Ver Eventos Semanales"
    const handleViewEvents = (pub: PubAd) => {
        // Navegación basada en el nombre del pub.
        // Las rutas son directas desde la raíz '/' ya que los archivos
        // eventos_delirium.tsx, eventos_gaudi.tsx, eventos_don_vito.tsx
        // están directamente en la carpeta `app`.
        if (pub.name === 'Pub Delirium') {
            router.push('/eventos_delirium' as any);
        } else if (pub.name === 'Gaudi') {
            router.push('/eventos_gaudi' as any);
        } else if (pub.name === 'Don Vito') {
            // Navega a la pantalla de eventos de Don Vito.
            // Usamos la ruta '/eventos_don_vito' con guiones bajos
            // para que coincida exactamente con el nombre del archivo eventos_don_vito.tsx.
            router.push('/eventos_don_vito' as any);
        }
        else {
            // Si el pub no tiene una ruta de evento específica definida aquí, muestra una alerta.
            Alert.alert('Info', `No hay eventos semanales definidos para ${pub.name}.`);
            console.warn(`No specific event route found for ${pub.name}.`);
        }

        // Alternativa más robusta (si tuvieras una pantalla de evento genérica y pasaras el ID del local):
        // Esto requeriría una ruta dinámica en expo-router como app/eventos/[id].tsx
        // if (pub.id) {
        //      router.push(`/eventos/${pub.id}` as any); // Navega a una pantalla de detalle de evento genérica usando el ID del local
        // } else {
        //      Alert.alert('Info', `No hay eventos semanales definidos para ${pub.name}.`);
        // }
    };

    // Función para renderizar cada elemento de la lista
    const renderItem = ({ item }: { item: PubAd }) => (
        <View style={styles.cardContainer}>
            <ImageBackground
                source={item.image} // Usamos directamente item.image (que es { uri: string } o number)
                style={styles.imageBackground}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradientOverlay}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.pubName}>{item.name}</Text>
                    {/* Mostrar detalles del local. Usa || '...' para campos opcionales que pueden venir como undefined */}
                    <Text style={styles.pubDetail}>
                        {item.location || 'Ubicación no especificada'} • {item.musicType || 'Tipo de música no especificado'}
                    </Text>
                    {item.price && <Text style={styles.pubDetail}>Precio bebida: {item.price}</Text>}
                    {item.entryPrice && <Text style={styles.pubDetail}>Entrada: {item.entryPrice}</Text>}
                    {/* Puedes añadir otros detalles de la DB si los necesitas, ej: */}
                    {/* {item.aforo !== undefined && item.aforo !== null && <Text style={styles.pubDetail}>Aforo: {item.aforo}</Text>} */}


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


    // Mostrar indicador de carga mientras se obtienen los datos
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#e14eca" />
                <Text style={styles.loadingText}>Cargando locales...</Text>
            </View>
        );
    }

    // Mostrar mensaje de error si falla la carga
    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                {/* Opcional: Botón para reintentar */}
                {/* <TouchableOpacity onPress={fetchLocals} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity> */}
            </View>
        );
    }


    return (
        <FlatList
            data={locals} // ** Usamos los datos cargados desde el backend **
            keyExtractor={item => item.id} // Usamos el ID (cod_local) como key
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000', // Fondo oscuro similar al de las tarjetas
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
        color: '#fff',
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
        marginHorizontal: 20,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#e14eca',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
