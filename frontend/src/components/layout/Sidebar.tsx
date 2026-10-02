import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Database, Receipt, BarChart3, Settings } from 'lucide-react';
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
      style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
        <motion.div 
          className="sidebar-brand" 
          style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} 
          whileHover={{ opacity: 0.8 }}
        >
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
        </motion.div>
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
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
          System Operational
        </div>

        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.5rem', 
                borderRadius: 'var(--radius-md)', 
                cursor: 'pointer',
                background: menuOpen ? 'var(--bg-surface-hover)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
              onMouseOut={e => e.currentTarget.style.background = menuOpen ? 'var(--bg-surface-hover)' : 'transparent'}
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

            {menuOpen && (
              <div className="animate-slide-up" style={{
                position: 'absolute',
                bottom: 'calc(100% + 0.5rem)',
                left: 0,
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                zIndex: 100
              }}>
                <div 
                  onClick={() => { setMenuOpen(false); navigate('/settings/profile'); }}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  Profile Settings
                </div>
                <div 
                  onClick={() => { setMenuOpen(false); navigate('/settings/preferences'); }}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  Preferences
                </div>
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }}></div>
                <div 
                  onClick={handleLogout}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--accent-red)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  Sign Out
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};
