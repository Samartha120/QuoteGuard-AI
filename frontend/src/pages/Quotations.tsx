import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { useQuotation } from '../hooks/useQuotation';
import { quotationApi } from '../api/quotationApi';
import { Receipt, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScaleReveal, StaggerContainer, StaggerItem, AnimatedLine } from '../components/motion';

export const Quotations: React.FC = () => {
  const { quotations, loading } = useQuotation();
  const navigate = useNavigate();

  return (
    <PageContainer title="Quotations Management">
      <ScaleReveal delay={0.2} className="card" width="100%">
        <div className="section-header">
          <h3 className="section-title">Quotation Register</h3>
        </div>
        <AnimatedLine horizontal delay={0.4} />
        <div className="table-container" style={{ marginTop: '1rem' }}>
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
            <StaggerTableBody delayOrder={1} className="tbody-stagger">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No quotations generated yet. Process an RFQ to create a draft.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <StaggerTableRow key={q.id} className="table-row">
                    <td style={{ fontWeight: 500, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>{q.quotation_number}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{q.customer_name}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>₹{q.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>₹{q.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>₹{q.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => navigate(`/quotations/${q.id}`)}>
                          Inspect
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => quotationApi.downloadPDF(q.id)}>
                          <Download size={12} /> PDF
                        </button>
                      </div>
                    </td>
                  </StaggerTableRow>
                ))
              )}
            </StaggerTableBody>
          </table>
        </div>
      </ScaleReveal>
    </PageContainer>
  );
};
