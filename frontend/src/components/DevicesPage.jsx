import { useState } from 'react';
import { Cpu, Wifi, Activity, HardDrive, RefreshCw, Power, Zap, BarChart2 } from 'lucide-react';
import { formatTimeShort } from '../utils/helpers';

export default function DevicesPage({ devices = [], emitCommand }) {
  const [loadingAction, setLoadingAction] = useState(null);

  const displayDevices = devices.length > 0 ? devices : [];
  
  // Simulated addition just for the demo if only the mock Node exists
  if (displayDevices.length === 1 && displayDevices[0].id === 'NODE-ESP32-1') {
    displayDevices.push({
      id: 'NODE-ESP32-2',
      name: 'Exhaust Vent Monitor',
      location: 'Zone B - Storage',
      type: 'AirQ Mini',
      status: 'offline',
      lastSeen: '2 hours ago',
      ip: '192.168.1.107',
      mac: '24:0A:C4:F2:18:B7',
      firmware: 'v2.1.3',
      signal: -85,
      sensors: ['MQ2']
    });
  }

  const handleCommand = (deviceId, command) => {
    if (!window.confirm(`Are you sure you want to send the [${command}] command to ${deviceId}?`)) return;
    
    setLoadingAction(`${deviceId}-${command}`);
    emitCommand('device_command', { deviceId, cmd: command });
    
    // Simulate UI loading resolution after sending
    setTimeout(() => {
      setLoadingAction(null);
      alert(`Command [${command}] successfully dispatched to ${deviceId}.`);
    }, 1200);
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu size={28} color="var(--accent-purple)" /> Connected Devices
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Hardware endpoint health, connectivity, and remote management.
          </p>
        </div>
        <button style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <RefreshCw size={14} /> Rescan Network
        </button>
      </header>

      <div className="dash-section">
        {displayDevices.map((device, i) => (
          <div key={device.id} className={`card ${device.status === 'online' ? 'card--safe' : 'card--danger'}`} style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="card__header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={`icon-wrap ${device.status === 'online' ? 'icon-wrap--green' : 'icon-wrap--red'}`}>
                  <HardDrive size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{device.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{device.id}</div>
                </div>
              </div>
              <span className={`card__badge card__badge--${device.status === 'online' ? 'safe' : 'danger'}`}>
                {device.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>IP Address</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{device.ip}</div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>MAC Address</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{device.mac}</div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Firmware</div>
                <div style={{ fontWeight: 500 }}>{device.firmware}</div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wifi size={12} /> Signal Info
                </div>
                <div style={{ fontWeight: 500 }}>{device.signal} dBm</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>
                Active Sensors
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {device.sensors.map(sensor => (
                  <span key={sensor} style={{ padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {sensor}
                  </span>
                ))}
              </div>
            </div>

            {/* ACTION ROW */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: '16px' }}>
              <button 
                onClick={() => handleCommand(device.id, 'ping')}
                disabled={device.status !== 'online' || loadingAction}
                style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: device.status === 'online' ? 'pointer' : 'not-allowed', opacity: device.status === 'online' ? 1 : 0.5, color: 'var(--text-primary)' }}
              >
                <Activity size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>{loadingAction === `${device.id}-ping` ? '...' : 'Ping Node'}</span>
              </button>
              
              <button 
                onClick={() => handleCommand(device.id, 'calibrate')}
                disabled={device.status !== 'online' || loadingAction}
                style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: device.status === 'online' ? 'pointer' : 'not-allowed', opacity: device.status === 'online' ? 1 : 0.5, color: 'var(--text-primary)' }}
              >
                <RefreshCw size={16} color="var(--status-warning)" />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>{loadingAction === `${device.id}-calibrate` ? '...' : 'Calibrate'}</span>
              </button>

              <button 
                onClick={() => handleCommand(device.id, 'reboot')}
                disabled={device.status !== 'online' || loadingAction}
                style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', background: 'var(--status-danger)', border: 'none', borderRadius: '6px', cursor: device.status === 'online' ? 'pointer' : 'not-allowed', opacity: device.status === 'online' ? 1 : 0.5, color: '#fff' }}
              >
                <Power size={16} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textAlign: 'center' }}>{loadingAction === `${device.id}-reboot` ? '...' : 'Reboot'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} /> Last sync: {typeof device.lastSeen === 'string' && device.lastSeen.includes('ago') ? device.lastSeen : formatTimeShort(new Date(device.lastSeen))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
