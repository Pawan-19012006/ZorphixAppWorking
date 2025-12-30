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
    db = SQLite.openDatabase(DB_NAME);
}

// Initialize the database table
export const initParticipantDB = () => {
    if (Platform.OS === 'web') {
        console.log("Web Mock DB Initialized (with localStorage)");
        return;
    }
    if (!db) return;

    db.transaction((tx: any) => {
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS participants (
                uid TEXT PRIMARY KEY,
                event_id TEXT,
                name TEXT,
                phone TEXT,
                email TEXT,
                checked_in INTEGER DEFAULT 0,
                checkin_time TEXT,
                source TEXT DEFAULT 'WEB',
                sync_status INTEGER DEFAULT 1
            );`
        );
    });
};

// Insert a participant (INSERT OR IGNORE to prevent duplicates)
export const insertParticipant = (
    uid: string,
    event_id: string,
    name: string,
    phone: string,
    email: string,
    source: 'WEB' | 'ONSPOT' = 'WEB',
    sync_status: number = 1,
    checked_in: number = 0
) => {
    if (Platform.OS === 'web') {
        const exists = webParticipants.find(p => p.uid === uid);
        if (!exists) {
            webParticipants.push({
                uid, event_id, name, phone, email, source, sync_status, checked_in, checkin_time: null
            });
            saveWebData(); // Persist
        }
        return;
    }
    if (!db) return;

    db.transaction((tx: any) => {
        tx.executeSql(
            `INSERT OR IGNORE INTO participants 
            (uid, event_id, name, phone, email, source, sync_status, checked_in) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [uid, event_id, name, phone, email, source, sync_status, checked_in]
        );
    });
};

// Get participant by UID for QR verification
export const getParticipantByUID = (uid: string): Promise<any> => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        return Promise.resolve(p || null);
    }
    if (!db) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                `SELECT * FROM participants WHERE uid = ?;`,
                [uid],
                (_: any, { rows }: any) => {
                    resolve(rows.length > 0 ? rows.item(0) : null);
                },
                (_: any, error: any) => {
                    reject(error);
                    return false;
                }
            );
        });
    });
};

// Mark participant as checked in
export const markCheckedIn = (uid: string) => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        if (p) {
            p.checked_in = 1;
            p.checkin_time = new Date().toISOString();
            saveWebData(); // Persist
        }
        return;
    }
    if (!db) return;

    const timestamp = new Date().toISOString();
    db.transaction((tx: any) => {
        tx.executeSql(
            `UPDATE participants 
             SET checked_in = 1, checkin_time = ? 
             WHERE uid = ?;`,
            [timestamp, uid]
        );
    });
};

// Get all unsynced ONSPOT registrations for post-event sync
export const getUnsyncedOnspot = (): Promise<any[]> => {
    if (Platform.OS === 'web') {
        const unsynced = webParticipants.filter(p => p.source === 'ONSPOT' && p.sync_status === 0);
        return Promise.resolve(unsynced);
    }
    if (!db) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                `SELECT * FROM participants WHERE source = 'ONSPOT' AND sync_status = 0;`,
                [],
                (_: any, { rows }: any) => {
                    // Convert to array
                    let items = [];
                    for (let i = 0; i < rows.length; i++) {
                        items.push(rows.item(i));
                    }
                    resolve(items);
                },
                (_: any, error: any) => {
                    reject(error);
                    return false;
                }
            );
        });
    });
};

export const markSynced = (uid: string) => {
    if (Platform.OS === 'web') {
        const p = webParticipants.find(p => p.uid === uid);
        if (p) {
            p.sync_status = 1;
            saveWebData(); // Persist
        }
        return;
    }
    if (!db) return;

    db.transaction((tx: any) => {
        tx.executeSql(
            `UPDATE participants SET sync_status = 1 WHERE uid = ?;`,
            [uid]
        );
    });
};

// Get all participants for the viewer
export const getAllParticipants = (): Promise<any[]> => {
    if (Platform.OS === 'web') {
        return Promise.resolve([...webParticipants]);
    }
    if (!db) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
            tx.executeSql(
                `SELECT * FROM participants ORDER BY name ASC;`,
                [],
                (_: any, { rows }: any) => {
                    let items = [];
                    for (let i = 0; i < rows.length; i++) {
                        items.push(rows.item(i));
                    }
                    resolve(items);
                },
                (_: any, error: any) => {
                    reject(error);
                    return false;
                }
            );
        });
    });
};
