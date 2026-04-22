const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    sensorId: { type: String, default: 'zone-a' },
    building: { type: String, default: 'main-building' },
    floor: { type: String, default: '1' }
  },
  // MQ2 — Combustible Gas & Smoke Sensor
  mq2: {
    raw: { type: Number, required: true },      // Raw analog value (0-4095)
    ppm: { type: Number, required: true },      // Calibrated combustible gas ppm
    smokeLevel: {
      type: String,
      enum: ['safe', 'warning', 'danger'],
      default: 'safe'
    }
  },
  // MQ135 — Air Quality / CO₂ / NO₂ / NH₃ Sensor
  mq135: {
    raw: { type: Number, required: true },      // Raw analog value (0-4095)
    co2_ppm: { type: Number, required: true },  // Estimated CO₂
    no2_ppm: { type: Number, default: 0 },      // Estimated NO₂
    nh3_ppm: { type: Number, default: 0 },      // Estimated NH₃
    vocIndex: { type: Number, default: 0 },     // General VOC score (0-100)
    ventilationBand: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      default: 'good'
    }
  },
  // Dust Sensor
  dust: {
    raw: { type: Number, required: true },      // Raw voltage
    density: { type: Number, required: true },  // µg/m³
    aqi: { type: Number, default: 0 }           // Calculated AQI
  },
  // DHT11 — Temperature & Humidity
  dht11: {
    temperature: { type: Number, required: true },  // °C
    humidity: { type: Number, required: true },      // %RH
    heatIndex: { type: Number, default: 0 },         // Derived
    dewPoint: { type: Number, default: 0 }           // Derived
  },
  // Derived / Cross-Sensor Metrics
  derived: {
    compositeAQI: { type: Number, default: 0 },
    comfortLevel: {
      type: String,
      enum: ['comfortable', 'moderate', 'uncomfortable', 'hazardous'],
      default: 'moderate'
    },
    fireRisk: { type: Number, default: 0 },         // 0-1 score
    healthRisk: { type: Number, default: 0 },        // 0-1 score
    ventilationDemand: { type: Number, default: 0 }, // 0-1 score
    estimatedOccupancy: { type: Number, default: 0 },
    ventilationStatus: {
      type: String,
      enum: ['adequate', 'marginal', 'inadequate'],
      default: 'adequate'
    }
  }
}, {
  timestamps: true,
  // MongoDB Time-Series collection settings
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds'
  }
});

// Index for efficient time-range queries
sensorReadingSchema.index({ timestamp: -1 });
sensorReadingSchema.index({ 'metadata.sensorId': 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
