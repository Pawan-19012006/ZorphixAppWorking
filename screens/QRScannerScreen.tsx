import React, { useState } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, PAID_EVENTS } from '../navigation/types';
import { useEventContext } from '../navigation/EventContext';
import { getParticipantByUID, getParticipantByUIDAndEvent, markParticipated, insertParticipant } from '../services/sqlite';
import { checkPaymentStatus, getParticipantFromFirebase, registerUserOnSpot } from '../services/firebase';
import { Modal, Image } from 'react-native';

type QRScannerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QRScanner'>;

type Props = {
    navigation: QRScannerScreenNavigationProp;
};

export default function QRScannerScreen({ navigation }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);

    // On-Spot Registration State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingParticipant, setPendingParticipant] = useState<any>(null);

    const { eventContext } = useEventContext();

    const currentEvent = eventContext?.eventName || '';
    const isPaidEvent = PAID_EVENTS.includes(currentEvent);

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
                        markParticipated(participant.uid, currentEvent);
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

    const markAttendance = (uid: string, eventId: string) => {
        markParticipated(uid, eventId);
        Alert.alert(
            "🎉 Re-enrolled!",
            `Participant has been marked as attended again for ${eventId}.`
        );
    };

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
                // FIRST: Check local DB (in case of on-spot registration)
                const localParticipant = await getParticipantByUIDAndEvent(uid, currentEvent);

                if (!localParticipant && (!events || !Array.isArray(events) || !events.includes(currentEvent))) {
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

                    // Strict Payment Check for Paid Events
                    // If it is a paid event, we MUST verify payment via transactionId or paid_value in QR
                    if (isPaidEvent) {
                        // FIX: Logic updated to check for SPECIFIC event payment in the 'payments' array
                        // The user reported "one time payment add" issue where paying for one event allowed entry to others.
                        // We must find a payment record specifically for THIS event. 

                        let isVerifiedForThisEvent = false;

                        // Check 'payments' array structure (preferred)
                        if (qrParticipant.payments && Array.isArray(qrParticipant.payments)) {
                            const payments = qrParticipant.payments;
                            for (const p of payments) {
                                // Check if this payment is verified AND covers the current event
                                if (p.verified && p.eventNames && Array.isArray(p.eventNames) && p.eventNames.includes(currentEvent)) {
                                    isVerifiedForThisEvent = true;
                                    break;
                                }
                            }
                        }
                        // Fallback: If no payments array, check legacy single transactionId
                        // BUT only if we are sure it applies? Actually, user says "n payment id must be there".
                        // So we should be strict. If it's a paid event and we can't find specific payment, FAIL.
                        // However, to avoid breaking legacy QRs completely if they truly only had one event...
                        // If 'events' length is 1 and matches currentEvent, maybe we trust transactionId?
                        else if (qrParticipant.transactionId && qrParticipant.events && qrParticipant.events.length === 1 && qrParticipant.events.includes(currentEvent)) {
                            isVerifiedForThisEvent = true;
                        }

                        if (!isVerifiedForThisEvent) {
                            console.log(`❌ Paid event '${currentEvent}' but no specific payment verification found in QR.`);

                            // Pre-fill payment modal data
                            setPendingParticipant({
                                uid: uid,
                                amount: 0,
                                // Pass other data if we want to register them after payment
                                ...qrParticipant
                            });
                            setShowPaymentModal(true);
                            return;
                        }
                        console.log('✅ Payment Verified via QR Data (Specific Event Verification)');
                    }

                    // Auto-register from QR data
                    insertParticipant(
                        uid,
                        currentEvent,
                        name,
                        phone || '',
                        email || '',
                        college || '',
                        '',
                        '', // degree not in QR
                        '',
                        dept || '',
                        '',
                        year || '',
                        'WEB',
                        1, // synced
                        0  // not checked in yet
                    );

                    console.log(`✅ Auto-registered ${name} to local DB`);

                    participant = {
                        uid,
                        name,
                        email,
                        event_id: currentEvent,
                        participated: 0,
                        source: 'WEB'
                    };
                }

                // Check if already participated
                if (participant.participated === 1 && isPaidEvent) {
                    Alert.alert(
                        "⚠️ Already Participated",
                        `${name} has already been participated.\n\nEvent: ${currentEvent}\n\nStatus: Participated ✅`,
                        [{ text: "OK" }]
                    );
                    return;
                }
                else if (participant.participated === 1 && !isPaidEvent) {
                    Alert.alert(
                        "⚠️ Already Participated",
                        `${name} has already attended this event. Do you want to mark them as participated again?`,
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Enroll",
                                onPress: () => markAttendance(uid, currentEvent)
                            }
                        ]
                    );
                    return;
                }
                // For paid events, verify payment
                if (isPaidEvent) {
                    try {
                        const paymentStatus = await checkPaymentStatus(uid, currentEvent);
                        if (!paymentStatus.verified) {
                            Alert.alert(
                                "💳 Payment Required",
                                `This is a paid event and payment has not been verified.\n\nName: ${name}\n\nPlease collect payment.`,
                                [{ text: "OK" }]
                            );
                            return;
                        }
                    } catch (paymentError) {
                        Alert.alert(
                            "⚠️ Cannot Verify Payment",
                            `Unable to verify payment status.\n\nName: ${name}`,
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
                const p = await getParticipantByUID(scannedUID);
                // If found here, it's just history. We likely need to check firebase or register new for THIS event.
                if (p) {
                    // Found them in another event, but not this one
                }
            }

            // 3. If still not found, check Firebase
            if (!participant || participant.event_id !== currentEvent) {
                console.log('🌐 Checking Firebase...');
                try {
                    const firebaseData = await getParticipantFromFirebase(scannedUID);
                    if (firebaseData) {
                        // Check if registered for this event
                        if (firebaseData.events?.includes(currentEvent)) {
                            console.log('✅ Found in Firebase for this event');
                            participant = {
                                uid: scannedUID,
                                name: firebaseData.displayName || firebaseData.name || 'Unknown',
                                email: firebaseData.email || '',
                                phone: firebaseData.phone || '',
                                event_id: currentEvent,
                                participated: 0,
                                source: 'WEB'
                            };
                            // Auto-insert locally
                            insertParticipant(
                                scannedUID,
                                currentEvent,
                                participant.name,
                                participant.phone,
                                participant.email,
                                firebaseData.college || '',
                                firebaseData.collegeOther || '',
                                firebaseData.degree || '',
                                firebaseData.degreeOther || '',
                                firebaseData.department || '',
                                firebaseData.departmentOther || '',
                                firebaseData.year || '',
                                'WEB',
                                1,
                                0
                            );
                        } else {
                            console.log(`User exists in Firebase but not for ${currentEvent}`);
                        }
                    }
                } catch (fbError) {
                    console.log("⚠️  Firebase lookup failed:", fbError);
                }
            }

            if (!participant) {
                if (isPaidEvent) {
                    console.log('💳 User not registered for PAID event. Initiating On-Spot Registration...');
                    setPendingParticipant({
                        uid: scannedUID,
                        amount: 0 // Default, can be dynamic if needed
                    });
                    setShowPaymentModal(true);
                    return;
                }

                const displayUID = scannedUID.length > 20 ? scannedUID.substring(0, 20) + '...' : scannedUID;
                Alert.alert(
                    "❌ Not Registered",
                    `No registration found for this event.\n\nScanned: ${displayUID}\n\nPlease register first.`,
                    [{ text: "OK" }]
                );
                return;
            }

            // Check participated
            if (participant.participated === 1) {
                Alert.alert("⚠️ Already Participated", `${participant.name} has already participated.`);
                return;
            }

            // Paid Check
            if (isPaidEvent) {
                try {
                    const paymentStatus = await checkPaymentStatus(scannedUID, currentEvent);
                    if (!paymentStatus.verified) {
                        Alert.alert("💳 Payment Required", "Payment not verified.");
                        return;
                    }
                } catch (e) {
                    console.log("Payment check error", e);
                    Alert.alert(
                        "⚠️ Cannot Verify Payment",
                        `Unable to verify payment status.\n\nName: ${participant.name}`,
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

            confirmParticipation(participant);

        } catch (error) {
            console.error("❌ Verification error:", error);
            Alert.alert("Error", `Failed to verify QR code: ${error}`);
        } finally {
            setProcessing(false);
        }
    };

    const handleOnSpotRegistration = async () => {
        if (!pendingParticipant) return;

        setProcessing(true);
        try {
            const { uid } = pendingParticipant;
            console.log(`💸 Processing On-Spot Cash Payment for ${uid}`);

            // 1. Update Firebase
            const success = await registerUserOnSpot(uid, currentEvent, 0); // Assuming 0 or fixed amount for now

            if (success) {
                // 2. Insert into Local DB (SQLite)
                // We need to fetch basic user data primarily. 
                // Since they are not in local DB (otherwise we wouldn't be here), try to fetch from Firebase again to get details,
                // or just use placeholders if Firebase fetch fails/is slow.
                const firebaseData = await getParticipantFromFirebase(uid);

                const name = firebaseData?.displayName || firebaseData?.name || 'On-Spot User';
                const email = firebaseData?.email || '';
                const phone = firebaseData?.phone || '';

                await insertParticipant(
                    uid,
                    currentEvent,
                    name,
                    phone,
                    email,
                    firebaseData?.college || '',
                    '',
                    firebaseData?.degree || '',
                    '',
                    firebaseData?.department || '',
                    '',
                    firebaseData?.year || '',
                    'ONSPOT',
                    1,
                    1 // Mark as participated immediately!
                );

                console.log(`✅ On-Spot Registration Complete for ${name}`);

                Alert.alert(
                    "🎉 Registration Successful",
                    `User registered and marked as PAID via Cash.\n\nWelcome ${name}!`,
                    [{
                        text: "OK", onPress: () => {
                            setShowPaymentModal(false);
                            setPendingParticipant(null);
                            setScanned(false);
                        }
                    }]
                );
            } else {
                Alert.alert("❌ Error", "Failed to update registration online. Please check internet.");
            }
        } catch (error) {
            console.error("On-Spot Error:", error);
            Alert.alert("❌ Error", "An error occurred during registration.");
        } finally {
            setProcessing(false);
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

            {/* Payment Modal */}
            <Modal
                visible={showPaymentModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPaymentModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>💰 Payment Required</Text>
                        <Text style={styles.modalSubtitle}>Event: {currentEvent}</Text>

                        <View style={styles.qrContainer}>
                            <Image
                                source={require('../tresurerQR.jpg')}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.modalInstruction}>
                            Scan to Pay. Verify payment with Treasurer.
                        </Text>

                        <TouchableOpacity
                            style={styles.payCashButton}
                            onPress={handleOnSpotRegistration}
                        >
                            <Text style={styles.payCashButtonText}>💵 Verified - Register User</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setShowPaymentModal(false);
                                setPendingParticipant(null);
                                setScanned(false);
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        borderWidth: 1,
        borderColor: '#333'
    },
    modalTitle: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8
    },
    modalSubtitle: {
        color: '#AAA',
        fontSize: 16,
        marginBottom: 20
    },
    qrContainer: {
        width: 200,
        height: 200,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 10,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    qrImage: {
        width: '100%',
        height: '100%'
    },
    modalInstruction: {
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 14
    },
    payCashButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12
    },
    payCashButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    cancelButton: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center'
    },
    cancelButtonText: {
        color: '#FF5252',
        fontSize: 16
    }
});