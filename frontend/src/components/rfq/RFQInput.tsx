import React from 'react';
import { FileText, User } from 'lucide-react';

interface RFQInputProps {
  rawText: string;
  customerName: string;
}

export const RFQInput: React.FC<RFQInputProps> = ({ rawText, customerName }) => {
  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 className="section-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
          Raw RFQ Payload
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: 'var(--bg-surface-hover)', borderRadius: '1rem', color: 'var(--text-main)' }}>
          <User size={12} style={{ color: 'var(--text-muted)' }} />
          {customerName}
        </div>
      </div>
      <div style={{ flex: 1, background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
        <pre style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6' }}>
          {rawText}
        </pre>
      </div>
    </div>
  );
};
