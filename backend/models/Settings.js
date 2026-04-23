const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // ==================== Alert Thresholds ====================
  tempWarning: { type: Number, default: 32 },
  tempCritical: { type: Number, default: 38 },
  co2Warning: { type: Number, default: 1000 },
  co2Critical: { type: Number, default: 2000 },
  gasWarning: { type: Number, default: 500 },
  gasCritical: { type: Number, default: 1000 },
  dustWarning: { type: Number, default: 150 },
  dustCritical: { type: Number, default: 300 },
  humidityWarning: { type: Number, default: 70 },
  humidityCritical: { type: Number, default: 85 },
  aqiWarning: { type: Number, default: 50 },
  aqiCritical: { type: Number, default: 150 },

  // ==================== Notification Channels ====================
  notifyEmail: { type: Boolean, default: true },
  notifySms: { type: Boolean, default: false },
  notifyBuzzer: { type: Boolean, default: true },

  // ==================== Actuator Automation ====================
  autoVentilation: { type: Boolean, default: true },
  fanMinOnTime: { type: Number, default: 30 },        // seconds
  buzzerWarningCooldown: { type: Number, default: 30 }, // seconds
  buzzerErrorCooldown: { type: Number, default: 15 },   // seconds

  // ==================== Sensor Configuration ====================
  publishInterval: { type: Number, default: 3 },  // seconds

  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
