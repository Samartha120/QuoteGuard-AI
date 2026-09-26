import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { QuotationPreview } from '../components/quotation/QuotationPreview';
import { quotationApi } from '../api/quotationApi';
import { Quotation } from '../types/quotation';
import { ArrowLeft } from 'lucide-react';

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
      <button className="btn btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => navigate('/quotations')}>
        <ArrowLeft size={16} /> Back to Quotations Register
      </button>

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
        onDownloadPDF={() => {
          window.open(quotationApi.downloadPDFUrl(quotation.id), '_blank');
        }}
      />
    </PageContainer>
  );
};
