const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware untuk verify token
function verifyToken(req, res, next) {
    const token = req.headers['authorization'] || req.query.token || req.headers['x-access-token'];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' 
        });
    }
    
    // Remove 'Bearer ' prefix if exists
    let tokenValue = token;
    if (token.startsWith('Bearer ')) {
        tokenValue = token.slice(7);
    }
    
    try {
        const decoded = jwt.verify(tokenValue, JWT_SECRET);
        
        // Check if token expired
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token telah kadaluarsa' 
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token telah kadaluarsa, silakan login kembali' 
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token tidak valid' 
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            message: 'Autentikasi gagal: ' + error.message 
        });
    }
}

// Middleware untuk cek role admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Akses ditolak. Endpoint ini hanya untuk administrator.' 
        });
    }
}

// Middleware untuk cek role guru
function isGuru(req, res, next) {
    if (req.user && (req.user.role === 'guru' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Akses ditolak. Endpoint ini hanya untuk guru.' 
        });
    }
}

// Middleware untuk cek akses kelas
function hasClassAccess(req, res, next) {
    const requestedKelas = req.params.kelas || req.body.kelas || req.query.kelas;
    
    if (req.user.role === 'admin') {
        next();
    } else if (req.user.role === 'guru' && req.user.kelas) {
        if (requestedKelas && requestedKelas !== req.user.kelas) {
            return res.status(403).json({ 
                success: false, 
                message: `Akses ditolak. Anda hanya memiliki akses untuk kelas ${req.user.kelas}` 
            });
        }
        next();
    } else {
        next();
    }
}

module.exports = { verifyToken, isAdmin, isGuru, hasClassAccess };