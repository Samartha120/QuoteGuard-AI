import React from 'react';
import { Activity, Clock } from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const mockActivities = [
    { time: '2 mins ago', agent: 'Validation Agent', text: 'Enforced 0.80 Grounding Threshold on Zenith Chemical RFQ' },
    { time: '5 mins ago', agent: 'Planning Agent', text: 'Triggered ABSTENTION flag for unsupported SS316 grade request' },
    { time: '12 mins ago', agent: 'Drafting Agent', text: 'Generated formal grounded quotation QG-2026-APEX01 (INR 149,860.00)' },
    { time: '18 mins ago', agent: 'Retrieval Agent', text: 'Queried ChromaDB vector store: 4 chunks retrieved from approved_pricing.csv' },
  ];

  return (
    <div className="card animate-fade-in animate-delay-1" style={{ flex: '0 0 320px' }}>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} style={{ color: 'var(--text-secondary)' }} />
          Agent Audit Trail
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mockActivities.map((act, i) => (
          <div key={i} style={{ borderLeft: '2px solid var(--border-strong)', paddingLeft: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{act.agent}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>{act.text}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={10} /> {act.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
