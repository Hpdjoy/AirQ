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
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Dynamically apply all fields from the request body that exist in the schema
    const allowedFields = [
      'tempWarning', 'tempCritical',
      'co2Warning', 'co2Critical',
      'gasWarning', 'gasCritical',
      'dustWarning', 'dustCritical',
      'humidityWarning', 'humidityCritical',
      'aqiWarning', 'aqiCritical',
      'notifyEmail', 'notifySms', 'notifyBuzzer',
      'autoVentilation', 'fanMinOnTime',
      'buzzerWarningCooldown', 'buzzerErrorCooldown',
      'publishInterval'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    }

    settings.updatedAt = Date.now();
    await settings.save();

    // Push updated thresholds to ESP32 via MQTT
    const mqttService = req.app.get('mqttService');
    if (mqttService) {
      mqttService.publishCommand('airq/cmd/NODE-ESP32-1', {
        cmd: 'settings',
        co2Warning: settings.co2Warning,
        co2Critical: settings.co2Critical,
        gasWarning: settings.gasWarning,
        gasCritical: settings.gasCritical,
        dustWarning: settings.dustWarning,
        dustCritical: settings.dustCritical,
        fanMinOnTime: settings.fanMinOnTime,
        buzzerWarningCooldown: settings.buzzerWarningCooldown,
        buzzerErrorCooldown: settings.buzzerErrorCooldown,
        autoVentilation: settings.autoVentilation
      });
      console.log('⚙️ Settings pushed to ESP32 via MQTT');
    }

    res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
