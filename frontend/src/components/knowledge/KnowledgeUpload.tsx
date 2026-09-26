import React, { useState } from 'react';
import { Upload, Plus } from 'lucide-react';

interface KnowledgeUploadProps {
  onUpload: (file: File, docType: string) => Promise<any>;
  loading: boolean;
}

export const KnowledgeUpload: React.FC<KnowledgeUploadProps> = ({ onUpload, loading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('catalog');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await onUpload(file, docType);
    setFile(null);
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#FFFFFF' }}>
        Ingest Approved Company Data
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Document Type</label>
          <select className="form-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="catalog">Product Catalogue & Technical Specifications</option>
            <option value="pricing">Approved Pricing Schedule (CSV / Table)</option>
            <option value="policy">Commercial & Delivery Terms Policy</option>
            <option value="faq">Approved Commercial FAQs</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select File (PDF, DOCX, CSV, TXT, MD)</label>
          <input 
            type="file" 
            className="form-input" 
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || !file}>
          <Upload size={16} /> {loading ? 'Ingesting...' : 'Ingest & Index'}
        </button>
      </form>
    </div>
  );
};
