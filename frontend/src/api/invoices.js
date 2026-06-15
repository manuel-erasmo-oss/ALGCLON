import apiClient from './client';

export const getInvoices = async (params = {}) => {
  const response = await apiClient.get('/invoices', { params });
  return response.data;
};

export const getInvoice = async (id) => {
  const response = await apiClient.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data) => {
  const response = await apiClient.post('/invoices', data);
  return response.data;
};

export const updateInvoice = async (id, data) => {
  const response = await apiClient.put(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id) => {
  const response = await apiClient.delete(`/invoices/${id}`);
  return response.data;
};

export const sendInvoice = async (id) => {
  const response = await apiClient.post(`/invoices/${id}/send`);
  return response.data;
};

export const markAsPaid = async (id) => {
  const response = await apiClient.patch(`/invoices/${id}/status`, { status: 'paid' });
  return response.data;
};

export const cancelInvoice = async (id) => {
  const response = await apiClient.patch(`/invoices/${id}/status`, { status: 'cancelled' });
  return response.data;
};

export const invoicesApi = {
  getInvoices, getInvoice, createInvoice, updateInvoice,
  deleteInvoice, sendInvoice, markAsPaid, cancelInvoice,
};
