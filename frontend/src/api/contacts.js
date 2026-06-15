import apiClient from './client';

export const contactsApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/contacts', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/contacts', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/contacts/${id}`);
    return response.data;
  },
};
