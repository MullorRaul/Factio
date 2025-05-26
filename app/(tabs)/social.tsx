import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, SafeAreaView, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const API_BASE_URL = 'https://955a-2a0c-5a82-c002-1600-4960-aa6c-4865-16e1.ngrok-free.app';

// Example Achievement Data (Replace with real data from your backend)
const achievementsData = [
    {
        id: 'event1',
        name: 'Tu primera vez',
        // AQUÍ es donde pones la fuente de la imagen para este logro
        // Si la imagen es local (ej: en tu carpeta assets):
        iconSource: require('../../assets/images/tpv.jpg'), // Usando la ruta local que proporcionaste
        // Si la imagen es una URL remota:
        // iconSource: { uri: 'URL_DE_TU_IMAGEN_REMOTA' },
        description: 'Venga chaval, que tampoco lo has hecho tan mal'
    },
    {
        id: 'friends5',
        name: 'Mr Worlwide',
        // AQUÍ es donde pones la fuente de la imagen para este logro
        iconSource: require('../../assets/images/mrworlwide.png'), // Usando la ruta local que proporcionaste
        description: 'Viajaste sin salir de Alcoy'
    },
    {
        id: 'organizer',
        name: 'Hacktrick',
        // AQUÍ es donde pones la fuente de la imagen para este logro
        iconSource: require('../../assets/images/hacktrick.jpg'), // Usando la ruta local que proporcionaste
        description: 'Esta vez no te llevaste el balon a casa'
    },
    {
        id: 'proattendee',
        name: 'Cazatalentos',
        // AQUÍ es donde pones la fuente de la imagen para este logro
        // iconSource: require('@/assets/images/cazatalentos_icon.png'),
        iconSource: require('../../assets/images/cazatalentos.jpg'), // Usando la ruta local que proporcionaste
        description: 'Metiste gol pero casi acabas en el calabozo'
    },
    {
        id: 'secret',
        name: 'Lamine Yamal',
        // AQUÍ es donde pones la fuente de la imagen para este logro
        // iconSource: require('@/assets/images/lamine_yamal_icon.png'),
        iconSource: null, // Reemplaza null con la fuente real de la imagen
        description: '¡Diste la asistencia de tu vida!'
    },
    {
        id: 'earlybird',
        name: 'David',
        // AQUÍ es donde pones la fuente de la imagen para este logro
        // iconSource: require('@/assets/images/david_icon.png'),
        iconSource: null, // Reemplaza null con la fuente real de la imagen
        description: 'Contra todo pronostico, venciste a Goliat'
    },
    {
        id: 'nightowl',
        name: 'El Tigre',
        // AQUÍ es donde pones la fuente de la imagen para este logro
        // iconSource: require('@/assets/images/el_tigre_icon.png'),
        iconSource: null, // Reemplaza null con la fuente real de la imagen
        description: 'Que es una ralla más para un tigre.'
    },
    // Add more achievements here
];

// Example Ranking Data (Replace with real data from your backend, sorted by achievement count)
const rankingData = [
    { id: 'friend1', name: 'Capitán Caos', achievements: 15, tag: 'El Despistado' },
    { id: 'friend2', name: 'Maestro Mingle', achievements: 25, tag: 'El Conectado' },
    { id: 'friend3', name: 'Explorador Errante', achievements: 10, tag: 'El Novato' },
    { id: 'friend4', name: 'Sombra Silenciosa', achievements: 5, tag: 'El Invisible' },
    { id: 'friend5', name: 'Rey de Eventos', achievements: 18, tag: 'El Fiestero' },
    { id: 'friend6', name: 'Coleccionista Clics', achievements: 22, tag: 'El Viciado' },
    { id: 'friend7', name: 'Alma Social', achievements: 8, tag: 'El Tímido' },
];

// Sort ranking data by achievements descending
const sortedRankingData = [...rankingData].sort((a, b) => b.achievements - a.achievements);


