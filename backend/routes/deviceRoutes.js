const express = require('express');
const router = express.Router();

module.exports = (mqttService) => {
  // Get active devices
  router.get('/', (req, res) => {
    try {
      const activeDevices = mqttService.getActiveDevices();
      res.json(activeDevices);
    } catch (err) {
      console.error('Error fetching devices:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
