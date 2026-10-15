import React, { useState } from 'react';
import { Building2, Moon, Sun, HelpCircle, X, Command, Search, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsMenu } from './NotificationsMenu';
import { motion, AnimatePresence } from 'framer-motion';

interface TopbarProps {
  title: string;
}

const SHORTCUTS = [
  { key: 'Ctrl + K', desc: 'Global Spotlight Search across all RFQs & quotes' },
  { key: 'Ctrl + Enter', desc: 'Instant Approve & Sign draft in Human Governance panel' },
  { key: 'Esc', desc: 'Close modals, drawers, and active search dialogs' },
  { key: 'Click Agent', desc: 'Inspect runtime engine & latency SLA in Pipeline view' },
];

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { theme, toggleTheme } = useTheme();
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
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
            title="Real-time multi-agent orchestrator operational status"
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span>Engine: 1.2s</span>
          </div>

          <GlobalSearch />

          <NotificationsMenu />

          {/* Keyboard Shortcuts Trigger */}
          <motion.button
            onClick={() => setShowShortcuts(true)}
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
            title="Keyboard shortcuts & system hotkeys"
          >
            <HelpCircle size={14} />
          </motion.button>

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

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <div 
            onClick={() => setShowShortcuts(false)}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0, 0, 0, 0.6)', 
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="card"
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '16px',
                boxShadow: 'var(--card-shadow)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Command size={18} style={{ color: 'var(--accent-blue)' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                    QuoteGuard AI Hotkeys
                  </h3>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {SHORTCUTS.map((s, idx) => (
                  <div 
                    key={idx}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.55rem 0.75rem', 
                      background: 'var(--bg-main)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)' 
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.desc}</span>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'var(--text-main)', fontWeight: 600 }}>
                      {s.key}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
