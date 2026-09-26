import React from 'react';
import { AgentRun } from '../../types/rfq';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface AgentProgressProps {
  agentRuns: AgentRun[];
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ agentRuns }) => {
  return (
    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h4 className="section-title" style={{ fontSize: '1.1rem' }}>Agent Execution Pipeline Trace</h4>
      </div>
      
      {/* Pipeline Visual Container */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {agentRuns.map((run, idx) => (
          <React.Fragment key={run.id}>
            <div 
              style={{ 
                flex: '1 0 180px',
                background: 'var(--bg-main)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-lg)', 
                border: `1px solid ${run.status === 'WARNING' ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: '1.2' }}>{run.agent_name}</span>
                {run.status === 'WARNING' ? (
                  <AlertTriangle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', flex: 1 }}>
                {run.output_summary}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)' }}>
                <Clock size={12} /> {run.execution_time_ms}ms
              </div>
            </div>
            
            {/* Connector Arrow */}
            {idx < agentRuns.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border-strong)', flexShrink: 0 }}>
                <ArrowRight size={20} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
