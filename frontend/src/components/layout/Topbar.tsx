import React from 'react';
import { Building2, Moon, Sun, Cpu, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { motion } from 'framer-motion';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header 
      className="topbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1.75rem',
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom: '1px solid var(--topbar-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        gap: '1rem',
      }}
    >
      {/* Breadcrumb & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
          Workspace
        </span>
        <span style={{ color: 'var(--border-medium)', fontSize: '0.8rem' }}>/</span>
        <h1 
          className="topbar-title" 
          style={{ 
            color: 'var(--text-main)', 
            margin: 0, 
            fontSize: '0.92rem', 
            fontWeight: 600, 
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Subtle Engine Telemetry */}
        <div 
          className="topbar-telemetry"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontSize: '0.72rem',
            color: '#34d399',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span>Engine: 1.2s</span>
        </div>

        <GlobalSearch />

        <NotificationsMenu />

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-subtle)' }} />

        <motion.button
          onClick={toggleTheme}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          style={{
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            transition: 'border-color 0.15s ease',
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={14} style={{ color: '#fbbf24' }} /> : <Moon size={14} />}
        </motion.button>

        <Link 
          to="/organization" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem', 
            color: 'var(--text-secondary)', 
            fontSize: '0.78rem', 
            textDecoration: 'none',
            background: 'var(--bg-surface-hover)',
            padding: '0.3rem 0.7rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            transition: 'all 0.15s ease',
            fontWeight: 500,
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = 'var(--accent-primary-glow)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Building2 size={13} style={{ color: '#818cf8' }} />
          <span>Vertex Industrial</span>
        </Link>
      </div>
    </motion.header>
  );
};
