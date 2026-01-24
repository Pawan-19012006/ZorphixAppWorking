import { insertParticipant } from './sqlite';
import { ExportData } from './ExportService';

export interface ImportResult {
    totalImported: number;
    duplicates: number;
    errors: number;
    parts: number[];
}

// Track imported parts to handle multi-QR imports
let importBuffer: Map<string, ExportData[]> = new Map();

/**
 * Parse and validate QR data
 */
const parseQRData = (qrString: string): ExportData | null => {
    try {
        const data = JSON.parse(qrString) as ExportData;

        // Validate structure
        if (!data.part || !data.total || !data.event || !Array.isArray(data.emails)) {
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to parse QR data:', error);
        return null;
    }
};

/**
 * Import emails from scanned QR code
 * Handles multi-part QR imports
 */
export const importFromQR = async (
    qrString: string,
    eventName: string
): Promise<ImportResult> => {
    const data = parseQRData(qrString);

    if (!data) {
        throw new Error('Invalid QR code format');
    }

    // Check if event matches
    if (data.event !== eventName) {
        throw new Error(`QR code is for event "${data.event}" but current event is "${eventName}"`);
    }

    // Create buffer key
    const bufferKey = `${data.event}_${data.timestamp}`;

    // Initialize buffer if needed
    if (!importBuffer.has(bufferKey)) {
        importBuffer.set(bufferKey, []);
    }

    const buffer = importBuffer.get(bufferKey)!;

    // Check if this part already imported
    if (buffer.some(item => item.part === data.part)) {
        throw new Error(`Part ${data.part} already imported`);
    }

    // Add to buffer
    buffer.push(data);

    // Check if all parts received
    if (buffer.length === data.total) {
        // Sort by part number
        buffer.sort((a, b) => a.part - b.part);

        // Merge all emails
        const allEmails = buffer.flatMap(item => item.emails);

        // Import to database
        const result = await importEmailsToDatabase(allEmails, eventName);

        // Clear buffer
        importBuffer.delete(bufferKey);

        return {
            ...result,
            parts: buffer.map(item => item.part)
        };
    }

    // Return partial result
    return {
        totalImported: 0,
        duplicates: 0,
        errors: 0,
        parts: buffer.map(item => item.part)
    };
};

/**
 * Import emails into local database
 */
const importEmailsToDatabase = async (
    emails: string[],
    eventName: string
): Promise<Omit<ImportResult, 'parts'>> => {
    let totalImported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const email of emails) {
        try {
            // Generate UID for imported user
            const uid = `IMPORT_${eventName.replace(/\s+/g, '')}_${email.replace(/[@.]/g, '_')}`;

            // Try to insert (will be ignored if exists due to PRIMARY KEY constraint)
            insertParticipant(
                uid,
                eventName,
                email.split('@')[0], // Use email prefix as name
                '',
                email,
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                'WEB',
                1, // Already synced (since it's imported from another source)
                0  // Not checked in
            );

            totalImported++;
        } catch (error: any) {
            if (error.message?.includes('UNIQUE') || error.message?.includes('PRIMARY KEY')) {
                duplicates++;
            } else {
                errors++;
                console.error(`Failed to import ${email}:`, error);
            }
        }
    }

    return {
        totalImported,
        duplicates,
        errors
    };
};

/**
 * Get import progress for multi-part QR codes
 */
export const getImportProgress = (eventName: string, timestamp: string): {
    partsReceived: number[];
    totalParts: number | null;
} => {
    const bufferKey = `${eventName}_${timestamp}`;
    const buffer = importBuffer.get(bufferKey);

    if (!buffer || buffer.length === 0) {
        return {
            partsReceived: [],
            totalParts: null
        };
    }

    return {
        partsReceived: buffer.map(item => item.part).sort((a, b) => a - b),
        totalParts: buffer[0].total
    };
};

/**
 * Clear import buffer (useful for canceling multi-part import)
 */
export const clearImportBuffer = () => {
    importBuffer.clear();
};
