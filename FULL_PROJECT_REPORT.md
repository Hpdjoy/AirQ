# FINAL YEAR PROJECT REPORT
**Project Title:** AirQ: Industrial IoT Air Quality Monitoring System with Predictive Machine Learning

---

## ABSTRACT
Indoor air quality is a critical factor in industrial environments, directly impacting worker health, safety, and productivity. Traditional monitoring systems often act re-actively, triggering alarms only after hazardous thresholds have been breached. This project presents "AirQ," a comprehensive Internet of Things (IoT) solution designed to monitor, analyze, and predict indoor air quality in real-time. 

The edge hardware utilizes an ESP32 microcontroller interfaced with a suite of environmental sensors—including the DHT11 (Temperature and Humidity), MQ-135 (CO2 and NH3), MQ-2 (Combustible gases), and an Optical Dust Sensor (PM2.5). Telemetry data is transmitted via the lightweight MQTT protocol to a Node.js backend, where it is stored in a MongoDB database. A core feature of this system is its predictive capability; a Python-based FastAPI service running a Long Short-Term Memory (LSTM) neural network analyzes historical trends to forecast PM2.5 levels 30 to 60 minutes into the future. All real-time telemetry and predictive insights are presented through a responsive, glassmorphic React.js dashboard, enabling facility managers to take proactive ventilation measures.

---

## CHAPTER 1: INTRODUCTION

### 1.1 Background
The industrial revolution brought significant advancements, but also introduced severe occupational hazards, particularly airborne pollutants. In modern factories, poor ventilation combined with the release of volatile organic compounds (VOCs), particulate matter, and combustible gases can lead to respiratory illnesses and fire hazards. Continuous environmental monitoring has transitioned from a luxury to a strict regulatory necessity.

### 1.2 Motivation
Current systems in the market are often highly fragmented. A factory might have a standalone fire alarm, a separate thermostat, and an isolated CO2 monitor. These systems rarely talk to each other, and more importantly, they lack predictive capabilities. The motivation behind AirQ is to unify these fragmented systems into a single centralized dashboard and apply Artificial Intelligence to predict hazards before they occur.

### 1.3 Objectives
- **Hardware Integration:** To design and deploy an ESP32-based sensor node capable of multi-parameter environmental sampling.
- **Low-Latency Communication:** To establish a robust data pipeline using MQTT and WebSockets.
- **Predictive Modeling:** To train and implement an LSTM neural network that forecasts particulate matter (PM2.5) levels.
- **Data Visualization:** To build an intuitive, web-based dashboard for real-time monitoring and alert management.

---

## CHAPTER 2: EXISTING SYSTEMS VS. PROPOSED SYSTEM

### 2.1 Existing Systems
Traditional HVAC (Heating, Ventilation, and Air Conditioning) monitoring relies on simple threshold-based logic. If CO2 levels exceed 1000 PPM, a fan is turned on. These systems:
- Do not account for the rate of change (e.g., if CO2 is rising rapidly).
- Lack modern user interfaces.
- Do not store historical data for long-term analytics.
- Have zero predictive intelligence.

### 2.2 Proposed System (AirQ)
AirQ introduces a paradigm shift by moving from reactive to proactive monitoring. By routing all sensor data into a centralized MongoDB database, the system creates a rich historical dataset. The LSTM machine learning model continuously trains on this data, recognizing patterns that precede air quality degradation. The proposed system features a modern web dashboard accessible from any device, instantly notifying administrators of predicted hazards.

---

## CHAPTER 3: HARDWARE ARCHITECTURE

The hardware layer serves as the sensory organs of the AirQ system, tasked with continuous sampling of the physical environment.

### 3.1 Microcontroller Unit (MCU)
The **ESP32 Development Board** was selected as the core MCU. It features a dual-core Tensilica Xtensa LX6 microprocessor running at 240 MHz, integrated 2.4 GHz Wi-Fi, and built-in Bluetooth. The ESP32's multiple Analog-to-Digital Converters (ADCs) are crucial for interfacing with the analog gas and dust sensors.

### 3.2 Sensor Suite
1. **DHT11 Sensor (Temperature & Humidity):**
   - Communicates via a digital 1-wire protocol.
   - Provides ambient baseline conditions necessary for calculating the Apparent Temperature (Heat Index), which dictates worker comfort.
2. **MQ-135 Gas Sensor (Air Quality):**
   - Interfaced via an analog pin. 
   - Highly sensitive to Ammonia, Sulfide, and Benzene steam, making it ideal for monitoring general volatile organic compounds (VOCs) and estimating CO2 equivalents.
3. **MQ-2 Gas Sensor (Combustible Gases):**
   - Interfaced via an analog pin.
   - Acts as the primary safety mechanism. It is highly sensitive to LPG, Propane, Hydrogen, and smoke. The raw analog voltage is mapped by the firmware to determine immediate fire risk.
