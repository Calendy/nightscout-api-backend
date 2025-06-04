const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Treatment = sequelize.define('Treatment', {
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
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Correction Bolus', 'Meal Bolus', 'Snack Bolus', 'Carb Correction', 'BG Check', 'Sensor Start', 'Sensor Stop', 'Pump Battery Change', 'Insulin Change', 'Temp Basal', 'Profile Switch', 'Site Change', 'Note', 'Question', 'Exercise', 'Pump Suspend', 'Pump Resume']]
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  glucose: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 1000
    }
  },
  glucoseType: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['Finger', 'Sensor', 'Manual']]
    }
  },
  carbs: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  protein: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  fat: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  insulin: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  units: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'mg/dl',
    validate: {
      isIn: [['mg/dl', 'mmol/l']]
    }
  },
  transmitterId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sensorCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  enteredBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  percent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 500
    }
  },
  absolute: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  rate: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  temp: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['absolute', 'percent']]
    }
  },
  targetTop: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  targetBottom: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  profile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preBolus: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'treatments',
  // Indexes disabled temporarily to avoid column name conflicts
  // indexes: [
  //   {
  //     fields: ['user_id', 'created_at']
  //   },
  //   {
  //     fields: ['user_id', 'event_type']
  //   },
  //   {
  //     fields: ['created_at']
  //   }
  // ]
});

// Instance methods
Treatment.prototype.toNightscoutFormat = function() {
  const data = this.toJSON();
  delete data.user_id;
  delete data.updated_at;
  
  // Convert id to _id for Nightscout compatibility
  data._id = data.id;
  delete data.id;
  
  return data;
};

module.exports = Treatment;
