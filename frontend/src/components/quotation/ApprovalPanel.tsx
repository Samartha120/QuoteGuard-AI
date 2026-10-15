import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Download, ShieldCheck, UserCheck, MessageSquareWarning, Tag, AlertOctagon } from 'lucide-react';

interface ApprovalPanelProps {
  status: string;
  quotationId: string;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
  onRequestChanges?: (notes: string) => void;
  onDownloadPDF: () => void;
}

const AUDIT_PRESETS = [
  'Pricing verified against Q3 approved ratecard',
  'Commercial credit terms Net 30 validated',
  'Technical specifications meet ASTM/DIN standards',
  'Freight surcharge & doorstep delivery confirmed',
  'Custom dimensional tolerances accepted',
];

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ 
  status, 
  quotationId, 
  onApprove, 
  onReject, 
  onRequestChanges, 
  onDownloadPDF 
}) => {
  const [notes, setNotes] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Handle Ctrl+Enter shortcut for quick approval
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && status !== 'APPROVED' && !showRejectConfirm) {
        e.preventDefault();
        onApprove(notes);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes, status, onApprove, showRejectConfirm]);

  const handleApplyPreset = (preset: string) => {
    setNotes(prev => (prev ? `${prev}; ${preset}` : preset));
  };

  const handleConfirmReject = () => {
    const finalNotes = rejectReason ? `${rejectReason}${notes ? ` (Details: ${notes})` : ''}` : notes;
    onReject(finalNotes || 'Rejected during human governance review');
    setShowRejectConfirm(false);
  };

  return (
    <div className="card animate-fade-in" style={{ padding: '1.5rem 2rem', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={24} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>Human Governance & Audit Panel</h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-main)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                ID: {quotationId.slice(0, 12)}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              QuoteGuard AI requires human-in-the-loop verification before final B2B commercial issuance.
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

      {/* Preset Audit Tags */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
          <Tag size={12} />
          <span>Quick Audit Justifications:</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {AUDIT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label" style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Audit Notes & Justifications</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            Ctrl + Enter to Approve
          </span>
        </label>
        <input 
          type="text" 
          className="form-input" 
          style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)' }}
          placeholder="Enter compliance notes, custom margin adjustments, or audit log rationale..." 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
        />
      </div>

      {/* Rejection Safeguard Modal / Confirmation Banner */}
      {showRejectConfirm && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.08)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          borderRadius: 'var(--radius-md)', 
          padding: '1.25rem', 
          marginBottom: '1.5rem',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <AlertOctagon size={18} /> Confirm Quotation Rejection
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: '0 0 0.75rem 0' }}>
            Are you sure you want to reject this commercial draft? Please specify the primary rejection cause for the audit trail:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {['Spec mismatch', 'Pricing out of boundary', 'Credit risk policy', 'Vendor stock unavailable'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRejectReason(r)}
                style={{
                  background: rejectReason === r ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)',
                  border: `1px solid ${rejectReason === r ? '#ef4444' : 'var(--border-subtle)'}`,
                  color: rejectReason === r ? '#ef4444' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn" 
              onClick={handleConfirmReject}
              style={{ background: '#ef4444', color: '#fff', fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
            >
              Confirm Rejection
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowRejectConfirm(false)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
            onClick={() => setShowRejectConfirm(true)}
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

        {onRequestChanges && status !== 'CLARIFICATION_REQUIRED' && status !== 'APPROVED' && (
          <button
            className="btn btn-secondary"
            onClick={() => onRequestChanges(notes || 'Clarification required')}
            style={{
              background: 'transparent',
              color: 'var(--accent-amber)',
              borderColor: 'rgba(245, 166, 35, 0.3)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(245, 166, 35, 0.05)'; e.currentTarget.style.borderColor = 'var(--accent-amber)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(245, 166, 35, 0.3)'; }}
          >
            <MessageSquareWarning size={16} /> Request Changes
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
