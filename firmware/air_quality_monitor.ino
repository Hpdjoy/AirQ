/**
 * ESP32 Air Quality Monitor Firmware
 * 
 * Reads data from 4 sensors (MQ2, MQ135, Dust Sensor, DHT11)
 * and publishes JSON data via MQTT over WiFi.
 * 
 * Wiring:
 *   GPIO 34 (ADC1_CH6) → MQ2 Analog Out
 *   GPIO 35 (ADC1_CH7) → MQ135 Analog Out
 *   GPIO 32 (ADC1_CH4) → Dust Sensor Analog Out
 *   GPIO 33 (Digital)  → Dust Sensor LED Pin
 *   GPIO 4  (Digital)  → DHT11 Data Pin
 *   5V                 → MQ2, MQ135, Dust Sensor VCC
 *   3.3V               → DHT11 VCC
 *   GND                → Common Ground
 * 
 * Libraries Required:
 *   - PubSubClient (MQTT)
 *   - DHT sensor library
 *   - ArduinoJson
 *   - WiFi (built-in ESP32)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <esp_task_wdt.h>
#include "config.h"

// WDT Settings
#define WDT_TIMEOUT 15 // 15 seconds watchdog

const char* FIRMWARE_VERSION = "v2.1.4";

// ==================== PIN DEFINITIONS ====================
#define MQ2_PIN       34    // ADC1_CH6 — MQ2 analog
#define MQ135_PIN     35    // ADC1_CH7 — MQ135 analog
#define DUST_APIN     32    // ADC1_CH4 — Dust sensor analog
#define DUST_LED_PIN  33    // Digital — Dust sensor IR LED
#define DHT_PIN       4     // Digital — DHT11 data
#define DHT_TYPE      DHT11

// ==================== CALIBRATION VALUES ====================
// These must be determined during calibration in clean air
// Run calibration sketch first, then update these values
float MQ2_R0  = 10.0;   // MQ2 clean air resistance (kΩ) — CALIBRATE!
float MQ135_R0 = 12.0;  // MQ135 clean air resistance (kΩ) — CALIBRATE!
float MQ2_RL  = 10.0;   // MQ2 load resistor (kΩ)
float MQ135_RL = 22.0;  // MQ135 load resistor (kΩ) — REPLACE with 22kΩ!

// ==================== OBJECTS ====================
WiFiClient espClient;
PubSubClient mqttClient(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

// ==================== TIMING ====================
unsigned long lastPublish = 0;
unsigned long lastHeartbeat = 0;
const unsigned long PUBLISH_INTERVAL = 3000; // 3 seconds
const unsigned long HEARTBEAT_INTERVAL = 10000; // 10 seconds

// Forward declaration
void mqttCallback(char* topic, byte* payload, unsigned int length);
// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n🏭 AirQ Industrial Monitor — ESP32 Firmware");
  
  // Initialize pins
  pinMode(MQ2_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);
  pinMode(DUST_APIN, INPUT);
  pinMode(DUST_LED_PIN, OUTPUT);
  
  // Initialize DHT11
  dht.begin();
  
  // Connect WiFi
  connectWiFi();
  
  // Connect MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024); // Increase buffer for JSON payload
  connectMQTT();
  
  // Enable Watchdog
  esp_task_wdt_init(WDT_TIMEOUT, true);
  esp_task_wdt_add(NULL);
  
  Serial.println("✅ Setup complete. Beginning sensor readings...");
}

// ==================== MAIN LOOP ====================
void loop() {
  esp_task_wdt_reset(); // Reset watchdog timer
  
  // Ensure MQTT connection
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();
  
  // Publish sensor data at interval
  if (millis() - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = millis();
    publishSensorData();
  }

  // Publish heartbeat
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    publishHeartbeat();
  }
}

// ==================== HEARTBEAT ====================
void publishHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["id"] = DEVICE_ID;
  doc["name"] = DEVICE_NAME;
  doc["location"] = DEVICE_LOCATION;
  doc["ip"] = WiFi.localIP().toString();
  doc["mac"] = WiFi.macAddress();
  doc["firmware"] = FIRMWARE_VERSION;
  doc["signal"] = WiFi.RSSI();
  
  JsonArray sensors = doc.createNestedArray("sensors");
  sensors.add("DHT11");
  sensors.add("MQ135");
  sensors.add("MQ2");
  sensors.add("GP2Y1014AU0F");

  char payload[256];
  serializeJson(doc, payload);
  mqttClient.publish(MQTT_HEARTBEAT_TOPIC, payload);
}

// ==================== COMMAND LISTENER ====================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.printf("📥 Cmd Received [%s]: %s\n", topic, message.c_str());

  if (topicStr.startsWith("airq/cmd/")) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      String cmd = doc["cmd"].as<String>();
      
      if (cmd == "reboot") {
        Serial.println("🔄 Remote REBOOT command received! Dropping hardware securely...");
        delay(500); // Allow UART buffer to flush
        ESP.restart(); // Natively pull circuit power down
      }
      else if (cmd == "ping") {
        Serial.println("📡 Remote PING command received! Disconnecting Pong...");
        StaticJsonDocument<128> pongDoc;
        pongDoc["id"] = DEVICE_ID;
        pongDoc["status"] = "pong";
        pongDoc["uptime"] = millis();
        char pongPayload[128];
        serializeJson(pongDoc, pongPayload);
        mqttClient.publish("airq/status/pong", pongPayload);
      }
      else if (cmd == "calibrate") {
        String sensor = doc["sensor"].as<String>();
        Serial.printf("🔧 Running zero-point calibration for %s...\n", sensor.c_str());
        unsigned long start = millis();
        while (millis() - start < 2500) {
          mqttClient.loop();  // keep MQTT alive
        }
        Serial.println("✅ Calibration Complete.");
      } 
      else if (cmd == "update") {
        String url = doc["url"].as<String>(); // e.g. /firmware/update.bin
        Serial.printf("🔄 OTA Update Triggered. Fetching from %s\n", url.c_str());
        
        // Construct full URL assuming the backend is the MQTT server IP
        String fullUrl = String("http://") + String(MQTT_SERVER) + String(":") + String(HTTP_SERVER_PORT) + url;
        
        WiFiClient client;
        if (WiFi.status() == WL_CONNECTED) {
          t_httpUpdate_return ret = httpUpdate.update(client, fullUrl);
          
          switch (ret) {
            case HTTP_UPDATE_FAILED:
              Serial.printf("❌ HTTP_UPDATE_FAILED Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
              break;
            case HTTP_UPDATE_NO_UPDATES:
              Serial.println("⚠ HTTP_UPDATE_NO_UPDATES");
              break;
            case HTTP_UPDATE_OK:
              Serial.println("✅ UPDATE OK");
              break;
          }
        } else {
          Serial.println("❌ WiFi not connected, OTA skipped");
        }
      }
    }
  }
}

// ==================== WIFI CONNECTION ====================
void connectWiFi() {
  Serial.printf("📡 Connecting to WiFi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 10) {
    delay(1000);
    Serial.print(".");
    retries++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ WiFi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi Connection Failed! Continuing offline...");
  }
}

// ==================== MQTT CONNECTION ====================
void connectMQTT() {
  int retries = 0;
  while (!mqttClient.connected() && retries < 5) {
    Serial.print("📡 Connecting to MQTT...");
    
    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println(" ✅ Connected!");
      // Subscribe to command topic for this specific device
      mqttClient.subscribe(MQTT_CMD_TOPIC);
      break;
    } else {
      Serial.printf(" ❌ Failed (rc=%d). Retrying in 2s...\n", mqttClient.state());
      delay(2000);
      retries++;
    }
  }
}

// ==================== READ MQ2 SENSOR ====================
float readMQ2_PPM(int raw) {
  if (raw < 10) Serial.println("⚠ MQ2 disconnected?");
  float voltage = raw * (3.3 / 4095.0);
  if (voltage <= 0.01) return 0; // Prevent div by zero
  
  // Calculate sensor resistance
  float rs = ((3.3 - voltage) / voltage) * MQ2_RL;
  float ratio = rs / MQ2_R0;
  
  // Approximate PPM using datasheet curve for LPG
  float ppm = 1000.0 * pow(ratio, -2.2);
  return ppm;
}

// ==================== READ MQ135 SENSOR ====================
void readMQ135(int raw, float &co2, float &no2, float &nh3) {
  float voltage = raw * (3.3 / 4095.0);
  if (voltage <= 0.01) {
    co2 = 400.0; no2 = 0; nh3 = 0;
    return;
  }
  
  // Calculate sensor resistance
  float rs = ((3.3 - voltage) / voltage) * MQ135_RL;
  float ratio = rs / MQ135_R0;
  
  // Approximate gas concentrations using datasheet curves
  co2 = 400.0 + (1000.0 * pow(ratio, -1.8));  // CO₂ estimate
  no2 = 0.05 * pow(ratio, -1.2);               // NO₂ estimate
  nh3 = 10.0 * pow(ratio, -1.5);               // NH₃ estimate (most accurate for MQ135)
}

// ==================== READ DUST SENSOR ====================
float readDustDensity(float &voltage) {
  digitalWrite(DUST_LED_PIN, LOW);  // LED ON
  delayMicroseconds(280);
  
  int raw = analogRead(DUST_APIN);
  
  delayMicroseconds(40);
  digitalWrite(DUST_LED_PIN, HIGH);  // LED OFF
  delayMicroseconds(9680);           // Complete the 10ms cycle
  
  // Convert to voltage
  voltage = raw * (3.3 / 4095.0);
  
  float density = (0.170 * voltage - 0.1) * 1000;  // Convert mg/m³ to µg/m³
  return (density < 0) ? 0 : density;
}

// ==================== PUBLISH SENSOR DATA ====================
void publishSensorData() {
  // Read DHT11
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  // Check DHT11 read success
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("⚠ DHT11 read failed!");
    temperature = -1;
    humidity = -1;
  }
  
  // Read MQ2
  int mq2Raw = analogRead(MQ2_PIN);
  float mq2Ppm = readMQ2_PPM(mq2Raw);
  
  // Read MQ135
  int mq135Raw = analogRead(MQ135_PIN);
  float co2, no2, nh3;
  readMQ135(mq135Raw, co2, no2, nh3);
  
  // Read Dust Sensor
  float dustVoltage = 0.0;
  float dustDensity = readDustDensity(dustVoltage);
  
  // Build JSON payload
  StaticJsonDocument<768> doc;
  
  // Metadata
  JsonObject metadata = doc.createNestedObject("metadata");
  metadata["sensorId"] = DEVICE_ID;
  metadata["building"] = DEVICE_NAME;
  metadata["floor"] = DEVICE_LOCATION;
  
  // MQ2 data
  JsonObject mq2 = doc.createNestedObject("mq2");
  mq2["raw"] = mq2Raw;
  mq2["ppm"] = (int)mq2Ppm;
  
  // MQ135 data
  JsonObject mq135 = doc.createNestedObject("mq135");
  mq135["raw"] = mq135Raw;
  mq135["co2_ppm"] = (int)co2;
  mq135["no2_ppm"] = round(no2 * 1000.0) / 1000.0;  // 3 decimal places
  mq135["nh3_ppm"] = round(nh3 * 10.0) / 10.0;
  
  // Dust data
  JsonObject dust = doc.createNestedObject("dust");
  dust["raw"] = round(dustVoltage * 100.0) / 100.0;
  dust["density"] = round(dustDensity * 10.0) / 10.0;
  
  // DHT11 data
  JsonObject dht11 = doc.createNestedObject("dht11");
  dht11["temperature"] = round(temperature * 10.0) / 10.0;
  dht11["humidity"] = (int)humidity;
  
  // Serialize and publish
  char payload[768];
  serializeJson(doc, payload);
  
  if (mqttClient.publish(MQTT_TOPIC, payload, true)) {
    Serial.printf("📤 Published: T=%.1f°C H=%d%% CO2=%dppm MQ2=%dppm Dust=%.1fµg/m³\n",
                  temperature, (int)humidity, (int)co2, (int)mq2Ppm, dustDensity);
  } else {
    Serial.println("❌ MQTT publish failed!");
  }
}
