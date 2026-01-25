import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Simple in-memory store for web
const webStore: User[] = [];

let db: SQLite.SQLiteDatabase | null = null;

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at: string;
}

export const initDB = async () => {
    if (Platform.OS === 'web') {
        // console.log('Web environment detected: Using in-memory storage');
        return;
    }

    try {
        db = await SQLite.openDatabaseAsync('zorphix.db');
        await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

export const addUser = async (name: string, email: string, phone: string) => {
    if (Platform.OS === 'web') {
        const newUser: User = {
            id: webStore.length + 1,
            name,
            email,
            phone,
            created_at: new Date().toISOString()
        };
        webStore.push(newUser);
        return newUser.id;
    }

    if (!db) await initDB();
    if (!db) throw new Error('Database not initialized');

    try {
        const result = await db.runAsync(
            'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
            name, email, phone
        );
        return result.lastInsertRowId;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
};

export const getUsers = async () => {
    if (Platform.OS === 'web') {
        return [...webStore].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (!db) await initDB();
    if (!db) throw new Error('Database not initialized');

    try {
        const allRows = await db.getAllAsync('SELECT * FROM users ORDER BY created_at DESC');
        return allRows;
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
};
