import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { insertParticipant } from './sqlite';
import { Platform } from 'react-native';

const INITIAL_IMPORT_KEY = 'zorphix_initial_import_complete';

/**
 * Check if the initial data import has already been completed
 */
export const isInitialImportComplete = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(INITIAL_IMPORT_KEY);
        return value === 'true';
    } catch (error) {
        console.error('Failed to check initial import status:', error);
        return false;
    }
};

/**
 * Mark the initial import as complete
 */
const markImportComplete = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(INITIAL_IMPORT_KEY, 'true');
        console.log('✅ Initial import marked as complete');
    } catch (error) {
        console.error('Failed to mark import complete:', error);
    }
};

/**
 * Perform the one-time data import from Firebase to SQLite
 * Fetches all registrations and creates participant records for each event
 */
export const performInitialImport = async (): Promise<{
    success: boolean;
    totalRecords: number;
    errors: number
}> => {
    console.log('📥 Starting initial data import from Firebase...');

    let totalRecords = 0;
    let errors = 0;

    try {
        // Fetch all registrations from Firebase
        const snapshot = await getDocs(collection(db, 'registrations'));

        console.log(`📊 Found ${snapshot.docs.length} registrations in Firebase`);

        for (const docSnap of snapshot.docs) {
            try {
                const data = docSnap.data();
                const events = data.events || []; // Array of event names user is registered for
                const firestoreUid = data.uid || docSnap.id;
                const payments = data.payments || [];

                // For each event the user is registered for, create a local record
                for (const eventName of events) {
                    // Check if payment is verified for this specific event
                    const paymentVerified = payments.some(
                        (p: any) => p.eventNames?.includes(eventName) && p.verified
                    ) ? 1 : 0;

                    // Determine event type based on payment info
                    const eventType = paymentVerified ? 'paid' : 'free';

                    // Insert participant into local SQLite
                    insertParticipant(
                        firestoreUid,                                           // uid
                        eventName,                                              // event_id
                        data.displayName || data.name || 'Unknown',             // name
                        data.phone || '',                                       // phone
                        data.email || '',                                       // email
                        data.college || data.collegeOther || '',                // college
                        data.degree || data.degreeOther || '',                  // degree
                        data.department || data.departmentOther || '',          // department
                        data.year || '',                                        // year
                        'WEB',                                                  // source (from web registration)
                        1,                                                      // sync_status (already synced)
                        paymentVerified,                                        // payment_verified
                        0,                                                      // participated (not yet)
                        '',                                                     // team_name
                        '',                                                     // team_members
                        eventType as 'free' | 'paid'                           // event_type
                    );

                    totalRecords++;
                }
            } catch (docError) {
                console.error(`Failed to process document ${docSnap.id}:`, docError);
                errors++;
            }
        }

        console.log(`✅ Initial import complete: ${totalRecords} records imported, ${errors} errors`);

        // Mark import as complete
        await markImportComplete();

        return { success: true, totalRecords, errors };

    } catch (error) {
        console.error('❌ Initial import failed:', error);
        return { success: false, totalRecords, errors: errors + 1 };
    }
};

/**
 * Main entry point for initial data import
 * Checks if import was already done, runs it if not
 * Should be called during app initialization
 */
export const runInitialDataImport = async (): Promise<void> => {
    // Skip on web platform (uses localStorage mock)
    if (Platform.OS === 'web') {
        console.log('⏭️ Skipping initial import on web platform');
        return;
    }

    try {
        const alreadyComplete = await isInitialImportComplete();

        if (alreadyComplete) {
            console.log('⏭️ Initial import already complete, skipping...');
            return;
        }

        console.log('🔄 First launch detected, starting data import...');
        const result = await performInitialImport();

        if (result.success) {
            console.log(`🎉 Successfully imported ${result.totalRecords} participant records`);
        } else {
            console.error('⚠️ Import completed with errors');
        }

    } catch (error) {
        console.error('❌ runInitialDataImport failed:', error);
    }
};

/**
 * Force re-run the initial import (for testing/debugging)
 * Clears the completion flag and runs the import again
 */
export const forceRerunImport = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(INITIAL_IMPORT_KEY);
        console.log('🔄 Import flag cleared, re-running import...');
        await runInitialDataImport();
    } catch (error) {
        console.error('Failed to force re-run import:', error);
    }
};
