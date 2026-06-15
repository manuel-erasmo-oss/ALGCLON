import apiClient from './client';

export const getAccounts = async () => {
  const response = await apiClient.get('/banks');
  return response.data;
};

export const getAccount = async (id) => {
  const response = await apiClient.get(`/banks/${id}`);
  return response.data;
};

export const createAccount = async (data) => {
  const response = await apiClient.post('/banks', data);
  return response.data;
};

export const getTransactions = async (accountId, params = {}) => {
  const response = await apiClient.get(`/banks/${accountId}/transactions`, { params });
  return response.data;
};

export const createTransaction = async (accountId, data) => {
  const response = await apiClient.post(`/banks/${accountId}/transactions`, data);
  return response.data;
};

export const banksApi = { getAccounts, getAccount, createAccount, getTransactions, createTransaction };
