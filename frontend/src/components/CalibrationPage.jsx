import { useState } from 'react';
import { Wrench, RefreshCw, Crosshair, Thermometer, FlaskConical, Wind } from 'lucide-react';

export default function CalibrationPage({ emitCommand }) {
  const [calibrating, setCalibrating] = useState(null);

  const handleCalibrate = (sensor) => {
    setCalibrating(sensor);
    
    // Send command to ESP32 over MQTT (via backend websocket bridge)
    if (emitCommand) {
      emitCommand('calibrate_sensor', { sensor });
    }

    // Assume the calibration takes ~3.5 seconds round trip and resets the R0
    setTimeout(() => {
      setCalibrating(null);
    }, 3500);
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Wrench size={28} color="var(--accent-orange)" /> Sensor Calibration
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Adjust base reference values (R0) and zero-point offsets to ensure measurement accuracy.
        </p>
      </header>

      <div className="dash-section">
        <CalibrationCard 
          id="mq2"
          name="MQ2 Combustible Gas" 
          icon={<FlaskConical size={18} />}
          baseline="9.83 kΩ"
          lastCalibrated="2026-04-10"
          status="optimal"
          isCalibrating={calibrating === 'mq2'}
          onCalibrate={() => handleCalibrate('mq2')}
        />
        <CalibrationCard 
          id="mq135"
          name="MQ135 Air Quality" 
          icon={<Wind size={18} />}
          baseline="76.63 kΩ"
          lastCalibrated="2026-03-22"
          status="warning"
          isCalibrating={calibrating === 'mq135'}
          onCalibrate={() => handleCalibrate('mq135')}
        />
        <CalibrationCard 
          id="dht11"
          name="DHT11 Temp & Humidity" 
          icon={<Thermometer size={18} />}
          baseline="Offset: -2.1°C"
          lastCalibrated="Factory"
          status="safe"
          isCalibrating={calibrating === 'dht11'}
          onCalibrate={() => handleCalibrate('dht11')}
        />
      </div>

      <div className="card animate-in animate-in-delay-2" style={{ borderLeft: '4px solid var(--accent-orange)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crosshair size={18} color="var(--accent-orange)" /> Calibration Procedure
        </h3>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Ensure the specific facility zone is thoroughly ventilated with clean, fresh outdoor air.</li>
            <li>Leave the sensors powered on for at least 24 hours (burn-in period) prior to initial calibration.</li>
            <li>Click 'Run Zero-Point Calibration' and do not introduce any aerosols, gases, or temperature shocks during the 60-second sampling window.</li>
            <li>The system will automatically average 100 samples to establish the new R0 baseline resistance.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function CalibrationCard({ id, name, icon, baseline, lastCalibrated, status, isCalibrating, onCalibrate }) {
  return (
    <div className={`card card--${status}`}>
      <div className="card__header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <span className="card__label" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {icon} {name}
        </span>
        <span className={`card__badge card__badge--${status}`}>
          {status === 'warning' ? 'DRIFT DETECTED' : 'OPTIMAL'}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>R0 Baseline</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1.1rem' }}>{baseline}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Last Calibration</div>
          <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{lastCalibrated}</div>
        </div>
      </div>

      <button 
        onClick={onCalibrate}
        disabled={isCalibrating}
        style={{ 
          width: '100%', padding: '10px', 
          background: isCalibrating ? 'var(--bg-primary)' : 'var(--bg-secondary)', 
          border: `1px solid ${isCalibrating ? 'var(--border-subtle)' : 'var(--accent-orange)'}`, 
          borderRadius: 'var(--radius-sm)', 
          color: isCalibrating ? 'var(--text-muted)' : 'var(--accent-orange)', 
          fontWeight: 600, fontSize: '0.85rem', cursor: isCalibrating ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s'
        }}
      >
        <RefreshCw size={14} className={isCalibrating ? 'spin' : ''} />
        {isCalibrating ? 'Sampling Background Air...' : 'Run Zero-Point Calibration'}
      </button>

      {/* Quick spin animation just for this button */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
