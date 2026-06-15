import apiClient from './client';

export const getContacts = async (params = {}) => {
  const response = await apiClient.get('/contacts', { params });
  return response.data;
};

export const getContact = async (id) => {
  const response = await apiClient.get(`/contacts/${id}`);
  return response.data;
};

export const createContact = async (data) => {
  const response = await apiClient.post('/contacts', data);
  return response.data;
};

export const updateContact = async (id, data) => {
  const response = await apiClient.put(`/contacts/${id}`, data);
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await apiClient.delete(`/contacts/${id}`);
  return response.data;
};

export const contactsApi = { getContacts, getContact, createContact, updateContact, deleteContact };
