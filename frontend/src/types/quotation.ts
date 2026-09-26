export interface Citation {
  field_name: string;
  source_filename: string;
  source_chunk_id: string;
  evidence_snippet: string;
  retrieval_score: number;
}

export interface QuoteLineItem {
  id?: string;
  product_code: string;
  product_name: string;
  material_grade?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  confidence_score: number;
  status: 'verified' | 'unverified' | 'abstained';
  citations: Citation[];
}

export interface Approval {
  id: string;
  action: 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES';
  approver_name: string;
  notes?: string;
  created_at: string;
}

export interface Quotation {
  id: string;
  rfq_id: string;
  quotation_number: string;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUIRED';
  overall_confidence: number;
  grounded_status: 'GROUNDED' | 'UNVERIFIED' | 'ABSTAINED';
  clarification_questions?: string[];
  escalation_notes?: string;
  created_at: string;
  line_items: QuoteLineItem[];
  approvals: Approval[];
}
