import { Map, Layers, DoorOpen, HardDrive, AlertTriangle } from 'lucide-react';

export default function ZonesPage({ isConnected, sensorData, alerts }) {
  const activeAlerts = alerts?.filter(a => !a.acknowledged) || [];
  const hasLabAlert = activeAlerts.length > 0;

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Map size={28} color="var(--accent-indigo)" /> Zones & Floors
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Facility overview and physical placement of sensor matrices.
        </p>
      </header>

      <div className="dashboard__row-full" style={{ display: 'flex', gap: 'var(--gap-lg)', flexWrap: 'wrap' }}>
        
        {/* Left Column: List of Zones */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          <div className="card">
            <div className="card__header">
              <span className="card__label"><Layers size={16} /> Facility Group 1</span>
            </div>
            
            {/* Zone A */}
            <div style={{ 
              padding: '16px', borderRadius: 'var(--radius-sm)', 
              border: `1px solid ${hasLabAlert ? 'var(--status-danger-border)' : 'var(--accent-indigo)'}`, 
              background: hasLabAlert ? 'var(--status-danger-bg)' : 'rgba(79, 70, 229, 0.05)',
              marginBottom: '12px', cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: hasLabAlert ? 'var(--status-danger)' : 'var(--accent-indigo)' }}>
                    <DoorOpen size={16} /> Zone A - Main Lab
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ground Floor, Sector 4</div>
                </div>
                <span className={`card__badge card__badge--${hasLabAlert ? 'danger' : 'safe'}`}>
                  {hasLabAlert ? 'ALERT ACTIVE' : 'SECURE'}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <HardDrive size={14} /> 1 Active Node
                </div>
                <div style={{ paddingLeft: '12px', borderLeft: '1px solid var(--border-subtle)' }}>
                  AQI: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sensorData?.derived?.compositeAQI || '--'}</span>
                </div>
              </div>
            </div>

            {/* Zone B */}
            <div style={{ 
              padding: '16px', borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)',
              opacity: 0.7
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <DoorOpen size={16} /> Zone B - Storage
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Basement Level 1</div>
                </div>
                <span className="card__badge" style={{ background: '#e2e8f0', color: 'var(--text-secondary)' }}>
                  OFFLINE
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-danger)' }}>
                  <AlertTriangle size={14} /> Node Unreachable
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Visual Map Mockup */}
        <div style={{ flex: '2', minWidth: '400px' }} className="card">
          <div className="card__header">
            <span className="card__label"><Map size={16} /> Floor Plan Schematic</span>
          </div>
          
          <div style={{ 
            width: '100%', height: '400px', backgroundColor: 'var(--bg-primary)', 
            borderRadius: 'var(--radius-md)', border: '2px dashed var(--border-subtle)',
            position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {/* Grid background */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }} />
            
            {/* Rooms */}
            <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40%', height: '40%', border: '3px solid var(--text-muted)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Offices
            </div>
            
            <div style={{ 
              position: 'absolute', top: '10%', right: '10%', width: '35%', height: '80%', 
              border: `3px solid ${hasLabAlert ? 'var(--status-danger)' : 'var(--accent-indigo)'}`, 
              background: hasLabAlert ? 'rgba(220, 38, 38, 0.05)' : 'rgba(79, 70, 229, 0.05)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontWeight: 800, color: hasLabAlert ? 'var(--status-danger)' : 'var(--text-primary)' }}>Zone A (Lab)</span>
              
              {/* Sensor Node Ping */}
              <div style={{ marginTop: '20px', position: 'relative' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isConnected ? (hasLabAlert ? 'var(--status-danger)' : 'var(--status-safe)') : 'var(--text-muted)', position: 'relative', zIndex: 2 }} />
                {isConnected && (
                  <div style={{ position: 'absolute', top: '-8px', left: '-8px', width: '32px', height: '32px', borderRadius: '50%', background: hasLabAlert ? 'var(--status-danger)' : 'var(--status-safe)', opacity: 0.3, animation: 'pulse 2s infinite', zIndex: 1 }} />
                )}
              </div>
              <span style={{ fontSize: '0.65rem', marginTop: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NODE-ESP32-1</span>
            </div>

            <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '40%', height: '35%', border: '3px solid var(--text-muted)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Zone B (Storage)</span>
              <div style={{ position: 'absolute', top: '20px', right: '20px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--status-danger)', opacity: 0.5 }} />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
