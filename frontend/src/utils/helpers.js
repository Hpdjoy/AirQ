/**
 * Status determination utilities
 */
export function getAQIStatus(aqi) {
  if (aqi <= 50) return { label: 'Good', status: 'safe', color: '#059669' };
  if (aqi <= 100) return { label: 'Moderate', status: 'warning', color: '#d97706' };
  if (aqi <= 150) return { label: 'Unhealthy (S)', status: 'warning', color: '#ea580c' };
  if (aqi <= 200) return { label: 'Unhealthy', status: 'danger', color: '#dc2626' };
  if (aqi <= 300) return { label: 'Very Unhealthy', status: 'danger', color: '#7c3aed' };
  return { label: 'Hazardous', status: 'danger', color: '#991b1b' };
}

export function getCO2Status(ppm) {
  if (ppm < 800) return { label: 'Good', status: 'safe' };
  if (ppm <= 1200) return { label: 'Fair', status: 'warning' };
  return { label: 'Poor', status: 'danger' };
}

export function getGasStatus(ppm) {
  if (ppm < 500) return { label: 'Safe', status: 'safe' };
  if (ppm < 2000) return { label: 'Warning', status: 'warning' };
  return { label: 'Danger', status: 'danger' };
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
