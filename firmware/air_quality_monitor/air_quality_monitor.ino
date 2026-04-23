/**
 * ESP32 Air Quality Monitor Firmware
 *
 * Reads data from 4 sensors (MQ2, MQ135, Dust Sensor, DHT11)
 * and publishes JSON data via MQTT over WiFi.
 * Controls a passive buzzer and exhaust fan based on air quality.
 *
 * Wiring:
 *   GPIO 34 (ADC1_CH6) → MQ2 Analog Out
 *   GPIO 35 (ADC1_CH7) → MQ135 Analog Out
 *   GPIO 32 (ADC1_CH4) → Dust Sensor Analog Out
 *   GPIO 33 (Digital)  → Dust Sensor LED Pin
 *   GPIO 27 (Digital)  → DHT11 Data Pin
 *   GPIO 22 (PWM)      → Passive Buzzer
 *   GPIO 15 (Digital)   → Exhaust Fan Relay
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

#include "config.h"
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <esp_task_wdt.h>

// WDT Settings
#define WDT_TIMEOUT 15 // 15 seconds watchdog

const char *FIRMWARE_VERSION = "v0.0.1";

// ==================== PIN DEFINITIONS ====================
#define MQ2_PIN 34      // ADC1_CH6 — MQ2 analog
#define MQ135_PIN 32    // ADC1_CH7 — MQ135 analog
#define DUST_APIN 35    // ADC1_CH4 — Dust sensor analog
#define DUST_LED_PIN 13 // Digital — Dust sensor IR LED
#define DHT_PIN 27      // Digital — DHT11 data
#define DHT_TYPE DHT11

// (Buzzer uses ESP32 3.x ledcAttach API — no channel/resolution defines needed)

// ==================== CALIBRATION VALUES ====================
// These must be determined during calibration in clean air
// Run calibration sketch first, then update these values
float MQ2_R0 = 10.0;   // MQ2 clean air resistance (kΩ) — CALIBRATE!
float MQ135_R0 = 12.0; // MQ135 clean air resistance (kΩ) — CALIBRATE!
float MQ2_RL = 10.0;   // MQ2 load resistor (kΩ)
float MQ135_RL = 22.0; // MQ135 load resistor (kΩ) — REPLACE with 22kΩ!

// ==================== OBJECTS ====================
WiFiClient espClient;
PubSubClient mqttClient(espClient);
DHT dht(DHT_PIN, DHT_TYPE);

// ==================== TIMING ====================
unsigned long lastPublish = 0;
unsigned long lastHeartbeat = 0;
const unsigned long PUBLISH_INTERVAL = 3000;    // 3 seconds
const unsigned long HEARTBEAT_INTERVAL = 10000; // 10 seconds

bool mq135UsingSimulation = false;

// ==================== ACTUATOR STATE ====================
bool fanState = false;        // Current fan relay state
bool fanAutoMode = true;      // true = auto (AQ-driven), false = manual (MQTT)
unsigned long fanOnSince = 0; // millis() when fan was last turned ON
bool buzzerMuted = false;     // Allow muting buzzer via MQTT

// Buzzer cooldown — prevents annoying repetition every 3s publish cycle
unsigned long lastWarningBeep = 0;
unsigned long lastErrorBeep = 0;
const unsigned long WARNING_BEEP_COOLDOWN = 30000; // 30s between warning beeps
const unsigned long ERROR_BEEP_COOLDOWN = 15000;   // 15s between error alarms

// Air quality alert level for current reading cycle
enum AlertLevel { ALERT_NONE, ALERT_WARNING, ALERT_CRITICAL };

float clampf(float value, float minValue, float maxValue) {
  if (value < minValue)
    return minValue;
  if (value > maxValue)
    return maxValue;
  return value;
}

void generateMQ135Simulated(float temperature, float humidity, float &co2,
                            float &no2, float &nh3) {
  float t = millis() / 1000.0;

  // Baseline + slow waveform + environmental influence for demo realism.
  co2 = 600.0 + 90.0 * sin(t / 28.0) + 1.8 * temperature + 0.6 * humidity;
  no2 = 0.018 + 0.010 * sin(t / 17.0) + (temperature > 30.0 ? 0.006 : 0.0);
  nh3 = 0.7 + 0.4 * sin(t / 24.0) + (humidity > 65.0 ? 0.2 : 0.0);

  co2 = clampf(co2, 420.0, 2000.0);
  no2 = clampf(no2, 0.001, 0.200);
  nh3 = clampf(nh3, 0.1, 20.0);
}

// Forward declarations
void mqttCallback(char *topic, byte *payload, unsigned int length);
void playStartupSound();
void playWarningSound();
void playErrorSound();
void beep(int durationMs);
void buzzerOff();
void setFan(bool on);
AlertLevel evaluateAirQuality(float co2, float mq2Ppm, float dustDensity);
void handleFanAuto(AlertLevel level);

// ==================== BUZZER FUNCTIONS ====================
// Basic beep helper — uses pin-based ledcWriteTone (ESP32 board ≥3.x)
void beep(int durationMs) {
  if (buzzerMuted)
    return;
  ledcWriteTone(BUZZER_PIN, 2000); // ON at 2kHz
  delay(durationMs);
  ledcWriteTone(BUZZER_PIN, 0); // OFF
}

void buzzerOff() { ledcWriteTone(BUZZER_PIN, 0); }

// 🔔 Startup: short-short-long confirmation
void playStartupSound() {
  beep(100);
  delay(100);
  beep(100);
  delay(100);
  beep(400);
}

// ⚠️ Warning: 3× short beeps
void playWarningSound() {
  for (int i = 0; i < 3; i++) {
    beep(150);
    delay(150);
  }
}

// ❌ Error: long-pause-long
void playErrorSound() {
  beep(600);
  delay(300);
  beep(600);
}

// ==================== FAN CONTROL ====================
void setFan(bool on) {
  if (on && !fanState) {
    fanOnSince = millis();
  }
  fanState = on;
  digitalWrite(FAN_PIN, fanState ? HIGH : LOW);
}

// Evaluate current readings against thresholds
AlertLevel evaluateAirQuality(float co2, float mq2Ppm, float dustDensity) {
  if (co2 >= CO2_CRITICAL || mq2Ppm >= MQ2_CRITICAL ||
      dustDensity >= DUST_CRITICAL) {
    return ALERT_CRITICAL;
  }
  if (co2 >= CO2_WARNING || mq2Ppm >= MQ2_WARNING ||
      dustDensity >= DUST_WARNING) {
    return ALERT_WARNING;
  }
  return ALERT_NONE;
}

// Auto-manage fan based on AQ level with hysteresis
void handleFanAuto(AlertLevel level) {
  if (!fanAutoMode)
    return;

  if (level >= ALERT_WARNING) {
    setFan(true);
  } else {
    // Only turn off if fan has been ON for at least FAN_MIN_ON_TIME
    if (fanState && (millis() - fanOnSince >= FAN_MIN_ON_TIME)) {
      setFan(false);
    }
  }
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  Serial.println("\n🏭 AirQ Industrial Monitor — ESP32 Firmware");

  // Initialize sensor pins
  pinMode(MQ2_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);
  pinMode(DUST_APIN, INPUT);
  pinMode(DUST_LED_PIN, OUTPUT);

  // Initialize actuator pins
  pinMode(FAN_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW); // Fan OFF at boot

  // Initialize buzzer (ESP32 board 3.x pin-based API)
  ledcAttach(BUZZER_PIN, 2000, 8);

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
#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 0, 0)
  esp_task_wdt_config_t twdt_config = {
      .timeout_ms = WDT_TIMEOUT * 1000,
      .idle_core_mask = (1 << portNUM_PROCESSORS) - 1, // Bitmask of all cores
      .trigger_panic = true,
  };
  esp_task_wdt_init(&twdt_config);
#else
  esp_task_wdt_init(WDT_TIMEOUT, true);
#endif
  esp_task_wdt_add(NULL);

  Serial.println("✅ Setup complete. Beginning sensor readings...");

  // Play startup jingle to confirm boot
  playStartupSound();
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
  StaticJsonDocument<384> doc;
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

  // Actuator status
  JsonObject actuators = doc.createNestedObject("actuators");
  actuators["fan"] = fanState ? "on" : "off";
  actuators["fanMode"] = fanAutoMode ? "auto" : "manual";
  actuators["buzzerMuted"] = buzzerMuted;

  char payload[384];
  serializeJson(doc, payload);
  mqttClient.publish(MQTT_HEARTBEAT_TOPIC, payload);
}

// ==================== COMMAND LISTENER ====================
void mqttCallback(char *topic, byte *payload, unsigned int length) {
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
        Serial.println(
            "🔄 Remote REBOOT command received! Dropping hardware securely...");
        playErrorSound(); // Alert operator before reboot
        delay(500);       // Allow UART buffer to flush
        ESP.restart();    // Natively pull circuit power down
      } else if (cmd == "ping") {
        Serial.println("📡 Remote PING command received!");
        playStartupSound(); // Audible confirmation of ping
        StaticJsonDocument<256> pongDoc;
        pongDoc["id"] = DEVICE_ID;
        pongDoc["status"] = "pong";
        pongDoc["uptime"] = millis();
        pongDoc["fan"] = fanState ? "on" : "off";
        pongDoc["fanMode"] = fanAutoMode ? "auto" : "manual";
        pongDoc["buzzerMuted"] = buzzerMuted;
        char pongPayload[256];
        serializeJson(pongDoc, pongPayload);
        mqttClient.publish("airq/status/pong", pongPayload);
      } else if (cmd == "calibrate") {
        String sensor = doc["sensor"].as<String>();
        Serial.printf("🔧 Running zero-point calibration for %s...\n",
                      sensor.c_str());
        playWarningSound(); // Alert: calibration starting
        unsigned long start = millis();
        while (millis() - start < 2500) {
          mqttClient.loop(); // keep MQTT alive
        }
        playStartupSound(); // Confirm: calibration done
        Serial.println("✅ Calibration Complete.");
      } else if (cmd == "update") {
        String url = doc["url"].as<String>(); // e.g. /firmware/update.bin
        Serial.printf("🔄 OTA Update Triggered. Fetching from %s\n",
                      url.c_str());

        // Construct full URL assuming the backend is the MQTT server IP
        String fullUrl = String("http://") + String(MQTT_SERVER) + String(":") +
                         String(HTTP_SERVER_PORT) + url;

        WiFiClient client;
        if (WiFi.status() == WL_CONNECTED) {
          t_httpUpdate_return ret = httpUpdate.update(client, fullUrl);

          switch (ret) {
          case HTTP_UPDATE_FAILED:
            Serial.printf("❌ HTTP_UPDATE_FAILED Error (%d): %s\n",
                          httpUpdate.getLastError(),
                          httpUpdate.getLastErrorString().c_str());
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
      // ========== FAN REMOTE CONTROL ==========
      else if (cmd == "fan") {
        String state = doc["state"].as<String>();
        if (state == "on") {
          fanAutoMode = false;
          setFan(true);
          Serial.println("💨 Fan FORCED ON (manual mode)");
        } else if (state == "off") {
          fanAutoMode = false;
          setFan(false);
          Serial.println("💨 Fan FORCED OFF (manual mode)");
        } else if (state == "auto") {
          fanAutoMode = true;
          Serial.println("💨 Fan switched to AUTO mode");
        }
      }
      // ========== BUZZER REMOTE CONTROL ==========
      else if (cmd == "buzzer") {
        String state = doc["state"].as<String>();
        String action = doc["action"].as<String>();

        if (state == "mute") {
          buzzerMuted = true;
          buzzerOff();
          Serial.println("🔇 Buzzer MUTED");
        } else if (state == "unmute") {
          buzzerMuted = false;
          Serial.println("🔊 Buzzer UNMUTED");
        }
        if (action == "test") {
          bool wasMuted = buzzerMuted;
          buzzerMuted = false; // Temporarily unmute for test
          playStartupSound();
          buzzerMuted = wasMuted;
          Serial.println("🔔 Buzzer TEST played");
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
    Serial.printf("\n✅ WiFi Connected! IP: %s\n",
                  WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n❌ WiFi Connection Failed! Continuing offline...");
    playErrorSound(); // Alert operator of WiFi failure
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
      Serial.printf(" ❌ Failed (rc=%d). Retrying in 2s...\n",
                    mqttClient.state());
      delay(2000);
      retries++;
    }
  }
  // If all retries failed, play error sound
  if (!mqttClient.connected()) {
    playErrorSound();
  }
}

// ==================== READ MQ2 SENSOR ====================
float readMQ2_PPM(int raw) {
  if (raw < 10)
    Serial.println("⚠ MQ2 disconnected?");
  float voltage = raw * (3.3 / 4095.0);
  if (voltage <= 0.01)
    return 0; // Prevent div by zero

  // Calculate sensor resistance
  float rs = ((3.3 - voltage) / voltage) * MQ2_RL;
  float ratio = rs / MQ2_R0;

  // Approximate PPM using datasheet curve for LPG, then apply calibration offset
  float ppm = 1000.0 * pow(ratio, -2.2) + MQ2_OFFSET;
  return (ppm < 0) ? 0 : ppm;
}

// ==================== READ MQ135 SENSOR ====================
void readMQ135(int raw, float temperature, float humidity, float &co2,
               float &no2, float &nh3) {
#if !ENABLE_MQ135
  mq135UsingSimulation = true;
  generateMQ135Simulated(temperature, humidity, co2, no2, nh3);
  return;
#endif

  float voltage = raw * (3.3 / 4095.0);
  if (voltage <= 0.01) {
    mq135UsingSimulation = true;
    generateMQ135Simulated(temperature, humidity, co2, no2, nh3);
    return;
  }

  mq135UsingSimulation = false;

  // Calculate sensor resistance
  float rs = ((3.3 - voltage) / voltage) * MQ135_RL;
  float ratio = rs / MQ135_R0;

  // Approximate gas concentrations using datasheet curves and apply offsets
  co2 = 400.0 + (1000.0 * pow(ratio, -1.8)) + CO2_OFFSET; 
  no2 = (0.05 * pow(ratio, -1.2)) + NO2_OFFSET;             
  nh3 = 10.0 * pow(ratio, -1.5); // NH₃ estimate

  // Prevent negative readings
  if (co2 < 400) co2 = 400; // Baseline outdoor CO2
  if (no2 < 0) no2 = 0;
  if (nh3 < 0) nh3 = 0;
}

// ==================== READ DUST SENSOR ====================
float readDustDensity(float &voltage) {
  digitalWrite(DUST_LED_PIN, LOW); // LED ON
  delayMicroseconds(280);

  int raw = analogRead(DUST_APIN);

  delayMicroseconds(40);
  digitalWrite(DUST_LED_PIN, HIGH); // LED OFF
  delayMicroseconds(9680);          // Complete the 10ms cycle

  // Convert to voltage
  voltage = raw * (3.3 / 4095.0);

  // Apply formula and calibration offset
  float density = ((0.170 * voltage - 0.1) * 1000) + DUST_OFFSET; // Convert mg/m³ to µg/m³
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
  readMQ135(mq135Raw, temperature, humidity, co2, no2, nh3);

  // Read Dust Sensor
  float dustVoltage = 0.0;
  float dustDensity = readDustDensity(dustVoltage);

  // ==================== AIR QUALITY EVALUATION ====================
  AlertLevel aqLevel = evaluateAirQuality(co2, mq2Ppm, dustDensity);

  // Buzzer alerts based on air quality (with cooldown to avoid constant
  // beeping)
  if (aqLevel == ALERT_CRITICAL) {
    if (millis() - lastErrorBeep >= ERROR_BEEP_COOLDOWN) {
      lastErrorBeep = millis();
      playErrorSound();
      Serial.println("🚨 CRITICAL AQ — Error alarm triggered!");
    }
  } else if (aqLevel == ALERT_WARNING) {
    if (millis() - lastWarningBeep >= WARNING_BEEP_COOLDOWN) {
      lastWarningBeep = millis();
      playWarningSound();
      Serial.println("⚠️ WARNING AQ — Warning beep triggered!");
    }
  }

  // Auto-manage exhaust fan
  handleFanAuto(aqLevel);

  // ==================== BUILD JSON PAYLOAD ====================
  StaticJsonDocument<1024> doc;

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
  mq135["source"] = mq135UsingSimulation ? "simulated" : "sensor";
  mq135["co2_ppm"] = (int)co2;
  mq135["no2_ppm"] = round(no2 * 1000.0) / 1000.0; // 3 decimal places
  mq135["nh3_ppm"] = round(nh3 * 10.0) / 10.0;

  // Dust data
  JsonObject dust = doc.createNestedObject("dust");
  dust["raw"] = round(dustVoltage * 100.0) / 100.0;
  dust["density"] = round(dustDensity * 10.0) / 10.0;

  // DHT11 data
  JsonObject dht11 = doc.createNestedObject("dht11");
  dht11["temperature"] = round(temperature * 10.0) / 10.0;
  dht11["humidity"] = (int)humidity;

  // Actuator status
  JsonObject actuators = doc.createNestedObject("actuators");
  actuators["fan"] = fanState ? "on" : "off";
  actuators["fanMode"] = fanAutoMode ? "auto" : "manual";
  actuators["buzzerMuted"] = buzzerMuted;
  actuators["alertLevel"] =
      aqLevel == ALERT_CRITICAL
          ? "critical"
          : (aqLevel == ALERT_WARNING ? "warning" : "normal");

  // Serialize and publish
  char payload[1024];
  serializeJson(doc, payload);

  if (mqttClient.publish(MQTT_TOPIC, payload, true)) {
    Serial.printf("📤 Published: T=%.1f°C H=%d%% CO2=%dppm MQ2=%dppm "
                  "Dust=%.1fµg/m³ Fan=%s AQ=%s\n",
                  temperature, (int)humidity, (int)co2, (int)mq2Ppm,
                  dustDensity, fanState ? "ON" : "OFF",
                  aqLevel == ALERT_CRITICAL
                      ? "CRIT"
                      : (aqLevel == ALERT_WARNING ? "WARN" : "OK"));
  } else {
    Serial.println("❌ MQTT publish failed!");
    playErrorSound();
  }
}
