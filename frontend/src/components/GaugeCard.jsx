import { useMemo } from 'react';

/**
 * Radial Gauge Component
 * Renders a circular SVG gauge with animated fill
 */
export default function GaugeCard({ value, max, label, unit, size = 120, strokeWidth = 8, color, status }) {
  const statusColors = {
    safe: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb'
  };

  const gaugeColor = color || statusColors[status] || '#0891b2';

  const { circumference, offset } = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * radius;
    const percentage = Math.min(1, Math.max(0, value / max));
    const off = circ * (1 - percentage * 0.75);
    return { circumference: circ, offset: off };
  }, [value, max, size, strokeWidth]);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <div className="gauge">
      <svg
        className="gauge__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ '--gauge-color': gaugeColor }}
      >
        <circle
          className="gauge__track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          transform={`rotate(135 ${center} ${center})`}
        />
        <circle
          className="gauge__fill"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={offset}
          stroke={gaugeColor}
          transform={`rotate(135 ${center} ${center})`}
        />
      </svg>
      <div className="gauge__center">
        <div className="gauge__value" style={{ fontSize: size > 100 ? '1.6rem' : '1.2rem' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {unit && <div className="gauge__label">{unit}</div>}
      </div>
    </div>
  );
}
