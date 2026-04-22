const { processReading } = require('./services/derivedMetrics');
const mongoose = require('mongoose');
const SensorReading = require('./models/SensorReading');

const rawData = {
  "metadata": {"sensorId":"NODE-ESP32-1", "building":"Main Lab Sensor Array", "floor":"Zone A - Test Floor"},
  "mq2": {"raw": 413, "ppm": 8},
  "mq135": {"raw": 4095, "source":"simulated", "co2_ppm": 653, "no2_ppm": 0.01, "nh3_ppm": 0.8},
  "dust": {"raw": 3.3, "density": 461},
  "dht11": {"temperature": -1, "humidity": -1}
};

try {
  const processed = processReading(rawData);
  
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) sanitize(obj[key]);
      else if (typeof obj[key] === 'number' && (isNaN(obj[key]) || !isFinite(obj[key]))) obj[key] = 0;
    }
  };
  sanitize(processed);
  
  console.log(JSON.stringify(processed, null, 2));
  
  const sr = new SensorReading(processed);
  const err = sr.validateSync();
  console.log('Validation Error:', err);
} catch (e) {
  console.error('CRASH:', e);
}
