export interface EvaluationMetrics {
  id: string;
  run_timestamp: string;
  grounding_rate: number;
  hallucination_rate: number;
  abstention_accuracy: number;
  requirement_extraction_accuracy: number;
  retrieval_precision: number;
  avg_latency_ms: number;
  estimated_api_cost: number;
  summary_json?: Record<string, any>;
}

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface DistributionSlice {
  label: string;
  value: number;
}

export interface AgentSuccessRate {
  agent: string;
  success_rate: number;
  runs: number;
}

export interface EvaluationAnalytics {
  has_data: boolean;
  filters: {
    start_date: string | null;
    end_date: string | null;
    status: string | null;
    customer: string | null;
    agent: string | null;
  };
  headline: {
    total_rfqs: number;
    total_quotations: number;
    grounding_score_avg: number;
    retrieval_relevance: number;
    extraction_accuracy: number;
    validation_pass_rate: number;
    avg_latency_ms: number;
    quotation_success_rate: number;
    clarification_rate: number;
    hallucination_rate: number;
    abstention_accuracy: number;
    agent_success_rate: number;
  };
  time_series: {
    rfqs_per_day: SeriesPoint[];
    grounding_over_time: SeriesPoint[];
    latency_over_time: SeriesPoint[];
  };
  grounding_distribution: DistributionSlice[];
  agent_success_rates: AgentSuccessRate[];
}

export interface AnalyticsFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  customer?: string;
  agent?: string;
}

