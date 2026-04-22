# AirQ Backend API Reference

This document describes all backend endpoints, request/response formats, and real-time interfaces.

## 1. Base Information

- Base URL (local): http://localhost:5000
- REST prefix: /api
- Content type for JSON endpoints: application/json
- Firmware upload content type: multipart/form-data

## 2. Authentication Model

This backend uses a session token stored in User.sessionToken.

- Signup/login returns token.
- Verify endpoint checks token against database.
- There is no JWT middleware currently; most routes are open unless protected at frontend level.

## 3. Common Error Shape

Most error responses follow:

```json
{
  "error": "Error message"
}
```

Some routes return server-specific messages such as:

```json
{
  "error": "Server error"
}
```

## 4. Health Endpoint

### GET /api/health
Purpose: check API process status.

Response example:

```json
{
  "status": "ok",
  "uptime": 1234.56,
  "mode": "simulator",
  "timestamp": "2026-04-22T10:00:00.000Z"
}
```

## 5. Auth Endpoints

### POST /api/auth/signup
Create a new user account.

Request body:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "your-password"
}
```

Success 201:

```json
{
  "message": "Signup successful",
  "token": "session-token-hex",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "Administrator"
  }
}
```

### POST /api/auth/login
Authenticate existing user.

Request body:

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Success 200:

```json
{
  "message": "Login successful",
  "token": "session-token-hex",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "Administrator"
  }
}
```

### POST /api/auth/verify
Validate an existing session token.

Request body:

```json
{
  "token": "session-token-hex"
}
```

Success 200:

```json
{
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "Administrator"
  }
}
```

## 6. User Management Endpoints

### GET /api/users
Get all users sorted by newest first.

Success 200:

```json
[
  {
    "_id": "...",
    "name": "System Administrator",
    "email": "admin@airq.local",
    "role": "Administrator",
    "status": "Active",
    "avatar": "SA"
  }
]
```

### POST /api/users/add
Add a user manually.

Request body:

```json
{
  "name": "Operator One",
  "email": "operator@example.com",
  "role": "Read Only",
  "password": "optional-password"
}
```

Notes:
- If password is omitted, backend uses welcome123 before hashing.

### PUT /api/users/:id
Update a user role.

Request body:

```json
{
  "role": "Settings Manager"
}
```

### DELETE /api/users/:id
Delete a user.

Success 200:

```json
{
  "message": "User successfully removed"
}
```

## 7. Sensor Data Endpoints

### GET /api/sensors/latest
Get latest reading for a sensor.

Query params:
- sensorId (default: zone-a)

Example:
- /api/sensors/latest?sensorId=zone-a

Success 200 returns one SensorReading object.

### GET /api/sensors/history
Get historical readings for a duration.

Query params:
- sensorId (default: zone-a)
- duration: 1h | 6h | 24h | 7d | 30d (default: 1h)
- limit (default: 500)

Example:
- /api/sensors/history?sensorId=zone-a&duration=24h&limit=200

Success 200:

```json
{
  "count": 200,
  "duration": "24h",
  "sensorId": "zone-a",
  "readings": []
}
```

### GET /api/sensors/stats
Get aggregated statistics for a time window.

Query params:
- sensorId (default: zone-a)
- duration: 1h | 6h | 24h | 7d (default: 24h)

Success 200:

```json
{
  "duration": "24h",
  "sensorId": "zone-a",
  "stats": {
    "count": 100,
    "avgTemp": 27.1,
    "maxTemp": 34.2,
    "minTemp": 22.8,
    "avgHumidity": 57.4,
    "avgCO2": 612.3,
    "maxCO2": 1320,
    "avgMQ2": 244.6,
    "maxMQ2": 980,
    "avgDust": 29.8,
    "maxDust": 105.2,
    "avgAQI": 91.7,
    "maxAQI": 220,
    "avgFireRisk": 0.31,
    "maxFireRisk": 0.83,
    "avgHealthRisk": 0.27,
    "maxHealthRisk": 0.72
  }
}
```

## 8. Alert Endpoints

### GET /api/alerts
Get alert list with filters.

Query params:
- sensorId (default: zone-a)
- severity (optional): info | warning | critical
- acknowledged (optional): true | false
- limit (default: 50)

Success 200:

```json
{
  "count": 10,
  "alerts": []
}
```

### GET /api/alerts/active
Get latest unacknowledged alerts.

Success 200:

```json
{
  "count": 5,
  "alerts": []
}
```

### PUT /api/alerts/:id/acknowledge
Mark a single alert as acknowledged.

Success 200:
- Returns updated alert object.

### PUT /api/alerts/acknowledge-all
Mark all unacknowledged alerts as acknowledged.

Success 200:

```json
{
  "acknowledged": 8
}
```

## 9. Settings Endpoints

### GET /api/settings
Fetch current threshold/notification settings.

Behavior:
- If no settings document exists, backend creates one with defaults.

### POST /api/settings
Update settings.

Request body:

```json
{
  "tempWarning": 32,
  "tempCritical": 38,
  "co2Warning": 800,
  "co2Critical": 1200,
  "gasWarning": 50,
  "gasCritical": 150,
  "aqiWarning": 100,
  "aqiCritical": 150,
  "notifyEmail": true,
  "notifySms": false,
  "autoVentilation": true
}
```

Success 200:

```json
{
  "message": "Settings saved successfully",
  "settings": {}
}
```

## 10. Report Endpoints

### GET /api/reports
Get report metadata list (without full content).

### POST /api/reports/generate
Generate a new CSV or TXT report from last 7 days of readings.

Request body:

```json
{
  "formType": "Air Quality Audit",
  "formFormat": "CSV",
  "authorName": "Safety Officer"
}
```

Success 201:

```json
{
  "message": "Report generated successfully",
  "report": {
    "_id": "...",
    "name": "Air Quality Audit",
    "type": "CSV",
    "date": "2026-04-22",
    "size": "18.4 KB",
    "author": "Safety Officer"
  }
}
```

### GET /api/reports/download/:id
Download report content as file.

Behavior:
- If type is CSV, response content-type is text/csv.
- Else response content-type is text/plain.

## 11. Device Endpoints

### GET /api/devices
Get active devices from in-memory device registry.

Success 200:

```json
[
  {
    "id": "NODE-ESP32-1",
    "name": "Primary Factory Sensor",
    "location": "Zone A - Main Floor",
    "status": "online",
    "lastSeen": "2026-04-22T10:00:00.000Z",
    "ip": "192.168.1.104",
    "mac": "E8:DB:84:C1:4F:92",
    "firmware": "v2.1.4",
    "signal": -64,
    "sensors": ["DHT11", "MQ135", "MQ2", "GP2Y1014"]
  }
]
```

## 12. Firmware Endpoints

### POST /api/firmware/upload
Upload firmware binary and trigger OTA command by MQTT.

Request type:
- multipart/form-data

Form fields:
- firmware: required .bin file (max 3 MB)
- targetDevice: optional (default NODE-ESP32-1)
- version: optional (default latest)

Success 200:

```json
{
  "message": "Firmware uploaded and OTA trigger dispatched"
}
```

### GET /firmware/update.bin
Static file serving endpoint for device OTA download.

## 13. WebSocket API (Socket.IO)

### Server to client events
- sensorData
- alert
- device_heartbeat
- historyData
- alertAcknowledged
- error

### Client to server events

1. requestHistory

Payload example:

```json
{
  "duration": "24h",
  "sensorId": "zone-a"
}
```

2. acknowledgeAlert

Payload:
- alert id string

3. device_command

Payload example:

```json
{
  "deviceId": "NODE-ESP32-1",
  "cmd": "reboot"
}
```

4. calibrate_sensor

Payload example:

```json
{
  "deviceId": "NODE-ESP32-1",
  "sensor": "mq2"
}
```

## 14. MQTT Topics Used

### Subscribed by backend
- airq/sensors/#
- airq/status/#

### Published by backend
- airq/cmd/:deviceId

Command payload examples:

```json
{
  "cmd": "ping",
  "user": "system"
}
```

```json
{
  "cmd": "update",
  "url": "/firmware/update.bin",
  "version": "latest"
}
```

## 15. Core Data Models (Summary)

### SensorReading
- timestamp, metadata (sensorId, building, floor)
- mq2 (raw, ppm, smokeLevel)
- mq135 (raw, co2_ppm, no2_ppm, nh3_ppm, vocIndex, ventilationBand)
- dust (raw, density, aqi)
- dht11 (temperature, humidity, heatIndex, dewPoint)
- derived (compositeAQI, comfortLevel, fireRisk, healthRisk, ventilationDemand, estimatedOccupancy, ventilationStatus)

### Alert
- timestamp, type, severity, message
- sensorId, sensorType
- value, threshold
- acknowledged

### Settings
- tempWarning, tempCritical
- co2Warning, co2Critical
- gasWarning, gasCritical
- aqiWarning, aqiCritical
- notifyEmail, notifySms, autoVentilation

### Report
- name, type (CSV/TXT/PDF), date, size, author, content

### User
- name, email, password (sha256 hash in current implementation)
- sessionToken, role, status, avatar
