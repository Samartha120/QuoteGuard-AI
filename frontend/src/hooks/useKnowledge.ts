import { useState, useEffect, useCallback } from 'react';
import { knowledgeApi } from '../api/knowledgeApi';
import { KnowledgeDocument } from '../types/knowledge';

export function useKnowledge() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await knowledgeApi.listDocuments();
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch knowledge documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = async (file: File, docType: string) => {
    setLoading(true);
    try {
      const res = await knowledgeApi.uploadDocument(file, docType);
      await fetchDocuments();
      return res;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    try {
      await knowledgeApi.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, fetchDocuments, uploadDocument, deleteDocument };
}
