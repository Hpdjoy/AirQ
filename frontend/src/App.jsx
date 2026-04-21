import { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AlertsPage from './components/AlertsPage';
import AboutPage from './components/AboutPage';
import AnalyticsPage from './components/AnalyticsPage';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import DevicesPage from './components/DevicesPage';
import CalibrationPage from './components/CalibrationPage';
import ZonesPage from './components/ZonesPage';
import ReportsPage from './components/ReportsPage';
import UsersPage from './components/UsersPage';
import FirmwarePage from './components/FirmwarePage';
import LandingPage from './components/LandingPage';
import { useSocket } from './hooks/useSocket';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    const verifyToken = async () => {
      const match = document.cookie.match(/(^| )airq_token=([^;]+)/);
      if (match) {
        const token = match[2];
        try {
          const res = await fetch('http://localhost:5000/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          if (res.ok) {
            const data = await res.json();
            setActiveUser(data.user);
            setIsAuthenticated(true);
          } else {
            document.cookie = "airq_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          }
        } catch (err) {
          console.error("Auth verification failed:", err);
        }
      }
      setAuthChecking(false);
    };
    verifyToken();
  }, []);

  const {
    isConnected,
    sensorData,
    alerts,
    devices,
    historyData,
    acknowledgeAlert,
    requestHistory,
    emitCommand
  } = useSocket();

  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeAlertCount = alerts.filter(a => !a.acknowledged).length;

  const handlePageChange = (page) => {
    if (page === 'export') {
      // Direct Export action instead of a page route for the nav item
      if (!historyData || historyData.length === 0) {
        alert("No recent data available to export.");
        return;
      }
      const headers = ['Timestamp', 'Temp (°C)', 'Humidity (%)', 'CO2 (ppm)', 'Gas (ppm)', 'Dust (µg/m³)', 'AQI'];
      const csvRows = [headers.join(',')];
      historyData.forEach(row => {
        csvRows.push([
          new Date(row.timestamp).toISOString(),
          row.dht11?.temperature || 0,
          row.dht11?.humidity || 0,
          row.mq135?.co2_ppm || 0,
          row.mq2?.ppm || 0,
          row.dust?.density || 0,
          row.derived?.compositeAQI || 0
        ].join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `airq_data_export_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return; // Do not actually change the page
    }
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            sensorData={sensorData}
            alerts={alerts}
            historyData={historyData}
            isConnected={isConnected}
            onAcknowledge={acknowledgeAlert}
            onRequestHistory={requestHistory}
          />
        );
      case 'alerts':
        return <AlertsPage alerts={alerts} onAcknowledge={acknowledgeAlert} />;
      case 'analytics':
        return <AnalyticsPage historyData={historyData} />;
      case 'history':
        return <HistoryPage historyData={historyData} />;
      case 'zones':
        return <ZonesPage isConnected={isConnected} sensorData={sensorData} alerts={alerts} />;
      case 'devices':
        return <DevicesPage isConnected={isConnected} sensorData={sensorData} devices={devices} emitCommand={emitCommand} />;
      case 'reports':
        return <ReportsPage historyData={historyData} />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      case 'calibration':
        return <CalibrationPage emitCommand={emitCommand} />;
      case 'firmware':
        return <FirmwarePage devices={devices} />;
      default:
        return <AboutPage />;
    }
  };

  // Logout Handler
  const handleLogout = () => {
    document.cookie = "airq_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    setActiveUser(null);
  };

  if (authChecking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Decrypting session keys...</div>;
  }

  if (!isAuthenticated) {
    return (
      <LandingPage 
        onLoginComplete={(user) => {
          setActiveUser(user);
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      <Sidebar
        activePage={activePage}
        onPageChange={handlePageChange}
        alertCount={activeAlertCount}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />
      <main className="app">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
