import React from 'react';
import { AgentRun } from '../../types/rfq';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface AgentProgressProps {
  agentRuns: AgentRun[];
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ agentRuns }) => {
  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '1rem', color: '#FFFFFF' }}>
        Agent Execution Pipeline Trace
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {agentRuns.map((run) => (
          <div 
            key={run.id} 
            style={{ 
              background: '#0F172A', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              border: `1px solid ${run.status === 'WARNING' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'}` 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FFFFFF' }}>{run.agent_name}</span>
              {run.status === 'WARNING' ? (
                <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} />
              ) : (
                <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{run.output_summary}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={10} /> {run.execution_time_ms}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
