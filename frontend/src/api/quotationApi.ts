import api from './client';
import { Quotation } from '../types/quotation';

export const quotationApi = {
  listQuotations: async (): Promise<Quotation[]> => {
    const res = await api.get<Quotation[]>('/quotations');
    return res.data;
  },

  getQuotationById: async (id: string): Promise<Quotation> => {
    const res = await api.get<Quotation>(`/quotations/${id}`);
    return res.data;
  },

  getQuotationsByRFQ: async (rfqId: string): Promise<Quotation[]> => {
    const res = await api.get<Quotation[]>(`/quotations/by-rfq/${rfqId}`);
    return res.data;
  },

  approveQuotation: async (id: string, notes?: string): Promise<Quotation> => {
    const res = await api.post<Quotation>(`/quotations/${id}/approve`, { notes });
    return res.data;
  },

  rejectQuotation: async (id: string, notes?: string): Promise<Quotation> => {
    const res = await api.post<Quotation>(`/quotations/${id}/reject`, { notes });
    return res.data;
  },

  requestChanges: async (id: string, notes: string): Promise<Quotation> => {
    const res = await api.post<Quotation>(`/quotations/${id}/request-changes`, { notes });
    return res.data;
  },

  downloadPDFUrl: (id: string): string => {
    return `/api/quotations/${id}/download`;
  }
};
