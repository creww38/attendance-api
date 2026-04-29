const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        data: { timezone: 'Asia/Jakarta' }
    });
});

module.exports = router;