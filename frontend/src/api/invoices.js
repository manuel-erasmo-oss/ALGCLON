import apiClient from './client';

export const invoicesApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/invoices', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/invoices', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/invoices/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/invoices/${id}/status`, { status });
    return response.data;
  },

  send: async (id) => {
    const response = await apiClient.post(`/invoices/${id}/send`);
    return response.data;
  },
};
