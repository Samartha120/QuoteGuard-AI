import React from 'react';

interface MetricChartProps {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ label, value, unit = '%', color = 'var(--accent-blue)' }) => {
  return (
    <div className="card">
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF', margin: '0.25rem 0' }}>
        {value}{unit}
      </div>
      <div style={{ background: '#0F172A', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${Math.min(100, value)}%`, 
            height: '100%', 
            background: color, 
            transition: 'width 0.5s ease' 
          }} 
        />
      </div>
    </div>
  );
};
