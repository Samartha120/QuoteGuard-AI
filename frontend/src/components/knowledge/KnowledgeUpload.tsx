import React, { useState, useRef } from 'react';
import { Upload, Plus, FileText, CheckCircle2, AlertCircle, X, ArrowUpRight } from 'lucide-react';

interface KnowledgeUploadProps {
  onUpload: (file: File, docType: string) => Promise<any>;
  loading: boolean;
}

const DOC_TYPES = [
  { value: 'catalog', label: 'Product Catalogue & Technical Specifications', desc: 'Valve models, dimensions, pressure classes, materials' },
  { value: 'pricing', label: 'Approved Pricing Schedule (CSV / Table)', desc: 'Standard unit prices, quantity break discounts, currency' },
  { value: 'policy', label: 'Commercial & Delivery Terms Policy', desc: 'Payment terms (Net 30), shipping policies, warranty' },
  { value: 'faq', label: 'Approved Commercial FAQs', desc: 'Standard pre-approved clarifications and packaging requirements' },
];

export const KnowledgeUpload: React.FC<KnowledgeUploadProps> = ({ onUpload, loading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('catalog');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await onUpload(file, docType);
    setFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={18} style={{ color: 'var(--accent-blue)' }} />
          Ingest & Index Approved Enterprise Document
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Uploaded files are chunked into 512-token segments and embedded into ChromaDB with metadata provenance.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>Knowledge Category</label>
            <select 
              className="form-select" 
              value={docType} 
              onChange={(e) => setDocType(e.target.value)}
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}
            >
              {DOC_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              {DOC_TYPES.find(t => t.value === docType)?.desc}
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>File Selection</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed var(--accent-blue)' : '2px dashed var(--border-subtle)',
                background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-main)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                accept=".pdf,.docx,.csv,.xlsx,.txt,.md"
              />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                  <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                  <span style={{ fontWeight: 600 }}>{file.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Click to browse</span> or drag & drop (PDF, CSV, TXT, MD)
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !file}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}
          >
            <Upload size={16} /> 
            {loading ? 'Embedding & Indexing Chunks...' : 'Ingest & Index Document'}
          </button>
        </div>
      </form>
    </div>
  );
};
