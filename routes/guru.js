const express = require('express');
const router = express.Router();
const { getSheetData, SHEET_NAMES } = require('../services/googleSheets');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET semua guru (hanya untuk admin)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const data = await getSheetData(SHEET_NAMES.GURU);
        
        if (data.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        const guru = data.slice(1).map(row => ({
            username: row[0],
            password: row[1],
            nama: row[2] || row[0],
            role: row[3] || 'guru',
            kelas: row[4] || null
        }));
        
        res.json({ success: true, data: guru });
    } catch (error) {
        console.error('Error getting guru:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
