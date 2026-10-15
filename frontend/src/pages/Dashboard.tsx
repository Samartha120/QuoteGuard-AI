import React, { useEffect, useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { MetricCard } from '../components/dashboard/MetricCard';
import { WorkflowOverview } from '../components/dashboard/WorkflowOverview';
import { RecentRFQs } from '../components/dashboard/RecentRFQs';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { useRFQ } from '../hooks/useRFQ';
import api from '../api/client';
import { FileText, Receipt, CheckCircle, ShieldAlert, Zap, Clock } from 'lucide-react';
import { PrintReveal, StaggerContainer, AnimatedLine } from '../components/motion';

interface DashboardSummary {
  total_rfqs: number;
  quotations_generated: number;
  pending_approvals: number;
  clarification_cases: number;
  grounded_output_percentage: number;
  average_processing_time_sec: number;
  estimated_cost_usd: number;
}

import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Sparkles, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { rfqs } = useRFQ();
  const navigate = useNavigate();
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
      {/* Executive Mission Control Header */}
      {/* Mission Control Top Header */}
      <div 
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.35rem 1.65rem',
          borderRadius: '16px',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '1.5rem',
        }}
      >
        {/* Top hairline accent */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: '8%',
            right: '8%',
            height: '1.5px',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), transparent)',
          }} 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6 }}>
                <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#10b981', animation: 'radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              </span>
              Live Orchestration
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Activity size={14} style={{ color: '#818cf8' }} /> 5 Active Agents · ChromaDB Vector Synced
            </span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.025em', fontFamily: 'Outfit, Plus Jakarta Sans, sans-serif' }}>
            Autonomous RFQ Processing & Hallucination Shield
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/evaluation')}
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.95rem' }}
          >
            Benchmark Matrix
          </button>
          <button 
            className="btn btn-primary btn-shimmer" 
            onClick={() => navigate('/rfq-processing')}
            style={{ fontSize: '0.82rem', padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Sparkles size={14} /> Ingest RFQ <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {error && (
        <PrintReveal delay={0.1}>
          <div
            className="card"
            style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderLeft: '3px solid #ef4444', color: '#ef4444', fontSize: '0.85rem' }}
          >
            {error}
          </div>
        </PrintReveal>
      )}

      {/* Primary metric cards */}
      <div className="grid-metrics">
        <MetricCard index={0} title="RFQs Processed"       value={loading ? '…' : fmt(summary?.total_rfqs)}                      subtext="Total Ingested"      icon={FileText}    />
        <MetricCard index={1} title="Quotations Generated" value={loading ? '…' : fmt(summary?.quotations_generated)}             subtext="Grounded Output"     icon={Receipt}     />
        <MetricCard index={2} title="Pending Approvals"    value={loading ? '…' : fmt(summary?.pending_approvals)}                subtext="Human Governance"    icon={CheckCircle} />
        <MetricCard index={3} title="Clarification Cases"  value={loading ? '…' : fmt(summary?.clarification_cases)}              subtext="Hallucination Shield" icon={ShieldAlert} />
        <MetricCard index={4} title="Grounded Output %"    value={loading ? '…' : `${fmt(summary?.grounded_output_percentage)}%`} subtext="Grounding Score"     icon={Zap}         />
        <MetricCard index={5} title="Avg Latency"          value={loading ? '…' : `${fmt(summary?.average_processing_time_sec)}s`} subtext="5-Agent Pipeline"  icon={Clock}       />
      </div>

      {/* Main operational content */}
      <StaggerContainer delayOrder={2} className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start', marginTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <RecentRFQs rfqs={rfqs} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <WorkflowOverview />
          <ActivityFeed rfqs={rfqs} />
        </div>
      </StaggerContainer>
    </PageContainer>
  );
};
