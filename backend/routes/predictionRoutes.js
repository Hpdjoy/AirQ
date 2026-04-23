/**
 * 🧠 Prediction API Routes
 * 
 * REST endpoints for ML prediction data and ML service health.
 */

const express = require('express');
const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * GET /api/predictions/latest
 * Returns the latest cached prediction from the PredictionService
 */
router.get('/latest', (req, res) => {
  const predictionService = req.app.get('predictionService');
  if (!predictionService) {
    return res.status(503).json({ error: 'Prediction service not available' });
  }

  const latest = predictionService.getLatestPrediction();
  if (!latest) {
    return res.json({
      status: 'no_data',
      message: 'No predictions available yet. The ML service may still be initializing.'
    });
  }

  res.json(latest);
});

/**
 * GET /api/predictions/health
 * Proxies health check to the Python ML service
 */
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await response.json();
    res.json({ ml_service: 'online', ...data });
  } catch (err) {
    res.json({
      ml_service: 'offline',
      error: err.message,
      hint: 'Start the ML service with: cd ml_service && uvicorn app:app --host 0.0.0.0 --port 8000'
    });
  }
});

/**
 * POST /api/predictions/predict
 * Manual prediction request — accepts sensor readings directly
 */
router.post('/predict', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    const prediction = await response.json();
    res.json(prediction);
  } catch (err) {
    res.status(503).json({
      error: 'ML service unavailable',
      message: err.message
    });
  }
});

module.exports = router;
