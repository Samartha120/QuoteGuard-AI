

export interface KnowledgeDocument {
  id: string;
  filename: string;
  document_type: 'catalog' | 'pricing' | 'policy' | 'faq' | 'quotation';
  chunks_count: number;
  indexed_status: 'pending' | 'indexed' | 'failed';
  file_path?: string;
  created_at: string;
}

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  document_type: string;
  chunks_created: number;
  indexed_status: string;
  message: string;
}
