import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Event } from '../navigation/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
    navigation: HomeScreenNavigationProp;
};



const DUMMY_EVENTS: Event[] = [
    {
        id: '1',
        title: 'Paper Presentation',
        category: 'Technical',
        date: 'Oct 24, 2025',
        description: 'Present your innovative ideas and research papers to a panel of experts. A great platform to showcase your technical prowess.'
    },
    {
        id: '2',
        title: 'Hackathon',
        category: 'Technical',
        date: 'Oct 25, 2025',
        description: 'A 24-hour coding marathon where you solve real-world problems. forming teams of 3-4 members.'
    },
    {
        id: '3',
        title: 'Technical Quiz',
        category: 'Technical',
        date: 'Oct 24, 2025',
        description: 'Test your knowledge in various domains of computer science and engineering in this rapid-fire quiz event.'
    },
    {
        id: '4',
        title: 'Workshop on AI',
        category: 'Workshop',
        date: 'Oct 26, 2025',
        description: 'Hands-on workshop on Artificial Intelligence and Machine Learning basics. Bring your laptops!'
    },
    {
        id: '5',
        title: 'Gaming Event',
        category: 'Non-Technical',
        date: 'Oct 25, 2025',
        description: 'Compete in popular esports titles and win exciting prizes. Open to all gamers.'
    },
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Technical': return '#e74c3c';
            case 'Workshop': return '#f1c40f';
            case 'Non-Technical': return '#2ecc71';
            default: return '#95a5a6';
        }
    };

    const renderEventItem = ({ item }: { item: Event }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EventDetail', { event: item })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: getCategoryColor(item.category) }]}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                </View>
            </View>
            <Text style={styles.eventDate}>{item.date}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={DUMMY_EVENTS}
                renderItem={renderEventItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginLeft: 10,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    eventDate: {
        fontSize: 14,
        color: '#7f8c8d',
    },
});

export default HomeScreen;
