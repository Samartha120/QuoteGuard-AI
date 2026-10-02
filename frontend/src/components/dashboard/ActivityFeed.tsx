import React, { useMemo } from 'react';
import { Activity, Clock } from 'lucide-react';
import { RFQ } from '../../types/rfq';
import { ScaleReveal, StaggerContainer, StaggerItem, AnimatedLine } from '../motion';

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
      <ScaleReveal delay={0.4} className="card" width="100%" style={{ flex: '0 0 320px' }}>
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <h3 className="section-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--text-secondary)' }} />
            Agent Audit Trail
          </h3>
        </div>
        <AnimatedLine horizontal delay={0.5} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>No recent agent activity.</div>
      </ScaleReveal>
    );
  }

  return (
    <ScaleReveal delay={0.4} className="card" width="100%" style={{ flex: '0 0 320px' }}>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} style={{ color: 'var(--text-secondary)' }} />
          Agent Audit Trail
        </h3>
      </div>
      <AnimatedLine horizontal delay={0.5} />
      <StaggerContainer delayOrder={0.6} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {activities.map((act) => {
          const time = new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isSuccess = act.status === 'SUCCESS';
          return (
            <StaggerItem
              key={act.id}
              className="activity-item"
            >
              <div style={{
                borderLeft: `2px solid ${isSuccess ? 'var(--accent-green)' : 'var(--border-strong)'}`,
                paddingLeft: '0.75rem',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{act.agent_name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                  {act.output_summary || `Processed RFQ for ${act.customer_name}`}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={10} /> {time} • {act.execution_time_ms}ms
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </ScaleReveal>
  );
};
