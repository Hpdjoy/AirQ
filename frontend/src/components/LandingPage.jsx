import { useState } from 'react';
import {
  Activity,
  Bell,
  Brain,
  ChartNoAxesCombined,
  Cpu,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Wind,
  ArrowRight
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onLoginComplete }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // for signup
  const [loading, setLoading] = useState(false);

  const featureCards = [
    {
      icon: Activity,
      title: 'Live Air Quality Monitoring',
      text: 'Track temperature, humidity, gas concentration, and particulate metrics in real time.'
    },
    {
      icon: Bell,
      title: 'Rule-Based Alerts',
      text: 'Receive instant threshold breach alerts with acknowledgment tracking and alert history.'
    },
    {
      icon: ChartNoAxesCombined,
      title: 'Historical Analytics',
      text: 'Explore trends, compare time windows, and generate actionable insights from stored telemetry.'
    },
    {
      icon: Cpu,
      title: 'Connected Device Control',
      text: 'Manage connected nodes, calibrate sensors, and send command actions from one interface.'
    }
  ];

  const stackHighlights = [
    {
      icon: Brain,
      title: 'Smart Alert Engine',
      text: 'Derived metrics and adaptive alert logic for safer indoor environments.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Access Layer',
      text: 'Cookie-backed auth with role-aware access to monitoring and control pages.'
    },
    {
      icon: Wind,
      title: 'MQTT + WebSocket Flow',
      text: 'Low-latency data transport from hardware nodes to dashboard visualizations.'
    },
    {
      icon: ChartNoAxesCombined,
      title: 'Report-Ready Data',
      text: 'Exportable history datasets for project review, compliance, and documentation.'
    }
  ];

  const jumpTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
    <div className="landing">
      <div className="air-bg air-bg--one" aria-hidden="true" />
      <div className="air-bg air-bg--two" aria-hidden="true" />
      <div className="air-pattern" aria-hidden="true" />
      <div className="air-flow" aria-hidden="true" />
      <div className="air-orb air-orb--one" aria-hidden="true" />
      <div className="air-orb air-orb--two" aria-hidden="true" />

      <header className="landing-header">
        <div className="landing-brand">
          <Wind size={24} />
          AirQ
        </div>
        <nav className="landing-nav">
          <button onClick={() => jumpTo('features')}>Features</button>
          <button onClick={() => jumpTo('platform')}>Platform</button>
          <button className="landing-nav-cta" onClick={() => jumpTo('auth-portal')}>
            Get Started
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="hero-chip">AIRQ MONITORING PLATFORM</p>
          <h1>
            Real-Time Environmental Intelligence
            <span> for Smarter Indoor Spaces.</span>
          </h1>
          <p className="hero-copy">
            AirQ helps you capture, visualize, and act on sensor data with a streamlined dashboard
            for monitoring, alerts, analytics, reports, and device operations.
          </p>
          <div className="hero-actions">
            <button className="hero-primary" onClick={() => jumpTo('auth-portal')}>
              Access Dashboard <ArrowRight size={16} />
            </button>
            <button className="hero-secondary" onClick={() => jumpTo('features')}>
              Explore Features
            </button>
          </div>
        </section>

        <section id="features" className="section-block">
          <h2>Features</h2>
          <div className="features-grid">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="feature-card">
                  <div className="feature-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="platform" className="section-block">
          <h2>Platform Highlights</h2>
          <div className="team-grid">
            {stackHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="team-card team-card--stack">
                  <div className="stack-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-block guidance-block">
          <h2>Built For Your Final Year Project</h2>
          <p>
            From data ingestion to dashboard visualization, AirQ is structured to demonstrate
            complete IoT workflow implementation with measurable outcomes and report-friendly exports.
          </p>
          <p>
            The platform is designed to be extendable, so you can keep improving models,
            thresholds, and control logic as your project scope evolves.
          </p>
        </section>

        <section className="section-block metrics-strip">
          <h2>What AirQ Helps You Achieve</h2>
          <div className="gallery-grid">
            {['Faster response to unsafe conditions', 'Clear data-driven insights', 'Reliable monitoring visibility'].map((item) => (
              <article key={item} className="value-card">
                <p>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="auth-portal" className="auth-wrap">
          <div className="auth-highlight">
            <h2>{isLoginMode ? 'Access The AirQ Dashboard' : 'Create Your AirQ Account'}</h2>
            <p>
              Secure login protects monitoring and control operations.
              Sign in to continue with live telemetry and analytics workflows.
            </p>
            <ul>
              <li><Lock size={16} /> Cookie-backed session validation</li>
              <li><Wind size={16} /> Live telemetry command routing</li>
              <li><Activity size={16} /> Alert-aware monitoring operations</li>
            </ul>
          </div>

          <div className="auth-form-panel">
            <h3>{isLoginMode ? 'Welcome Back' : 'Join AirQ'}</h3>
            <p>{isLoginMode ? 'Sign in to continue.' : 'Create your account to get started.'}</p>

            <form onSubmit={handleAuth} className="auth-form">
              {!isLoginMode && (
                <label className="auth-input-wrap">
                  <User size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                  />
                </label>
              )}

              <label className="auth-input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                />
              </label>

              <label className="auth-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </label>

              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? 'Validating...' : isLoginMode ? 'Log In' : 'Create Account'}
                <ArrowRight size={16} />
              </button>
            </form>

            <button className="auth-switch" onClick={() => setIsLoginMode(!isLoginMode)}>
              {isLoginMode ? 'Need an account? Sign up' : 'Already have an account? Log in'}
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div>
          <h3>AirQ</h3>
          <p>Intelligent air quality monitoring for connected spaces.</p>
        </div>
        <div className="footer-contact">
          <p><Mail size={14} /> hpdjoy@gmail.com</p>
          <p><Phone size={14} /> +91 9708128569</p>
          <p><MapPin size={14} /> Bhubaneswar, Odisha, India</p>
        </div>
      </footer>
    </div>
  );
}
