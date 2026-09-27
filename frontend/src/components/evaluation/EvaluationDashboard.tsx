import React from 'react';
import { EvaluationMetrics, EvaluationAnalytics } from '../../types/evaluation';
import { MetricChart } from './MetricChart';
import { DynamicEvaluationChart } from './DynamicEvaluationChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Play, Cpu, DollarSign } from 'lucide-react';

interface EvaluationDashboardProps {
  metrics: EvaluationMetrics;
  analytics: EvaluationAnalytics | null;
  onRunBenchmark: () => void;
  loading: boolean;
}

const DIST_COLORS: Record<string, string> = {
  Grounded: 'var(--accent-green)',
  Clarification: 'var(--accent-amber)',
  Abstained: 'var(--accent-blue)',
  Unverified: 'var(--accent-red)',
};

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({ metrics, analytics, onRunBenchmark, loading }) => {
  return (
    <div className="animate-fade-in">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="section-title">Quantitative Agentic Evaluation Matrix</h2>
          <div className="section-desc">Empirical benchmark metrics evaluated over fictional enterprise test dataset.</div>
        </div>
        <button className="btn btn-primary" onClick={onRunBenchmark} disabled={loading}>
          <Play size={16} /> {loading ? 'Running Benchmark...' : 'Run Benchmark Suite'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <MetricChart label="Grounding Rate (G)" value={metrics.grounding_rate} color="var(--accent-green)" />
        <MetricChart label="Abstention Accuracy (A)" value={metrics.abstention_accuracy} color="var(--accent-blue)" />
        <MetricChart label="Hallucination Rate (H)" value={metrics.hallucination_rate} color="var(--accent-amber)" />
        <MetricChart label="Requirement Extraction Accuracy" value={metrics.requirement_extraction_accuracy} color="var(--accent-blue-hover)" />
      </div>

      <DynamicEvaluationChart analytics={analytics} />


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Cpu size={18} style={{ color: 'var(--text-secondary)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Operational Latency</h4>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>
            {(metrics.avg_latency_ms / 1000).toFixed(2)}s
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Average end-to-end 5-stage agent pipeline execution latency.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <DollarSign size={18} style={{ color: 'var(--text-secondary)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>API Token Cost Efficiency</h4>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>
            ${metrics.estimated_api_cost.toFixed(4)} / RFQ
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Estimated token inference cost per B2B customer quotation processed.
          </p>
        </div>
      </div>

      {analytics && (analytics.grounding_distribution.some(d => d.value > 0) || analytics.agent_success_rates.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Grounding Outcome Distribution</h4>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.grounding_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border-subtle)" />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border-subtle)" width={35} />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }} cursor={{ fill: 'var(--bg-surface-hover)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {analytics.grounding_distribution.map(d => (
                      <Cell key={d.label} fill={DIST_COLORS[d.label] || 'var(--accent-blue)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Agent Success Rate (%)</h4>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.agent_success_rates} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border-subtle)" />
                  <YAxis type="category" dataKey="agent" width={140} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} stroke="var(--border-subtle)" />
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }} cursor={{ fill: 'var(--bg-surface-hover)' }} formatter={(v: any) => [`${v}%`, 'Success']} />
                  <Bar dataKey="success_rate" fill="var(--accent-green)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
