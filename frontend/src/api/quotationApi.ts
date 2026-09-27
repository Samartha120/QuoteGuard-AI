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
  },

  // Fetch the PDF through the authenticated axios client (so the Bearer token
  // is attached) and trigger a browser download. Plain window.open on the URL
  // would omit the Authorization header and 401 on the now-protected route.
  downloadPDF: async (id: string): Promise<void> => {
    const res = await api.get(`/quotations/${id}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quotation_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
