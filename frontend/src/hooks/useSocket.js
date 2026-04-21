import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // Connect to Node.js backend
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    // Live sensor data updates
    newSocket.on('sensorData', (data) => {
      setSensorData(data);
      // Append to local history for charts (keep last 50 points in memory)
      setHistoryData(prev => [...prev.slice(-49), data]);
    });

    // Alert triggered by backend engine
    newSocket.on('alert', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    });

    // Handle acknowledged alerts broadcasting back
    newSocket.on('alertAcknowledged', (alertId) => {
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, acknowledged: true } : a));
    });

    // Handle historical data batches
    newSocket.on('historyData', ({ readings }) => {
      setHistoryData(readings);
    });

    // Track active devices from heartbeat
    newSocket.on('device_heartbeat', (activeDevices) => {
      setDevices(activeDevices);
    });

    // Cleanup on unmount
    return () => newSocket.close();
  }, []);

  // Actions
  const acknowledgeAlert = useCallback((alertId) => {
    if (socket) socket.emit('acknowledgeAlert', alertId);
  }, [socket]);

  const requestHistory = useCallback((duration) => {
    if (socket) socket.emit('requestHistory', { duration });
  }, [socket]);

  const emitCommand = useCallback((commandType, data) => {
    if (socket) socket.emit(commandType, data);
  }, [socket]);

  return {
    socket,
    isConnected,
    sensorData,
    alerts,
    historyData,
    devices,
    acknowledgeAlert,
    requestHistory,
    emitCommand
  };
}
