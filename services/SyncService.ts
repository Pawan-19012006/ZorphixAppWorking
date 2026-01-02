import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { insertParticipant, getUnsyncedOnspot, markSynced } from "./sqlite";

// 1. Sync FROM Firebase (Pre-Event)
// Fetches all events and their participants, inserting them into local SQLite
// 1. Sync FROM Firebase (Pre-Event)
// Fetches all registrations and inserts them into local SQLite
// Maps the 'events' array to multiple local participant entries
export const syncFromFirebase = async () => {
    try {
        console.log("Starting sync from Firebase...");

        // Fetch all registrations
        const snapshot = await getDocs(collection(db, "registrations"));
        let totalSynced = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const events = data.events || []; // Array of event names
            const firestoreUid = data.uid || doc.id;

            // For each event the user is registered for, create a local record
            for (const eventName of events) {
                // Create a unique local UID so one user can be in multiple events
                // Format: FIREBASEUID_EVENTNAME
                const localUid = `${firestoreUid}_${eventName.replace(/\s+/g, '')}`;

                insertParticipant(
                    localUid,
                    eventName, // Using name as ID for now
                    data.displayName || "Unknown",
                    data.phone || "",
                    data.email || "",
                    'WEB',
                    1,
                    0
                );
                totalSynced++;
            }
        }

        console.log(`Sync complete. Synced ${totalSynced} records.`);
        return true;
    } catch (error) {
        console.error("Sync failed:", error);
        throw error;
    }
};

// 2. Sync ON-SPOT TO Firebase (Post-Event)
// Pushes locally registered 'ONSPOT' participants to Firestore
export const syncOnspotToFirebase = async () => {
    try {
        const unsyncedParams = await getUnsyncedOnspot();

        if (unsyncedParams.length === 0) {
            console.log("No unsynced on-spot registrations found.");
            return 0;
        }

        console.log(`Found ${unsyncedParams.length} unsynced participants. Uploading...`);

        const batch = writeBatch(db);

        for (const p of unsyncedParams) {
            // Use the locally generated UID
            const userRef = doc(db, `events/${p.event_id}/participants/${p.uid}`);

            batch.set(userRef, {
                name: p.name,
                phone: p.phone,
                email: p.email,
                checkedIn: p.checked_in === 1,
                checkinTime: p.checkin_time,
                source: 'ONSPOT'
            });
        }

        await batch.commit();

        // Mark local records as synced
        for (const p of unsyncedParams) {
            markSynced(p.uid);
        }

        return unsyncedParams.length;

    } catch (error) {
        console.error("Upload failed:", error);
        throw error;
    }
};
