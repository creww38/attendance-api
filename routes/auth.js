const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password, nisn } = req.body;
    
    // Simple test response
    res.json({ 
        success: true, 
        message: 'Login endpoint working',
        data: { username, nisn }
    });
});

router.get('/verify', (req, res) => {
    res.json({ success: true, message: 'Verify endpoint' });
});

module.exports = router;