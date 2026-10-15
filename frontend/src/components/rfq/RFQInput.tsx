import React, { useState } from 'react';
import { FileText, User, Copy, Check, Hash, AlignLeft } from 'lucide-react';

interface RFQInputProps {
  rawText: string;
  customerName: string;
}

export const RFQInput: React.FC<RFQInputProps> = ({ rawText, customerName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = rawText ? rawText.split('\n').length : 0;
  const wordCount = rawText ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = rawText ? rawText.length : 0;

  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem 1.5rem' }}>
      <div className="section-header" style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h4 className="section-title" style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 600 }}>
          <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
          Raw RFQ Payload Document
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.2rem 0.65rem', background: 'var(--bg-surface-hover)', borderRadius: '1rem', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
            <User size={12} style={{ color: 'var(--text-muted)' }} />
            {customerName}
          </div>
          <button
            onClick={handleCopy}
            className="btn-ghost"
            style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Copy raw RFQ text"
          >
            {copied ? <Check size={12} style={{ color: 'var(--accent-green)' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Payload Telemetry Header */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <Hash size={11} /> {lineCount} lines
        </span>
        <span>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <AlignLeft size={11} /> {wordCount} words
        </span>
        <span>·</span>
        <span>{charCount} chars</span>
      </div>

      <div style={{ flex: 1, background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowY: 'auto', maxHeight: '420px' }}>
        <pre style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.6' }}>
          {rawText}
        </pre>
      </div>
    </div>
  );
};
