import React, { useMemo } from 'react';
import { Activity, Clock } from 'lucide-react';
import { RFQ } from '../../types/rfq';
import { ScaleReveal, StaggerContainer, StaggerItem, AnimatedLine } from '../motion';
import { motion } from 'framer-motion';

interface ActivityFeedProps {
  rfqs: RFQ[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ rfqs }) => {
  const activities = useMemo(() => {
    return rfqs
      .flatMap(rfq => 
        (rfq.agent_runs || []).map(run => ({
          ...run,
          customer_name: rfq.customer_name
        }))
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [rfqs]);

  if (!activities || activities.length === 0) {
    return (
      <ScaleReveal 
        delay={0.4} 
        className="card" 
        width="100%" 
        style={{ 
          padding: '1.4rem', 
          background: 'var(--card-bg)', 
          border: '1px solid var(--card-border)', 
          borderRadius: '16px',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h3 className="section-title" style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span style={{ display: 'inline-flex', padding: '4px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
              <Activity size={15} />
            </span>
            Agent Audit Trail
          </h3>
        </div>
        <AnimatedLine horizontal delay={0.5} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem', textAlign: 'center', padding: '1rem 0' }}>
          No recent agent activity.
        </div>
      </ScaleReveal>
    );
  }

  return (
    <ScaleReveal 
      delay={0.4} 
      className="card" 
      width="100%" 
      style={{ 
        padding: '1.4rem', 
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span style={{ display: 'inline-flex', padding: '4px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
              <Activity size={15} />
            </span>
            Agent Audit Trail
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Real-time inference execution log
          </p>
        </div>
      </div>
      
      <StaggerContainer delayOrder={0.5} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {activities.map((act) => {
          const time = new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isSuccess = act.status === 'SUCCESS';
          return (
            <StaggerItem key={act.id} className="activity-item">
              <motion.div 
                whileHover={{ x: 2 }}
                style={{
                  background: 'var(--card-subtle-bg)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `3px solid ${isSuccess ? 'var(--accent-green)' : 'var(--accent-amber)'}`,
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {act.agent_name}
                  </span>
                  <span 
                    style={{ 
                      fontSize: '0.65rem', 
                      color: isSuccess ? '#34d399' : '#fbbf24', 
                      background: isSuccess ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontWeight: 600 
                    }}
                  >
                    {act.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.35rem', lineHeight: 1.35 }}>
                  {act.output_summary || `Processed RFQ for ${act.customer_name}`}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={11} /> {time} · <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>{act.execution_time_ms}ms</span>
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </ScaleReveal>
  );
};
