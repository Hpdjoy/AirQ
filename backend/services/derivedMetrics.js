/**
 * Derived Metrics Calculation Engine
 * 
 * Computes 20+ derived metrics from raw sensor data:
 * - DHT11: Heat Index, Dew Point, Comfort Level, Absolute Humidity
 * - MQ2: Smoke Level, Gas Leak detection
 * - MQ135: CO₂ ventilation band, Toxic gas alert, VOC index
 * - Dust: AQI mapping
 * - Combined: Composite AQI, Fire Risk, Health Risk, Occupancy, Ventilation Demand
 */

const Settings = require('../models/Settings');

// Cached settings for derived metric calculations
let _cachedSettings = null;
let _lastFetch = 0;
async function getSettings() {
  const now = Date.now();
  if (_cachedSettings && now - _lastFetch < 60000) return _cachedSettings;
  try {
    const s = await Settings.findOne();
    if (s) { _cachedSettings = s; _lastFetch = now; }
  } catch (e) { /* use defaults */ }
  return _cachedSettings || { gasWarning: 500, gasCritical: 1000, co2Warning: 1000, co2Critical: 2000 };
}

// ============================================================
// DHT11 DERIVED METRICS
// ============================================================

/**
 * Calculate Heat Index (how hot it feels) using NWS formula
 * @param {number} T - Temperature in °C
 * @param {number} RH - Relative Humidity in %
 * @returns {number} Heat Index in °C
 */
function calculateHeatIndex(T, RH) {
  // Convert to Fahrenheit for NWS formula
  const Tf = (T * 9 / 5) + 32;

  // Simple formula for low temps
  let HI = 0.5 * (Tf + 61.0 + ((Tf - 68.0) * 1.2) + (RH * 0.094));

  if (HI >= 80) {
    // Full Rothfusz regression
    HI = -42.379 +
      2.04901523 * Tf +
      10.14333127 * RH -
      0.22475541 * Tf * RH -
      0.00683783 * Tf * Tf -
      0.05481717 * RH * RH +
      0.00122874 * Tf * Tf * RH +
      0.00085282 * Tf * RH * RH -
      0.00000199 * Tf * Tf * RH * RH;

    // Adjustments
    if (RH < 13 && Tf >= 80 && Tf <= 112) {
      HI -= ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(Tf - 95)) / 17);
    } else if (RH > 85 && Tf >= 80 && Tf <= 87) {
      HI += ((RH - 85) / 10) * ((87 - Tf) / 5);
    }
  }

  // Convert back to Celsius
  return Math.round(((HI - 32) * 5 / 9) * 10) / 10;
}

/**
 * Calculate Dew Point using Magnus formula
 * @param {number} T - Temperature in °C
 * @param {number} RH - Relative Humidity in %
 * @returns {number} Dew Point in °C
 */
function calculateDewPoint(T, RH) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * T) / (b + T)) + Math.log(RH / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Math.round(dewPoint * 10) / 10;
}

/**
 * Calculate Absolute Humidity in g/m³
 */
function calculateAbsoluteHumidity(T, RH) {
  const ah = (6.112 * Math.exp((17.67 * T) / (T + 243.5)) * RH * 2.1674) / (273.15 + T);
  return Math.round(ah * 100) / 100;
}

/**
 * Determine comfort level based on temperature and humidity
 */
function calculateComfortLevel(T, RH) {
  if (T >= 20 && T <= 26 && RH >= 30 && RH <= 60) return 'comfortable';
  if (T >= 18 && T <= 28 && RH >= 25 && RH <= 70) return 'moderate';
  if (T > 35 || T < 10 || RH > 85 || RH < 15) return 'hazardous';
  return 'uncomfortable';
}

// ============================================================
// MQ2 DERIVED METRICS
// ============================================================

/**
 * Determine smoke risk level from MQ2 ppm
 */
function calculateSmokeLevel(ppm, settings) {
  const warn = settings?.gasWarning || 500;
  const crit = settings?.gasCritical || 1000;
  if (ppm < warn) return 'safe';
  if (ppm < crit) return 'warning';
  return 'danger';
}

/**
 * Detect gas leak by checking rate of change 
 * @param {number} currentPpm - Current reading
 * @param {number} previousPpm - Previous reading (3s ago)
 * @returns {boolean} True if sudden spike detected
 */
function detectGasLeak(currentPpm, previousPpm) {
  if (!previousPpm) return false;
  const rateOfChange = currentPpm - previousPpm;
  return rateOfChange > 200; // Sudden spike of 200+ ppm in one interval
}

// ============================================================
// MQ135 DERIVED METRICS
// ============================================================

/**
 * Map CO₂ level to ASHRAE 62.1 ventilation band
 */
