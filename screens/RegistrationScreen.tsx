import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, COLLEGES, DEGREES, DEPARTMENTS, YEARS } from '../navigation/types';
import { useEventContext } from '../navigation/EventContext';
import { insertParticipant } from '../services/sqlite';

type RegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Registration'>;
type RegistrationScreenRouteProp = RouteProp<RootStackParamList, 'Registration'>;

type Props = {
    navigation: RegistrationScreenNavigationProp;
    route: RegistrationScreenRouteProp;
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

const RegistrationScreen: React.FC<Props> = ({ navigation, route }) => {
    const { eventContext } = useEventContext();
    const prefilledUID = route.params?.prefilledUID;
    const prefilledName = route.params?.prefilledName;
    const prefilledEmail = route.params?.prefilledEmail;
    const prefilledPhone = route.params?.prefilledPhone;
    const prefilledCollege = route.params?.prefilledCollege;
    const prefilledDept = route.params?.prefilledDept;
    const prefilledYear = route.params?.prefilledYear;

    // Form state - initialize with pre-filled values if available
    const [name, setName] = useState(prefilledName || '');
    const [email, setEmail] = useState(prefilledEmail || '');
    const [phone, setPhone] = useState(prefilledPhone || '');
    const [college, setCollege] = useState(prefilledCollege || '');
    const [collegeOther, setCollegeOther] = useState('');
    const [degree, setDegree] = useState('');
    const [degreeOther, setDegreeOther] = useState('');
    const [department, setDepartment] = useState(prefilledDept || '');
    const [departmentOther, setDepartmentOther] = useState('');
    const [year, setYear] = useState(prefilledYear || '');
    const [submitting, setSubmitting] = useState(false);

    // Update form fields when prefilled values change (handles navigation re-use)
    React.useEffect(() => {
        if (prefilledName) setName(prefilledName);
        if (prefilledEmail) setEmail(prefilledEmail);
        if (prefilledPhone) setPhone(prefilledPhone);
        if (prefilledCollege) setCollege(prefilledCollege);
        if (prefilledDept) setDepartment(prefilledDept);
        if (prefilledYear) setYear(prefilledYear);
    }, [
        prefilledName,
        prefilledEmail,
        prefilledPhone,
        prefilledCollege,
        prefilledDept,
        prefilledYear
    ]);

    const validateForm = (): boolean => {
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
        if (!eventContext?.eventName) {
            Alert.alert('Error', 'Event not set. Please re-login.');
            return;
        }

        setSubmitting(true);

        try {
            const eventId = eventContext.eventName;

            // Use pre-filled UID if available (from QR scan), otherwise generate new one
            const uid = prefilledUID || `${eventId.replace(/\s+/g, '')}-ONSPOT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            // Prepare data
            const finalCollege = college === 'Other' ? collegeOther : college;
            const finalDegree = degree === 'Other' ? degreeOther : degree;
            const finalDepartment = department === 'Other' ? departmentOther : department;

            await insertParticipant(
                uid,
                eventId,
                name.trim(),
                phone.trim(),
                email.trim().toLowerCase(),
                finalCollege,
                college === 'Other' ? collegeOther : '',
                finalDegree,
                degree === 'Other' ? degreeOther : '',
                finalDepartment,
                department === 'Other' ? departmentOther : '',
                year,
                'ONSPOT',
                0,  // sync_status: not synced
                1   // checked_in: yes (they're here on-spot)
            );

            Alert.alert(
                'Registration Successful! ✅',
                `${name} has been registered for ${eventId}.\n\nUID: ${uid}\n\nPlease ask the participant to take a photo of this for their records.`,
                [
                    {
                        text: 'Register Another',
                        onPress: () => {
                            // Reset form
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
                        }
                    },
                    { text: 'Done', onPress: () => navigation.goBack() }
                ]
            );
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', 'Failed to save registration. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                {/* Event Badge */}
                <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeLabel}>Registering for</Text>
                    <Text style={styles.eventBadgeName}>{eventContext?.eventName || 'No Event'}</Text>
                </View>

                <Text style={styles.title}>New Registration</Text>
                <Text style={styles.subtitle}>Fill in the participant details</Text>

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
                        {submitting ? 'Registering...' : 'Submit Registration'}
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
        borderColor: '#FFD700',
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
    button: {
        backgroundColor: '#FFD700',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default RegistrationScreen;
