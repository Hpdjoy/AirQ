/**
 * WebSocket Handler — Socket.IO event management
 */

function setupSocket(io, mqttService) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send the latest reading immediately on connect
    const latest = mqttService.getLatestReading();
    if (latest) {
      socket.emit('sensorData', latest);
    }

    // Handle client requesting historical data
    socket.on('requestHistory', async (params) => {
      try {
        const SensorReading = require('../models/SensorReading');
        const { duration = '1h', sensorId = 'zone-a' } = params || {};

        const durationMap = {
          '1h': 60 * 60 * 1000,
          '6h': 6 * 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000
        };

        const timeAgo = new Date(Date.now() - (durationMap[duration] || durationMap['1h']));

        const readings = await SensorReading.find({
          'metadata.sensorId': sensorId,
          timestamp: { $gte: timeAgo }
        })
          .sort({ timestamp: 1 })
          .limit(500)
          .lean();

        socket.emit('historyData', { duration, readings });
      } catch (err) {
        socket.emit('error', { message: 'Failed to fetch history' });
      }
    });

    // Handle alert acknowledgement
    socket.on('acknowledgeAlert', async (alertId) => {
      try {
        const Alert = require('../models/Alert');
        await Alert.findByIdAndUpdate(alertId, { acknowledged: true });
        io.emit('alertAcknowledged', alertId);
      } catch (err) {
        socket.emit('error', { message: 'Failed to acknowledge alert' });
      }
    });

    // Handle IoT Commands
    socket.on('device_command', (data) => {
      const targetDevice = data.deviceId || 'NODE-ESP32-1';
      const commandString = data.cmd || 'ping'; // 'reboot', 'ping', 'calibrate'

      mqttService.publishCommand(`airq/cmd/${targetDevice}`, {
        cmd: commandString,
        user: 'system'
      });
      console.log(`🔌 WS->MQTT: Forwarded [${commandString}] to ${targetDevice}`);
    });

    socket.on('calibrate_sensor', (data) => {
      const targetDevice = data.deviceId || 'NODE-ESP32-1';
      mqttService.publishCommand(`airq/cmd/${targetDevice}`, {
        cmd: 'calibrate',
        sensor: data.sensor || 'mq2'
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;
