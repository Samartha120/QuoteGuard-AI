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
import { ArrowLeft, Download } from 'lucide-react';
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

  const handleExportTrace = () => {
    if (!rfq) return;
    const tracePayload = {
      rfq_id: rfq.id,
      customer_name: rfq.customer_name,
      status: rfq.status,
      exported_at: new Date().toISOString(),
      raw_text: rfq.raw_text,
      agent_runs: rfq.agent_runs || [],
      requirements: rfq.requirements || [],
      quotation: quotation ? {
        quotation_number: quotation.quotation_number,
        status: quotation.status,
        grounded_status: quotation.grounded_status,
        overall_confidence: quotation.overall_confidence,
        subtotal: quotation.subtotal,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
        line_items: quotation.line_items,
        advisories: quotation.advisories || [],
        clarification_questions: quotation.clarification_questions || [],
        customer_email_draft: quotation.customer_email_draft,
      } : null,
    };

    const blob = new Blob([JSON.stringify(tracePayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution_trace_${rfq.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button ref={backBtnRef} className="btn btn-secondary reveal-up" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button
          className="btn btn-secondary reveal-up"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
          onClick={handleExportTrace}
        >
          <Download size={16} style={{ color: 'var(--accent-blue)' }} /> Export Execution Trace (JSON)
        </button>
      </div>

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