function calculateVentilationBand(co2_ppm, settings) {
  const warn = settings?.co2Warning || 1000;
  const crit = settings?.co2Critical || 2000;
  if (co2_ppm < warn) return 'good';
  if (co2_ppm <= crit) return 'fair';
  return 'poor';
}

/**
 * Calculate VOC Index (0-100) from MQ135 raw reading
 * Maps analog range to a normalized score
 */
function calculateVOCIndex(raw) {
  // MQ135 raw range: ~200 (clean) to ~4000 (heavy contamination)
  const normalized = Math.min(100, Math.max(0, ((raw - 200) / 3800) * 100));
  return Math.round(normalized);
}

/**
 * Determine toxic gas alert level
 */
function calculateToxicGasAlert(no2_ppm, nh3_ppm) {
  if (no2_ppm > 0.2 || nh3_ppm > 50) return 'critical';
  if (no2_ppm > 0.1 || nh3_ppm > 25) return 'warning';
  return 'safe';
}

// ============================================================
// DUST SENSOR DERIVED METRICS
// ============================================================

/**
 * Convert dust density to EPA AQI using PM2.5 breakpoints
 * Simplified for indoor monitoring
 */
function calculateDustAQI(density) {
  // EPA breakpoints for PM2.5 (µg/m³)
  const breakpoints = [
    { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },       // Good
    { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100 }, // Moderate
    { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },// Unhealthy Sensitive
    { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },// Unhealthy
    { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },// Very Unhealthy
    { low: 250.5, high: 500, aqiLow: 301, aqiHigh: 500 }  // Hazardous
  ];

  for (const bp of breakpoints) {
    if (density >= bp.low && density <= bp.high) {
      const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (density - bp.low) + bp.aqiLow;
      return Math.round(aqi);
    }
  }
  return 500; // Max AQI if beyond range
}

// ============================================================
// COMBINED / CROSS-SENSOR METRICS
// ============================================================

/**
 * Calculate Composite Indoor AQI 
 * Weighted: Dust 30%, MQ135 30%, MQ2 20%, DHT11 20%
 */
function calculateCompositeAQI(dustAqi, co2_ppm, mq2Ppm, heatIndex) {
  // Normalize each to 0-500 scale
  const co2Score = Math.min(500, (co2_ppm / 2000) * 500);
  const mq2Score = Math.min(500, (mq2Ppm / 5000) * 500);

  // Heat stress contribution (deviation from 25°C ideal)
  const tempDeviation = Math.abs(heatIndex - 25);
  const tempScore = Math.min(500, tempDeviation * 15);

  const composite = (dustAqi * 0.30) + (co2Score * 0.30) + (mq2Score * 0.20) + (tempScore * 0.20);
  return Math.round(Math.min(500, composite));
}

/**
 * Calculate Fire Risk Score (0-1)
 * Based on MQ2 smoke, dust particles, temperature rise, and CO₂ spike
 */
function calculateFireRisk(mq2Ppm, dustDensity, temperature, co2_ppm) {
  let risk = 0;

  // Smoke/gas contribution (0-0.4)
  risk += Math.min(0.4, (mq2Ppm / 5000) * 0.4);

  // Dust/particle contribution (0-0.2)
  risk += Math.min(0.2, (dustDensity / 200) * 0.2);

  // Temperature contribution (0-0.2) — high temp increases fire risk
  if (temperature > 35) risk += Math.min(0.2, ((temperature - 35) / 20) * 0.2);

  // CO₂ spike contribution (0-0.2) — combustion produces CO₂
  if (co2_ppm > 800) risk += Math.min(0.2, ((co2_ppm - 800) / 1200) * 0.2);

  return Math.round(risk * 100) / 100;
}

/**
 * Calculate Health Risk Index (0-1)
 * Based on toxic gases (NO₂, NH₃), dust, and heat stress
 */
function calculateHealthRisk(no2_ppm, nh3_ppm, dustDensity, heatIndex) {
  let risk = 0;

  // NO₂ contribution (0-0.3) — WHO limit is 0.1 ppm
  risk += Math.min(0.3, (no2_ppm / 0.5) * 0.3);

  // NH₃ contribution (0-0.25) — OSHA PEL is 50 ppm
  risk += Math.min(0.25, (nh3_ppm / 100) * 0.25);

  // Dust contribution (0-0.25)
  risk += Math.min(0.25, (dustDensity / 150) * 0.25);

  // Heat stress contribution (0-0.2)
  if (heatIndex > 32) risk += Math.min(0.2, ((heatIndex - 32) / 20) * 0.2);

  return Math.round(risk * 100) / 100;
}

/**
 * Estimate occupancy from CO₂ level
 * Rough estimation: each person adds ~40 ppm CO₂ over baseline (400ppm outdoor)
 */
