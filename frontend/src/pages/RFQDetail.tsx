import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { RFQInput } from '../components/rfq/RFQInput';
import { RequirementTable } from '../components/rfq/RequirementTable';
import { AgentProgress } from '../components/rfq/AgentProgress';
import { ClarificationPanel } from '../components/rfq/ClarificationPanel';
import { QuotationPreview } from '../components/quotation/QuotationPreview';
import { rfqApi } from '../api/rfqApi';
import { quotationApi } from '../api/quotationApi';
import { RFQ } from '../types/rfq';
import { Quotation } from '../types/quotation';
import { ArrowLeft } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export const RFQDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  const backBtnRef = useScrollReveal<HTMLButtonElement>();
  const resultsRef = useScrollReveal<HTMLDivElement>();
  const clarificationRef = useScrollReveal<HTMLDivElement>();
  const previewRef = useScrollReveal<HTMLDivElement>();

  useEffect(() => {
    if (!id) return;
    rfqApi.getRFQById(id).then(setRfq).catch(err => console.error(err));
    quotationApi.getQuotationsByRFQ(id)
      .then(quots => { if (quots.length > 0) setQuotation(quots[0]); })
      .catch(err => console.error(err));
  }, [id]);

  if (!rfq) {
    return (
      <PageContainer title="RFQ Inspection">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading RFQ details...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`RFQ — ${rfq.customer_name}`}>
      <button ref={backBtnRef} className="btn btn-secondary reveal-up" style={{ marginBottom: '1rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div ref={resultsRef} className="reveal-scale" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {rfq.agent_runs && <AgentProgress agentRuns={rfq.agent_runs} />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <RFQInput rawText={rfq.raw_text} customerName={rfq.customer_name} />
          <RequirementTable requirements={rfq.requirements || []} />
        </div>

        {quotation && quotation.status === 'CLARIFICATION_REQUIRED' && (
          <div ref={clarificationRef} className="reveal-up">
            <ClarificationPanel
              questions={quotation.clarification_questions || []}
              notes={quotation.escalation_notes}
            />
          </div>
        )}

        {quotation && (
          <div ref={previewRef} className="reveal-up">
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
          </div>
        )}
      </div>
    </PageContainer>
  );
};
