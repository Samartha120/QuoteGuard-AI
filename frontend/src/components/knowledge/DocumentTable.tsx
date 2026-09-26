import React from 'react';
import { KnowledgeDocument } from '../../types/knowledge';
import { Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface DocumentTableProps {
  documents: KnowledgeDocument[];
  onDelete: (id: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onDelete }) => {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#FFFFFF' }}>
        Indexed Approved Knowledge Base Files
      </h3>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Category</th>
              <th>Chunks</th>
              <th>Indexing Status</th>
              <th>Ingested Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No documents in knowledge base yet.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                    {doc.filename}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{doc.document_type}</td>
                  <td>{doc.chunks_count} chunks</td>
                  <td>
                    <span className="badge badge-grounded">
                      <CheckCircle2 size={12} /> {doc.indexed_status}
                    </span>
                  </td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--accent-red)' }} onClick={() => onDelete(doc.id)}>
                      <Trash2 size={14} />
                    </button>
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
