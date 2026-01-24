import { getAllParticipants } from './sqlite';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// QR code size limits (in characters for safe encoding)
const MAX_QR_SIZE = 1800; // Safe limit for reliable QR scanning

export interface ExportData {
    part: number;
    total: number;
    event: string;
    timestamp: string;
    emails: string[];
}

export interface ExportResult {
    qrDataArray: string[];
    totalParts: number;
    totalEmails: number;
}

/**
 * Export all local participant emails as QR-encoded JSON
 * Splits into multiple parts if data is too large
 */
export const exportLocalData = async (eventName: string): Promise<ExportResult> => {
    try {
        // Get all participants from local DB
        const participants = await getAllParticipants();

        // Extract unique emails
        const emails = [...new Set(participants.map(p => p.email).filter(Boolean))];

        if (emails.length === 0) {
            return {
                qrDataArray: [],
                totalParts: 0,
                totalEmails: 0
            };
        }

        // Calculate chunk size based on JSON structure overhead
        const testData: ExportData = {
            part: 1,
            total: 1,
            event: eventName,
            timestamp: new Date().toISOString(),
            emails: ['test@example.com']
        };

        const baseSize = JSON.stringify(testData).length - 18; // Subtract email length
        const availableSize = MAX_QR_SIZE - baseSize;
        const avgEmailSize = 25; // Average email length
        const emailsPerChunk = Math.floor(availableSize / avgEmailSize);

        // Split emails into chunks
        const chunks: string[][] = [];
        for (let i = 0; i < emails.length; i += emailsPerChunk) {
            chunks.push(emails.slice(i, i + emailsPerChunk));
        }

        // Generate QR data for each chunk
        const qrDataArray = chunks.map((chunk, index) => {
            const data: ExportData = {
                part: index + 1,
                total: chunks.length,
                event: eventName,
                timestamp: new Date().toISOString(),
                emails: chunk
            };
            return JSON.stringify(data);
        });

        return {
            qrDataArray,
            totalParts: chunks.length,
            totalEmails: emails.length
        };
    } catch (error) {
        console.error('Export failed:', error);
        throw new Error('Failed to export data');
    }
};

// ... (previous content)
export const getExportSummary = async (): Promise<{
    totalParticipants: number;
    totalEmails: number;
}> => {
    try {
        const participants = await getAllParticipants();
        const emails = [...new Set(participants.map(p => p.email).filter(Boolean))];

        return {
            totalParticipants: participants.length,
            totalEmails: emails.length
        };
    } catch (error) {
        console.error('Failed to get export summary:', error);
        return {
            totalParticipants: 0,
            totalEmails: 0
        };
    }
};

/**
 * Export full local database to Excel file
 */
export const exportToExcel = async (): Promise<void> => {
    try {
        const participants = await getAllParticipants();

        if (participants.length === 0) {
            throw new Error('No data to export');
        }

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(participants);
        XLSX.utils.book_append_sheet(wb, ws, "Participants");

        // Generate base64
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        // Save to file
        const filename = `zorphix_participants_${new Date().getTime()}.xlsx`;
        const uri = FileSystem.cacheDirectory + filename;

        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType.Base64
        });

        // Share file
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export DB to Excel',
                UTI: 'com.microsoft.excel.xlsx' // helpful for iOS
            });
        } else {
            throw new Error('Sharing is not available on this device');
        }

    } catch (error) {
        console.error('Excel export failed:', error);
        throw error;
    }
};
