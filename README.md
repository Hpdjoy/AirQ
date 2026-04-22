# AirQ Industrial Monitor

AirQ is an industrial and indoor air quality monitoring platform built for a final year project. It combines IoT telemetry (ESP32 + sensors), real-time dashboards, alerting, report generation, and user management.

This repository contains:
- A Node.js backend with Express, MongoDB, MQTT, and Socket.IO
- A Vite + React frontend dashboard
- ESP32 firmware source for sensor node behavior

## 1. What This Project Uses and How It Is Used

### Backend stack
- Node.js + Express: REST API server and middleware pipeline.
- MongoDB + Mongoose: persistent storage for readings, alerts, settings, reports, and users.
- MQTT: receives sensor telemetry and sends device commands.
- Socket.IO: pushes live sensor data, alerts, and device heartbeat updates to frontend clients.
- Multer: handles firmware .bin uploads for OTA distribution.

### Frontend stack
- React (Vite): UI rendering and pages.
- socket.io-client: receives live events from backend.
- Recharts: visualizations for trends and analytics.
- framer-motion: UI animations.

### Firmware side
- ESP32 firmware source in firmware/.
- Backend publishes command messages for actions like ping, calibrate, reboot, and OTA update trigger.

## 2. End-to-End Data Flow (Step by Step)

1. Sensor node publishes telemetry to MQTT topic pattern airq/sensors/#.
2. Backend MQTT service subscribes to the topic and receives JSON payloads.
3. Backend computes derived metrics (AQI, risk scores, ventilation demand, etc.).
4. Processed reading is saved into MongoDB (SensorReading model).
5. Alert engine compares values with thresholds and writes generated alerts to MongoDB.
6. Backend emits real-time events through Socket.IO:
	 - sensorData
	 - alert
	 - device_heartbeat
7. Frontend dashboard receives events and updates charts/cards instantly.
8. Users can acknowledge alerts, view history/stats, adjust settings, generate reports, and manage users through REST APIs.

If USE_SIMULATOR=true, synthetic sensor readings are generated instead of consuming real MQTT telemetry.

## 3. Repository Structure

```text
backend/
	config/        # DB config
	models/        # Mongoose schemas
	routes/        # REST API endpoints
	services/      # MQTT service, simulator, derived metrics, alert engine
	websocket/     # Socket.IO event handlers
	uploads/       # Firmware binaries (update.bin)
	server.js      # Entry point

frontend/
	src/components # Dashboard and page-level components
	src/hooks      # Socket hook
	src/utils      # Helpers

firmware/
	air_quality_monitor.ino
	config.h
```

## 4. Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or remote)
- MQTT broker (for real-device mode), for example Mosquitto

## 5. Backend Setup (Step by Step)

1. Open terminal in backend folder.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Create or update backend .env values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/airq_monitor
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_TOPIC=airq/sensors/#
USE_SIMULATOR=true
SIMULATOR_INTERVAL_MS=3000
```

4. Start backend in development mode:

```bash
npm run dev
```

5. Verify server:
- API health URL: http://localhost:5000/api/health

## 6. Frontend Setup (Step by Step)

1. Open a second terminal in frontend folder.
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Start frontend dev server:

```bash
npm run dev
```

4. Open the URL printed by Vite (typically http://localhost:5173).

## 7. Running Modes

### Simulator mode (recommended for development)
- Set USE_SIMULATOR=true in backend .env.
- No physical ESP32 is required.
- Backend generates realistic sensor signals and heartbeat data.

### Real MQTT mode
- Set USE_SIMULATOR=false.
- Ensure MQTT_BROKER_URL points to live broker.
- Ensure device publishes expected payload structure.

## 8. Backend APIs

All REST APIs are served under /api.

Detailed reference is available in:
- backend/API_REFERENCE.md

High-level groups:
- /api/health
- /api/auth
- /api/users
- /api/sensors
- /api/alerts
- /api/settings
- /api/reports
- /api/devices
- /api/firmware

## 9. WebSocket Events

Server emits:
- sensorData: latest processed reading
- alert: newly triggered alert
- device_heartbeat: active device list and status
- alertAcknowledged: alert id after acknowledgement
- historyData: response for requested history

Client can emit:
- requestHistory
- acknowledgeAlert
- device_command
- calibrate_sensor

## 10. Firmware and OTA Flow

1. Upload firmware binary using POST /api/firmware/upload.
2. Backend stores file as backend/uploads/update.bin.
3. Backend publishes MQTT update command with URL /firmware/update.bin.
4. Backend also serves static firmware path from /firmware.

## 11. Database Collections and Purpose

- SensorReading: raw + derived environmental readings with timestamps.
- Alert: threshold-based alerts with severity and acknowledgement state.
- Settings: dynamic warning/critical thresholds and behavior switches.
- Report: generated CSV/TXT compliance/report files.
- User: account info, role, status, and session token.

## 12. Troubleshooting

- MongoDB connection failure:
	- Verify MONGODB_URI and MongoDB service state.
- No live data in UI:
	- Check backend logs for MQTT connect/subscribe status.
	- If in simulator mode, confirm USE_SIMULATOR=true.
- Firmware upload fails:
	- Only .bin files are accepted.
	- Max upload size is 3 MB.

## 13. Suggested Development Workflow

1. Start MongoDB.
2. Start backend (simulator mode first).
3. Start frontend.
4. Validate health endpoint.
5. Validate dashboard live updates and alerts.
6. Switch to real MQTT mode when hardware is ready.

