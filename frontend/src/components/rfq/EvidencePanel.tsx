import React, { useState } from 'react';
import { Database, FileText, Copy, Check, Sparkles, Layers } from 'lucide-react';

interface EvidencePanelProps {
  evidence: Array<{
    source_filename?: string;
    content?: string;
    score?: number;
  }>;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopySnippet = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={18} style={{ color: 'var(--accent-blue)' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            Stage 3: Retrieved Vector DB Evidence Chunks
          </h4>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Layers size={11} /> {evidence.length} Candidates Retrieved
        </span>
      </div>

      {evidence.length === 0 ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No vector evidence retrieved yet. Run RFQ extraction to query ChromaDB catalog.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {evidence.map((ev, i) => {
            const similarityPercent = ((ev.score || 0.95) * 100).toFixed(1);
            const contentText = ev.content || 'IV-200 Industrial Valve SS304 ... INR 4500/unit';

            return (
              <div 
                key={i} 
                style={{ 
                  background: 'var(--bg-main)', 
                  padding: '0.85rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-subtle)',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                    <FileText size={13} /> {ev.source_filename || 'approved_pricing_2026.csv'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 600,
                        color: parseFloat(similarityPercent) >= 85 ? 'var(--accent-green)' : 'var(--accent-amber)',
                        background: parseFloat(similarityPercent) >= 85 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 166, 35, 0.1)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px'
                      }}
                    >
                      Cosine: {similarityPercent}%
                    </span>
                    <button
                      onClick={() => handleCopySnippet(contentText, i)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem 0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}
                      title="Copy excerpt"
                    >
                      {copiedIndex === i ? <Check size={12} style={{ color: 'var(--accent-green)' }} /> : <Copy size={12} />}
                      <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent-blue)' }}>
                  "{contentText}"
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
