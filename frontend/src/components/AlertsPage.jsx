import {
  Bell, AlertCircle, AlertTriangle, Info, CheckCircle2,
  Filter, Search, X, ChevronDown
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { timeAgo } from '../utils/helpers';

/**
 * Full Alerts Page — Filterable alert list with severity controls
 */
export default function AlertsPage({ alerts = [], onAcknowledge }) {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
      if (!showAcknowledged && alert.acknowledged) return false;
      if (searchQuery && !alert.message?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [alerts, filterSeverity, showAcknowledged, searchQuery]);

  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter(a => !a.acknowledged).length,
    critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
  }), [alerts]);

  const SeverityIcon = ({ severity, size = 16 }) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={size} style={{ color: 'var(--status-danger)' }} />;
      case 'warning':
        return <AlertTriangle size={size} style={{ color: 'var(--status-warning)' }} />;
      default:
        return <Info size={size} style={{ color: 'var(--status-info)' }} />;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Alerts</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monitor and manage system alerts from all sensors</p>
      </div>

      {/* Stats Row */}
      <div className="mini-grid" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-wrap icon-wrap--blue"><Bell size={18} /></div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-wrap icon-wrap--yellow"><AlertTriangle size={18} /></div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.active}</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-wrap icon-wrap--red"><AlertCircle size={18} /></div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Critical</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.critical}</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-wrap icon-wrap--green"><CheckCircle2 size={18} /></div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolved</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{stats.total - stats.active}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'var(--font-sans)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>
          {['all', 'critical', 'warning', 'info'].map(sev => (
            <button
              key={sev}
              className={`chart-tab ${filterSeverity === sev ? 'chart-tab--active' : ''}`}
              onClick={() => setFilterSeverity(sev)}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan)' }}
            />
            Show acknowledged
          </label>
        </div>
      </div>

      {/* Alert List */}
      <div className="card">
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} style={{ marginBottom: '12px', color: 'var(--status-safe)' }} />
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>No alerts found</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>All systems operating normally</div>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <div
              key={alert._id || idx}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderBottom: idx < filteredAlerts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                cursor: 'pointer', transition: 'background 0.15s ease',
                opacity: alert.acknowledged ? 0.5 : 1
              }}
              onClick={() => !alert.acknowledged && onAcknowledge?.(alert._id)}
              title={alert.acknowledged ? 'Acknowledged' : 'Click to acknowledge'}
            >
              <SeverityIcon severity={alert.severity} size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{alert.message}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {alert.metric} · {alert.sensorId} · {timeAgo(alert.timestamp || alert.createdAt)}
                </div>
              </div>
              {alert.acknowledged ? (
                <span className="card__badge card__badge--safe" style={{ fontSize: '0.6rem' }}>Ack'd</span>
              ) : (
                <span className={`card__badge card__badge--${alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}`} style={{ fontSize: '0.6rem' }}>
                  {alert.severity}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
