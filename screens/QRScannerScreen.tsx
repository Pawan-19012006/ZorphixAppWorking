import React, { useState } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, PAID_EVENTS } from '../navigation/types';
import { useEventContext } from '../navigation/EventContext';
import { getParticipantByUID, getParticipantByUIDAndEvent, markParticipated, insertParticipant } from '../services/sqlite';
import { checkPaymentStatus, getParticipantFromFirebase } from '../services/firebase';

type QRScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRScanner'>;

type Props = {
    navigation: QRScannerScreenNavigationProp;
};

export default function QRScannerScreen({ navigation }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const { eventContext } = useEventContext();

    const currentEvent = eventContext?.eventName || '';
    const isPaidEvent = PAID_EVENTS.includes(currentEvent);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || processing) return;

        setScanned(true);
        setProcessing(true);

        try {
            const scannedData = data.trim();

            // ===  QR SCAN DEBUG LOGGING ===
            console.log('='.repeat(50));
            console.log('QR SCAN DEBUG');
            console.log('='.repeat(50));
            console.log('Type:', type);
            console.log('Raw Data:', scannedData);
            console.log('Data Length:', scannedData.length);
            console.log('Current Event:', currentEvent);
            console.log('='.repeat(50));

            // Try to parse as JSON (for participant QR codes with full data)
            let qrParticipant = null;
            try {
                qrParticipant = JSON.parse(scannedData);
                console.log('✅ Successfully parsed as JSON');
                console.log('Parsed Data:', JSON.stringify(qrParticipant, null, 2));
            } catch (parseError) {
                console.log('ℹ️  Not JSON format, treating as plain UID');
            }

            // CASE 1: QR contains full participant data (JSON format)
            if (qrParticipant && qrParticipant.uid && qrParticipant.name) {
                console.log('📋 Processing participant QR with full data...');

                const { uid, name, email, phone, college, dept, year, events } = qrParticipant;

                // Check if participant's events include current event
                if (!events || !Array.isArray(events) || !events.includes(currentEvent)) {
                    const registeredEvents = events?.join(', ') || 'None';
                    console.log(`❌ Event mismatch: ${name} registered for [${registeredEvents}], not [${currentEvent}]`);

                    Alert.alert(
                        "Not Registered For Event",
                        `\n\nWould you like to register them for This Event ${currentEvent}?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Register Now",
                                onPress: () => {
                                    console.log('📝 Redirecting to registration with pre-filled data...');
                                    navigation.navigate('Registration', {
                                        prefilledUID: uid,
                                        prefilledName: name,
                                        prefilledEmail: email,
                                        prefilledPhone: phone,
                                        prefilledCollege: college,
                                        prefilledDept: dept,
                                        prefilledYear: year
                                    });
                                }
                            }
                        ]
                    );
                    return;
                }

                console.log(`✅ Event match confirmed for ${name}`);

                // Check if already exists locally
                let participant = await getParticipantByUIDAndEvent(uid, currentEvent);

                if (!participant) {
                    console.log('⚡ Participant not in local DB, auto-registering...');

                    // Auto-register from QR data
                    insertParticipant(
                        uid,
                        currentEvent,
                        name,
                        '', // phone not in QR
                        '', // email not in QR  
                        college || '',
                        '',
                        '', // degree not in QR
                        '',
                        dept || '',
                        '',
                        year || '',
                        'WEB',
                        1, // synced (from web registration)
                        0  // not checked in yet
                    );

                    console.log(`✅ Auto-registered ${name} to local DB`);

                    participant = {
                        uid,
                        name,
                        event_id: currentEvent,
                        participated: 0
                    };
                } else {
                    console.log('ℹ️  Participant already in local DB');
                }

                // Check if already participated
                if (participant.participated === 1) {
                    console.log('⚠️  Participant already participated');
                    Alert.alert(
                        "⚠️ Already Participated",
                        `${name} has already been participated.\n\nEvent: ${currentEvent}\n\nStatus: Participated ✅`,
                        [{ text: "OK" }]
                    );
                    return;
                }

                // For paid events, verify payment
                if (isPaidEvent) {
                    console.log('💳 Checking payment status (paid event)...');
                    try {
                        const paymentStatus = await checkPaymentStatus(uid, currentEvent);

                        if (!paymentStatus.verified) {
                            console.log('❌ Payment not completed');
                            Alert.alert(
                                "💳 Payment Required",
                                `This is a paid event and payment has not been verified.\n\nName: ${name}\n\nPlease collect payment or verify with registration desk.`,
                                [{ text: "OK" }]
                            );
                            return;
                        }
                        console.log('✅ Payment verified');
                    } catch (paymentError) {
                        console.log('⚠️  Payment check failed (offline?):', paymentError);
                        Alert.alert(
                            "⚠️ Cannot Verify Payment",
                            `Unable to verify payment status (might be offline).\n\nName: ${name}\n\nPlease verify manually.`,
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Allow Anyway",
                                    style: "destructive",
                                    onPress: () => confirmParticipation(participant)
                                }
                            ]
                        );
                        return;
                    }
                }

                // All checks passed
                console.log('✅ All checks passed, confirming participation...');
                confirmParticipation(participant);
                return;
            }

            // CASE 2: Simple UID (not JSON)
            console.log('🔍 Processing as simple UID...');
            const scannedUID = scannedData;

            // 1. Check local database
            let participant = await getParticipantByUIDAndEvent(scannedUID, currentEvent);

            // 2. If not found locally, try with just the UID
            if (!participant) {
                participant = await getParticipantByUID(scannedUID);
            }

            // 3. If still not found, check Firebase
            if (!participant) {
                console.log('🌐 Checking Firebase...');
                try {
                    const firebaseData = await getParticipantFromFirebase(scannedUID);
                    if (firebaseData && firebaseData.events?.includes(currentEvent)) {
                        console.log('✅ Found in Firebase');
                        participant = {
                            uid: scannedUID,
                            name: firebaseData.displayName || firebaseData.name || 'Unknown',
                            email: firebaseData.email || '',
                            phone: firebaseData.phone || '',
                            event_id: currentEvent,
                            participated: 0,
                            source: 'WEB'
                        };
                    }
                } catch (fbError) {
                    console.log("⚠️  Firebase lookup failed (might be offline):", fbError);
                }
            }

            // 4. Not registered at all
            if (!participant) {
                console.log('❌ Participant not found anywhere');
                const displayUID = scannedUID.length > 50 ? scannedUID.substring(0, 50) + '...' : scannedUID;
                Alert.alert(
                    "❌ Not Registered",
                    `No registration found.\n\nScanned: ${displayUID}\n\nEvent: ${currentEvent}\n\nPlease register on the website first.`,
                    [{ text: "OK" }]
                );
                return;
            }

            console.log(`✅ Found participant: ${participant.name}`);

            // 5. Check if already participated
            if (participant.participated === 1) {
                console.log('⚠️  Already participated');
                Alert.alert(
                    "⚠️ Already Verified",
                    `${participant.name} has already been verified.\n\nEvent: ${currentEvent}\n\nStatus: Participated ✅`,
                    [{ text: "OK" }]
                );
                return;
            }

            // 6. For paid events, verify payment
            if (isPaidEvent) {
                console.log('💳 Verifying payment...');
                try {
                    const paymentStatus = await checkPaymentStatus(scannedUID, currentEvent);

                    if (!paymentStatus.verified) {
                        console.log('❌ Payment not verified');
                        Alert.alert(
                            "💳 Payment Required",
                            `This is a paid event and payment has not been verified.\n\nName: ${participant.name}\n\nPlease collect payment.`,
                            [{ text: "OK" }]
                        );
                        return;
                    }
                    console.log('✅ Payment verified');
                } catch (paymentError) {
                    console.log('⚠️  Payment check failed:', paymentError);
                    Alert.alert(
                        "⚠️ Cannot Verify Payment",
                        `Unable to verify payment (might be offline).\n\nName: ${participant.name}`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Allow Anyway",
                                style: "destructive",
                                onPress: () => confirmParticipation(participant)
                            }
                        ]
                    );
                    return;
                }
            }

            // 7. All checks passed
            console.log('✅ All verification checks passed');
            confirmParticipation(participant);

        } catch (error) {
            console.error("❌ Verification error:", error);
            Alert.alert("Error", `Failed to verify QR code: ${error}. Please try again.`);
        } finally {
            setProcessing(false);
        }
    };

    const confirmParticipation = (participant: any) => {
        Alert.alert(
            "✅ Verification Successful",
            `${participant.name}\n\n` +
            `Email: ${participant.email || 'N/A'}\n` +
            `Event: ${currentEvent}\n` +
            `Source: ${participant.source || 'Pre-registered'}\n\n` +
            `Mark as PARTICIPATED?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Confirm Entry",
                    onPress: () => {
                        markParticipated(participant.uid);
                        console.log(`✅ Marked ${participant.name} as participated`);
                        Alert.alert(
                            "🎉 Entry Confirmed!",
                            `${participant.name} has been marked as PARTICIPATED for ${currentEvent}.`
                        );
                    }
                }
            ]
        );
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
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Event Badge */}
            <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeLabel}>Verifying for</Text>
                <Text style={styles.eventBadgeName}>{currentEvent}</Text>
                {isPaidEvent && <Text style={styles.paidBadge}>💳 PAID EVENT</Text>}
            </View>

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
                        <Text style={styles.processingText}>Verifying...</Text>
                    </View>
                )}
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                    {scanned ? 'Tap below to scan again' : 'Point camera at participant\'s QR code'}
                </Text>
            </View>

            {/* Scan Again Button */}
            {scanned && !processing && (
                <TouchableOpacity
                    style={styles.scanAgainButton}
                    onPress={() => setScanned(false)}
                >
                    <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
                </TouchableOpacity>
            )}

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
}

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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 4,
    },
    paidBadge: {
        fontSize: 12,
        color: '#4CAF50',
        marginTop: 8,
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
    scanAgainButton: {
        backgroundColor: '#FFD700',
        padding: 16,
        margin: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    scanAgainText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
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
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 18,
    }
});