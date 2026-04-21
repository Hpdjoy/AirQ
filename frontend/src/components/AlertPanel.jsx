import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { timeAgo } from '../utils/helpers';

/**
 * Alert Panel — Shows active alerts with severity icons
 */
export default function AlertPanel({ alerts = [], onAcknowledge }) {
  const SeverityIcon = ({ severity }) => {
    const props = { size: 18, strokeWidth: 2 };
    switch (severity) {
      case 'critical':
        return <AlertCircle {...props} className="alert-item__icon alert-item__icon--critical" />;
      case 'warning':
        return <AlertTriangle {...props} className="alert-item__icon alert-item__icon--warning" />;
      default:
        return <Info {...props} className="alert-item__icon alert-item__icon--info" />;
    }
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="card">
      <div className="card__header">
        <span className="card__label">
          <AlertCircle size={16} />
          Active Alerts
        </span>
        <span className={`card__badge ${activeAlerts.length > 0 ? 'card__badge--danger' : 'card__badge--safe'}`}>
          {activeAlerts.length > 0 ? `${activeAlerts.length} active` : 'all clear'}
        </span>
      </div>

      <div className="alert-panel">
        {activeAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} style={{ marginBottom: '8px', color: 'var(--status-safe)' }} />
            <div>All systems normal</div>
          </div>
        ) : (
          activeAlerts.slice(0, 10).map((alert, idx) => (
            <div
              key={alert._id || idx}
              className={`alert-item alert-item--${alert.severity}`}
              onClick={() => onAcknowledge && onAcknowledge(alert._id)}
              title="Click to acknowledge"
            >
              <SeverityIcon severity={alert.severity} />
              <div>
                <div className="alert-item__message">{alert.message}</div>
                <div className="alert-item__time">{timeAgo(alert.timestamp || alert.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
