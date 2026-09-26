import React from 'react';
import { AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

interface ClarificationPanelProps {
  questions: string[];
  notes?: string;
}

export const ClarificationPanel: React.FC<ClarificationPanelProps> = ({ questions, notes }) => {
  return (
    <div className="card" style={{ border: '1px solid rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.04)', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#FCD34D' }}>
        <ShieldAlert size={20} />
        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Source-Grounded Abstention Triggered</h4>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '1rem' }}>
        {notes || 'Commercial parameters requested by customer could not be grounded in approved company knowledge base. QuoteGuard AI has refused to fabricate prices or specifications.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HelpCircle size={14} style={{ color: 'var(--accent-amber)' }} /> Clarification Questions & Escalation Required:
        </h5>
        {questions.map((q, idx) => (
          <div key={idx} style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#FCD34D', borderLeft: '3px solid var(--accent-amber)' }}>
            {q}
          </div>
        ))}
      </div>
    </div>
  );
};
