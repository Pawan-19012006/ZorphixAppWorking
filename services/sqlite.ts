import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'zorphix_participants.db';
const WEB_STORAGE_KEY = 'zorphix_participants_data';

// Web Mock Storage with Persistence
let webParticipants: any[] = [];

// Load from localStorage on init
if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
        const saved = localStorage.getItem(WEB_STORAGE_KEY);
        if (saved) {
            webParticipants = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load web mock data", e);
    }
}

// Helper to save to localStorage
const saveWebData = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(webParticipants));
    }
};

// Use a mocked DB for web to prevent crashes
let db: any = null;
if (Platform.OS !== 'web') {
    try {
        db = SQLite.openDatabaseSync(DB_NAME);
    } catch (e) {
        console.error("Failed to open database", e);
    }
}

// Initialize the database table with extended schema
export const initParticipantDB = () => {
    if (Platform.OS === 'web') {
        console.log("Web Mock DB Initialized (with localStorage)");
        return;
    }
    if (!db) return;

    try {
        db.execSync(
            `CREATE TABLE IF NOT EXISTS participants (
                uid TEXT PRIMARY KEY,
                event_id TEXT,
                name TEXT,
                phone TEXT,
                email TEXT,
                college TEXT,
                college_other TEXT,
                degree TEXT,
                degree_other TEXT,
                department TEXT,
                department_other TEXT,
                year TEXT,
                checked_in INTEGER DEFAULT 0,
                checkin_time TEXT,
                source TEXT DEFAULT 'WEB',
                sync_status INTEGER DEFAULT 1,
                payment_verified INTEGER DEFAULT 0,
                participated INTEGER DEFAULT 0
            );`
        );
    } catch (e) {
        console.error("Failed to init DB", e);
    }
};

