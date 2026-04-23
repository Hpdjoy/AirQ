/**
 * 🧠 Prediction Service — Bridge between Node.js backend and Python ML microservice
 * 
 * Periodically collects recent sensor readings from MongoDB, sends them to the
 * FastAPI ML service for LSTM-based forecasting, and broadcasts predictions
 * to all connected WebSocket clients.
 */

const SensorReading = require('../models/SensorReading');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const PREDICTION_INTERVAL_MS = 60_000; // Run predictions every 60 seconds

class PredictionService {
  constructor(io) {
    this.io = io;
    this.latestPrediction = null;
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Start the periodic prediction loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`🧠 Prediction Service started (interval: ${PREDICTION_INTERVAL_MS / 1000}s)`);
    console.log(`🧠 ML Service URL: ${ML_SERVICE_URL}`);

    // Run once immediately, then on interval
    this._runPrediction();
    this.intervalId = setInterval(() => this._runPrediction(), PREDICTION_INTERVAL_MS);
  }

  /**
   * Stop the prediction loop
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🧠 Prediction Service stopped.');
  }

  /**
   * Get the latest cached prediction
   */
  getLatestPrediction() {
    return this.latestPrediction;
  }

  /**
   * Internal: Fetch recent readings, call ML service, broadcast result
   */
  async _runPrediction() {
    try {
      // Fetch the last 12 sensor readings (1 hour of 5-min intervals)
      const readings = await SensorReading.find({})
        .sort({ timestamp: -1 })
        .limit(12)
        .lean();

      if (!readings || readings.length < 3) {
        // Not enough data to predict yet
        return;
      }

      // Reverse to chronological order (oldest first)
      readings.reverse();

      // Map to the format expected by the ML service
      const payload = {
        readings: readings.map(r => ({
          temperature: r.dht11?.temperature || 25,
          humidity: r.dht11?.humidity || 50,
          pm25: r.dust?.density || 15,
          co2: r.mq135?.co2_ppm || 400,
          gas: r.mq2?.ppm || 100
        }))
      };

      // Call the Python ML service
      const response = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`ML service responded with ${response.status}`);
      }

      const prediction = await response.json();

      // Enrich with metadata
      this.latestPrediction = {
        ...prediction,
        timestamp: new Date().toISOString(),
        input_readings_count: readings.length,
        current_pm25: payload.readings[payload.readings.length - 1].pm25,
        current_aqi: readings[readings.length - 1]?.derived?.compositeAQI || 0,
        trend: prediction.predicted_pm25_30m > payload.readings[payload.readings.length - 1].pm25
          ? 'rising'
          : prediction.predicted_pm25_30m < payload.readings[payload.readings.length - 1].pm25
            ? 'falling'
            : 'stable'
      };

      // Broadcast to all connected clients
      this.io.emit('prediction', this.latestPrediction);
      // Cache on io for new client connections
      this.io._latestPrediction = this.latestPrediction;

    } catch (err) {
      // ML service might not be running — that's OK, we fail silently
      if (err.code !== 'ECONNREFUSED' && err.name !== 'AbortError') {
        console.warn(`🧠 Prediction error: ${err.message}`);
      }
    }
  }
}

module.exports = PredictionService;
