import React from 'react';
import { Database, FileCheck, Layers, ShieldCheck, Cpu, HardDrive } from 'lucide-react';

interface KnowledgeStatsProps {
  totalDocs: number;
  totalChunks: number;
}

export const KnowledgeStats: React.FC<KnowledgeStatsProps> = ({ totalDocs, totalChunks }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approved Knowledge Documents</span>
          <FileCheck size={16} style={{ color: 'var(--accent-blue)' }} />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>
          {totalDocs}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Verified ratecards, catalog specs & policies
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vector Store Chunks</span>
          <Layers size={16} style={{ color: 'var(--accent-green)' }} />
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>
          {totalChunks}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Recursive token chunks (512t / 50t overlap)
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Embedding Architecture</span>
          <Cpu size={16} style={{ color: '#818cf8' }} />
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
          all-MiniLM-L6-v2
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          384-dim HNSW Cosine Index · ChromaDB
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grounding Policy</span>
          <ShieldCheck size={16} style={{ color: 'var(--accent-green)' }} />
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          Strict Abstention Active
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Refuses fabrication if similarity &lt; 0.85
        </div>
      </div>
    </div>
  );
};
