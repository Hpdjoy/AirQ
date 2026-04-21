import { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState({
    tempWarning: 32,
    tempCritical: 38,
    co2Warning: 1000,
    co2Critical: 2000,
    gasWarning: 50,
    gasCritical: 150,
    aqiWarning: 100,
    aqiCritical: 200,
    notifyEmail: true,
    notifySms: false,
    autoVentilation: true
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data._id) {
          setSettings(data);
        }
      })
      .catch(err => console.error("Failed to load settings:", err));
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
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) setIsSaved(true);
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={28} color="var(--accent-teal)" /> System Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure alarm thresholds, notification channels, and automation rules.
        </p>
      </header>

      <form onSubmit={handleSave}>
        <div className="dash-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          
          {/* Thresholds Card */}
          <div className="card">
            <div className="card__header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <span className="card__label" style={{ fontSize: '0.85rem' }}><AlertTriangle size={18} /> Alert Thresholds</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ThresholdRow 
                label="Temperature (°C)" 
                nameBase="temp"
                valWarning={settings.tempWarning} 
                valCritical={settings.tempCritical} 
                onChange={handleChange} 
              />
              <ThresholdRow 
                label="CO₂ Level (ppm)" 
                nameBase="co2"
                valWarning={settings.co2Warning} 
                valCritical={settings.co2Critical} 
                onChange={handleChange} 
              />
              <ThresholdRow 
                label="Combustible Gas (ppm)" 
                nameBase="gas"
                valWarning={settings.gasWarning} 
                valCritical={settings.gasCritical} 
                onChange={handleChange} 
              />
              <ThresholdRow 
                label="Composite AQI" 
                nameBase="aqi"
                valWarning={settings.aqiWarning} 
                valCritical={settings.aqiCritical} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
            {/* Notifications Card */}
            <div className="card">
              <div className="card__header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <span className="card__label" style={{ fontSize: '0.85rem' }}><Bell size={18} /> Notification Channels</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="notifyEmail" checked={settings.notifyEmail} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send critical alerts to facility manager.</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" name="notifySms" checked={settings.notifySms} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>SMS Notifications</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Urgent texts for immediate evacuation events.</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Automation Card */}
            <div className="card">
              <div className="card__header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <span className="card__label" style={{ fontSize: '0.85rem' }}><Shield size={18} /> HVAC Automation</span>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="autoVentilation" checked={settings.autoVentilation} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Auto-Ventilation Control</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically trigger external fans via GPIO relay when AQI exceeds warning threshold.</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button 
            type="submit"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '12px 24px', background: isSaved ? 'var(--status-safe)' : 'var(--accent-blue)', 
              color: '#fff', borderRadius: 'var(--radius-sm)', 
              fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
              border: 'none', transition: 'all 0.3s'
            }}
          >
            <Save size={18} /> {isSaved ? 'Settings Applied' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Subcomponent for threshold inputs
function ThresholdRow({ label, nameBase, valWarning, valCritical, onChange }) {
  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--status-warning)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Warning Level</label>
          <input 
            type="number" 
            name={`${nameBase}Warning`}
            value={valWarning}
            onChange={onChange}
            className="settings-input"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-warning-border)', background: 'var(--status-warning-bg)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--status-danger)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Critical Level</label>
          <input 
            type="number" 
            name={`${nameBase}Critical`}
            value={valCritical}
            onChange={onChange}
            className="settings-input"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-danger-border)', background: 'var(--status-danger-bg)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
