const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  api_secret: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  api_secret_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nightscout_url: {
    type: DataTypes.VIRTUAL,
    get() {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      return `${baseUrl}/api/v1`;
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      units: 'mg/dl',
      timeFormat: 12,
      theme: 'default',
      alarmHigh: 180,
      alarmLow: 70,
      alarmUrgentHigh: 250,
      alarmUrgentLow: 55
    }
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      console.log('beforeCreate hook running for user:', user.email);

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      console.log('Password hashed');

      // Generate API secret if not provided
      if (!user.api_secret) {
        user.api_secret = crypto.randomBytes(32).toString('hex');
        console.log('Generated API secret:', user.api_secret.substring(0, 8) + '...');
      }

      // Hash API secret for storage
      user.api_secret_hash = crypto.createHash('sha256').update(user.api_secret).digest('hex');
      console.log('API secret hash generated');
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      
      if (user.changed('api_secret')) {
        user.api_secret_hash = crypto.createHash('sha256').update(user.api_secret).digest('hex');
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.validateApiSecret = function(apiSecret) {
  const hash = crypto.createHash('sha256').update(apiSecret).digest('hex');
  return hash === this.api_secret_hash;
};

User.prototype.regenerateApiSecret = function() {
  this.api_secret = crypto.randomBytes(32).toString('hex');
  this.api_secret_hash = crypto.createHash('sha256').update(this.api_secret).digest('hex');
  return this.api_secret;
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.api_secret_hash;
  return values;
};

// Class methods
User.findByApiSecret = async function(apiSecret) {
  const hash = crypto.createHash('sha256').update(apiSecret).digest('hex');
  return await User.findOne({
    where: { api_secret_hash: hash, is_active: true }
  });
};

module.exports = User;
