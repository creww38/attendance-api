const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        data: [
            { nisn: '0093777491', nama: 'ABDUL AZIZ', kelas: 'XI Fase F' }
        ]
    });
});

module.exports = router;