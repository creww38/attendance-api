const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Absensi route works!' });
});

// Monitoring route
router.get('/monitoring', (req, res) => {
    res.json({ success: true, data: [], message: 'Monitoring endpoint' });
});

// Scan route
router.post('/scan', (req, res) => {
    res.json({ success: true, message: 'Scan endpoint' });
});

module.exports = router;