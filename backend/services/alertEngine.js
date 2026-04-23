/**
 * Alert Engine — Threshold-based alert generation
 * 
 * Checks sensor readings against WHO, ASHRAE, OSHA, and EPA thresholds
 * and generates alerts with severity levels.
 */

const Alert = require('../models/Alert');

const Settings = require('../models/Settings');

// Fallback Alert thresholds per international standards
const DEFAULT_THRESHOLDS = {
  // MQ2 — Combustible Gas
  mq2: { warning: 500, critical: 2000 },
  // MQ135 — CO₂ (ASHRAE 62.1)
  co2: { warning: 800, critical: 1200 },
  // MQ135 — NO₂ (WHO Guidelines)
  no2: { warning: 0.1, critical: 0.2 },
  // MQ135 — NH₃ (OSHA PEL)
  nh3: { warning: 25, critical: 50 },
  // Dust Sensor (EPA PM2.5)
  dust: { warning: 35, critical: 75 },
  // DHT11 — Temperature
  temperature: { warningHigh: 32, criticalHigh: 38, warningLow: 16, criticalLow: 10 },
  // DHT11 — Humidity
  humidity: { warningHigh: 70, criticalHigh: 85, warningLow: 25, criticalLow: 15 },
  // Derived — Fire Risk
  fireRisk: { warning: 0.4, critical: 0.7 },
  // Derived — Health Risk
  healthRisk: { warning: 0.4, critical: 0.7 }
};

let cachedSettings = { ...DEFAULT_THRESHOLDS };
let lastSettingsFetch = 0;

async function getThresholds() {
  const now = Date.now();
  // Refresh cache every 60 seconds
  if (now - lastSettingsFetch > 60000) {
    try {
      const dbSettings = await Settings.findOne();
      if (dbSettings) {
        cachedSettings.temperature.warningHigh = dbSettings.tempWarning;
        cachedSettings.temperature.criticalHigh = dbSettings.tempCritical;
        cachedSettings.co2.warning = dbSettings.co2Warning;
        cachedSettings.co2.critical = dbSettings.co2Critical;
        cachedSettings.mq2.warning = dbSettings.gasWarning;
        cachedSettings.mq2.critical = dbSettings.gasCritical;
        // Map AQI limits to Health Risk for simplicity
        cachedSettings.healthRisk.warning = dbSettings.aqiWarning / 300;
        cachedSettings.healthRisk.critical = dbSettings.aqiCritical / 300;
        lastSettingsFetch = now;
      }
    } catch (e) {
      console.error("Failed to fetch dynamic settings", e);
    }
  }
  return cachedSettings;
}

// Track recent alerts to prevent spam (cooldown in ms)
const ALERT_COOLDOWN = 60000; // 1 minute between same type alerts
const recentAlerts = new Map();

/**
 * Check if we should send this alert (cooldown check)
 */
function shouldAlert(type, sensorId) {
  const key = `${type}:${sensorId}`;
  const lastTime = recentAlerts.get(key);
  if (lastTime && (Date.now() - lastTime) < ALERT_COOLDOWN) {
    return false;
  }
  recentAlerts.set(key, Date.now());
  return true;
}

/**
 * Check all sensor readings against thresholds and generate alerts
 * @param {Object} reading - Processed sensor reading
 * @param {Function} emitAlert - Callback to emit alert via WebSocket
 * @returns {Array} Array of triggered alerts
 */
