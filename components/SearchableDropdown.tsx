import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

interface SearchableDropdownProps {
    label: string;
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    placeholder: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    label,
    value,
    options,
    onSelect,
    placeholder
}) => {
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (item: string) => {
        onSelect(item);
        setVisible(false);
        setSearchQuery(''); // Reset search on select
    };

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

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalOverlayTouchable}
                        activeOpacity={1}
                        onPress={() => setVisible(false)}
                    >
                        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search..."
                                    placeholderTextColor="#666"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus={false}
                                />
                            </View>

                            <FlatList
                                data={filteredOptions}
                                keyExtractor={(item) => item}
                                keyboardShouldPersistTaps="handled"
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>No results found</Text>
                                    </View>
                                }
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.modalItem,
                                            value === item && styles.modalItemSelected
                                        ]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text
                                            style={[
                                                styles.modalItemText,
                                                value === item && styles.modalItemTextSelected
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#FFD700',
        marginBottom: 8,
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
    },
    modalOverlayTouchable: {
        flex: 1,
        width: '100%',
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
        overflow: 'hidden',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: '#1a1a1a',
    },
    searchContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    searchInput: {
        backgroundColor: '#222',
        color: 'white',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
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
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    }
});

export default SearchableDropdown;
