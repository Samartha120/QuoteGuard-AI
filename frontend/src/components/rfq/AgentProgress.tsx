import React, { useState } from 'react';
import { AgentRun } from '../../types/rfq';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Activity, TerminalSquare, Copy, Check, Timer } from 'lucide-react';

interface AgentProgressProps {
  agentRuns: AgentRun[];
}

export const AgentProgress: React.FC<AgentProgressProps> = ({ agentRuns }) => {
  const [copied, setCopied] = useState(false);

  const totalDurationMs = agentRuns.reduce((acc, r) => acc + (r.execution_time_ms || 0), 0);

  const handleCopyTrace = () => {
    const traceText = agentRuns
      .map((r, i) => `Step ${i + 1} [${r.agent_name}] (${r.execution_time_ms}ms) - ${r.status}: ${r.output_summary}`)
      .join('\n');
    navigator.clipboard.writeText(traceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', background: 'var(--bg-primary)', overflow: 'hidden', padding: 0 }}>
      <div className="section-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 className="section-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Activity size={16} style={{ color: 'var(--text-secondary)' }} />
          Agentic Execution Trace
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            ({agentRuns.length} stages)
          </span>
        </h4>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {totalDurationMs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Timer size={12} style={{ color: 'var(--accent-blue)' }} />
              <span>Total Latency: <strong>{totalDurationMs}ms</strong></span>
            </div>
          )}
          <button
            onClick={handleCopyTrace}
            className="btn-ghost"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
            title="Copy trace log to clipboard"
          >
            {copied ? <Check size={12} style={{ color: 'var(--accent-green)' }} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy Trace'}
          </button>
        </div>
      </div>
      
      {/* Pipeline Visual Container */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', overflowX: 'auto', padding: '1.5rem', background: 'var(--bg-main)' }}>
        {agentRuns.map((run, idx) => (
          <React.Fragment key={run.id || idx}>
            <div 
              style={{ 
                flex: '1 0 230px',
                background: 'var(--bg-surface)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-md)', 
                border: `1px solid ${run.status === 'WARNING' ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '3px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    #{idx + 1}
                  </span>
                  <TerminalSquare size={13} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{run.agent_name}</span>
                </div>
                {run.status === 'WARNING' ? (
                  <AlertTriangle size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                {run.output_summary}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'monospace' }}>
                  <Clock size={10} /> {run.execution_time_ms}ms
                </div>
                <div style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: run.status === 'WARNING' ? 'rgba(245,166,35,0.1)' : 'rgba(16,185,129,0.1)', color: run.status === 'WARNING' ? 'var(--accent-amber)' : 'var(--accent-green)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {run.status}
                </div>
              </div>
            </div>
            
            {/* Connector Arrow */}
            {idx < agentRuns.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', color: 'var(--border-strong)', flexShrink: 0 }}>
                <div style={{ width: '100%', height: '2px', background: 'var(--border-strong)', position: 'relative' }}>
                  <ArrowRight size={12} style={{ position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)', color: 'var(--border-strong)' }} />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

