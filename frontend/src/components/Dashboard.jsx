import { useState, useEffect } from 'react';
import {
  BarChart3, Thermometer, Droplets, Wind, Users, Factory,
  Flame, FlaskConical, TestTube2, Leaf, CloudFog,
  ShieldAlert, Heart, Smile, Meh, Frown,
  ThermometerSun, Fan, BrainCircuit, TrendingUp, TrendingDown, Minus, Clock,
  Volume2, VolumeX, Bell, BellOff, AlertTriangle
} from 'lucide-react';
import MetricCard from './MetricCard';
import GaugeCard from './GaugeCard';
import AlertPanel from './AlertPanel';
import RealtimeChart from './RealtimeChart';
import RiskGauge from './RiskGauge';
import { getAQIStatus, getCO2Status, getGasStatus, getDustStatus, getTempStatus, getHumidityStatus, formatTime, fetchSettings } from '../utils/helpers';

// Comfort icon helper
function ComfortIcon({ level }) {
  if (level === 'comfortable') return <Smile size={16} />;
  if (level === 'moderate') return <Meh size={16} />;
  return <Frown size={16} />;
}

/**
 * Main Dashboard Layout
 * Assembles all components into the industrial monitoring interface
 */
export default function Dashboard({ sensorData, alerts, historyData, isConnected, onAcknowledge, onRequestHistory, prediction }) {
  const d = sensorData;

  // Load threshold settings from backend
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);

  const aqiInfo = d ? getAQIStatus(d.derived?.compositeAQI || 0, settings) : { label: '--', status: 'info', color: '#2563eb' };
  const co2Info = d ? getCO2Status(d.mq135?.co2_ppm || 0, settings) : { label: '--', status: 'info' };
  const gasInfo = d ? getGasStatus(d.mq2?.ppm || 0, settings) : { label: '--', status: 'info' };

  const roomCapacity = 20;
  const occupancy = d?.derived?.estimatedOccupancy || 0;
  const occupancyPercent = Math.min(100, Math.round((occupancy / roomCapacity) * 100));
  const occupancyStatus = occupancyPercent < 60 ? 'safe' : occupancyPercent < 85 ? 'warning' : 'danger';

  return (
    <div>
      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header__title">
          <div className="header__logo">
            <Factory size={22} />
          </div>
          <div>
            <div className="header__name">AirQ Industrial Monitor</div>
            <div className="header__subtitle">Indoor Air Quality Dashboard</div>
          </div>
        </div>
        <div className="header__status">
          <span className="header__live-dot" style={{ background: isConnected ? 'var(--status-safe)' : 'var(--status-danger)' }} />
          <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginLeft: '12px' }}>
            {d ? formatTime(d.timestamp) : '--:--:--'}
          </span>
        </div>
      </header>

      {/* ===== SECTION 1: Primary Metrics ===== */}
      <div className="dash-section animate-in">
        <div className={`card card--${aqiInfo.status} dash-section__aqi`}>
          <div className="card__header">
            <span className="card__label"><BarChart3 size={16} /> Composite AQI</span>
            <span className={`card__badge card__badge--${aqiInfo.status}`}>{aqiInfo.label}</span>
          </div>
          <GaugeCard
            value={d?.derived?.compositeAQI || 0}
            max={500}
            unit="AQI"
            size={130}
            strokeWidth={10}
            color={aqiInfo.color}
          />
        </div>

        <MetricCard
          label="Temperature"
          icon={<Thermometer size={16} />}
          value={d?.dht11?.temperature}
          unit="°C"
          status={d ? getTempStatus(d.dht11?.temperature || 0, settings).status : 'safe'}
          sublabel={`Heat Index: ${d?.dht11?.heatIndex || '--'}°C`}
        />

        <MetricCard
          label="Humidity"
          icon={<Droplets size={16} />}
          value={d?.dht11?.humidity}
          unit="%"
          status={d ? getHumidityStatus(d.dht11?.humidity || 0, settings).status : 'safe'}
          sublabel={`Dew Point: ${d?.dht11?.dewPoint || '--'}°C`}
        />

        <MetricCard
          label="Dust (PM)"
          icon={<CloudFog size={16} />}
          value={d?.dust?.density}
          unit="µg/m³"
          status={d ? getDustStatus(d.dust?.density || 0, settings).status : 'safe'}
          sublabel={`AQI: ${d?.dust?.aqi || '--'}`}
        />

        <div className={`card card--${occupancyStatus}`}>
          <div className="card__header">
            <span className="card__label"><Users size={16} /> Occupancy Est.</span>
            <span className={`card__badge card__badge--${occupancyStatus}`}>
              {occupancy}/{roomCapacity}
            </span>
          </div>
          <div className="card__value">~{occupancy}<span className="card__unit">people</span></div>
          <div className="progress-bar">
            <div
              className={`progress-bar__fill progress-bar__fill--${occupancyStatus}`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          <div className="card__sublabel">{occupancyPercent}% capacity</div>
        </div>
      </div>

      {/* ===== SECTION 2: MQ135 Gas Panels ===== */}
      <div className="dash-section animate-in animate-in-delay-1">
        <MetricCard
          label="CO₂ Level"
          icon={<Wind size={16} />}
          value={d?.mq135?.co2_ppm}
          unit="ppm"
          status={co2Info.status}
          sublabel={`Ventilation: ${d?.mq135?.ventilationBand || '--'}`}
        />
        <MetricCard
          label="NO₂ Level"
          icon={<FlaskConical size={16} />}
          value={d?.mq135?.no2_ppm}
          unit="ppm"
          status={d?.mq135?.no2_ppm > 0.2 ? 'danger' : d?.mq135?.no2_ppm > 0.1 ? 'warning' : 'safe'}
          sublabel="WHO Limit: 0.1 ppm"
        />
        <MetricCard
          label="NH₃ Level"
          icon={<TestTube2 size={16} />}
          value={d?.mq135?.nh3_ppm}
          unit="ppm"
          status={d?.mq135?.nh3_ppm > 50 ? 'danger' : d?.mq135?.nh3_ppm > 25 ? 'warning' : 'safe'}
          sublabel="OSHA Limit: 50 ppm"
        />
        <MetricCard
          label="VOC Index"
          icon={<Leaf size={16} />}
          value={d?.mq135?.vocIndex}
          unit="/100"
          status={d?.mq135?.vocIndex > 60 ? 'warning' : 'safe'}
          sublabel="Volatile Organics"
        />
      </div>

      {/* ===== SECTION 3: MQ2 + Comfort ===== */}
      <div className="dash-section animate-in animate-in-delay-2">
        <MetricCard
          label="Combustible Gas"
          icon={<Flame size={16} />}
          value={d?.mq2?.ppm}
          unit="ppm"
          status={gasInfo.status}
          sublabel={`Level: ${d?.mq2?.smokeLevel || '--'}`}
        />
        <MetricCard
          label="Smoke Risk"
          icon={<ShieldAlert size={16} />}
          value={d?.mq2?.smokeLevel?.toUpperCase()}
          status={d?.mq2?.smokeLevel === 'danger' ? 'danger' : d?.mq2?.smokeLevel === 'warning' ? 'warning' : 'safe'}
          sublabel={`Raw: ${d?.mq2?.raw || '--'}`}
        />
        <MetricCard
          label="Heat Index"
          icon={<ThermometerSun size={16} />}
          value={d?.dht11?.heatIndex}
          unit="°C"
          status={d?.dht11?.heatIndex > 35 ? 'danger' : d?.dht11?.heatIndex > 30 ? 'warning' : 'safe'}
          sublabel="Apparent Temperature"
        />
        <MetricCard
          label="Comfort"
          icon={<ComfortIcon level={d?.derived?.comfortLevel} />}
          value={d?.derived?.comfortLevel?.toUpperCase() || '--'}
          status={d?.derived?.comfortLevel === 'hazardous' ? 'danger' : d?.derived?.comfortLevel === 'uncomfortable' ? 'warning' : 'safe'}
          sublabel={`Ventilation: ${d?.derived?.ventilationStatus || '--'}`}
        />
      </div>

      {/* ===== SECTION 4: Chart ===== */}
      <div className="animate-in animate-in-delay-3" style={{ marginBottom: 'var(--gap-md)' }}>
        <RealtimeChart historyData={historyData} onRequestHistory={onRequestHistory} />
      </div>

      {/* ===== SECTION 4.5: AI Forecast Widget ===== */}
      {prediction && (
        <div className="card animate-in animate-in-delay-3" style={{ marginBottom: 'var(--gap-md)', background: 'linear-gradient(135deg, rgba(124,58,237,0.04), rgba(8,145,178,0.04))' }}>
          <div className="card__header">
            <span className="card__label"><BrainCircuit size={16} /> AI Forecast — PM2.5</span>
            <span className={`card__badge card__badge--${prediction.status === 'success' ? 'safe' : 'info'}`}>
              {prediction.status === 'success' ? 'LSTM' : 'SIMULATED'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> +30 Minutes
              </div>
              <div className="card__value" style={{ fontSize: '1.6rem' }}>
                {prediction.predicted_pm25_30m.toFixed(1)}
                <span className="card__unit">µg/m³</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> +60 Minutes
              </div>
              <div className="card__value" style={{ fontSize: '1.6rem' }}>
                {prediction.predicted_pm25_60m.toFixed(1)}
                <span className="card__unit">µg/m³</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: prediction.trend === 'rising' ? 'var(--status-danger-bg)' : prediction.trend === 'falling' ? 'var(--status-safe-bg)' : 'var(--status-info-bg)',
                color: prediction.trend === 'rising' ? 'var(--status-danger)' : prediction.trend === 'falling' ? 'var(--status-safe)' : 'var(--text-muted)'
              }}>
                {prediction.trend === 'rising' ? <TrendingUp size={18} /> : prediction.trend === 'falling' ? <TrendingDown size={18} /> : <Minus size={18} />}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{prediction.trend}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{Math.round(prediction.confidence * 100)}% confidence</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SECTION 5: Risk + Alerts ===== */}
      <div className="dash-section dash-section--3col animate-in animate-in-delay-4">
        <RiskGauge
          title="Fire Risk"
          icon={<Flame size={16} />}
          score={d?.derived?.fireRisk || 0}
          details={[
            { label: 'Smoke', value: d?.mq2?.smokeLevel || '--', status: gasInfo.status },
            { label: 'Gas', value: `${d?.mq2?.ppm || 0} ppm`, status: gasInfo.status },
            { label: 'Temp', value: `${d?.dht11?.temperature || '--'}°C`, status: d?.dht11?.temperature > 35 ? 'danger' : 'safe' }
          ]}
        />

        <RiskGauge
          title="Health Risk"
          icon={<Heart size={16} />}
          score={d?.derived?.healthRisk || 0}
          details={[
            { label: 'NO₂', value: `${d?.mq135?.no2_ppm || 0} ppm`, status: d?.mq135?.no2_ppm > 0.1 ? 'warning' : 'safe' },
            { label: 'NH₃', value: `${d?.mq135?.nh3_ppm || 0} ppm`, status: d?.mq135?.nh3_ppm > 25 ? 'warning' : 'safe' },
            { label: 'Dust', value: `${d?.dust?.density || 0} µg/m³`, status: d?.dust?.density > 35 ? 'warning' : 'safe' }
          ]}
        />

        <AlertPanel alerts={alerts} onAcknowledge={onAcknowledge} />
      </div>

      {/* ===== SECTION 6: Ventilation ===== */}
      <div className="card animate-in animate-in-delay-5" style={{ marginBottom: 'var(--gap-md)' }}>
        <div className="card__header">
          <span className="card__label"><Fan size={16} /> Ventilation Demand</span>
          <span className={`card__badge card__badge--${d?.derived?.ventilationDemand > 0.6 ? 'danger' : d?.derived?.ventilationDemand > 0.3 ? 'warning' : 'safe'}`}>
            {d?.derived?.ventilationStatus || '--'}
          </span>
        </div>
        <div className="vent-bar">
          <div>
            <div className="card__value">
              {Math.round((d?.derived?.ventilationDemand || 0) * 100)}
              <span className="card__unit">%</span>
            </div>
            <div className="card__sublabel">Overall demand score</div>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div className="progress-bar" style={{ height: '12px', borderRadius: '6px' }}>
              <div
                className={`progress-bar__fill progress-bar__fill--${d?.derived?.ventilationDemand > 0.6 ? 'danger' : d?.derived?.ventilationDemand > 0.3 ? 'warning' : 'safe'}`}
                style={{ width: `${Math.round((d?.derived?.ventilationDemand || 0) * 100)}%` }}
              />
            </div>
          </div>
          <div className="vent-bar__stats">
            <div>
              <div className="vent-bar__stat-label"><Wind size={12} /> CO₂</div>
              <div className="vent-bar__stat-value">{d?.mq135?.co2_ppm || '--'} ppm</div>
            </div>
            <div>
              <div className="vent-bar__stat-label"><Droplets size={12} /> Humidity</div>
              <div className="vent-bar__stat-value">{d?.dht11?.humidity || '--'}%</div>
            </div>
            <div>
              <div className="vent-bar__stat-label"><CloudFog size={12} /> Dust</div>
              <div className="vent-bar__stat-value">{d?.dust?.density || '--'} µg/m³</div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
