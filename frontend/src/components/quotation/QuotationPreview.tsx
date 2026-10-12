import React, { useState } from 'react';
import { Quotation } from '../../types/quotation';
import { QuoteLineItem } from './QuoteLineItem';
import { ApprovalPanel } from './ApprovalPanel';
import { FileText, Building2, Calendar, ShieldCheck, Mail, Copy, Check, Info } from 'lucide-react';

interface QuotationPreviewProps {
  quotation: Quotation;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
  onRequestChanges?: (notes: string) => void;
  onDownloadPDF: () => void;
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({ quotation, onApprove, onReject, onRequestChanges, onDownloadPDF }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (quotation.customer_email_draft) {
      navigator.clipboard.writeText(quotation.customer_email_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <ApprovalPanel
        status={quotation.status}
        quotationId={quotation.id}
        onApprove={onApprove}
        onReject={onReject}
        onRequestChanges={onRequestChanges}
        onDownloadPDF={onDownloadPDF}
      />

      <div className="card animate-fade-in" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>VERTEX INDUSTRIAL SUPPLIES PVT. LTD.</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Authorized Industrial Flow Control Valves Distributor</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{quotation.quotation_number}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Date: {new Date(quotation.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          <div><strong>Customer:</strong> {quotation.customer_name}</div>
          <div><strong>Grounding Status:</strong> <span className={`badge ${quotation.grounded_status === 'GROUNDED' ? 'badge-grounded' : 'badge-abstained'}`}>{quotation.grounded_status}</span></div>
        </div>

        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description & Citations</th>
                <th>Grade</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total Price</th>
                <th>Grounding</th>
              </tr>
            </thead>
            <tbody>
              {quotation.line_items.map((item, i) => (
                <QuoteLineItem key={i} item={item} />
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>₹{quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GST (18%):</span>
              <span>₹{quotation.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <span>Total Amount:</span>
              <span>₹{quotation.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {quotation.advisories && quotation.advisories.length > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Info size={16} /> Commercial Advisories & Conditions
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {quotation.advisories.map((adv, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  <strong>{adv.item}:</strong> {adv.detail || adv.note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {quotation.customer_email_draft && (
        <div className="card animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
              <Mail size={18} style={{ color: 'var(--accent-blue)' }} /> Customer Communication Draft (Quotation & Communication Agent)
            </div>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
              onClick={handleCopyEmail}
            >
              {copied ? (
                <>
                  <Check size={14} style={{ color: 'var(--success)' }} /> Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Email Draft
                </>
              )}
            </button>
          </div>
          <pre
            style={{
              background: 'var(--bg-main)',
              padding: '1.25rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              border: '1px solid var(--border-subtle)',
              margin: 0,
            }}
          >
            {quotation.customer_email_draft}
          </pre>
        </div>
      )}
    </div>
  );
};
