import { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, Bell, Shield, Fan, Volume2, Gauge, Thermometer, Wind, CloudFog, Droplets, Flame, Timer, Cpu, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    // Alert Thresholds
    tempWarning: 32,
    tempCritical: 38,
    co2Warning: 1000,
    co2Critical: 2000,
    gasWarning: 500,
    gasCritical: 1000,
    dustWarning: 150,
    dustCritical: 300,
    humidityWarning: 70,
    humidityCritical: 85,
    aqiWarning: 100,
    aqiCritical: 200,
    // Notifications
    notifyEmail: true,
    notifySms: false,
    notifyBuzzer: true,
    // Actuator Automation
    autoVentilation: true,
    fanMinOnTime: 30,
    buzzerWarningCooldown: 30,
    buzzerErrorCooldown: 15,
    // Sensor Config
    publishInterval: 3
  });

  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data && data._id) {
          setSettings(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value) || value
    }));
    setIsSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={28} color="var(--accent-teal)" /> System Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure alarm thresholds, actuator behavior, notification channels, and sensor parameters.
          </p>
        </div>
        <button 
          onClick={handleSave}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '12px 24px', background: isSaved ? 'var(--status-safe)' : 'var(--accent-blue)', 
            color: '#fff', borderRadius: 'var(--radius-sm)', 
            fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
            border: 'none', transition: 'all 0.3s',
            boxShadow: isSaved ? '0 0 12px rgba(16,185,129,0.3)' : 'none'
          }}
        >
          {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
          {isSaved ? 'Saved ✓' : 'Save Configuration'}
        </button>
      </header>

      <form onSubmit={handleSave}>

        {/* ===== SECTION 1: Air Quality Thresholds ===== */}
        <div className="card animate-in" style={{ marginBottom: 'var(--gap-md)' }}>
          <div className="card__header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <span className="card__label" style={{ fontSize: '0.95rem' }}><AlertTriangle size={18} /> Air Quality Thresholds</span>
            <span className="card__badge card__badge--info">BUZZER + FAN TRIGGERS</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
            These thresholds control when the buzzer sounds and when the exhaust fan activates automatically.
            <strong> Warning</strong> triggers the fan + warning beeps. <strong>Critical</strong> triggers the fan + error alarm.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <ThresholdRow 
              label="CO₂ Level" unit="ppm"
              icon={<Wind size={14} color="var(--accent-blue)" />}
              nameBase="co2"
              valWarning={settings.co2Warning} 
              valCritical={settings.co2Critical} 
              onChange={handleChange} 
            />
            <ThresholdRow 
              label="Combustible Gas (MQ2)" unit="ppm"
              icon={<Flame size={14} color="var(--status-danger)" />}
              nameBase="gas"
              valWarning={settings.gasWarning} 
              valCritical={settings.gasCritical} 
              onChange={handleChange} 
            />
            <ThresholdRow 
              label="Dust / PM" unit="µg/m³"
              icon={<CloudFog size={14} color="var(--text-muted)" />}
              nameBase="dust"
              valWarning={settings.dustWarning} 
              valCritical={settings.dustCritical} 
              onChange={handleChange} 
            />
            <ThresholdRow 
              label="Temperature" unit="°C"
              icon={<Thermometer size={14} color="var(--accent-orange)" />}
              nameBase="temp"
              valWarning={settings.tempWarning} 
              valCritical={settings.tempCritical} 
              onChange={handleChange} 
            />
            <ThresholdRow 
              label="Humidity" unit="%"
              icon={<Droplets size={14} color="var(--accent-teal)" />}
              nameBase="humidity"
              valWarning={settings.humidityWarning} 
              valCritical={settings.humidityCritical} 
              onChange={handleChange} 
            />
            <ThresholdRow 
              label="Composite AQI" unit=""
              icon={<Gauge size={14} color="var(--accent-purple)" />}
              nameBase="aqi"
              valWarning={settings.aqiWarning} 
              valCritical={settings.aqiCritical} 
              onChange={handleChange} 
            />
          </div>
        </div>

        {/* ===== SECTION 2: Actuator Settings ===== */}
        <div className="dash-section animate-in animate-in-delay-1" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          
          {/* Exhaust Fan Config */}
          <div className="card">
            <div className="card__header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <span className="card__label" style={{ fontSize: '0.95rem' }}><Fan size={18} /> Exhaust Fan</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="autoVentilation" checked={settings.autoVentilation} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-teal)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Auto-Ventilation</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fan activates automatically when AQ thresholds are exceeded.</div>
                </div>
              </label>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Timer size={12} /> Minimum ON Time
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" name="fanMinOnTime" 
                    value={settings.fanMinOnTime} onChange={handleChange}
                    min="5" max="120" step="5"
                    style={{ width: '80px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>seconds — prevents rapid toggling</span>
                </div>
              </div>
            </div>
          </div>

          {/* Buzzer Config */}
          <div className="card">
            <div className="card__header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <span className="card__label" style={{ fontSize: '0.95rem' }}><Volume2 size={18} /> Buzzer Alerts</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="notifyBuzzer" checked={settings.notifyBuzzer} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-purple)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable Buzzer Alerts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audible alerts for startup, warnings, errors, ping, and calibration.</div>
                </div>
              </label>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--status-warning)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Timer size={12} /> Warning Beep Interval
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" name="buzzerWarningCooldown" 
                    value={settings.buzzerWarningCooldown} onChange={handleChange}
                    min="10" max="120" step="5"
                    style={{ width: '80px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-warning-border)', background: 'var(--status-warning-bg)', color: 'var(--text-primary)', outline: 'none', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>seconds between warning chirps</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--status-danger)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Timer size={12} /> Error Alarm Interval
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" name="buzzerErrorCooldown" 
                    value={settings.buzzerErrorCooldown} onChange={handleChange}
                    min="5" max="60" step="5"
                    style={{ width: '80px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-danger-border)', background: 'var(--status-danger-bg)', color: 'var(--text-primary)', outline: 'none', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>seconds between error alarms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECTION 3: Notifications & Sensor Config ===== */}
        <div className="dash-section animate-in animate-in-delay-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
          
          {/* Notifications */}
          <div className="card">
            <div className="card__header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <span className="card__label" style={{ fontSize: '0.95rem' }}><Bell size={18} /> Notification Channels</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="notifyEmail" checked={settings.notifyEmail} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email Alerts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send critical alerts to facility manager inbox.</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="notifySms" checked={settings.notifySms} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-orange)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>SMS Notifications</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Urgent texts for immediate evacuation events.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Sensor Config */}
          <div className="card">
            <div className="card__header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <span className="card__label" style={{ fontSize: '0.95rem' }}><Cpu size={18} /> Sensor Configuration</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Timer size={12} /> Publish Interval
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" name="publishInterval" 
                    value={settings.publishInterval} onChange={handleChange}
                    min="1" max="30" step="1"
                    style={{ width: '80px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>seconds — sensor read + MQTT publish rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SAVE BUTTON (bottom) ===== */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--gap-md)', paddingBottom: 'var(--gap-lg)' }}>
          <button 
            type="submit"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '12px 32px', background: isSaved ? 'var(--status-safe)' : 'var(--accent-blue)', 
              color: '#fff', borderRadius: 'var(--radius-sm)', 
              fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
              border: 'none', transition: 'all 0.3s',
              boxShadow: isSaved ? '0 0 12px rgba(16,185,129,0.3)' : '0 2px 8px rgba(37,99,235,0.15)'
            }}
          >
            {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
            {isSaved ? 'Configuration Saved ✓' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Reusable threshold input row with icon and unit
function ThresholdRow({ label, unit, icon, nameBase, valWarning, valCritical, onChange }) {
  return (
    <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label} {unit && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.75rem' }}>({unit})</span>}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--status-warning)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>⚠ Warning</label>
          <input 
            type="number" 
            name={`${nameBase}Warning`}
            value={valWarning}
            onChange={onChange}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-warning-border)', background: 'var(--status-warning-bg)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', textAlign: 'center' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--status-danger)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>🚨 Critical</label>
          <input 
            type="number" 
            name={`${nameBase}Critical`}
            value={valCritical}
            onChange={onChange}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-danger-border)', background: 'var(--status-danger-bg)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', textAlign: 'center' }}
          />
        </div>
      </div>
    </div>
  );
}
