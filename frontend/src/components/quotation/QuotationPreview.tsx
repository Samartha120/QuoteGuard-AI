import React from 'react';
import { Quotation } from '../../types/quotation';
import { QuoteLineItem } from './QuoteLineItem';
import { ApprovalPanel } from './ApprovalPanel';
import { FileText, Building2, Calendar, ShieldCheck } from 'lucide-react';

interface QuotationPreviewProps {
  quotation: Quotation;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
  onRequestChanges?: (notes: string) => void;
  onDownloadPDF: () => void;
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({ quotation, onApprove, onReject, onRequestChanges, onDownloadPDF }) => {
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
      </div>
    </div>
  );
};
