import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Receipt, Database } from 'lucide-react';
import { rfqApi } from '../../api/rfqApi';
import { quotationApi } from '../../api/quotationApi';
import { knowledgeApi } from '../../api/knowledgeApi';

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  kind: 'rfq' | 'quotation' | 'document';
  to: string;
}

const iconFor = (kind: SearchResult['kind']) => {
  if (kind === 'rfq') return <FileText size={14} />;
  if (kind === 'quotation') return <Receipt size={14} />;
  return <Database size={14} />;
};

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [rfqs, quotations, docs] = await Promise.all([
        rfqApi.listRFQs().catch(() => []),
        quotationApi.listQuotations().catch(() => []),
        knowledgeApi.listDocuments().catch(() => []),
      ]);

      const matches: SearchResult[] = [];

      for (const r of rfqs) {
        if (
          r.customer_name?.toLowerCase().includes(term) ||
          r.file_name?.toLowerCase().includes(term) ||
          r.raw_text?.toLowerCase().includes(term)
        ) {
          matches.push({
            id: r.id,
            label: r.customer_name || r.file_name || 'RFQ',
            sublabel: `RFQ · ${r.status}`,
            kind: 'rfq',
            to: `/rfqs/${r.id}`,
          });
        }
      }

      for (const q2 of quotations) {
        if (
          q2.quotation_number?.toLowerCase().includes(term) ||
          q2.customer_name?.toLowerCase().includes(term)
        ) {
          matches.push({
            id: q2.id,
            label: q2.quotation_number || q2.customer_name,
            sublabel: `Quotation · ${q2.status}`,
            kind: 'quotation',
            to: `/quotations/${q2.id}`,
          });
        }
      }

      for (const d of docs) {
        if (d.filename?.toLowerCase().includes(term)) {
          matches.push({
            id: d.id,
            label: d.filename,
            sublabel: `Document · ${d.document_type}`,
            kind: 'document',
            to: `/knowledge-base`,
          });
        }
      }

      setResults(matches.slice(0, 12));
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(value), 250);
  };

  const goTo = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    navigate(result.to);
  };

  return (
    <div ref={containerRef} className="global-search" style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder="Search knowledge, RFQs..."
          style={{
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem 1rem 0.35rem 2.25rem',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            width: '220px',
            outline: 'none',
          }}
        />
      </div>

      {open && query.trim() && (
        <div className="search-dropdown">
          {loading && <div className="search-empty">Searching…</div>}
          {!loading && results.length === 0 && <div className="search-empty">No matches found.</div>}
          {!loading &&
            results.map((r) => (
              <button key={`${r.kind}-${r.id}`} className="search-result" onClick={() => goTo(r)}>
                <span className="search-result-icon">{iconFor(r.kind)}</span>
                <span className="search-result-text">
                  <span className="search-result-label">{r.label}</span>
                  <span className="search-result-sub">{r.sublabel}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
