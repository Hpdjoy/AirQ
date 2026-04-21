import { useState } from 'react';
import { Shield, Activity, Share2, Wind, Lock, ArrowRight, User } from 'lucide-react';

export default function LandingPage({ onLoginComplete }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // for signup
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = isLoginMode ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/signup';
    const payload = isLoginMode ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        // Set cookie manually
        document.cookie = `airq_token=${data.token}; path=/; max-age=86400; samesite=strict`;
        // Trigger completion callback lifting state up to App.jsx
        onLoginComplete(data.user);
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (err) {
      alert("Network Error: Backend is down or unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', overflowX: 'hidden' }}>
      
      {/* Navbar Minimal */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 5%', background: '#fff', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wind size={26} color="var(--accent-blue)" /> AirQ Platform
        </div>
        <div>
          <button style={{ background: 'transparent', border: 'none', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '24px' }}>Documentation</button>
          <button 
            onClick={() => {
              const el = document.getElementById('auth-portal');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ padding: '10px 24px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s' }}
          >
            Access Portal
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: '4rem 5%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4rem' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '800px', animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px' }}>
            <Activity size={14} /> End-to-End Industrial Solution
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1px' }}>
            Next-Generation <span style={{ color: 'var(--accent-blue)' }}>IoT Sensory</span> Environments.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
            Built inherently for Final Year Project academic evaluation, the AirQ environment implements structural MQTT telemetry, OTA ESP32 configuration updates, and full Restful DB tracking algorithms securely.
          </p>
        </div>

        {/* Auth Module Split */}
        <div id="auth-portal" style={{ display: 'flex', width: '100%', maxWidth: '1000px', background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          
          {/* Information Panel */}
          <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)', color: '#fff', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>Secure Enterprise Telemetry</h2>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '32px' }}>
              Authentication guarantees system integrity. Manage devices, adjust machine learning triggers, and generate compliance reports natively with Zero-Trust architectural models.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, fontSize: '0.9rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}><Shield size={18} /></div>
                Native SHA-256 Hashed Passwords
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, fontSize: '0.9rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}><Share2 size={18} /></div>
                Hardware MQTT Bridge Protections
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, fontSize: '0.9rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}><Lock size={18} /></div>
                Strict Document Cookie Validation
              </li>
            </ul>
          </div>

          {/* Form Panel */}
          <div style={{ flex: 1, padding: '4rem 3rem', background: '#fff' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {isLoginMode ? 'Welcome Back.' : 'Initialize Profile.'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isLoginMode ? 'Enter credentials to safely connect to the monitoring loop.' : 'Register system keys to unlock the hardware telemetry systems.'}
              </p>
            </div>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isLoginMode && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Identity Configuration</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" required value={name} onChange={e => setName(e.target.value)}
                      placeholder="Enter Full Name" 
                      style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.95rem', color: 'var(--text-primary)' }} 
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Email Node</label>
                <div style={{ position: 'relative' }}>
                  <Wind size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="user@university.edu" 
                    style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.95rem', color: 'var(--text-primary)' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Secure Matrix Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.95rem', color: 'var(--text-primary)' }} 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ width: '100%', padding: '14px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Validating...' : (isLoginMode ? 'Authenticate Link' : 'Register Secure Connection')} <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <button 
                onClick={() => setIsLoginMode(!isLoginMode)}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {isLoginMode ? 'No account mapping? Register here.' : 'Already have secure keys? Authenticate here.'}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
