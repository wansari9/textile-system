import apiClient from '../lib/client';

export const getCustomers = async () => {
  const { data } = await apiClient.get('/customers');
  return data;
};

export const getCustomer = async (id: number) => {
  const { data } = await apiClient.get(`/customers/${id}`);
  return data;
};

export const createCustomer = async (payload: any) => {
  const { data } = await apiClient.post('/customers', payload);
  return data;
};

export const updateCustomer = async (id: number, payload: any) => {
  const { data } = await apiClient.put(`/customers/${id}`, payload);
  return data;
};

export const deleteCustomer = async (id: number) => {
  const { data } = await apiClient.delete(`/customers/${id}`);
  return data;
};
