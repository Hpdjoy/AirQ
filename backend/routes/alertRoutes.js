/**
 * Alert REST API Routes
 */

const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET /api/alerts — Get recent alerts
router.get('/', async (req, res) => {
  try {
    const {
      sensorId = 'zone-a',
      severity,
      acknowledged,
      limit = 50
    } = req.query;

    const filter = {};
    if (sensorId) filter.sensorId = sensorId;
    if (severity) filter.severity = severity;
    if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';

    const alerts = await Alert.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      count: alerts.length,
      alerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/active — Get unacknowledged alerts
router.get('/active', async (req, res) => {
  try {
    const alerts = await Alert.find({ acknowledged: false })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/alerts/:id/acknowledge — Acknowledge an alert
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true },
      { new: true }
    );

    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/alerts/acknowledge-all — Acknowledge all alerts
router.put('/acknowledge-all', async (req, res) => {
  try {
    const result = await Alert.updateMany(
      { acknowledged: false },
      { acknowledged: true }
    );
    res.json({ acknowledged: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
