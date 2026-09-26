import React from 'react';
import { Citation } from '../../types/quotation';
import { FileText, Bookmark } from 'lucide-react';

interface SourceCitationProps {
  citations: Citation[];
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      {citations.map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Bookmark size={11} style={{ color: 'var(--accent-blue)' }} />
          <span>
            Source: <strong style={{ color: 'var(--text-sub)' }}>{c.source_filename}</strong> ({c.source_chunk_id})
          </span>
        </div>
      ))}
    </div>
  );
};
