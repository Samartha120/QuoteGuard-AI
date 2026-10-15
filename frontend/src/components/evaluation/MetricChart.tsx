import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MetricChartProps {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ 
  label, 
  value, 
  unit = '%', 
  color = '#6366f1' 
}) => {
  const isHallucination = label.toLowerCase().includes('hallucination');
  const targetLabel = isHallucination ? 'Target < 2.0%' : 'Target > 90.0%';
  const isHealthy = isHallucination ? value <= 2.0 : value >= 85.0;
  const targetMark = isHallucination ? 2.0 : 90.0;

  return (
    <motion.div 
      className="metric-chart-card"
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      style={{
        padding: '1.25rem 1.4rem',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--card-border)',
        borderRadius: '14px',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.01em' }}>
          {label}
        </span>
        <span 
          style={{ 
            fontSize: '0.67rem', 
            fontFamily: 'JetBrains Mono, monospace', 
            color: isHealthy ? '#34d399' : '#fbbf24', 
            background: isHealthy ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
            padding: '0.15rem 0.45rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          {isHealthy ? <CheckCircle2 size={10} /> : <Target size={10} />}
          {targetLabel}
        </span>
      </div>

      <div 
        style={{ 
          fontSize: '1.95rem', 
          fontWeight: 700, 
          color: 'var(--text-main)', 
          margin: '0.2rem 0 0.85rem', 
          fontFamily: 'Plus Jakarta Sans, sans-serif', 
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
        }}
      >
        {value.toFixed(1)}{unit}
      </div>

      {/* Progress track with target indicator */}
      <div style={{ background: 'var(--bg-surface-hover)', borderRadius: '9999px', height: '6px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-subtle)' }}>
        <div 
          style={{ 
            width: `${Math.min(100, Math.max(0, value))}%`, 
            height: '100%', 
            background: color, 
            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: `0 0 10px ${color}66`,
            borderRadius: '9999px',
          }} 
        />
      </div>
    </motion.div>
  );
};
