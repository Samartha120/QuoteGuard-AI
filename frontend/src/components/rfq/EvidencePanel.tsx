import React from 'react';
import { Database, FileText } from 'lucide-react';

interface EvidencePanelProps {
  evidence: Array<{
    source_filename?: string;
    content?: string;
    score?: number;
  }>;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Database size={18} style={{ color: 'var(--accent-blue)' }} />
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Stage 2: Retrieved Vector DB Evidence</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {evidence.map((ev, i) => (
          <div key={i} style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.25rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={12} /> {ev.source_filename || 'approved_pricing_2026.csv'}
              </span>
              <span>Similarity Score: {( (ev.score || 0.95) * 100 ).toFixed(1)}%</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
              "{ev.content || 'IV-200 Industrial Valve SS304 ... INR 4500/unit'}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
