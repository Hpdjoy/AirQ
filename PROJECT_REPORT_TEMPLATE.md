# AirQ: Industrial IoT Air Quality Monitoring System with Predictive ML
**Final Year Project Report Template**

---

## 1. Abstract
The "AirQ" project is a comprehensive Internet of Things (IoT) solution designed to monitor, analyze, and predict indoor industrial air quality. Using an ESP32 microcontroller equipped with multiple environmental sensors (DHT11, MQ135, MQ2, Dust Sensor), the system streams real-time telemetry data over the MQTT protocol to a Node.js backend. This data is securely persisted in MongoDB, processed for real-time risk alerts, and forwarded to a Python-based FastAPI Machine Learning service. The ML service utilizes a Long Short-Term Memory (LSTM) neural network to predict future PM2.5 levels. All data, trends, and predictive alerts are visualized through a highly responsive, glassmorphic React dashboard, allowing facility managers to take proactive ventilation measures.

## 2. Problem Statement & Objectives
### Problem Statement
Poor indoor air quality in industrial and enclosed environments can lead to long-term health hazards, decreased productivity, and increased fire risks. Traditional monitoring systems only provide current snapshots without predictive capabilities or centralized, accessible dashboards.

### Objectives
1. **Hardware Telemetry:** To build a robust edge device using ESP32 to accurately collect temperature, humidity, CO2, combustible gas, and particulate matter (PM2.5/Dust) levels.
2. **Real-time Pipeline:** To develop a low-latency data pipeline utilizing MQTT and WebSockets.
3. **Predictive AI:** To implement an LSTM-based machine learning model that predicts air quality degradation 30 to 60 minutes into the future.
4. **Proactive Visualization:** To design a modern, responsive React web application that provides actionable insights, safety alerts, and trend analytics.

## 3. System Architecture

### 3.1 Hardware Layer (Edge)
The hardware architecture forms the foundation of the IoT pipeline, responsible for continuous environmental sampling and secure data transmission.

#### 3.1.1 Core Microcontroller
- **ESP32 Development Board:** Selected for its dual-core processing capabilities, built-in 2.4 GHz Wi-Fi, and abundant GPIO pins (General Purpose Input/Output) which are necessary for handling multiple analog and digital sensors simultaneously.

#### 3.1.2 Sensor Integration & Interfacing
The system integrates four distinct sensors to capture a complete environmental profile:
1. **DHT11 (Temperature & Humidity):** 
   - *Interface:* Digital pin using a proprietary 1-wire protocol.
   - *Role:* Provides baseline ambient conditions. Used by the backend to calculate the "Heat Index" (Apparent Temperature) which indicates worker thermal comfort.
2. **MQ-135 (Air Quality / CO2 / NH3):** 
   - *Interface:* Analog-to-Digital Converter (ADC) pin.
   - *Role:* Detects a wide range of volatile organic compounds (VOCs). The firmware maps the raw analog voltage to estimated Parts Per Million (PPM) for hazardous gases.
3. **MQ-2 (Combustible Gas / Smoke):** 
   - *Interface:* Analog-to-Digital Converter (ADC) pin.
   - *Role:* Acts as the primary safety sensor. Calibrated to detect methane, butane, and smoke particles. Essential for the dashboard's "Fire Risk" scoring.
4. **Optical Dust Sensor (PM2.5):** 
   - *Interface:* Analog pin with a Digital trigger pin.
   - *Role:* Uses an infrared LED and phototransistor arrangement to measure airborne particulate matter. The ESP32 pulses the LED and reads the analog voltage drop to calculate dust density (µg/m³).

#### 3.1.3 Circuit Architecture & Power Management
- **Operating Voltage:** The ESP32 operates at 3.3V, but the MQ sensors require a 5V heating element to function correctly. The circuit is powered by a 5V regulated power supply via USB or external VIN, with the ESP32's onboard regulator stepping down the voltage for the logic pins.
- **Voltage Dividers:** Where necessary, voltage dividers are used to safely step down 5V sensor logic signals to the ESP32's 3.3V-tolerant GPIO pins to prevent hardware damage.

#### 3.1.4 Firmware Workflow
The C++ firmware (`air_quality_monitor.ino`) utilizes a non-blocking asynchronous loop using `millis()`. This prevents the system from freezing while waiting for a sensor read. The workflow is:
1. Connect to Wi-Fi.
2. Connect to the Aedes MQTT Broker.
3. Every X seconds, trigger the dust sensor LED, read analog values, read DHT11 digital signals.
4. Construct a serialized JSON string containing all telemetry.
5. Publish to `airq/sensors/ESP32_1`.
6. Listen for incoming control commands (e.g., `calibrate` or `reboot`) on `airq/cmd/ESP32_1`.

