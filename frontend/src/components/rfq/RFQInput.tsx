import React from 'react';
import { FileText } from 'lucide-react';

interface RFQInputProps {
  rawText: string;
  customerName: string;
}

export const RFQInput: React.FC<RFQInputProps> = ({ rawText, customerName }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <FileText size={18} style={{ color: 'var(--accent-blue)' }} />
        <h4 style={{ fontSize: '0.92rem', fontWeight: 600 }}>Extracted Raw RFQ Context</h4>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Customer: <strong>{customerName}</strong>
      </div>
      <pre style={{ background: '#090D16', padding: '0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-sub)', whiteSpace: 'pre-wrap' }}>
        {rawText}
      </pre>
    </div>
  );
};
