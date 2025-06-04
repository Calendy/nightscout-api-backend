const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');

// Import controllers
const entriesController = require('../controllers/entries');
const treatmentsController = require('../controllers/treatments');
const statusController = require('../controllers/status');

// Status endpoint (can be accessed without authentication for basic info)
router.get('/status', optionalAuth, statusController.getStatus);
router.get('/status.json', optionalAuth, statusController.getStatus);

// Entries endpoints
router.get('/entries', authenticate, entriesController.getEntries);
router.get('/entries.json', authenticate, entriesController.getEntries);
router.get('/entries/:spec', authenticate, entriesController.getEntriesBySpec);
router.get('/entries/:spec.json', authenticate, entriesController.getEntriesBySpec);
router.post('/entries', authenticate, entriesController.createEntries);
router.post('/entries.json', authenticate, entriesController.createEntries);
router.delete('/entries', authenticate, entriesController.deleteEntries);
router.delete('/entries.json', authenticate, entriesController.deleteEntries);

// Treatments endpoints
router.get('/treatments', authenticate, treatmentsController.getTreatments);
router.get('/treatments.json', authenticate, treatmentsController.getTreatments);
router.post('/treatments', authenticate, treatmentsController.createTreatments);
router.post('/treatments.json', authenticate, treatmentsController.createTreatments);
router.delete('/treatments', authenticate, treatmentsController.deleteTreatments);
router.delete('/treatments.json', authenticate, treatmentsController.deleteTreatments);
router.delete('/treatments/:spec', authenticate, treatmentsController.deleteTreatmentById);

// Profile endpoint (placeholder for future implementation)
router.get('/profile', authenticate, (req, res) => {
  res.json({
    dia: 3,
    carbratio: [
      {
        time: "00:00",
        value: 15
      }
    ],
    carbs_hr: 20,
    delay: 20,
    sens: [
      {
        time: "00:00", 
        value: 50
      }
    ],
    timezone: "UTC",
    basal: [
      {
        time: "00:00",
        value: 1.0
      }
    ],
    target_low: [
      {
        time: "00:00",
        value: 80
      }
    ],
    target_high: [
      {
        time: "00:00", 
        value: 150
      }
    ],
    startDate: new Date().toISOString(),
    mills: Date.now(),
    units: req.user.settings?.units || "mg/dl",
    created_at: new Date().toISOString()
  });
});

router.get('/profile.json', authenticate, (req, res) => {
  res.json({
    dia: 3,
    carbratio: [
      {
        time: "00:00",
        value: 15
      }
    ],
    carbs_hr: 20,
    delay: 20,
    sens: [
      {
        time: "00:00", 
        value: 50
      }
    ],
    timezone: "UTC",
    basal: [
      {
        time: "00:00",
        value: 1.0
      }
    ],
    target_low: [
      {
        time: "00:00",
        value: 80
      }
    ],
    target_high: [
      {
        time: "00:00", 
        value: 150
      }
    ],
    startDate: new Date().toISOString(),
    mills: Date.now(),
    units: req.user.settings?.units || "mg/dl",
    created_at: new Date().toISOString()
  });
});

// Device status endpoint (placeholder for future implementation)
router.get('/devicestatus', authenticate, (req, res) => {
  res.json([]);
});

router.get('/devicestatus.json', authenticate, (req, res) => {
  res.json([]);
});

router.post('/devicestatus', authenticate, (req, res) => {
  // For now, just return empty array (success)
  res.json([]);
});

router.post('/devicestatus.json', authenticate, (req, res) => {
  // For now, just return empty array (success)
  res.json([]);
});

module.exports = router;
