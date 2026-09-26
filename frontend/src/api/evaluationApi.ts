import api from './client';
import { EvaluationMetrics } from '../types/evaluation';

export const evaluationApi = {
  getSummary: async (): Promise<EvaluationMetrics> => {
    const res = await api.get<EvaluationMetrics>('/evaluation/summary');
    return res.data;
  },

  runBenchmark: async (): Promise<EvaluationMetrics> => {
    const res = await api.post<EvaluationMetrics>('/evaluation/run');
    return res.data;
  },
};
