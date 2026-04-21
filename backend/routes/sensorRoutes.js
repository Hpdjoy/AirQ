/**
 * Sensor REST API Routes
 */

const express = require('express');
const router = express.Router();
const SensorReading = require('../models/SensorReading');

// GET /api/sensors/latest — Get latest reading
router.get('/latest', async (req, res) => {
  try {
    const sensorId = req.query.sensorId || 'zone-a';
    const reading = await SensorReading.findOne({ 'metadata.sensorId': sensorId })
      .sort({ timestamp: -1 })
      .lean();

    if (!reading) {
      return res.status(404).json({ error: 'No readings found' });
    }
    res.json(reading);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/history — Get historical readings
router.get('/history', async (req, res) => {
  try {
    const {
      sensorId = 'zone-a',
      duration = '1h',
      limit = 500
    } = req.query;

    const durationMap = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const timeAgo = new Date(Date.now() - (durationMap[duration] || durationMap['1h']));

    const readings = await SensorReading.find({
      'metadata.sensorId': sensorId,
      timestamp: { $gte: timeAgo }
    })
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      count: readings.length,
      duration,
      sensorId,
      readings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/stats — Get aggregated stats for a time range
router.get('/stats', async (req, res) => {
  try {
    const { sensorId = 'zone-a', duration = '24h' } = req.query;

    const durationMap = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const timeAgo = new Date(Date.now() - (durationMap[duration] || durationMap['24h']));

    const stats = await SensorReading.aggregate([
      {
        $match: {
          'metadata.sensorId': sensorId,
          timestamp: { $gte: timeAgo }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgTemp: { $avg: '$dht11.temperature' },
          maxTemp: { $max: '$dht11.temperature' },
          minTemp: { $min: '$dht11.temperature' },
          avgHumidity: { $avg: '$dht11.humidity' },
          avgCO2: { $avg: '$mq135.co2_ppm' },
          maxCO2: { $max: '$mq135.co2_ppm' },
          avgMQ2: { $avg: '$mq2.ppm' },
          maxMQ2: { $max: '$mq2.ppm' },
          avgDust: { $avg: '$dust.density' },
          maxDust: { $max: '$dust.density' },
          avgAQI: { $avg: '$derived.compositeAQI' },
          maxAQI: { $max: '$derived.compositeAQI' },
          avgFireRisk: { $avg: '$derived.fireRisk' },
          maxFireRisk: { $max: '$derived.fireRisk' },
          avgHealthRisk: { $avg: '$derived.healthRisk' },
          maxHealthRisk: { $max: '$derived.healthRisk' }
        }
      }
    ]);

    res.json({
      duration,
      sensorId,
      stats: stats[0] || {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
