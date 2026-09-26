import React from 'react';
import { Sparkles, Building2, User } from 'lucide-react';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">
        <div className="demo-badge">
          <Sparkles size={14} />
          <span>Demo Mode Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Building2 size={16} />
          <span>Vertex Industrial Supplies</span>
        </div>
      </div>
    </header>
  );
};
