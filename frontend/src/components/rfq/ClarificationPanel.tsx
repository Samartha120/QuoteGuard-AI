import React from 'react';
import { AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

interface ClarificationPanelProps {
  questions: string[];
  notes?: string;
}

export const ClarificationPanel: React.FC<ClarificationPanelProps> = ({ questions, notes }) => {
  return (
    <div className="card animate-fade-in" style={{ border: '1px solid var(--accent-amber)', background: 'rgba(245, 166, 35, 0.05)', marginBottom: '1.5rem' }}>
      <div className="section-header" style={{ marginBottom: '1rem' }}>
        <h4 className="section-title" style={{ fontSize: '1.1rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} /> Source-Grounded Abstention Triggered
        </h4>
        <div className="section-desc" style={{ color: 'var(--text-main)', marginTop: '0.5rem' }}>
          {notes || 'Commercial parameters requested by customer could not be grounded in approved company knowledge base. QuoteGuard AI has refused to fabricate prices or specifications.'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HelpCircle size={14} /> Clarification Questions & Escalation Required:
        </h5>
        {questions.map((q, idx) => (
          <div key={idx} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-main)', borderLeft: '2px solid var(--accent-amber)', borderTop: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
            {q}
          </div>
        ))}
      </div>
    </div>
  );
};
