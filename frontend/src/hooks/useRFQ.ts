import { useState, useEffect, useCallback } from 'react';
import { rfqApi } from '../api/rfqApi';
import { RFQ, RFQCreatePayload } from '../types/rfq';

export function useRFQ() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRFQs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rfqApi.listRFQs();
      setRfqs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch RFQs');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRFQ = async (payload: RFQCreatePayload) => {
    setLoading(true);
    try {
      const created = await rfqApi.createRFQ(payload);
      setRfqs(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      setError(err.message || 'Failed to create RFQ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processRFQ = async (id: string) => {
    setLoading(true);
    try {
      const updated = await rfqApi.processRFQ(id);
      setRfqs(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to process RFQ agent workflow');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  return { rfqs, loading, error, fetchRFQs, createRFQ, processRFQ };
}
