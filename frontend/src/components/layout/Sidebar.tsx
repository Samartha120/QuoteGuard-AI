import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Database, Receipt, BarChart3, Settings } from 'lucide-react';
import { QuoteShieldLogo } from './QuoteShieldLogo';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="sidebar-brand" style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.8'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
          <div className="brand-icon" style={{ background: 'transparent', padding: 0 }}>
            <QuoteShieldLogo size={32} />
          </div>
          <div>
            <div className="brand-title">
              <span style={{ color: 'var(--text-main)' }}>Quote</span>
              <span style={{ color: 'var(--accent-green)' }}>Guard</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 500 }}>AI</span>
            </div>
            <div className="brand-team">Team AXION AI</div>
          </div>
        </div>
      </Link>

      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <ul className="nav-list">
          <li>
            <NavLink to="/" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/rfq-processing" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={18} />
              <span>RFQ Processing</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/knowledge-base" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Database size={18} />
              <span>Knowledge Base</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/quotations" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={18} />
              <span>Quotations</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/evaluation" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BarChart3 size={18} />
              <span>Evaluation</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
          System Operational
        </div>

        {user && (
          <div 
            onClick={() => navigate('/settings/profile')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.5rem', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: 'var(--border-strong)', color: 'var(--text-main)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 600, fontSize: '0.85rem' 
            }}>
              {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : user.name.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role}</span>
            </div>
            <Settings size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>
    </aside>
  );
};
