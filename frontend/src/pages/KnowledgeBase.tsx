import React, { useState, useMemo, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useKnowledge } from '../hooks/useKnowledge';
import { Search, Bookmark, BookmarkCheck, FileText, ChevronRight, Filter, Plus, Calendar, Hash, Trash2 } from 'lucide-react';
import { KnowledgeDocument, DocumentChunk } from '../types/knowledge';
import { KnowledgeUpload } from '../components/knowledge/KnowledgeUpload';
import { knowledgeApi } from '../api/knowledgeApi';
import { useScrollReveal, useStaggerReveal } from '../hooks/useScrollReveal';

export const KnowledgeBase: React.FC = () => {
  const { documents, loading, uploadDocument, deleteDocument } = useKnowledge();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[] | null>(null);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!selectedDoc) { setChunks(null); return; }
    setChunksLoading(true);
    knowledgeApi.getDocumentChunks(selectedDoc.id)
      .then(setChunks)
      .catch(() => setChunks([]))
      .finally(() => setChunksLoading(false));
  }, [selectedDoc]);
  
  // Feature: Saved Knowledge / Bookmarks
  const [savedDocs, setSavedDocs] = useState<string[]>(() => {
    const saved = localStorage.getItem('axion_saved_knowledge');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('axion_saved_knowledge', JSON.stringify(savedDocs));
  }, [savedDocs]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedDocs(prev => prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]);
  };

  const categories = [
    { id: 'policy', label: 'Policies' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'catalog', label: 'Catalogs' },
    { id: 'faq', label: 'FAQs' },
    { id: 'quotation', label: 'Quotations' },
    { id: 'saved', label: 'Saved Articles' },
  ];

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedCategory === 'saved') {
        return matchesSearch && savedDocs.includes(doc.id);
      }
      const matchesCategory = selectedCategory ? doc.document_type === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, selectedCategory, savedDocs]);

  const headerRef = useScrollReveal<HTMLDivElement>();
  const categoriesRef = useStaggerReveal<HTMLDivElement>(':scope > button');
  const articlesRef = useStaggerReveal<HTMLDivElement>(':scope > div.card');

  return (
    <PageContainer title="Knowledge Center">
      <div className="reveal-fade" ref={headerRef} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search procedures, policies, RFQ guidelines..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', 
                  borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', 
                  background: 'var(--bg-surface)', fontSize: '1rem', color: 'var(--text-main)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', outline: 'none'
                }} 
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>
            <Plus size={16} /> Add Knowledge
          </button>
        </div>

        {showUpload && (
          <div className="card animate-fade-in">
            <KnowledgeUpload onUpload={uploadDocument} loading={loading} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Categories Sidebar */}
          <div ref={categoriesRef} style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem', fontWeight: 600 }}>Categories</h3>
            
            <button 
              onClick={() => setSelectedCategory(null)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: 'none',
                background: selectedCategory === null ? 'var(--bg-surface-hover)' : 'transparent',
                color: selectedCategory === null ? 'var(--text-main)' : 'var(--text-secondary)',
                cursor: 'pointer', textAlign: 'left', fontWeight: selectedCategory === null ? 500 : 400,
                transition: 'all 0.2s'
              }}
            >
              All Articles
            </button>
            
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: 'none',
                  background: selectedCategory === cat.id ? 'var(--bg-surface-hover)' : 'transparent',
                  color: selectedCategory === cat.id ? 'var(--text-main)' : 'var(--text-secondary)',
                  cursor: 'pointer', textAlign: 'left', fontWeight: selectedCategory === cat.id ? 500 : 400,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {cat.id === 'saved' ? <Bookmark size={14} /> : <FileText size={14} />}
                  {cat.label}
                </div>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.label : 'All Articles'}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.75rem', fontWeight: 400 }}>{filteredDocs.length} results</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <Filter size={14} /> Sort by Relevance
              </div>
            </div>

            {loading && documents.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading knowledge base...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <Search size={20} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No articles found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Try adjusting your search terms or category filter.</p>
              </div>
            ) : (
              <div ref={articlesRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredDocs.map(doc => (
                  <div 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className="card" 
                    style={{ 
                      padding: '1.25rem', cursor: 'pointer', display: 'flex', 
                      alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--text-main)' }}>{doc.filename}</h4>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {doc.document_type}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Document indexed successfully. Contains {doc.chunks_count} knowledge chunks available for agentic retrieval.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Calendar size={12} /> {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Hash size={12} /> {doc.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button 
                        onClick={(e) => toggleBookmark(doc.id, e)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: savedDocs.includes(doc.id) ? 'var(--accent-green)' : 'var(--text-muted)' }}
                      >
                        {savedDocs.includes(doc.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                      </button>
                      <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Detail Modal Overlay */}
      {selectedDoc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'flex-end',
          backdropFilter: 'blur(2px)'
        }}>
          <div className="animate-slide-up" style={{
            width: '100%', maxWidth: '700px', height: '100%', background: 'var(--bg-main)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontWeight: 600 }}>{selectedDoc.document_type}</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{selectedDoc.filename}</h2>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={(e) => toggleBookmark(selectedDoc.id, e)}
                  className="btn btn-secondary"
                >
                  {savedDocs.includes(selectedDoc.id) ? <><BookmarkCheck size={16} /> Saved</> : <><Bookmark size={16} /> Save</>}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  onClick={async () => {
                    if (window.confirm(`Delete "${selectedDoc.filename}" and remove its vectors from the index?`)) {
                      await deleteDocument(selectedDoc.id);
                      setSelectedDoc(null);
                    }
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedDoc(null)}>Close</button>
              </div>
            </div>
            
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ background: 'var(--bg-surface)' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>Document Metadata</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>ID:</span> <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{selectedDoc.id}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Created:</span> <span style={{ color: 'var(--text-main)' }}>{new Date(selectedDoc.created_at).toLocaleString()}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Chunks:</span> <span style={{ color: 'var(--text-main)' }}>{selectedDoc.chunks_count} knowledge vectors</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Status:</span> <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: selectedDoc.indexed_status === 'indexed' ? 'var(--accent-green)' : 'var(--text-muted)' }}></span>{selectedDoc.indexed_status}</span></div>
                </div>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>
                  Indexed Chunks {chunks && `(${chunks.length})`}
                </h4>
                {chunksLoading ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading indexed content…</div>
                ) : chunks && chunks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {chunks.map(chunk => (
                      <div key={chunk.id} style={{
                        background: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)', fontSize: '0.85rem', lineHeight: '1.6',
                        color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: '"JetBrains Mono", monospace'
                      }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Chunk #{chunk.chunk_index}
                        </div>
                        {chunk.content}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)', fontSize: '0.9rem', color: 'var(--text-muted)'
                  }}>
                    No indexed chunks are stored for this document.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
