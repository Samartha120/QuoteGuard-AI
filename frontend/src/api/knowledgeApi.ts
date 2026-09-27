import api from './client';
import { KnowledgeDocument, DocumentUploadResponse, DocumentChunk } from '../types/knowledge';

export const knowledgeApi = {
  listDocuments: async (): Promise<KnowledgeDocument[]> => {
    const res = await api.get<KnowledgeDocument[]>('/knowledge/documents');
    return res.data;
  },

  getDocumentChunks: async (id: string): Promise<DocumentChunk[]> => {
    const res = await api.get<DocumentChunk[]>(`/knowledge/documents/${id}/chunks`);
    return res.data;
  },

  uploadDocument: async (file: File, docType: string): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);
    const res = await api.post<DocumentUploadResponse>('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/knowledge/documents/${id}`);
  },
};
