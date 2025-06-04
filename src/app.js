const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-secret']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api/v1', apiRoutes);
app.use('/auth', authRoutes);

// Dashboard route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Documentation route
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api-docs.html'));
});

// API documentation JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.json({
    name: 'Nightscout API Backend',
    version: require('../package.json').version,
    description: 'Centralized Nightscout-compatible backend service for CGM data management',
    endpoints: {
      authentication: {
        'POST /auth/register': 'Register a new user',
        'POST /auth/login': 'Login user',
        'GET /auth/me': 'Get user profile',
        'POST /auth/regenerate-secret': 'Regenerate API secret',
        'PUT /auth/settings': 'Update user settings'
      },
      entries: {
        'GET /api/v1/entries[.json]': 'Get CGM entries',
        'GET /api/v1/entries/{spec}[.json]': 'Get entries by type or ID',
        'POST /api/v1/entries[.json]': 'Create new entries',
        'DELETE /api/v1/entries[.json]': 'Delete entries'
      },
      treatments: {
        'GET /api/v1/treatments[.json]': 'Get treatments',
        'POST /api/v1/treatments[.json]': 'Create new treatments',
        'DELETE /api/v1/treatments[.json]': 'Delete treatments',
        'DELETE /api/v1/treatments/{id}': 'Delete specific treatment'
      },
      status: {
        'GET /api/v1/status[.json]': 'Get server status and settings'
      },
      profile: {
        'GET /api/v1/profile[.json]': 'Get treatment profile'
      },
      devicestatus: {
        'GET /api/v1/devicestatus[.json]': 'Get device status',
        'POST /api/v1/devicestatus[.json]': 'Upload device status'
      }
    },
    authentication_methods: [
      'API Secret in header (api-secret)',
      'Token in URL query parameter (?token=...)',
      'JWT Bearer token in Authorization header'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred'
  });
});

module.exports = app;
