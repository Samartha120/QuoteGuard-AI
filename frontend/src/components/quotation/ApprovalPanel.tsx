import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Download, ShieldCheck } from 'lucide-react';

interface ApprovalPanelProps {
  status: string;
  quotationId: string;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
  onDownloadPDF: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ status, quotationId, onApprove, onReject, onDownloadPDF }) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="card" style={{ background: '#090D16', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Human Sales Manager Governance Panel</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            QuoteGuard AI requires human verification before final B2B commercial issuance.
          </p>
        </div>
        <div className={`badge ${status === 'APPROVED' ? 'badge-grounded' : 'badge-abstained'}`}>
          <ShieldCheck size={14} /> Status: {status}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Optional approval notes or audit instructions..." 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {status !== 'APPROVED' && (
          <button className="btn btn-primary" onClick={() => onApprove(notes)} style={{ background: 'var(--accent-green)' }}>
            <CheckCircle2 size={16} /> Approve & Issue Quotation
          </button>
        )}
        <button className="btn btn-secondary" onClick={onDownloadPDF}>
          <Download size={16} /> Download ReportLab PDF
        </button>
        {status !== 'REJECTED' && (
          <button className="btn btn-danger" onClick={() => onReject(notes)}>
            <XCircle size={16} /> Reject Draft
          </button>
        )}
      </div>
    </div>
  );
};
