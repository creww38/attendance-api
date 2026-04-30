require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const siswaRoutes = require('./routes/siswa');
const guruRoutes = require('./routes/guru');
const absensiRoutes = require('./routes/absensi');
const configRoutes = require('./routes/config');

// Import services
const { initGoogleSheets } = require('./services/googleSheets');

const app = express();

// Trust proxy (for rate limiting behind Vercel)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/siswa', siswaRoutes);
app.use('/api/guru', guruRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        platform: 'Vercel'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Attendance API',
        version: '1.0.0',
        status: 'running',
        platform: 'Vercel',
        endpoints: {
            auth: '/api/auth',
            siswa: '/api/siswa',
            guru: '/api/guru',
            absensi: '/api/absensi',
            health: '/api/health'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Endpoint ${req.method} ${req.url} tidak ditemukan` 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Terjadi kesalahan pada server'
    });
});

// Initialize Google Sheets (runs on first request)
let sheetsInitialized = false;

app.use(async (req, res, next) => {
    if (!sheetsInitialized && req.path.startsWith('/api')) {
        sheetsInitialized = await initGoogleSheets();
        if (sheetsInitialized) {
            console.log('✅ Google Sheets initialized');
        } else {
            console.warn('⚠️ Google Sheets not initialized');
        }
    }
    next();
});

module.exports = app;
