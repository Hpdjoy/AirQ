import { useState, useRef } from 'react';
import { HardDrive, Upload, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function FirmwarePage({ devices = [] }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const primaryDevice = devices.find(d => d.id === 'NODE-ESP32-1') || {};
  const currentFirmware = primaryDevice.firmware || 'v2.1.4'; // Fallback

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    validateAndSetFile(dropped);
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile && selectedFile.name.endsWith('.bin')) {
      setFile(selectedFile);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Only .bin firmware files allowed' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('firmware', file);
    formData.append('targetDevice', 'NODE-ESP32-1');
    formData.append('version', file.name.replace('.bin', ''));

    try {
      const res = await fetch('http://localhost:5000/api/firmware/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setFile(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to contact update server' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HardDrive size={28} color="var(--accent-cyan)" /> Firmware Management
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          OTA (Over-The-Air) firmware updates and deployment tracking for distributed hardware nodes.
        </p>
      </header>

      <div className="dashboard__row-full" style={{ display: 'flex', gap: 'var(--gap-lg)', flexWrap: 'wrap' }}>
        
        {/* Left Column: Update Console */}
        <div style={{ flex: '2', minWidth: '350px' }}>
          <div className="card">
            <div className="card__header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <span className="card__label" style={{ fontSize: '0.85rem' }}><Upload size={18} /> Deploy New Firmware</span>
            </div>

            <div 
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                border: `2px dashed ${file ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`, 
                borderRadius: 'var(--radius-md)', padding: '40px 20px', textAlign: 'center', 
                background: file ? 'rgba(8, 145, 178, 0.05)' : 'var(--bg-primary)', 
                marginBottom: '24px', cursor: 'pointer', transition: 'all 0.2s' 
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".bin" 
                style={{ display: 'none' }} 
                onChange={(e) => validateAndSetFile(e.target.files[0])}
              />
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(8, 145, 178, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Upload size={24} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>
                {file ? file.name : 'Click or Drag & Drop .bin file here'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB — Ready to flash` : 'Only signed binaries are accepted (max 3MB).'}
              </div>
            </div>

            {file && (
              <button 
                onClick={handleUpload}
                disabled={uploading}
                style={{ width: '100%', padding: '12px', background: 'var(--accent-cyan)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: uploading ? 'wait' : 'pointer', marginBottom: '24px' }}
              >
                {uploading ? 'Pushing Firmware to Device...' : 'Initiate OTA Update'}
              </button>
            )}

            {message && (
              <div style={{ padding: '12px', borderRadius: '4px', marginBottom: '24px', background: message.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-safe-bg)', color: message.type === 'error' ? 'var(--status-danger)' : 'var(--status-safe)', fontWeight: 500, fontSize: '0.9rem' }}>
                {message.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(5, 150, 105, 0.05)', border: '1px solid var(--status-safe-border)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={24} color="var(--status-safe)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Secure OTA Enabled</strong> — Connected endpoints support encrypted Over-The-Air updates with rollback on failure.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fleet Status */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div className="card" style={{ height: '100%' }}>
            <div className="card__header" style={{ marginBottom: '20px' }}>
              <span className="card__label"><HardDrive size={16} /> Fleet Version Map</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{currentFirmware}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest Deployed</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-safe)', fontWeight: 600, fontSize: '0.9rem' }}>
                  1 Node <CheckCircle2 size={16} />
                </div>
              </div>

              <div className="progress-bar" style={{ height: '6px', marginTop: '4px', marginBottom: '16px' }}>
                <div className="progress-bar__fill progress-bar__fill--safe" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
