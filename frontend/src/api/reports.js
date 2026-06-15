import apiClient from './client';

export const getDashboardStats = async () => {
  const response = await apiClient.get('/reports/dashboard');
  return response.data;
};

export const getIncomeStatement = async (params = {}) => {
  const response = await apiClient.get('/reports/income-statement', { params });
  return response.data;
};

export const getBalanceSheet = async (params = {}) => {
  const response = await apiClient.get('/reports/balance-sheet', { params });
  return response.data;
};

export const getReceivables = async (params = {}) => {
  const response = await apiClient.get('/reports/receivables', { params });
  return response.data;
};

export const reportsApi = { getDashboardStats, getIncomeStatement, getBalanceSheet, getReceivables };
