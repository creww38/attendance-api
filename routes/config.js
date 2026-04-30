const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get config
router.get('/', verifyToken, isAdmin, async (req, res) => {
    res.json({ 
        success: true, 
        data: {
            timezone: process.env.TIMEZONE || 'Asia/Jakarta',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
            sheetNames: {
                siswa: process.env.SHEET_SISWA || 'Siswa',
                guru: process.env.SHEET_GURU || 'users',
                absensi: process.env.SHEET_ABSENSI || 'Absensi',
                sessions: process.env.SHEET_SESSIONS || 'sessions'
            }
        }
    });
});

module.exports = router;
