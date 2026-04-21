import {
  Building2, Cpu, Radio, Database, Globe,
  Thermometer, Droplets, Wind, CloudFog, FlaskConical,
  Shield, Heart, Activity, Gauge, ExternalLink
} from 'lucide-react';

/**
 * About Page — System information, sensor details, and architecture
 */
export default function AboutPage() {
  const sensors = [
    {
      name: 'MQ2 Gas Sensor',
      icon: <Gauge size={20} />,
      color: 'orange',
      description: 'Detects combustible gases (LPG, methane, propane) and smoke',
      specs: ['Detection Range: 300–10,000 ppm', 'Heater Voltage: 5V', 'Load Resistor: 10kΩ'],
      metrics: ['Gas PPM', 'Smoke Level', 'Fire Risk Score']
    },
    {
      name: 'MQ135 Air Quality Sensor',
      icon: <FlaskConical size={20} />,
      color: 'purple',
      description: 'Measures CO₂, NO₂, NH₃, and other harmful gases',
      specs: ['Detection Range: 10–1000 ppm', 'Heater Voltage: 5V', 'Load Resistor: 22kΩ (modified)'],
      metrics: ['CO₂ (ppm)', 'NO₂ (ppm)', 'NH₃ (ppm)', 'VOC Index']
    },
    {
      name: 'Dust / PM Sensor',
      icon: <CloudFog size={20} />,
      color: 'pink',
      description: 'Measures airborne particulate matter density (PM2.5/PM10)',
      specs: ['Model: GP2Y1010AU0F', 'Detection: 0–600 µg/m³', 'LED Pulse: 280µs'],
      metrics: ['Dust Density (µg/m³)', 'PM AQI', 'Health Impact']
    },
    {
      name: 'DHT11 Temp & Humidity',
      icon: <Thermometer size={20} />,
      color: 'blue',
      description: 'Measures ambient temperature and relative humidity',
      specs: ['Temp Range: 0–50°C ±2°C', 'Humidity: 20–90% ±5%', 'Digital Output'],
      metrics: ['Temperature', 'Humidity', 'Heat Index', 'Dew Point']
    }
  ];

  const architecture = [
    { label: 'Edge Device', value: 'ESP32 (Dual-Core, WiFi)', icon: <Cpu size={16} /> },
    { label: 'Protocol', value: 'MQTT (Mosquitto Broker)', icon: <Radio size={16} /> },
    { label: 'Backend', value: 'Node.js + Express + Socket.IO', icon: <Globe size={16} /> },
    { label: 'Database', value: 'MongoDB (Time-Series Collection)', icon: <Database size={16} /> },
    { label: 'Frontend', value: 'React + Vite + Recharts', icon: <Activity size={16} /> },
  ];

  const standards = [
    { org: 'WHO', scope: 'Air quality guidelines for PM, NO₂' },
    { org: 'ASHRAE', scope: 'Indoor CO₂ and ventilation standards' },
    { org: 'OSHA', scope: 'Workplace gas exposure limits' },
    { org: 'EPA', scope: 'AQI breakpoint calculations' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>About System</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>System architecture, sensor specifications, and standards compliance</p>
      </div>

      {/* System Overview */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card__header">
          <span className="card__label"><Building2 size={16} /> System Overview</span>
          <span className="card__badge card__badge--safe">v1.0.0</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px' }}>
          AirQ Industrial Monitor is a comprehensive indoor air quality monitoring system designed for
          industrial and commercial buildings. It uses 4 sensors to track 20+ metrics including gas levels,
          particulate matter, temperature, humidity, and derived indicators like AQI, fire risk, health risk,
          and estimated occupancy.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
          {architecture.map((item, idx) => (
            <div key={idx} className="metric-row">
              <span className="metric-row__label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {item.icon} {item.label}
              </span>
              <span className="metric-row__value" style={{ fontSize: '0.8rem' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sensor Cards */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {sensors.map((sensor, idx) => (
            <div key={idx} className="card">
              <div className="card__header">
                <span className="card__label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className={`icon-wrap icon-wrap--${sensor.color}`}>{sensor.icon}</div>
                  {sensor.name}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px', lineHeight: 1.5 }}>
                {sensor.description}
              </p>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Specifications</div>
                {sensor.specs.map((spec, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '3px 0', fontFamily: 'var(--font-mono)' }}>
                    • {spec}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>Derived Metrics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {sensor.metrics.map((m, i) => (
                    <span key={i} className="card__badge card__badge--info" style={{ fontSize: '0.65rem' }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standards */}
      <div className="card">
        <div className="card__header">
          <span className="card__label"><Shield size={16} /> Standards Compliance</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {standards.map((std, idx) => (
            <div key={idx} style={{
              padding: '12px 16px', background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{std.org}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{std.scope}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
