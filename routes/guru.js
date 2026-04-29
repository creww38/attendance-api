const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { username: 'admin', nama: 'Administrator', role: 'admin' }
        ]
    });
});

module.exports = router;