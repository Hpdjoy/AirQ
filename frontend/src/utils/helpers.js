/**
 * Status determination utilities
 * 
 * Functions accept optional threshold overrides from the Settings page.
 * When no overrides are provided, they fall back to firmware defaults.
 */

// Default thresholds matching firmware config.h
const DEFAULTS = {
  co2Warning: 1000,
  co2Critical: 2000,
  gasWarning: 500,
  gasCritical: 1000,
  dustWarning: 150,
  dustCritical: 300,
  tempWarning: 32,
  tempCritical: 38,
  humidityWarning: 70,
  humidityCritical: 85,
  aqiWarning: 50,
  aqiCritical: 150
};

// Cached settings — loaded once from the backend
let _settingsCache = null;
let _settingsFetchTime = 0;

export async function fetchSettings() {
  const now = Date.now();
  // Cache for 60 seconds
  if (_settingsCache && now - _settingsFetchTime < 60000) {
    return _settingsCache;
  }
  try {
    const res = await fetch(`http://${window.location.hostname}:5000/api/settings`);
    const data = await res.json();
    if (data && data._id) {
      _settingsCache = data;
      _settingsFetchTime = now;
      return data;
    }
  } catch (err) {
    console.error("Failed to fetch settings for thresholds:", err);
  }
  return DEFAULTS;
}

// Synchronous getter for cached settings (returns defaults if not yet fetched)
export function getSettings() {
  return _settingsCache || DEFAULTS;
}

export function getAQIStatus(aqi) {
  if (aqi <= 50) return { label: 'Good', status: 'safe', color: '#059669' };
  if (aqi <= 100) return { label: 'Moderate', status: 'warning', color: '#eab308' }; // Yellow
  if (aqi <= 150) return { label: 'Poor', status: 'warning', color: '#f97316' };     // Orange
  if (aqi <= 200) return { label: 'Unhealthy', status: 'danger', color: '#ef4444' };   // Red
  if (aqi <= 300) return { label: 'Severe', status: 'danger', color: '#8b5cf6' };      // Purple
  return { label: 'Hazardous', status: 'danger', color: '#9f1239' };                 // Maroon
}

export function getCO2Status(ppm, settings) {
  const s = settings || getSettings();
  if (ppm < s.co2Warning) return { label: 'Good', status: 'safe' };
  if (ppm < s.co2Critical) return { label: 'Fair', status: 'warning' };
  return { label: 'Poor', status: 'danger' };
}

export function getGasStatus(ppm, settings) {
  const s = settings || getSettings();
  if (ppm < s.gasWarning) return { label: 'Safe', status: 'safe' };
  if (ppm < s.gasCritical) return { label: 'Warning', status: 'warning' };
  return { label: 'Danger', status: 'danger' };
}

export function getDustStatus(density, settings) {
  const s = settings || getSettings();
  if (density < s.dustWarning) return { label: 'Clean', status: 'safe' };
  if (density < s.dustCritical) return { label: 'Dusty', status: 'warning' };
  return { label: 'Hazardous', status: 'danger' };
}

export function getTempStatus(temp, settings) {
  const s = settings || getSettings();
  if (temp < s.tempWarning) return { label: 'Normal', status: 'safe' };
  if (temp < s.tempCritical) return { label: 'Warm', status: 'warning' };
  return { label: 'Hot', status: 'danger' };
}

export function getHumidityStatus(humidity, settings) {
  const s = settings || getSettings();
  if (humidity < s.humidityWarning) return { label: 'Normal', status: 'safe' };
  if (humidity < s.humidityCritical) return { label: 'High', status: 'warning' };
  return { label: 'Very High', status: 'danger' };
}

export function getRiskLabel(score) {
  if (score < 0.3) return { label: 'Low', status: 'safe' };
  if (score < 0.6) return { label: 'Medium', status: 'warning' };
  return { label: 'High', status: 'danger' };
}

export function getComfortEmoji(level) {
  const map = {
    comfortable: '😊',
    moderate: '😐',
    uncomfortable: '😓',
    hazardous: '🚨'
  };
  return map[level] || '❓';
}

export function formatTime(timestamp) {
  if (!timestamp) return '--:--';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatTimeShort(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