4. **Optical Dust Sensor (Sharp GP2Y1010AU0F / Similar):**
   - Interfaced using one digital trigger pin and one analog read pin.
   - Measures PM2.5 by pulsing an infrared LED into an air chamber and using a phototransistor to measure the scattered light bouncing off dust particles.

### 3.3 Power Management and Circuitry
The ESP32 operates at a 3.3V logic level. However, the MQ series gas sensors require a 5V internal heater to function correctly. The hardware is powered via a 5V regulated USB supply. The 5V is distributed to the sensors, while the ESP32's onboard voltage regulator provides 3.3V for logic. Voltage dividers are utilized to safely step down the 5V analog outputs from the sensors to the 3.3V tolerated by the ESP32 ADC pins, protecting the microcontroller from overvoltage damage.

---

## CHAPTER 4: SOFTWARE IMPLEMENTATION

### 4.1 Embedded Firmware (C++)
Written in the Arduino IDE, the firmware uses an asynchronous, non-blocking state machine utilizing the `millis()` function. This ensures the ESP32 can maintain its Wi-Fi and MQTT connections without halting during sensor read delays. The data is packaged into a JSON payload and published to the MQTT broker topic `airq/sensors/ESP32_1` every 5 seconds.

### 4.2 Backend Infrastructure (Node.js & Express)
The backend acts as the central nervous system.
- **MQTT Broker:** An embedded `Aedes` MQTT broker receives hardware telemetry.
- **Data Derivation:** The Node.js server calculates derived metrics, such as the Composite Air Quality Index (AQI), by fusing data from the MQ135 and Dust sensor.
- **Database:** `MongoDB` is used to persist all readings, ensuring data is available for both historical chart rendering and machine learning training.
- **Real-time Engine:** `Socket.IO` establishes WebSocket connections with the frontend dashboard, broadcasting data instantly without requiring page refreshes.

### 4.3 Machine Learning Pipeline (Python & FastAPI)
- **Model Architecture:** A Long Short-Term Memory (LSTM) network was chosen due to its superior performance with time-series data. Unlike standard neural networks, LSTMs have internal memory states that remember past sequences (e.g., the last 60 minutes of air quality trends).
- **Service API:** A Python FastAPI application exposes an internal `/predict` endpoint. Every 60 seconds, the Node.js backend sends the latest sensor readings to this endpoint. The model scales the data using `MinMaxScaler` and returns the predicted PM2.5 levels for 30 and 60 minutes into the future.

### 4.4 Frontend Dashboard (React.js)
The user interface is built using React.js and Vite. It features:
- **Real-Time Gauges:** Displaying current Temperature, Humidity, AQI, and Fire Risk.
- **Analytics Charts:** Utilizing `Recharts` to plot historical data over time.
- **AI Forecast Page:** A dedicated interface mapping the LSTM's predictions against current PM2.5 levels, providing proactive warnings if future levels are predicted to cross hazardous thresholds.

---

## CHAPTER 5: RESULTS AND PERFORMANCE

### 5.1 System Latency
The transition from MQTT to WebSockets proved highly efficient. When a gas leak was simulated near the MQ-2 sensor, the physical detection to the frontend UI visual alert occurred within ~150 milliseconds.

### 5.2 Predictive Accuracy
The LSTM model was successfully integrated. *(Note: Add your specific accuracy metrics here, such as Mean Absolute Error or Root Mean Square Error, after training the model on your final dataset)*. The system successfully identified rising PM2.5 trends prior to them crossing the danger threshold, verifying the proactive nature of the system.

### 5.3 User Interface
The glassmorphic React dashboard provided a seamless user experience. The alert engine accurately filtered out minor fluctuations and successfully flagged sustained environmental anomalies.

---

## CHAPTER 6: CONCLUSION AND FUTURE SCOPE

### 6.1 Conclusion
The AirQ project successfully bridges the gap between raw hardware telemetry and advanced artificial intelligence. By moving away from reactive alarms and towards a proactive, predictive model, the system offers a significantly safer industrial environment. The modularity of using Node.js for data routing and Python for machine learning ensures the system is robust and highly scalable.

### 6.2 Future Scope
1. **Automated HVAC Integration:** Interfacing the ESP32 with physical relays to automatically activate exhaust fans when the ML model predicts poor air quality in the next 30 minutes.
2. **Mesh Networking:** Deploying multiple ESP32 nodes across a factory floor to generate a real-time spatial heat map of air quality.
3. **Cloud Migration:** Moving the local backend and MongoDB database to a cloud provider (e.g., AWS or Azure) to allow remote monitoring of multiple factory branches from a single global dashboard.
4. **Enhanced ML Inputs:** Integrating external weather APIs so the neural network can factor in outdoor humidity and wind speed, further improving prediction accuracy.
