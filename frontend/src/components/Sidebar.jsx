import { useState } from 'react';
import {
  LayoutDashboard, Bell, Settings, Info, ChevronLeft, ChevronRight,
  Activity, FileText, Map, Users, Shield, Cpu, HardDrive,
  Download, History, Wrench, Building2, LogOut
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Monitor',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'alerts', label: 'Alerts', icon: Bell, badge: true },
      { id: 'analytics', label: 'Analytics', icon: Activity },
      { id: 'history', label: 'History', icon: History },
    ]
  },
  {
    title: 'Management',
    items: [
      { id: 'zones', label: 'Zones & Floors', icon: Map },
      { id: 'devices', label: 'Devices', icon: Cpu },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'users', label: 'Users', icon: Users },
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'calibration', label: 'Calibration', icon: Wrench },
      { id: 'firmware', label: 'Firmware', icon: HardDrive },
      { id: 'export', label: 'Export Data', icon: Download },
    ]
  }
];

export default function Sidebar({ activePage, onPageChange, alertCount = 0, collapsed, onToggle, onLogout }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand" onClick={onToggle} style={{ cursor: 'pointer' }} title="Toggle Sidebar">
        <div className="sidebar__brand-icon">
          <Building2 size={22} />
        </div>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <div className="sidebar__brand-name">AirQ</div>
            <div className="sidebar__brand-sub">Industrial Monitor</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="sidebar__section">
            {!collapsed && (
              <div className="sidebar__section-title">{section.title}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const showBadge = item.badge && alertCount > 0;

              return (
                <button
                  key={item.id}
                  className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                  onClick={() => onPageChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  data-tooltip={item.label}
                >
                  <div className="sidebar__item-icon">
                    <Icon size={18} />
                    {showBadge && (
                      <span className="sidebar__badge">{alertCount > 9 ? '9+' : alertCount}</span>
                    )}
                  </div>
                  {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        {!collapsed && (
          <div className="sidebar__info-card">
            <Shield size={16} />
            <div>
               <div className="sidebar__info-title">System Status</div>
               <div className="sidebar__info-value">All Normal</div>
            </div>
          </div>
        )}
        <button
          className="sidebar__item"
          onClick={onLogout}
          data-tooltip={collapsed ? 'Sign Out' : undefined}
          style={{ color: 'var(--status-danger)' }}
        >
          <div className="sidebar__item-icon">
            <LogOut size={18} />
          </div>
          {!collapsed && <span className="sidebar__item-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
