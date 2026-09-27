import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/dashboard/MetricCard';
import { WorkflowOverview } from '../components/dashboard/WorkflowOverview';
import { RecentRFQs } from '../components/dashboard/RecentRFQs';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { useRFQ } from '../hooks/useRFQ';
import api from '../api/client';
import { FileText, Receipt, CheckCircle, ShieldAlert, Zap, Clock } from 'lucide-react';

interface DashboardSummary {
  total_rfqs: number;
  quotations_generated: number;
  pending_approvals: number;
  clarification_cases: number;
  grounded_output_percentage: number;
  average_processing_time_sec: number;
  estimated_cost_usd: number;
}

export const Dashboard: React.FC = () => {
  const { rfqs } = useRFQ();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get<DashboardSummary>('/dashboard/summary')
      .then(res => { setSummary(res.data); setError(null); })
      .catch(() => setError('Failed to load dashboard metrics.'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number | undefined) => (v === undefined ? '—' : v);

  return (
    <PageContainer title="Platform Overview & Agent Workflow">
      {error && (
        <div className="card animate-fade-in" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderLeft: '3px solid #ef4444', color: '#ef4444', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Primary Overview / Key Information */}
      <div className="grid-metrics animate-fade-in animate-delay-1">
        <MetricCard title="RFQs Processed" value={loading ? '…' : fmt(summary?.total_rfqs)} subtext="Total Ingested" icon={FileText} />
        <MetricCard title="Quotations Generated" value={loading ? '…' : fmt(summary?.quotations_generated)} subtext="Grounded Output" icon={Receipt} />
        <MetricCard title="Pending Approvals" value={loading ? '…' : fmt(summary?.pending_approvals)} subtext="Human Governance" icon={CheckCircle} />
        <MetricCard title="Clarification Cases" value={loading ? '…' : fmt(summary?.clarification_cases)} subtext="Hallucination Shield" icon={ShieldAlert} />
        <MetricCard title="Grounded Output %" value={loading ? '…' : `${fmt(summary?.grounded_output_percentage)}%`} subtext="Grounding Score" icon={Zap} />
        <MetricCard title="Avg Latency" value={loading ? '…' : `${fmt(summary?.average_processing_time_sec)}s`} subtext="5-Agent Pipeline" icon={Clock} />
      </div>

      {/* Main Operational Content & Pipeline */}
      <div className="dashboard-content animate-fade-in animate-delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <RecentRFQs rfqs={rfqs} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <WorkflowOverview />
          <ActivityFeed rfqs={rfqs} />
        </div>
      </div>
    </PageContainer>
  );
};
