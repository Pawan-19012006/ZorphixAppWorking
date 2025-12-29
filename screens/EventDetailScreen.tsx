import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

type EventDetailScreenRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
type EventDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventDetail'>;

type Props = {
    route: EventDetailScreenRouteProp;
    navigation: EventDetailScreenNavigationProp;
};

const EventDetailScreen: React.FC<Props> = ({ route }) => {
    const { event } = route.params;

    const handleScanQR = () => {
        Alert.alert("Scanner", "QR Scanner functionality will be implemented here.");
    };

    const handleRegister = () => {
        Alert.alert("Registration", `Registered for ${event.title}!`);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.headerSection}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.date}>{event.date}</Text>
                <View style={styles.categoryContainer}>
                    <Text style={styles.categoryLabel}>Category: </Text>
                    <Text style={styles.categoryValue}>{event.category}</Text>
                </View>
            </View>

            <View style={styles.descriptionSection}>
                <Text style={styles.sectionHeader}>About Event</Text>
                <Text style={styles.description}>{event.description}</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={handleScanQR}>
                    <Text style={styles.buttonText}>Scan QR</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Register New</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    headerSection: {
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 10,
    },
    date: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 10,
    },
    categoryContainer: {
        flexDirection: 'row',
    },
    categoryLabel: {
        fontWeight: '600',
        color: '#34495e',
    },
    categoryValue: {
        color: '#3498db',
        fontWeight: '600',
    },
    descriptionSection: {
        marginBottom: 40,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#576574',
    },
    buttonContainer: {
        gap: 15,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scanButton: {
        backgroundColor: '#34495e',
    },
    registerButton: {
        backgroundColor: '#e74c3c',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default EventDetailScreen;
