const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// POST /auth/register
const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }
    
    const { email, password } = value;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Un utilizator cu acest email există deja'
      });
    }
    
    // Create user
    const user = await User.create({ email, password });
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'Utilizator înregistrat cu succes',
      user: {
        ...user.toJSON(),
        api_secret: user.api_secret
      },
      token,
      nightscout_url: user.nightscout_url
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
};

// POST /auth/login
const login = async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }
    
    const { email, password } = value;
    
    // Find user
    const user = await User.findOne({ where: { email, is_active: true } });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email sau parolă invalidă'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email sau parolă invalidă'
      });
    }
    
    // Update last login
    user.last_login = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      message: 'Autentificare reușită',
      user: {
        ...user.toJSON(),
        api_secret: user.api_secret
      },
      token,
      nightscout_url: user.nightscout_url
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to login'
    });
  }
};

// GET /auth/me
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      user: {
        ...user.toJSON(),
        api_secret: user.api_secret
      },
      nightscout_url: user.nightscout_url
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get profile'
    });
  }
};

// POST /auth/regenerate-secret
const regenerateApiSecret = async (req, res) => {
  try {
    const user = req.user;
    
    // Generate new API secret
    const newApiSecret = user.regenerateApiSecret();
    await user.save();
    
    res.json({
      message: 'Cheia API regenerată cu succes',
      api_secret: newApiSecret,
      nightscout_url: user.nightscout_url
    });
  } catch (error) {
    console.error('Regenerate API secret error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to regenerate API secret'
    });
  }
};

// PUT /auth/settings
const updateSettings = async (req, res) => {
  try {
    const user = req.user;
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Settings object is required'
      });
    }
    
    // Merge with existing settings
    user.settings = { ...user.settings, ...settings };
    await user.save();
    
    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update settings'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  regenerateApiSecret,
  updateSettings
};
