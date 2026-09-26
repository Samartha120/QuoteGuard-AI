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
