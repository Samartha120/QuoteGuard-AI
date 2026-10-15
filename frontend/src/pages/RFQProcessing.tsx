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
import { PrintReveal, ScaleReveal, StaggerContainer, StaggerItem, AnimatedLine } from '../components/motion';
import { RotateCcw, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

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
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || e.message || "An error occurred");
    }
  };

  const handleUploadFile = async (file: File, customer: string) => {
    try {
      const created = await rfqApi.uploadRFQFile(file, customer);
      await runPipelineFor(created.id);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || e.message || "An error occurred");
    }
  };

  const handleResetPipeline = () => {
    setCurrentRFQ(null);
    setActiveQuotation(null);
  };

  return (
    <PageContainer title="Source-Grounded RFQ Agentic Pipeline">
      <PrintReveal delay={0.2} width="100%">
        <RFQUpload
          onLoadSample1={() => handleProcess(sample1, 'Apex Engineering Works Ltd.')}
          onLoadSample2={() => handleProcess(sample2, 'Zenith Chemical Processing Ltd.')}
          onProcess={(text, cust) => handleProcess(text, cust)}
          onUploadFile={(file, cust) => handleUploadFile(file, cust)}
          loading={loading}
        />
      </PrintReveal>

      {currentRFQ && (
        <StaggerContainer delayOrder={1} className="results-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Active Pipeline Results: {currentRFQ.customer_name}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                RFQ #{currentRFQ.id.slice(0, 8)}
              </span>
            </div>

            <button
              onClick={handleResetPipeline}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={13} /> Process Another RFQ
            </button>
          </div>

          <AnimatedLine horizontal delay={0.5} />

          {currentRFQ.agent_runs && (
            <StaggerItem>
              <AgentProgress agentRuns={currentRFQ.agent_runs} />
            </StaggerItem>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <StaggerItem>
              <RFQInput rawText={currentRFQ.raw_text} customerName={currentRFQ.customer_name} />
            </StaggerItem>
            <StaggerItem>
              <RequirementTable requirements={currentRFQ.requirements || []} />
            </StaggerItem>
          </div>

          {currentRFQ.evidence && currentRFQ.evidence.length > 0 && (
            <StaggerItem>
              <EvidencePanel evidence={currentRFQ.evidence} />
            </StaggerItem>
          )}

          {activeQuotation && activeQuotation.status === 'CLARIFICATION_REQUIRED' && (
            <ScaleReveal delay={0.2}>
              <ClarificationPanel 
                questions={activeQuotation.clarification_questions || []} 
                notes={activeQuotation.escalation_notes}
              />
            </ScaleReveal>
          )}

          {activeQuotation && (
            <ScaleReveal delay={0.3}>
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
                  quotationApi.downloadPDF(activeQuotation.id);
                }}
              />
            </ScaleReveal>
          )}
        </StaggerContainer>
      )}
    </PageContainer>
  );
};
