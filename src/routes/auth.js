const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.post('/regenerate-secret', authenticate, authController.regenerateApiSecret);
router.put('/settings', authenticate, authController.updateSettings);

module.exports = router;