function estimateOccupancy(co2_ppm) {
  const baseline = 400; // Outdoor CO₂ baseline
  const perPersonContribution = 40; // ~40 ppm per person in a typical room
  const excess = Math.max(0, co2_ppm - baseline);
  return Math.round(excess / perPersonContribution);
}

/**
 * Calculate Ventilation Demand Score (0-1)
 * Based on CO₂ level + humidity
 */
function calculateVentilationDemand(co2_ppm, humidity, dustDensity) {
  let demand = 0;

  // CO₂ is the primary indicator (0-0.5)
  demand += Math.min(0.5, (co2_ppm / 2000) * 0.5);

  // Humidity contribution (0-0.3)
  if (humidity > 60) demand += Math.min(0.3, ((humidity - 60) / 40) * 0.3);

  // Dust contribution (0-0.2)
  demand += Math.min(0.2, (dustDensity / 100) * 0.2);

  return Math.round(demand * 100) / 100;
}

/**
 * Determine ventilation status from demand score
 */
function calculateVentilationStatus(demand) {
  if (demand < 0.3) return 'adequate';
  if (demand < 0.6) return 'marginal';
  return 'inadequate';
}

// ============================================================
// MAIN PROCESSOR — Processes raw sensor data into full reading
// ============================================================

/**
 * Process raw sensor data and compute all derived metrics
 * @param {Object} rawData - Raw sensor readings from ESP32/Simulator
 * @param {Object} previousReading - Previous reading for trend detection
 * @returns {Object} Complete sensor reading with all derived metrics
 */
async function processReading(rawData, previousReading = null) {
  const { mq2, mq135, dust, dht11, metadata } = rawData;
  const settings = await getSettings();

  // DHT11 derived metrics
  const heatIndex = calculateHeatIndex(dht11.temperature, dht11.humidity);
  const dewPoint = calculateDewPoint(dht11.temperature, dht11.humidity);
  const absoluteHumidity = calculateAbsoluteHumidity(dht11.temperature, dht11.humidity);
  const comfortLevel = calculateComfortLevel(dht11.temperature, dht11.humidity);

  // MQ2 derived
  const smokeLevel = calculateSmokeLevel(mq2.ppm, settings);

  // MQ135 derived
  const ventilationBand = calculateVentilationBand(mq135.co2_ppm, settings);
  const vocIndex = calculateVOCIndex(mq135.raw);
  const toxicAlert = calculateToxicGasAlert(mq135.no2_ppm, mq135.nh3_ppm);

  // Dust derived
  const dustAqi = calculateDustAQI(dust.density);

  // Combined metrics
  const compositeAQI = calculateCompositeAQI(dustAqi, mq135.co2_ppm, mq2.ppm, heatIndex);
  const fireRisk = calculateFireRisk(mq2.ppm, dust.density, dht11.temperature, mq135.co2_ppm);
  const healthRisk = calculateHealthRisk(mq135.no2_ppm, mq135.nh3_ppm, dust.density, heatIndex);
  const estimatedOccupancy = estimateOccupancy(mq135.co2_ppm);
  const ventilationDemand = calculateVentilationDemand(mq135.co2_ppm, dht11.humidity, dust.density);
  const ventilationStatus = calculateVentilationStatus(ventilationDemand);

  return {
    timestamp: new Date(),
    metadata: metadata || { sensorId: 'zone-a', building: 'main-building', floor: 1 },
    mq2: {
      raw: mq2.raw,
      ppm: mq2.ppm,
      smokeLevel
    },
    mq135: {
      raw: mq135.raw,
      co2_ppm: mq135.co2_ppm,
      no2_ppm: mq135.no2_ppm,
      nh3_ppm: mq135.nh3_ppm,
      vocIndex,
      ventilationBand
    },
    dust: {
      raw: dust.raw,
      density: dust.density,
      aqi: dustAqi
    },
    dht11: {
      temperature: dht11.temperature,
      humidity: dht11.humidity,
      heatIndex,
      dewPoint
    },
    derived: {
      compositeAQI,
      comfortLevel,
      fireRisk,
      healthRisk,
      ventilationDemand,
      estimatedOccupancy,
      ventilationStatus,
      absoluteHumidity,
      toxicAlert
    }
  };
}

module.exports = {
  processReading,
  calculateHeatIndex,
  calculateDewPoint,
  calculateAbsoluteHumidity,
  calculateComfortLevel,
  calculateSmokeLevel,
  calculateVentilationBand,
  calculateVOCIndex,
  calculateDustAQI,
  calculateCompositeAQI,
  calculateFireRisk,
  calculateHealthRisk,
  estimateOccupancy,
  calculateVentilationDemand,
  calculateToxicGasAlert
};
