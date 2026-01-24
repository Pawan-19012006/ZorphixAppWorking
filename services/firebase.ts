import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDu5oRJbf-gWqDZzMOK6HYmb0PBLXNqFEo",
    authDomain: "zorphix-8d91e.firebaseapp.com",
    projectId: "zorphix-8d91e",
    storageBucket: "zorphix-8d91e.firebasestorage.app",
    messagingSenderId: "1016587815374",
    appId: "1:1016587815374:web:4972ea556e5e781aaac39f",
    measurementId: "G-PK6GESKCSB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics only works on web
if (Platform.OS === 'web') {
    import('firebase/analytics').then(({ getAnalytics }) => {
        getAnalytics(app);
    });
}


// Initialize Firestore with settings to improve connectivity
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

// Initialize Auth
export const auth = getAuth(app);

// Admin login function
export const loginAdmin = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

// Logout function
export const logoutAdmin = async (): Promise<void> => {
    await signOut(auth);
};

// Get event name mapped to admin email
// This reads from a 'event_admins' collection where each doc has:
// { email: string, eventName: string }
export const getAdminEventMapping = async (email: string): Promise<string | null> => {
    try {
        // Try to find admin mapping in 'event_admins' collection
        const adminQuery = query(
            collection(db, "event_admins"),
            where("email", "==", email.toLowerCase())
        );
        const snapshot = await getDocs(adminQuery);

        if (!snapshot.empty) {
            const adminDoc = snapshot.docs[0].data();
            return adminDoc.eventName || null;
        }

        return null;
    } catch (error) {
        console.error("Failed to get admin event mapping:", error);
        return null;
    }
};

// Check payment status for a user's event registration
export const checkPaymentStatus = async (
    userUid: string,
    eventName: string
): Promise<{ isPaid: boolean; verified: boolean }> => {
    try {
        const userDoc = await getDoc(doc(db, "registrations", userUid));

        if (!userDoc.exists()) {
            return { isPaid: false, verified: false };
        }

        const data = userDoc.data();
        const payments = data.payments || [];

        // Check if any payment includes this event
        for (const payment of payments) {
            if (payment.eventNames?.includes(eventName) && payment.verified) {
                return { isPaid: true, verified: true };
            }
        }

        // Check if event is in their registered events (might be free)
        const events = data.events || [];
        if (events.includes(eventName)) {
            // Event is registered, check if it's a paid event
            // Free events don't need payment verification
            return { isPaid: false, verified: true };
        }

        return { isPaid: false, verified: false };
    } catch (error) {
        console.error("Failed to check payment status:", error);
        throw error;
    }
};

// Get participant info from Firebase by UID
export const getParticipantFromFirebase = async (userUid: string) => {
    try {
        const userDoc = await getDoc(doc(db, "registrations", userUid));

        if (!userDoc.exists()) {
            return null;
        }

        return userDoc.data();
    } catch (error) {
        console.error("Failed to get participant from Firebase:", error);
        return null;
    }
};
