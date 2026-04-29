require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import routes
const authRoutes = require('./routes/auth');
const siswaRoutes = require('./routes/siswa');
const guruRoutes = require('./routes/guru');
const absensiRoutes = require('./routes/absensi');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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
        uptime: process.uptime()
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'Attendance API',
        status: 'running',
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
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        success: false, 
        message: err.message 
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);
    console.log('========================================\n');
});

server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use!`);
        console.log('Try changing PORT in .env file');
    }
});