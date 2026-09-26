import React from 'react';
import { Building2, Moon, Sun, Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '0.85rem' }}>Workspace /</span>
        <h1 className="topbar-title" style={{ color: 'var(--text-main)', margin: 0 }}>{title}</h1>
      </div>
      
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search knowledge, RFQs..." 
            style={{ 
              background: 'var(--bg-surface-hover)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-full)', 
              padding: '0.35rem 1rem 0.35rem 2.25rem',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              width: '220px',
              outline: 'none'
            }} 
          />
        </div>

        <button 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative' }}
          title="Notifications"
        >
          <Bell size={16} />
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-strong)' }} />

        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer', 
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <Link to="/organization" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none' }}>
          <Building2 size={14} />
          <span style={{ transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Vertex Industrial</span>
        </Link>
      </div>
    </header>
  );
};
