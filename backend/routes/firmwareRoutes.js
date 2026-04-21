const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer for firmware blob uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep it simple: always override update.bin for the ESP32 to fetch
    cb(null, 'update.bin'); 
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB max for ESP32
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.bin')) {
      cb(null, true);
    } else {
      cb(new Error('Only .bin firmware files allowed'));
    }
  }
});

module.exports = (mqttService) => {

  // POST /api/firmware/upload
  router.post('/upload', upload.single('firmware'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid format' });
    }

    const { targetDevice, version } = req.body;
    const deviceId = targetDevice || 'NODE-ESP32-1';
    
    // In production, you'd get the actual server IP. 
    // We assume the ESP32 knows the backend's local IP or we send it here.
    // We send an MQTT command to trigger the OTA.
    mqttService.publishCommand(`airq/cmd/${deviceId}`, {
      cmd: 'update',
      url: `/firmware/update.bin`, // Base URL is handled in ESP32 config
      version: version || 'latest'
    });

    res.json({ message: 'Firmware uploaded and OTA trigger dispatched' });
  });

  return router;
};
