import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EvaluationMetrics } from '../../types/evaluation';

interface DynamicEvaluationChartProps {
  currentMetrics: EvaluationMetrics;
}

export const DynamicEvaluationChart: React.FC<DynamicEvaluationChartProps> = ({ currentMetrics }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');

  // Currently the API only returns latest summary, no historical array is provided yet.
  const chartData: any[] = []; // In a real app, this would be populated from historical endpoint

  return (
    <div className="card animate-fade-in" style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Historical Evaluation Performance</h3>
          <div className="section-desc">Continuous monitoring of agent pipeline accuracy and response times</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {['7D', '30D', '90D', 'ALL'].map(range => (
            <button 
              key={range}
              onClick={() => setTimeRange(range as any)}
              style={{
                background: timeRange === range ? 'var(--text-main)' : 'transparent',
                color: timeRange === range ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)' }}>
        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Insufficient Historical Data</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
          There are not enough recorded evaluation benchmark runs in the selected time range ({timeRange}) to plot trend analysis. 
          Run the Benchmark Suite above to begin populating historical metrics.
        </p>
      </div>
    </div>
  );
};
