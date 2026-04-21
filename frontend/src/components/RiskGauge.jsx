import GaugeCard from './GaugeCard';
import { getRiskLabel } from '../utils/helpers';

/**
 * Risk Gauge — Displays fire risk or health risk as a radial gauge
 */
export default function RiskGauge({ title, icon, score = 0, details = [] }) {
  const { label, status } = getRiskLabel(score);

  const statusColors = {
    safe: 'var(--status-safe)',
    warning: 'var(--status-warning)',
    danger: 'var(--status-danger)'
  };

  return (
    <div className={`card card--${status}`}>
      <div className="card__header">
        <span className="card__label">{icon} {title}</span>
        <span className={`card__badge card__badge--${status}`}>{label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <GaugeCard
          value={Math.round(score * 100)}
          max={100}
          unit="%"
          size={100}
          strokeWidth={6}
          status={status}
        />
        <div style={{ flex: 1 }}>
          {details.map((detail, idx) => (
            <div key={idx} className="metric-row">
              <span className="metric-row__label">{detail.label}</span>
              <span className="metric-row__value" style={{ color: statusColors[detail.status] || 'var(--text-primary)' }}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
