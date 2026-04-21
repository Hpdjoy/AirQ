import { useState, useMemo } from 'react';
import { History, Download, Calendar, Filter } from 'lucide-react';
import { formatTime } from '../utils/helpers';

export default function HistoryPage({ historyData }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Reverse data to show newest first, limit to latest 50 for performance
  const tableData = useMemo(() => {
    if (!historyData) return [];
    return [...historyData].reverse().slice(0, 50);
  }, [historyData]);

  const handleExportCSV = () => {
    if (!tableData.length) return;
    
    // Create CSV content
    const headers = ['Timestamp', 'Temp (°C)', 'Humidity (%)', 'CO2 (ppm)', 'Gas (ppm)', 'Dust (µg/m³)', 'AQI'];
    const csvRows = [headers.join(',')];
    
    tableData.forEach(row => {
      const values = [
        new Date(row.timestamp).toISOString(),
        row.dht11?.temperature || 0,
        row.dht11?.humidity || 0,
        row.mq135?.co2_ppm || 0,
        row.mq2?.ppm || 0,
        row.dust?.density || 0,
        row.derived?.compositeAQI || 0
      ];
      csvRows.push(values.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `airq_data_export_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History size={28} color="var(--accent-cyan)" /> Data History
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Historical sensor readings and derived metrics log.
          </p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 16px', background: 'var(--accent-blue)', 
            color: '#fff', borderRadius: 'var(--radius-sm)', 
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            border: 'none', transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--accent-blue)'}
        >
          <Download size={16} /> Export to CSV
        </button>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Toolbar */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date" 
                style={{ padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', fontSize: '0.8rem', color: 'var(--text-primary)' }}
              />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <Filter size={14} /> Filter
            </button>
          </div>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {tableData.length} records in memory
          </div>
        </div>

        {/* Desktop Table Wrapper */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Temp (°C)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Humidity (%)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>CO₂ (ppm)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Gas (ppm)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Dust (PM)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Composite AQI</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {formatTime(row.timestamp)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      <span style={{ color: row.dht11?.temperature > 32 ? 'var(--status-danger)' : 'var(--text-primary)'}}>
                        {row.dht11?.temperature?.toFixed(1) || '--'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.dht11?.humidity?.toFixed(0) || '--'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                      <span style={{ color: row.mq135?.co2_ppm > 1000 ? 'var(--status-warning)' : 'var(--text-primary)'}}>
                        {row.mq135?.co2_ppm || '--'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.mq2?.ppm || '--'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{row.dust?.density || '--'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {row.derived?.compositeAQI || '--'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No historical data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
