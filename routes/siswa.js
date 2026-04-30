const express = require('express');
const router = express.Router();
const { getSheetData, SHEET_NAMES } = require('../services/googleSheets');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET semua siswa (hanya untuk admin/guru)
router.get('/', verifyToken, async (req, res) => {
    try {
        const data = await getSheetData(SHEET_NAMES.SISWA);
        
        if (data.length === 0) {
            return res.json({ success: true, data: [] });
        }
        
        const headers = data[0];
        const rows = data.slice(1);
        
        const siswa = rows.map(row => {
            const obj = {};
            headers.forEach((header, idx) => {
                obj[header.toLowerCase()] = row[idx] || '';
            });
            return obj;
        });
        
        // Filter berdasarkan akses guru (jika guru, hanya lihat kelasnya)
        if (req.user.role === 'guru' && req.user.kelas) {
            const filtered = siswa.filter(s => s.kelas === req.user.kelas);
            return res.json({ success: true, data: filtered });
        }
        
        res.json({ success: true, data: siswa });
    } catch (error) {
        console.error('Error getting siswa:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET siswa by NISN
router.get('/:nisn', verifyToken, async (req, res) => {
    try {
        const { nisn } = req.params;
        const data = await getSheetData(SHEET_NAMES.SISWA);
        
        const siswa = data.find(row => row[0] == nisn);
        if (!siswa) {
            return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
        }
        
        res.json({ 
            success: true, 
            data: {
                nisn: siswa[0],
                nama: siswa[1],
                kelas: siswa[2],
                jenisKelamin: siswa[3],
                tanggalLahir: siswa[4],
                agama: siswa[5],
                namaAyah: siswa[6],
                namaIbu: siswa[7],
                noHp: siswa[8],
                alamat: siswa[9]
            }
        });
    } catch (error) {
        console.error('Error getting siswa by NISN:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
