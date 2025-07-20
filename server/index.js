
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PORT = process.env.PORT || 5000;

// In-memory storage
global.users = [];
global.resumes = [];
global.userIdCounter = 1;
global.resumeIdCounter = 1;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/payment', require('./routes/payment'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/payment', require('./routes/payment'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ResumeX API Server is running!', 
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/resumes', '/api/ai', '/api/templates', '/api/payment']
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ResumeX Server running on port ${PORT}`);
});
