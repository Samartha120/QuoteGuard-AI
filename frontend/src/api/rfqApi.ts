import api from './client';
import { RFQ, RFQCreatePayload } from '../types/rfq';

export const rfqApi = {
  listRFQs: async (): Promise<RFQ[]> => {
    const res = await api.get<RFQ[]>('/rfqs');
    return res.data;
  },

  getRFQById: async (id: string): Promise<RFQ> => {
    const res = await api.get<RFQ>(`/rfqs/${id}`);
    return res.data;
  },

  createRFQ: async (payload: RFQCreatePayload): Promise<RFQ> => {
    const res = await api.post<RFQ>('/rfqs', payload);
    return res.data;
  },

  uploadRFQFile: async (file: File, customerName: string): Promise<RFQ> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('customer_name', customerName);
    const res = await api.post<RFQ>('/rfqs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  processRFQ: async (id: string): Promise<RFQ> => {
    const res = await api.post<RFQ>(`/rfqs/${id}/process`);
    return res.data;
  },
};
