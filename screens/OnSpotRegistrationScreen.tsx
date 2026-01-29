import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, COLLEGES, DEGREES, DEPARTMENTS, YEARS, ALL_EVENTS, PAID_EVENTS } from '../navigation/types';
import { insertParticipant } from '../services/sqlite';
import QRCode from 'react-native-qrcode-svg';

type OnSpotRegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OnSpotRegistration'>;

type Props = {
    navigation: OnSpotRegistrationScreenNavigationProp;
};

interface DropdownProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    placeholder: string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect, placeholder }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.formGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setVisible(true)}
            >
                <Text style={[styles.dropdownText, !value && styles.placeholder]}>
                    {value || placeholder}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, value === item && styles.modalItemSelected]}
                                    onPress={() => {
                                        onSelect(item);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={[styles.modalItemText, value === item && styles.modalItemTextSelected]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const OnSpotRegistrationScreen: React.FC<Props> = ({ navigation }) => {
    // Form state
    const [selectedEvent, setSelectedEvent] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [college, setCollege] = useState('');
    const [collegeOther, setCollegeOther] = useState('');
    const [degree, setDegree] = useState('');
    const [degreeOther, setDegreeOther] = useState('');
    const [department, setDepartment] = useState('');
    const [departmentOther, setDepartmentOther] = useState('');
    const [year, setYear] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [registeredData, setRegisteredData] = useState<any>(null);

    const validateForm = (): boolean => {
        if (!selectedEvent) {
            Alert.alert('Error', 'Please select an event');
            return false;
        }
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter full name');
            return false;
        }
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email');
            return false;
        }
        if (!phone.trim() || phone.length !== 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return false;
        }
        if (!college) {
            Alert.alert('Error', 'Please select a college');
            return false;
        }
        if (college === 'Other' && !collegeOther.trim()) {
            Alert.alert('Error', 'Please enter your college name');
            return false;
        }
        if (!degree) {
            Alert.alert('Error', 'Please select a degree');
            return false;
        }
        if (degree === 'Other' && !degreeOther.trim()) {
            Alert.alert('Error', 'Please enter your degree');
            return false;
        }
        if (!department) {
            Alert.alert('Error', 'Please select a department');
            return false;
        }
        if (department === 'Other' && !departmentOther.trim()) {
            Alert.alert('Error', 'Please enter your department');
            return false;
        }
        if (!year) {
            Alert.alert('Error', 'Please select year of study');
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setSubmitting(true);

        // Generate UID for on-spot registration (no event prefix since it's desk reg)
        const uid = `ONSPOT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Merge "Other" fields into main fields
        const finalCollege = college === 'Other' ? collegeOther.trim() : college;
        const finalDegree = degree === 'Other' ? degreeOther.trim() : degree;
        const finalDept = department === 'Other' ? departmentOther.trim() : department;

        // Check if selected event is paid
        const isPaidEvent = PAID_EVENTS.includes(selectedEvent);

        try {
            // Insert to SQLite only (no Firebase)
            insertParticipant(
                uid,
                selectedEvent,
                name.trim(),
                phone.trim(),
                email.trim().toLowerCase(),
                finalCollege,
                finalDegree,
                finalDept,
                year,
                'ONSPOT',
                0, // sync_status: 0 (unsynced - will sync later)
                isPaidEvent ? 1 : 0, // payment_verified: assume paid if paid event (desk handles payment)
                0, // participated: 0 (not checked in yet)
                '', // team_name
                '', // team_members
                isPaidEvent ? 'paid' : 'free' // event_type
            );

            setSubmitting(false);

            setRegisteredData({
                uid,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                college: finalCollege,
                dept: finalDept,
                year,
                events: [selectedEvent],
                payments: isPaidEvent ? [{
                    eventNames: [selectedEvent],
                    verified: true,
                    amount: 0,
                    id: `onspot_${Date.now()}`
                }] : []
            });
            setShowSuccess(true);

        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', 'Failed to save registration.');
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedEvent('');
        setName('');
        setEmail('');
        setPhone('');
        setCollege('');
        setCollegeOther('');
        setDegree('');
        setDegreeOther('');
        setDepartment('');
        setDepartmentOther('');
        setYear('');
        setRegisteredData(null);
        setShowSuccess(false);
    };

    if (showSuccess && registeredData) {
        const qrValue = JSON.stringify({
            uid: registeredData.uid,
            name: registeredData.name,
            email: registeredData.email,
            phone: registeredData.phone,
            college: registeredData.college,
            dept: registeredData.dept,
            year: registeredData.year,
            events: registeredData.events,
            payments: registeredData.payments
        });

        return (
            <View style={styles.successContainer}>
                <View style={[styles.eventBadge, { marginBottom: 30 }]}>
                    <Text style={styles.eventBadgeLabel}>Registration Successful</Text>
                    <Text style={styles.eventBadgeName}>{selectedEvent}</Text>
                </View>

                <View style={styles.qrContainer}>
                    <QRCode
                        value={qrValue}
                        size={250}
                        color="black"
                        backgroundColor="white"
                    />
                </View>

                <Text style={styles.successTitle}>{registeredData.name}</Text>
                <Text style={styles.successSubtitle}>UID: {registeredData.uid}</Text>
                <Text style={styles.instructionText}>
                    Please ask the participant to take a photo of this QR code.
                </Text>

                <View style={styles.successButtonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.successButton]}
                        onPress={() => {
                            resetForm();
                            navigation.goBack();
                        }}
                    >
                        <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.successButton, { backgroundColor: '#333', marginTop: 0 }]}
                        onPress={resetForm}
                    >
                        <Text style={[styles.buttonText, { color: '#FFF' }]}>Add Another</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Badge */}
                <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeLabel}>On-Spot Registration Desk</Text>
                    <Text style={styles.eventBadgeName}>📋 New Participant</Text>
                </View>

                <Text style={styles.title}>On-Spot Registration</Text>
                <Text style={styles.subtitle}>Register a new participant at the desk</Text>

                {/* Event Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Event Selection</Text>

                    <Dropdown
                        label="Select Event *"
                        value={selectedEvent}
                        options={ALL_EVENTS}
                        onSelect={setSelectedEvent}
                        placeholder="Choose an event"
                    />

                    {selectedEvent && PAID_EVENTS.includes(selectedEvent) && (
                        <View style={styles.paidEventWarning}>
                            <Text style={styles.paidEventText}>💰 This is a PAID event - Ensure payment is collected!</Text>
                        </View>
                    )}
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter full name"
                            placeholderTextColor="#666"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 10-digit phone number"
                            placeholderTextColor="#666"
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                    </View>
                </View>

                {/* Academic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Academic Information</Text>

                    <Dropdown
                        label="College *"
                        value={college}
                        options={COLLEGES}
                        onSelect={setCollege}
                        placeholder="Select your college"
                    />

                    {college === 'Other' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>College Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your college name"
                                placeholderTextColor="#666"
                                value={collegeOther}
                                onChangeText={setCollegeOther}
                            />
                        </View>
                    )}

                    <Dropdown
                        label="Degree *"
                        value={degree}
                        options={DEGREES}
                        onSelect={setDegree}
                        placeholder="Select your degree"
                    />

                    {degree === 'Other' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Degree Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your degree"
                                placeholderTextColor="#666"
                                value={degreeOther}
                                onChangeText={setDegreeOther}
                            />
                        </View>
                    )}

                    <Dropdown
                        label="Department *"
                        value={department}
                        options={DEPARTMENTS}
                        onSelect={setDepartment}
                        placeholder="Select your department"
                    />

                    {department === 'Other' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Department Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your department"
                                placeholderTextColor="#666"
                                value={departmentOther}
                                onChangeText={setDepartmentOther}
                            />
                        </View>
                    )}

                    <Dropdown
                        label="Year of Study *"
                        value={year}
                        options={YEARS}
                        onSelect={setYear}
                        placeholder="Select year"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, submitting && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={submitting}
                >
                    <Text style={styles.buttonText}>
                        {submitting ? 'Registering...' : 'Generate QR & Register'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    eventBadge: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4CAF50',
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
        color: '#4CAF50',
        marginTop: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#FFD700',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#111',
        color: 'white',
    },
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 15,
        backgroundColor: '#111',
    },
    dropdownText: {
        fontSize: 16,
        color: 'white',
        flex: 1,
    },
    placeholder: {
        color: '#666',
    },
    dropdownArrow: {
        color: '#FFD700',
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#111',
        borderRadius: 16,
        width: '100%',
        maxHeight: '70%',
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    modalItemSelected: {
        backgroundColor: '#1a1a1a',
    },
    modalItemText: {
        fontSize: 16,
        color: '#FFF',
    },
    modalItemTextSelected: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    paidEventWarning: {
        backgroundColor: '#332200',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    paidEventText: {
        color: '#FFD700',
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        padding: 10,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    qrContainer: {
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 10,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 16,
        color: '#FFF',
        marginBottom: 10,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 30,
    },
    successButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
        gap: 10,
    },
    successButton: {
        flex: 1,
        marginTop: 0,
    },
});

export default OnSpotRegistrationScreen;
