const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

// Middleware to authenticate API requests using multiple methods
const authenticate = async (req, res, next) => {
  try {
    let user = null;

    console.log('Authentication attempt for:', req.method, req.originalUrl);
    console.log('Headers received:', Object.keys(req.headers));

    // Method 1: API Secret in header (api-secret)
    const apiSecretHeader = req.headers['api-secret'];
    console.log('API Secret header:', apiSecretHeader ? 'Present (' + apiSecretHeader.substring(0, 8) + '...)' : 'Not found');

    if (apiSecretHeader) {
      console.log('Full API Secret received:', apiSecretHeader);
      console.log('API Secret length:', apiSecretHeader.length);

      // Method 1A: Try direct API secret match (for web/API testing)
      user = await User.findByApiSecret(apiSecretHeader);
      if (user) {
        console.log('User found by direct API secret match');
        req.user = user;
        return next();
      }

      // Method 1B: Try SHA-1 hash match (for xDrip+ compatibility)
      // xDrip+ sends SHA-1 hash of the API secret, not the raw secret

      // Get all users and check if the received hash matches SHA-1 of any API secret
      const allUsers = await User.findAll({ where: { is_active: true } });

      console.log('=== SHA-1 Hash Comparison ===');
      console.log('Received API Secret Header (SHA-1):', apiSecretHeader);
      console.log('Received hash length:', apiSecretHeader.length);

      for (const testUser of allUsers) {
        const sha1Hash = crypto.createHash('sha1').update(testUser.api_secret).digest('hex');
        console.log(`User: ${testUser.email}`);
        console.log(`  - Raw API Secret: ${testUser.api_secret}`);
        console.log(`  - Expected SHA-1: ${sha1Hash}`);
        console.log(`  - Received SHA-1: ${apiSecretHeader}`);
        console.log(`  - Match: ${sha1Hash === apiSecretHeader ? 'YES ✅' : 'NO ❌'}`);
        console.log('---');

        if (sha1Hash === apiSecretHeader) {
          console.log('🎉 User found by SHA-1 hash match (xDrip+ format)');
          user = testUser;
          req.user = user;
          return next();
        }
      }

      console.log('No user found by direct secret or SHA-1 hash');
    }
    
    // Method 2: Token in URL query parameter
    const tokenQuery = req.query.token;
    if (tokenQuery) {
      try {
        const decoded = jwt.verify(tokenQuery, process.env.JWT_SECRET);
        user = await User.findByPk(decoded.userId, {
          where: { is_active: true }
        });
        if (user) {
          console.log('User found via JWT token in query parameter');
          req.user = user;
          return next();
        }
      } catch (jwtError) {
        // Try as raw API secret
        user = await User.findByApiSecret(tokenQuery);
        if (user) {
          console.log('User found via raw API secret in query parameter');
          req.user = user;
          return next();
        }

        // Try as SHA-1 hash (for xDrip+ compatibility)
        const allUsers = await User.findAll({ where: { is_active: true } });

        for (const testUser of allUsers) {
          const sha1Hash = crypto.createHash('sha1').update(testUser.api_secret).digest('hex');
          if (sha1Hash === tokenQuery) {
            console.log('User found via SHA-1 hash in query parameter (xDrip+ format)');
            user = testUser;
            req.user = user;
            return next();
          }
        }
      }
    }
    
    // Method 3: JWT Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findByPk(decoded.userId, {
          where: { is_active: true }
        });
        if (user) {
          req.user = user;
          return next();
        }
      } catch (jwtError) {
        // JWT verification failed
      }
    }
    
    // Method 4: API Secret in URL (for compatibility with some apps)
    // Format: https://API_SECRET@domain.com/api/v1/...
    const host = req.headers.host;
    const authorization = req.headers.authorization;

    // Check for Basic Auth format (some xDrip+ versions use this)
    if (authorization && authorization.startsWith('Basic ')) {
      const base64Credentials = authorization.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      console.log('Basic Auth detected - username:', username, 'password:', password ? 'present' : 'none');

      // Try username as API secret (raw)
      if (username) {
        user = await User.findByApiSecret(username);
        if (user) {
          console.log('User found via Basic Auth username (raw API secret)');
          req.user = user;
          return next();
        }

        // Try username as SHA-1 hash
        const allUsers = await User.findAll({ where: { is_active: true } });

        for (const testUser of allUsers) {
          const sha1Hash = crypto.createHash('sha1').update(testUser.api_secret).digest('hex');
          if (sha1Hash === username) {
            console.log('User found via Basic Auth username (SHA-1 hash)');
            user = testUser;
            req.user = user;
            return next();
          }
        }
      }

      // Try password as API secret (raw)
      if (password) {
        user = await User.findByApiSecret(password);
        if (user) {
          console.log('User found via Basic Auth password (raw API secret)');
          req.user = user;
          return next();
        }

        // Try password as SHA-1 hash
        const allUsers = await User.findAll({ where: { is_active: true } });

        for (const testUser of allUsers) {
          const sha1Hash = crypto.createHash('sha1').update(testUser.api_secret).digest('hex');
          if (sha1Hash === password) {
            console.log('User found via Basic Auth password (SHA-1 hash)');
            user = testUser;
            req.user = user;
            return next();
          }
        }
      }
    }

    // Check if API secret is in the URL format
    if (req.headers['x-forwarded-host']) {
      const forwardedHost = req.headers['x-forwarded-host'];
      const parts = forwardedHost.split('@');
      if (parts.length === 2) {
        const potentialApiSecret = parts[0];
        console.log('URL-embedded secret detected:', potentialApiSecret.substring(0, 8) + '...');
        user = await User.findByApiSecret(potentialApiSecret);
        if (user) {
          console.log('User found via URL-embedded secret');
          req.user = user;
          return next();
        }
      }
    }
    
    // No valid authentication found
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API secret or token required'
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

// Middleware for optional authentication (for public endpoints)
const optionalAuth = async (req, res, next) => {
  try {
    // Try to authenticate, but don't fail if no auth provided
    const apiSecretHeader = req.headers['api-secret'];
    const tokenQuery = req.query.token;
    const authHeader = req.headers.authorization;
    
    if (apiSecretHeader || tokenQuery || authHeader) {
      return authenticate(req, res, next);
    }
    
    // No authentication provided, continue without user
    req.user = null;
    next();
  } catch (error) {
    // Authentication failed, but continue without user for optional auth
    req.user = null;
    next();
  }
};

// Generate JWT token for user
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

module.exports = {
  authenticate,
  optionalAuth,
  generateToken
};
