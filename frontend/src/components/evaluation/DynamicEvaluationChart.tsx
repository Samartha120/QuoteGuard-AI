import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EvaluationAnalytics, SeriesPoint } from '../../types/evaluation';

interface DynamicEvaluationChartProps {
  analytics: EvaluationAnalytics | null;
}

type MetricKey = 'grounding' | 'rfqs' | 'latency';

const METRICS: Record<MetricKey, { label: string; unit: string; color: string; key: keyof EvaluationAnalytics['time_series'] }> = {
  grounding: { label: 'Grounding %', unit: '%', color: 'var(--accent-green)', key: 'grounding_over_time' },
  rfqs: { label: 'RFQs / day', unit: '', color: 'var(--accent-blue)', key: 'rfqs_per_day' },
  latency: { label: 'Avg Latency (ms)', unit: 'ms', color: 'var(--accent-amber)', key: 'latency_over_time' },
};

const RANGE_DAYS: Record<string, number> = { '7D': 7, '30D': 30, '90D': 90, ALL: Infinity };

export const DynamicEvaluationChart: React.FC<DynamicEvaluationChartProps> = ({ analytics }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');
  const [metric, setMetric] = useState<MetricKey>('grounding');

  const chartData: SeriesPoint[] = useMemo(() => {
    if (!analytics) return [];
    const series = analytics.time_series[METRICS[metric].key] || [];
    const days = RANGE_DAYS[timeRange];
    return days === Infinity ? series : series.slice(-days);
  }, [analytics, metric, timeRange]);

  const active = METRICS[metric];

  return (
    <div className="card animate-fade-in" style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>Historical Evaluation Performance</h3>
          <div className="section-desc">Continuous monitoring of agent pipeline accuracy and response times</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {(Object.keys(METRICS) as MetricKey[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                style={{
                  background: metric === m ? 'var(--text-main)' : 'transparent',
                  color: metric === m ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: 'none', padding: '0.25rem 0.75rem', fontSize: '0.75rem',
                  fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                {METRICS[m].label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {['7D', '30D', '90D', 'ALL'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                style={{
                  background: timeRange === range ? 'var(--text-main)' : 'transparent',
                  color: timeRange === range ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: 'none', padding: '0.25rem 0.75rem', fontSize: '0.75rem',
                  fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={active.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={active.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border-subtle)" />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border-subtle)" width={45} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-main)' }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                formatter={(v: any) => [`${v}${active.unit}`, active.label]}
              />
              <Area type="monotone" dataKey="value" stroke={active.color} strokeWidth={2} fill="url(#metricGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-strong)' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Insufficient Historical Data</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px' }}>
            There are not enough recorded records in the selected time range ({timeRange}) to plot trend analysis.
            Process RFQs and run the Benchmark Suite to begin populating historical metrics.
          </p>
        </div>
      )}
    </div>
  );
};
