import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Thermometer, Wind, Filter } from 'lucide-react';
import { formatTimeShort } from '../utils/helpers';

export default function AnalyticsPage({ historyData }) {
  const [metric1, setMetric1] = useState('dht11.temperature');
  const [metric2, setMetric2] = useState('dht11.humidity');
  const [timeRange, setTimeRange] = useState('1h');

  // Helper to extract nested values
  const getValue = (obj, path) => {
    return path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
  };

  const METRICS = [
    { value: 'dht11.temperature', label: 'Temperature (°C)', color: '#ea580c' },
    { value: 'dht11.humidity', label: 'Humidity (%)', color: '#2563eb' },
    { value: 'mq135.co2_ppm', label: 'CO₂ (ppm)', color: '#7c3aed' },
    { value: 'mq135.vocIndex', label: 'VOC Index', color: '#0d9488' },
    { value: 'mq2.ppm', label: 'Combustible Gas (ppm)', color: '#d97706' },
    { value: 'dust.density', label: 'Dust PM (µg/m³)', color: '#db2777' },
    { value: 'derived.compositeAQI', label: 'Composite AQI', color: '#0891b2' },
  ];

  const chartData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    // In a real app, timeRange would trigger a backend fetch for historical data.
    // For this mockup, we are bound by the historyData context in memory (usually 1 hour).
    return historyData.map(d => ({
      time: formatTimeShort(d.timestamp),
      metric1Value: getValue(d, metric1) || 0,
      metric2Value: getValue(d, metric2) || 0,
    }));
  }, [historyData, metric1, metric2]);

  const m1Config = METRICS.find(m => m.value === metric1);
  const m2Config = METRICS.find(m => m.value === metric2);

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={28} color="var(--accent-blue)" /> Sensor Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Compare real-time data trends to identify environmental correlations.
        </p>
      </header>

      <div className="card" style={{ marginBottom: 'var(--gap-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-end', marginBottom: '24px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Primary Axis (Left)
            </label>
            <select 
              value={metric1} 
              onChange={(e) => setMetric1(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
            >
              {METRICS.map(m => <option key={`p-${m.value}`} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Secondary Axis (Right)
            </label>
            <select 
              value={metric2} 
              onChange={(e) => setMetric2(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
            >
              {METRICS.map(m => <option key={`s-${m.value}`} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Time Range
            </label>
            <div className="chart-duration-tabs" style={{ marginLeft: 0 }}>
              {['1h', '6h', '24h', '7d'].map(limit => (
                <button
                  key={limit}
                  className={`chart-duration-tab ${timeRange === limit ? 'chart-duration-tab--active' : ''}`}
                  onClick={() => setTimeRange(limit)}
                >
                  {limit}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: '450px', width: '100%' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickMargin={10}
                  tick={{ fill: 'var(--text-secondary)' }}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke={m1Config.color} 
                  fontSize={12}
                  tickFormatter={(val) => Math.round(val)}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke={m2Config.color} 
                  fontSize={12}
                  tickFormatter={(val) => Math.round(val)}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card-hover)',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{
                    fontWeight: 500
                  }}
                  labelStyle={{
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="metric1Value" 
                  name={m1Config.label} 
                  stroke={m1Config.color} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="metric2Value" 
                  name={m2Config.label} 
                  stroke={m2Config.color} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Waiting for sensor data to generate analytics...
            </div>
          )}
        </div>
      </div>

      <div className="dash-section">
        <div className="card">
          <div className="card__header">
            <span className="card__label"><Thermometer size={16} /> Correlation Insights</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Higher temperature generally correlates with increased TVOC outgassing levels. High localized CO₂ levels often indicate poor ventilation in populated zones, which may require HVAC intervention before air quality index severely degrades.
          </p>
        </div>
        <div className="card">
          <div className="card__header">
            <span className="card__label"><Filter size={16} /> Recommended Actions</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            If AQI baseline spikes consistently at a specific time, inspect floor schematics for scheduled machinery operations or facility cleaning that might be the primary pollutant source.
          </p>
        </div>
      </div>
    </div>
  );
}
