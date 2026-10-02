import React, { useEffect, useState, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { EvaluationDashboard } from '../components/evaluation/EvaluationDashboard';
import { evaluationApi } from '../api/evaluationApi';
import { EvaluationMetrics, EvaluationAnalytics, AnalyticsFilters } from '../types/evaluation';
import { useScrollReveal } from '../hooks/useScrollReveal';

const RFQ_STATUSES = ['', 'DRAFT', 'PROCESSING', 'GROUNDED', 'CLARIFICATION_REQUIRED', 'COMPLETED'];

export const Evaluation: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [analytics, setAnalytics] = useState<EvaluationAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  
  const filtersRef = useScrollReveal<HTMLDivElement>();

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
      {/* Filters bar */}
      <div className="card reveal-up" ref={filtersRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">From</label>
          <input type="date" className="form-input" value={filters.start_date || ''} onChange={e => updateFilter('start_date', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">To</label>
          <input type="date" className="form-input" value={filters.end_date || ''} onChange={e => updateFilter('end_date', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">RFQ Status</label>
          <select className="form-select" value={filters.status || ''} onChange={e => updateFilter('status', e.target.value)}>
            {RFQ_STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Customer</label>
          <input className="form-input" placeholder="Search customer" value={filters.customer || ''} onChange={e => updateFilter('customer', e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Agent</label>
          <input className="form-input" placeholder="Search agent" value={filters.agent || ''} onChange={e => updateFilter('agent', e.target.value)} />
        </div>
        {hasActiveFilters && (
          <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {initializing || !metrics ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading evaluation metrics...
        </div>
      ) : (
        <EvaluationDashboard
          metrics={metrics}
          analytics={analytics}
          onRunBenchmark={handleRunBenchmark}
          loading={loading}
        />
      )}
    </PageContainer>
  );
};
