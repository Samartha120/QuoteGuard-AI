import React from 'react';
import { Database, FileCheck, Layers, ShieldCheck } from 'lucide-react';

interface KnowledgeStatsProps {
  totalDocs: number;
  totalChunks: number;
}

export const KnowledgeStats: React.FC<KnowledgeStatsProps> = ({ totalDocs, totalChunks }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
      <div className="card">
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Approved Knowledge Documents</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.25rem' }}>{totalDocs}</div>
      </div>
      <div className="card">
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Vector Store Chunks</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.25rem' }}>{totalChunks}</div>
      </div>
      <div className="card">
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Grounding Status</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={16} /> 100% Authoritative Sources Only
        </div>
      </div>
    </div>
  );
};
