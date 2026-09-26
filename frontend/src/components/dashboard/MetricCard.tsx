import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon: Icon }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span className="card-title">{title}</span>
        {Icon && <Icon size={18} style={{ color: 'var(--accent-blue)' }} />}
      </div>
      <div className="card-value">{value}</div>
      {subtext && <div className="card-subtext">{subtext}</div>}
    </div>
  );
};
