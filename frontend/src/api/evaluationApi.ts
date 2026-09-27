import api from './client';
import { EvaluationMetrics, EvaluationAnalytics, AnalyticsFilters } from '../types/evaluation';

export const evaluationApi = {
  getSummary: async (): Promise<EvaluationMetrics> => {
    const res = await api.get<EvaluationMetrics>('/evaluation/summary');
    return res.data;
  },

  runBenchmark: async (): Promise<EvaluationMetrics> => {
    const res = await api.post<EvaluationMetrics>('/evaluation/run');
    return res.data;
  },

  getAnalytics: async (filters: AnalyticsFilters = {}): Promise<EvaluationAnalytics> => {
    const params: Record<string, string> = {};
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.status) params.status = filters.status;
    if (filters.customer) params.customer = filters.customer;
    if (filters.agent) params.agent = filters.agent;
    const res = await api.get<EvaluationAnalytics>('/evaluation/analytics', { params });
    return res.data;
  },

  getRuns: async (limit = 30): Promise<EvaluationMetrics[]> => {
    const res = await api.get<EvaluationMetrics[]>('/evaluation/runs', { params: { limit } });
    return res.data;
  },
};
