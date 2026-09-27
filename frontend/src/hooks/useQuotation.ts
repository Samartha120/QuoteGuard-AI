import { useState, useEffect, useCallback } from 'react';
import { quotationApi } from '../api/quotationApi';
import { Quotation } from '../types/quotation';

export function useQuotation() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotationApi.listQuotations();
      setQuotations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quotations');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveQuotation = async (id: string, notes?: string) => {
    setLoading(true);
    try {
      const updated = await quotationApi.approveQuotation(id, notes);
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Approval failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectQuotation = async (id: string, notes?: string) => {
    setLoading(true);
    try {
      const updated = await quotationApi.rejectQuotation(id, notes);
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Rejection failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestChanges = async (id: string, notes: string) => {
    setLoading(true);
    try {
      const updated = await quotationApi.requestChanges(id, notes);
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Request changes failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return { quotations, loading, error, fetchQuotations, approveQuotation, rejectQuotation, requestChanges };
}
