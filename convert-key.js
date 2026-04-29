const fs = require('fs');

// Baca file JSON yang didownload dari Google Cloud
const serviceAccount = JSON.parse(fs.readFileSync('./service-account-key.json', 'utf8'));

console.log('GOOGLE_SHEETS_CLIENT_EMAIL=' + serviceAccount.client_email);
console.log('GOOGLE_SHEETS_PRIVATE_KEY=' + JSON.stringify(serviceAccount.private_key));
