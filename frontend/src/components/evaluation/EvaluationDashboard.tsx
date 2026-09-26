import React from 'react';
import { EvaluationMetrics } from '../../types/evaluation';
import { MetricChart } from './MetricChart';
import { Play, ShieldCheck, Cpu, DollarSign } from 'lucide-react';

interface EvaluationDashboardProps {
  metrics: EvaluationMetrics;
  onRunBenchmark: () => void;
  loading: boolean;
}

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({ metrics, onRunBenchmark, loading }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>Quantitative Agentic Evaluation Matrix</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Empirical benchmark metrics evaluated over fictional enterprise test dataset.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onRunBenchmark} disabled={loading}>
          <Play size={16} /> {loading ? 'Running Benchmark...' : 'Run Benchmark Suite'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <MetricChart label="Grounding Rate (G)" value={metrics.grounding_rate} color="var(--accent-green)" />
        <MetricChart label="Abstention Accuracy (A)" value={metrics.abstention_accuracy} color="var(--accent-blue)" />
        <MetricChart label="Hallucination Rate (H)" value={metrics.hallucination_rate} color="var(--accent-amber)" />
        <MetricChart label="Requirement Extraction Accuracy" value={metrics.requirement_extraction_accuracy} color="var(--accent-purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Cpu size={18} style={{ color: 'var(--accent-blue)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Operational Latency</h4>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF' }}>
            {(metrics.avg_latency_ms / 1000).toFixed(2)}s
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Average end-to-end 5-stage agent pipeline execution latency.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <DollarSign size={18} style={{ color: 'var(--accent-green)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>API Token Cost Efficiency</h4>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFFFFF' }}>
            ${metrics.estimated_api_cost.toFixed(4)} / RFQ
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Estimated token inference cost per B2B customer quotation processed.
          </p>
        </div>
      </div>
    </div>
  );
};
