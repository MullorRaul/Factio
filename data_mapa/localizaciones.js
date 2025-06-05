// data/puntos.js  (o ../../data_mapa/localizaciones.js)

export default [
    {
        id: 1,
        title: 'Puerta del Sol',
        description: 'Centro de Madrid',
        latitude: 40.4168,
        longitude: -3.7038,
        image: require('../assets/images/img.png'),
        weight: 100
    },
    {
        id: 3,
        title: 'Discoteca',
        description: 'Delirium',
        latitude: 38.69687763881166,
        longitude: -0.4758571121831564,
        pinColor: '#8A2BE2',
        image: require('../assets/images/delirium.jpg'),
        weight: 100,
        mapUrl: 'https://maps.app.goo.gl/G5UHV9QJKM9TAuGB6',
        eventPageName: 'eventos_delirium', // <-- ¡QUITAR LA BARRA INICIAL!
        category: 'Pub',
    },
    {
        id: 4,
        title: 'Discoteca',
        description: 'Gaudi',
        latitude: 38.69545,
        longitude: -0.48285,
        pinColor: '#8A2BE2',
        image: require('../assets/images/Gaudi.jpg'),
        weight: 110,
        mapUrl: 'https://maps.app.goo.gl/x3yfT3GvVDswSWhZ6',
        eventPageName: 'eventos_gaudi',// <-- ¡QUITAR LA BARRA INICIAL!
        category: 'Discoteca',
    },
    {
        id: 5,
        title: 'Discoteca',
        description: 'Gavana',
        latitude: 38.6953,
        longitude: -0.4827,
        pinColor: '#8A2BE2',
        image: require('../assets/images/gavana.png'),
        weight: 40,
        mapUrl: 'https://maps.app.goo.gl/g8cbx8Wqa9UpF9cd9',
        eventPageName: 'eventos_gavana', // <-- ¡QUITAR LA BARRA INICIAL!
        category: 'Discoteca',

    },
    {
        id: 6,
        title: 'Discoteca',
        description: 'Don Vito',
        latitude: 38.697395059787155,
        longitude: -0.4766675045744922,
        pinColor: '#8A2BE2',
        image: require('../assets/images/don_vito.jpeg'),
        weight: 50,
        mapUrl: 'https://maps.app.goo.gl/Nc6A5pHyYEbqLqA2A',
        eventPageName: 'eventos_don_vito', // <-- ¡QUITAR LA BARRA INICIAL!
        category: 'Discoteca',
    },
    {
        id: 7,
        title: 'Cafeteria',
        description: 'Epsa',
        latitude: 38.69451,
        longitude: -0.47615,
        pinColor: '#8A2BE2',
        image: require('../assets/images/cafeteriaEpsa.png'),
        weight: 20,
        mapUrl: 'https://maps.app.goo.gl/yEd21tHgLvnV2AKi7',
        eventPageName: 'eventos_epsa', // <-- ¡QUITAR LA BARRA INICIAL!
        category: 'Cafeteria',
    }
];