### 3.2 Backend Layer (Server & Database)
- **Broker:** Aedes embedded MQTT broker to receive hardware data.
- **API Server:** Node.js + Express.js backend handling REST APIs and routing.
- **Database:** MongoDB for persistent storage of sensor readings and historical analytics.
- **Real-Time Engine:** Socket.IO to broadcast live data and alerts to the web frontend instantly.

### 3.3 Machine Learning Layer (AI Service)
- **Framework:** Python, FastAPI, TensorFlow/Keras.
- **Model:** LSTM Neural Network trained on historical sensor data.
- **Function:** Receives batches of recent data, scales it using `MinMaxScaler`, and outputs 30-minute and 60-minute PM2.5 forecasts.

### 3.4 Frontend Layer (User Interface)
- **Framework:** React.js, Vite.
- **Design System:** Custom CSS tokens, glassmorphism, responsive grid layouts.
- **Libraries:** Recharts for data visualization, Lucide React for iconography.

## 4. Implementation Details

### Data Flow Pipeline
1. **Sensing:** ESP32 reads analog/digital pins, formats data into a JSON payload, and publishes to the `airq/sensors/#` MQTT topic.
2. **Ingestion & Derivation:** The Node.js server subscribes to the topic, parses the data, and calculates derived metrics (e.g., Heat Index, Composite AQI, Fire Risk Score).
3. **Storage & ML:** Data is saved to MongoDB. Every 60 seconds, the backend queries the last 12 readings and sends them to the Python FastAPI service. The ML model predicts future dust levels.
4. **Display:** The dashboard updates instantly via WebSockets, displaying the new readings, plotting charts, and generating UI alerts if thresholds are breached.

## 5. Results & System Performance

### 5.1 Dashboard Visualization
- Successfully created a highly responsive UI with real-time gauges, trend charts, and status cards.
- Implemented a dedicated **Forecast Page** that visually plots actual historical data against predicted future data using area charts.

### 5.2 Real-time Latency
- Achieved sub-second latency from the moment the ESP32 registers a gas spike to the moment the React dashboard flashes a red warning alert.

### 5.3 Predictive Accuracy
- *(Add your specific testing results here once you train the model with real data)*. 
- Example: The LSTM model successfully identified rising PM2.5 trends 30 minutes before they breached safe thresholds, allowing for proactive HVAC (ventilation) activation.

## 6. Challenges Faced & Solutions

1. **Hardware Connectivity:** 
   - *Challenge:* ESP32 occasionally dropped MQTT connections due to Wi-Fi instability.
   - *Solution:* Implemented a non-blocking reconnect loop in the C++ firmware using `millis()` to ensure automatic recovery without freezing sensor reads.
2. **Cross-Service Communication:** 
   - *Challenge:* Bridging the Node.js backend with the Python ML environment.
   - *Solution:* Created an internal REST API bridge where Node.js acts as a client polling the Python FastAPI service securely on `localhost:8000`.
3. **Python Version Compatibility:**
   - *Challenge:* TensorFlow library lacked support for Python 3.14.
   - *Solution:* Implemented a simulation fallback in the Python code so the system doesn't crash, and documented the requirement to run training on Python 3.11.

## 7. Future Scope & Enhancements

1. **Automated HVAC Control:** Integrating smart relays with the ESP32 so the Node.js server can automatically turn on exhaust fans when the ML model predicts poor air quality.
2. **Cloud Deployment:** Migrating the local MongoDB and Node/Python services to AWS or DigitalOcean for global accessibility.
3. **Multi-Node Mesh:** Expanding from a single ESP32 to a mesh network of sensors covering different factory zones, providing a floor-plan heat map of air quality.
4. **Advanced ML Models:** Incorporating external weather APIs into the LSTM model to factor in outdoor humidity and wind patterns for even better indoor prediction accuracy.

## 8. Conclusion
The AirQ project successfully bridges embedded hardware, real-time web technologies, and predictive artificial intelligence. It transitions indoor air quality monitoring from a reactive process (setting off an alarm *after* air is toxic) to a proactive system (alerting managers *before* air becomes toxic). The modular architecture ensures that the system is highly scalable and ready for industrial deployment.
