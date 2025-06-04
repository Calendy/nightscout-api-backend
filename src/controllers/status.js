const packageJson = require('../../package.json');

// GET /api/v1/status[.json]
const getStatus = async (req, res) => {
  try {
    const user = req.user;
    
    const status = {
      apiEnabled: true,
      careportalEnabled: true,
      head: process.env.GIT_COMMIT || 'unknown',
      name: packageJson.name,
      version: packageJson.version,
      settings: {
        units: user?.settings?.units || 'mg/dl',
        timeFormat: user?.settings?.timeFormat || 12,
        customTitle: process.env.APP_NAME || 'Nightscout API Backend',
        nightMode: user?.settings?.nightMode || false,
        theme: user?.settings?.theme || 'default',
        language: user?.settings?.language || 'en',
        showPlugins: 'careportal boluscalc food bwp cage sage iage iob cob basal ar2 rawbg upbat',
        showRawbg: user?.settings?.showRawbg || 'never',
        alarmTypes: ['simple'],
        alarmUrgentHigh: user?.settings?.alarmUrgentHigh !== false,
        alarmHigh: user?.settings?.alarmHigh !== false,
        alarmLow: user?.settings?.alarmLow !== false,
        alarmUrgentLow: user?.settings?.alarmUrgentLow !== false,
        alarmTimeagoWarn: true,
        alarmTimeagoWarnMins: 15,
        alarmTimeagoUrgent: true,
        alarmTimeagoUrgentMins: 30,
        enable: [
          'careportal',
          'boluscalc',
          'food',
          'bwp',
          'cage',
          'sage',
          'iage',
          'iob',
          'cob',
          'basal',
          'ar2',
          'rawbg',
          'upbat'
        ],
        thresholds: {
          bg_high: user?.settings?.alarmHigh || 180,
          bg_target_top: user?.settings?.targetTop || 150,
          bg_target_bottom: user?.settings?.targetBottom || 80,
          bg_low: user?.settings?.alarmLow || 70
        }
      },
      extendedSettings: {
        devicestatus: {
          advanced: true
        },
        pump: {
          fields: 'reservoir battery clock status'
        },
        openaps: {
          enableAlerts: true
        },
        loop: {
          enableAlerts: true
        },
        override: {
          enableAlerts: true
        },
        xdripjs: {
          enableAlerts: true
        }
      },
      authorized: user ? {
        read: true,
        write: true,
        admin: false
      } : null
    };
    
    res.json(status);
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get status'
    });
  }
};

module.exports = {
  getStatus
};
