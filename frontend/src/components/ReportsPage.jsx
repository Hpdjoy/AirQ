import { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, Plus, X, SearchCheck } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formType, setFormType] = useState('Air Quality Snapshot');
  const [formFormat, setFormFormat] = useState('CSV');
  const [authorName, setAuthorName] = useState('Admin');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = (report) => {
    // Rely on the standard browser download via Express attachment res.setHeader()
    window.location.href = `http://localhost:5000/api/reports/download/${report._id}`;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true); // show some loading indicator if needed

    try {
      const res = await fetch('http://localhost:5000/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType,
          formFormat,
          authorName
        })
      });

      if (res.ok) {
        // Refresh the list immediately to show the newly generated backend report
        await fetchReports();
      } else {
        alert("Failed to generate report from server.");
      }
    } catch (err) {
      console.error("Failed to generate:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: 'var(--gap-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={28} color="var(--accent-pink)" /> Compliance & Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Generate and download standardized air quality reports for regulatory compliance.
          </p>
        </div>
        
        <button 
          onClick={() => setIsGenerating(!isGenerating)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '10px 16px', background: isGenerating ? 'var(--bg-secondary)' : 'var(--accent-pink)', 
            color: isGenerating ? 'var(--text-primary)' : '#fff', borderRadius: 'var(--radius-sm)', 
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            border: isGenerating ? '1px solid var(--border-subtle)' : 'none', transition: 'all 0.2s'
          }}
        >
          {isGenerating ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Generate New Report</>}
        </button>
      </header>

      {isGenerating && (
        <form onSubmit={handleGenerate} className="card" style={{ marginBottom: '24px', animation: 'fadeIn 0.3s ease-out' }}>
          <div className="card__header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <span className="card__label" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Report Generation Parameters</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Report Profile</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <option>Air Quality Snapshot</option>
                <option>OSHA Compliance Audit</option>
                <option>Anomaly/Alert Log</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Format</label>
              <select value={formFormat} onChange={(e) => setFormFormat(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <option value="CSV">Raw Data (CSV)</option>
                <option value="TXT">Text Summary (TXT)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Author / Auditor Name</label>
              <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }} required />
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>* Generated reports will automatically pull the latest dataset up to 7 days from the primary active historical buffer.</p>

          <button type="submit" style={{ padding: '10px 24px', background: 'var(--status-safe)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SearchCheck size={18} /> Process and Generate
          </button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '16px', fontWeight: 600 }}>Report Name</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Format</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Date Generated</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '16px', fontWeight: 600 }}>Author</th>
                <th style={{ padding: '16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-primary)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    {report.type === 'TXT' ? <FileText size={16} color="var(--accent-red)" /> : <FileSpreadsheet size={16} color="var(--accent-green)" />}
                    {report.name}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>
                    <span style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      {report.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{report.date}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{report.size}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{report.author}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDownload(report)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
