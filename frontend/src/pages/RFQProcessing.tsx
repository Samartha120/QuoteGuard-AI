import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { RFQUpload } from '../components/rfq/RFQUpload';
import { RFQInput } from '../components/rfq/RFQInput';
import { RequirementTable } from '../components/rfq/RequirementTable';
import { AgentProgress } from '../components/rfq/AgentProgress';
import { EvidencePanel } from '../components/rfq/EvidencePanel';
import { ClarificationPanel } from '../components/rfq/ClarificationPanel';
import { QuotationPreview } from '../components/quotation/QuotationPreview';
import { useRFQ } from '../hooks/useRFQ';
import { useQuotation } from '../hooks/useQuotation';
import { quotationApi } from '../api/quotationApi';
import { rfqApi } from '../api/rfqApi';

export const RFQProcessing: React.FC = () => {
  const { createRFQ, processRFQ, loading } = useRFQ();
  const { approveQuotation, rejectQuotation, requestChanges } = useQuotation();

  const [currentRFQ, setCurrentRFQ] = useState<any | null>(null);
  const [activeQuotation, setActiveQuotation] = useState<any | null>(null);

  const sample1 = `REQUEST FOR QUOTATION (RFQ)\nCustomer Name: Apex Engineering Works Ltd.\n1. Industrial Valve IV-200 (SS304) - 20 units\n2. Pressure Relief Valve PV-100 (SS304) - 15 units\nTerms: Net 30 Days credit`;
  const sample2 = `REQUEST FOR QUOTATION (RFQ)\nCustomer Name: Zenith Chemical Processing Ltd.\n1. Industrial Valve IV-200 (Material Spec: SS316 Heavy Duty High-Corrosion Variant) - 50 units\nTerms: 90 Days post-installation credit terms, 3 days doorstep delivery`;

  const runPipelineFor = async (rfqId: string) => {
    const processed = await processRFQ(rfqId);
    setCurrentRFQ(processed);
    const quots = await quotationApi.getQuotationsByRFQ(processed.id);
    if (quots.length > 0) setActiveQuotation(quots[0]);
  };

  const handleProcess = async (text: string, customer: string) => {
    try {
      const created = await createRFQ({ customer_name: customer, raw_text: text });
      await runPipelineFor(created.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadFile = async (file: File, customer: string) => {
    try {
      const created = await rfqApi.uploadRFQFile(file, customer);
      await runPipelineFor(created.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageContainer title="Source-Grounded RFQ Agentic Pipeline">
      <div className="animate-fade-in animate-delay-1">
        <RFQUpload
          onLoadSample1={() => handleProcess(sample1, 'Apex Engineering Works Ltd.')}
          onLoadSample2={() => handleProcess(sample2, 'Zenith Chemical Processing Ltd.')}
          onProcess={(text, cust) => handleProcess(text, cust)}
          onUploadFile={(file, cust) => handleUploadFile(file, cust)}
          loading={loading}
        />
      </div>

      {currentRFQ && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {currentRFQ.agent_runs && (
            <AgentProgress agentRuns={currentRFQ.agent_runs} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <RFQInput rawText={currentRFQ.raw_text} customerName={currentRFQ.customer_name} />
            <RequirementTable requirements={currentRFQ.requirements || []} />
          </div>

          {activeQuotation && activeQuotation.status === 'CLARIFICATION_REQUIRED' && (
            <div className="animate-slide-up animate-delay-1">
              <ClarificationPanel 
                questions={activeQuotation.clarification_questions || []} 
                notes={activeQuotation.escalation_notes}
              />
            </div>
          )}

          {activeQuotation && (
            <div className="animate-slide-up animate-delay-2">
              <QuotationPreview 
                quotation={activeQuotation}
                onApprove={async (notes) => {
                  const updated = await approveQuotation(activeQuotation.id, notes);
                  setActiveQuotation(updated);
                }}
                onReject={async (notes) => {
                  const updated = await rejectQuotation(activeQuotation.id, notes);
                  setActiveQuotation(updated);
                }}
                onRequestChanges={async (notes) => {
                  const updated = await requestChanges(activeQuotation.id, notes);
                  setActiveQuotation(updated);
                }}
                onDownloadPDF={() => {
                  window.open(quotationApi.downloadPDFUrl(activeQuotation.id), '_blank');
                }}
              />
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
