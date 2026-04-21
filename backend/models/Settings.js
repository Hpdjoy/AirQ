const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  tempWarning: { type: Number, default: 32 },
  tempCritical: { type: Number, default: 38 },
  co2Warning: { type: Number, default: 800 },
  co2Critical: { type: Number, default: 1200 },
  gasWarning: { type: Number, default: 50 },
  gasCritical: { type: Number, default: 150 },
  aqiWarning: { type: Number, default: 100 },
  aqiCritical: { type: Number, default: 150 },
  notifyEmail: { type: Boolean, default: true },
  notifySms: { type: Boolean, default: false },
  autoVentilation: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
