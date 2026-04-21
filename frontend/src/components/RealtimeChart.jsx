import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { formatTimeShort } from '../utils/helpers';

const CHART_SERIES = [
  { key: 'temperature', label: 'Temperature (°C)', color: '#ea580c', path: 'dht11.temperature' },
  { key: 'humidity', label: 'Humidity (%)', color: '#2563eb', path: 'dht11.humidity' },
  { key: 'co2', label: 'CO₂ (ppm)', color: '#7c3aed', path: 'mq135.co2_ppm' },
  { key: 'gas', label: 'Gas (ppm)', color: '#d97706', path: 'mq2.ppm' },
  { key: 'dust', label: 'Dust (µg/m³)', color: '#db2777', path: 'dust.density' },
  { key: 'aqi', label: 'AQI', color: '#0891b2', path: 'derived.compositeAQI' },
];

const DURATIONS = ['1h', '6h', '24h', '7d'];

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Real-time Chart — Multi-series area chart with toggleable datasets
 */
export default function RealtimeChart({ historyData = [], onRequestHistory }) {
  const [activeSeries, setActiveSeries] = useState(['temperature', 'co2', 'aqi']);
  const [duration, setDuration] = useState('1h');

  const chartData = useMemo(() => {
    // Downsample if too many points
    let data = historyData;
    if (data.length > 150) {
      const step = Math.ceil(data.length / 150);
      data = data.filter((_, i) => i % step === 0);
    }

    return data.map(reading => {
      const point = {
        time: formatTimeShort(reading.timestamp),
        rawTime: new Date(reading.timestamp).getTime()
      };
      CHART_SERIES.forEach(series => {
        point[series.key] = getNestedValue(reading, series.path);
      });
      return point;
    });
  }, [historyData]);

  const toggleSeries = (key) => {
    setActiveSeries(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleDuration = (d) => {
    setDuration(d);
    if (onRequestHistory) onRequestHistory(d);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '0.75rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ color: '#64748b', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>{label}</div>
        {payload.map((entry, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
            <span style={{ color: '#64748b' }}>{entry.name}:</span>
            <span style={{ color: '#0f172a', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card chart-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="chart-section__tabs">
          {CHART_SERIES.map(series => (
            <button
              key={series.key}
              className={`chart-tab ${activeSeries.includes(series.key) ? 'chart-tab--active' : ''}`}
              onClick={() => toggleSeries(series.key)}
              style={activeSeries.includes(series.key) ? {
                borderColor: series.color,
                color: series.color,
                background: `${series.color}15`
              } : {}}
            >
              {series.label}
            </button>
          ))}
        </div>
        <div className="chart-duration-tabs">
          {DURATIONS.map(d => (
            <button
              key={d}
              className={`chart-duration-tab ${duration === d ? 'chart-duration-tab--active' : ''}`}
              onClick={() => handleDuration(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 280, marginTop: '16px' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                {CHART_SERIES.filter(s => activeSeries.includes(s.key)).map(series => (
                  <linearGradient key={series.key} id={`grad-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={series.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={series.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={11}
                fontFamily="var(--font-mono)"
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                fontFamily="var(--font-mono)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {CHART_SERIES.filter(s => activeSeries.includes(s.key)).map(series => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  fill={`url(#grad-${series.key})`}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={800}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Waiting for data...
          </div>
        )}
      </div>
    </div>
  );
}
