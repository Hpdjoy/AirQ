const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get current settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await new Settings().save(); // generate defaults
    }
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.post('/', async (req, res) => {
  try {
    const { tempWarning, tempCritical, co2Warning, co2Critical, gasWarning, gasCritical, aqiWarning, aqiCritical, notifyEmail, notifySms, autoVentilation } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    settings.tempWarning = tempWarning;
    settings.tempCritical = tempCritical;
    settings.co2Warning = co2Warning;
    settings.co2Critical = co2Critical;
    settings.gasWarning = gasWarning;
    settings.gasCritical = gasCritical;
    settings.aqiWarning = aqiWarning;
    settings.aqiCritical = aqiCritical;
    settings.notifyEmail = notifyEmail;
    settings.notifySms = notifySms;
    settings.autoVentilation = autoVentilation;
    settings.updatedAt = Date.now();
    
    await settings.save();
    
    // In a real advanced app, we might emit an event here so the alert engine instantly grabs the new ones,
    // or the alert engine fetches them on cache-miss.
    res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
