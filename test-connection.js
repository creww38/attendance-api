require('dotenv').config();
const { google } = require('googleapis');

console.log('=== TESTING GOOGLE SHEETS CONNECTION ===');
console.log('Spreadsheet ID:', process.env.SPREADSHEET_ID);
console.log('Client Email:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
console.log('Private Key length:', process.env.GOOGLE_SHEETS_PRIVATE_KEY ? process.env.GOOGLE_SHEETS_PRIVATE_KEY.length : 0);
console.log('');

async function testConnection() {
  try {
    // Cek apakah credentials ada
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      console.log('ERROR: Credentials not found in .env');
      return;
    }
    
    // Format private key
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    console.log('Original private key (first 50 chars):', privateKey.substring(0, 50));
    
    // Replace \n dengan newline
    privateKey = privateKey.replace(/\\n/g, '\n');
    console.log('After replace (first 50 chars):', privateKey.substring(0, 50));
    
    // Buat auth
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test baca data
    console.log('\nTrying to read sheet "users"...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'users',
    });
    
    console.log('SUCCESS! Connection works!');
    console.log('Data found:', response.data.values ? response.data.values.length : 0, 'rows');
    if (response.data.values && response.data.values.length > 0) {
      console.log('Header:', response.data.values[0]);
    }
    
  } catch (error) {
    console.error('\nERROR:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

testConnection();