// Define the main App component
const App: React.FC = () => {
    const [usernameSearch, setUsernameSearch] = useState<string>('');
    const [searchResultsVisible, setSearchResultsVisible] = useState<boolean>(false);
    const [requestSentMessageVisible, setRequestSentMessageVisible] = useState<boolean>(false);
    const [inviteLinkVisible, setInviteLinkVisible] = useState<boolean>(false); // State for invite link visibility
    const [addFriendButtonState, setAddFriendButtonState] = useState<'initial' | 'sent'>('initial');
    const [expandedAchievementId, setExpandedAchievementId] = useState<string | null>(null);

    // Handler for the search button click
    const handleSearch = () => {
        // If search results are currently visible, hide them
        if (searchResultsVisible) {
            setSearchResultsVisible(false);
        } else {
            // If search results are hidden, perform the search (simulated)
            if (usernameSearch.trim() !== '') {
                // In a real app, you would call your backend here
                // to search for users based on the usernameSearch state.
                // For now, we just simulate showing results.
                setSearchResultsVisible(true);
            } else {
                // If input is empty, still hide results (or do nothing)
                setSearchResultsVisible(false);
            }
        }
        // Always reset the request sent message and button state on any search action
        setRequestSentMessageVisible(false);
        setAddFriendButtonState('initial');
    };


    const handleAddFriend = () => {
        console.log('Solicitud de amistad enviada');
        Alert.alert('Solicitud Enviada', 'Tu solicitud de amistad ha sido enviada.');
        setRequestSentMessageVisible(true);
        setAddFriendButtonState('sent');
    };

    // Handler for the invite button click (Modified to toggle visibility)
    const handleInvite = () => {
        // Toggle the visibility state
        if (inviteLinkVisible) {
            setInviteLinkVisible(false); // Hide the link if visible
        } else {
            // Simulate generating and showing an invite link
            console.log('Generar enlace de invitación'); // Log to console
            Alert.alert('Invitar Amigos', 'Comparte este enlace para invitar amigos: https://tuapp.com/invitar/abcdef'); // Show alert
            setInviteLinkVisible(true); // Show the invite link
        }

        // In a real application, you would generate a unique link and handle sharing options.
    };

    const handleAchievementPress = (achievementId: string) => {
        if (expandedAchievementId === achievementId) {
            setExpandedAchievementId(null);
        } else {
            setExpandedAchievementId(achievementId);
        }
    };

    const expandedAchievement = achievementsData.find(
        (ach) => ach.id === expandedAchievementId
    );


    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>

                {/* User Search Section (Added marginTop to push down) */}
                <View style={[styles.section, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>Buscar Usuarios</Text>
                    <View style={styles.searchInputContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nombre de usuario"
                            placeholderTextColor="#aaa"
                            value={usernameSearch}
                            onChangeText={setUsernameSearch}
                            autoCapitalize="none"
                        />
                        {/* Search Button with Gradient */}
                        <LinearGradient
                            colors={['#e14eca', '#9e6fca']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSearch} // Use the updated handleSearch function
                            >
                                <Text style={styles.buttonText}>Buscar</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                    {/* Search Results (example) */}
                    {searchResultsVisible && ( // This container is conditionally rendered based on state
                        <View style={styles.searchResultsContainer}>
                            <Text style={styles.searchResultsTitle}>Resultados:</Text>
                            {/* This is an example result. In a real app, this would be dynamic */}
                            <View style={styles.searchResultItem}>
                                <Text style={styles.searchResultText}>usuario_ejemplo_123</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.addFriendButton,
                                        addFriendButtonState === 'sent' && styles.addFriendButtonSent
                                    ]}
                                    onPress={handleAddFriend}
                                    disabled={addFriendButtonState === 'sent'}
                                >
                                    <Text style={styles.addFriendButtonText}>
                                        {addFriendButtonState === 'initial' ? 'Añadir Amigo' : 'Solicitud Enviada'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {/* Confirmation message */}
                            {requestSentMessageVisible && (
                                <Text style={styles.requestSentMessage}>¡Solicitud enviada!</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Invite Friends Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Invitar Amigos</Text>
                    {/* Invite Button with Gradient */}
                    <LinearGradient
                        colors={['#e14eca', '#9e6fca']}
                        style={styles.buttonGradientFullWidth} // New style for full width button
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <TouchableOpacity
                            style={styles.buttonFullWidth} // New style for full width button
                            onPress={handleInvite} // Use the updated handleInvite function
                        >
                            <Text style={styles.buttonText}>Invitar a la App</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                    {/* Invite link */}
                    {inviteLinkVisible && ( // This text is conditionally rendered based on state
                        <Text style={styles.inviteLinkText}>
                            Comparte este enlace: <Text style={styles.inviteLinkUrl}>https://tuapp.com/invitar/abcdef</Text>
                        </Text>
                    )}
                </View>

                {/* Achievements Section (Horizontal Reel) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mis Logros</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementReelContent}>
                        {/* Map through achievementsData to render each achievement */}
                        {achievementsData.map((achievement) => (
                            <TouchableOpacity
                                key={achievement.id} // Use a unique key
                                style={styles.achievementItem}
                                onPress={() => handleAchievementPress(achievement.id)} // Pass achievement id
                            >
                                {/* Use Image component for the icon */}
                                {/* Conditionally render Image or a placeholder View */}
                                {achievement.iconSource ? (
                                    <Image
                                        source={achievement.iconSource} // Use the iconSource from the data
                                        style={styles.achievementIcon} // Apply icon styles
                                        resizeMode="cover" // Changed to cover to fill the circle
                                    />
                                ) : (
                                    // Placeholder View if no iconSource
                                    <View style={styles.achievementIconPlaceholder}></View>
                                )}

                                <Text style={styles.achievementText}>{achievement.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Expanded Achievement Details (Conditionally rendered) */}
                    {expandedAchievement && (
                        <View style={styles.expandedAchievementContainer}>
                            <Text style={styles.expandedAchievementTitle}>{expandedAchievement.name}</Text>
                            {/* Conditionally render Image or a placeholder View for expanded view */}
                            {expandedAchievement.iconSource ? (
                                <Image
                                    source={expandedAchievement.iconSource}
                                    // Use the same icon style as in the reel for consistent size
                                    style={styles.achievementIcon} // Use achievementIcon style here
                                    resizeMode="cover" // Use cover to match the reel appearance
                                />
                            ) : (
                                // Placeholder View for expanded view if no iconSource
                                // Use the same placeholder style as in the reel for consistent size
                                <View style={styles.achievementIconPlaceholder}></View> // Use achievementIconPlaceholder style here
                            )}
                            <Text style={styles.expandedAchievementDescription}>{expandedAchievement.description}</Text>
                            {/* You could add a close button here if needed */}
                            {/* <TouchableOpacity onPress={() => setExpandedAchievementId(null)}>
                                <Text style={styles.closeButtonText}>Cerrar</Text>
                            </TouchableOpacity> */}
                        </View>
                    )}
                </View>

                {/* Ranking Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ranking de Logros</Text>
                    <View style={styles.rankingListContainer}>
                        {/* Map through sortedRankingData to display friends */}
                        {sortedRankingData.map((friend, index) => (
                            <View
                                key={friend.id} // Use friend id as key
                                style={[
                                    styles.rankingItem,
                                    index === sortedRankingData.length - 1 && styles.lastRankingItem // Add style for the last item
                                ]}
                            >
                                {/* Display rank */}
                                <Text style={styles.rankingRankText}>{index + 1}.</Text>
                                {/* Container for name and tag */}
                                <View style={styles.rankingNameTagContainer}>
                                    {/* Display friend name */}
                                    <Text style={styles.rankingNameText}>{friend.name}</Text>
                                    {/* Display friend tag */}
                                    <Text style={styles.rankingTagText}>{friend.tag}</Text>
                                </View>
                                {/* Display achievement count */}
                                <Text style={styles.rankingAchievementsText}>{friend.achievements} logros</Text>
                                {/* Display 'Truhan' or 'Pardillo' badges */}
                                {index === 0 && <Text style={styles.rankingBadgeTruhan}>Truhan</Text>}
                                {index === sortedRankingData.length - 1 && <Text style={styles.rankingBadgePardillo}>Pardillo</Text>}
                            </View>
                        ))}
                    </View>
                </View>


            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1, // Ensure SafeAreaView occupies full height
        backgroundColor: '#0d0d0d', // Match background for smooth transition
    },
    scrollViewContent: {
        flexGrow: 1, // Allow content to grow and fill the screen
        paddingHorizontal: 16, // Apply horizontal padding here
        paddingTop: 16, // Add some padding at the top
        paddingBottom: 16, // Add some padding at the bottom
        backgroundColor: '#0d0d0d', // Set background to the main dark color
    },
    section: {
        marginBottom: 24, // Adjusted margin
    },
    sectionTitle: {
        fontSize: 18, // Adjusted font size
        color: '#fff', // White text
        fontWeight: 'bold',
        marginBottom: 12, // Adjusted margin
    },
    searchInputContainer: {
        flexDirection: 'row',
        backgroundColor: '#1e1e1e', // Dark input background - Adjusted to the slightly lighter dark
        borderRadius: 8, // Adjusted border radius
        padding: 8, // Adjusted padding
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        color: '#fff', // White text
        paddingVertical: 0,
        paddingHorizontal: 8, // Added horizontal padding
    },
    buttonGradient: {
        borderRadius: 8, // Adjusted border radius
        marginLeft: 8, // Added margin to separate from input
    },
    button: {
        paddingVertical: 12, // Adjusted padding
        paddingHorizontal: 16, // Adjusted padding
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff', // White text
        fontSize: 16, // Adjusted font size
        fontWeight: 'bold',
    },
    buttonGradientFullWidth: { // New style for full width gradient
        borderRadius: 8,
        width: '100%', // Full width
    },
    buttonFullWidth: { // New style for full width button
        paddingVertical: 15, // Slightly more padding for full width button
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchResultsContainer: {
        marginTop: 16, // Adjusted margin
        borderWidth: 1,
        borderColor: '#333', // Darker border color
        borderRadius: 8, // Adjusted border radius
        padding: 12, // Adjusted padding
        backgroundColor: '#1e1e1e', // Dark results background - Adjusted
    },
    searchResultsTitle: {
        fontSize: 16, // Adjusted font size
        fontWeight: 'bold',
        color: '#fff', // White text
        marginBottom: 8, // Adjusted margin
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8, // Adjusted padding
        borderBottomWidth: 1,
        borderBottomColor: '#222', // Even darker border color
        // Note: lastChild style might not work directly in React Native StyleSheet, handle in render
    },
    searchResultText: {
        color: '#fff', // White text
        fontSize: 14, // Adjusted font size
    },
    addFriendButton: {
        paddingVertical: 6, // Adjusted padding
        paddingHorizontal: 10, // Adjusted padding
        backgroundColor: '#0d0d0d', // Dark background for button - Adjusted
        borderRadius: 5, // Adjusted border radius
        borderWidth: 1, // Added border
        borderColor: '#4CAF50', // Green border
    },
    addFriendButtonSent: {
        backgroundColor: '#222', // Darker background when sent - Adjusted
        borderColor: '#555', // Gray border when sent - Adjusted
    },
    addFriendButtonText: {
        color: '#4CAF50', // Green text
        fontSize: 12, // Adjusted font size
        fontWeight: 'bold',
    },
    requestSentMessage: {
        color: '#4CAF50', // Green text
        marginTop: 8, // Adjusted margin
        fontSize: 14, // Adjusted font size
        textAlign: 'center',
    },
    inviteLinkText: {
        marginTop: 12, // Adjusted margin
        color: '#aaa', // Gray text
        fontSize: 14, // Adjusted font size
        textAlign: 'center',
    },
    inviteLinkUrl: {
        color: '#e14eca', // Pink color for the link
        fontWeight: 'bold',
    },
    achievementReelContent: { // Styles for ScrollView content container
        paddingHorizontal: 4, // Add some horizontal padding within the reel
        paddingBottom: 20, // Add padding below the reel
    },
    achievementItem: {
        width: 150, // Increased width significantly
        height: 150, // Increased height significantly
        marginRight: 20, // Adjusted margin for more space
        alignItems: 'center',
        justifyContent: 'center', // Center content vertically
        backgroundColor: '#1e1e1e', // Dark background - Adjusted
        padding: 15, // Adjusted padding
        borderRadius: 12, // Adjusted border radius
        borderWidth: 1, // Added border
        borderColor: '#333', // Darker border
    },
    achievementIcon: { // Style for the actual Image component
        width: 90, // Increased size for the icon
        height: 90, // Increased size for the icon
        marginBottom: 10, // Adjusted margin
        borderRadius: 45, // Added border radius to make it circular
        overflow: 'hidden', // Added overflow hidden to clip the image
    },
    achievementIconPlaceholder: { // Style for the placeholder View when no image
        width: 90, // Match size of actual icon
        height: 90, // Match size of actual icon
        borderRadius: 45, // Make it round if you want a placeholder shape
        backgroundColor: '#333', // Dark grey placeholder background
        marginBottom: 10,
    },
    achievementText: {
        fontSize: 14, // Adjusted font size for larger items
        color: '#fff', // White text
        textAlign: 'center',
        fontWeight: 'bold',
    },
    // Styles for Expanded Achievement Container
    expandedAchievementContainer: {
        marginTop: 20, // Space above the expanded view
        padding: 15,
        backgroundColor: '#1e1e1e', // Dark background
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center', // Center content
    },
    expandedAchievementTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e14eca', // Lilac color
        marginBottom: 10,
        textAlign: 'center',
    },
    // Adjusted expanded icon styles to match the reel icon size
    expandedAchievementIcon: {
        width: 90, // Match reel icon width
        height: 90, // Match reel icon height
        marginBottom: 15,
        resizeMode: 'cover', // Use cover to match reel appearance
        borderRadius: 45, // Match reel icon border radius
        overflow: 'hidden', // Match reel icon overflow
    },
    // Adjusted expanded placeholder styles to match the reel placeholder size
    expandedAchievementIconPlaceholder: {
        width: 90, // Match reel placeholder width
        height: 90, // Match reel placeholder height
        borderRadius: 45, // Match reel placeholder border radius
        backgroundColor: '#333', // Match reel placeholder background
        marginBottom: 15,
    },
    expandedAchievementDescription: {
        fontSize: 16,
        color: '#fff', // White text
        textAlign: 'center',
        lineHeight: 22, // Add some line height for readability
    },

    // --- New Styles for Ranking Section ---
    rankingListContainer: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        backgroundColor: '#1e1e1e',
        overflow: 'hidden', // Clip border radius
    },
    rankingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#222', // Separator line
    },
    lastRankingItem: {
        borderBottomWidth: 0, // No border for the last item
    },
    rankingRankText: {
        fontSize: 16,
        color: '#aaa', // Gray color for rank
        fontWeight: 'bold',
        marginRight: 10,
        width: 30, // Fixed width for rank number alignment
        textAlign: 'center', // Center the rank number
    },
    rankingNameTagContainer: {
        flex: 1, // Take up available space
        marginRight: 10,
    },
    rankingNameText: {
        fontSize: 16,
        color: '#fff', // White color for name
        fontWeight: 'bold', // Make name bold
    },
    rankingTagText: {
        fontSize: 12,
        color: '#aaa', // Gray color for tag
    },
    rankingAchievementsText: {
        fontSize: 14,
        color: '#aaa', // Gray color for achievements count
        marginRight: 10,
    },
    rankingBadgeTruhan: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#e14eca', // Lilac color for Truhan
        backgroundColor: '#331a33', // Darker background for badge
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 'auto', // Push badge to the right
    },
    rankingBadgePardillo: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ff6347', // Reddish color for Pardillo
        backgroundColor: '#331a1a', // Darker background for badge
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 'auto', // Push badge to the right
    },
});


export default App;
