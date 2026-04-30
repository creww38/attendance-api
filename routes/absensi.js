const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const { getSheetData, appendToSheet, updateSheet, SHEET_NAMES } = require('../services/googleSheets');
const { verifyToken } = require('../middleware/auth');

// Helper: Bersihkan NISN
function cleanNisn(nisn) {
    return String(nisn || '').trim();
}

// GET monitoring absensi hari ini
router.get('/monitoring', verifyToken, async (req, res) => {
    try {
        const { kelas } = req.query;
        const userKelas = req.user.kelas;
        const filterKelas = kelas || (req.user.role === 'guru' ? userKelas : null);
        const tanggal = moment().tz(process.env.TIMEZONE || 'Asia/Jakarta').format('YYYY-MM-DD');
        
        const siswaData = await getSheetData(SHEET_NAMES.SISWA);
        const absensiData = await getSheetData(SHEET_NAMES.ABSENSI);
        
        let siswaList = [];
        if (siswaData.length > 1) {
            siswaList = siswaData.slice(1).map(row => ({
                nisn: cleanNisn(row[0]),
                nama: row[1] || '',
                kelas: row[2] || ''
            }));
        }
        
        if (filterKelas) {
            siswaList = siswaList.filter(s => s.kelas === filterKelas);
        }
        
        const absensiHariIni = absensiData.slice(1).filter(row => row[1] === tanggal);
        
        const monitoring = siswaList.map(siswa => {
            const absen = absensiHariIni.find(a => cleanNisn(a[0]) === siswa.nisn);
            
            return {
                nisn: siswa.nisn,
                nama: siswa.nama,
                kelas: siswa.kelas,
                jamDatang: absen ? (absen[2] || '-') : '-',
                jamPulang: absen ? (absen[3] || '-') : '-',
                status: absen ? (absen[3] ? 'Hadir' : 'Hadir') : 'Belum Absen',
                keterangan: absen ? (absen[6] || '-') : '-'
            };
        });
        
        res.json({ success: true, data: monitoring });
    } catch (error) {
        console.error('Error getting monitoring:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET absensi siswa hari ini
router.get('/today/:nisn', verifyToken, async (req, res) => {
    try {
        const { nisn } = req.params;
        const cleanNisnValue = cleanNisn(nisn);
        const tanggal = moment().tz(process.env.TIMEZONE || 'Asia/Jakarta').format('YYYY-MM-DD');
        
        const absensiData = await getSheetData(SHEET_NAMES.ABSENSI);
        
        const absen = absensiData.find(row => {
            const rowNisn = cleanNisn(row[0]);
            return rowNisn === cleanNisnValue && row[1] === tanggal;
        });
        
        if (absen && absen.length >= 3) {
            res.json({
                success: true,
                data: {
                    jamDatang: absen[2] || null,
                    jamPulang: absen[3] || null
                }
            });
        } else {
            res.json({ success: true, data: null });
        }
    } catch (error) {
        console.error('Error getting absensi today:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST scan absensi
router.post('/scan', verifyToken, async (req, res) => {
    try {
        const { nisn, type } = req.body;
        const userRole = req.user.role;
        const userKelas = req.user.kelas;
        
        const cleanNisnValue = cleanNisn(nisn);
        const now = moment().tz(process.env.TIMEZONE || 'Asia/Jakarta');
        const tanggal = now.format('YYYY-MM-DD');
        const jam = now.format('HH:mm:ss');
        
        // Cek data siswa
        const siswaData = await getSheetData(SHEET_NAMES.SISWA);
        const siswa = siswaData.find(row => cleanNisn(row[0]) === cleanNisnValue);
        
        if (!siswa) {
            return res.json({ success: false, message: 'Siswa tidak ditemukan' });
        }
        
        const namaSiswa = siswa[1];
        const kelasSiswa = siswa[2];
        
        // Cek akses guru
        if (userRole === 'guru' && userKelas && kelasSiswa !== userKelas) {
            return res.json({ 
                success: false, 
                message: `Akses ditolak! Anda hanya bisa mengabsen siswa kelas ${userKelas}` 
            });
        }
        
        // Cek absensi hari ini
        const absensiData = await getSheetData(SHEET_NAMES.ABSENSI);
        
        let existingRowIndex = -1;
        let existingRow = null;
        
        for (let i = 1; i < absensiData.length; i++) {
            const row = absensiData[i];
            const rowNisn = cleanNisn(row[0]);
            if (rowNisn === cleanNisnValue && row[1] === tanggal) {
                existingRowIndex = i;
                existingRow = row;
                break;
            }
        }
        
        if (type === 'datang') {
            if (existingRow && existingRow[2]) {
                return res.json({ 
                    success: false, 
                    message: `Anda sudah absen datang pada pukul ${existingRow[2]}` 
                });
            }
            
            const batasTerlambat = '07:30:00';
            const keterangan = jam > batasTerlambat ? 'Terlambat' : 'Tepat Waktu';
            
            if (existingRowIndex !== -1) {
                await updateSheet(SHEET_NAMES.ABSENSI, `C${existingRowIndex + 1}`, [[jam]]);
                await updateSheet(SHEET_NAMES.ABSENSI, `G${existingRowIndex + 1}`, [[keterangan]]);
            } else {
                const newRow = [[
                    cleanNisnValue,
                    tanggal,
                    jam,
                    '',
                    namaSiswa,
                    kelasSiswa,
                    keterangan,
                    'Hadir'
                ]];
                await appendToSheet(SHEET_NAMES.ABSENSI, newRow);
            }
            
            res.json({ 
                success: true, 
                message: `Absen datang berhasil pukul ${jam} (${keterangan})`,
                jamDatang: jam,
                type: 'datang',
                nama: namaSiswa,
                kelas: kelasSiswa
            });
        } 
        else if (type === 'pulang') {
            if (existingRowIndex === -1 || !existingRow[2]) {
                return res.json({ 
                    success: false, 
                    message: 'Anda belum melakukan absen datang hari ini' 
                });
            }
            
            if (existingRow[3]) {
                return res.json({ 
                    success: false, 
                    message: `Anda sudah absen pulang pada pukul ${existingRow[3]}` 
                });
            }
            
            await updateSheet(SHEET_NAMES.ABSENSI, `D${existingRowIndex + 1}`, [[jam]]);
            
            res.json({ 
                success: true, 
                message: `Absen pulang berhasil pukul ${jam}`,
                jamPulang: jam,
                type: 'pulang',
                nama: namaSiswa,
                kelas: kelasSiswa
            });
        } else {
            res.json({ success: false, message: 'Tipe absensi tidak valid' });
        }
    } catch (error) {
        console.error('Error scanning absensi:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET rekap absensi
router.get('/rekap', verifyToken, async (req, res) => {
    try {
        const { tanggalMulai, tanggalAkhir, kelas } = req.query;
        
        const absensiData = await getSheetData(SHEET_NAMES.ABSENSI);
        let absensi = absensiData.slice(1);
        
        if (tanggalMulai && tanggalAkhir) {
            absensi = absensi.filter(row => row[1] >= tanggalMulai && row[1] <= tanggalAkhir);
        }
        
        if (kelas) {
            absensi = absensi.filter(row => row[5] === kelas);
        }
        
        // Filter berdasarkan akses guru
        if (req.user.role === 'guru' && req.user.kelas) {
            absensi = absensi.filter(row => row[5] === req.user.kelas);
        }
        
        // Hapus duplikat
        const uniqueAbsensi = [];
        const seen = new Set();
        
        for (const row of absensi) {
            const key = `${cleanNisn(row[0])}_${row[1]}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueAbsensi.push(row);
            }
        }
        
        const rekap = uniqueAbsensi.map((row, idx) => ({
            no: idx + 1,
            nisn: cleanNisn(row[0]),
            tanggal: row[1],
            jamDatang: row[2] || '-',
            jamPulang: row[3] || '-',
            nama: row[4] || '-',
            kelas: row[5] || '-',
            keterangan: row[6] || '-',
            status: row[7] || (row[3] ? 'Hadir' : (row[2] ? 'Hadir' : 'Tidak Hadir'))
        }));
        
        res.json({ success: true, data: rekap });
    } catch (error) {
        console.error('Error getting rekap:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