// Insert a participant with extended fields
export const insertParticipant = (
    uid: string,
    event_id: string,
    name: string,
    phone: string,
    email: string,
    college: string = '',
    college_other: string = '',
    degree: string = '',
    degree_other: string = '',
    department: string = '',
    department_other: string = '',
    year: string = '',
    source: 'WEB' | 'ONSPOT' = 'WEB',
    sync_status: number = 1,
    checked_in: number = 0
) => {
    if (Platform.OS === 'web') {
        const exists = webParticipants.find(p => p.uid === uid);
        if (!exists) {
            webParticipants.push({
                uid, event_id, name, phone, email,
                college, college_other, degree, degree_other,
                department, department_other, year,
                source, sync_status, checked_in, checkin_time: null,
                payment_verified: 0, participated: 0
            });
            saveWebData();
        }
        return;
    }
    if (!db) return;

    try {
        db.runSync(
            `INSERT OR IGNORE INTO participants 
            (uid, event_id, name, phone, email, college, college_other, degree, degree_other, 
             department, department_other, year, source, sync_status, checked_in) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [uid, event_id, name, phone, email, college, college_other, degree, degree_other,
                department, department_other, year, source, sync_status, checked_in]
        );
    } catch (e) {
        console.error("Insert failed", e);
    }
};

// Get participant by UID for QR verification
export const getParticipantByUID = async (uid: string): Promise<any> => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        return p || null;
    }
    if (!db) return null;

    try {
        const result = db.getFirstSync(
            `SELECT * FROM participants WHERE uid = ?;`,
            [uid]
        );
        return result || null;
    } catch (e) {
        console.error("Get participant failed", e);
        return null;
    }
};

// Get participant by UID and event for specific verification
export const getParticipantByUIDAndEvent = async (uid: string, eventId: string): Promise<any> => {
    if (Platform.OS === 'web') {
        // For web, try exact match first, then partial match
        let p = webParticipants.find(p => p.uid === uid && p.event_id === eventId);
        if (!p) {
            // Try looking for the base UID (Firebase UID without event suffix)
            p = webParticipants.find(p => p.uid.startsWith(uid) && p.event_id === eventId);
        }
        return p || null;
    }
    if (!db) return null;

    try {
        const result = db.getFirstSync(
            `SELECT * FROM participants WHERE (uid = ? OR uid LIKE ?) AND event_id = ?;`,
            [uid, `${uid}_%`, eventId]
        );
        return result || null;
    } catch (e) {
        console.error("Get participant by UID and event failed", e);
        return null;
    }
};

// Mark participant as checked in
export const markCheckedIn = (uid: string) => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        if (p) {
            p.checked_in = 1;
            p.checkin_time = new Date().toISOString();
            saveWebData();
        }
        return;
    }
    if (!db) return;

    const timestamp = new Date().toISOString();
    try {
        db.runSync(
            `UPDATE participants 
             SET checked_in = 1, checkin_time = ? 
             WHERE uid = ?;`,
            [timestamp, uid]
        );
    } catch (e) {
        console.error("Check-in failed", e);
    }
};

// Mark participant as participated (verified and allowed entry)
export const markParticipated = (uid: string) => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        if (p) {
            p.participated = 1;
            p.checked_in = 1;
            p.checkin_time = new Date().toISOString();
            saveWebData();
        }
        return;
    }
    if (!db) return;

    const timestamp = new Date().toISOString();
    try {
        db.runSync(
            `UPDATE participants 
             SET participated = 1, checked_in = 1, checkin_time = ? 
             WHERE uid = ?;`,
            [timestamp, uid]
        );
    } catch (e) {
        console.error("Mark participated failed", e);
    }
};

// Update payment verification status
export const updatePaymentStatus = (uid: string, verified: boolean) => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        if (p) {
            p.payment_verified = verified ? 1 : 0;
            saveWebData();
        }
        return;
    }
    if (!db) return;

    try {
        db.runSync(
            `UPDATE participants SET payment_verified = ? WHERE uid = ?;`,
            [verified ? 1 : 0, uid]
        );
    } catch (e) {
        console.error("Update payment status failed", e);
    }
};

// Get all unsynced ONSPOT registrations for post-event sync
export const getUnsyncedOnspot = async (): Promise<any[]> => {
    if (Platform.OS === 'web') {
        const unsynced = webParticipants.filter(p => p.source === 'ONSPOT' && p.sync_status === 0);
        return unsynced;
    }
    if (!db) return [];

    try {
        return db.getAllSync(
            `SELECT * FROM participants WHERE source = 'ONSPOT' AND sync_status = 0;`
        );
    } catch (e) {
        console.error("Get unsynced failed", e);
        return [];
    }
};

export const markSynced = (uid: string) => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        if (p) {
            p.sync_status = 1;
            saveWebData();
        }
        return;
    }
    if (!db) return;

    try {
        db.runSync(
            `UPDATE participants SET sync_status = 1 WHERE uid = ?;`,
            [uid]
        );
    } catch (e) {
        console.error("Mark synced failed", e);
    }
};

// Get all participants for the viewer
export const getAllParticipants = async (): Promise<any[]> => {
    if (Platform.OS === 'web') {
        return [...webParticipants];
    }
    if (!db) return [];

    try {
        return db.getAllSync(
            `SELECT * FROM participants ORDER BY name ASC;`
        );
    } catch (e) {
        console.error("Get all failed", e);
        return [];
    }
};

// Get participants for a specific event
export const getParticipantsByEvent = async (eventId: string): Promise<any[]> => {
    if (Platform.OS === 'web') {
        return webParticipants.filter(p => p.event_id === eventId);
    }
    if (!db) return [];

    try {
        return db.getAllSync(
            `SELECT * FROM participants WHERE event_id = ? ORDER BY name ASC;`,
            [eventId]
        );
    } catch (e) {
        console.error("Get by event failed", e);
        return [];
    }
};

// Get strictly locally added participants (Newly Added)
export const getOnSpotParticipants = async (): Promise<any[]> => {
    if (Platform.OS === 'web') {
        const local = webParticipants.filter(p => p.source === 'ONSPOT');
        return local;
    }
    if (!db) return [];

    try {
        return await db.getAllSync(
            `SELECT * FROM participants WHERE source = 'ONSPOT' ORDER BY rowid DESC;`
        );
    } catch (e) {
        console.error("Get onspot failed", e);
        return [];
    }
};

// Get count of participants for an event
export const getEventParticipantCount = async (eventId: string): Promise<{ total: number; checkedIn: number }> => {
    if (Platform.OS === 'web') {
        const eventParticipants = webParticipants.filter(p => p.event_id === eventId);
        const checkedIn = eventParticipants.filter(p => p.checked_in === 1).length;
        return { total: eventParticipants.length, checkedIn };
    }
    if (!db) return { total: 0, checkedIn: 0 };

    try {
        const totalResult = db.getFirstSync(
            `SELECT COUNT(*) as count FROM participants WHERE event_id = ?;`,
            [eventId]
        );
        const checkedInResult = db.getFirstSync(
            `SELECT COUNT(*) as count FROM participants WHERE event_id = ? AND checked_in = 1;`,
            [eventId]
        );
        return {
            total: totalResult?.count || 0,
            checkedIn: checkedInResult?.count || 0
        };
    } catch (e) {
        console.error("Get event count failed", e);
        return { total: 0, checkedIn: 0 };
    }
};

// Clear all data (for testing/reset)
export const clearAllParticipants = () => {
    if (Platform.OS === 'web') {
        webParticipants = [];
        saveWebData();
        return;
    }
    if (!db) return;

    try {
        db.runSync(`DELETE FROM participants;`);
    } catch (e) {
        console.error("Clear all failed", e);
    }
};
