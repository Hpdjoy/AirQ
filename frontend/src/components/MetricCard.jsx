/**
 * Metric Card — Displays a single sensor metric with icon, status badge, and trend
 */
export default function MetricCard({ label, value, unit, status, sublabel, trend, icon, className = '' }) {
  const statusClass = status ? `card--${status}` : '';

  return (
    <div className={`card ${statusClass} ${className}`}>
      <div className="card__header">
        <span className="card__label">
          {icon}
          {label}
        </span>
        {status && (
          <span className={`card__badge card__badge--${status}`}>
            {status}
          </span>
        )}
      </div>
      <div className="card__value">
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : (value ?? '--')}
        {unit && <span className="card__unit">{unit}</span>}
      </div>
      {sublabel && <div className="card__sublabel">{sublabel}</div>}
      {trend !== undefined && trend !== null && (
        <div className={`card__trend ${trend > 0 ? 'card__trend--up' : trend < 0 ? 'card__trend--down' : 'card__trend--stable'}`}>
          {trend > 0 ? '▲' : trend < 0 ? '▼' : '●'} {Math.abs(trend).toFixed(1)}
        </div>
      )}
    </div>
  );
}
