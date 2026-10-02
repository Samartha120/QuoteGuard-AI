import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { QuotationPreview } from '../components/quotation/QuotationPreview';
import { quotationApi } from '../api/quotationApi';
import { Quotation } from '../types/quotation';
import { ArrowLeft } from 'lucide-react';
import { PrintReveal, ScaleReveal } from '../components/motion';

export const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    if (id) {
      quotationApi.getQuotationById(id)
        .then(setQuotation)
        .catch(err => console.error(err));
    }
  }, [id]);

  if (!quotation) {
    return (
      <PageContainer title="Quotation Inspection">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading quotation details...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Quotation ${quotation.quotation_number}`}>
      <PrintReveal delay={0.1}>
        <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate('/quotations')}>
          <ArrowLeft size={16} /> Back to Quotations Register
        </button>
      </PrintReveal>

      <ScaleReveal delay={0.2} width="100%">
        <QuotationPreview 
          quotation={quotation}
          onApprove={async (notes) => {
            const updated = await quotationApi.approveQuotation(quotation.id, notes);
            setQuotation(updated);
          }}
          onReject={async (notes) => {
            const updated = await quotationApi.rejectQuotation(quotation.id, notes);
            setQuotation(updated);
          }}
          onRequestChanges={async (notes) => {
            const updated = await quotationApi.requestChanges(quotation.id, notes);
            setQuotation(updated);
          }}
          onDownloadPDF={() => {
            quotationApi.downloadPDF(quotation.id);
          }}
        />
      </ScaleReveal>
    </PageContainer>
  );
};
