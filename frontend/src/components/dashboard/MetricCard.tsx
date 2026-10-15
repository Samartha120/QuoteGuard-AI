import React, { useEffect, useState } from 'react';
import { LucideIcon, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  index?: number;
  badge?: string;
  trend?: string;
  trendPositive?: boolean;
}

// Purposeful semantic styles rather than arbitrary neon rainbows
const SEMANTIC_CONFIG: Record<number, { badgeBg: string; badgeText: string; badgeBorder: string; dot: string; glow: string }> = {
  0: { // RFQs Processed (Live operational)
    badgeBg: 'rgba(99, 102, 241, 0.1)',
    badgeText: '#a5b4fc',
    badgeBorder: 'rgba(99, 102, 241, 0.25)',
    dot: '#818cf8',
    glow: 'rgba(99, 102, 241, 0.15)',
  },
  1: { // Quotations Generated (Grounded)
    badgeBg: 'rgba(16, 185, 129, 0.08)',
    badgeText: '#34d399',
    badgeBorder: 'rgba(16, 185, 129, 0.22)',
    dot: '#10b981',
    glow: 'rgba(16, 185, 129, 0.12)',
  },
  2: { // Pending Approvals (Human Governance)
    badgeBg: 'rgba(245, 158, 11, 0.08)',
    badgeText: '#fbbf24',
    badgeBorder: 'rgba(245, 158, 11, 0.22)',
    dot: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.12)',
  },
  3: { // Clarification Cases (Shield Active)
    badgeBg: 'rgba(244, 63, 94, 0.08)',
    badgeText: '#fb7185',
    badgeBorder: 'rgba(244, 63, 94, 0.22)',
    dot: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.12)',
  },
  4: { // Grounded Output % (AI Integrity)
    badgeBg: 'rgba(16, 185, 129, 0.08)',
    badgeText: '#34d399',
    badgeBorder: 'rgba(16, 185, 129, 0.22)',
    dot: '#10b981',
    glow: 'rgba(16, 185, 129, 0.12)',
  },
  5: { // Avg Latency (Engine Speed)
    badgeBg: 'rgba(59, 130, 246, 0.08)',
    badgeText: '#60a5fa',
    badgeBorder: 'rgba(59, 130, 246, 0.22)',
    dot: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.12)',
  },
};

const DEFAULT_BADGES = [
  'Live Ingest',
  '100% Grounded',
  'Human Review',
  'Shield Active',
  'Zero Hallucination',
  'Sub-2s Latency',
];

const AnimatedValue: React.FC<{ value: string | number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  useEffect(() => {
    const stringVal = String(value);
    const numMatch = stringVal.match(/^([\d.]+)(.*)$/);

    if (numMatch && parseFloat(numMatch[1]) > 0) {
      const end = parseFloat(numMatch[1]);
      const suffix = numMatch[2];
      const isInteger = !numMatch[1].includes('.');

      let start = 0;
      const duration = 600;
      const incrementTime = 16;
      const step = end / (duration / incrementTime);

      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          clearInterval(timer);
          setDisplayValue(stringVal);
        } else {
          setDisplayValue(isInteger ? Math.floor(start) + suffix : start.toFixed(1) + suffix);
        }
      }, incrementTime);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return <>{displayValue}</>;
};

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  index = 0, 
  badge 
}) => {
  const config = SEMANTIC_CONFIG[index % 6];
  const badgeLabel = badge || DEFAULT_BADGES[index % DEFAULT_BADGES.length];

  return (
    <motion.div 
      className="metric-card-executive"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-4%" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '1.3rem 1.4rem',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '142px',
        transition: 'all 0.25s var(--ease-smooth)',
      }}
    >
      {/* Top hairline accent glow */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: '12%',
          right: '12%',
          height: '1.5px',
          background: `linear-gradient(90deg, transparent 0%, ${config.dot} 50%, transparent 100%)`,
          opacity: 0.7,
        }}
      />

      {/* Top soft ambient corner light */}
      <div 
        style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} 
      />

      {/* Header with Title and Icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
            {title}
          </span>
          <span 
            style={{ 
              fontSize: '0.67rem', 
              fontWeight: 600, 
              color: config.badgeText,
              background: config.badgeBg,
              border: `1px solid ${config.badgeBorder}`,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              width: 'fit-content',
              marginTop: '0.1rem',
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.dot, boxShadow: `0 0 6px ${config.dot}` }} />
            {badgeLabel}
          </span>
        </div>

        {Icon && (
          <div 
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '10px', 
              background: 'var(--card-subtle-bg)', 
              border: '1px solid var(--border-subtle)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            <Icon size={17} />
          </div>
        )}
      </div>

      {/* Value & Subtext */}
      <div>
        <div 
          style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            letterSpacing: '-0.03em', 
            color: 'var(--text-main)',
            fontFamily: 'Outfit, Plus Jakarta Sans, sans-serif',
            fontFeatureSettings: '"tnum", "cv02"',
            lineHeight: 1.1,
            marginBottom: '0.35rem',
          }}
        >
          <AnimatedValue value={value} />
        </div>
        {subtext && (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{subtext}</span>
          </div>
        )}
      </div>

      {/* Subtle bottom edge sheen */}
      <div 
        style={{
          position: 'absolute',
          bottom: 0,
          left: '10%',
          right: '10%',
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${config.dot} 50%, transparent 100%)`,
          opacity: 0.35,
        }}
      />
    </motion.div>
  );
};
