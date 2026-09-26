import React, { useState } from 'react';
import { CheckCircle2, XCircle, Download, ShieldCheck, UserCheck } from 'lucide-react';

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
    <div className="card animate-fade-in" style={{ padding: '1.5rem 2rem', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={24} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>Human Governance Panel</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              QuoteGuard AI requires human verification before final B2B commercial issuance.
            </p>
          </div>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', 
          background: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 166, 35, 0.1)',
          color: status === 'APPROVED' ? 'var(--accent-green)' : status === 'REJECTED' ? '#ef4444' : 'var(--accent-amber)',
          fontSize: '0.8rem', fontWeight: 600
        }}>
          <ShieldCheck size={14} /> Status: {status}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ fontSize: '0.85rem' }}>Audit Notes (Optional)</label>
        <input 
          type="text" 
          className="form-input" 
          style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)' }}
          placeholder="Enter any approval conditions, modifications, or internal notes..." 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
        {status !== 'APPROVED' && (
          <button 
            className="btn btn-primary" 
            onClick={() => onApprove(notes)} 
            style={{ 
              background: 'linear-gradient(to bottom, #10b981, #059669)', 
              borderColor: '#059669',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              fontWeight: 600
            }}
          >
            <CheckCircle2 size={16} /> Approve & Issue Quotation
          </button>
        )}
        {status !== 'REJECTED' && (
          <button 
            className="btn btn-secondary" 
            onClick={() => onReject(notes)}
            style={{ 
              background: 'transparent',
              color: '#ef4444',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.borderColor = '#ef4444'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
          >
            <XCircle size={16} /> Reject Draft
          </button>
        )}
        
        <div style={{ flex: 1 }} />
        
        <button 
          className="btn btn-secondary" 
          onClick={onDownloadPDF}
          style={{ background: 'var(--bg-main)' }}
        >
          <Download size={16} /> Download PDF
        </button>
      </div>
    </div>
  );
};
