/**
 * MQTT Service
 * 
 * Subscribes to MQTT broker and processes incoming sensor data.
 * When USE_SIMULATOR=true, runs the internal simulator instead.
 */

const mqtt = require('mqtt');
const SensorSimulator = require('./simulator');
const { processReading } = require('./derivedMetrics');
const { checkThresholds } = require('./alertEngine');
const SensorReading = require('../models/SensorReading');

class MQTTService {
  constructor(io) {
    this.io = io;                  // Socket.IO instance
    this.client = null;            // MQTT client
    this.simulator = null;         // Simulator instance
    this.simulatorInterval = null;
    this.previousReading = null;   // For trend detection
    this.latestReading = null;     // Current reading cache
  }

  /**
   * Start the service — either connect to MQTT broker or start simulator
   */
  start() {
    if (process.env.USE_SIMULATOR === 'true') {
      this.startSimulator();
    } else {
      this.connectMQTT();
    }
  }

  /**
   * Connect to real MQTT broker
   */
  connectMQTT() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    console.log(`📡 Connecting to MQTT Broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      console.log('✅ MQTT Connected');
      this.client.subscribe(process.env.MQTT_TOPIC || 'airq/sensors/#', (err) => {
        if (err) console.error('MQTT Subscribe error:', err);
      });
      // Subscribe to heartbeats and command ACKs
      this.client.subscribe('airq/status/#', (err) => {
        if (err) console.error('MQTT Subscribe error:', err);
        else console.log('📡 Subscribed to sensor/status topics');
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const rawData = JSON.parse(message.toString());
        
        // Handle Heartbeat route
        if (topic.includes('airq/status/heartbeat')) {
           this.handleDeviceHeartbeat(rawData);
           return;
        }

        // Handle regular sensor data
        await this.handleSensorData(rawData);
      } catch (err) {
        console.error('Error processing MQTT message:', err.message);
      }
    });

    this.client.on('error', (err) => {
      console.error('MQTT Error:', err.message);
    });

    // Cleanup stale devices every 15 seconds
    setInterval(() => this.cleanupStaleDevices(), 15000);
  }

  // Device Registry Memory
  devices = new Map();

  handleDeviceHeartbeat(data) {
    const deviceId = data.id || 'NODE-ESP32-1';
    this.devices.set(deviceId, {
      id: deviceId,
      name: data.name || 'Sensor Array',
      location: data.location || 'Zone A',
      status: 'online',
      lastSeen: new Date().toISOString(),
      lastSeenEpoch: Date.now(),
      ip: data.ip || '0.0.0.0',
      mac: data.mac || '00:00:00:00:00:00',
      firmware: data.firmware || 'v1.0.0',
      signal: data.signal || -100,
      sensors: data.sensors || ['DHT11', 'MQ135', 'MQ2', 'GP2Y1014AU0F']
    });
    // Broadcast active device update
    this.io.emit('device_heartbeat', Array.from(this.devices.values()));
  }

  cleanupStaleDevices() {
    const now = Date.now();
    let changed = false;
    for (const [id, device] of this.devices.entries()) {
      if (device.status === 'online' && now - device.lastSeenEpoch > 30000) { // 30s timeout
        device.status = 'offline';
        changed = true;
      }
    }
    if (changed) {
      this.io.emit('device_heartbeat', Array.from(this.devices.values()));
    }
  }

  getActiveDevices() {
    return Array.from(this.devices.values());
  }

  publishCommand(topic, payload) {
    if (this.simulator) { // We are in simulation mode
      console.log(`🎮 Simulator intercepted command: ${payload.cmd}`);
      this.simulator.handleSimulationCommand(payload.cmd);
    } else if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(payload));
      console.log(`📡 Dispatched Command to ${topic}:`, payload);
    } else {
      console.warn(`⚠️ Cannot dispatch command. MQTT not connected.`);
    }
  }

  startSimulator() {
    const interval = parseInt(process.env.SIMULATOR_INTERVAL_MS) || 3000;
    console.log(`🎮 Starting Sensor Simulator (interval: ${interval}ms)`);
    this.simulator = new SensorSimulator();

    this.simulatorInterval = setInterval(async () => {
      const rawData = this.simulator.generateReading();
      
      if (!rawData) {
        // Node is rebooting, drop telemetry and connection signal entirely
        return;
      }
      
      await this.handleSensorData(rawData);

      // Inject robust mocked Hardware Heartbeat actively simulating a connected ESP32 Node
      this.handleDeviceHeartbeat({
        id: 'NODE-ESP32-1',
        name: 'Primary Factory Sensor',
        location: 'Zone A - Main Floor',
        ip: '192.168.1.104',
        mac: 'E8:DB:84:C1:4F:92',
        firmware: 'v2.1.4',
        signal: -Math.floor(Math.random() * (75 - 60 + 1) + 60), // Randomize RSSI
        sensors: ['DHT11', 'MQ135', 'MQ2', 'GP2Y1014']
      });
    }, interval);
  }

  /**
   * Process incoming sensor data (from MQTT or simulator)
   */
  async handleSensorData(rawData) {
    try {
      // 1. Compute all derived metrics
      const processedReading = processReading(rawData, this.previousReading);

      // 2. Save to MongoDB
      const savedReading = await new SensorReading(processedReading).save();

      // 3. Check thresholds and generate alerts
      const emitAlert = (alert) => {
        this.io.emit('alert', alert);
      };
      await checkThresholds(processedReading, emitAlert);

      // 4. Broadcast to all connected WebSocket clients
      this.io.emit('sensorData', processedReading);

      // 5. Update state
      this.previousReading = processedReading;
      this.latestReading = processedReading;

    } catch (err) {
      console.error('Error handling sensor data:', err.message);
    }
  }

  /**
   * Get the latest reading (for REST API)
   */
  getLatestReading() {
    return this.latestReading;
  }

  /**
   * Stop the service
   */
  stop() {
    if (this.client) this.client.end();
    if (this.simulatorInterval) clearInterval(this.simulatorInterval);
    console.log('🛑 MQTT Service stopped');
  }
}

module.exports = MQTTService;
