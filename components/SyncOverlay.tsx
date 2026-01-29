import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';

interface SyncOverlayProps {
    visible: boolean;
    status: string;
    subStatus?: string;
}

const { width } = Dimensions.get('window');

const SyncOverlay: React.FC<SyncOverlayProps> = ({ visible, status, subStatus }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color="#FFD700" style={styles.spinner} />
                    <Text style={styles.status}>{status}</Text>
                    {subStatus && <Text style={styles.subStatus}>{subStatus}</Text>}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 30,
        width: width * 0.8,
        maxWidth: 320,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    spinner: {
        marginBottom: 20,
    },
    status: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subStatus: {
        color: '#888',
        fontSize: 13,
        textAlign: 'center',
    },
});

export default SyncOverlay;
