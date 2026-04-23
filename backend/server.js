/**
 * 🏭 AirQ Industrial Monitor — Backend Server
 * 
 * Express + Socket.IO + MQTT + MongoDB
 * Receives sensor data (real or simulated), computes derived metrics,
 * checks alert thresholds, stores in MongoDB, and broadcasts via WebSocket.
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const MQTTService = require('./services/mqttService');
const { Aedes } = require('aedes');
const net = require('net');
const setupSocket = require('./websocket/socketHandler');
const sensorRoutes = require('./routes/sensorRoutes');
const alertRoutes = require('./routes/alertRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const PredictionService = require('./services/predictionService');

const app = express();
const server = http.createServer(app);

// Socket.IO with CORS for React dev server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    mode: process.env.USE_SIMULATOR === 'true' ? 'simulator' : 'mqtt',
    timestamp: new Date()
  });
});

// Start everything
const PORT = process.env.PORT || 5000;
const MQTT_PORT = process.env.MQTT_PORT || 1883;

async function start() {
  // 1. Connect to MongoDB
  await connectDB();

  // 1.5. Start Embedded MQTT Broker (Aedes 1.x async API)
  const aedes = await Aedes.createBroker();
  const mqttServer = net.createServer((conn) => aedes.handle(conn));

  // Wait for broker to be fully ready before connecting MQTT client
  await new Promise((resolve, reject) => {
    mqttServer.listen(MQTT_PORT, () => {
      console.log(`🔌 Embedded MQTT Broker is listening on port ${MQTT_PORT}`);
      resolve();
    });
    mqttServer.on('error', reject);
  });

  // 2. Start MQTT service (or simulator) — broker is guaranteed ready now
  const mqttService = new MQTTService(io);
  mqttService.start();

  // Route requiring mqttService
  const deviceRoutes = require('./routes/deviceRoutes')(mqttService);
  const firmwareRoutes = require('./routes/firmwareRoutes')(mqttService);

  app.use('/api/devices', deviceRoutes);
  app.use('/api/firmware', firmwareRoutes);

  // Serve the firmware files statically for the ESP32 to download
  const path = require('path');
  app.use('/firmware', express.static(path.join(__dirname, 'uploads')));

  // 3. Setup WebSocket handlers
  setupSocket(io, mqttService);

  // 4. Start ML Prediction Service
  const predictionService = new PredictionService(io);
  predictionService.start();
  app.set('predictionService', predictionService);

  // 4. Start HTTP server
  server.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════╗
    ║  🏭  AirQ Industrial Monitor — Backend       ║
    ║  📡  Port: ${PORT}                           ║
    ║  💾  MongoDB: ${process.env.MONGODB_URI}     ║
    ║  🎮  Mode: ${process.env.USE_SIMULATOR === 'true' ? 'SIMULATOR' : 'MQTT BROKER'}                     ║
    ║  🔌  WebSocket: Ready                        ║
    ╚══════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    if (mqttService) mqttService.stop();
    mqttServer.close();
    aedes.close();
    server.close();
    process.exit(0);
  });
}

start().catch(console.error);
