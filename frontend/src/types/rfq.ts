export interface RequirementExtracted {
  product_name: string;
  product_code?: string;
  requested_spec?: string;
  material_grade?: string;
  quantity: number;
  status: 'verified' | 'missing' | 'ambiguous' | 'conflicting';
}

export interface AgentRun {
  id: string;
  agent_name: string;
  status: 'STARTED' | 'SUCCESS' | 'WARNING' | 'FAILED';
  output_summary?: string;
  execution_time_ms: number;
  created_at: string;
}

export interface RFQ {
  id: string;
  customer_name: string;
  customer_email?: string;
  file_name?: string;
  raw_text: string;
  status: 'DRAFT' | 'PROCESSING' | 'GROUNDED' | 'CLARIFICATION_REQUIRED' | 'COMPLETED';
  created_at: string;
  requirements: RequirementExtracted[];
  agent_runs: AgentRun[];
}

export interface RFQCreatePayload {
  customer_name: string;
  raw_text: string;
  file_name?: string;
}
