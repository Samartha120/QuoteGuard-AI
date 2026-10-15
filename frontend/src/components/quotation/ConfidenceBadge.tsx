import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number;
  showMeter?: boolean;
  size?: 'sm' | 'md';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ 
  score, 
  showMeter = false,
  size = 'md' 
}) => {
  const percentage = Math.round(score * 100);

  let tierConfig = {
    label: 'Verified Grounded',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: ShieldCheck,
  };

  if (score >= 0.90) {
    tierConfig = {
      label: 'Fully Grounded',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      icon: ShieldCheck,
    };
  } else if (score >= 0.75) {
    tierConfig = {
      label: 'Verified Match',
      color: '#60a5fa',
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.3)',
      icon: CheckCircle2,
    };
  } else if (score >= 0.50) {
    tierConfig = {
      label: 'Low Confidence',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)',
      icon: AlertTriangle,
    };
  } else {
    tierConfig = {
      label: 'Abstained',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
      icon: ShieldAlert,
    };
  }

  const Icon = tierConfig.icon;
  const isSm = size === 'sm';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.2rem' }}>
      <span 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: isSm ? '0.12rem 0.45rem' : '0.2rem 0.6rem',
          borderRadius: '9999px',
          background: tierConfig.bg,
          border: `1px solid ${tierConfig.border}`,
          color: tierConfig.color,
          fontSize: isSm ? '0.68rem' : '0.74rem',
          fontWeight: 600,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '0.01em',
          cursor: 'default',
          transition: 'all 0.15s ease'
        }}
        title={`Grounding Confidence Score: ${percentage}% · Tier: ${tierConfig.label}`}
      >
        <Icon size={isSm ? 11 : 13} />
        <span>{percentage}% Grounded</span>
      </span>

      {showMeter && (
        <div 
          style={{ 
            width: '100%', 
            height: '3px', 
            background: 'var(--border-subtle)', 
            borderRadius: '2px', 
            overflow: 'hidden' 
          }}
        >
          <div 
            style={{ 
              width: `${Math.min(100, Math.max(0, percentage))}%`, 
              height: '100%', 
              background: tierConfig.color,
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      )}
    </div>
  );
};
