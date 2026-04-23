import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const getBackendUrl = () => {
  const host = window.location.hostname;
  // If hosted on Firebase/public domain, point to the known AWS EC2 backend IP
  if (host.includes('web.app') || host.includes('firebaseapp.com')) {
    return 'http://3.111.196.11:5000';
  }
  return `http://${host}:5000`;
};

const SOCKET_URL = getBackendUrl();

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [prediction, setPrediction] = useState(null);

  // Track whether the user is viewing a specific history window (1h/6h/24h/7d)
  // When true, live sensor updates should NOT overwrite the history data.
  const isViewingHistory = useRef(false);

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
      // Only append to in-memory chart history if NOT viewing a requested window
      if (!isViewingHistory.current) {
        setHistoryData(prev => [...prev.slice(-49), data]);
      }
    });

    // Alert triggered by backend engine
    newSocket.on('alert', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    });

    // Handle acknowledged alerts broadcasting back
    newSocket.on('alertAcknowledged', (alertId) => {
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, acknowledged: true } : a));
    });

    // Handle historical data batches (server response to requestHistory)
    newSocket.on('historyData', ({ readings }) => {
      setHistoryData(readings);
      isViewingHistory.current = true;
    });

    // Track active devices from heartbeat
    newSocket.on('device_heartbeat', (activeDevices) => {
      setDevices(activeDevices);
    });

    // ML prediction updates
    newSocket.on('prediction', (predData) => {
      setPrediction(predData);
    });

    // Cleanup on unmount
    return () => newSocket.close();
  }, []);

  // Actions
  const acknowledgeAlert = useCallback((alertId) => {
    if (socket) socket.emit('acknowledgeAlert', alertId);
  }, [socket]);

  const requestHistory = useCallback((duration) => {
    if (socket) {
      if (duration === 'live') {
        // Switch back to live rolling mode
        isViewingHistory.current = false;
        setHistoryData([]);
      } else {
        socket.emit('requestHistory', { duration });
      }
    }
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
    prediction,
    acknowledgeAlert,
    requestHistory,
    emitCommand
  };
}
