import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { EvaluationDashboard } from '../components/evaluation/EvaluationDashboard';
import { evaluationApi } from '../api/evaluationApi';
import { EvaluationMetrics, EvaluationAnalytics, AnalyticsFilters } from '../types/evaluation';
import { PrintReveal, ScaleReveal } from '../components/motion';
import { Filter, Calendar, Users, Cpu, RotateCcw } from 'lucide-react';

const RFQ_STATUSES = ['', 'DRAFT', 'PROCESSING', 'GROUNDED', 'CLARIFICATION_REQUIRED', 'COMPLETED'];

export const Evaluation: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [analytics, setAnalytics] = useState<EvaluationAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const loadAnalytics = useCallback((f: AnalyticsFilters) => {
    evaluationApi.getAnalytics(f).then(setAnalytics).catch(() => setAnalytics(null));
  }, []);

  useEffect(() => {
    Promise.all([
      evaluationApi.getSummary().then(setMetrics).catch(() => {}),
      evaluationApi.getAnalytics({}).then(setAnalytics).catch(() => {}),
    ]).finally(() => setInitializing(false));
  }, []);

  const handleRunBenchmark = async () => {
    setLoading(true);
    try {
      const result = await evaluationApi.runBenchmark();
      setMetrics(result);
      loadAnalytics(filters);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof AnalyticsFilters, value: string) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    loadAnalytics(next);
  };

  const clearFilters = () => {
    setFilters({});
    loadAnalytics({});
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <PageContainer title="Quantitative AI Evaluation & Responsible AI">
      {/* Sleek Observability Filters bar */}
      <ScaleReveal 
        delay={0.1} 
        className="card" 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          alignItems: 'flex-end', 
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--card-border)',
          borderRadius: '14px',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>From</label>
          <input 
            type="date" 
            className="form-input" 
            value={filters.start_date || ''} 
            onChange={e => updateFilter('start_date', e.target.value)} 
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
          />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>To</label>
          <input 
            type="date" 
            className="form-input" 
            value={filters.end_date || ''} 
            onChange={e => updateFilter('end_date', e.target.value)} 
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
          />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>RFQ Status</label>
          <select 
            className="form-select" 
            value={filters.status || ''} 
            onChange={e => updateFilter('status', e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
          >
            {RFQ_STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer</label>
          <input 
            className="form-input" 
            placeholder="Search customer..." 
            value={filters.customer || ''} 
            onChange={e => updateFilter('customer', e.target.value)} 
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
          />
        </div>
        <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Agent</label>
          <input 
            className="form-input" 
            placeholder="Search agent..." 
            value={filters.agent || ''} 
            onChange={e => updateFilter('agent', e.target.value)} 
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
          />
        </div>
        {hasActiveFilters && (
          <button 
            className="btn btn-secondary" 
            onClick={clearFilters}
            style={{ fontSize: '0.8rem', padding: '0.55rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </ScaleReveal>

      {initializing || !metrics ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--card-border)' }}>
          Loading evaluation metrics...
        </div>
      ) : (
        <PrintReveal delay={0.2} width="100%">
          <EvaluationDashboard
            metrics={metrics}
            analytics={analytics}
            onRunBenchmark={handleRunBenchmark}
            loading={loading}
          />
        </PrintReveal>
      )}
    </PageContainer>
  );
};
