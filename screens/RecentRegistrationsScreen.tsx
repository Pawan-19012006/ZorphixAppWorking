import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getOnSpotParticipants } from '../services/sqlite';

// Define the Participant type matching the SQLite schema
type Participant = {
    uid: string;
    event_id: string;
    name: string;
    phone: string;
    email: string;
    checked_in: number;
    checkin_time: string | null;
    source: string;
    sync_status: number;
};

export default function RecentRegistrationsScreen() {
    const [users, setUsers] = useState<Participant[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const data = await getOnSpotParticipants();
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const renderItem = ({ item }: { item: Participant }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={[styles.badge, item.sync_status ? styles.badgeSynced : styles.badgePending]}>
                    <Text style={styles.badgeText}>{item.sync_status ? 'Synced' : 'Not Synced'}</Text>
                </View>
            </View>
            <Text style={styles.detail}>UID: {item.uid}</Text>
            <Text style={styles.detail}>Event: {item.event_id}</Text>
            <Text style={styles.detail}>Email: {item.email}</Text>
            <Text style={styles.meta}>Registered: {item.source}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Newly Added (On-Spot)</Text>
            <Text style={styles.subHeader}>These are students added locally on this device.</Text>

            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
                }
                ListEmptyComponent={<Text style={styles.emptyText}>No on-spot registrations found.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        padding: 20
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 5
    },
    subHeader: {
        fontSize: 14,
        color: '#888',
        marginBottom: 20
    },
    list: {
        paddingBottom: 20
    },
    card: {
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        flex: 1
    },
    detail: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 2
    },
    meta: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
        fontStyle: 'italic'
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 50
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8
    },
    badgeSynced: {
        backgroundColor: '#006400' // Dark Green
    },
    badgePending: {
        backgroundColor: '#8B0000' // Dark Red
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    }
});
