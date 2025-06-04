const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Entry = sequelize.define('Entry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'sgv',
    validate: {
      isIn: [['sgv', 'mbg', 'cal', 'etc']]
    }
  },
  dateString: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isISO8601: true
    }
  },
  date: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate: {
      isInt: true
    }
  },
  sgv: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 1000
    }
  },
  direction: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['Flat', 'SingleUp', 'DoubleUp', 'SingleDown', 'DoubleDown', 'FortyFiveUp', 'FortyFiveDown', 'NOT COMPUTABLE', 'RATE OUT OF RANGE']]
    }
  },
  noise: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 4
    }
  },
  filtered: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  unfiltered: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  rssi: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  device: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slope: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  intercept: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  scale: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 1
  },
  mbg: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sysTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utcOffset: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'entries',
  // Indexes disabled temporarily to avoid column name conflicts
  // indexes: [
  //   {
  //     fields: ['user_id', 'date']
  //   },
  //   {
  //     fields: ['user_id', 'type']
  //   },
  //   {
  //     fields: ['user_id', 'date_string']
  //   },
  //   {
  //     fields: ['date']
  //   }
  // ],
  hooks: {
    beforeCreate: (entry) => {
      // Ensure date is set from dateString if not provided
      if (!entry.date && entry.dateString) {
        entry.date = new Date(entry.dateString).getTime();
      }
      
      // Ensure dateString is set from date if not provided
      if (!entry.dateString && entry.date) {
        entry.dateString = new Date(entry.date).toISOString();
      }
    },
    beforeUpdate: (entry) => {
      // Update date if dateString changed
      if (entry.changed('dateString')) {
        entry.date = new Date(entry.dateString).getTime();
      }
      
      // Update dateString if date changed
      if (entry.changed('date')) {
        entry.dateString = new Date(entry.date).toISOString();
      }
    }
  }
});

// Instance methods
Entry.prototype.toNightscoutFormat = function() {
  const data = this.toJSON();
  delete data.user_id;
  delete data.created_at;
  delete data.updated_at;
  
  // Convert id to _id for Nightscout compatibility
  data._id = data.id;
  delete data.id;
  
  return data;
};

module.exports = Entry;
