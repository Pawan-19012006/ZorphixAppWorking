import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useEventContext } from '../navigation/EventContext';
import { exportLocalData, getExportSummary } from '../services/ExportService';

type ExportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Export'>;

type Props = {
    navigation: ExportScreenNavigationProp;
};

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width - 80, 300);

const ExportScreen: React.FC<Props> = ({ navigation }) => {
    const { eventContext } = useEventContext();
    const [loading, setLoading] = useState(false);
    const [qrDataArray, setQrDataArray] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [summary, setSummary] = useState({ totalParticipants: 0, totalEmails: 0 });

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        const data = await getExportSummary();
        setSummary(data);
    };

    const handleExport = async () => {
        if (!eventContext?.eventName) {
            Alert.alert('Error', 'No event selected');
            return;
        }

        setLoading(true);
        try {
            const result = await exportLocalData(eventContext.eventName);

            if (result.qrDataArray.length === 0) {
                Alert.alert('No Data', 'No participant emails found in local database');
                setLoading(false);
                return;
            }

            setQrDataArray(result.qrDataArray);
            setCurrentPage(0);

            Alert.alert(
                'Export Successful',
                `Generated ${result.totalParts} QR code${result.totalParts > 1 ? 's' : ''} for ${result.totalEmails} email${result.totalEmails > 1 ? 's' : ''}`
            );
        } catch (error: any) {
            Alert.alert('Export Failed', error.message || 'Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        Alert.alert(
            'Clear Export',
            'Clear the generated QR codes?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setQrDataArray([]);
                        setCurrentPage(0);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Event Badge */}
            <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeLabel}>Exporting from</Text>
                <Text style={styles.eventBadgeName}>{eventContext?.eventName || 'No Event'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Local Database</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Participants:</Text>
                        <Text style={styles.summaryValue}>{summary.totalParticipants}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Unique Emails:</Text>
                        <Text style={styles.summaryValue}>{summary.totalEmails}</Text>
                    </View>
                </View>

                {/* QR Display */}
                {qrDataArray.length > 0 ? (
                    <View style={styles.qrContainer}>
                        <View style={styles.qrCard}>
                            <Text style={styles.qrTitle}>
                                QR Code {currentPage + 1} of {qrDataArray.length}
                            </Text>

                            <View style={styles.qrWrapper}>
                                <QRCode
                                    value={qrDataArray[currentPage]}
                                    size={QR_SIZE}
                                    backgroundColor="white"
                                    color="black"
                                />
                            </View>

                            <Text style={styles.qrInfo}>
                                Scan this QR code on another device to import emails
                            </Text>
                        </View>

                        {/* Navigation Buttons */}
                        {qrDataArray.length > 1 && (
                            <View style={styles.navButtons}>
                                <TouchableOpacity
                                    style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
                                    onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                >
                                    <Text style={[styles.navButtonText, currentPage === 0 && styles.navButtonTextDisabled]}>
                                        ← Previous
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.navButton, currentPage === qrDataArray.length - 1 && styles.navButtonDisabled]}
                                    onPress={() => setCurrentPage(p => Math.min(qrDataArray.length - 1, p + 1))}
                                    disabled={currentPage === qrDataArray.length - 1}
                                >
                                    <Text style={[styles.navButtonText, currentPage === qrDataArray.length - 1 && styles.navButtonTextDisabled]}>
                                        Next →
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                            <Text style={styles.clearButtonText}>Clear QR Codes</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderIcon}>📤</Text>
                        <Text style={styles.placeholderText}>
                            Tap "Generate QR Codes" to export local emails
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Export Button */}
            {qrDataArray.length === 0 && (
                <View style={styles.bottomButton}>
                    <TouchableOpacity
                        style={[styles.exportButton, loading && styles.exportButtonDisabled]}
                        onPress={handleExport}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.exportButtonText}>Generate QR Codes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    eventBadge: {
        backgroundColor: '#111',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    eventBadgeLabel: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    eventBadgeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 4,
    },
    content: {
        padding: 20,
    },
    summaryCard: {
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#888',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    qrContainer: {
        alignItems: 'center',
    },
    qrCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        width: '100%',
    },
    qrTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 20,
    },
    qrWrapper: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    qrInfo: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    navButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        width: '100%',
    },
    navButton: {
        flex: 1,
        backgroundColor: '#FFD700',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#333',
    },
    navButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    navButtonTextDisabled: {
        color: '#666',
    },
    clearButton: {
        marginTop: 20,
        padding: 12,
    },
    clearButtonText: {
        color: '#FF6B6B',
        fontSize: 14,
        textAlign: 'center',
    },
    placeholder: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    placeholderIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    bottomButton: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    exportButton: {
        backgroundColor: '#FFD700',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    exportButtonDisabled: {
        opacity: 0.7,
    },
    exportButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ExportScreen;
