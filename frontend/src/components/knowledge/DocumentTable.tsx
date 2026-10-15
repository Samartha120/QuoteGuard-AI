import React, { useState, useMemo } from 'react';
import { KnowledgeDocument } from '../../types/knowledge';
import { Trash2, FileText, CheckCircle2, Search, Filter, Database, Layers, AlertCircle, X } from 'lucide-react';

interface DocumentTableProps {
  documents: KnowledgeDocument[];
  onDelete: (id: string) => void;
}

const CATEGORIES = ['ALL', 'CATALOG', 'PRICING', 'POLICY', 'SPECIFICATION'];

export const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = 
        selectedCategory === 'ALL' || 
        doc.document_type.toUpperCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, selectedCategory]);

  const totalChunks = useMemo(() => {
    return documents.reduce((acc, doc) => acc + (doc.chunks_count || 0), 0);
  }, [documents]);

  const handleDeleteClick = (id: string) => {
    if (pendingDeleteId === id) {
      onDelete(id);
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(id);
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Header with Stats Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} style={{ color: 'var(--accent-blue)' }} />
            Approved Knowledge Base Documents
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Vector-indexed ground-truth enterprise documents for ChromaDB semantic retrieval.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <FileText size={13} style={{ color: 'var(--accent-blue)' }} />
            <span><strong>{documents.length}</strong> Docs</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Layers size={13} style={{ color: 'var(--accent-green)' }} />
            <span><strong>{totalChunks}</strong> Total Chunks</span>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', background: 'var(--bg-surface-hover)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter indexed documents by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none', width: '100%' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={13} style={{ color: 'var(--text-muted)', marginRight: '0.2rem' }} />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: selectedCategory === cat ? 'var(--accent-blue)' : 'var(--bg-main)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Category</th>
              <th>Chunks</th>
              <th>Indexing Status</th>
              <th>Ingested Date</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {documents.length === 0 
                    ? 'No documents in knowledge base yet. Upload a catalogue or ratecard to begin.'
                    : `No documents match filter "${searchQuery || selectedCategory}".`}
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                    <span style={{ wordBreak: 'break-all' }}>{doc.filename}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', background: 'var(--bg-surface)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {doc.document_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}>
                      {doc.chunks_count} chunks
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-grounded">
                      <CheckCircle2 size={12} /> {doc.indexed_status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(doc.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {pendingDeleteId === doc.id ? (
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          className="btn"
                          style={{ padding: '0.2rem 0.5rem', background: 'var(--accent-red)', color: '#fff', fontSize: '0.72rem' }}
                          onClick={() => handleDeleteClick(doc.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', color: 'var(--accent-red)' }} 
                        onClick={() => handleDeleteClick(doc.id)}
                        title="Delete indexed document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
