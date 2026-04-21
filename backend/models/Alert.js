const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  type: {
    type: String,
    enum: ['gas_leak', 'fire_risk', 'poor_air', 'high_co2', 'toxic_gas', 'high_dust', 'sensor_drift', 'comfort_warning', 'overcrowding'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sensorId: {
    type: String,
    default: 'zone-a'
  },
  sensorType: {
    type: String,
    enum: ['mq2', 'mq135', 'dust', 'dht11', 'combined'],
    required: true
  },
  value: Number,
  threshold: Number,
  acknowledged: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-expire old acknowledged alerts after 30 days
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { acknowledged: true } });

module.exports = mongoose.model('Alert', alertSchema);
