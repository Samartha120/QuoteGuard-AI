import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/dashboard/MetricCard';
import { WorkflowOverview } from '../components/dashboard/WorkflowOverview';
import { RecentRFQs } from '../components/dashboard/RecentRFQs';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { useRFQ } from '../hooks/useRFQ';
import api from '../api/client';
import { FileText, Receipt, CheckCircle, ShieldAlert, Zap, DollarSign } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { rfqs } = useRFQ();
  const [summary, setSummary] = useState({
    total_rfqs: 2,
    quotations_generated: 2,
    pending_approvals: 1,
    clarification_cases: 1,
    grounded_output_percentage: 100.0,
    average_processing_time_sec: 1.25,
    estimated_cost_usd: 0.0045,
  });

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(res => setSummary(res.data))
      .catch(() => {});
  }, []);

  return (
    <PageContainer title="Platform Overview & Agent Workflow">
      <WorkflowOverview />

      <div className="grid-metrics">
        <MetricCard title="RFQs Processed" value={summary.total_rfqs} subtext="100% Ingestion Success" icon={FileText} />
        <MetricCard title="Quotations Generated" value={summary.quotations_generated} subtext="Grounded Output" icon={Receipt} />
        <MetricCard title="Pending Approvals" value={summary.pending_approvals} subtext="Human Governance" icon={CheckCircle} />
        <MetricCard title="Abstention & Clarifications" value={summary.clarification_cases} subtext="Hallucination Shield" icon={ShieldAlert} />
        <MetricCard title="Grounded Output %" value={`${summary.grounded_output_percentage}%`} subtext="Grounding Score" icon={Zap} />
        <MetricCard title="Avg Latency" value={`${summary.average_processing_time_sec}s`} subtext="5-Agent Pipeline" icon={DollarSign} />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <RecentRFQs rfqs={rfqs} />
        <ActivityFeed />
      </div>
    </PageContainer>
  );
};
