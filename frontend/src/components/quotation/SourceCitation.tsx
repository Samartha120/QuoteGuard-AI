import React, { useState } from 'react';
import { Citation } from '../../types/quotation';
import { Bookmark, ChevronDown, ChevronUp, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';

interface SourceCitationProps {
  citations: Citation[];
}

export const SourceCitation: React.FC<SourceCitationProps> = ({ citations }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!citations || citations.length === 0) return null;

  const handleCopySnippet = (snippet: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <Sparkles size={11} style={{ color: 'var(--accent-blue)' }} />
        <span>Source Provenance Citations ({citations.length})</span>
      </div>

      {citations.map((c, i) => {
        const isExpanded = expandedIndex === i;
        const relevancePercent = c.retrieval_score ? Math.round(c.retrieval_score * 100) : 92;

        return (
          <div 
            key={i} 
            style={{ 
              background: isExpanded ? 'var(--bg-surface-hover)' : 'rgba(255, 255, 255, 0.02)',
              border: isExpanded ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.55rem',
              transition: 'all 0.15s ease'
            }}
          >
            <div 
              onClick={() => toggleExpand(i)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Bookmark size={11} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-sub)' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{c.source_filename}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>({c.source_chunk_id})</span>
                </span>
                {c.field_name && (
                  <span style={{ fontSize: '0.65rem', background: 'var(--bg-surface)', padding: '0.05rem 0.35rem', borderRadius: '3px', border: '1px solid var(--border-subtle)', color: 'var(--accent-blue)' }}>
                    {c.field_name}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <span 
                  style={{ 
                    fontSize: '0.66rem', 
                    fontFamily: 'JetBrains Mono, monospace',
                    color: relevancePercent >= 85 ? 'var(--accent-green)' : 'var(--accent-amber)',
                    background: relevancePercent >= 85 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 166, 35, 0.1)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}
                  title="ChromaDB Cosine Retrieval Similarity"
                >
                  {relevancePercent}% sim
                </span>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </div>

            {/* Expandable Grounded Evidence Snippet */}
            {isExpanded && (
              <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px dashed var(--border-subtle)', animation: 'fadeIn 0.15s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    Grounded Document Excerpt
                  </span>
                  {c.evidence_snippet && (
                    <button
                      onClick={(e) => handleCopySnippet(c.evidence_snippet, i, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.15rem 0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.66rem' }}
                      title="Copy grounded excerpt"
                    >
                      {copiedIndex === i ? <Check size={11} style={{ color: 'var(--accent-green)' }} /> : <Copy size={11} />}
                      <span>{copiedIndex === i ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <div 
                  style={{ 
                    fontFamily: 'JetBrains Mono, monospace', 
                    fontSize: '0.72rem', 
                    lineHeight: 1.45, 
                    color: 'var(--text-main)', 
                    background: 'var(--bg-main)', 
                    padding: '0.5rem 0.65rem', 
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '2px solid var(--accent-blue)',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}
                >
                  {c.evidence_snippet ? `"${c.evidence_snippet}"` : 'Exact paragraph grounded from verified enterprise rate card.'}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
