import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useEventContext } from '../navigation/EventContext';
import { importFromQR, clearImportBuffer } from '../services/ImportService';

type ImportScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Import'>;

type Props = {
    navigation: ImportScreenNavigationProp;
};

const ImportScreen: React.FC<Props> = ({ navigation }) => {
    const { eventContext } = useEventContext();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [importedParts, setImportedParts] = useState<number[]>([]);
    const [totalParts, setTotalParts] = useState<number | null>(null);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);

        try {
            const result = await importFromQR(data, eventContext?.eventName || '');

            // Update progress
            setImportedParts(result.parts);

            // Check if completed
            if (result.totalImported > 0) {
                // All parts received
                Alert.alert(
                    '✅ Import Complete',
                    `Successfully imported:\n` +
                    `• ${result.totalImported} new email${result.totalImported > 1 ? 's' : ''}\n` +
                    `• ${result.duplicates} duplicate${result.duplicates > 1 ? 's' : ''} skipped\n` +
                    (result.errors > 0 ? `• ${result.errors} error${result.errors > 1 ? 's' : ''}` : ''),
                    [
                        {
                            text: 'Import More',
                            onPress: () => {
                                clearImportBuffer();
                                setImportedParts([]);
                                setTotalParts(null);
                                setScanned(false);
                            }
                        },
                        {
                            text: 'Done',
                            onPress: () => {
                                clearImportBuffer();
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                // Partial import (multi-part)
                const partsText = result.parts.join(', ');
                setTotalParts(result.parts.length > 0 ? Math.max(...result.parts) : null);

                Alert.alert(
                    '📥 Part Received',
                    `Received part${result.parts.length > 1 ? 's' : ''}: ${partsText}\n\n` +
                    `Scan remaining QR codes to complete import.`,
                    [{ text: 'Continue', onPress: () => setScanned(false) }]
                );
            }
        } catch (error: any) {
            Alert.alert('Import Error', error.message || 'Failed to import data');
            setScanned(false);
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        if (importedParts.length > 0) {
            Alert.alert(
                'Cancel Import',
                'You have partially imported data. Cancel and clear progress?',
                [
                    { text: 'Continue Scanning', style: 'cancel' },
                    {
                        text: 'Cancel Import',
                        style: 'destructive',
                        onPress: () => {
                            clearImportBuffer();
                            navigation.goBack();
                        }
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionIcon}>📷</Text>
                    <Text style={styles.text}>Camera Permission Required</Text>
                    <Text style={styles.subText}>We need camera access to scan QR codes</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Event Badge */}
            <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeLabel}>Importing to</Text>
                <Text style={styles.eventBadgeName}>{eventContext?.eventName || 'No Event'}</Text>
            </View>

            {/* Progress Indicator */}
            {importedParts.length > 0 && totalParts && (
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>
                        Parts: {importedParts.join(', ')} of {totalParts}
                    </Text>
                </View>
            )}

            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                />

                {/* Scan Frame Overlay */}
                <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>

                {processing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.processingText}>Processing...</Text>
                    </View>
                )}
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                    {scanned
                        ? 'Tap "Scan Next" to continue'
                        : 'Point camera at QR code to import emails'}
                </Text>
                {importedParts.length > 0 && (
                    <Text style={styles.instructionSubtext}>
                        Scan all QR codes from the export
                    </Text>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                {scanned && !processing && (
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={() => setScanned(false)}
                    >
                        <Text style={styles.scanButtonText}>Scan Next QR</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>
                        {importedParts.length > 0 ? 'Cancel Import' : 'Close'}
                    </Text>
                </TouchableOpacity>
            </View>
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
    progressBadge: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    progressText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    scanFrame: {
        position: 'absolute',
        top: '25%',
        left: '15%',
        width: '70%',
        height: '50%',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#FFD700',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#FFD700',
        fontSize: 18,
        marginTop: 16,
    },
    instructions: {
        padding: 20,
        alignItems: 'center',
    },
    instructionText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
    instructionSubtext: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    buttonContainer: {
        padding: 20,
        gap: 12,
    },
    scanButton: {
        backgroundColor: '#FFD700',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    scanButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FF6B6B',
        fontSize: 14,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    text: {
        color: '#FFD700',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subText: {
        color: '#888',
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 30,
    },
    permissionButton: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ImportScreen;
