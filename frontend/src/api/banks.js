import apiClient from './client';

export const banksApi = {
  getAll: async () => {
    const response = await apiClient.get('/banks');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/banks/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/banks', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/banks/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/banks/${id}`);
    return response.data;
  },

  getTransactions: async (bankId, params = {}) => {
    const response = await apiClient.get(`/banks/${bankId}/transactions`, { params });
    return response.data;
  },

  createTransaction: async (bankId, data) => {
    const response = await apiClient.post(`/banks/${bankId}/transactions`, data);
    return response.data;
  },
};
