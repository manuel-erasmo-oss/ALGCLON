import apiClient from './client';

export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // ignore errors on logout
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// also export as named object for backward compat
export const authApi = { login, register, getMe, logout };