async function checkThresholds(reading, emitAlert = null) {
  const alerts = [];
  const sensorId = reading.metadata?.sensorId || 'zone-a';
  const THRESHOLDS = await getThresholds();

  // ---- MQ2: Combustible Gas ----
  if (reading.mq2.ppm >= THRESHOLDS.mq2.critical) {
    alerts.push(createAlert('gas_leak', 'critical', `CRITICAL: Combustible gas at ${reading.mq2.ppm} ppm!`, 'mq2', sensorId, reading.mq2.ppm, THRESHOLDS.mq2.critical));
  } else if (reading.mq2.ppm >= THRESHOLDS.mq2.warning) {
    alerts.push(createAlert('gas_leak', 'warning', `Combustible gas elevated: ${reading.mq2.ppm} ppm`, 'mq2', sensorId, reading.mq2.ppm, THRESHOLDS.mq2.warning));
  }

  // ---- MQ135: CO₂ ----
  if (reading.mq135.co2_ppm >= THRESHOLDS.co2.critical) {
    alerts.push(createAlert('high_co2', 'critical', `CO₂ level critical: ${reading.mq135.co2_ppm} ppm — open windows immediately!`, 'mq135', sensorId, reading.mq135.co2_ppm, THRESHOLDS.co2.critical));
  } else if (reading.mq135.co2_ppm >= THRESHOLDS.co2.warning) {
    alerts.push(createAlert('high_co2', 'warning', `CO₂ level elevated: ${reading.mq135.co2_ppm} ppm — ventilation recommended`, 'mq135', sensorId, reading.mq135.co2_ppm, THRESHOLDS.co2.warning));
  }

  // ---- MQ135: NO₂ ----
  if (reading.mq135.no2_ppm >= THRESHOLDS.no2.critical) {
    alerts.push(createAlert('toxic_gas', 'critical', `NO₂ level dangerous: ${reading.mq135.no2_ppm} ppm — evacuate area!`, 'mq135', sensorId, reading.mq135.no2_ppm, THRESHOLDS.no2.critical));
  } else if (reading.mq135.no2_ppm >= THRESHOLDS.no2.warning) {
    alerts.push(createAlert('toxic_gas', 'warning', `NO₂ level elevated: ${reading.mq135.no2_ppm} ppm`, 'mq135', sensorId, reading.mq135.no2_ppm, THRESHOLDS.no2.warning));
  }

  // ---- MQ135: NH₃ ----
  if (reading.mq135.nh3_ppm >= THRESHOLDS.nh3.critical) {
    alerts.push(createAlert('toxic_gas', 'critical', `NH₃ level exceeds OSHA limit: ${reading.mq135.nh3_ppm} ppm!`, 'mq135', sensorId, reading.mq135.nh3_ppm, THRESHOLDS.nh3.critical));
  } else if (reading.mq135.nh3_ppm >= THRESHOLDS.nh3.warning) {
    alerts.push(createAlert('toxic_gas', 'warning', `NH₃ level elevated: ${reading.mq135.nh3_ppm} ppm`, 'mq135', sensorId, reading.mq135.nh3_ppm, THRESHOLDS.nh3.warning));
  }

  // ---- Dust ----
  if (reading.dust.density >= THRESHOLDS.dust.critical) {
    alerts.push(createAlert('high_dust', 'critical', `Particulate level critical: ${reading.dust.density} µg/m³`, 'dust', sensorId, reading.dust.density, THRESHOLDS.dust.critical));
  } else if (reading.dust.density >= THRESHOLDS.dust.warning) {
    alerts.push(createAlert('high_dust', 'warning', `Dust level elevated: ${reading.dust.density} µg/m³`, 'dust', sensorId, reading.dust.density, THRESHOLDS.dust.warning));
  }

  // ---- Temperature ----
  if (reading.dht11.temperature >= THRESHOLDS.temperature.criticalHigh) {
    alerts.push(createAlert('comfort_warning', 'critical', `Temperature dangerously high: ${reading.dht11.temperature}°C`, 'dht11', sensorId, reading.dht11.temperature, THRESHOLDS.temperature.criticalHigh));
  } else if (reading.dht11.temperature >= THRESHOLDS.temperature.warningHigh) {
    alerts.push(createAlert('comfort_warning', 'warning', `Temperature high: ${reading.dht11.temperature}°C`, 'dht11', sensorId, reading.dht11.temperature, THRESHOLDS.temperature.warningHigh));
  } else if (reading.dht11.temperature <= THRESHOLDS.temperature.criticalLow) {
    alerts.push(createAlert('comfort_warning', 'critical', `Temperature dangerously low: ${reading.dht11.temperature}°C`, 'dht11', sensorId, reading.dht11.temperature, THRESHOLDS.temperature.criticalLow));
  }

  // ---- Humidity ----
  if (reading.dht11.humidity >= THRESHOLDS.humidity.criticalHigh) {
    alerts.push(createAlert('comfort_warning', 'critical', `Humidity dangerously high: ${reading.dht11.humidity}%`, 'dht11', sensorId, reading.dht11.humidity, THRESHOLDS.humidity.criticalHigh));
  } else if (reading.dht11.humidity >= THRESHOLDS.humidity.warningHigh) {
    alerts.push(createAlert('comfort_warning', 'warning', `Humidity elevated: ${reading.dht11.humidity}%`, 'dht11', sensorId, reading.dht11.humidity, THRESHOLDS.humidity.warningHigh));
  }

  // ---- Fire Risk (Combined) ----
  if (reading.derived.fireRisk >= THRESHOLDS.fireRisk.critical) {
    alerts.push(createAlert('fire_risk', 'critical', `FIRE RISK HIGH: Score ${reading.derived.fireRisk.toFixed(2)} — Check for flames/smoke!`, 'combined', sensorId, reading.derived.fireRisk, THRESHOLDS.fireRisk.critical));
  } else if (reading.derived.fireRisk >= THRESHOLDS.fireRisk.warning) {
    alerts.push(createAlert('fire_risk', 'warning', `Fire risk elevated: Score ${reading.derived.fireRisk.toFixed(2)}`, 'combined', sensorId, reading.derived.fireRisk, THRESHOLDS.fireRisk.warning));
  }

  // ---- Health Risk (Combined) ----
  if (reading.derived.healthRisk >= THRESHOLDS.healthRisk.critical) {
    alerts.push(createAlert('poor_air', 'critical', `Health risk critical: Index ${reading.derived.healthRisk.toFixed(2)} — Take protective measures!`, 'combined', sensorId, reading.derived.healthRisk, THRESHOLDS.healthRisk.critical));
  } else if (reading.derived.healthRisk >= THRESHOLDS.healthRisk.warning) {
    alerts.push(createAlert('poor_air', 'warning', `Health risk elevated: Index ${reading.derived.healthRisk.toFixed(2)}`, 'combined', sensorId, reading.derived.healthRisk, THRESHOLDS.healthRisk.warning));
  }

  // Save and emit triggered alerts (with cooldown check)
  const triggeredAlerts = [];
  for (const alert of alerts) {
    if (shouldAlert(alert.type, alert.sensorId)) {
      try {
        const savedAlert = await new Alert(alert).save();
        triggeredAlerts.push(savedAlert);
        if (emitAlert) emitAlert(savedAlert);
      } catch (err) {
        console.error('Failed to save alert:', err.message);
      }
    }
  }

  return triggeredAlerts;
}

function createAlert(type, severity, message, sensorType, sensorId, value, threshold) {
  return {
    type,
    severity,
    message,
    sensorType,
    sensorId,
    value,
    threshold,
    acknowledged: false
  };
}

module.exports = { checkThresholds, getThresholds };
