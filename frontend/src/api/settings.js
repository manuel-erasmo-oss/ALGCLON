import apiClient from './client';

export const getSettings = async () => {
  const response = await apiClient.get('/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await apiClient.put('/settings', data);
  return response.data;
};

export const updateInvoiceSettings = async (data) => {
  const response = await apiClient.put('/settings/invoice', data);
  return response.data;
};

export const getTaxes = async () => {
  const response = await apiClient.get('/settings/taxes');
  return response.data;
};

export const createTax = async (data) => {
  const response = await apiClient.post('/settings/taxes', data);
  return response.data;
};

export const updateTax = async (id, data) => {
  const response = await apiClient.put(`/settings/taxes/${id}`, data);
  return response.data;
};

export const deleteTax = async (id) => {
  const response = await apiClient.delete(`/settings/taxes/${id}`);
  return response.data;
};

export const settingsApi = {
  getSettings, updateSettings, updateInvoiceSettings,
  getTaxes, createTax, updateTax, deleteTax,
};
