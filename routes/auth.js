const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getSheetData, appendToSheet, SHEET_NAMES } = require('../services/googleSheets');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper: Bersihkan NISN
function cleanNisn(nisn) {
    return String(nisn || '').trim();
}

// Helper: Save session ke Google Sheets
async function saveSession(userData, token) {
    try {
        const now = new Date().toISOString();
        const sessionData = [[
            token,
            userData.nisn || userData.username,
            userData.nama,
            userData.role,
            userData.kelas || '',
            now,
            'active'
        ]];
        
        await appendToSheet(SHEET_NAMES.SESSIONS, sessionData);
        console.log(`✅ Session saved for ${userData.nama}`);
    } catch (error) {
        console.error('Error saving session:', error.message);
    }
}

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password, nisn } = req.body;
        
        // Login sebagai siswa (dengan NISN)
        if (nisn) {
            const siswaData = await getSheetData(SHEET_NAMES.SISWA);
            const siswa = siswaData.find(row => cleanNisn(row[0]) === cleanNisn(nisn));
            
            if (siswa) {
                const token = jwt.sign(
                    { 
                        nisn: cleanNisn(siswa[0]), 
                        nama: siswa[1], 
                        kelas: siswa[2],
                        role: 'siswa',
                        timestamp: Date.now()
                    }, 
                    JWT_SECRET, 
                    { expiresIn: JWT_EXPIRES_IN }
                );
                
                await saveSession({
                    nisn: cleanNisn(siswa[0]),
                    nama: siswa[1],
                    kelas: siswa[2],
                    role: 'siswa'
                }, token);
                
                return res.json({
                    success: true,
                    role: 'siswa',
                    nama: siswa[1],
                    nisn: cleanNisn(siswa[0]),
                    kelas: siswa[2],
                    token: token
                });
            }
        }
        
        // Login sebagai guru/admin (dengan username & password)
        if (username && password) {
            const guruData = await getSheetData(SHEET_NAMES.GURU);
            const guru = guruData.find(row => row[0] === username && row[1] === password);
            
            if (guru) {
                const token = jwt.sign(
                    { 
                        username: guru[0], 
                        nama: guru[2] || guru[0],
                        role: guru[3] || 'guru',
                        kelas: guru[4] || null,
                        timestamp: Date.now()
                    }, 
                    JWT_SECRET, 
                    { expiresIn: JWT_EXPIRES_IN }
                );
                
                await saveSession({
                    username: guru[0],
                    nama: guru[2] || guru[0],
                    role: guru[3] || 'guru',
                    kelas: guru[4] || null
                }, token);
                
                return res.json({
                    success: true,
                    role: guru[3] || 'guru',
                    username: guru[0],
                    nama: guru[2] || guru[0],
                    kelas: guru[4] || null,
                    token: token
                });
            }
        }
        
        res.json({ 
            success: false, 
            message: 'NISN/Username atau password salah' 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }
    
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    try {
        const decoded = jwt.verify(tokenValue, JWT_SECRET);
        res.json({ success: true, user: decoded });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token tidak valid' });
    }
});

module.exports = router;
