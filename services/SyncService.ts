import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { insertParticipant, getUnsyncedOnspot, markSynced } from "./sqlite";

// 1. Sync FROM Firebase (Pre-Event)
// Fetches all events and their participants, inserting them into local SQLite
export const syncFromFirebase = async () => {
    try {
        console.log("Starting sync from Firebase...");

        // Fetch all events
        const eventsSnapshot = await getDocs(collection(db, "events"));

        let totalSynced = 0;

        for (const eventDoc of eventsSnapshot.docs) {
            const eventId = eventDoc.id;
            const eventName = eventDoc.data().name || "Unknown Event";

            console.log(`Syncing event: ${eventName} (${eventId})`);

            // Fetch participants sub-collection for this event
            const participantsSnapshot = await getDocs(collection(db, `events/${eventId}/participants`));

            for (const participantDoc of participantsSnapshot.docs) {
                const data = participantDoc.data();
                const uid = participantDoc.id;

                // Insert into SQLite (INSERT OR IGNORE handles duplicates)
                insertParticipant(
                    uid,
                    eventId,
                    data.name || "Unknown",
                    data.phone || "",
                    data.email || "",
                    'WEB', // Source is WEB since it came from Firebase
                    1,     // Sync status is always 1 (Synced)
                    0      // Reset checked_in only if new record (handled by SQL IGNORE)
                );
                totalSynced++;
            }
        }

        console.log(`Sync complete. synced ${totalSynced} participants.`);
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
