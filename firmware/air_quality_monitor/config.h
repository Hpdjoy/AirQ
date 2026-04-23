/**
 * ESP32 Configuration
 *
 * Update these values for your setup before flashing!
 */

#ifndef CONFIG_H
#define CONFIG_H

// ==================== WiFi Configuration ====================
#define WIFI_SSID "Airtel_Chota Lund"  //"Mamuni"   // <-- Replace
#define WIFI_PASSWORD "Dhurandhar@771" //"mamuni2005"  // <-- Replace

// ==================== MQTT & Server Configuration ====================
// IP Address of the computer running your Node.js backend
#define MQTT_SERVER                                                            \
  "192.168.1.3" //"10.222.193.135"       // <-- Replace with your PC's IP
                //address
#define MQTT_PORT 1883
#define HTTP_SERVER_PORT 5000

// ==================== Device Identity ====================
// These are used by the React Dashboard to identify and display the node
#define DEVICE_ID "NODE-ESP32-1"
#define DEVICE_NAME "Main Lab Sensor Array"
#define DEVICE_LOCATION "Zone A - Test Floor"

// ==================== Sensor Metadata ====================
#define MQTT_TOPIC "airq/sensors/zone-a"
#define MQTT_HEARTBEAT_TOPIC "airq/status/heartbeat"
#define MQTT_CMD_TOPIC                                                         \
  "airq/cmd/NODE-ESP32-1" // Make sure this matches DEVICE_ID!

// ==================== Sensor Toggle (Demo Support) ====================
// Set to 0 when MQ135 hardware is unavailable (uses simulated values).
// Set back to 1 when MQ135 is connected again.
#define ENABLE_MQ135 1

// ==================== Actuator Pins ====================
#define BUZZER_PIN 22 // Passive buzzer (PWM tone output)
#define FAN_PIN 15    // Exhaust fan relay (digital HIGH = ON)

// ==================== Air Quality Thresholds ====================
// WARNING thresholds — trigger buzzer warning beep
#define CO2_WARNING 1000   // ppm
#define MQ2_WARNING 500    // ppm
#define DUST_WARNING 150.0 // µg/m³

// ==================== Calibration Offsets ====================
// Adjust these values (positive or negative) to match your reference monitor
#define DUST_OFFSET 0.0 // e.g., if reading 25 but reference is 16, set to -9.0
#define CO2_OFFSET                                                             \
  0.0 // e.g., if reading 450 but reference is 400, set to -50.0
#define NO2_OFFSET 0.0 // e.g., NO2 offset in ppm (7 ppb = 0.007)
#define MQ2_OFFSET 0.0 // Combustible Gas offset

// CRITICAL thresholds — trigger buzzer error alarm + force fan ON
#define CO2_CRITICAL 2000   // ppm
#define MQ2_CRITICAL 1000   // ppm
#define DUST_CRITICAL 300.0 // µg/m³

// Fan hysteresis — minimum ON time to prevent rapid toggling (ms)
#define FAN_MIN_ON_TIME 30000 // 30 seconds

#endif
