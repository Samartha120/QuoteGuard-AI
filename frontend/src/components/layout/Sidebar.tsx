import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Database, Receipt, BarChart3, Settings, ShieldCheck, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuoteShieldLogo } from './QuoteShieldLogo';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    if (logout) logout();
    navigate('/login');
  };

  return (
    <motion.aside 
      className="sidebar" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        justifyContent: 'space-between',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.div 
            className="sidebar-brand" 
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.85rem',
              padding: '1.25rem 1.4rem',
              borderBottom: '1px solid var(--border-subtle)',
            }} 
            whileHover={{ opacity: 0.9 }}
          >
            <QuoteShieldLogo size={32} />
            <div>
              <div className="brand-title" style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.05rem' }}>Quote</span>
                <span style={{ 
                  background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  fontSize: '1.05rem',
                }}>Guard</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '5px', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em' }}>AI</span>
              </div>
              <div className="brand-team" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '1px' }}>
                Team AXION AI
              </div>
            </div>
          </motion.div>
        </Link>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
          <div style={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '0 0.75rem 0.5rem', fontWeight: 600 }}>
            Platform Modules
          </div>
          <ul className="nav-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>
              <NavLink to="/" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/rfq-processing" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={16} />
                <span>RFQ Processing</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/knowledge-base" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Database size={16} />
                <span>Knowledge Base</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/quotations" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Receipt size={16} />
                <span>Quotations</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/evaluation" className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={16} />
                <span>Evaluation Matrix</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>

      <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', background: 'var(--card-subtle-bg)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.45rem', paddingLeft: '0.25rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }}></span>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>System Operational</span>
        </div>

        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.5rem 0.65rem', 
                borderRadius: '10px', 
                cursor: 'pointer',
                background: menuOpen ? 'var(--border-medium)' : 'var(--bg-surface-hover)',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 600, 
                fontSize: '0.82rem',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                flexShrink: 0,
              }}>
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : user.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role}</span>
              </div>
              <Settings size={14} style={{ color: 'var(--text-muted)' }} />
            </div>

            {menuOpen && (
              <div className="animate-slide-up" style={{
                position: 'absolute',
                bottom: 'calc(100% + 0.5rem)',
                left: 0,
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: '10px',
                padding: '0.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100
              }}>
                <div 
                  onClick={() => { setMenuOpen(false); navigate('/settings/profile'); }}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={13} /> Profile Settings
                </div>
                <div 
                  onClick={() => { setMenuOpen(false); navigate('/settings/preferences'); }}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings size={13} /> Preferences
                </div>
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0.2rem 0' }}></div>
                <div 
                  onClick={handleLogout}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#f87171', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={13} /> Sign Out
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};
