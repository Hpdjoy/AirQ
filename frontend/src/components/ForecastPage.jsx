import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Area, AreaChart, ReferenceLine
} from 'recharts';
import {
  BrainCircuit, TrendingUp, TrendingDown, Minus, Clock, Zap,
  ShieldCheck, AlertTriangle, CloudFog, Activity, Gauge, Eye
} from 'lucide-react';

/**
 * 🧠 Forecast Page — LSTM-based Air Quality Prediction Visualization
 * Shows predicted PM2.5 values, trend analysis, and proactive alerts.
 */
export default function ForecastPage({ prediction, historyData, sensorData }) {
  const [mlHealth, setMlHealth] = useState(null);

  // Check ML service health on mount
  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/predictions/health`)
      .then(res => res.json())
      .then(data => setMlHealth(data))
      .catch(() => setMlHealth({ ml_service: 'offline' }));
  }, []);

  // Build forecast chart data from history + prediction
  const forecastChart = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    const points = historyData.slice(-20).map((d, i) => ({
      time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      pm25: d.dust?.density || 0,
      aqi: d.derived?.compositeAQI || 0,
      type: 'actual'
    }));

    // Add prediction points
    if (prediction) {
      const now = new Date();
      points.push({
        time: 'Now',
        pm25: prediction.current_pm25 || (sensorData?.dust?.density || 0),
        aqi: prediction.current_aqi || 0,
        predicted_pm25: prediction.current_pm25 || (sensorData?.dust?.density || 0),
        type: 'bridge'
      });
      points.push({
        time: '+30m',
        predicted_pm25: prediction.predicted_pm25_30m,
        type: 'forecast'
      });
      points.push({
        time: '+60m',
        predicted_pm25: prediction.predicted_pm25_60m,
        type: 'forecast'
      });
    }

    return points;
  }, [historyData, prediction, sensorData]);

  const trendIcon = prediction?.trend === 'rising'
    ? <TrendingUp size={18} />
    : prediction?.trend === 'falling'
      ? <TrendingDown size={18} />
      : <Minus size={18} />;

  const trendColor = prediction?.trend === 'rising'
    ? 'var(--status-danger)'
    : prediction?.trend === 'falling'
      ? 'var(--status-safe)'
      : 'var(--text-muted)';

  const getPM25Status = (val) => {
    if (val <= 12) return { label: 'Good', status: 'safe', color: 'var(--status-safe)' };
    if (val <= 35) return { label: 'Moderate', status: 'warning', color: 'var(--status-warning)' };
    if (val <= 55) return { label: 'Unhealthy (Sensitive)', status: 'warning', color: 'var(--accent-orange)' };
    return { label: 'Unhealthy', status: 'danger', color: 'var(--status-danger)' };
  };

  const predicted30Status = prediction ? getPM25Status(prediction.predicted_pm25_30m) : null;
  const predicted60Status = prediction ? getPM25Status(prediction.predicted_pm25_60m) : null;

  // Proactive alerts based on predictions
  const proactiveAlerts = useMemo(() => {
    if (!prediction) return [];
    const alerts = [];

    if (prediction.predicted_pm25_30m > 35) {
      alerts.push({
        severity: 'warning',
        message: `PM2.5 expected to reach ${prediction.predicted_pm25_30m.toFixed(1)} µg/m³ in 30 minutes`,
        action: 'Consider increasing ventilation or reducing indoor pollutant sources.'
      });
    }
    if (prediction.predicted_pm25_60m > 55) {
      alerts.push({
        severity: 'critical',
        message: `PM2.5 may exceed unhealthy levels (${prediction.predicted_pm25_60m.toFixed(1)} µg/m³) within 1 hour`,
        action: 'Immediate HVAC intervention recommended. Alert facility management.'
      });
    }
    if (prediction.trend === 'rising' && prediction.predicted_pm25_30m > prediction.current_pm25 * 1.3) {
      alerts.push({
        severity: 'info',
        message: 'Rapid air quality degradation trend detected',
        action: 'Monitor closely. Check for new emission sources in the facility.'
      });
    }
    if (prediction.trend === 'falling') {
      alerts.push({
        severity: 'good',
        message: 'Air quality is improving — predicted to decrease over the next hour',
        action: 'Current ventilation settings are effective.'
      });
    }

    return alerts;
  }, [prediction]);

  return (
    <div className="animate-in">
      {/* Page Header */}
      <header style={{ marginBottom: 'var(--gap-lg)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BrainCircuit size={28} color="var(--accent-purple)" /> Air Quality Forecast
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          LSTM neural network predictions for proactive air quality management.
        </p>
      </header>

      {/* ML Service Status Bar */}
      <div className="card" style={{ marginBottom: 'var(--gap-md)', padding: '12px var(--gap-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: mlHealth?.ml_service === 'online' ? 'var(--status-safe)' : 'var(--status-danger)',
            boxShadow: mlHealth?.ml_service === 'online' ? '0 0 8px rgba(5,150,105,0.4)' : '0 0 8px rgba(220,38,38,0.4)'
          }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            ML Service: <strong style={{ color: mlHealth?.ml_service === 'online' ? 'var(--status-safe)' : 'var(--status-danger)' }}>{mlHealth?.ml_service?.toUpperCase() || 'CHECKING...'}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span><Zap size={12} style={{ verticalAlign: 'middle' }} /> Model: {mlHealth?.model || 'LSTM'}</span>
          <span><Eye size={12} style={{ verticalAlign: 'middle' }} /> Status: {prediction?.status || 'waiting'}</span>
          <span><Clock size={12} style={{ verticalAlign: 'middle' }} /> Updated: {prediction?.timestamp ? new Date(prediction.timestamp).toLocaleTimeString() : '--:--'}</span>
        </div>
      </div>

      {/* Prediction Cards Row */}
      <div className="dash-section" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* Current PM2.5 */}
        <div className="card">
          <div className="card__header">
            <span className="card__label"><CloudFog size={16} /> Current PM2.5</span>
            <span className="card__badge card__badge--info">NOW</span>
          </div>
          <div className="card__value">
            {(prediction?.current_pm25 || sensorData?.dust?.density || 0).toFixed(1)}
            <span className="card__unit">µg/m³</span>
          </div>
          <div className="card__sublabel">Real-time measurement</div>
        </div>

        {/* 30-min Prediction */}
        <div className={`card card--${predicted30Status?.status || 'info'}`}>
          <div className="card__header">
            <span className="card__label"><Clock size={16} /> +30 Minutes</span>
            {predicted30Status && (
              <span className={`card__badge card__badge--${predicted30Status.status}`}>{predicted30Status.label}</span>
            )}
          </div>
          <div className="card__value" style={{ color: predicted30Status?.color || 'var(--text-primary)' }}>
            {prediction ? prediction.predicted_pm25_30m.toFixed(1) : '--'}
            <span className="card__unit">µg/m³</span>
          </div>
          <div className="card__sublabel" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: trendColor }}>{trendIcon}</span>
            {prediction?.trend || 'Awaiting data'}
          </div>
        </div>

        {/* 60-min Prediction */}
        <div className={`card card--${predicted60Status?.status || 'info'}`}>
          <div className="card__header">
            <span className="card__label"><Clock size={16} /> +60 Minutes</span>
            {predicted60Status && (
              <span className={`card__badge card__badge--${predicted60Status.status}`}>{predicted60Status.label}</span>
            )}
          </div>
          <div className="card__value" style={{ color: predicted60Status?.color || 'var(--text-primary)' }}>
            {prediction ? prediction.predicted_pm25_60m.toFixed(1) : '--'}
            <span className="card__unit">µg/m³</span>
          </div>
          <div className="card__sublabel">Extended forecast</div>
        </div>

        {/* Confidence */}
        <div className="card">
          <div className="card__header">
            <span className="card__label"><Gauge size={16} /> Confidence</span>
            <span className={`card__badge card__badge--${prediction?.status === 'success' ? 'safe' : 'warning'}`}>
              {prediction?.status === 'success' ? 'TRAINED' : 'SIMULATED'}
            </span>
          </div>
          <div className="card__value">
            {prediction ? Math.round(prediction.confidence * 100) : '--'}
            <span className="card__unit">%</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div className="progress-bar" style={{ height: '6px', borderRadius: '3px' }}>
              <div
                className={`progress-bar__fill progress-bar__fill--${prediction?.confidence > 0.8 ? 'safe' : 'warning'}`}
                style={{ width: `${prediction ? prediction.confidence * 100 : 0}%`, transition: 'width 1s ease' }}
              />
            </div>
          </div>
          <div className="card__sublabel">{prediction?.input_readings_count || 0} readings analyzed</div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="card animate-in animate-in-delay-1" style={{ marginBottom: 'var(--gap-md)' }}>
        <div className="card__header">
          <span className="card__label"><Activity size={16} /> PM2.5 Forecast Timeline</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.7rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--accent-blue)', borderRadius: '2px', display: 'inline-block' }} />
              Actual
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--accent-purple)', borderRadius: '2px', display: 'inline-block', borderStyle: 'dashed' }} />
              Predicted
            </span>
          </div>
        </div>

        <div style={{ height: '360px', width: '100%' }}>
          {forecastChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickMargin={10}
                  tick={{ fill: 'var(--text-secondary)' }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickFormatter={(val) => Math.round(val)}
                  label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: 'var(--text-muted)' } }}
                />
                {/* WHO guideline reference line */}
                <ReferenceLine y={35} stroke="var(--status-warning)" strokeDasharray="6 3" label={{ value: 'WHO Limit', position: 'right', fill: 'var(--status-warning)', fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card-hover)',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value, name) => {
                    const label = name === 'pm25' ? 'Actual PM2.5' : 'Predicted PM2.5';
                    return [value?.toFixed(1) + ' µg/m³', label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pm25"
                  stroke="var(--accent-blue)"
                  fill="url(#gradActual)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, stroke: 'var(--accent-blue)', strokeWidth: 2, fill: '#fff' }}
                  name="pm25"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="predicted_pm25"
                  stroke="var(--accent-purple)"
                  fill="url(#gradForecast)"
                  strokeWidth={2.5}
                  strokeDasharray="8 4"
                  dot={{ r: 4, fill: 'var(--accent-purple)', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: 'var(--accent-purple)', strokeWidth: 2, fill: '#fff' }}
                  name="predicted_pm25"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
              <BrainCircuit size={40} strokeWidth={1.5} />
              <span>Collecting sensor data for forecast generation...</span>
              <span style={{ fontSize: '0.75rem' }}>The model needs at least 3 data points to begin predictions.</span>
            </div>
          )}
        </div>
      </div>

      {/* Proactive Alerts */}
      <div className="card animate-in animate-in-delay-2" style={{ marginBottom: 'var(--gap-md)' }}>
        <div className="card__header">
          <span className="card__label"><ShieldCheck size={16} /> Proactive Alerts</span>
          <span className={`card__badge card__badge--${proactiveAlerts.some(a => a.severity === 'critical') ? 'danger' : proactiveAlerts.some(a => a.severity === 'warning') ? 'warning' : 'safe'}`}>
            {proactiveAlerts.length} {proactiveAlerts.length === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>

        {proactiveAlerts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {proactiveAlerts.map((alert, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${alert.severity === 'critical' ? 'var(--status-danger-border)' : alert.severity === 'warning' ? 'var(--status-warning-border)' : alert.severity === 'good' ? 'var(--status-safe-border)' : 'var(--status-info-border)'}`,
                background: alert.severity === 'critical' ? 'var(--status-danger-bg)' : alert.severity === 'warning' ? 'var(--status-warning-bg)' : alert.severity === 'good' ? 'var(--status-safe-bg)' : 'var(--status-info-bg)'
              }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {alert.severity === 'critical' ? <AlertTriangle size={18} color="var(--status-danger)" /> :
                    alert.severity === 'warning' ? <AlertTriangle size={18} color="var(--status-warning)" /> :
                      alert.severity === 'good' ? <ShieldCheck size={18} color="var(--status-safe)" /> :
                        <Activity size={18} color="var(--status-info)" />}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    💡 {alert.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <ShieldCheck size={32} strokeWidth={1.5} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div style={{ fontSize: '0.85rem' }}>No proactive alerts — air quality forecast is stable.</div>
          </div>
        )}
      </div>

      {/* Model Info */}
      <div className="dash-section animate-in animate-in-delay-3">
        <div className="card">
          <div className="card__header">
            <span className="card__label"><BrainCircuit size={16} /> Model Architecture</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Type</span><span>LSTM (Long Short-Term Memory)</span>
              <span style={{ color: 'var(--text-muted)' }}>Layers</span><span>2× LSTM(50) + Dropout(0.2) + Dense(25) + Dense(1)</span>
              <span style={{ color: 'var(--text-muted)' }}>Input</span><span>12 timesteps × 5 features (Temp, Humidity, PM2.5, CO₂, Gas)</span>
              <span style={{ color: 'var(--text-muted)' }}>Output</span><span>PM2.5 prediction (30 min + 60 min lookahead)</span>
              <span style={{ color: 'var(--text-muted)' }}>Scaler</span><span>MinMaxScaler [0, 1]</span>
              <span style={{ color: 'var(--text-muted)' }}>Training</span><span>5 epochs, batch size 32, Adam optimizer</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card__header">
            <span className="card__label"><Zap size={16} /> How It Works</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Every 60s, the backend collects the last 12 sensor readings from MongoDB.</li>
              <li>Readings are normalized and sent to the Python LSTM inference service.</li>
              <li>The trained neural network predicts PM2.5 levels 30 & 60 minutes ahead.</li>
              <li>Predictions are broadcast to all dashboards in real-time via WebSocket.</li>
              <li>Proactive alerts are generated when forecasts exceed health thresholds.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
