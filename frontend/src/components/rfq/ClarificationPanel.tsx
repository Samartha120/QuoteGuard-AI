import React, { useState } from 'react';
import { HelpCircle, ShieldAlert, Copy, Check, Mail } from 'lucide-react';

interface ClarificationPanelProps {
  questions: string[];
  notes?: string;
}

export const ClarificationPanel: React.FC<ClarificationPanelProps> = ({ questions, notes }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyAll = () => {
    const emailBody = [
      'Dear Customer,',
      '',
      'Thank you for your Request for Quotation. Before we can finalize your formal quotation, our technical sales team requires a few clarifications regarding your requested specifications:',
      '',
      ...questions.map((q, i) => `${i + 1}. ${q}`),
      '',
      notes ? `Internal Reference / Commercial Note: ${notes}` : '',
      '',
      'Please reply with the confirmed details so we can proceed with your grounded quotation.',
      '',
      'Best regards,',
      'Technical Sales & Estimation Department'
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(emailBody);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyQuestion = (q: string, idx: number) => {
    navigator.clipboard.writeText(q);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="card animate-fade-in" style={{ border: '1px solid var(--accent-amber)', background: 'rgba(245, 166, 35, 0.05)', marginBottom: '1.5rem', padding: '1.5rem' }}>
      <div className="section-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h4 className="section-title" style={{ fontSize: '1.05rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <ShieldAlert size={18} /> Source-Grounded Abstention Triggered
          </h4>
          <div className="section-desc" style={{ color: 'var(--text-main)', marginTop: '0.4rem', fontSize: '0.85rem', maxWidth: '650px', lineHeight: 1.5 }}>
            {notes || 'Commercial parameters requested by customer could not be grounded in approved company knowledge base. QuoteGuard AI has refused to fabricate prices or specifications.'}
          </div>
        </div>

        {questions.length > 0 && (
          <button
            onClick={handleCopyAll}
            className="btn-ghost"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
          >
            {copiedAll ? <Check size={14} /> : <Mail size={14} />}
            {copiedAll ? 'Email Copied!' : 'Copy Clarification Email'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
          <HelpCircle size={14} /> Customer Clarification Checklist ({questions.length} items):
        </h5>
        {questions.map((q, idx) => (
          <div 
            key={idx} 
            style={{ 
              background: 'var(--bg-primary)', 
              padding: '0.85rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.85rem', 
              color: 'var(--text-main)', 
              borderLeft: '3px solid var(--accent-amber)', 
              borderTop: '1px solid var(--border-subtle)', 
              borderRight: '1px solid var(--border-subtle)', 
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.8rem' }}>{idx + 1}.</span>
              <span style={{ lineHeight: 1.5 }}>{q}</span>
            </div>
            <button
              onClick={() => handleCopyQuestion(q, idx)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              title="Copy question"
            >
              {copiedIdx === idx ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

