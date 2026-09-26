import React from 'react';

interface MetricChartProps {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ label, value, unit = '%', color = 'var(--accent-blue)' }) => {
  return (
    <div className="card animate-fade-in">
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.25rem 0', fontFamily: 'JetBrains Mono, monospace' }}>
        {value.toFixed(1)}{unit}
      </div>
      <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${Math.min(100, value)}%`, 
            height: '100%', 
            background: color, 
            transition: 'width 0.5s ease',
            boxShadow: `0 0 8px ${color}33`
          }} 
        />
      </div>
    </div>
  );
};
