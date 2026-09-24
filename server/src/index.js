const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const clientsRoutes = require('./routes/clients');
const mastersRoutes = require('./routes/masters');
const pdfRoutes = require('./routes/pdf');

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins.length === 0 ? true : allowedOrigins
}));
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/companies', authMiddleware, companiesRoutes);
app.use('/api/clients', authMiddleware, clientsRoutes);
app.use('/api/masters', authMiddleware, mastersRoutes);
app.use('/api/pdf', authMiddleware, pdfRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Export Management Server running on port ${PORT}`);
        console.log(`API: http://localhost:${PORT}/api`);
    });
}
