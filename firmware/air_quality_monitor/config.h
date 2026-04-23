/**
 * ESP32 Configuration
 * 
 * Update these values for your setup before flashing!
 */

#ifndef CONFIG_H
#define CONFIG_H

// ==================== WiFi Configuration ====================
#define WIFI_SSID       "Mamuni"   // <-- Replace
#define WIFI_PASSWORD   "mamuni2005"  // <-- Replace

// ==================== MQTT & Server Configuration ====================
// IP Address of the computer running your Node.js backend
#define MQTT_SERVER     "10.222.193.135"       // <-- Replace with your PC's IP address
#define MQTT_PORT       1883
#define HTTP_SERVER_PORT 5000

// ==================== Device Identity ====================
// These are used by the React Dashboard to identify and display the node
#define DEVICE_ID       "NODE-ESP32-1"
#define DEVICE_NAME     "Main Lab Sensor Array"
#define DEVICE_LOCATION "Zone A - Test Floor"

// ==================== Sensor Metadata ====================
#define MQTT_TOPIC      "airq/sensors/zone-a"
#define MQTT_HEARTBEAT_TOPIC "airq/status/heartbeat"
#define MQTT_CMD_TOPIC  "airq/cmd/NODE-ESP32-1" // Make sure this matches DEVICE_ID!

// ==================== Sensor Toggle (Demo Support) ====================
// Set to 0 when MQ135 hardware is unavailable (uses simulated values).
// Set back to 1 when MQ135 is connected again.
#define ENABLE_MQ135    0

#endif

