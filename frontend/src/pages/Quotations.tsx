import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useQuotation } from '../hooks/useQuotation';
import { quotationApi } from '../api/quotationApi';
import { Receipt, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Quotations: React.FC = () => {
  const { quotations, loading } = useQuotation();
  const navigate = useNavigate();

  return (
    <PageContainer title="Generated B2B Quotations Management">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF' }}>Quotation Register</h3>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Quote No</th>
                <th>Customer Name</th>
                <th>Subtotal</th>
                <th>Tax (18%)</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Grounding Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No quotations generated yet. Process an RFQ to create a draft.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{q.quotation_number}</td>
                    <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{q.customer_name}</td>
                    <td>₹{q.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>₹{q.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 600, color: '#FFFFFF' }}>₹{q.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${q.status === 'APPROVED' ? 'badge-grounded' : 'badge-abstained'}`}>
                        {q.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: q.overall_confidence >= 0.80 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                        {(q.overall_confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => navigate(`/quotations/${q.id}`)}>
                          Inspect
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => window.open(quotationApi.downloadPDFUrl(q.id), '_blank')}>
                          <Download size={12} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};
