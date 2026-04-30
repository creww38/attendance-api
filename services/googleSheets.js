const { google } = require('googleapis');

let sheets = null;
let spreadsheetId = null;

// Sheet names from environment
const SHEET_NAMES = {
    SISWA: process.env.SHEET_SISWA || 'Siswa',
    GURU: process.env.SHEET_GURU || 'users',
    ABSENSI: process.env.SHEET_ABSENSI || 'Absensi',
    SESSIONS: process.env.SHEET_SESSIONS || 'sessions',
    KELAS: process.env.SHEET_KELAS || 'Kelas',
    KONFIGURASI: process.env.SHEET_KONFIGURASI || 'Konfigurasi',
    LIBUR: process.env.SHEET_LIBUR || 'Libur'
};

async function initGoogleSheets() {
    try {
        spreadsheetId = process.env.SPREADSHEET_ID;
        
        if (!spreadsheetId) {
            throw new Error('SPREADSHEET_ID not found in environment variables');
        }
        
        console.log('📊 Initializing Google Sheets...');
        
        // Gunakan credentials dari environment variables
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const authClient = await auth.getClient();
        sheets = google.sheets({ version: 'v4', auth: authClient });
        
        // Test connection
        await sheets.spreadsheets.get({ spreadsheetId });
        
        console.log('✅ Google Sheets initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Google Sheets error:', error.message);
        return false;
    }
}

async function getSheetData(sheetName) {
    try {
        if (!sheets) {
            await initGoogleSheets();
        }
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:ZZ`
        });
        return response.data.values || [];
    } catch (error) {
        console.error(`Error reading ${sheetName}:`, error.message);
        return [];
    }
}

async function appendToSheet(sheetName, values) {
    try {
        if (!sheets) {
            await initGoogleSheets();
        }
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:ZZ`,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });
        return response.data;
    } catch (error) {
        console.error(`Error appending to ${sheetName}:`, error.message);
        throw error;
    }
}

async function updateSheet(sheetName, range, values) {
    try {
        if (!sheets) {
            await initGoogleSheets();
        }
        
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!${range}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating ${sheetName}:`, error.message);
        throw error;
    }
}

module.exports = {
    initGoogleSheets,
    getSheetData,
    appendToSheet,
    updateSheet,
    SHEET_NAMES
};
