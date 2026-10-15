import React, { useState } from 'react';
import { Quotation } from '../../types/quotation';
import { QuoteLineItem } from './QuoteLineItem';
import { ApprovalPanel } from './ApprovalPanel';
import { FileText, Building2, Calendar, ShieldCheck, Mail, Copy, Check, Info, Clock, CreditCard, Share2 } from 'lucide-react';

interface QuotationPreviewProps {
  quotation: Quotation;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
  onRequestChanges?: (notes: string) => void;
  onDownloadPDF: () => void;
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({ 
  quotation, 
  onApprove, 
  onReject, 
  onRequestChanges, 
  onDownloadPDF 
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleCopyEmail = () => {
    if (quotation.customer_email_draft) {
      navigator.clipboard.writeText(quotation.customer_email_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopySummary = () => {
    const summaryLines = [
      `QUOTATION SUMMARY: ${quotation.quotation_number}`,
      `Customer: ${quotation.customer_name}`,
      `Date: ${new Date(quotation.created_at).toLocaleDateString()}`,
      `Grounding Status: ${quotation.grounded_status}`,
      '',
      'ITEMS:',
      ...quotation.line_items.map((item, idx) => 
        `${idx + 1}. [${item.product_code}] ${item.product_name} - Qty: ${item.quantity} @ ₹${item.unit_price?.toLocaleString('en-IN') || '0'} = ₹${item.total_price?.toLocaleString('en-IN') || '0'}`
      ),
      '',
      `Subtotal: ₹${quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `Tax (18% GST): ₹${quotation.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `Grand Total: ₹${quotation.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      '',
      'Issued via QuoteGuard AI Enterprise Platform'
    ].join('\n');

    navigator.clipboard.writeText(summaryLines);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const halfTax = quotation.tax_amount / 2;

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
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Building2 size={20} style={{ color: 'var(--accent-blue)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                VERTEX INDUSTRIAL SUPPLIES PVT. LTD.
              </h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Authorized Industrial Flow Control Valves & Actuators Distributor
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              GSTIN: 27AABCV1234F1Z8 · Registered Vendor Standard Quotation
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'JetBrains Mono, monospace' }}>
              {quotation.quotation_number}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Date: {new Date(quotation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <button
              onClick={handleCopySummary}
              className="btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', cursor: 'pointer', borderRadius: '4px', color: 'var(--text-secondary)' }}
            >
              {copiedSummary ? <Check size={12} style={{ color: 'var(--accent-green)' }} /> : <Share2 size={12} />}
              <span>{copiedSummary ? 'Summary Copied' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Customer & Terms Metadata Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'var(--bg-main)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Customer Account
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {quotation.customer_name}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Grounding Verification
            </div>
            <div style={{ marginTop: '0.2rem' }}>
              <span className={`badge ${quotation.grounded_status === 'GROUNDED' ? 'badge-grounded' : 'badge-abstained'}`}>
                <ShieldCheck size={12} /> {quotation.grounded_status}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Commercial Credit Terms
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <CreditCard size={13} style={{ color: 'var(--accent-blue)' }} /> Net 30 Days (Standard)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              Quotation Validity
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <Clock size={13} style={{ color: 'var(--accent-amber)' }} /> 15 Days from Issuance
            </div>
          </div>
        </div>

        {/* Line Items Table */}
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

        {/* Financial Calculation Breakdown with CGST/SGST split */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>₹{quotation.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>CGST (9.00%):</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span>SGST (9.00%):</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>₹{halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
              <span>Grand Total:</span>
              <span style={{ color: 'var(--accent-green)', fontFamily: 'JetBrains Mono, monospace' }}>₹{quotation.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
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
                  <Check size={14} style={{ color: 'var(--accent-green)' }} /> Copied to Clipboard!
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
